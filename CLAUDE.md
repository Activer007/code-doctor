# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

Code Doctor 是一个基于 AI 的 Python 代码学习辅助工具,通过 Gemini AI 分析代码逻辑,为初学者提供可视化的错误追踪和交互式闪卡复习系统。

## 开发命令

```bash
# 安装依赖
npm install

# 本地开发 (端口 3000)
npm run dev

# 生产构建
npm run build

# 预览生产构建
npm run preview
```

## 环境配置

需要在项目根目录创建 `.env.local` 文件并配置 Gemini API Key:

```
GEMINI_API_KEY=your_api_key_here
```

该密钥通过 Vite 的 `define` 配置注入到 `process.env.API_KEY` 和 `process.env.GEMINI_API_KEY` 中。

## 架构设计

### 核心数据流

1. **代码分析流程**: 用户输入代码 → `analyzeCode()` (geminiService.ts) → Gemini AI 返回结构化诊断数据 → 更新诊断状态并生成闪卡
2. **闪卡复习流程**: 从 localStorage 加载历史闪卡 → 用户答题 → 更新卡片状态 (new/learning/critical/mastered) → 持久化到 localStorage

### 关键类型定义 (types.ts)

- `TraceStep`: 代码执行追踪的每个步骤,包含状态、描述、错误代码对比等
- `Flashcard`: 学习闪卡,包含概念名、正反代码示例、解释和掌握状态统计
- `DiagnosisResponse`: Gemini AI 返回的完整诊断结果
- `DiagnosisState`: 应用中的诊断状态机 (idle/analyzing/complete/error)

### 技术栈说明

- **前端框架**: React 19 + TypeScript + Vite
- **样式**: Tailwind CSS (通过 CDN), 使用自定义玻璃拟态效果 (`.glass-panel`)
- **图标**: Lucide React
- **AI 集成**: Google Gemini SDK (`@google/genai`), 使用 `gemini-2.5-flash` 模型
- **模块导入**: 使用 ESM.sh importmap,无需传统 npm 打包

### 组件结构

- `App.tsx`: 主应用容器,管理全局状态 (诊断状态、闪卡数据)
- `CodeEditor.tsx`: 代码输入编辑器组件
- `TraceMap.tsx`: 可视化代码执行流程的地铁地图组件
- `FlashcardReview.tsx`: 闪卡复习模式,支持答题验证和进度追踪

### Gemini Service 关键点

- 使用结构化输出 (`responseMimeType: "application/json"`) 和 schema 验证
- 实现了指数退避重试机制 (最多 5 次,延迟递增)
- 自动清理不可见字符 (如 `\u00A0`) 避免解析问题
- System instruction 设定为"代码医生"角色,专为零基础 Python 学习者服务

### 闪卡状态管理

- `correctStreak >= 3`: 标记为 mastered (已掌握)
- `incorrectCount >= 3`: 标记为 critical (薄弱项)
- 状态变化实时同步到 `localStorage` 的 `code_doctor_flashcards` 键

## Vite 配置要点

- 端口: 3000, host: 0.0.0.0 (允许网络访问)
- 路径别名: `@` 指向项目根目录
- 环境变量通过 `define` 注入,非传统的 `process.env` 访问方式

## UI 设计系统

- 配色: Slate (深色背景) + Neon (绿/蓝/红强调色)
- 字体: Inter (正文) + JetBrains Mono (代码)
- 视觉风格: 科技感玻璃拟态,带噪点背景纹理
- 动画: 渐入、脉冲、旋转等 CSS 动画
