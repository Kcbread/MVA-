# 03 Manager B 模組

## Manager B 現行 Tabs

- `Approval`
  - `Pending Approval`
  - `Approval History`
- `Demand Analysis`
  - `Cost Dashboard`
  - `Station Matrix`
- `Progress Tracking`
- `Project Setup`

`Demand Analysis` 是主管的主要分析工作區。第一眼先看 Excel-like 的 `Item x Phase x Unit` cost dashboard；只有有疑慮時才進入 station matrix。

## `manager.approval`

| 項目 | 定義 |
| --- | --- |
| Business Owner | Manager B |
| Purpose | 單一 approval 工作區，包含待審與已審紀錄。 |
| Input Data | `status = Submitted` 的待審 rows；以及有 manager decision 的 history rows。 |
| Output / Mutation | `Approved` / `Rejected`，decision timestamp，manager reason，timeline。 |
| Downstream Consumers | Progress Tracking、Demand Analysis、OM queue、Approval History。 |

### 內層區塊

| Section | 說明 |
| --- | --- |
| `Pending Approval` | row-level 直接審批。 |
| `Approval History` | Manager 已審紀錄，只讀，不含 requester add/submit 行為。 |

## `manager.approvalQueue`

| 項目 | 定義 |
| --- | --- |
| Business Owner | Manager B |
| Purpose | 審核 OPM submitted demand。 |
| Input Data | request rows where `status = Submitted`。 |
| Output / Mutation | `Approved` 或 `Rejected`，decision timestamp，manager reason，timeline。 |
| Downstream Consumers | Approval History、Progress Tracking、Demand Analysis、OM queue。 |

### Visible Columns

| Column | 說明 |
| --- | --- |
| Request ID | 單筆 request row id。 |
| Project | project/package。 |
| Requester | 提交人。 |
| Submitted At | 送審時間。 |
| Item | 品項與 spec。 |
| Affected Phases | 有數量的 phase。 |
| Total Qty | item total qty。 |
| Status | 應為 `Submitted`。 |
| Reject Reason | reject reason input。 |
| Decision | `Approve` / `Reject to Requester / Dept DRI`。 |
| Contact | `Contact DRI`。 |
| Detail | request detail。 |

### Actions

| Action | 前置條件 | 成功後 |
| --- | --- | --- |
| `Approve` | row status = Submitted。 | row status = Approved；離開 Pending Approval；進 Approval History；仍保留在 Progress Tracking / Demand Analysis。 |
| `Reject to Requester / Dept DRI` | 必填 reason。 | row status = Rejected；Requester 可看 reason；不進 OM/Buyer。 |
| `Contact DRI` | row 有 requester/contact context。 | 開 contact modal。 |
| `Detail` | 任意 row。 | 開 detail modal，顯示 demand breakdown。 |

## `manager.progressTracking`

| 項目 | 定義 |
| --- | --- |
| Purpose | Pivot-like 採購進度 dashboard。 |
| Input Data | `G Project MVA EQ Request` raw rows + active system request rows。 |
| Output / Mutation | 無，read-only。 |

### KPI

- Total Qty
- Budget Done
- PR Done
- PO Done
- Arrived
- Late / At Risk

### Visible Columns

| Column | 說明 |
| --- | --- |
| Year Project | Excel year project。 |
| Project | project code。 |
| Item | item group。 |
| Department | source department。 |
| Quantity | demand qty。 |
| Budget Progress | done/total + progress。 |
| PR Progress | done/total + progress。 |
| PO Progress | done/total + progress。 |
| Arrived Progress | received/total + progress。 |
| Delivery Status | Late / Pending / Not Arrived。 |
| Key Dates | Required / Deadline / ETA / DTA。 |
| Pending / Risk Reason | Manager-readable reason，不直接顯示 G/L raw code。 |
| Detail | raw rows detail。 |

### Filters

- Year Project
- Project
- Process
- Stage
- Department
- Late only
- Pending only

## `manager.demandAnalysis`

| 項目 | 定義 |
| --- | --- |
| Purpose | Manager B 的需求分析工作區，避免主管直接進入寬表。 |
| Input Data | OPM submitted / approved / in-progress demand rows with long-form demand rows。 |
| Output / Mutation | 無，read-only；內層 tab 切換只改變分析視角與 filter。 |

### Inner Tabs

| Inner Tab | Module ID | 說明 |
| --- | --- | --- |
| `Cost Dashboard` | `manager.costDashboard` | 預設第一層，參考 Excel Dashboard 分頁：item x phase x unit 數量/金額。 |
| `Station Matrix` | `manager.stationMatrix` | 第二層 Excel-like 寬表，檢查 phase x station 數量合理性。 |

## `manager.costDashboard`

| 項目 | 定義 |
| --- | --- |
| Purpose | `Demand Analysis` 的第一層需求/金額 dashboard，先用 item x phase x unit 欄位看 MFG / Non-MFG 單位切分，再下鑽 Station Matrix。 |
| Input Data | OPM submitted / approved / in-progress demand rows with long-form demand rows。 |
| Output / Mutation | 無，read-only；點擊 unit / row 會切到 `Station Matrix` 並套用 filter。 |

### Header Controls

- Project
- Phase
- Line Count
- View Mode: `Amount / Qty`
- Currency Display

### Dashboard Columns

- ENG Name
- CN-ENG Name
- VN Name
- Price
- MFG
- FATP TE
- FATP IQC
- FATP PQE
- WH
- Q-LAB
- REL
- ENG1
- ENG2
- ENG3
- IT
- FAC
- Total
- Detail

### Aggregation Rules

- `Demand Type = MFG` 的數量全部彙整到 `MFG`，不看需求單位。
- `Demand Type = Non-MFG` 的數量依 `需求單位` 彙整。
- Amount 以 `Qty x Unit Price USD x Line Count` 計算。USD 是成本 canonical value；VND 顯示與 export 透過每月匯率換算。
- Unit price source order: OM/PAS quote → history price → OPM estimate → price pending。

### Cell Rules

- `Qty` view：每個 unit cell 顯示 selected phase 的總數量。
- `Amount` view：每個 unit cell 顯示 `Qty x Unit Price x Line Count`。
- 空值保持空白，維持 Excel-like 密度。
- 點 item/unit cell 後切到 `Station Matrix`，並套用 `item + selected phase + unit` filters。

## `manager.stationMatrix`

| 項目 | 定義 |
| --- | --- |
| Purpose | `Demand Analysis` 的第二層，檢查 item 在不同 phase / station 的數量合理性。 |
| Input Data | OPM submitted demand rows with `stationBreakdown`。 |
| Output / Mutation | 無，read-only。 |

### Data Inclusion

包含：

- `Submitted`
- `Approved`
- `In Progress`

排除：

- `Draft`
- `Rejected`
- `Cancelled`
- Superseded rows

### Main Table Columns

- Project
- Item
- Spec
- Unit Price
- Est. Amount
- P1.0 ~ MP expanded station matrix
- Total Qty
- Detail

### Phase Matrix Columns

每個 phase 展開：

| Group | Columns |
| --- | --- |
| Mainline | CG / BG / FATP / Test / Hybrid / Auto |
| Packing | ENG Pack / Zombie / Laser_pico / Rework |
| Support | Repair / WH |
| Calc | Buffer / Total Demand / Stock / Actual Need |

### Rules

- `Buffer` / `Stock` 沒有正式來源時維持空白。
- `Total Demand` 與 `Actual Need` 第一版可等於 phase station total。
- phase filter 選單一 phase 時只顯示該 phase columns。
- station filter 保留有該 station qty 的 rows，但矩陣仍可顯示完整 phase context。
- demand unit filter 會重算 matrix 數值。

## `manager.unitDashboard`

| 項目 | 定義 |
| --- | --- |
| Purpose | 選定 item 後先看 Phase x 需求單位彙整。 |
| Input Data | 同 `manager.quantityMatrix`。 |
| Output / Mutation | 點擊 cell 只更新 filters，不寫資料。 |

### Columns

`MFG / FATP TE / FATP IQC / FATP PQE / WH / Q-LAB / REL / ENG1 / ENG2 / ENG3 / IT / FAC`

### Cell

- Qty
- Line count

## `manager.approvalHistory`

| 項目 | 定義 |
| --- | --- |
| Purpose | 查看 Manager 已審批紀錄。 |
| Input Data | rows with decision result。 |
| Output / Mutation | 無，read-only。 |

### Visible Information

- Request ID
- Project
- Item
- Phase Qty
- Total Qty
- Decision
- Reason
- Decision Time
- Detail

## `manager.projectSetup`

| 項目 | 定義 |
| --- | --- |
| Purpose | 維護 project 開放與基本設定。 |
| Input Data | project configs。 |
| Output / Mutation | project open/close、phase setting。 |

## `shared.contactDri`

| 項目 | 定義 |
| --- | --- |
| Purpose | 查聯絡窗口，不塞進主表。 |
| Input Data | requester row、DRI input rows、project/process contact rows。 |
| Output / Mutation | 無。 |

### Contact Cards

- Requester
- Department DRI
- Project / Process Contact
- Request Context
