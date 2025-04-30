// resources/freeroam/server/index.js (Başlangıç Modeli Eklendi)
import * as alt from 'alt-server';

// --- Sabitler ve Veriler ---
const spawnableVehicles = [
    'adder', 'zentorno', 'turismor', 'cheetah', 'entityxf', 'fmj', 't20',
    'osiris', 'sultanrs', 'banshee', 'jester', 'elegy2', 'comet2', 'ninef',
    'carbonizzare', 'bati', 'akuma', 'sanchez', 'hakuchou', 'faggio', 'kuruma',
    'insurgent', 'sultan', 'sandking', 'rebel'
].map(v => v.toLowerCase());
const lastDeathPosition = new Map();

// --- Zaman Damgası ---
function getTimeStamp() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    return `~s~[${hours}:${minutes}:${seconds}]~w~`;
}

// --- Yardımcı Fonksiyonlar ---
function sendSystemMessage(player, message) {
    if (player && player.valid) {
        alt.emitClient(player, 'chat:Receive', null, `${getTimeStamp()} ${message}`);
    }
}

function broadcastMessage(senderName, message) {
    const timestamp = getTimeStamp();
    alt.emitAllClients('chat:Receive', senderName, `${timestamp} ${message}`);
    alt.log(`[Sohbet] ${senderName}: ${message}`);
}

// --- Freeroam Komut İşleyici ---
function handleFreeroamCommand(player, command, args) {
    if (command === 'model') { if (!args || args.length === 0) { sendSystemMessage(player, `~r~Kullanım: /model [model adı]`); sendSystemMessage(player, `~y~Örnekler: mp_m_freemode_01, a_c_husky, ig_michael`); return; } const modelName = args[0]; try { player.model = alt.hash(modelName); sendSystemMessage(player, `~g~Model ${modelName} olarak değiştirildi.`); } catch (e) { sendSystemMessage(player, `~r~Model değiştirilemedi (${modelName}).`); } }
    else if (command === 'veh' || command === 'arac' || command === 'araç') { if (!args || args.length === 0) { sendSystemMessage(player, `~r~Kullanım: /veh [araç modeli]`); sendSystemMessage(player, `~y~Örnekler: adder, zentorno, bati, kuruma, sultan`); return; } const requestedVehicle = args[0]; const requestedVehicleLower = requestedVehicle.toLowerCase(); if (spawnableVehicles.includes(requestedVehicleLower)) { try { const heading = player.rot.z; const offsetX = Math.sin(-heading) * 3.0; const offsetY = Math.cos(-heading) * 3.0; const spawnPos = new alt.Vector3(player.pos.x + offsetX, player.pos.y + offsetY, player.pos.z + 0.5); const vehicleRot = new alt.Vector3(0, 0, heading); const vehicle = new alt.Vehicle(requestedVehicle, spawnPos, vehicleRot); if (vehicle) sendSystemMessage(player, `~g~${requestedVehicle} oluşturuldu.`); else sendSystemMessage(player, `~r~Hata: ${requestedVehicle} modeli oluşturulamadı.`); } catch (e) { sendSystemMessage(player, `~r~Araç (${requestedVehicle}) oluşturulurken bir sunucu hatası oluştu.`); } } else { sendSystemMessage(player, `~r~Hata: '${requestedVehicle}' modelini spawn etme izniniz yok.`); } }
    else if (command === 'respawn') { const deathData = lastDeathPosition.get(player.id); let spawnPos = new alt.Vector3(-1037.9, -2737.6, 13.8); let heading = 0; if (deathData) { spawnPos = deathData.pos; heading = deathData.rot.z; } player.spawn(spawnPos, 500); alt.setTimeout(() => { if (player && player.valid) { player.health = player.maxHealth; player.armour = 100; player.rot = new alt.Vector3(0, 0, heading); sendSystemMessage(player, '~g~Yeniden doğdun!'); } }, 600); }
    else if (command === 'fixgravity' || command === 'fizikduzelt') { alt.log(`[Freeroam] ${player.name} fizik sıfırlama komutunu kullandı.`); alt.emitClient(player, 'freeroam:ResetPhysics'); sendSystemMessage(player, '~g~Fizik durumu sıfırlanıyor...'); } // fixgravity komutu burada
    else if (command === 'help' || command === 'yardim' || command === 'yardım') { sendSystemMessage(player, '~y~Kullanılabilir Komutlar:'); sendSystemMessage(player, '~w~/model [modeladı]~s~ - Karakter modelini değiştirir.'); sendSystemMessage(player, '~w~/veh [model]~s~ - İzin verilen bir aracı oluşturur.'); sendSystemMessage(player, '~w~/respawn~s~ - Son ölüm noktasında yeniden doğarsın.'); sendSystemMessage(player, '~w~/pos~s~ - Mevcut konumunuzu gösterir.'); sendSystemMessage(player, '~w~/fixgravity:~s~ Yerçekimi sorununu düzeltmeyi dener.'); sendSystemMessage(player, '~s~(Admin komutları için /ahelp yazın)'); }
    else if (command === 'pos' || command === 'konum') { const pos = player.pos; const rot = player.rot; const roundedPos = `X: ${pos.x.toFixed(2)}, Y: ${pos.y.toFixed(2)}, Z: ${pos.z.toFixed(2)}`; const roundedRot = `RX: ${rot.x.toFixed(2)}, RY: ${rot.y.toFixed(2)}, RZ: ${rot.z.toFixed(2)}`; sendSystemMessage(player, `~b~Konum: ~w~${roundedPos}`); sendSystemMessage(player, `~b~Rotation: ~w~${roundedRot}`); }
}

// --- Özel Komut Olayını Dinleme ---
alt.on('core:processCommand', (player, command, args) => {
    handleFreeroamCommand(player, command, args);
});

// --- Diğer Olaylar ---
alt.on('playerConnect', (player) => {
    alt.log(`~g~[Bağlandı]~w~ Oyuncu ${player.name} (ID: ${player.id}) sunucuya katıldı.`);

    // **** YENİ: Oyuncu modelini ayarla ****
    try {
        player.model = alt.hash('g_m_y_armgoon_02'); // İstenen model adı
        alt.log(`[Freeroam] ${player.name} modeli 'g_m_y_armgoon_02' olarak ayarlandı.`);
    } catch (e) {
        alt.logError(`[Freeroam] Model ayarlanamadı: ${e}`);
        // Varsayılan modele dönebilir veya başka bir model atanabilir
        // player.model = alt.hash('mp_m_freemode_01');
    }

    const spawnPos = new alt.Vector3(-1037.9, -2737.6, 13.8);
    player.spawn(spawnPos, 500); // Model ayarlandıktan sonra spawn et

    sendSystemMessage(player, `~b~Sunucuya hoş geldin, ${player.name}!`);
    sendSystemMessage(player, `~y~Sohbet için 'T' tuşuna bas.`);
    sendSystemMessage(player, `~y~Komutlar için '/help' yazabilirsin.`);
    broadcastMessage("~y~Sunucu", `${player.name} katıldı.`);

    // Fizik sıfırlama isteği (önceki adımdan)
    alt.setTimeout(() => {
        if (player && player.valid) {
             alt.log(`[Freeroam] Yeni bağlanan oyuncu ${player.name} için fizik sıfırlama isteği gönderiliyor.`);
             alt.emitClient(player, 'freeroam:ResetPhysics');
        }
    }, 1000);
});

alt.on('playerDeath', (player, killer, weapon) => { alt.log(`~r~[Ölüm]~w~ ${player.name} öldü.`); lastDeathPosition.set(player.id, { pos: player.pos, rot: player.rot }); sendSystemMessage(player, '~y~Yeniden doğmak için /respawn yazabilirsin.'); });
alt.on('playerDisconnect', (player, reason) => { alt.log(`~r~[Ayrıldı]~w~ Oyuncu ${player.name} (ID: ${player.id}) ayrıldı. Sebep: ${reason}`); broadcastMessage("~y~Sunucu", `${player.name} ayrıldı.`); if(lastDeathPosition.has(player.id)) { lastDeathPosition.delete(player.id); } });

// --- Sohbet Mesajı Yönetimi ---
alt.onClient('chat:Send', (player, message) => { if (!player || !player.valid || !message || typeof message !== 'string') return; message = message.trim(); if (message.length === 0) return; if (message.length > 100) message = message.substring(0, 100); if (message.startsWith('/')) { const args = message.substring(1).split(' '); const command = args.shift().toLowerCase(); if (command.length > 0) { alt.log(`[Chat->Custom Event Emit] ${player.name} tetikledi: /${command} ${args.join(' ')}`); alt.emit('core:processCommand', player, command, args); } else { sendSystemMessage(player, '~r~Geçersiz komut formatı.'); } } else { broadcastMessage(player.name, message); } });

lastDeathPosition.clear();
alt.log("~g~Freeroam sunucu betiği (Başlangıç Modeli Eklendi) başarıyla yüklendi!");

// Kaynak başlangıcında fizik sıfırlama (önceki adımdan)
alt.log("[Freeroam] Kaynak başlatıldı. Bağlı oyuncular için fizik sıfırlama deneniyor...");
for (const player of alt.Player.all) { if (player && player.valid) { alt.log(`[Freeroam] Oyuncu ${player.name} için fizik sıfırlama isteği gönderiliyor (Kaynak Başlangıcı).`); alt.emitClient(player, 'freeroam:ResetPhysics'); } }
alt.log("[Freeroam] Başlangıç fizik sıfırlama istekleri gönderildi.");