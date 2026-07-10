
const form = document.getElementById("loginForm");
const cardIdInput = document.getElementById("cardId");
const passwordInput = document.getElementById("password");
const rememberMeInput = document.getElementById("rememberMe");

document.addEventListener("DOMContentLoaded", initializeLogin);

function initializeLogin() {
    loadRememberMe();

    attachEvents();

    cardIdInput.focus();

}

function attachEvents() {

    form.addEventListener("submit", login);

    const togglePassword = document.getElementById("togglePassword");

    if (togglePassword) {

        togglePassword.addEventListener("click", togglePasswordVisibility);

    }

}

function togglePasswordVisibility() {

    const eye = document.getElementById("eyeIcon");

    if (passwordInput.type === "password") {

        passwordInput.type = "text";

        eye.className = "fa-solid fa-eye-slash";

    } else {

        passwordInput.type = "password";

        eye.className = "fa-solid fa-eye";

    }

}
function validateForm() {

    const cardId = cardIdInput.value.trim();
    const password = passwordInput.value.trim();

    if (!validateCardId(cardId)) {

        showToast(
            "Le numéro de carte est invalide.",
            "warning"
        );

        cardIdInput.focus();

        return false;

    }

    if (!validatePassword(password)) {

        showToast(
            "Le mot de passe doit contenir au moins 8 caractères.",
            "warning"
        );

        passwordInput.focus();

        return false;

    }

    return true;

}

async function login(event) {

    event.preventDefault();


    if (!validateForm()) {

        return;

    }

    if (!isOnline()) {

        showToast(
            "Aucune connexion Internet.",
            "error"
        );

        return;

    }

    showLoader();

    try {

        const cardId = cardIdInput.value.trim();

        const userDoc = await db
            .collection("users")
            .doc(cardId)
            .get();

        if (!userDoc.exists) {

            throw new Error("Numéro de carte introuvable.");

        }

        const user = userDoc.data();

        await authenticateUser(user);

    } catch (error) {

        hideLoader();

        handleLoginError(error);

    }

}
async function authenticateUser(user) {

    if (user.status !== "approved") {

        throw new Error(
            "Votre compte n'est pas encore approuvé."
        );

    }

    await auth.signInWithEmailAndPassword(

        user.email,

        passwordInput.value

    );

    saveRememberMe();

    await updateLastLogin(user.cardId);

    hideLoader();

    showToast(

        "Connexion réussie.",

        "success"

    );

    redirectUser(user.role);

}

async function updateLastLogin(cardId) {

    await db

        .collection("users")

        .doc(cardId)

        .update({

            lastLogin: firebase.firestore.FieldValue.serverTimestamp()

        });

}

function saveRememberMe() {

    if (rememberMeInput.checked) {

        saveLocal("rememberMe", true);

        saveLocal("cardId", cardIdInput.value.trim());

    } else {

        removeLocal("rememberMe");

        removeLocal("cardId");

    }

}

function loadRememberMe() {

    const remember = getLocal("rememberMe");

    const cardId = getLocal("cardId");

    if (remember) {

        rememberMeInput.checked = true;

        cardIdInput.value = cardId || "";

    }

}

function checkExistingSession() {

    auth.onAuthStateChanged(async (firebaseUser) => {

        if (!firebaseUser) {

            return;

        }

        try {

            const snapshot = await db
                .collection("users")
                .where("uid", "==", firebaseUser.uid)
                .limit(1)
                .get();

            if (snapshot.empty) {

                await auth.signOut();

                return;

            }

            const user = snapshot.docs[0].data();

            if (user.status !== "approved") {

                await auth.signOut();

                showToast(
                    "Votre compte n'est pas encore approuvé.",
                    "warning"
                );

                return;

            }

            redirectUser(user.role);

        } catch (error) {

            console.error(error);

            showToast(
                "Impossible de vérifier la session.",
                "error"
            );

        }

    });

}

function redirectUser(role) {

    switch (role) {

        case "admin":

            window.location.replace("admin/dashboard.html");

            break;

        case "driver":

            window.location.replace("driver/dashboard.html");

            break;

        case "student":

            window.location.replace("student/dashboard.html");

            break;

        default:

            showToast(
                "Rôle utilisateur inconnu.",
                "error"
            );

    }

}
function handleLoginError(error) {

    switch (error.code) {

        case "auth/invalid-credential":

        case "auth/wrong-password":

            showToast(
                "Mot de passe incorrect.",
                "error"
            );

            break;

        case "auth/user-not-found":

            showToast(
                "Utilisateur introuvable.",
                "error"
            );

            break;

        case "auth/invalid-email":

            showToast(
                "Adresse e-mail invalide.",
                "error"
            );

            break;

        case "auth/network-request-failed":

            showToast(
                "Aucune connexion Internet.",
                "error"
            );

            break;

        case "auth/too-many-requests":

            showToast(
                "Trop de tentatives. Réessayez plus tard.",
                "warning"
            );

            break;

        default:

            showToast(
                error.message || "Connexion impossible.",
                "error"
            );

    }

}

async function logout() {

    try {

        await auth.signOut();

        removeLocal("rememberMe");

        removeLocal("cardId");

        window.location.replace("login.html"),2000;

    } catch (error) {

        console.error(error);

        showToast(
            "Impossible de se déconnecter.",
            "error"
        );

    }

}
window.addEventListener("online", () => {

    showToast(
        "Connexion Internet rétablie.",
        "success"
    );

});

window.addEventListener("offline", () => {

    showToast(
        "Vous êtes hors connexion.",
        "warning"
    );

});

window.addEventListener("beforeunload", () => {

    hideLoader();

});

cardIdInput.addEventListener("keypress", (event) => {

    if (event.key === "Enter") {

        passwordInput.focus();

    }

});

passwordInput.addEventListener("keypress", (event) => {

    if (event.key === "Enter") {

        form.requestSubmit();

    }

});