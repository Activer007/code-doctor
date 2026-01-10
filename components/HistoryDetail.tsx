import React from 'react';
import { ArrowLeft, Calendar, Clock, Tag, Copy, Check } from 'lucide-react';
import type { HistoryRecord } from '../types';
import { TraceMap } from './TraceMap';

interface HistoryDetailProps {
  record: HistoryRecord;
  onBack: () => void;
}

export default function HistoryDetail({ record, onBack }: HistoryDetailProps) {
  const [copied, setCopied] = React.useState(false);

  const date = new Date(record.timestamp);
  const dateStr = date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const timeStr = date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const handleCopyCode = () => {
    navigator.clipboard.writeText(record.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col">
      {/* 头部 */}
      <div className="p-4 border-b border-slate-700">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-100 transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">返回历史</span>
        </button>

        <h2 className="text-xl font-semibold text-slate-100 mb-2">
          {record.title}
        </h2>

        {/* 元信息 */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400 mb-3">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            {dateStr}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            {timeStr}
          </span>
          {record.flashcardsCount > 0 && (
            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
              {record.flashcardsCount} 张闪卡
            </span>
          )}
        </div>

        {/* 标签 */}
        {record.tags && record.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {record.tags.map(tag => (
              <span
                key={tag}
                className="px-2 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300 flex items-center gap-1"
              >
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* 左栏：代码 */}
          <div className="glass-panel rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-slate-300">原始代码</h3>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 px-2 py-1 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-green-400" />
                    已复制
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    复制
                  </>
                )}
              </button>
            </div>
            <pre className="bg-slate-950 rounded-lg p-4 overflow-x-auto">
              <code className="text-sm text-slate-300 font-mono whitespace-pre">
                {record.code}
              </code>
            </pre>
          </div>

          {/* 右栏：诊断结果 */}
          <div className="glass-panel rounded-lg p-4">
            <h3 className="text-sm font-medium text-slate-300 mb-3">诊断报告</h3>

            {/* 错误摘要 */}
            {record.result.rawError && (
              <div className="mb-4 p-3 bg-red-900/20 border border-red-800/50 rounded-lg">
                <p className="text-sm text-red-300">{record.result.rawError}</p>
              </div>
            )}

            {/* 执行追踪 */}
            <div className="space-y-3">
              <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                执行流程
              </h4>
              <TraceMap trace={record.result.trace} />
            </div>

            {/* 生成的闪卡 */}
            {record.result.generatedFlashcards && record.result.generatedFlashcards.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-700">
                <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">
                  生成的闪卡 ({record.result.generatedFlashcards.length})
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  {record.result.generatedFlashcards.map((card, index) => (
                    <div
                      key={index}
                      className="p-3 bg-slate-800/50 border border-slate-700 rounded-lg hover:border-slate-600 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h5 className="text-sm font-medium text-slate-200">
                          {card.concept}
                        </h5>
                        <span className="text-xs text-slate-500">#{index + 1}</span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="text-red-400 font-medium">❌ 错误代码：</span>
                          <pre className="mt-1 bg-slate-950 rounded p-2 overflow-x-auto">
                            <code className="text-red-300">{card.frontCode}</code>
                          </pre>
                        </div>

                        <div>
                          <span className="text-green-400 font-medium">✅ 正确代码：</span>
                          <pre className="mt-1 bg-slate-950 rounded p-2 overflow-x-auto">
                            <code className="text-green-300">{card.backCode}</code>
                          </pre>
                        </div>

                        <div className="pt-2 border-t border-slate-700">
                          <span className="text-blue-400 font-medium">💡 解释：</span>
                          <p className="mt-1 text-slate-300 leading-relaxed">
                            {card.explanation}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
