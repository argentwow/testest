// resources/fib/html/garage.js (Keyboard Navigation)
document.addEventListener('DOMContentLoaded', () => {
    const vehicleList = document.getElementById('vehicle-list');
    const closeButton = document.getElementById('close-button');
    const menuItems = document.querySelectorAll('#vehicle-list li'); // Tüm liste elemanları
    let selectedIndex = 0; // Başlangıçta ilk eleman seçili olsun

    // Seçimi güncelleyen fonksiyon
    function updateSelection(newIndex) {
        // Önceki seçimi kaldır
        if (selectedIndex >= 0 && selectedIndex < menuItems.length) {
            menuItems[selectedIndex].classList.remove('selected');
        }

        // Yeni indeksi ayarla (sınırlar içinde kalsın)
        if (newIndex < 0) {
            selectedIndex = 0; // Başa dön
        } else if (newIndex >= menuItems.length) {
            selectedIndex = menuItems.length - 1; // Sonda kal
        } else {
            selectedIndex = newIndex;
        }

        // Yeni elemanı seçili yap ve görünür alana kaydır
        if (selectedIndex >= 0 && selectedIndex < menuItems.length) {
            menuItems[selectedIndex].classList.add('selected');
            menuItems[selectedIndex].scrollIntoView({ block: 'nearest' }); // 'smooth' yerine 'nearest' daha iyi olabilir
        }
         console.log("Selected Index: ", selectedIndex); // Debug için
    }

    // Başlangıçta ilk elemanı seç
    if (menuItems.length > 0) {
        updateSelection(0);
    }

    if ('alt' in window) {
        // Fare ile tıklama olayı
        vehicleList.addEventListener('click', (event) => {
            if (event.target && event.target.tagName === 'LI') {
                const model = event.target.getAttribute('data-model');
                // Tıklanan elemanın indeksini bul ve seçimi güncelle
                const clickedIndex = Array.from(menuItems).indexOf(event.target);
                updateSelection(clickedIndex);
                if (model) {
                    alt.emit('garage:SpawnVehicle', model);
                }
            }
        });

        // Kapatma düğmesi
        closeButton.addEventListener('click', () => {
            alt.emit('garage:CloseMenu');
        });

        // Klavye olaylarını dinle
        document.addEventListener('keydown', (event) => {
            switch (event.key) {
                case 'ArrowUp':
                    event.preventDefault(); // Sayfanın kaymasını engelle
                    updateSelection(selectedIndex - 1);
                    break;
                case 'ArrowDown':
                    event.preventDefault(); // Sayfanın kaymasını engelle
                    updateSelection(selectedIndex + 1);
                    break;
                case 'Enter':
                    event.preventDefault();
                    // Seçili bir eleman varsa spawn olayını tetikle
                    if (selectedIndex >= 0 && selectedIndex < menuItems.length) {
                        const model = menuItems[selectedIndex].getAttribute('data-model');
                        if (model) {
                            alt.emit('garage:SpawnVehicle', model);
                        }
                    }
                    break;
                case 'Escape':
                    alt.emit('garage:CloseMenu');
                    break;
            }
        });

    } else {
        // Tarayıcı testi için (klavye kısmı tarayıcıda tam çalışmayabilir)
        vehicleList.addEventListener('click', (event) => { if (event.target && event.target.tagName === 'LI') console.log("Seçilen Model:", event.target.getAttribute('data-model')); });
        closeButton.addEventListener('click', () => console.log("Kapatma düğmesine basıldı."));
        document.addEventListener('keydown', (event) => { console.log("Tuş basıldı:", event.key); });
    }
});