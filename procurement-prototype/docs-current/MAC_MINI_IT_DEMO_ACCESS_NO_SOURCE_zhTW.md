# Mac mini IT-Demo 連線規範（No Source）

## 目的

讓 IT 可以看 prototype 操作與流程，但不能取得 prototype source code。

## 帳號

- 使用帳號：`IT-Demo`
- 僅供受控 demo 使用。
- 不要把你的主要帳號密碼交給 IT。

## Mac mini Sharing 設定

請在 Mac mini 檢查：

1. `System Settings` -> `General` -> `Sharing`
2. 開啟：
   - `Screen Sharing` 或 `Remote Management`
3. 只允許：
   - `IT-Demo`
4. 關閉：
   - `File Sharing`
   - `Remote Login` / SSH
   - `Remote Apple Events`
   - 任何不需要的分享服務

## IT 連線方式

建議方式：

```text
Finder -> Go -> Connect to Server -> vnc://{Mac mini IP}
```

或使用 macOS Screen Sharing app 連：

```text
vnc://{Mac mini IP}
```

IT 登入 `IT-Demo` 後，只應看到已準備好的 browser demo。

## Demo 操作原則

- 最安全：由你自己分享螢幕並操作。
- 若 IT 需要自己點：只開 Screen Sharing，讓他們在 `IT-Demo` 裡操作 browser。
- 不要開 Finder 到 prototype folder。
- 不要開 Terminal。
- 不要給 LAN website URL 作為正式交付入口，因為 frontend prototype 透過 browser 載入時，HTML/JS/CSS 可能被檢視或下載。

## 不可提供

- source folder
- Git repo
- `index.html`
- `app.js`
- `styles.css`
- `server.js`
- `db/schema.sql`
- `node_modules`
- seed data source files
- SSH / Remote Login
- File Sharing

## Demo 前建議

- 把 prototype source folder 不要放在 `IT-Demo` 可直接看到的位置。
- `IT-Demo` 桌面只保留一個 browser shortcut 或 demo instruction。
- Demo 完成後可以關閉 Screen Sharing，或移除 `IT-Demo` 的 sharing 權限。
