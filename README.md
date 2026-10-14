# BlinkKey ⚡

> **AI-Powered MCQ Assistant with Physical Keyboard LED Signaling**

BlinkKey is a lightweight, background-first Windows desktop utility that automatically identifies multiple-choice questions (MCQs) displayed anywhere on your screen, processes them with AI reasoning, and discreetly communicates the correct option through a sequence of physical blinks on your keyboard's **Caps Lock indicator LED**.

Instead of displaying popups, intrusive notifications, or requiring window switching, BlinkKey signals the answer silently via physical hardware.

---

## 💡 How It Works

1. **Silent Background Operation**: BlinkKey lives in your Windows System Tray (under the hidden icons `^` menu near your clock and Wi-Fi).
2. **Press Shortcut**: Press `Ctrl + Shift + Space` (customizable) while looking at any MCQ in your browser, PDF reader, or test software.
3. **In-Memory Capture**: BlinkKey captures the active display directly into memory—no temporary image files are ever written to disk.
4. **AI Vision Reasoning**: High-performance vision models (Google Gemini 2.0/1.5 Flash, OpenAI GPT-4o, Anthropic Claude, or local Ollama) identify the question and evaluate the options.
5. **Caps Lock LED Signaling**: The keyboard's Caps Lock LED flashes according to the answer:
   - **Option A** ➔ **1 blink**
   - **Option B** ➔ **2 blinks**
   - **Option C** ➔ **3 blinks**
   - **Option D** ➔ **4 blinks**
   - **Option E** ➔ **5 blinks**
6. **State Restoration**: BlinkKey checks the pre-blink state and automatically restores your original Caps Lock state immediately after signaling.

---

## 🚀 Features

- **Background-First Utility**: Starts minimized to the Windows system tray. Closing the settings window hides it to tray rather than exiting.
- **Configurable Global Shortcut**: Default `Ctrl + Shift + Space`, with key recorder and conflict detection.
- **Multiple Vision AI Providers**:
  - **Google Gemini**: Gemini 2.0 Flash / 1.5 Flash (ultra-fast, native vision reasoning).
  - **OpenAI**: GPT-4o / GPT-4o-mini.
  - **Anthropic**: Claude 3.5 Sonnet / Claude 3.5 Haiku.
  - **Local / Ollama**: OpenAI-compatible custom endpoints.
- **Precision Caps Lock Signaling Engine**:
  - Configurable LED ON duration (default: 200 ms).
  - Configurable LED OFF duration (default: 200 ms).
  - Inter-signal pause (default: 800 ms).
  - State restoration guarantee ensures typing is never disrupted.
  - Optional subtle audio click/tick in sync with blinks (for testing or keyboards without LEDs).
- **Multi-Monitor Support**: Select which display to capture or use primary display.
- **Privacy Architecture**: All screen captures remain strictly in volatile memory. API keys are encrypted with Windows DPAPI (CryptProtectData).
- **System Tray Controls**: Quick Pause/Resume, manual scan trigger, test signal, and settings access.
- **Single Instance Guarantee**: Prevents duplicate processes.

---

## 🛠️ Technology Stack

- **Framework**: Electron 31 + React 18 + TypeScript + Vite
- **Input Simulation**: Windows `SendInput` / Win32 API via `koffi` and bundled native C# helper
- **Styling**: Dark desktop utility aesthetic (`#0B0F1C` background, `#121827` surface, `#3B82F6` electric blue accent)
- **Credential Storage**: Electron `safeStorage` (Windows DPAPI)
- **Packaging**: Electron Builder (Windows x64 Portable + Installer)

---

## 📦 Getting Started

### Prerequisites

- Windows 10 or 11 (64-bit)
- Node.js 18+ and npm

### Installation & Development

```bash
# Clone or navigate to the repository
cd blinkey

# Install dependencies
npm install

# Build all assets (React frontend + Electron TypeScript + Native CapsLock helper)
npm run build

# Run in development mode
npm run dev
```

### Packaging Windows Portable Executable

To generate the standalone Windows x64 portable executable:

```bash
npm run pack:portable
```

The resulting executable will be generated in `release/BlinkKey-Portable-1.0.0.exe`.

---

## ⌨️ Signaling Protocol

| Answer | Blinks | Meaning |
| :--- | :--- | :--- |
| **A** | **1 blink** | First option is correct |
| **B** | **2 blinks** | Second option is correct |
| **C** | **3 blinks** | Third option is correct |
| **D** | **4 blinks** | Fourth option is correct |
| **E** | **5 blinks** | Fifth option is correct |
| **Unknown / None** | **0 blinks** | No multiple-choice question detected |
| **Error** | **0 blinks** | Notification logged in diagnostics console |

---

## 🔒 Privacy & Security

- BlinkKey **never** continuously records your screen. A screenshot is taken **only** when you press the global shortcut.
- Screen buffers are processed strictly in volatile RAM and immediately discarded.
- API keys are stored encrypted on your local machine using Windows DPAPI.
- BlinkKey does not execute any code found in question content.
