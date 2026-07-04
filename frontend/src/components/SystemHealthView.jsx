/**
 * SystemHealthView.jsx — NeuroPulse Phase 10 Enterprise Health Dashboard
 */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Activity, Database, Cpu, Shield, Zap, Wifi, RefreshCw, Loader2, CheckCircle, XCircle } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_VITE_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000';

const StatusDot = ({ ok }) => (
  <span style={{ width: 8, height: 8, borderRadius: '50%', background: ok ? '#10b981' : '#ef4444', display: 'inline-block', boxShadow: ok ? '0 0 6px #10b981' : '0 0 6px #ef4444', flexShrink: 0 }} />
);

export default function SystemHealthView() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const res = await axios.get(`${API}/health`);
      setData(res.data);
    } catch { setError('Health endpoint unreachable. Start Flask backend.'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 20_000);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{ padding: '1rem', overflowY: 'auto', height: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-1)', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={18} color="#10b981" /> System Health Center
          </h2>
          <p style={{ color: '#475569', fontSize: '0.78rem', margin: 0 }}>Live enterprise telemetry — refreshes every 20s</p>
        </div>
        <motion.button onClick={load} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}
          style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', color: '#64748b' }}>
          <RefreshCw size={14} />
        </motion.button>
      </div>

      {loading && !data && <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><Loader2 size={28} color="#10b981" style={{ animation: 'spin 1s linear infinite' }} /></div>}
      {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '0.75rem', color: '#fca5a5', fontSize: '0.8rem' }}>{error}</div>}

      {data && (
        <>
          {/* Top KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.65rem' }}>
            {[
              { label: 'Models Active',    value: `${data.models_active}/10`,          icon: Cpu,      color: '#8b5cf6' },
              { label: 'Records Stored',   value: data.total_records_stored,           icon: Database,  color: '#06b6d4' },
              { label: 'Avg Inference',    value: `${data.avg_inference_ms}ms`,        icon: Zap,       color: '#f59e0b' },
              { label: 'Cache Entries',    value: data.cache_entries,                  icon: Activity,  color: '#10b981' },
              { label: 'Queue Depth',      value: data.queue_depth,                    icon: Wifi,      color: data.queue_depth > 5 ? '#ef4444' : '#10b981' },
              { label: 'Error Rate',       value: `${data.error_rate_pct}%`,           icon: Shield,    color: data.error_rate_pct > 2 ? '#ef4444' : '#10b981' },
            ].map(k => {
              const Icon = k.icon;
              return (
                <div key={k.label} style={{ background: `${k.color}10`, border: `1px solid ${k.color}25`, borderRadius: 10, padding: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                    <Icon size={14} color={k.color} />
                    <span style={{ fontSize: '0.6rem', color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700 }}>{k.label}</span>
                  </div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 900, color: k.color }}>{k.value}</div>
                </div>
              );
            })}
          </div>

          {/* Service status grid */}
          <div style={{ background: 'rgba(0,0,0,0.22)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '1rem' }}>
            <div style={{ fontSize: '0.65rem', color: '#64748b', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.85rem' }}>Service Status Matrix</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                { label: 'Inference Engine',     ok: data.inference_engine === 'operational',  detail: data.inference_engine },
                { label: 'MongoDB Atlas',         ok: data.mongo_connected,                    detail: data.mongo_connected ? 'Connected' : 'Disconnected' },
                { label: 'Gemini AI (Grounding)', ok: data.gemini_connected,                   detail: data.gemini_connected ? 'Active' : 'API key missing' },
                { label: 'Misinfo Guard (XGBoost)', ok: data.misinfo_model,                   detail: data.misinfo_model ? 'Armed' : 'Model not loaded' },
                { label: 'Rate Limiter',           ok: data.rate_limiter?.allowed,             detail: `${data.rate_limiter?.remaining ?? '?'} reqs remaining` },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.04)' }}>
                  <StatusDot ok={s.ok} />
                  <span style={{ flex: 1, fontSize: '0.82rem', color: '#94a3b8' }}>{s.label}</span>
                  <span style={{ fontSize: '0.72rem', color: s.ok ? '#10b981' : '#ef4444', fontWeight: 600 }}>{s.detail}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Rate limiter details */}
          {data.rate_limiter && (
            <div style={{ background: 'rgba(0,0,0,0.22)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '1rem' }}>
              <div style={{ fontSize: '0.65rem', color: '#64748b', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.75rem' }}>Rate Limiter Analytics</div>
              <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.82rem' }}>
                <div><div style={{ color: '#64748b', fontSize: '0.65rem' }}>CURRENT</div><div style={{ color: '#f59e0b', fontWeight: 700, fontSize: '1.1rem' }}>{data.rate_limiter.current_count}</div></div>
                <div><div style={{ color: '#64748b', fontSize: '0.65rem' }}>REMAINING</div><div style={{ color: '#10b981', fontWeight: 700, fontSize: '1.1rem' }}>{data.rate_limiter.remaining}</div></div>
                <div><div style={{ color: '#64748b', fontSize: '0.65rem' }}>WINDOW</div><div style={{ color: '#94a3b8', fontWeight: 700, fontSize: '1.1rem' }}>{data.rate_limiter.window_seconds}s</div></div>
                <div><div style={{ color: '#64748b', fontSize: '0.65rem' }}>RESET IN</div><div style={{ color: '#a5b4fc', fontWeight: 700, fontSize: '1.1rem' }}>{data.rate_limiter.reset_in}s</div></div>
              </div>
              {/* Usage bar */}
              <div style={{ marginTop: 12 }}>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(data.rate_limiter.current_count / 50) * 100}%` }}
                    transition={{ duration: 0.8 }}
                    style={{ height: '100%', background: 'linear-gradient(90deg,#10b981,#f59e0b)', borderRadius: 3 }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', color: '#64748b', marginTop: 4 }}>
                  <span>0 req</span><span>50 req / min limit</span>
                </div>
              </div>
            </div>
          )}

          {/* Uptime info */}
          <div style={{ fontSize: '0.68rem', color: '#334155', textAlign: 'center' }}>
            Last updated: {new Date(data.timestamp).toLocaleTimeString()} · Uptime: {Math.floor(data.uptime_seconds / 3600)}h {Math.floor((data.uptime_seconds % 3600) / 60)}m
          </div>
        </>
      )}
    </motion.div>
  );
}
