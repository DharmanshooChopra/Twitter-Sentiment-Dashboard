import { useState, useEffect } from 'react';
import axios from 'axios';
import { Send, Loader2, AlertCircle, CheckCircle, BarChart2, ShieldAlert } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import './App.css';

function App() {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  
  // Phase 5 & 6 State
  const [appMode, setAppMode] = useState('custom');
  const [statsData, setStatsData] = useState([]);
  const [historyData, setHistoryData] = useState([]);

  // Force absolute mapping to avoid CORS protocol mismatch
  const apiUrl = 'http://127.0.0.1:5000';

  const fetchTelemetry = async () => {
    try {
      const [statsRes, histRes] = await Promise.all([
        axios.get(`${apiUrl}/stats`),
        axios.get(`${apiUrl}/history`)
      ]);
      
      // Parse stats for Recharts Pie
      const rawStats = statsRes.data;
      const parsedStats = [
        { name: 'Positive', value: rawStats.positive || 0, color: '#10b981' },
        { name: 'Negative', value: rawStats.negative || 0, color: '#ef4444' },
        { name: 'Neutral', value: rawStats.neutral || 0, color: '#f59e0b' }
      ].filter(item => item.value > 0);
      
      setStatsData(parsedStats);
      setHistoryData(histRes.data);
    } catch (err) {
      console.error("Failed to load telemetry data: ", err);
    }
  };

  // Poll database on load and refresh
  useEffect(() => {
    fetchTelemetry();
  }, []);

  const [loadingText, setLoadingText] = useState('System idle.');

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    
    setIsLoading(true);
    setLoadingText('Processing input...');
    setError(null);
    setResults(null);
    
    try {
      // Simulate real-time deep parsing sequence
      setTimeout(() => setLoadingText('Running model architecture...'), 800);
      setTimeout(() => setLoadingText('Cross-referencing database...'), 1600);
      
      if (appMode === 'custom') {
        const response = await axios.post(`${apiUrl}/analyze`, { 
            text: inputText 
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
        // Natively catch the Network / CORS drop
        setError("Failed to connect to the backend engine. Ensure Flask is running on Port 5000.");
      }
      setLoadingText('System Error.');
    } finally {
      setTimeout(() => setIsLoading(false), 500);
    }
  };

  // Phase 2: Alert System Tracking
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

  return (
    <div className={`system-dashboard ${theme}`} data-theme={theme}>
      
      {/* LEFT: System Controls (Matched to UI Map) */}
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
        </div>
      </aside>

      {/* CENTER: AI Agent Dashboard Interface */}
      <main className="panel-center">
        {activeAlert && (
          <div className="smart-alert-banner">
             {activeAlert}
          </div>
        )}

        {activeView === 'dashboard' && (
          <>
          <div className="center-dashboard-feed">
             {/* Top Insight Row */}
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
                  <h3 style={{marginTop: 0}}>{results.isBatch ? "BATCH STREAM ANALYSIS" : "LIVE ANALYSIS RESULT"}</h3>
                  
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
                    <div className="massive-metrics-display">
                       <div style={{textAlign: 'center', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px'}}>
                          <div style={{fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase'}}>Detected Shift</div>
                          <div style={{fontSize: '2rem', fontWeight: '800'}} className={`color-${results.sentiment}`}>{results.sentiment.toUpperCase()}</div>
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
               placeholder={appMode === 'custom' ? "Deploy text payload for real-time analysis..." : "Target @username for stream extraction..."} 
               disabled={isLoading}
               rows={6}
               style={{width: '100%', background: 'transparent', border: 'none', color: 'inherit', resize: 'vertical', outline: 'none', fontFamily: 'inherit'}}
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
             <h2 style={{color: 'var(--brand-purple)', marginBottom: '2rem'}}>High-Resolution Telemetry</h2>
             <div className="msg-bubble system-status-card" style={{height: '350px', marginBottom: '2rem'}}>
                <h3 style={{marginBottom: '1rem', textAlign: 'center'}}>Global Sentiment Distribution</h3>
                <ResponsiveContainer width="100%" height="80%">
                  <PieChart>
                    <Pie data={statsData} cx="50%" cy="50%" innerRadius={80} outerRadius={120} paddingAngle={5} dataKey="value" label>
                      {statsData.map((entry, index) => ( <Cell key={`cell-${index}`} fill={entry.color} /> ))}
                    </Pie>
                    <Tooltip contentStyle={{background: '#0f172a', border: '1px solid #334155'}}/>
                    <Legend verticalAlign="bottom" height={24} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
             </div>
             <div className="msg-bubble system-insight-card" style={{height: '350px'}}>
                <h3 style={{marginBottom: '1rem', textAlign: 'center'}}>Macro Trend Graph Log</h3>
                <ResponsiveContainer width="100%" height="80%">
                  <LineChart data={historyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)"/>
                    <XAxis dataKey="timestamp" stroke="#94a3b8" />
                    <YAxis domain={[-1, 1]} ticks={[-1, 0, 1]} stroke="#94a3b8" />
                    <Tooltip contentStyle={{background: '#0f172a', border: '1px solid #334155'}}/>
                    <Line type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={4} dot={{ fill: '#8b5cf6', strokeWidth: 3 }} animationDuration={1000} />
                  </LineChart>
                </ResponsiveContainer>
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
                      <span className={`metric-pill color-${item.sentiment}`}>{item.sentiment.toUpperCase()}</span>
                      <span style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>{item.timestamp}</span>
                    </div>
                    <p style={{fontSize: '0.9rem', color: 'var(--text-primary)', margin: '0 0 0.5rem 0'}}>"{item.tweet_text}"</p>
                    {item.misinformation === 'High' && <span className="metric-pill color-high">⚠️ High Misinfo</span>}
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
                    <Pie
                      data={statsData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
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
