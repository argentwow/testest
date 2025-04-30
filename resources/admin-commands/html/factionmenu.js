// resources/admin-commands/html/factionmenu.js
document.addEventListener('DOMContentLoaded', () => {
    const factionList = document.querySelector('#menu-container ul');
    const closeButton = document.getElementById('close-button');

    if ('alt' in window) {
        // Fraksiyon seçeneklerine tıklama olayı
        factionList.addEventListener('click', (event) => {
            if (event.target && event.target.tagName === 'LI') {
                const selectedFaction = event.target.getAttribute('data-faction');
                if (selectedFaction) {
                    alt.emit('factionmenu:Select', selectedFaction);
                }
            }
        });

        // Kapatma düğmesi
        closeButton.addEventListener('click', () => {
            alt.emit('factionmenu:Close');
        });

        // ESC tuşu ile kapatma
        document.addEventListener('keydown', (event) => {
             if (event.key === 'Escape') {
                 alt.emit('factionmenu:Close');
             }
        });

    } else {
        // Tarayıcı testi için
        factionList.addEventListener('click', (event) => {
            if (event.target && event.target.tagName === 'LI') {
                console.log("Seçilen Fraksiyon:", event.target.getAttribute('data-faction'));
            }
        });
         closeButton.addEventListener('click', () => {
            console.log("Kapatma düğmesine basıldı.");
        });
    }

    // Başlangıçta bir şeye odaklanmaya gerek yok gibi
});