// resources/fib/client/index.js (Marker Fix + Büyük Boyut)
import * as alt from 'alt-client';
import * as native from 'natives';

// **** EKRAN GÖRÜNTÜSÜNDEKİ KOORDİNATLAR ****
const GARAGE_INTERACTION_POS = new alt.Vector3(111.42, -695.68, 33.10);
const VEHICLE_SPAWN_POS = new alt.Vector3(115.0, -698.0, 33.1); // Spawn konumu
const VEHICLE_SPAWN_HEADING = -90.0; // Derece

const INTERACTION_RANGE = 2.5; // Etkileşim mesafesini biraz artırabiliriz
const KEY_E = 69;

let garageView = null;
let isInGarageRange = false;
let isEKeyPressed = false;
let interactionTickId = null;
let blipTickId = null;

// Garaj menüsü fonksiyonları
function createGarageView() { if (garageView) return; garageView = new alt.WebView("http://resource/html/garage.html"); garageView.on('garage:SpawnVehicle', (modelName) => { alt.log(`FIB Client: Spawn: ${modelName}`); alt.emitServer('fib:RequestVehicleSpawn', modelName, VEHICLE_SPAWN_POS, VEHICLE_SPAWN_HEADING); closeGarageView(); }); garageView.on('garage:CloseMenu', () => { closeGarageView(); }); alt.log('FIB Client: Garaj WebView oluşturuldu.'); }
function showGarageView() { if (!garageView) createGarageView(); if (garageView && !alt.isCursorVisible()) { alt.log('FIB Client: Garaj menüsü açılıyor.'); garageView.isVisible = true; alt.toggleGameControls(false); garageView.focus(); alt.showCursor(true); alt.log('FIB Client: İmleç gösterildi, kontroller kapatıldı.'); } else { alt.logError('FIB Client: Menü açılamadı (belki zaten açık?).'); } }
function closeGarageView() { if (garageView && alt.isCursorVisible()) { alt.log('FIB Client: Garaj menüsü kapatılıyor.'); garageView.isVisible = false; garageView.unfocus(); alt.showCursor(false); alt.toggleGameControls(true); alt.log('FIB Client: İmleç gizlendi, kontroller açıldı.'); } }

// Mesafe kontrolü, marker çizimi ve etkileşim için Tick
function interactionTick() {
    const player = alt.Player.local;
    // **** BASİTLEŞTİRİLMİŞ KONTROL: Sadece oyuncu geçerliyse devam et ****
    if (!player || !player.valid) return;

    // Eğer herhangi bir WebView odaklıysa işlem yapma (Login, Faction Menu vb.)
    // Bu kontrol, E tuşuna basınca menünün açılmasını engelleyebilir diye kaldırıldı,
    // yerine showGarageView içine kontrol ekledik.
    // if (alt.isWebViewGpuAccelerated() || alt.isAnyWebViewFocused()) return; // Belki bu daha iyidir?

    const playerPos = player.pos;
    const distance = playerPos.distanceTo(GARAGE_INTERACTION_POS);

    let currentlyInRange = false; // Bu tick'te menzilde miyiz?

    if (distance <= INTERACTION_RANGE) {
        currentlyInRange = true; // Menzildeyiz
        if (!isInGarageRange) {
            alt.log('FIB Client: Garaj menziline girildi.');
            // Yardım metnini sürekli göstermeyi deneyelim (kayboluyorsa diye)
            native.beginTextCommandDisplayHelp("STRING");
            native.addTextComponentSubstringPlayerName("FIB Garajını kullanmak için ~INPUT_CONTEXT~ tuşuna basın.");
            native.endTextCommandDisplayHelp(0, false, true, -1); // Sürekli göster (veya çok uzun süre)
            isInGarageRange = true;
        }

        // 'E' tuşu kontrolü (Menü zaten açık değilse)
        if (!alt.isCursorVisible() && alt.isKeyDown(KEY_E) && !isEKeyPressed) {
            isEKeyPressed = true;
            alt.log('FIB Client: E tuşuna basıldı (menzilde).');
            if (alt.Player.local.getStreamSyncedMeta('faction') === 'FIB') {
                showGarageView();
            } else {
                alt.emit('chat:Receive', null, "~r~Yetkiniz yok (FIB).");
            }
        } else if (!alt.isKeyDown(KEY_E)) {
            isEKeyPressed = false;
        }

        // **** MARKER ÇİZİMİ (Boyut 3 Kat Büyütüldü) ****
        native.drawMarker(
            1, // Tip: Silindir
            GARAGE_INTERACTION_POS.x, GARAGE_INTERACTION_POS.y, GARAGE_INTERACTION_POS.z + 0.1, // Z hala biraz yukarıda
            0, 0, 0, // direction
            0, 0, 0, // rotation
            4.5, 4.5, 1.5, // scale (X, Y, Z - 3 kat büyüdü)
            0, 150, 255, 100, // color (RGBA - Mavi, yarı saydam)
            false, // bobUpAndDown
            false, // faceCamera
            2,    // p19
            false,// rotateY
            null, null, false // textureDict, textureName, drawOnEntities
        );

    }

    // Eğer bu tick'te menzilde değilsek ama önceki tick'te menzildeydiysek
    if (!currentlyInRange && isInGarageRange) {
        isInGarageRange = false;
        alt.log('FIB Client: Garaj menzilinden çıkıldı.');
        // Yardım metnini temizlemek için boş bir help gösterebiliriz (native'e bağlı)
        // native.clearHelp(true); // Bu native var mı emin değilim, yoksa gerekmez.
    }
}

// --- Blip Oluşturma ---
// ... (Değişiklik yok) ...
const FIB_BLIP_POS = new alt.Vector3(135.5, -749.5, 258.15); const BLIP_SPRITE = 487; const BLIP_COLOR = 3; const BLIP_SCALE = 0.8; const BLIP_NAME = "FIB Merkezi"; let fibBlip = null; function createBlip() { if (fibBlip) return; fibBlip = new alt.PointBlip(FIB_BLIP_POS.x, FIB_BLIP_POS.y, FIB_BLIP_POS.z); fibBlip.sprite = BLIP_SPRITE; fibBlip.color = BLIP_COLOR; fibBlip.scale = BLIP_SCALE; fibBlip.name = BLIP_NAME; fibBlip.shortRange = true; alt.log(`FIB: Blip oluşturuldu: ${BLIP_NAME}`); } function destroyBlip() { if (fibBlip) { fibBlip.destroy(); fibBlip = null; alt.log('FIB: Blip yok edildi.'); } }

 // --- Siren Aktifleştirme ---
 // ... (Değişiklik yok) ...
 alt.onServer('fib:ActivateSiren', (vehicle) => { if (vehicle && vehicle.valid) { alt.log(`FIB Client: Siren aktivasyon: ${vehicle.scriptID}`); alt.setTimeout(() => { if (vehicle && vehicle.valid) { native.setVehicleSiren(vehicle.scriptID, true); alt.log(`FIB Client: setVehicleSiren(true) çağrıldı.`); } }, 200); } });

// --- Kaynak Yönetimi ---
// ... (Değişiklik yok) ...
function startTicks() { createBlip(); if (interactionTickId === null) { interactionTickId = alt.everyTick(interactionTick); alt.log('FIB Client: Etkileşim tick başlatıldı.'); } } function stopTicks() { destroyBlip(); if (interactionTickId !== null) { alt.clearTick(interactionTickId); interactionTickId = null; alt.log('FIB Client: Etkileşim tick durduruldu.'); } destroyGarageView(); } alt.on('connectionComplete', startTicks); alt.on('resourceStop', stopTicks); alt.on('disconnect', stopTicks);

alt.log('~g~FIB istemci betiği (Büyük Marker + Yeni Koordinat) yüklendi.');