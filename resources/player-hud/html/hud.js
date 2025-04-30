// resources/player-hud/html/hud.js

const serverNameElement = document.getElementById('server-name');
const playerCountElement = document.getElementById('hud-playercount');
const playerIdElement = document.getElementById('hud-playerid');
const dateElement = document.getElementById('hud-date');
const timeElement = document.getElementById('hud-time');
const wantedLevelElement = document.getElementById('wanted-level');

const MAX_WANTED_LEVEL = 5; // GTA V'de genellikle 5 yıldız

// alt:V olayını dinle
if ('alt' in window) {
    alt.on('hud:UpdateData', (data) => {
        if (serverNameElement) serverNameElement.textContent = data.serverName || 'SERVER ADI';
        if (playerCountElement) playerCountElement.textContent = data.playerCount !== undefined ? data.playerCount : '-';
        if (playerIdElement) playerIdElement.textContent = data.playerId !== undefined ? data.playerId : '-';
        if (dateElement) dateElement.textContent = data.date || '--.--.----';
        if (timeElement) timeElement.textContent = data.time || '--:--';

        // Aranma seviyesi yıldızlarını oluştur
        if (wantedLevelElement) {
            let starsHTML = '';
            const wanted = data.wantedLevel || 0;
            for (let i = 1; i <= MAX_WANTED_LEVEL; i++) {
                if (i <= wanted) {
                    starsHTML += '<span class="star-active">★</span>'; // Dolu yıldız
                } else {
                    starsHTML += '<span class="star-inactive">☆</span>'; // Boş yıldız
                }
            }
            wantedLevelElement.innerHTML = starsHTML;
        }
    });

    // Başlangıç değerleri
    if (serverNameElement) serverNameElement.textContent = 'YÜKLENİYOR...';
    if (timeElement) timeElement.textContent = '--:--';
    if (dateElement) dateElement.textContent = '----------';
    if (playerCountElement) playerCountElement.textContent = '-';
    if (playerIdElement) playerIdElement.textContent = '-';
    if (wantedLevelElement) wantedLevelElement.innerHTML = '☆☆☆☆☆'; // Başlangıçta boş yıldızlar

    alt.emit('hud:WebViewReady');
} else {
    // Tarayıcıda test için örnek veriler
    if (serverNameElement) serverNameElement.textContent = 'TEST.SERVER';
    if (timeElement) timeElement.textContent = '12:34';
    if (dateElement) dateElement.textContent = '30 Nisan 2025';
    if (playerCountElement) playerCountElement.textContent = '63';
    if (playerIdElement) playerIdElement.textContent = '683';
    if (wantedLevelElement) wantedLevelElement.innerHTML = '<span class="star-active">★</span><span class="star-active">★</span><span class="star-inactive">☆</span><span class="star-inactive">☆</span><span class="star-inactive">☆</span>';
}