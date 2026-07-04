import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid, AreaChart, Area, BarChart, Bar } from 'recharts';

const TOOLTIP_STYLE = { background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, fontSize: '0.78rem', color: '#e2e8f0' };

export default function AnalyticsView({ statsData, historyData }) {
  // Prepare emotion trend from history
  const misfireData = historyData.slice(-15).map((h, i) => ({
    t: i,
    score: h.score ?? (h.sentiment === 'positive' ? 1 : h.sentiment === 'negative' ? -1 : 0),
    risk: h.misinformation === 'High' ? 1 : 0,
  }));

  const sentimentBar = [
    { name: 'Positive', value: statsData.find(s => s.name === 'Positive')?.value || 0, fill: '#10b981' },
    { name: 'Neutral',  value: statsData.find(s => s.name === 'Neutral')?.value  || 0, fill: '#f59e0b' },
    { name: 'Negative', value: statsData.find(s => s.name === 'Negative')?.value || 0, fill: '#ef4444' },
  ];

  const totalPredictions = sentimentBar.reduce((s, v) => s + v.value, 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ padding: '1rem', overflowY: 'auto', height: '100%' }}
    >
      <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-1)', marginBottom: '0.25rem' }}>
        ◈ High-Resolution Telemetry
      </h2>
      <p style={{ color: '#475569', fontSize: '0.8rem', marginBottom: '1.5rem' }}>
        Real-time analytics from MongoDB Atlas — {totalPredictions} total predictions stored
      </p>

      {/* Grid row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        {/* Donut */}
        <ChartCard title="Sentiment Distribution">
          {statsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statsData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {statsData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '0.75rem' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyState />}
        </ChartCard>

        {/* Bar chart */}
        <ChartCard title="Volume Breakdown">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={sentimentBar} barSize={40}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="value" radius={[6,6,0,0]}>
                {sentimentBar.map((e, i) => <Cell key={i} fill={e.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Grid row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        {/* Sentiment trend */}
        <ChartCard title="Macro Sentiment Trend">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={misfireData}>
              <defs>
                <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="t" stroke="#64748b" fontSize={10} tickFormatter={v => `T-${v}`} />
              <YAxis domain={[-1, 1]} ticks={[-1, 0, 1]} stroke="#64748b" fontSize={10} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => [v > 0 ? 'Positive' : v < 0 ? 'Negative' : 'Neutral', 'Sentiment']} />
              <Area type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={2} fill="url(#sg)" dot={{ fill: '#8b5cf6', r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Misinfo spike */}
        <ChartCard title="Misinfo Risk Spike Tracker">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={misfireData}>
              <defs>
                <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="t" stroke="#64748b" fontSize={10} />
              <YAxis domain={[0, 1]} ticks={[0, 1]} stroke="#64748b" fontSize={10} tickFormatter={v => v === 1 ? 'HIGH' : 'LOW'} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => [v === 1 ? 'High Risk' : 'Low Risk', 'Misinfo']} />
              <Area type="step" dataKey="risk" stroke="#ef4444" strokeWidth={2} fill="url(#rg)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem' }}>
        {[
          { label: 'Total Analyzed', value: totalPredictions, color: '#8b5cf6', suffix: '' },
          { label: 'Positive Rate', value: totalPredictions > 0 ? ((sentimentBar[0].value / totalPredictions) * 100).toFixed(1) : 0, color: '#10b981', suffix: '%' },
          { label: 'High Risk Flags', value: historyData.filter(h => h.misinformation === 'High').length, color: '#ef4444', suffix: '' },
        ].map(stat => (
          <div key={stat.label} style={{
            background: 'rgba(0,0,0,0.25)', border: `1px solid ${stat.color}22`,
            borderTop: `2px solid ${stat.color}`, borderRadius: 10, padding: '1rem',
          }}>
            <div style={{ fontSize: '0.68rem', color: '#64748b', letterSpacing: '0.08em', marginBottom: 6 }}>{stat.label.toUpperCase()}</div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: stat.color }}>{stat.value}{stat.suffix}</div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div style={{
      background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 12, padding: '1rem',
    }}>
      <div style={{ fontSize: '0.72rem', color: '#64748b', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12, fontWeight: 700 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 220, color: '#334155', fontSize: '0.8rem' }}>
      Awaiting telemetry data…
    </div>
  );
}
