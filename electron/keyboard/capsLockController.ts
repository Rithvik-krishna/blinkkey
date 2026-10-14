import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import { spawn, spawnSync, execSync } from 'child_process';

let koffiInstance: any = null;
let GetKeyStateFunc: any = null;
let keybdEventFunc: any = null;

try {
  koffiInstance = require('koffi');
  const user32 = koffiInstance.load('user32.dll');
  GetKeyStateFunc = user32.func('short __stdcall GetKeyState(int nVirtKey)');
  keybdEventFunc = user32.func('void __stdcall keybd_event(uint8 bVk, uint8 bScan, uint32 dwFlags, uintptr dwExtraInfo)');
} catch (e) {
  console.warn('[CapsLock] Koffi FFI load warning, will use native helper:', e);
}

const VK_CAPITAL = 0x14;
const SCAN_CAPITAL = 0x3a;
const KEYEVENTF_KEYUP = 0x0002;

export class CapsLockController {
  private isBlinking: boolean = false;
  private cancelRequested: boolean = false;
  private helperPath: string;

  constructor() {
    // Locate the native C# helper
    const isDev = !app.isPackaged;
    if (isDev) {
      this.helperPath = path.join(app.getAppPath(), 'extraResources', 'blinkey-helper.exe');
    } else {
      this.helperPath = path.join(process.resourcesPath, 'extraResources', 'blinkey-helper.exe');
      if (!fs.existsSync(this.helperPath)) {
        this.helperPath = path.join(app.getAppPath(), 'extraResources', 'blinkey-helper.exe');
      }
    }
  }

  public getCapsLockState(): boolean {
    // 1. Try Koffi GetKeyState
    if (GetKeyStateFunc) {
      try {
        const state = GetKeyStateFunc(VK_CAPITAL);
        return (state & 1) !== 0;
      } catch (err) {
        // fallback
      }
    }

    // 2. Try native helper
    if (fs.existsSync(this.helperPath)) {
      try {
        const res = spawnSync(this.helperPath, ['--get'], { encoding: 'utf-8', timeout: 1000 });
        if (res.stdout) {
          return res.stdout.trim().startsWith('1');
        }
      } catch (e) {
        // fallback
      }
    }

    // 3. PowerShell fallback
    try {
      const out = execSync('powershell -NoProfile -Command "[Console]::CapsLock"', { encoding: 'utf-8', timeout: 1500 });
      return out.trim().toLowerCase() === 'true';
    } catch (e) {
      return false;
    }
  }

  public toggleCapsLock(): void {
    // 1. Try Koffi
    if (keybdEventFunc) {
      try {
        keybdEventFunc(VK_CAPITAL, SCAN_CAPITAL, 0, 0);
        keybdEventFunc(VK_CAPITAL, SCAN_CAPITAL, KEYEVENTF_KEYUP, 0);
        return;
      } catch (e) {
        // fallback
      }
    }

    // 2. Try native helper
    if (fs.existsSync(this.helperPath)) {
      try {
        spawnSync(this.helperPath, ['--toggle'], { timeout: 1000 });
        return;
      } catch (e) {
        // fallback
      }
    }

    // 3. PowerShell / VBScript fallback
    try {
      execSync('powershell -NoProfile -Command "$w=New-Object -ComObject WScript.Shell;$w.SendKeys(\'{CAPSLOCK}\')"', { timeout: 1500 });
    } catch (e) {
      console.error('[CapsLock] Failed to toggle caps lock:', e);
    }
  }

  public setCapsLock(target: boolean): void {
    const current = this.getCapsLockState();
    if (current !== target) {
      this.toggleCapsLock();
    }
  }

  public cancelBlink(): void {
    if (this.isBlinking) {
      this.cancelRequested = true;
    }
  }

  public isBusy(): boolean {
    return this.isBlinking;
  }

  public async blink(
    count: number,
    onMs: number = 200,
    offMs: number = 200,
    restoreInitial: boolean = true,
    onStep?: (blinkIndex: number, isLedOn: boolean) => void
  ): Promise<{ success: boolean; message: string }> {
    if (count <= 0) {
      return { success: false, message: 'Invalid blink count (must be >= 1)' };
    }

    if (this.isBlinking) {
      return { success: false, message: 'A blink sequence is already in progress' };
    }

    this.isBlinking = true;
    this.cancelRequested = false;

    // Capture initial state before signaling
    const initialState = this.getCapsLockState();

    try {
      // If we have helper executable and no live progress listener is strictly needed,
      // the helper can run natively with sub-millisecond precision.
      // But if we want interactive feedback in UI, we run with async timer loop:
      for (let i = 0; i < count; i++) {
        if (this.cancelRequested) {
          break;
        }

        // Turn LED ON (or opposite of initial state so it blinks)
        this.setCapsLock(!initialState);
        if (onStep) onStep(i + 1, true);

        await this.delay(onMs);

        // Turn LED OFF
        this.setCapsLock(initialState);
        if (onStep) onStep(i + 1, false);

        if (i < count - 1) {
          await this.delay(offMs);
        }
      }

      // Restore initial state
      if (restoreInitial) {
        this.setCapsLock(initialState);
      }

      return {
        success: !this.cancelRequested,
        message: this.cancelRequested ? 'Blink sequence cancelled' : `Blinked ${count} times successfully`,
      };
    } catch (err: any) {
      // Ensure state is restored even on error
      if (restoreInitial) {
        try {
          this.setCapsLock(initialState);
        } catch {}
      }
      return { success: false, message: err.message || 'Error executing blink sequence' };
    } finally {
      this.isBlinking = false;
      this.cancelRequested = false;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
