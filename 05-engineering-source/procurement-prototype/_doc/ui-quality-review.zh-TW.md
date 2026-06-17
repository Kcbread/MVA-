# UI 品質檢查標準

## 核心問題

每次調整 Requester / Dept DRI / Cost Manager / Budget Approver / OM UI，都必須回答四個問題：

- 眼睛看不看得到重點？
- 看了之後，使用者看不看得懂？
- 看懂後，使用者會不會採取正確行動？
- 整體設計語彙是否一致？

## 可讀性

- 英文文案可參考 Flesch-Kincaid：短句、低術語、少長段落。
- 中文與中英混合文案不硬套 FK 分數，改檢查句長、欄位命名一致、縮寫是否清楚。
- 表格 cell 不放長段落；長 spec、purpose、remark 只顯示摘要，完整內容放 Detail / tooltip / modal。
- Action button 必須使用清楚動詞，例如 `Submit`、`Approve`、`Send to User A`、`Save Quote Info`。

## WCAG 2 檢查

- 文字與背景要有足夠對比。
- 每個 input/select/textarea 都要有 label 或可理解的 aria label。
- Keyboard focus 必須可見。
- Modal 必須可 Close、Esc、backdrop 關閉，且 focus 不迷路。
- Table 要有清楚 header，尤其是 Excel-like wide matrix。
- 錯誤或 disabled 狀態必須有文字原因，不只靠顏色。

## 注意力熱力圖

- 頁面第一眼只放該角色當下最重要的工作。
- OPM 第一眼：新增 / reuse / draft / submit。
- Dept DRI / Cost Manager / Budget Approver 第一眼：`Quantity Review` Dashboard-first 總覽與 row picker；Dashboard 不需 selected row，detail matrix 才吃 selected row 或 dashboard cell drill-in scope。
- OM Purchasing 第一眼：收到日期、目前卡在哪、停留幾天、下一步做什麼。
- Contact、raw Excel source、long history、補充說明放 Detail 或 popup。

## Review Evidence 例外規則

Dept DRI、Cost Manager、Budget Approver 的 `Quantity Review` 是 Excel-like 高密度例外，不套一般卡片化 dashboard 規則。

`Dashboard` 必須接近 Excel `Dashboard` 分頁，且不綁 selected row；`MFG` 欄是全部 MFG station 加總，右側是 Non-MFG department columns：

- `ENG Name`
- `CN-ENG Name`
- `VN Name`
- `Price`
- `MFG`
- `FATP TE / FATP IQC / FATP PQE / WH / Q-LAB / REL / ENG1 / ENG2 / ENG3 / IT / FAC`
- `MFG`
- `FATP TE`
- `FATP IQC`
- `FATP PQE`
- `WH`
- `Q-LAB`
- `REL`
- `ENG1`
- `ENG2`
- `ENG3`

Carryover 在三個審批角色中只能作 secondary evidence；不可用大型 card、line impact strip 或空 ledger 佔據主視覺。
- `IT`
- `FAC`

不得回到無決策價值 summary cards，例如 `Highest Unit`、`Highest Item`、`Price Pending` summary。

## 標準回報格式

```text
UI Quality: pass/fail
Readability: pass/fail + note
WCAG Smoke: pass/skipped/fail + reason
Attention Flow: pass/fail + first-focus note
Action Clarity: pass/fail + primary action note
Consistency: pass/fail + mismatch note
```
