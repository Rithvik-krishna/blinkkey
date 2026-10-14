import React from 'react';
import { AppStatus } from '../types';
import { Play, Pause, Minus, Power, Activity } from 'lucide-react';

interface HeaderProps {
  status: AppStatus;
  isPaused: boolean;
  capsLockState: boolean;
  onTogglePause: () => void;
  onMinimize: () => void;
  onQuit: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  status,
  isPaused,
  capsLockState,
  onTogglePause,
  onMinimize,
  onQuit,
}) => {
  const getStatusColor = () => {
    if (isPaused) return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    switch (status) {
      case 'ready':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'capturing':
      case 'analyzing':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30 animate-pulse';
      case 'signaling':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30 animate-pulse';
      case 'error':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-slate-700/50 text-slate-300 border-slate-600';
    }
  };

  const getStatusLabel = () => {
    if (isPaused) return 'Paused';
    switch (status) {
      case 'ready':
        return 'Ready';
      case 'capturing':
        return 'Capturing...';
      case 'analyzing':
        return 'Analyzing MCQ...';
      case 'signaling':
        return 'Signaling LED...';
      case 'error':
        return 'Error';
      default:
        return 'Idle';
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px 14px',
      backgroundColor: '#121827',
      borderBottom: '1px solid #1E293B',
      WebkitAppRegion: 'drag' as any
    }}>
      {/* Brand logo & title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          position: 'relative',
          width: '24px',
          height: '24px',
          backgroundColor: '#1E293B',
          borderRadius: '5px',
          border: '1px solid #3B82F6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: '11px',
          color: '#3B82F6'
        }}>
          BK
          <span style={{
            position: 'absolute',
            top: '2px',
            right: '2px',
            width: '5px',
            height: '5px',
            borderRadius: '50%',
            backgroundColor: capsLockState ? '#EF4444' : '#475569',
            boxShadow: capsLockState ? '0 0 6px #EF4444' : 'none'
          }} />
        </div>
        <div>
          <span style={{ fontWeight: 700, fontSize: '14px', color: '#F3F4F6', letterSpacing: '-0.3px' }}>
            BlinkKey
          </span>
          <span style={{ fontSize: '10px', color: '#64748B', marginLeft: '6px' }}>v1.0</span>
        </div>
      </div>

      {/* Status & controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', WebkitAppRegion: 'no-drag' as any }}>
        {/* Status Pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          padding: '2px 8px',
          borderRadius: '9999px',
          fontSize: '11px',
          fontWeight: 500,
          border: '1px solid #334155',
          backgroundColor: '#1E293B',
          color: '#E2E8F0'
        }} className={getStatusColor()}>
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: isPaused ? '#F59E0B' : status === 'ready' ? '#10B981' : '#3B82F6'
          }} />
          {getStatusLabel()}
        </div>

        {/* Pause/Resume Button */}
        <button
          onClick={onTogglePause}
          title={isPaused ? 'Resume Processing' : 'Pause Processing'}
          style={{
            background: 'none',
            border: 'none',
            color: isPaused ? '#F59E0B' : '#94A3B8',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            borderRadius: '4px'
          }}
        >
          {isPaused ? <Play size={14} /> : <Pause size={14} />}
        </button>

        {/* Minimize to Tray */}
        <button
          onClick={onMinimize}
          title="Minimize to System Tray"
          style={{
            background: 'none',
            border: 'none',
            color: '#94A3B8',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            borderRadius: '4px'
          }}
        >
          <Minus size={14} />
        </button>

        {/* Quit */}
        <button
          onClick={onQuit}
          title="Quit BlinkKey"
          style={{
            background: 'none',
            border: 'none',
            color: '#EF4444',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            borderRadius: '4px'
          }}
        >
          <Power size={14} />
        </button>
      </div>
    </div>
  );
};
