import { useState, useEffect } from 'react';
import axios from 'axios';
import { Send, Loader2, AlertCircle, CheckCircle, BarChart2, ShieldAlert, Layers, Cpu, Clock, Zap, Search } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import FactCheckEvidence from './FactCheckEvidence';
import './App.css';

function App() {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  
  const [appMode, setAppMode] = useState('custom');
  const [statsData, setStatsData] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [loadedModels, setLoadedModels] = useState({});

  const apiUrl = 'http://127.0.0.1:5000';

  const fetchTelemetry = async () => {
    try {
      const [statsRes, histRes, modelsRes] = await Promise.all([
        axios.get(`${apiUrl}/stats`),
        axios.get(`${apiUrl}/history`),
        axios.get(`${apiUrl}/models`).catch(() => ({ data: {} }))
      ]);
      
      const rawStats = statsRes.data;
      const parsedStats = [
        { name: 'Positive', value: rawStats.positive || 0, color: '#10b981' },
        { name: 'Negative', value: rawStats.negative || 0, color: '#ef4444' },
        { name: 'Neutral', value: rawStats.neutral || 0, color: '#f59e0b' }
      ].filter(item => item.value > 0);
      
      setStatsData(parsedStats);
      setHistoryData(histRes.data);
      setLoadedModels(modelsRes.data || {});
    } catch (err) {
      console.error("Failed to load telemetry data: ", err);
    }
  };

  useEffect(() => {
    fetchTelemetry();
  }, []);

  const [loadingText, setLoadingText] = useState('System idle.');

  const handleAnalyze = async (e, forceText = null) => {
    if (e) e.preventDefault();
    const textToProcess = forceText !== null ? forceText : inputText;
    if (!textToProcess.trim()) return;
    
    setIsLoading(true);
    setLoadingText('Processing input...');
    setError(null);
    setResults(null);
    
    try {
      setTimeout(() => setLoadingText('Dispatching to 10-model parallel engine...'), 800);
      setTimeout(() => setLoadingText('Aggregating ensemble consensus...'), 2500);
      
      if (appMode === 'custom' || forceText !== null) {
        if (forceText !== null) setAppMode('custom');
        const response = await axios.post(`${apiUrl}/analyze`, { 
            text: textToProcess 
        }, {
            headers: { 'Content-Type': 'application/json' }
        });
        if (response.data.error) setError(response.data.error);
        else setResults(response.data);
      } else {
        const response = await axios.post(`${apiUrl}/fetch_tweet`, { 
            query: inputText,
            count: 5 
        });
        
        if (response.data.error) {
            setError(response.data.error);
        } else {
            setResults({ isBatch: true, tweets: response.data.tweets });
        }
      }
      
      setLoadingText('Updating telemetry databases...');
      setInputText('');
      
      setTimeout(() => {
         fetchTelemetry();
         setLoadingText('Monitoring incoming data stream...');
      }, 500);
      
    } catch (err) {
      console.error("Backend connection failed: ", err);
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError("Failed to connect to the backend engine. Ensure Flask is running on Port 5000.");
      }
      setLoadingText('System Error.');
    } finally {
      setTimeout(() => setIsLoading(false), 500);
    }
  };

  const checkAlertState = () => {
    if (!historyData || historyData.length < 3) return null;
    const lastThree = historyData.slice(-3);
    const negatives = lastThree.filter(i => i.sentiment === 'negative').length;
    const highRisks = lastThree.filter(i => i.misinformation === 'High').length;
    
    if (negatives >= 3) return "⚠️ Sustained negative sentiment spike detected across recent telemetry.";
    if (highRisks >= 2) return "🚨 High misinformation risk trend detected. Recommend immediate manual audit.";
    return null;
  };
  const activeAlert = checkAlertState();

  const [theme, setTheme] = useState('cyber-dark');
  const [activeView, setActiveView] = useState('dashboard');

  const sentimentIcon = (label) => {
    if (label === 'positive') return '🟢';
    if (label === 'negative') return '🔴';
    if (label === 'neutral') return '🟡';
    return '⚪';
  };

  // ── Resolve model type for badge rendering ─────────────────
  const getModelType = (key, val) => {
    // From /models endpoint
    if (loadedModels[key]?.type) return loadedModels[key].type;
    // Fallback heuristics from display_name
    const dn = (val?.display_name || '').toLowerCase();
    if (dn.includes('lstm') || dn.includes('cnn') || dn.includes('bilstm')) return 'neural';
    if (dn.includes('bert') || dn.includes('roberta') || dn.includes('distil')) return 'transformer';
    return 'traditional';
  };

  const typeBadgeLabel = (type) => {
    if (type === 'transformer') return 'Transformer';
    if (type === 'neural') return 'Deep Learning';
    return 'Classic ML';
  };

  // ── Model Comparison Table Component ────────────────────────
  const ModelComparisonTable = ({ modelResults, consensus }) => {
    if (!modelResults || Object.keys(modelResults).length === 0) return null;

    const entries = Object.entries(modelResults);
    const modelCount = entries.length;

    return (
      <div className="model-comparison-wrapper">
        <div className="comparison-header">
          <Layers size={18} />
          <h4>Multi-Model Comparison Matrix</h4>
          <span className="model-count-badge">{modelCount} Models</span>
          {consensus && (
            <span className={`consensus-badge color-${consensus.label}`}>
              CONSENSUS: {consensus.label?.toUpperCase()} ({consensus.agreement_pct}%)
            </span>
          )}
        </div>
        <div className="comparison-table-container">
          <table className="comparison-table" id="model-comparison-table">
            <thead>
              <tr>
                <th>Model</th>
                <th>Category</th>
                <th>Prediction</th>
                <th>Confidence</th>
                <th>Latency</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(([key, val]) => {
                const mtype = getModelType(key, val);
                return (
                <tr key={key} className={`model-row ${val.label === consensus?.label ? 'agrees' : 'disagrees'}`}>
                  <td className="model-name-cell">
                    <Cpu size={14} />
                    <span>{val.display_name || key}</span>
                  </td>
                  <td>
                    <span className={`type-badge ${mtype}`}>
                      {typeBadgeLabel(mtype)}
                    </span>
                  </td>
                  <td>
                    <span className={`prediction-cell color-${val.label}`}>
                      {sentimentIcon(val.label)} {val.label?.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <div className="table-conf-wrapper">
                      <div className="table-conf-bar">
                        <div 
                          className={`table-conf-fill conf-${val.label}`}
                          style={{ width: `${val.confidence}%` }}
                        />
                      </div>
                      <span className="conf-value">{val.confidence}%</span>
                    </div>
                  </td>
                  <td>
                    <span className="latency-cell">
                      <Clock size={12} />
                      {val.latency_ms != null ? `${val.latency_ms}ms` : '—'}
                    </span>
                  </td>
                  <td>
                    {val.error ? (
                      <span className="status-error">⛔ Error</span>
                    ) : val.label === consensus?.label ? (
                      <span className="status-agree">✓ Agrees</span>
                    ) : (
                      <span className="status-disagree">✗ Dissent</span>
                    )}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* Total latency footer */}
        {consensus && (
          <div className="comparison-footer">
            <span><Zap size={14} /> Parallel wall-clock time: <strong>{entries.reduce((max, [, v]) => Math.max(max, v.latency_ms || 0), 0)}ms</strong></span>
            <span>{consensus.total_models || modelCount} models evaluated</span>
          </div>
        )}
      </div>
    );
  };

  // ── Category counts for sidebar ─────────────────────────────
  const mlCount = Object.values(loadedModels).filter(m => m.type === 'traditional').length;
  const dlCount = Object.values(loadedModels).filter(m => m.type === 'neural').length;
  const tfCount = Object.values(loadedModels).filter(m => m.type === 'transformer').length;

  return (
    <div className={`system-dashboard ${theme}`} data-theme={theme}>
      
      {/* LEFT: System Controls */}
      <aside className="panel-left">
        <h1 className="logo" style={{fontSize: '1.8rem'}}>Sentiment <span>Analysis</span></h1>
        
        <div className="toggle-group" style={{marginTop: '2rem'}}>
          <button className={`mode-btn ${activeView === 'dashboard' ? 'active cursor-default' : ''}`} onClick={() => setActiveView('dashboard')}>Dashboard</button>
          <button className={`mode-btn ${activeView === 'analytics' ? 'active' : ''}`} onClick={() => setActiveView('analytics')}>Analytics</button>
          <button className={`mode-btn ${activeView === 'history' ? 'active' : ''}`} onClick={() => setActiveView('history')}>History</button>
          <button className={`mode-btn ${activeView === 'settings' ? 'active' : ''}`} onClick={() => setActiveView('settings')}>Settings</button>
        </div>

        <div className="toggle-group" style={{marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem'}}>
          <h4 style={{fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem'}}>SYSTEM CONTROLS</h4>
          <button 
             type="button" 
             className="mode-btn"
             onClick={() => setTheme(theme === 'cyber-dark' ? 'light-mode' : 'cyber-dark')}
          >
             {theme === 'cyber-dark' ? '☀️ Switch to Light Mode' : '🌙 Switch to Dark Mode'}
          </button>
          <button 
             type="button" 
             className="mode-btn"
             onClick={() => { setInputText(''); setResults(null); setError(null); setLoadingText('System reset.'); }}
          >
             ♻️ Reset Dashboard
          </button>
          
          <h4 style={{fontSize: '0.8rem', color: 'var(--text-muted)', margin: '1.5rem 0 0.5rem 0'}}>DATA STREAM INPUT</h4>
          <button 
            type="button"
            onClick={() => setAppMode('custom')} 
            className={`mode-btn ${appMode === 'custom' ? 'active-pulse' : ''}`}
            style={{borderColor: appMode === 'custom' ? 'var(--brand-purple)' : ''}}
          >
            Custom Payload
          </button>
          <button 
            type="button" 
            onClick={() => setAppMode('twitter')} 
            className={`mode-btn ${appMode === 'twitter' ? 'active-pulse' : ''}`}
            style={{borderColor: appMode === 'twitter' ? '#1da1f2' : ''}}
          >
            Twitter Extractor
          </button>

          {/* Active Models Badge */}
          <div className="models-status-pill">
            <Cpu size={14} />
            <span>{Object.keys(loadedModels).length} Model(s) Active</span>
          </div>
          {Object.keys(loadedModels).length > 0 && (
            <div className="models-breakdown">
              {mlCount > 0 && <span className="break-tag ml">{mlCount} ML</span>}
              {dlCount > 0 && <span className="break-tag dl">{dlCount} DL</span>}
              {tfCount > 0 && <span className="break-tag tf">{tfCount} TF</span>}
            </div>
          )}
        </div>
      </aside>

      {/* CENTER: Dashboard */}
      <main className="panel-center">
        {activeAlert && (
          <div className="smart-alert-banner">
             {activeAlert}
          </div>
        )}

        {activeView === 'dashboard' && (
          <>
          <div className="center-dashboard-feed">
             <div className="dashboard-grid-row">
                <div className="msg-bubble system-status-card">
                   <h4 style={{margin: '0 0 5px 0', color: 'var(--brand-purple)'}}>🔌 Core Telemetry</h4>
                   <p className={isLoading ? "pulse" : ""} style={{color: isLoading ? '#8b5cf6' : 'var(--text-muted)', fontSize: '0.9rem'}}>
                     {isLoading ? loadingText : "🟢 Monitoring active data streams..."}
                   </p>
                </div>
                <div className="msg-bubble system-insight-card">
                   <h4 style={{margin: '0 0 5px 0', color: '#10b981'}}>💡 Auto-Insight</h4>
                   <p style={{color: 'var(--text-muted)', fontSize: '0.9rem'}}>
                     {historyData.slice(0, 5).filter(h => h.sentiment === "negative").length >= 3 ? "Negative sentiment trending upwards." : "Global sentiment remains stable."}
                   </p>
                </div>
             </div>

             {error && (
              <div className="msg-bubble error-card" style={{borderColor: '#ef4444', color: '#fca5a5', marginTop: '1rem'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}><AlertCircle size={16} /> {error}</div>
              </div>
             )}

             {results && (
              <div className="live-result-panel" style={{marginTop: '1rem'}}>
                <div className="msg-bubble result-glass-card large-hero-card">
                  <h3 style={{marginTop: 0}}>{results.isBatch ? "BATCH STREAM ANALYSIS" : "10-MODEL PARALLEL ANALYSIS"}</h3>
                  
                  {results.isBatch ? (
                    <div className="tweet-batch-list">
                      {results.tweets.map((t, idx) => (
                        <div key={idx} className="nested-tweet-card hover-lift">
                          <p><strong>{t.author}</strong> - "{t.text}"</p>
                          <div className="metrics-row" style={{marginTop: '0.5rem'}}>
                             <span className={`metric-pill color-${t.sentiment}`}>• {t.sentiment}</span>
                             <span className={`metric-pill color-${t.misinformation?.toLowerCase()}`}>• Risk: {t.misinformation}</span>
                             <span className="metric-pill">• Conf: {t.confidence}%</span>
                          </div>
                          {t.explanation && t.explanation.reason && (
                            <details className="explain-panel x-ai-drawer">
                               <summary>🧠 Model Reasoning</summary>
                               <div className="x-ai-content">
                                  <p>{t.explanation.reason}</p>
                                  <div className="keywords">
                                    {t.explanation.keywords.map((k, i) => (
                                      <span key={i} className="tag">{k}</span>
                                    ))}
                                  </div>
                               </div>
                            </details>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                    {/* Consensus Hero */}
                    <div className="massive-metrics-display">
                       <div style={{textAlign: 'center', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px'}}>
                          <div style={{fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase'}}>Ensemble Consensus</div>
                          <div style={{fontSize: '2rem', fontWeight: '800'}} className={`color-${results.sentiment}`}>{results.sentiment.toUpperCase()}</div>
                          {results.consensus && (
                            <div style={{fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px'}}>
                              {results.consensus.agreement_pct}% model agreement • {results.confidence}% weighted confidence
                              {results.total_latency_ms != null && <> • <Zap size={12} style={{verticalAlign: 'middle'}} /> {results.total_latency_ms}ms total</>}
                            </div>
                          )}
                       </div>
                    </div>

                    <div className="metrics-row" style={{marginTop: '1rem'}}>
                      <div className="metric">
                        <ShieldAlert size={16} /> Risk Level: <strong className={`color-${results.misinformation.toLowerCase()}`}>{results.misinformation}</strong>
                      </div>
                      <div className="metric">
                        <CheckCircle size={16} /> System Confidence: 
                        <div className="conf-bar"><div className="conf-fill" style={{width: `${results.confidence}%`}}></div></div>
                      </div>
                    </div>

                    {results.complex_anomaly && (
                      <div className="msg-bubble error-card anomaly-warning" style={{borderColor: '#f59e0b', color: '#f59e0b', marginTop: '1rem', backgroundColor: 'rgba(245, 158, 11, 0.1)'}}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                          <AlertCircle size={16} color="#f59e0b" /> 
                          <strong>Complex Anomaly Detected:</strong> The sentiment ensemble and the XGBoost Misinformation AI disagree. Manual review recommended.
                        </div>
                      </div>
                    )}

                    <FactCheckEvidence verificationData={results.gemini_verification} />

                    {/* Multi-Model Comparison Table */}
                    <ModelComparisonTable 
                      modelResults={results.model_results} 
                      consensus={results.consensus} 
                    />

                    {results.explanation && results.explanation.reason && (
                        <div className="explain-panel intelligent-assistant">
                           <h4>🧠 Model Reasoning</h4>
                           <p>"{results.explanation.reason}"</p>
                           <p style={{fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '10px'}}>Primary Semantic Drivers:</p>
                           <div className="keywords">
                             {results.explanation.keywords.map((k, i) => (
                               <span key={i} className="tag">{k}</span>
                             ))}
                           </div>
                        </div>
                    )}
                    </>
                  )}
                </div>
              </div>
             )}
          </div>

          <form className="chat-input-area premium-input-wrapper" onSubmit={handleAnalyze} style={{flexDirection: 'column', padding: '1rem'}}>
             <textarea 
               value={inputText}
               onChange={(e) => setInputText(e.target.value)}
               onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAnalyze(e); } }}
               placeholder={appMode === 'custom' ? "Deploy text payload for 10-model parallel analysis..." : "Target @username for stream extraction..."} 
               disabled={isLoading}
               rows={3}
               style={{width: '100%', background: 'transparent', border: 'none', color: 'inherit', resize: 'none', outline: 'none', fontFamily: 'inherit'}}
             />
             <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem'}}>
               <span style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>{inputText.length} characters | <kbd>Enter</kbd> to analyze</span>
               <button type="submit" disabled={!inputText.trim() || isLoading} className="glow-btn">
                 {isLoading ? <Loader2 size={16} className="animate-spin" /> : "ANALYZE PAYLOAD"}
               </button>
             </div>
          </form>
          </>
        )}

        {activeView === 'analytics' && (
          <div className="center-dashboard-feed" style={{padding: '1rem'}}>
             <h2 style={{color: 'var(--brand-purple)', marginBottom: '1.5rem'}}>High-Resolution Telemetry</h2>
             <div className="analytics-grid">
               <div className="msg-bubble system-status-card analytics-chart-card">
                  <h3 style={{marginBottom: '1rem', textAlign: 'center'}}>Global Sentiment Distribution</h3>
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={statsData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" label>
                        {statsData.map((entry, index) => ( <Cell key={`cell-${index}`} fill={entry.color} /> ))}
                      </Pie>
                      <Tooltip contentStyle={{background: '#0f172a', border: '1px solid #334155'}}/>
                      <Legend verticalAlign="bottom" height={24} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
               </div>
               <div className="msg-bubble system-insight-card analytics-chart-card">
                  <h3 style={{marginBottom: '1rem', textAlign: 'center'}}>Macro Trend Graph Log</h3>
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={historyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)"/>
                      <XAxis dataKey="timestamp" stroke="#94a3b8" fontSize={11} />
                      <YAxis domain={[-1, 1]} ticks={[-1, 0, 1]} stroke="#94a3b8" fontSize={11} />
                      <Tooltip contentStyle={{background: '#0f172a', border: '1px solid #334155'}}/>
                      <Line type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={3} dot={{ fill: '#8b5cf6', strokeWidth: 2 }} animationDuration={1000} />
                    </LineChart>
                  </ResponsiveContainer>
               </div>
             </div>
          </div>
        )}

        {activeView === 'history' && (
          <div className="center-dashboard-feed" style={{padding: '1rem'}}>
             <h2 style={{color: '#10b981', marginBottom: '1rem'}}>Global Database Trace</h2>
             <p style={{color: 'var(--text-muted)', marginBottom: '2rem'}}>Archived records mapping direct into system cache.</p>
             <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
               {historyData.map((item, idx) => (
                 <div className="msg-bubble result-glass-card hover-lift" key={idx} style={{padding: '1rem'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem'}}>
                      <span className={`metric-pill color-${item.sentiment || 'neutral'}`}>{(item.sentiment || 'neutral').toUpperCase()}</span>
                      <span style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>{item.timestamp}</span>
                    </div>
                    <p style={{fontSize: '0.9rem', color: 'var(--text-primary)', margin: '0 0 0.5rem 0'}}>"{item.tweet_text}"</p>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px'}}>
                      <div>
                        {item.misinformation === 'High' && <span className="metric-pill color-high">⚠️ High Misinfo</span>}
                      </div>
                      <button 
                        className="btn-primary glow-btn"
                        style={{padding: '4px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center'}}
                        onClick={() => {
                          setActiveView('dashboard');
                          handleAnalyze(null, item.tweet_text);
                        }}
                      >
                       <Search size={12} style={{marginRight: '6px'}}/> Re-Verify
                      </button>
                    </div>
                 </div>
               ))}
             </div>
          </div>
        )}

        {activeView === 'settings' && (
          <div className="center-dashboard-feed" style={{padding: '1rem'}}>
             <h2 style={{color: 'var(--text-primary)', marginBottom: '2rem'}}>System Configurations</h2>
             <div className="large-hero-card">
               <h3 style={{marginBottom: '1rem'}}>Environment Visuals</h3>
               <p style={{color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem'}}>Toggle the UI appearance based on lighting conditions or analytical preference.</p>
               <button onClick={() => setTheme('cyber-dark')} className="glow-btn" style={{marginRight: '1rem', background: theme === 'cyber-dark' ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : '#334155'}}>Dark Mode Core</button>
               <button onClick={() => setTheme('light-mode')} className="glow-btn" style={{background: theme === 'light-mode' ? '#10b981' : '#334155'}}>Light Analytics Render</button>
               
               <h3 style={{marginTop: '3rem', marginBottom: '1rem'}}>Active Model Registry ({Object.keys(loadedModels).length}/10)</h3>
               <p style={{color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem'}}>Models currently loaded in the inference engine.</p>
               <div className="settings-model-grid">
                 {Object.entries(loadedModels).map(([key, info]) => (
                   <div key={key} className="settings-model-card">
                     <Cpu size={16} />
                     <div>
                       <strong>{info.display_name}</strong>
                       <span className={`type-badge ${info.type}`}>{typeBadgeLabel(info.type)}</span>
                     </div>
                     <span className="device-tag">{info.device || 'cpu'}</span>
                   </div>
                 ))}
                 {Object.keys(loadedModels).length === 0 && (
                   <p className="pulse" style={{color: 'var(--text-muted)'}}>No models loaded — check backend.</p>
                 )}
               </div>

               <h3 style={{marginTop: '3rem', marginBottom: '1rem', color: '#ef4444'}}>Database Overrides</h3>
               <p style={{color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem'}}>Clears the active session states and prepares system for a fresh payload injection loop.</p>
               <button onClick={() => { setInputText(''); setResults(null); setError(null); setLoadingText('System reset.'); }} className="glow-btn" style={{background: '#ef4444', boxShadow: 'none'}}>Soft Reset State</button>
             </div>
          </div>
        )}
      </main>

      {/* RIGHT: Live Data & Database Telemetry */}
      <aside className="panel-right">
        
        <div style={{display: 'flex', gap: '1rem', flexDirection: 'column'}}>
           <div className="chart-placeholder" style={{ border: 'none', height: '220px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', padding: '10px' }}>
              <h2 className="panel-title" style={{margin: '0 0 10px 0', textAlign: 'center'}}>Sentiment Division</h2>
              {statsData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statsData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                      {statsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{background: '#0f172a', border: '1px solid #334155'}}/>
                    <Legend verticalAlign="bottom" height={24} iconType="circle"/>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="pulse">Aggregating telemetry...</p>
              )}
           </div>

           <div className="chart-placeholder" style={{ border: 'none', height: '180px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', padding: '10px' }}>
              <h2 className="panel-title" style={{margin: '0 0 10px 0', textAlign: 'center'}}>Sentiment Trend Graph</h2>
              {historyData.length > 0 ? (
                 <ResponsiveContainer width="100%" height="100%">
                   <LineChart data={historyData}>
                     <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)"/>
                     <XAxis dataKey="timestamp" stroke="#94a3b8" fontSize={10} tickMargin={5}/>
                     <YAxis domain={[-1, 1]} ticks={[-1, 0, 1]} stroke="#94a3b8" fontSize={10}/>
                     <Tooltip contentStyle={{background: '#0f172a', border: '1px solid #334155'}}/>
                     <Line type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={3} dot={{ fill: '#8b5cf6', strokeWidth: 2 }} animationDuration={1000} />
                   </LineChart>
                 </ResponsiveContainer>
              ) : (
                <p className="pulse">Waiting for trends...</p>
              )}
           </div>
        </div>
        
        <h2 className="panel-title" style={{marginTop: '1rem'}}>Active History (MongoDB)</h2>
        <ul className="history-list" style={{overflowY: 'auto', flex: 1}}>
           {historyData.length > 0 ? historyData.map((item, idx) => (
             <li className="history-item" key={idx}>
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '4px'}}>
                  <strong className={`color-${item.sentiment}`}>{item.sentiment.toUpperCase()}</strong>
                  <span style={{color: 'var(--text-muted)'}}>{item.timestamp}</span>
                </div>
                <div style={{whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-primary)'}}>
                  "{item.tweet_text}"
                </div>
             </li>
           )) : (
             <li className="history-item loading-hi pulse">Polling MongoDB...</li>
           )}
        </ul>
      </aside>

    </div>
  );
}

export default App;
