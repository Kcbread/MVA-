# 表格與按鈕排版標準

## 欄位分類

所有表格欄位必須先分類，再決定顯示方式。

- `Identity`：品名 + Factory Material No、Request ID、PAS Demand No、PAS Material No、Package Code、PO No、聯絡人姓名/email。不可被一般 clamp 截掉。
- `Spec`：產品規格。主表顯示 2-3 行摘要，完整內容放 Detail / tooltip / expand。
- `Note`：purpose、remark、pending reason。主表短摘要，完整內容放 Detail。
- `Number`：qty、price、amount、percent。不可換行，必要時用 compact 格式。
- `Action`：表格內按鈕只用短文案，例如 `Add`、`Edit`、`Remove`、`Detail`、`Export`。

## 強制規則

- 不可把 `td` 本身設成 `display: -webkit-box`。
- 只能 clamp 內層文字 wrapper。
- Identity 欄位不可使用一般 `.cell-text-clamp`。
- 長 spec 可以摘要，但必須有完整內容可追。
- 超寬表格只能在 `.table-shell` 裡水平捲動，不可造成整頁 overflow。

## 正反例

- 正確：`Mini PC (Assy)` + `FM-VN-MVA-6D0F200` 兩行完整可見。
- 錯誤：只看到 `FM-VN-MVA-6D0F2` 或第二行被裁掉。
- 正確：`LAMITOUCH LM-30 CPU:i3-6100, RAM 16GB...` 顯示摘要，Detail 可看完整。
- 錯誤：硬切成 `LAMITOUCH LM-30 CPU:i3-610` 且沒有完整內容入口。
