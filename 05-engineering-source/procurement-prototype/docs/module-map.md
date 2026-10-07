# 專案模組維護地圖

本文件對應 2026-09-09 本機模組拆分；詳細來源為 [module-manifest.json](../src/module-manifest.json) 與實際 `src/**/*.js`。下方逐檔清單於文件撰寫時含 209 個 JavaScript 檔案（含 entry 與 event split）；後續增刪檔以實際來源為準，不以數量作完成判準。

## 邊界與非目標

- Feature：所有既有角色工作流程維持原狀；Requester、Dept DRI、Cost Manager、OM Leader、OM Purchasing、Budget Approver、Admin、Buyer Handoff 的責任不因目錄命名而改變。
- Function：搜尋、需求數量、送審、價格路由、派工、追蹤、API、SQL／bind arguments、欄位、Excel-like 密度與計算語意不在本次重設計範圍。
- Module：原本 `app.js` implementation 移入具名 ES modules，server implementation 分成 CommonJS factories／routes／services／repositories。這不是把整段原檔放進另一個巨型 wrapper。
- Non-scope：沒有 fully decoupled aggregates、獨立 domain data model／transaction redesign、業務規則修復、真實 DB migration、資料匯入或部署。跨 domain static imports、既有循環依賴和共享 request row object contract 仍存在；拆成檔案不等於完全解耦。
- Validation：build freshness、模組 syntax／依賴、unit／contract／API、file:// 與 Node-hosted browser checks；最終結果由本輪 verification logs 提供，不在此預填通過數量。

## Runtime 與建置

`index.html` 先載入既有 seed／app-modules，再載入 `dist/app.bundle.js`、微型 `app.js` entry 及原 extension scripts。

1. [src/bootstrap/entry.js](../src/bootstrap/entry.js) 匯出具一次性 guard 的 `start()`，先安裝 legacy bridge，再呼叫初始化。
2. [src/bootstrap/initialize.js](../src/bootstrap/initialize.js) 明列原始順序的 binding initializer／startup steps；不要只依目錄字母順序執行，也不要讓 module import 偷做原本較晚的 DOM side effect。
3. [app.js](../app.js) 只確認 bundle 存在並呼叫 `globalThis.ProcurementRuntime.start()`。
4. [scripts/build-frontend.cjs](../scripts/build-frontend.cjs) 用 esbuild 從 entry 建立 classic IIFE、linked source map、`dist/build-manifest.json`。這保留直接開啟 `file://.../index.html` 的能力；不要把 HTML 改成直接載入瀏覽器 ESM。
5. `npm run build` 更新 generated dist；`npm run build:check` 不寫檔，重新建置並比對 artifact／manifest。**只改 src；不得手改 dist**。
6. `npm start` 的 `prestart` 執行 [verify-frontend-artifact.cjs](../scripts/verify-frontend-artifact.cjs)，用 Node built-ins 比對 manifest 中來源與產物 SHA-256；缺失或過期時拒絕啟動，即使 `npm ci --omit=dev` 也可執行。直接 `node server.js` 不經 npm lifecycle；維護人員仍須明確執行 guard／build check。
7. 若 frontend runtime 變更，同步更新 `index.html` 的 `mva-local-preview-version` 與所有 local JS／CSS cache keys。hash guard 不取代瀏覽器 cache-version 規則。

`src/package.json` 宣告 ESM；根 package 保持 CommonJS。正式 Node API 入口及 ownership 請讀 [後端模組維護地圖](../_doc/backend-module-map.md)。後端 source 不可加入 public static allowlist；frontend 經 HTTP API，不直接連 MySQL。

## State、事件與相容邊界

- Domain functions 使用具名 import／export。共享集合／UI selection 仍依原行為存在，不是假裝成全新 aggregate。
- `replace*Binding(value)`／`advance*Binding(...)` 是**機械性的 live-owner assignment 邊界**：讓 import consumer 能更新 owner module 的 binding。它們不是已驗證的業務 command、權限 guard、audit／transaction API；不要因 setter 名稱而跳過原有 validate／approve／submit function。
- [compat/legacy-global.js](../src/compat/legacy-global.js) 用 getter／必要 setter 保留 legacy extension 與 browser QA 所用名稱。它不是新 module 的 data bus；domain code 應靜態 import，不透過 window 取回自身依賴。
- 相容寫入包括 `requests`、`currentProject`、`currentRole`、`currentRequesterPersonaId`、`selectedProjectStatusScope`、`approvalQuantityReviewTab`，以及測試覆寫的 `apiModeEnabled`／`apiRequest`。不得用一次性的值複製取代 live binding。
- `shell/events.js` 保留 registration composition；`shell/events-click.js`／`events-change.js`／`events-input.js` 依原順序 dispatch，實際 handler 位於各 domain 的 `events-*-handlers.js`。保留 listener registration、capture／bubble、return／preventDefault 的既有語意。
- `user-a-flow.js` 與 `layout-contract.js` 主要是 DOM augmentation；`carryover-extension.js` 還有 ledger API／event 與角色偵測。不能只看編譯通過就刪掉它們。
- 既有 [app-modules/](../app-modules/) 的 role guards、quantity review、price decision、workflow status、SAP PO importer 等已獨立封裝，繼續被 [module-adapters.js](../src/infrastructure/module-adapters.js)／相關 domain 使用。
- `real-data-seeds.js` 是資料 fixture，`requester-responsibility-data.js` 是 mapping 資料；資料檔體積不等於尚未拆分的業務程式 monolith。本輪不改其資料語意。

## 常用維護 recipe

先讀 [_context/README.zh-TW.md](../_context/README.zh-TW.md)、對應角色與 flow，再界定 feature／function／module。

| 需求 | 先看來源 | 驗證／不可越界 |
| --- | --- | --- |
| Item Search／Add Item／Reuse | `catalog/search.js`、`match.js`、`search-actions.js`、`context.js`、`events-*.js`；API taxonomy 看 `catalog/taxonomy.js` | 保留 Requester-safe 欄位、分組匹配、來源 trace、加入 qty=0；跑 new-item 與 requester draft smoke。SQL 搜尋／detail 不在本輪調整。 |
| New Item 草稿→worksheet | `materials/new-item.js`、`entry-view.js`、`events-forms.js`、`demand-conversion.js`；接 `demand/worksheet-actions.js`、`drafts.js` | 保留 Pending Material Review、reload／discard／移除／送出不重複；勿直接新增 active item master。 |
| 需求 qty／日期／Submit | `demand/worksheet.js`、`quantity.js`、`request-fields.js`、`submit.js`、`projects/dates.js` | 保留 phase／station／line scope、每 item Required Delivery Date、Save Draft 與 Submit 差異。 |
| Dept／Cost／Budget approval | `approval/decisions.js`、`routing.js`、`status.js`、`quantity-review.js`、`quantity-scope.js`；evidence 在 `cost/*` | 保留 chain、audit、row scope、欄位與數字；跑 price-routing、role-flow、layout；不得順便重做受保護 dashboard。 |
| OM assignment／Quote／Tracking | `om/assignment.js`、`quote-actions.js`、`quote-rules.js`、`hydration.js`、`tracking-actions.js`；`exports/pas.js` | Leader assignment/calendar 與 Purchasing assigned-row 操作分開；API hydrate 空值仍具 authoritative 語意；保留 API failure 提示。 |
| API／SQL | `infrastructure/api.js` → `server-modules/*-routes.js` → service → repository；詳後端地圖 | API URL、role guard、response shape、SQL 查詢與 bind 順序未作業務調整；不可藉模組整理修改 SQL detail／search。真實 MySQL E2E 需另有環境及授權。 |

新增或移動已標記的 unit 時，同步更新 `src/module-manifest.json` 的 module／index metadata；維護來源是實際 module，不是備份。
`tests/helpers/read-application-source.js` 只重建原宣告順序供 bounded source contracts 查詢，並附加未標記的新增模組內容；missing／duplicate／moved units 必須 fail。它不會把實際 setter 偽裝回舊 assignment。新 feature 應優先用可執行 unit／integration test，而非擴大來源 regex。
機械抽取工具是搬移記錄，不是日常產碼入口；不可重跑它覆蓋後续人工維護的模組。

## 驗證、備份與已知 baseline

在 prototype 根目錄的 Windows PowerShell：

```powershell
npm run build
npm run build:check
$env:DEMO_BROWSER_CHANNEL = 'msedge'
& 'C:\Program Files\Git\bin\bash.exe' ./test.sh
```

這是呼叫 Git 安裝包附帶的 Bash 執行測試，**不是執行 Git 命令**。本專案 NO GIT：不跑 status／branch／commit／worktree／push。
若 `test.sh` 被既有 layout failure 中止，另跑 `node tests/price-routing-smoke.js`、`node tests/global-ui-audit.js`、`node tests/role-flow-smoke.js`、`node tests/accessibility-smoke.js`；逐項記錄 pass／fail／skipped，不把「未執行」算通過。

- 搬移前備份：`test-artifacts/modularization-backup/frontend/`（app.js、index.html、package.json、package-lock.json、test.sh）及 `test-artifacts/modularization-backup/backend/server.js`。備份不是日常 editable source，也不是覆蓋後續修改的授權。
- 完整原始 baseline log：`test-artifacts/modularization-baseline-qa-20260909-105416.log`。
- 分項 baseline logs：`test-artifacts/modularization-baseline-{price-routing-smoke,global-ui-audit,role-flow-smoke,accessibility-smoke}-20260909-qa.log`。
- **拆分前已存在**：`tests/layout-smoke.js` 在 OM Quote Result 偵測 row 2 = 126px、rows 3／4／10 = 121px，超出 34–118px；完整 test.sh 因此提前停止。
- **拆分前已存在**：`tests/role-flow-smoke.js` 回報 `Cost Manager shell missing /Review History/`。不得把 baseline 問題改期待值當作模組化修復；是否修 UI／測試需另行判斷。
- 下表名稱在原 backup 與新來源皆可定位，是 **PREEXISTING undefined integration risks**，不是本輪新增需求或已修復事項；部分路徑受條件／fallback 保護，未宣稱所有路徑都會失敗。

| 名稱 | 目前呼叫位置 | 原 backup app.js 行 |
| --- | --- | --- |
| `LV_TAXONOMY_SOURCE` | `catalog/taxonomy.js` fallback | 410 |
| `clean` | `demand/matrix-view.js` department normalizer | 5090 |
| `todayIso` | `cost/matrix-view.js` days pending | 9034 |
| `requestCarryoverLine` | `inventory/warehouse.js` candidate source line | 10567 |
| `omIsOverSla` | `om/progress-view.js` risk／score | 16571、16586 |
| 可選 `formatCurrency` | `cost/budget-enhancer.js`，有 typeof guard／fallback | 26898 |

## 逐檔 ownership 地圖

以下每一列對應實際 module；代表 symbols 從現在的 exports／manifest 讀取。事件 handlers 不因沒有 legacy unit index 就不算可維護來源。

### admin/

Admin 設定、角色權限、匯入面板與 audit。下列 symbols 是定位入口，不是該檔案全部 exports。

| Module（src/ 下） | Ownership | 代表入口／binding |
| --- | --- | --- |
| [admin/audit.js](../src/admin/audit.js) | Admin 設定、角色權限、匯入面板與 audit | `pushAdminAuditEvent` |
| [admin/events-change-handlers.js](../src/admin/events-change-handlers.js) | 原有 DOM 事件處理；業務判斷沿用被呼叫的 domain function | `handleChangeAdminUserField`、`handleChangeAdminRolePermission`、`handleChangeAdminFieldKey` |
| [admin/events-click-handlers.js](../src/admin/events-click-handlers.js) | 原有 DOM 事件處理；業務判斷沿用被呼叫的 domain function | `handleClickSaveAdminApprovalSetup`、`handleClickCreateAdminUser`、`handleClickImportAdminUsers` |
| [admin/import-view.js](../src/admin/import-view.js) | Admin 設定、角色權限、匯入面板與 audit | `renderSapPoRawImportPanel`、`renderAdminPasDemandRequirementMaster`、`refreshSapPoRawImportStatus` |
| [admin/permissions.js](../src/admin/permissions.js) | Admin 設定、角色權限、匯入面板與 audit | `adminRoleGuards`、`adminRoleDefinitions`、`adminPermissionModules` |
| [admin/setup.js](../src/admin/setup.js) | Admin 設定、角色權限、匯入面板與 audit | `roleOptionsHtml`、`scopeTypeOptionsHtml`、`normalizeAdminUserRow` |
| [admin/state.js](../src/admin/state.js) | 此 domain 的 live bindings／既有狀態 | `adminApprovalSetup`、`adminAuditFilters`、`OM_EXPORTED_CFA` |

### approval/

Dept DRI／Cost Manager／Budget Approver queue、scope、審核與 quantity review。下列 symbols 是定位入口，不是該檔案全部 exports。

| Module（src/ 下） | Ownership | 代表入口／binding |
| --- | --- | --- |
| [approval/analysis-scope.js](../src/approval/analysis-scope.js) | Dept DRI／Cost Manager／Budget Approver queue、scope、審核與 quantity review | `isPriceReviewAnalysisRole`、`isPriceReviewInlineAnalysisRole`、`priceReviewAnalysisDomIds` |
| [approval/analysis-view.js](../src/approval/analysis-view.js) | Dept DRI／Cost Manager／Budget Approver queue、scope、審核與 quantity review | `updatePriceReviewAnalysisScopeLabel`、`updatePriceReviewInlineScopeLabel`、`setApprovalQuantityDashboardScopeLabel` |
| [approval/audit-view.js](../src/approval/audit-view.js) | Dept DRI／Cost Manager／Budget Approver queue、scope、審核與 quantity review | `timelineFor`、`managerAuditTimelineEvents`、`managerAuditTimelineHtml` |
| [approval/decisions.js](../src/approval/decisions.js) | Dept DRI／Cost Manager／Budget Approver queue、scope、審核與 quantity review | `applyPriceReviewDecision`、`applyCostManagerAuthorization`、`applyManagerReviewDecision` |
| [approval/events-change-handlers.js](../src/approval/events-change-handlers.js) | 原有 DOM 事件處理；業務判斷沿用被呼叫的 domain function | `handleChangePriceReviewDemandCostProjectFilter`、`handleChangePriceReviewQuantityProjectFilter`、`handleChangeDriDateField` |
| [approval/events-click-handlers.js](../src/approval/events-click-handlers.js) | 原有 DOM 事件處理；業務判斷沿用被呼叫的 domain function | `handleClickPriceReviewTab`、`handleClickClearPriceReviewDemandCostFilters`、`handleClickCloseItemQuantityReview` |
| [approval/events-quantity-input.js](../src/approval/events-quantity-input.js) | 原有 DOM 事件處理；業務判斷沿用被呼叫的 domain function | 見檔案 exports／registration |
| [approval/hydration.js](../src/approval/hydration.js) | Dept DRI／Cost Manager／Budget Approver queue、scope、審核與 quantity review | `reviewWorkflowApiRoles`、`normalizeWorkflowReviewBreakdown`、`ensureProjectConfigForWorkflowRow` |
| [approval/manager-view.js](../src/approval/manager-view.js) | Dept DRI／Cost Manager／Budget Approver queue、scope、審核與 quantity review | `renderManager` |
| [approval/navigation.js](../src/approval/navigation.js) | Dept DRI／Cost Manager／Budget Approver queue、scope、審核與 quantity review | `approvalReviewSurfaceModule`、`approvalReviewConfigForRole`、`isManagerReviewRole` |
| [approval/price-review.js](../src/approval/price-review.js) | Dept DRI／Cost Manager／Budget Approver queue、scope、審核與 quantity review | `priceReviewPendingRowsForRole`、`priceReviewHistoryRows`、`priceVarianceLabel` |
| [approval/quantity-review.js](../src/approval/quantity-review.js) | Dept DRI／Cost Manager／Budget Approver queue、scope、審核與 quantity review | `itemQuantityReviewActionButtons`、`itemReviewHistory`、`itemReviewDraft` |
| [approval/quantity-scope.js](../src/approval/quantity-scope.js) | Dept DRI／Cost Manager／Budget Approver queue、scope、審核與 quantity review | `quantityReviewModeValue`、`quantityReviewModeLabel`、`approvalQuantityReviewTabValue` |
| [approval/queue-view.js](../src/approval/queue-view.js) | Dept DRI／Cost Manager／Budget Approver queue、scope、審核與 quantity review | `pendingWorkActionButtons`、`pendingWorkIdentityHtml`、`managerAffectedPhasesText` |
| [approval/queues.js](../src/approval/queues.js) | Dept DRI／Cost Manager／Budget Approver queue、scope、審核與 quantity review | `managerRows`、`priceReviewSubmissionRows`、`priceReviewExceptionRows` |
| [approval/routing.js](../src/approval/routing.js) | Dept DRI／Cost Manager／Budget Approver queue、scope、審核與 quantity review | `managerNextStep`、`temporaryBudgetOmQuoteRoutingPatch`、`omLeaderIntakeRoutingPatch` |
| [approval/state.js](../src/approval/state.js) | 此 domain 的 live bindings／既有狀態 | `currentDemandAnalysisTab`、`selectedManagerQuantityKeyId`、`expandedManagerQuantityRows` |
| [approval/status.js](../src/approval/status.js) | Dept DRI／Cost Manager／Budget Approver queue、scope、審核與 quantity review | `priceReviewRequiresBudgetApprover`、`isDeptDriSubmissionPending`、`isCostManagerAuthorizationPending` |
| [approval/viewport.js](../src/approval/viewport.js) | Dept DRI／Cost Manager／Budget Approver queue、scope、審核與 quantity review | `preserveApprovalViewport`、`nextApprovalSelection`、`restoreApprovalViewport` |

### bootstrap/

單一啟動入口、初始化呼叫順序與初次 render。下列 symbols 是定位入口，不是該檔案全部 exports。

| Module（src/ 下） | Ownership | 代表入口／binding |
| --- | --- | --- |
| [bootstrap/entry.js](../src/bootstrap/entry.js) | 單一啟動入口、初始化呼叫順序與初次 render | `start` |
| [bootstrap/initialize.js](../src/bootstrap/initialize.js) | 保留原有 seed、狀態、listener、render 初始化順序 | 見檔案 exports／registration |
| [bootstrap/startup.js](../src/bootstrap/startup.js) | 原有 startup side effects | 見檔案 exports／registration |

### catalog/

Requester Item Search、Catalog／Reuse／Copy Demand、taxonomy 與匹配。下列 symbols 是定位入口，不是該檔案全部 exports。

| Module（src/ 下） | Ownership | 代表入口／binding |
| --- | --- | --- |
| [catalog/add-actions.js](../src/catalog/add-actions.js) | Requester Item Search、Catalog／Reuse／Copy Demand、taxonomy 與匹配 | `addRecord`、`addHistoryRecord` |
| [catalog/context.js](../src/catalog/context.js) | Requester Item Search、Catalog／Reuse／Copy Demand、taxonomy 與匹配 | `syncItemPickerDemandContext`、`itemPickerDemandContext`、`itemPickerTargetText` |
| [catalog/events-change-handlers.js](../src/catalog/events-change-handlers.js) | 原有 DOM 事件處理；業務判斷沿用被呼叫的 domain function | `handleChangeNaturalLevel1`、`handleChangeHistorySourceProject`、`handleChangeHistoryId` |
| [catalog/events-click-handlers.js](../src/catalog/events-click-handlers.js) | 原有 DOM 事件處理；業務判斷沿用被呼叫的 domain function | `handleClickReuseModeTab`、`handleClickNaturalSearch`、`handleClickHistorySearch` |
| [catalog/events-search.js](../src/catalog/events-search.js) | 原有 DOM 事件處理；業務判斷沿用被呼叫的 domain function | 見檔案 exports／registration |
| [catalog/history-view.js](../src/catalog/history-view.js) | Requester Item Search、Catalog／Reuse／Copy Demand、taxonomy 與匹配 | `syncReuseModeTabs`、`reusableHistoryRows`、`sourcePhaseForHistory` |
| [catalog/match.js](../src/catalog/match.js) | Requester Item Search、Catalog／Reuse／Copy Demand、taxonomy 與匹配 | `itemNameMatchRank`、`itemMatchHighlight`、`materialDuplicateCandidateRows` |
| [catalog/natural-search-view.js](../src/catalog/natural-search-view.js) | Requester Item Search、Catalog／Reuse／Copy Demand、taxonomy 與匹配 | `renderNaturalRows` |
| [catalog/records.js](../src/catalog/records.js) | Requester Item Search、Catalog／Reuse／Copy Demand、taxonomy 與匹配 | `omCatalogRecord`、`omCatalogRows`、`isOmCatalogRow` |
| [catalog/reuse.js](../src/catalog/reuse.js) | Requester Item Search、Catalog／Reuse／Copy Demand、taxonomy 與匹配 | `cloneReusableDemandRows`、`reusableReferenceFields`、`historyRequestOverrides` |
| [catalog/search-actions.js](../src/catalog/search-actions.js) | Requester Item Search、Catalog／Reuse／Copy Demand、taxonomy 與匹配 | `runNaturalSearch`、`filterRecordsFromControls`、`runHistorySearch` |
| [catalog/search.js](../src/catalog/search.js) | Requester Item Search、Catalog／Reuse／Copy Demand、taxonomy 與匹配 | `requestWorksheetSourceBadge`、`requestWorksheetSourceHaystack`、`requesterPickerSpec` |
| [catalog/state.js](../src/catalog/state.js) | 此 domain 的 live bindings／既有狀態 | `itemPickerDemandType`、`itemPickerStage`、`itemPickerStation` |
| [catalog/taxonomy.js](../src/catalog/taxonomy.js) | Requester Item Search、Catalog／Reuse／Copy Demand、taxonomy 與匹配 | `buildTaxonomy`、`buildTaxonomyFromOmMaster`、`lvTaxonomyTreeFromApiRows` |

### compat/

既有 extension／瀏覽器測試需要的 live global 相容介面。下列 symbols 是定位入口，不是該檔案全部 exports。

| Module（src/ 下） | Ownership | 代表入口／binding |
| --- | --- | --- |
| [compat/legacy-global.js](../src/compat/legacy-global.js) | 既有 extension／瀏覽器測試需要的 live global 相容介面 | `installLegacyGlobals` |

### cost/

受保護的成本／數量 dashboard、matrix、價格及匯率。下列 symbols 是定位入口，不是該檔案全部 exports。

| Module（src/ 下） | Ownership | 代表入口／binding |
| --- | --- | --- |
| [cost/actual-buy.js](../src/cost/actual-buy.js) | 受保護的成本／數量 dashboard、matrix、價格及匯率 | `exactActualBuyRecord`、`renderActualBuyUpdate`、`renderActualBuySummary` |
| [cost/budget-cleanup.js](../src/cost/budget-cleanup.js) | 受保護的成本／數量 dashboard、matrix、價格及匯率 | 見檔案 exports／registration |
| [cost/budget-enhancer.js](../src/cost/budget-enhancer.js) | 受保護的成本／數量 dashboard、matrix、價格及匯率 | 見檔案 exports／registration |
| [cost/currency.js](../src/cost/currency.js) | 受保護的成本／數量 dashboard、matrix、價格及匯率 | `activeExchangeRateMonth`、`exchangeRateRecord`、`latestPreviousExchangeRateRecord` |
| [cost/dashboard-data.js](../src/cost/dashboard-data.js) | 受保護的成本／數量 dashboard、matrix、價格及匯率 | `managerDemandCostFilters`、`syncManagerDemandCostFilters`、`managerDemandCostRows` |
| [cost/dashboard-values.js](../src/cost/dashboard-values.js) | 受保護的成本／數量 dashboard、matrix、價格及匯率 | `managerDemandCostCellQty`、`managerDemandCostAmount`、`managerDemandCostCellImpact` |
| [cost/dashboard-view.js](../src/cost/dashboard-view.js) | 受保護的成本／數量 dashboard、matrix、價格及匯率 | `renderManagerDemandCostLineCompare`、`renderManagerDemandCostUnitSummary`、`renderManagerDemandCostHead` |
| [cost/demand-metrics.js](../src/cost/demand-metrics.js) | 受保護的成本／數量 dashboard、matrix、價格及匯率 | `previousStageKeys`、`demandComparable`、`baselineFor` |
| [cost/detail-view.js](../src/cost/detail-view.js) | 受保護的成本／數量 dashboard、matrix、價格及匯率 | `managerDetailMode`、`managerDetailSameItemRows`、`managerDetailStationQty` |
| [cost/events-change-handlers.js](../src/cost/events-change-handlers.js) | 原有 DOM 事件處理；業務判斷沿用被呼叫的 domain function | `handleChangeManagerProjectFilter`、`handleChangeManagerDemandCostProjectFilter`、`handleChangeManagerQuantityProjectFilter` |
| [cost/events-click-handlers.js](../src/cost/events-click-handlers.js) | 原有 DOM 事件處理；業務判斷沿用被呼叫的 domain function | `handleClickManagerTab`、`handleClickClearManagerProgressFilters`、`handleClickImportActualBuyExcel` |
| [cost/exchange-rate-view.js](../src/cost/exchange-rate-view.js) | 受保護的成本／數量 dashboard、matrix、價格及匯率 | `renderOmExchangeRatePanel`、`canMaintainOmExchangeRate`、`saveOmExchangeRate` |
| [cost/manager-dashboard.js](../src/cost/manager-dashboard.js) | 受保護的成本／數量 dashboard、matrix、價格及匯率 | `reviewedRows`、`renderManagerDashboard`、`openManagerDashboardPhaseDetail` |
| [cost/matrix-data.js](../src/cost/matrix-data.js) | 受保護的成本／數量 dashboard、matrix、價格及匯率 | `managerQuantityGroupKey`、`createManagerQuantityGroup`、`formatVnd` |
| [cost/matrix-view.js](../src/cost/matrix-view.js) | 受保護的成本／數量 dashboard、matrix、價格及匯率 | `renderManagerQuantityHead`、`renderManagerQuantityMatrix`、`clearManagerQuantityFilters` |
| [cost/price-decision.js](../src/cost/price-decision.js) | 受保護的成本／數量 dashboard、matrix、價格及匯率 | `quoteUnitPriceUsdForDecision`、`historyUnitPriceUsdForDecision`、`isTemporaryBudgetRequest` |
| [cost/pricing.js](../src/cost/pricing.js) | 受保護的成本／數量 dashboard、matrix、價格及匯率 | `managerCostRows`、`effectiveUnitPrice`、`sourcingInitialPrice` |
| [cost/quantity-dashboard.js](../src/cost/quantity-dashboard.js) | 受保護的成本／數量 dashboard、matrix、價格及匯率 | `quantityDashboardHeatClass`、`managerUnitSplitSettings`、`unitSplitDisplayValue` |
| [cost/quantity-filters.js](../src/cost/quantity-filters.js) | 受保護的成本／數量 dashboard、matrix、價格及匯率 | `selectedManagerReviewRowForQuantityScope`、`managerQuantitySourceRows`、`managerQuantityRequestLine` |
| [cost/stage-view.js](../src/cost/stage-view.js) | 受保護的成本／數量 dashboard、matrix、價格及匯率 | `renderStageDemandRows`、`stageSummaryCards`、`summaryCardsHtml` |
| [cost/state.js](../src/cost/state.js) | 此 domain 的 live bindings／既有狀態 | `currencyDisplay`、`monthlyExchangeRates` |

### data/

既有 seed record 建構與共用資料集合。下列 symbols 是定位入口，不是該檔案全部 exports。

| Module（src/ 下） | Ownership | 代表入口／binding |
| --- | --- | --- |
| [data/demo-seeds.js](../src/data/demo-seeds.js) | 既有 seed record 建構與共用資料集合 | `seedOmHistory`、`seedCoordinatorComputerData`、`seedOmDemoData` |
| [data/purchase-records.js](../src/data/purchase-records.js) | 既有 seed record 建構與共用資料集合 | `makePurchaseRecords`、`realMvaPurchaseRecords` |
| [data/state.js](../src/data/state.js) | 此 domain 的 live bindings／既有狀態 | `purchaseRecords`、`vendorMaterialMappings`、`demandBaselines` |

### demand/

Requester worksheet、需求草稿、quantity、送出與修訂。下列 symbols 是定位入口，不是該檔案全部 exports。

| Module（src/ 下） | Ownership | 代表入口／binding |
| --- | --- | --- |
| [demand/amendments.js](../src/demand/amendments.js) | Requester worksheet、需求草稿、quantity、送出與修訂 | `requesterVisibleStatusLabel`、`omUserQuoteDecisionLabel`、`amendmentVersion` |
| [demand/baseline-setup.js](../src/demand/baseline-setup.js) | Requester worksheet、需求草稿、quantity、送出與修訂 | `renderBaselineSetup`、`renderBaselineSummary`、`importBaselineExcel` |
| [demand/baselines.js](../src/demand/baselines.js) | Requester worksheet、需求草稿、quantity、送出與修訂 | `demandKey`、`makeDemandBaselines`、`makeActualBuyRecords` |
| [demand/drafts.js](../src/demand/drafts.js) | Requester worksheet、需求草稿、quantity、送出與修訂 | `requesterLocalDraftKey`、`readRequesterLocalDrafts`、`persistRequesterLocalDrafts` |
| [demand/editor.js](../src/demand/editor.js) | Requester worksheet、需求草稿、quantity、送出與修訂 | `demandEditorRowsFor`、`openDemandEditor`、`closeDemandEditor` |
| [demand/events-change-handlers.js](../src/demand/events-change-handlers.js) | 原有 DOM 事件處理；業務判斷沿用被呼叫的 domain function | `handleChangeItemPickerDemandTypeSelect`、`handleChangeDeptDemandMode`、`handleChangeSelectRequest` |
| [demand/events-click-handlers.js](../src/demand/events-click-handlers.js) | 原有 DOM 事件處理；業務判斷沿用被呼叫的 domain function | `handleClickRequestWorksheetTab`、`handleClickDemandAnalysisTab`、`handleClickOpenRequestItemPicker` |
| [demand/events-input-handlers.js](../src/demand/events-input-handlers.js) | 原有 DOM 事件處理；業務判斷沿用被呼叫的 domain function | `handleInputRequestItemPickerQuery`、`handleInputRequestActionOther`、`handleInputDemandEditorId` |
| [demand/events-keyboard.js](../src/demand/events-keyboard.js) | 原有 DOM 事件處理；業務判斷沿用被呼叫的 domain function | 見檔案 exports／registration |
| [demand/intent.js](../src/demand/intent.js) | Requester worksheet、需求草稿、quantity、送出與修訂 | `normalizeRequestAction`、`requestActionValue`、`requestActionOtherTextValue` |
| [demand/matrix-view.js](../src/demand/matrix-view.js) | Requester worksheet、需求草稿、quantity、送出與修訂 | `normalizedNonMfgDepartment`、`stationDisplay`、`managerLineDepartment` |
| [demand/quantity.js](../src/demand/quantity.js) | Requester worksheet、需求草稿、quantity、送出與修訂 | `clampQty`、`totalQty`、`stageQtyText` |
| [demand/quote-confirmation.js](../src/demand/quote-confirmation.js) | Requester worksheet、需求草稿、quantity、送出與修訂 | `confirmUserAOmQuote`、`cancelUserAOmQuote`、`createUserAAmendmentDraft` |
| [demand/records.js](../src/demand/records.js) | Requester worksheet、需求草稿、quantity、送出與修訂 | `dateOfRequestForRow`、`normalizeRequesterDateFields`、`requestFromRecord` |
| [demand/request-fields.js](../src/demand/request-fields.js) | Requester worksheet、需求草稿、quantity、送出與修訂 | `activeProjectRequests`、`canRequesterEditRequest`、`needDateForRow` |
| [demand/selected-lines.js](../src/demand/selected-lines.js) | Requester worksheet、需求草稿、quantity、送出與修訂 | `selectedDemandLineRows`、`selectedDemandLineContext`、`renderSelectedDemandLines` |
| [demand/state.js](../src/demand/state.js) | 此 domain 的 live bindings／既有狀態 | `expandedDemandEditorCarryoverRows`、`currentDeptDemandMode`、`currentDeptDemandPhase` |
| [demand/submission-view.js](../src/demand/submission-view.js) | Requester worksheet、需求草稿、quantity、送出與修訂 | `renderUserQuoteActionCell`、`submissionCurrentStatus`、`submissionActionStatusCell` |
| [demand/submit.js](../src/demand/submit.js) | Requester worksheet、需求草稿、quantity、送出與修訂 | `submitRequests` |
| [demand/worksheet-actions.js](../src/demand/worksheet-actions.js) | Requester worksheet、需求草稿、quantity、送出與修訂 | `requestWorksheetOverrides`、`addWorksheetRow`、`renderRequestRows` |
| [demand/worksheet-view.js](../src/demand/worksheet-view.js) | Requester worksheet、需求草稿、quantity、送出與修訂 | `activePhaseText`、`compactItemMeta`、`draftTimelineCell` |
| [demand/worksheet.js](../src/demand/worksheet.js) | Requester worksheet、需求草稿、quantity、送出與修訂 | `applyRequestWorksheetActiveState`、`requestInputContextKey`、`requestBreakdownContextKey` |
| [demand/workspace.js](../src/demand/workspace.js) | Requester worksheet、需求草稿、quantity、送出與修訂 | `renderDepartment` |

### exports/

既有 CSV／Excel／PAS 與交接檔案產生。下列 symbols 是定位入口，不是該檔案全部 exports。

| Module（src/ 下） | Ownership | 代表入口／binding |
| --- | --- | --- |
| [exports/handoff.js](../src/exports/handoff.js) | 既有 CSV／Excel／PAS 與交接檔案產生 | `exportRowsForPackage`、`commitHandoffExport`、`exportHandoffPackages` |
| [exports/om.js](../src/exports/om.js) | 既有 CSV／Excel／PAS 與交接檔案產生 | `omPackageProject`、`omPackageCodeForRows`、`omBudgetCodeForRows` |
| [exports/pas.js](../src/exports/pas.js) | 既有 CSV／Excel／PAS 與交接檔案產生 | `createPasExcelSystemFileRecord`、`pasExcelWorkbookSheet`、`uploadGeneratedPasExcelAttachment` |
| [exports/workbook.js](../src/exports/workbook.js) | 既有 CSV／Excel／PAS 與交接檔案產生 | `csvEscape`、`downloadFile`、`downloadCsv` |

### handoff/

OM 後交接狀態、歷程及 Buyer 唯讀呈現。下列 symbols 是定位入口，不是該檔案全部 exports。

| Module（src/ 下） | Ownership | 代表入口／binding |
| --- | --- | --- |
| [handoff/actions.js](../src/handoff/actions.js) | OM 後交接狀態、歷程及 Buyer 唯讀呈現 | `commitSendSelectedToOm`、`sendSelectedToOm`、`markSelectedExternalUpdated` |
| [handoff/buyer.js](../src/handoff/buyer.js) | OM 後交接狀態、歷程及 Buyer 唯讀呈現 | `buyerSourceOwner`、`buyerRows`、`buyerStatusFor` |
| [handoff/events-change-handlers.js](../src/handoff/events-change-handlers.js) | 原有 DOM 事件處理；業務判斷沿用被呼叫的 domain function | `handleChangeHandoffProjectFilter`、`handleChangeBuyerProjectFilter`、`handleChangeHandoffSelect` |
| [handoff/events-click-handlers.js](../src/handoff/events-click-handlers.js) | 原有 DOM 事件處理；業務判斷沿用被呼叫的 domain function | `handleClickHandoffTab`、`handleClickExportHandoffPackages`、`handleClickBuyerProgressButton` |
| [handoff/queue.js](../src/handoff/queue.js) | OM 後交接狀態、歷程及 Buyer 唯讀呈現 | `procurementRows`、`pasReviewRows`、`readyForCoordinatorOutput` |
| [handoff/state.js](../src/handoff/state.js) | 此 domain 的 live bindings／既有狀態 | `handoffHistorySequence`、`dispatchHistorySequence`、`externalProgressSequence` |
| [handoff/status.js](../src/handoff/status.js) | OM 後交接狀態、歷程及 Buyer 唯讀呈現 | `handoffRoute`、`handoffTarget`、`exportStatus` |
| [handoff/view.js](../src/handoff/view.js) | OM 後交接狀態、歷程及 Buyer 唯讀呈現 | `renderHandoffHistory`、`renderHandoffSummary`、`renderMfgCollectionStatus` |

### infrastructure/

API／附件 transport 與既有 app-modules adapter。下列 symbols 是定位入口，不是該檔案全部 exports。

| Module（src/ 下） | Ownership | 代表入口／binding |
| --- | --- | --- |
| [infrastructure/api.js](../src/infrastructure/api.js) | API／附件 transport 與既有 app-modules adapter | `apiModeEnabled`、`apiRequest` |
| [infrastructure/attachments.js](../src/infrastructure/attachments.js) | API／附件 transport 與既有 app-modules adapter | `uploadAttachment`、`attachmentDownloadUrl`、`attachmentLinkHtml` |
| [infrastructure/module-adapters.js](../src/infrastructure/module-adapters.js) | API／附件 transport 與既有 app-modules adapter | `sharedFormatters`、`demandCostDashboardModule`、`leadTimeModule` |

### inventory/

Warehouse／carryover 候選、庫存及成本 evidence。下列 symbols 是定位入口，不是該檔案全部 exports。

| Module（src/ 下） | Ownership | 代表入口／binding |
| --- | --- | --- |
| [inventory/cost-evidence.js](../src/inventory/cost-evidence.js) | Warehouse／carryover 候選、庫存及成本 evidence | `managerCarryoverRows`、`managerCarryoverEventUnit`、`managerCarryoverPhaseKey` |
| [inventory/events-change-handlers.js](../src/inventory/events-change-handlers.js) | 原有 DOM 事件處理；業務判斷沿用被呼叫的 domain function | `handleChangeWarehouseStockItem` |
| [inventory/events-click-handlers.js](../src/inventory/events-click-handlers.js) | 原有 DOM 事件處理；業務判斷沿用被呼叫的 domain function | `handleClickAddWarehouseStockRecord`、`handleClickCarryoverSuggestionButton` |
| [inventory/events-input-handlers.js](../src/inventory/events-input-handlers.js) | 原有 DOM 事件處理；業務判斷沿用被呼叫的 domain function | `handleInputWarehouseSearch` |
| [inventory/state.js](../src/inventory/state.js) | 此 domain 的 live bindings／既有狀態 | `currentWarehouseMonth`、`warehouseStockRecords`、`warehouseLockdownRecords` |
| [inventory/suggestions.js](../src/inventory/suggestions.js) | Warehouse／carryover 候選、庫存及成本 evidence | `requestCarryoverProject`、`requestCarryoverPhase`、`updateRequestCarryover` |
| [inventory/warehouse.js](../src/inventory/warehouse.js) | Warehouse／carryover 候選、庫存及成本 evidence | `warehouseRecordKey`、`warehouseSummaryKey`、`warehouseSummaryId` |

### materials/

New Item、物料身份／明細／主檔維護草稿。下列 symbols 是定位入口，不是該檔案全部 exports。

| Module（src/ 下） | Ownership | 代表入口／binding |
| --- | --- | --- |
| [materials/batch.js](../src/materials/batch.js) | New Item、物料身份／明細／主檔維護草稿 | `batchMaterialRow`、`batchFieldId`、`isReadyMaterialEntry` |
| [materials/demand-conversion.js](../src/materials/demand-conversion.js) | New Item、物料身份／明細／主檔維護草稿 | `suggestionToRecord` |
| [materials/detail-view.js](../src/materials/detail-view.js) | New Item、物料身份／明細／主檔維護草稿 | `getItemDetailRow`、`detailRow`、`detailSection` |
| [materials/display.js](../src/materials/display.js) | New Item、物料身份／明細／主檔維護草稿 | `itemDetail`、`stripBrandForRequester`、`userVisibleItemDetail` |
| [materials/entry-view.js](../src/materials/entry-view.js) | New Item、物料身份／明細／主檔維護草稿 | `materialEntryRow`、`materialEntryFieldId`、`standardOptionHtml` |
| [materials/events-change-handlers.js](../src/materials/events-change-handlers.js) | 原有 DOM 事件處理；業務判斷沿用被呼叫的 domain function | `handleChangeMaterialEntryFields`、`handleChangeBatchMaterialFields` |
| [materials/events-click-handlers.js](../src/materials/events-click-handlers.js) | 原有 DOM 事件處理；業務判斷沿用被呼叫的 domain function | `handleClickDiscardMaterialDraft`、`handleClickMaterialCandidateButton`、`handleClickCompleteSelectedMaterials` |
| [materials/events-forms.js](../src/materials/events-forms.js) | 原有 DOM 事件處理；業務判斷沿用被呼叫的 domain function | 見檔案 exports／registration |
| [materials/events-input-handlers.js](../src/materials/events-input-handlers.js) | 原有 DOM 事件處理；業務判斷沿用被呼叫的 domain function | `handleInputMaterialEntryInputs`、`handleInputBatchMaterialInputs` |
| [materials/identity.js](../src/materials/identity.js) | New Item、物料身份／明細／主檔維護草稿 | `materialIdFor`、`materialIdentityKey`、`lvCodeFor` |
| [materials/maintenance.js](../src/materials/maintenance.js) | New Item、物料身份／明細／主檔維護草稿 | `maintenanceSuggestionFromRow`、`createMaintenanceDraftFromRecord`、`createMaintenanceDraftFromRequest` |
| [materials/new-item.js](../src/materials/new-item.js) | New Item、物料身份／明細／主檔維護草稿 | `createNewItemSuggestion`、`readLocalItemDrafts`、`persistLocalItemDraft` |
| [materials/standard-names.js](../src/materials/standard-names.js) | New Item、物料身份／明細／主檔維護草稿 | `standardPartNameFromRow`、`standardPartNameMaster`、`standardPartMatchesFor` |
| [materials/standard-picker.js](../src/materials/standard-picker.js) | New Item、物料身份／明細／主檔維護草稿 | `toggleMaterialStandardName`、`toggleStandardNameForSuggestion`、`selectMaterialStandardName` |
| [materials/state.js](../src/materials/state.js) | 此 domain 的 live bindings／既有狀態 | `newItemSequence`、`masterSequence`、`materialSequence` |

### om/

OM assignment、PAS、Quote、Quotation DB、handoff/tracking 與 Leader summary。下列 symbols 是定位入口，不是該檔案全部 exports。

| Module（src/ 下） | Ownership | 代表入口／binding |
| --- | --- | --- |
| [om/assignment.js](../src/om/assignment.js) | OM assignment、PAS、Quote、Quotation DB、handoff/tracking 與 Leader summary | `applyAssignmentsToRequests`、`splitRuleValues`、`normalizeOmAssignmentRule` |
| [om/events-change-handlers.js](../src/om/events-change-handlers.js) | 原有 DOM 事件處理；業務判斷沿用被呼叫的 domain function | `handleChangeOmSubmissionYearFilter`、`handleChangeOmDemandProjectFilter`、`handleChangePasField` |
| [om/events-click-handlers.js](../src/om/events-click-handlers.js) | 原有 DOM 事件處理；業務判斷沿用被呼叫的 domain function | `handleClickOmTab`、`handleClickClearOmSubmissionFilters`、`handleClickCreateOmAssignmentRule` |
| [om/events-forms.js](../src/om/events-forms.js) | 原有 DOM 事件處理；業務判斷沿用被呼叫的 domain function | 見檔案 exports／registration |
| [om/export-actions.js](../src/om/export-actions.js) | OM assignment、PAS、Quote、Quotation DB、handoff/tracking 與 Leader summary | `updateFinalExportTarget`、`prepareOmFinalExport`、`prepareOmFinalExportCostType` |
| [om/export-rules.js](../src/om/export-rules.js) | OM assignment、PAS、Quote、Quotation DB、handoff/tracking 與 Leader summary | `isOmCancelledByUserA`、`isOmWaitingUserConfirm`、`isOmUserConfirmed` |
| [om/export-view.js](../src/om/export-view.js) | OM assignment、PAS、Quote、Quotation DB、handoff/tracking 與 Leader summary | `renderOmFinalExport` |
| [om/external-progress.js](../src/om/external-progress.js) | OM assignment、PAS、Quote、Quotation DB、handoff/tracking 與 Leader summary | `relatedRequestIds`、`externalProgressEventsFor`、`materialCreationEventFor` |
| [om/filters.js](../src/om/filters.js) | OM assignment、PAS、Quote、Quotation DB、handoff/tracking 與 Leader summary | `omProjectFilterValue`、`omDemandProjectFilterValue`、`omHistoryProjectFilterValue` |
| [om/history.js](../src/om/history.js) | OM assignment、PAS、Quote、Quotation DB、handoff/tracking 與 Leader summary | `addOmHistory`、`omTimelineForRequest`、`requesterOmHistoryNote` |
| [om/hydration.js](../src/om/hydration.js) | OM assignment、PAS、Quote、Quotation DB、handoff/tracking 與 Leader summary | `mergeOmProjectStageCalendarRecords`、`replaceOmProjectStageCalendarRecords`、`emptyOmProcurementTrackingPatch` |
| [om/leader-data.js](../src/om/leader-data.js) | OM assignment、PAS、Quote、Quotation DB、handoff/tracking 與 Leader summary | `omLeaderGroupAssignees`、`omLeaderHasUnassignedOwner`、`omLeaderProcurementRisk` |
| [om/navigation.js](../src/om/navigation.js) | OM assignment、PAS、Quote、Quotation DB、handoff/tracking 與 Leader summary | `omTabLabel`、`renderOmWorkspaceBanner` |
| [om/ownership.js](../src/om/ownership.js) | OM assignment、PAS、Quote、Quotation DB、handoff/tracking 與 Leader summary | `omCatalogItemsFromMaster`、`omBuyScopeText`、`itemOwnerText` |
| [om/pas-actions.js](../src/om/pas-actions.js) | OM assignment、PAS、Quote、Quotation DB、handoff/tracking 與 Leader summary | `updatePasField`、`applyPasDecision`、`movePasRowsToQuoteCompletion` |
| [om/pas-rules.js](../src/om/pas-rules.js) | OM assignment、PAS、Quote、Quotation DB、handoff/tracking 與 Leader summary | `isPasRequired`、`pasStatus`、`pasDisplayStatus` |
| [om/pas-view.js](../src/om/pas-view.js) | OM assignment、PAS、Quote、Quotation DB、handoff/tracking 與 Leader summary | `omPasResultStatus`、`omBuyerPackageStatus`、`pasLegalName` |
| [om/pricing.js](../src/om/pricing.js) | OM assignment、PAS、Quote、Quotation DB、handoff/tracking 與 Leader summary | `omSourceRecord`、`omUnit`、`omLastPurchaseTime` |
| [om/progress-data.js](../src/om/progress-data.js) | OM assignment、PAS、Quote、Quotation DB、handoff/tracking 與 Leader summary | `omSubmissionItemKey`、`omProductCategory`、`omSubmissionLevels` |
| [om/progress-view.js](../src/om/progress-view.js) | OM assignment、PAS、Quote、Quotation DB、handoff/tracking 與 Leader summary | `omPendingFocusReason`、`omPendingFocusScore`、`renderOmSubmissionTriage` |
| [om/queue.js](../src/om/queue.js) | OM assignment、PAS、Quote、Quotation DB、handoff/tracking 與 Leader summary | `omWorkflowStage`、`omAllRows`、`omPasRequestRows` |
| [om/quotation-db.js](../src/om/quotation-db.js) | OM assignment、PAS、Quote、Quotation DB、handoff/tracking 與 Leader summary | `omQuoteExpiryRows`、`omQuoteExpiryStatusLabel`、`omQuoteExpiryDaysLeft` |
| [om/quote-actions.js](../src/om/quote-actions.js) | OM assignment、PAS、Quote、Quotation DB、handoff/tracking 與 Leader summary | `updateOmField`、`updateOmPasExcelMergeDecision`、`toggleOmQuoteException` |
| [om/quote-rules.js](../src/om/quote-rules.js) | OM assignment、PAS、Quote、Quotation DB、handoff/tracking 與 Leader summary | `omReadyForBuyer`、`omQuoteScreenshotFile`、`omQuoteInputCurrency` |
| [om/quote-validity.js](../src/om/quote-validity.js) | OM assignment、PAS、Quote、Quotation DB、handoff/tracking 與 Leader summary | `baseQuoteStatus`、`quoteStatus`、`hasOmQuoteData` |
| [om/quote-view.js](../src/om/quote-view.js) | OM assignment、PAS、Quote、Quotation DB、handoff/tracking 與 Leader summary | `omQuoteValidityHtml`、`omQuoteEntryHtml`、`omQuoteMissingFields` |
| [om/row-actions.js](../src/om/row-actions.js) | OM assignment、PAS、Quote、Quotation DB、handoff/tracking 與 Leader summary | `runOmRowAction` |
| [om/selection.js](../src/om/selection.js) | OM assignment、PAS、Quote、Quotation DB、handoff/tracking 與 Leader summary | `selectedOmPasRequestRows`、`selectedOmPasResultRows`、`selectedOmFinalExportRows` |
| [om/state.js](../src/om/state.js) | 此 domain 的 live bindings／既有狀態 | `omProjectStageCalendarApiAuthoritative`、`omLeaderConsoleSyncedAt`、`omAssignees` |
| [om/tracking-actions.js](../src/om/tracking-actions.js) | OM assignment、PAS、Quote、Quotation DB、handoff/tracking 與 Leader summary | `updateOmProcurementField` |
| [om/tracking-rules.js](../src/om/tracking-rules.js) | OM assignment、PAS、Quote、Quotation DB、handoff/tracking 與 Leader summary | `procurementStatusValue`、`suggestPurRequestNo` |
| [om/tracking-view.js](../src/om/tracking-view.js) | OM assignment、PAS、Quote、Quotation DB、handoff/tracking 與 Leader summary | `omPurposeDisplayCell`、`canEditOmProcurementTracking`、`omProcurementFieldLabel` |
| [om/workspace.js](../src/om/workspace.js) | OM assignment、PAS、Quote、Quotation DB、handoff/tracking 與 Leader summary | `renderOmSummary`、`renderOmDemandSummary`、`renderOmDemandCollection` |

### progress/

跨角色需求進度、project dashboard 與 scope。下列 symbols 是定位入口，不是該檔案全部 exports。

| Module（src/ 下） | Ownership | 代表入口／binding |
| --- | --- | --- |
| [progress/dashboard.js](../src/progress/dashboard.js) | 跨角色需求進度、project dashboard 與 scope | `projectStatusScopeFromRow`、`syncProjectStatusScopeFromRow`、`projectStatusWarehouseRows` |
| [progress/demand.js](../src/progress/demand.js) | 跨角色需求進度、project dashboard 與 scope | `managerProgressRawRows`、`managerProgressYearProject`、`managerProgressProject` |
| [progress/state.js](../src/progress/state.js) | 此 domain 的 live bindings／既有狀態 | `selectedProjectStatusScope` |

### projects/

Project／phase／日期／calendar／scope 設定。下列 symbols 是定位入口，不是該檔案全部 exports。

| Module（src/ 下） | Ownership | 代表入口／binding |
| --- | --- | --- |
| [projects/calendar-view.js](../src/projects/calendar-view.js) | Project／phase／日期／calendar／scope 設定 | `canMaintainProjectStageCalendar`、`omStageCalendarYearProjectOptions`、`syncOmStageCalendarControls` |
| [projects/calendar.js](../src/projects/calendar.js) | Project／phase／日期／calendar／scope 設定 | `normalizeProjectStageCalendarRecord`、`projectStageCalendarKey`、`projectStageCalendarRows` |
| [projects/config.js](../src/projects/config.js) | Project／phase／日期／calendar／scope 設定 | `normalizeYearProjectLabel`、`normalizeProjectCodeLabel`、`projectTypeForScopeCode` |
| [projects/controls.js](../src/projects/controls.js) | Project／phase／日期／calendar／scope 設定 | `syncProjectCodeInput`、`projectTypesForFilter`、`allProjectCodes` |
| [projects/dates.js](../src/projects/dates.js) | Project／phase／日期／calendar／scope 設定 | `normalizePurposeLocation`、`dateOnly`、`requiredDeliveryDateFollowStageDate` |
| [projects/events-change-handlers.js](../src/projects/events-change-handlers.js) | 原有 DOM 事件處理；業務判斷沿用被呼叫的 domain function | `handleChangeProjectTypeSelect`、`handleChangeProjectSelect`、`handleChangeProjectCodeInput` |
| [projects/events-click-handlers.js](../src/projects/events-click-handlers.js) | 原有 DOM 事件處理；業務判斷沿用被呼叫的 domain function | `handleClickProjectStatusCell`、`handleClickSaveAndOpenProject`、`handleClickProjectContextButton` |
| [projects/events-input-handlers.js](../src/projects/events-input-handlers.js) | 原有 DOM 事件處理；業務判斷沿用被呼叫的 domain function | `handleInputProjectCodeInput` |
| [projects/review-context.js](../src/projects/review-context.js) | Project／phase／日期／calendar／scope 設定 | `projectContextRowProject`、`projectContextProjectOptions`、`projectContextSelectedProject` |
| [projects/setup.js](../src/projects/setup.js) | Project／phase／日期／calendar／scope 設定 | `renderProjectSetup`、`saveProjectSetup`、`updateProjectSetup` |
| [projects/state.js](../src/projects/state.js) | 此 domain 的 live bindings／既有狀態 | `PROJECTS`、`currentProject`、`currentProjectCode` |

### session/

登入／session／persona／角色判斷與聯络資料。下列 symbols 是定位入口，不是該檔案全部 exports。

| Module（src/ 下） | Ownership | 代表入口／binding |
| --- | --- | --- |
| [session/config.js](../src/session/config.js) | 登入／session／persona／角色判斷與聯络資料 | `roleProfiles`、`roleCapabilityMatrix`、`testLoginRoleAccounts` |
| [session/contacts.js](../src/session/contacts.js) | 登入／session／persona／角色判斷與聯络資料 | `sourceRecordForRequest`、`contactCardHtml`、`departmentDriContact` |
| [session/events-click-handlers.js](../src/session/events-click-handlers.js) | 原有 DOM 事件處理；業務判斷沿用被呼叫的 domain function | `handleClickLogout`、`handleClickContactDriButton` |
| [session/events-forms.js](../src/session/events-forms.js) | 原有 DOM 事件處理；業務判斷沿用被呼叫的 domain function | 見檔案 exports／registration |
| [session/login-enhancer.js](../src/session/login-enhancer.js) | 登入／session／persona／角色判斷與聯络資料 | 見檔案 exports／registration |
| [session/permissions.js](../src/session/permissions.js) | 登入／session／persona／角色判斷與聯络資料 | `isOmRole`、`isOmLeaderRole`、`normalizeAdminRoleKey` |
| [session/persona.js](../src/session/persona.js) | 登入／session／persona／角色判斷與聯络資料 | `normalizedContactPhone`、`contactIdFor`、`requesterResponsibilityRows` |
| [session/session.js](../src/session/session.js) | 登入／session／persona／角色判斷與聯络資料 | `sessionUserFromRole`、`setSessionUser`、`testLoginAccountForRole` |
| [session/state.js](../src/session/state.js) | 此 domain 的 live bindings／既有狀態 | `currentRole`、`currentUserRole`、`currentSessionUser` |

### shared/

無獨立角色 ownership 的格式、HTML、日期與 DOM 小工具。下列 symbols 是定位入口，不是該檔案全部 exports。

| Module（src/ 下） | Ownership | 代表入口／binding |
| --- | --- | --- |
| [shared/dates.js](../src/shared/dates.js) | 無獨立角色 ownership 的格式、HTML、日期與 DOM 小工具 | `compactTimestamp`、`hoursSince`、`fullTimestamp` |
| [shared/detail-view.js](../src/shared/detail-view.js) | 無獨立角色 ownership 的格式、HTML、日期與 DOM 小工具 | `compactList`、`detailSummaryGridHtml`、`formatProgressDate` |
| [shared/dom.js](../src/shared/dom.js) | 無獨立角色 ownership 的格式、HTML、日期與 DOM 小工具 | `copyAnalysisNodeContent`、`copyAnalysisText`、`clearNodeContent` |
| [shared/format.js](../src/shared/format.js) | 無獨立角色 ownership 的格式、HTML、日期與 DOM 小工具 | `stageLabel`、`recordIndex`、`slug` |
| [shared/html.js](../src/shared/html.js) | 無獨立角色 ownership 的格式、HTML、日期與 DOM 小工具 | `htmlAttr`、`htmlText` |

### shell/

Navigation、dialog、table navigation 與有序事件分派。下列 symbols 是定位入口，不是該檔案全部 exports。

| Module（src/ 下） | Ownership | 代表入口／binding |
| --- | --- | --- |
| [shell/dialogs.js](../src/shell/dialogs.js) | Navigation、dialog、table navigation 與有序事件分派 | `showToast`、`showConfirm`、`hideConfirm` |
| [shell/events-change.js](../src/shell/events-change.js) | 原有 DOM 事件處理；業務判斷沿用被呼叫的 domain function | 見檔案 exports／registration |
| [shell/events-click-handlers.js](../src/shell/events-click-handlers.js) | 原有 DOM 事件處理；業務判斷沿用被呼叫的 domain function | `handleClickTarget`、`handleClickTab`、`handleClickDeptTab` |
| [shell/events-click.js](../src/shell/events-click.js) | 原有 DOM 事件處理；業務判斷沿用被呼叫的 domain function | 見檔案 exports／registration |
| [shell/events-input-handlers.js](../src/shell/events-input-handlers.js) | 原有 DOM 事件處理；業務判斷沿用被呼叫的 domain function | `handleInputStandardNamePickerQuery` |
| [shell/events-input.js](../src/shell/events-input.js) | 原有 DOM 事件處理；業務判斷沿用被呼叫的 domain function | 見檔案 exports／registration |
| [shell/events.js](../src/shell/events.js) | registration re-export；不是新的業務決策層 | 見檔案 exports／registration |
| [shell/navigation.js](../src/shell/navigation.js) | Navigation、dialog、table navigation 與有序事件分派 | `semanticNavigationItems`、`semanticNavigationItemIsActive`、`semanticNavigationDataAttributes` |
| [shell/state.js](../src/shell/state.js) | 此 domain 的 live bindings／既有狀態 | `currentView`、`currentDeptTab`、`currentManagerTab` |
| [shell/table-navigation.js](../src/shell/table-navigation.js) | Navigation、dialog、table navigation 與有序事件分派 | `refreshHorizontalTableNavigator`、`demandCostNavigatorGroups`、`quantityNavigatorGroups` |

### sourcing/

RFQ、buyer routing、MFG package 與外部 sourcing。下列 symbols 是定位入口，不是該檔案全部 exports。

| Module（src/ 下） | Ownership | 代表入口／binding |
| --- | --- | --- |
| [sourcing/config.js](../src/sourcing/config.js) | RFQ、buyer routing、MFG package 與外部 sourcing | `RFQ_BUYERS`、`DRI_CONTACT_MASTER`、`BUYER_RULES` |
| [sourcing/events-change-handlers.js](../src/sourcing/events-change-handlers.js) | 原有 DOM 事件處理；業務判斷沿用被呼叫的 domain function | `handleChangeSourcingOwnerFilter`、`handleChangeRfqSelect`、`handleChangeRfqField` |
| [sourcing/events-click-handlers.js](../src/sourcing/events-click-handlers.js) | 原有 DOM 事件處理；業務判斷沿用被呼叫的 domain function | `handleClickExportRfqExcel`、`handleClickGenerateRfqEmailDraft`、`handleClickRfqGroupButton` |
| [sourcing/package-view.js](../src/sourcing/package-view.js) | RFQ、buyer routing、MFG package 與外部 sourcing | `openMfgPackageDetail` |
| [sourcing/rfq-actions.js](../src/sourcing/rfq-actions.js) | RFQ、buyer routing、MFG package 與外部 sourcing | `updateRfqField`、`groupedRfqRowsByBuyer`、`rfqFileName` |
| [sourcing/rfq.js](../src/sourcing/rfq.js) | RFQ、buyer routing、MFG package 與外部 sourcing | `todayDateString`、`addBusinessDays`、`daysBetween` |
| [sourcing/state.js](../src/sourcing/state.js) | 此 domain 的 live bindings／既有狀態 | `pendingRfqEmailRows` |

### workflow/

共用 workflow status constants、timeline 與狀態呈現。下列 symbols 是定位入口，不是該檔案全部 exports。

| Module（src/ 下） | Ownership | 代表入口／binding |
| --- | --- | --- |
| [workflow/status-constants.js](../src/workflow/status-constants.js) | 共用 workflow status constants、timeline 與狀態呈現 | `HANDOFF_READY`、`HANDOFF_EXPORTED`、`HANDOFF_SENT_TO_OM` |
| [workflow/status-view.js](../src/workflow/status-view.js) | 共用 workflow status constants、timeline 與狀態呈現 | `workflowStatusForRow`、`workflowStatusForGroup`、`workflowStatusStripHtml` |
| [workflow/timeline.js](../src/workflow/timeline.js) | 共用 workflow status constants、timeline 與狀態呈現 | `requesterConfirmationSentAt`、`timelineMilestones`、`timelineStepHtml` |

