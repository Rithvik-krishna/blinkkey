import React, { useState } from 'react';
import { AppSettings } from '../types';
import { Sliders, Keyboard, Volume2, ShieldCheck, PlayCircle } from 'lucide-react';
import { playBlinkCue } from '../utils/sound';

interface BlinkSettingsProps {
  settings: AppSettings;
  onSave: (updated: Partial<AppSettings>) => void;
}

export const BlinkSettings: React.FC<BlinkSettingsProps> = ({ settings, onSave }) => {
  const [ledOnMs, setLedOnMs] = useState(settings.ledOnMs);
  const [ledOffMs, setLedOffMs] = useState(settings.ledOffMs);
  const [ledGapMs, setLedGapMs] = useState(settings.ledGapMs);
  const [shortcut, setShortcut] = useState(settings.shortcut);
  const [soundFeedback, setSoundFeedback] = useState(settings.soundFeedback);
  const [restoreState, setRestoreState] = useState(settings.restoreState);
  const [recording, setRecording] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleTestBlink = async (count: number) => {
    setTestResult(`Testing ${count} blinks...`);
    try {
      if (soundFeedback) {
        // play sound cue in sync with blinks
        for (let i = 0; i < count; i++) {
          setTimeout(() => playBlinkCue(true), i * (ledOnMs + ledOffMs));
          setTimeout(() => playBlinkCue(false), i * (ledOnMs + ledOffMs) + ledOnMs);
        }
      }

      const res = await window.blinkkeyApi.testBlink(count, ledOnMs, ledOffMs);
      setTestResult(res.message);
      setTimeout(() => setTestResult(null), 3500);
    } catch (e: any) {
      setTestResult(e.message || 'Test failed');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!recording) return;
    e.preventDefault();

    const parts: string[] = [];
    if (e.ctrlKey) parts.push('CommandOrControl');
    if (e.shiftKey) parts.push('Shift');
    if (e.altKey) parts.push('Alt');

    let key = e.key;
    if (['Control', 'Shift', 'Alt', 'Meta'].includes(key)) {
      return; // wait for non-modifier key
    }

    if (key === ' ') key = 'Space';
    else if (key.length === 1) key = key.toUpperCase();

    parts.push(key);
    const newShortcut = parts.join('+');

    setShortcut(newShortcut);
    setRecording(false);
    onSave({ shortcut: newShortcut });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Shortcut Configuration */}
      <div style={{ backgroundColor: '#121827', border: '1px solid #1E293B', borderRadius: '10px', padding: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
          <Keyboard size={14} color="#3B82F6" />
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase' }}>
            Activation Shortcut
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            tabIndex={0}
            onKeyDown={handleKeyDown}
            style={{
              flex: 1,
              padding: '8px 12px',
              backgroundColor: '#0F172A',
              border: `1px solid ${recording ? '#3B82F6' : '#334155'}`,
              borderRadius: '6px',
              color: recording ? '#38BDF8' : '#F8FAFC',
              fontSize: '12px',
              fontFamily: 'monospace',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
            onClick={() => setRecording(true)}
          >
            <span>{recording ? 'Press keys combo now...' : shortcut.replace('CommandOrControl', 'Ctrl')}</span>
            {recording && (
              <span style={{ fontSize: '10px', color: '#F59E0B', textTransform: 'none' }}>Recording...</span>
            )}
          </div>

          <button
            onClick={() => {
              const def = 'CommandOrControl+Shift+Space';
              setShortcut(def);
              setRecording(false);
              onSave({ shortcut: def });
            }}
            style={{
              padding: '8px 12px',
              backgroundColor: '#1E293B',
              border: '1px solid #334155',
              borderRadius: '6px',
              color: '#94A3B8',
              fontSize: '11px',
              cursor: 'pointer',
            }}
          >
            Reset Default
          </button>
        </div>
      </div>

      {/* LED Timing Controls */}
      <div style={{ backgroundColor: '#121827', border: '1px solid #1E293B', borderRadius: '10px', padding: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
          <Sliders size={14} color="#3B82F6" />
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase' }}>
            Blink Timing Specification
          </span>
        </div>

        {/* LED ON Slider */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
            <span style={{ color: '#CBD5E1' }}>LED ON Duration</span>
            <span style={{ color: '#38BDF8', fontWeight: 600 }}>{ledOnMs} ms</span>
          </div>
          <input
            type="range"
            min="100"
            max="600"
            step="25"
            value={ledOnMs}
            onChange={(e) => {
              const val = Number(e.target.value);
              setLedOnMs(val);
              onSave({ ledOnMs: val });
            }}
            style={{ width: '100%', accentColor: '#3B82F6' }}
          />
        </div>

        {/* LED OFF Slider */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
            <span style={{ color: '#CBD5E1' }}>LED OFF Duration</span>
            <span style={{ color: '#38BDF8', fontWeight: 600 }}>{ledOffMs} ms</span>
          </div>
          <input
            type="range"
            min="100"
            max="600"
            step="25"
            value={ledOffMs}
            onChange={(e) => {
              const val = Number(e.target.value);
              setLedOffMs(val);
              onSave({ ledOffMs: val });
            }}
            style={{ width: '100%', accentColor: '#3B82F6' }}
          />
        </div>

        {/* Inter-signal Gap Slider */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
            <span style={{ color: '#CBD5E1' }}>Gap Between Sequences</span>
            <span style={{ color: '#38BDF8', fontWeight: 600 }}>{ledGapMs} ms</span>
          </div>
          <input
            type="range"
            min="300"
            max="2000"
            step="50"
            value={ledGapMs}
            onChange={(e) => {
              const val = Number(e.target.value);
              setLedGapMs(val);
              onSave({ ledGapMs: val });
            }}
            style={{ width: '100%', accentColor: '#3B82F6' }}
          />
        </div>

        {/* Quick Test Signal Buttons */}
        <div style={{ borderTop: '1px solid #1E293B', paddingTop: '12px', marginTop: '4px' }}>
          <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '8px' }}>
            Test Caps Lock Signal Output:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
            {[
              { opt: 'A', blinks: 1 },
              { opt: 'B', blinks: 2 },
              { opt: 'C', blinks: 3 },
              { opt: 'D', blinks: 4 },
            ].map(({ opt, blinks }) => (
              <button
                key={opt}
                onClick={() => handleTestBlink(blinks)}
                style={{
                  padding: '8px 4px',
                  backgroundColor: '#1E293B',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  color: '#F1F5F9',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '2px',
                  transition: 'background-color 0.15s',
                }}
              >
                <span style={{ fontWeight: 700, fontSize: '12px', color: '#38BDF8' }}>{opt}</span>
                <span style={{ fontSize: '10px', color: '#64748B' }}>{blinks} blink{blinks > 1 ? 's' : ''}</span>
              </button>
            ))}
          </div>
          {testResult && (
            <div style={{ fontSize: '11px', color: '#10B981', marginTop: '8px', textAlign: 'center' }}>
              {testResult}
            </div>
          )}
        </div>
      </div>

      {/* Safety & Preferences */}
      <div style={{ backgroundColor: '#121827', border: '1px solid #1E293B', borderRadius: '10px', padding: '14px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Restore CapsLock state */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={restoreState}
              onChange={(e) => {
                setRestoreState(e.target.checked);
                onSave({ restoreState: e.target.checked });
              }}
              style={{ width: '16px', height: '16px', accentColor: '#3B82F6' }}
            />
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#F1F5F9', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={13} color="#10B981" />
                Restore Original Caps Lock State
              </div>
              <div style={{ fontSize: '10px', color: '#64748B' }}>
                Automatically returns your keyboard to its exact pre-blink state after signaling.
              </div>
            </div>
          </label>

          {/* Sound cue */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={soundFeedback}
              onChange={(e) => {
                setSoundFeedback(e.target.checked);
                onSave({ soundFeedback: e.target.checked });
              }}
              style={{ width: '16px', height: '16px', accentColor: '#3B82F6' }}
            />
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#F1F5F9', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Volume2 size={13} color="#3B82F6" />
                Audible Blink Tick (Feedback Cue)
              </div>
              <div style={{ fontSize: '10px', color: '#64748B' }}>
                Plays a subtle soft click in sync with LED pulses (ideal for testing or keyboards without LEDs).
              </div>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
};
