# Global Review Findings

## 總體判斷

系統背景、角色權責、核心 workflow 已經很清楚，尤其 Requester worksheet、Cost Manager Demand Analysis、OM quote/export 三塊已形成穩定產品輪廓。主要風險不在「畫面做不出來」，而在 production 化時是否能守住角色權限、server-authoritative workflow state、長表格 layout、以及 no-source handoff 邊界。

## 成熟清楚的地方

1. **角色邊界清楚**
   - `_context/roles/` 對 Requester、Dept DRI、Cost Manager、OM Leader、OM Purchasing、Budget Approver、Admin、Buyer Handoff 的責任描述完整。
   - 測試已覆蓋 role guard、Requester privacy、OM Leader vs OM Purchasing。

2. **Requester input model 已鎖定**
   - 一列 = Item / Spec。
   - MFG / Non-MFG 分 tab。
   - phase group + station/unit qty 直接輸入。
   - Add Item popup 是主要 row creation 入口。
   - Copy Demand / Reuse Item qty 歸 0 的規則明確。

3. **Cost Manager baseline 很成熟**
   - Demand Analysis 先看 Cost Dashboard，再 drill into Station Matrix。
   - Carryover pending/applied 對 cost impact 的分界清楚。
   - 畫面高密度但符合 Cost Manager 的 Excel-like 分析需求。

4. **OM workflow 可操作性強**
   - Submission Dashboard、PAS Demand No、PAS Quote Result、Quote Expiry、Export Package 的作業階段清楚。
   - Quote evidence、quote validity、price decision 都已在 UI 和文件中連動。

5. **DB/API roadmap 已開始成形**
   - 現有 UAT MVP tables 與 target workflow tables 分得開。
   - API/table map 已標示 server-owned role/session、audit events、Requester visibility。

6. **測試基線健康**
   - `./test.sh` 通過。
   - 87 個 Node unit/system contract tests 通過。
   - Browser smoke、layout smoke、price routing smoke、global UI audit、role flow smoke、accessibility smoke 全部通過。

## 主要風險與不清楚處

### P1 - Dept DRI / carryover review 有 page-level horizontal overflow

Evidence: `screenshots/10-dept-dri-price-review.png`，metadata `bodyOverflow: true`。

這是本次截圖中唯一被自動檢測到的 page-level overflow。畫面中的 carryover table 右側內容被 viewport 裁掉，和 layout rule「wide tables scroll inside table shells, not page」衝突。這看起來不是 business logic 問題，而是 table shell / section width 問題。

Recommendation: 下一輪 UI 修正時先處理 Dept DRI carryover review 的 table shell 和 summary card width。

### P1 - Production workflow state 還沒有真正 server-authoritative

Progress 文件明確指出 main workflow rows 仍是 frontend/demo-state backed。DB target tables 和 API map 已有，但還沒有 production handler。

Risk: IT 實作若直接照畫面拆 API，可能重建出 overloaded row object，而不是 request package / item / demand line / approval ledger 的 canonical model。

Recommendation: IT 實作前先把 Phase 2/3 API contract 寫成正式 endpoint spec，並列出每個 transition 的 audit event。

### P1 - No-source handoff 與 workspace artifacts 容易混淆

正式策略是 no-source handoff，但 workspace 中仍有 source、schema、migration、handoff zip。對內工作方便，對 IT 溝通容易混淆。

Risk: IT 可能要求或誤用 prototype source，把 demo-state 寫成 production 依據。

Recommendation: 對外 delivery entrypoint 固定使用 `docs-current/IT_DELIVERY_READINESS_20260608.md`，並在會議中重複 prototype 是 validated reference，不是 implementation base。

### P2 - Login / role switching 在 API mode 與文件 demo account 有落差

Evidence: `screenshots/01-login.png`。API mode 會 disable role selector，實際登入必須使用 server/memory user account，例如 `V1524505`、`dept-dri`、`maint5`。

文件曾提共享帳號 `requester`、`deptdri`、`omleader` 等，但 memory fallback server.js 目前沒有這批帳號。

Risk: demo 或 review 人員用錯帳號會以為系統壞掉。

Recommendation: 統一 Mac mini UAT MySQL seed、memory fallback seed、demo guide 的帳號命名。

### P2 - OM Leader 可看全部 OM rows，但是否可代操作 quote row 仍需鎖定

Evidence: `screenshots/14-om-pas-quote-result.png` 是以 Mai/OM Leader 登入後看到 PAS Quote Result 操作表。

Role context 說 Mai 預設不操作報價 row，若要代操作需另定規則並 audit。畫面讓 Mai 可進 quote result，因此需要確認這只是 view/oversight，還是可以實際 save quote。

Recommendation: 明確定義 OM Leader 在 PAS Demand No / PAS Quote Result / Export Package 的 write permission。

### P2 - Buyer Handoff 目前仍像 placeholder

Evidence: `screenshots/18-buyer-handoff.png`。

Buyer Handoff 已避免 `Downstream` 主稱呼，但頁面仍以 PR/PO status table 為主，整體像未來擴充區。這和角色 context 一致，但需要確認 production v1 是否只做狀態顯示。

Recommendation: 鎖定 v1 Buyer Handoff 是 read-only status 還是允許 Buyer 回填 PR/PO/evidence。

### P3 - Success toast 會遮住右上 user/action area

Evidence: 多張登入後截圖右上方 success toast 遮住 topbar 部分資訊。

這不是阻塞問題，但在 demo 和截圖 review 中會干擾第一視覺區。若日後做正式 UAT，可縮短 toast 或避開 topbar action area。

### P3 - 高密度表格需要持續保護 identity/spec visibility

Add Item、Cost Dashboard、OM Quote Result、Buyer Handoff 都有很多 identity text、spec text、note text。現有 tests 和 layout contract 已保護一部分，但 production implementation 要避免一刀切 clamp。

Recommendation: IT handoff 中保留 identity/spec/numeric/action cell classification。

## UI Quality Snapshot

UI Quality: pass with one layout risk

Readability: pass for role-specific dense tools; P2 risk for new users because acronyms PAS/FTV/CFA/ECS need domain context

WCAG Smoke: pass via `./test.sh`; screenshot-only audit cannot claim full compliance

Attention Flow: pass for Requester, Cost Manager, OM; P2 risk for Dept DRI because carryover review dominates over price review

Action Clarity: pass for Requester Add Item/Save Draft/Submit and OM PAS/quote/export; OM Leader write boundary unclear

Consistency: pass overall; Buyer Handoff naming still uses nav label `Buyer PR / PO` while docs emphasize `Buyer Handoff`
