# Codegen CI Demo

**Push Move code → Auto-generate TypeScript SDK → AI generates frontend from your description → Done.**

A CI pipeline that turns Sui Move smart contracts into full-stack DApps. You prepare the contract and a short description; the pipeline produces type-safe bindings and a React frontend.

---

## What to prepare (inputs)

| Input | Required | Description |
|-------|----------|-------------|
| **Move contract** | Yes | Your package under `move/` (e.g. `move/hello_world/`). CI runs `sui move summary` and codegen on it. |
| **`PROJECT_DESCRIPTION.md`** | Yes | Short description of the DApp (style, features, UX). This is sent to the AI together with the generated bindings to produce the frontend. |
| **`sui-codegen.config.ts`** | Yes | Tells codegen which Move package(s) to use and where to write output. Edit if you add or rename packages. |
| **`ANTHROPIC_API_KEY`** (secret) | Yes | GitHub repo secret for the AI that generates the frontend. |
| **`SUI_KEYSTORE_JSON`** (secret) | No | If set, CI publishes the Move package to testnet and injects the published package ID into the generated app. |

CI runs when you push changes to any of: `move/**`, `PROJECT_DESCRIPTION.md`, `sui-codegen.config.ts`, or `.github/workflows/**`. You can also trigger it manually (Actions → Run workflow).

---

## Generation pipeline (what CI does)

1. **Checkout** and install Sui CLI (suiup) + Node.
2. **(Optional) Publish to testnet**  
   If `SUI_KEYSTORE_JSON` is set: publish the Move package, parse the published package ID from the CLI output, and expose it as `PACKAGE_ID` for later steps.
3. **Move summary**  
   `sui move summary` in the Move package directory (e.g. `move/hello_world/`).
4. **Codegen (TypeScript bindings)**  
   `sui-ts-codegen generate` → writes type-safe TS and BCS helpers to **`src/generated/`** (per `sui-codegen.config.ts`).
5. **Copy bindings into app tree**  
   Copies `src/generated/` into **`src/app/src/generated/`** so the frontend can import from `./generated/...`.
6. **AI frontend generation**  
   Runs `scripts/generate-frontend.mjs`, which:
   - Reads **`src/generated/`** (all generated `.ts` bindings),
   - Reads **`PROJECT_DESCRIPTION.md`**,
   - Optionally receives **`PACKAGE_ID`** from the publish step,
   - Sends all of the above to the LLM (Anthropic/OpenAI) to generate a React + Vite app that uses the bindings and matches the description,
   - Writes the app under **`src/app/`** (e.g. `App.tsx`, `main.tsx`, `index.html`, `vite.config.ts`, `package.json`),
   - If `PACKAGE_ID` is set, injects it into the generated app (e.g. `PACKAGE_ADDRESS` in `App.tsx`).
7. **Push to `codegen` branch**  
   Commits everything under `src/` and force-pushes to the **`codegen`** branch. The default branch (e.g. `master`) is not changed.

---

## Output (what you get)

| Output | Location | Description |
|--------|----------|-------------|
| **TypeScript bindings** | `src/generated/` (and copied to `src/app/src/generated/`) | Type-safe Move call helpers and BCS types from your contract. |
| **React frontend** | `src/app/` | AI-generated app: `src/App.tsx`, `src/main.tsx`, `index.html`, `vite.config.ts`, `package.json`, etc. Uses the bindings and, if publish ran, the injected package ID. |
| **Branch** | **`codegen`** | All of the above is committed and pushed only to the `codegen` branch. Check out or pull `codegen` to use the generated app. |

So: **prepare** Move + `PROJECT_DESCRIPTION.md` + config + secrets → **CI runs** the pipeline above → **result** is on the **`codegen`** branch in **`src/generated/`** and **`src/app/`**.

---

## Setup

- **Required:** Add **`ANTHROPIC_API_KEY`** to your GitHub repo secrets (used by `generate-frontend.mjs` for the AI).
- **Optional (testnet auto-publish):** To have CI publish the Move package and inject the package ID into the generated dApp:
  1. Create a testnet-only wallet (e.g. `sui client new-address ed25519`) and fund it with testnet SUI.
  2. Copy the contents of `~/.sui/sui_config/sui.keystore` (the JSON array).
  3. Add a repo secret **`SUI_KEYSTORE_JSON`** with that content.  
  If not set, CI skips publish; the generated app will show a placeholder and you can set `PACKAGE_ADDRESS` manually after publishing.

---

## Testing

### 1. Test the Move contract

```bash
cd move/hello_world
sui move test
```

### 2. Run the frontend locally (after contract is deployed)

**2.1 Publish the contract to testnet** (if CI didn’t do it)

```bash
cd move/hello_world
sui client publish
```

Note the **Published package ID** in the output.

**2.2 Set the contract address in the app**

Edit `src/app/src/App.tsx` and set `PACKAGE_ADDRESS` to that package ID (or rely on CI if you used `SUI_KEYSTORE_JSON`).

**2.3 Install and run the app**

```bash
npm install
cd src/app && npm install && npm run dev
```

Open the URL shown (e.g. http://localhost:5173) and connect your wallet.

### 3. Verify TypeScript bindings only

```bash
npm install
npx sui-ts-codegen generate
# Check that src/generated/ is updated and compiles.
```

---

## Future

- OpenClaw integration: chat-based DApp generation.
- Mode 2: Describe your DApp → AI writes Move + frontend.

---

[中文說明](README.zh-TW.md)
