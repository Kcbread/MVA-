# Requester 角色上下文

## 商業定位

Requester 是需求建立者。其責任是把實際需求用正確 scope 建立出來，包含 MFG / Non-MFG、line、stage、station 或 demand unit、item、qty、need date，以及必要的 Temporary Budget 或 Warehouse Inventory evidence。

## 可看資訊

- 自己建立或負責 scope 內的 demand lines。
- Catalog、Reuse Item、Copy Demand 的可複用來源摘要。
- Warehouse Inventory 可用庫存提示與自己建立的 stock/candidate 狀態。
- Action Required、Request Status、timeline milestone。
- Dept DRI / Cost Manager / OM / Buyer Handoff 的高階狀態與目前 pending owner。

## 可操作功能

- 建立需求與需求日期。
- 選擇需求 scope：MFG / Non-MFG、line、stage、station 或 demand unit。
- `Catalog`：新增新需求品項，qty 由需求 scope/line 建立。
- `Reuse Item`：複製單品身份與規格，qty 預設 0。
- `Copy Demand`：從已完成或可 reuse 的歷史需求組合複製 qty/package 到目前 scope。
- Temporary Budget：填預估金額與原因。
- Warehouse Inventory：
  - `Stock In`：從買過的品項下拉選擇，登錄多餘庫存。
  - `Create Candidate`：看到相同 Item/Spec 有可用庫存時，建立使用候選。
- 回覆 reject，修正並 resubmit。

## 不可看 / 不可做

- 不看 vendor、supplier、PAS material no、factory material no、OM assignee、FTV code。
- 不操作 OM quote、PAS Demand No、Export Package。
- 不 approve 自己的需求。
- 不 lock warehouse candidate；lock/reject 屬於 Dept DRI。

## 主要 UI / 模組

- Request Workspace
- Add Demand Lines modal：`Catalog / Reuse Item / Copy Demand`
- Warehouse Inventory
- Action Required
- Request Status / Workflow Status Table

## 資料輸入 / 輸出

- 輸入：item/spec、line、stage、station/unit、qty、needDate、remark、temporary budget estimate、warehouse stock/candidate。
- 輸出：submitted demand lines、warehouse inventory evidence、candidate ledger、revision events、status timeline。

## 常見風險

- 把 `Reuse Item` 誤當 qty 複製。正確：Reuse Item 只複製身份與規格，qty = 0。
- 把 Warehouse candidate 誤當正式扣成本。正確：Requester 只能建立候選，Dept DRI lock 後才影響成本。
- 顯示過多內部採購欄位會造成 requester 誤判。

## 測試 / QA 重點

- Requester 看不到 vendor / PAS material / factory material / OM assignee / FTV。
- Copy Demand 可以複製歷史需求 qty/package 到目前 scope。
- Warehouse Stock In 只能從已買過品項下拉選擇，不可自由亂填。
- Create Candidate 後狀態為 Pending Dept DRI，未 lock 前不可當正式扣成本。

## Compact Handoff

Requester owns demand creation and revision. It can create demand lines, temporary budget, warehouse stock evidence, and inventory/carryover candidates, but cannot see procurement-internal fields or approve/lock/export anything.
