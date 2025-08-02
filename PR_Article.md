# 🚀 PromptMiner：AI Prompt 的瑞士军刀，让优质 Prompt 触手可及

> **一键提取、编辑、测试别人分享的 AI Prompt，支持 OpenAI、DeepSeek、Claude、通义千问等主流 AI 平台**

在 AI 时代，一个好的 Prompt 往往能决定 AI 输出的质量。你是否遇到过这样的场景：

- 📱 在社交媒体上看到别人分享的神级 Prompt 效果截图，却无法直接使用
- 🔍 想要快速测试和调优网上找到的 Prompt，但需要手动复制粘贴各种参数
- 🛠️ 希望能够可视化编辑 Prompt 内容，而不是在命令行中反复调试
- 🔄 需要在不同 AI 平台之间快速切换测试同一个 Prompt

**PromptMiner** 正是为解决这些痛点而生的开源工具！

## ✨ 核心亮点

### 🎯 智能 curl 解析，一键提取 Prompt
只需将浏览器开发者工具中复制的 curl 命令粘贴进来，PromptMiner 就能自动识别并提取：
- 完整的对话历史（system、user、assistant 消息）
- API 参数配置（temperature、max_tokens、model 等）
- 请求头信息和认证方式
- 自动识别 API 提供商（OpenAI、DeepSeek、Claude、通义千问等）

### 🎨 可视化编辑界面，告别命令行
- **直观的消息管理**：可视化查看和编辑每条消息，支持角色切换
- **实时 Token 统计**：自动计算每条消息和总体的 Token 消耗
- **参数调节面板**：滑块式调节 temperature、max_tokens 等参数
- **语法高亮显示**：清晰展示 JSON 格式的 Prompt 内容

### 🧪 一键 API 测试，即时验证效果
- **流式输出支持**：实时查看 AI 生成过程，就像在官方界面一样
- **多平台兼容**：支持 OpenAI、DeepSeek、Claude、通义千问等主流 API
- **详细结果统计**：显示响应时间、Token 消耗、完成原因等信息
- **错误诊断**：清晰的错误提示，帮助快速定位问题

### 🔒 隐私安全，本地处理
- **零数据上传**：所有解析和编辑都在本地浏览器中完成
- **API 密钥安全**：密钥仅在内存中使用，不会被存储或传输
- **开源透明**：完整源码开放，可自行部署和审计

## 🎬 使用场景演示

### 场景一：快速复现网红 Prompt
```bash
# 1. 从社交媒体看到某个 AI 对话效果很好
# 2. 要求作者分享 curl 命令
# 3. 复制粘贴到 PromptMiner
curl 'https://api.deepseek.com/v1/chat/completions' \
  -H 'authorization: Bearer YOUR_API_KEY' \
  --data-raw '{"model":"deepseek-reasoner","messages":[...]}'

# 4. 一键解析，立即看到完整的 Prompt 结构
# 5. 输入自己的 API 密钥，测试效果
```

### 场景二：Prompt 工程师的调优工作流
1. **导入基础 Prompt**：从 curl 命令快速导入
2. **可视化编辑**：修改 system prompt，调整对话历史
3. **参数调优**：实时调节 temperature、top_p 等参数
4. **A/B 测试**：快速切换不同版本进行对比
5. **效果验证**：一键测试，查看输出质量

### 场景三：团队协作与分享
- **标准化分享**：团队成员可以通过 curl 命令精确分享 Prompt
- **版本管理**：保存不同版本的 Prompt 配置
- **跨平台测试**：同一个 Prompt 在不同 AI 平台上的效果对比

## 🛠️ 技术特色

### 强大的解析引擎
- **智能 curl 解析**：支持复杂的 bash 转义字符和多行格式
- **多格式兼容**：自动适配不同 AI 平台的 API 格式差异
- **容错处理**：对格式不规范的 curl 命令也能尽力解析

### 现代化技术栈
- **Next.js 15**：最新的 React 全栈框架，性能卓越
- **TypeScript**：完整的类型安全，开发体验优秀
- **Tailwind CSS + Radix UI**：现代化的 UI 设计系统
- **AI SDK**：统一的 AI API 调用接口，支持多平台

### 优秀的用户体验
- **响应式设计**：完美适配桌面和移动设备
- **实时反馈**：操作即时响应，无需等待
- **智能提示**：详细的错误信息和使用指导
- **键盘快捷键**：提升高频用户的操作效率

## 📊 项目数据

- **🌟 GitHub Stars**：持续增长中
- **📦 技术栈**：Next.js + TypeScript + Tailwind CSS
- **🔧 依赖管理**：精简的依赖树，快速安装
- **📱 兼容性**：支持所有现代浏览器
- **🚀 部署方式**：支持 Vercel、Netlify 等平台一键部署

## 🎯 目标用户

### AI 爱好者
- 想要快速尝试网上分享的优质 Prompt
- 希望有一个简单易用的 Prompt 测试工具

### Prompt 工程师
- 需要专业的 Prompt 开发和调优工具
- 要求高效的工作流和版本管理

### 开发者
- 正在集成 AI 功能到自己的应用中
- 需要快速验证不同 AI 平台的效果

### 企业团队
- 需要标准化的 Prompt 分享和协作方式
- 要求数据安全和私有化部署

## 🚀 快速开始

### 在线体验
访问 [PromptMiner 在线版本](https://your-domain.com) 立即开始使用

### 本地部署
```bash
# 克隆项目
git clone https://github.com/heimanba/PromptMiner.git

# 安装依赖
cd PromptMiner
npm install

# 启动开发服务器
npm run dev

# 访问 http://localhost:3000
```

### Docker 部署
```bash
# 构建镜像
docker build -t promptminer .

# 运行容器
docker run -p 3000:3000 promptminer
```

## 🌟 社区反馈

> "终于有一个工具能让我快速测试 Twitter 上看到的那些神级 Prompt 了！" 
> —— AI 研究员 @张三

> "作为 Prompt 工程师，这个工具大大提升了我的工作效率，特别是可视化编辑功能。"
> —— 某 AI 公司 Prompt 工程师

> "开源、安全、易用，正是我们团队需要的 Prompt 协作工具。"
> —— 某创业公司 CTO


## 🤝 参与贡献

PromptMiner 是一个完全开源的项目，我们欢迎所有形式的贡献：

- **🐛 Bug 报告**：发现问题请提交 Issue
- **💡 功能建议**：有好想法请在 Discussions 中分享
- **🔧 代码贡献**：欢迎提交 Pull Request
- **📖 文档改进**：帮助完善使用文档和教程
- **🌍 国际化**：支持更多语言版本

### 贡献者福利
- 在项目 README 中展示贡献者头像
- 优先体验新功能
- 参与项目发展方向讨论
- 获得开源贡献证明

---

**PromptMiner** - 让每一个优质 Prompt 都能被轻松复现和优化！

立即访问 [GitHub 仓库](https://github.com/heimanba/PromptMiner) 给我们一个 ⭐，开始你的 AI Prompt 探索之旅！

#AI #Prompt #OpenSource #NextJS #TypeScript #PromptEngineering
