import React, { useEffect, useState } from 'react';
import { AppSettings, DisplayInfo } from '../types';
import { Monitor, Shield, Trash2, Power, EyeOff, RefreshCw } from 'lucide-react';

interface DisplaySettingsProps {
  settings: AppSettings;
  onSave: (updated: Partial<AppSettings>) => void;
  onClearHistory: () => void;
}

export const DisplaySettings: React.FC<DisplaySettingsProps> = ({
  settings,
  onSave,
  onClearHistory,
}) => {
  const [displays, setDisplays] = useState<DisplayInfo[]>([]);
  const [selectedDisplay, setSelectedDisplay] = useState(settings.selectedDisplayId);
  const [launchAtLogin, setLaunchAtLogin] = useState(settings.launchAtLogin);
  const [startMinimized, setStartMinimized] = useState(settings.startMinimized);
  const [historyClearedMsg, setHistoryClearedMsg] = useState(false);

  const loadDisplays = async () => {
    try {
      const list = await window.blinkkeyApi.getDisplays();
      setDisplays(list);
    } catch {}
  };

  useEffect(() => {
    loadDisplays();
  }, []);

  const handleClearHistory = async () => {
    await window.blinkkeyApi.clearHistory();
    onClearHistory();
    setHistoryClearedMsg(true);
    setTimeout(() => setHistoryClearedMsg(false), 2500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Screen Selection */}
      <div style={{ backgroundColor: '#121827', border: '1px solid #1E293B', borderRadius: '10px', padding: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Monitor size={14} color="#3B82F6" />
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase' }}>
              Capture Target Display
            </span>
          </div>
          <button
            onClick={loadDisplays}
            title="Refresh displays"
            style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}
          >
            <RefreshCw size={12} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {displays.map((disp) => {
            const isSelected = selectedDisplay === disp.id || (selectedDisplay === 'primary' && disp.isPrimary);
            return (
              <button
                key={disp.id}
                onClick={() => {
                  setSelectedDisplay(disp.id);
                  onSave({ selectedDisplayId: disp.id });
                }}
                style={{
                  padding: '10px 12px',
                  backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.12)' : '#182234',
                  border: `1px solid ${isSelected ? '#3B82F6' : '#243046'}`,
                  borderRadius: '6px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: isSelected ? '#38BDF8' : '#F1F5F9' }}>
                    {disp.name}
                  </div>
                  <div style={{ fontSize: '10px', color: '#64748B' }}>
                    Resolution: {disp.bounds.width} × {disp.bounds.height} px
                  </div>
                </div>
                {disp.isPrimary && (
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    backgroundColor: '#1E293B',
                    color: '#94A3B8',
                    padding: '2px 6px',
                    borderRadius: '4px',
                  }}>
                    Primary
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* System Preferences */}
      <div style={{ backgroundColor: '#121827', border: '1px solid #1E293B', borderRadius: '10px', padding: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
          <Power size={14} color="#3B82F6" />
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase' }}>
            System Operation
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Start on login */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={launchAtLogin}
              onChange={(e) => {
                setLaunchAtLogin(e.target.checked);
                onSave({ launchAtLogin: e.target.checked });
              }}
              style={{ width: '16px', height: '16px', accentColor: '#3B82F6' }}
            />
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#F1F5F9' }}>
                Launch at Windows Startup
              </div>
              <div style={{ fontSize: '10px', color: '#64748B' }}>
                Starts BlinkKey silently in the system tray when you log in to Windows.
              </div>
            </div>
          </label>

          {/* Start Minimized */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={startMinimized}
              onChange={(e) => {
                setStartMinimized(e.target.checked);
                onSave({ startMinimized: e.target.checked });
              }}
              style={{ width: '16px', height: '16px', accentColor: '#3B82F6' }}
            />
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#F1F5F9' }}>
                Start Minimized to System Tray
              </div>
              <div style={{ fontSize: '10px', color: '#64748B' }}>
                Keeps the window hidden in background on launch (access via tray icon).
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Privacy & Diagnostic controls */}
      <div style={{ backgroundColor: '#121827', border: '1px solid #1E293B', borderRadius: '10px', padding: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
          <Shield size={14} color="#10B981" />
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase' }}>
            Privacy Architecture
          </span>
        </div>
        <p style={{ fontSize: '11px', color: '#94A3B8', lineHeight: '1.5', marginBottom: '10px' }}>
          BlinkKey captures your screen only when the global shortcut is actively pressed. Screenshots are held strictly in memory and are discarded immediately after analysis. No images are saved to disk.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #1E293B', paddingTop: '10px' }}>
          <button
            onClick={handleClearHistory}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              backgroundColor: '#1E293B',
              border: '1px solid #EF4444',
              borderRadius: '6px',
              color: '#F87171',
              fontSize: '11px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <Trash2 size={12} />
            Clear In-Memory History
          </button>
          {historyClearedMsg && (
            <span style={{ fontSize: '11px', color: '#10B981' }}>History cleared!</span>
          )}
        </div>
      </div>
    </div>
  );
};
