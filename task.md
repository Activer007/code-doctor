# 🗺️ Code Doctor 产品路线图与任务清单

> **版本**: v1.2.0
> **更新日期**: 2025-01-10
> **项目状态**: 核心功能已完成，进入优化和扩展阶段

---

## 📊 项目当前状态

### ✅ 已完成功能 (v1.1.0)

| 功能模块 | 状态 | 覆盖率 |
|---------|------|--------|
| **AI 代码诊断** | ✅ 完成 | 100% |
| **执行追踪可视化** | ✅ 完成 | 100% |
| **智能闪卡生成** | ✅ 完成 | 100% |
| **间隔重复学习** | ✅ 完成 | 100% |
| **历史记录系统** | ✅ 完成 | 100% |
| **单元测试** | ✅ 完成 | 70% 覆盖率 |

### 🎯 当前痛点

1. **缺少真实代码执行环境** - 无法实际运行 Python 代码
2. **学习算法简单** - 仅使用计数，而非科学的间隔重复算法
3. **缺少学习路径** - 无系统化的课程体系
4. **无对话式交互** - 缺少 AI 导师功能
5. **学习进度单一** - 缺少成就系统和社交元素

---

## 🚀 产品升级路线图

## 阶段一：核心体验增强 (Q1 2025)

### 🔴 P0 - 最高优先级

#### 1.1 真正的代码执行环境 ⭐⭐⭐⭐⭐
**预期影响**: 极大 | **开发成本**: 中

**功能描述**:
- 集成 Pyodide (WebAssembly Python) 或在线沙箱
- 实时代码运行和错误捕获
- 执行结果与 AI 诊断对比验证
- 支持标准库和常见第三方库

**技术方案**:
```typescript
// 方案 A: Pyodide (推荐)
import { python } from 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js';

async function runPythonCode(code: string) {
  const pyodide = await loadPyodide();
  try {
    const result = await pyodide.runPythonAsync(code);
    return { success: true, output: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// 方案 B: Piston (在线 API)
async function runCodeWithPiston(code: string) {
  const response = await fetch('https://emkc.org/api/v2/piston/execute', {
    method: 'POST',
    body: JSON.stringify({
      language: 'python',
      version: '3.10',
      files: [{ content: code }]
    })
  });
  return response.json();
}
```

**验收标准**:
- [ ] 用户可以运行 Python 代码并看到结果
- [ ] 执行错误能被捕获并传递给 AI 诊断
- [ ] 支持基本的 print、变量、函数
- [ ] 响应时间 < 3 秒

**预期效果**: 从"诊断工具"升级为"完整学习平台"

---

#### 1.2 SM-2 间隔重复算法 ⭐⭐⭐⭐⭐
**预期影响**: 极高 | **开发成本**: 低

**功能描述**:
- 实现科学的 SM-2 算法（SuperMemo 2）
- 基于遗忘曲线计算复习时间
- 个性化难度调整
- 替代现有的简单计数逻辑

**实现方案**:
```typescript
// services/spacedRepetition.ts
interface SM2Card {
  easeFactor: number;        // 默认 2.5
  interval: number;          // 复习间隔（天）
  repetitions: number;       // 连续正确次数
}

function calculateNextReview(
  card: SM2Card,
  quality: number  // 0-5: 5=完美记忆, 0=完全忘记
): SM2Card {
  if (quality >= 3) {
    if (card.repetitions === 0) {
      card.interval = 1;
    } else if (card.repetitions === 1) {
      card.interval = 6;
    } else {
      card.interval = Math.round(card.interval * card.easeFactor);
    }
    card.repetitions++;
  } else {
    card.repetitions = 0;
    card.interval = 1;
  }

  card.easeFactor = Math.max(1.3,
    card.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  return card;
}

// 计算下次复习时间
function getNextReviewDate(card: SM2Card): Date {
  return new Date(Date.now() + card.interval * 24 * 60 * 60 * 1000);
}
```

**验收标准**:
- [ ] 实现完整的 SM-2 算法
- [ ] 闪卡根据遗忘曲线自动安排复习
- [ ] 用户可以看到"下次复习时间"
- [ ] 测试覆盖率 > 90%

**预期效果**: 学习效率提升 30-50%

---

#### 1.3 对话式 AI 导师 ⭐⭐⭐⭐⭐
**预期影响**: 极高 | **开发成本**: 中

**功能描述**:
- 类似 ChatGPT 的对话界面
- 深度上下文感知（知道用户的错误历史、学习进度）
- 主动教学和推荐
- 多模态输出（代码、流程图、语音）

**核心特性**:
1. **智能上下文**
   - 知道用户当前正在调试的代码
   - 了解用户的薄弱知识点
   - 记住之前犯过的类似错误

2. **主动学习路径**
   - AI 分析错误模式
   - 推荐针对性练习
   - 动态调整学习计划

3. **多模态教学**
   - 生成代码流程图 (Mermaid)
   - 语音讲解 (TTS)
   - 可视化数据结构

**实现方案**:
```typescript
// services/tutorService.ts
interface TutorMessage {
  role: 'user' | 'assistant';
  content: string;
  context?: {
    code?: string;
    diagnosisId?: string;
    flashcardId?: string;
  };
}

async function chatWithTutor(
  messages: TutorMessage[],
  userContext: UserContext
): Promise<TutorResponse> {
  const systemPrompt = `
你是 Code Doctor 的专属编程导师。

## 学生背景
- 当前水平: ${userContext.level}
- 薄弱知识点: ${userContext.weakConcepts.join(', ')}
- 学习风格: ${userContext.learningStyle}

## 当前上下文
- 正在调试: ${messages[messages.length - 1].context?.code}
- 最近错误: ${userContext.recentErrors}

## 教学策略
1. 使用简单易懂的语言和比喻
2. 循序渐进地引导思考
3. 鼓励学生尝试
4. 适时生成练习题
`;

  const response = await gemini.chat({
    system: systemPrompt,
    messages: messages,
    temperature: 0.7
  });

  return {
    reply: response.text,
    suggestedActions: extractActions(response),
    nextTopic: recommendNextTopic(userContext)
  };
}
```

**验收标准**:
- [ ] 对话界面流畅自然
- [ ] AI 能记住用户的学习历史
- [ ] 支持代码讲解、错误分析、练习推荐
- [ ] 响应时间 < 2 秒

**预期效果**: 用户体验提升 80%，粘性显著增强

---

### 🟡 P1 - 高优先级

#### 1.4 学习路径系统 ⭐⭐⭐⭐
**预期影响**: 高 | **开发成本**: 高

**功能描述**:
- 预设 Python 学习路线（基础 → 进阶 → 数据分析）
- 知识图谱可视化
- 先修依赖关系
- 进度追踪

**技术方案**:
```typescript
// types.ts
interface LearningPath {
  id: string;
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedHours: number;
  modules: LearningModule[];
  prerequisites: string[];
}

interface LearningModule {
  id: string;
  title: string;
  concepts: string[];
  exercises: Exercise[];
  order: number;
  isCompleted: boolean;
}

// 示例路径
const pythonPath: LearningPath = {
  id: 'python-basics',
  name: 'Python 基础入门',
  description: '从零开始学习 Python 编程',
  difficulty: 'beginner',
  estimatedHours: 20,
  modules: [
    {
      id: 'module-1',
      title: '变量和数据类型',
      concepts: ['变量赋值', '数字类型', '字符串', '布尔值'],
      exercises: [],
      order: 1,
      isCompleted: false
    },
    // ...
  ],
  prerequisites: []
};
```

**UI 设计**:
```
Python 基础路径 (20h)
├─ 📖 变量和数据类型 [██████████] 100%
├─ 📖 控制流程 [███████░░░] 70%
├─ 📖 函数定义 [███░░░░░░░] 30%
├─ 📖 数据结构 [░░░░░░░░░░] 0%  🔒 未解锁
└─ 📖 文件操作 [🔒 未解锁]
```

---

#### 1.5 内存可视化 ⭐⭐⭐⭐
**预期影响**: 高 | **开发成本**: 中

**功能描述**:
- 变量状态图
- 内存引用可视化（箭头连接）
- 数据结构内部展示

**技术方案**:
```typescript
// components/MemoryVisualizer.tsx
interface MemoryState {
  variables: Map<string, VariableInfo>;
  stack: StackFrame[];
  heap: HeapObject[];
}

interface VariableInfo {
  name: string;
  type: string;
  value: any;
  references?: string[];
}

function visualizeCodeExecution(code: string) {
  // 使用 Python Tutor 的 API 或自己实现
  // https://pythontutor.com/
}
```

---

#### 1.6 多模态学习 ⭐⭐⭐
**预期影响**: 中 | **开发成本**: 中

**功能描述**:
- AI 生成代码流程图
- 语音讲解 (TTS)
- 生成代码注释

---

### 🟢 P2 - 中优先级

#### 1.7 成就系统 ⭐⭐⭐
**预期影响**: 中 | **开发成本**: 低

**功能描述**:
- 经验值 (XP) 系统
- 徽章成就
- 段位等级（青铜 → 钻石）
- 学习连续天数追踪

---

#### 1.8 社区分享 ⭐⭐
**预期影响**: 中 | **开发成本**: 低

**功能描述**:
- 诊断报告分享链接
- 闪卡包导出/导入
- 社区精选错误案例

---

## 阶段二：平台化扩展 (Q2 2025)

### 🔴 P0 - VS Code 插件 ⭐⭐⭐⭐⭐
**预期影响**: 高 | **开发成本**: 高

**功能描述**:
- VS Code 扩展
- 编辑器内实时诊断
- 与工作流集成

**技术方案**:
```typescript
// extension.ts
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  // 诊断命令
  const diagnoseCmd = vscode.commands.registerCommand(
    'codeDoctor.diagnose',
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;

      const code = editor.document.getText();
      const diagnosis = await analyzeCode(code);

      // 在侧边栏显示结果
      const panel = vscode.window.createWebviewPanel(
        'codeDoctor',
        'Code Doctor',
        vscode.ViewColumn.Beside,
        { enableScripts: true }
      );
      panel.webview.html = generateReportHTML(diagnosis);
    }
  );

  // 实时错误提示
  const diagnostics = vscode.languages.createDiagnosticCollection('codeDoctor');
  context.subscriptions.push(diagnoseCmd, diagnostics);
}
```

---

### 🟡 P1 - 多语言支持 ⭐⭐⭐
**预期影响**: 中 | **开发成本**: 高

**功能描述**:
- 支持 JavaScript
- 支持 Java
- 支持 C++
- 语言切换功能

---

### 🟢 P2 - LMS 教师端 ⭐⭐
**预期影响**: 中 | **开发成本**: 极高

**功能描述**:
- 教师创建课程和练习
- 学生进度追踪
- 班级错误模式分析

---

## 阶段三：商业化准备 (Q3-Q4 2025)

### 🟡 P1 - 付费功能 ⭐⭐⭐
**预期影响**: 高 | **开发成本**: 中

**功能描述**:
- 免费 vs 付费功能区分
- 订阅管理系统
- 使用量限制

**定价策略**:
```
免费版:
- 每月 50 次诊断
- 基础闪卡复习
- 社区支持

专业版 ($9.99/月):
- 无限诊断
- AI 导师对话
- 高级统计
- 优先支持

教育版 ($29.99/月):
- 班级管理
- 学生进度追踪
- 定制课程
- 技术支持
```

---

## 🔧 技术债务

### 高优先级

1. **状态管理升级**
   - [ ] 从 useState 迁移到 Zustand/Jotai
   - [ ] 统一状态管理逻辑
   - [ ] 优化性能

2. **类型系统增强**
   - [ ] 使用 Zod 进行运行时验证
   - [ ] 完善 TypeScript 类型定义
   - [ ] 添加类型导出

3. **测试覆盖率提升**
   - [ ] 修复 16 个失败的测试
   - [ ] 目标：95% 测试通过率
   - [ ] 添加 E2E 测试

### 中优先级

1. **性能优化**
   - [ ] 代码分割和懒加载
   - [ ] 虚拟列表（大历史记录）
   - [ ] 图片懒加载

2. **错误边界**
   - [ ] 添加 ErrorBoundary
   - [ ] 优雅的错误处理
   - [ ] 错误上报

3. **可访问性**
   - [ ] ARIA 标签完善
   - [ ] 键盘导航支持
   - [ ] 屏幕阅读器适配

---

## 📊 功能优先级矩阵

| 功能 | 优先级 | 预期影响 | 开发成本 | ROI | 阶段 |
|------|--------|----------|----------|-----|------|
| **真正的代码执行** | P0 | 极高 | 中 | ⭐⭐⭐⭐⭐ | Q1 |
| **SM-2 算法** | P0 | 极高 | 低 | ⭐⭐⭐⭐⭐ | Q1 |
| **对话式 AI 导师** | P0 | 极高 | 中 | ⭐⭐⭐⭐⭐ | Q1 |
| **学习路径系统** | P1 | 高 | 高 | ⭐⭐⭐⭐ | Q1 |
| **内存可视化** | P1 | 高 | 中 | ⭐⭐⭐⭐ | Q1 |
| **多模态学习** | P2 | 中 | 中 | ⭐⭐⭐ | Q1 |
| **成就系统** | P2 | 中 | 低 | ⭐⭐⭐ | Q1 |
| **社区分享** | P2 | 中 | 低 | ⭐⭐ | Q1 |
| **VS Code 插件** | P0 | 高 | 高 | ⭐⭐⭐⭐ | Q2 |
| **多语言支持** | P1 | 中 | 高 | ⭐⭐⭐ | Q2 |
| **LMS 教师端** | P2 | 中 | 极高 | ⭐⭐ | Q3 |
| **付费功能** | P1 | 高 | 中 | ⭐⭐⭐⭐ | Q3 |

---

## 🎯 短期行动计划 (4-6 周)

### Week 1-2: 代码执行环境

**任务**:
- [ ] 集成 Pyodide 或 Piston API
- [ ] 实现 runPythonCode() 函数
- [ ] 更新 UI 显示执行结果
- [ ] 测试常见代码片段
- [ ] 错误处理和降级方案

**验收**:
- 用户可以运行代码并看到结果
- 执行错误能被 AI 诊断

---

### Week 3-4: SM-2 算法

**任务**:
- [ ] 实现 SM-2 算法逻辑
- [ ] 更新 Flashcard 类型
- [ ] 迁移现有数据到新算法
- [ ] 添加"下次复习时间"显示
- [ ] 测试覆盖率 > 90%

**验收**:
- 闪卡根据遗忘曲线安排复习
- 测试通过率 > 90%

---

### Week 5-6: 对话式 AI 导师 (MVP)

**任务**:
- [ ] 设计对话界面 UI
- [ ] 实现 chatWithTutor() 服务
- [ ] 上下文管理
- [ ] 基础功能：代码讲解、错误分析
- [ ] 测试核心流程

**验收**:
- 用户可以与 AI 对话
- AI 能提供代码讲解
- 响应时间 < 3 秒

---

## 📈 成功指标

### 用户增长目标

| 时间节点 | 目标 | 当前 |
|---------|------|------|
| **1 个月** | 50 用户 | 0 |
| **3 个月** | 500 用户 | - |
| **6 个月** | 2,000 用户 | - |
| **12 个月** | 10,000 用户 | - |

### 用户留存目标

| 指标 | 目标 |
|------|------|
| **Day 7 留存** | > 60% |
| **Day 30 留存** | > 40% |
| **Day 90 留存** | > 20% |

### 功能完成度

| 功能 | Q1 目标 | Q2 目标 | Q3 目标 |
|------|---------|---------|---------|
| **代码执行** | ✅ 100% | - | - |
| **SM-2 算法** | ✅ 100% | - | - |
| **AI 导师** | MVP (60%) | ✅ 100% | - |
| **学习路径** | 基础版 | ✅ 100% | - |
| **VS Code 插件** | - | MVP (50%) | ✅ 100% |
| **付费功能** | - | - | MVP |

---

## 🛠️ 开发规范

### Git 工作流

```bash
# 创建功能分支
git checkout -b feature/feature-name

# 开发完成后
git add .
git commit -m "feat: description"
git push origin feature/feature-name

# 创建 Pull Request
# 代码审查后合并到 main
```

### Commit 规范

```
feat: 新功能
fix: 修复 bug
docs: 文档更新
test: 测试相关
refactor: 重构
perf: 性能优化
style: 代码格式
chore: 构建/工具
```

### 测试要求

- [ ] 单元测试覆盖率 > 80%
- [ ] 关键功能必须有集成测试
- [ ] 所有 PR 必须通过 CI 测试
- [ ] 代码审查通过才能合并

---

## 📚 参考资源

### 竞品分析

- [Python Tutor](https://pythontutor.com/) - 代码可视化
- [Anki](https://apps.ankiweb.net/) - 间隔重复学习
- [Codecademy](https://www.codecademy.com/) - 交互式学习
- [DeepTutor](https://github.com/HKUDS/DeepTutor) - AI 教育平台

### 技术文档

- [SM-2 算法论文](http://www.supermemo.com/english/ol/sm2)
- [Pyodide 文档](https://pyodide.readthedocs.io/)
- [Gemini API 文档](https://ai.google.dev/docs)
- [VS Code 扩展开发](https://code.visualstudio.com/api)

---

## 🎊 结语

Code Doctor 已经建立了坚实的技术基础：
- ✅ 核心 AI 诊断功能完善
- ✅ 历史记录系统完整
- ✅ 测试覆盖率达 70%
- ✅ 清晰的产品路线图

接下来的关键是**聚焦高价值功能**：
1. 真正的代码执行环境
2. 科学的学习算法
3. 对话式 AI 导师

这三个功能将使 Code Doctor 从"工具"升级为"完整的 AI 学习平台"！

**让我们一起用 AI 革命 Python 学习方式！** 🚀

---

*最后更新: 2025-01-10*
*负责人: Development Team*
*审核者: Product Manager*
