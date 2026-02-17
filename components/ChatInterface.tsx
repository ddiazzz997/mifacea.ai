
import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, Message, Subject, PROGRAM_SUBJECTS } from '../types';
import { getGeminiStreamResponse, FileAttachment } from '../geminiService';
// Added User to the imports below to fix "Cannot find name 'User'" error
import { Send, BookOpen, BrainCircuit, Bot, LogOut, Menu, X, ChevronRight, Loader2, GraduationCap, Plus, History, MessageSquare, Lightbulb, CirclePlus, Copy, Check, User } from 'lucide-react';
import { GenerateContentResponse } from "@google/genai";
import Logo from './Logo';

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  date: Date;
}

interface ChatInterfaceProps {
  profile: UserProfile;
  onLogout: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ profile, onLogout }) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeSubject, setActiveSubject] = useState<Subject | null>(profile.selectedSubject || null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [attachment, setAttachment] = useState<FileAttachment | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [localSubjects, setLocalSubjects] = useState<Subject[]>([]);

  const subjects = [...(PROGRAM_SUBJECTS[profile.program][profile.semester] || []), ...localSubjects];

  const handleAddSubject = () => {
    const newSubjectName = prompt("Nombre de la nueva materia:");
    if (newSubjectName && newSubjectName.trim() !== "") {
      const newSubject: Subject = {
        id: `custom-${Date.now()}`,
        name: newSubjectName,
        category: 'Personalizada'
      };
      setLocalSubjects([...localSubjects, newSubject]);
      setActiveSubject(newSubject);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    startNewChat();
  }, [activeSubject]);

  const startNewChat = (customMessage?: string) => {
    const focusSub = activeSubject || profile.selectedSubject;
    const welcomeText = customMessage || `¡Bienvenido a tu nodo de inteligencia, **${profile.name}**! 🚀
    
Has activado el módulo de **${focusSub.name}**. Estoy listo para actuar como tu mentor senior de FACEA. 

Dime, ¿qué concepto, caso de estudio o proyecto quieres que analicemos hoy para llevar tu pensamiento al siguiente nivel? Recuerda que puedes **adjuntar fotos de tus apuntes o documentos** para un análisis más profundo.`;

    const welcome: Message = {
      id: 'welcome-' + Date.now(),
      role: 'model',
      content: welcomeText,
      timestamp: new Date()
    };

    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: focusSub ? `Foco: ${focusSub.name}` : 'Consulta FACEA',
      messages: [welcome],
      date: new Date()
    };

    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setMessages([welcome]);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("El archivo es demasiado grande. Máximo 10MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = (event.target?.result as string).split(',')[1];
      setAttachment({
        data: base64,
        mimeType: file.type || 'application/octet-stream',
        name: file.name
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSend = async () => {
    if ((!input.trim() && !attachment) || isTyping || !currentSessionId) return;

    const messageText = input.trim();
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: attachment ? `${messageText}\n\n📎 *Archivo: ${attachment.name}*` : messageText,
      timestamp: new Date()
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);

    const currentAttachment = attachment;
    setInput('');
    setAttachment(null);
    setIsTyping(true);

    const history = messages.map(m => ({
      role: m.role,
      parts: [{ text: m.content }]
    }));

    try {
      const stream = await getGeminiStreamResponse(messageText || "Analiza el adjunto académico", profile, activeSubject, history, currentAttachment);

      let fullContent = '';
      const modelMessageId = (Date.now() + 1).toString();

      setMessages(prev => [...prev, {
        id: modelMessageId,
        role: 'model',
        content: '',
        timestamp: new Date()
      }]);

      for await (const chunk of stream) {
        const c = chunk as GenerateContentResponse;
        const text = c.text || '';
        fullContent += text;
        setMessages(prev => {
          const updated = prev.map(m =>
            m.id === modelMessageId ? { ...m, content: fullContent } : m
          );
          return updated;
        });
      }
    } catch (error) {
      console.error("Error en FACEA-AI:", error);
      setMessages(prev => [...prev, {
        id: 'error-' + Date.now(),
        role: 'model',
        content: "⚠️ **Error de conexión**: No pude conectar con el nodo central. Por favor, verifica tu conexión o intenta en unos minutos.",
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex h-screen bg-white text-slate-900 overflow-hidden font-sans">
      {/* Botón flotante para móvil */}
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="fixed top-6 left-6 z-40 p-4 bg-white border-2 border-slate-100 rounded-2xl shadow-2xl text-[#D32F2F] hover:scale-110 active:scale-95 transition-all lg:hidden"
        >
          <Menu size={24} />
        </button>
      )}

      {/* Sidebar de Gestión */}
      <div className={`
        fixed lg:relative z-50 h-full bg-slate-50 border-r border-slate-200 transition-all duration-500 ease-in-out shadow-2xl lg:shadow-none
        ${isSidebarOpen ? 'w-85 translate-x-0' : 'w-0 -translate-x-full lg:w-0'}
      `}>
        <div className="flex flex-col h-full p-6 w-80">
          <div className="flex items-center justify-between mb-8">
            <Logo size="sm" showSubtext={false} />
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-[#D32F2F] transition-colors">
              <X size={24} />
            </button>
          </div>

          <button
            onClick={() => startNewChat()}
            className="w-full flex items-center justify-center gap-3 py-4 bg-white border-2 border-slate-200 rounded-2xl text-slate-800 font-black text-sm uppercase tracking-widest hover:border-[#D32F2F] hover:text-[#D32F2F] hover:shadow-lg hover:shadow-red-500/10 transition-all mb-8 group"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" /> Nueva Consulta
          </button>

          <div className="flex-1 space-y-8 overflow-y-auto custom-scrollbar pr-2">
            <div>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-4 px-2 flex items-center gap-2">
                <History size={14} /> Sesiones Recientes
              </h3>
              <div className="space-y-1">
                {sessions.map(s => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setCurrentSessionId(s.id);
                      setMessages(s.messages);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left font-bold text-xs ${currentSessionId === s.id ? 'bg-red-50 text-[#D32F2F] border border-red-100' : 'text-slate-500 hover:bg-white hover:shadow-sm'}`}
                  >
                    <MessageSquare size={14} className={currentSessionId === s.id ? 'text-[#D32F2F]' : 'text-slate-300'} />
                    <span className="truncate">{s.title}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-4 px-2 flex items-center gap-2">
                <BookOpen size={14} /> Materias Semestre {profile.semester}
              </h3>
              <div className="space-y-1">
                {subjects.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setActiveSubject(s)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left font-bold text-xs ${activeSubject?.id === s.id ? 'bg-[#D32F2F] text-white shadow-xl shadow-red-500/20' : 'text-slate-500 hover:bg-white hover:shadow-sm'}`}
                  >
                    <BookOpen size={14} />
                    <span className="truncate">{s.name}</span>
                  </button>
                ))}
              </div>

              <button
                onClick={handleAddSubject}
                className="w-full flex items-center gap-2 px-4 py-2 mt-4 text-[10px] font-black uppercase tracking-widest text-[#D32F2F] hover:bg-red-50 rounded-xl transition-all border border-dashed border-red-200"
              >
                <Plus size={12} /> Agregar Materia
              </button>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-200 space-y-5">
            <div className="flex items-center gap-4 px-2">
              <div className="relative">
                <img src={profile.avatar} className="w-12 h-12 rounded-2xl border-2 border-white shadow-xl bg-slate-100" alt="Avatar" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-slate-900 truncate">{profile.name}</p>
                <p className="text-[9px] font-black text-slate-400 truncate uppercase tracking-tighter">{profile.program}</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-2 px-4 py-3 rounded-2xl text-slate-400 hover:text-[#D32F2F] hover:bg-red-50 transition-all text-xs font-black uppercase tracking-widest border border-transparent hover:border-red-100"
            >
              <LogOut size={16} /> Cerrar Nodo
            </button>
          </div>
        </div>
      </div>

      {/* Área Principal del Chat */}
      <div className="flex-1 flex flex-col relative bg-white min-w-0">
        <header className="h-28 border-b border-slate-100 flex items-center justify-between px-8 md:px-14 bg-white/90 backdrop-blur-xl sticky top-0 z-30">
          <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col">
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-1">Módulo de Especialidad</h2>
              <div className="flex items-center gap-3">
                <p className="text-black font-black text-2xl tracking-tight">
                  {activeSubject ? activeSubject.name : profile.selectedSubject.name}
                </p>
                <span className="flex items-center gap-1.5 px-3 py-1 bg-red-50 text-[#D32F2F] text-[10px] font-black rounded-full border border-red-100 uppercase tracking-widest">
                  <div className="w-1.5 h-1.5 bg-[#D32F2F] rounded-full animate-pulse" /> Experto Online
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3 px-5 py-3 bg-slate-900 rounded-2xl text-[10px] font-black text-white uppercase tracking-widest border border-slate-800 shadow-2xl shadow-slate-200">
              <BrainCircuit size={18} className="text-red-500 animate-pulse" /> FACEA COGNITIVE
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:px-14 md:py-12 space-y-12 scroll-smooth custom-scrollbar">
          <div className="max-w-4xl mx-auto space-y-10">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} group animate-in fade-in slide-in-from-bottom-4 duration-500`}>
                <div className={`flex gap-5 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-lg transition-all group-hover:scale-110 ${m.role === 'user' ? 'bg-[#D32F2F] border-2 border-red-400' : 'bg-white border-2 border-slate-100'
                    }`}>
                    {/* Fixed missing User icon by importing it from lucide-react */}
                    {m.role === 'user' ? <User size={22} className="text-white" /> : <Bot size={22} className="text-[#D32F2F]" />}
                  </div>
                  <div className={`space-y-2.5 relative ${m.role === 'user' ? 'text-right' : ''}`}>
                    <div className={`rounded-3xl px-7 py-5 text-[15px] leading-relaxed shadow-xl border relative transition-all ${m.role === 'user'
                      ? 'bg-slate-900 text-white border-slate-800'
                      : 'bg-white border-slate-50 text-slate-700'
                      }`}>
                      {m.content.split('\n').map((line, i) => (
                        <p key={i} className={line.trim() === '' ? 'h-3' : 'mb-3 last:mb-0'}>
                          {line.split('**').map((part, j) => (
                            j % 2 === 1 ? <strong key={j} className="text-[#D32F2F] font-black">{part}</strong> : part
                          ))}
                        </p>
                      ))}

                      {/* Botón de copiar para respuestas de la IA */}
                      {m.role === 'model' && m.content && (
                        <button
                          onClick={() => handleCopy(m.content, m.id)}
                          className="absolute -right-12 top-0 p-2 text-slate-300 hover:text-[#D32F2F] opacity-0 group-hover:opacity-100 transition-all"
                        >
                          {copiedId === m.id ? <Check size={16} /> : <Copy size={16} />}
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2 justify-end px-4">
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                        {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {m.role === 'user' ? 'ESTUDIANTE' : 'FACEA.AI'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start animate-in fade-in duration-300">
                <div className="flex gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-white border-2 border-slate-100 flex items-center justify-center shadow-lg animate-pulse">
                    <Loader2 size={22} className="text-[#D32F2F] animate-spin" />
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-3xl px-8 py-5 flex items-center gap-2 shadow-inner">
                    <div className="w-2 h-2 bg-[#D32F2F] rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-[#D32F2F] rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-2 h-2 bg-[#D32F2F] rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-10" />
          </div>
        </div>

        {/* Barra de Entrada de Datos */}
        <div className="p-8 md:p-14 bg-white/80 backdrop-blur-md flex flex-col items-center border-t border-slate-50">
          {attachment && (
            <div className="w-full max-w-4xl mb-5 animate-in slide-in-from-bottom-4 duration-300">
              <div className="inline-flex items-center gap-4 px-5 py-3 bg-red-50 border border-red-100 rounded-2xl shadow-xl shadow-red-500/5 group">
                <div className="w-8 h-8 bg-[#D32F2F] rounded-xl flex items-center justify-center text-white">
                  <Plus size={16} />
                </div>
                <span className="text-sm font-bold text-slate-800 truncate max-w-[250px]">{attachment.name}</span>
                <button onClick={() => setAttachment(null)} className="p-1.5 hover:bg-red-200 rounded-full transition-colors text-[#D32F2F]">
                  <X size={16} />
                </button>
              </div>
            </div>
          )}

          <div className="w-full max-w-5xl flex items-center gap-5 relative">
            <div className="relative group">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.txt"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-6 bg-white border-2 border-slate-100 text-[#D32F2F] rounded-full hover:bg-red-50 hover:border-[#D32F2F] hover:scale-110 active:scale-95 transition-all shadow-xl flex items-center justify-center group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-red-600 scale-0 group-hover:scale-100 transition-transform origin-center opacity-0 group-hover:opacity-5" />
                <CirclePlus size={32} className="group-hover:rotate-90 transition-transform duration-500" />
              </button>
            </div>

            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder={activeSubject ? `Consulta al Mentor sobre ${activeSubject.name}...` : "Escribe tu desafío académico..."}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] py-7 pl-12 pr-24 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-12 focus:ring-red-500/5 focus:bg-white focus:border-[#D32F2F] transition-all shadow-2xl text-lg font-bold"
              />
              <button
                onClick={() => handleSend()}
                disabled={(!input.trim() && !attachment) || isTyping}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-5 bg-black text-white rounded-full hover:bg-[#D32F2F] transition-all hover:scale-105 active:scale-90 shadow-2xl disabled:opacity-20 disabled:grayscale disabled:scale-100 group"
              >
                <Send size={28} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </button>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-8 md:gap-14 text-[9px] text-slate-400 uppercase tracking-[0.5em] font-black">
            <span className="flex items-center gap-2.5 group cursor-default">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> NODO FACEA ONLINE
            </span>
            <span className="flex items-center gap-2.5 group cursor-default">
              <GraduationCap size={14} className="group-hover:text-[#D32F2F] transition-colors" /> UNIVERSIDAD DE NARIÑO
            </span>
            <span className="hidden sm:flex items-center gap-2.5 group cursor-default">
              <Lightbulb size={14} className="group-hover:text-yellow-500 transition-colors" /> POTENCIADO POR GEMINI 1.5 PRO
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
