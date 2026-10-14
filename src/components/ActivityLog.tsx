import React, { useRef, useEffect } from 'react';
import { Terminal } from 'lucide-react';

export interface LogEntry {
  level: 'info' | 'warn' | 'error';
  message: string;
  timestamp: number;
}

interface ActivityLogProps {
  logs: LogEntry[];
}

export const ActivityLog: React.FC<ActivityLogProps> = ({ logs }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div style={{ backgroundColor: '#121827', border: '1px solid #1E293B', borderRadius: '10px', padding: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
        <Terminal size={13} color="#3B82F6" />
        <span style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase' }}>
          Activity Diagnostics
        </span>
      </div>

      <div
        ref={containerRef}
        style={{
          height: '110px',
          overflowY: 'auto',
          backgroundColor: '#0A0F1D',
          borderRadius: '6px',
          padding: '8px',
          fontFamily: 'monospace',
          fontSize: '11px',
          lineHeight: '1.5',
        }}
      >
        {logs.length === 0 ? (
          <div style={{ color: '#475569', fontStyle: 'italic' }}>Waiting for shortcut trigger...</div>
        ) : (
          logs.map((log, idx) => {
            const timeStr = new Date(log.timestamp).toLocaleTimeString();
            const color =
              log.level === 'error'
                ? '#EF4444'
                : log.level === 'warn'
                ? '#F59E0B'
                : '#38BDF8';

            return (
              <div key={idx} style={{ marginBottom: '3px', wordBreak: 'break-word' }}>
                <span style={{ color: '#475569', marginRight: '6px' }}>[{timeStr}]</span>
                <span style={{ color, marginRight: '6px', fontWeight: 600 }}>
                  [{log.level.toUpperCase()}]
                </span>
                <span style={{ color: '#E2E8F0' }}>{log.message}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
