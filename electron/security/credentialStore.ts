import { app, safeStorage } from 'electron';
import fs from 'fs';
import path from 'path';
import { AppSettings } from '../../src/types';

const defaultSettings: AppSettings = {
  shortcut: 'CommandOrControl+Shift+Space',
  aiProvider: 'gemini',
  apiKey: '',
  model: 'gemini-flash-lite-latest',
  customEndpoint: '',
  ledOnMs: 200,
  ledOffMs: 200,
  ledGapMs: 800,
  soundFeedback: false,
  launchAtLogin: false,
  startMinimized: true,
  selectedDisplayId: 'primary',
  restoreState: true,
};

export class SettingsManager {
  private configPath: string;
  private settings: AppSettings;

  constructor() {
    const userDataPath = app.getPath('userData');
    this.configPath = path.join(userDataPath, 'blinkkey-config.json');
    this.settings = this.load();
  }

  public getSettings(): AppSettings {
    return { ...this.settings };
  }

  public saveSettings(newSettings: Partial<AppSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.persist();
  }

  private persist(): void {
    try {
      const dataToSave = { ...this.settings };

      // Encrypt API key using safeStorage (Windows DPAPI) if available
      if (dataToSave.apiKey && safeStorage.isEncryptionAvailable()) {
        const encrypted = safeStorage.encryptString(dataToSave.apiKey);
        (dataToSave as any).encryptedApiKey = encrypted.toString('base64');
        dataToSave.apiKey = ''; // don't write plaintext key to disk
      }

      fs.writeFileSync(this.configPath, JSON.stringify(dataToSave, null, 2), 'utf-8');
    } catch (err) {
      console.error('[Settings] Failed to save settings:', err);
    }
  }

  private load(): AppSettings {
    try {
      if (fs.existsSync(this.configPath)) {
        const raw = fs.readFileSync(this.configPath, 'utf-8');
        const parsed = JSON.parse(raw);

        let apiKey = parsed.apiKey || '';
        if (parsed.encryptedApiKey && safeStorage.isEncryptionAvailable()) {
          try {
            const buf = Buffer.from(parsed.encryptedApiKey, 'base64');
            apiKey = safeStorage.decryptString(buf);
          } catch (e) {
            console.warn('[Settings] Failed to decrypt saved API key:', e);
          }
        }

        return {
          ...defaultSettings,
          ...parsed,
          apiKey,
        };
      }
    } catch (err) {
      console.warn('[Settings] Error loading config, using defaults:', err);
    }
    return { ...defaultSettings };
  }
}
