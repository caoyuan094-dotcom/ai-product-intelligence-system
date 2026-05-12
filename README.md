# AI Product Intelligence System

AI 爆品决策系统是一个 Vite + React + Vercel Functions 应用，用于产品关键词分析、市场洞察、痛点拆解、产品方向定义和设计图生成。

## 架构

- 前端：Vite + React
- 后端代理：`api/ai.js`
- 部署：Vercel
- 密钥：只放在后端环境变量里，不写入浏览器和 GitHub 仓库

## AI 供应商

默认支持三类后端供应商：

- OpenAI：`OPENAI_API_KEY`
- Gemini：`GEMINI_API_KEY`
- OpenAI-compatible：`COMPATIBLE_BASE_URL` + `COMPATIBLE_API_KEY`

可以在「系统设置」里切换供应商和模型。前端只会读取供应商状态和默认模型名，不会读取 API Key。

## 环境变量

在 Vercel Project Settings -> Environment Variables 中至少配置一个供应商：

```bash
OPENAI_API_KEY=sk-...
OPENAI_TEXT_MODEL=gpt-4.1-mini
OPENAI_IMAGE_MODEL=gpt-image-1
```

兼容接口示例：

```bash
COMPATIBLE_PROVIDER_LABEL=DeepSeek
COMPATIBLE_BASE_URL=https://api.deepseek.com/v1
COMPATIBLE_API_KEY=sk-...
COMPATIBLE_TEXT_MODEL=deepseek-chat
COMPATIBLE_SUPPORTS_IMAGES=false
```

Gemini 示例：

```bash
GEMINI_API_KEY=AIza...
GEMINI_TEXT_MODEL=gemini-3-flash-preview
GEMINI_IMAGE_MODEL=gemini-2.5-flash-image
```

高级配置可用 `AI_PROVIDERS` JSON 覆盖默认供应商列表，格式见 `.env.example`。

## 本地运行

```bash
npm install
npm run dev
```

纯 Vite dev server 不会运行 Vercel Functions。需要完整联调时使用 Vercel CLI：

```bash
vercel dev
```

## 构建

```bash
npm run lint
npm run build
```

## 部署

将仓库导入 Vercel，配置环境变量后部署。GitHub Pages 不适合这个版本，因为它无法运行后端代理，也无法保护 API Key。
