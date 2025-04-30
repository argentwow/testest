// resources/admin-commands/server/index.js (/frac komutu ve faction atama eklendi)
import * as alt from 'alt-server';

const ADMIN_PASSWORD = '1424';

function sendAdminMessage(player, message) { if (player && player.valid) { alt.emitClient(player, 'admin:Notify', message); alt.log(`[AdminCmds][Notify->${player.name}] ${message}`); } }
function togglePlayerNoclip(player) { if (!player || !player.valid || player.getStreamSyncedMeta('isAdmin') !== true) return; const currentNoclipState = player.getMeta('noclip') === true; const newState = !currentNoclipState; player.setMeta('noclip', newState); alt.emitClient(player, 'admin:SetNoclipState', newState); alt.log(`[AdminCmds] <span class="math-inline">\{player\.name\} için admin\:SetNoclipState\(</span>{newState}) olayı gönderildi.`); if (newState) sendAdminMessage(player, '~g~Noclip Aktif!'); else sendAdminMessage(player, '~r~Noclip Pasif!'); }

// --- Komut İşleyici Fonksiyonu ---
function handleAdminCommand(player, command, args) {
    if (command === 'alogin') { if (player.getStreamSyncedMeta('isAdmin') === true) { sendAdminMessage(player, '~y~Zaten yönetici girişi yaptınız.'); return; } alt.emitClient(player, 'admin:ShowLogin'); alt.log(`[AdminCmds] ${player.name} için giriş ekranı isteği gönderildi.`); return; }
    if (player.getStreamSyncedMeta('isAdmin') !== true) return; // Admin kontrolü

    alt.log(`[AdminCmds][Komut] <span class="math-inline">\{player\.name\}\: /</span>{command} ${args.join(' ')}`);

    if (command === 'noclip') { togglePlayerNoclip(player); }
    else if (command === 'fixcar') { if (!player.vehicle) { sendAdminMessage(player, '~r~Bir araçta değilsiniz.'); return; } try { player.vehicle.repair(); sendAdminMessage(player, '~g~Araç tamir edildi.'); } catch (e) { sendAdminMessage(player, '~r~Araç tamir edilemedi.'); } }
    else if (command === 'dc') { if (!player.vehicle) { sendAdminMessage(player, '~r~Silmek için bir araçta olmalısınız.'); return; } try { player.vehicle.destroy(); sendAdminMessage(player, '~g~Araç silindi.'); } catch (e) { sendAdminMessage(player, '~r~Araç silinemedi.'); } }
    else if (command === 'settime') { if (args.length < 2 || isNaN(parseInt(args[0])) || isNaN(parseInt(args[1]))) { sendAdminMessage(player, '~r~Kullanım: /settime [saat] [dk]'); return; } const hour = parseInt(args[0]); const minute = parseInt(args[1]); if (hour < 0 || hour > 23 || minute < 0 || minute > 59) { sendAdminMessage(player, '~r~Geçersiz saat/dakika.'); return; } try { const d = new Date(); alt.setDateTime(d.getDate(), d.getMonth(), d.getFullYear(), hour, minute, 0); sendAdminMessage(player, `~g~Saat <span class="math-inline">\{hour\}\:</span>{minute} ayarlandı.`); } catch (e) { sendAdminMessage(player, '~r~Saat ayarlanamadı.'); } }
    else if (command === 'setweather') { if (args.length < 1) { sendAdminMessage(player, '~r~Kullanım: /setweather [hava]'); return; } const weather = args[0].toUpperCase(); try { alt.setSyncedMeta('weather', weather); sendAdminMessage(player, `~g~Hava durumu ${weather} ayarlandı.`); } catch (e) { sendAdminMessage(player, `~r~Hava ayarlanamadı.`); } }
    else if (command === 'a' || command === 'adminchat') { if (args.length < 1) { sendAdminMessage(player, '~r~Kullanım: /a [mesaj]'); return; } const msg = args.join(' '); for (const p of alt.Player.all) { if (p.valid && p.getStreamSyncedMeta('isAdmin')) alt.emitClient(p, 'admin:AdminChatReceive', player.name, msg); } alt.log(`[AdminChat] ${player.name}: ${msg}`); }
    else if (command === 'announce' || command === 'duyuru') { if (args.length < 1) { sendAdminMessage(player, '~r~Kullanım: /announce [mesaj]'); return; } const msg = args.join(' '); alt.emitAllClients('admin:ShowAnnouncement', `~y~[DUYURU]~w~ ${msg}`); alt.log(`[Duyuru] ${player.name}: ${msg}`); }
    // **** YENİ KOMUT: /frac ****
    else if (command === 'frac' || command === 'fraksiyon') {
         alt.log(`[AdminCmds] ${player.name} fraksiyon menüsünü açtı.`);
         // Şimdilik başka kontrol yok, direkt menüyü göster istemcide
         alt.emitClient(player, 'admin:ShowFactionMenu');
    }
    else if (command === 'ahelp') { sendAdminMessage(player, '~y~Admin Komutları: /noclip(H), /fixcar, /dc, /settime, /setweather, /a, /announce, /frac'); }
}

// --- Olay Dinleyicileri ---
alt.on('core:processCommand', handleAdminCommand);
alt.onClient('admin:ToggleNoclipKeybind', togglePlayerNoclip);
alt.onClient('admin:AttemptLogin', (player, passwordInput) => { if (!player || !player.valid || player.getStreamSyncedMeta('isAdmin')) return; if (passwordInput === ADMIN_PASSWORD) { player.setStreamSyncedMeta('isAdmin', true); sendAdminMessage(player, '~g~Yönetici girişi başarılı!'); alt.emitClient(player, 'admin:CloseLogin', true); } else { sendAdminMessage(player, '~r~Yanlış şifre!'); alt.emitClient(player, 'admin:LoginFailed'); } });
alt.on('playerDisconnect', (player, reason) => { alt.log(`[AdminCmds] ${player.name} ayrıldı.`); });

// **** YENİ: Fraksiyon Seçimini Dinleme ****
alt.onClient('admin:SetFaction', (player, factionName) => {
    if (!player || !player.valid || !player.getStreamSyncedMeta('isAdmin')) return; // Güvenlik kontrolü
    alt.log(`[AdminCmds] ${player.name}, fraksiyonu ${factionName} olarak ayarlama isteği gönderdi.`);
    if (factionName === 'FIB') { // Şimdilik sadece FIB var
        // Oyuncunun meta verisine fraksiyonu işle
        player.setStreamSyncedMeta('faction', 'FIB'); // Herkes bu oyuncunun FIB'de olduğunu görebilir
        // Veya player.setMeta('faction', 'FIB'); // Sadece sunucu ve oyuncu bilir
        sendAdminMessage(player, `~g~Başarıyla ${factionName} fraksiyonuna katıldınız!`);
        alt.log(`[AdminCmds] ${player.name} -> FIB fraksiyonu.`);
        // İstemciye menüyü kapatmasını söyle
        alt.emitClient(player, 'admin:CloseFactionMenu');
    } else {
        sendAdminMessage(player, `~r~Geçersiz fraksiyon seçimi: ${factionName}`);
    }
});

alt.log('~g~Admin Commands kaynağı (frac komutu ile) başarıyla yüklendi!');