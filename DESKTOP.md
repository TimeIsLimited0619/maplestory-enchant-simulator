# 桌面正式版

給玩家下載到本機玩，不依賴 github.io 分頁。

## 安裝

1. 打開 [GitHub Releases](https://github.com/TimeIsLimited0619/maplestory-enchant-simulator/releases) 下載 `MapleEnchantSimulator-Setup-x.y.z.exe`（**64 位元**遊戲；Setup 安裝程式本身可能顯示成 32 位元，這是 NSIS 包裝，不影響）。
2. 雙擊安裝，可自選安裝資料夾（不要裝在空間不夠的磁碟）。
3. 大型動畫（BOSS／技能，約 1.7GB）有兩種取得方式：
   - **本機資源包（建議網路慢時使用）**：先從 Google Drive 或其他地方下載 `MapleEnchant-assets-idle-bosses-*.zip` 與 `MapleEnchant-assets-skills-*.zip`。把兩個 zip 放在 Setup.exe **同一層**再安裝，或第一次啟動按「已下載的資源」選那個資料夾。程式會偵測並解壓，不再從 GitHub 抓。
   - **直接下載**：第一次啟動按「開始下載」，從 GitHub Release 多連線抓取。
4. 之後可完全離線遊玩。

未簽章時 Windows 可能出現 SmartScreen：選「其他資訊」→「仍要執行」。

## 後台掛機

- 按視窗 X：預設縮小到工作列圖示，狩獵／計時繼續跑。
- 工作列圖示右鍵「結束遊戲」才會真正離開。
- 設定裡可改「關閉視窗時縮小到工作列」。

## 一鍵更新

程式啟動會檢查更新。也可在「設定」按「檢查更新」。下載完不會強制重開（避免打斷掛機）；掛機結束後再按「重開並套用更新」。

## 存檔

進度在本機 `%APPDATA%\MapleEnchantSimulator\`（更新安裝檔不會清進度）。桌面版另會自動寫入：

`%APPDATA%\MapleEnchantSimulator\saves\mss-save-idle.mss`（放置）  
`%APPDATA%\MapleEnchantSimulator\saves\mss-save-sim.mss`（模擬器）

仍可用遊戲內「存檔」匯出／匯入 `.mss`。

瀏覽器（github.io）裡的進度**不會自動帶過來**。請先在網頁版「存檔」匯出 `.mss`，安裝桌面版後再匯入。

## 開發者

本機直接跑（用專案裡的 `images/`，不下載資源包）：

```
npm install
npm start
```

打 tag 發佈 Windows 安裝檔與資源包（`package.json` 的 `version` 必須與 tag 相同，例如 `1.0.0` 對 `v1.0.0`）：

```
git tag v1.0.0
git push origin v1.0.0
```

GitHub Actions 會建 NSIS 安裝檔，並上傳 `idle-bosses`／`skills` 兩個 zip（各低於 GitHub 單檔 2GB）。全包 `images` 約 2.2GB，不能整包塞進單一安裝檔。
