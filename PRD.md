# 🩺 Code Doctor 产品需求文档 (PRD)

> **版本**: v2.0-Draft
> **状态**: 规划中
> **最后更新**: 2025-01-10

## 1. 产品愿景 (Vision)

**Code Doctor 2.0** 将从一个“静态代码诊断工具”进化为 **“动态智能编程教学平台”**。
核心理念是 **Test-driven Learning (以考促学)** 与 **Visualized Runtime (可视化运行时)** 的结合。我们将填补“看懂代码怎么跑”（执行可视化）与“听懂代码为什么错”（AI 诊断）之间的空白，并通过科学的测验闭环巩固学习成果。

---

## 2. 核心架构演进 (Architecture)

### 2.1 现状 (v1.x)
*   **模式**: Input -> AI Static Analysis -> Text/Static Visualization
*   **痛点**: 无法运行代码，可视化依赖 AI 臆测，缺乏实战验证。

### 2.2 目标 (v2.0)
*   **模式**: Input -> **Pyodide Runtime (WASM)** -> **Real-time Trace Events** -> **Dynamic Visualization** + **AI Contextual Tutor**
*   **核心模块**:
    *   🫀 **心脏 (Engine)**: 浏览器端 Python 运行时 (Pyodide)。
    *   👁️ **眼睛 (Visualizer)**: 真实的堆栈/内存可视化追踪器。
    *   🧠 **大脑 (Assessment)**: 基于错误的智能推题引擎 & FSRS 记忆算法。

---

## 3. 功能需求详细说明

### 3.1 真实代码执行环境 (Execution Engine) [P0]

用户需要在浏览器中直接运行 Python 代码，无需后端沙箱，且支持常用科学计算库。

*   **技术选型**: **Pyodide** (WebAssembly)
*   **关键特性**:
    *   **零延迟运行**: 利用 Web Worker 进行计算隔离，避免阻塞 UI。
    *   **标准库支持**: 支持 `math`, `random`, `datetime` 等标准库。
    *   **科学计算**: 预加载 `numpy`, `pandas` (通过 Micropip)。
    *   **IO 劫持**: 重定向 `sys.stdout` 和 `sys.stderr` 以捕获输出。

### 3.2 可视化执行追踪 (Live Trace Map) [P0]

从“文本步骤”升级为“代码行级”的动态高亮和内存状态展示。

*   **技术参考**: `futurecoder`, `sys.settrace`
*   **功能逻辑**:
    1.  **Trace 捕获**: 在 Pyodide 中通过 `sys.settrace` 注入钩子。
    2.  **数据结构**: 记录每一步的 `line_no`, `event_type` (call/return/line/exception), `local_variables`, `stack`.
    3.  **UI 呈现**:
        *   **编辑器高亮**: 集成 **Monaco Editor**，根据 Trace 数据逐行高亮代码执行路径。
        *   **变量面板**: 实时显示当前作用域内的变量值变化。

### 3.3 智能测验推荐引擎 (Error-to-Quiz Mapping) [P1]

将用户的“报错”转化为“学习机会”。

*   **场景**: 当用户代码抛出异常（如 `IndexError`）或逻辑错误时。
*   **功能逻辑**:
    1.  **错误分类 (Tagging)**: AI 分析错误并将 tag (如 `list-slicing`, `index-error`) 传给推荐引擎。
    2.  **真题推送 (Pop-Quiz)**:
        *   **数据源**: 本地 JSON 题库 (来源: PCEP 认证真题, GitHub 开源面试题库)。
        *   **逻辑**: 检索匹配 Tag 的题目，在诊断结果旁弹出“📝 真题挑战”。
    3.  **AI 生成**: 若无匹配真题，通过 Gemini 生成一道类似 PCEP 风格的选择题。
    4.  **反馈**: 答对奖励 XP，答错加入“错题本”。

### 3.4 科学复习系统 (Smart Review) [P1]

升级简单的计数算法为业界领先的间隔重复算法。

*   **技术选型**: **FSRS (Free Spaced Repetition Scheduler)**
*   **算法库**: `ts-fsrs`
*   **功能**:
    *   根据用户的反馈（忘记/困难/一般/简单），精确计算下一次复习时间。
    *   引入 **"错题本转考卷"** 模式：每周自动生成包含“错题变种”+“相关真题”的定制试卷。

---

## 4. 技术栈升级计划

| 模块 | 当前技术 | 目标技术 | 备注 |
| :--- | :--- | :--- | :--- |
| **运行时** | 无 (纯 AI 模拟) | **Pyodide (WebAssembly)** | 核心底层变更 |
| **编辑器** | 简单 Textarea/Prism | **Monaco Editor** | 支持断点、Decorations |
| **复习算法** | 简单计数器 | **ts-fsrs** | 引入记忆稳定性/检索性模型 |
| **追踪技术** | AI 生成文本步骤 | **Python `sys.settrace`** | 真实执行数据捕获 |
| **状态管理** | React Context/Props | **Zustand** | 处理复杂的运行时状态 |

---

## 5. 开源资源整合清单

*   **Pyodide**: `pyodide/pyodide` - 运行时核心。
*   **Futurecoder**: `alexmojaki/futurecoder` - **核心参考**，学习其 Trace 逻辑和前端交互设计。
*   **ts-fsrs**: `open-spaced-repetition/ts-fsrs` - 复习算法库。
*   **PCEP/Interview Data**:
    *   `Mitlor66/Python-Certification-Quiz`
    *   `Chalarangelo/30-seconds-of-interviews`

---

## 6. 实施路线图 (Roadmap)

### Phase 1: 建立心脏 (Week 1-2)
*   [ ] 集成 Pyodide 到 Public 资源或 CDN。
*   [ ] 建立 `PyodideService` 和 Web Worker 通信机制。
*   [ ] 实现基础的代码运行 (`Run` 按钮) 和 stdout 输出显示。

### Phase 2: 点亮眼睛 (Week 3-4)
*   [ ] 开发 Python 端的 Trace 脚本 (基于 `sys.settrace`)。
*   [ ] 替换前端编辑器为 **Monaco Editor**。
*   [ ] 实现编辑器内的行执行高亮和简单的变量值显示。

### Phase 3: 构建大脑 (Week 5-6)
*   [ ] 整理并清洗 PCEP/面试题库为 JSON 格式。
*   [ ] 实现 `Error -> Quiz` 推荐逻辑。
*   [ ] 引入 `ts-fsrs` 重构 Flashcard 调度逻辑。
*   [ ] 开发“本周模拟考”功能。
