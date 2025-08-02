# Prompt Miner

> 快速提取和测试别人分享的 AI Prompt，支持 Qwen、OpenAI、DeepSeek、Claude 等多种 API 格式

看到别人的 Prompt 效果非常好，想快速的尝试和试用？Prompt Miner 可以帮你快速提取别人提供的 Prompt，并快速测试和使用。

## ✨ 功能特性

- 🔍 **智能解析**: 从 curl 命令中自动提取 API 调用信息
- 🎯 **多 API 支持**: 支持 Qwen、OpenAI、DeepSeek、Claude 等主流 AI API
- ✏️ **在线编辑**: 可视化编辑 prompt 内容，支持添加/删除/修改消息
- 🧪 **快速测试**: 一键测试修改后的 prompt 效果
- 📊 **详细统计**: 显示 prompt 统计信息和参数设置
- 🎨 **现代界面**: 基于 Next.js + Tailwind CSS 的现代化界面

## 🚀 快速开始

### 环境要求

- Node.js >= 18.17.0
- npm 或 yarn

### 安装依赖

```bash
npm install
# 或
yarn install
```

### 启动开发服务器

```bash
npm run dev
# 或
yarn dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看应用。

## 📖 使用方法

### 1. 获取 curl 命令

从浏览器开发者工具的网络面板复制 curl 命令：

1. 打开浏览器开发者工具 (F12)
2. 切换到 Network (网络) 面板
3. 发送 AI API 请求
4. 右键点击请求，选择 "Copy as cURL"

### 2. 解析 curl 命令

将复制的 curl 命令粘贴到输入框中，点击"解析 curl 命令"按钮。

### 3. 查看和编辑 Prompt

解析成功后，你可以：
- 查看提取的 prompt 内容
- 编辑消息内容
- 添加新的消息
- 修改 API 参数

### 4. 测试 Prompt

在 API 测试区域：
1. 输入你的 API 密钥
2. 确认 API 地址
3. 点击"测试 API"按钮
4. 查看测试结果

## 📝 示例

### 示例 curl 命令

```bash
curl 'https://api.deepseek.com/v1/chat/completions' \
  -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36' \
  -H 'content-type: application/json' \
  -H 'authorization: Bearer YOUR_API_KEY' \
  --data-raw '{"model":"deepseek-reasoner","messages":[{"role":"system","content":"你是一个专业的 AI 助手，请用简洁明了的语言回答问题。"},{"role":"user","content":"请解释什么是机器学习？"}],"temperature":0.7,"stream":false}'
```

### 支持的 API 格式

- **OpenAI**: `https://api.openai.com/v1/chat/completions`
- **DeepSeek**: `https://api.deepseek.com/v1/chat/completions`
- **Claude**: Anthropic API 格式
- **其他**: 兼容 OpenAI 格式的 API

## 🛠️ 技术栈

- **前端框架**: Next.js 14
- **UI 组件**: Radix UI + Tailwind CSS
- **状态管理**: React Hooks
- **类型检查**: TypeScript
- **代码规范**: ESLint + Prettier

## 📁 项目结构

```
PromptMiner/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # 根布局
│   └── page.tsx           # 主页面
├── components/            # React 组件
│   ├── ui/               # UI 基础组件
│   ├── curl-input.tsx    # curl 输入组件
│   ├── prompt-display.tsx # prompt 展示组件
│   ├── api-tester.tsx    # API 测试组件
│   └── toast.tsx         # 通知组件
├── hooks/                # 自定义 Hooks
│   ├── use-curl-parser.ts # curl 解析 Hook
│   └── use-toast.ts      # 通知 Hook
├── lib/                  # 工具库
│   ├── utils.ts          # 通用工具函数
│   └── prompt-extractor.ts # prompt 提取器
└── README.md
```

## 🔒 隐私和安全

- **本地处理**: 所有 curl 解析都在本地进行，不会发送到任何第三方服务器
- **API 密钥安全**: API 密钥仅在本地使用，不会被存储或传输
- **开源透明**: 完全开源，代码透明可审计

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开一个 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [Next.js](https://nextjs.org/) - React 框架
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [Radix UI](https://www.radix-ui.com/) - UI 组件库
- [Lucide React](https://lucide.dev/) - 图标库