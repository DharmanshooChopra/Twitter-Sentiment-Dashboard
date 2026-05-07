/**
 * AuthLayer.jsx — NeuroPulse Phase 11 Enterprise Security
 * Simulates an enterprise-grade secure analyst login gateway.
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Fingerprint, Lock, Cpu, ArrowRight, Loader2, AlertTriangle } from 'lucide-react';

export default function AuthLayer({ onLogin }) {
  const [step, setStep] = useState(0); // 0: idle, 1: authenticating, 2: success
  const [username, setUsername] = useState('analyst_01');
  const [password, setPassword] = useState('••••••••••••');
  const [logs, setLogs] = useState([]);

  const handleLogin = (e) => {
    e.preventDefault();
    setStep(1);
    const sequence = [
      'Establishing secure SSL connection...',
      'Verifying analyst credentials...',
      'Checking MFA hardware token...',
      'Decrypting environment payload...',
      'Connecting to MongoDB Atlas Cluster...',
      'Waking up 10-model inference engine...',
      'Connecting to Gemini 2.5 Flash...',
      'Authorization successful. Access granted.',
    ];
    
    let time = 0;
    sequence.forEach((log, i) => {
      time += Math.random() * 400 + 300;
      setTimeout(() => setLogs(prev => [...prev, log]), time);
    });

    setTimeout(() => setStep(2), time + 500);
    setTimeout(() => onLogin(), time + 1500);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#05050f', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* Background ambient mesh */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(circle at 50% 50%, rgba(99,102,241,0.08) 0%, transparent 60%)',
        pointerEvents: 'none'
      }} />

      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        style={{
          width: 420, padding: '2.5rem', background: 'rgba(15,15,32,0.8)',
          backdropFilter: 'blur(20px)', border: '1px solid rgba(139,92,246,0.3)',
          borderRadius: 16, boxShadow: '0 0 40px rgba(99,102,241,0.15)',
          position: 'relative', overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '2rem' }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))', border: '1px solid rgba(139,92,246,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={24} color="#a78bfa" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.02em' }}>NeuroPulse</h1>
            <div style={{ fontSize: '0.7rem', color: '#8b5cf6', letterSpacing: '0.15em', fontWeight: 700 }}>SECURE GATEWAY</div>
          </div>
        </div>

        {step === 0 && (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: 6, fontWeight: 600 }}>OPERATIVE ID</label>
              <div style={{ position: 'relative' }}>
                <Fingerprint size={16} color="#64748b" style={{ position: 'absolute', left: 12, top: 12 }} />
                <input 
                  type="text" value={username} onChange={e => setUsername(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px 10px 38px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f5f9', outline: 'none', fontFamily: 'monospace', fontSize: '0.9rem' }}
                />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: 6, fontWeight: 600 }}>PASSPHRASE</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="#64748b" style={{ position: 'absolute', left: 12, top: 12 }} />
                <input 
                  type="password" value={password} onChange={e => setPassword(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px 10px 38px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f5f9', outline: 'none', fontFamily: 'monospace', fontSize: '0.9rem' }}
                />
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.7rem', color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '8px 12px', borderRadius: 6, border: '1px solid rgba(245,158,11,0.2)' }}>
              <AlertTriangle size={14} /> RESTRICTED ACCESS — AUTHORIZED PERSONNEL ONLY
            </div>

            <motion.button 
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              style={{ marginTop: 10, padding: '12px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: 8, color: 'white', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 20px rgba(99,102,241,0.4)' }}
            >
              AUTHENTICATE <ArrowRight size={16} />
            </motion.button>
          </form>
        )}

        {(step === 1 || step === 2) && (
          <div style={{ minHeight: 200, display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, padding: '1rem', fontFamily: 'monospace', fontSize: '0.75rem', color: '#a5b4fc', display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto' }}>
              <AnimatePresence>
                {logs.map((log, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} style={{ color: log.includes('successful') ? '#10b981' : '#a5b4fc' }}>
                    &gt; {log}
                  </motion.div>
                ))}
              </AnimatePresence>
              {step === 1 && (
                <motion.div animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <Loader2 size={12} className="spin" /> Processing...
                </motion.div>
              )}
            </div>
            
            {step === 2 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: '1.5rem', textAlign: 'center', color: '#10b981', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Cpu size={18} /> NEURAL LINK ESTABLISHED
              </motion.div>
            )}
          </div>
        )}
      </motion.div>
      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
