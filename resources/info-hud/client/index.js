// resources/info-hud/client/index.js (Open-Meteo API Geri Döndü)
import * as alt from 'alt-client';
import * as native from 'natives';

let statusView = null;
let updateInterval = null;
let weatherInterval = null;
let lastWeatherData = { temp: '--', description: 'Yükleniyor', icon: '?' }; // Başlangıç verisi

const ISTANBUL_LAT = 41.01;
const ISTANBUL_LON = 28.98;
// **** DEĞİŞİKLİK: Open-Meteo URL'sine geri dönüldü ****
const WEATHER_API_URL = `https://api.open-meteo.com/v1/forecast?latitude=${ISTANBUL_LAT}&longitude=${ISTANBUL_LON}&current_weather=true`;
const WEATHER_UPDATE_INTERVAL = 15 * 60 * 1000; // 15 dakika
const HUD_UPDATE_INTERVAL = 2000; // 2 Saniye

function createStatusView() { /* ... öncekiyle aynı ... */ if (statusView) return; statusView = new alt.WebView("http://resource/html/status.html", true); statusView.isVisible = true; statusView.focus(false); alt.log('STATUS-HUD: WebView oluşturuldu.'); if (updateInterval === null) { updateInterval = alt.setInterval(updateStatusDisplay, HUD_UPDATE_INTERVAL); alt.log('STATUS-HUD: HUD görüntü interval başlatıldı.'); } fetchWeatherData(); if (weatherInterval === null) { weatherInterval = alt.setInterval(fetchWeatherData, WEATHER_UPDATE_INTERVAL); alt.log('STATUS-HUD: Hava API interval başlatıldı.'); } }
function destroyStatusView() { /* ... öncekiyle aynı ... */ if (updateInterval !== null) { alt.clearInterval(updateInterval); updateInterval = null; } if (weatherInterval !== null) { alt.clearInterval(weatherInterval); weatherInterval = null; } if (statusView) { statusView.destroy(); statusView = null; alt.log('STATUS-HUD: WebView yok edildi.');} }
function updateStatusDisplay() { /* ... öncekiyle aynı ... */ if (!statusView || !alt.Player.local || !alt.Player.local.valid) return; try { const player = alt.Player.local; const pos = player.pos; const zone = native.getNameOfZone(pos.x, pos.y, pos.z); const dataToSend = { hunger: 100, thirst: 100, weather: lastWeatherData, zone: zone || 'Bilinmiyor', }; statusView.emit('status:UpdateData', dataToSend); } catch (e) { alt.logError(`STATUS-HUD: HUD Görüntü Güncelleme Hatası: ${e.stack}`); } }

// Hava Durumu Verisini Çek (Open-Meteo için Güncellendi)
async function fetchWeatherData() {
    alt.log('STATUS-HUD: Open-Meteo verisi çekiliyor...');
    // **** DEĞİŞİKLİK: API Anahtarı kontrolü kaldırıldı ****
    try {
        alt.log(`STATUS-HUD: İstek: ${WEATHER_API_URL}`);
        const httpClient = new alt.HttpClient();
        const response = await httpClient.get(WEATHER_API_URL);
        alt.log(`STATUS-HUD: API Yanıt Kodu: ${response.statusCode}`);

        if (response.statusCode !== 200) {
             alt.logWarning(`STATUS-HUD: Open-Meteo API hatası! Kod: ${response.statusCode}, Body: ${response.body}`);
             throw new Error(`API Status Code: ${response.statusCode}`);
        }

        // alt.log(`STATUS-HUD: API Yanıt Body (Raw): ${response.body}`);
        const data = JSON.parse(response.body);
        alt.log('STATUS-HUD: API Yanıtı JSON parse edildi.');

        if (data && data.current_weather) {
            const weather = data.current_weather;
            alt.log(`STATUS-HUD: Hava durumu verisi: Temp=${weather.temperature}, Code=${weather.weathercode}`);
            // Open-Meteo WMO kodlarını eşleştir
            const { description, icon } = mapWeatherCode(weather.weathercode);
            lastWeatherData = {
                temp: Math.round(weather.temperature),
                description: description,
                icon: icon
            };
            alt.log('STATUS-HUD: Hava durumu verisi BAŞARIYLA güncellendi:', JSON.stringify(lastWeatherData));
        } else {
            alt.logWarning('STATUS-HUD: Open-Meteo API yanıt formatı beklenenden farklı.');
            throw new Error('Invalid API response format');
        }
    } catch (e) {
        alt.logError(`STATUS-HUD: fetchWeatherData Hatası: ${e}`);
         if (e.stack) alt.logError(e.stack);
        lastWeatherData = { temp: 'ERR', description: 'API Hatası', icon: '?' };
    }
    // Hata olsa bile HUD'ı güncelle (API Hatası göstermek için)
    updateHudDisplay();
}

// Open-Meteo WMO Hava Durumu Kodlarını Eşleştirme
function mapWeatherCode(code) { /* ... önceki kodla aynı ... */ if (code === 0) return { description: 'Açık', icon: '☀️' }; if (code === 1) return { description: 'Az Bulutlu', icon: '🌤️' }; if (code === 2) return { description: 'Parçalı Bulutlu', icon: '⛅' }; if (code === 3) return { description: 'Çok Bulutlu', icon: '☁️' }; if (code === 45 || code === 48) return { description: 'Sisli', icon: '🌫️' }; if (code >= 51 && code <= 55) return { description: 'Çiseleme', icon: '🌦️' }; if (code >= 56 && code <= 57) return { description: 'Donan Çiseleme', icon: '🥶' }; if (code >= 61 && code <= 65) return { description: 'Yağmurlu', icon: '🌧️' }; if (code >= 66 && code <= 67) return { description: 'Donan Yağmur', icon: '🥶' }; if (code >= 71 && code <= 75) return { description: 'Karlı', icon: '❄️' }; if (code === 77) return { description: 'Kar Taneleri', icon: '❄️' }; if (code >= 80 && code <= 82) return { description: 'Sağanak Yağışlı', icon: '🌧️' }; if (code >= 85 && code <= 86) return { description: 'Kar Sağanaklı', icon: '❄️' }; if (code >= 95 && code <= 99) return { description: 'Fırtınalı', icon: '⛈️' }; return { description: `Kod:${code}`, icon: '?' }; }

// --- Kaynak Yönetimi ---
createStatusView();
alt.on('resourceStop', destroyStatusView);
alt.on('disconnect', destroyStatusView);
alt.log('~g~Status HUD istemci betiği yüklendi (info-hud - OpenMeteo).');