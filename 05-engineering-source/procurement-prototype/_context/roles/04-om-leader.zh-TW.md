# OM Leader 角色上下文

## 商業定位

OM Leader 是 OM 作業主管。第一版指定 Mai，主要使用三個同層級入口：`Demand Progress Tracking` 檢視需求進度、`OM Progress Review` 檢視 OM 例外與風險、`Project Stage Calendar` 維護並檢視 project stage time。PAS / Quote / Quotation DB / OM Handoff / PR PO tracking 等操作型工作由 OM Purchasing 負責。

## 可看資訊

- 所有 OM rows 與 assignment 進度。
- OM Progress Review 的 source-backed single status summary、Project Stage Date Signal、Stage Signal、Workload Signal、Action Required Queue、risk、pending owner、days pending。
- Project Stage Calendar：`Year Project + Project + Phase` 的 line open date / project stage time；同時提供 `Line Open Date Maintenance` 與 `Stage Date Review`。
- PR / PO Summary、Delivery Summary：唯讀追蹤 OM Purchasing 已回填到 API 的 Budget / PR / PO / ETA / DTA / Total LT 進度。
- Giang / Linh 的 assigned workload。

## 可操作功能

- Assign / reassign / clear OM row assignee。
- 維護 Project Stage Calendar：以 `Year Project + Project + Phase` 定義 line open date，供 Requester phase input、Dept DRI review、OM tracking 共用。
- 查看全部 OM 進度與 risk；日常畫面以 dashboard / exception queue / drilldown 為主，不直接承載 OM Purchasing 的操作型大表單。
- `OM Progress Review` 與 `Project Stage Calendar` 在 API mode 必須由 `/api/om/leader-console`、`/api/om/project-stage-calendar` 真實 hydrate；API payload 對 Stage Calendar 與 PR/PO/ETA tracking 是 authoritative，空值也必須能清掉 frontend seed/demo 殘值，不得只靠前端 local state 判定進度或 stage date。

## 不可看 / 不可做

- 不作為 requester / Dept DRI / Cost Manager / Budget Approver 的 business approval。
- 預設不操作報價 row；報價輸入由 OM Purchasing 處理。若未來要讓 Mai 代操作，必須另定規則並 audit。
- 不操作 PAS Demand No、Quote Result、Quotation DB、OM Handoff、Budget / PR / PO / ETA / DTA / Total LT。
- 不作為 monthly USD/VND rate 日常輸入 owner；日常 owner 是 Giang。Mai / Admin 只保留 override / backup 權限。
- 不改 requester demand。

## 主要 UI / 模組

- Demand Progress Tracking：跨角色需求進度與數量/成本 dashboard，OM Leader 唯讀檢視。
- OM Progress Review：single status summary、Project Stage Date Signal、Stage Signal、Workload Signal、Action Required Queue、Detail drilldown。
- Assignment Control
- Project Stage Calendar：同層級工作面，包含 `Line Open Date Maintenance` 與 `Stage Date Review`；結果以 `Project Stage Date Signal` 進入 OM Progress Review summary。
- API: `GET /api/om/leader-console`
- API: `GET/PUT /api/om/project-stage-calendar`
- UI：OM Progress Review toolbar 顯示 last synced / Refresh；目前是 login/session hydrate + 手動 refresh，不是 websocket/push realtime。

## 資料輸入 / 輸出

- 輸入：assignment、Project Stage Calendar phase line open date、OM orchestration status。
- 輸出：OM assignee、phase-level line open date metadata、audit events、progress/risk summary。
- `PUT /api/om/project-stage-calendar` 僅 OM Leader / Admin 可寫；OM Purchasing、Requester 不可寫。

## 常見風險

- CPD-IEP Owner 是業務 owner，不等於 OM assignee。
- Mai 能看全部 OM rows，但不代表可以替其他角色 approve。
- 派工規則目前：Linh 負責 P27 / F27，其他預設 Giang；系統可自動分配，Mai 可調整。

## 測試 / QA 重點

- Mai 可 assign / reassign / clear。
- Giang / Linh 不可派工。
- Monthly exchange rate 由 Giang 輸入並全局套用；Mai / Admin 僅 override / backup，Linh 預設不可維護。
- Mai 看到全部 OM rows；OM Purchasing 只看 assigned rows。
- Project Stage Calendar 的 line open date 必須被 Requester phase input 帶入，但 Requester 不可直接改 line open date。
- API mode 下 stage calendar save 後必須產生 `om.project_stage_calendar_saved` audit event。

## Compact Handoff

OM Leader is Mai: Demand Progress Tracking read-only visibility, OM Progress Review, assignment visibility/control, Project Stage Calendar phase dates, and OM orchestration. Daily monthly USD/VND rate input belongs to Giang; Mai/Admin only override or back up. OM Leader should not become a hidden business approver, quote operator, or OM Handoff / PR PO operator.
