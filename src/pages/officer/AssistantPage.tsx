import React, { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase/client';
import {
  Sparkles,
  Send,
  Bot,
  User,
  BookOpen,
  FileText,
  ShieldCheck,
  ChevronRight,
  Plus,
  MessageSquare,
  Clock,
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
}

export interface ChatConversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

const PRESET_PROMPTS = [
  'Explain my weakest competency',
  'Explain sampling methods',
  'Help me understand data validation',
  'Summarize this training material',
  'Give me a practice question on this topic',
  'Explain why my answer was incorrect',
];

export function AssistantPage() {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [aiConnected, setAiConnected] = useState<boolean>(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
    checkAiHealth();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const checkAiHealth = async () => {
    try {
      const res = await fetch('/api/ai/health');
      if (res.ok) {
        const data = await res.json();
        setAiConnected(data.ollama === 'available' || data.gemini === 'available');
      } else {
        setAiConnected(false);
      }
    } catch {
      setAiConnected(false);
    }
  };

  const fetchConversations = async () => {
    setLoadingConvs(true);
    setHistoryError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const userId = session?.user?.id;

      const res = await fetch('/api/chat/conversations', {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(userId ? { 'x-user-id': userId } : {}),
        },
      });

      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
        if (data.conversations && data.conversations.length > 0 && !activeConvId) {
          loadConversationMessages(data.conversations[0].id);
        }
      } else {
        setHistoryError('Unable to load conversation history.');
      }
    } catch (err) {
      console.warn('Could not fetch conversations:', err);
      setHistoryError('Unable to load conversation history.');
    } finally {
      setLoadingConvs(false);
    }
  };

  const loadConversationMessages = async (convId: string) => {
    setActiveConvId(convId);
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const userId = session?.user?.id;

      const res = await fetch(`/api/chat/conversations/${convId}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(userId ? { 'x-user-id': userId } : {}),
        },
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(
          (data.messages || []).map((m: any) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            sources: m.sources || [],
          }))
        );
      }
    } catch (err) {
      console.warn('Could not load messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = () => {
    setActiveConvId(null);
    setMessages([]);
    setInputMessage('');
  };

  const handleSendMessage = async (textToSend?: string) => {
    const queryText = (textToSend || inputMessage).trim();
    if (!queryText || loading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: queryText,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const userId = session?.user?.id;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(userId ? { 'x-user-id': userId } : {}),
        },
        body: JSON.stringify({
          message: queryText,
          conversationId: activeConvId || undefined,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'AI Assistant service encountered an error.');
      }

      const data = await res.json();

      if (data.conversationId) {
        setActiveConvId(data.conversationId);
        fetchConversations();
      }

      const assistantMsg: ChatMessage = {
        id: `ast-${Date.now()}`,
        role: 'assistant',
        content: data.answer || 'No response generated.',
        sources: data.sources || [],
        hasSourceMaterial: data.hasSourceMaterial,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setAiConnected(true);
    } catch (err: any) {
      setAiConnected(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: err.message || 'AI Assistant is temporarily unavailable. Please make sure the local AI engine is running.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout role="student">
      <PageHeader
        title="SkillLens AI Virtual Assistant"
        subtitle="RAG-grounded learning companion for official statistical competencies."
        action={
          <Button variant="outline" onClick={handleNewChat}>
            <Plus size={16} className="mr-1.5" />
            New Conversation
          </Button>
        }
      />

      {/* AI Offline Warning Banner */}
      {!aiConnected && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            <span className="font-bold">AI Assistant is temporarily offline.</span>
            <span>Please make sure the local AI engine (Ollama) is running.</span>
          </div>
          <Button variant="outline" size="sm" onClick={checkAiHealth} className="text-xs py-1">
            Retry Connection
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[680px]">
        {/* Sidebar Conversations History */}
        <Card className="lg:col-span-1 p-4 flex flex-col h-full border-slate-200">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare size={14} />
              Recent Queries
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5">
            {loadingConvs ? (
              <div className="p-4 text-xs text-slate-400 text-center animate-pulse">Loading history...</div>
            ) : historyError ? (
              <div className="p-4 text-center space-y-2">
                <p className="text-xs text-rose-600 font-medium">{historyError}</p>
                <button
                  onClick={fetchConversations}
                  className="text-[11px] text-primary font-bold hover:underline"
                >
                  Retry Loading History
                </button>
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-xs text-slate-400 text-center italic">
                No queries yet — Ask your first question to start learning.
              </div>
            ) : (
              conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => loadConversationMessages(c.id)}
                  className={`w-full text-left p-2.5 rounded-xl text-xs transition-colors flex items-start gap-2 ${
                    activeConvId === c.id
                      ? 'bg-primary/10 text-primary font-semibold border-l-2 border-primary'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Clock size={13} className="shrink-0 mt-0.5 text-slate-400" />
                  <span className="truncate">{c.title}</span>
                </button>
              ))
            )}
          </div>
        </Card>

        {/* Main Chat Workspace */}
        <Card className="lg:col-span-3 p-0 flex flex-col h-full border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-primary/20 rounded-lg text-primary">
                <Sparkles size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold">Ollama AI Statistical Assistant</h3>
                <p className="text-[11px] text-slate-400">Strictly RAG-grounded in uploaded official PDF materials</p>
              </div>
            </div>
            <span
              className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border ${
                aiConnected
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              }`}
            >
              {aiConnected ? '● AI Engine Connected' : '○ AI Engine Offline'}
            </span>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/50">
            {messages.length === 0 ? (
              <div className="py-8 space-y-6">
                <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-2xs">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Bot size={18} className="text-primary" />
                    How can I assist your statistical learning today?
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Ask questions about your uploaded PDF materials, remediate weak topics, or request practice questions based on official statistical standards.
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-1">
                    Suggested Prompts
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {PRESET_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        onClick={() => handleSendMessage(prompt)}
                        className="text-left p-3 rounded-xl bg-white border border-slate-200 hover:border-primary/50 hover:bg-primary/5 text-xs text-slate-700 font-medium transition-all flex items-center justify-between group shadow-2xs"
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
                  <div key={msg.id} className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold ${
                        isUser ? 'bg-primary text-white' : 'bg-slate-900 text-white'
                      }`}
                    >
                      {isUser ? <User size={16} /> : <Bot size={16} />}
                    </div>

                    <div className="max-w-[85%] space-y-2">
                      <div
                        className={`p-4 rounded-2xl text-sm leading-relaxed ${
                          isUser
                            ? 'bg-primary text-white font-medium rounded-tr-none'
                            : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-2xs'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>

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

          {/* Footer Form */}
          <div className="p-4 bg-white border-t border-slate-100">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                disabled={loading}
                placeholder="Ask about sampling methods, data validation, your competency gaps..."
                className="flex-1 px-4 py-3 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-slate-50 text-slate-900"
              />
              <Button type="submit" variant="primary" disabled={!inputMessage.trim() || loading} className="px-5 py-3 rounded-xl">
                <Send size={16} />
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
