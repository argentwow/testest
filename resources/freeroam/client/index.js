// resources/freeroam/client/index.js (Noclip Kaldırıldı)
import * as alt from 'alt-client';
import * as native from 'natives';

// --- WebView ---
const url = `http://resource/html/index.html`;
let view = new alt.WebView(url);
let chatOpened = false;

// Noclip ile ilgili değişkenler kaldırıldı

// --- WebView Olayları ---
view.on('chat:Input', (message) => {
    alt.emitServer('chat:Send', message);
    toggleChat(false);
});
view.on('chat:Closed', () => {
    toggleChat(false);
});
alt.onServer('chat:Receive', (name, message) => {
    if (view) view.emit('chat:AddMessage', name, message);
});

// --- Sohbet Açma/Kapama ---
const chatKey = 84; // T
const cancelKey = 27; // Escape
alt.on('keydown', (key) => {
    // Noclip kontrolü kaldırıldı
    if (alt.isConsoleOpen() || alt.isMenuOpen()) return;
    if (key === chatKey && !chatOpened) {
        toggleChat(true);
    } else if (key === cancelKey && chatOpened) {
        toggleChat(false);
        if (view) view.emit('chat:Toggle', false);
    }
});

function toggleChat(state) {
    if (chatOpened === state) return;
    chatOpened = state;
    alt.showCursor(state);
    // Noclip kontrolü kaldırıldı, sadece sohbet durumuna göre ayarla
    alt.toggleGameControls(!state);
    alt.toggleVoiceControls(!state);
    if (view) {
        view.emit('chat:Toggle', state);
        if (state) {
            alt.nextTick(() => { if (view) view.focus(); });
        } else {
            view.unfocus();
        }
    }
} // toggleChat fonksiyonu sonu

// Noclip ile ilgili olay dinleyiciler ve fonksiyonlar kaldırıldı
// alt.on('metaChange', ...) kaldırıldı
// toggleNoclip() fonksiyonu kaldırıldı
// handleNoclipMovement() fonksiyonu kaldırıldı

// --- Kaynak Durduğunda ---
alt.on('resourceStop', () => {
    // Noclip tick temizleme kaldırıldı
    if (view && view.destroy) { view.destroy(); view = null; }
    if (chatOpened) {
        alt.showCursor(false);
        alt.toggleGameControls(true);
        alt.toggleVoiceControls(true);
        chatOpened = false;
    }
    // Noclip durum sıfırlama kaldırıldı
}); // alt.on resourceStop sonu

alt.log('~g~Freeroam istemci betiği (Noclip olmadan) yüklendi.');