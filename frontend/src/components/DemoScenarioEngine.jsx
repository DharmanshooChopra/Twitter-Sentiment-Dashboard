/**
 * DemoScenarioEngine.jsx — NeuroPulse Phase 11 Cinematic Presentation Mode
 * Simulates a high-stakes AI incident (e.g., Viral Misinformation Attack) 
 * for faculty presentations and investor demos.
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, AlertTriangle, Activity, Zap, ShieldCheck, X } from 'lucide-react';

export default function DemoScenarioEngine({ onClose }) {
  const [step, setStep] = useState(0);

  const SCENARIO_STEPS = [
    { time: 1000, type: 'alert', text: 'ANOMALY DETECTED: Sudden spike in negative sentiment across 4 regions.' },
    { time: 2500, type: 'info', text: '10-Model Ensemble scaling up to process load...' },
    { time: 4000, type: 'critical', text: 'MISINFORMATION ATTACK DETECTED: Coordinated bot network identified.' },
    { time: 5500, type: 'insight', text: 'Gemini 2.5 Flash engaging fact-check protocol.' },
    { time: 7000, type: 'action', text: 'Threat neutralized. Data streams quarantined. Normalizing sentiment.' },
  ];

  useEffect(() => {
    let timers = [];
    SCENARIO_STEPS.forEach((s, i) => {
      timers.push(setTimeout(() => setStep(i + 1), s.time));
    });
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        background: 'rgba(5, 5, 15, 0.95)', backdropFilter: 'blur(30px)',
        display: 'flex', flexDirection: 'column',
        fontFamily: 'Inter, sans-serif'
      }}>
      
      {/* Background threat visualizer */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }} 
          transition={{ duration: 3, repeat: Infinity }}
          style={{ position: 'absolute', top: '20%', left: '30%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, rgba(239,68,68,0.2) 0%, transparent 70%)', borderRadius: '50%' }} 
        />
      </div>

      {/* Top Bar */}
      <div style={{ padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.5)', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ShieldAlert size={24} color="#ef4444" />
          <div>
            <div style={{ color: '#f8fafc', fontWeight: 900, fontSize: '1.2rem', letterSpacing: '0.05em' }}>THREAT SIMULATION: OMEGA</div>
            <div style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.2em' }}>LIVE SCENARIO RECONSTRUCTION</div>
          </div>
        </div>
        <motion.button onClick={onClose} whileHover={{ scale: 1.1 }} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', width: 40, height: 40, borderRadius: '50%', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <X size={20} />
        </motion.button>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', zIndex: 10 }}>
        <div style={{ width: '100%', maxWidth: 800 }}>
          
          {/* Map/Chart Placeholder */}
          <div style={{ width: '100%', height: 250, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 16, marginBottom: '2rem', position: 'relative', overflow: 'hidden' }}>
             {/* Fake pulse line */}
             <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
               <motion.path 
                 d="M 0 125 L 200 125 L 250 50 L 300 200 L 350 125 L 800 125" 
                 fill="none" stroke="#ef4444" strokeWidth="3"
                 initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 4, ease: "linear" }}
               />
             </svg>
             <div style={{ position: 'absolute', top: 20, right: 20, color: '#ef4444', fontFamily: 'monospace', fontWeight: 700, fontSize: '1.2rem', animation: 'blink 1s infinite' }}>CRITICAL PEAK</div>
          </div>

          {/* Timeline Feed */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <AnimatePresence>
              {SCENARIO_STEPS.slice(0, step).map((s, i) => {
                let color = '#3b82f6';
                let Icon = Activity;
                if (s.type === 'alert') { color = '#f59e0b'; Icon = AlertTriangle; }
                if (s.type === 'critical') { color = '#ef4444'; Icon = ShieldAlert; }
                if (s.type === 'insight') { color = '#8b5cf6'; Icon = Zap; }
                if (s.type === 'action') { color = '#10b981'; Icon = ShieldCheck; }

                return (
                  <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                    style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${color}40`, borderLeft: `4px solid ${color}`, borderRadius: 8, padding: '1.2rem', display: 'flex', alignItems: 'center', gap: 16, backdropFilter: 'blur(10px)' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={20} color={color} />
                    </div>
                    <div>
                      <div style={{ color, fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.1em', marginBottom: 4 }}>T+{s.time}ms</div>
                      <div style={{ color: '#f8fafc', fontSize: '1.05rem', fontWeight: 500 }}>{s.text}</div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {step >= SCENARIO_STEPS.length && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }} style={{ marginTop: '3rem', textAlign: 'center' }}>
              <button onClick={onClose} style={{ padding: '12px 24px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.5)', borderRadius: 8, color: '#10b981', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', boxShadow: '0 0 20px rgba(16,185,129,0.2)' }}>
                END SIMULATION
              </button>
            </motion.div>
          )}

        </div>
      </div>
      <style>{`@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }`}</style>
    </motion.div>
  );
}
