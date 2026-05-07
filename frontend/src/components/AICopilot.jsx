/**
 * AICopilot.jsx — NeuroPulse AI Intelligence Assistant
 * Floating chatbot powered by Gemini 2.5 Flash with live dashboard context.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  Bot, X, Send, Loader2, ChevronDown, Sparkles,
  BarChart3, ShieldAlert, Brain, TrendingUp, Zap, MessageCircle,
} from 'lucide-react';

const API = 'http://127.0.0.1:5000';

const SUGGESTED_PROMPTS = [
  { icon: BarChart3,   label: 'Analyze sentiment trends',         prompt: 'Analyze the current sentiment trends from the live dashboard data.' },
  { icon: ShieldAlert, label: 'Explain high misinfo risk',        prompt: 'Why is misinformation risk high and what should I do?' },
  { icon: Brain,       label: 'Explain model disagreements',      prompt: 'Which models are disagreeing and why might that happen?' },
  { icon: TrendingUp,  label: 'Predict future sentiment',         prompt: 'Based on recent history, what is the predicted sentiment trend?' },
  { icon: Zap,         label: 'Generate Executive Briefing',      prompt: 'Generate an Executive Briefing' },
  { icon: BarChart3,   label: 'Explain confidence score',         prompt: 'Explain what the ensemble confidence score means and how it is calculated.' },
];

// Typing animation — renders text character-by-character
function TypingText({ text, onDone }) {
  const [displayed, setDisplayed] = useState('');
  const idx = useRef(0);

  useEffect(() => {
    idx.current = 0;
    setDisplayed('');
    const id = setInterval(() => {
      idx.current++;
      setDisplayed(text.slice(0, idx.current));
      if (idx.current >= text.length) {
        clearInterval(id);
        if (onDone) onDone();
      }
    }, 12);
    return () => clearInterval(id);
  }, [text]);

  return <span>{displayed}<span style={{ animation: 'blink 1s step-start infinite', opacity: displayed.length < text.length ? 1 : 0 }}>|</span></span>;
}

export default function AICopilot({ isOpen, setIsOpen, results, historyData, loadedModels }) {
  const [messages, setMessages]   = useState([
    { role: 'assistant', text: 'Hello! I am NeuroPulse AI Copilot — your real-time intelligence assistant.\n\nI have access to your live dashboard telemetry, model registry, and MongoDB history. Ask me anything about your data.', done: true },
  ]);
  const [input, setInput]         = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300);
  }, [isOpen]);

  const sendMessage = useCallback(async (text) => {
    const msg = (text || input).trim();
    if (!msg || isThinking) return;

    setInput('');
    setShowSuggestions(false);
    setMessages(prev => [...prev, { role: 'user', text: msg, done: true }]);
    setIsThinking(true);

    try {
      if (msg === 'Generate an Executive Briefing') {
        const res = await axios.get(`${API}/executive_briefing`);
        const reply = res.data?.report || 'Failed to generate briefing.';
        setMessages(prev => [...prev, { role: 'assistant', text: reply, done: false }]);
      } else {
        const context = {
          last_result: results || {},
          models_count: Object.keys(loadedModels).length,
          recent_items: historyData.slice(0, 5),
        };
        const res = await axios.post(`${API}/copilot`, { message: msg, context });
        const reply = res.data?.reply || 'Sorry, I could not process that request.';
        setMessages(prev => [...prev, { role: 'assistant', text: reply, done: false }]);
      }
    } catch (err) {
      const errMsg = err?.response?.data?.reply || 'Backend unreachable. Ensure Flask is running on port 5000.';
      setMessages(prev => [...prev, { role: 'assistant', text: errMsg, done: true }]);
    } finally {
      setIsThinking(false);
    }
  }, [input, isThinking, results, loadedModels, historyData]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const markDone = (idx) => {
    setMessages(prev => prev.map((m, i) => i === idx ? { ...m, done: true } : m));
  };

  return (
    <>
      {/* Floating toggle button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 200,
          width: 52, height: 52, borderRadius: '50%',
          background: isOpen
            ? 'rgba(99,102,241,0.2)'
            : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
          border: `2px solid ${isOpen ? 'rgba(139,92,246,0.5)' : 'transparent'}`,
          color: 'white', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: isOpen ? 'none' : '0 0 24px rgba(99,102,241,0.6), 0 4px 16px rgba(0,0,0,0.4)',
        }}
      >
        <AnimatePresence mode="wait">
          {isOpen
            ? <motion.span key="x"  initial={{ rotate: -90, opacity:0 }} animate={{ rotate:0, opacity:1 }} exit={{ rotate:90, opacity:0 }}><X size={20}/></motion.span>
            : <motion.span key="bot" initial={{ rotate: 90, opacity:0 }} animate={{ rotate:0, opacity:1 }} exit={{ rotate:-90, opacity:0 }}>
                <Bot size={22}/>
              </motion.span>
          }
        </AnimatePresence>
        {/* Pulse ring */}
        {!isOpen && (
          <span style={{
            position:'absolute', inset:-4, borderRadius:'50%',
            border:'2px solid rgba(139,92,246,0.5)',
            animation:'ping 2s cubic-bezier(0,0,0.2,1) infinite',
          }}/>
        )}
      </motion.button>

      {/* Copilot drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="copilot"
            initial={{ opacity: 0, x: 60, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
            style={{
              position: 'fixed', bottom: 88, right: 20, zIndex: 199,
              width: 380, height: 560, display: 'flex', flexDirection: 'column',
              background: 'rgba(10,10,22,0.95)',
              backdropFilter: 'blur(28px)',
              border: '1px solid rgba(139,92,246,0.25)',
              borderRadius: 18,
              boxShadow: '0 24px 80px rgba(0,0,0,0.7), 0 0 40px rgba(99,102,241,0.12)',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{
              padding: '0.85rem 1rem',
              borderBottom: '1px solid rgba(139,92,246,0.15)',
              background: 'rgba(99,102,241,0.08)',
              display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position:'relative',
              }}>
                <Bot size={17} color="white"/>
                <span style={{
                  position:'absolute', bottom:1, right:1,
                  width:8, height:8, borderRadius:'50%',
                  background:'#10b981', border:'1.5px solid #0a0a16',
                }}/>
              </div>
              <div>
                <div style={{ fontSize:'0.82rem', fontWeight:700, color:'#e2e8f0' }}>NeuroPulse AI Copilot</div>
                <div style={{ fontSize:'0.62rem', color:'#10b981', display:'flex', alignItems:'center', gap:4 }}>
                  <Sparkles size={9}/> Powered by Gemini 2.5 Flash
                </div>
              </div>
              <motion.button
                onClick={() => setMessages([{ role:'assistant', text:'Conversation cleared. How can I help?', done:true }])}
                whileHover={{ scale:1.08 }}
                style={{ marginLeft:'auto', background:'none', border:'none', cursor:'pointer', color:'#475569', padding:4, display:'flex' }}
                title="Clear chat"
              >
                <ChevronDown size={15}/>
              </motion.button>
            </div>

            {/* Messages */}
            <div style={{ flex:1, overflowY:'auto', padding:'0.85rem', display:'flex', flexDirection:'column', gap:'0.65rem' }}
              className="scroll-thin">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity:0, y:8 }}
                  animate={{ opacity:1, y:0 }}
                  style={{
                    display:'flex',
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  {msg.role === 'assistant' && (
                    <div style={{
                      width:26, height:26, borderRadius:'50%', flexShrink:0,
                      background:'linear-gradient(135deg,#6366f1,#8b5cf6)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      marginRight:7, marginTop:2,
                    }}>
                      <Bot size={13} color="white"/>
                    </div>
                  )}
                  <div style={{
                    maxWidth:'82%',
                    padding:'0.6rem 0.85rem',
                    borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                    background: msg.role === 'user'
                      ? 'linear-gradient(135deg,rgba(99,102,241,0.3),rgba(139,92,246,0.3))'
                      : 'rgba(255,255,255,0.05)',
                    border: msg.role === 'user'
                      ? '1px solid rgba(139,92,246,0.3)'
                      : '1px solid rgba(255,255,255,0.07)',
                    fontSize:'0.8rem', color:'#e2e8f0', lineHeight:1.55, whiteSpace:'pre-wrap',
                  }}>
                    {msg.role === 'assistant' && !msg.done
                      ? <TypingText text={msg.text} onDone={() => markDone(i)}/>
                      : msg.text
                    }
                  </div>
                </motion.div>
              ))}

              {/* Thinking indicator */}
              {isThinking && (
                <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{
                    width:26, height:26, borderRadius:'50%',
                    background:'linear-gradient(135deg,#6366f1,#8b5cf6)',
                    display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
                  }}><Bot size={13} color="white"/></div>
                  <div style={{
                    padding:'0.65rem 1rem',
                    background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.07)',
                    borderRadius:'14px 14px 14px 4px', display:'flex', gap:5, alignItems:'center',
                  }}>
                    {[0,1,2].map(j => (
                      <motion.div key={j}
                        animate={{ y:[0,-5,0] }}
                        transition={{ duration:0.8, repeat:Infinity, delay:j*0.15 }}
                        style={{ width:6, height:6, borderRadius:'50%', background:'#8b5cf6' }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Suggested prompts */}
              {showSuggestions && messages.length <= 1 && (
                <div style={{ marginTop:8 }}>
                  <div style={{ fontSize:'0.62rem', color:'#475569', letterSpacing:'0.1em', marginBottom:8, fontWeight:700 }}>
                    QUICK ACTIONS
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                    {SUGGESTED_PROMPTS.map(p => {
                      const Icon = p.icon;
                      return (
                        <motion.button
                          key={p.prompt}
                          onClick={() => sendMessage(p.prompt)}
                          whileHover={{ x:4, borderColor:'rgba(139,92,246,0.5)' }}
                          style={{
                            display:'flex', alignItems:'center', gap:8,
                            padding:'0.5rem 0.75rem', borderRadius:8, cursor:'pointer',
                            background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)',
                            color:'#94a3b8', fontSize:'0.75rem', textAlign:'left', fontFamily:'inherit',
                          }}
                        >
                          <Icon size={12} color="#8b5cf6"/>
                          {p.label}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}
              <div ref={bottomRef}/>
            </div>

            {/* Input */}
            <div style={{
              padding:'0.7rem', borderTop:'1px solid rgba(255,255,255,0.06)',
              background:'rgba(0,0,0,0.2)', flexShrink:0,
            }}>
              <div style={{
                display:'flex', alignItems:'flex-end', gap:8,
                background:'rgba(255,255,255,0.05)', border:'1px solid rgba(139,92,246,0.2)',
                borderRadius:12, padding:'0.5rem 0.6rem',
                transition:'border-color 0.2s',
              }}>
                <MessageCircle size={14} color="#475569" style={{ flexShrink:0, marginBottom:2 }}/>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Ask NeuroPulse AI..."
                  disabled={isThinking}
                  rows={1}
                  style={{
                    flex:1, background:'transparent', border:'none', outline:'none',
                    color:'#e2e8f0', fontSize:'0.8rem', fontFamily:'inherit', resize:'none',
                    lineHeight:1.5, maxHeight:80, overflowY:'auto',
                  }}
                />
                <motion.button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isThinking}
                  whileHover={{ scale:1.1 }}
                  whileTap={{ scale:0.9 }}
                  style={{
                    width:28, height:28, borderRadius:'50%', flexShrink:0,
                    background: input.trim() && !isThinking ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'rgba(255,255,255,0.06)',
                    border:'none', cursor: input.trim() && !isThinking ? 'pointer' : 'not-allowed',
                    display:'flex', alignItems:'center', justifyContent:'center', color:'white',
                    transition:'background 0.2s',
                  }}
                >
                  {isThinking
                    ? <Loader2 size={13} style={{ animation:'spin 1s linear infinite' }}/>
                    : <Send size={13}/>
                  }
                </motion.button>
              </div>
              <div style={{ fontSize:'0.6rem', color:'#334155', textAlign:'center', marginTop:5 }}>
                ↵ Enter to send · Context-aware · Powered by Gemini
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes blink { 0%,100% { opacity:1 } 50% { opacity:0 } }
      `}</style>
    </>
  );
}
