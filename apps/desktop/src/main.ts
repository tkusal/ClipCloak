import { app, clipboard, Notification, Tray, Menu, globalShortcut } from 'electron';
import path from 'path';
import { detect, i18n } from '@clipcloak/core';
import genericPack from '@clipcloak/pack-generic';
import brPack from '@clipcloak/pack-br';
import euPack from '@clipcloak/pack-eu';

const ALL_PACKS = [genericPack, brPack, euPack];

const t = {
  alertTitle: { en: 'ClipCloak Alert', pt: 'Alerta ClipCloak' },
  alertBody: { 
    en: 'Sensitive data copied: {0}/{1} ({2})\nWe recommend not pasting this in untrusted apps.',
    pt: 'Dado sensível copiado: {0}/{1} ({2})\nRecomendamos não colar isso em apps não confiáveis.'
  },
  btnClear: { en: 'Clear', pt: 'Limpar' },
  btnRedact: { en: 'Redact', pt: 'Censurar' },
  logCleared: { en: '[ClipCloak] User cleared the clipboard.', pt: '[ClipCloak] Usuário limpou a área de transferência.' },
  logRedacted: { en: '[ClipCloak] User redacted the clipboard content.', pt: '[ClipCloak] Usuário censurou a área de transferência.' },
  safePasteInvoked: { en: '[ClipCloak] Safe Paste invoked. Clipboard was redacted.', pt: '[ClipCloak] Safe Paste acionado. Área de transferência censurada.' },
  safePasteNotif: { en: 'Clipboard safely redacted. You can now press Ctrl+V to paste.', pt: 'Censurado com segurança. Você já pode pressionar Ctrl+V para colar.' },
  safePasteNoSecrets: { en: '[ClipCloak] Safe Paste invoked. No secrets found.', pt: '[ClipCloak] Safe Paste acionado. Nenhum segredo encontrado.' },
  desktopRunning: { en: '[ClipCloak] Desktop Alpha is running and monitoring clipboard...', pt: '[ClipCloak] Desktop Alpha rodando e monitorando área de transferência...' },
};

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

      console.log(`\n[ClipCloak Desktop] Secret Copied: ${worst.packId}/${worst.detectorId}`);

      if (Notification.isSupported()) {
        const notif = new Notification({
          title: i18n.get('alertTitle', t),
          body: i18n.get('alertBody', t, worst.packId, worst.detectorId, worst.severity.toUpperCase()),
          actions: [
            { type: 'button', text: i18n.get('btnClear', t) },
            { type: 'button', text: i18n.get('btnRedact', t) }
          ]
        });
        
        notif.on('action', (event, index) => {
          if (index === 0) { // Clear
            clipboard.writeText('');
            console.log(i18n.get('logCleared', t));
          } else if (index === 1) { // Redact
            import('@clipcloak/core').then(({ applyRedaction }) => {
              const safeText = applyRedaction(text, findings);
              clipboard.writeText(safeText);
              console.log(i18n.get('logRedacted', t));
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

  // Safe Paste Global Shortcut
  globalShortcut.register('CommandOrControl+Shift+V', () => {
    const text = clipboard.readText();
    if (text) {
      const { findings } = detect(text, ALL_PACKS, { minSeverity: 'medium' });
      if (findings.length > 0) {
        import('@clipcloak/core').then(({ applyRedaction }) => {
          const safeText = applyRedaction(text, findings);
          clipboard.writeText(safeText);
          console.log(i18n.get('safePasteInvoked', t));
          if (Notification.isSupported()) {
            new Notification({ title: 'ClipCloak', body: i18n.get('safePasteNotif', t) }).show();
          }
        });
      } else {
        console.log(i18n.get('safePasteNoSecrets', t));
      }
    }
  });

  // Start polling clipboard every 1 second
  setInterval(checkClipboard, 1000);
  console.log(i18n.get('desktopRunning', t));
});

// Keep app running in background
app.on('window-all-closed', () => {
  // Do not quit, we are a background app!
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
