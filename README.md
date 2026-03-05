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
   - Commits everything back to repo

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

## Future

- OpenClaw integration: chat-based DApp generation
- Mode 2: Describe your DApp → AI writes Move + Frontend
