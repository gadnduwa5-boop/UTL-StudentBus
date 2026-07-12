// Vérification Admin
if(localStorage.getItem("role") !== "admin"){
    window.location.href="../login.html";
}

const table = document.getElementById("codesTable");

// Générer un code aléatoire
function generateRandomCode(prefix){

    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let code = prefix + "-";

    for(let i=0;i<4;i++){
        code += chars.charAt(Math.floor(Math.random()*chars.length));
    }

    code += "-";

    for(let i=0;i<4;i++){
        code += chars.charAt(Math.floor(Math.random()*chars.length));
    }

    return code;
}

// Générer un nouveau code
document.getElementById("generateBtn").onclick = async ()=>{

    const role = document.getElementById("role").value;

    const prefix = role==="admin" ? "ADM" : "DRV";

    const code = generateRandomCode(prefix);

    try{

        await db.collection("invitation_codes")
        .doc(code)
        .set({

            code:code,
            role:role,
            active:true,
            createdAt:firebase.firestore.FieldValue.serverTimestamp()

        });

        alert("Code créé avec succès.");

    }catch(error){

        console.error(error);

        alert(error.message);

    }

};

// Charger tous les codes
db.collection("invitation_codes")
.orderBy("createdAt","desc")
.onSnapshot(snapshot=>{

    table.innerHTML="";

    snapshot.forEach(doc=>{

        const item = doc.data();

        table.innerHTML += `

        <tr>

        <td>${item.code}</td>

        <td>${item.role}</td>

        <td>

        ${
            item.active
            ?
            '<span class="status-active">Actif</span>'
            :
            '<span class="status-inactive">Inactif</span>'
        }

        </td>

        <td>

        <button
        class="copy-btn"
        onclick="copyCode('${item.code}')">

        Copier

        </button>

        <button
        class="toggle-btn"
        onclick="toggleCode('${item.code}',${item.active})">

        ${item.active ? "Désactiver" : "Activer"}

        </button>

        <button
        class="delete-btn"
        onclick="deleteCode('${item.code}')">

        Supprimer

        </button>

        </td>

        </tr>

        `;

    });

});

// Copier le code
function copyCode(code){

    navigator.clipboard.writeText(code);

    alert("Code copié : " + code);

}

// Activer / Désactiver
async function toggleCode(code,status){

    await db.collection("invitation_codes")
    .doc(code)
    .update({

        active:!status

    });

}

// Supprimer
async function deleteCode(code){

    if(!confirm("Supprimer ce code ?")) return;

    await db.collection("invitation_codes")
    .doc(code)
    .delete();

}