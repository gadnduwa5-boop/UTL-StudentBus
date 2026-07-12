const form = document.getElementById("loginForm");
const cardIdInput = document.getElementById("cardId");
const passwordInput = document.getElementById("password");
const rememberMeInput = document.getElementById("rememberMe");

const usersCollection = db.collection(COLLECTIONS.USERS);

document.addEventListener("DOMContentLoaded", initializeLogin);

function initializeLogin() {

    loadRememberMe();

    attachEvents();

    if (cardIdInput) {

        cardIdInput.focus();

    }

}

function attachEvents() {

    form?.addEventListener(

        "submit",

        login

    );

    document

        .getElementById("togglePassword")

        ?.addEventListener(

            "click",

            togglePasswordVisibility

        );

}

function togglePasswordVisibility() {

    const eye = document.getElementById("eyeIcon");

    if (passwordInput.type === "password") {

        passwordInput.type = "text";

        if (eye) {

            eye.className = "fa-solid fa-eye-slash";

        }

    } else {

        passwordInput.type = "password";

        if (eye) {

            eye.className = "fa-solid fa-eye";

        }

    }

}

function validateForm() {

    const cardId = cardIdInput.value.trim();

    const password = passwordInput.value.trim();

    if (!cardId) {

        showToast(

            "Entrez votre numéro de carte.",

            "warning"

        );

        cardIdInput.focus();

        return false;

    }

    if (!password) {

        showToast(

            "Entrez votre mot de passe.",

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

    if (!navigator.onLine) {

        showToast(

            "Aucune connexion Internet.",

            "error"

        );

        return;

    }

    showLoader();

    try {

        const cardId = cardIdInput.value.trim();

        const password = passwordInput.value;

        const userDoc = await usersCollection

            .doc(cardId)

            .get();

        if (!userDoc.exists) {

            throw new Error(

                "Numéro de carte introuvable."

            );

        }

        const user = userDoc.data();

        if (user.role !== ROLES.ADMIN &&

            user.role !== ROLES.DRIVER &&

            user.role !== ROLES.STUDENT) {

            throw new Error(

                "Rôle utilisateur invalide."

            );

        }

        if (user.status !== "approved") {

            throw new Error(

                "Votre compte n'est pas encore approuvé."

            );

        }

        await auth.signInWithEmailAndPassword(

            user.email,

            password

        );

        await finishLogin(user);

    }

    catch (error) {

        hideLoader();

        handleLoginError(error);

    }

}
async function finishLogin(user) {

    try {

        localStorage.setItem(

            "cardId",

            user.cardId

        );

        localStorage.setItem(

            "userRole",

            user.role

        );

        localStorage.setItem(

            "userEmail",

            user.email

        );

        if (rememberMeInput.checked) {

            localStorage.setItem(

                "rememberMe",

                "true"

            );

        } else {

            localStorage.removeItem(

                "rememberMe"

            );

        }

        await usersCollection

            .doc(user.cardId)

            .update({

                lastLogin:

                firebase.firestore.FieldValue.serverTimestamp()

            });

        hideLoader();

        showToast(

            "Connexion réussie.",

            "success"

        );

        setTimeout(() => {

            redirectUser(user.role);

        }, 800);

    }

    catch (error) {

        console.error(error);

        hideLoader();

        showToast(

            "Impossible de terminer la connexion.",

            "error"

        );

    }

}

function loadRememberMe() {

    const remember =

        localStorage.getItem(

            "rememberMe"

        );

    const cardId =

        localStorage.getItem(

            "cardId"

        );

    if (

        remember === "true" &&

        cardId

    ) {

        rememberMeInput.checked = true;

        cardIdInput.value = cardId;

    }

}
function checkExistingSession() {

    auth.onAuthStateChanged(async (firebaseUser) => {

        if (!firebaseUser) {

            return;

        }

        try {

            const snapshot = await usersCollection

                .where("email", "==", firebaseUser.email)

                .limit(1)

                .get();

            if (snapshot.empty) {

                await auth.signOut();

                return;

            }

            const user = snapshot.docs[0].data();

            localStorage.setItem(

                "cardId",

                user.cardId

            );

            localStorage.setItem(

                "userRole",

                user.role

            );

            redirectUser(user.role);

        }

        catch (error) {

            console.error(error);

        }

    });

}

function redirectUser(role) {

    switch (role) {

        case ROLES.ADMIN:

            window.location.replace(

                "admin/dashboard.html"

            );

            break;

        case ROLES.DRIVER:

            window.location.replace(

                "driver/dashboard.html"

            );

            break;

        case ROLES.STUDENT:

            window.location.replace(

                "student/dashboard.html"

            );

            break;

        default:

            showToast(

                "Rôle utilisateur inconnu.",

                "error"

            );

    }

}

async function logout() {

    try {

        showLoader();

        await auth.signOut();

        localStorage.removeItem("cardId");

        localStorage.removeItem("userRole");

        localStorage.removeItem("userEmail");

        hideLoader();

        window.location.replace(

            "../login.html"

        );

    }

    catch (error) {

        console.error(error);

        hideLoader();

        showToast(

            "Impossible de se déconnecter.",

            "error"

        );

    }

}
function handleLoginError(error) {

    console.error(error);

    let message = "Connexion impossible.";

    switch (error.code) {

        case "auth/invalid-credential":

        case "auth/wrong-password":

            message = "Mot de passe incorrect.";

            break;

        case "auth/user-not-found":

            message = "Utilisateur introuvable.";

            break;

        case "auth/invalid-email":

            message = "Adresse e-mail invalide.";

            break;

        case "auth/network-request-failed":

            message = "Aucune connexion Internet.";

            break;

        case "auth/too-many-requests":

            message = "Trop de tentatives. Réessayez plus tard.";

            break;

        default:

            if (error.message) {

                message = error.message;

            }

    }

    showToast(

        message,

        "error"

    );

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

cardIdInput?.addEventListener("keydown", event => {

    if (event.key === "Enter") {

        event.preventDefault();

        passwordInput.focus();

    }

});

passwordInput?.addEventListener("keydown", event => {

    if (event.key === "Enter") {

        event.preventDefault();

        form.requestSubmit();

    }

});