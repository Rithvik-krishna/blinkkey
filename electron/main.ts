import { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain } from 'electron';
import path from 'path';
import { SettingsManager } from './security/credentialStore';
import { CapsLockController } from './keyboard/capsLockController';
import { ScreenCaptureEngine } from './capture/screenCapture';
import { AiService } from './services/aiProvider';
import { ShortcutManager } from './shortcuts/globalShortcut';
import { AppStatus, McqResult } from '../src/types';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;
let currentStatus: AppStatus = 'ready';
let isPaused = false;
let history: McqResult[] = [];

const settingsManager = new SettingsManager();
const capsController = new CapsLockController();
let shortcutManager: ShortcutManager;

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    // When someone tries to run a second instance, reveal the main window
    showMainWindow();
  });
}

function getAssetPath(filename: string): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'assets', filename);
  }
  return path.join(app.getAppPath(), 'assets', filename);
}

function logToRenderer(level: 'info' | 'warn' | 'error', message: string): void {
  console.log(`[BlinkKey ${level.toUpperCase()}] ${message}`);
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('app-log', {
      level,
      message,
      timestamp: Date.now(),
    });
  }
}

function updateStatus(status: AppStatus, message?: string): void {
  currentStatus = status;
  const capsState = capsController.getCapsLockState();

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('status-change', {
      status,
      message,
      capsLockState: capsState,
    });
  }

  updateTrayMenu();
}

function updateTrayMenu(): void {
  if (!tray) return;

  let statusLabel = 'Status: Ready';
  if (isPaused) {
    statusLabel = 'Status: Paused';
  } else if (currentStatus === 'capturing') {
    statusLabel = 'Status: Capturing Screen...';
  } else if (currentStatus === 'analyzing') {
    statusLabel = 'Status: Analyzing MCQ...';
  } else if (currentStatus === 'signaling') {
    statusLabel = 'Status: Signaling Answer (LED)';
  } else if (currentStatus === 'error') {
    statusLabel = 'Status: Processing Error';
  }

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open BlinkKey',
      click: () => showMainWindow(),
    },
    { type: 'separator' },
    {
      label: statusLabel,
      enabled: false,
    },
    {
      label: isPaused ? 'Resume Processing' : 'Pause Processing',
      click: () => {
        isPaused = !isPaused;
        updateStatus(isPaused ? 'paused' : 'ready');
        logToRenderer('info', isPaused ? 'Processing paused by user' : 'Processing resumed');
      },
    },
    { type: 'separator' },
    {
      label: 'Trigger Now (Capture & Solve)',
      click: () => executeMcqPipeline(),
    },
    {
      label: 'Settings',
      click: () => showMainWindow(),
    },
    { type: 'separator' },
    {
      label: 'Test Caps Lock LED (3 blinks - Option C)',
      click: async () => {
        const s = settingsManager.getSettings();
        await capsController.blink(3, s.ledOnMs, s.ledOffMs, s.restoreState);
      },
    },
    { type: 'separator' },
    {
      label: 'Quit BlinkKey',
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setToolTip(`BlinkKey - AI MCQ Assistant (${statusLabel.replace('Status: ', '')})`);
  tray.setContextMenu(contextMenu);
}

function showMainWindow(): void {
  if (!mainWindow) return;
  mainWindow.show();
  mainWindow.setSkipTaskbar(false);
  mainWindow.focus();
}

function hideMainWindow(): void {
  if (!mainWindow) return;
  mainWindow.hide();
  mainWindow.setSkipTaskbar(true);
}

async function executeMcqPipeline(): Promise<void> {
  if (isPaused) {
    logToRenderer('warn', 'Shortcut ignored: BlinkKey is currently paused');
    return;
  }

  if (capsController.isBusy() || currentStatus === 'capturing' || currentStatus === 'analyzing' || currentStatus === 'signaling') {
    logToRenderer('warn', 'Request ignored: Previous MCQ request is still being processed');
    return;
  }

  const settings = settingsManager.getSettings();
  if (!settings.apiKey && settings.aiProvider !== 'custom') {
    logToRenderer('error', `Cannot process: No API key configured for ${settings.aiProvider.toUpperCase()}`);
    showMainWindow();
    return;
  }

  try {
    // 1. Capture screen
    updateStatus('capturing', 'Capturing screen content...');
    logToRenderer('info', 'Screen capture triggered via shortcut');
    const { base64Image } = await ScreenCaptureEngine.captureScreen(settings.selectedDisplayId);

    // 2. AI Reasoning
    updateStatus('analyzing', `Sending to ${settings.aiProvider.toUpperCase()} (${settings.model})...`);
    logToRenderer('info', `Analyzing screen with ${settings.aiProvider.toUpperCase()} vision model...`);

    const result = await AiService.analyzeScreen(
      settings.aiProvider,
      settings.apiKey,
      settings.model,
      base64Image,
      settings.customEndpoint
    );

    // Store in history
    history.unshift(result);
    if (history.length > 30) history.pop();

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('mcq-result', result);
    }

    if (result.status === 'success' && result.blinkCount && result.blinkCount > 0) {
      logToRenderer(
        'info',
        `Answer identified: Option ${result.selectedOption} (${result.blinkCount} blinks). Signaling via Caps Lock LED...`
      );
      updateStatus('signaling', `Signaling Option ${result.selectedOption} (${result.blinkCount} blinks)...`);

      // 3. LED Signaling
      await capsController.blink(
        result.blinkCount,
        settings.ledOnMs,
        settings.ledOffMs,
        settings.restoreState,
        (step, isLedOn) => {
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('status-change', {
              status: 'signaling',
              capsLockState: isLedOn,
              message: `Blink ${step}/${result.blinkCount} (${isLedOn ? 'LED ON' : 'LED OFF'})`,
            });
          }
        }
      );

      logToRenderer('info', `Blink sequence complete for Option ${result.selectedOption}. Keyboard state restored.`);
    } else if (result.status === 'no_question') {
      logToRenderer('warn', 'No multiple-choice question detected on screen. Caps Lock LED not signaled.');
    } else {
      logToRenderer('error', `MCQ processing returned error: ${result.errorMessage || 'Unknown error'}`);
    }

    updateStatus('ready');
  } catch (err: any) {
    logToRenderer('error', `Error during processing: ${err.message || err}`);
    updateStatus('error', err.message);
    setTimeout(() => {
      if (currentStatus === 'error') updateStatus('ready');
    }, 4000);
  }
}

function createWindow(): void {
  const iconPath = getAssetPath('icon.ico');
  const appIcon = nativeImage.createFromPath(iconPath);

  mainWindow = new BrowserWindow({
    width: 480,
    height: 700,
    minWidth: 440,
    minHeight: 600,
    show: false, // Requirement: starts hidden by default
    skipTaskbar: true, // Hidden-first background utility
    icon: appIcon,
    frame: true,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(app.getAppPath(), 'dist', 'index.html'));
  }

  // Intercept window close: hide instead of exiting
  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault();
      hideMainWindow();
    }
  });

  // If user configured startMinimized = false, show the window on launch
  const currentSettings = settingsManager.getSettings();
  if (!currentSettings.startMinimized) {
    showMainWindow();
  }
}

function createTray(): void {
  const iconPath = getAssetPath('icon.ico');
  let trayIcon = nativeImage.createFromPath(iconPath);
  if (trayIcon.isEmpty()) {
    // fallback to png
    trayIcon = nativeImage.createFromPath(getAssetPath('icon.png'));
  }

  tray = new Tray(trayIcon);
  updateTrayMenu();

  // Left click opens the settings window
  tray.on('click', () => {
    if (mainWindow && mainWindow.isVisible()) {
      hideMainWindow();
    } else {
      showMainWindow();
    }
  });
}

function setupIpc(): void {
  ipcMain.handle('get-settings', () => settingsManager.getSettings());

  ipcMain.handle('save-settings', (_, newSettings) => {
    settingsManager.saveSettings(newSettings);

    // Apply startup at login preference
    if (typeof newSettings.launchAtLogin === 'boolean') {
      try {
        app.setLoginItemSettings({
          openAtLogin: newSettings.launchAtLogin,
          openAsHidden: true,
        });
      } catch (e) {
        console.warn('Failed to update login item settings:', e);
      }
    }

    // Re-register shortcut if changed
    if (newSettings.shortcut && shortcutManager) {
      shortcutManager.register(newSettings.shortcut);
    }

    return true;
  });

  ipcMain.handle('get-displays', () => ScreenCaptureEngine.getDisplays());

  ipcMain.handle('test-blink', async (_, { count, onMs, offMs }) => {
    const s = settingsManager.getSettings();
    return await capsController.blink(
      count,
      onMs || s.ledOnMs,
      offMs || s.ledOffMs,
      s.restoreState,
      (step, isLedOn) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('status-change', {
            status: 'signaling',
            capsLockState: isLedOn,
            message: `Test blink ${step}/${count}`,
          });
        }
      }
    );
  });

  ipcMain.handle('get-capslock-state', () => capsController.getCapsLockState());

  ipcMain.handle('test-ai-connection', async (_, { provider, apiKey, model, endpoint }) => {
    return await AiService.testConnection(provider, apiKey, model, endpoint);
  });

  ipcMain.handle('trigger-workflow', async () => {
    await executeMcqPipeline();
  });

  ipcMain.handle('toggle-pause', () => {
    isPaused = !isPaused;
    updateStatus(isPaused ? 'paused' : 'ready');
    return isPaused;
  });

  ipcMain.handle('get-status', () => ({
    status: currentStatus,
    isPaused,
    lastResult: history[0],
  }));

  ipcMain.handle('get-history', () => history);

  ipcMain.handle('clear-history', () => {
    history = [];
    return true;
  });

  ipcMain.handle('minimize-to-tray', () => {
    hideMainWindow();
  });

  ipcMain.handle('quit-app', () => {
    isQuitting = true;
    app.quit();
  });
}

// App lifecycle
app.whenReady().then(() => {
  setupIpc();
  createWindow();
  createTray();

  const settings = settingsManager.getSettings();

  // Register global shortcut
  shortcutManager = new ShortcutManager(() => {
    executeMcqPipeline();
  });
  const regResult = shortcutManager.register(settings.shortcut);
  logToRenderer('info', regResult.message);

  // Set startup at login if previously enabled
  if (settings.launchAtLogin) {
    try {
      app.setLoginItemSettings({
        openAtLogin: true,
        openAsHidden: true,
      });
    } catch {}
  }

  logToRenderer('info', `BlinkKey initialized. Running in system tray. Shortcut: ${settings.shortcut}`);
});

app.on('will-quit', () => {
  // Ensure keyboard state is restored if quit during operation
  if (capsController) {
    try {
      capsController.cancelBlink();
    } catch {}
  }
  if (shortcutManager) {
    shortcutManager.unregisterAll();
  }
});

app.on('window-all-closed', () => {
  // On Windows, keep app running in tray when window is closed/hidden
});
