# Mac mini MySQL POC Server Setup Guide

## 目的

這份 guideline 給 Mac mini 內測主機使用。目標是用最小成本架出：

```text
OM / User Browser
  -> Mac mini Node.js API Server
  -> Mac mini MySQL DB
```

大原則：

- MySQL 是內測 POC shared DB。
- Frontend 不直接連 MySQL。
- Browser 只連 Node/API server。
- MySQL 建議只開給 Mac mini 本機 backend 連線。
- 第一階段先準備 server / DB / session / audit 基礎，不先搬整個 workflow。

## 需要先準備

### 硬體 / 網路

- Mac mini 一台。
- 穩定電源。
- 建議使用 LAN 線，不要只靠 Wi-Fi。
- 固定內網 IP，例如 `192.168.1.50`。
- OM group 電腦與 Mac mini 在同一個網段。

### 帳密資訊

請先決定：

| 項目 | 建議值 |
| --- | --- |
| MySQL database | `mva_procurement_uat` |
| MySQL app user | `mva_uat_app` |
| Node server port | `8080` |
| Session secret | 32 字以上隨機字串 |

不要把 MySQL root password 或 app password 放到公開文件、截圖或群組訊息。

## Mac mini 系統設定

### 1. 固定 IP

到：

```text
System Settings -> Network -> Details -> TCP/IP
```

設定固定 IP。內測 URL 會像：

```text
http://192.168.1.50:8080
```

不要給使用者 `localhost`，因為 `localhost` 只代表各自自己的電腦。

### 2. 關閉睡眠

到：

```text
System Settings -> Lock Screen
```

建議：

- Prevent automatic sleeping on power adapter: on
- Turn display off: 可保留，但電腦本身不要 sleep

也可以用 terminal：

```bash
sudo pmset -a sleep 0
sudo pmset -a disksleep 0
sudo pmset -a displaysleep 30
```

### 3. 開 SSH

到：

```text
System Settings -> General -> Sharing
```

開啟：

- Remote Login
- Screen Sharing，選用

之後可用：

```bash
ssh <mac-user>@192.168.1.50
```

## 安裝工具

### 1. 安裝 Xcode Command Line Tools

```bash
xcode-select --install
```

### 2. 安裝 Homebrew

若 Mac mini 尚未安裝 Homebrew：

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

安裝後依 Homebrew 畫面提示，把 `brew` 加到 shell profile。

### 3. 安裝必要套件

```bash
brew update
brew install node git mysql tmux
```

確認版本：

```bash
node -v
npm -v
git --version
mysql --version
```

## MySQL 設定

### 1. 啟動 MySQL

```bash
brew services start mysql
```

確認：

```bash
brew services list
mysqladmin ping -uroot
```

### 2. 安全設定

```bash
mysql_secure_installation
```

建議：

- root password 設定強密碼。
- remove anonymous users。
- disallow remote root login。
- remove test database。
- reload privilege tables。

### 3. 建立 POC DB 與 app user

登入 MySQL：

```bash
mysql -uroot -p
```

執行：

```sql
CREATE DATABASE IF NOT EXISTS mva_procurement_uat
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'mva_uat_app'@'localhost'
  IDENTIFIED BY 'CHANGE_THIS_PASSWORD';

GRANT ALL PRIVILEGES ON mva_procurement_uat.*
  TO 'mva_uat_app'@'localhost';

FLUSH PRIVILEGES;
```

測試 app user：

```bash
mysql -umva_uat_app -p -h127.0.0.1 mva_procurement_uat
```

## 專案放置

建議放在：

```text
~/mva-procurement/procurement-prototype
```

如果用 USB / AirDrop / zip 帶過去，放好後進入專案：

```bash
cd ~/mva-procurement/procurement-prototype
npm install
```

若用 git：

```bash
mkdir -p ~/mva-procurement
cd ~/mva-procurement
git clone <repo-url>
cd <repo-folder>/procurement-prototype
npm install
```

## `.env` 設定

在 `procurement-prototype` 目錄建立 `.env`：

```bash
cat > .env <<'ENV'
NODE_ENV=uat
PORT=8080

DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=mva_procurement_uat
DB_USER=mva_uat_app
DB_PASSWORD=CHANGE_THIS_PASSWORD

SESSION_SECRET=CHANGE_THIS_TO_A_LONG_RANDOM_STRING
SESSION_TTL_HOURS=12
ENV
```

注意：

- `.env` 不要提交到 git。
- `DB_PASSWORD` 要和 MySQL app user 一致。
- `SESSION_SECRET` 不要太短。

## 啟動方式

Phase 1 backend 已提供 `server.js`，啟動方式：

```bash
npm start
```

或：

```bash
node server.js
```

開啟後從其他電腦測：

```text
http://<Mac-mini-IP>:8080
```

## 防火牆

如果 macOS 防火牆有開，請允許 Node.js 或指定 port。

檢查 port 是否有 listen：

```bash
lsof -nP -iTCP:8080 -sTCP:LISTEN
```

MySQL port `3306` 建議不要對其他電腦開放；讓 backend 在 Mac mini 本機連即可。

## 備份與還原

### 備份

```bash
mkdir -p ~/mva-procurement/backups
mysqldump -umva_uat_app -p mva_procurement_uat \
  > ~/mva-procurement/backups/mva_procurement_uat_$(date +%Y%m%d_%H%M%S).sql
```

### 還原

```bash
mysql -umva_uat_app -p mva_procurement_uat < backup-file.sql
```

## 內測前 Preflight Checklist

在 Mac mini 上確認：

```bash
brew --version
node -v
npm -v
mysql --version
mysqladmin ping -uroot -p
```

確認 DB：

```bash
mysql -umva_uat_app -p -h127.0.0.1 -e "SHOW DATABASES LIKE 'mva_procurement_uat';"
```

確認網路：

- 另一台電腦可以 ping Mac mini IP。
- 另一台電腦可以打開 `http://<Mac-mini-IP>:8080`。
- Mac mini 不會 sleep。

## 現場內測原則

- User A / Manager / Mai / Giang / Linh / DRI / Admin 使用不同 browser profile。
- 不使用同一個 tab 反覆切換角色來代表多人。
- 每輪測試前先備份 DB。
- 如果需要 reset UAT data，必須記錄誰 reset、何時 reset、原因。
- 附件第一版若只做 metadata，請不要宣稱正式檔案保存已完成。

## 常見問題

### 別人連不到 Mac mini

檢查：

- Mac mini IP 是否固定。
- 兩台電腦是否在同一網段。
- Node server 是否啟動。
- macOS firewall 是否擋住 port。
- URL 是否用 Mac mini IP，不是 `localhost`。

### MySQL 可以本機連，但 backend 連不到

檢查：

- `.env` DB password 是否正確。
- `DB_HOST=127.0.0.1`。
- MySQL app user 是否是 `'mva_uat_app'@'localhost'`。
- DB 是否存在。

### Mac mini 中途斷線

檢查：

- 是否 sleep。
- 是否使用 Wi-Fi 且訊號不穩。
- 是否被公司網路切換到不同 VLAN。

## 下一步

等 Phase 1 backend 開始實作後，把以下項目補進 Mac mini：

- MySQL schema migration。
- seed UAT users。
- login / logout / me API。
- audit_events table。
- server 啟動與停止腳本。
- UAT reset / backup script。
