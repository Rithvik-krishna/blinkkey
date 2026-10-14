import React from 'react';
import { McqResult, AppStatus } from '../types';
import { Zap, CheckCircle2, AlertCircle, HelpCircle, Clock } from 'lucide-react';

interface StatusIndicatorProps {
  status: AppStatus;
  capsLockState: boolean;
  lastResult?: McqResult;
  shortcut: string;
  onTriggerNow: () => void;
  statusMessage?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  capsLockState,
  lastResult,
  shortcut,
  onTriggerNow,
  statusMessage,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Interactive Keycap & Trigger Hero */}
      <div style={{
        backgroundColor: '#121827',
        border: '1px solid #1E293B',
        borderRadius: '10px',
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        {/* Visual 3D Keycap */}
        <div className="keycap-container">
          <div className={`keycap ${capsLockState ? 'active' : ''}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>
                Caps Lock
              </span>
              <div className={`keycap-led ${capsLockState ? 'on' : ''}`} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <span style={{ fontSize: '9px', color: capsLockState ? '#EF4444' : '#64748B' }}>
                {capsLockState ? 'LED ACTIVE' : 'LED OFF'}
              </span>
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#E2E8F0' }}>⇪</span>
            </div>
          </div>
        </div>

        {/* Global Shortcut Prompt & Trigger Button */}
        <div style={{ flex: 1, marginLeft: '18px' }}>
          <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '4px' }}>
            Global Shortcut
          </div>
          <div style={{
            display: 'inline-block',
            backgroundColor: '#1E293B',
            border: '1px solid #334155',
            borderRadius: '6px',
            padding: '4px 10px',
            fontFamily: 'monospace',
            fontWeight: 600,
            fontSize: '12px',
            color: '#38BDF8',
            marginBottom: '10px',
          }}>
            {shortcut.replace('CommandOrControl', 'Ctrl')}
          </div>

          <div>
            <button
              onClick={onTriggerNow}
              disabled={status !== 'ready' && status !== 'error'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: status === 'ready' || status === 'error' ? '#2563EB' : '#1E293B',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: status === 'ready' || status === 'error' ? 'pointer' : 'not-allowed',
                opacity: status === 'ready' || status === 'error' ? 1 : 0.6,
                transition: 'background-color 0.2s',
              }}
            >
              <Zap size={14} />
              {status === 'capturing'
                ? 'Capturing...'
                : status === 'analyzing'
                ? 'Thinking...'
                : status === 'signaling'
                ? 'Signaling...'
                : 'Trigger Scan Now'}
            </button>
          </div>
        </div>
      </div>

      {/* Real-time Status banner if busy */}
      {statusMessage && (
        <div style={{
          backgroundColor: status === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
          border: `1px solid ${status === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`,
          borderRadius: '8px',
          padding: '8px 12px',
          fontSize: '12px',
          color: status === 'error' ? '#FCA5A5' : '#93C5FD',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <Clock size={14} className={status !== 'error' ? 'animate-spin' : ''} />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Latest MCQ Answer Card */}
      <div style={{
        backgroundColor: '#121827',
        border: '1px solid #1E293B',
        borderRadius: '10px',
        padding: '14px',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '10px',
          borderBottom: '1px solid #1E293B',
          paddingBottom: '8px',
        }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase' }}>
            Latest MCQ Analysis
          </span>
          {lastResult && (
            <span style={{ fontSize: '11px', color: '#64748B' }}>
              {lastResult.processingTimeMs ? `${lastResult.processingTimeMs}ms` : ''}
            </span>
          )}
        </div>

        {!lastResult ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: '#64748B' }}>
            <HelpCircle size={28} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
            <div style={{ fontSize: '12px', fontWeight: 500 }}>No MCQ processed yet</div>
            <div style={{ fontSize: '11px', marginTop: '4px' }}>
              Press <span style={{ color: '#38BDF8', fontFamily: 'monospace' }}>{shortcut.replace('CommandOrControl', 'Ctrl')}</span> from any app to scan the screen
            </div>
          </div>
        ) : lastResult.status === 'success' ? (
          <div>
            {/* Question Text */}
            <div style={{
              fontSize: '12px',
              fontWeight: 600,
              color: '#F1F5F9',
              marginBottom: '10px',
              lineHeight: '1.4',
            }}>
              {lastResult.question}
            </div>

            {/* Answer Options Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '6px', marginBottom: '10px' }}>
              {lastResult.options &&
                Object.entries(lastResult.options).map(([optKey, optText]) => {
                  const isSelected = optKey.toUpperCase() === lastResult.selectedOption?.toUpperCase();
                  return (
                    <div
                      key={optKey}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        backgroundColor: isSelected ? 'rgba(16, 185, 129, 0.15)' : '#182234',
                        border: `1px solid ${isSelected ? '#10B981' : '#243046'}`,
                      }}
                    >
                      <span
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '4px',
                          backgroundColor: isSelected ? '#10B981' : '#243046',
                          color: isSelected ? '#FFFFFF' : '#94A3B8',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '11px',
                        }}
                      >
                        {optKey}
                      </span>
                      <span style={{ fontSize: '12px', color: isSelected ? '#34D399' : '#CBD5E1', flex: 1 }}>
                        {optText}
                      </span>
                      {isSelected && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '10px',
                          fontWeight: 600,
                          color: '#10B981',
                          backgroundColor: 'rgba(16, 185, 129, 0.2)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                        }}>
                          <CheckCircle2 size={12} />
                          {lastResult.blinkCount} Blinks
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>

            {/* Selected Option summary banner */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#1E293B',
              borderRadius: '6px',
              padding: '8px 12px',
            }}>
              <div>
                <span style={{ fontSize: '11px', color: '#94A3B8' }}>Answer: </span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#10B981' }}>
                  Option {lastResult.selectedOption}
                </span>
                <span style={{ fontSize: '11px', color: '#64748B', marginLeft: '6px' }}>
                  ({lastResult.blinkCount} LED blinks)
                </span>
              </div>
              {lastResult.confidence && (
                <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                  Confidence: <span style={{ color: '#38BDF8', fontWeight: 600 }}>{Math.round(lastResult.confidence * 100)}%</span>
                </div>
              )}
            </div>

            {/* Explanation */}
            {lastResult.explanation && (
              <div style={{
                marginTop: '8px',
                fontSize: '11px',
                color: '#94A3B8',
                backgroundColor: '#0F172A',
                padding: '8px',
                borderRadius: '6px',
                borderLeft: '3px solid #3B82F6',
              }}>
                {lastResult.explanation}
              </div>
            )}
          </div>
        ) : lastResult.status === 'no_question' ? (
          <div style={{ textAlign: 'center', padding: '16px 0', color: '#F59E0B' }}>
            <AlertCircle size={24} style={{ margin: '0 auto 6px' }} />
            <div style={{ fontSize: '12px', fontWeight: 600 }}>No Question Detected</div>
            <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
              {lastResult.explanation || 'Ensure the MCQ is fully visible on the screen.'}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '16px 0', color: '#EF4444' }}>
            <AlertCircle size={24} style={{ margin: '0 auto 6px' }} />
            <div style={{ fontSize: '12px', fontWeight: 600 }}>Analysis Error</div>
            <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
              {lastResult.errorMessage}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
