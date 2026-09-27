---
title: "Turnstile Spin：讓 Agent 安裝 CAPTCHA，也把驗證留在真正的安全邊界"
description: "拆解 Cloudflare Turnstile Spin 如何在人工核准下安裝、修復或遷移 widget，並以 Siteverify、憑證隔離與可重播驗收形成後端安全閉環。"
pubDate: 2026-09-25
updatedDate: 2026-09-25
tldr:
  - "Spin 讓 coding agent 同步處理前端 widget 與既有後端 Siteverify；前端出現挑戰不代表表單已受到保護。"
  - "人工核准必須具體到保護位置、網域、action、憑證落點與實際 diff，Agent 的執行權不能替代這些檢查。"
  - "正式驗收要確認後端只在 Siteverify 成功且 action、hostname 符合預期時執行原 handler，並拒絕 token 重播。"
audience:
  - "建置表單、登入與註冊流程的全端工程師"
  - "管理 coding agent 執行權與應用安全的工程主管"
category: "Enterprise AI"
tags: ["AI Agent", "Enterprise AI", "AI 安全", "架構模式"]
cluster: "ai-agent"
clusterRole: "support"
clusterOrder: 39
kind: "article"
showToc: true
image: "/blog/121-cloudflare-turnstile-spin-agent-security/title_image.webp"
---
Cloudflare Turnstile Spin 把「幫這個表單加上 bot 防護」交給 coding agent 處理：建立或沿用 widget、找到前端與後端程式，提出修改方案，再依確認結果把兩端接起來。真正值得工程團隊注意的，不是 agent 少寫了幾行樣板，而是安全責任如何跨過人、agent、瀏覽器與伺服器仍然留在正確位置。

先記住一句話：**widget 只是取得 token 的前端；後端呼叫 Siteverify，並依驗證結果決定是否執行原本的動作，才是防線。**

> **花花的一句話**
>
> 可以讓 Agent 幫你接線，但只有伺服器驗證成功後才放行請求，才算把安全閘門接上。

## Spin 解決的是哪一段工程摩擦

[Cloudflare 在 2026 年 9 月 25 日的介紹](https://blog.cloudflare.com/turnstile-spin/) 將 Spin 描述成 agent 工作流中的 Turnstile 導引：使用者選擇要保護的位置，agent 掃描相關程式，列出計畫，等待核准，再同時完成前端與後端整合。它不把應用程式碼送回 Cloudflare，也不由 Cloudflare 遠端改寫程式碼；修改由使用者已採用的 agent 在本機 codebase 中執行。

文章列出三種情境：首次安裝時新增 widget 與後端驗證；既有 widget 已有流量、卻沒有 Siteverify 時補上缺漏；以及辨識其他 CAPTCHA 的標記並提出遷移方案。對既有 widget 的修復可能要使用原有 secret，因此「沿用哪個 widget、把 secret 寫到哪裡」會比新增一段前端標籤敏感得多。

Cloudflare 的同一篇文章稱，Dashboard 自 7 月推出後記錄超過 **65,000 次成功的 Spin widget 建立**，開發者複製生成 prompt 超過 **30,000 次**。這些是 Cloudflare 公布的**第一方採用指標**：它們可以說明使用與複製行為，不能推論整合正確率、攻擊攔截效果或安全成效，也沒有在該文中提供獨立驗證。

## 安全閉環不是「widget 有顯示」

Turnstile 的客戶端 widget 會在訪客完成挑戰後產生 token。瀏覽器把 token 隨表單送到應用程式後端，後端再以私密 secret 呼叫 Cloudflare 的 [Siteverify API](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)。伺服器要依回應決定是否進入原本的業務 handler：例如寫入聯絡表單、建立帳號或提交登入請求。

```text
訪客瀏覽器 → Turnstile widget → 表單與 token → 應用程式後端 → Siteverify → 放行或拒絕原請求
```

這個閉環有兩個不能混為一談的部分：Cloudflare 驗證 token 是否有效；應用程式再判斷這次有效驗證是否屬於正確的功能與網域。官方文件指出 token 最長有效 300 秒，而且每個 token 只能成功驗證一次；未經伺服器驗證的前端結果不能保護 endpoint。

容易漏掉的設定包括：只貼上 widget，卻讓後端照常處理請求；把 secret 放入瀏覽器程式碼；把 Siteverify 放在成功與失敗都會繼續執行 handler 的程式分支；對正式與本機環境共用過寬的 hostname allowlist；或在多個表單共用 widget 時，沒有核對 action 與真正處理請求的 endpoint。若整合有設定預期 `action` 或 `hostname`，後端也應比對驗證回應；檢查是否存在這些條件，不能只看 HTTP 回應是 200。

## 人工核准要落在可檢視的決策點

Cloudflare 的 [Turnstile Spin skill](https://github.com/cloudflare/skills/tree/main/skills/turnstile-spin) 把 agent 的工作拆成可觀察的步驟：先確認 Cloudflare 認證與帳戶範圍，再盤點 framework、既有 handler 與 CAPTCHA；接著列出插入位置及 action 對照，確認 widget 要註冊的網域，最後提出前後端整合方式。Skill 要求在不可逆操作、插入計畫和程式變更等節點等待使用者確認；舊 widget 的 secret 取回與寫入另有受限流程。

**確認的內容要足以限定副作用。** 核准一個含糊的「幫我保護表單」不能回答 agent 可以碰哪些路由、使用哪個 widget、允許哪些 hostname、預期 action 是什麼，或 secret 可以寫入哪一個 secret store。實務上至少逐項核對：

1. **執行權**：agent 是否會讀取 repository、呼叫 Cloudflare API、執行 Wrangler，或修改工作樹？命令的工具與目標帳戶必須在授權範圍內。
2. **目標與網域**：哪些表單／endpoint 受保護？哪些 production hostname 合法？`localhost` 與 `127.0.0.1` 不應被加入正式後端的允許清單。
3. **憑證落點**：sitekey 是公開識別值；secret 必須留在後端執行環境的安全儲存位置，不能進前端、對話、命令列參數或版本控制。
4. **修改確認**：查看實際 diff，確認每個選定的前端都有 token、每個對應 handler 都先驗證再執行原邏輯，沒有順手改動付款、資料庫、通知或其他無關流程。

這是三種不同的信任邊界：使用者授權 agent 讀寫哪些資源；agent 按計畫修改程式；應用程式後端對每次請求做確定性的放行判斷。人工批准修改不會讓錯誤的程式碼變安全；agent 的 CLI 成功回報也不能代替實際 endpoint 驗證。

## 驗收要測到後端，而不是停在畫面

Turnstile 官方 skill 要求新增或修復後，使用新鮮的真實 token 走過受保護的後端，確認一筆正常請求成功，再把同一 token 重送並確認遭拒。若無法啟動實際後端，就應把端到端驗證列為待辦，而不是宣稱安裝成功。依這個原則，部署前可以檢查：

- **正常路徑**：合法頁面產生 token，後端向 Siteverify 驗證；只有 `success === true`，以及設定中的預期 hostname、action 均吻合，才呼叫原 handler。
- **失敗路徑**：缺少 token、亂填 token、過期 token、Siteverify 網路錯誤、secret 不正確、hostname/action 不符，都不執行原 handler。對驗證服務不可用時應明確採 fail closed 或有審核的業務例外，不能意外退回「直接放行」。
- **重放路徑**：同一 token 第二次送出應被拒絕；對提交失敗的使用者顯示重新取得挑戰的方式，而不是無限重試舊 token。
- **環境路徑**：測試 widget/secret 只證明測試流程；正式驗收要使用 production widget、核對允許網域與 secret 綁定，再確認部署環境的 handler 真正執行 Siteverify。
- **資料路徑**：檢查 secret 不在 client bundle、HTML、公開日誌或 Git 追蹤檔案中；發佈前也確認實際執行環境收到的是正確環境的 secret。

> **花花的工程提醒**
>
> 可見的挑戰畫面是 UX 訊號，不是安全證據。安全證據是後端每次都驗 token、失敗時不執行 handler，而且同一 token 不能再用一次。

## 對採用 coding agent 的團隊有什麼啟示

Spin 將安全整合包裝成 agent 能理解的工作，降低「只接前端 widget、忘了後端驗證」的機率；但它也讓 agent 接觸帳戶認證、secret 寫入和應用程式修改等不同等級的權限。將這些權限分開核准、讓使用者看得到變更內容，並讓驗收能實際觀察後端行為，才有機會同時得到自動化速度與可稽核性。

若要延伸閱讀，可接著看 [企業 AI Agent 安全架構](/blog/43-enterprise-ai-agent-security/)，理解工具權限與人類核准的威脅邊界；[長時間 Agent Harness 設計](/blog/10-effective-harnesses-for-long-running-agents/) 對照執行、驗證與恢復；以及 [AI Agent 架構指南](/blog/64-ai-agent-guide/) 建立 agent runtime 的整體脈絡。

## 來源

- [Agents can now set up your website’s security with Turnstile Spin — Cloudflare Blog](https://blog.cloudflare.com/turnstile-spin/)
- [Turnstile Spin skill — Cloudflare Skills](https://github.com/cloudflare/skills/tree/main/skills/turnstile-spin)
- [Validate the token — Cloudflare Turnstile documentation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)
- [Get started — Cloudflare Turnstile documentation](https://developers.cloudflare.com/turnstile/get-started/)
