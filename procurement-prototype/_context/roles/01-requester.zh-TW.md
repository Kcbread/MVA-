# Requester 角色上下文

## 商業定位

Requester 是需求建立者。其責任是把實際需求用正確 scope 建立出來，包含 MFG / Non-MFG、line、station 或 department、item/spec、各 phase qty、MFG/Non-MFG 各自的 need date，以及必要的 Temporary Budget 或 Warehouse Inventory candidate。

## 可看資訊

- 自己建立或負責 scope 內的 demand lines。
- Catalog、Reuse Item、Copy Demand 的可複用來源摘要。
- Warehouse Inventory 可用庫存提示與自己建立的 candidate 狀態。
- Read-only item owner badge：OM-owned / MFG-owned / Unit-owned，由 item master / 系統規則判斷。
- Action Required、Request Status、timeline milestone。
- Dept DRI / Cost Manager / OM / Buyer Handoff 的高階狀態與目前 pending owner。

## 可操作功能

- 建立需求、儲存草稿、依目前 line + MFG/Non-MFG worksheet 送出需求日期。
- Request Workspace 是整頁 All-Phase Excel worksheet input，不使用 Add Demand modal 或左側 Source Panel 作為主要入口。
- 上方 scope 選 project / line；Need Date 跟著目前 MFG 或 Non-MFG worksheet 分開管理，一次編輯一條 line。
- `MFG / Non-MFG` 分成兩個 worksheet tab；一列 = `Item / Spec`。
- Worksheet 表頭為 two-row phase group：`P1.0 / P1.1 / EVT / DVT / PVT / MP`，每個 phase 下展開 station/department qty。
- MFG phase group 欄位：`CG / BG / FATP / Test / Hybrid / Auto / ENG Pack / Zombie / Laser_pico / Rework / Repair / WH`。
- Non-MFG phase group 欄位：`FATP TE / FATP IQC / FATP PQE / WH / Q-LAB / REL / ENG1 / ENG2 / ENG3 / IT / FAC`。
- 新增品項的主要入口是 worksheet 左上角 `Add Item` popup；popup 第一欄為 `Add`，以 `Item / Detail / Spec / Action` 分欄呈現，並提供 `Lv1 / Lv2 / Lv3` cascading filters；來源包含 `Catalog / Reuse / Copy Demand / New Item Request`，來源 badge 放在 item identity 內。
- `Catalog` / `Reuse Item`：新增 item/spec row，所有 phase qty 預設 0。
- `Copy Demand`：複製 item/spec/source trace，所有 target phase qty 全部從 0 開始；source qty 只能作為 reference。
- `New Item Request`：不是直接新增 active 物料主檔。Requester 先完成物料主檔新增申請草稿（英中越名稱、Lv123、spec summary、structured spec、UOM、用途、預估價格/原因；若有相似物料需填差異與 evidence/reference），完成後才能以 `Pending Material Review` row 進 worksheet 填 qty；Dept DRI 先審需求合理性，OM/master reviewer approve / merge / reject 後才進 active item master。
- Carryover / Warehouse suggestion：主表只顯示 row hint badge，細節與 candidate 建立放在 row detail/drawer。
- `Save Draft`：只暫存目前主表 qty，不要求 Need Date，不送 Dept DRI。
- `Submit`：送出目前 line + 目前 MFG/Non-MFG worksheet 下所有有 qty 的 draft rows，不使用 row checkbox；送出前必須填該 worksheet scope 的 Need Date，其他 line 或另一個 worksheet mode 會保留 draft 並顯示排除原因。
- Temporary Budget：填預估金額與原因。
- Warehouse Inventory：
  - `Create Candidate`：看到相同 Item/Spec 有可用庫存時，建立使用候選。
  - OM-owned candidate 進 OM warehouse owner queue；MFG-owned 進 MFG warehouse owner queue；Unit-owned 進 Unit warehouse owner queue。
- 回覆 reject，修正並 resubmit。

## 不可看 / 不可做

- 不看 vendor、supplier、PAS material no、factory material no、OM assignee、FTV code。
- 不指定 brand/vendor、價格、PAS material、factory material、FTV 或 owner。
- 不操作 OM quote、PAS Demand No、Export Package。
- 不 approve 自己的需求。
- 不維護 warehouse 實際庫存數量；OM / MFG / Unit warehouse 由各 owner 自己維護與輸入。
- 不 lock warehouse candidate；lock/reject 屬於對應 item/warehouse owner。

## 主要 UI / 模組

- Request Workspace
- Request Workspace worksheet：`MFG / Non-MFG` tabs + `Add Item` popup + all-phase station/department qty columns
- Warehouse Inventory
- Action Required
- Request Status / Workflow Status Table

## 資料輸入 / 輸出

- 輸入：item/spec、line、station/department、phase qty、mode-scoped needDate、temporary budget estimate、warehouse candidate。
- 輸出：submitted demand lines、warehouse inventory evidence、candidate ledger、revision events、status timeline。

## 常見風險

- 把 `Reuse Item` 誤當 qty 複製。正確：Reuse Item 只複製身份與規格，qty = 0。
- 把 `P26 Line 1 -> P26 Line 2` 誤認為沿用數量。正確：只帶 item/spec/source trace，target line qty 必須重新輸入；UI 要明確顯示 target 與 source。
- 把 Warehouse candidate 誤當正式扣成本。正確：Requester 只能建立候選，item/warehouse owner lock 後才影響成本。
- 顯示過多內部採購欄位會造成 requester 誤判。
- 把 `Source Panel + Demand Matrix` 或表內第一列新增當 requester 主要輸入。正確：左上 `Add Item` popup 選 item/spec，整頁 worksheet 以 all-phase grouped headers 直接輸入 station/department qty。
- 把 Cost Manager `Station Matrix` 規格套到 Requester。正確：Requester 只展開目前 tab 的 station/department 欄，不改 Cost Manager baseline。

## 測試 / QA 重點

- Requester 看不到 vendor / PAS material / factory material / OM assignee / FTV。
- Copy Demand / Reuse Item 帶入 target line 時 qty = 0，source qty 只能當 reference。
- MFG / Non-MFG tab 欄位必須符合鎖定 station/department baseline。
- Add Item popup 可新增 Catalog / Reuse / Copy Demand row；New Item Request 需先完成 pending material master request，且 popup 表格第一欄必須是 Add，分類篩選使用 Lv1 / Lv2 / Lv3。
- Save Draft 不要求 Need Date；Submit 必須要求目前 MFG/Non-MFG worksheet scope 的 Need Date，且至少一個 phase qty > 0。
- Create Candidate 後狀態依 owner 顯示 Pending OM / Pending MFG Owner / Pending Unit Owner，未 lock 前不可當正式扣成本。

## Compact Handoff

Requester owns demand creation and revision. It uses a full-page all-phase Excel worksheet where each row is Item/Spec under the current project/line, edits MFG or Non-MFG station/department qty columns under every phase group, adds rows from the Add Item popup, can save draft or submit the current line plus current MFG/Non-MFG worksheet with its own Need Date, and can create temporary budget and warehouse/carryover candidates, but cannot see procurement-internal fields, choose vendor/brand/price/owner, maintain warehouse stock, or approve/lock/export anything.
