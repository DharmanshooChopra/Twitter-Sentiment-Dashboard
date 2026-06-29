/**
 * DemoMode.jsx — NeuroPulse Phase 10 Offline Demo Engine
 * Streams synthetic tweets through the real ML ensemble.
 * Works fully without Twitter API — perfect for showcases.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Play, Square, Zap, Shield, Radio, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://127.0.0.1:5000' : '/api');

const SENTIMENT_CFG = {
  positive: { color: '#10b981', bg: 'rgba(16,185,129,0.12)', label: '▲ POSITIVE' },
  negative: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  label: '▼ NEGATIVE' },
  neutral:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: '◆ NEUTRAL'  },
};

export default function DemoMode() {
  const [tweets,     setTweets]     = useState([]);
  const [streaming,  setStreaming]   = useState(false);
  const [tickerText, setTickerText] = useState('');
  const [loading,    setLoading]    = useState(false);
  const [stats,      setStats]      = useState({ positive: 0, negative: 0, neutral: 0, total: 0 });
  const [language,   setLanguage]   = useState(null);
  const [inputText,  setInputText]  = useState('');
  const streamRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [tweets]);

  // Count stats
  const updateStats = (allTweets) => {
    const s = { positive: 0, negative: 0, neutral: 0, total: allTweets.length };
    allTweets.forEach(t => { if (s[t.sentiment] !== undefined) s[t.sentiment]++; });
    setStats(s);
  };

  const runBatch = useCallback(async () => {
    setLoading(true);
    setTweets([]);
    setStats({ positive: 0, negative: 0, neutral: 0, total: 0 });
    try {
      const res = await axios.post(`${API}/demo`, { count: 8 });
      const batch = res.data.tweets || [];
      setTweets(batch);
      updateStats(batch);
    } catch (err) {
      console.error('Demo batch failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const startStreaming = useCallback(() => {
    setStreaming(true);
    const tick = async () => {
      try {
        const res = await axios.get(`${API}/stream_demo`);
        const t = res.data;
        setTweets(prev => {
          const next = [t, ...prev].slice(0, 20);
          updateStats(next);
          return next;
        });
        setTickerText(`[${new Date().toLocaleTimeString()}] ${t.author}: "${t.text.slice(0, 60)}..." → ${t.sentiment?.toUpperCase()}`);
      } catch {
        setTickerText('Stream interrupted — retrying...');
      }
    };
    tick();
    streamRef.current = setInterval(tick, 3500);
  }, []);

  const stopStreaming = useCallback(() => {
    setStreaming(false);
    if (streamRef.current) clearInterval(streamRef.current);
    streamRef.current = null;
  }, []);

  const detectLang = async () => {
    if (!inputText.trim()) return;
    try {
      const res = await axios.post(`${API}/detect_language`, { text: inputText });
      setLanguage(res.data);
    } catch { setLanguage({ error: 'Detection failed' }); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{ padding: '1rem', overflowY: 'auto', height: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#e2e8f0', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Radio size={18} color="#8b5cf6" /> Demo Intelligence Engine
        </h2>
        <p style={{ color: '#475569', fontSize: '0.8rem' }}>
          Offline showcase mode — synthetic tweet corpus processed by the real 10-model ensemble. No Twitter API required.
        </p>
      </div>

      {/* Live ticker */}
      <AnimatePresence>
        {tickerText && (
          <div style={{
            background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)',
            borderRadius: 8, padding: '0.5rem 0.9rem', fontSize: '0.72rem', color: '#a5b4fc',
            fontFamily: 'JetBrains Mono, monospace', overflow: 'hidden', whiteSpace: 'nowrap',
          }}>
            <motion.span
              key={tickerText}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              {streaming && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 5px #10b981' }} />}
              {tickerText}
            </motion.span>
          </div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
        <motion.button onClick={runBatch} disabled={loading || streaming}
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '0.6rem 1.2rem', borderRadius: 9, cursor: 'pointer', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', color: 'white', fontWeight: 700, fontSize: '0.8rem', fontFamily: 'inherit', boxShadow: '0 0 18px rgba(99,102,241,0.45)' }}>
          {loading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Zap size={14} />}
          Run Batch Analysis
        </motion.button>

        {!streaming ? (
          <motion.button onClick={startStreaming} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '0.6rem 1.2rem', borderRadius: 9, cursor: 'pointer', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.35)', color: '#10b981', fontWeight: 700, fontSize: '0.8rem', fontFamily: 'inherit' }}>
            <Play size={14} /> Start Live Stream
          </motion.button>
        ) : (
          <motion.button onClick={stopStreaming} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '0.6rem 1.2rem', borderRadius: 9, cursor: 'pointer', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)', color: '#ef4444', fontWeight: 700, fontSize: '0.8rem', fontFamily: 'inherit' }}>
            <Square size={14} /> Stop Stream
          </motion.button>
        )}
      </div>

      {/* Stats bar */}
      {stats.total > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.5rem' }}>
          {[
            { label: 'Total', value: stats.total, color: '#8b5cf6' },
            { label: 'Positive', value: stats.positive, color: '#10b981' },
            { label: 'Neutral',  value: stats.neutral,  color: '#f59e0b' },
            { label: 'Negative', value: stats.negative, color: '#ef4444' },
          ].map(s => (
            <div key={s.label} style={{ background: `${s.color}12`, border: `1px solid ${s.color}30`, borderTop: `2px solid ${s.color}`, borderRadius: 8, padding: '0.5rem 0.75rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '0.62rem', color: '#64748b', letterSpacing: '0.08em' }}>{s.label.toUpperCase()}</div>
            </div>
          ))}
        </div>
      )}

      {/* Language detector */}
      <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '0.85rem' }}>
        <div style={{ fontSize: '0.65rem', color: '#475569', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>
          🌐 Language Intelligence Detector
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={inputText} onChange={e => setInputText(e.target.value)}
            placeholder="Type text in any language to detect..." onKeyDown={e => e.key === 'Enter' && detectLang()}
            style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, padding: '0.45rem 0.75rem', color: '#e2e8f0', fontSize: '0.8rem', fontFamily: 'inherit', outline: 'none' }} />
          <motion.button onClick={detectLang} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
            style={{ padding: '0.45rem 1rem', borderRadius: 7, background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.3)', color: '#06b6d4', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'inherit' }}>
            Detect
          </motion.button>
        </div>
        {language && !language.error && (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
            style={{ marginTop: 8, display: 'flex', gap: 10, alignItems: 'center', fontSize: '0.78rem' }}>
            <span style={{ color: '#06b6d4', fontWeight: 700 }}>{language.language}</span>
            <span style={{ color: '#64748b' }}>({language.script})</span>
            <span style={{ color: '#64748b' }}>Conf: {(language.confidence * 100).toFixed(0)}%</span>
            {language.supported
              ? <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle size={11} /> NLP Supported</span>
              : <span style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 4 }}><AlertTriangle size={11} /> Limited Support</span>}
          </motion.div>
        )}
      </div>

      {/* Tweet stream */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.6rem', minHeight: 0 }}>
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
              <Loader2 size={28} color="#8b5cf6" />
            </motion.div>
          </div>
        )}
        <AnimatePresence>
          {tweets.map((t, i) => {
            const cfg = SENTIMENT_CFG[t.sentiment] || SENTIMENT_CFG.neutral;
            return (
              <motion.div key={`${t.text}-${i}`}
                initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                style={{ background: 'rgba(0,0,0,0.25)', border: `1px solid rgba(255,255,255,0.05)`, borderLeft: `4px solid ${cfg.color}`, borderRadius: 10, padding: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#8b5cf6' }}>{t.author}</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <span style={{ padding: '1px 8px', borderRadius: 5, fontSize: '0.62rem', fontWeight: 700, background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                    {t.misinformation === 'High' && (
                      <span style={{ padding: '1px 8px', borderRadius: 5, fontSize: '0.62rem', fontWeight: 700, background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>
                        <Shield size={9} style={{ verticalAlign: 'middle' }} /> HIGH RISK
                      </span>
                    )}
                  </div>
                </div>
                <p style={{ margin: '0 0 6px', color: '#94a3b8', fontSize: '0.82rem', lineHeight: 1.45 }}>"{t.text}"</p>
                <div style={{ display: 'flex', gap: 8, fontSize: '0.68rem', color: '#64748b' }}>
                  <span>Conf: <strong style={{ color: '#a5b4fc' }}>{t.confidence}%</strong></span>
                  {t.consensus?.agreement_pct && <span>Agreement: <strong style={{ color: '#a5b4fc' }}>{t.consensus.agreement_pct}%</strong></span>}
                  {t.source && <span style={{ marginLeft: 'auto', color: '#334155', fontFamily: 'monospace' }}>{t.source}</span>}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={bottomRef} />
        {tweets.length === 0 && !loading && (
          <div style={{ textAlign: 'center', color: '#334155', padding: '3rem', fontSize: '0.82rem' }}>
            Click "Run Batch Analysis" or "Start Live Stream" to begin demo mode.
          </div>
        )}
      </div>
    </motion.div>
  );
}
