import { app, clipboard, Notification, Tray, Menu } from 'electron';
import path from 'path';
import { detect } from '@clipcloak/core';
import genericPack from '@clipcloak/pack-generic';
import brPack from '@clipcloak/pack-br';
import euPack from '@clipcloak/pack-eu';

const ALL_PACKS = [genericPack, brPack, euPack];

let tray: Tray | null = null;
let lastClipboardText = '';

function checkClipboard() {
  const text = clipboard.readText();
  if (text && text !== lastClipboardText) {
    lastClipboardText = text;
    
    const { findings } = detect(text, ALL_PACKS, {
      minSeverity: 'medium',
      context: { filename: 'clipboard' }
    });

    if (findings.length > 0) {
      // Find highest severity
      const worst = findings.reduce((prev, current) => {
        if (current.severity === 'critical') return current;
        if (current.severity === 'high' && prev.severity !== 'critical') return current;
        return prev;
      }, findings[0]);

      if (Notification.isSupported()) {
        const notif = new Notification({
          title: '🛡️ ClipCloak Alert',
          body: `Sensitive data copied: ${worst.packId}/${worst.detectorId} (${worst.severity.toUpperCase()})\nWe recommend not pasting this in untrusted apps.`,
          // icon: path.join(__dirname, 'icon.png') // TODO: add icon later
        });
        notif.show();
      } else {
        console.log(`[ClipCloak] Secret copied: ${worst.detectorId}`);
      }
    }
  }
}

app.whenReady().then(() => {
  if (process.platform === 'darwin') {
    app.dock.hide(); // Hide from macOS dock
  }

  // Tray icon
  // For alpha, we use a default blank icon or a simple native image. 
  // We'll skip the actual file and let Electron use a default if null, or just a small colored square?
  // Electron requires a NativeImage or path. For simplicity we skip Tray in MVP or create a dummy NativeImage.
  
  // Start polling clipboard every 1 second
  setInterval(checkClipboard, 1000);
  console.log('🛡️ ClipCloak Desktop Alpha is running and monitoring clipboard...');
});

// Keep app running in background
app.on('window-all-closed', () => {
  // Do not quit, we are a background app!
});
