# AI Product Intelligence System

AI 爆品决策系统是一个 Vite + React 前端应用，用于产品关键词分析、市场洞察、痛点拆解、产品方向定义和设计图生成。

## 使用方式

1. 打开部署后的站点。
2. 进入「系统设置」，填写自己的 Gemini API Key。
3. 回到「控制面板」，输入产品关键词并运行分析。

Gemini API Key 只保存在当前浏览器的 `localStorage`，不会写入 GitHub 仓库，也不会在构建时打包进静态文件。

## 本地运行

```bash
npm install
npm run dev
```

开发服务默认运行在 `http://localhost:3000`。

## 构建

```bash
npm run lint
npm run build
```

## GitHub Pages 部署

仓库包含 `.github/workflows/deploy.yml`。推送到 `main` 分支后，GitHub Actions 会自动安装依赖、构建 `dist`，并发布到 GitHub Pages。

部署完成后的地址通常是：

```text
https://<github-user>.github.io/<repository-name>/
```

如果第一次部署没有生成页面，请在 GitHub 仓库的 `Settings -> Pages` 中确认 Source 使用 `GitHub Actions`。
