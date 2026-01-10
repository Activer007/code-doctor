import React, { useState, useEffect } from 'react';
import {
  Clock,
  Search,
  Tag,
  Trash2,
  Download,
  Upload,
  X,
  FileText,
  ChevronRight,
  Calendar
} from 'lucide-react';
import {
  loadHistory,
  groupHistoryByDate,
  deleteHistoryRecord,
  clearAllHistory,
  searchHistory,
  filterByTag,
  getHistoryStats,
  exportHistory,
  importHistory,
  type HistoryRecord
} from '../services/historyService';

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRecord: (record: HistoryRecord) => void;
}

export default function HistorySidebar({
  isOpen,
  onClose,
  onSelectRecord
}: HistorySidebarProps) {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<HistoryRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [stats, setStats] = useState(getHistoryStats());

  // 加载历史记录
  useEffect(() => {
    if (isOpen) {
      loadRecords();
    }
  }, [isOpen]);

  // 搜索和筛选
  useEffect(() => {
    let result = records;

    if (searchQuery) {
      result = searchHistory(searchQuery);
    } else if (selectedTag) {
      result = filterByTag(selectedTag);
    }

    setFilteredRecords(result);
  }, [searchQuery, selectedTag, records]);

  const loadRecords = () => {
    const loaded = loadHistory();
    setRecords(loaded);
    setFilteredRecords(loaded);
    setStats(getHistoryStats());
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('确定要删除这条记录吗？')) {
      deleteHistoryRecord(id);
      loadRecords();
    }
  };

  const handleClearAll = () => {
    if (confirm('确定要清空所有历史记录吗？此操作不可恢复！')) {
      clearAllHistory();
      loadRecords();
    }
  };

  const handleExport = () => {
    const data = exportHistory();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code-doctor-history-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const data = event.target?.result as string;
          if (importHistory(data)) {
            alert('导入成功！');
            loadRecords();
          } else {
            alert('导入失败，请检查文件格式！');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const groupedRecords = groupHistoryByDate(filteredRecords);

  if (!isOpen) return null;

  return (
    <>
      {/* 遮罩层 */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* 侧边栏 */}
      <div className="fixed right-0 top-0 h-full w-96 bg-slate-900 border-l border-slate-700 shadow-2xl z-50 flex flex-col">
        {/* 头部 */}
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-semibold text-slate-100">历史记录</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* 搜索框 */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="搜索代码或概念..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedTag(null);
              }}
              className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="flex-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 text-sm flex items-center justify-center gap-1.5 transition-colors"
            >
              <Download className="w-4 h-4" />
              导出
            </button>
            <button
              onClick={handleImport}
              className="flex-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 text-sm flex items-center justify-center gap-1.5 transition-colors"
            >
              <Upload className="w-4 h-4" />
              导入
            </button>
            <button
              onClick={handleClearAll}
              className="px-3 py-1.5 bg-red-900/30 hover:bg-red-900/50 border border-red-800 rounded-lg text-red-400 text-sm flex items-center justify-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 统计信息 */}
        {stats.totalRecords > 0 && (
          <div className="px-4 py-3 bg-slate-800/50 border-b border-slate-700">
            <div className="flex items-center justify-between text-sm">
              <div className="flex gap-4">
                <div className="text-slate-400">
                  <span className="text-slate-100 font-medium">{stats.totalRecords}</span> 条记录
                </div>
                <div className="text-slate-400">
                  <span className="text-slate-100 font-medium">{stats.totalFlashcards}</span> 张闪卡
                </div>
              </div>
            </div>

            {/* 热门标签 */}
            {stats.topTags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {stats.topTags.slice(0, 5).map(({ tag, count }) => (
                  <button
                    key={tag}
                    onClick={() => {
                      setSelectedTag(tag);
                      setSearchQuery('');
                    }}
                    className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
                      selectedTag === tag
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    <Tag className="w-3 h-3 inline mr-1" />
                    {tag} ({count})
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 历史记录列表 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {selectedTag && (
            <div className="flex items-center gap-2 px-2 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <Tag className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-blue-300">标签: {selectedTag}</span>
              <button
                onClick={() => setSelectedTag(null)}
                className="ml-auto p-0.5 hover:bg-blue-500/20 rounded transition-colors"
              >
                <X className="w-4 h-4 text-blue-400" />
              </button>
            </div>
          )}

          {groupedRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <FileText className="w-12 h-12 mb-3 opacity-50" />
              <p className="text-sm">暂无历史记录</p>
              <p className="text-xs mt-1">诊断代码后会自动保存</p>
            </div>
          ) : (
            groupedRecords.map(group => (
              <div key={group.date}>
                {/* 日期标题 */}
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <h3 className="text-sm font-medium text-slate-400">{group.date}</h3>
                  <div className="flex-1 h-px bg-slate-700" />
                </div>

                {/* 记录列表 */}
                <div className="space-y-2">
                  {group.records.map(record => (
                    <HistoryRecordItem
                      key={record.id}
                      record={record}
                      onClick={() => {
                        onSelectRecord(record);
                        onClose();
                      }}
                      onDelete={(e) => handleDelete(record.id, e)}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

interface HistoryRecordItemProps {
  record: HistoryRecord;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
}

function HistoryRecordItem({ record, onClick, onDelete }: HistoryRecordItemProps) {
  const time = new Date(record.timestamp).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      onClick={onClick}
      className="group relative p-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-lg cursor-pointer transition-all"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {/* 标题 */}
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-medium text-slate-100 truncate">
              {record.title}
            </h4>
            {record.flashcardsCount > 0 && (
              <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full shrink-0">
                +{record.flashcardsCount}
              </span>
            )}
          </div>

          {/* 摘要 */}
          <p className="text-xs text-slate-400 line-clamp-2 mb-2">
            {record.summary}
          </p>

          {/* 底部信息 */}
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {time}
            </span>

            {/* 标签 */}
            {record.tags && record.tags.length > 0 && (
              <div className="flex gap-1">
                {record.tags.slice(0, 3).map(tag => (
                  <span
                    key={tag}
                    className="px-1.5 py-0.5 bg-slate-700/50 text-slate-400 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 删除按钮 */}
        <button
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-900/30 rounded-lg transition-all"
        >
          <Trash2 className="w-4 h-4 text-red-400" />
        </button>
      </div>

      {/* 右箭头指示器 */}
      <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all opacity-0 group-hover:opacity-100" />
    </div>
  );
}
