/*==================================================
 UTL STUDENTBUS
 REGISTER-STAFF.JS
==================================================*/

/*==========================
 VARIABLES
==========================*/

const form = document.getElementById("registerStaffForm");

const fullNameInput = document.getElementById("fullName");
const genderInput = document.getElementById("gender");
const phoneInput = document.getElementById("phone");
const emailInput = document.getElementById("email");
const cardIdInput = document.getElementById("cardId");

const inviteCodeInput = document.getElementById("inviteCode");
const roleInput = document.getElementById("role");
const busInput = document.getElementById("busId");
const busGroup = document.getElementById("busGroup");

const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirmPassword");

const registerButton = document.getElementById("registerButton");
const registerButtonText = document.getElementById("registerButtonText");
const registerLoader = document.getElementById("registerLoader");

const toast = document.getElementById("toast");

/*==========================
 INITIALISATION
==========================*/

document.addEventListener("DOMContentLoaded", initRegisterStaff);

function initRegisterStaff(){

    if(form){

        form.addEventListener("submit", registerStaff);

    }

    document
        .getElementById("togglePassword")
        .addEventListener("click", togglePassword);

    roleInput.addEventListener("change", toggleBusField);

    loadBuses();

    fullNameInput.focus();

}

/*==========================
 TOAST
==========================*/

function showToast(message,type="success"){

    toast.className = "toast " + type;

    toast.textContent = message;

    toast.style.display = "block";

    setTimeout(()=>{

        toast.style.display = "none";

    },3000);

}

/*==========================
 LOADER
==========================*/

function showLoader(){

    registerButton.disabled = true;

    registerButtonText.style.display = "none";

    registerLoader.style.display = "flex";

}

function hideLoader(){

    registerButton.disabled = false;

    registerButtonText.style.display = "inline";

    registerLoader.style.display = "none";

}
/*==================================================
 VALIDATION
==================================================*/

function validateForm(){

    if(fullNameInput.value.trim()===""){

        showToast("Saisissez le nom complet.","warning");

        fullNameInput.focus();

        return false;

    }

    if(cardIdInput.value.trim().length!==9){

        showToast("Le numéro de carte doit contenir 9 chiffres.","warning");

        cardIdInput.focus();

        return false;

    }

    if(passwordInput.value.length<8){

        showToast("Le mot de passe doit contenir au moins 8 caractères.","warning");

        passwordInput.focus();

        return false;

    }

    if(passwordInput.value!==confirmPasswordInput.value){

        showToast("Les mots de passe ne correspondent pas.","warning");

        confirmPasswordInput.focus();

        return false;

    }

    if(roleInput.value===""){

        showToast("Sélectionnez un rôle.","warning");

        roleInput.focus();

        return false;

    }

    if(roleInput.value==="driver" && busInput.value===""){

        showToast("Sélectionnez un bus.","warning");

        busInput.focus();

        return false;

    }

    return true;

}

/*==================================================
 AFFICHER / MASQUER MOT DE PASSE
==================================================*/

function togglePassword(){

    const eye=document.getElementById("eyeIcon");

    if(passwordInput.type==="password"){

        passwordInput.type="text";

        confirmPasswordInput.type="text";

        eye.className="fa-solid fa-eye-slash";

    }else{

        passwordInput.type="password";

        confirmPasswordInput.type="password";

        eye.className="fa-solid fa-eye";

    }

}

/*==================================================
 AFFICHER LE CHAMP BUS
==================================================*/

function toggleBusField(){

    if(roleInput.value==="driver"){

        busGroup.style.display="block";

    }else{

        busGroup.style.display="none";

        busInput.value="";

    }

}

/*==================================================
 CHARGER LES BUS
==================================================*/

async function loadBuses(){

    try{

        const snapshot=await db

        .collection("buses")

        .orderBy("busId")

        .get();

        busInput.innerHTML=

        '<option value="">Sélectionnez un bus</option>';

        snapshot.forEach(doc=>{

            const bus=doc.data();

            busInput.innerHTML+=`

                <option value="${doc.id}">

                    ${bus.busId}

                </option>

            `;

        });

    }

    catch(error){

        console.error(error);

    }

}
/*==================================================
 INSCRIPTION DU PERSONNEL
==================================================*/

async function registerStaff(event){

    event.preventDefault();

    if (!isOnline()) return;

    if(!validateForm()) return;

    showLoader();

    try{


        /* Vérifier le code d'invitation */

const inviteCode = inviteCodeInput.value.trim().toUpperCase();

const invitationDoc = await db
    .collection("invitation_codes")
    .doc(inviteCode)
    .get();

if(!invitationDoc.exists){

    throw new Error("Code d'invitation invalide.");

}

const invitation = invitationDoc.data();

if(invitation.active !== true){

    throw new Error("Ce code d'invitation est désactivé.");

}

if(invitation.role !== roleInput.value){

    throw new Error("Le code ne correspond pas au rôle sélectionné.");

}

        const cardId = cardIdInput.value.trim();

        /* Vérifier que le cardId n'existe pas */

        const userDoc = await db

        .collection("users")

        .doc(cardId)

        .get();

        if(userDoc.exists){

            throw new Error(

                "Ce numéro de carte existe déjà."

            );

        }

        /* Création du compte Firebase */

        const credential = await firebase.auth()

        .createUserWithEmailAndPassword(

            emailInput.value.trim(),

            passwordInput.value

        );

        /* Enregistrer dans Firestore */

        await db

        .collection("users")

        .doc(cardId)

        .set({

            uid: credential.user.uid,

            cardId: cardId,

            fullName: fullNameInput.value.trim(),

            gender: genderInput.value,

            phone: phoneInput.value.trim(),

            email: emailInput.value.trim(),

            role: roleInput.value,

            busId: roleInput.value==="driver"

                ? busInput.value

                : null,

            status: "approved",

            createdAt:

            firebase.firestore.FieldValue.serverTimestamp()

        });

        showToast(

            "Compte créé avec succès.",

            "success"

        );
        finishRegistration();

        setTimeout(()=>{

            window.location.href="login.html";

        },1500);

    }

    catch(error){

        console.error(error);
        alert(error.code + "\n" + error.message);

        handleFirebaseError(error);

    }

    finally{

        hideLoader();

    }

}
/*==================================================
 VÉRIFICATION INTERNET
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
 RÉINITIALISER LE FORMULAIRE
==================================================*/

function resetForm(){

    form.reset();

    busGroup.style.display="none";

    busInput.innerHTML=

    '<option value="">Sélectionnez un bus</option>';

}

/*==================================================
 GESTION DES ERREURS FIREBASE
==================================================*/

function handleFirebaseError(error){

    switch(error.code){

        case "auth/email-already-in-use":

            showToast(

                "Cette adresse e-mail est déjà utilisée.",

                "error"

            );

            break;

        case "auth/weak-password":

            showToast(

                "Le mot de passe est trop faible.",

                "warning"

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

                "Impossible de se connecter à Internet.",

                "error"

            );

            break;

        default:

            showToast(

                error.message,

                "error"

            );

    }

}

/*==================================================
 ÉVÉNEMENTS INTERNET
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
 FINALISATION
==================================================*/

function finishRegistration(){

    hideLoader();

    resetForm();

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

    }

}

/*==================================================
 FOCUS AUTOMATIQUE
==================================================*/

window.addEventListener("load",()=>{

    fullNameInput.focus();

});

/*==================================================
 NETTOYAGE
==================================================*/

window.addEventListener("beforeunload",()=>{

    hideLoader();

});

/*==================================================
 FIN DU FICHIER
==================================================*/