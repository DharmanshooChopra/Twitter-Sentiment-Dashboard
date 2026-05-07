import React from 'react';
import { Search, ExternalLink } from 'lucide-react';

const FactCheckEvidence = ({ verificationData }) => {
    if (!verificationData) return null;

    const { verdict, source_url } = verificationData;

    let mainVerdict = verdict || '';
    let findings = [];
    
    // Split the Gemini response into the core verdict + structured findings
    if (mainVerdict.includes('FINDING:')) {
        const parts = mainVerdict.split(/FINDING:/g);
        mainVerdict = parts[0].trim();
        findings = parts.slice(1).map(p => p.trim()).filter(p => p.length > 0);
    }

    return (
        <div className="telemetry-card highlight-glow" style={{ marginTop: '1rem', borderLeft: '4px solid #3b82f6' }}>
            <div className="card-header" style={{ marginBottom: '10px' }}>
                <Search size={18} style={{ color: '#3b82f6', marginRight: '8px' }} />
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
                    <span className="badge-glow" style={{ fontSize: '0.85rem' }}>🔍 Verified Evidence</span>
                </h3>
            </div>
            
            <div className="verdict-container" style={{ padding: '10px', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: '6px', fontSize: '0.95rem', lineHeight: '1.5' }}>
                <p style={{ margin: 0, marginBottom: findings.length > 0 ? '8px' : '12px' }}>
                    <strong>Gemini AI Fact-Check:</strong> {mainVerdict}
                </p>
                
                {findings.length > 0 && (
                    <ul style={{ marginTop: '0', paddingLeft: '20px', marginBottom: '16px', color: 'var(--text-primary)' }}>
                        {findings.map((f, i) => (
                            <li key={i} style={{ marginBottom: '6px' }}>{f.replace(/^[\*\-\s]+/, '')}</li>
                        ))}
                    </ul>
                )}
                
                {source_url && (
                    <a 
                        href={source_url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="btn-primary" 
                        style={{ display: 'inline-flex', padding: '6px 14px', textDecoration: 'none', backgroundColor: '#3b82f6', fontSize: '0.9rem' }}
                    >
                        Read Full Article <ExternalLink size={14} style={{ marginLeft: '6px' }} />
                    </a>
                )}
                {!source_url && (
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#9ca3af' }}>No source URL provided by grounding metadata.</p>
                )}
            </div>
        </div>
    );
};

export default FactCheckEvidence;
