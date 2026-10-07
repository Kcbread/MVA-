# 使用者版更新簡報標準

## 目的

當 Kai 要求「整理修正並生成 PPT」、「做使用者版更新簡報」、「把昨天到現在的迭代整理成 PPT」時，預設使用本標準。

這類簡報的主要對象是使用者、PM、QA reviewer，而不是工程師。重點是讓讀者快速知道：

- 我們這次迭代了什麼。
- 現在使用者要去哪裡看或操作。
- 角色責任是否更清楚。
- 哪些畫面已經可實際操作。
- 還有哪些待修正風險。

## 必須遵守

1. 先面向使用者，不先面向工程師。
   - 主頁不塞 API、DB、test command、migration 名稱。
   - 技術證據可以放在 receipt 或最後備註頁。

2. 語言與受眾必須跟使用者指令一致。
   - 如果 Kai 指定英文，整份 PPT 主敘事、標題、圖表標籤都用英文。
   - 如果 Kai 指定受眾，例如 `OM Purchasing and OM Leader`，封面與內容必須明確鎖定該受眾。
   - 不要把不相關角色放成主敘事，除非是為了說明交接邊界。

3. 每個主要修正主題至少要有一張實際操作畫面。
   - 截圖要來自目前 local QA 或實際可操作畫面。
   - 截圖前要確認是最新版畫面；必要時啟動 fresh Node server、使用新 port 或 cache-bust query，避免抓到舊 server/cache。
   - 必須標示 `real execution`、`mock`、`fixture`、`dry-run` 或 `copied archive`。
   - 不可把舊截圖說成現況。

4. 權責或流程變更必須用示意圖說明。
   - 例如：角色責任圖、入口分類圖、Before / After、流程箭頭。
   - 不用長段文字解釋層級。

5. 每頁只講一個重點。
   - 適合使用者讀的頁面通常是 6-10 頁。
   - 每頁文字以 3-5 個短點為上限。
   - 圖片和示意圖應該比文字更重要。

6. 使用商業流程用詞。
   - 優先使用：`Demand Progress Tracking`、`OM Progress Review`、`Project Stage Calendar`、`OM Handoff`、`Buyer Handoff`。
   - 避免把 `Console`、`Setup`、`Export Package` 當成主要使用者流程詞。
   - API endpoint 名稱可以保留在證據頁，不放在主敘事。
   - 若 OM Purchasing scope 已收斂 Buyer follow-up，必須明確說明：Buyer Handoff tracking / PR / PO / arrival follow-up 在第一版 prototype 中集中於 OM Purchasing 的 OM Handoff tracking；Buyer Handoff 保留為狀態與未來整合邊界。

7. 必須放在 artifact version folder。
   - 路徑：`07-review-and-artifacts/Vn/`
   - 附 `VERSION_RECEIPT.md`
   - PPTX 要用 `unzip -t` 驗證。
   - 若包含截圖，保留選用截圖在 `screenshots/`。

## 建議投影片架構

1. 封面
   - 這次我們迭代了什麼。
   - 日期與版本。

2. 一頁看懂這次更新
   - 3 個主要變化。
   - 避免流水帳。

3. 新的使用者入口 / 權責示意圖
   - 用流程圖或三欄圖說明分類。

4. 實際畫面 1
   - 例如 OM Leader 入口。
   - 右側用 2-3 個短點說明使用者要看什麼。

5. 實際畫面 2
   - 例如 OM Progress Review。

6. 實際畫面 3
   - 例如 Project Stage Calendar。

7. 實際畫面 4
   - 例如 OM Purchasing 操作面。

8. 使用者如何驗收 / 下一步
   - 每個角色要確認什麼。
   - 已知風險。

9. 可選：證據頁
   - 只放關鍵來源，不把主簡報變成工程報告。

## 收斂規則

- 如果簡報內容開始變成工程 changelog，重寫成「使用者感受到什麼變化」。
- 如果一頁沒有截圖、示意圖或清楚的使用者價值，刪減或合併。
- 如果讀者需要懂 API 才看得懂，代表簡報層級錯了。
- 如果是 demo / UAT 簡報，要優先回答「我該點哪裡、我該檢查什麼」。

## 驗證 Checklist

- [ ] PPTX 位於 `07-review-and-artifacts/Vn/`。
- [ ] `VERSION_RECEIPT.md` 已建立。
- [ ] `unzip -t` 通過。
- [ ] 讀出 slide count 與關鍵文字。
- [ ] 至少包含 2 張實際操作畫面；若沒有，receipt 必須說明原因。
- [ ] 截圖來自最新版畫面；receipt 必須註明來源 URL / port 或為何沿用舊圖。
- [ ] 至少包含 1 張流程/權責示意圖。
- [ ] 語言與受眾符合 Kai 最新指令。
- [ ] 主敘事面向使用者，不是工程師。
- [ ] 已清楚標示 known risk / next action。

## 觸發語

以下說法都應套用本標準：

- 「整理成新的 PPT」
- 「做使用者版更新簡報」
- 「昨天到現在修了什麼，給使用者看」
- 「不要太多技術細節」
- 「要包含實際操作畫面」
- 「要有示意圖」
