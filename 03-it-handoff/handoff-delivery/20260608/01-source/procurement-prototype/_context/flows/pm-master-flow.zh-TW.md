# 主流程上下文：Requester → Dept DRI → Cost Manager → OM → Buyer Handoff

## 主流程目的

讓需求從建立、部門確認、成本核准、OM 採購作業到 Buyer PR/PO 交接有清楚責任邊界。每一步都必須有 pending owner、stage start、days pending、next action。

## 標準需求流程

1. `Requester` 建立需求。
   - 選 MFG / Non-MFG。
   - MFG 依 line / stage / station / item 建立。
   - Non-MFG 依 unit / item 建立。
   - 填 need date。
2. `Requester` submit。
3. `Dept DRI` 審核 requester submission。
   - approve -> `Cost Manager`。
   - reject -> `Requester Action Required`。
4. `Cost Manager` final authorization。
   - approve -> `OM Leader intake / assignment`。
   - reject -> `Requester Action Required`。
5. `OM Leader` 派工。
   - Linh: P27 / F27。
   - Giang: other projects。
   - Mai 可調整 assignment。
6. `OM Purchasing` 處理 assigned row。
   - PAS Demand No。
   - PAS Quote Result。
   - Quote Expiry tracking。
   - Export Package。
7. `Buyer Handoff`。
   - OM export 後 Buyer owns PR / PO。
   - 顯示 handoff days，不再稱為 downstream。

## Workflow Status 欄位

所有角色的 status table 應由同一個 workflow status model 產生：

- `pendingOwner`
- `currentStage`
- `submittedAt`
- `receivedAt`
- `stageStartAt`
- `daysPending`
- `nextAction`
- `riskReason`
- `timelineMilestones`
- `visibilityFlags`

## Reject 閉環

- Dept DRI reject -> Requester Action Required -> revise/resubmit -> Dept DRI。
- Cost Manager reject -> Requester Action Required -> revise/resubmit -> Dept DRI。
- OM reject -> Requester Action Required 或 Dept DRI review，依原因分類。
- Budget Approver reject -> Requester Action Required。

Reject 永遠要保留 reason、timestamp、actor、previous stage。

## Cost Manager 保護區

`Demand Analysis > Cost Dashboard / Station Matrix` 是 Cost Manager 的受保護分析區。其他 workflow/status refactor 不可改動其畫面與數字邏輯。

## PM 檢查句

若一個新功能不知道放哪裡，先問：

- 誰建立資料？
- 誰 approve/reject？
- 誰只檢視？
- 哪個 stage 會開始計 days pending？
- reject 後回到誰？
