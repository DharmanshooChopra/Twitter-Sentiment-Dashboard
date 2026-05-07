import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';

export default function AlertBanner({ message }) {
  const [dismissed, setDismissed] = useState(false);
  if (!message || dismissed) return null;
  const isHigh = message.toLowerCase().includes('misinfo') || message.toLowerCase().includes('risk');
  const color = isHigh ? '#ef4444' : '#f59e0b';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10 }}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: `${color}18`, border: `1px solid ${color}44`,
          borderLeft: `4px solid ${color}`, borderRadius: 8,
          padding: '0.65rem 1rem', marginBottom: '0.75rem',
          color: color, fontSize: '0.82rem', fontWeight: 600,
          backdropFilter: 'blur(8px)',
        }}
      >
        <AlertTriangle size={15} style={{ flexShrink: 0 }} />
        <span style={{ flex: 1 }}>{message}</span>
        <button
          onClick={() => setDismissed(true)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color, padding: 0, display: 'flex' }}
        >
          <X size={14} />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
