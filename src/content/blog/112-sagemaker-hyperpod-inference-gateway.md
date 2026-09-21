---
title: "Amazon SageMaker HyperPod Inference Gateway：GPU-aware routing 的價值與邊界"
description: "拆解 Amazon SageMaker HyperPod Inference Gateway 如何用 KV cache、queue depth、LoRA 與 prefix cache 訊號做 Kubernetes-native 路由，並核對 EKS add-on、CRD、失敗行為與 AWS benchmark 的證據邊界。"
pubDate: 2026-09-21
updatedDate: 2026-09-21
tldr:
  - "HyperPod Inference Gateway 把 Body-Based Router 與 Endpoint Picker 放進 EKS add-on，讓請求依 model、GPU 負載、KV cache、LoRA adapter 與 prefix cache 被送到較適合的 serving pod。"
  - "導入面是 Kubernetes-native：安裝 add-on、套用 InferenceGatewayConfig CRD，既有 OpenAI-compatible client 不必改 SDK；但 model server、TLS、IAM、JWT 與監控前置條件仍由團隊負責。"
  - "AWS 報告在混合 GPU、突發流量與共享 prompt prefix 下改善 TTFT P95/P99；這是 AWS 在特定硬體、模型與 baseline 上的 vendor benchmark，不是普遍的 82% 保證。"
  - "Tier 1 目前解決的是單一 cluster 內的 intelligent routing；跨 cluster／region failover 屬 AWS 描述中的 Global Inference Router（Tier 2），不應當成現成的 per-cluster 能力。"
audience:
  - "負責 LLM serving、Kubernetes GPU 平台或 EKS inference 的平台工程師"
  - "需要在延遲、GPU 利用率、可用性與營運複雜度之間做決策的 AI 架構師與技術主管"
category: "Cloud & Platform"
tags: ["AWS", "Kubernetes", "Platform Engineering", "Evaluation", "Cloud Native"]
cluster: "ai-platform-governance"
clusterRole: "support"
clusterOrder: 16
kind: "article"
showToc: true
wideHeader: true
image: "/blog/112-sagemaker-hyperpod-inference-gateway/title_image.webp"
---

大型語言模型（LLM）部署到 GPU fleet 後，請求路由不再只是把連線平均分給幾個 replica。某一個 pod 可能正在處理長 context、KV cache 已接近飽和，或已經把請求所需的 LoRA adapter 留在 GPU memory；另一個看似空閒的 pod，卻可能要先載入 adapter 或重新計算 prompt prefix。只看連線數的 round-robin 與 least-connections，無法看見這些 inference state。

AWS 在 2026 年 9 月 18 日介紹 [Amazon SageMaker HyperPod Inference Gateway](https://aws.amazon.com/blogs/machine-learning/introducing-amazon-sagemaker-hyperpod-inference-gateway/)，提出的答案是把 LLM-aware routing 放進既有 HyperPod on Amazon EKS。這篇文章的重點不是「一個 addon 讓所有推論都快 82%」，而是檢查一個更實際的工程問題：當路由器終於能讀到 GPU 與 model-serving state 時，它改善了哪些 workload，又把哪些責任留給平台團隊？

> **花花的一句話**
>
> GPU-aware routing 的核心不是更複雜的 load balancer，而是讓每一個請求的去向能依據「哪個 pod 現在最適合處理它」決定，而不是只依據「哪個 pod 輪到它」。

## 先把 AWS 的 claim 分成三層

這項產品同時包含產品能力、benchmark 數字與未來 roadmap。三者若混成一個 headline，會高估目前能直接部署的範圍：

| 層次 | AWS 公開的內容 | 讀者應如何解讀 |
| --- | --- | --- |
| 目前 Tier 1 | 每個 HyperPod/EKS cluster 的 Kubernetes-native gateway、BBR、EPP 與 `InferenceGatewayConfig` | 是單一 cluster 內的路由控制面，不是自動完成多 region traffic management |
| Vendor benchmark | 4 個 8B–235B 模型、p5.48xlarge（H100）與 g5（A10G）、3 種情境，相對 round-robin 的 TTFT 與 throughput 結果 | 可用來形成壓測假設；不能直接換算成自己的模型、流量、GPU 租用成本或 SLO |
| 後續 Tier 2 | Global Inference Router（GIR）跨 cluster／region 的 failover、rate limiting 與 cost-aware traffic shaping | AWS 文章描述的 coming soon 能力，不應當成目前 Tier 1 的可用保證 |

AWS 的 [HyperPod Inference 文件](https://docs.aws.amazon.com/sagemaker/latest/dg/sagemaker-hyperpod-model-deployment-inference-gateway.html)則補充了更關鍵的部署細節：gateway 是 HyperPod Inference EKS add-on 的一部分，並非獨立安裝的另一個平台；目前文件所列的 gateway 起始版本是 `v2.0.0-eksbuild.2`。因此，AWS blog 裡的 `v2.0.0-eksbuild.1` 範例應視為文章中的版本上下文，實際安裝前要以所在 region 的文件、add-on availability 與 release notes 為準。

## 兩層架構：把「找模型」和「選 pod」分開

Tier 1 的資料路徑可以簡化成：

```text
OpenAI-compatible request
        ↓
Body-Based Router → model pool / HTTPRoute
        ↓
Endpoint Picker → model-serving pod
```

這個切分很重要。BBR 解決的是 request body 裡的 `model` 欄位如何對應到正確的 model pool；EPP 解決的是同一個 pool 裡，哪個 endpoint 最適合接下來的一個 request。把兩者混成「gateway 會自動最佳化 GPU」會看不出配置與故障到底發生在哪一層。

### Body-Based Router：先做 model-level dispatch

BBR 讀取 OpenAI-compatible request body 的 `model` 欄位，將請求送往對應 scheduler。多模型可以共用一個 gateway endpoint，應用程式不需要自己維護一份 model-to-service routing table。LoRA request 也可以先透過 adapter mapping 找到 base model，再進入正確的 pool。

這裡的責任邊界是 request contract，而不是模型品質。若 client 使用了不存在的 `modelName`、adapter mapping 不完整，或 `InferenceGatewayConfig` 的 selector 沒有選到 serving pod，BBR 不會替你修正 model metadata。應在 gateway 外層與 `status.conditions` 中監控這些配置錯誤。

### Endpoint Picker：用 serving state 算分數

EPP 從 model-serving pod 暴露的 Prometheus metrics 讀取候選 endpoint 的狀態，再以可調權重的 scorer 選出 backend。AWS blog 列出的訊號包括：

- **KV cache utilization**：避開 key-value memory 接近飽和的 pod，降低長 context 互相阻塞的機率。
- **Queue depth**：避開已有較深 backlog 的 pod。
- **LoRA adapter residency**：優先選擇已經把請求 adapter 載入 GPU memory 的 pod，減少 adapter swap。
- **Prefix cache hit rate**：共享 prefix 的對話或文件問答，優先送往可能保留 prefix 的 pod。
- **Running requests**：在仍健康的 endpoint 間平衡 active work。

這些訊號不是永遠同向。偏好 cache hit 的 pod 可能同時有較長 queue；偏好低 queue 的 pod 可能沒有 LoRA adapter。可調權重讓團隊把 scorer 變成 workload policy：互動式聊天偏向 TTFT 與 cache locality，離線批次則可能更重視吞吐與均勻利用率。這也表示 routing weight 是需要版本化、壓測與回滾的 production configuration，不是一次設定後永遠正確的 magic number。

### Kubernetes-native 的交付面

Gateway 由 HyperPod Inference add-on 交付，建立在 Gateway API、HTTPRoute、InferencePool 與 Endpoint Picker 等 Kubernetes primitives 上。配置入口是 `inference.sagemaker.aws.amazon.com/v1alpha1` 的 `InferenceGatewayConfig`；HyperPod Inference Operator 的 model resource 則是 `v1`，兩者版本不同，不能因為都屬於同一個 API group 就混用。

官方文件把 Operator 與 Gateway 的責任分開：Operator 負責 model deployment、orchestration 以及把 model 接到 gateway；Gateway 負責 BBR、HTTPRoute、InferencePool 與 EPP 的 request routing。團隊可以直接維護 `InferenceGatewayConfig`，也可以在 `InferenceEndpointConfig` 或 `JumpStartModel` 上設定 `spec.inferenceGateway.enabled: true`，讓 Operator 維護 scheduler entry。

這種設計的優點是既有 OpenAI-compatible client 可繼續使用標準 `/v1/chat/completions` endpoint，不必在應用程式內加入 AWS SDK 或 SigV4 inference signing。代價是平台團隊要多管理一個 controller／CRD 生命週期，並確保 model server 的 metrics、label selector、TLS、IAM 與 gateway 狀態都有 owner。

## 安裝不是只有一條 `aws eks create-addon`

AWS blog 用四步驟描述快速路徑：安裝 add-on、給 model pod label、套用 `InferenceGatewayConfig`、送出 OpenAI-compatible request。這個 mental model 很好，但 production checklist 不能省略下列前置條件：

1. **確認 add-on 版本與相依元件。** 目前官方 Developer Guide 列出 `v2.0.0-eksbuild.2` 作為 gateway 起始版本；使用 Application Load Balancer endpoint type 時，需要 AWS Load Balancer Controller；自動 TLS issuance 需要 cert-manager 與相應的 ACM import permissions。
2. **確認 model server metrics。** 文件列出 vLLM v0.9.2 以上與 SGLang v0.3.5.post1 以上的條件。較舊 vLLM 仍可能使用其他訊號路由，但 KV cache metric 會被忽略；較舊 SGLang 若不支援 `--enable-metrics`，container 甚至可能無法啟動。
3. **先做 request authentication。** 官方文件特別提醒，若 `spec.auth.jwt` 沒有設定，gateway endpoint 預設沒有 request-level authentication，實際只靠 VPC 與 network controls 限制存取。這和「private endpoint」不是同一件事；內網可達不等於 caller 已被授權。
4. **確認 add-on、CRD 與 controller health。** 至少要檢查 `inferencegatewayconfigs.inference.sagemaker.aws.amazon.com`、`GatewayClass`、`inference-gateway-controller` rollout 與 add-on health，再讓 production traffic 切入。

一個最小配置大致會長這樣；實際的 TLS、JWT、IAM、namespace、scheduler 與 model selector 必須依環境補齊：

```yaml
apiVersion: inference.sagemaker.aws.amazon.com/v1alpha1
kind: InferenceGatewayConfig
metadata:
  name: my-gateway
spec:
  tls: {}
  bbr:
    enabled: true
  schedulers:
    - name: llama-70b
      modelName: llama-3.1-70b
      modelSelector:
        matchLabels:
          app: vllm-llama
      targetPort: 8000
      scheduler: llm-d
```

這段 YAML 只表達 routing topology，不是完整的 production security manifest。尤其 `tls: {}` 的自動憑證路徑、JWT issuer/JWKS、ACM、IRSA 與 ALB 權限，都應該在 GitOps review 中被分開審查。

## 失敗時會怎麼退化？先看 scope，再談 self-healing

AWS blog 描述了從 pod 到 region 的逐層退化；但其中跨 cluster／region 的部分依賴尚在 roadmap 的 GIR。比較準確的讀法如下：

| 故障範圍 | Tier 1 可合理期待的行為 | 還需要自行驗證或屬後續能力的部分 |
| --- | --- | --- |
| Pod failure / stale metrics | EPP 排除沒有新鮮 metrics 的 pod，將請求送往健康候選 | metrics freshness、scrape outage 與 false healthy 的告警門檻 |
| Pool exhaustion | 以 admission failure 回傳 HTTP 429 與 `Retry-After`，由 autoscaling 或容量調整恢復 | client 是否真的遵守 retry、重試是否造成 thundering herd、KEDA scale-up 時間 |
| Gateway / controller failure | Kubernetes deployment、CRD status 與 downstream resource 可被監控與重建 | controller rollout、CRD finalizer、add-on upgrade 的回復 runbook |
| Cluster / regional failure | 不應把 Tier 1 解讀成跨 cluster 自動切流 | AWS blog 描述的 GIR、heartbeat、跨 region routing 屬後續 Tier 2，需等正式 availability 與自行做 chaos test |

文件中的 troubleshooting guide 也指出一個很容易被忽略的 lifecycle 風險：移除或升級 add-on 前，應先刪除所有 `InferenceGatewayConfig`。若 controller 消失時 CRD 還留著，finalizer 可能讓資源卡在 `Terminating`。因此「add-on 可以 rollback」不等於「所有下游 routing resource 都會無條件乾淨回復」；upgrade、uninstall 與 rollback 都要有資源清單與驗證步驟。

> **花花的工程提醒**
>
> Self-healing 只能修復系統已經知道的局部故障；它不能替你定義 429 的重試策略、驗證 JWT、清理 CRD finalizer，也不能把尚未啟用的跨 region router 當成災難復原方案。

## Benchmark 顯示的是「不均勻時才有價值」

AWS 的測試設計比 headline 更值得看。官方表示使用 4 個 8B–235B 模型，在 p5.48xlarge（H100）與 g5（A10G）上部署，流量經過 internal Application Load Balancer；client node group 與 model server node group 分離，以避免高併發時資源互相競爭。比較對象是相同 model replicas 上的 Kubernetes round-robin，gateway 使用 default routing configuration，沒有先為每種 workload 手動調權重。

結果集中在三種 gateway 理論上最有優勢的情境：混合 GPU 世代、突發流量，以及共享 prompt prefix。AWS 回報的摘要如下：

| 情境 | 模型 | AWS 報告的 TTFT P95 | TTFT P99 | Throughput |
| --- | --- | ---: | ---: | ---: |
| Mixed GPU generations | Llama 3.1 8B | –97% | –97% | +8% |
| Mixed GPU generations | Qwen3 32B | –98% | –97% | +50% |
| Bursty traffic | Llama 3.1 70B | –94% | –98% | +12% |
| Bursty traffic | Qwen3 235B | Comparable | –89% | Comparable |
| Shared prompt prefix | Llama 3.1 8B | –26% | –43% | Comparable |
| Uniform fleet, steady traffic | Qwen3 235B | Comparable | Comparable | Comparable |

「Comparable」在原文中是落在 run-to-run variance 內，不是 gateway 完全沒有成本或額外複雜度。這組結果支持一個相對克制、也更可重現的判斷：當 fleet 已經完全同質、流量平穩、cache locality 不重要時，GPU-aware routing 不一定帶來顯著收益；當硬體不均、流量 bursty 或 prefix 重複時，路由器才有足夠 state 可以利用。

這些仍是 AWS 的 vendor measurements。文章沒有提供完整 workload trace、每種 scorer 的權重與版本、GPU 成本、gateway overhead、失敗注入結果，或獨立團隊在不同 serving stack 上的重跑。因此，不應把 `–82%` 的 first-token latency headline 寫成產品普遍保證。採用前應至少用自己的模型、context 分布、LoRA 比例、流量 burst、autoscaling policy 與 client retry 行為重做 baseline。

## 導入決策：先測 routing state，再算 GPU savings

HyperPod Inference Gateway 適合的不是「所有 Kubernetes inference 都應該加一層 proxy」，而是已經遇到下列問題的團隊：

- 同一個 model pool 使用不同 GPU 世代或不同 memory profile。
- 互動式請求對 TTFT 敏感，且長 context 讓 KV cache 造成 pod 間差異。
- 多個 LoRA adapter 共用 base model，adapter loading latency 已經可觀。
- 多輪對話或文件問答有穩定的共享 prefix，值得利用 cache affinity。
- 團隊願意把 routing policy、metrics schema、429 retry、CRD lifecycle 與 gateway security 納入平台責任。

若 fleet 同質、流量小且平穩，新增 controller、Gateway API resource、TLS／JWT、Prometheus signals 與 upgrade runbook 的成本，可能大於 routing benefit。團隊也要把 gateway overhead、觀測儲存、ALB／網路費用、GPU idle capacity、autoscaling reaction time 與 incident complexity 放進同一個 TCO 模型；這和只看 token throughput 不同，正如 [LLM 推論成本的估算](/blog/94-llm-api-pricing-inference-cost/)不能只把公開吞吐量直接當成帳單。

實作上，可以先用 shadow 或小比例 traffic 建立四組對照：round-robin、gateway default、gateway tuned weights、以及 gateway 在 stale metrics／429／pod drain 下的行為。每組至少記錄 TTFT P50/P95/P99、inter-token latency、queue depth、KV cache、prefix hit、adapter load、429 rate、GPU utilization 與每次請求的重試次數。若要深入硬體與模型的協同，亦可參考 [Inferentia 與模型推論成本優化](/blog/59-aws-inferentia-tomofun-furbo/)中對 baseline、硬體條件與 vendor claim 的拆分方式。

AWS 把這項能力包成 EKS add-on，降低了從 client 到 model server 的遷移摩擦；但「不用改應用程式」不等於「不用改平台」。真正的導入成果，應該是每個 routing decision 有可解釋 metrics、每個 failure scope 有明確 fallback、每個 request endpoint 有明確身份邊界，而不是 dashboard 上多出一個看起來很快的百分比。

## 相關閱讀與來源

- [Amazon SageMaker HyperPod Inference Gateway 官方公告](https://aws.amazon.com/blogs/machine-learning/introducing-amazon-sagemaker-hyperpod-inference-gateway/)：產品架構、AWS benchmark 與 Tier 2 roadmap。
- [Inference Gateway for Amazon SageMaker HyperPod Inference](https://docs.aws.amazon.com/sagemaker/latest/dg/sagemaker-hyperpod-model-deployment-inference-gateway.html)：add-on、CRD、model server 版本、JWT 與部署前置條件。
- [Inference Gateway troubleshooting guide](https://docs.aws.amazon.com/sagemaker/latest/dg/sagemaker-hyperpod-model-deployment-ts-inference-gateway.html)：controller、EPP、資源清理與 add-on lifecycle 的故障排查。
- [在 AWS EKS 上安全落地多租戶 AI Agent](/blog/54-eks-multitenant-ai-agent-sandbox-bitoclaw/)：延伸閱讀 EKS 平台的隔離、權限與營運責任。
