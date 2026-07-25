/**
 * SettingsView.jsx — NeuroPulse Phase 12 Integrated Settings & Engine Management
 * Houses General Configuration, Predictive Forecast, AI Brain Telemetry, and Semantic Engine & Embeddings.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, TrendingUp, Activity, BrainCircuit, RefreshCw } from 'lucide-react';
import ForecastPanel from './ForecastPanel';
import AIBrainTelemetry from './AIBrainTelemetry';
import SemanticExplorer from './SemanticExplorer';

const SETTINGS_TABS = [
  { id: 'general',   label: 'General & Config',             icon: Settings,     color: '#8b5cf6', badge: 'System' },
  { id: 'forecast',  label: 'Forecast',                     icon: TrendingUp,   color: '#10b981', badge: 'Predictive' },
  { id: 'telemetry', label: 'AI Brain Telemetry',           icon: Activity,     color: '#06b6d4', badge: 'Realtime' },
  { id: 'semantic',  label: 'Semantic Engine & Embeddings', icon: BrainCircuit, color: '#f59e0b', badge: 'NLP Space' },
];

export default function SettingsView({
  theme,
  setTheme,
  loadedModels = {},
  setInputText,
  setResults,
  setError,
  setLoadingText,
  activeTab = 'general',
  setActiveTab,
}) {
  const [localTab, setLocalTab] = useState(activeTab || 'general');

  const selectedTab = activeTab || localTab;
  const changeTab = (id) => {
    if (setActiveTab) setActiveTab(id);
    setLocalTab(id);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        padding: '1rem',
        gap: '1rem',
      }}
    >
      {/* Settings Navigation Bar */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          borderRadius: 12,
          padding: '0.85rem 1.25rem',
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.8rem',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.37)',
        }}
      >
        <div>
          <h2
            style={{
              color: 'var(--text-1)',
              fontSize: '1.15rem',
              fontWeight: 800,
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              letterSpacing: '-0.02em',
            }}
          >
            <Settings size={20} color="#8b5cf6" /> System Settings & Engine Suite
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.78rem', margin: '3px 0 0 0' }}>
            Manage platform configuration, forecasting analytics, neural telemetry & semantic embeddings
          </p>
        </div>

        {/* Tab Selector Buttons */}
        <div
          style={{
            display: 'flex',
            gap: '0.4rem',
            background: 'rgba(0, 0, 0, 0.35)',
            padding: 5,
            borderRadius: 10,
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          {SETTINGS_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = selectedTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                onClick={() => changeTab(tab.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '0.55rem 0.95rem',
                  borderRadius: 8,
                  cursor: 'pointer',
                  border: active ? `1px solid ${tab.color}66` : '1px solid transparent',
                  background: active ? `${tab.color}22` : 'transparent',
                  color: active ? '#ffffff' : '#64748b',
                  fontSize: '0.78rem',
                  fontWeight: active ? 700 : 500,
                  transition: 'all 0.2s',
                  fontFamily: 'inherit',
                  position: 'relative',
                }}
              >
                <Icon size={15} color={active ? tab.color : '#64748b'} />
                <span>{tab.label}</span>
                {active && (
                  <motion.div
                    layoutId="settingsTabIndicator"
                    style={{
                      position: 'absolute',
                      bottom: -2,
                      left: '10%',
                      right: '10%',
                      height: 2,
                      background: tab.color,
                      borderRadius: 1,
                      boxShadow: `0 0 8px ${tab.color}`,
                    }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Tab Content Body */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <AnimatePresence mode="wait">
          {selectedTab === 'general' && (
            <motion.div
              key="general"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingRight: 4 }}
            >
              {/* Theme & Controls */}
              <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '1.25rem' }}>
                <h3 style={{ color: 'var(--text-1)', fontSize: '0.95rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                  ◈ Visual Appearance & Workspace Controls
                </h3>
                <p style={{ color: '#475569', fontSize: '0.78rem', marginBottom: '1.25rem' }}>
                  Customize system appearance theme and perform soft environment resets.
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {[
                    { label: '◎ Cyber Dark', id: 'cyber-dark', active: theme === 'cyber-dark', bg: 'linear-gradient(135deg,#6366f1,#8b5cf6)' },
                    { label: '☀ Light Mode', id: 'light-mode', active: theme === 'light-mode', bg: '#10b981' },
                  ].map((t) => (
                    <motion.button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      style={{
                        padding: '0.65rem 1.5rem',
                        borderRadius: 9,
                        cursor: 'pointer',
                        border: t.active ? '2px solid rgba(255,255,255,0.3)' : '1px solid rgba(255,255,255,0.08)',
                        background: t.active ? t.bg : 'rgba(255,255,255,0.04)',
                        color: 'white',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        fontFamily: 'inherit',
                      }}
                    >
                      {t.label}
                    </motion.button>
                  ))}
                  <motion.button
                    onClick={() => {
                      if (setInputText) setInputText('');
                      if (setResults) setResults(null);
                      if (setError) setError(null);
                      if (setLoadingText) setLoadingText('System reset.');
                    }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      padding: '0.65rem 1.5rem',
                      borderRadius: 9,
                      cursor: 'pointer',
                      border: '1px solid rgba(239,68,68,0.3)',
                      background: 'rgba(239,68,68,0.1)',
                      color: '#ef4444',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      fontFamily: 'inherit',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <RefreshCw size={14} /> Soft Reset Workspace
                  </motion.button>
                </div>
              </div>

              {/* Platform Metadata Info */}
              <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '1.25rem' }}>
                <div
                  style={{
                    fontSize: '0.7rem',
                    color: '#475569',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    marginBottom: 12,
                    fontWeight: 700,
                  }}
                >
                  Platform Diagnostics & System Specs
                </div>
                {[
                  ['Platform Name', 'NeuroPulse v2.0 Enterprise'],
                  ['Backend Architecture', 'Flask + concurrent.futures multithreading'],
                  ['Model Ensemble', `${Object.keys(loadedModels).length} / 10 Active (Transformer + ML Stack)`],
                  ['Telemetry Stream', 'MongoDB Atlas Vector & Historical Storage'],
                  ['Fact-Checking AI', 'Gemini 2.5 Flash Grounded Fact-Checking'],
                  ['Frontend Stack', 'React 19 + Next.js 15 App Router'],
                  ['Semantic Embeddings', 'High-Dimensional UMAP & Vector Distance Engine'],
                  ['Predictive Engine', 'Multi-horizon ARIMA / LSTM Trend Forecasting'],
                ].map(([k, v]) => (
                  <div
                    key={k}
                    style={{
                      display: 'flex',
                      justify: 'space-between',
                      padding: '0.55rem 0',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      fontSize: '0.82rem',
                    }}
                  >
                    <span style={{ color: '#64748b' }}>{k}</span>
                    <span style={{ color: 'var(--text-1)', fontWeight: 600 }}>{v}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {selectedTab === 'forecast' && (
            <motion.div
              key="forecast"
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              transition={{ duration: 0.2 }}
              style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
            >
              <ForecastPanel />
            </motion.div>
          )}

          {selectedTab === 'telemetry' && (
            <motion.div
              key="telemetry"
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              transition={{ duration: 0.2 }}
              style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
            >
              <AIBrainTelemetry />
            </motion.div>
          )}

          {selectedTab === 'semantic' && (
            <motion.div
              key="semantic"
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              transition={{ duration: 0.2 }}
              style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
            >
              <SemanticExplorer />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
