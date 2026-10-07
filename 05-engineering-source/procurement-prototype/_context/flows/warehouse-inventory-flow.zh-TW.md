# Warehouse Inventory 流程上下文

## 定位

Warehouse Inventory 是「可用庫存 + 存取交易 + item/warehouse owner 鎖定」功能。它不是需求差額監控，也不是周轉率 dashboard。

Owner 來源由 item master / 系統規則判斷：

- OM-owned：PC / IPC / laptop / monitor / QR code scanner / Zebra printer / PDA / Data Collector / 數據採集器。
- MFG-owned：不屬於 OM-owned 且屬於 MFG scope 的品項。
- Unit-owned：Non-MFG department/unit scope 的品項。

Requester 只能看到 read-only owner badge，不可自行指定 owner。

## 主要行為

### Stock In

OM / MFG / Unit warehouse owner 從已買過品項下拉選擇，登錄自己維護的多餘庫存。Requester 不維護實際庫存數量。

必填 trace：

- sourceProject
- sourceLine
- sourceStage
- sourceStationOrUnit
- item/spec
- itemOwner
- qty
- reason

例：`F27 / Line 1 / CG / IPC / +2`

### Create Use Candidate

Requester 在 Request Workspace 選到相同 Item/Spec 時，系統顯示 `Inventory Available` suggestion。

Requester 只能建立候選：

- targetProject
- targetLine
- targetStage
- targetStationOrUnit
- candidateQty
- itemOwner
- reason
- status = `Pending OM` / `Pending MFG Owner` / `Pending Unit Owner`

例：`OR6 / Line 2 / CG / IPC / use 2`

### Owner Lock / Reject

對應 item/warehouse owner approve 後：

- candidate 變成 locked/used。
- inventory available 扣除。
- Cost Manager effective cost 才正式扣除。

對應 item/warehouse owner reject 後：

- 不扣庫存。
- 不影響成本。
- 回 Requester 修正或重新選來源。

Owner routing：

- OM-owned candidate：OM warehouse owner lock/reject。
- MFG-owned candidate：MFG warehouse owner lock/reject。
- Unit-owned candidate：Unit owner / Dept DRI lock/reject。

## Warehouse Inventory 主表

主表以可用庫存為第一視角：

- Item / Spec
- Owner
- On Hand
- Reserved
- Available
- Top Source
- Potential Target
- Status
- Action
- Detail

不再使用主欄位：

- Demand Qty
- Owned Warehouse
- Warehouse Delta
- Stock May Cover

## Inventory Transaction Ledger

主表下方保留 compact ledger：

- Type: Stock In / Use Candidate / Locked Use / Rejected
- Source Project / Line / Stage / Station or Unit
- Target Project / Line / Stage / Station or Unit
- Item / Spec
- Owner
- Qty
- Status
- Created By
- Confirmed By
- Timestamp
- Reason

## Cost Impact 規則

- Warehouse stock 本身只是 evidence。
- Pending candidate 不應正式扣成本，除非產品決策指定顯示 pending impact；若顯示，必須有 owner-specific pending badge。
- Locked Use 才是正式 effective demand/cost 來源。

## 跨項目共用

同 Item/Spec 可以跨 project / line / stage / station 使用，但每筆交易必須保留 source/target trace。主表可彙總 Item/Spec，ledger 必須能追到來源。

## 測試重點

- Stock In 只能從已買過品項選擇。
- Request Workspace 有相同 Item/Spec 時顯示 Inventory Available。
- Requester 只能 Create Candidate。
- OM-owned 只能 OM owner lock/reject；MFG-owned 只能 MFG owner lock/reject；Unit-owned 由 Unit owner / Dept DRI lock/reject。
- Locked 後 Cost Manager 顯示 saved/effective cost。
