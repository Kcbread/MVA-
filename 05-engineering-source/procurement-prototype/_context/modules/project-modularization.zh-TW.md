# 全專案模組化：最小上下文

## 本輪目的與邊界

2026-09-09 的工作是 **behavior-preserving implementation boundary 拆分**。Feature／Function（角色權責、送審鏈、搜尋與數量、價格、API、SQL、Excel-like 表格欄位／密度／計算）保持既有語意；Module 改成可定位及維護的 frontend ES modules／backend CommonJS factories。不是 fully decoupled aggregate redesign，也不是新產品能力、資料修復、DB migration 或部署。

已讀角色：Requester、Dept DRI、Cost Manager、OM Leader、OM Purchasing、Budget Approver、Admin、Buyer Handoff。角色及流程真相仍以各 [roles](../roles/) 文件、[主流程](../flows/pm-master-flow.zh-TW.md)、[table-role map](table-role-module-map.zh-TW.md)、[API readiness](api-readiness.zh-TW.md) 為準；不要由 folder 名稱推斷新的 ownership。

## 下一個 task 先讀

1. [完整逐檔 module-map](../../docs/module-map.md)：每個目前 module 的 ownership、代表 function／binding、維護 recipe、備份與 baseline。
2. [src/module-manifest.json](../../src/module-manifest.json)：有序 legacy unit 到現行 module 的索引；檔案與 actual exports 是 source of truth。
3. [後端 module-map](../../_doc/backend-module-map.md)：entry、application factories、routes／services／repositories、pool／memory state 生命週期。
4. [testing standard](../../_doc/testing-standard-op.zh-TW.md) 與本輪 test-artifacts；最終驗證狀態須看實際 logs，不因文件存在宣稱全部通過。

## Frontend runtime

- `app.js` 只是微型 entry，呼叫 `globalThis.ProcurementRuntime.start()`。
- `src/bootstrap/entry.js`：一次性 start guard → legacy bridge → `initializeApplication()`。
- `src/bootstrap/initialize.js`：保留原 seed／binding／listener／initial render 的有序呼叫；不要改成依目錄順序執行。
- `npm run build`：從 entry 產生 `dist/app.bundle.js`、map、hash manifest；`npm run build:check`：不寫檔的重建比對。
- `npm start` 的 prestart 使用 Node built-ins 檢查來源／產物 hashes，拒絕 stale bundle。直接 `node server.js` 不走 npm prestart；需自行檢查。
- 以 classic script bundle 保留 `file://` preview；`dist` 是 generated artifact，維護時改 `src`，不改 dist。
- `index.html` cache meta／所有本地 JS、CSS version 必須一起更新。

## Domain 快速定位

| Feature／角色 | 起點 |
| --- | --- |
| Requester Item Search／Catalog／Reuse／Copy Demand | `src/catalog/` |
| New Item 草稿／identity／material detail | `src/materials/` |
| Requester worksheet／draft／qty／submit／amendment | `src/demand/` |
| Dept DRI／Cost／Budget review 與 direct quantity edit | `src/approval/` |
| 受保護 dashboard／matrix／currency／price evidence | `src/cost/` |
| OM assignment／PAS／Quote／Quotation DB／tracking | `src/om/` |
| Calendar／project／phase／scope；需求進度 | `src/projects/`、`src/progress/` |
| Warehouse／carryover evidence | `src/inventory/` |
| Excel／PAS／handoff files；Buyer read-only boundary | `src/exports/`、`src/handoff/` |
| RFQ／buyer routing／MFG sourcing | `src/sourcing/` |
| Admin／session；API transport | `src/admin/`、`src/session/`、`src/infrastructure/` |
| Navigation／events／dialogs；小工具／seed／status | `src/shell/`、`src/shared/`、`src/data/`、`src/workflow/` |
| Legacy integrations；初始化 | `src/compat/`、`src/bootstrap/` |

`shell/events.js` 保留 registration composition，click／change／input dispatch 保留原順序，具體行為在 domain `events-*-handlers.js`。新增 handler 不得無意改變原 capture／bubble、return、preventDefault 或共用事件的執行順序。

## 不能誤讀的架構限制

- `replace*Binding`／`advance*Binding` 是機械 live-owner assignment 邊界，不是經業務驗證的 commands。權限、validation、audit、狀態路由仍在既有 domain function。
- Shared request rows、cross-domain static imports／部分循環關係仍保留；沒有完成 aggregate／transaction／API DTO 的全面重新設計。
- `compat/legacy-global.js` 保留 browser tests／extensions 的 live getter／setter 及函式 monkeypatch。新 domain 不應把它當 window state bus。
- 原有 `app-modules/` 已獨立封裝並繼續重用；`real-data-seeds.js`／`requester-responsibility-data.js` 是資料，不因檔案大就視為未拆業務 monolith。
- Backend API URL、權限、response、SQL／bind expressions 保留；這輪沒有順便調 SQL search／detail，也沒有 real MySQL migration／import。
- Source-contract helper 讀現行 module／manifest，檢查 missing／duplicate／moved units；不是讀凍結備份。後續新行為應補 executable tests。

## 驗證與既有風險

在 prototype 根目錄 Windows PowerShell 執行：

```powershell
npm run build
npm run build:check
$env:DEMO_BROWSER_CHANNEL = 'msedge'
& 'C:\Program Files\Git\bin\bash.exe' ./test.sh
```

NO GIT：只借用上述 Bash 執行測試，不執行 Git status／branch／worktree／commit／push。

- 備份：`test-artifacts/modularization-backup/frontend/`；`test-artifacts/modularization-backup/backend/server.js`。禁止未確認就以 backup 覆蓋後續修改；不重跑一次性機械抽取工具。
- Baseline 完整 log：`test-artifacts/modularization-baseline-qa-20260909-105416.log`。
- **PREEXISTING** layout failure：OM Quote Result rows 126／121px 超過 118px 上限；完整入口會提前停止。
- **PREEXISTING** role-flow failure：`Cost Manager shell missing /Review History/`。
- 原 backup 與新來源皆存在的 **PREEXISTING undefined integration risks**：`LV_TAXONOMY_SOURCE`、`clean`、`todayIso`、`requestCarryoverLine`、`omIsOverSla`；可選 `formatCurrency` 有 typeof guard／fallback。逐檔位置與 backup 行號見完整 module-map。它們未在本輪改 business behavior 或被宣稱修復。
- 若完整 suite 提前停止，另跑 price-routing／global-ui／role-flow／accessibility smoke，逐项回報 pass／fail／skipped；不可把未跑視為通過。最終 test counts 留待主線整合驗證。

## Compact Handoff

Findings：前後端 implementation ownership 已有具名檔案與 composition entry，可從 module-map 精準定位；資料／角色規則沿用。

Decision：只拆 implementation boundary；不擴大業務、SQL、UI scope；NO GIT。

Risk：仍有 shared row／cross-domain coupling；既有兩類 browser baseline failures 與 undefined integration references；final integration result 以 logs 為準。

Next：依 feature／function 選 domain；改 actual source → build → build:check → 標準測試及受影響 browser flow → 更新 manifest／必要 docs。
