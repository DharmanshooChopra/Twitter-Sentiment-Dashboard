/**
 * SystemArchitecture.jsx — NeuroPulse Final Phase
 * Visualizes the full enterprise AI workflow with animated nodes.
 */
import { motion } from 'framer-motion';
import { Database, Zap, Brain, Server, Shield, Activity, Network, Bot, LayoutDashboard } from 'lucide-react';

const NODES = [
  { id: 'ingest', icon: Zap, label: 'Twitter Stream', sub: 'Real-time extraction via RapidAPI' },
  { id: 'preprocess', icon: Server, label: 'Preprocessing Engine', sub: 'Tokenization & NLP cleaning' },
  { id: 'ensemble', icon: Brain, label: 'Transformer Ensemble', sub: '10-model parallel inference' },
  { id: 'consensus', icon: Network, label: 'Consensus Engine', sub: 'Weighted voting & aggregation' },
  { id: 'misinfo', icon: Shield, label: 'Misinformation Detector', sub: 'Dual-classification risk scoring' },
  { id: 'mongo', icon: Database, label: 'MongoDB Telemetry', sub: 'Atlas vector & history storage' },
  { id: 'gemini', icon: Bot, label: 'Gemini AI Copilot', sub: 'Fact-checking & insight generation' },
  { id: 'visuals', icon: LayoutDashboard, label: 'Visualization Layer', sub: 'React/Vite cinematic UI' },
];

export default function SystemArchitecture() {
  return (
    <div style={{ padding: '2rem', height: '100%', overflowY: 'auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-1)', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Activity size={24} color="#06b6d4" /> AI Pipeline Architecture
        </h2>
        <p style={{ color: 'var(--text-2)', fontSize: '0.85rem', margin: 0, maxWidth: 600 }}>
          Live view of the NeuroPulse 2.0 enterprise intelligence workflow. Data flows from ingestion through our 10-model ensemble, fact-checking layers, and into the visualization matrix.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, paddingBottom: '4rem' }}>
        {NODES.map((node, index) => {
          const Icon = node.icon;
          const isLast = index === NODES.length - 1;
          
          return (
            <div key={node.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05, borderColor: 'rgba(6,182,212,0.5)', boxShadow: '0 0 20px rgba(6,182,212,0.2)' }}
                style={{
                  width: 380, padding: '1rem 1.5rem', background: 'var(--bg-surface)',
                  backdropFilter: 'blur(12px)', border: '1px solid var(--border-dim)',
                  borderRadius: 16, display: 'flex', alignItems: 'center', gap: 16, cursor: 'default',
                  position: 'relative', overflow: 'hidden'
                }}
              >
                {/* Ambient glow inside node */}
                <div style={{ position: 'absolute', top: -20, right: -20, width: 60, height: 60, background: 'rgba(6,182,212,0.1)', filter: 'blur(20px)', borderRadius: '50%' }} />
                
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(6,182,212,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(6,182,212,0.2)' }}>
                  <Icon size={24} color="#06b6d4" />
                </div>
                <div>
                  <div style={{ color: 'var(--text-1)', fontWeight: 800, fontSize: '0.95rem' }}>{node.label}</div>
                  <div style={{ color: 'var(--text-3)', fontSize: '0.7rem' }}>{node.sub}</div>
                </div>
              </motion.div>

              {!isLast && (
                <div style={{ height: 40, width: 2, background: 'var(--border-dim)', position: 'relative' }}>
                  <motion.div
                    animate={{ top: [0, 40] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'linear', delay: index * 0.2 }}
                    style={{ position: 'absolute', left: -2, width: 6, height: 12, background: '#06b6d4', borderRadius: 4, boxShadow: '0 0 10px #06b6d4' }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
