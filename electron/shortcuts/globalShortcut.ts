import { globalShortcut } from 'electron';

export class ShortcutManager {
  private currentShortcut: string = '';
  private onTriggerCallback: () => void;

  constructor(onTrigger: () => void) {
    this.onTriggerCallback = onTrigger;
  }

  public register(shortcut: string): { success: boolean; message: string } {
    if (!shortcut) {
      return { success: false, message: 'Shortcut cannot be empty' };
    }

    // Unregister previous
    this.unregister();

    try {
      const registered = globalShortcut.register(shortcut, () => {
        if (this.onTriggerCallback) {
          this.onTriggerCallback();
        }
      });

      if (!registered) {
        return {
          success: false,
          message: `Failed to register shortcut "${shortcut}". It may be reserved or held by another application.`,
        };
      }

      this.currentShortcut = shortcut;
      return { success: true, message: `Shortcut "${shortcut}" registered successfully` };
    } catch (err: any) {
      return { success: false, message: err.message || 'Error registering shortcut' };
    }
  }

  public unregister(): void {
    if (this.currentShortcut) {
      try {
        globalShortcut.unregister(this.currentShortcut);
      } catch {}
      this.currentShortcut = '';
    }
  }

  public unregisterAll(): void {
    try {
      globalShortcut.unregisterAll();
      this.currentShortcut = '';
    } catch {}
  }

  public getCurrentShortcut(): string {
    return this.currentShortcut;
  }
}
