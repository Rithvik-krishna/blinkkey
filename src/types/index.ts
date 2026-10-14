export type AiProvider = 'gemini' | 'openai' | 'anthropic' | 'custom';

export type AppStatus = 'ready' | 'capturing' | 'analyzing' | 'signaling' | 'paused' | 'error';

export interface AppSettings {
  shortcut: string;
  aiProvider: AiProvider;
  apiKey: string;
  model: string;
  customEndpoint?: string;
  ledOnMs: number;
  ledOffMs: number;
  ledGapMs: number;
  soundFeedback: boolean;
  launchAtLogin: boolean;
  startMinimized: boolean;
  selectedDisplayId: string;
  restoreState: boolean;
}

export interface McqOptionMap {
  [key: string]: string;
}

export interface McqResult {
  id: string;
  timestamp: number;
  status: 'success' | 'no_question' | 'error';
  question?: string;
  options?: McqOptionMap;
  selectedOption?: string; // 'A', 'B', 'C', 'D', etc.
  confidence?: number;
  explanation?: string;
  blinkCount?: number;
  errorMessage?: string;
  processingTimeMs?: number;
}

export interface DisplayInfo {
  id: string;
  name: string;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  isPrimary: boolean;
}

export interface BlinkKeyApi {
  getSettings: () => Promise<AppSettings>;
  saveSettings: (settings: Partial<AppSettings>) => Promise<boolean>;
  getDisplays: () => Promise<DisplayInfo[]>;
  testBlink: (count: number, onMs?: number, offMs?: number) => Promise<{ success: boolean; message: string }>;
  getCapsLockState: () => Promise<boolean>;
  testAiConnection: (provider: AiProvider, apiKey: string, model: string, endpoint?: string) => Promise<{ success: boolean; message: string }>;
  triggerWorkflow: () => Promise<void>;
  togglePause: () => Promise<boolean>;
  getStatus: () => Promise<{ status: AppStatus; isPaused: boolean; lastResult?: McqResult }>;
  getHistory: () => Promise<McqResult[]>;
  clearHistory: () => Promise<boolean>;
  onStatusChange: (callback: (data: { status: AppStatus; message?: string; capsLockState?: boolean }) => void) => () => void;
  onResult: (callback: (result: McqResult) => void) => () => void;
  onLog: (callback: (log: { level: 'info' | 'warn' | 'error'; message: string; timestamp: number }) => void) => () => void;
  minimizeToTray: () => Promise<void>;
  quitApp: () => Promise<void>;
}

declare global {
  interface Window {
    blinkkeyApi: BlinkKeyApi;
  }
}
