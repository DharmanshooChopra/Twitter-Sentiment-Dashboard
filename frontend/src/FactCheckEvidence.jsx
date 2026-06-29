import React from 'react';
import { Search, ExternalLink, ShieldCheck, AlertCircle, FileText, Globe, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const statusConfig = {
    'Verified': { color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)', icon: ShieldCheck },
    'Partially Verified': { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', icon: AlertCircle },
    'Unverified': { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.3)', icon: Search },
    'Misleading': { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', icon: AlertCircle },
    'High Risk': { color: '#ef4444', bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.4)', icon: AlertCircle },
    'Verification Temporarily Unavailable': { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)', icon: Clock },
    'Verification Unavailable': { color: '#64748b', bg: 'rgba(100,116,139,0.08)', border: 'rgba(100,116,139,0.25)', icon: AlertCircle },
};

const confidenceColors = {
    'High': '#10b981',
    'Medium': '#f59e0b',
    'Low': '#ef4444',
};

const FactCheckEvidence = ({ verificationData }) => {
    if (!verificationData) return null;

    const { status, summary, reasoning, references, quota_exhausted } = verificationData;
    const cfg = statusConfig[status] || statusConfig['Unverified'];
    const StatusIcon = cfg.icon;

    const isUnavailable = quota_exhausted ||
        status === 'Verification Temporarily Unavailable' ||
        status === 'Verification Unavailable';

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
                marginTop: '1.25rem',
                background: 'rgba(15, 23, 42, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderLeft: `4px solid ${cfg.color}`,
                borderRadius: '12px',
                padding: '1.25rem',
                backdropFilter: 'blur(10px)',
            }}
        >
            {/* Header row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Search size={16} color="#8b5cf6" />
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                        Gemini Re-Verification Engine
                    </span>
                </div>
                <div style={{
                    padding: '2px 10px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800,
                    backgroundColor: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
                    display: 'flex', alignItems: 'center', gap: '5px'
                }}>
                    <StatusIcon size={12} />
                    {status?.toUpperCase()}
                </div>
            </div>

            {/* Quota warning banner */}
            {isUnavailable && (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '8px 12px', marginBottom: '1rem',
                    background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)',
                    borderRadius: '8px', fontSize: '0.75rem', color: '#f59e0b'
                }}>
                    <Clock size={13} />
                    <span>API quota cooldown active. Results will resume automatically on next request.</span>
                </div>
            )}

            {/* Summary section */}
            <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FileText size={12} color="#8b5cf6" /> RE-VERIFICATION SUMMARY
                </div>
                <p style={{ margin: 0, color: '#e2e8f0', fontSize: '0.88rem', lineHeight: 1.6, opacity: 0.9 }}>
                    {summary}
                </p>
                {reasoning && reasoning !== 'N/A' && !isUnavailable && (
                    <p style={{ marginTop: '8px', marginBottom: 0, color: '#64748b', fontSize: '0.75rem', fontStyle: 'italic' }}>
                        Reasoning: {reasoning}
                    </p>
                )}
            </div>

            {/* Supporting Sources */}
            <div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Globe size={12} color="#8b5cf6" /> SUPPORTING SOURCES
                </div>

                {(!references || references.length === 0) ? (
                    <div style={{
                        padding: '10px 12px', background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px',
                        fontSize: '0.78rem', color: '#475569', fontStyle: 'italic'
                    }}>
                        No verified external references available.
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {references.map((ref, idx) => (
                            <a
                                key={idx}
                                href={ref.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    padding: '8px 12px', background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px',
                                    textDecoration: 'none', transition: 'all 0.2s'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                            >
                                <div style={{
                                    minWidth: '24px', height: '24px', borderRadius: '50%',
                                    backgroundColor: 'rgba(139,92,246,0.1)', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <Globe size={12} color="#8b5cf6" />
                                </div>
                                <div style={{ flex: 1, overflow: 'hidden' }}>
                                    <div style={{ color: '#f1f5f9', fontSize: '0.78rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {ref.title}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                                        <span style={{ color: '#64748b', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            {ref.source}
                                        </span>
                                        {ref.confidence && (
                                            <span style={{
                                                fontSize: '0.6rem', fontWeight: 700, padding: '1px 6px',
                                                borderRadius: '4px',
                                                color: confidenceColors[ref.confidence] || '#94a3b8',
                                                background: `${confidenceColors[ref.confidence] || '#94a3b8'}18`,
                                                border: `1px solid ${confidenceColors[ref.confidence] || '#94a3b8'}30`,
                                                textTransform: 'uppercase', letterSpacing: '0.04em'
                                            }}>
                                                {ref.confidence}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <ExternalLink size={14} color="#475569" />
                            </a>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default FactCheckEvidence;


