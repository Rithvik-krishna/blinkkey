import React, { useState } from 'react';
import { AiProvider, AppSettings } from '../types';
import { Eye, EyeOff, CheckCircle2, AlertCircle, Cpu, Key, Globe, Sparkles } from 'lucide-react';

interface AiSettingsProps {
  settings: AppSettings;
  onSave: (updated: Partial<AppSettings>) => void;
}

const PROVIDER_MODELS: Record<AiProvider, string[]> = {
  gemini: [
    'gemini-flash-lite-latest',
    'gemini-3.1-flash-lite',
    'gemini-3.8-flash',
    'gemini-3.5-flash',
    'gemini-flash-latest',
  ],
  openai: ['gpt-4o-mini', 'gpt-4o'],
  anthropic: ['claude-3-5-haiku-20241022', 'claude-3-5-sonnet-20241022'],
  custom: ['llava', 'llama3.2-vision', 'gpt-4o-mini'],
};

export const AiSettings: React.FC<AiSettingsProps> = ({ settings, onSave }) => {
  const [provider, setProvider] = useState<AiProvider>(settings.aiProvider);
  const [apiKey, setApiKey] = useState(settings.apiKey);
  const [model, setModel] = useState(settings.model || 'gemini-flash-lite-latest');
  const [customEndpoint, setCustomEndpoint] = useState(settings.customEndpoint || '');
  const [showKey, setShowKey] = useState(false);
  const [customModelInput, setCustomModelInput] = useState('');
  const [isCustomModel, setIsCustomModel] = useState(!PROVIDER_MODELS[settings.aiProvider]?.includes(settings.model));
  const [testStatus, setTestStatus] = useState<{ testing: boolean; success?: boolean; message?: string }>({
    testing: false,
  });

  const handleProviderChange = (newProvider: AiProvider) => {
    setProvider(newProvider);
    const defaultModel = PROVIDER_MODELS[newProvider][0];
    setModel(defaultModel);
    setIsCustomModel(false);
    onSave({ aiProvider: newProvider, model: defaultModel });
  };

  const handleTestConnection = async () => {
    setTestStatus({ testing: true });
    try {
      const activeModel = isCustomModel ? customModelInput.trim() : model;
      const res = await window.blinkkeyApi.testAiConnection(provider, apiKey, activeModel, customEndpoint);
      setTestStatus({
        testing: false,
        success: res.success,
        message: res.message,
      });
    } catch (e: any) {
      setTestStatus({
        testing: false,
        success: false,
        message: e.message || 'Connection test failed',
      });
    }
  };

  const handleSave = () => {
    const activeModel = isCustomModel ? customModelInput.trim() : model;
    onSave({
      aiProvider: provider,
      apiKey: apiKey.trim(),
      model: activeModel,
      customEndpoint,
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Provider Selector */}
      <div style={{ backgroundColor: '#121827', border: '1px solid #1E293B', borderRadius: '10px', padding: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
          <Sparkles size={14} color="#3B82F6" />
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase' }}>
            Vision AI Provider
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
          {(['gemini', 'openai', 'anthropic', 'custom'] as AiProvider[]).map((p) => {
            const isSelected = provider === p;
            const labels: Record<AiProvider, { title: string; subtitle: string }> = {
              gemini: { title: 'Google Gemini', subtitle: 'Fast & High Accuracy' },
              openai: { title: 'OpenAI GPT-4o', subtitle: 'Vision Enabled' },
              anthropic: { title: 'Anthropic Claude', subtitle: 'Claude 3.5 Sonnet' },
              custom: { title: 'Local / Ollama', subtitle: 'OpenAI Compatible' },
            };

            return (
              <button
                key={p}
                onClick={() => handleProviderChange(p)}
                style={{
                  padding: '10px',
                  borderRadius: '8px',
                  border: `1px solid ${isSelected ? '#3B82F6' : '#243046'}`,
                  backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.12)' : '#182234',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 600, color: isSelected ? '#38BDF8' : '#F1F5F9' }}>
                  {labels[p].title}
                </div>
                <div style={{ fontSize: '10px', color: '#64748B', marginTop: '2px' }}>
                  {labels[p].subtitle}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Credentials & Model Config */}
      <div style={{ backgroundColor: '#121827', border: '1px solid #1E293B', borderRadius: '10px', padding: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
          <Key size={14} color="#3B82F6" />
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase' }}>
            API Configuration
          </span>
        </div>

        {/* API Key Input */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '11px', color: '#94A3B8', marginBottom: '4px' }}>
            {provider.toUpperCase()} API Key
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              onBlur={handleSave}
              placeholder={provider === 'custom' ? 'Optional (for local Ollama)' : 'Enter your API key...'}
              style={{
                width: '100%',
                padding: '8px 36px 8px 10px',
                backgroundColor: '#0F172A',
                border: '1px solid #334155',
                borderRadius: '6px',
                color: '#F8FAFC',
                fontSize: '12px',
                outline: 'none',
                fontFamily: 'monospace',
              }}
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: '#64748B',
                cursor: 'pointer',
              }}
            >
              {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          <div style={{ fontSize: '10px', color: '#64748B', marginTop: '3px' }}>
            Stored securely using Windows DPAPI encryption.
          </div>
        </div>

        {/* Model Selector */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <label style={{ fontSize: '11px', color: '#94A3B8' }}>
              Model Selection
            </label>
            <button
              type="button"
              onClick={() => {
                const next = !isCustomModel;
                setIsCustomModel(next);
                if (!next) {
                  setModel(PROVIDER_MODELS[provider][0]);
                  onSave({ model: PROVIDER_MODELS[provider][0] });
                }
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#38BDF8',
                fontSize: '10px',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              {isCustomModel ? 'Choose from presets' : 'Type custom model'}
            </button>
          </div>

          {!isCustomModel ? (
            <select
              value={model}
              onChange={(e) => {
                setModel(e.target.value);
                onSave({ model: e.target.value });
              }}
              style={{
                width: '100%',
                padding: '8px 10px',
                backgroundColor: '#0F172A',
                border: '1px solid #334155',
                borderRadius: '6px',
                color: '#F8FAFC',
                fontSize: '12px',
                outline: 'none',
              }}
            >
              {PROVIDER_MODELS[provider].map((m) => (
                <option key={m} value={m}>
                  {m} {m === 'gemini-flash-lite-latest' ? '(Recommended - Instant & Active)' : m === 'gemini-3.1-flash-lite' ? '(Stable & Fast)' : ''}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={customModelInput}
              onChange={(e) => setCustomModelInput(e.target.value)}
              onBlur={() => {
                if (customModelInput.trim()) {
                  onSave({ model: customModelInput.trim() });
                }
              }}
              placeholder="e.g. gemini-flash-lite-latest or custom model ID"
              style={{
                width: '100%',
                padding: '8px 10px',
                backgroundColor: '#0F172A',
                border: '1px solid #334155',
                borderRadius: '6px',
                color: '#F8FAFC',
                fontSize: '12px',
                outline: 'none',
                fontFamily: 'monospace',
              }}
            />
          )}

          {provider === 'gemini' && (
            <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '4px', lineHeight: '1.4' }}>
              💡 Use <strong>gemini-flash-lite-latest</strong> or <strong>gemini-3.1-flash-lite</strong> for instantaneous vision reasoning.
            </div>
          )}
        </div>

        {/* Custom Endpoint for Ollama / Proxies */}
        {provider === 'custom' && (
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '11px', color: '#94A3B8', marginBottom: '4px' }}>
              Custom Endpoint URL
            </label>
            <input
              type="text"
              value={customEndpoint}
              onChange={(e) => setCustomEndpoint(e.target.value)}
              onBlur={handleSave}
              placeholder="http://localhost:11434/v1/chat/completions"
              style={{
                width: '100%',
                padding: '8px 10px',
                backgroundColor: '#0F172A',
                border: '1px solid #334155',
                borderRadius: '6px',
                color: '#F8FAFC',
                fontSize: '12px',
                outline: 'none',
                fontFamily: 'monospace',
              }}
            />
          </div>
        )}

        {/* Test Connection Button & Message */}
        <div style={{ marginTop: '8px' }}>
          <button
            onClick={handleTestConnection}
            disabled={testStatus.testing}
            style={{
              padding: '6px 14px',
              backgroundColor: '#1E293B',
              border: '1px solid #3B82F6',
              borderRadius: '6px',
              color: '#38BDF8',
              fontSize: '11px',
              fontWeight: 600,
              cursor: testStatus.testing ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Cpu size={12} />
            {testStatus.testing ? 'Testing connection...' : 'Test AI Connection'}
          </button>

          {testStatus.message && (
            <div style={{
              marginTop: '8px',
              padding: '8px 10px',
              borderRadius: '6px',
              backgroundColor: testStatus.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${testStatus.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              fontSize: '11px',
              color: testStatus.success ? '#10B981' : '#F87171',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '6px',
              lineHeight: '1.4',
              wordBreak: 'break-word',
            }}>
              {testStatus.success ? <CheckCircle2 size={14} style={{ marginTop: '1px', flexShrink: 0 }} /> : <AlertCircle size={14} style={{ marginTop: '1px', flexShrink: 0 }} />}
              <span>{testStatus.message}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
