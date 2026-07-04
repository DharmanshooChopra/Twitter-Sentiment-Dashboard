import { motion } from 'framer-motion';
import { Cpu } from 'lucide-react';

const TYPE_CFG = {
  traditional: { label: 'Classic ML',    bg: 'rgba(59,130,246,0.12)', color: '#60a5fa', border: 'rgba(59,130,246,0.25)' },
  neural:      { label: 'Deep Learning', bg: 'rgba(16,185,129,0.12)', color: '#34d399', border: 'rgba(16,185,129,0.25)' },
  transformer: { label: 'Transformer',   bg: 'rgba(236,72,153,0.12)', color: '#f472b6', border: 'rgba(236,72,153,0.25)' },
};

export default function ModelsView({ loadedModels }) {
  const entries = Object.entries(loadedModels);
  const types = ['traditional', 'neural', 'transformer'];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '1rem', overflowY: 'auto', height: '100%' }}>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-1)', marginBottom: '0.25rem' }}>
        ◈ Model Registry ({entries.length}/10)
      </h2>
      <p style={{ color: '#475569', fontSize: '0.8rem', marginBottom: '1.5rem' }}>
        All active models loaded in the parallel inference engine
      </p>

      {/* Summary chips */}
      <div style={{ display: 'flex', gap: 10, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {types.map(t => {
          const cfg = TYPE_CFG[t];
          const count = entries.filter(([, v]) => v.type === t).length;
          return (
            <div key={t} style={{
              padding: '0.5rem 1rem', borderRadius: 8,
              background: cfg.bg, border: `1px solid ${cfg.border}`,
              color: cfg.color, fontSize: '0.78rem', fontWeight: 700,
            }}>
              {count}× {cfg.label}
            </div>
          );
        })}
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
        {entries.map(([key, info], i) => {
          const cfg = TYPE_CFG[info.type] || TYPE_CFG.traditional;
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.06 }}
              style={{
                background: 'rgba(0,0,0,0.3)', border: `1px solid rgba(255,255,255,0.06)`,
                borderRadius: 10, padding: '1rem',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
              whileHover={{
                borderColor: cfg.border,
                boxShadow: `0 0 16px ${cfg.bg}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                  background: cfg.bg, border: `1px solid ${cfg.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Cpu size={16} color={cfg.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-1)', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {info.display_name}
                  </div>
                  <span style={{
                    fontSize: '0.6rem', fontWeight: 700, padding: '1px 7px', borderRadius: 3,
                    background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                  }}>{cfg.label}</span>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#475569' }}>
                <span>Key: <code style={{ color: '#8b5cf6', fontFamily: 'monospace' }}>{key}</code></span>
                <span style={{
                  background: 'rgba(255,255,255,0.06)', borderRadius: 4, padding: '1px 6px', color: '#64748b',
                }}>{info.device || 'cpu'}</span>
              </div>
              {/* Status dot */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 8, fontSize: '0.68rem', color: '#10b981' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 4px #10b981' }} />
                Active &amp; Ready
              </div>
            </motion.div>
          );
        })}
        {entries.length === 0 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', color: '#334155', padding: '3rem' }}>
            No models loaded — start the Flask backend.
          </div>
        )}
      </div>
    </motion.div>
  );
}
