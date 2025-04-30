// resources/freeroam/html/script.js

const messageList = document.getElementById('message-list');
const messageInput = document.getElementById('message-input');
const chatContainer = document.getElementById('chat-container');
const inputContainer = document.getElementById('input-container');
let chatActive = false;
const maxMessages = 75;

// --- Sohbet Geçmişi ---
const chatHistory = [];
let historyIndex = -1;
const maxHistory = 50;

// --- Mesaj Yönetimi ---
function addMessage(name, text) {
    const li = document.createElement('li');
    const sanitizedText = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");

    // Zaman damgası sunucudan geldiği için burada tekrar eklemeye gerek yok.
    // Eğer zaman damgasını farklı renkte/stilde göstermek istersen,
    // sunucudan gelen mesajı burada parse edip span içine alabilirsin.
    // Örnek: const timestampMatch = sanitizedText.match(/^(\[.*?\])/);
    // if (timestampMatch) { ... }

    if (name) {
        const coloredText = parseColors(sanitizedText);
        li.innerHTML = `<b>${name}:</b> ${coloredText}`;
    } else {
        li.className = 'system';
        li.innerHTML = parseColors(sanitizedText);
    }
    messageList.appendChild(li);
    while (messageList.children.length > maxMessages) {
        messageList.removeChild(messageList.firstChild);
    }
    messageList.scrollTop = messageList.scrollHeight;
}

function parseColors(text) {
    const colorMap = {
        '~r~': '#F44336', '~g~': '#4CAF50', '~b~': '#2196F3',
        '~y~': '#FFEB3B', '~o~': '#FF9800', '~w~': '#FFFFFF', '~s~': '#AAAAAA' // Zaman damgası için ~s~ kullanmıştık
    };
    let openSpan = false;
    let html = '';
    let buffer = text;
    while (buffer.length > 0) {
        let foundColor = false;
        for (const code in colorMap) {
            if (buffer.startsWith(code)) {
                if (openSpan) html += '</span>';
                html += `<span style="color: ${colorMap[code]};">`;
                openSpan = true;
                buffer = buffer.substring(code.length);
                foundColor = true;
                break;
            }
        }
        if (!foundColor) {
            html += buffer[0];
            buffer = buffer.substring(1);
        }
    }
    if (openSpan) html += '</span>';
    return html;
}


// --- Sohbet Aktifliği ---
function toggleChat(active) {
    if (chatActive === active && inputContainer.style.display === (active ? 'block' : 'none')) return;
    chatActive = active;
    chatContainer.classList.toggle('active', active); // Bu sınıf artık sadece input göstermek için var
    messageInput.disabled = !active;

    if (active) {
        inputContainer.style.display = 'block';
        messageInput.focus();
        historyIndex = chatHistory.length;
    } else {
        inputContainer.style.display = 'none';
        messageInput.value = '';
        messageInput.blur();
    }
}

// --- Klavye Olayları ---
messageInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        const message = messageInput.value.trim();
        if (message.length > 0) {
            if ('alt' in window) alt.emit('chat:Input', message);
            if (message !== chatHistory[chatHistory.length - 1]) {
                 chatHistory.push(message);
                 if(chatHistory.length > maxHistory) chatHistory.shift();
            }
            historyIndex = chatHistory.length;
            messageInput.value = '';
        } else {
            if ('alt' in window) alt.emit('chat:Closed');
        }
    } else if (event.key === 'Escape') {
        event.preventDefault();
        if ('alt' in window) alt.emit('chat:Closed');
    } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        if (historyIndex > 0) {
            historyIndex--;
            messageInput.value = chatHistory[historyIndex];
            setTimeout(() => messageInput.selectionStart = messageInput.selectionEnd = messageInput.value.length, 0);
        }
    } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        if (historyIndex < chatHistory.length - 1) {
            historyIndex++;
            messageInput.value = chatHistory[historyIndex];
            setTimeout(() => messageInput.selectionStart = messageInput.selectionEnd = messageInput.value.length, 0);
        } else if (historyIndex === chatHistory.length - 1) {
             historyIndex++;
             messageInput.value = '';
        }
    }
});


// --- alt:V Olay Dinleyicileri ---
if ('alt' in window) {
    alt.on('chat:AddMessage', addMessage);
    alt.on('chat:Toggle', toggleChat);
    alt.emit('chat:WebViewReady');
}

inputContainer.style.display = 'none';