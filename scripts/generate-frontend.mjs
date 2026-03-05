/**
 * AI Frontend Generator
 * 
 * Reads codegen output (TS bindings) and project description,
 * then calls LLM API to generate a React frontend.
 */
import fs from 'fs';
import path from 'path';

const GENERATED_DIR = './src/generated';
const OUTPUT_DIR = './src/app';
const DESCRIPTION_FILE = './PROJECT_DESCRIPTION.md';

async function main() {
  // 1. Read generated bindings
  const bindingsFiles = [];
  if (fs.existsSync(GENERATED_DIR)) {
    const files = fs.readdirSync(GENERATED_DIR, { recursive: true });
    for (const file of files) {
      const filePath = path.join(GENERATED_DIR, file);
      if (filePath.endsWith('.ts') && fs.statSync(filePath).isFile()) {
        bindingsFiles.push({
          path: filePath,
          content: fs.readFileSync(filePath, 'utf-8'),
        });
      }
    }
  }

  if (bindingsFiles.length === 0) {
    console.error('No generated bindings found in', GENERATED_DIR);
    process.exit(1);
  }

  // 2. Read project description
  let description = 'A simple Sui DApp';
  if (fs.existsSync(DESCRIPTION_FILE)) {
    description = fs.readFileSync(DESCRIPTION_FILE, 'utf-8');
  }

  const packageId = process.env.PACKAGE_ID || '';
  if (packageId) {
    console.log('📦 Using published package ID:', packageId);
  }

  // 3. Build prompt
  const bindingsContext = bindingsFiles
    .map(f => `// File: ${f.path}\n${f.content}`)
    .join('\n\n');

  const prompt = `You are a frontend developer. Given the following TypeScript SDK bindings generated from a Sui Move smart contract, and the project description below, generate a complete React + Vite frontend application.

## Project Description
${description}

## Generated TypeScript Bindings
${bindingsContext}

## Sui Frontend (dApp Kit) — MUST follow exactly

Do NOT use the deprecated \`@mysten/dapp-kit\`. Use the new \`@mysten/dapp-kit-react\` with \`createDAppKit\` and \`SuiGrpcClient\`.

1. **Create \`src/dapp-kit.ts\`** (or \`dapp-kit.ts\` next to App) with:
   - \`import { createDAppKit } from '@mysten/dapp-kit-react';\`
   - \`import { SuiGrpcClient } from '@mysten/sui/grpc';\`
   - \`const GRPC_URLS = { testnet: 'https://fullnode.testnet.sui.io:443', mainnet: 'https://fullnode.mainnet.sui.io:443' };\`
   - \`export const dAppKit = createDAppKit({ networks: ['testnet', 'mainnet'], defaultNetwork: 'testnet', createClient: (network) => new SuiGrpcClient({ network, baseUrl: GRPC_URLS[network] }) });\`
   - Add: \`declare module '@mysten/dapp-kit-react' { interface Register { dAppKit: typeof dAppKit; } }\`

2. **\`main.tsx\`** (or entry): Wrap app with \`QueryClientProvider\` and \`DAppKitProvider\`:
   - \`import { QueryClient, QueryClientProvider } from '@tanstack/react-query';\`
   - \`import { DAppKitProvider } from '@mysten/dapp-kit-react';\`
   - \`import { dAppKit } from './dapp-kit';\` (or \`./src/dapp-kit\`)
   - \`<QueryClientProvider client={new QueryClient()}><DAppKitProvider dAppKit={dAppKit}><App /></DAppKitProvider></QueryClientProvider>\`

3. **In components**: Use \`useCurrentAccount()\`, \`useCurrentClient()\`, \`useDAppKit()\` from \`@mysten/dapp-kit-react\`.
   - For signing + executing: \`const dAppKit = useDAppKit(); const result = await dAppKit.signAndExecuteTransaction({ transaction: tx });\`
   - Check \`result.FailedTransaction\` for failure; success digest is \`result.Transaction.digest\`.
   - Do NOT use \`useSignAndExecuteTransaction\`, \`useSuiClient\`, or \`SuiClientProvider\`/ \`WalletProvider\` (old API).
   - For on-chain data: \`useCurrentClient()\` with \`useQuery\` from \`@tanstack/react-query\`, with \`enabled: !!account\` when the query needs a connected wallet.

4. **Connect button**: \`import { ConnectButton } from '@mysten/dapp-kit-react';\` and render \`<ConnectButton />\`.

5. **Package address**: In your app component or a config, set \`const PACKAGE_ADDRESS = '${packageId || '0x...'}';'\` (replace 0x... with the provided ID when present).

## Requirements
- Use React 18 + Vite, TypeScript
- Use \`@mysten/dapp-kit-react\` and \`SuiGrpcClient\` only (no \`@mysten/dapp-kit\`, no \`SuiJsonRpcClient\`)
- Create a clean, minimal UI that lets users interact with ALL the contract functions
- Include \`<ConnectButton />\`, handle loading and errors
- Output files: **src/dapp-kit.ts**, **src/App.tsx**, **src/main.tsx**, **index.html**, **vite.config.ts**, **package.json**

## Dependencies (package.json — use these exact versions)
- "@mysten/dapp-kit-react": "^1.1.0" (or latest; must match @mysten/sui peer)
- "@mysten/sui": "^2.6.0" (required: 2.x; 1.x is incompatible with dApp Kit and will break the build)
- "@tanstack/react-query": "^5.0.0"
- "react": "^18.3.0", "react-dom": "^18.3.0"
- "vite": "^6.0.0", "@vitejs/plugin-react": "^4.3.0"
- "typescript": "^5.6.0"
- "eslint": "^9.0.0"
Scripts: "dev": "vite", "build": "tsc && vite build", "preview": "vite preview".

## Output Format
For each file, output:
---FILE: <filepath>---
<content>
---END FILE---`;

  // 4. Call LLM API
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY;
  const useAnthropic = !!process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.error('No API key found. Set ANTHROPIC_API_KEY or OPENAI_API_KEY');
    process.exit(1);
  }

  console.log('🤖 Generating frontend with AI...');

  let responseText;

  if (useAnthropic) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    const data = await res.json();
    responseText = data.content?.[0]?.text || '';
  } else {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 8000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    const data = await res.json();
    responseText = data.choices?.[0]?.message?.content || '';
  }

  // 5. Parse and write files
  const fileRegex = /---FILE:\s*(.+?)---\n([\s\S]*?)---END FILE---/g;
  let match;
  let fileCount = 0;

  while ((match = fileRegex.exec(responseText)) !== null) {
    const filePath = match[1].trim();
    const content = match[2].trim();
    const fullPath = path.join(OUTPUT_DIR, filePath);

    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content);
    console.log(`  ✅ ${fullPath}`);
    fileCount++;
  }

  if (fileCount === 0) {
    // Fallback: save raw response
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    fs.writeFileSync(path.join(OUTPUT_DIR, 'ai-output.txt'), responseText);
    console.log('⚠️  Could not parse files, saved raw output to ai-output.txt');
  } else {
    // 6. If we have PACKAGE_ID, replace placeholder in App.tsx
    const packageId = process.env.PACKAGE_ID || '';
    const appPaths = ['src/App.tsx', 'App.tsx'];
    for (const rel of appPaths) {
      const appPath = path.join(OUTPUT_DIR, rel);
      if (packageId && fs.existsSync(appPath)) {
        let appContent = fs.readFileSync(appPath, 'utf-8');
        const updated = appContent.replace(
          /const PACKAGE_ADDRESS\s*=\s*['"]0x[^'"]*['"]\s*;?/,
          `const PACKAGE_ADDRESS = '${packageId}';`
        );
        if (updated !== appContent) {
          fs.writeFileSync(appPath, updated);
          console.log(`  ✅ Injected PACKAGE_ADDRESS in ${rel}`);
        }
      }
    }
    console.log(`\n🎉 Generated ${fileCount} files in ${OUTPUT_DIR}`);
  }
}

main().catch(console.error);
