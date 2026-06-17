# 例外流程上下文：Temporary Budget / Price Exception / Reject Loop

## Price Exception 觸發規則

正式門檻使用 USD 絕對價差：

- `quoteUnitPriceUsd - historyUnitPriceUsd` 四捨五入到小數第 2 位。
- 若結果 `> 0.40 USD`，觸發 price exception。
- 若結果 `<= 0.40 USD`，自動通過，不需 Requester 確認。
- 無 history price、新品項、Temporary Budget 一律觸發。

## 一般需求 quote 後路由

1. OM Purchasing 儲存 quote。
2. 系統比對 history price。
3. under threshold：
   - `Auto Cleared`
   - 不回 Requester confirm
   - 進 OM Export Package。
4. over threshold / no history：
   - 進 `Dept DRI Price Exception Review`
   - Dept DRI approve -> `Budget Approver`
   - Budget Approver approve -> `OM Export Package`
   - 任一 reject -> `Requester Action Required`

## Temporary Budget 流程

1. Requester 建 Temporary Budget，填 estimate 與 reason。
2. Submit 後仍先走 Dept DRI submission review，再 Cost Manager final authorization。
3. OM quote/bidding result 出來後，不直接 export。
4. Temporary Budget quote result 一律進：
   - Dept DRI quote review
   - Budget Approver final budget approval
   - OM Export Package
5. Reject 回 Requester Action Required。

## Quote Evidence 與 Expiry

- Quote evidence 第一版是 screenshot/image，不是 PDF upload。
- Quote Excel 仍必須保留。
- Quote date 與 quote received date 視為同一天。
- Quote expiry warning threshold = 10 days。
- Quote Expiry tab 是 OM tracking tab，不是 workflow gate。

## UI 透明度

- Requester 不看 vendor、PAS material、factory material、OM assignee、FTV。
- Dept DRI / Budget Approver 看 price exception 摘要，不進 OM 作業表。
- Cost Manager 看成本影響與 final authorization，不操作 quote。

## 測試重點

- `10.00 -> 10.40` 不 trigger。
- `10.00 -> 10.41` trigger。
- no history trigger。
- Temporary Budget quote result 必經 Dept DRI -> Budget Approver。
- reject loop 必回 Requester Action Required。
