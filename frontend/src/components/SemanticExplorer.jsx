/**
 * SemanticExplorer.jsx — NeuroPulse Phase 11E Research NLP Engine
 * Visualizes semantic clusters, entity relationships, and embedding spaces.
 */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Network, Database, RefreshCw, Loader2, BrainCircuit, Maximize } from 'lucide-react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis } from 'recharts';

const API = process.env.NEXT_PUBLIC_VITE_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000';

export default function SemanticExplorer() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/nlp/entities`);
      setData(res.data);
    } catch {
      // Mock data if backend fails
      setData({
        clusters: [
          { x: 10, y: 30, z: 200, name: 'AI & Tech', color: '#8b5cf6' },
          { x: 40, y: 70, z: 300, name: 'Finance', color: '#10b981' },
          { x: 80, y: 20, z: 150, name: 'Politics', color: '#ef4444' },
          { x: 60, y: 50, z: 250, name: 'Crypto', color: '#06b6d4' },
          { x: 20, y: 80, z: 180, name: 'Healthcare', color: '#f59e0b' },
        ],
        entities: [
          { name: 'Nvidia', type: 'ORG', mentions: 142, sentiment: 'Positive' },
          { name: 'Bitcoin', type: 'ASSET', mentions: 89, sentiment: 'Neutral' },
          { name: 'Federal Reserve', type: 'GOV', mentions: 215, sentiment: 'Negative' },
          { name: 'OpenAI', type: 'ORG', mentions: 176, sentiment: 'Positive' },
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '1rem', overflowY: 'auto', height: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-1)', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <BrainCircuit size={18} color="#f472b6" /> Semantic Engine & Embeddings
          </h2>
          <p style={{ color: '#475569', fontSize: '0.78rem', margin: 0 }}>Research-grade NLP context clustering and entity extraction</p>
        </div>
        <motion.button onClick={loadData} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}
          style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', color: '#64748b' }}>
          <RefreshCw size={14} />
        </motion.button>
      </div>

      {loading && <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><Loader2 size={28} color="#f472b6" style={{ animation: 'spin 1s linear infinite' }} /></div>}

      {data && !loading && (
        <div style={{ display: 'flex', gap: '1rem', flex: 1, minHeight: 0 }}>
          
          {/* Scatter Plot for Embeddings */}
          <div style={{ flex: 2, background: 'rgba(0,0,0,0.22)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '1rem', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: '0.65rem', color: '#64748b', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>PCA Vector Space Projection</div>
              <Maximize size={14} color="#64748b" style={{ cursor: 'pointer' }} />
            </div>
            <div style={{ flex: 1, position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis type="number" dataKey="x" name="PCA1" stroke="#334155" fontSize={10} hide />
                  <YAxis type="number" dataKey="y" name="PCA2" stroke="#334155" fontSize={10} hide />
                  <ZAxis type="number" dataKey="z" range={[100, 500]} name="Density" />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, fontSize: '0.75rem', color: '#e2e8f0' }} />
                  {data.clusters.map((c, i) => (
                    <Scatter key={i} name={c.name} data={[c]} fill={c.color} />
                  ))}
                </ScatterChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 12, pointerEvents: 'none' }}>
                {data.clusters.map((c, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.65rem', color: '#94a3b8' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.color }} /> {c.name}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Extracted Entities Table */}
          <div style={{ flex: 1, background: 'rgba(0,0,0,0.22)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '1rem', overflowY: 'auto' }}>
             <div style={{ fontSize: '0.65rem', color: '#64748b', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 12 }}>Extracted Entities</div>
             <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
               {data.entities.map((e, i) => {
                 const sentimentColor = e.sentiment === 'Positive' ? '#10b981' : e.sentiment === 'Negative' ? '#ef4444' : '#f59e0b';
                 return (
                   <motion.div key={i} initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.1 }}
                     style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: 6 }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <span style={{ color: 'var(--text-1)', fontWeight: 800, fontSize: '0.85rem' }}>{e.name}</span>
                       <span style={{ fontSize: '0.6rem', padding: '2px 6px', borderRadius: 4, background: 'rgba(139,92,246,0.1)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.2)' }}>{e.type}</span>
                     </div>
                     <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748b' }}>
                       <span>{e.mentions} Mentions</span>
                       <span style={{ color: sentimentColor, fontWeight: 700 }}>{e.sentiment}</span>
                     </div>
                   </motion.div>
                 );
               })}
             </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
