/*====================================================
 UTL STUDENTBUS
 REGISTER.JS
====================================================*/

/*====================================================
 VARIABLES GLOBALES
====================================================*/

let registerForm;

let registerButton;

let registerButtonText;

let registerLoader;

const departments = {
    "Sciences Informatiques": [
        "Génie Informatique",
        "Génie Logiciel",
        "inteligence artificielle",
    ],
    "Médecine": [
        "Médecine Générale",
        "soins Généraux",
    ],
    "Droit": [
        "Droit Minier et droit de l'environnement",
        "Droit numérique",
        "Droit des Affaires et Arbitrage",
        "Criminologie",
    ],
    "Économie": [
        "Économie de Gestion",
        "management",
    ],
    "Sciences Agronomiques": [
        "Technique Agricoles",
        "Sciences Agronomiques",
        "Gestion des ressources naturelles renouvelables",
        "Agroéconomique",
    ],
    "Polytechnique": [
        "Chimie industrielle",
        "Génie Civil",
        "Électromécanique",
        "Géologie et mines",
        "Génie électrique",
        "Pétrole et Gaz",
        "Métallurgie",
    
    ],
    "architecture": [
        "architecture"
    ],
    "information": [
        "journalisme et multi média",
        "Multimédia et communication digital",
        "communication des organisations",
    ],
};

/*====================================================
 INITIALISATION
====================================================*/

function initializeRegister(){

    registerForm=document.getElementById("registerForm");

    registerButton=document.getElementById("registerButton");

    registerButtonText=document.getElementById("registerButtonText");

    registerLoader=document.getElementById("registerLoader");

    registerForm.addEventListener(

        "submit",

        registerStudent

    );

}
/*====================================================
 DÉPARTEMENTS
====================================================*/

function initializeDepartments(){

    const faculty=document.getElementById("faculty");

    const department=document.getElementById("department");

    faculty.addEventListener("change",()=>{

        const value=faculty.value;

        department.innerHTML="";

        const first=document.createElement("option");

        first.value="";

        first.textContent="Sélectionnez un département";

        department.appendChild(first);

        if(!departments[value]) return;

        departments[value].forEach(dep=>{

            const option=document.createElement("option");

            option.value=dep;

            option.textContent=dep;

            department.appendChild(option);

        });

    });

}

/*====================================================
 VALIDATION CARD ID
====================================================*/

function validateCardId(){

    const input=document.getElementById("cardId");

    const message=document.getElementById("cardIdMessage");

    const value=input.value.trim();

    if(value.length!==9){

        message.textContent="Le numéro doit contenir 9 chiffres.";

        message.style.color="#e53935";

        return false;

    }

    if(!value.startsWith("25")){

        message.textContent="Le numéro doit commencer par 25.";

        message.style.color="#e53935";

        return false;

    }

    message.textContent="Numéro valide.";

    message.style.color="#2e7d32";

    return true;

}

/*====================================================
 VALIDATION TÉLÉPHONE
====================================================*/

function validatePhone(){

    const phone=document.getElementById("phone").value.trim();

    const regex=/^\+243[0-9]{9}$/;

    return regex.test(phone);

}

/*====================================================
 FORCE DU MOT DE PASSE
====================================================*/

function checkPasswordStrength(){

    const password=document

    .getElementById("password")

    .value;

    const bar=document

    .getElementById("passwordStrengthBar");

    const text=document

    .getElementById("passwordStrengthText");

    let score=0;

    if(password.length>=8) score++;

    if(/[A-Z]/.test(password)) score++;

    if(/[0-9]/.test(password)) score++;

    if(/[!@#$%^&*]/.test(password)) score++;

    const widths=[

        "0%",

        "25%",

        "50%",

        "75%",

        "100%"

    ];

    bar.style.width=widths[score];

    switch(score){

        case 0:

        case 1:

            bar.style.background="#e53935";

            text.textContent="Mot de passe faible";

            break;

        case 2:

            bar.style.background="#fb8c00";

            text.textContent="Mot de passe moyen";

            break;

        case 3:

            bar.style.background="#fdd835";

            text.textContent="Mot de passe bon";

            break;

        case 4:

            bar.style.background="#43a047";

            text.textContent="Mot de passe fort";

            break;

    }

}

/*====================================================
 CONFIRMATION MOT DE PASSE
====================================================*/

function validateConfirmPassword(){

    const password=document

    .getElementById("password")

    .value;

    const confirm=document

    .getElementById("confirmPassword")

    .value;

    const message=document

    .getElementById("confirmPasswordMessage");

    if(password!==confirm){

        message.textContent=

        "Les mots de passe sont différents.";

        message.style.color="#e53935";

        return false;

    }

    message.textContent=

    "Les mots de passe correspondent.";

    message.style.color="#2e7d32";

    return true;

}
/*====================================================
 INSCRIPTION ÉTUDIANT
====================================================*/

async function registerStudent(event){

    event.preventDefault();

    try{

        if(!validateCardId()) return;

        if(!validatePhone()){

            showMessage(

                "Numéro de téléphone invalide.",

                "warning"

            );

            return;

        }

        if(!validateConfirmPassword()) return;

        if(!document.getElementById("acceptTerms").checked){

            showMessage(

                "Veuillez accepter les conditions d'utilisation.",

                "warning"

            );

            return;

        }

        registerButton.disabled=true;

        registerButtonText.style.display="none";

        registerLoader.style.display="flex";

        const cardId=document.getElementById("cardId").value.trim();

        const email=document.getElementById("email").value.trim();

        const password=document.getElementById("password").value;

        /* Vérifier si cardId existe déjà */

        const studentDoc=await db

        .collection(COLLECTIONS.USERS)

        .doc(cardId)

        .get();

        if(studentDoc.exists){

            throw new Error(

                "Ce numéro de carte est déjà utilisé."

            );

        }

        /* Création Firebase Authentication */

    const emailAvailable = 
        await checkEmailAvailability(email);
        
        if(!emailAvailable){
            throw new Error(

        "Cette adresse e-mail est déjà utilisée."

        );

    }
    const credential=

        

        await firebase.auth()

        .createUserWithEmailAndPassword(

            email,

            password

        );

        const uid=credential.user.uid;

        /* Enregistrer dans Firestore */

        await db

        .collection(COLLECTIONS.USERS)

        .doc(cardId)

        .set({

            uid:uid,

            cardId:cardId,

            fullName:document.getElementById("fullName").value.trim(),

            gender:document.getElementById("gender").value,

            birthDate:document.getElementById("birthDate").value,

            phone:document.getElementById("phone").value.trim(),

            email:email,

            faculty:document.getElementById("faculty").value,

            department:document.getElementById("department").value,

            promotion:document.getElementById("promotion").value,

            academicYear:document.getElementById("academicYear").value,

            address:document.getElementById("address").value.trim(),

            role:"student",

            status:"pending",

            busId:null,

            stopId:null,

            createdAt:firebase.firestore.FieldValue.serverTimestamp()

        });

        showMessage(

            "Compte créé avec succès.",

            "success"

        );

        setTimeout(()=>{

            window.location.href="login.html";

        },2000);

    }

    catch(error){

        console.error(error);

        showMessage(

            error.message ||

            "Impossible de créer le compte.",

            "error"

        );

    }

    finally{

        registerButton.disabled=false;

        registerButtonText.style.display="inline";

        registerLoader.style.display="none";

    }

}
/*====================================================
 VÉRIFIER SI L'EMAIL EXISTE
====================================================*/

async function checkEmailAvailability(email){

    try{

        const snapshot=await db

        .collection(COLLECTIONS.USERS)

        .where("email","==",email)

        .limit(1)

        .get();

        return snapshot.empty;

    }

    catch(error){

        console.error(error);

        return false;

    }

}

/*====================================================
 RÉINITIALISER LE FORMULAIRE
====================================================*/

function resetRegisterForm(){

    document.getElementById("registerForm").reset();

    document.getElementById("department").innerHTML=

    "<option value=''>Choisissez d'abord une faculté</option>";

    document.getElementById("cardIdMessage").textContent="";

    document.getElementById("confirmPasswordMessage").textContent="";

    document.getElementById("passwordStrengthText").textContent=

    "Le mot de passe doit contenir au moins 8 caractères.";

    document.getElementById("passwordStrengthBar").style.width="0%";

}

/*====================================================
 ÉCOUTEURS D'ÉVÉNEMENTS
====================================================*/

function attachRegisterEvents(){

    document

    .getElementById("cardId")

    .addEventListener("input",validateCardId);

    document

    .getElementById("password")

    .addEventListener("input",checkPasswordStrength);

    document

    .getElementById("confirmPassword")

    .addEventListener("input",validateConfirmPassword);

}

/*====================================================
 GESTION DES ERREURS FIREBASE
====================================================*/

function handleRegisterError(error){

    switch(error.code){

        case "auth/email-already-in-use":

            showMessage(

                "Cette adresse e-mail est déjà utilisée.",

                "error"

            );

            break;

        case "auth/invalid-email":

            showMessage(

                "Adresse e-mail invalide.",

                "error"

            );

            break;

        case "auth/weak-password":

            showMessage(

                "Le mot de passe est trop faible.",

                "warning"

            );

            break;

        case "auth/network-request-failed":

            showMessage(

                "Vérifiez votre connexion Internet.",

                "error"

            );

            break;

        default:

            showMessage(

                error.message ||

                "Une erreur est survenue.",

                "error"

            );

    }

}

/*====================================================
 AFFICHER / MASQUER LE LOADER
====================================================*/

function showRegisterLoader(){

    registerButton.disabled=true;

    registerButtonText.style.display="none";

    registerLoader.style.display="flex";

}

function hideRegisterLoader(){

    registerButton.disabled=false;

    registerButtonText.style.display="inline";

    registerLoader.style.display="none";

}
/*====================================================
 VÉRIFICATION INTERNET
====================================================*/

function checkInternetConnection(){

    if(!navigator.onLine){

        showMessage(

            "Aucune connexion Internet.",

            "error"

        );

        return false;

    }

    return true;

}

/*====================================================
 AFFICHER UN MESSAGE
====================================================*/

function showMessage(message,type="success"){

    const toast=document.getElementById("toast");

    if(!toast) return;

    toast.className="toast "+type;

    toast.textContent=message;

    toast.style.display="block";

    setTimeout(()=>{

        toast.style.display="none";

    },3000);

}

/*====================================================
 ÉVÉNEMENTS INTERNET
====================================================*/

window.addEventListener("online",()=>{

    showMessage(

        "Connexion Internet rétablie.",

        "success"

    );

});

window.addEventListener("offline",()=>{

    showMessage(

        "Vous êtes hors connexion.",

        "warning"

    );

});

/*====================================================
 INITIALISATION GÉNÉRALE
====================================================*/

document.addEventListener("DOMContentLoaded",()=>{

    initializeRegister();

    initializeDepartments();

    attachRegisterEvents();

    const fullName=document.getElementById("fullName");

    if(fullName){

        fullName.focus();

    }

});