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
- Manager B `Cost Dashboard` 不得回到錯誤 summary-card 視角；必須符合 Excel Dashboard 欄位邏輯。

## 目前專案 Guardrails

- Manager B tabs 固定為 `Approval / Demand Analysis / Progress Tracking / Project Setup`。
- Manager `Demand Analysis` 第一層固定為 `Cost Dashboard`，第二層才是 `Station Matrix`。
- OM Purchasing tabs 固定為 `Submission Dashboard / PAS Demand No / PAS Quote Result / Export Package`。
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
