# 測試標準操作

## 目的

本專案只使用一個標準測試入口，讓 UI、流程、商業邏輯 helper 的修改都用同一套方式驗證。

請在 prototype 根目錄執行：

```bash
./test.sh
```

## 測試分層

- `Syntax checks`：確認核心 JavaScript 檔案可被 Node 解析。
- `Unit tests`：確認 quote validity、currency display、dashboard aggregation 等 helper 邏輯。
- `System contract tests`：確認角色 tabs、表格契約、避免跨角色 UI 污染的 guardrails。
- `Browser smoke`：Playwright 可用時開啟 `index.html` 做基本瀏覽器檢查；若環境未安裝 Playwright，明確顯示 skipped 可接受。
- `Accessibility smoke`：Playwright + axe-core 可用時跑 WCAG 2 A/AA smoke；未安裝時明確顯示 skipped。
- `UI quality review`：依 `_doc/ui-quality-review.zh-TW.md` 檢查可讀性、注意力流、action clarity、設計一致性。

## 必須遵守

- 任何 code change 交付前都要跑 `./test.sh`。
- 角色 tabs、表頭、主導覽改動時，必須同步更新 `tests/system-contract.test.js`。
- 新增商業邏輯 helper 或計算規則時，必須補 unit test。
- 大版流程或 UI 結構調整時，必須新增或更新 `_doc/vx.y.md`。
- Browser smoke skipped 必須明確說明原因，不能當成隱形通過。
- UI 結構或文案調整時，必須用 `procurement-ui-quality-review` skill 做質化評估。
- Cost Manager 的 scoped `Dashboard` 不得回到錯誤 summary-card 視角；必須符合 Excel Dashboard 欄位邏輯。

## QA 入口提供規則

當 Kai 說「提供今天 QA 入口」時，預設意思是給同一個 Wi-Fi 內的 OM/QA 使用者連進 Kai 的 MacBook Pro 測試，不是只給本機 `localhost` 或 `127.0.0.1`。

標準操作：

1. 確認 prototype server 已啟動，且 listen 在可被區網連入的 `*:PORT` 或 `0.0.0.0:PORT`。
2. 取得 MacBook Pro 當下 Wi-Fi IP，例如 `ipconfig getifaddr en0`。
3. 提供 LAN URL，格式為 `http://<wifi-ip>:<port>/05-engineering-source/procurement-prototype/`。
4. 用 LAN URL 做一次 real execution HTTP 檢查，至少確認 `HTTP 200 OK`。
5. 回覆時明確說明這是給同 Wi-Fi OM/QA 使用，不是本機入口。

如果同 Wi-Fi 使用者仍無法連線，優先檢查 Mac 防火牆、公司 Wi-Fi client isolation、是否連到同一 SSID、以及 server 是否真的 listen 在 `localhost` 以外的位址。

## 目前專案 Guardrails

- Dept DRI tabs 固定為 `Review Queue / Project Review / Review History`。
- Cost Manager tabs 固定為 `Cost Review / Review History`，不得出現獨立 `Authorized Analysis / Demand Analysis / Progress Tracking / Project Setup`。
- Budget Approver tabs 固定為 `Review Queue / Project Review / Review History`。
- Dept DRI、Cost Manager、Budget Approver 的 Project Review evidence 都採 `Dashboard / MFG Station Detail / Non-MFG Department Detail` 三分頁，不顯示 carryover 主區塊或 queue table 主畫面。
- OM Purchasing tabs 固定為 `My Intake / My Quote Result / Quotation DB / My Exports`；OM Leader/Mai 不顯示 `My Quote Result` 操作 tab，Leader 看到 `Submission Dashboard / PAS Demand No / Quotation DB / OM Handoff`。
- Contact 是右上角 popup 輔助工具，不是 top-level tab。
- Temporary Budget input 只能出現在 OPM/User A `New Request`。
- UI quality review 標準文件固定為 `_doc/ui-quality-review.zh-TW.md` 與 `_doc/ui-quality-review.en.md`。

## 標準回報格式

測試結果請用以下格式回報：

```text
Syntax: pass/fail
Unit: pass/fail
System Contract: pass/fail
Browser Smoke: pass/skipped/fail
Accessibility Smoke: pass/skipped/fail
UI Quality: pass/fail
Notes: skipped reason or remaining risk
```
