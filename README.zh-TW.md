# Codegen CI Demo

**推送 Move 程式碼 → 自動產生 TypeScript SDK → 依你的描述用 AI 產生前端 → 完成。**

本專案用 CI 把 Sui Move 智能合約變成完整 DApp。你只要準備合約和簡短描述；CI 會產出型別安全的綁定與 React 前端。

---

## 需要準備的項目（輸入）

| 項目 | 必填 | 說明 |
|------|------|------|
| **Move 合約** | 是 | 放在 `move/` 下的套件（例如 `move/hello_world/`）。CI 會對它跑 `sui move summary` 與 codegen。 |
| **`PROJECT_DESCRIPTION.md`** | 是 | DApp 的簡短描述（風格、功能、使用方式）。會和產出的綁定一起送給 AI，用來產生前端。 |
| **`sui-codegen.config.ts`** | 是 | 告訴 codegen 要處理哪些 Move 套件、輸出到哪裡。新增或改名套件時需對應修改。 |
| **`ANTHROPIC_API_KEY`**（secret） | 是 | GitHub repo secret，供產生前端的 AI 使用。 |
| **`SUI_KEYSTORE_JSON`**（secret）＋ **`ENABLE_TESTNET_PUBLISH`**（variable） | 否 | 要啟用 testnet 發布：在 repo 新增 **variable** **`ENABLE_TESTNET_PUBLISH`** 設為 `true`，並新增 **secret** **`SUI_KEYSTORE_JSON`**（keystore 內容）。CI 會發布並把 package ID 寫入 app。 |

當你 push 的變更涉及 `move/**`、`PROJECT_DESCRIPTION.md`、`sui-codegen.config.ts` 或 `.github/workflows/**` 時會觸發 CI；也可以到 Actions 手動「Run workflow」。

---

## 生成流程（CI 實際步驟）

1. **Checkout** 並安裝 Sui CLI（suiup）與 Node。
2. **（選用）發布到 testnet**  
   若 repo variable **`ENABLE_TESTNET_PUBLISH`** 為 `true` 且 secret **`SUI_KEYSTORE_JSON`** 已設定：發布 Move 套件，從 CLI 輸出解析 published package ID，並以 `PACKAGE_ID` 傳給後續步驟。
3. **Move summary**  
   在 Move 套件目錄（例如 `move/hello_world/`）執行 `sui move summary`。
4. **Codegen（TypeScript 綁定）**  
   執行 `sui-ts-codegen generate`，依 `sui-codegen.config.ts` 將型別安全的 TS 與 BCS 輔助寫入 **`src/generated/`**。
5. **複製綁定到 app 目錄**  
   將 `src/generated/` 複製到 **`src/app/src/generated/`**，讓前端能以 `./generated/...` 引用。
6. **AI 前端生成**  
   執行 `scripts/generate-frontend.mjs`，會：
   - 讀取 **`src/generated/`** 下所有產生的 `.ts` 綁定，
   - 讀取 **`PROJECT_DESCRIPTION.md`**，
   - 若有 **`PACKAGE_ID`**（來自發布步驟）一併傳入，
   - 將以上送給 LLM（Anthropic/OpenAI）產生符合描述、且使用這些綁定的 React + Vite 應用，
   - 將產生的檔案寫入 **`src/app/`**（例如 `App.tsx`、`main.tsx`、`index.html`、`vite.config.ts`、`package.json`），
   - 若存在 `PACKAGE_ID`，會自動寫入產生的 app（例如 `App.tsx` 的 `PACKAGE_ADDRESS`）。
7. **推送到 `codegen` 分支**  
   將 `src/` 下所有變更 commit 並 force-push 到 **`codegen`** 分支。主幹（例如 `master`）不會被修改。

---

## 輸出（你會得到什麼）

| 輸出 | 位置 | 說明 |
|------|------|------|
| **TypeScript 綁定** | `src/generated/`（並複製到 `src/app/src/generated/`） | 依合約產生的型別安全 Move 呼叫與 BCS 型別。 |
| **React 前端** | `src/app/` | AI 產生的應用：`src/App.tsx`、`src/main.tsx`、`index.html`、`vite.config.ts`、`package.json` 等，使用上述綁定；若 CI 有發布，會帶入 package ID。 |
| **分支** | **`codegen`** | 以上內容只會 commit 並 push 到 **`codegen`** 分支。切換或拉取 `codegen` 即可使用產生的 app。 |

整理：**準備** Move、`PROJECT_DESCRIPTION.md`、設定與 secrets → **CI 執行**上述流程 → **結果**在 **`codegen`** 分支的 **`src/generated/`** 與 **`src/app/`**。

---

## 設定

- **必填：** 在 GitHub repo secrets 新增 **`ANTHROPIC_API_KEY`**（供 `generate-frontend.mjs` 呼叫 AI）。
- **選填（testnet 自動發布）：** 若希望 CI 發布 Move 套件並把 package ID 寫入產生的 dApp：
  1. 建立僅供 testnet 使用的錢包（例如 `sui client new-address ed25519`），並從 faucet 領 testnet SUI。
  2. 複製 `~/.sui/sui_config/sui.keystore` 的內容（JSON 陣列）。
  3. 在 repo **Secrets** 新增 **`SUI_KEYSTORE_JSON`** 並貼上該內容。
  4. 在 repo **Variables** 新增 **`ENABLE_TESTNET_PUBLISH`**，值設為 **`true`**（Settings → Secrets and variables → Actions → Variables）。  
  若未將 `ENABLE_TESTNET_PUBLISH` 設為 `true`，CI 不會發布；產生的 app 會使用佔位符，你可手動發布後再改 `PACKAGE_ADDRESS`。

---

## 測試

### 1. 測試 Move 合約

```bash
cd move/hello_world
sui move test
```

### 2. 本地跑前端（需先有已部署的合約）

**2.1 發布合約到 testnet**（若 CI 未代為發布）

```bash
cd move/hello_world
sui client publish
```

記下輸出中的 **Published package ID**。

**2.2 在 app 中填寫合約位址**

編輯 `src/app/src/App.tsx`，將 `PACKAGE_ADDRESS` 設為該 package ID（若已用 `SUI_KEYSTORE_JSON` 且 CI 有發布，通常已自動帶入）。

**2.3 安裝依賴並啟動**

```bash
npm install
cd src/app && npm install && npm run dev
```

在瀏覽器開啟終端顯示的網址（例如 http://localhost:5173），連接錢包即可操作。

### 3. 只驗證 TypeScript 綁定

```bash
npm install
npx sui-ts-codegen generate
# 確認 src/generated/ 有更新且可編譯。
```

---

## 後續規劃

- OpenClaw 整合：以對話產生 DApp。
- Mode 2：描述 DApp → AI 撰寫 Move + 前端。

---

[English](README.md)
