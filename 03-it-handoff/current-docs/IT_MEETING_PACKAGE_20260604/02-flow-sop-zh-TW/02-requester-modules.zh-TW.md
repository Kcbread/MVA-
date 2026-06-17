# 02 Requester 模組

## `requester.requestWorkspace`

| 項目 | 定義 |
| --- | --- |
| Business Owner | Requester |
| Purpose | 建立 request package，新增/複用 items，輸入 Need Date 與需求數量，並準備送 Manager B。 |
| Input Data | OM catalog、real purchase records、requester persona、project list。 |
| Output / Mutation | 建立 `Draft` request rows。 |
| Downstream Consumers | `requester.demandEditor`、`manager.approvalQueue`、`manager.quantityMatrix`。 |

### Item Picker

`Add Item`、`Reuse Item`、`Reuse Project Package`、`Create New Item` 不再是分散的 top-level tabs。它們統一收在 `Add / Reuse Item` popup 裡。

| Mode | Purpose | Result |
| --- | --- | --- |
| Search Catalog | 依 item name、spec、Level 1 / 2 / 3 搜尋 catalog / OM catalog。 | 新增一筆 current-project draft item。 |
| Reuse Approved History | 從已 PO completed 的歷史品項複用單品。 | 新增一筆 current-project draft item，並複製來源 demand rows。 |
| Reuse Project Package | Preview / import 一整包歷史 source package。 | 新增多筆 current-project draft items，submit 前仍可修改。 |
| Create New Item | catalog/history 找不到時建立新品項。 | 開 item maintenance，完成後建立 draft item。 |

### Visible Columns

| Column | 說明 |
| --- | --- |
| Item | 產品名稱。 |
| Spec Summary | 短規格摘要；完整文字放 Detail。不得顯示 vendor、brand、owner、PAS material no。 |
| Qty / Phases | total qty 加 active phase summary。 |
| Need Date | 需求日期；submit 前必填。 |
| Demand Rows | demand row 數量。 |
| Breakdown Status | 是否已輸入可提交的需求數量。 |
| Status | Draft / submitted state。 |
| Timeline | Compact Draft / Demand / Submit 或 downstream timeline chips。 |
| Actions | `Edit Demand` 與 `Remove`。 |
| Detail | 開 item/request detail。 |

### Actions

| Action | 前置條件 | 成功後 |
| --- | --- | --- |
| `Add / Reuse Item` | 使用者開啟 item picker。 | 顯示 catalog、history、package import、new item modes。 |
| `Add` | 使用者選擇 catalog/history item。 | 新增 draft item 並開啟 Demand Editor。 |
| `Create New Item` | 找不到既有品項。 | 建立新 draft item。 |
| `Edit Demand` | row 為 `Draft`。 | 開啟 `requester.demandEditor`。 |
| `Submit Package to Manager B` | selected draft rows 每筆至少一個 demand row qty > 0，且已填 Need Date。 | rows 變 `Submitted`，產生 package id，進 Manager queue。 |

### Error State

- 沒有 selected draft：顯示 `Select at least one draft request before submitting to Manager B.`
- 沒有 demand qty：顯示 `Add at least one demand row quantity before submitting to Manager B.`
- 沒有 Need Date：顯示 `Need Date is required for every selected draft item before submitting.`
- submitted 後 draft table 不應殘留該批 rows。

### Project / Phase Carryover

- 系統保存 Requester draft context：`lastRequestProject`、`lastRequestPhase`、`lastDemandType`。
- `Add Item`、`Create New Item`、`Reuse Item > Add` 都加入目前 target project，不沿用 source project。
- 新增品項時，第一筆 demand row 的預設 phase 使用最近一次 Demand Editor 使用的 phase。
- 使用者切換 `Project Type / Project` 時才更新 target project；新增下一個品項會沿用該 project。

## `requester.demandEditor`

| 項目 | 定義 |
| --- | --- |
| Purpose | 單一 item 的數量唯一輸入入口。 |
| Input Data | draft request row、phase master、station master、需求單位 master。 |
| Output / Mutation | 寫入 `stationBreakdown` long-form rows，並重算 phase totals / total qty。 |

### Demand Row Schema

| Field | Required | 說明 |
| --- | --- | --- |
| Phase | yes | `P1.0 / P1.1 / EVT / DVT / PVT / MP`。 |
| Demand Type | yes | `MFG / Non-MFG`。預設可由 OPM profile 帶入；沒有 profile default 時預設 `MFG`。 |
| Station | conditional | `MFG` 必填；使用 `CG / BG / FATP / Test / Hybrid / Auto / ENG Pack / Zombie / Laser_pico / Rework / Repair / WH`。`Non-MFG` 不顯示 station。 |
| 需求單位 | conditional | `Non-MFG` 必填；使用 `FATP TE / FATP IQC / FATP PQE / WH / Q-LAB / REL / ENG1 / ENG2 / ENG3 / IT / FAC`。`MFG` 不需要填。 |
| Qty | yes | 非負整數。 |
| Request Line | yes | Line 1 / Line 2 / Line 3 的需求線別。 |
| Carryover From | no | None / Line 1 / Line 2。Requester 可在輸入 demand 時宣告 line carryover。 |
| Carryover Qty | conditional | Carryover From 不是 None 時必填。 |
| Carryover Reason | conditional | 有 Carryover Qty 時必填。 |
| Remark | no | 補充說明。 |

### Demand Type Rules

- `MFG` 代表站位需求，Manager 用 `Demand Analysis > Station Matrix` 檢查 CG/BG/FATP/Test 等站位是否合理。
- `Non-MFG` 代表單位需求，Manager 用 `Demand Analysis > Cost Dashboard` 檢查單位金額與數量。
- 新增下一筆 demand row 時，系統延續上一筆 `phase / demandType / station / 需求單位`，減少重複輸入。
- Requester 輸入 carryover 後會建立 `Requesterpplied` ledger event；Dept DRI 仍是正式 carryover review owner。Manager B 與 OM 只消費 original/saving/effective impact。

### Calculation

```text
P1.0 Qty = sum(qty where phase = P1.0)
P1.1 Qty = sum(qty where phase = P1.1)
EVT/DVT/PVT/MP 同理
Total Qty = sum(all demand rows qty)
```

## `requester.requestStatus`（整合 demand overview + request status）

| 項目 | 定義 |
| --- | --- |
| Purpose | 原本獨立的 package overview。現在合併到 `requester.requestStatus`，避免使用者在兩個 tracking 頁來回切換。 |
| Input Data | current requester + current project 的 Draft / Submitted rows。 |
| Output / Mutation | 無，read-only；Draft row 可跳回 Edit Demand。 |

### Visible Information

- Package id / label
- Item
- Status
- P1.0 ~ MP phase summary
- Total Qty
- Action
- Detail

## `requester.addReuseItem`（item picker mode）

| 項目 | 定義 |
| --- | --- |
| Purpose | 在 `Add / Reuse Item` popup 中，依單一品項或來源 project package 複用歷史 item/spec。 |
| Input Data | Completed rows with Factory Material No、PO trace、price history、source phase、demand breakdown。 |
| Output / Mutation | 新增 current target project draft rows，並清除後段採購結果欄位。 |

### Rules

- `Factory Material No` 只在 PO 後才存在。
- Add from history 不覆蓋現有 draft items。
- `Source Project` 只是搜尋歷史來源的 filter，不代表新需求 target project。
- Reuse Item toolbar 必須顯示 `Add to: {currentProject} / default phase {lastRequestPhase}`。
- 複製時保留 reference 欄位：`sourceProject`、`sourceRecordId`、`sourcePackageId`、`sourcePhase`、`sourcePoNo`。
- 複製時清除採購結果欄位：approval decision、PAS Demand No、PAS Material No、Factory Material No、vendor、quote、PO、actual amount。

### `requester.addReuseItem.byItem`

| 項目 | 定義 |
| --- | --- |
| Purpose | 將單一歷史 row 加入目前 Requester target project。 |
| Filters | Search、`Source Project`、Level 1、Level 2。 |
| Action | `Add`。完整語意 `Add Item to Request` 放在 button title/detail。 |

Rules:

- 預設複製 source quantity + `stationBreakdown`，但 copied demand rows 會 retarget 到目前 OPM target/default phase。
- `sourcePhase` 只保留為 reference；raw phase quantities 會同步到 target/default phase，避免看不見的 source-phase demand 殘留。
- 若 source 沒有 `stationBreakdown`，系統從 source phase quantity 轉成 demand rows。
- 新 draft target project 永遠使用目前 OPM header project，不沿用 source project。
- Add 後 draft row 立即出現在 `Request Workspace`，可再用 `Edit Demand` 修改。

### `requester.addReuseItem.byProjectPackage`

| 項目 | 定義 |
| --- | --- |
| Purpose | 匯入整包歷史 project/phase/package group，submit 前仍可逐品項修改。 |
| Filters | `Source Project`、`Source Phase`、`Source Package`。 |
| Actions | `Preview Package`、`Import Package to Request`。 |

Rules:

- Preview 先顯示所有 source rows。
- Import 將多筆 rows 複製到目前 target project draft items。
- 匯入時沿用 source qty，但 demand rows 與 raw phase totals 會 retarget 到目前 OPM target/default phase。
- 使用者 submit 前可刪除其中品項、修改 spec、修改 demand rows。
- Package import 不會自動送審；只有 `Submit Package to Manager B` 後 Manager B 才會收到。

## `requester.temporaryBudgetRequest`

| 項目 | 定義 |
| --- | --- |
| Purpose | Requester 臨時預算申請，追蹤 estimate / bidding / PO variance。 |
| Input Data | Selected draft rows 與 temporary budget estimate fields。 |
| Output / Mutation | 將 temporary budget metadata 寫到 submitted rows。 |

Implementation guard:

- `Temporary Budget Request` 輸入面板只能出現在 Requester `Request Workspace`。
- 不可注入 Manager B、OM Purchasing、Contact popup 或 Admin-only views。
- Manager/OM 只能在實際 temporary-budget request row 或 detail 看到 tracking summary。

## `requester.actionRequired`

| 項目 | 定義 |
| --- | --- |
| Purpose | Requester 待辦區。 |
| Input Data | waiting user confirmation rows、amendment confirmation rows。 |
| Output / Mutation | Requester decision status、cancel reason、timeline event。 |

### Task Types

| Type | User Sees | Actions |
| --- | --- | --- |
| Quote Ready | quote amount、quote date、attachment status，不顯示 vendor。 | `Confirm Need` / `Cancel Request` |
| Revised Request Confirmation | before/after qty/spec、quote reference。 | `Confirm Revised Request` / `Reject Amendment` |

## `requester.requestStatus`

| 項目 | 定義 |
| --- | --- |
| Purpose | 高密度追蹤 draft 與 submitted demand。這頁取代原本分開的 `My Demand Overview` 與 `Request Status`。 |
| Input Data | requester draft rows with demand qty，加上 submitted/approved/rejected/in-progress rows。 |
| Output / Mutation | Draft row 可回到 `Edit Demand`；submitted row 以 read-only tracking 為主，除 post-quote request change。 |

### Visible Information

- Request ID
- Project
- Item
- Qty
- Current Status
- Action Status
- Timeline
- Detail
