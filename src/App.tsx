import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Brain, 
  Database, 
  Cpu, 
  PenTool, 
  Plus, 
  Search, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  ChevronRight,
  ArrowRight,
  Zap,
  Target,
  Layers,
  LayoutDashboard,
  History,
  Settings,
  Sparkles,
  Loader2,
  Globe,
  Lightbulb,
  Video,
  KeyRound,
  Save,
  Trash2,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import {
  API_KEY_STORAGE_KEY,
  analyzeProductData,
  generateDesignImage,
  iterateDesign,
  type AnalysisResult,
  type ProductDirection
} from './services/geminiService';
import { cn } from './lib/utils';

// --- Types ---

type Tab = 'dashboard' | 'analyze' | 'execute' | 'history' | 'settings';
type Engine = 'micro' | 'gene' | 'demand';

// --- Components ---

const SidebarItem = ({ 
  icon: Icon, 
  label, 
  active, 
  onClick 
}: { 
  icon: any, 
  label: string, 
  active: boolean, 
  onClick: () => void 
}) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-200 group",
      active 
        ? "bg-black text-white shadow-lg" 
        : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
    )}
  >
    <Icon className={cn("w-5 h-5", active ? "text-white" : "text-zinc-400 group-hover:text-zinc-900")} />
    <span className="font-medium text-sm">{label}</span>
  </button>
);

const EngineCard = ({ 
  engine, 
  selected, 
  onClick 
}: { 
  engine: { id: Engine, title: string, desc: string, icon: any, color: string }, 
  selected: boolean, 
  onClick: () => void,
  key?: string
}) => {
  const Icon = engine.icon;
  return (
    <button
      key={engine.id}
      onClick={onClick}
      className={cn(
        "flex flex-col gap-4 p-6 rounded-2xl border-2 text-left transition-all duration-300",
        selected 
          ? `border-black bg-white shadow-xl scale-[1.02]` 
          : "border-zinc-100 bg-zinc-50/50 hover:border-zinc-200 hover:bg-white"
      )}
    >
      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", engine.color)}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <h3 className="font-bold text-lg text-zinc-900">{engine.title}</h3>
        <p className="text-sm text-zinc-500 mt-1 leading-relaxed">{engine.desc}</p>
      </div>
      {selected && (
        <motion.div 
          layoutId="selected-engine"
          className="mt-auto flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-black"
        >
          Selected <CheckCircle2 className="w-4 h-4" />
        </motion.div>
      )}
    </button>
  );
};

const DefinitionCard = ({ title, content, icon: Icon }: { title: string, content: string | string[], icon: any }) => (
  <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-100">
    <div className="flex items-center gap-2 mb-3">
      <div className="p-2 rounded-lg bg-white border border-zinc-200">
        <Icon className="w-4 h-4 text-zinc-600" />
      </div>
      <h4 className="font-bold text-sm text-zinc-900 uppercase tracking-tight">{title}</h4>
    </div>
    {Array.isArray(content) ? (
      <ul className="space-y-2">
        {content.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-zinc-600">
            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-zinc-300 shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    ) : (
      <p className="text-sm text-zinc-600 leading-relaxed">{content}</p>
    )}
  </div>
);

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [selectedEngine, setSelectedEngine] = useState<Engine>('micro');
  const [keyword, setKeyword] = useState('');
  const [inputData, setInputData] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [selectedDirectionIndex, setSelectedDirectionIndex] = useState<number>(0);
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [analyzeSubTab, setAnalyzeSubTab] = useState<'market' | 'problems' | 'hitProduct' | 'opportunities' | 'builder'>('market');

  // Design Execution State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [iterationFeedback, setIterationFeedback] = useState('');
  const [isIterating, setIsIterating] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiKeyDraft, setApiKeyDraft] = useState('');
  const [settingsMessage, setSettingsMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const hasApiKey = apiKey.trim().length > 0;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedApiKey = window.localStorage.getItem(API_KEY_STORAGE_KEY) || '';
    setApiKey(savedApiKey);
    setApiKeyDraft(savedApiKey);
  }, []);

  const engines = [
    { 
      id: 'micro' as Engine, 
      title: '微创新引擎', 
      desc: '分析负面评价和退货原因，找出关键产品缺陷和改进点。',
      icon: AlertCircle,
      color: 'bg-rose-500'
    },
    { 
      id: 'gene' as Engine, 
      title: '爆品基因引擎', 
      desc: '解构热销产品，识别功能、价格和风格的成功公式。',
      icon: Zap,
      color: 'bg-amber-500'
    },
    { 
      id: 'demand' as Engine, 
      title: '需求挖掘引擎', 
      desc: '扫描搜索趋势和社交媒体，发现未满足的需求和蓝海市场机会。',
      icon: Search,
      color: 'bg-indigo-500'
    }
  ];

  const handleSaveApiKey = () => {
    const nextKey = apiKeyDraft.trim();
    if (nextKey) {
      window.localStorage.setItem(API_KEY_STORAGE_KEY, nextKey);
      setSettingsMessage('Gemini API Key 已保存到本机浏览器。');
    } else {
      window.localStorage.removeItem(API_KEY_STORAGE_KEY);
      setSettingsMessage('Gemini API Key 已清除。');
    }
    setApiKey(nextKey);
    setActionError('');
  };

  const handleClearApiKey = () => {
    window.localStorage.removeItem(API_KEY_STORAGE_KEY);
    setApiKey('');
    setApiKeyDraft('');
    setSettingsMessage('Gemini API Key 已清除。');
  };

  const handleAnalyze = async () => {
    if (!inputData.trim() && !keyword.trim()) return;
    if (!hasApiKey) {
      setActionError('请先在系统设置中保存 Gemini API Key。');
      setActiveTab('settings');
      return;
    }

    setIsAnalyzing(true);
    setActionError('');
    try {
      const combinedData = `关键词: ${keyword}\n补充数据: ${inputData}`;
      const res = await analyzeProductData(selectedEngine, combinedData, apiKey);
      setResult(res);
      setSelectedDirectionIndex(0);
      setCurrentPrompt(res.directions[0].designPrompts.mj);
      setHistory(prev => [res, ...prev]);
      setActiveTab('analyze');
      setAnalyzeSubTab('market');
    } catch (error) {
      console.error("分析失败:", error);
      setActionError('分析失败，请检查 Gemini API Key、网络状态或模型权限。');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSelectDirection = (index: number) => {
    if (!result) return;
    setSelectedDirectionIndex(index);
    setCurrentPrompt(result.directions[index].designPrompts.mj);
    setGeneratedImage(null); // Clear image when switching directions
  };

  const handleGenerateImage = async () => {
    if (!currentPrompt) return;
    if (!hasApiKey) {
      setActionError('请先在系统设置中保存 Gemini API Key。');
      setActiveTab('settings');
      return;
    }

    setIsGenerating(true);
    setActionError('');
    try {
      const img = await generateDesignImage(currentPrompt, apiKey);
      setGeneratedImage(img);
      setActiveTab('execute');
    } catch (error) {
      console.error("生成图片失败:", error);
      setActionError('生成图片失败，请检查 Gemini API Key、网络状态或图片模型权限。');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleIterate = async () => {
    if (!result || !iterationFeedback.trim()) return;
    if (!hasApiKey) {
      setActionError('请先在系统设置中保存 Gemini API Key。');
      setActiveTab('settings');
      return;
    }

    setIsIterating(true);
    setActionError('');
    try {
      const direction = result.directions[selectedDirectionIndex];
      const { newPrompt } = await iterateDesign(
        direction, 
        iterationFeedback, 
        apiKey,
        generatedImage || undefined
      );
      setCurrentPrompt(newPrompt);
      setIterationFeedback('');
      // Automatically regenerate image with new prompt
      const img = await generateDesignImage(newPrompt, apiKey);
      setGeneratedImage(img);
    } catch (error) {
      console.error("迭代失败:", error);
      setActionError('迭代失败，请检查 Gemini API Key、网络状态或模型权限。');
    } finally {
      setIsIterating(false);
    }
  };

  // Mock data for charts based on insights
  const getChartData = () => {
    if (!result) return [];
    return result.problems.topIssues.map(issue => ({
      name: issue.category,
      value: issue.sentiment * 100
    })).sort((a, b) => b.value - a.value);
  };

  return (
    <div className="flex h-screen bg-white text-zinc-900 font-sans selection:bg-black selection:text-white">
      {/* Sidebar */}
      <aside className="w-72 border-r border-zinc-100 flex flex-col p-6 gap-8">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
            <Brain className="text-white w-6 h-6" />
          </div>
          <h1 className="font-black text-xl tracking-tighter uppercase">ProdIntel AI</h1>
        </div>

        <nav className="flex flex-col gap-2">
          <SidebarItem 
            icon={LayoutDashboard} 
            label="控制面板" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
          />
          <SidebarItem 
            icon={Cpu} 
            label="开始分析" 
            active={activeTab === 'analyze'} 
            onClick={() => setActiveTab('analyze')} 
          />
          <SidebarItem 
            icon={PenTool} 
            label="设计执行" 
            active={activeTab === 'execute'} 
            onClick={() => setActiveTab('execute')} 
          />
          <SidebarItem 
            icon={History} 
            label="历史记录" 
            active={activeTab === 'history'} 
            onClick={() => setActiveTab('history')} 
          />
          <div className="mt-auto pt-8 border-t border-zinc-100">
            <SidebarItem 
              icon={Settings} 
              label="系统设置" 
              active={activeTab === 'settings'} 
              onClick={() => setActiveTab('settings')} 
            />
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-12">
          {actionError && (
            <div className="mb-8 flex items-center gap-3 rounded-2xl border border-rose-100 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-12"
              >
                <header className="flex items-center justify-between">
                  <div>
                    <h2 className="text-5xl font-black tracking-tight mb-4">AI 爆品决策系统</h2>
                    <p className="text-zinc-500 text-lg max-w-2xl">
                      AI Product Intelligence System — 集成六大引擎，驱动从市场洞察到设计生成的全链路决策。
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100 text-center min-w-[120px]">
                      <div className="text-2xl font-black">24h</div>
                      <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">系统在线</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100 text-center min-w-[120px]">
                      <div className="text-2xl font-black">1.2k</div>
                      <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">分析报告</div>
                    </div>
                  </div>
                </header>

                <div className="grid grid-cols-3 gap-6">
                  {engines.map(engine => (
                    <EngineCard 
                      key={engine.id} 
                      engine={engine} 
                      selected={selectedEngine === engine.id}
                      onClick={() => setSelectedEngine(engine.id)}
                    />
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 bg-zinc-50 rounded-[40px] p-10 border border-zinc-100">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
                        <Zap className="text-white w-5 h-5" />
                      </div>
                      <h3 className="text-xl font-black tracking-tight uppercase">启动分析任务</h3>
                    </div>

                    <div className="space-y-8">
                      <div className="space-y-4">
                        <label className="text-xs font-black text-zinc-400 uppercase tracking-widest">第一步：核心关键词</label>
                        <div className="relative">
                          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-300" />
                          <input
                            type="text"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            placeholder="输入产品关键词 (例如: bird feeder, ergonomic chair)..."
                            className="w-full bg-white border border-zinc-200 rounded-2xl pl-16 pr-6 py-5 text-zinc-700 focus:ring-2 focus:ring-black focus:border-transparent transition-all outline-none text-lg"
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <label className="text-xs font-black text-zinc-400 uppercase tracking-widest">第二步：补充数据 (可选)</label>
                        <textarea
                          value={inputData}
                          onChange={(e) => setInputData(e.target.value)}
                          placeholder={
                            selectedEngine === 'micro' 
                              ? "在此粘贴客户评价、退货原因或售后工单..." 
                              : selectedEngine === 'gene'
                              ? "在此粘贴热销产品描述、功能清单和价格数据..."
                              : "在此粘贴搜索趋势、社交媒体评论或市场空白观察..."
                          }
                          className="w-full h-40 bg-white border border-zinc-200 rounded-2xl p-6 text-zinc-700 focus:ring-2 focus:ring-black focus:border-transparent transition-all outline-none resize-none"
                        />
                      </div>

                      <div className="flex justify-end">
                        <button
                          onClick={handleAnalyze}
                          disabled={isAnalyzing || (!inputData.trim() && !keyword.trim())}
                          className={cn(
                            "px-12 py-5 bg-black text-white rounded-2xl font-black text-lg flex items-center gap-4 transition-all hover:shadow-[0_20px_50px_rgba(0,0,0,0.2)] hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed",
                            isAnalyzing && "animate-pulse"
                          )}
                        >
                          {isAnalyzing ? (
                            <>
                              <Loader2 className="w-6 h-6 animate-spin" />
                              正在运行决策引擎...
                            </>
                          ) : (
                            <>
                              {hasApiKey ? '运行决策引擎' : '配置 Gemini Key'}
                              {hasApiKey ? <ArrowRight className="w-6 h-6" /> : <KeyRound className="w-6 h-6" />}
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="p-8 rounded-[40px] bg-zinc-900 text-white h-full">
                      <div className="flex items-center gap-3 mb-8">
                        <TrendingUp className="w-5 h-5 text-emerald-400" />
                        <h3 className="font-bold text-sm uppercase tracking-widest">市场脉搏 (Market Pulse)</h3>
                      </div>
                      <div className="space-y-6">
                        {[
                          { label: '智能家居', trend: '+24%', color: 'text-emerald-400' },
                          { label: '户外便携', trend: '+18%', color: 'text-emerald-400' },
                          { label: '宠物健康', trend: '+42%', color: 'text-emerald-400' },
                          { label: '办公人体工学', trend: '-5%', color: 'text-rose-400' },
                        ].map((item, i) => (
                          <div key={i} className="flex items-center justify-between border-b border-white/10 pb-4">
                            <span className="text-zinc-400 text-sm">{item.label}</span>
                            <span className={cn("font-black text-sm", item.color)}>{item.trend}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-12 p-6 rounded-2xl bg-white/5 border border-white/10">
                        <p className="text-xs text-zinc-500 leading-relaxed">
                          AI 实时扫描全球 20+ 电商平台及社交媒体，为您捕捉每一个细微的市场波动。
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'analyze' && (
              <motion.div
                key="analyze"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-12"
              >
                {!result ? (
                  <div className="flex flex-col items-center justify-center py-32 text-center">
                    <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mb-6">
                      <Sparkles className="w-10 h-10 text-zinc-300" />
                    </div>
                    <h3 className="text-2xl font-bold text-zinc-900">暂无分析任务</h3>
                    <p className="text-zinc-500 mt-2 max-w-sm">
                      返回控制面板并输入一些数据，见证 AI 的魔力。
                    </p>
                    <button 
                      onClick={() => setActiveTab('dashboard')}
                      className="mt-8 px-6 py-3 border border-zinc-200 rounded-xl font-bold hover:bg-zinc-50 transition-colors"
                    >
                      返回控制面板
                    </button>
                  </div>
                ) : (
                  <div className="space-y-16">
                    {/* Header */}
                    <div className="flex items-end justify-between border-b border-zinc-100 pb-8">
                      <div>
                        <div className="flex items-center gap-2 text-zinc-400 mb-2">
                          <History className="w-4 h-4" />
                          <span className="text-xs font-bold uppercase tracking-widest">分析报告</span>
                        </div>
                        <h2 className="text-4xl font-black tracking-tight">
                          市场洞察与策略建议
                        </h2>
                      </div>
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => alert('报告导出功能正在开发中...')}
                          className="px-4 py-2 border border-zinc-200 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-zinc-50 transition-colors"
                        >
                          导出报告
                        </button>
                        <div className={cn(
                          "px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2",
                          result.engine === 'micro' ? "bg-rose-100 text-rose-600" :
                          result.engine === 'gene' ? "bg-amber-100 text-amber-600" :
                          "bg-indigo-100 text-indigo-600"
                        )}>
                          {result.engine === 'micro' ? '微创新' : result.engine === 'gene' ? '爆品基因' : '需求挖掘'} 引擎
                        </div>
                      </div>
                    </div>

                    {/* Tabs for Sub-Analysis */}
                    <div className="flex gap-1 p-1 bg-zinc-100 rounded-2xl w-fit">
                      {[
                        { id: 'market', label: '市场分析', icon: Globe },
                        { id: 'problems', label: '用户痛点', icon: AlertCircle },
                        { id: 'hitProduct', label: '爆品逻辑', icon: Zap },
                        { id: 'opportunities', label: '产品机会', icon: Lightbulb },
                        { id: 'builder', label: '产品方案', icon: Target },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setAnalyzeSubTab(tab.id as any)}
                          className={cn(
                            "px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition-all",
                            analyzeSubTab === tab.id 
                              ? "bg-white text-black shadow-sm" 
                              : "text-zinc-500 hover:text-zinc-900"
                          )}
                        >
                          <tab.icon className="w-4 h-4" />
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    <AnimatePresence mode="wait">
                      {analyzeSubTab === 'market' && (
                        <motion.div
                          key="market"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="space-y-12"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div className="space-y-8">
                              <h3 className="text-xl font-black tracking-tight">Amazon Top 20 概览</h3>
                              <div className="space-y-4">
                                {result.market.amazonTopProducts.map((p, i) => (
                                  <div key={i} className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                      <span className="text-zinc-300 font-mono text-xs">0{i+1}</span>
                                      <div>
                                        <div className="font-bold text-sm truncate max-w-[200px]">{p.title}</div>
                                        <div className="text-[10px] text-zinc-400 uppercase font-bold tracking-widest">{p.reviews} 评论 • {p.rating} 评分</div>
                                      </div>
                                    </div>
                                    <div className="font-black text-sm">{p.price}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="space-y-8">
                              <div className="p-8 rounded-3xl bg-zinc-900 text-white">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                                  Google Trends 趋势
                                </h3>
                                <p className="text-zinc-400 text-sm leading-relaxed">
                                  {result.market.trends}
                                </p>
                              </div>
                              <div className="p-8 rounded-3xl border border-zinc-200">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                  <Video className="w-5 h-5 text-rose-500" />
                                  TikTok 热门洞察
                                </h3>
                                <ul className="space-y-3">
                                  {result.market.tiktokInsights.map((insight, i) => (
                                    <li key={i} className="flex gap-3 text-sm text-zinc-600">
                                      <span className="text-zinc-300">•</span>
                                      {insight}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {analyzeSubTab === 'problems' && (
                        <motion.div
                          key="problems"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="space-y-12"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div className="space-y-6">
                              <h3 className="text-xl font-black tracking-tight">TOP 10 用户痛点分析</h3>
                              <div className="space-y-3">
                                {result.problems.topIssues.map((issue, i) => (
                                  <div key={i} className="p-6 rounded-2xl border border-zinc-100 bg-white flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                      <div className={cn(
                                        "w-2 h-2 rounded-full",
                                        issue.priority === 'High' ? "bg-rose-500" : issue.priority === 'Medium' ? "bg-amber-500" : "bg-emerald-500"
                                      )} />
                                      <div>
                                        <div className="font-bold text-zinc-900">{issue.category}</div>
                                        <div className="text-xs text-zinc-400 font-bold uppercase tracking-widest">出现频率: {issue.frequency}</div>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-xs font-black text-zinc-300 uppercase tracking-widest mb-1">情绪强度</div>
                                      <div className="w-24 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                                        <div 
                                          className="h-full bg-black" 
                                          style={{ width: `${issue.sentiment * 100}%` }}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="p-8 rounded-3xl bg-zinc-50 border border-zinc-100">
                              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                产品优化建议清单
                              </h3>
                              <div className="space-y-4">
                                {result.problems.optimizationList.map((item, i) => (
                                  <div key={i} className="flex gap-4 p-4 rounded-xl bg-white border border-zinc-100">
                                    <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-bold">
                                      {i+1}
                                    </div>
                                    <p className="text-sm text-zinc-600 leading-relaxed">{item}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {analyzeSubTab === 'hitProduct' && (
                        <motion.div
                          key="hitProduct"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="space-y-12"
                        >
                          <div className="p-12 rounded-[40px] bg-zinc-900 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-12 opacity-10">
                              <Zap className="w-64 h-64" />
                            </div>
                            <div className="relative z-10 max-w-2xl">
                              <h4 className="text-zinc-500 font-bold text-xs uppercase tracking-widest mb-4">爆品公式 (Hit Product Formula)</h4>
                              <h3 className="text-5xl font-black tracking-tight leading-tight mb-8">
                                {result.hitProduct.formula}
                              </h3>
                              <div className="grid grid-cols-2 gap-8">
                                <div>
                                  <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-2">价格区间</div>
                                  <div className="text-2xl font-bold">{result.hitProduct.priceRange}</div>
                                </div>
                                <div>
                                  <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-2">核心风格</div>
                                  <div className="flex flex-wrap gap-2">
                                    {result.hitProduct.styleKeywords.map((kw, i) => (
                                      <span key={i} className="px-2 py-1 rounded bg-white/10 text-[10px] font-bold uppercase tracking-widest">
                                        {kw}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div className="space-y-6">
                              <h3 className="text-xl font-black tracking-tight">核心功能组合</h3>
                              <div className="grid grid-cols-2 gap-4">
                                {result.hitProduct.coreFeatures.map((feat, i) => (
                                  <div key={i} className="p-4 rounded-2xl border border-zinc-100 bg-white font-bold text-sm text-zinc-700">
                                    {feat}
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="space-y-6">
                              <h3 className="text-xl font-black tracking-tight">卖点总结</h3>
                              <div className="space-y-4">
                                {result.hitProduct.sellingPoints.map((point, i) => (
                                  <div key={i} className="flex gap-4">
                                    <div className="w-1 h-1 rounded-full bg-zinc-300 mt-2" />
                                    <p className="text-sm text-zinc-600">{point}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {analyzeSubTab === 'opportunities' && (
                        <motion.div
                          key="opportunities"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="space-y-12"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div className="space-y-8">
                              <h3 className="text-xl font-black tracking-tight">未被满足的需求 (TOP 10)</h3>
                              <div className="space-y-4">
                                {result.opportunities.unmetNeeds.map((need, i) => (
                                  <div key={i} className="flex gap-4 p-4 rounded-2xl bg-zinc-50 border border-zinc-100">
                                    <span className="text-zinc-300 font-mono text-xs">0{i+1}</span>
                                    <p className="text-sm text-zinc-700 font-medium">{need}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="space-y-8">
                              <h3 className="text-xl font-black tracking-tight">新产品机会点</h3>
                              <div className="space-y-4">
                                {result.opportunities.newOpportunities.map((opp, i) => (
                                  <div key={i} className="p-8 rounded-3xl border border-zinc-200 space-y-4">
                                    <div className="flex items-center justify-between">
                                      <h4 className="text-lg font-bold">{opp.title}</h4>
                                      <div className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest">
                                        潜力评分: {opp.score}/10
                                      </div>
                                    </div>
                                    <p className="text-sm text-zinc-500 leading-relaxed">{opp.description}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {analyzeSubTab === 'builder' && (
                        <motion.div
                          key="builder"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="space-y-12"
                        >
                          {/* Layer 3: Product Directions */}
                          <section>
                            <div className="flex items-center gap-3 mb-8">
                              <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
                                <Target className="text-white w-4 h-4" />
                              </div>
                              <h3 className="text-xl font-black tracking-tight">产品定义模块 (Product Builder)</h3>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              {result.directions.map((direction, idx) => (
                                <div 
                                  key={idx}
                                  className={cn(
                                    "p-8 rounded-3xl border-2 transition-all cursor-pointer group relative",
                                    selectedDirectionIndex === idx 
                                      ? "border-black bg-white shadow-2xl scale-[1.02]" 
                                      : "border-zinc-100 bg-zinc-50/50 hover:border-zinc-200"
                                  )}
                                  onClick={() => handleSelectDirection(idx)}
                                >
                                  <div className="flex items-center justify-between mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                                      <span className="font-black text-lg">0{idx + 1}</span>
                                    </div>
                                    {selectedDirectionIndex === idx && (
                                      <div className="px-2 py-1 rounded bg-black text-[10px] text-white font-bold uppercase tracking-widest">
                                        已选择
                                      </div>
                                    )}
                                  </div>
                                  <h4 className="text-xl font-black tracking-tight mb-2">{direction.title}</h4>
                                  <p className="text-sm text-zinc-500 leading-relaxed mb-6">
                                    {direction.description}
                                  </p>
                                  <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                                      <CheckCircle2 className="w-3 h-3" />
                                      核心卖点
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      {direction.definition.usp.slice(0, 2).map((usp, i) => (
                                        <span key={i} className="px-2 py-1 rounded-md bg-zinc-100 text-[10px] text-zinc-600 font-medium">
                                          {usp}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </section>

                          {/* Layer 4: Selected Direction Details */}
                          <section className="pt-8 border-t border-zinc-100">
                            <div className="flex items-center gap-3 mb-8">
                              <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
                                <Layers className="text-white w-4 h-4" />
                              </div>
                              <h3 className="text-xl font-black tracking-tight">方案详情：{result.directions[selectedDirectionIndex].title}</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
                              <div className="md:col-span-2">
                                <DefinitionCard 
                                  title="产品定位与策略" 
                                  content={result.directions[selectedDirectionIndex].definition.positioning} 
                                  icon={TrendingUp} 
                                />
                              </div>
                              <DefinitionCard 
                                title="目标用户" 
                                content={result.directions[selectedDirectionIndex].definition.targetUser} 
                                icon={Target} 
                              />
                              <DefinitionCard 
                                title="核心功能清单" 
                                content={result.directions[selectedDirectionIndex].definition.features} 
                                icon={Layers} 
                              />
                              <DefinitionCard 
                                title="核心卖点 (USP)" 
                                content={result.directions[selectedDirectionIndex].definition.usp} 
                                icon={Sparkles} 
                              />
                              <DefinitionCard 
                                title="材料与 CMF 建议" 
                                content={`${result.directions[selectedDirectionIndex].definition.materials} | CMF: ${result.directions[selectedDirectionIndex].definition.cmf}`} 
                                icon={Database} 
                              />
                              <DefinitionCard 
                                title="价格区间与差异化" 
                                content={`价格: ${result.directions[selectedDirectionIndex].definition.priceRange} | 策略: ${result.directions[selectedDirectionIndex].definition.differentiation}`} 
                                icon={Zap} 
                              />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <div className="p-8 rounded-3xl bg-zinc-900 text-white space-y-6">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-bold text-xs uppercase tracking-widest text-zinc-500">设计生成模块 (Design Generator)</h4>
                                  <div className="px-2 py-1 rounded bg-zinc-800 text-[10px] font-bold">MIDJOURNEY v6</div>
                                </div>
                                <p className="text-zinc-300 font-mono text-sm leading-relaxed italic">
                                  "{result.directions[selectedDirectionIndex].designPrompts.mj}"
                                </p>
                                <div className="flex gap-3">
                                  <button 
                                    onClick={() => navigator.clipboard.writeText(result.directions[selectedDirectionIndex].designPrompts.mj)}
                                    className="flex-1 py-3 bg-white/10 text-white rounded-xl font-bold text-sm hover:bg-white/20 transition-colors"
                                  >
                                    复制提示词
                                  </button>
                                  <button 
                                    onClick={handleGenerateImage}
                                    disabled={isGenerating}
                                    className="flex-1 py-3 bg-white text-black rounded-xl font-bold text-sm hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
                                  >
                                    {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                    立即生成视觉稿
                                  </button>
                                </div>
                              </div>
                              <div className="p-8 rounded-3xl border border-zinc-200 space-y-6">
                                <h4 className="font-bold text-xs uppercase tracking-widest text-zinc-400">设计方向与结构建议</h4>
                                <div className="space-y-4">
                                  <div>
                                    <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">设计描述</div>
                                    <p className="text-zinc-600 text-sm leading-relaxed">{result.directions[selectedDirectionIndex].designPrompts.description}</p>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">CMF 搭配</div>
                                      <p className="text-zinc-500 text-xs">{result.directions[selectedDirectionIndex].designPrompts.cmfSuggestions}</p>
                                    </div>
                                    <div>
                                      <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">结构建议</div>
                                      <p className="text-zinc-500 text-xs">{result.directions[selectedDirectionIndex].designPrompts.structuralSuggestions}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </section>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'execute' && (
              <motion.div
                key="execute"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-12"
              >
                <header className="flex items-end justify-between border-b border-zinc-100 pb-8">
                  <div>
                    <h2 className="text-4xl font-black tracking-tight">设计执行系统</h2>
                    <p className="text-zinc-500 mt-2">
                      当前方向：<span className="text-black font-bold">{result?.directions[selectedDirectionIndex].title}</span>
                    </p>
                  </div>
                  {generatedImage && (
                    <button 
                      onClick={handleGenerateImage}
                      disabled={isGenerating}
                      className="px-6 py-3 bg-black text-white rounded-xl font-bold text-sm flex items-center gap-2"
                    >
                      {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <History className="w-4 h-4" />}
                      重新生成
                    </button>
                  )}
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  {/* Image Display */}
                  <div className="space-y-6">
                    <div className="aspect-square bg-zinc-100 rounded-[40px] overflow-hidden border border-zinc-200 relative group">
                      {generatedImage ? (
                        <img 
                          src={generatedImage} 
                          alt="Generated Design" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 p-12 text-center">
                          <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4">
                            <PenTool className="w-8 h-8" />
                          </div>
                          <p className="font-bold">等待生成视觉稿</p>
                          <p className="text-sm mt-2">请在“开始分析”页面点击“立即生成视觉稿”</p>
                        </div>
                      )}
                      {isGenerating && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
                          <Loader2 className="w-12 h-12 animate-spin text-black mb-4" />
                          <p className="font-black text-sm uppercase tracking-widest">AI 正在构思视觉方案...</p>
                        </div>
                      )}
                    </div>
                    
                    {generatedImage && (
                      <div className="p-6 rounded-3xl bg-zinc-50 border border-zinc-100">
                        <h4 className="font-bold text-xs uppercase tracking-widest text-zinc-400 mb-4">当前提示词</h4>
                        <p className="text-sm text-zinc-600 font-mono italic leading-relaxed">
                          {currentPrompt}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Iteration Controls */}
                  <div className="space-y-8">
                    <div className="p-8 rounded-[40px] border-2 border-zinc-100 bg-white shadow-sm space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                          <History className="text-white w-4 h-4" />
                        </div>
                        <h3 className="text-xl font-black tracking-tight uppercase">方案迭代</h3>
                      </div>
                      
                      <p className="text-sm text-zinc-500 leading-relaxed">
                        对当前的视觉方案不满意？输入您的修改意见，AI 将根据产品定义进行针对性迭代。
                      </p>

                      <div className="space-y-4">
                        <textarea
                          value={iterationFeedback}
                          onChange={(e) => setIterationFeedback(e.target.value)}
                          placeholder="例如：希望外观更硬朗一些，增加金属质感，或者调整颜色为深空灰..."
                          className="w-full h-32 bg-zinc-50 border border-zinc-200 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-black outline-none resize-none"
                        />
                        <button
                          onClick={handleIterate}
                          disabled={isIterating || !iterationFeedback.trim() || !generatedImage}
                          className="w-full py-4 bg-black text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:shadow-xl transition-all disabled:opacity-50"
                        >
                          {isIterating ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              正在优化方案...
                            </>
                          ) : (
                            <>
                              提交修改意见并迭代
                              <ArrowRight className="w-5 h-5" />
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-6 rounded-3xl bg-indigo-50 border border-indigo-100">
                        <h5 className="font-bold text-indigo-900 text-sm mb-1">设计一致性</h5>
                        <p className="text-xs text-indigo-600/80">AI 将严格遵循第三层定义的产品 DNA 进行视觉演进。</p>
                      </div>
                      <div className="p-6 rounded-3xl bg-amber-50 border border-amber-100">
                        <h5 className="font-bold text-amber-900 text-sm mb-1">快速原型</h5>
                        <p className="text-xs text-amber-600/80">每次迭代仅需数秒，极大缩短从定义到视觉的周期。</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'history' && (
              <motion.div
                key="history"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-8"
              >
                <header>
                  <h2 className="text-4xl font-black tracking-tight mb-2">历史记录</h2>
                  <p className="text-zinc-500">回顾您过去的产品智能分析报告。</p>
                </header>

                <div className="space-y-4">
                  {history.length === 0 ? (
                    <div className="py-20 text-center border-2 border-dashed border-zinc-100 rounded-3xl">
                      <p className="text-zinc-400">暂无历史记录。</p>
                    </div>
                  ) : (
                    history.map((item, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setResult(item);
                          setActiveTab('analyze');
                        }}
                        className="w-full flex items-center justify-between p-6 rounded-2xl bg-zinc-50 border border-zinc-100 hover:border-black transition-all group"
                      >
                        <div className="flex items-center gap-6">
                          <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center",
                            item.engine === 'micro' ? "bg-rose-500" :
                            item.engine === 'gene' ? "bg-amber-500" :
                            "bg-indigo-500"
                          )}>
                            <Sparkles className="text-white w-6 h-6" />
                          </div>
                          <div className="text-left">
                            <h4 className="font-bold text-zinc-900 text-sm mb-1 uppercase tracking-widest">
                              {item.directions[0].title}
                            </h4>
                            <p className="text-xs text-zinc-500 uppercase tracking-widest mt-1">
                              {item.engine === 'micro' ? '微创新' : item.engine === 'gene' ? '爆品基因' : '需求挖掘'} 引擎 • 刚刚
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-zinc-300 group-hover:text-black transition-colors" />
                      </button>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-10"
              >
                <header className="flex items-end justify-between border-b border-zinc-100 pb-8">
                  <div>
                    <h2 className="text-4xl font-black tracking-tight mb-2">系统设置</h2>
                    <p className="text-zinc-500">管理当前浏览器使用的 Gemini 访问凭据。</p>
                  </div>
                  <div className={cn(
                    "flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black uppercase tracking-widest",
                    hasApiKey ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                  )}>
                    <ShieldCheck className="h-4 w-4" />
                    {hasApiKey ? '已配置' : '未配置'}
                  </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <section className="lg:col-span-2 rounded-[32px] border border-zinc-100 bg-zinc-50 p-8">
                    <div className="mb-6 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white">
                        <KeyRound className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black tracking-tight">Gemini API Key</h3>
                        <p className="text-sm text-zinc-500">Key 仅保存到本机浏览器 localStorage。</p>
                      </div>
                    </div>

                    <div className="space-y-5">
                      <input
                        type="password"
                        value={apiKeyDraft}
                        onChange={(event) => {
                          setApiKeyDraft(event.target.value);
                          setSettingsMessage('');
                        }}
                        placeholder="AIza..."
                        autoComplete="off"
                        className="w-full rounded-2xl border border-zinc-200 bg-white px-5 py-4 font-mono text-sm outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-black"
                      />

                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={handleSaveApiKey}
                          className="inline-flex items-center gap-2 rounded-2xl bg-black px-6 py-3 text-sm font-bold text-white transition-all hover:shadow-xl"
                        >
                          <Save className="h-4 w-4" />
                          保存
                        </button>
                        <button
                          onClick={handleClearApiKey}
                          className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-6 py-3 text-sm font-bold text-zinc-700 transition-all hover:bg-zinc-100"
                        >
                          <Trash2 className="h-4 w-4" />
                          清除
                        </button>
                      </div>

                      {settingsMessage && (
                        <p className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                          {settingsMessage}
                        </p>
                      )}
                    </div>
                  </section>

                  <section className="rounded-[32px] border border-zinc-100 bg-zinc-900 p-8 text-white">
                    <h3 className="mb-6 text-sm font-black uppercase tracking-widest text-zinc-500">部署状态</h3>
                    <div className="space-y-5">
                      <div className="flex items-center justify-between border-b border-white/10 pb-4">
                        <span className="text-sm text-zinc-400">GitHub Pages</span>
                        <span className="text-sm font-black text-emerald-400">Ready</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-white/10 pb-4">
                        <span className="text-sm text-zinc-400">静态构建</span>
                        <span className="text-sm font-black text-emerald-400">Ready</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-zinc-400">共享密钥</span>
                        <span className="text-sm font-black text-zinc-200">Disabled</span>
                      </div>
                    </div>
                  </section>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
