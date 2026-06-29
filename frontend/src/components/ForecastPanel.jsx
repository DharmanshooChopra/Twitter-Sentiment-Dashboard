/**
 * ForecastPanel.jsx — NeuroPulse Phase 10 Predictive Analytics
 */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown, Minus, RefreshCw, Loader2 } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
const TOOLTIP_STYLE = { background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, fontSize: '0.75rem', color: '#e2e8f0' };
const TREND_COLOR = { improving: '#10b981', declining: '#ef4444', stable: '#f59e0b', neutral: '#64748b' };

const TrendIcon = ({ trend }) => {
  if (trend === 'improving') return <TrendingUp size={16} color="#10b981" />;
  if (trend === 'declining') return <TrendingDown size={16} color="#ef4444" />;
  return <Minus size={16} color="#f59e0b" />;
};

export default function ForecastPanel() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [horizon, setHorizon] = useState(7);
  const [error, setError]     = useState(null);

  const loadForecast = async (h = horizon) => {
    setLoading(true); setError(null);
    try {
      const res = await axios.get(`${API}/forecast?horizon=${h}&limit=30`);
      setData(res.data);
    } catch {
      setError('Forecast engine unavailable. Start the Flask backend.');
    } finally { setLoading(false); }
  };

  useEffect(() => { loadForecast(); }, []);

  const trendColor = TREND_COLOR[data?.trend] || '#64748b';

  return (
    <div style={{ padding: '1rem', overflowY: 'auto', height: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#e2e8f0', margin: '0 0 4px' }}>Predictive Sentiment Forecast</h3>
          <p style={{ color: '#475569', fontSize: '0.75rem', margin: 0 }}>Linear regression + moving average over MongoDB history</p>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {[3, 7, 14].map(h => (
            <motion.button key={h} onClick={() => { setHorizon(h); loadForecast(h); }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}
              style={{ padding: '3px 10px', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit',
                background: horizon === h ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${horizon === h ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.06)'}`,
                color: horizon === h ? '#c4b5fd' : '#64748b', fontSize: '0.72rem', fontWeight: 700 }}>
              T+{h}
            </motion.button>
          ))}
          <motion.button onClick={() => loadForecast()} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}
            style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', color: '#64748b' }}>
            <RefreshCw size={12} />
          </motion.button>
        </div>
      </div>

      {loading && <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><Loader2 size={28} color="#8b5cf6" style={{ animation: 'spin 1s linear infinite' }} /></div>}
      {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '0.75rem', color: '#fca5a5', fontSize: '0.8rem' }}>{error}</div>}

      {data && !loading && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.6rem' }}>
            {[
              { label: 'Trend',       value: (data.trend || 'N/A').toUpperCase(), color: trendColor, icon: <TrendIcon trend={data.trend} /> },
              { label: 'Slope',       value: data.trend_slope > 0 ? `+${data.trend_slope}` : String(data.trend_slope), color: trendColor },
              { label: 'Confidence',  value: `${data.confidence}%`, color: '#8b5cf6' },
              { label: 'Data Points', value: data.data_points, color: '#06b6d4' },
            ].map(c => (
              <div key={c.label} style={{ background: `${c.color}10`, border: `1px solid ${c.color}25`, borderTop: `2px solid ${c.color}`, borderRadius: 8, padding: '0.65rem', textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 5, fontSize: '0.95rem', fontWeight: 900, color: c.color }}>{c.icon}{c.value}</div>
                <div style={{ fontSize: '0.6rem', color: '#64748b', letterSpacing: '0.08em', marginTop: 3 }}>{c.label.toUpperCase()}</div>
              </div>
            ))}
          </div>

          <div style={{ background: 'rgba(0,0,0,0.22)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '1rem' }}>
            <div style={{ fontSize: '0.65rem', color: '#64748b', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 10 }}>Sentiment Trajectory — T+{horizon} Forecast</div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={data.forecast} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="fg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={trendColor} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={trendColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="label" stroke="#334155" fontSize={10} />
                <YAxis domain={[-1.1, 1.1]} ticks={[-1, -0.5, 0, 0.5, 1]} stroke="#334155" fontSize={10} tickFormatter={v => v > 0 ? `+${v}` : `${v}`} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => [v?.toFixed(3)]} />
                <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4" />
                <Area type="monotone" dataKey="upper" stroke="none" fill={`${trendColor}15`} />
                <Area type="monotone" dataKey="value" stroke={trendColor} strokeWidth={2.5} fill="url(#fg)" dot={{ fill: trendColor, r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.22)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.65rem', color: '#64748b', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>Step-by-Step Forecast Table</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
              <thead>
                <tr>
                  {['Step','Predicted','Upper','Lower','Signal'].map(h => (
                    <th key={h} style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontSize: '0.62rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.1)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.forecast.map((f, i) => {
                  const sig = f.value > 0.2 ? 'BULLISH' : f.value < -0.2 ? 'BEARISH' : 'NEUTRAL';
                  const sc  = sig === 'BULLISH' ? '#10b981' : sig === 'BEARISH' ? '#ef4444' : '#f59e0b';
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', cursor: 'default' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(139,92,246,0.05)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '0.45rem 0.75rem', color: '#a5b4fc', fontFamily: 'monospace', fontWeight: 700 }}>{f.label}</td>
                      <td style={{ padding: '0.45rem 0.75rem', color: f.value >= 0 ? '#10b981' : '#ef4444', fontWeight: 700 }}>{f.value > 0 ? '+' : ''}{f.value}</td>
                      <td style={{ padding: '0.45rem 0.75rem', color: '#64748b' }}>+{f.upper}</td>
                      <td style={{ padding: '0.45rem 0.75rem', color: '#64748b' }}>{f.lower}</td>
                      <td style={{ padding: '0.45rem 0.75rem' }}><span style={{ padding: '1px 8px', borderRadius: 4, fontSize: '0.62rem', fontWeight: 700, background: `${sc}15`, color: sc }}>{sig}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ fontSize: '0.65rem', color: '#334155', textAlign: 'center' }}>⚠ Statistical estimates only. Not financial advice.</div>
        </>
      )}
    </div>
  );
}
