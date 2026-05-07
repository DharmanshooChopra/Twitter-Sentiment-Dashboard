import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Cpu, Wifi, Database, Zap, Shield } from 'lucide-react';

const PulseDot = ({ color = '#10b981' }) => (
  <span style={{ position: 'relative', display: 'inline-flex', width: 8, height: 8 }}>
    <span style={{
      position: 'absolute', inset: 0, borderRadius: '50%',
      background: color, opacity: 0.4,
      animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite'
    }} />
    <span style={{ position: 'relative', borderRadius: '50%', width: 8, height: 8, background: color }} />
  </span>
);

export default function StatusBar({ modelsLoaded = 0, requestCount = 0, backendOnline = true }) {
  const [tick, setTick] = useState(0);
  const [fps] = useState(() => 58 + Math.floor(Math.random() * 4));
  const [throughput, setThroughput] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 2000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    setThroughput(prev => {
      const delta = (Math.random() - 0.4) * 5;
      return Math.max(0, Math.min(99, prev + delta));
    });
  }, [tick, requestCount]);

  const now = new Date().toLocaleTimeString('en-US', { hour12: false });

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: 'var(--bg-elevated)', backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border-dim)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 1.5rem', height: 36, fontSize: '0.7rem',
      fontFamily: "'JetBrains Mono', 'Courier New', monospace",
      letterSpacing: '0.04em',
    }}>
      {/* Left cluster */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: backendOnline ? '#10b981' : '#ef4444' }}>
          <PulseDot color={backendOnline ? '#10b981' : '#ef4444'} />
          <span>SYS:{backendOnline ? 'ONLINE' : 'OFFLINE'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#94a3b8' }}>
          <Cpu size={11} />
          <span>MODELS:{modelsLoaded}/10</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#94a3b8' }}>
          <Database size={11} />
          <span>MONGO:ATLAS</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#8b5cf6' }}>
          <Shield size={11} />
          <span>GEMINI:GROUNDED</span>
        </div>
      </div>

      {/* Center — scrolling ticker */}
      <div style={{ overflow: 'hidden', flex: 1, textAlign: 'center', color: 'rgba(139,92,246,0.6)', fontSize: '0.65rem' }}>
        <motion.span
          animate={{ x: ['100%', '-100%'] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
          style={{ display: 'inline-block', whiteSpace: 'nowrap' }}
        >
          ◈ NEUROPULSE v2.0 — 10-MODEL ENSEMBLE ENGINE ◈ DISTILBERT + BERT + ROBERTA + BILSTM + CNN + SVM + LOGREG + RF + XGBOOST + NB ◈ GEMINI 2.5 FLASH GROUNDED FACT-CHECKING ◈ MISINFORMATION SURVEILLANCE ACTIVE ◈ MONGODB ATLAS TELEMETRY STREAMING ◈
        </motion.span>
      </div>

      {/* Right cluster */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#06b6d4' }}>
          <Activity size={11} />
          <span>REQ:{requestCount}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#f59e0b' }}>
          <Zap size={11} />
          <span>THR:{throughput.toFixed(1)}%</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#94a3b8' }}>
          <Wifi size={11} />
          <span>{now}</span>
        </div>
      </div>
    </div>
  );
}
