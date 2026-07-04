import { motion } from 'framer-motion';
import { Layers, Cpu, Clock, Zap } from 'lucide-react';

const sentimentColor = (label) => {
  if (label === 'positive') return '#10b981';
  if (label === 'negative') return '#ef4444';
  if (label === 'neutral') return '#f59e0b';
  return '#64748b';
};

const typeBadge = (type) => ({
  traditional: { label: 'Classic ML', bg: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: 'rgba(59,130,246,0.3)' },
  neural:       { label: 'Deep Learning', bg: 'rgba(16,185,129,0.15)', color: '#34d399', border: 'rgba(16,185,129,0.3)' },
  transformer:  { label: 'Transformer', bg: 'rgba(236,72,153,0.15)', color: '#f472b6', border: 'rgba(236,72,153,0.3)' },
}[type] || { label: type, bg: 'rgba(255,255,255,0.08)', color: '#94a3b8', border: 'rgba(255,255,255,0.1)' });

const getModelType = (key, val, loadedModels) => {
  if (loadedModels[key]?.type) return loadedModels[key].type;
  const dn = (val?.display_name || '').toLowerCase();
  if (dn.includes('lstm') || dn.includes('cnn') || dn.includes('bilstm')) return 'neural';
  if (dn.includes('bert') || dn.includes('roberta') || dn.includes('distil')) return 'transformer';
  return 'traditional';
};

export default function ModelMatrix({ modelResults, consensus, loadedModels = {} }) {
  if (!modelResults || Object.keys(modelResults).length === 0) return null;
  const entries = Object.entries(modelResults);
  const maxLatency = Math.max(...entries.map(([, v]) => v.latency_ms || 0));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      style={{
        marginTop: '1.25rem',
        borderRadius: 12,
        border: '1px solid rgba(139,92,246,0.2)',
        background: 'rgba(0,0,0,0.25)',
        backdropFilter: 'blur(12px)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '0.75rem 1rem', background: 'rgba(99,102,241,0.08)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <Layers size={15} color="#8b5cf6" />
        <span style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.08em', color: '#8b5cf6', textTransform: 'uppercase', flex: 1 }}>
          10-Model Consensus Matrix
        </span>
        <span style={{
          fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px',
          background: 'rgba(139,92,246,0.2)', color: '#c4b5fd',
          border: '1px solid rgba(139,92,246,0.3)', borderRadius: 10,
        }}>
          {entries.length} MODELS
        </span>
        {consensus && (
          <span style={{
            fontSize: '0.65rem', fontWeight: 700, padding: '2px 10px', borderRadius: 6,
            background: `${sentimentColor(consensus.label)}18`,
            color: sentimentColor(consensus.label),
            border: `1px solid ${sentimentColor(consensus.label)}40`,
          }}>
            CONSENSUS: {consensus.label?.toUpperCase()} · {consensus.agreement_pct}%
          </span>
        )}
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto', maxHeight: 380, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
          <thead>
            <tr style={{ background: 'rgba(0,0,0,0.15)' }}>
              {['Model', 'Category', 'Prediction', 'Confidence', 'Latency', 'Status'].map(h => (
                <th key={h} style={{
                  padding: '0.55rem 0.85rem', textAlign: 'left',
                  fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em',
                  color: '#64748b', textTransform: 'uppercase',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  position: 'sticky', top: 0, background: 'rgba(10,10,20,0.9)',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entries.map(([key, val], i) => {
              const mtype = getModelType(key, val, loadedModels);
              const badge = typeBadge(mtype);
              const agrees = val.label === consensus?.label;
              const sColor = sentimentColor(val.label);
              return (
                <motion.tr
                  key={key}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  style={{
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    borderLeft: `3px solid ${agrees ? '#10b981' : '#f59e0b'}`,
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(139,92,246,0.07)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '0.65rem 0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontWeight: 600, color: 'var(--text-1)' }}>
                      <Cpu size={12} color="#8b5cf6" />
                      {val.display_name || key}
                    </div>
                  </td>
                  <td style={{ padding: '0.65rem 0.85rem' }}>
                    <span style={{
                      fontSize: '0.6rem', fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                      background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`,
                      textTransform: 'uppercase', letterSpacing: '0.04em',
                    }}>{badge.label}</span>
                  </td>
                  <td style={{ padding: '0.65rem 0.85rem' }}>
                    <span style={{ fontWeight: 700, color: sColor, fontSize: '0.78rem', letterSpacing: '0.05em' }}>
                      {val.label?.toUpperCase() || 'ERROR'}
                    </span>
                  </td>
                  <td style={{ padding: '0.65rem 0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,0.07)', borderRadius: 3, overflow: 'hidden', minWidth: 60 }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${val.confidence || 0}%` }}
                          transition={{ duration: 0.8, delay: i * 0.05 }}
                          style={{ height: '100%', background: `linear-gradient(90deg, ${sColor}99, ${sColor})`, borderRadius: 3 }}
                        />
                      </div>
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8', minWidth: 38, fontVariantNumeric: 'tabular-nums' }}>
                        {val.confidence}%
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '0.65rem 0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#64748b', fontSize: '0.72rem', fontWeight: 600 }}>
                      <Clock size={11} />
                      {val.latency_ms != null ? `${val.latency_ms}ms` : '—'}
                    </div>
                  </td>
                  <td style={{ padding: '0.65rem 0.85rem' }}>
                    {val.error
                      ? <span style={{ color: '#ef4444', fontSize: '0.72rem', fontWeight: 700 }}>⛔ Error</span>
                      : agrees
                        ? <span style={{ color: '#10b981', fontSize: '0.72rem', fontWeight: 700 }}>✓ Agrees</span>
                        : <span style={{ color: '#f59e0b', fontSize: '0.72rem', fontWeight: 700 }}>✗ Dissent</span>
                    }
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      {consensus && (
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          padding: '0.5rem 1rem', borderTop: '1px solid rgba(255,255,255,0.05)',
          fontSize: '0.7rem', color: '#64748b', background: 'rgba(0,0,0,0.1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Zap size={11} color="#8b5cf6" />
            <span>Wall-clock: <strong style={{ color: '#a5b4fc' }}>{maxLatency}ms</strong></span>
          </div>
          <span>{consensus.total_models || entries.length} models evaluated</span>
        </div>
      )}
    </motion.div>
  );
}
