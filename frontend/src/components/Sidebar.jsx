import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, BarChart3, Clock, Settings,
  Cpu, Zap, Shield, Database, Brain, ChevronRight,
  PlaySquare, TrendingUp, FlaskConical, Activity, Network, BrainCircuit, FileText, Component
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Command Center' },
  { id: 'analytics', icon: BarChart3,       label: 'Analytics' },
  { id: 'history',   icon: Clock,           label: 'History' },
  { id: 'models',    icon: Brain,           label: 'Model Registry' },
  { id: 'consensus', icon: Network,         label: 'Consensus Matrix' },
  { id: 'benchmark', icon: FlaskConical,    label: 'Research Analytics' },
  { id: 'architecture', icon: Component,    label: 'System Architecture' },
  { id: 'demo',      icon: PlaySquare,      label: 'Demo Mode' },
  { id: 'health',    icon: Database,        label: 'System Health' },
  { id: 'settings',  icon: Settings,        label: 'Settings' },
];

const SYSTEM_STATS = [
  { icon: Cpu,      label: 'Inference Engine', value: 'Active',   color: '#10b981' },
  { icon: Shield,   label: 'Misinfo Guard',    value: 'Armed',    color: '#f59e0b' },
  { icon: Database, label: 'MongoDB Atlas',    value: 'Synced',   color: '#06b6d4' },
  { icon: Zap,      label: 'Gemini AI',        value: 'Grounded', color: '#8b5cf6' },
];

export default function Sidebar({
  activeView, setActiveView, appMode, setAppMode,
  loadedModels, mlCount, dlCount, tfCount,
  theme, setTheme,
}) {
  const total = Object.keys(loadedModels).length;

  return (
    <aside style={{
      width: 260, flexShrink: 0,
      background: 'rgba(8,8,20,0.7)',
      backdropFilter: 'blur(24px)',
      borderRight: '1px solid rgba(139,92,246,0.15)',
      display: 'flex', flexDirection: 'column',
      padding: '1rem', gap: '0.25rem',
      overflowY: 'auto', zIndex: 10,
    }}>
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div style={{ fontSize: '1.3rem', fontWeight: 900, letterSpacing: '-0.5px', lineHeight: 1.2 }}>
          <span style={{ color: 'var(--text-1)' }}>Neuro</span>
          <span style={{ color: '#8b5cf6' }}>Pulse</span>
          <span style={{
            fontSize: '0.55rem', fontWeight: 700, color: '#06b6d4',
            background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.3)',
            borderRadius: 4, padding: '1px 6px', marginLeft: 8, verticalAlign: 'middle',
            letterSpacing: '0.05em',
          }}>v2.0</span>
        </div>
        <div style={{ fontSize: '0.68rem', color: '#475569', marginTop: 4, letterSpacing: '0.08em' }}>
          AI INTELLIGENCE PLATFORM
        </div>
      </motion.div>

      {/* Nav */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.6rem', color: '#475569', letterSpacing: '0.12em', marginBottom: 8, fontWeight: 700 }}>
          NAVIGATION
        </div>
        {NAV_ITEMS.map((item, i) => {
          const Icon = item.icon;
          const active = activeView === item.id;
          return (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setActiveView(item.id)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '0.6rem 0.8rem', borderRadius: 8, cursor: 'pointer',
                border: active ? '1px solid rgba(139,92,246,0.4)' : '1px solid transparent',
                background: active ? 'rgba(139,92,246,0.15)' : 'transparent',
                color: active ? '#c4b5fd' : '#64748b',
                marginBottom: 2, transition: 'all 0.2s', fontWeight: active ? 600 : 400,
                fontSize: '0.82rem', fontFamily: 'inherit',
              }}
              whileHover={{ x: 4, color: '#a78bfa' }}
            >
              <Icon size={15} />
              <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
              {active && <ChevronRight size={13} />}
            </motion.button>
          );
        })}
      </div>

      {/* Data stream mode */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.6rem', color: '#475569', letterSpacing: '0.12em', marginBottom: 8, fontWeight: 700 }}>
          INPUT MODE
        </div>
        {[
          { id: 'custom',  label: '✦ Custom Payload', color: '#8b5cf6' },
          { id: 'twitter', label: '✦ Twitter Extractor', color: '#1d9bf0' },
        ].map(m => (
          <motion.button
            key={m.id}
            onClick={() => setAppMode(m.id)}
            whileHover={{ x: 4 }}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '0.6rem 0.8rem', borderRadius: 8, cursor: 'pointer',
              border: `1px solid ${appMode === m.id ? m.color + '55' : 'transparent'}`,
              background: appMode === m.id ? `${m.color}18` : 'transparent',
              color: appMode === m.id ? '#fff' : '#64748b',
              marginBottom: 4, transition: 'all 0.2s',
              fontSize: '0.82rem', fontFamily: 'inherit', fontWeight: appMode === m.id ? 600 : 400,
            }}
          >
            {m.label}
            {appMode === m.id && (
              <span style={{
                marginLeft: 'auto', fontSize: '0.6rem', padding: '1px 6px',
                background: m.color + '30', color: m.color, borderRadius: 3, fontWeight: 700,
              }}>ACTIVE</span>
            )}
          </motion.button>
        ))}
      </div>

      {/* Model status */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.6rem', color: '#475569', letterSpacing: '0.12em', marginBottom: 8, fontWeight: 700 }}>
          MODEL REGISTRY
        </div>
        <div style={{
          background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)',
          borderRadius: 8, padding: '0.75rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: '#c4b5fd', fontWeight: 700 }}>
              <Cpu size={13} />
              <span>{total} / 10 Active</span>
            </div>
            <div style={{
              width: 8, height: 8, borderRadius: '50%', background: total >= 8 ? '#10b981' : '#f59e0b',
              boxShadow: `0 0 6px ${total >= 8 ? '#10b981' : '#f59e0b'}`,
            }} />
          </div>
          <div style={{
            height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden', marginBottom: 8,
          }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(total / 10) * 100}%` }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              style={{ height: '100%', background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #a78bfa)', borderRadius: 2 }}
            />
          </div>
          <div style={{ display: 'flex', gap: 5 }}>
            {mlCount > 0 && <span style={{ fontSize: '0.6rem', fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.2)' }}>{mlCount} ML</span>}
            {dlCount > 0 && <span style={{ fontSize: '0.6rem', fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' }}>{dlCount} DL</span>}
            {tfCount > 0 && <span style={{ fontSize: '0.6rem', fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: 'rgba(236,72,153,0.15)', color: '#f472b6', border: '1px solid rgba(236,72,153,0.2)' }}>{tfCount} TF</span>}
          </div>
        </div>
      </div>

      {/* System stats */}
      <div style={{ marginTop: 'auto' }}>
        <div style={{ fontSize: '0.6rem', color: '#475569', letterSpacing: '0.12em', marginBottom: 8, fontWeight: 700 }}>
          SYSTEM STATUS
        </div>
        {SYSTEM_STATS.map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0.4rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)',
              fontSize: '0.72rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b' }}>
                <Icon size={11} color={stat.color} />
                <span>{stat.label}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: stat.color, fontWeight: 600 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: stat.color, display: 'inline-block' }} />
                {stat.value}
              </div>
            </div>
          );
        })}

        <motion.button
          onClick={() => setTheme(theme === 'cyber-dark' ? 'light-mode' : 'cyber-dark')}
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          style={{
            width: '100%', marginTop: 12, padding: '0.55rem', borderRadius: 7,
            border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)',
            color: '#64748b', cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'inherit',
          }}
        >
          {theme === 'cyber-dark' ? '☀ Light Mode' : '◎ Dark Mode'}
        </motion.button>
      </div>
    </aside>
  );
}
