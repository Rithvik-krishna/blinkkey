import React, { useEffect, useState } from 'react';
import { AppSettings, AppStatus, McqResult } from './types';
import { Header } from './components/Header';
import { StatusIndicator } from './components/StatusIndicator';
import { AiSettings } from './components/AiSettings';
import { BlinkSettings } from './components/BlinkSettings';
import { DisplaySettings } from './components/DisplaySettings';
import { ActivityLog, LogEntry } from './components/ActivityLog';
import { Activity, Cpu, Sliders, Settings2 } from 'lucide-react';
import { playBlinkCue } from './utils/sound';

type NavTab = 'monitor' | 'ai' | 'signal' | 'system';

export default function App() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [status, setStatus] = useState<AppStatus>('ready');
  const [isPaused, setIsPaused] = useState(false);
  const [capsLockState, setCapsLockState] = useState(false);
  const [lastResult, setLastResult] = useState<McqResult | undefined>();
  const [statusMessage, setStatusMessage] = useState<string | undefined>();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activeTab, setActiveTab] = useState<NavTab>('monitor');

  useEffect(() => {
    // 1. Load initial settings
    window.blinkkeyApi.getSettings().then((s) => setSettings(s));

    // 2. Load initial status & state
    window.blinkkeyApi.getStatus().then((st) => {
      setStatus(st.status);
      setIsPaused(st.isPaused);
      if (st.lastResult) setLastResult(st.lastResult);
    });

    window.blinkkeyApi.getCapsLockState().then((cs) => setCapsLockState(cs));

    // 3. Listen to IPC events
    const unsubStatus = window.blinkkeyApi.onStatusChange((data) => {
      if (data.status) setStatus(data.status);
      if (data.message !== undefined) setStatusMessage(data.message);
      if (data.capsLockState !== undefined) {
        setCapsLockState(data.capsLockState);
        // Sound feedback cue if enabled
        if (settings?.soundFeedback && data.status === 'signaling') {
          playBlinkCue(data.capsLockState);
        }
      }
    });

    const unsubResult = window.blinkkeyApi.onResult((result) => {
      setLastResult(result);
    });

    const unsubLog = window.blinkkeyApi.onLog((log) => {
      setLogs((prev) => [...prev.slice(-80), log]);
    });

    return () => {
      unsubStatus();
      unsubResult();
      unsubLog();
    };
  }, [settings?.soundFeedback]);

  const handleSaveSettings = async (updated: Partial<AppSettings>) => {
    if (!settings) return;
    const merged = { ...settings, ...updated };
    setSettings(merged);
    await window.blinkkeyApi.saveSettings(updated);
  };

  const handleTogglePause = async () => {
    const paused = await window.blinkkeyApi.togglePause();
    setIsPaused(paused);
    setStatus(paused ? 'paused' : 'ready');
  };

  const handleTriggerNow = async () => {
    await window.blinkkeyApi.triggerWorkflow();
  };

  if (!settings) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0B0F1C',
        color: '#94A3B8',
        fontSize: '12px'
      }}>
        Initializing BlinkKey...
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      backgroundColor: '#0B0F1C',
      color: '#F3F4F6',
      overflow: 'hidden',
    }}>
      {/* Top Bar */}
      <Header
        status={status}
        isPaused={isPaused}
        capsLockState={capsLockState}
        onTogglePause={handleTogglePause}
        onMinimize={() => window.blinkkeyApi.minimizeToTray()}
        onQuit={() => window.blinkkeyApi.quitApp()}
      />

      {/* Navigation Tab Bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        backgroundColor: '#121827',
        borderBottom: '1px solid #1E293B',
        padding: '0 8px',
      }}>
        {[
          { id: 'monitor', label: 'Monitor', icon: Activity },
          { id: 'ai', label: 'Vision AI', icon: Cpu },
          { id: 'signal', label: 'LED Signal', icon: Sliders },
          { id: 'system', label: 'System', icon: Settings2 },
        ].map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id as NavTab)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '10px 0',
                background: 'none',
                border: 'none',
                borderBottom: `2px solid ${isActive ? '#3B82F6' : 'transparent'}`,
                color: isActive ? '#38BDF8' : '#94A3B8',
                fontWeight: isActive ? 600 : 500,
                fontSize: '11px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon size={13} />
              {label}
            </button>
          );
        })}
      </div>

      {/* Scrollable Main Content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}>
        {activeTab === 'monitor' && (
          <>
            <StatusIndicator
              status={status}
              capsLockState={capsLockState}
              lastResult={lastResult}
              shortcut={settings.shortcut}
              onTriggerNow={handleTriggerNow}
              statusMessage={statusMessage}
            />
            <ActivityLog logs={logs} />
          </>
        )}

        {activeTab === 'ai' && (
          <AiSettings settings={settings} onSave={handleSaveSettings} />
        )}

        {activeTab === 'signal' && (
          <BlinkSettings settings={settings} onSave={handleSaveSettings} />
        )}

        {activeTab === 'system' && (
          <DisplaySettings
            settings={settings}
            onSave={handleSaveSettings}
            onClearHistory={() => setLastResult(undefined)}
          />
        )}
      </div>
    </div>
  );
}
