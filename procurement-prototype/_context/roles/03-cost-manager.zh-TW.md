# Cost Manager 角色上下文

## 商業定位

Cost Manager 是 Dept DRI 後的下一層成本授權者。它不需要獨立 top-level `Demand Analysis`、`Authorized Analysis`、`Progress Tracking` 或 `Project Setup` 入口；`Demand Analysis` 必須嵌入 `Cost Review` 作為主要 evidence，並以既有 `Demand Cost Dashboard` 與 `Station Matrix` 表格作 protected baseline，不重排欄位、不改 Excel-like 密度與計算語意。決策畫面保留 review queue 與 Cost Manager authorize / reject 權限。

## 可看資訊

- Dept DRI 已 approve、等待 Cost Manager 授權的 rows。
- Cost Review 內嵌 Demand Analysis evidence：
  - `Demand Cost Dashboard`：以現有 `managerDemandCostTable` 欄位、密度、金額/數量呈現為基準。
  - `Station Matrix`：以現有 `managerQuantityMatrixTable` 欄位、密度、phase/station/unit 計算呈現為基準。
  - 兩張 protected baseline table 的第一欄固定為 `Review Status`，放在 `Actions` 前面；後續成本、數量、phase/station 欄位順序與數字語意不可重排。
  - `Line` filter：由 `stationBreakdown[].requestLine` 產生 `All / Line 1 / Line 2...`，用來切 request line scope。
  - `Line Count`：仍是既有成本計算乘數，不代表 requester line scope。
- Cost Manager 自己的 authorize / reject 歷史。
- 必要的 item/spec、qty、phase、requester、Dept DRI decision context、next owner。
- `Review Status` 只表示審批鏈：待授權 row 顯示 `Dept DRI approved` / `Pending Cost Manager`，授權後仍留在 Cost Review evidence，顯示 `You authorized` 與目前派往 OM；reject row 顯示 Cost Manager reject reason 並 read-only。
- Submission Monitor / Progress Tracking 的必要資訊併入 Cost Review queue 與 selected-row detail，不再作獨立入口或重複表格。
- Carryover 只作 selected-row contextual evidence；主 Demand Analysis 不顯示大型 carryover card、line impact strip 或空 ledger。

## 可操作功能

- Authorize Dept DRI approved requester submission。
- Reject 回 Requester Action Required，必須填 reason。
- 先看 Cost Review queue，再在下方 Demand Analysis baseline 表格檢查 Dashboard / Station Matrix；點 row 或 dashboard cell 可同步 highlight / drill-in，但 selected row 不重新定義 baseline 表格欄位。
- 在 Item Quantity Review popup 直接 add / edit / delete 正式 stationBreakdown qty，並寫入 audit metadata。
- 查看 Cost Review History。

## 不可看 / 不可做

- 不建立 requester demand。
- 不操作 warehouse lock。
- 不操作 OM quote、PAS Demand No、Export Package。
- 不派工 OM。
- 不維護 project setup。
- 不提供獨立 top-level `Demand Analysis` / `Authorized Analysis` tab。
- 不把 `Line Count` 當作 `Line 1 / Line 2` scope。
- 不把 carryover 作為主視覺或第一眼決策資訊。

## 主要 UI / 模組

- Cost Review
  - Review Queue / Authorize / Reject
  - Demand Analysis evidence
    - Demand Cost Dashboard
    - Station Matrix
    - Line filter / Line Count / Phase / View Mode
  - Item Quantity Review popup
- Review History

## 資料輸入 / 輸出

- 輸入：Cost Manager authorize / reject decision、reject reason、direct quantity edit note。
- 輸出：
  - authorized -> OM Leader intake / assignment。
  - rejected -> Requester Action Required。
  - direct quantity edit -> 更新正式 stationBreakdown / phase qty / total qty，並保留 itemQuantityReviewHistory audit。

## 常見風險

- Cost Manager UI 不可回到多 top-level tab global analysis 架構；Demand Analysis 是 Cost Review 內嵌 evidence。
- Demand Cost Dashboard 與 Station Matrix 是 protected baseline；只能改外層 placement、filters、visibility、scope wiring，不可重排主欄位或改掉既有數字語意。
- Dashboard 預設依 filter scope；selected row 只做 highlight / drill-in sync，不把 baseline 表格改成另一套 Project Context/Quantity Dashboard copy。
- Direct edit 會改正式需求數量；必須保留 audit note、actor、time、before/after changes。
- Carryover pending 與 applied 必須分清楚；只有 locked/applied 才可能作 secondary evidence。
- Cost Manager 看到的是成本授權資訊，不是 OM operation form。

## 測試 / QA 重點

- Cost Manager 只看到 top-level `Cost Review / Review History`。
- Cost Review 內必須有 review queue/actions，並嵌入 `Demand Cost Dashboard / Station Matrix` baseline tables。
- `Demand Cost Dashboard / Station Matrix` 第一欄必須是 `Review Status`，不可命名為 `Status` 或 `Project Status`；authorized rows 仍可見但不可再顯示 Authorize / Reject 操作。
- `Line` filter 必須可切 P26 `Line 1 / Line 2`；`Line Count` 仍維持乘數行為。
- 不顯示 `Authorized Analysis`、`Demand Analysis`、`Progress Tracking`、`Project Setup` tab。
- Carryover evidence 僅在 selected-row detail 出現；Demand Analysis main 必須保持乾淨，只保留 baseline dashboard/matrix。
- Dept DRI approve 後才出現在 Cost Manager。
- Cost Manager authorize 後才進 OM Leader intake；reject 回 Requester Action Required。

## Compact Handoff

Cost Manager is the scoped decision layer after Dept DRI. It has only Cost Review / Review History top-level tabs; Cost Review embeds the protected Demand Analysis baseline (`Demand Cost Dashboard` + `Station Matrix`) below the queue/actions, with a formal Line filter sourced from `stationBreakdown[].requestLine` while Line Count remains the cost multiplier.
