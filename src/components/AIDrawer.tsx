import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { apiService } from '../services/api';
import { AIQueryResponse } from '../types';
import { PRODI_LIST, PTN_LIST } from '../data/catalog';
import { BottomSheet } from './ui';
import {
  Sparkles,
  Send,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  BookOpen,
  Bot,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  response?: AIQueryResponse;
  timestamp: string;
}

export const AIDrawer: React.FC = () => {
  const {
    isAiDrawerOpen,
    closeAiDrawer,
    aiDrawerContext,
    profile,
    currentStep,
    openAiDrawer,
  } = useApp();

  const [inputQuestion, setInputQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Determine active prodi & PTN name from context
  const activeProdi = aiDrawerContext?.prodiId
    ? PRODI_LIST.find((p) => p.id === aiDrawerContext.prodiId)
    : null;
  const activePtn = activeProdi
    ? PTN_LIST.find((p) => p.id === activeProdi.ptnId)
    : null;

  // When context changes or drawer opens with initial question, trigger query
  useEffect(() => {
    if (isAiDrawerOpen && aiDrawerContext?.initialQuestion) {
      handleSend(aiDrawerContext.initialQuestion);
    }
  }, [isAiDrawerOpen, aiDrawerContext]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (questionToSend?: string) => {
    const q = (questionToSend || inputQuestion).trim();
    if (!q) return;

    const userMsg: ChatMessage = {
      id: 'usr_' + Date.now(),
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuestion('');
    setLoading(true);

    try {
      const res = await apiService.queryAI(
        q,
        {
          prodiId: aiDrawerContext?.prodiId,
          jalur: aiDrawerContext?.jalur,
        },
        profile
      );

      const aiMsg: ChatMessage = {
        id: 'ai_' + Date.now(),
        sender: 'ai',
        text: res.jawaban,
        response: res,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      const errorMsg: ChatMessage = {
        id: 'err_' + Date.now(),
        sender: 'ai',
        text: 'Mohon maaf, terjadi kendala saat memproses jawaban. Silakan coba lagi.',
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const defaultSuggestions = [
    'Kenapa prodi ini masuk kategori ini untuk profilku?',
    'Berapa batas tahun kelulusan untuk SNBT?',
    'Apa saja dokumen wajib eligible SNBP?',
    'Bagaimana aturan memilih 4 prodi di UTBK-SNBT?',
  ];

  return (
    <>
      {/* Floating Action Button for Steps 4, 5, 6 — zona jempol kanan-bawah, brand Grape */}
      {currentStep >= 4 && !isAiDrawerOpen && (
        <button
          type="button"
          data-no-print="true"
          onClick={() =>
            openAiDrawer({
              initialQuestion: 'Bagaimana cara memaksimalkan peluang lolos dengan profil saya saat ini?',
            })
          }
          className="no-print fixed right-5 sm:right-6 lg:right-[calc(50%-280px+1.25rem)] bottom-24 md:bottom-6 z-40 flex items-center gap-2.5 px-4 py-3 min-h-[48px] bg-brand-500 hover:bg-brand-600 text-white rounded-full shadow-[3px_3px_0_0_var(--color-stroke)] border-2 border-[var(--color-stroke)] transition-[transform,background-color] duration-[160ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-105 active:scale-95 group"
          title="Tanya Asisten AI Resmi"
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-white" />
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-lime opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-lime"></span>
            </span>
          </div>
          <span className="text-xs font-bold tracking-wide">Tanya AI (RAG Resmi)</span>
        </button>
      )}

      {/* AI Bottom Sheet (swipe-down to dismiss) */}
      <BottomSheet
        open={isAiDrawerOpen}
        onClose={closeAiDrawer}
        maxWidth={520}
        className="h-[90dvh]"
        header={
          <div className="px-5 pb-3 pt-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-brand-100 dark:bg-brand-500/20 text-brand-600 dark:text-brand-200 rounded-xl">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="font-display font-bold text-h3 text-slate-900 dark:text-slate-100 leading-tight">
                  Asisten RAG SNPMB Resmi
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Sitasi Dokumen BPPP &amp; Penjelasan Keputusan
                </p>
              </div>
            </div>

            {/* Active Context Banner */}
            {activeProdi ? (
              <div className="bg-brand-50 dark:bg-slate-800/80 rounded-2xl p-2.5 border border-brand-200 dark:border-slate-700 text-xs flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[10px] text-brand-600 dark:text-brand-200 block uppercase font-semibold">
                    Konteks Aktif:
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white text-xs truncate block">
                    {activePtn?.singkatan} • {activeProdi.nama}
                  </span>
                </div>
                <span className="shrink-0 px-2 py-0.5 text-[10px] font-bold bg-brand-500/15 text-brand-700 dark:text-brand-200 rounded-md border border-brand-400/30">
                  Jalur {aiDrawerContext?.jalur || 'SNBT'}
                </span>
              </div>
            ) : (
              <div className="bg-slate-100 dark:bg-slate-800/90 rounded-2xl px-3 py-2 text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-accent-sky shrink-0" />
                <span>Konteks Umum Regulasi SNPMB (SNBP &amp; SNBT)</span>
              </div>
            )}
          </div>
        }
        footer={
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={inputQuestion}
              onChange={(e) => setInputQuestion(e.target.value)}
              placeholder={
                activeProdi
                  ? `Tanya alasan skor/syarat ${activeProdi.nama}...`
                  : 'Ketik pertanyaan regulasi SNBP/SNBT...'
              }
              className="flex-1 text-base px-3.5 py-2.5 min-h-[48px] border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
            <button
              type="submit"
              disabled={loading || !inputQuestion.trim()}
              className="px-4 py-2.5 min-h-[48px] min-w-[48px] bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-xl transition flex items-center justify-center shadow-soft shrink-0 cursor-pointer active:scale-95"
              title="Kirim Pertanyaan"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        }
      >
        {/* Chat Message List */}
        <div className="space-y-4 -mx-5 px-5 py-2">
                {messages.length === 0 ? (
                  <div className="text-center py-6 px-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3">
                      <HelpCircle className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-1">
                      Punya pertanyaan tentang peluangmu?
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
                      AI JalurKu menjawab menggunakan basis data aturan resmi Kemendikbudristek dan logika acuan
                      deterministik tanpa tebak-tebakan.
                    </p>

                    <div className="space-y-2 text-left">
                      <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        Saran Pertanyaan Cepat:
                      </p>
                      {defaultSuggestions.map((s, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSend(s)}
                          className="w-full text-left p-3 text-xs bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-blue-50/60 dark:hover:bg-slate-700 rounded-2xl border border-slate-200 dark:border-slate-700 transition shadow-2xs flex items-center justify-between group active:scale-[0.99]"
                        >
                          <span className="line-clamp-2 leading-snug">{s}</span>
                          <Send className="w-3.5 h-3.5 text-slate-300 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 shrink-0 ml-2" />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[90%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                          m.sender === 'user'
                            ? 'bg-blue-600 dark:bg-blue-500 text-white rounded-br-none shadow-xs'
                            : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-bl-none shadow-xs'
                        }`}
                      >
                        <p>{m.text}</p>

                        {/* RAG Metadata if AI response */}
                        {m.response && (
                          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 space-y-2.5">
                            {/* Confidence Badge */}
                            <div className="flex items-center gap-1.5">
                              {m.response.yakin ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800">
                                  <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                  Terverifikasi Dokumen Resmi
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800">
                                  <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                                  Informasi Terbatas / Di Luar Cakupan
                                </span>
                              )}
                            </div>

                            {/* Missing Data Counter-Questions */}
                            {m.response.dataDibutuhkan && m.response.dataDibutuhkan.length > 0 && (
                              <div className="p-2.5 bg-amber-50 dark:bg-amber-950/50 rounded-xl border border-amber-200 dark:border-amber-800/80 text-[11px] text-amber-900 dark:text-amber-200">
                                <span className="font-bold block mb-1">Data tambahan yang disarankan:</span>
                                <ul className="list-disc list-inside space-y-0.5 text-amber-800 dark:text-amber-300">
                                  {m.response.dataDibutuhkan.map((d, i) => (
                                    <li key={i}>{d}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Official Citations */}
                            {m.response.sumber && m.response.sumber.length > 0 && (
                              <div className="space-y-1.5">
                                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                                  Rujukan Dokumen Resmi:
                                </span>
                                {m.response.sumber.map((c, i) => (
                                  <div
                                    key={i}
                                    className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px]"
                                  >
                                    <div className="flex items-center justify-between font-bold text-slate-900 dark:text-slate-100 mb-0.5">
                                      <span className="line-clamp-1">{c.judul}</span>
                                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal shrink-0 ml-1">
                                        {c.halaman}
                                      </span>
                                    </div>
                                    <p className="text-slate-600 dark:text-slate-300 italic text-[10px] mb-1.5 border-l-2 border-blue-400 pl-2">
                                      "{c.kutipan}"
                                    </p>
                                    <a
                                      href={
                                        c.url && !c.url.startsWith('file:') && !c.url.startsWith('file:///')
                                          ? c.url
                                          : 'https://snpmb.bppp.kemdikbud.go.id'
                                      }
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                                    >
                                      <span>Buka Sumber Resmi</span>
                                      <ExternalLink className="w-2.5 h-2.5" />
                                    </a>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Quick Next Suggestions Chips */}
                            {m.response.saranPertanyaan && m.response.saranPertanyaan.length > 0 && (
                              <div className="pt-1">
                                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block mb-1">
                                  Pertanyaan Terkait:
                                </span>
                                <div className="flex flex-wrap gap-1">
                                  {m.response.saranPertanyaan.map((sq, i) => (
                                    <button
                                      key={i}
                                      type="button"
                                      onClick={() => handleSend(sq)}
                                      className="text-[10px] bg-slate-100 hover:bg-blue-50 hover:text-blue-700 dark:bg-slate-700/80 dark:hover:bg-slate-700 dark:text-slate-200 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-600 transition text-left"
                                    >
                                      {sq}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 px-1">{m.timestamp}</span>
                    </div>
                  ))
                )}

          {loading && (
            <div className="flex items-center gap-2 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-bl-none max-w-[80%] text-xs text-slate-600 dark:text-slate-300">
              <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
              <span>Mencari rujukan dokumen regulasi resmi...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </BottomSheet>
    </>
  );
};
