// resources/player-hud/client/index.js (Server Name Updated)
import * as alt from 'alt-client';
import * as native from 'natives';

let hudView = null;
let updateInterval = null;

function createHudView() {
    if (hudView) return;
    hudView = new alt.WebView("http://resource/html/hud.html", true);
    hudView.isVisible = true;
    hudView.focus(false);
    alt.log('PLAYER-HUD: HUD WebView oluşturuldu.');
    if (updateInterval === null) {
        updateInterval = alt.setInterval(updateHudData, 1000);
        alt.log('PLAYER-HUD: Veri güncelleme interval başlatıldı.');
    }
}

function destroyHudView() {
    if (updateInterval !== null) { alt.clearInterval(updateInterval); updateInterval = null; alt.log('PLAYER-HUD: Interval durduruldu.'); }
    if (hudView) { hudView.destroy(); hudView = null; alt.log('PLAYER-HUD: HUD WebView yok edildi.'); }
}

function updateHudData() {
    if (!hudView || !alt.Player.local || !alt.Player.local.valid) return;

    try {
        // Zaman (UTC+3, HH:MM formatında)
        const now = new Date();
        const utcHours = now.getUTCHours();
        const istanbulHour = (utcHours + 3) % 24;
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const timeString = `${istanbulHour.toString().padStart(2, '0')}:${minutes}`;

        // Tarih (GG Ay YYYY formatı)
        const day = now.getDate();
        const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
        const monthName = monthNames[now.getMonth()];
        const year = now.getFullYear();
        const dateString = `${day} ${monthName} ${year}`;

        const playerCount = alt.Player.all.length;
        const playerId = alt.Player.local.id;
        const wantedLevel = native.getPlayerWantedLevel(alt.Player.local.scriptID);

        // **** DEĞİŞİKLİK: serverName değeri güncellendi ****
        hudView.emit('hud:UpdateData', {
            serverName: "ARG RP", // Yeni sunucu adı
            time: timeString,
            date: dateString,
            playerCount: playerCount,
            playerId: playerId,
            wantedLevel: wantedLevel
        });
    } catch (e) {
        alt.logError(`PLAYER-HUD: Veri güncelleme hatası: ${e.stack}`);
    }
}

createHudView();
alt.on('resourceStop', destroyHudView);
alt.on('disconnect', destroyHudView);
alt.log('~g~Player HUD istemci betiği yüklendi (v2 - ARG RP).');