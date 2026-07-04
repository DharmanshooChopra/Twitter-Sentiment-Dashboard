/**
 * BenchmarkView.jsx — NeuroPulse Phase 10 Research Mode
 * Model benchmarking: F1, Precision, Recall, Accuracy, Latency
 */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';
import { FlaskConical, Loader2, RefreshCw, Award } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_VITE_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000';
const TOOLTIP_STYLE = { 
  background: 'var(--bg-elevated)', border: '1px solid var(--border-dim)', 
  borderRadius: 10, fontSize: '0.8rem', color: 'var(--text-1)', padding: '10px 14px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.15)', backdropFilter: 'blur(12px)'
};

const TYPE_COLOR = { traditional: '#3b82f6', neural: '#8b5cf6', transformer: '#06b6d4' };
const METRIC_CFG = [
  { key: 'f1',        label: 'F1 Score',   color: '#8b5cf6' },
  { key: 'accuracy',  label: 'Accuracy',   color: '#10b981' },
  { key: 'precision', label: 'Precision',  color: '#06b6d4' },
  { key: 'recall',    label: 'Recall',     color: '#f59e0b' },
];

export default function BenchmarkView() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [metric,  setMetric]  = useState('f1');
  const [error,   setError]   = useState(null);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const res = await axios.get(`${API}/benchmark`);
      setData(res.data);
    } catch { setError('Benchmark endpoint unavailable. Start the Flask backend.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  // Prepare chart data
  const chartData = data?.models
    ? Object.entries(data.models).map(([key, m]) => ({
        name: key.toUpperCase(), key,
        f1: Math.round(m.f1 * 1000) / 10,
        accuracy: Math.round(m.accuracy * 1000) / 10,
        precision: Math.round(m.precision * 1000) / 10,
        recall: Math.round(m.recall * 1000) / 10,
        latency: m.latency_ms,
        type: m.type,
      }))
    : [];

  const radarData = data?.models
    ? Object.entries(data.models).slice(0, 5).map(([key, m]) => ({
        model: key.toUpperCase(),
        F1: Math.round(m.f1 * 100), Precision: Math.round(m.precision * 100),
        Recall: Math.round(m.recall * 100), Accuracy: Math.round(m.accuracy * 100),
      }))
    : [];

  const selectedMetricCfg = METRIC_CFG.find(m => m.key === metric) || METRIC_CFG[0];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{ padding: '1rem', overflowY: 'auto', height: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-1)', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <FlaskConical size={18} color="#8b5cf6" /> Research Benchmarking
          </h2>
          <p style={{ color: 'var(--text-2)', fontSize: '0.78rem', margin: 0 }}>
            Model performance metrics derived from research paper benchmarks + live measurement
          </p>
        </div>
        <motion.button onClick={load} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}
          style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', color: 'var(--text-2)' }}>
          <RefreshCw size={14} />
        </motion.button>
      </div>

      {loading && <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><Loader2 size={28} color="#8b5cf6" style={{ animation: 'spin 1s linear infinite' }} /></div>}
      {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '0.75rem', color: '#fca5a5', fontSize: '0.8rem' }}>{error}</div>}

      {data && !loading && (
        <>
          {/* Ensemble summary */}
          <div style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.12),rgba(139,92,246,0.08))', border: '1px solid rgba(139,92,246,0.25)', borderRadius: 12, padding: '1rem', display: 'flex', gap: '2rem', alignItems: 'center', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Award size={28} color="#f59e0b" />
              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Ensemble F1</div>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: '#8b5cf6' }}>{(data.ensemble.f1 * 100).toFixed(1)}%</div>
              </div>
            </div>
            <div style={{ width: 1, height: 40, background: 'rgba(255,255,255,0.08)' }} />
            <div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Ensemble Accuracy</div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#10b981' }}>{(data.ensemble.accuracy * 100).toFixed(1)}%</div>
            </div>
            <div style={{ width: 1, height: 40, background: 'rgba(255,255,255,0.08)' }} />
            <div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Models Evaluated</div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#06b6d4' }}>{data.ensemble.model_count}</div>
            </div>
          </div>

          {/* Metric selector */}
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            {METRIC_CFG.map(m => (
              <motion.button key={m.key} onClick={() => setMetric(m.key)} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                style={{ padding: '4px 14px', borderRadius: 7, cursor: 'pointer', fontFamily: 'inherit',
                  background: metric === m.key ? `${m.color}20` : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${metric === m.key ? `${m.color}50` : 'rgba(255,255,255,0.07)'}`,
                  color: metric === m.key ? m.color : 'var(--text-2)', fontSize: '0.75rem', fontWeight: 700 }}>
                {m.label}
              </motion.button>
            ))}
          </div>

          {/* Bar chart */}
          <div style={{ background: 'rgba(0,0,0,0.22)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '1rem', flexShrink: 0 }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-3)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 10 }}>
              {selectedMetricCfg.label} by Model (%)
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData} barSize={24}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--cyan)" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="var(--purple)" stopOpacity={0.7} />
                  </linearGradient>
                  <linearGradient id="barGradientTrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0.7} />
                  </linearGradient>
                  <linearGradient id="barGradientNeu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0.7} />
                  </linearGradient>
                  <linearGradient id="barGradientTrans" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#0284c7" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" stroke="#334155" fontSize={9} />
                <YAxis domain={[70, 100]} stroke="#334155" fontSize={9} tickFormatter={v => `${v}%`} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => [`${v}%`, selectedMetricCfg.label]} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                <Bar dataKey={metric} radius={[6, 6, 0, 0]}>
                  {chartData.map((e, i) => {
                    const gradientId = e.type === 'traditional' ? 'barGradientTrad' :
                                       e.type === 'neural' ? 'barGradientNeu' :
                                       e.type === 'transformer' ? 'barGradientTrans' : 'barGradient';
                    return <Cell key={i} fill={`url(#${gradientId})`} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Full metrics table */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-dim)', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
            <div style={{ padding: '0.8rem 1.2rem', borderBottom: '1px solid var(--border-dim)', fontSize: '0.75rem', color: 'var(--text-1)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 800 }}>Full Metrics Matrix</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                  <tr>
                    {['Model', 'Type', 'F1', 'Accuracy', 'Precision', 'Recall', 'Latency'].map(h => (
                      <th key={h} style={{ padding: '0.6rem 1rem', textAlign: 'left', fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-3)', textTransform: 'uppercase', borderBottom: '1px solid var(--border-dim)', background: 'var(--bg-elevated)', whiteSpace: 'nowrap', backdropFilter: 'blur(10px)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {chartData.sort((a, b) => b.f1 - a.f1).map((m, i) => {
                    const tc = TYPE_COLOR[m.type] || '#64748b';
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border-dim)', transition: 'background-color 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--glow-purple)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <td style={{ padding: '0.6rem 1rem', fontWeight: 800, color: 'var(--text-1)' }}>
                          {i === 0 && <Award size={13} color="#f59e0b" style={{ marginRight: 6, verticalAlign: 'text-bottom' }} />}{m.name}
                        </td>
                        <td style={{ padding: '0.6rem 1rem' }}>
                          <span style={{ padding: '2px 10px', borderRadius: 4, fontSize: '0.65rem', fontWeight: 700, background: `${tc}15`, color: tc, border: `1px solid ${tc}30`, textTransform: 'uppercase' }}>{m.type}</span>
                        </td>
                        {['f1', 'accuracy', 'precision', 'recall'].map(k => (
                          <td key={k} style={{ padding: '0.6rem 1rem', fontWeight: 700, color: m[k] >= 90 ? '#10b981' : m[k] >= 85 ? '#f59e0b' : 'var(--text-2)' }}>{m[k]}%</td>
                        ))}
                        <td style={{ padding: '0.6rem 1rem', color: 'var(--text-3)', fontFamily: 'monospace', fontSize: '0.75rem' }}>{m.latency}ms</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}
