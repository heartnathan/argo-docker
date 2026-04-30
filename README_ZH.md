# nodejs-argo 隧道代理

這是一個強大的 Argo 隧道部署工具，專為 PaaS 和各類玩具平台設計。支援多種代理協定（VLESS、VMess、Trojan 等）。

## 鄭重聲明
* 本項目僅限個人使用，禁止用於任何商業行為。
* 請遵守當地法律法規，禁止濫用作為公共代理。

## 功能說明
* 針對 Node.js 環境開發，適用於 PaaS 平台。
* 採用 Argo 隧道技術，無需公網 IP。
* 若未填寫 `ARGO_DOMAIN` 與 `ARGO_AUTH`，將自動啟用臨時隧道。

## 環境變數
| 變數名 | 必須 | 預設值 | 說明 |
|--------|------|--------|------|
| PROJECT_URL | 否 | - | 項目分配的域名 |
| UUID | 否 | (隨機) | 用戶 UUID |
| ARGO_DOMAIN | 否 | - | Argo 固定隧道域名 |
| ARGO_AUTH | 否 | - | Argo 固定隧道密鑰/Token |
| PORT | 否 | 3000 | HTTP 服務監聽端口 |

## 快速開始
1. 將 `index.js` 與 `package.json` 上傳至你的平台。
2. 設定必要的環境變數。
3. 啟動後透過 `/sub` 路徑獲取訂閱節點。