import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';

const TOOLTIP_STYLE = { background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, fontSize: '0.75rem', color: '#e2e8f0' };

export default function RightPanel({ statsData, historyData }) {
  return (
    <div style={{
      width: 280, flexShrink: 0,
      background: 'var(--bg-elevated)', backdropFilter: 'blur(24px)',
      borderLeft: '1px solid var(--border-dim)',
      display: 'flex', flexDirection: 'column',
      padding: '1rem', overflowY: 'auto', gap: '1rem', zIndex: 10,
    }}>
      {/* Donut */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-dim)', borderRadius: 10, padding: '0.75rem' }}>
        <div style={{ fontSize: '0.65rem', color: '#475569', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>
          Sentiment Division
        </div>
        {statsData.length > 0 ? (
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={statsData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value">
                {statsData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '0.7rem' }} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity }} style={{ color: '#334155', fontSize: '0.78rem' }}>
              Aggregating telemetry…
            </motion.span>
          </div>
        )}
      </div>

      {/* Line chart */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-dim)', borderRadius: 10, padding: '0.75rem' }}>
        <div style={{ fontSize: '0.65rem', color: '#475569', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>
          Sentiment Trend
        </div>
        {historyData.length > 0 ? (
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={historyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="timestamp" stroke="#334155" fontSize={9} tickMargin={3} />
              <YAxis domain={[-1, 1]} ticks={[-1, 0, 1]} stroke="#334155" fontSize={9} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Line type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6', r: 2 }} animationDuration={800} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity }} style={{ color: '#334155', fontSize: '0.78rem' }}>
              Awaiting trends…
            </motion.span>
          </div>
        )}
      </div>

      {/* Live history feed */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <div style={{ fontSize: '0.65rem', color: '#475569', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>
          Live MongoDB Feed
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', overflowY: 'auto', maxHeight: 320 }}>
          {historyData.length > 0 ? historyData.slice(0, 20).map((item, idx) => {
            const color = { positive: '#10b981', negative: '#ef4444', neutral: '#f59e0b' }[item.sentiment] || '#64748b';
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03 }}
                style={{
                  padding: '0.5rem 0.65rem', borderRadius: 7,
                  background: 'var(--bg-surface)', borderLeft: `3px solid ${color}`,
                  border: '1px solid var(--border-dim)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <strong style={{ fontSize: '0.65rem', color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {item.sentiment}
                  </strong>
                  <span style={{ fontSize: '0.6rem', color: '#334155' }}>{item.timestamp}</span>
                </div>
                <div style={{
                  fontSize: '0.72rem', color: '#64748b',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  "{item.tweet_text}"
                </div>
              </motion.div>
            );
          }) : (
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ color: '#334155', fontSize: '0.75rem', padding: '0.5rem' }}
            >
              Polling MongoDB…
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
