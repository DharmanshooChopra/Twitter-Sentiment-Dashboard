import { motion } from 'framer-motion';
import { Search } from 'lucide-react';

const SENTIMENT_COLOR = { positive: '#10b981', negative: '#ef4444', neutral: '#f59e0b' };

export default function HistoryView({ historyData, setActiveView, handleAnalyze }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '1rem', overflowY: 'auto', height: '100%' }}>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#e2e8f0', marginBottom: '0.25rem' }}>
        ◈ Global Database Trace
      </h2>
      <p style={{ color: '#475569', fontSize: '0.8rem', marginBottom: '1.5rem' }}>
        Archived prediction records streaming from MongoDB Atlas
      </p>

      {historyData.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#334155', padding: '3rem', fontSize: '0.85rem' }}>
          No records yet — run an analysis first.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {historyData.map((item, idx) => {
            const color = SENTIMENT_COLOR[item.sentiment] || '#64748b';
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.035 }}
                style={{
                  background: 'rgba(0,0,0,0.25)', borderRadius: 10, padding: '0.9rem',
                  border: '1px solid rgba(255,255,255,0.05)', borderLeft: `4px solid ${color}`,
                  display: 'flex', alignItems: 'center', gap: '1rem',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 5, fontSize: '0.65rem', fontWeight: 700,
                      background: `${color}18`, color, border: `1px solid ${color}40`,
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                    }}>{item.sentiment}</span>
                    {item.misinformation === 'High' && (
                      <span style={{
                        padding: '2px 8px', borderRadius: 5, fontSize: '0.65rem', fontWeight: 700,
                        background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)',
                      }}>⚑ HIGH RISK</span>
                    )}
                    <span style={{ marginLeft: 'auto', fontSize: '0.68rem', color: '#475569' }}>{item.timestamp}</span>
                  </div>
                  <p style={{
                    margin: 0, color: '#94a3b8', fontSize: '0.82rem', lineHeight: 1.4,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    "{item.tweet_text}"
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => { setActiveView('dashboard'); handleAnalyze(null, item.tweet_text); }}
                  style={{
                    flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6,
                    padding: '0.45rem 0.9rem', borderRadius: 7,
                    background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)',
                    color: '#a5b4fc', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  <Search size={11} /> Re-Verify
                </motion.button>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
