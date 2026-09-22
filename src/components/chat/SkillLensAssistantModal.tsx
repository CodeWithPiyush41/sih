import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { supabase } from '@/lib/supabase/client';
import {
  Sparkles,
  Send,
  X,
  Bot,
  User,
  BookOpen,
  FileText,
  AlertTriangle,
  RefreshCw,
  HelpCircle,
  ChevronRight,
  ShieldCheck,
  MessageSquare,
} from 'lucide-react';

export interface ChatSource {
  materialId?: string;
  materialTitle?: string;
  chunkId?: string;
  pageStart?: number;
  pageEnd?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: ChatSource[];
  hasSourceMaterial?: boolean;
  createdAt?: string;
}

interface SkillLensAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
}

const PRESET_PROMPTS = [
  'Explain my weakest competency',
  'Explain sampling methods',
  'Help me understand data validation',
  'Summarize this training material',
  'Give me a practice question on this topic',
  'Explain why my answer was incorrect',
];

export const SkillLensAssistantModal: React.FC<SkillLensAssistantModalProps> = ({
  isOpen,
  onClose,
  initialPrompt = '',
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      if (initialPrompt && messages.length === 0) {
        handleSendMessage(initialPrompt);
      }
    }
  }, [isOpen, initialPrompt]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const queryText = (textToSend || inputMessage).trim();
    if (!queryText || loading) return;

    setErrorMsg(null);
    const userMsgId = `usr-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: queryText,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: queryText,
          conversationId: conversationId || undefined,
        }),
      });

      if (res.status === 429) {
        throw new Error('Rate limit exceeded. You can send up to 10 chat requests per minute.');
      }

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'AI Assistant service encountered an issue.');
      }

      const data = await res.json();

      if (data.conversationId) {
        setConversationId(data.conversationId);
      }

      const assistantMsg: ChatMessage = {
        id: `ast-${Date.now()}`,
        role: 'assistant',
        content: data.answer || 'No response provided.',
        sources: data.sources || [],
        hasSourceMaterial: data.hasSourceMaterial,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('Chat Assistant Error:', err);
      const errorText = err?.message || 'AI Assistant is temporarily unavailable. Please make sure the local AI service is running.';
      setErrorMsg(errorText);

      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: errorText,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="assistant-title"
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col h-[640px] max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-900 via-primary to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20 text-white">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 id="assistant-title" className="text-base font-bold leading-tight flex items-center gap-2">
                <span>SkillLens AI Assistant</span>
                <span className="text-[10px] uppercase font-bold tracking-wider bg-white/20 text-white px-2 py-0.5 rounded-full">
                  Ollama Backend
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Ask questions about your training materials and competency development.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close assistant"
            className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Chat Messages Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/50">
          {messages.length === 0 ? (
            <div className="py-6 space-y-6">
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                  <Bot size={18} />
                  <span>Welcome to SkillLens AI Learning Assistant</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  I can analyze your indexed statistical PDF training materials, help remediate identified competency gaps, explain survey concepts, and answer practice questions.
                </p>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                  <ShieldCheck size={14} className="text-emerald-600" />
                  <span>RAG Grounded &bull; Powered by local Ollama AI backend</span>
                </div>
              </div>

              {/* Preset Prompts Grid */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5 px-1">
                  Suggested Prompts
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PRESET_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => handleSendMessage(prompt)}
                      className="text-left p-3 rounded-xl bg-white border border-slate-200 hover:border-primary/50 hover:bg-primary/5 text-xs text-slate-700 font-medium transition-all duration-150 flex items-center justify-between group shadow-2xs"
                    >
                      <span className="line-clamp-2">{prompt}</span>
                      <ChevronRight size={14} className="text-slate-400 group-hover:text-primary shrink-0 ml-1" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold ${
                      isUser ? 'bg-primary text-white' : 'bg-slate-900 text-white'
                    }`}
                  >
                    {isUser ? <User size={16} /> : <Bot size={16} />}
                  </div>

                  <div className={`max-w-[82%] space-y-2`}>
                    <div
                      className={`p-4 rounded-2xl text-sm leading-relaxed ${
                        isUser
                          ? 'bg-primary text-white font-medium rounded-tr-none'
                          : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-2xs'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>

                    {/* Source Attribution Chips for Assistant Messages */}
                    {!isUser && msg.sources && msg.sources.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1 px-1">
                        <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                          <BookOpen size={12} className="text-primary" />
                          Based on training material:
                        </span>
                        {msg.sources.map((src, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200/60 px-2 py-0.5 rounded-md"
                          >
                            <FileText size={10} />
                            {src.materialTitle || 'Training Doc'} — Page {src.pageStart || 1}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {loading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0">
                <Bot size={16} />
              </div>
              <div className="p-4 rounded-2xl bg-white border border-slate-200 text-slate-600 text-xs font-medium flex items-center gap-2 rounded-tl-none shadow-2xs">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span>Thinking... (Searching RAG chunks & querying Ollama)</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Footer */}
        <div className="p-4 bg-white border-t border-slate-100 space-y-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={loading}
              placeholder="Ask about sampling methods, data validation, your competency gaps..."
              className="flex-1 px-4 py-3 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-slate-50 text-slate-900"
            />
            <Button
              type="submit"
              variant="primary"
              disabled={!inputMessage.trim() || loading}
              className="px-5 py-3 rounded-xl shrink-0"
            >
              <Send size={16} />
            </Button>
          </form>
          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span>Powered by Ollama Local AI &bull; Strict SIH26101 Grounding</span>
            <span className="hidden sm:inline">Press Enter to send</span>
          </div>
        </div>
      </div>
    </div>
  );
};
