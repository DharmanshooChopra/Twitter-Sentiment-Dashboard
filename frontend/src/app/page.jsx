"use client";

/**
 * NeuroPulse 2.0 — App.jsx
 * Futuristic AI Operations Center — Phase 9 Edition
 * All existing API routes preserved. New UI layer only.
 */

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';

// Components
import ParticleBackground   from '../components/ParticleBackground';
import StatusBar            from '../components/StatusBar';
import Sidebar              from '../components/Sidebar';
import AlertBanner          from '../components/AlertBanner';
import AnalyzeInput         from '../components/AnalyzeInput';
import ResultPanel          from '../components/ResultPanel';
import AnalyticsView        from '../components/AnalyticsView';
import HistoryView          from '../components/HistoryView';
import ModelsView           from '../components/ModelsView';
import RightPanel           from '../components/RightPanel';
import AICopilot            from '../components/AICopilot';
import CommandPalette       from '../components/CommandPalette';
import DemoMode             from '../components/DemoMode';
import ForecastPanel        from '../components/ForecastPanel';
import BenchmarkView        from '../components/BenchmarkView';
import SystemHealthView     from '../components/SystemHealthView';
import AIBrainTelemetry     from '../components/AIBrainTelemetry';
import AuthLayer            from '../components/AuthLayer';
import DemoScenarioEngine   from '../components/DemoScenarioEngine';
import PerformanceMonitor   from '../components/PerformanceMonitor';
import SemanticExplorer     from '../components/SemanticExplorer';
import SystemArchitecture   from '../components/SystemArchitecture';
import ConsensusMatrix      from '../components/ConsensusMatrix';
import FactCheckEvidence    from '../FactCheckEvidence';

import '../App.css';
import '../index.css';

const API = process.env.NEXT_PUBLIC_VITE_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000';

// ─── Utility ──────────────────────────────────────────────────────────
const sentimentColor = l => ({ positive: '#10b981', negative: '#ef4444', neutral: '#f59e0b' }[l] || '#64748b');

export default function App() {
  // ── Core state ──────────────────────────────────────────────────────
  const [inputText,    setInputText]    = useState('');
  const [isLoading,    setIsLoading]    = useState(false);
  const [results,      setResults]      = useState(null);
  const [error,        setError]        = useState(null);
  const [loadingText,  setLoadingText]  = useState('System idle.');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isScenarioRunning, setIsScenarioRunning] = useState(false);

  // Restore API keys from session cache on startup
  useEffect(() => {
    const savedRapidKey = sessionStorage.getItem('rapidapi_key');
    const savedTwitterToken = sessionStorage.getItem('twitter_token');
    if (savedRapidKey) {
      axios.defaults.headers.common['x-rapidapi-key'] = savedRapidKey;
      if (savedTwitterToken) {
        axios.defaults.headers.common['x-twitter-token'] = savedTwitterToken;
      }
      setIsAuthenticated(true);
    }
  }, []);

  // ── App mode / view ─────────────────────────────────────────────────
  const [appMode,        setAppMode]       = useState('custom');
  const [activeView,     setActiveView]    = useState('dashboard');
  const [theme,          setTheme]         = useState('cyber-dark');

  // ── Phase 9: Copilot + Command Palette ─────────────────────────
  const [copilotOpen,    setCopilotOpen]   = useState(false);
  const [paletteOpen,    setPaletteOpen]   = useState(false);
  const [activeEvidence, setActiveEvidence] = useState(null);

  // ── Telemetry state ─────────────────────────────────────────────────
  const [statsData,    setStatsData]    = useState([]);
  const [historyData,  setHistoryData]  = useState([]);
  const [loadedModels, setLoadedModels] = useState({});
  const [requestCount, setRequestCount] = useState(0);
  const [backendOnline, setBackendOnline] = useState(true);

  // ── Derived model counts ─────────────────────────────────────────────
  const mlCount = Object.values(loadedModels).filter(m => m.type === 'traditional').length;
  const dlCount = Object.values(loadedModels).filter(m => m.type === 'neural').length;
  const tfCount = Object.values(loadedModels).filter(m => m.type === 'transformer').length;

  // ── Fetch telemetry ──────────────────────────────────────────────────
  const fetchTelemetry = useCallback(async () => {
    try {
      const [statsRes, histRes, modelsRes] = await Promise.all([
        axios.get(`${API}/stats`),
        axios.get(`${API}/history`),
        axios.get(`${API}/models`).catch(() => ({ data: {} })),
      ]);

      const raw = statsRes.data;
      setStatsData([
        { name: 'Positive', value: raw.positive || 0, color: '#10b981' },
        { name: 'Negative', value: raw.negative || 0, color: '#ef4444' },
        { name: 'Neutral',  value: raw.neutral  || 0, color: '#f59e0b' },
      ].filter(i => i.value > 0));

      setHistoryData(histRes.data);
      setLoadedModels(modelsRes.data || {});
      setBackendOnline(true);
    } catch {
      setBackendOnline(false);
    }
  }, []);

  useEffect(() => {
    fetchTelemetry();
    const id = setInterval(fetchTelemetry, 15_000);   // refresh every 15s
    return () => clearInterval(id);
  }, [fetchTelemetry]);

  // ── Alert state ───────────────────────────────────────────────────────
  const checkAlert = () => {
    // 1. Check for sustained negative sentiment spike (at least 3 records required)
    if (historyData && historyData.length >= 3) {
      const last = historyData.slice(-3);
      if (last.filter(i => i.sentiment === 'negative').length >= 3)
        return '⚠ Sustained negative sentiment spike detected across recent telemetry.';
    }
    
    // 2. Check if the current dashboard results show high misinformation risk
    if (results && results.misinformation === 'High') {
      return '🚨 High misinformation risk trend detected. Recommend immediate manual audit.';
    }
    
    return null;
  };
  const activeAlert = checkAlert();

  // ── Analyze handler ───────────────────────────────────────────────────
  const handleAnalyze = useCallback(async (e, forceText = null) => {
    if (e) e.preventDefault();
    const text = forceText !== null ? forceText : inputText;
    if (!text.trim()) return;

    setIsLoading(true);
    setError(null);
    setResults(null);
    setLoadingText('Processing input…');
    setRequestCount(c => c + 1);

    const timers = [
      setTimeout(() => setLoadingText('Dispatching to 10-model parallel engine…'), 700),
      setTimeout(() => setLoadingText('Aggregating ensemble consensus…'), 2400),
      setTimeout(() => setLoadingText('Running Gemini fact-check…'), 4000),
    ];

    try {
      let data;

      if (appMode === 'custom' || forceText !== null) {
        if (forceText !== null) setAppMode('custom');
        const res = await axios.post(`${API}/analyze`, { text }, { headers: { 'Content-Type': 'application/json' } });
        if (res.data.error) setError(res.data.error);
        else data = res.data;
      } else {
        const res = await axios.post(`${API}/fetch_tweet`, { query: text, count: 5 });
        if (res.data.error) setError(res.data.error);
        else data = { isBatch: true, tweets: res.data.tweets };
      }

      if (data) setResults(data);
      setInputText('');
      setLoadingText('Updating telemetry databases…');
      setTimeout(() => { fetchTelemetry(); setLoadingText('System idle.'); }, 600);
    } catch (err) {
      const msg = err?.response?.data?.error || 'Failed to connect to the backend engine. Ensure Flask is running on Port 5000.';
      setError(msg);
      setLoadingText('System error.');
    } finally {
      timers.forEach(clearTimeout);
      setTimeout(() => setIsLoading(false), 500);
    }
  }, [inputText, appMode, fetchTelemetry]);

  // ─── Render ────────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return <AuthLayer onLogin={(rapidKey, twToken) => {
      if (rapidKey) {
        sessionStorage.setItem('rapidapi_key', rapidKey);
        axios.defaults.headers.common['x-rapidapi-key'] = rapidKey;
      }
      if (twToken) {
        sessionStorage.setItem('twitter_token', twToken);
        axios.defaults.headers.common['x-twitter-token'] = twToken;
      }
      setIsAuthenticated(true);
    }} />;
  }

  return (
    <div className={`neuropulse-root ${theme}`} style={{
      display: 'flex',
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
      background: theme === 'light-mode'
        ? 'linear-gradient(135deg, #f0f4ff 0%, #fafafa 100%)'
        : 'linear-gradient(135deg, #070711 0%, #0a0a1a 50%, #06060f 100%)',
      fontFamily: "'Inter', system-ui, sans-serif",
      position: 'relative',
      paddingTop: 36,  // StatusBar height
      boxSizing: 'border-box',
    }}>
      {/* Particle canvas */}
      {theme !== 'light-mode' && <ParticleBackground />}

      {/* Top status bar */}
      <StatusBar
        modelsLoaded={Object.keys(loadedModels).length}
        requestCount={requestCount}
        backendOnline={backendOnline}
      />

      {/* Left sidebar */}
      <Sidebar
        activeView={activeView}  setActiveView={setActiveView}
        appMode={appMode}        setAppMode={setAppMode}
        loadedModels={loadedModels}
        mlCount={mlCount} dlCount={dlCount} tfCount={tfCount}
        theme={theme}    setTheme={setTheme}
      />

      {/* Center main area */}
      <main style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        overflow: 'hidden', position: 'relative', zIndex: 1,
        background: theme === 'light-mode'
          ? 'transparent'
          : 'radial-gradient(circle at top center, rgba(139,92,246,0.04) 0%, transparent 55%)',
      }}>
        {/* Alert banner */}
        <div style={{ padding: '0.75rem 1rem 0', flexShrink: 0 }}>
          <AnimatePresence>
            {activeAlert && <AlertBanner key={activeAlert} message={activeAlert} />}
          </AnimatePresence>
        </div>

        {/* View content */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <AnimatePresence mode="wait">

            {/* ── Dashboard View ── */}
            {activeView === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '0 1rem' }}
              >
                {/* Status cards row */}
                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem',
                  flexShrink: 0, marginBottom: '0.75rem',
                }}>
                  <StatusCard
                    title="Core Telemetry"
                    accentColor="#8b5cf6"
                    content={isLoading ? loadingText : '● Monitoring active data streams…'}
                    pulse={isLoading}
                    pulseColor="#8b5cf6"
                  />
                  <StatusCard
                    title="Auto Insight"
                    accentColor="#10b981"
                    content={
                      historyData.slice(0, 5).filter(h => h.sentiment === 'negative').length >= 3
                        ? 'Negative sentiment trending upward.'
                        : `Global sentiment stable. ${Object.keys(loadedModels).length}/10 models active.`
                    }
                  />
                </div>

                {/* Scrollable results area */}
                <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }} className="scroll-thin">
                  {/* Error */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                          borderRadius: 9, padding: '0.75rem 1rem',
                          color: '#fca5a5', fontSize: '0.82rem', marginBottom: '0.75rem',
                        }}
                      >
                        <AlertCircle size={15} style={{ flexShrink: 0 }} />
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Results */}
                  <AnimatePresence>
                    {results && (
                      <ResultPanel key="results" results={results} loadedModels={loadedModels} />
                    )}
                  </AnimatePresence>
                </div>

                {/* Input bar */}
                <div style={{ flexShrink: 0, padding: '0.75rem 0' }}>
                  <AnalyzeInput
                    inputText={inputText}
                    setInputText={setInputText}
                    isLoading={isLoading}
                    appMode={appMode}
                    handleAnalyze={handleAnalyze}
                    loadingText={loadingText}
                  />
                </div>
              </motion.div>
            )}

            {/* ── Analytics View ── */}
            {activeView === 'analytics' && (
              <motion.div key="analytics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ flex: 1, overflow: 'hidden' }}>
                <AnalyticsView statsData={statsData} historyData={historyData} />
              </motion.div>
            )}

            {/* ── History View ── */}
            {activeView === 'history' && (
              <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ flex: 1, overflow: 'hidden' }}>
                <HistoryView historyData={historyData} setActiveView={setActiveView} handleAnalyze={handleAnalyze} />
              </motion.div>
            )}

            {/* ── Models View ── */}
            {activeView === 'models' && (
              <motion.div key="models" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ flex: 1, overflow: 'hidden' }}>
                <ModelsView loadedModels={loadedModels} />
              </motion.div>
            )}

            {/* ── Demo Mode View ── */}
            {activeView === 'demo' && (
              <motion.div key="demo" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ flex: 1, overflow: 'hidden' }}>
                <DemoMode />
              </motion.div>
            )}

            {/* ── Forecast View ── */}
            {activeView === 'forecast' && (
              <motion.div key="forecast" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ flex: 1, overflow: 'hidden' }}>
                <ForecastPanel />
              </motion.div>
            )}

            {/* ── Benchmark View ── */}
            {activeView === 'benchmark' && (
              <motion.div key="benchmark" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ flex: 1, overflow: 'hidden' }}>
                <BenchmarkView />
              </motion.div>
            )}

            {/* ── System Health View ── */}
            {activeView === 'health' && (
              <motion.div key="health" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ flex: 1, overflow: 'hidden' }}>
                <SystemHealthView />
              </motion.div>
            )}

            {/* ── AI Brain Telemetry View ── */}
            {activeView === 'telemetry' && (
              <motion.div key="telemetry" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ flex: 1, overflow: 'hidden' }}>
                <AIBrainTelemetry />
              </motion.div>
            )}

            {/* ── Semantic Explorer View ── */}
            {activeView === 'semantic' && (
              <motion.div key="semantic" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ flex: 1, overflow: 'hidden' }}>
                <SemanticExplorer />
              </motion.div>
            )}

            {/* ── System Architecture View ── */}
            {activeView === 'architecture' && (
              <motion.div key="architecture" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ flex: 1, overflow: 'hidden' }}>
                <SystemArchitecture />
              </motion.div>
            )}

            {/* ── Consensus Matrix View ── */}
            {activeView === 'consensus' && (
              <motion.div key="consensus" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ flex: 1, overflow: 'hidden' }}>
                <ConsensusMatrix loadedModels={loadedModels} />
              </motion.div>
            )}



            {/* ── Settings View ── */}
            {activeView === 'settings' && (
              <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ flex: 1, overflow: 'auto', padding: '1rem' }}
              >
                <h2 style={{ color: 'var(--text-1)', marginBottom: '0.5rem', fontSize: '1.1rem', fontWeight: 800 }}>◈ System Configuration</h2>
                <p style={{ color: '#475569', fontSize: '0.8rem', marginBottom: '1.5rem' }}>Toggle environment, reset states, manage preferences.</p>

                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                  {[
                    { label: '◎ Cyber Dark', id: 'cyber-dark', active: theme === 'cyber-dark', bg: 'linear-gradient(135deg,#6366f1,#8b5cf6)' },
                    { label: '☀ Light Mode', id: 'light-mode', active: theme === 'light-mode', bg: '#10b981' },
                  ].map(t => (
                    <motion.button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      style={{
                        padding: '0.65rem 1.5rem', borderRadius: 9, cursor: 'pointer',
                        border: t.active ? '2px solid rgba(255,255,255,0.3)' : '1px solid rgba(255,255,255,0.08)',
                        background: t.active ? t.bg : 'rgba(255,255,255,0.04)',
                        color: 'white', fontWeight: 700, fontSize: '0.82rem', fontFamily: 'inherit',
                      }}
                    >{t.label}</motion.button>
                  ))}
                  <motion.button
                    onClick={() => { setInputText(''); setResults(null); setError(null); setLoadingText('System reset.'); }}
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    style={{
                      padding: '0.65rem 1.5rem', borderRadius: 9, cursor: 'pointer',
                      border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.1)',
                      color: '#ef4444', fontWeight: 700, fontSize: '0.82rem', fontFamily: 'inherit',
                    }}
                  >⟳ Soft Reset</motion.button>
                </div>

                {/* System info */}
                <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '1rem' }}>
                  <div style={{ fontSize: '0.68rem', color: '#475569', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10, fontWeight: 700 }}>Platform Info</div>
                  {[
                    ['Platform',      'NeuroPulse 2.0'],
                    ['Backend',       'Flask + concurrent.futures'],
                    ['Models Active', `${Object.keys(loadedModels).length} / 10`],
                    ['Database',      'MongoDB Atlas'],
                    ['Fact-Checking', 'Gemini 2.5 Flash (Search Grounded)'],
                    ['Frontend',      'React 19 + Next.js 15'],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '0.8rem' }}>
                      <span style={{ color: '#64748b' }}>{k}</span>
                      <span style={{ color: 'var(--text-1)', fontWeight: 600 }}>{v}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>

      {/* Right panel */}
      <RightPanel statsData={statsData} historyData={historyData} />

      {/* Phase 9: AI Copilot floating assistant */}
      <AICopilot
        isOpen={copilotOpen}
        setIsOpen={setCopilotOpen}
        results={results}
        historyData={historyData}
        loadedModels={loadedModels}
      />

      {/* ── Fact Check View ── */}
      <AnimatePresence>
        {activeEvidence && (
          <FactCheckEvidence data={activeEvidence} onClose={() => setActiveEvidence(null)} />
        )}
      </AnimatePresence>

      {/* ── Demo Scenario Engine Overlay ── */}
      <AnimatePresence>
        {isScenarioRunning && (
          <DemoScenarioEngine onClose={() => setIsScenarioRunning(false)} />
        )}
      </AnimatePresence>

      {/* ── Command Palette (Ctrl+K) ── */}
      <CommandPalette
        isOpen={paletteOpen}
        setIsOpen={setPaletteOpen}
        onCommand={(cmd) => {
          if (cmd.action === 'nav') setActiveView(cmd.target);
          if (cmd.action === 'theme') setTheme(cmd.target);
          if (cmd.action === 'scenario') setIsScenarioRunning(true);
          if (cmd.action === 'mode') setAppMode(cmd.target);
          if (cmd.action === 'copilot') setCopilotOpen(true);
          if (cmd.action === 'fullscreen') {
             if (!document.fullscreenElement) document.documentElement.requestFullscreen();
             else document.exitFullscreen();
          }
        }}
      />

      <PerformanceMonitor />

      {/* Ctrl+K hint badge */}
      <div style={{
        position:'fixed', bottom:28, left:'50%', transform:'translateX(-50%)',
        zIndex:50, fontSize:'0.62rem', color:'rgba(255,255,255,0.2)',
        display:'flex', alignItems:'center', gap:6,
        pointerEvents:'none',
      }}>
        <kbd style={{
          fontSize:'0.6rem', padding:'1px 6px', borderRadius:4,
          background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)',
          fontFamily:'monospace', color:'rgba(255,255,255,0.3)',
        }}>Ctrl+K</kbd>
        <span>Command Palette</span>
      </div>
    </div>
  );
}

// ── Small status card component ──────────────────────────────────────
function StatusCard({ title, accentColor, content, pulse, pulseColor }) {
  return (
    <div style={{
      background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(12px)',
      borderRadius: 10, padding: '0.9rem',
      border: '1px solid rgba(255,255,255,0.05)',
      borderLeft: `4px solid ${accentColor}`,
    }}>
      <div style={{ fontSize: '0.62rem', color: '#475569', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 6 }}>
        {title}
      </div>
      {pulse ? (
        <motion.div
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.4, repeat: Infinity }}
          style={{ fontSize: '0.82rem', color: pulseColor || accentColor, fontWeight: 600 }}
        >
          {content}
        </motion.div>
      ) : (
        <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>{content}</div>
      )}
    </div>
  );
}
