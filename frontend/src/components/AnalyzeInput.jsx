import { motion } from 'framer-motion';
import { Send, Loader2 } from 'lucide-react';

export default function AnalyzeInput({ inputText, setInputText, isLoading, appMode, handleAnalyze, loadingText }) {
  return (
    <div style={{
      flexShrink: 0, marginTop: 'auto',
      background: 'var(--bg-elevated)', backdropFilter: 'blur(20px)',
      border: '1px solid var(--border-dim)',
      borderRadius: 14, padding: '1rem',
      transition: 'border-color 0.2s, box-shadow 0.2s',
    }}
      onFocus={() => {}}
    >
      <textarea
        value={inputText}
        onChange={e => setInputText(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAnalyze(e); }
        }}
        placeholder={appMode === 'custom'
          ? 'Deploy text payload for 10-model parallel analysis…'
          : 'Target @username or tweet ID for live extraction…'}
        disabled={isLoading}
        rows={3}
        style={{
          width: '100%', background: 'transparent', border: 'none',
          color: 'var(--text-1)', resize: 'none', outline: 'none',
          fontFamily: 'inherit', fontSize: '0.9rem', lineHeight: 1.6,
          boxSizing: 'border-box',
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
        <div style={{ fontSize: '0.7rem', color: '#475569', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span>{inputText.length} chars</span>
          {isLoading && (
            <motion.span
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              style={{ color: '#8b5cf6', fontWeight: 600 }}
            >
              ◈ {loadingText}
            </motion.span>
          )}
        </div>
        <motion.button
          type="button"
          disabled={!inputText.trim() || isLoading}
          onClick={handleAnalyze}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: !inputText.trim() || isLoading
              ? 'rgba(99,102,241,0.3)'
              : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            color: 'white', border: 'none', borderRadius: 9,
            padding: '0.6rem 1.4rem', fontWeight: 700, fontSize: '0.82rem',
            letterSpacing: '0.05em', cursor: !inputText.trim() || isLoading ? 'not-allowed' : 'pointer',
            boxShadow: !inputText.trim() || isLoading ? 'none' : '0 0 20px rgba(99,102,241,0.5)',
            transition: 'all 0.2s', fontFamily: 'inherit',
          }}
        >
          {isLoading ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={15} />}
          {isLoading ? 'PROCESSING…' : 'ANALYZE PAYLOAD'}
        </motion.button>
      </div>
    </div>
  );
}
