# Dept DRI Item Quantity Review 收斂 Handoff

## 核心修正

`Project Item Matrix Overview` 不再是 Dept DRI 需要的第一層。

Dept DRI 的主工作區要改成 item-first：上方 review queue / item switcher 負責切換當前 item；下方 `Item Quantity Review` 直接跟著 selected item 更新。不要再新增全 project、全 item 的 overview matrix。

## 使用者真正要的層級

### 第一層：Item Switcher / Item Quantity Review

- UI 風格：不要做新的 project overview table，也不要做卡片式 summary。
- Scope：單一 selected item。
- Item switcher 必須持續可見，可切換 item，並顯示 active item。
- 切換 item 後，下方 `Item Unit Matrix`、MFG Station Detail、Non-MFG Department Detail 都必須同步到同一 item。
- 每個 item 必須可操作：
  - `Approve`
  - `Reject`
  - `Detail`
- direct edit 入口保留在 item quantity popup / detail matrix cell，不用另做 `Modify` overview 欄。

### 第二層：Item Unit Matrix

- UI 風格：仍是 Excel-like dense matrix，不是卡片。
- Scope：單一 item，在同一 project 內的統整。
- 顯示：
  - `MFG` aggregate 欄。
  - Non-MFG departments / demand units 欄。
  - 多 phase 的數量仍先統整，不在第二層展開 CG / BG。
- 點 `MFG` 欄才進第三層 MFG station detail。
- 點 Non-MFG department 欄才進第三層該 department 的 phase / qty detail。

### 第三層：Quantity Detail Matrix

- 這一層就是目前使用者滿意的 Excel-like Quantity Detail Matrix。
- 不要重寫、不改 table shell、不改 class、不改欄寬密度、不改橫向捲動、不改 popup direct edit 入口。
- MFG 第三層才展開：
  - phase
  - CG
  - BG
  - FATP
  - Test
  - Hybrid
  - Auto
  - ENG Pack
  - Zombie
- Non-MFG 第三層才展開指定 department / demand unit 的 phase qty 明細。

## Business Terms

- `Item Quantity Review`：Dept DRI 下方 item-first review area，受 item switcher 控制。
- `Item Switcher`：切換當前 reviewer item 的控制列 / row picker。
- `MFG`：Item Unit Matrix 中的 aggregate 欄，等於該 item 的全部 MFG station、全部 phase 加總。
- `MFG Station Detail`：第三層，才展開 CG / BG / Zombie 等 station。
- `Non-MFG Department`：Non-MFG 最小需求單位，例如 FATP TE / WH / Q-LAB / IT / FAC。
- `Min Demand Unit`：
  - MFG = station。
  - Non-MFG = department / demand unit。
- `Need Date / Request Date`：
  - Requester 的 MFG worksheet 與 Non-MFG worksheet 要分開管理日期。
  - 不能把 MFG 和 Non-MFG 的 date 綁成同一個。

## Implementation Direction

### 要做

- Dept DRI 預設第一眼顯示 `Item Quantity Review`。
- 在 `Item Quantity Review` 內提供 item switcher，可切換 3 個以上 item。
- `Item Unit Matrix` 顯示 selected item 的 MFG aggregate 與 Non-MFG department totals。
- 切換 item 後，第二層與第三層都同步 selected item scope。
- 第三層沿用既有 `Quantity Detail Matrix`。
- direct edit popup、audit metadata、`stationBreakdown` 同步邏輯保留。
- direct edit 後要同步刷新：
  - selected item aggregate total。
  - 第二層 unit aggregate total。
  - 第三層 matrix total。

### 不要做

- 不要把第一層做成 dashboard card。
- 不要新增全 project / 全 item overview matrix。
- 不要用 overview table 取代 item switcher。
- 不要改第三層 Quantity Detail Matrix 的 shell / class / density / horizontal scroll。
- 不要因為 item switcher，就把單品明細 popup 或 station matrix 改掉。

## Suggested Module Boundary

- `ApprovalItemQuantityReview`
  - 產生 item-first switcher / row picker。
  - selection source = submitted request rows。
  - selected key = request row id。
  - 不產生全 project overview matrix。

- `ApprovalItemUnitMatrix`
  - 產生第二層單品 unit matrix。
  - row / columns 顯示 MFG aggregate + Non-MFG department totals。
  - click cell updates scope for third layer.

- Existing `QuantityDetailMatrix`
  - 繼續作第三層。
  - 不重寫。

## Test Requirements

### Contract Tests

- Dept DRI 第一眼出現 `Item Quantity Review`。
- Dept DRI 不出現 project-level overview matrix。
- Dept DRI 有 item switcher，切換 item 會更新 active scope。
- Item Unit Matrix 有 `MFG` aggregate 與 Non-MFG department columns。
- 第三層 `Quantity Detail Matrix` 的 id / class / shell / 文案保持不變。

### Flow Smoke

- Requester 模擬 3 個 item；每個 item MFG 10 筆、Non-MFG 10 筆，分散在不同 phase / department。
- Dept DRI item switcher 可切換 item。
- 切換 item 後進入第二層 item unit matrix。
- 點第二層 `MFG` 進第三層 MFG station / phase matrix。
- 點第二層 Non-MFG department 進第三層 department detail matrix。
- 第一層 approve / reject / modify 可操作。
- popup direct edit 後，三層 total 都同步。

## QA / Verification

- `./test.sh`
- Chrome QA：
  - Requester submit MFG + Non-MFG。
  - Dept DRI item switcher。
  - Verify MFG aggregate total。
  - Verify Non-MFG department total。
  - Drill item to second layer。
  - Drill MFG to third-layer matrix。
  - Open direct edit popup and save。
  - Verify totals refresh upward。
- Container smoke：
  - Build existing Dockerfile。
  - Run container with existing `PORT` behavior。
  - Check `/api/health`。
  - No new backend API and no DB migration.

## Skills Audit For Next Thread

- Skills considered:
  - `product-design:index`
  - `procurement-ui-quality-review`
  - `frontend-layout-stability`
  - `procurement-testing-standard-op`
  - `procurement-pm-memory-workflow`
- Skills applied:
  - `procurement-ui-quality-review`
  - `frontend-layout-stability`
  - `procurement-testing-standard-op`
- Skills not applied:
  - `procurement-agent-workflow`
- Reason:
  - This is a Dept DRI UI/module/test convergence task. The decision is now locked; next thread should implement directly and avoid redesigning the accepted matrix.

## One-Sentence Instruction For Next Codex Thread

Implement Dept DRI first-layer `Item Quantity Review` as the existing Excel-like Quantity Detail Matrix aggregated to all project items, with `MFG` as all-station/all-phase total and Non-MFG department columns, then drill to second-layer item unit matrix and only then to the unchanged third-layer Quantity Detail Matrix.
