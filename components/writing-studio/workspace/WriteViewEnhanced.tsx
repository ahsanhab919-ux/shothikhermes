'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  // Mode icons
  BookOpen, 
  Search, 
  PenTool, 
  MessageSquare, 
  AlertCircle,
  History,
  Type,
  Sparkles,
  // Toolbar icons
  Bold, Italic, Underline, Strikethrough,
  Heading1, Heading2, Quote, List, ListOrdered,
  Undo, Redo, Save, Settings,
  // Panel icons
  PanelLeftClose, PanelLeftOpen,
  PanelRightClose, PanelRightOpen,
  ChevronDown, X, Send,
  // Cursor
  MousePointer2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { NeuralPanel, NobelPanel, CharacterPanel, NobelStatusBar } from '../nobel';
import { PersistentChatPanel, ChatToggleButton } from '../chat/PersistentChatPanel';

// Writing Modes
type WritingMode = 'research' | 'plan' | 'write' | 'critique' | 'format';

interface WriteViewEnhancedProps {
  bookTitle: string;
  project: any;
}

export function WriteViewEnhanced({ bookTitle, project }: WriteViewEnhancedProps) {
  // State
  const [activeMode, setActiveMode] = useState<WritingMode>('write');
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [chatOpen, setChatOpen] = useState(true); // Chat open by default (like Replit)
  const [showRollback, setShowRollback] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Start writing your masterpiece...',
      }),
    ],
    content: history[historyIndex] || '',
    editorProps: {
      attributes: {
        role: 'textbox',
        'aria-label': 'Document editor',
        'aria-multiline': 'true',
        class: 'outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      const content = editor.getHTML();
      // Auto-save to history
      if (historyIndex === history.length - 1 || history.length === 0) {
        setHistory(prev => [...prev.slice(-19), content]);
        setHistoryIndex(prev => prev + 1);
      }
    },
  });

  // Undo/Redo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      editor?.commands.setContent(history[newIndex]);
    }
  }, [history, historyIndex, editor]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      editor?.commands.setContent(history[newIndex]);
    }
  }, [history, historyIndex, editor]);

  // Get content for analysis
  const content = editor?.getText() || '';
  const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
  const charCount = content.length;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-brand-dark">
      {/* Top Toolbar */}
      <TopToolbar 
        activeMode={activeMode}
        setActiveMode={setActiveMode}
        leftPanelOpen={leftPanelOpen}
        setLeftPanelOpen={setLeftPanelOpen}
        rightPanelOpen={rightPanelOpen}
        setRightPanelOpen={setRightPanelOpen}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel */}
        <AnimatePresence>
          {leftPanelOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-brand-surface/30 flex flex-col shrink-0"
            >
              <LeftPanelContent activeMode={activeMode} />
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Center Editor */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mode Indicator */}
          <div className="px-4 py-2 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {activeMode === 'research' && <><Search className="w-4 h-4 text-blue-500" /><span className="text-sm text-blue-600">Research Mode</span></>}
              {activeMode === 'plan' && <><BookOpen className="w-4 h-4 text-purple-500" /><span className="text-sm text-purple-600">Plan Mode</span></>}
              {activeMode === 'write' && <><PenTool className="w-4 h-4 text-green-500" /><span className="text-sm text-green-600">Write Mode</span></>}
              {activeMode === 'critique' && <><AlertCircle className="w-4 h-4 text-amber-500" /><span className="text-sm text-amber-600">Critique Mode</span></>}
              {activeMode === 'format' && <><Type className="w-4 h-4 text-pink-500" /><span className="text-sm text-pink-600">Format Mode</span></>}
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowRollback(!showRollback)}
                className="flex items-center gap-1 px-2 py-1 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <History className="w-3.5 h-3.5" />
                Rollback
              </button>
            </div>
          </div>

          {/* Editor Area */}
          <div className="flex-1 relative overflow-hidden">
            <EditorContent 
              editor={editor} 
              className="h-full overflow-y-auto p-8 prose prose-slate dark:prose-invert max-w-none"
            />
            
            {/* Floating Chat Button - Only show when chat is closed */}
            {!chatOpen && (
              <ChatToggleButton 
                isOpen={chatOpen} 
                onClick={() => setChatOpen(true)} 
              />
            )}

            {/* Rollback Panel */}
            <AnimatePresence>
              {showRollback && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="absolute top-4 left-4 w-64 bg-white dark:bg-zinc-900 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-700 p-4"
                >
                  <RollbackPanel 
                    history={history}
                    currentIndex={historyIndex}
                    onRollback={(idx) => {
                      setHistoryIndex(idx);
                      editor?.commands.setContent(history[idx]);
                      setShowRollback(false);
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Panel */}
        <AnimatePresence>
          {rightPanelOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-l border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-brand-surface/30 flex flex-col shrink-0"
            >
              <RightPanelContent 
                activeMode={activeMode}
                content={content}
                project={project}
              />
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Status Bar */}
      <NobelStatusBar 
        content={content}
        wordCount={wordCount}
        charCount={charCount}
        toonSavings={45}
      />

      {/* Persistent Chat Panel - Like Replit */}
      <PersistentChatPanel 
        isOpen={chatOpen}
        onToggle={() => setChatOpen(!chatOpen)}
      />
    </div>
  );
}

// Top Toolbar Component
function TopToolbar({ 
  activeMode, setActiveMode,
  leftPanelOpen, setLeftPanelOpen,
  rightPanelOpen, setRightPanelOpen,
  onUndo, onRedo, canUndo, canRedo
}: {
  activeMode: WritingMode;
  setActiveMode: (mode: WritingMode) => void;
  leftPanelOpen: boolean;
  setLeftPanelOpen: (v: boolean) => void;
  rightPanelOpen: boolean;
  setRightPanelOpen: (v: boolean) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}) {
  const modes: { id: WritingMode; label: string; icon: any }[] = [
    { id: 'research', label: 'Research', icon: Search },
    { id: 'plan', label: 'Plan', icon: BookOpen },
    { id: 'write', label: 'Write', icon: PenTool },
    { id: 'critique', label: 'Critique', icon: AlertCircle },
    { id: 'format', label: 'Format', icon: Type },
  ];

  return (
    <div className="h-14 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-brand-dark flex items-center justify-between px-4 shrink-0">
      {/* Left: Panel Toggle + Modes */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setLeftPanelOpen(!leftPanelOpen)}
          className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
          title={leftPanelOpen ? 'Hide left panel' : 'Show left panel'}
        >
          {leftPanelOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
        </button>

        <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-700 mx-2" />

        <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
          {modes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setActiveMode(mode.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                activeMode === mode.id
                  ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              )}
            >
              <mode.icon className="w-4 h-4" />
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Center: Formatting Toolbar */}
      <div className="flex items-center gap-1">
        <ToolbarButton onClick={onUndo} disabled={!canUndo} title="Undo">
          <Undo className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={onRedo} disabled={!canRedo} title="Redo">
          <Redo className="w-4 h-4" />
        </ToolbarButton>
        
        <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-700 mx-1" />
        
        <ToolbarButton onClick={() => {}} title="Bold">
          <Bold className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => {}} title="Italic">
          <Italic className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => {}} title="Underline">
          <Underline className="w-4 h-4" />
        </ToolbarButton>
      </div>

      {/* Right: Panel Toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setRightPanelOpen(!rightPanelOpen)}
          className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
          title={rightPanelOpen ? 'Hide right panel' : 'Show right panel'}
        >
          {rightPanelOpen ? <PanelRightClose className="w-5 h-5" /> : <PanelRightOpen className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}

function ToolbarButton({ children, onClick, disabled, title }: { 
  children: React.ReactNode; 
  onClick: () => void;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "p-2 rounded-lg transition-colors",
        disabled 
          ? "opacity-30 cursor-not-allowed" 
          : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
      )}
    >
      {children}
    </button>
  );
}

// Left Panel Content
function LeftPanelContent({ activeMode }: { activeMode: WritingMode }) {
  switch (activeMode) {
    case 'research':
      return <ResearchPanel />;
    case 'plan':
      return <PlanPanel />;
    case 'write':
      return <WritePanel />;
    case 'critique':
      return <CritiquePanel />;
    case 'format':
      return <FormatPanel />;
    default:
      return <WritePanel />;
  }
}

// Right Panel Content
function RightPanelContent({ activeMode, content, project }: { 
  activeMode: WritingMode; 
  content: string;
  project: any;
}) {
  const [activeTab, setActiveTab] = useState('neuro');

  const tabs = [
    { id: 'neuro', label: 'Neuro', icon: Sparkles },
    { id: 'nobel', label: 'Nobel', icon: Sparkles },
    { id: 'characters', label: 'Characters', icon: Sparkles },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 px-3 py-2 text-xs font-medium transition-colors",
              activeTab === tab.id
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-zinc-500 hover:text-zinc-700"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'neuro' && <NeuralPanel content={content} />}
        {activeTab === 'nobel' && <NobelPanel content={content} />}
        {activeTab === 'characters' && <CharacterPanel projectId={project?._id} />}
      </div>
    </div>
  );
}

// Rollback Panel
function RollbackPanel({ history, currentIndex, onRollback }: {
  history: string[];
  currentIndex: number;
  onRollback: (idx: number) => void;
}) {
  return (
    <div className="space-y-2">
      <h4 className="font-semibold text-zinc-700 dark:text-zinc-200">Version History</h4>
      <div className="space-y-1 max-h-48 overflow-y-auto">
        {history.map((_, idx) => (
          <button
            key={idx}
            onClick={() => onRollback(idx)}
            className={cn(
              "w-full text-left px-3 py-2 rounded text-sm",
              idx === currentIndex
                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600"
            )}
          >
            Version {idx + 1}
            {idx === currentIndex && <span className="ml-2 text-xs">(current)</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
// Mode Panels (placeholders)
function ResearchPanel() {
  return (
    <div className="p-4">
      <h3 className="font-semibold mb-4">Research Tools</h3>
      <div className="space-y-2">
        <button className="w-full p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-left">
          <div className="font-medium">Web Search</div>
          <div className="text-sm text-zinc-500">Search the web for sources</div>
        </button>
        <button className="w-full p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-left">
          <div className="font-medium">Citation Manager</div>
          <div className="text-sm text-zinc-500">Manage your references</div>
        </button>
      </div>
    </div>
  );
}

function PlanPanel() {
  return (
    <div className="p-4">
      <h3 className="font-semibold mb-4">Planning</h3>
      <div className="space-y-2">
        <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
          <div className="font-medium">Story Structure</div>
          <div className="mt-2 space-y-1">
            {['Hook', 'Inciting Incident', 'Rising Action', 'Climax', 'Resolution'].map((beat) => (
              <div key={beat} className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                <span className="text-sm">{beat}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function WritePanel() {
  return (
    <div className="p-4">
      <h3 className="font-semibold mb-4">Manuscript</h3>
      <div className="space-y-1">
        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-2 border-blue-500">
          <div className="font-medium text-sm">Chapter 1: The Beginning</div>
        </div>
        <div className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg cursor-pointer">
          <div className="text-sm">Chapter 2: The Conflict</div>
        </div>
        <div className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg cursor-pointer">
          <div className="text-sm">Chapter 3: The Resolution</div>
        </div>
      </div>
    </div>
  );
}

function CritiquePanel() {
  return (
    <div className="p-4">
      <h3 className="font-semibold mb-4">AI Critique</h3>
      <div className="space-y-2">
        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200">
          <div className="font-medium text-amber-800">Pacing</div>
          <div className="text-sm text-amber-700">Consider adding more tension in scene 3</div>
        </div>
        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200">
          <div className="font-medium text-green-800">Character Voice</div>
          <div className="text-sm text-green-700">Strong distinct voices for each character</div>
        </div>
      </div>
    </div>
  );
}

function FormatPanel() {
  return (
    <div className="p-4">
      <h3 className="font-semibold mb-4">Formatting</h3>
      <div className="space-y-2">
        <button className="w-full p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-left">
          <div className="font-medium">Export to PDF</div>
        </button>
        <button className="w-full p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-left">
          <div className="font-medium">Export to ePub</div>
        </button>
        <button className="w-full p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-left">
          <div className="font-medium">Export to Word</div>
        </button>
      </div>
    </div>
  );
}
