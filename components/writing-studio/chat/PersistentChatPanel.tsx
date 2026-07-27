'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  X, 
  Send, 
  BookOpen, 
  FileText,
  Plus,
  Loader2,
  ChevronDown,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  attachments?: Attachment[];
  isStreaming?: boolean;
  error?: boolean;
}

export interface Attachment {
  type: 'epub' | 'pdf' | 'text';
  name: string;
  path?: string;
  content?: string;
}

interface PersistentChatPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose?: () => void;
  className?: string;
  documentContext?: string;
}

export function PersistentChatPanel({ 
  isOpen, 
  onToggle, 
  onClose,
  className,
  documentContext,
}: PersistentChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'system',
      content: 'I\'m your writing assistant. Ask me anything about your manuscript — structure, style, characters, research, or editing.',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<Attachment[]>([]);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [height, setHeight] = useState(300);
  const [isResizing, setIsResizing] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth'
    });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newHeight = window.innerHeight - e.clientY;
      setHeight(Math.max(200, Math.min(600, newHeight)));
    };
    const handleMouseUp = () => setIsResizing(false);
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const sendMessage = useCallback(async (query?: string) => {
    const messageText = query || input;
    if (!messageText.trim() && attachedFiles.length === 0) return;
    if (isLoading) return;

    setLastError(null);
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
      attachments: attachedFiles.length > 0 ? [...attachedFiles] : undefined
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setAttachedFiles([]);
    setIsLoading(true);

    const assistantId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    }]);

    try {
      abortRef.current = new AbortController();

      const history = messages
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

      history.push({ role: 'user', content: messageText });

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history,
          ...(documentContext ? { context: documentContext } : {}),
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `AI service error (${res.status})`);
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.done) break;
            if (data.error) throw new Error(data.error);
            if (data.content) {
              accumulated += data.content;
              setMessages(prev =>
                prev.map(m =>
                  m.id === assistantId
                    ? { ...m, content: accumulated, isStreaming: true }
                    : m
                )
              );
            }
          } catch {}
        }
      }

      setMessages(prev =>
        prev.map(m =>
          m.id === assistantId
            ? { ...m, content: accumulated || 'Done.', isStreaming: false }
            : m
        )
      );
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      const errorMsg = err.message || 'AI unavailable. Please try again.';
      setLastError(errorMsg);
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantId
            ? { ...m, content: errorMsg, isStreaming: false, error: true }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [input, attachedFiles, isLoading, documentContext]);

  const handleRetry = () => {
    const lastUser = [...messages].reverse().find(m => m.role === 'user');
    if (lastUser) {
      setMessages(prev => prev.filter(m => !m.error));
      sendMessage(lastUser.content);
    }
  };

  const handleAttachFile = (type: 'epub' | 'pdf') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = type === 'epub' ? '.epub' : '.pdf';
    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setAttachedFiles(prev => [...prev, { type, name: file.name }]);
      }
    };
    input.click();
    setShowFileMenu(false);
  };

  const removeAttachment = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearChat = () => {
    abortRef.current?.abort();
    setMessages([{
      id: 'welcome',
      role: 'system',
      content: 'Chat cleared. How can I help you?',
      timestamp: new Date()
    }]);
    setLastError(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height, opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "fixed bottom-0 left-0 right-0 bg-white dark:bg-brand-dark border-t border-zinc-200 dark:border-zinc-800 flex flex-col z-50",
            className
          )}
          style={{ height }}
        >
          <div
            onMouseDown={() => setIsResizing(true)}
            className="h-1 cursor-ns-resize bg-zinc-200 dark:bg-zinc-800 hover:bg-blue-500 transition-colors"
            role="separator"
            aria-label="Resize chat panel"
          />

          <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-500" />
              <span className="font-semibold text-zinc-700 dark:text-zinc-200 text-sm">
                Writing Assistant
              </span>
              {documentContext && (
                <span className="text-[10px] text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded">
                  Context loaded
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-1">
              <button
                onClick={clearChat}
                className="px-2 py-1 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                Clear
              </button>
              <button
                onClick={onToggle}
                className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
                aria-label="Minimize chat"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
                  aria-label="Close chat"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-3"
            role="log"
            aria-live="polite"
            aria-label="Chat messages"
          >
            {messages.map((message) => (
              <ChatMessageBubble key={message.id} message={message} />
            ))}
            
            {isLoading && !messages.find(m => m.isStreaming) && (
              <div className="flex items-center gap-2 text-zinc-400 text-xs">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Thinking...</span>
              </div>
            )}
          </div>

          {lastError && (
            <div className="px-4 py-2 border-t border-zinc-200 dark:border-zinc-800 bg-red-50 dark:bg-red-900/10 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>AI unavailable</span>
              </div>
              <button
                onClick={handleRetry}
                className="flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400 hover:underline"
              >
                <RefreshCw className="w-3 h-3" /> Retry
              </button>
            </div>
          )}

          {attachedFiles.length > 0 && (
            <div className="px-4 py-2 border-t border-zinc-200 dark:border-zinc-800 flex gap-2 flex-wrap">
              {attachedFiles.map((file, idx) => (
                <div 
                  key={idx}
                  className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded text-xs"
                >
                  {file.type === 'epub' ? <BookOpen className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                  <span className="max-w-[150px] truncate">{file.name}</span>
                  <button 
                    onClick={() => removeAttachment(idx)}
                    className="hover:text-red-500 min-w-[16px]"
                    aria-label={`Remove ${file.name}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="p-3 border-t border-zinc-200 dark:border-zinc-800">
            <div className="flex gap-2">
              <div className="relative">
                <button
                  onClick={() => setShowFileMenu(!showFileMenu)}
                  className="min-w-[36px] min-h-[36px] flex items-center justify-center p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
                  aria-label="Attach file"
                  aria-expanded={showFileMenu}
                >
                  <Plus className="w-4 h-4" />
                </button>
                
                {showFileMenu && (
                  <div className="absolute bottom-full left-0 mb-2 w-44 bg-white dark:bg-zinc-900 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-700 py-1" role="menu">
                    <button
                      onClick={() => handleAttachFile('epub')}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2"
                      role="menuitem"
                    >
                      <BookOpen className="w-4 h-4 text-blue-500" />
                      Attach EPUB
                    </button>
                    <button
                      onClick={() => handleAttachFile('pdf')}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2"
                      role="menuitem"
                    >
                      <FileText className="w-4 h-4 text-red-500" />
                      Attach PDF
                    </button>
                  </div>
                )}
              </div>
              
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Ask about your writing..."
                className="flex-1 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg border-0 resize-none focus:ring-2 focus:ring-blue-500 min-h-[36px] max-h-28 text-sm"
                rows={1}
                aria-label="Message input"
                disabled={isLoading}
              />
              
              <button
                onClick={() => sendMessage()}
                disabled={(!input.trim() && attachedFiles.length === 0) || isLoading}
                className="min-w-[36px] min-h-[36px] flex items-center justify-center p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Send message"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ChatMessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  return (
    <div className={cn("flex gap-2", isUser ? "flex-row-reverse" : "")} role="article" aria-label={`${message.role} message`}>
      <div className={cn(
        "w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold",
        isUser 
          ? "bg-blue-500 text-white" 
          : isSystem
            ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400"
            : "bg-purple-500 text-white"
      )}>
        {isUser ? 'U' : isSystem ? 'S' : 'AI'}
      </div>

      <div className={cn("max-w-[80%]", isUser ? "items-end" : "items-start")}>
        <div className={cn(
          "px-3 py-2 rounded-2xl text-sm leading-relaxed",
          isUser
            ? "bg-blue-500 text-white rounded-br-md"
            : message.error
              ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
              : isSystem
                ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-bl-md"
        )}>
          {message.attachments && message.attachments.length > 0 && (
            <div className="mb-2 flex gap-1.5 flex-wrap">
              {message.attachments.map((file, idx) => (
                <div key={idx} className="flex items-center gap-1 px-2 py-0.5 bg-white/20 rounded text-xs">
                  {file.type === 'epub' ? <BookOpen className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                  {file.name}
                </div>
              ))}
            </div>
          )}
          <div className="whitespace-pre-wrap">
            {message.content}
            {message.isStreaming && (
              <span className="inline-block w-1 h-3.5 ml-0.5 bg-current opacity-70 animate-pulse" />
            )}
          </div>
        </div>
        <div className="text-[10px] text-zinc-400 mt-0.5 px-1">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
}

export function ChatToggleButton({ 
  isOpen, 
  onClick, 
  unreadCount = 0 
}: { 
  isOpen: boolean; 
  onClick: () => void;
  unreadCount?: number;
}) {
  if (isOpen) return null;

  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 w-12 h-12 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 flex items-center justify-center z-50 transition-transform hover:scale-105"
      aria-label="Open writing assistant"
    >
      <MessageSquare className="w-5 h-5" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
          {unreadCount}
        </span>
      )}
    </button>
  );
}
