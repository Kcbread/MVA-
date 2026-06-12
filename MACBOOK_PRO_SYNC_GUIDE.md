# MacBook Pro 同步準則

## 目標

MacBook Pro 是主要開發機，負責前端、後端、DB schema、測試與 GitHub push。

Mac mini 是 host / UAT 部署機，不應直接手動修改 source。兩邊同步基準一律以 GitHub `origin/main` 的 commit 為準，避免 MacBook Pro 修正後 Mac mini 仍停在舊版。

目前 Mac mini 尚未固定 IP，因此本文件先定義 MacBook Pro 端的準備與同步準則，不包含 SSH deploy 指令。

## 角色分工

| 機器 | 角色 | 應做事項 | 不應做事項 |
| --- | --- | --- | --- |
| MacBook Pro | 開發機 | 修改 source、跑測試、commit、push 到 GitHub | 手動複製半套檔案到 Mac mini |
| GitHub | 唯一版本來源 | 保存 `main` 的可部署 commit | 保存 `.env`、password、secret |
| Mac mini | Host / UAT | 從 GitHub 拉取指定 commit 並部署 | 直接修改正式 source |

## 開工前檢查

在 MacBook Pro 開始任何修改前，先進入 repo：

```bash
cd "/Users/kai-chenyang/Desktop/桌面 - Kai-chen的MacBook Pro/Codex/資料庫建置"
```

檢查目前分支、未提交變更與最近 commit：

```bash
git status --short --branch
git fetch origin
git log --oneline --decorate -5
```

確認本機與 `origin/main` 是否一致：

```bash
echo "Local HEAD:  $(git rev-parse HEAD)"
echo "Origin main: $(git rev-parse origin/main)"
```

如果 `Local HEAD` 與 `Origin main` 不一致，先釐清差異。不要在不確定差異內容的情況下直接覆蓋、reset 或部署。

## 開發準則

- 所有正式變更都在 MacBook Pro 完成。
- 不用 zip、AirDrop、Finder copy 或手動覆蓋 source 作為正式同步方式。
- 不要把 `.env`、DB password、`SESSION_SECRET`、token、private key 或 production-like secret commit 進 Git。
- UI、API、DB schema、seed、測試變更應一起提交，避免 Mac mini 部署到半套狀態。
- 如果有 DB migration、seed 或資料結構變更，commit message 或 handoff 必須明確寫出。
- Mac mini 若發現問題，修正仍應回到 MacBook Pro 或 GitHub flow 完成，再重新部署。

## 測試門檻

每次要 push 給 Mac mini 部署前，至少執行：

```bash
cd "/Users/kai-chenyang/Desktop/桌面 - Kai-chen的MacBook Pro/Codex/資料庫建置/procurement-prototype"
./test.sh
cd ..
```

只有測試通過，才允許 push 到 `main` 或建立 PR。

如果測試失敗：

- 不要 push 給 Mac mini 部署。
- 先修正失敗原因。
- 若是測試期待值過期，必須確認新 business rule 是刻意變更後，才可以改測試。
- 不要把 dry-run、mock、fixture 或未完成驗證描述成真實部署完成。

## 標準同步指令

確認變更已完成且測試可通過後，在 MacBook Pro 執行：

```bash
cd "/Users/kai-chenyang/Desktop/桌面 - Kai-chen的MacBook Pro/Codex/資料庫建置"

git fetch origin

cd procurement-prototype
./test.sh
cd ..

git status --short

git add -A
git commit -m "Sync procurement prototype updates" || echo "No new changes to commit"
git push origin HEAD:main

git fetch origin
echo "Local HEAD:  $(git rev-parse HEAD)"
echo "Origin main: $(git rev-parse origin/main)"
```

完成後，`Local HEAD` 必須等於 `Origin main`。這個 commit 才是 Mac mini 後續部署應使用的同步基準。

## Mac mini 同步基準

Mac mini 後續部署時，必須拉取 GitHub 的同一個 commit：

```bash
git fetch origin
git checkout main
git pull --ff-only origin main
git rev-parse HEAD
```

Mac mini 的 `git rev-parse HEAD` 應該等於 MacBook Pro push 後的 `origin/main` commit。

在 GitHub Actions self-hosted runner 與 Docker Compose 正式導入前，Mac mini 端部署結果仍需要人工確認，不可將「已 push 到 GitHub」視為「Mac mini 已部署完成」。

## 後續升級方向

Mac mini 固定 IP、host runtime 與 runner 權限整理完成後，目標流程升級為：

- GitHub Actions 在每次部署前執行 `procurement-prototype/test.sh`。
- 測試通過後才允許部署。
- Mac mini 使用 Docker Compose 作為正式 runtime。
- Mac mini 透過 GitHub Actions self-hosted runner 自動部署。
- 部署後執行 health check：

```bash
curl -fsS http://127.0.0.1:8080/api/health
```

後續可補正式檔案：

- `.github/workflows/deploy-mac-mini.yml`
- `deploy/mac-mini/docker-compose.yml`
- `deploy/mac-mini/deploy.sh`
- Mac mini runner 安裝與 rollback runbook

## Codex 行為準則

MacBook Pro 那邊的 Codex 應遵守：

- 預設用繁體中文回覆 Kai。
- 開始 substantial work 前，先讀：
  - `README.md`
  - `procurement-prototype/_context/README.zh-TW.md`
  - 任務需要時再讀相關角色、流程或測試文件。
- 不要一開始 bulk-read archived handoff packages、`docs-archive/legacy-context/` 或舊版文件。
- 修改 prototype 後，優先跑 `procurement-prototype/test.sh`。
- 回覆必須明確標示：
  - 做了什麼
  - 是否執行測試
  - 是否 commit
  - 是否 push
  - 本機 commit 與 `origin/main` commit 是否一致
- 不要把未執行的測試、dry-run、mock、fixture 或人工假設描述成真實完成。

## 完成回報格式

MacBook Pro Codex 完成同步準備後，建議用以下格式回報：

```text
Status: completed / partial / blocked
Changed: <摘要>
Validation: <執行的測試或 not run 原因>
Commit: <local HEAD SHA 或 not committed>
Push: <pushed to origin/main / not pushed>
Sync check: <Local HEAD == Origin main / mismatch>
Risk: <剩餘風險或 none>
Next: <Mac mini 需要執行的下一步>
```

## 自我蒸餾檢查

- Status: 文件準則，尚非正式自動部署。
- Evidence: 本 repo 目前有 `README.md`、`procurement-prototype/test.sh` 與既有 Docker handoff runbook 可作為後續部署流程基礎。
- Validation: 本文件只定義流程；真實部署完成必須以 Mac mini 實際拉取 commit、Docker Compose 啟動與 `/api/health` 通過為準。
- Future candidate: 之後可把本文件升級為正式 deployment runbook，並加入 GitHub Actions workflow、Mac mini runner setup、rollback 與健康檢查紀錄。
