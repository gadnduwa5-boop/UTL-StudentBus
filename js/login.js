/*==================================================
 UTL STUDENTBUS
 LOGIN.JS
==================================================*/

/*==========================
 VARIABLES
==========================*/

const form = document.getElementById("loginForm");
const cardIdInput = document.getElementById("cardId");
const passwordInput = document.getElementById("password");
const rememberMe = document.getElementById("rememberMe");

const loginButton = document.getElementById("loginButton");
const loginButtonText = document.getElementById("loginButtonText");
const loginLoader = document.getElementById("loginLoader");

const toast = document.getElementById("toast");

/*==========================
 INITIALISATION
==========================*/

document.addEventListener("DOMContentLoaded", initLogin);

function initLogin(){

    if(form){

        form.addEventListener("submit", login);

    }

    const toggle = document.getElementById("togglePassword");

    if(toggle){

        toggle.addEventListener("click", togglePassword);

    }

    loadRememberMe();

    checkExistingSession();

    cardIdInput.focus();

}

/*==========================
 TOAST
==========================*/

function showToast(message,type="success"){

    toast.className="toast "+type;

    toast.textContent=message;

    toast.style.display="block";

    setTimeout(()=>{

        toast.style.display="none";

    },3000);

}

/*==========================
 LOADER
==========================*/

function showLoader(){

    loginButton.disabled=true;

    loginButtonText.style.display="none";

    loginLoader.style.display="flex";

}

function hideLoader(){

    loginButton.disabled=false;

    loginButtonText.style.display="inline";

    loginLoader.style.display="none";

}
/*==================================================
 VALIDATION
==================================================*/

function validateForm(){

    const cardId = cardIdInput.value.trim();
    const password = passwordInput.value.trim();

    if(cardId === ""){

        showToast("Veuillez saisir votre numéro de carte.","warning");
        cardIdInput.focus();
        return false;

    }

    if(cardId.length !== 9){

        showToast("Le numéro de carte doit contenir 9 chiffres.","warning");
        cardIdInput.focus();
        return false;

    }

    if(password === ""){

        showToast("Veuillez saisir votre mot de passe.","warning");
        passwordInput.focus();
        return false;

    }

    return true;

}

/*==================================================
 CONNEXION INTERNET
==================================================*/

function isOnline(){

    if(!navigator.onLine){

        showToast(
            "Aucune connexion Internet.",
            "error"
        );

        return false;

    }

    return true;

}

/*==================================================
 AFFICHER / MASQUER LE MOT DE PASSE
==================================================*/

function togglePassword(){

    if(passwordInput.type==="password"){

        passwordInput.type="text";

        document.getElementById("eyeIcon").className=
        "fa-solid fa-eye-slash";

    }else{

        passwordInput.type="password";

        document.getElementById("eyeIcon").className=
        "fa-solid fa-eye";

    }

}

/*==================================================
 SE SOUVENIR DE MOI
==================================================*/

function saveRememberMe(){

    if(rememberMe.checked){

        localStorage.setItem(
            "rememberMe",
            "true"
        );

        localStorage.setItem(
            "cardId",
            cardIdInput.value.trim()
        );

    }else{

        localStorage.removeItem("rememberMe");

        localStorage.removeItem("cardId");

    }

}

function loadRememberMe(){

    if(localStorage.getItem("rememberMe")==="true"){

        rememberMe.checked=true;

        cardIdInput.value=
        localStorage.getItem("cardId") || "";

    }

}
/*==================================================
 CONNEXION
==================================================*/

async function login(event){

    event.preventDefault();

    if(!validateForm()) return;

    if(!isOnline()) return;

    showLoader();

    try{

        const cardId = cardIdInput.value.trim();

        const password = passwordInput.value;

        /* Rechercher l'utilisateur */

        const userDoc = await db

        .collection("users")

        .doc(cardId)

        .get();

        if(!userDoc.exists){

            throw new Error("Numéro de carte introuvable.");

        }

        const user = userDoc.data();

        /* Vérifier l'état du compte */

        if(user.status === "pending"){

            throw new Error(

                "Votre compte est en attente de validation."

            );

        }

        if(user.status === "rejected"){

            throw new Error(

                "Votre compte a été refusé."

            );

        }

        /* Connexion Firebase */

        await firebase.auth()

        .signInWithEmailAndPassword(

            user.email,

            password

        );

        /* Sauvegarder le choix */

        saveRememberMe();

        /* Dernière connexion */

        await db

        .collection("users")

        .doc(cardId)

        .update({

            lastLogin:

            firebase.firestore.FieldValue.serverTimestamp()

        });

        showToast(

            "Connexion réussie.",

            "success"

        );

        redirectUser(user.role);

    }

    catch(error){

        console.error(error);

        handleFirebaseError(error);

    }

    finally{

        hideLoader();

    }

}
/*==================================================
 SESSION
==================================================*/

function checkExistingSession(){

    firebase.auth().onAuthStateChanged(async(firebaseUser)=>{

        if(!firebaseUser){

            return;

        }

        try{

            const snapshot = await db

            .collection("users")

            .where("uid","==",firebaseUser.uid)

            .limit(1)

            .get();

            if(snapshot.empty){

                await firebase.auth().signOut();

                return;

            }

            const user = snapshot.docs[0].data();

            if(user.status !== "approved"){

                await firebase.auth().signOut();

                showToast(

                    "Votre compte n'est pas encore approuvé.",

                    "warning"

                );

                return;

            }

            redirectUser(user.role);

        }

        catch(error){

            console.error(error);

        }

    });

}

/*==================================================
 REDIRECTION
==================================================*/

function redirectUser(role){

    switch(role){

        case "admin":

            window.location.href = "admin/dashboard.html";

            break;

        case "driver":

            window.location.href = "driver/dashboard.html";

            break;

        case "student":

            window.location.href = "student/dashboard.html";

            break;

        default:

            showToast(

                "Rôle inconnu.",

                "error"

            );

    }

}
/*==================================================
 DÉCONNEXION
==================================================*/

async function logout(){

    try{

        await firebase.auth().signOut();

        window.location.href="login.html";

    }

    catch(error){

        console.error(error);

        showToast(

            "Erreur lors de la déconnexion.",

            "error"

        );

    }

}

/*==================================================
 SURVEILLANCE RÉSEAU
==================================================*/

window.addEventListener("online",()=>{

    showToast(

        "Connexion Internet rétablie.",

        "success"

    );

});

window.addEventListener("offline",()=>{

    showToast(

        "Vous êtes hors connexion.",

        "warning"

    );

});

/*==================================================
 GESTION DES ERREURS FIREBASE
==================================================*/

function handleFirebaseError(error){

    switch(error.code){

        case "auth/wrong-password":

        case "auth/invalid-credential":

            showToast("Mot de passe incorrect.","error");

            break;

        case "auth/user-not-found":

            showToast("Utilisateur introuvable.","error");

            break;

        case "auth/network-request-failed":

            showToast("Aucune connexion Internet.","error");

            break;

        case "auth/too-many-requests":

            showToast("Trop de tentatives. Réessayez plus tard.","warning");

            break;

        default:

            showToast(error.message,"error");

    }

}

/*==================================================
 FIN
==================================================*/