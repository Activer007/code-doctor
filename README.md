<div align="center">
  <h1>🩺 Code Doctor</h1>
  <p>基于 AI 的 Python 代码学习辅助工具</p>
  <p>为初学者提供智能代码诊断、可视化错误追踪和交互式闪卡复习系统</p>
</div>

## ✨ 项目简介

**Code Doctor** 是一个专为 Python 初学者设计的 AI 驱动学习工具，通过 Google Gemini AI 分析代码逻辑，帮助学习者快速定位和理解代码错误，并提供科学的学习方法巩固知识点。

### 核心特性

- 🔍 **智能代码诊断** - AI 自动分析代码逻辑，精准定位错误
- 🗺️ **可视化执行追踪** - 地铁地图式展示代码执行流程，直观理解运行逻辑
- 🎴 **智能闪卡生成** - AI 自动抽象概念，生成针对性学习卡片
- 📚 **间隔重复学习** - 科学的复习系统，追踪掌握进度
- 🎨 **现代化 UI** - 玻璃拟态设计，霓虹配色，科技感十足

## 🚀 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn
- Google Gemini API Key

### 安装步骤

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd code-doctor
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **配置环境变量**

   在项目根目录创建 `.env.local` 文件：
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```

   获取 API Key：https://ai.google.dev/

4. **启动开发服务器**
   ```bash
   npm run dev
   ```

   访问 http://localhost:3000

## 📖 核心功能

### 1. 代码诊断

输入 Python 代码，AI 会：
- 追踪代码执行流程
- 识别逻辑错误和语法问题
- 提供详细的错误说明和修复建议
- 生成错误对比（错误代码 vs 正确代码）

### 2. 执行追踪（Trace Map）

以地铁地图形式可视化代码执行：
- 🟢 绿色节点：执行成功
- 🟡 黄色节点：警告提示
- 🔴 红色节点：错误位置
- 每个节点包含详细的步骤说明和代码对比

### 3. 智能闪卡

AI 自动从错误中抽象出编程概念：
- **正面**：展示错误代码
- **背面**：正确代码 + 原理解释
- **智能抽象**：从具体错误中提炼通用编程模式

### 4. 复习系统

科学的学习进度追踪：
- 🆕 **New**：新卡片
- 📖 **Learning**：学习中
- ⚠️ **Critical**：薄弱项（连续错误 3 次）
- ✅ **Mastered**：已掌握（连续正确 3 次）

## 🛠️ 技术栈

### 核心技术

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 19.2.3 | UI 框架 |
| TypeScript | 5.8.2 | 类型系统 |
| Vite | 6.2.0 | 构建工具 |
| Tailwind CSS | CDN | 样式框架 |
| Google GenAI | 1.34.0 | AI SDK |
| Lucide React | 0.469.0 | 图标库 |

### 架构亮点

- **ESM.sh Import Map** - 零打包依赖，直接从 CDN 加载模块
- **结构化 AI 输出** - JSON Schema 验证确保类型安全
- **智能重试机制** - 指数退避策略提高稳定性
- **本地持久化** - localStorage 保存学习进度

## 📁 项目结构

```
code-doctor/
├── App.tsx                    # 主应用容器
├── types.ts                   # TypeScript 类型定义
├── index.tsx                  # React 入口
├── index.html                 # HTML 模板（含 Import Map）
├── vite.config.ts            # Vite 配置
├── components/
│   ├── CodeEditor.tsx        # 代码编辑器
│   ├── TraceMap.tsx          # 执行追踪可视化
│   └── FlashcardReview.tsx   # 闪卡复习模式
└── services/
    └── geminiService.ts      # Gemini AI 服务
```

## 🎨 设计系统

### 配色方案

- **背景**：Slate-950 (#020617)
- **文本**：Slate-200
- **强调绿**：Neon Green (#10b981)
- **强调蓝**：Neon Blue (#3b82f6)
- **强调红**：Neon Red (#ef4444)

### 视觉特效

- 玻璃拟态（Glassmorphism）面板
- 噪点背景纹理
- 流畅的过渡动画
- 自定义滚动条

### 字体

- **正文**：Inter
- **代码**：JetBrains Mono

## 💻 开发命令

```bash
# 安装依赖
npm install

# 本地开发（端口 3000）
npm run dev

# 生产构建
npm run build

# 预览生产构建
npm run preview

# 类型检查
npm run type-check
```

## 🔧 环境配置详解

### API Key 配置

`.env.local` 文件内容：
```env
GEMINI_API_KEY=your_api_key_here
```

API Key 通过 Vite 的 `define` 配置注入：
```typescript
// vite.config.ts
define: {
  'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
  'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
}
```

## 📊 数据流架构

### 代码分析流程

```
用户输入代码
    ↓
analyzeCode() [geminiService.ts]
    ↓
Gemini AI (gemini-2.5-flash)
    ↓
结构化 JSON 响应
    ↓
更新诊断状态
    ↓
生成 TraceMap 可视化
    ↓
创建/更新 Flashcards
    ↓
持久化到 localStorage
```

### 闪卡复习流程

```
localStorage 加载历史闪卡
    ↓
用户答题（输入正确代码）
    ↓
验证逻辑（规范化比较）
    ↓
更新统计
    ├─ correctStreak ≥ 3 → mastered
    └─ incorrectCount ≥ 3 → critical
    ↓
实时同步 localStorage
```

## 🎯 使用示例

### 诊断 Python 代码

```python
# 输入错误代码
df = pd.DataFrame({'A': [1, 2, 3]})
result = df['A', 'B']  # 错误：多列索引语法
```

**AI 诊断结果**：
1. 识别错误：索引语法错误
2. 生成闪卡：DataFrame 多列索引概念
3. 提供对比：错误 vs 正确代码
4. 解释原理：使用列表进行多列选择

### 复习闪卡

1. 点击"复习闪卡"进入复习模式
2. 查看错误代码（红色删除线）
3. 输入正确的修复代码
4. 查看答案和原理解释
5. 系统自动更新掌握状态

## 🔮 核心类型定义

### TraceStep - 执行追踪步骤
```typescript
interface TraceStep {
  status: 'success' | 'warning' | 'error';
  title: string;          // 步骤标题
  desc: string;           // 详细描述
  isError: boolean;       // 是否错误
  badCode?: string;       // 错误代码
  goodCode?: string;      // 正确代码
  reason?: string;        // 错误原因
  tip?: string;          // 改进提示
}
```

### Flashcard - 学习闪卡
```typescript
interface Flashcard {
  id: string;
  concept: string;        // 抽象概念
  frontCode: string;      // 错误代码
  backCode: string;       // 正确代码
  explanation: string;    // 原理解释
  stats: {
    correctStreak: number;     // 连续正确次数
    incorrectCount: number;    // 累积错误次数
    status: 'new' | 'learning' | 'critical' | 'mastered';
  };
}
```

## 🚀 部署

### 生产构建

```bash
npm run build
```

构建产物输出到 `dist/` 目录。

### 部署到静态托管

支持部署到：
- Vercel
- Netlify
- GitHub Pages
- Cloudflare Pages

## 🤝 贡献指南

欢迎贡献代码、报告问题或提出建议！

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📝 许可证

本项目采用 MIT 许可证 - 详见 LICENSE 文件

## 🙏 致谢

- [Google Gemini AI](https://ai.google.dev/) - AI 驱动
- [Vite](https://vitejs.dev/) - 构建工具
- [React](https://react.dev/) - UI 框架
- [Tailwind CSS](https://tailwindcss.com/) - 样式框架
- [Lucide](https://lucide.dev/) - 图标库

## 📧 联系方式

如有问题或建议，欢迎通过以下方式联系：

- 提交 Issue
- 发送 Pull Request
- Email: your-email@example.com

---

<div align="center">
  <p>Made with ❤️ for Python learners</p>
  <p>Powered by Google Gemini AI</p>
</div>
