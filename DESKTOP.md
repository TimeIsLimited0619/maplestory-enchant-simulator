# 桌面正式版

給玩家下載到本機玩，不依賴 github.io 分頁。

## 安裝

1. 從 **Cloudflare R2 公開網址**（或你貼給玩家的雲端連結）下載 `MapleEnchantSimulator-Setup-x.y.z.exe`（**64 位元**）。
2. 雙擊安裝，可自選安裝資料夾（不要裝在空間不夠的磁碟）。
3. 大型動畫（BOSS／技能，約 1.7GB）有兩種取得方式：
   - **本機資源包（建議）**：先下載 `MapleEnchant-assets-idle-bosses-*.zip` 與 `MapleEnchant-assets-skills-*.zip`（R2 `/assets/` 或 Drive）。把兩個 zip 放在 Setup.exe **同一層**再安裝，或第一次啟動按「已下載的資源」選那個資料夾。
   - **直接下載**：第一次啟動按「開始下載」，優先從 R2 抓，失敗才試 GitHub。
4. 之後可完全離線遊玩。

未簽章時 Windows 可能出現 SmartScreen：選「其他資訊」→「仍要執行」。

## 後台掛機

- 按視窗 X：預設縮小到工作列圖示，狩獵／計時繼續跑。
- 工作列圖示右鍵「結束遊戲」才會真正離開。
- 設定裡可改「關閉視窗時縮小到工作列」。

## 一鍵更新

程式啟動會向 **R2 的 `/desktop/`** 檢查更新（`latest.yml`）。也可在「設定」按「檢查更新」。下載完不會強制重開；掛機結束後再按「重開並套用更新」。

已安裝、仍指向 GitHub 的舊版，需**手動裝一次**改走 R2 的 Setup，之後才會自動更新。

## 存檔

進度在本機 `%APPDATA%\MapleEnchantSimulator\`（更新安裝檔不會清進度）。桌面版另會自動寫入：

`%APPDATA%\MapleEnchantSimulator\saves\mss-save-idle.mss`（放置）  
`%APPDATA%\MapleEnchantSimulator\saves\mss-save-sim.mss`（模擬器）

仍可用遊戲內「存檔」匯出／匯入 `.mss`。

瀏覽器（github.io）裡的進度**不會自動帶過來**。請先在網頁版「存檔」匯出 `.mss`，安裝桌面版後再匯入。

## 開發者：Cloudflare R2

### 1. 建立 R2

1. Cloudflare Dashboard → R2 → Create bucket（例如 `maple-enchant`）。
2. Manage R2 API Tokens → Create API token（Object Read & Write，限這個 bucket）。
3. 記下 **Account ID**、**Access Key ID**、**Secret Access Key**。
4. 開公開讀取（擇一）：
   - R2 bucket → Settings → **Public access**（r2.dev 子網域），或
   - 綁自訂網域（建議）

公開根網址例：`https://pub-xxxxx.r2.dev`（不要結尾斜線）。

目錄約定：

```
{公開根}/desktop/latest.yml
{公開根}/desktop/MapleEnchantSimulator-Setup-x.y.z.exe
{公開根}/desktop/MapleEnchantSimulator-Setup-x.y.z.exe.blockmap
{公開根}/assets/MapleEnchant-assets-idle-bosses-*.zip
{公開根}/assets/MapleEnchant-assets-skills-*.zip
```

### 2. GitHub Secrets

在 repo → Settings → Secrets and variables → Actions 新增：

| Secret | 內容 |
|---|---|
| `R2_ACCOUNT_ID` | Cloudflare Account ID |
| `R2_ACCESS_KEY_ID` | R2 API token access key |
| `R2_SECRET_ACCESS_KEY` | R2 API token secret |
| `R2_BUCKET` | bucket 名稱 |
| `R2_PUBLIC_BASE_URL` | 公開根網址，如 `https://pub-xxxxx.r2.dev` |

### 3. 本機試傳

```
npm install
set R2_PUBLIC_BASE_URL=https://pub-xxxxx.r2.dev
npm run cdn:sync
npm run dist
set R2_ACCOUNT_ID=...
set R2_ACCESS_KEY_ID=...
set R2_SECRET_ACCESS_KEY=...
set R2_BUCKET=maple-enchant
npm run upload:r2:desktop
```

`desktop/cdn-config.json` 會寫入 `updateBaseUrl`／`assetsBaseUrl`，並打進安裝檔。

### 4. 發佈流程

本機直接跑（用專案裡的 `images/`，不下載資源包）：

```
npm install
npm start
```

打 tag 只發**程式更新**到 R2（`package.json` 的 `version` 必須與 tag 相同）：

```
git tag v1.0.3
git push origin v1.0.3
```

Actions 會：同步 CDN 設定 → 建 Setup → 上傳到 R2 `/desktop/` → GitHub 只寫說明（不傳大檔）。

換 BOSS／技能底包時：

```
# 先改 desktop/asset-manifest.json 的 version
git tag assets-20260918a
git push origin assets-20260918a
```

會壓 zip 並上傳到 R2 `/assets/`。

全包 `images` 約 2.2GB，不能整包塞進單一安裝檔。
