// Bouton inscription
document
.getElementById("registerBtn")
.addEventListener("click", registerStaff);

async function registerStaff(){

    const fullname =
    document.getElementById("fullname").value.trim();

    const email =
    document.getElementById("email").value.trim();

    const password =
    document.getElementById("password").value;

    const confirmPassword =
    document.getElementById("confirmPassword").value;

    const role =
    document.getElementById("role").value;

    const inviteCode =
    document.getElementById("inviteCode").value.trim();

    const message =
    document.getElementById("message");

    message.innerHTML="";
    message.className="";

    // Vérification des champs
    if(
        !fullname ||
        !email ||
        !phone ||
        !cardId ||
        !password ||
        !confirmPassword ||
        !role ||
        !inviteCode
        
    ){

        message.className="error";
        message.innerHTML="Veuillez remplir tous les champs.";
        return;

    }

    if(password !== confirmPassword){

        message.className="error";
        message.innerHTML="Les mots de passe ne correspondent pas.";
        return;

    }

    try{

        // Vérifier le code d'invitation
        const codeDoc =
        await db.collection("invitation_codes")
        .doc(inviteCode)
        .get();

        if(!codeDoc.exists){

            message.className="error";
            message.innerHTML="Code d'invitation invalide.";
            return;

        }

        const code = codeDoc.data();

        if(code.active !== true){

            message.className="error";
            message.innerHTML="Ce code est désactivé.";
            return;

        }

        if(code.role !== role){

            message.className="error";
            message.innerHTML="Le code ne correspond pas au rôle choisi.";
            return;

        }

        // Création du compte
        const userCredential =
        await auth.createUserWithEmailAndPassword(
            email,
            password
        );

        const user =
        userCredential.user;

        const phone = document.getElementById("phone").value.trim();

const cardId =
document.getElementById("cardId").value.trim();

        // Enregistrement dans Firestore
        await db.collection("users")
        .doc(cardId)
        .set({

            uid:user.uid,
            cardId:cardId,
            fullname:fullname,
            email:email,
            phone:phone,
            role:role,
            status:"active",
            createdAt:
            firebase.firestore.FieldValue.serverTimestamp()

        });

        /*
        OPTIONNEL :
        Désactiver le code après utilisation.
        Supprime ce bloc si tu souhaites
        qu'un même code puisse être utilisé
        plusieurs fois.
        */

        await db.collection("invitation_codes")
        .doc(inviteCode)
        .update({

            active:false

        });

        // Déconnecter le nouvel utilisateur
        await auth.signOut();

        message.className="success";
        message.innerHTML="Compte créé avec succès !";

        setTimeout(function(){

            window.location.href="login.html";

        },2000);

    }

    catch(error){

        message.className="error";

        switch(error.code){

            case "auth/email-already-in-use":
                message.innerHTML="Cette adresse e-mail est déjà utilisée.";
                break;

            case "auth/invalid-email":
                message.innerHTML="Adresse e-mail invalide.";
                break;

            case "auth/weak-password":
                message.innerHTML="Le mot de passe doit contenir au moins 6 caractères.";
                break;

            default:
                message.innerHTML=error.message;

        }

        console.error(error);

    }

}
