// resources/info-hud/html/status.js (Font Awesome Icons)
const hungerValueElement = document.getElementById('value-hunger');
const thirstValueElement = document.getElementById('value-thirst');
const weatherIconElement = document.getElementById('weather-icon'); // Bu artık <i> etiketi
const weatherTempElement = document.getElementById('weather-temp');
const weatherDescElement = document.getElementById('weather-desc');
const locationZoneElement = document.getElementById('location-zone');

// Font Awesome ikon sınıf eşleştirmesi (Open-Meteo WMO kodlarına göre)
// İkon isimleri için: https://fontawesome.com/v6/search?o=r&m=free
const weatherIconMap = {
     0: "fas fa-sun",           // Clear sky (Güneş)
     1: "fas fa-cloud-sun",     // Mainly clear
     2: "fas fa-cloud",         // Partly cloudy
     3: "fas fa-cloud",         // Overcast
    45: "fas fa-smog",          // Fog
    48: "fas fa-smog",          // Depositing rime fog
    51: "fas fa-cloud-rain",    // Drizzle: Light
    53: "fas fa-cloud-rain",    // Drizzle: Moderate
    55: "fas fa-cloud-showers-heavy", // Drizzle: Dense
    56: "fas fa-snowflake",     // Freezing Drizzle: Light (Kar tanesi)
    57: "fas fa-snowflake",     // Freezing Drizzle: Dense
    61: "fas fa-cloud-rain",    // Rain: Slight
    63: "fas fa-cloud-showers-heavy", // Rain: Moderate
    65: "fas fa-cloud-showers-heavy", // Rain: Heavy
    66: "fas fa-icicles",       // Freezing Rain: Light (Buz sarkıtı)
    67: "fas fa-icicles",       // Freezing Rain: Heavy
    71: "fas fa-snowflake",     // Snow fall: Slight
    73: "fas fa-snowflake",     // Snow fall: Moderate
    75: "fas fa-snowflake",     // Snow fall: Heavy
    77: "fas fa-snowflake",     // Snow grains
    80: "fas fa-cloud-showers-heavy", // Rain showers: Slight
    81: "fas fa-cloud-showers-heavy", // Rain showers: Moderate
    82: "fas fa-cloud-showers-heavy", // Rain showers: Violent
    85: "fas fa-snowflake",     // Snow showers slight
    86: "fas fa-snowflake",     // Snow showers heavy
    95: "fas fa-bolt",          // Thunderstorm: Slight or moderate (Şimşek)
    96: "fas fa-cloud-bolt",    // Thunderstorm with slight hail
    99: "fas fa-cloud-bolt",    // Thunderstorm with heavy hail
    '?': "fas fa-question"     // Bilinmiyor
};

// alt:V olayını dinle
if ('alt' in window) {
    alt.on('status:UpdateData', (data) => {
        if (hungerValueElement) hungerValueElement.textContent = `${data.hunger || 0}%`;
        if (thirstValueElement) thirstValueElement.textContent = `${data.thirst || 0}%`;
        if (locationZoneElement) locationZoneElement.textContent = data.zone || 'Bilinmiyor';

        if (data.weather) {
            if (weatherTempElement) weatherTempElement.textContent = `${data.weather.temp}°`;
            if (weatherDescElement) weatherDescElement.textContent = data.weather.description;
            // İkon için className'i ayarla
            if (weatherIconElement) {
                const iconClass = weatherIconMap[data.weather.icon] || weatherIconMap['?'];
                // Önceki class'ları temizleyip yenisini ekle (fas fa-...)
                weatherIconElement.className = `icon ${iconClass}`;
            }
        } else {
             if (weatherTempElement) weatherTempElement.textContent = '--°';
             if (weatherDescElement) weatherDescElement.textContent = 'Veri Yok';
             if (weatherIconElement) weatherIconElement.className = 'icon fas fa-question'; // Varsayılan soru işareti
        }
    });
    // Başlangıç değerleri
     if (hungerValueElement) hungerValueElement.textContent = '--%'; if (thirstValueElement) thirstValueElement.textContent = '--%'; if (weatherTempElement) weatherTempElement.textContent = '--°'; if (weatherDescElement) weatherDescElement.textContent = 'Yükleniyor...'; if (weatherIconElement) weatherIconElement.className = 'icon fas fa-question'; if (locationZoneElement) locationZoneElement.textContent = '----------';
    alt.emit('statushud:WebViewReady');
}