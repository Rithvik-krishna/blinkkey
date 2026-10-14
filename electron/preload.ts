import { contextBridge, ipcRenderer } from 'electron';
import { AppSettings, AiProvider, McqResult, DisplayInfo, AppStatus } from '../src/types';

contextBridge.exposeInMainWorld('blinkkeyApi', {
  getSettings: (): Promise<AppSettings> => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings: Partial<AppSettings>): Promise<boolean> => ipcRenderer.invoke('save-settings', settings),
  getDisplays: (): Promise<DisplayInfo[]> => ipcRenderer.invoke('get-displays'),
  testBlink: (count: number, onMs?: number, offMs?: number) => ipcRenderer.invoke('test-blink', { count, onMs, offMs }),
  getCapsLockState: (): Promise<boolean> => ipcRenderer.invoke('get-capslock-state'),
  testAiConnection: (provider: AiProvider, apiKey: string, model: string, endpoint?: string) =>
    ipcRenderer.invoke('test-ai-connection', { provider, apiKey, model, endpoint }),
  triggerWorkflow: (): Promise<void> => ipcRenderer.invoke('trigger-workflow'),
  togglePause: (): Promise<boolean> => ipcRenderer.invoke('toggle-pause'),
  getStatus: () => ipcRenderer.invoke('get-status'),
  getHistory: (): Promise<McqResult[]> => ipcRenderer.invoke('get-history'),
  clearHistory: (): Promise<boolean> => ipcRenderer.invoke('clear-history'),
  minimizeToTray: (): Promise<void> => ipcRenderer.invoke('minimize-to-tray'),
  quitApp: (): Promise<void> => ipcRenderer.invoke('quit-app'),

  onStatusChange: (callback: (data: { status: AppStatus; message?: string; capsLockState?: boolean }) => void) => {
    const handler = (_: any, data: any) => callback(data);
    ipcRenderer.on('status-change', handler);
    return () => {
      ipcRenderer.removeListener('status-change', handler);
    };
  },

  onResult: (callback: (result: McqResult) => void) => {
    const handler = (_: any, data: any) => callback(data);
    ipcRenderer.on('mcq-result', handler);
    return () => {
      ipcRenderer.removeListener('mcq-result', handler);
    };
  },

  onLog: (callback: (log: { level: 'info' | 'warn' | 'error'; message: string; timestamp: number }) => void) => {
    const handler = (_: any, data: any) => callback(data);
    ipcRenderer.on('app-log', handler);
    return () => {
      ipcRenderer.removeListener('app-log', handler);
    };
  },
});
