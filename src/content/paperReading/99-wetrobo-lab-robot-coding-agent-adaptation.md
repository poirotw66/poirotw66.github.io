---
title: "WetRobo 精讀：Coding Agent 如何適應生物實驗室機器人"
description: "WetRobo 把可搬移的機器人套件、操作規則與可檢視程式交給 Coding Agent，讓它在兩個實驗室分別改寫控制流程。本文解讀三項窄任務、跨實驗室瓶蓋比較，以及這種結果尚不能證明什麼。"
pubDate: 2026-10-14
tldr:
  - "WetRobo 把可移植的單一機器人配置、控制程式、操作規則與每項任務的 15 段示範包成套件；Coding Agent 觀察現場、寫程式、執行並保留逐次演化的程式分支。"
  - "作者在實體設備上完成培養皿蓋、試劑瓶蓋與培養箱門三項任務；瓶蓋任務在 Lab X、Lab Y 都成功，而 Lab-X 微調的 π0.5 VLA 未能轉移到 Lab Y。"
  - "這不是多實驗室通用自主能力基準：每項任務只有一條逐次試誤的適應歷程，使用一個 Codex 模型、一種 Piper 手臂家族與少數設備；瓶蓋的 VLA 對照也不是完整成本配平。"
audience:
  - "評估 Coding Agent、機器人程式生成與實體工具使用的研究者"
  - "規劃實驗室自動化、機器人安全邊界與可重現測試的工程師"
tags: ["Paper Reading", "AI Agent", "Agent Systems", "Robotics", "Evaluation"]
topics:
  - agent-evaluation-observability
  - tool-use-coding-agents
image: "/paperReading/99-wetrobo-lab-robot-coding-agent-adaptation/title_image.webp"
field: "AI Systems"
difficulty: "advanced"
showToc: true
paper:
  title: "WetRobo: A Reproducible Robot Kit for Coding Agents in Biological Laboratories"
  authors:
    - "Yuna Oikawa"
    - "Kei Endo"
    - "Takanori Uzawa"
    - "Yunzhe Zhang"
    - "Manan Anjaria"
    - "Lerrel Pinto"
    - "Sherry Yang"
    - "Koji Tsuda"
  year: 2026
  venue: "arXiv:2609.18435 v1 (2026-09-16; preprint; peer-review status not established)"
  links:
    pdf: "https://arxiv.org/pdf/2609.18435v1"
    arxiv: "https://arxiv.org/abs/2609.18435"
    code: "https://github.com/tsudalab/WetRobo"
---

## 90 秒掌握論文

- **問題**：在地實驗室設備、相機角度、夾爪與桌面配置不一樣。若每次搬移都要重新收集遙操作資料並微調神經網路，個別研究室很難取得大規模中央實驗室才有的自動化能力。
- **核心洞見**：作者把「轉移」的單位從訓練好的動作政策改成一套可檢視的機器人 kit：基礎控制程式、硬體與相機規格、任務示範、`AGENTS.md` 操作規則。Coding Agent 讀取當地影像與狀態，產生分析和控制程式，試行後以程式分支記錄演化。
- **最強證據**：作者報告 Codex CLI（gpt-5.6-sol）在實體設備完成培養皿蓋、瓶蓋與培養箱門操作，並將瓶蓋任務列為兩間實驗室均成功。**Figure 6 只記錄 Lab Y 到首次抓取的歷程**，不能單憑該圖推算完整旋開的獨立成功率。作者的 π0.5 VLA 在 Lab X 的 25 段示範上微調 100k steps 後能在 X 成功，但未轉移到 Y（Sections III-A–C; Figure 5; Table I）。
- **主要邊界**：成功是窄任務的作者示範，不是可靠度估計。適應是逐次嘗試而非獨立重複；只測一個模型與硬體配置，門的成功只在 Lab X，Lab Y 的門任務停在接觸前。安全規則提供約束，但沒有證明無人監督執行是安全的。

本文解讀 2026 年 9 月 16 日提交的 arXiv v1 預印本，未建立同儕審查狀態。論文的問題不是「機器人能否照著同一動作跑」，而是能否把一套規格和可執行的起點帶到另一個實驗室，讓 Agent 對現場變化寫出新控制程式。作者展示三項操作及一項跨實驗室瓶蓋比較；這讓程式即政策的適應路徑值得研究，同時也把讀者帶到更實際的問題：一次成功的逐步調整，與可預期、可安全部署的自動化之間還差多少證據？

## 既有方法的限制：搬到新實驗室，哪一部分必須重新學

生物實驗室有許多重複操作，但個別研究室常已購置不同設備，缺少大型自動化平台的預算和專職維運人員。視覺語言動作模型（VLA）讓研究者可以用語言描述操作，卻會受相機視角、物體位置、外觀或機器人初始狀態影響。若訓練資料只涵蓋一個實驗室，把參數直接搬到另一間房間並不保證動作仍對準目標。

WetRobo 選擇另一條路。它不把策略封裝成只能輸入影像和吐出動作的網路，而把控制介面、示範和現場規則放進可讀的 repository。Agent 可以寫 Python/OpenCV 程式、用深度影像估位置、設計小幅探測動作、調整控制邏輯，再透過既有 RPC 介面移動手臂。差異在於變動的是可檢查、可修改的程序；不是說程式碼必然比學到的政策更安全或泛化更好。

這個問題與 [Coding Agent harness 的設計](/paper-reading/91-harness-design-coding-agents/)相連：Agent 的能力受到可用觀測、操作接口和執行回饋共同限制；也能與[研究程式環境中的工具與工作流](/paper-reading/95-scienceide-scientific-code-environments/)對讀。不過 WetRobo 多了實體動作的接觸、碰撞與設備安全，文字環境的程式任務不能替它背書。

## 核心直覺：把可搬移的起點交給現場適應

可以把 kit 想成四種彼此依賴的材料：基礎控制堆疊提供如何觀察與發出命令；`AGENTS.md` 說明裝置規則、安全限制和初始工作方式；示範提供可選的動作參考；實驗室則提供這次任務的局部觀測和真實幾何。Coding Agent 在這些條件下生成新程式，再從動作結果讀回夾爪開口、關節狀態、相機畫面或接觸訊號。

這不是單純把自然語言翻成座標。以取瓶蓋為例，Agent 必須先找出瓶蓋在哪裡，再弄清楚相機像素位移和手臂動作的關係，控制夾爪靠近、判斷是否夾到物體，然後轉動與提起。各階段使用的觀測不同；例如夾爪「已收到閉合命令」不是「已夾住瓶蓋」。程式把目標位置、每步移動量、閉合與停機條件暴露出來，也讓失敗發生時可以修改特定邏輯。

請保留兩種不同的「可重現」含義。Repository 保存程式基線和逐次試驗的 branch，讓讀者能追蹤程式怎麼變；但硬體校準、相機位置、光線和物件狀態仍屬現場。具備程式快照不等於每個實驗室都能重播同一結果，也不等於適應過程已成為標準化 benchmark。

## 用一個例子走完整個方法：瓶蓋任務的現場適應流程

以下按論文 Section III-B 將 Lab Y 的瓶蓋試驗整理成一條流程。這是實際記錄的階段摘要，不表示每個階段都能獨立抽樣或重做。

1. **讀取本地場景**：Agent 從相機畫面定位白色瓶蓋，使用 Record3D 的深度與相機內參取得公尺尺度位置。此時必須以目前相機對應目前手臂座標；跨房間沿用舊位置可能把夾爪送錯方向。
2. **小幅探測與校準**：它沿三個軸做動作探測，使用前後畫面中的角點位移求出局部影像 Jacobian，近似描述小幅手臂移動在影像上的變化。這只在附近小範圍成立，並非全域的相機到機器人模型。
3. **分段靠近**：控制程式一次移動小段並重新讀取相機。在 Lab Y，瓶身影像位移與關節扭矩訊號一起協助判斷接觸；發現瓶子移動但扭矩仍在容許界線內時，程式退回半步。
4. **失敗也留下可讀訊號**：前三次閉合沒有夾中。開口量仍像空夾爪、施力沒有超過空閉合基線，影像也顯示夾爪在瓶蓋上方或側邊。Agent 沒有把「執行 close」當成成功，而是退回並重新調整方向。
5. **改變手腕姿態，再確認抓取**：程式加入 wrist-hold 變體，只移動前三個關節。第四次閉合後，夾爪開口讀值 **0.68**（目標 **0.50**）、gripper effort **−1.05 N·m**（空閉合約 **−0.1 至 −0.2 N·m**），作者據此判斷握住瓶蓋。**N·m 是作者所報的 effort／扭矩單位，不是以 N 表示的直接夾持力；此處也不為開口讀值自行補上毫米單位。**
6. **旋轉後提起**：程式保持指尖位置，繞世界 z 軸扭轉三次，再短距離提起確認握持。**Figure 6 只呈現首次抓取的里程碑**；作者將整體瓶蓋任務列為成功，但此圖不是獨立、重複量測的「完全取下成功率」。前三次失敗、第四次握住也不是四次獨立試驗。

這條流程最重要的不是「Agent 自己寫了好多程式」，而是成功條件由可觀察的幾種訊號組成：幾何定位、運動回饋、夾爪開口、施力和提起後的保持。失敗後的退回、重定位與程式分支讓調整能被檢視。它仍依賴特定手臂、相機、設備與安全設定；若這些感測訊號本身不可靠，程式可讀性不會自動補上缺失的事實。

## 套件的機制：硬體、程式與安全約束

論文說 WetRobo 組合了 git repository、一套 Piper 手臂、實驗室設備和每項任務十五段遙操作示範。實際評估每次使用右側六自由度 AgileX Piper 手臂；Lab Y 使用原生夾爪，Lab X 則使用 NYU 字串驅動 Dynamixel 夾爪。兩個實驗室的相機數量、桌面亮度、設備方向也不同（Section II; Table I）。所以 kit 的「可搬移」不是同樣設備完全複製，而是同一套程式起點要能根據現場變化適配。

基礎堆疊可將 HDF5 示範重播並加上手臂笛卡兒偏移，也提供即時偏移、相機影像與 RPC 控制；工作分支則保存每次任務後的 evolved program。`AGENTS.md` 規則包含姿態和抓取注意事項：培養皿與培養箱操作時，接近、夾取、搬運應盡量維持水平夾爪；接觸前停下確認影像；限制工作區與每步運動幅度。作者也指出缺乏碰撞反應，所以必須保留可停止的路徑（Section II-A、II-D）。這些規則構成預防性安全層，並未取代安全認證、硬體急停驗證或人員監督。

控制並非一次生成後就固定。Agent 可以使用外部工具：培養皿任務中用 SAM 分割蓋子、RGB-D 點雲和 MuJoCo 接觸搜尋；Lab X 用預置 AprilTag 和模擬碰撞檢查；培養箱門則用 OpenCV 特徵、深度平面與 NumPy RANSAC 估方向。這代表操作介面包含「選擇如何理解現場」與「何時再動」兩層，增加的外部依賴也提高了環境建置和軟體版本管理需求。

![WetRobo 的觀察、程式生成與機器人控制閉環示意。](https://arxiv.org/html/2609.18435v1/assets/fig_agent_control_flow.png)
*Figure 3（Section III）：論文的 Agent 控制流程圖，連接影像與關節觀測、分析程式、動作程式以及 Piper 控制接口；它展示系統邊界，不代表通過了成功率評估。來源：[arXiv Figure 3](https://arxiv.org/html/2609.18435v1#S3.F3) · [原圖檔](https://arxiv.org/html/2609.18435v1/assets/fig_agent_control_flow.png)。論文授權為 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)；保留來源與作者歸屬，本文直接重用，未改圖。*

## 三項任務與一個跨實驗室對照

培養皿任務是掀起培養皿蓋，不是把培養皿拿起或搬運。Agent 起初嘗試把示範加偏移的方式對準蓋子；估偏移不順後，改採分割和影像伺服。接著從 marker plane 換成 Record3D 點雲，建立多視角場景與 MuJoCo 模型，最後用夾爪開口是否落在空夾/抓取分布之間來檢查接觸（Section III-A; Figure 4）。論文 Figure 4 是結果影像，不是對不同方法的對照實驗，因此只能說明那次任務完成。

瓶蓋任務是唯一直接比較跨實驗室遷移的任務。Lab X、Lab Y 在光線、夾爪和相機配置等方面不同。作者報告 Coding Agent 在兩地都完成瓶蓋抓取；π0.5 VLA 使用 Lab X 收集的 25 段示範微調 100k steps，Lab X 成功、Lab Y 失敗。Figure 5 同時呈現兩種方法的結果，但其 Coding Agent 成功率的分母是適應且首次成功後、在同一設定重複執行的次數；不能和 VLA 微調後的評估成功率直接視為等樣本、等成本的隨機比較。表格另報第一個抓取需時 Lab X 1 小時 2 分、Lab Y 48 分 43 秒，分別記錄 41.4M 與 23.0M tokens；這是作者 Table I 的單次適應帳目，尚無法與 VLA 的完整訓練、人工資料與維護成本配平，也不能直接推出一般情境的總持有成本。

![瓶蓋任務在兩個實驗室的適應結果與 VLA 對照。](https://arxiv.org/html/2609.18435v1/fig_cap_comparison.png)
*Figure 5（Section III-B）：上方比較 Lab X、Lab Y 設定，下方呈現適應後重複執行的 Coding Agent 與 VLA 評估結果；解讀時要保留論文說明的不同分母。來源：[arXiv Figure 5](https://arxiv.org/html/2609.18435v1#S3.F5) · [原圖檔](https://arxiv.org/html/2609.18435v1/fig_cap_comparison.png)。論文依 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) 授權；直接重用並保留作者及來源 attribution，未修改。*

培養箱門打開的結果則呈現了「對準不是抓穩」的差異。Lab Y 因頭部相機對準不可靠，在接觸前停下，未打開門；Lab X 的 Agent 逐步改寫：先以紅色標籤估影像偏差，接著用夾爪開口區分空夾和握住把手，進行 5 mm proof pull 檢查保持，再以深度點擬合門平面、估算 yaw，修正接近角度。最終以開門/關門參考影像的深度差確認門狀態；該次相對誤差從 1.417 降到 0.179。一次成功後，作者在同一環境重跑，包含 parser 修復與重啟在內 3 分 27 秒完成（Sections III-C; Figures 7–11）。這不是跨場域門任務證據。

![Lab Y 瓶蓋適應到首次抓取的階段、回饋與累計檔案和 token 數。](https://arxiv.org/html/2609.18435v1/assets/labB_timeline.png)
*Figure 6（Section III-B1）：時間軸顯示瓶蓋任務中的連續操作階段與檔案/token 累積；phase 是一組連續操作，不是每次夾爪閉合的單次獨立試驗。來源：[arXiv Figure 6](https://arxiv.org/html/2609.18435v1#S3.F6) · [原圖檔](https://arxiv.org/html/2609.18435v1/assets/labB_timeline.png)。CC BY 4.0；保留作者歸屬與來源，直接重用未修改。*

![培養箱門任務的姿態校正示例與 held-out 位移估計。](https://arxiv.org/html/2609.18435v1/fig_door_regression.png)
*Figure 9（Section III-C）：作者從示範學得腕相機特徵殘差到夾爪橫向位移的迴歸，左側顯示修正前後的標籤位置，右側比較 held-out 位移預測與真值；這是單一任務內的離線分析，不是獨立實驗室驗證。來源：[arXiv Figure 9](https://arxiv.org/html/2609.18435v1#S3.F9) · [原圖檔](https://arxiv.org/html/2609.18435v1/fig_door_regression.png)。論文授權為 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)；本文直接重用原圖，保留作者與來源 attribution。*

## 證據地圖：作者報告、可支持的解讀與空白

| 論文主張 | 直接依據 | 可支持的判讀 | 不應延伸成 |
| --- | --- | --- | --- |
| Kit 可供 Agent 在本地適應三種實體操作 | 三項實驗室任務、演化程式分支與動作紀錄（Sections III-A–C; Figures 3–11） | Codex 在指定硬體和任務下能以程式試行並完成三項操作 | 任意研究室、設備或科學流程的通用自主能力 |
| 瓶蓋程式可跨實驗室工作，而被評估的 VLA 未轉移 | Lab X、Y 的環境差異、首次適應與重複執行，對照 Lab-X π0.5（Figure 5; Table I） | 這個瓶蓋案例顯示按地點改寫程式有機會跨過特定配置差異 | Coding Agent 在平均成功率、成本、安全或更廣泛任務上全面勝過 VLA |
| 程式逐步演化且部分能力可重用 | Petri、瓶蓋和門的相鄰 branch，以及作者描述的共用 motion/camera helpers（Section IV） | 這份 repository 可供檢視某次適應如何累積 | 所有新增程式都可移植，或開發時間會隨任務固定下降 |
| 以觀測檢查抓取和終點能改善可判讀性 | 夾爪開口/施力、proof pull、門深度參考（Sections III-B、III-C） | 執行回饋不只有 Agent 自述，論文提供了可讀的感測條件 | 感測值或停止門檻已在不同設備校準，或已達安全保障 |

方法的診斷性證據比成功清單更有價值：瓶蓋試驗前三次閉合失敗，且作者按失敗把方向重定位納入程式；培養箱門在 Lab Y 的失敗則被保留，而沒有被合併進「三項皆成功」的總結。相對地，論文沒有多次獨立適應的成功率分布，沒有跨模型比較，也未對每項部件做控制變因式消融。讀 Figure 5 的重複執行數時，必須記得它不是重複啟動 Agent 從零適應，不能當成初始成功機率。

## 限制與不支持的解讀

第一，研究使用一個 Coding Agent/模型組合（Codex CLI、gpt-5.6-sol），不能推定同一 prompt 給其他模型或 Agent harness 會產生相同的程式與安全行為。第二，每項任務的嘗試是連續演化；前一步學到的程式和現場狀態會被帶入下一步，非獨立重複。因此，三項成功是展示能力而非已估計可靠度。第三，只有瓶蓋任務具備兩間實驗室的轉移比較；培養皿任務是掀蓋，培養箱門任務僅在 Lab X 成功，且 Lab Y 在碰觸前停止。

第四，場景和操作範圍窄：同一 Piper 家族、少數實驗室器材、特定相機/參考物與設備安裝方式。培養皿本體的搬運與持續保持沒有展示；作者也提到掀蓋後滑落風險。第五，VLA 比較只針對瓶蓋，在不同的資料收集、訓練和推論成本下做有限對照。Coding Agent 的 token 和時間成本有紀錄，但沒有對比 VLA 全部訓練、資料與維護成本的生命周期分析。最後，論文中的安全規則、工作區限制、每步幅度與停止條件值得視為設計材料，不能誤寫成已驗證的全套安全案例。

## Artifact 與可重現性

截至 2026 年 10 月 14 日，[WetRobo repository](https://github.com/tsudalab/WetRobo) 可公開瀏覽，包含基礎控制堆疊、`AGENTS.md`、每項任務十五段遙操作示範，以及按試驗順序保存的 evolved-program branches；README 指明套件所需手臂、相機和培養箱配置。GitHub repository metadata 沒有宣告 license，因此可以檢視公開內容，不代表程式碼、示範影片和資料可依任意條款再散布或用於商業用途。完整實體重現還需要 Piper 手臂、相容夾爪、相機、Record3D、piperlib、OpenCV 等依賴，並在現場校準安全區域。

論文依據的實驗結果是作者報告，本篇未重跑硬體實驗。GitHub 的公開 branch 與示範讓讀者能檢查程式和觀察試驗順序，但它們不提供跨實驗室獨立複現的統計，也沒有補上獨立適應試次、不同模型、所有失敗的安全風險或明確授權。先在不送出硬體命令的情況下閱讀 README、`AGENTS.md` 和 replay 資料，是理解介面的起點；任何實體測試都應以本地設備量測、急停與現場監督為前提，不能把論文的成功記錄當成可直接照跑的安全程序。

## Bloss0m 工程判斷：何時值得採用，何時先停下

**Bloss0m 工程化整理**：如果任務可拆成觀察、短程移動、接觸判斷和終點驗證，並且每一步都有可信感測訊號，程式即政策可能讓現場人員更容易檢查 Agent 為何移動、依何訊號退回，以及它如何處理一個已觀察到的失敗。這個判斷是由論文流程推演出的工程啟發，不是作者驗證的普遍規則。

在以下情況不應把程式可讀當成足夠條件：接觸後的危害不可逆、缺少位置/力量回饋、設備每次裝設差異大、任務成功難以由感測器確認、或沒有能真正切斷動作的安全停機。特別是實驗室中的液體、培養物、玻璃和門鉸鏈，各自可能有不同的污染或夾傷後果。應先把觀察與動作權限分開，限制可執行的運動範圍，要求在接觸前停下確認，且在任何模型自動化前由專業人員定義可接受的失敗代價。這是本篇的工程建議，不是 paper 的安全保證。

研究設計若要把 WetRobo 推進成可靠度評估，至少需要：多個獨立實驗室、每間多次從初始狀態適應、更多任務和失敗案例、跨 Coding Agent/模型、相同硬體下的配對比較，以及對人工工時、token、微調和設備維護成本的完整帳。所有重複試驗要保留原始動作、感測證據、版本與停機原因，否則成功標記難以被第三方審核。這些是下一步建議，並非原論文已完成的評測。

## 讀完後的三個記憶點

1. **技術想法**：WetRobo 把程式庫、操作規則、示範和硬體接口當成可搬移的適應起點，讓 Coding Agent 用可讀程式而不是每間實驗室重新微調一套 VLA 政策。
2. **證據**：實體演示涵蓋培養皿蓋、瓶蓋與培養箱門；只有瓶蓋對照支持跨 Lab X/Y 轉移，且適應是逐次試誤，並非多次獨立成功率估計。
3. **邊界**：單一模型、窄任務、固定設備族與沒有宣告授權的 repository，使結果適合當研究原型與後續評估問題，不足以作為通用或無人監督實驗室自動化的證據。

接續閱讀：[Coding Agent harness 設計](/paper-reading/91-harness-design-coding-agents/)、[科學程式環境](/paper-reading/95-scienceide-scientific-code-environments/)、[Agent 工具呼叫與工作流失敗](/paper-reading/49-tool-calls-workflows-fail/)；三者分別補上執行框架、科學工作流和工具可靠度視角。

## Primary sources

- Oikawa et al., [WetRobo: A Reproducible Robot Kit for Coding Agents in Biological Laboratories](https://arxiv.org/abs/2609.18435), arXiv:2609.18435 v1, submitted 2026-09-16. 本文採用 v1 的圖表、表格和段落定位；來源記錄列出 CC BY 4.0 授權。
- [完整 arXiv HTML v1](https://arxiv.org/html/2609.18435v1) 與 [PDF v1](https://arxiv.org/pdf/2609.18435v1)。
- 作者的 [WetRobo GitHub repository](https://github.com/tsudalab/WetRobo)，包含 README、`AGENTS.md`、基礎 stack、demo 與 branch snapshots。Repository 未宣告 license。
