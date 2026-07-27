'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  History,
  Check,
  X,
  Send,
  Bot,
  Loader2,
  Search,
  BookOpen,
  MessageSquare,
  Lightbulb,
  AlertTriangle,
  Quote,
  FileWarning,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import { useWritingInsights, type Insight, type InsightType } from '@/hooks/useWritingInsights';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';
import { NeuralPanel } from '@/components/writing-studio/nobel/NeuralPanel';
import { UXAgentPanel } from '@/components/writing-studio/ux/UXAgentPanel';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';

const NobelPanel = dynamic(() => import('@/components/writing-studio/nobel/NobelPanel').then(m => ({ default: m.NobelPanel })), { ssr: false });
const CharacterPanel = dynamic(() => import('@/components/writing-studio/nobel/CharacterPanel').then(m => ({ default: m.CharacterPanel })), { ssr: false });
const AccessibilityReportPanel = dynamic(
  () => import('@/components/writing-studio/validation/AccessibilityReportPanel').then((m) => m.AccessibilityReportPanel),
  { ssr: false },
);
import { useAiCoWriter } from '@/hooks/useAiCoWriter';
import type { InterfaceMode } from '@/lib/user-preferences';
import type { UXAnalysisResult } from '@/lib/ux-agent-engine';

interface Version {
  id: string;
  timestamp: string;
  preview: string;
  isAISuggestion?: boolean;
  status?: 'pending' | 'applied' | 'rejected';
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

type TabId = 'neuro' | 'nobel' | 'chars' | 'ai' | 'research' | 'plan' | 'critique' | 'ux' | 'insights';

interface RightPanelProps {
  activeTab?: TabId;
  onTabChange?: (tab: TabId) => void;
  content?: string;
  projectId?: string;
  projectTitle?: string;
  projectType?: 'book' | 'research' | 'assignment';
  interfaceMode?: InterfaceMode;
  uxResult?: UXAnalysisResult | null;
  onJumpToSection?: (anchor: string) => void;
}

const ALL_TABS: { id: TabId; label: string; advancedOnly?: boolean }[] = [
  { id: 'ai', label: 'AI' },
  { id: 'neuro', label: 'Neuro' },
  { id: 'insights', label: 'Insights', advancedOnly: true },
  { id: 'nobel', label: 'Nobel', advancedOnly: true },
  { id: 'chars', label: 'Chars', advancedOnly: true },
  { id: 'research', label: 'Research', advancedOnly: true },
  { id: 'plan', label: 'Plan', advancedOnly: true },
  { id: 'critique', label: 'Critique', advancedOnly: true },
  { id: 'ux', label: 'UX', advancedOnly: true },
];

const BEGINNER_PROMPTS = [
  { icon: '✍️', text: 'Help me start this section', prompt: 'Help me write the opening of this section based on what I have so far.' },
  { icon: '✨', text: 'Make this paragraph clearer', prompt: 'Please rewrite the last paragraph to be clearer and more engaging.' },
  { icon: '🔍', text: 'Check my argument', prompt: 'Analyze the strength of the argument in my current text and suggest improvements.' },
];


const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: '1',
    role: 'assistant',
    content: "I'm your AI writing assistant. Ask me to expand a section, improve a paragraph, suggest transitions, or anything else about your document.",
  },
];

export function RightPanel({
  activeTab = 'ai',
  onTabChange,
  content = '',
  projectId = 'default',
  projectTitle = 'Untitled',
  projectType = 'book',
  interfaceMode = 'beginner',
  uxResult,
  onJumpToSection,
}: RightPanelProps) {
  const insights = useWritingInsights(content, { projectType, debounceMs: 5000, maxInsights: 3 });
  const visibleTabs = interfaceMode === 'beginner'
    ? ALL_TABS.filter(t => !t.advancedOnly)
    : ALL_TABS;

  const [currentTab, setCurrentTab] = useState<TabId>(
    visibleTabs.some(t => t.id === activeTab) ? activeTab : visibleTabs[0].id
  );
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isValidProjectId = projectId && projectId !== 'default';
  const convexVersions = useQuery(
    api.projects.getVersions,
    isValidProjectId ? { projectId: projectId as Id<"projects"> } : "skip"
  );

  const versions: Version[] = (convexVersions ?? []).map((v) => ({
    id: v._id,
    timestamp: new Date(v.savedAt).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    preview: v.label || v.content.substring(0, 120).replace(/<[^>]*>/g, '') + (v.content.length > 120 ? '…' : ''),
    isAISuggestion: false,
    status: 'applied' as const,
  }));

  const { generate, isGenerating, streamedText, abort } = useAiCoWriter();
  const streamingIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!visibleTabs.some(t => t.id === currentTab)) {
      setCurrentTab(visibleTabs[0].id);
    }
  }, [interfaceMode]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  useEffect(() => {
    if (isGenerating && streamedText && streamingIdRef.current) {
      setMessages(prev =>
        prev.map(m =>
          m.id === streamingIdRef.current
            ? { ...m, content: streamedText, isStreaming: true }
            : m
        )
      );
    }
  }, [streamedText, isGenerating]);

  const handleTabClick = (tabId: TabId) => {
    setCurrentTab(tabId);
    onTabChange?.(tabId);
  };

  const handleSendMessage = async (overrideInput?: string) => {
    const userMessage = (overrideInput || chatInput).trim();
    if (!userMessage || isGenerating) return;
    if (!overrideInput) setChatInput('');

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: userMessage };
    const streamingId = (Date.now() + 1).toString();
    streamingIdRef.current = streamingId;
    const aiPlaceholder: ChatMessage = { id: streamingId, role: 'assistant', content: '', isStreaming: true };

    setMessages(prev => [...prev, userMsg, aiPlaceholder]);

    const result = await generate({
      currentText: content.substring(0, 2000),
      context: content.substring(0, 500),
      mode: 'instruction',
      instruction: userMessage,
    });

    streamingIdRef.current = null;
    setMessages(prev =>
      prev.map(m =>
        m.id === streamingId
          ? { ...m, content: result || 'I could not generate a response. Please try again.', isStreaming: false }
          : m
      )
    );
  };


  const renderTabContent = () => {
    switch (currentTab) {
      case 'insights':
        return <InsightsTab insights={insights} onJump={onJumpToSection} />;

      case 'neuro':
        return <div className="flex-1 overflow-y-auto custom-scrollbar"><NeuralPanel content={content} /></div>;

      case 'nobel':
        return (
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <NobelPanel content={content} projectTitle={projectTitle} />
          </div>
        );

      case 'chars':
        return <div className="flex-1 overflow-y-auto custom-scrollbar"><CharacterPanel projectId={projectId} /></div>;

      case 'research':
        return <ResearchTab content={content} />;

      case 'plan':
        return <PlanTab content={content} />;

      case 'critique':
        return <CritiqueTab content={content} />;

      case 'ux':
        return (
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <UXAgentPanel content={content} externalResult={uxResult} />
          </div>
        );

      case 'ai':
      default:
        return (
          <div className="flex-1 flex flex-col overflow-hidden">
            {interfaceMode === 'advanced' && (
              <div className="border-b border-zinc-200 dark:border-zinc-800">
                <div className="p-3 bg-zinc-100/50 dark:bg-zinc-900/20 border-b border-zinc-200 dark:border-zinc-800/50">
                  <h4 className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-2">
                    <History className="w-3 h-3" />
                    Rollback & Versions
                  </h4>
                </div>
                <div className="p-3 space-y-2 max-h-[140px] overflow-y-auto custom-scrollbar">
                  {versions.length === 0 && (
                    <p className="text-[11px] text-zinc-400 text-center py-2">No saved versions yet.</p>
                  )}
                  {versions.map(version => (
                    <motion.div
                      key={version.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white dark:bg-zinc-800/40 p-3 rounded-lg border border-brand/30 bg-brand/5 dark:bg-brand/10 transition-colors"
                    >
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[10px] font-semibold text-zinc-500">{version.timestamp}</span>
                        <span className="text-[9px] font-bold text-brand uppercase">Saved</span>
                      </div>
                      <p className="text-[11px] line-clamp-2 text-zinc-600 dark:text-zinc-400">{version.preview}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-zinc-900/10">
              <div className="p-3 bg-zinc-100/50 dark:bg-zinc-900/20 border-b border-zinc-200 dark:border-zinc-800/50 flex justify-between items-center shrink-0">
                <h4 className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-2">
                  <Sparkles className="w-3 h-3 text-brand" />
                  {interfaceMode === 'beginner' ? 'Writing Help' : 'Writing Assistant'}
                </h4>
                {isGenerating && (
                  <button onClick={abort} className="text-[9px] text-destructive font-bold hover:underline">Stop</button>
                )}
              </div>

              {/* Beginner prompts */}
              {interfaceMode === 'beginner' && (
                <div className="p-3 border-b border-zinc-100 dark:border-zinc-800 space-y-2 shrink-0">
                  {BEGINNER_PROMPTS.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(p.prompt)}
                      disabled={isGenerating}
                      className="w-full text-left flex items-center gap-2.5 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 hover:bg-brand/5 dark:hover:bg-brand/10 border border-zinc-200 dark:border-zinc-700 hover:border-brand/30 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <span className="text-base">{p.icon}</span>
                      <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{p.text}</span>
                    </button>
                  ))}
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                {messages.map(message => (
                  <div key={message.id} className={cn('flex gap-2', message.role === 'user' ? 'flex-row-reverse' : '')}>
                    <div className={cn(
                      'w-6 h-6 rounded flex items-center justify-center shrink-0',
                      message.role === 'user' ? 'bg-zinc-200 dark:bg-zinc-700' : 'bg-brand/20 text-brand'
                    )}>
                      {message.role === 'user' ? (
                        <span className="text-[10px] font-bold">U</span>
                      ) : (
                        <Bot className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div className={cn(
                      'max-w-[85%] p-2.5 rounded-xl text-xs shadow-sm border',
                      message.role === 'user'
                        ? 'bg-brand text-white rounded-tr-none border-brand'
                        : 'bg-white dark:bg-zinc-800 rounded-tl-none border-zinc-200 dark:border-zinc-700'
                    )}>
                      {message.isStreaming && !message.content ? (
                        <div className="flex items-center gap-1.5">
                          <Loader2 className="w-3 h-3 animate-spin text-brand" />
                          <span className="text-zinc-400">Thinking...</span>
                        </div>
                      ) : (
                        <span className="whitespace-pre-wrap leading-relaxed">{message.content}</span>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-brand-surface/50 shrink-0">
                <div className="relative">
                  <textarea
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder={interfaceMode === 'beginner' ? 'Or ask anything about your writing...' : 'Ask about your document...'}
                    className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs p-3 pr-10 focus:ring-1 focus:ring-brand min-h-[52px] max-h-[100px] resize-none outline-none"
                    rows={2}
                    disabled={isGenerating}
                  />
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!chatInput.trim() || isGenerating}
                    className="absolute bottom-2 right-2 p-1.5 bg-brand text-white rounded-lg hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <aside className="w-[400px] border-l border-zinc-200 dark:border-zinc-800 flex flex-col bg-zinc-50 dark:bg-brand-surface/40 overflow-hidden" data-rightpanel>
      {/* Tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto bg-zinc-100/30 dark:bg-black/20 shrink-0">
        {visibleTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={cn(
              'px-3 py-3 text-[9px] font-bold uppercase tracking-tight shrink-0 transition-colors whitespace-nowrap',
              currentTab === tab.id
                ? 'text-brand border-b-2 border-brand'
                : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
            )}
          >
            {tab.id === 'ai' ? (
              interfaceMode === 'beginner' ? 'Writing Help 🔥' : 'AI 🔥'
            ) : tab.id === 'neuro' && interfaceMode === 'beginner' ? (
              'Writing Score'
            ) : tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTab}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </aside>
  );
}

function useTabAI(systemPrompt: string, content: string) {
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const run = useCallback(async (userInstruction: string) => {
    setIsLoading(true);
    setResult('');
    setError('');
    try {
      const res = await fetch('/api/ai-cowriter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentText: content.substring(0, 3000),
          context: systemPrompt,
          mode: 'instruction',
          instruction: userInstruction,
        }),
      });
      if (!res.ok || !res.body) throw new Error('Failed');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') break;
            try {
              const parsed = JSON.parse(data);
              const token = parsed.choices?.[0]?.delta?.content || parsed.text || parsed.delta || '';
              accumulated += token;
              setResult(accumulated);
            } catch {
              accumulated += data;
              setResult(accumulated);
            }
          }
        }
      }
    } catch (e) {
      setError('Generation failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [content, systemPrompt]);

  return { result, isLoading, error, run };
}

function ResearchTab({ content }: { content: string }) {
  const [query, setQuery] = useState('');
  const { result, isLoading, error, run } = useTabAI(
    'You are an academic research assistant. Based on the document content provided, suggest 4-6 relevant academic citations, sources, or further reading that would strengthen the writing. Format each as: [Author(s), Year] Title. Brief 1-sentence relevance note.',
    content
  );

  const handleSearch = () => {
    const instruction = query.trim()
      ? `Find academic citations and sources related to: "${query}". Also consider the document context.`
      : 'Suggest academic citations and sources that would strengthen the arguments and claims in this document.';
    run(instruction);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-4 gap-3">
      <div className="flex items-center gap-2">
        <Search className="w-4 h-4 text-brand" />
        <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300 uppercase tracking-wide">Research & Citations</span>
      </div>
      <div className="flex gap-2">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
          placeholder="Topic or keyword (optional)"
          className="flex-1 px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 outline-none focus:ring-1 focus:ring-brand"
          disabled={isLoading}
        />
        <button
          onClick={handleSearch}
          disabled={isLoading}
          className="px-3 py-2 bg-brand text-white text-xs rounded-lg hover:bg-brand/90 disabled:opacity-50 transition-colors flex items-center gap-1"
        >
          {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
        </button>
      </div>
      {!result && !isLoading && (
        <div className="text-center py-6 text-zinc-400">
          <div className="text-2xl mb-2">🔬</div>
          <p className="text-xs">Enter a topic or click search to find relevant citations for your document.</p>
        </div>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
      {result && (
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="bg-white dark:bg-zinc-800/60 rounded-lg border border-zinc-200 dark:border-zinc-700 p-3">
            <p className="text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">{result}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function PlanTab({ content }: { content: string }) {
  const { result, isLoading, error, run } = useTabAI(
    'You are a writing structure expert. Analyze the provided document and generate a clear, actionable outline or story plan. Use numbered sections with sub-points. If there is existing content, reflect it in the plan and suggest what should come next.',
    content
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-4 gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-brand" />
          <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300 uppercase tracking-wide">Story / Document Plan</span>
        </div>
        <button
          onClick={() => run('Generate a detailed outline and structural plan for this document. Show what exists and what should come next.')}
          disabled={isLoading}
          className="px-3 py-1.5 bg-brand text-white text-xs rounded-lg hover:bg-brand/90 disabled:opacity-50 transition-colors flex items-center gap-1"
        >
          {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          {isLoading ? 'Planning…' : 'Generate Plan'}
        </button>
      </div>
      {!result && !isLoading && (
        <div className="text-center py-6 text-zinc-400">
          <div className="text-2xl mb-2">📋</div>
          <p className="text-xs">Click "Generate Plan" to create a structural outline based on your current content.</p>
        </div>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
      {result && (
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="bg-white dark:bg-zinc-800/60 rounded-lg border border-zinc-200 dark:border-zinc-700 p-3">
            <p className="text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">{result}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function CritiqueTab({ content }: { content: string }) {
  const [focus, setFocus] = useState('');
  const { result, isLoading, error, run } = useTabAI(
    'You are a professional writing critic and editor. Provide a detailed critique of the writing: identify structural weaknesses, argument gaps, clarity issues, tone inconsistencies, and pacing problems. Also highlight what is working well. Be specific and constructive.',
    content
  );

  const handleCritique = () => {
    const instruction = focus.trim()
      ? `Critique this writing with a specific focus on: "${focus}". Identify both strengths and areas for improvement.`
      : 'Provide a thorough, balanced critique of this writing covering structure, clarity, argument strength, and style.';
    run(instruction);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-4 gap-3">
      <div className="flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-brand" />
        <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300 uppercase tracking-wide">Critique Mode</span>
      </div>
      <div className="flex gap-2">
        <input
          value={focus}
          onChange={e => setFocus(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleCritique(); }}
          placeholder="Focus area (e.g. pacing, argument) — optional"
          className="flex-1 px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 outline-none focus:ring-1 focus:ring-brand"
          disabled={isLoading}
        />
        <button
          onClick={handleCritique}
          disabled={isLoading || !content.trim()}
          className="px-3 py-2 bg-brand text-white text-xs rounded-lg hover:bg-brand/90 disabled:opacity-50 transition-colors flex items-center gap-1"
        >
          {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageSquare className="w-3.5 h-3.5" />}
        </button>
      </div>
      {!result && !isLoading && (
        <div className="text-center py-6 text-zinc-400">
          <div className="text-2xl mb-2">✍️</div>
          <p className="text-xs">{content.trim() ? 'Click the button to receive a detailed critique of your writing.' : 'Write something first, then come back for a critique.'}</p>
        </div>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
      {result && (
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="bg-white dark:bg-zinc-800/60 rounded-lg border border-zinc-200 dark:border-zinc-700 p-3">
            <p className="text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">{result}</p>
          </div>
        </div>
      )}
    </div>
  );
}

const INSIGHT_ICONS: Record<InsightType, typeof Lightbulb> = {
  pacing: TrendingUp,
  citation: Quote,
  'empty-section': FileWarning,
  'tone-shift': AlertTriangle,
};

const INSIGHT_COLORS: Record<InsightType, string> = {
  pacing: 'border-brand/40 bg-brand/5 dark:bg-brand/10',
  citation: 'border-brand/40 bg-brand/5 dark:bg-brand/10',
  'empty-section': 'border-destructive/40 bg-destructive/5 dark:bg-destructive/10',
  'tone-shift': 'border-border bg-muted/50',
};

const INSIGHT_ICON_COLORS: Record<InsightType, string> = {
  pacing: 'text-brand',
  citation: 'text-brand',
  'empty-section': 'text-destructive',
  'tone-shift': 'text-muted-foreground',
};

const INSIGHT_TYPE_LABELS: Record<InsightType, string> = {
  pacing: 'Pacing',
  citation: 'Missing Citation',
  'empty-section': 'Empty Section',
  'tone-shift': 'Tone Shift',
};

function InsightsTab({
  insights,
  onJump,
}: {
  insights: Insight[];
  onJump?: (anchor: string) => void;
}) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden p-4 gap-3">
      <div className="flex items-center gap-2 shrink-0">
        <Lightbulb className="w-4 h-4 text-brand" />
        <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300 uppercase tracking-wide">
          Writing Insights
        </span>
        {insights.length > 0 && (
          <span className="ml-auto text-[9px] font-bold bg-brand text-white rounded-full w-4 h-4 flex items-center justify-center">
            {insights.length}
          </span>
        )}
      </div>

      {insights.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-6 text-zinc-400">
          <Lightbulb className="w-8 h-8 mb-3 opacity-30" />
          <p className="text-xs font-medium mb-1">No issues detected</p>
          <p className="text-[11px] opacity-70">
            Insights appear automatically as you write. Analysis runs every 5 seconds.
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
          {insights.map(insight => {
            const Icon = INSIGHT_ICONS[insight.type];
            return (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn('p-3 rounded-xl border', INSIGHT_COLORS[insight.type])}
              >
                <div className="flex items-start gap-2.5">
                  <Icon className={cn('w-4 h-4 mt-0.5 shrink-0', INSIGHT_ICON_COLORS[insight.type])} />
                  <div className="flex-1 min-w-0">
                    <span className={cn('text-[9px] font-bold uppercase tracking-wider', INSIGHT_ICON_COLORS[insight.type])}>
                      {INSIGHT_TYPE_LABELS[insight.type]}
                    </span>
                    <p className="text-xs text-zinc-700 dark:text-zinc-300 mt-0.5 leading-relaxed">
                      {insight.message}
                    </p>
                    {insight.anchor && onJump && (
                      <button
                        onClick={() => onJump(insight.anchor!)}
                        className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-brand hover:underline"
                      >
                        Jump to section <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
          <p className="text-[10px] text-zinc-400 text-center pt-2">Analysis updates every 5 seconds.</p>
        </div>
      )}
    </div>
  );
}
