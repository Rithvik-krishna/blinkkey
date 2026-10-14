const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '..', 'extraResources');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const outFile = path.join(outDir, 'blinkey-helper.exe');
const srcFile = path.join(__dirname, '..', 'electron', 'keyboard', 'native', 'CapsLockHelper.cs');
const cscPath = 'C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe';

if (fs.existsSync(cscPath)) {
  console.log('[Build] Compiling native CapsLockHelper with csc.exe...');
  const cmd = `"${cscPath}" /nologo /out:"${outFile}" "${srcFile}"`;
  execSync(cmd, { stdio: 'inherit' });
  console.log('[Build] Successfully generated ' + outFile);
} else {
  console.warn('[Build] csc.exe not found at ' + cscPath);
}
