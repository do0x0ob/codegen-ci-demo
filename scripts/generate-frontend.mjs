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

  // 3. Build prompt
  const bindingsContext = bindingsFiles
    .map(f => `// File: ${f.path}\n${f.content}`)
    .join('\n\n');

  const prompt = `You are a frontend developer. Given the following TypeScript SDK bindings generated from a Sui Move smart contract, and the project description below, generate a complete React + Vite frontend application.

## Project Description
${description}

## Generated TypeScript Bindings
${bindingsContext}

## Requirements
- Use React 18 + Vite
- Use @mysten/dapp-kit for wallet connection
- Create a clean, minimal UI that lets users interact with ALL the contract functions
- Include wallet connect button
- Handle loading states and errors
- Use TypeScript
- Output files: App.tsx, main.tsx, index.html, vite.config.ts, package.json

## Dependencies (use these exact versions in package.json — do not use outdated or non-existent versions)
Use only versions that exist on npm. Prefer current stable:
- "@mysten/sui": "^1.0.0" (do NOT use 0.54 or other invalid versions)
- "@mysten/dapp-kit": "^0.14.0"
- "@tanstack/react-query": "^5.0.0"
- "react": "^18.3.0", "react-dom": "^18.3.0"
- "vite": "^6.0.0", "@vitejs/plugin-react": "^4.3.0"
- "typescript": "^5.6.0"
- "eslint": "^9.0.0" (avoid deprecated eslint@8)
Include a complete package.json with scripts: "dev": "vite", "build": "tsc && vite build", "preview": "vite preview".

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
    console.log(`\n🎉 Generated ${fileCount} files in ${OUTPUT_DIR}`);
  }
}

main().catch(console.error);
