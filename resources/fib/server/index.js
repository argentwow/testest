// resources/fib/server/index.js (Native Import Kaldırıldı)
import * as alt from 'alt-server';
// import * as native from 'natives'; // **** BU SATIR KALDIRILDI ****

// FIB Garajından alınabilecek araçlar ve görünen isimleri
const fibVehicles = [
    { name: "FIB Buffalo", model: "fbi" },
    { name: "FIB Granger", model: "fbi2" },
    { name: "Siyah Stanier", model: "stanier" }, // 'stanier' olarak düzeltildi (varsa)
    { name: "Zırhlı Kuruma", model: "kuruma" },
    { name: "Siyah Oracle", model: "oracle2" },
    { name: "Siyah Granger", model: "granger" },
    { name: "Siyah Gauntlet", model: "gauntlet" },
    { name: "Siyah Buffalo", model: "buffalo" }, // normal buffalo fbi değil
    { name: "Siyah Baller", model: "baller2" }, // baller2 daha uygun olabilir
    { name: "Siyah Washington", model: "washington" }
];

// İstemciden gelen araç spawn isteğini dinle
alt.onClient('fib:RequestVehicleSpawn', (player, modelName, spawnPos, spawnHeading) => {
    if (!player || !player.valid) return;
    if (player.getStreamSyncedMeta('faction') !== 'FIB') { alt.emitClient(player, 'admin:Notify', '~r~Yetkiniz yok (FIB).'); return; }
    const vehicleData = fibVehicles.find(v => v.model.toLowerCase() === modelName.toLowerCase());
    if (!vehicleData) { alt.emitClient(player, 'admin:Notify', '~r~Geçersiz araç modeli.'); return; }

    // Pozisyon ve rotasyon objelerini oluştur
    // İstemciden gelen verinin Vector3 olduğundan emin olalım (veya yeniden oluşturalım)
    const position = new alt.Vector3(spawnPos.x, spawnPos.y, spawnPos.z);
    const rotation = new alt.Vector3(0, 0, spawnHeading * (Math.PI / 180)); // Heading radyana çevrildi

    alt.log(`[FIB] ${player.name}, ${vehicleData.name} (${modelName}) spawn isteği gönderdi.`);

    try {
        const vehicle = new alt.Vehicle(vehicleData.model, position, rotation);
        if (vehicle) {
            alt.log(`[FIB] Araç başarıyla spawn edildi: ${modelName}`);
            vehicle.lockState = 2;
            alt.setVehicleNumberPlateText(vehicle, "FIB"); // alt.Vehicle metodu var mı kontrol etmeli? Evet, var.
            alt.setTimeout(() => {
                if (!vehicle || !vehicle.valid) return;
                 try {
                     vehicle.modKit = 1;
                     vehicle.primaryColor = 0; vehicle.secondaryColor = 0; vehicle.windowTint = 1;
                     // native.getVehicleMod yerine max mod index'lerini kullanmak daha güvenli olabilir
                     // Engine (11), Brakes (12), Transmission (13) için max index genellikle 3, 2, 2'dir.
                     alt.setVehicleMod(vehicle, 11, 3); // Engine Max Level
                     alt.setVehicleMod(vehicle, 18, 0); // Turbo On (Index 0 = On)
                     alt.setVehicleMod(vehicle, 12, 2); // Brakes Max Level
                     alt.setVehicleMod(vehicle, 13, 2); // Transmission Max Level

                     if (modelName.toLowerCase() === 'fbi' || modelName.toLowerCase() === 'fbi2') {
                         alt.emitClient(player, 'fib:ActivateSiren', vehicle);
                     }
                     alt.log(`[FIB] ${modelName} modifiyeleri ayarlandı.`);
                     alt.emitClient(player, 'admin:Notify', `~g~${vehicleData.name} garajdan çıkarıldı.`);
                 } catch (modError) { alt.logError(`[FIB] Modifiye hatası (${modelName}): ${modError}`); }
            }, 1000);
        } else { alt.emitClient(player, 'admin:Notify', '~r~Araç spawn edilemedi.'); alt.logWarning(`[FIB] Araç spawn edilemedi: ${modelName}`); }
    } catch(e) { alt.logError(`[FIB] Araç spawn hatası (${modelName}): ${e}`); alt.emitClient(player, 'admin:Notify', '~r~Araç spawn edilirken hata.'); }
});

alt.log('~g~FIB sunucu betiği (Native Import Fix) başarıyla yüklendi!');

// Diğer olay dinleyicileri (admin-commands'a taşındı)
// alt.on('core:processCommand', ...);
// alt.onClient('admin:ToggleNoclipKeybind', ...);
// alt.onClient('admin:AttemptLogin', ...);
// alt.on('playerDisconnect', ...);
// alt.onClient("noclip:setPos", ...);