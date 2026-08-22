import { app, clipboard, Notification, Tray, Menu, globalShortcut } from 'electron';
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
      const worst = findings.reduce((prev, current) => {
        if (current.severity === 'critical') return current;
        if (current.severity === 'high' && prev.severity !== 'critical') return current;
        return prev;
      }, findings[0]);
      console.log(`\n🚨 [ClipCloak Desktop] Secret Copied: ${worst.packId}/${worst.detectorId}`);

      if (Notification.isSupported()) {
        const notif = new Notification({
          title: '🛡️ ClipCloak Alert',
          body: `Sensitive data copied: ${worst.packId}/${worst.detectorId} (${worst.severity.toUpperCase()})\nWe recommend not pasting this in untrusted apps.`,
          actions: [
            { type: 'button', text: 'Clear' },
            { type: 'button', text: 'Redact' }
          ]
        });
        
        notif.on('action', (event, index) => {
          if (index === 0) { // Clear
            clipboard.writeText('');
            console.log('[ClipCloak] User cleared the clipboard.');
          } else if (index === 1) { // Redact
            import('@clipcloak/core').then(({ applyRedaction }) => {
              const safeText = applyRedaction(text, findings);
              clipboard.writeText(safeText);
              console.log('[ClipCloak] User redacted the clipboard content.');
            });
          }
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
  
  // Safe Paste Global Shortcut
  globalShortcut.register('CommandOrControl+Shift+V', () => {
    const text = clipboard.readText();
    if (text) {
      const { findings } = detect(text, ALL_PACKS, { minSeverity: 'medium' });
      if (findings.length > 0) {
        import('@clipcloak/core').then(({ applyRedaction }) => {
          const safeText = applyRedaction(text, findings);
          clipboard.writeText(safeText);
          console.log('[ClipCloak] Safe Paste invoked. Clipboard was redacted.');
          // We don't simulate the paste keystroke because of OS security limitations,
          // but we notify the user that it's safe to paste normally now.
          if (Notification.isSupported()) {
            new Notification({ title: '🛡️ ClipCloak', body: 'Clipboard safely redacted. You can now press Ctrl+V to paste.' }).show();
          }
        });
      } else {
        // If it's already safe, maybe just notify?
        console.log('[ClipCloak] Safe Paste invoked. No secrets found.');
      }
    }
  });

  // Start polling clipboard every 1 second
  setInterval(checkClipboard, 1000);
  console.log('🛡️ ClipCloak Desktop Alpha is running and monitoring clipboard...');
});

// Keep app running in background
app.on('window-all-closed', () => {
  // Do not quit, we are a background app!
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
