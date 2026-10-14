using System;
using System.Runtime.InteropServices;
using System.Threading;

namespace BlinkKey.Native
{
    class CapsLockHelper
    {
        [DllImport("user32.dll")]
        static extern short GetKeyState(int nVirtKey);

        [DllImport("user32.dll", SetLastError = true)]
        static extern uint SendInput(uint nInputs, INPUT[] pInputs, int cbSize);

        [DllImport("user32.dll")]
        static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);

        const int VK_CAPITAL = 0x14;
        const int SCAN_CAPITAL = 0x3A;
        const uint KEYEVENTF_KEYUP = 0x0002;
        const int INPUT_KEYBOARD = 1;

        [StructLayout(LayoutKind.Sequential)]
        struct INPUT
        {
            public uint type;
            public KEYBDINPUT ki;
        }

        [StructLayout(LayoutKind.Sequential)]
        struct KEYBDINPUT
        {
            public ushort wVk;
            public ushort wScan;
            public uint dwFlags;
            public uint time;
            public IntPtr dwExtraInfo;
        }

        public static bool IsCapsLockOn()
        {
            return (GetKeyState(VK_CAPITAL) & 1) != 0;
        }

        public static void Toggle()
        {
            try
            {
                INPUT[] inputs = new INPUT[2];
                inputs[0].type = INPUT_KEYBOARD;
                inputs[0].ki.wVk = VK_CAPITAL;
                inputs[0].ki.wScan = SCAN_CAPITAL;
                inputs[0].ki.dwFlags = 0;

                inputs[1].type = INPUT_KEYBOARD;
                inputs[1].ki.wVk = VK_CAPITAL;
                inputs[1].ki.wScan = SCAN_CAPITAL;
                inputs[1].ki.dwFlags = KEYEVENTF_KEYUP;

                SendInput(2, inputs, Marshal.SizeOf(typeof(INPUT)));
            }
            catch
            {
                // Fallback to keybd_event
                keybd_event((byte)VK_CAPITAL, (byte)SCAN_CAPITAL, 0, UIntPtr.Zero);
                Thread.Sleep(10);
                keybd_event((byte)VK_CAPITAL, (byte)SCAN_CAPITAL, KEYEVENTF_KEYUP, UIntPtr.Zero);
            }
        }

        public static void SetState(bool target)
        {
            if (IsCapsLockOn() != target)
            {
                Toggle();
            }
        }

        public static void ExecuteBlink(int count, int onMs, int offMs, bool restoreInitial)
        {
            bool initialState = IsCapsLockOn();
            Console.WriteLine("[BlinkKey Native] Starting " + count + " blinks. Initial CapsLock: " + initialState);

            for (int i = 0; i < count; i++)
            {
                // Turn LED ON (toggle from current state or force on)
                SetState(!initialState);
                Thread.Sleep(onMs);

                // Turn LED OFF
                SetState(initialState);
                if (i < count - 1)
                {
                    Thread.Sleep(offMs);
                }
            }

            if (restoreInitial)
            {
                SetState(initialState);
                Console.WriteLine("[BlinkKey Native] Restored CapsLock state: " + IsCapsLockOn());
            }
        }

        static int Main(string[] args)
        {
            if (args.Length == 0)
            {
                Console.WriteLine("Usage: CapsLockHelper.exe [--get | --toggle | --set on/off | --blink <count> <onMs> <offMs> [--restore] | --interactive]");
                return 0;
            }

            string cmd = args[0].ToLowerInvariant();

            if (cmd == "--get" || cmd == "-g")
            {
                Console.WriteLine(IsCapsLockOn() ? "1" : "0");
                return IsCapsLockOn() ? 1 : 0;
            }

            if (cmd == "--toggle" || cmd == "-t")
            {
                Toggle();
                Console.WriteLine(IsCapsLockOn() ? "1" : "0");
                return 0;
            }

            if (cmd == "--set" && args.Length >= 2)
            {
                bool target = args[1].Equals("on", StringComparison.OrdinalIgnoreCase) || args[1] == "1";
                SetState(target);
                Console.WriteLine(IsCapsLockOn() ? "1" : "0");
                return 0;
            }

            if (cmd == "--blink" && args.Length >= 4)
            {
                int count = int.Parse(args[1]);
                int onMs = int.Parse(args[2]);
                int offMs = int.Parse(args[3]);
                bool restore = true;
                if (args.Length >= 5 && args[4].ToLowerInvariant() == "--no-restore")
                {
                    restore = false;
                }
                ExecuteBlink(count, onMs, offMs, restore);
                return 0;
            }

            if (cmd == "--interactive" || cmd == "-i")
            {
                Console.WriteLine("READY");
                string line;
                while ((line = Console.ReadLine()) != null)
                {
                    line = line.Trim();
                    if (string.IsNullOrEmpty(line)) continue;
                    if (line.Equals("exit", StringComparison.OrdinalIgnoreCase) || line.Equals("quit", StringComparison.OrdinalIgnoreCase))
                    {
                        break;
                    }
                    string[] parts = line.Split(' ');
                    string subCmd = parts[0].ToLowerInvariant();
                    if (subCmd == "get")
                    {
                        Console.WriteLine(IsCapsLockOn() ? "1" : "0");
                    }
                    else if (subCmd == "toggle")
                    {
                        Toggle();
                        Console.WriteLine(IsCapsLockOn() ? "1" : "0");
                    }
                    else if (subCmd == "blink" && parts.Length >= 4)
                    {
                        int cnt = int.Parse(parts[1]);
                        int onM = int.Parse(parts[2]);
                        int offM = int.Parse(parts[3]);
                        ExecuteBlink(cnt, onM, offM, true);
                        Console.WriteLine("DONE");
                    }
                    else
                    {
                        Console.WriteLine("UNKNOWN_COMMAND");
                    }
                }
                return 0;
            }

            return 0;
        }
    }
}
