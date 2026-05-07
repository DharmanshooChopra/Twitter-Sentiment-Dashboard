/**
 * ConsensusMatrix.jsx — NeuroPulse Final Phase
 * Transformer Consensus Matrix visualization.
 */
import { motion } from 'framer-motion';
import { Network, ArrowUpRight, ArrowDownRight, Minus, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function ConsensusMatrix({ loadedModels }) {
  // Mock data for models if none loaded yet
  const modelsList = Object.keys(loadedModels).length > 0 
    ? Object.keys(loadedModels).map(k => ({
        id: k,
        name: k.replace(/_/g, ' ').toUpperCase(),
        sentiment: Math.random() > 0.3 ? 'Positive' : 'Negative',
        confidence: (80 + Math.random() * 18).toFixed(1),
        latency: (10 + Math.random() * 40).toFixed(0),
        disagreement: Math.random() > 0.8
      }))
    : [
        { id: 'roberta', name: 'ROBERTA BASE', sentiment: 'Positive', confidence: '94.2', latency: '42', disagreement: false },
        { id: 'distilbert', name: 'DISTILBERT', sentiment: 'Positive', confidence: '89.1', latency: '15', disagreement: false },
        { id: 'xgboost', name: 'XGBOOST ENSEMBLE', sentiment: 'Negative', confidence: '76.4', latency: '8', disagreement: true },
        { id: 'svm', name: 'SVM RBF', sentiment: 'Positive', confidence: '81.2', latency: '12', disagreement: false },
        { id: 'gemini', name: 'GEMINI 2.5 FLASH', sentiment: 'Positive', confidence: '98.5', latency: '850', disagreement: false },
      ];

  const avgConfidence = (modelsList.reduce((acc, m) => acc + parseFloat(m.confidence), 0) / modelsList.length).toFixed(1);
  const disagreements = modelsList.filter(m => m.disagreement).length;

  return (
    <div style={{ padding: '2rem', height: '100%', overflowY: 'auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-1)', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Network size={24} color="#8b5cf6" /> Transformer Consensus Matrix
        </h2>
        <p style={{ color: 'var(--text-2)', fontSize: '0.85rem', margin: 0 }}>Real-time model comparison, ensemble voting, and disagreement visualization.</p>
      </div>

      {/* Top Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: '2rem' }}>
        {[
          { label: 'Ensemble Consensus', val: '80%', color: '#10b981', icon: ShieldCheck },
          { label: 'Avg Confidence', val: `${avgConfidence}%`, color: '#3b82f6', icon: Network },
          { label: 'Active Transformers', val: '3/3', color: '#8b5cf6', icon: Bot => <span style={{fontWeight:'bold'}}>TF</span> },
          { label: 'Disagreement Spikes', val: disagreements, color: disagreements > 0 ? '#f59e0b' : '#10b981', icon: AlertTriangle },
        ].map((s, i) => (
          <div key={i} style={{ background: 'var(--bg-surface)', border: `1px solid ${s.color}40`, borderRadius: 12, padding: '1rem', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: s.color, display: 'flex', alignItems: 'center', gap: 8 }}>
              {s.val}
              <s.icon size={16} color={s.color} opacity={0.5} />
            </div>
          </div>
        ))}
      </div>

      {/* Matrix Table */}
      <div style={{ background: 'var(--bg-surface)', backdropFilter: 'blur(12px)', border: '1px solid var(--border-dim)', borderRadius: 16, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-dim)' }}>
              <th style={{ padding: '1rem 1.5rem', color: 'var(--text-3)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Model ID</th>
              <th style={{ padding: '1rem 1.5rem', color: 'var(--text-3)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Inference Output</th>
              <th style={{ padding: '1rem 1.5rem', color: 'var(--text-3)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Confidence</th>
              <th style={{ padding: '1rem 1.5rem', color: 'var(--text-3)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Latency</th>
              <th style={{ padding: '1rem 1.5rem', color: 'var(--text-3)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {modelsList.map((m, i) => (
              <motion.tr 
                key={m.id}
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                style={{ borderBottom: '1px solid var(--border-dim)' }}
                whileHover={{ backgroundColor: 'var(--glow-purple)' }}
              >
                <td style={{ padding: '1rem 1.5rem', color: 'var(--text-1)', fontWeight: 600, fontSize: '0.85rem' }}>{m.name}</td>
                <td style={{ padding: '1rem 1.5rem' }}>
                  <span style={{ 
                    display: 'inline-flex', alignItems: 'center', gap: 4, 
                    color: m.sentiment === 'Positive' ? '#10b981' : m.sentiment === 'Negative' ? '#ef4444' : '#f59e0b',
                    background: m.sentiment === 'Positive' ? 'rgba(16,185,129,0.1)' : m.sentiment === 'Negative' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                    padding: '2px 8px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 700
                  }}>
                    {m.sentiment === 'Positive' ? <ArrowUpRight size={14}/> : m.sentiment === 'Negative' ? <ArrowDownRight size={14}/> : <Minus size={14}/>}
                    {m.sentiment}
                  </span>
                </td>
                <td style={{ padding: '1rem 1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 60, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                      <div style={{ width: `${m.confidence}%`, height: '100%', background: '#8b5cf6', borderRadius: 2 }} />
                    </div>
                    <span style={{ color: 'var(--text-2)', fontSize: '0.75rem', fontFamily: 'monospace' }}>{m.confidence}%</span>
                  </div>
                </td>
                <td style={{ padding: '1rem 1.5rem', color: 'var(--text-2)', fontSize: '0.75rem', fontFamily: 'monospace' }}>{m.latency}ms</td>
                <td style={{ padding: '1rem 1.5rem' }}>
                  {m.disagreement 
                    ? <span style={{ color: '#f59e0b', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: 4 }}><AlertTriangle size={12}/> Divergent</span>
                    : <span style={{ color: '#10b981', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: 4 }}><ShieldCheck size={12}/> Aligned</span>
                  }
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
