# Codegen CI Demo

**Push Move code → Auto-generate TypeScript SDK → Auto-generate Frontend → Done.**

## What This Does

```
Move Contract → sui move summary → @mysten/codegen → AI Frontend Generator → Deployed DApp
```

A CI pipeline that turns Sui Move smart contracts into full-stack DApps automatically.

## How It Works

1. **Write Move code** in `move/` directory
2. **Push to GitHub** — CI triggers automatically
3. **CI Pipeline:**
   - Runs `sui move summary` to analyze your contract
   - Runs `@mysten/codegen` to generate type-safe TypeScript bindings
   - Feeds bindings + project description to AI → generates React frontend
   - Pushes generated code to the `codegen` branch (main stays unchanged)

## Files

| Path | Purpose |
|------|---------|
| `move/` | Your Move smart contracts |
| `PROJECT_DESCRIPTION.md` | Describe your DApp (AI reads this) |
| `sui-codegen.config.ts` | Codegen configuration |
| `src/generated/` | Auto-generated TS bindings |
| `src/app/` | Auto-generated frontend |
| `.github/workflows/codegen.yml` | CI pipeline |

## Usage

1. Clone this repo
2. Write your Move contract in `move/`
3. Edit `PROJECT_DESCRIPTION.md` to describe what you want
4. Push — CI does the rest

## Setup

Add `ANTHROPIC_API_KEY` to your GitHub repo secrets.

## Testing

### 1. 測試 Move 合約

```bash
cd move/hello_world
sui move test
```

### 2. 本地跑前端（需先部署合約）

**2.1 部署合約到 Testnet**

```bash
cd move/hello_world
sui client publish --gas-budget 100000000
```

記下輸出裡的 **Published package ID**（例如 `0x1234...`）。

**2.2 填寫合約位址**

編輯 `src/app/src/App.tsx`，把第 7 行的 `PACKAGE_ADDRESS` 換成你剛部署的 package ID：

```ts
const PACKAGE_ADDRESS = '0x你的_package_id'
```

**2.3 安裝依賴並啟動**

```bash
# 根目錄依賴（codegen 用）
npm install

# 前端依賴與 dev server
cd src/app && npm install && npm run dev
```

瀏覽器打開終端顯示的網址（通常是 http://localhost:5173），連接錢包後即可建立 / 更新 Greeting。

### 3. 只驗證 TypeScript 綁定（不跑前端）

```bash
npm install
npx sui-ts-codegen generate   # 會讀 move/ 並輸出到 src/generated
# 檢查 src/generated/ 是否有更新、無編譯錯誤即可
```

## Future

- OpenClaw integration: chat-based DApp generation
- Mode 2: Describe your DApp → AI writes Move + Frontend
