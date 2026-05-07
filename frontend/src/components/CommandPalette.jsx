/**
 * CommandPalette.jsx — NeuroPulse Ctrl+K Command Palette
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, LayoutDashboard, BarChart3, Clock, Brain,
  Settings, Zap, Shield, Database, Bot, X, Maximize,
  TrendingUp, FlaskConical, PlaySquare, Activity, Network, Video, BrainCircuit, FileText, Component
} from 'lucide-react';

const COMMANDS = [
  { id:'dashboard', label:'Go to Command Center',   icon:LayoutDashboard, action:'nav',    target:'dashboard',  kbd:'G D' },
  { id:'analytics', label:'Open Analytics',          icon:BarChart3,       action:'nav',    target:'analytics',  kbd:'G A' },
  { id:'forecast',  label:'View Forecast',           icon:TrendingUp,      action:'nav',    target:'forecast',   kbd:'G F' },
  { id:'history',   label:'View History',            icon:Clock,           action:'nav',    target:'history',    kbd:'G H' },
  { id:'models',    label:'Model Registry',          icon:Brain,           action:'nav',    target:'models',     kbd:'G M' },
  { id:'benchmark', label:'Research Analytics',      icon:FlaskConical,    action:'nav',    target:'benchmark',  kbd:'G B' },
  { id:'consensus', label:'Consensus Matrix',        icon:Network,         action:'nav',    target:'consensus',  kbd:'G C' },
  { id:'telemetry', label:'AI Brain Telemetry',      icon:Activity,        action:'nav',    target:'telemetry',  kbd:'G T' },
  { id:'semantic',  label:'Semantic Explorer',       icon:BrainCircuit,    action:'nav',    target:'semantic',   kbd:'G X' },
  { id:'briefing',  label:'Executive Briefing',      icon:FileText,        action:'nav',    target:'briefing',   kbd:'G E' },
  { id:'architecture', label:'System Architecture',  icon:Component,       action:'nav',    target:'architecture', kbd:'G A' },
  { id:'demo',      label:'Faculty Demo Mode',       icon:PlaySquare,      action:'nav',    target:'demo',       kbd:'G P' },
  { id:'health',    label:'System Health',           icon:Database,        action:'nav',    target:'health',     kbd:'G H' },
  { id:'scenario',  label:'Launch Cinematic Demo',   icon:Video,           action:'scenario', target:'scenario', kbd:'G V' },
  { id:'fullscreen',label:'Toggle Fullscreen',       icon:Maximize,        action:'fullscreen', target:'',       kbd:'F11' },
  { id:'settings',  label:'Settings',                icon:Settings,        action:'nav',    target:'settings',   kbd:'G S' },
  { id:'dark',      label:'Switch to Dark Mode',     icon:Zap,             action:'theme',  target:'cyber-dark', kbd:'' },
  { id:'light',     label:'Switch to Light Mode',    icon:Zap,             action:'theme',  target:'light-mode', kbd:'' },
  { id:'copilot',   label:'Open AI Copilot',         icon:Bot,             action:'copilot',target:'',           kbd:'Ctrl+/' },
  { id:'custom',    label:'Custom Payload Mode',     icon:Database,        action:'mode',   target:'custom',     kbd:'' },
  { id:'twitter',   label:'Twitter Extractor Mode',  icon:Shield,          action:'mode',   target:'twitter',    kbd:'' },
];

export default function CommandPalette({ isOpen, setIsOpen, onCommand }) {
  const [query, setQuery]   = useState('');
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef(null);

  const filtered = query.trim()
    ? COMMANDS.filter(c => c.label.toLowerCase().includes(query.toLowerCase()))
    : COMMANDS;

  useEffect(() => { setCursor(0); }, [query]);

  useEffect(() => {
    if (isOpen) { setQuery(''); setTimeout(() => inputRef.current?.focus(), 80); }
  }, [isOpen]);

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setIsOpen(o => !o); }
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setIsOpen]);

  const execute = (cmd) => {
    setIsOpen(false);
    if (onCommand) onCommand(cmd);
  };

  const handleKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor(c => Math.min(c+1, filtered.length-1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setCursor(c => Math.max(c-1, 0)); }
    if (e.key === 'Enter' && filtered[cursor]) execute(filtered[cursor]);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            onClick={() => setIsOpen(false)}
            style={{ position:'fixed', inset:0, zIndex:300, background:'rgba(0,0,0,0.65)', backdropFilter:'blur(6px)' }}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity:0, y:-20, scale:0.97 }}
            animate={{ opacity:1, y:0, scale:1 }}
            exit={{ opacity:0, y:-20, scale:0.97 }}
            transition={{ type:'spring', stiffness:340, damping:26 }}
            style={{
              position:'fixed', top:'18%', left:'50%', transform:'translateX(-50%)',
              zIndex:301, width:520, maxHeight:440,
              background:'rgba(10,10,22,0.97)', backdropFilter:'blur(32px)',
              border:'1px solid rgba(139,92,246,0.3)', borderRadius:16,
              boxShadow:'0 32px 100px rgba(0,0,0,0.8), 0 0 60px rgba(99,102,241,0.1)',
              overflow:'hidden', display:'flex', flexDirection:'column',
            }}
          >
            {/* Search bar */}
            <div style={{
              display:'flex', alignItems:'center', gap:10, padding:'0.9rem 1rem',
              borderBottom:'1px solid rgba(255,255,255,0.06)',
            }}>
              <Search size={16} color="#8b5cf6" style={{ flexShrink:0 }}/>
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Type a command or search..."
                style={{
                  flex:1, background:'transparent', border:'none', outline:'none',
                  color:'#e2e8f0', fontSize:'0.9rem', fontFamily:'inherit',
                }}
              />
              <kbd style={{
                fontSize:'0.6rem', padding:'2px 7px', borderRadius:5,
                background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)',
                color:'#64748b', fontFamily:'monospace',
              }}>ESC</kbd>
            </div>

            {/* Results */}
            <div style={{ overflowY:'auto', padding:'0.5rem' }} className="scroll-thin">
              {filtered.length === 0 ? (
                <div style={{ textAlign:'center', color:'#334155', padding:'2rem', fontSize:'0.82rem' }}>
                  No commands found for "{query}"
                </div>
              ) : filtered.map((cmd, i) => {
                const Icon = cmd.icon;
                return (
                  <motion.button
                    key={cmd.id}
                    onClick={() => execute(cmd)}
                    onMouseEnter={() => setCursor(i)}
                    whileHover={{ x:4 }}
                    style={{
                      width:'100%', display:'flex', alignItems:'center', gap:10,
                      padding:'0.65rem 0.8rem', borderRadius:8, cursor:'pointer',
                      border:'1px solid transparent',
                      background: cursor === i ? 'rgba(139,92,246,0.15)' : 'transparent',
                      borderColor: cursor === i ? 'rgba(139,92,246,0.25)' : 'transparent',
                      color: cursor === i ? '#c4b5fd' : '#94a3b8',
                      fontSize:'0.82rem', textAlign:'left', fontFamily:'inherit',
                      transition:'all 0.15s',
                    }}
                  >
                    <div style={{
                      width:28, height:28, borderRadius:7, flexShrink:0,
                      background: cursor===i ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.04)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                    }}>
                      <Icon size={14} color={cursor===i ? '#a78bfa' : '#64748b'}/>
                    </div>
                    <span style={{ flex:1 }}>{cmd.label}</span>
                    {cmd.kbd && (
                      <kbd style={{
                        fontSize:'0.6rem', padding:'2px 7px', borderRadius:4,
                        background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)',
                        color:'#475569', fontFamily:'monospace', whiteSpace:'nowrap',
                      }}>{cmd.kbd}</kbd>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Footer */}
            <div style={{
              padding:'0.5rem 1rem', borderTop:'1px solid rgba(255,255,255,0.05)',
              display:'flex', gap:16, fontSize:'0.62rem', color:'#334155',
            }}>
              <span>↑↓ navigate</span>
              <span>↵ execute</span>
              <span>esc close</span>
              <span style={{ marginLeft:'auto' }}>NeuroPulse v2.0</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
