/*==================================================
 UTL STUDENTBUS
 ADMIN.JS
 Version 2.0
==================================================*/
let selectedDriverId = null;
let selectedStudentId = null;
let routes = [];
let selectedRoutesId = null;
const auth = firebase.auth();
const db = firebase.firestore();

const currentUser={

    uid:"",

    cardId:"",

    role:"",

    fullName:"",

    email:"",

    phone:"",

    busId:"",

    approved:false

};


auth.onAuthStateChanged(async(user)=>{

    if(!user){

        location.href="../login.html";

        return;

    }

    showLoader();

    try{

        const snapshot=await db

        .collection("users")

        .where("uid","==",user.uid)

        .limit(1)

        .get();

        if(snapshot.empty){

            hideLoader();

            showToast(

                "Erreur",

                "Compte introuvable.",

                "danger"

            );

            await auth.signOut();

            location.href="../login.html";

            return;

        }

        const doc=snapshot.docs[0];

        const data=doc.data();

        currentUser.uid=user.uid;

        currentUser.cardId=doc.id;

        currentUser.role=data.role;

        currentUser.fullName=data.fullName || "";

        currentUser.email=data.email || "";

        currentUser.phone=data.phone || "";

        currentUser.busId=data.busId || "";

        currentUser.approved=data.approved || false;

        if(currentUser.role!=="admin"){

            hideLoader();

            showToast(

                "Accès refusé",

                "Vous n'êtes pas administrateur.",

                "danger"

            );

            await auth.signOut();

            location.href="../login.html";

            return;

        }

        loadAdminProfile();

        loadDashboardStats();

        hideLoader();

    }

    catch(error){

        console.error(error);

        hideLoader();

        showToast(

            "Erreur",

            error.message,

            "danger"

        );

    }

});

function loadAdminProfile(){

    const name=document.getElementById("adminName");

    const email=document.getElementById("adminEmail");

    const card=document.getElementById("adminCard");

    if(name){

        name.textContent=currentUser.fullName;

    }

    if(email){

        email.textContent=currentUser.email;

    }

    if(card){

        card.textContent=currentUser.cardId;

    }

}
/*==================================================
 TABLEAU DE BORD ADMIN
==================================================*/

async function loadDashboardStats(){

    try{

        showLoader();

        const [

            students,

            drivers,

            admins,

            buses,

            routes,

            stops

        ] = await Promise.all([

            db.collection("users")
            .where("role","==","student")
            .get(),

            db.collection("users")
            .where("role","==","driver")
            .get(),

            db.collection("users")
            .where("role","==","admin")
            .get(),

            db.collection("buses").get(),

            db.collection("routes").get(),

            db.collection("bus_stops").get()

        ]);

        updateStat("studentCount",students.size);

        updateStat("driverCount",drivers.size);

        updateStat("adminCount",admins.size);

        updateStat("busCount",buses.size);

        updateStat("routeCount",routes.size);

        updateStat("stopCount",stops.size);

        hideLoader();

    }

    catch(error){

        hideLoader();

        console.error(error);

        showToast(

            "Erreur",

            "Impossible de charger les statistiques.",

            "danger"

        );

    }

}

function updateStat(id,value){

    const element=document.getElementById(id);

    if(!element) return;

    animateCounter(id,value);

}
function refreshDashboard(){

    loadDashboardStats();

}


function getCounters(){

    return{

        students:document.getElementById("studentCount"),

        drivers:document.getElementById("driverCount"),

        admins:document.getElementById("adminCount"),

        buses:document.getElementById("busCount"),

        routes:document.getElementById("routeCount"),

        stops:document.getElementById("stopCount")

    };

}
/*==================================================
 GESTION DES BUS
==================================================*/

let buses=[];

/*==================================================
 CHARGER LES BUS
==================================================*/

async function loadBuses(){

    try{

        const snapshot=await db

        .collection("buses")

        .orderBy("busNumber")

        .get();

        buses=[];

        snapshot.forEach(doc=>{

            buses.push({

                id:doc.id,

                ...doc.data()

            });

        });

        renderBusTable();

    }

    catch(error){

        console.error(error);

        showToast(

            "Erreur",

            "Impossible de charger les bus.",

            "danger"

        );

    }

}

/*==================================================
 AFFICHER LES BUS
==================================================*/

function renderBusTable(){

    const table=document.getElementById("busTable");

    if(!table) return;

    table.innerHTML="";

    buses.forEach(bus=>{

        table.innerHTML += `

        <tr>

            <td>${bus.busId || bus.id}</td>

            <td>${bus.busNumber || "-"}</td>

            <td>${bus.busName || "-"}</td>

            <td>${bus.capacity || 0}</td>

            <td>${bus.driverId || "Non affecté"}</td>

            <td>

                <span class="badge ${bus.active ? "badge-success" : "badge-danger"}">

                    ${bus.active ? "Actif" : "Inactif"}

                </span>

            </td>

            <td>

                <button

                    class="btn btn-primary"

                    onclick="editBus('${bus.id}')">

                    <i class="fa-solid fa-pen"></i>

                </button>

                <button

                    class="btn btn-danger"

                    onclick="deleteBus('${bus.id}')">

                    <i class="fa-solid fa-trash"></i>

                </button>

            </td>

        </tr>

        `;

    });

}

/*==================================================
 RECHERCHER UN BUS
==================================================*/

function searchBus(keyword){

    keyword=keyword.toLowerCase();

    const rows=document.querySelectorAll("#busTable tr");

    rows.forEach(row=>{

        row.style.display=

        row.innerText

        .toLowerCase()

        .includes(keyword)

        ? ""

        : "none";

    });

}
/*==================================================
 AJOUTER UN BUS
==================================================*/

async function addBus(){

    try{

        const busNumber=document.getElementById("busNumber").value.trim();

        const busName=document.getElementById("busName").value.trim();

        const capacity=parseInt(document.getElementById("capacity").value);

        const driverId=document.getElementById("driverId").value;

        if(busNumber==="" || busName===""){

            showToast(

                "Erreur",

                "Tous les champs sont obligatoires.",

                "danger"

            );

            return;

        }

        showLoader();

        await db.collection("buses")

        .doc(busNumber)

        .set({

            busId:busNumber,

            busNumber:busNumber,

            busName:busName,

            capacity:capacity,

            driverId:driverId,

            active:true,

            createdAt:firebase.firestore.FieldValue.serverTimestamp()

        });

        hideLoader();

        showToast(

            "Succès",

            "Bus ajouté avec succès.",

            "success"

        );

        clearBusForm();

        loadBuses();

    }

    catch(error){

        hideLoader();

        console.error(error);

        showToast(

            "Erreur",

            error.message,

            "danger"

        );

    }

}

/*==================================================
 MODIFIER UN BUS
==================================================*/

async function editBus(busId){

    try{

        const doc=await db

        .collection("buses")

        .doc(busId)

        .get();

        if(!doc.exists) return;

        const bus=doc.data();

        document.getElementById("busNumber").value=bus.busNumber;

        document.getElementById("busName").value=bus.busName;

        document.getElementById("capacity").value=bus.capacity;

        document.getElementById("driverId").value=bus.driverId;

        document.getElementById("saveBus").dataset.id=busId;

    }

    catch(error){

        console.error(error);

    }

}

/*==================================================
 ENREGISTRER LES MODIFICATIONS
==================================================*/

async function updateBus(){

    const id=document.getElementById("saveBus").dataset.id;

    if(!id){

        addBus();

        return;

    }

    try{

        showLoader();

        await db.collection("buses")

        .doc(id)

        .update({

            busName:document.getElementById("busName").value.trim(),

            capacity:parseInt(document.getElementById("capacity").value),

            driverId:document.getElementById("driverId").value,

            updatedAt:firebase.firestore.FieldValue.serverTimestamp()

        });

        hideLoader();

        showToast(

            "Succès",

            "Bus modifié.",

            "success"

        );

        clearBusForm();

        loadBuses();

    }

    catch(error){

        hideLoader();

        console.error(error);

    }

}

/*==================================================
 SUPPRIMER UN BUS
==================================================*/

async function deleteBus(busId){

    if(!confirm("Supprimer ce bus ?")){

        return;

    }

    try{

        showLoader();

        await db.collection("buses")

        .doc(busId)

        .delete();

        hideLoader();

        showToast(

            "Succès",

            "Bus supprimé.",

            "success"

        );

        loadBuses();

    }

    catch(error){

        hideLoader();

        console.error(error);

    }

}

function clearBusForm(){

    document.getElementById("busNumber").value="";

    document.getElementById("busName").value="";

    document.getElementById("capacity").value="";

    document.getElementById("driverId").value="";

    document.getElementById("saveBus").dataset.id="";

}
/*==================================================
 CHARGER LES ARRÊTS
==================================================*/

let stops = [];

async function loadStops(){

    try{

        const snapshot = await db
        .collection("bus_stops")
        .orderBy("name")
        .get();

        stops = [];

        const table = document.getElementById("stopTable");

        if(table){

            table.innerHTML = "";

        }

        snapshot.forEach(doc=>{

            const stop = {

                id: doc.id,

                ...doc.data()

            };

            stops.push(stop);

            if(table){

                table.innerHTML += `

                <tr>

                    <td>${stop.stopId || doc.id}</td>

                    <td>${stop.name || "-"}</td>

                    <td>${stop.latitude || "-"}</td>

                    <td>${stop.longitude || "-"}</td>

                    <td>${stop.routeCount || 0}</td>

                    <td>

                        <button

                        class="btn btn-primary"

                        onclick="showStopDetails('${doc.id}')">

                            <i class="fa-solid fa-eye"></i>

                        </button>

                        <button

                        class="btn btn-warning"

                        onclick="editStop('${doc.id}')">

                            <i class="fa-solid fa-pen"></i>

                        </button>

                        <button

                        class="btn btn-danger"

                        onclick="deleteStop('${doc.id}')">

                            <i class="fa-solid fa-trash"></i>

                        </button>

                    </td>

                </tr>

                `;

            }

        });

        const count = document.getElementById("summaryStops");

        if(count){

            count.textContent = stops.length;

        }

    }

    catch(error){

        console.error(error);

        showToast(

            "Erreur",

            "Impossible de charger les arrêts.",

            "danger"

        );

    }

}

/*==================================================
 CHARGER LES ÉTUDIANTS
==================================================*/

async function loadStudents(){

    try{

        const snapshot=await db

        .collection("users")

        .where("role","==","student")

        .get();

        const table=document.getElementById("studentTable");

        if(!table) return;

        table.innerHTML="";

        snapshot.forEach(doc=>{

            const student=doc.data();

            table.innerHTML+=`

            <tr>

                <td>${student.cardId || doc.id}</td>

                <td>${student.fullName}</td>

                <td>${student.phone || "-"}</td>

                <td>${student.busId || "-"}</td>

                <td>

                    ${student.approved ? "✅" : "⏳"}

                </td>

                <td>

                    <button

                    class="btn btn-success"

                    onclick="approveStudent('${doc.id}')">

                    Approuver

                    </button>

                </td>

            </tr>

            `;

        });

    }

    catch(error){

        console.error(error);

    }

}
async function showStudentDetails(cardId){

    try{

        const doc = await db
        .collection("users")
        .doc(cardId)
        .get();

        if(!doc.exists){

            return;

        }

        const student = doc.data();

        selectedStudentId = cardId;

        document.getElementById("detailCardId").textContent = cardId;

        document.getElementById("detailFullName").textContent = student.fullName || "-";

        document.getElementById("detailEmail").textContent = student.email || "-";

        document.getElementById("detailPhone").textContent = student.phone || "-";

        document.getElementById("detailBus").textContent = student.busId || "Non affecté";

        document.getElementById("detailCreatedAt").textContent =
        student.createdAt
        ? formatDate(student.createdAt)
        : "-";

        document.getElementById("detailApproved").textContent =
        student.approved
        ? "Approuvé"
        : "En attente";

        document.getElementById("studentStatus").textContent =
        student.approved
        ? "Approuvé"
        : "En attente";

    }

    catch(error){

        console.error(error);

    }
    async function showStopDetails(stopId) {
        
    }
}

/*==================================================
 APPROUVER UN ÉTUDIANT
==================================================*/

async function approveStudent(cardId){

    try{

        await db.collection("users")

        .doc(cardId)

        .update({

            approved:true,

            approvedAt:firebase.firestore.FieldValue.serverTimestamp()

        });

        showToast(

            "Succès",

            "Étudiant approuvé.",

            "success"

        );

        loadStudents();

    }

    catch(error){

        console.error(error);

    }

}

/*==================================================
 CHARGER LES CHAUFFEURS
==================================================*/

async function loadDrivers(){

    try{

        const snapshot = await db

        .collection("users")

        .where("role","==","driver")

        .get();

        const table = document.getElementById("driverTable");

        if(!table) return;

        table.innerHTML = "";

        snapshot.forEach(doc=>{

            const driver = doc.data();

            table.innerHTML += `

            <tr>

                <td>${driver.cardId || doc.id}</td>

                <td>${driver.fullName || "-"}</td>

                <td>${driver.phone || "-"}</td>

                <td>${driver.email || "-"}</td>

                <td>${driver.busId || "Non affecté"}</td>

                <td>

                    ${driver.busId
                        ? '<span class="badge badge-success">En service</span>'
                        : '<span class="badge badge-warning">Disponible</span>'}

                </td>

                <td>

                    <button

                    class="btn btn-primary"

                    onclick="showDriverDetails('${doc.id}')">

                        <i class="fa-solid fa-eye"></i>

                    </button>

                    <button

                    class="btn btn-success"

                    onclick="assignDriver('${doc.id}')">

                        <i class="fa-solid fa-bus"></i>

                    </button>

                </td>

            </tr>

            `;

        });

    }

    catch(error){

        console.error(error);

    }

}
async function showDriverDetails(cardId){

    try{

        const doc = await db

        .collection("users")

        .doc(cardId)

        .get();

        if(!doc.exists) return;

        const driver = doc.data();

        selectedDriverId = cardId;

        document.getElementById("detailDriverCardId").textContent = cardId;

        document.getElementById("detailDriverName").textContent = driver.fullName || "-";

        document.getElementById("detailDriverEmail").textContent = driver.email || "-";

        document.getElementById("detailDriverPhone").textContent = driver.phone || "-";

        document.getElementById("detailDriverBus").textContent = driver.busId || "Non affecté";

        document.getElementById("driverStatus").textContent =driver.busId ? "En service" : "Disponible";
        document.getElementById("detailDriverCreatedAt").textContent = driver
        .createdAt ? formatDate(driver.createdAt) : "-";
        document.getElementById("detailDriverState")
        .textContent = driver.busId ? "En service" : "Disponible";

    }

    catch(error){

        console.error(error);

    }
    async function showStopDetails(stopId) {
        
    }

}

/*==================================================
 AFFECTER UN CHAUFFEUR
==================================================*/

async function assignDriver(driverId){

    const busId=prompt(

        "Entrer le Bus ID (Ex: BUS-001)"

    );

    if(!busId) return;

    try{

        await db.collection("users")

        .doc(driverId)

        .update({

            busId:busId

        });

        await db.collection("buses")

        .doc(busId)

        .update({

            driverId:driverId

        });

        showToast(

            "Succès",

            "Chauffeur affecté au bus.",

            "success"

        );

        loadDrivers();

        loadBuses();

    }

    catch(error){

        console.error(error);

    }

}
/*==================================================
 NOTIFICATIONS ADMIN
==================================================*/

async function loadNotifications(){

    try{

        const snapshot=await db

        .collection("notifications")

        .where("read","==",false)

        .get();

        const badge=document.getElementById("notificationCount");

        if(badge){

            badge.textContent=snapshot.size;

        }

    }

    catch(error){

        console.error(error);

    }

}

/*==================================================
 PARAMÈTRES
==================================================*/

async function loadSettings(){

    try{

        const doc=await db

        .collection("settings")

        .doc("app")

        .get();

        if(!doc.exists) return;

        const settings=doc.data();

        const appName=document.getElementById("appName");

        if(appName){

            appName.textContent=settings.appName || "UTL StudentBus";

        }

    }

    catch(error){

        console.error(error);

    }

};
async function saveSettings() {
    
};
async function resetSettings() {
    
};
async function exportSettings() {
    
};
async function importSettings() {
    
};
async function loadSystemInformation() {
    
}


/*==================================================
 TABLEAU DE BORD
==================================================*/

async function initializeDashboard(){

    await Promise.all([

        loadDashboardStats(),

        loadNotifications()

    ]);

}

/*==================================================
 RAFRAÎCHISSEMENT AUTOMATIQUE
==================================================*/

function startAutoRefresh(){

    setInterval(()=>{

        loadDashboardStats();

        loadNotifications();

    },30000);

}

/*==================================================
 INITIALISATION DES PAGES
==================================================*/

document.addEventListener("DOMContentLoaded",()=>{

    if(document.getElementById("studentTable")){

        loadStudents();

    }

    if(document.getElementById("driverTable")){

        loadDrivers();

    }

    if(document.getElementById("busTable")){

        loadBuses();

    }

    if(document.getElementById("routeTable")){

        loadRoutes?.();

    }

    if(document.getElementById("stopTable")){

        loadStops?.();

    }

    initializeDashboard();

    loadSettings();

    startAutoRefresh();

    const approveBtn = document.getElementById("approveStudentBtn");

if(approveBtn){

    approveBtn.addEventListener("click",()=>{

        if(selectedStudentId){

            approveStudent(selectedStudentId);

        }

    });

}

});

/*==================================================
 VERSION
==================================================*/

const ADMIN_VERSION="1.0.0";

console.log(

    "UTL StudentBus Admin",

    ADMIN_VERSION

);
async function loadRoutes(){

    try{

        const snapshot = await db
        .collection("routes")
        .orderBy("name")
        .get();

        routes = [];

        const table = document.getElementById("routeTable");

        if(!table) return;

        table.innerHTML = "";

        snapshot.forEach(doc=>{

            const route = {

                id: doc.id,

                ...doc.data()

            };

            routes.push(route);

            table.innerHTML += `

            <tr>

                <td>${route.routeId || doc.id}</td>

                <td>${route.name || "-"}</td>

                <td>${route.busId || "-"}</td>

                <td>${route.stops ? route.stops.length : 0}</td>

                <td>

                    ${route.active

                    ? '<span class="badge badge-success">Actif</span>'

                    : '<span class="badge badge-danger">Inactif</span>'}

                </td>

                <td>

                    <button

                    class="btn btn-primary"

                    onclick="showRouteDetails('${doc.id}')">

                        <i class="fa-solid fa-eye"></i>

                    </button>

                    <button

                    class="btn btn-warning"

                    onclick="editRoute('${doc.id}')">

                        <i class="fa-solid fa-pen"></i>

                    </button>

                    <button

                    class="btn btn-danger"

                    onclick="deleteRoute('${doc.id}')">

                        <i class="fa-solid fa-trash"></i>

                    </button>

                </td>

            </tr>

            `;

        });

    }

    catch(error){

        console.error(error);

    }

}
function searchRoute(search){

    const value = search.toLowerCase();

    const rows = document.querySelectorAll("#routeTable tr");

    rows.forEach(row=>{

        row.style.display =
        row.textContent.toLowerCase().includes(value)

        ? ""

        : "none";

    });

}
let selectedRouteId = null;

async function showRouteDetails(routeId){

    selectedRouteId = routeId;

    // À compléter

}

function editRoute(routeId){

    selectedRouteId = routeId;

    showRouteDetails(routeId);

}

async function deleteRoute(routeId){

    if(!confirm("Supprimer cet itinéraire ?")) return;

    try{

        await db.collection("routes")

        .doc(routeId)

        .delete();

        showToast("Succès","Itinéraire supprimé.","success");

        loadRoutes();

    }

    catch(error){

        console.error(error);

    }

}

function clearRouteForm(){

    document.getElementById("routeId").value="";

    document.getElementById("routeName").value="";

    document.getElementById("routeBus").value="";

    document.getElementById("routeStatus").value="true";

}