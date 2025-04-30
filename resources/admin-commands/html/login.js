// resources/admin-commands/html/login.js
const passwordInput = document.getElementById('password-input');
const submitButton = document.getElementById('submit-button');
const cancelButton = document.getElementById('cancel-button');
const errorMessage = document.getElementById('error-message');
const loginBox = document.getElementById('login-box');

// Giriş Yap Butonu
submitButton.addEventListener('click', () => {
    attemptLogin();
});

// Şifre alanında Enter'a basma
passwordInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault(); // Form göndermeyi engelle
        attemptLogin();
    } else if (event.key === 'Escape') {
        cancelLogin();
    }
});

// İptal Butonu
cancelButton.addEventListener('click', () => {
    cancelLogin();
});

function attemptLogin() {
    errorMessage.textContent = ''; // Önceki hatayı temizle
    const password = passwordInput.value;
    if (password && 'alt' in window) {
        alt.emit('login:Submit', password);
    } else if (!password) {
         showError("Şifre boş olamaz!");
    }
}

function cancelLogin() {
     if ('alt' in window) {
        alt.emit('login:Cancel');
     }
}

function showError(message) {
    errorMessage.textContent = message;
    // Titretme efekti (opsiyonel)
    loginBox.classList.add('shake');
    setTimeout(() => {
        loginBox.classList.remove('shake');
    }, 500); // Animasyon süresiyle eşleşmeli
}

// Hata gösterme olayını dinle (client/index.js'den gelir)
if ('alt' in window) {
    alt.on('login:ShowError', () => {
        showError("Yanlış şifre!");
        passwordInput.value = ''; // Şifreyi temizle
        passwordInput.focus(); // Tekrar odaklan
    });
}

// Başlangıçta input'a odaklan
passwordInput.focus();