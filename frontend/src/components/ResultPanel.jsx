import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, CheckCircle, AlertTriangle, Zap, Brain } from 'lucide-react';
import FactCheckEvidence from '../FactCheckEvidence';
import ModelMatrix from './ModelMatrix';

const sentimentConfig = {
  positive: { color: '#10b981', glow: 'rgba(16,185,129,0.25)', icon: '▲', label: 'POSITIVE' },
  negative: { color: '#ef4444', glow: 'rgba(239,68,68,0.25)',  icon: '▼', label: 'NEGATIVE' },
  neutral:  { color: '#f59e0b', glow: 'rgba(245,158,11,0.25)', icon: '◆', label: 'NEUTRAL'  },
};

export default function ResultPanel({ results, loadedModels }) {
  if (!results) return null;

  if (results.isBatch) {
    return (
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: '1rem' }}>
        <div style={{
          background: 'linear-gradient(180deg,rgba(30,41,59,0.8),rgba(8,8,20,0.95))',
          border: '1px solid rgba(139,92,246,0.3)',
          borderTop: '3px solid #8b5cf6',
          borderRadius: 14, padding: '1.25rem',
          backdropFilter: 'blur(20px)',
        }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '0.75rem', letterSpacing: '0.1em', color: '#64748b', textTransform: 'uppercase' }}>
            ⬡ Batch Stream Analysis
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {results.tweets.map((t, idx) => {
              const cfg = sentimentConfig[t.sentiment] || sentimentConfig.neutral;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.07 }}
                  style={{
                    background: 'rgba(0,0,0,0.25)', borderRadius: 10, padding: '0.9rem',
                    borderLeft: `4px solid ${cfg.color}`, border: `1px solid rgba(255,255,255,0.05)`,
                    borderLeftWidth: 4,
                  }}
                >
                  <p style={{ margin: '0 0 0.5rem', color: '#e2e8f0', fontSize: '0.88rem', lineHeight: 1.5 }}>
                    <strong style={{ color: '#8b5cf6' }}>{t.author}</strong> — "{t.text}"
                  </p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{
                      padding: '2px 10px', borderRadius: 6, fontSize: '0.72rem', fontWeight: 700,
                      background: `${cfg.color}18`, color: cfg.color, border: `1px solid ${cfg.color}40`,
                    }}>{cfg.icon} {t.sentiment?.toUpperCase()}</span>
                    <span style={{
                      padding: '2px 10px', borderRadius: 6, fontSize: '0.72rem', fontWeight: 700,
                      background: t.misinformation === 'High' ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.1)',
                      color: t.misinformation === 'High' ? '#ef4444' : '#10b981',
                      border: `1px solid ${t.misinformation === 'High' ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.2)'}`,
                    }}>⚑ Risk: {t.misinformation}</span>
                    <span style={{ color: '#64748b', fontSize: '0.72rem' }}>Conf: {t.confidence}%</span>
                    {t.explanation?.keywords && t.explanation.keywords.slice(0, 3).map((k, i) => (
                      <span key={i} style={{
                        background: '#1e293b', border: '1px solid #334155', borderRadius: 5,
                        padding: '2px 8px', fontSize: '0.68rem', color: '#a5b4fc', fontWeight: 600,
                      }}>{k}</span>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>
    );
  }

  const cfg = sentimentConfig[results.sentiment] || sentimentConfig.neutral;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: '1rem' }}>
      <div style={{
        background: 'linear-gradient(180deg,rgba(30,41,59,0.8),rgba(8,8,20,0.95))',
        border: `1px solid rgba(139,92,246,0.3)`,
        borderTop: `3px solid ${cfg.color}`,
        borderRadius: 14, padding: '1.5rem',
        backdropFilter: 'blur(20px)',
        boxShadow: `0 10px 40px rgba(0,0,0,0.5), 0 0 60px ${cfg.glow}`,
      }}>
        <h3 style={{ margin: '0 0 1.25rem', fontSize: '0.72rem', letterSpacing: '0.12em', color: '#64748b', textTransform: 'uppercase' }}>
          ⬡ 10-Model Parallel Analysis
        </h3>

        {/* Hero consensus block */}
        <div style={{
          textAlign: 'center', padding: '1.5rem',
          background: 'rgba(0,0,0,0.3)', borderRadius: 12,
          border: `1px solid ${cfg.color}22`, marginBottom: '1.25rem',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Glow aura */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: 12,
            background: `radial-gradient(circle at center, ${cfg.glow} 0%, transparent 70%)`,
            pointerEvents: 'none',
          }} />
          <div style={{ fontSize: '0.65rem', color: '#64748b', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
            Ensemble Consensus
          </div>
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            style={{ fontSize: '2.8rem', fontWeight: 900, color: cfg.color, letterSpacing: '-1px', lineHeight: 1 }}
          >
            {cfg.icon} {cfg.label}
          </motion.div>
          {results.consensus && (
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 10, display: 'flex', justifyContent: 'center', gap: 20 }}>
              <span><strong style={{ color: '#a5b4fc' }}>{results.consensus.agreement_pct}%</strong> agreement</span>
              <span><strong style={{ color: '#a5b4fc' }}>{results.confidence}%</strong> confidence</span>
              {results.total_latency_ms != null && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Zap size={11} color="#8b5cf6" />
                  <strong style={{ color: '#a5b4fc' }}>{results.total_latency_ms}ms</strong>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Confidence bar */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748b', marginBottom: 6 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><CheckCircle size={12} /> System Confidence</span>
            <span style={{ color: cfg.color, fontWeight: 700 }}>{results.confidence}%</span>
          </div>
          <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${results.confidence}%` }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              style={{ height: '100%', background: `linear-gradient(90deg, ${cfg.color}88, ${cfg.color})`, borderRadius: 4 }}
            />
          </div>
        </div>

        {/* Misinformation risk chip */}
        <div style={{ display: 'flex', gap: 10, marginBottom: '1rem', flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '0.55rem 1rem',
            background: results.misinformation === 'High' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.08)',
            border: `1px solid ${results.misinformation === 'High' ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.2)'}`,
            borderRadius: 8, fontSize: '0.8rem',
          }}>
            <ShieldAlert size={14} color={results.misinformation === 'High' ? '#ef4444' : '#10b981'} />
            <span style={{ color: '#94a3b8' }}>Misinfo Risk:</span>
            <strong style={{ color: results.misinformation === 'High' ? '#ef4444' : '#10b981' }}>
              {results.misinformation}
            </strong>
          </div>

          {results.complex_anomaly && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '0.55rem 1rem',
              background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
              borderRadius: 8, fontSize: '0.8rem', color: '#f59e0b',
            }}>
              <AlertTriangle size={14} />
              <span><strong>Complex Anomaly</strong> — Manual review recommended</span>
            </div>
          )}
        </div>

        {/* Keywords */}
        {results.explanation?.keywords && (
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.68rem', color: '#64748b', letterSpacing: '0.08em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Brain size={11} />SEMANTIC DRIVERS
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {results.explanation.keywords.map((k, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.07 }}
                  style={{
                    background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)',
                    color: '#a5b4fc', borderRadius: 6, padding: '3px 10px',
                    fontSize: '0.72rem', fontWeight: 600,
                  }}
                >{k}</motion.span>
              ))}
            </div>
          </div>
        )}

        {/* Gemini fact-check */}
        <FactCheckEvidence verificationData={results.gemini_verification} />

        {/* 10-model matrix */}
        <ModelMatrix
          modelResults={results.model_results}
          consensus={results.consensus}
          loadedModels={loadedModels}
        />
      </div>
    </motion.div>
  );
}
