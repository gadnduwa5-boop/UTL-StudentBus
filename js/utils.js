const loader = document.getElementById("loader");
const toast = document.getElementById("toast");

function showLoader() {

    if (loader) {

        loader.style.display = "flex";

    }

}

function hideLoader() {

    if (loader) {

        loader.style.display = "none";

    }

}

function showToast(message, type = "success") {

    if (!toast) {

        return;

    }

    toast.className = "toast " + type;

    toast.textContent = message;

    toast.style.display = "block";

    clearTimeout(showToast.timer);

    showToast.timer = setTimeout(() => {

        toast.style.display = "none";

    }, 3000);

}
function setText(id, value) {

    const element = document.getElementById(id);

    if (element) {

        element.textContent = value ?? "-";

    }

}

function setValue(id, value) {

    const element = document.getElementById(id);

    if (element) {

        element.value = value ?? "";

    }

}

function setImage(id, src, fallback = "../image/avatar.png") {

    const element = document.getElementById(id);

    if (!element) {

        return;

    }

    element.src = src || fallback;

}

function showElement(id, display = "block") {

    const element = document.getElementById(id);

    if (element) {

        element.style.display = display;

    }

}

function hideElement(id) {

    const element = document.getElementById(id);

    if (element) {

        element.style.display = "none";

    }

}
function formatDate(date) {

    if (!date) {

        return "-";

    }

    const value = date.toDate ? date.toDate() : new Date(date);

    return value.toLocaleDateString("fr-FR", {

        day: "2-digit",

        month: "2-digit",

        year: "numeric"

    });

}

function formatTime(date) {

    if (!date) {

        return "--:--";

    }

    const value = date.toDate ? date.toDate() : new Date(date);

    return value.toLocaleTimeString("fr-FR", {

        hour: "2-digit",

        minute: "2-digit"

    });

}

function formatDateTime(date) {

    if (!date) {

        return "-";

    }

    return `${formatDate(date)} ${formatTime(date)}`;

}

function isOnline() {

    return navigator.onLine;

}

function generateId(prefix = "") {

    return prefix + Date.now().toString(36) + Math.random().toString(36).substring(2, 8);

}
function validateEmail(email) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

}

function validateCardId(cardId) {

    return /^25\d{7}$/.test(cardId);

}

function validatePhone(phone) {

    return /^\+?\d{9,15}$/.test(phone);

}

function validatePassword(password) {

    return password.length >= 8;

}

function capitalize(text) {

    if (!text) {

        return "";

    }

    return text
        .toLowerCase()
        .replace(/\b\w/g, letter => letter.toUpperCase());

}

function debounce(callback, delay = 300) {

    let timer;

    return (...args) => {

        clearTimeout(timer);

        timer = setTimeout(() => {

            callback(...args);

        }, delay);

    };

}
function saveLocal(key, value) {

    localStorage.setItem(key, JSON.stringify(value));

}

function getLocal(key) {

    const value = localStorage.getItem(key);

    return value ? JSON.parse(value) : null;

}

function removeLocal(key) {

    localStorage.removeItem(key);

}

function clearLocal() {

    localStorage.clear();

}

async function copyText(text) {

    try {

        await navigator.clipboard.writeText(text);

        showToast("Copié dans le presse-papiers.");

    } catch (error) {

        console.error(error);

        showToast("Impossible de copier.", "error");

    }

}

function confirmAction(message) {

    return window.confirm(message);

}

function sleep(ms) {

    return new Promise(resolve => setTimeout(resolve, ms));

}

window.addEventListener("online", () => {

    showToast("Connexion Internet rétablie.");

});

window.addEventListener("offline", () => {

    showToast("Connexion Internet perdue.", "warning");

});