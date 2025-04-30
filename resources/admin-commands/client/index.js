// resources/admin-commands/client/index.js (Faction Menu Logic Eklendi)
import * as alt from 'alt-client';
import * as native from 'natives';

alt.log('ADMIN-COMMANDS: client/index.js yükleniyor...');

let loginView = null;
let indicatorView = null;
let factionMenuView = null; // **** YENİ: Faction Menu WebView ****
let chatOpened = false;
let noclipActive = false;
let noclipTickId = null;
let noclipSpeed = 1.0;

// Tuş Kodları ve Vektör Yardımcıları... (Değişiklik yok)
const KEY_W = 87, KEY_S = 83, KEY_A = 65, KEY_D = 68; const KEY_SHIFT = 16, KEY_SPACE = 32, KEY_CTRL = 17, KEY_ALT = 18; const KEY_T = 84, KEY_ESC = 27, KEY_H = 72; const INPUT_LOOK_LR = 1; const INPUT_LOOK_UD = 2;
function getNormalizedVector(vector) { const mag = Math.sqrt(vector.x * vector.x + vector.y * vector.y + vector.z * vector.z); if (mag === 0) return new alt.Vector3(0, 0, 0); return new alt.Vector3(vector.x / mag, vector.y / mag, vector.z / mag); } function getCrossProduct(v1, v2) { return new alt.Vector3( v1.y * v2.z - v1.z * v2.y, v1.z * v2.x - v1.x * v2.z, v1.x * v2.y - v1.y * v2.x ); } function toRadians(degrees) { return degrees * (Math.PI / 180); } function rotationToDirection(rotation) { const z = toRadians(rotation.z); const x = toRadians(rotation.x); const num = Math.abs(Math.cos(x)); return new alt.Vector3((-Math.sin(z) * num), (Math.cos(z) * num), Math.sin(x)); }

// --- WebView Yönetimi ---
function createLoginView() { /* ... önceki kod ... */ if (loginView) return; try { loginView = new alt.WebView("http://resource/html/login.html"); loginView.on('login:Submit', (password) => { alt.emitServer('admin:AttemptLogin', password); }); loginView.on('login:Cancel', () => { closeLoginView(false); }); alt.log('ADMIN-COMMANDS: loginView oluşturuldu.'); } catch (e) { alt.logError(`ADMIN-COMMANDS: loginView hatası: ${e.stack}`); } }
function showLoginView() { /* ... önceki kod ... */ if (!loginView) createLoginView(); if (loginView) { alt.showCursor(true); alt.toggleGameControls(false); loginView.isVisible = true; loginView.focus(); } }
function closeLoginView(success = false) { /* ... önceki kod ... */ if (loginView) { loginView.destroy(); loginView = null; } if (!noclipActive) { alt.showCursor(false); alt.toggleGameControls(true); } }
function createIndicatorView() { /* ... önceki kod ... */ if (indicatorView) return; try { indicatorView = new alt.WebView("http://resource/html/indicator.html", true); indicatorView.isVisible = false; } catch (e) { alt.logError(`ADMIN-COMMANDS: indicatorView hatası: ${e.stack}`);} }
function showIndicatorView(state) { /* ... önceki kod ... */ if (!indicatorView) createIndicatorView(); if (indicatorView) { indicatorView.isVisible = state; } }

// **** YENİ: Faction Menu WebView Fonksiyonları ****
function createFactionMenuView() {
    alt.log('ADMIN-COMMANDS: createFactionMenuView çağrıldı.');
    if (factionMenuView) { alt.logWarning('ADMIN-COMMANDS: factionMenuView zaten mevcut.'); return; }
    try {
        factionMenuView = new alt.WebView("http://resource/html/factionmenu.html");
        // Menüden gelen seçimi dinle
        factionMenuView.on('factionmenu:Select', (factionName) => {
            alt.log(`ADMIN-COMMANDS: factionmenu:Select olayı alındı: ${factionName}`);
            // Seçimi sunucuya gönder
            alt.emitServer('admin:SetFaction', factionName);
            // Menüyü hemen kapatmayabiliriz, sunucudan yanıt bekleyebiliriz veya direkt kapatabiliriz
            // closeFactionMenuView(); // Şimdilik sunucu kapatacak
        });
         factionMenuView.on('factionmenu:Close', () => {
             alt.log('ADMIN-COMMANDS: factionmenu:Close olayı alındı.');
             closeFactionMenuView();
         });
        alt.log('ADMIN-COMMANDS: factionMenuView oluşturuldu.');
    } catch (e) { alt.logError(`ADMIN-COMMANDS: factionMenuView oluşturma hatası: ${e.stack}`); }
}

function showFactionMenuView() {
    alt.log('ADMIN-COMMANDS: showFactionMenuView çağrıldı.');
    if (!factionMenuView) createFactionMenuView();
    if (factionMenuView) {
        alt.log('ADMIN-COMMANDS: factionMenuView gösteriliyor...');
        alt.showCursor(true);
        alt.toggleGameControls(false);
        factionMenuView.isVisible = true;
        factionMenuView.focus();
    } else { alt.logError('ADMIN-COMMANDS: factionMenuView null, gösterilemedi!'); }
}

function closeFactionMenuView() {
    alt.log('ADMIN-COMMANDS: closeFactionMenuView çağrıldı.');
    if (factionMenuView) {
        factionMenuView.destroy();
        factionMenuView = null;
        alt.log('ADMIN-COMMANDS: factionMenuView yok edildi.');
    }
    // Başka bir arayüz açık değilse kontrolleri aç
    if (!noclipActive && !chatOpened && !loginView) {
        alt.showCursor(false);
        alt.toggleGameControls(true);
    }
}

// --- Sunucu Olayları ---
// ... (Notify ve Noclip olayları aynı) ...
alt.onServer('admin:ShowLogin', () => { alt.log('ADMIN-COMMANDS: Olay: admin:ShowLogin'); showLoginView(); });
alt.onServer('admin:CloseLogin', (success) => { alt.log(`ADMIN-COMMANDS: Olay: admin:CloseLogin, Başarı: ${success}`); closeLoginView(success); });
alt.onServer('admin:LoginFailed', () => { alt.log('ADMIN-COMMANDS: Olay: admin:LoginFailed'); if (loginView) loginView.emit('login:ShowError'); });
alt.onServer('admin:Notify', (message) => { alt.log(`ADMIN-COMMANDS: Olay: admin:Notify: ${message}`); alt.emit('chat:Receive', null, `~c~[Admin Bilgi]~w~ ${message}`); });
alt.onServer('admin:SetNoclipState', (state) => { alt.log(`ADMIN-COMMANDS: Olay: admin:SetNoclipState alındı. Durum: ${state}`); if (noclipActive !== state) { if (state) startAdaptedNoClip(); else stopAdaptedNoClip(); } });
alt.onServer('admin:AdminChatReceive', (senderName, message) => { alt.log(`ADMIN-COMMANDS: Olay: admin:AdminChatReceive - Gönderen: ${senderName}`); alt.emit('chat:Receive', null, `~r~[ADMIN CHAT] ${senderName}:~w~ ${message}`); });
alt.onServer('admin:ShowAnnouncement', (message) => { alt.log(`ADMIN-COMMANDS: Olay: admin:ShowAnnouncement: ${message}`); native.beginTextCommandThefeedPost("STRING"); native.addTextComponentSubstringPlayerName(message); native.endTextCommandThefeedPostTicker(false, true); });
// **** YENİ: Faction Menu Olayları ****
alt.onServer('admin:ShowFactionMenu', showFactionMenuView);
alt.onServer('admin:CloseFactionMenu', closeFactionMenuView);


// --- Meta Değişikliklerini Dinleme ---
// ... (Değişiklik yok) ...
alt.on('streamSyncedMetaChange', (entity, key, newValue, oldValue) => { if (entity !== alt.Player.local || key !== 'isAdmin') return; alt.log(`ADMIN-COMMANDS: streamSyncedMetaChange -> Key: ${key}, NewValue: ${newValue}`); showIndicatorView(newValue === true); });
// alt.on('metaChange', ...);

// --- Noclip Fonksiyonları ---
// ... (Noclip kodları burada olmalı - önceki adımdaki son hali) ...
function startAdaptedNoClip() { /* Önceki adımdaki kod */ alt.log('ADMIN-COMMANDS: startAdaptedNoClip çağrılıyor...'); if (noclipActive) return; const player = alt.Player.local; if (!player || !player.valid) return; const camPos = player.pos; const camRot = native.getGameplayCamRot(2); noClipCamera = native.createCamWithParams("DEFAULT_SCRIPT_FLY_CAMERA", camPos.x, camPos.y, camPos.z, camRot.x, camRot.y, camRot.z, native.getGameplayCamFov(2), true, 2); if (noClipCamera && native.doesCamExist(noClipCamera)) { alt.log(`ADMIN-COMMANDS: Özel kamera oluşturuldu (Handle: ${noClipCamera}).`); native.setCamActive(noClipCamera, true); if (!native.isCamActive(noClipCamera)) { alt.logError("ADMIN-COMMANDS: Kamera aktif edilemedi!"); stopAdaptedNoClip(); return; } alt.log('ADMIN-COMMANDS: Özel kamera aktif edildi.'); native.renderScriptCams(true, false, 0, true, false); alt.log('ADMIN-COMMANDS: Script kameraları render ediliyor.'); native.setEntityVisible(player.scriptID, false, false); alt.log('ADMIN-COMMANDS: setEntityVisible(false)'); native.setEntityCollision(player.scriptID, false, false); alt.log('ADMIN-COMMANDS: setEntityCollision(false)'); native.setEntityInvincible(player.scriptID, true); alt.log('ADMIN-COMMANDS: setEntityInvincible(true)'); native.setEntityHasGravity(player.scriptID, false); alt.log('ADMIN-COMMANDS: setEntityHasGravity(false)'); native.freezeEntityPosition(player.scriptID, false); alt.log('ADMIN-COMMANDS: freezeEntityPosition(false)'); noclipActive = true; if (noclipTickId === null) { noclipTickId = alt.everyTick(handleAdaptedNoclipMovement); alt.log('ADMIN-COMMANDS: Noclip tick başlatıldı (ID: ' + noclipTickId + ').'); } alt.toggleGameControls(false); alt.log('ADMIN-COMMANDS: toggleGameControls(false)'); } else { alt.logError('ADMIN-COMMANDS: Özel kamera oluşturulamadı!'); noclipActive = false; if(noClipCamera) native.destroyCam(noClipCamera, true); noClipCamera = null; } }
function stopAdaptedNoClip() { /* Önceki adımdaki kod */ alt.log('ADMIN-COMMANDS: stopAdaptedNoClip çağrılıyor...'); if (!noclipActive) return; const player = alt.Player.local; noclipActive = false; if (noclipTickId !== null) { alt.clearTick(noclipTickId); alt.log(`ADMIN-COMMANDS: Noclip tick durduruldu (ID: ${noclipTickId}).`); noclipTickId = null; } let finalPos = player?.pos; let finalRot = player ? native.getGameplayCamRot(2) : {x:0, y:0, z:0}; if (noClipCamera && native.doesCamExist(noClipCamera)) { finalPos = native.getCamCoord(noClipCamera); finalRot = native.getCamRot(noClipCamera, 2); native.setCamActive(noClipCamera, false); native.destroyCam(noClipCamera, true); alt.log('ADMIN-COMMANDS: Özel kamera yok edildi.'); noClipCamera = null; } else { alt.logWarning("ADMIN-COMMANDS: stopAdaptedNoClip - Kamera bulunamadı.");} native.renderScriptCams(false, false, 0, true, false); alt.log('ADMIN-COMMANDS: Script kameraları render durduruldu.'); if (player && player.valid) { native.freezeEntityPosition(player.scriptID, false); alt.log('ADMIN-COMMANDS: freezeEntityPosition(false)'); native.setEntityCollision(player.scriptID, true, true); alt.log('ADMIN-COMMANDS: setEntityCollision(true)'); native.setEntityInvincible(player.scriptID, false); alt.log('ADMIN-COMMANDS: setEntityInvincible(false)'); native.setEntityHasGravity(player.scriptID, true); alt.log(`ADMIN-COMMANDS: >>> setEntityHasGravity(true) ÇAĞRILDI <<<`); native.setEntityVisible(player.scriptID, true, false); alt.log('ADMIN-COMMANDS: setEntityVisible(true)'); native.setEntityVelocity(player.scriptID, 0, 0, 0); alt.log(`ADMIN-COMMANDS: setEntityVelocity(0,0,0) çağrıldı.`); const startPos = new alt.Vector3(finalPos.x, finalPos.y, finalPos.z + 0.5); const endPos = new alt.Vector3(finalPos.x, finalPos.y, finalPos.z - 1000.0); const flags = 1 | 16; const ignoredEntity = player.scriptID; const ray = native.startShapeTestRay(startPos.x, startPos.y, startPos.z, endPos.x, endPos.y, endPos.z, flags, ignoredEntity, 7); alt.log('ADMIN-COMMANDS: Kapanırken yere inme raycast başlatıldı.'); alt.setTimeout(() => { alt.log('ADMIN-COMMANDS: Kapanış Raycast sonucu kontrol ediliyor...'); const currentPlayer = alt.Player.local; if (!currentPlayer || !currentPlayer.valid) return; const result = native.getShapeTestResult(ray); const hit = result[1]; const groundPos = result[2]; alt.log(`ADMIN-COMMANDS: Kapanış Raycast hit: ${hit}`); let placementPos = hit ? new alt.Vector3(groundPos.x, groundPos.y, groundPos.z + 1.0) : finalPos; native.setEntityCoords(currentPlayer.scriptID, placementPos.x, placementPos.y, placementPos.z, false, false, false, true); native.setEntityHeading(currentPlayer.scriptID, finalRot.z); alt.log(`ADMIN-COMMANDS: Noclip yere inildi/pozisyon ayarlandı: Z=${placementPos.z.toFixed(1)}`); if (!chatOpened) { alt.toggleGameControls(true); alt.log('ADMIN-COMMANDS: Noclip çıkışında oyun kontrolleri açıldı.'); } }, 50); } else { if (!chatOpened) { alt.toggleGameControls(true); } } }
function handleAdaptedNoclipMovement() { /* Önceki adımdaki kod */ const player = alt.Player.local; if (!noclipActive || !noClipCamera || !native.doesCamExist(noClipCamera) || !player || player.isDead) { if (noclipTickId !== null) { alt.clearTick(noclipTickId); noclipTickId = null; } return; } native.disableControlAction(1, INPUT_LOOK_LR, true); native.disableControlAction(1, INPUT_LOOK_UD, true); const camRot = native.getGameplayCamRot(2); const rotRad = { x: camRot.x * (Math.PI / 180), z: camRot.z * (Math.PI / 180) }; const direction = rotationToDirection(camRot); const right = getCrossProduct(direction, new alt.Vector3(0, 0, 1)); const up = new alt.Vector3(0, 0, 1); let currentSpeedMultiplier = noclipSpeedMultiplier; if (alt.isKeyDown(KEY_SHIFT)) { currentSpeedMultiplier = noclipFastMultiplier; } else if (alt.isKeyDown(KEY_ALT)) { currentSpeedMultiplier = noclipSlowMultiplier; } let moveVector = new alt.Vector3(0, 0, 0); let moved = false; if (alt.isKeyDown(KEY_W)) { moveVector = moveVector.add(direction); moved = true; } if (alt.isKeyDown(KEY_S)) { moveVector = moveVector.sub(direction); moved = true; } if (alt.isKeyDown(KEY_A)) { moveVector = moveVector.sub(right); moved = true; } if (alt.isKeyDown(KEY_D)) { moveVector = moveVector.add(right); moved = true; } if (alt.isKeyDown(KEY_SPACE)) { moveVector = moveVector.add(up); moved = true; } if (alt.isKeyDown(KEY_CTRL)) { moveVector = moveVector.sub(up); moved = true; } if (moved) { const currentPos = native.getEntityCoords(player.scriptID, true); const frameTime = native.getFrameTime(); const moveAmount = moveVector.mul(currentSpeedMultiplier * frameTime * 100); const newPos = currentPos.add(moveAmount); native.setEntityCoordsNoOffset(player.scriptID, newPos.x, newPos.y, newPos.z, false, false, false); } else { native.setEntityVelocity(player.scriptID, 0, 0, 0); } } // handleNoclipMovement sonu


// --- Tuş Dinleyicisi ---
alt.on('keydown', (key) => {
    // **** YENİ: Arayüzler açıkken ESC sadece o arayüzü kapatmalı ****
    if (loginView && loginView.isVisible && key === KEY_ESC) {
         alt.log('ADMIN-COMMANDS: ESC basıldı, login ekranı kapatılıyor.');
         closeLoginView(false);
         return; // Başka bir işlem yapma
    }
     if (factionMenuView && factionMenuView.isVisible && key === KEY_ESC) {
         alt.log('ADMIN-COMMANDS: ESC basıldı, faction menü kapatılıyor.');
         closeFactionMenuView();
         return; // Başka bir işlem yapma
     }

    const isAnyOverlayOpen = alt.isConsoleOpen() || alt.isMenuOpen() || chatOpened || (loginView && loginView.isVisible) || (factionMenuView && factionMenuView.isVisible);
    if (isAnyOverlayOpen && key !== KEY_ESC) return; // ESC dışındaki tuşları tamamen engelle

    // Normal Tuş İşlemleri
    if (key === KEY_T && !noclipActive) { toggleChat(true); return; }
    if (key === KEY_H) { /* ... önceki H tuşu kodu ... */ alt.log('ADMIN-COMMANDS: H tuşuna basıldı.'); const player = alt.Player.local; if (player && player.valid) { const isAdmin = player.getStreamSyncedMeta('isAdmin') === true; alt.log(`ADMIN-COMMANDS: Admin durumu kontrol edildi: ${isAdmin}`); if (isAdmin) { alt.log('ADMIN-COMMANDS: Oyuncu admin, sunucuya toggle isteği gönderiliyor...'); alt.emitServer('admin:ToggleNoclipKeybind'); } else { alt.log('ADMIN-COMMANDS: Oyuncu admin değil.'); } } else { alt.logWarning('ADMIN-COMMANDS: H tuşu basıldı ama player.local yok.'); } return; }
    if (key === KEY_ESC && noclipActive) { alt.log('ADMIN-COMMANDS: ESC tuşuna basıldı (Noclip aktif), toggle isteği gönderiliyor.'); alt.emitServer('admin:ToggleNoclipKeybind'); return; }
    if (key === KEY_ESC && chatOpened) { toggleChat(false); if (view) view.emit('chat:Toggle', false); return;} // view burada tanımsız, freeroam'dan gelmeli idealde
}); // keydown sonu


// --- Kaynak Başlangıcı ---
createIndicatorView(); // Indicator hep görünsün veya admin olunca görünsün
alt.setTimeout(() => { alt.log('ADMIN-COMMANDS: Başlangıç meta kontrolü...'); if(alt.Player.local && alt.Player.local.valid) { const initialAdmin = alt.Player.local.getStreamSyncedMeta('isAdmin'); alt.log(`ADMIN-COMMANDS: Başlangıç isAdmin Meta: ${initialAdmin}`); if(initialAdmin === true) showIndicatorView(true); } else { alt.logWarning('ADMIN-COMMANDS: Başlangıç meta kontrolünde player.local bulunamadı.'); } }, 2000);

// --- Kaynak Durduğunda ---
alt.on('resourceStop', () => {
    alt.log('ADMIN-COMMANDS: Kaynak durduruluyor...');
    if (noclipActive) { stopAdaptedNoClip(); } // Noclipi kapat
    if (loginView && loginView.destroy) { loginView.destroy(); loginView = null; }
    if (indicatorView && indicatorView.destroy) { indicatorView.destroy(); indicatorView = null; }
    if (factionMenuView && factionMenuView.destroy) { factionMenuView.destroy(); factionMenuView = null; } // Yeni menüyü de kapat
    alt.showCursor(false); alt.toggleGameControls(true); alt.toggleVoiceControls(true);
});

alt.log('~g~Admin Commands istemci betiği (Faction Menu) yüklendi!');