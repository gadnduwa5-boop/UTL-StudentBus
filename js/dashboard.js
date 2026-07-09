/*====================================================
 UTL STUDENTBUS
 DASHBOARD.JS
 Version 1.0
====================================================*/

/*====================================================
 VARIABLES GLOBALES
====================================================*/

let currentUser = null;

let currentUserData = null;

let currentBus = null;

let currentRoute = null;

let notifications = [];

let isSidebarOpen = false;

let isLoading = false;

/*====================================================
 INITIALISATION
====================================================*/

document.addEventListener("DOMContentLoaded", () => {

    initializeDashboard();

});

/*====================================================
 INITIALISATION GÉNÉRALE
====================================================*/

async function initializeDashboard(){

    try{

        showLoader();

        await waitForAuthentication();

        setupSidebar();

        setupNotifications();

        hideLoader();

    }

    catch(error){

        console.error(error);

        hideLoader();

    }

}

/*====================================================
 ATTENDRE FIREBASE AUTH
====================================================*/

function waitForAuthentication(){

    return new Promise((resolve)=>{

        firebase.auth().onAuthStateChanged(user=>{

            currentUser = user;

            resolve(user);

        });

    });

}

/*====================================================
 LOADER
====================================================*/

function showLoader(){

    isLoading = true;

    const loader = document.getElementById("loader");

    if(loader){

        loader.style.display = "flex";

    }

}

function hideLoader(){

    isLoading = false;

    const loader = document.getElementById("loader");

    if(loader){

        loader.style.display = "none";

    }

}

/*====================================================
 SIDEBAR
====================================================*/

function toggleSidebar(){

    const sidebar = document.getElementById("sidebar");

    const overlay = document.getElementById("overlay");

    isSidebarOpen = !isSidebarOpen;

    if(sidebar){

        sidebar.classList.toggle("open", isSidebarOpen);

    }

    if(overlay){

        overlay.classList.toggle("show", isSidebarOpen);

    }

}

function closeSidebar(){

    isSidebarOpen = false;

    const sidebar = document.getElementById("sidebar");

    const overlay = document.getElementById("overlay");

    if(sidebar){

        sidebar.classList.remove("open");

    }

    if(overlay){

        overlay.classList.remove("show");

    }

}

function setupSidebar(){

    const overlay = document.getElementById("overlay");

    if(overlay){

        overlay.onclick = closeSidebar;

    }

}

/*====================================================
 NOTIFICATIONS
====================================================*/

function setupNotifications(){

    const badge = document.getElementById("notificationCount");

    if(badge){

        badge.textContent = "0";

    }

}
/*====================================================
 AUTHENTIFICATION
====================================================*/

/* Vérifier si l'utilisateur est connecté */

function checkAuthentication(){

    firebase.auth().onAuthStateChanged(async(user)=>{

        if(!user){

            window.location.href="../login.html";

            return;

        }

        currentUser=user;

        await loadCurrentUser();

    });

}

/*====================================================
 CHARGER L'UTILISATEUR CONNECTÉ
====================================================*/

async function loadCurrentUser(){

    try{

        const query=await db

        .collection(COLLECTIONS.USERS)

        .where("uid","==",currentUser.uid)

        .limit(1)

        .get();

        if(query.empty){

            await logout();

            return;

        }

        const doc=query.docs[0];

        currentUserData={

            id:doc.id,      // cardId

            ...doc.data()

        };

        updateProfile();

        redirectByRole();

    }

    catch(error){

        console.error(error);

    }

}

/*====================================================
 METTRE À JOUR LE PROFIL
====================================================*/

function updateProfile(){

    const fullName=

        currentUserData.fullName ||

        currentUser.displayName ||

        "Utilisateur";

    const email=

        currentUserData.email ||

        currentUser.email ||

        "-";

    const avatar=

        currentUserData.photoURL ||

        "../image/default-avatar.png";

    const nameIds=[

        "adminName",

        "driverName",

        "studentName"

    ];

    const emailIds=[

        "adminEmail",

        "driverEmail",

        "studentEmail"

    ];

    const avatarIds=[

        "adminAvatar",

        "driverAvatar",

        "studentAvatar"

    ];

    nameIds.forEach(id=>{

        const element=document.getElementById(id);

        if(element){

            element.textContent=fullName;

        }

    });

    emailIds.forEach(id=>{

        const element=document.getElementById(id);

        if(element){

            element.textContent=email;

        }

    });

    avatarIds.forEach(id=>{

        const element=document.getElementById(id);

        if(element){

            element.src=avatar;

        }

    });

}

/*====================================================
 REDIRECTION SELON LE RÔLE
====================================================*/

function redirectByRole(){

    if(!currentUserData) return;

    const role=currentUserData.role;

    const page=window.location.pathname;

    if(role==="admin" && !page.includes("/admin/")){

        window.location.href="../admin/dashboard.html";

        return;

    }

    if(role==="driver" && !page.includes("/driver/")){

        window.location.href="../driver/dashboard.html";

        return;

    }

    if(role==="student" && !page.includes("/student/")){

        window.location.href="../student/dashboard.html";

        return;

    }

}

/*====================================================
 DÉCONNEXION
====================================================*/

async function logout(){

    try{

        await firebase.auth().signOut();

        window.location.href="../login.html";

    }

    catch(error){

        console.error(error);

    }

}

/*====================================================
 RAFRAÎCHIR LE PROFIL
====================================================*/

async function refreshProfile(){

    await loadCurrentUser();

}
/*====================================================
 ADMINISTRATEUR
====================================================*/

/*====================================================
 CHARGER LE PROFIL ADMIN
====================================================*/

async function loadAdminProfile(){

    try{

        if(!currentUserData) return;

        if(currentUserData.role!=="admin") return;

        document.getElementById("adminName").textContent=
        currentUserData.fullName;

        document.getElementById("adminEmail").textContent=
        currentUserData.email;

        if(document.getElementById("adminAvatar")){

            document.getElementById("adminAvatar").src=
            currentUserData.photoURL ||
            "../image/default-avatar.png";

        }

    }

    catch(error){

        console.error(error);

    }

}

/*====================================================
 STATISTIQUES ADMIN
====================================================*/

async function loadDashboardStats(){

    try{

        const users=await db
        .collection(COLLECTIONS.USERS)
        .get();

        const buses=await db
        .collection(COLLECTIONS.BUSES)
        .get();

        const routes=await db
        .collection(COLLECTIONS.ROUTES)
        .get();

        const stops=await db
        .collection(COLLECTIONS.STOPS)
        .get();

        let students=0;

        let drivers=0;

        let admins=0;

        users.forEach(doc=>{

            const user=doc.data();

            switch(user.role){

                case "student":

                    students++;

                    break;

                case "driver":

                    drivers++;

                    break;

                case "admin":

                    admins++;

                    break;

            }

        });

        updateStat("studentCount",students);

        updateStat("driverCount",drivers);

        updateStat("busCount",buses.size);

        updateStat("routeCount",routes.size);

        updateStat("stopCount",stops.size);

        updateStat("adminCount",admins);

    }

    catch(error){

        console.error(error);

    }

}

/*====================================================
 METTRE À JOUR UNE STATISTIQUE
====================================================*/

function updateStat(id,value){

    const element=document.getElementById(id);

    if(element){

        element.textContent=value;

    }

}

/*====================================================
 DERNIÈRE SYNCHRONISATION
====================================================*/

function updateLastSync(){

    const element=document.getElementById("lastSync");

    if(!element) return;

    element.textContent=

    new Date().toLocaleString();

}

/*====================================================
 ACTUALISER LE DASHBOARD
====================================================*/

async function refreshDashboard(){

    showLoader();

    await loadDashboardStats();

    await loadNotifications();

    updateLastSync();

    hideLoader();

}
/*====================================================
 CHAUFFEUR
====================================================*/

/*====================================================
 CHARGER LE PROFIL CHAUFFEUR
====================================================*/

async function loadDriverProfile(){

    try{

        if(!currentUserData) return;

        if(currentUserData.role!=="driver") return;

        updateProfile();

    }

    catch(error){

        console.error(error);

    }

}

/*====================================================
 CHARGER LE BUS ATTRIBUÉ
====================================================*/

async function loadAssignedBus(){

    try{

        if(!currentUserData) return;

        const snapshot = await db

        .collection(COLLECTIONS.BUSES)

        .where("driverId","==",currentUserData.id)

        .limit(1)

        .get();

        if(snapshot.empty) return;

        const doc = snapshot.docs[0];

        currentBus = {

            id:doc.id,

            ...doc.data()

        };

        updateDriverBus();

    }

    catch(error){

        console.error(error);

    }

}

/*====================================================
 METTRE À JOUR LES INFORMATIONS DU BUS
====================================================*/

function updateDriverBus(){

    if(!currentBus) return;

    updateStat("assignedBus",currentBus.busNumber || "-");

    updateStat("busNumber",currentBus.busNumber || "-");

    updateStat("busPlate",currentBus.plateNumber || "-");

    updateStat("busCapacity",currentBus.capacity || "-");

    updateStat("busRoute",currentBus.routeName || "-");

}

/*====================================================
 CHARGER LES ÉTUDIANTS DU BUS
====================================================*/

async function loadDriverStudents(){

    try{

        if(!currentBus) return;

        const table = document.getElementById("driverStudentsTable");

        if(table){

            table.innerHTML="";

        }

        const snapshot = await db

        .collection(COLLECTIONS.USERS)

        .where("role","==","student")

        .where("busId","==",currentBus.busId)

        .get();

        let total=0;

        snapshot.forEach(doc=>{

            const student=doc.data();

            total++;

            if(table){

                table.innerHTML += `

                <tr>

                    <td>${student.cardId}</td>

                    <td>${student.fullName}</td>

                    <td>${student.faculty || "-"}</td>

                    <td>${student.promotion || "-"}</td>

                    <td>

                        <span class="badge badge-success">

                            Inscrit

                        </span>

                    </td>

                </tr>

                `;

            }

        });

        updateStat("studentCount",total);

        updateStat("studentsInBus",total+" étudiant(s)");

    }

    catch(error){

        console.error(error);

    }

}

/*====================================================
 DÉMARRER LE TRAJET
====================================================*/

async function startTrip(){

    if(!currentBus) return;

    try{

        await db.collection(COLLECTIONS.BUSES)

        .doc(currentBus.id)

        .update({

            active:true,

            tripStartedAt:new Date()

        });

        alert("Trajet démarré.");

    }

    catch(error){

        console.error(error);

    }

}

/*====================================================
 TERMINER LE TRAJET
====================================================*/

async function stopTrip(){

    if(!currentBus) return;

    try{

        await db.collection(COLLECTIONS.BUSES)

        .doc(currentBus.id)

        .update({

            active:false,

            tripEndedAt:new Date()

        });

        alert("Trajet terminé.");

    }

    catch(error){

        console.error(error);

    }

}

/*====================================================
 OUVRIR LA CARTE
====================================================*/

function openMap(){

    window.location.href="map.html";

}
/*====================================================
 GPS CHAUFFEUR
====================================================*/

let gpsWatcher = null;

/*====================================================
 PARTAGER LA POSITION GPS
====================================================*/

function shareLocation(){

    if(!navigator.geolocation){

        alert("Le GPS n'est pas disponible.");

        return;

    }

    if(gpsWatcher){

        navigator.geolocation.clearWatch(gpsWatcher);

    }

    gpsWatcher = navigator.geolocation.watchPosition(

        updateDriverGPS,

        error=>{

            console.error(error);

        },

        GPS_CONFIG

    );

}

/*====================================================
 METTRE À JOUR LA POSITION
====================================================*/

async function updateDriverGPS(position){

    try{

        if(!currentBus) return;

        const latitude = position.coords.latitude;

        const longitude = position.coords.longitude;

        const speed = position.coords.speed || 0;

        await db

        .collection(COLLECTIONS.BUS_LOCATIONS)

        .doc(currentBus.busId)

        .set({

            busId: currentBus.busId,

            driverId: currentUserData.id,

            latitude,

            longitude,

            speed: Math.round(speed * 3.6),

            updatedAt: firebase.firestore.FieldValue.serverTimestamp()

        },{

            merge:true

        });

        updateStat("driverLatitude",latitude.toFixed(6));

        updateStat("driverLongitude",longitude.toFixed(6));

        updateStat("driverSpeed",

            Math.round(speed*3.6)+" km/h"

        );

        updateStat(

            "lastGpsUpdate",

            new Date().toLocaleTimeString()

        );

        updateStat("gpsState","En ligne");

    }

    catch(error){

        console.error(error);

    }

}

/*====================================================
 CHARGER LES ARRÊTS
====================================================*/

async function loadDriverStops(){

    try{

        if(!currentBus) return;

        const list=document.getElementById(

            "driverStopsList"

        );

        if(!list) return;

        list.innerHTML="";

        const snapshot=await db

        .collection(COLLECTIONS.STOPS)

        .where("routeId","==",

        currentBus.routeId)

        .orderBy("order")

        .get();

        snapshot.forEach(doc=>{

            const stop=doc.data();

            list.innerHTML+=`

            <div class="list-item">

                <i class="fa-solid fa-location-dot"></i>

                ${stop.name}

            </div>

            `;

        });

    }

    catch(error){

        console.error(error);

    }

}

/*====================================================
 NOTIFICATIONS CHAUFFEUR
====================================================*/

async function loadDriverNotifications(){

    try{

        const container=document.getElementById(

            "driverNotifications"

        );

        if(!container) return;

        container.innerHTML="";

        const snapshot=await db

        .collection(COLLECTIONS.NOTIFICATIONS)

        .where("receiverId","==",

        currentUserData.id)

        .orderBy("createdAt","desc")

        .limit(20)

        .get();

        snapshot.forEach(doc=>{

            const notification=doc.data();

            container.innerHTML+=`

            <div class="list-item">

                ${notification.message}

            </div>

            `;

        });

    }

    catch(error){

        console.error(error);

    }

}

/*====================================================
 EFFACER LES NOTIFICATIONS
====================================================*/

function clearDriverNotifications(){

    const container=document.getElementById(

        "driverNotifications"

    );

    if(container){

        container.innerHTML=

        "<div class='list-item'>Aucune notification.</div>";

    }

}

/*====================================================
 HISTORIQUE DES TRAJETS
====================================================*/

async function loadTripHistory(){

    try{

        if(!currentBus) return;

        const table=document.getElementById(

            "tripHistoryTable"

        );

        if(!table) return;

        table.innerHTML="";

        const snapshot=await db

        .collection("trip_history")

        .where("driverId","==",

        currentUserData.id)

        .orderBy("date","desc")

        .limit(20)

        .get();

        snapshot.forEach(doc=>{

            const trip=doc.data();

            table.innerHTML+=`

            <tr>

                <td>${trip.date || "-"}</td>

                <td>${trip.departure || "-"}</td>

                <td>${trip.arrival || "-"}</td>

                <td>${trip.distance || "-"}</td>

                <td>${trip.duration || "-"}</td>

            </tr>

            `;

        });

    }

    catch(error){

        console.error(error);

    }

}
/*====================================================
 ÉTUDIANT
====================================================*/

/*====================================================
 CHARGER LE PROFIL ÉTUDIANT
====================================================*/

async function loadStudentProfile(){

    try{

        if(!currentUserData) return;

        if(currentUserData.role!=="student") return;

        updateProfile();

    }

    catch(error){

        console.error(error);

    }

}

/*====================================================
 CHARGER LE BUS DE L'ÉTUDIANT
====================================================*/

async function loadStudentBus(){

    try{

        if(!currentUserData.busId) return;

        const doc=await db

        .collection(COLLECTIONS.BUSES)

        .doc(currentUserData.busId)

        .get();

        if(!doc.exists) return;

        currentBus={

            id:doc.id,

            ...doc.data()

        };

        updateStudentBus();

    }

    catch(error){

        console.error(error);

    }

}

/*====================================================
 METTRE À JOUR LES INFORMATIONS DU BUS
====================================================*/

function updateStudentBus(){

    if(!currentBus) return;

    updateStat(

        "studentBusNumber",

        currentBus.busNumber || "-"

    );

    updateStat(

        "studentRoute",

        currentBus.routeName || "-"

    );

    updateStat(

        "studentDriver",

        currentBus.driverName || "-"

    );

}

/*====================================================
 CHARGER LA POSITION DU BUS
====================================================*/

function loadStudentBusLocation(){

    if(!currentBus) return;

    db.collection(COLLECTIONS.BUS_LOCATIONS)

    .doc(currentBus.busId)

    .onSnapshot(doc=>{

        if(!doc.exists) return;

        const location=doc.data();

        updateStat(

            "busSpeed",

            (location.speed || 0)+" km/h"

        );

        updateStat(

            "lastBusUpdate",

            new Date().toLocaleTimeString()

        );

    });

}

/*====================================================
 CHARGER LES NOTIFICATIONS
====================================================*/

async function loadStudentNotifications(){

    try{

        const container=document.getElementById(

            "studentNotifications"

        );

        if(!container) return;

        container.innerHTML="";

        const snapshot=await db

        .collection(COLLECTIONS.NOTIFICATIONS)

        .where(

            "receiverId",

            "==",

            currentUserData.id

        )

        .orderBy("createdAt","desc")

        .limit(20)

        .get();

        snapshot.forEach(doc=>{

            const notification=doc.data();

            container.innerHTML+=`

            <div class="list-item">

                ${notification.message}

            </div>

            `;

        });

    }

    catch(error){

        console.error(error);

    }

}

/*====================================================
 CALCULER ETA
====================================================*/

async function calculateStudentETA(){

    try{

        if(!currentBus) return;

        updateStat(

            "studentETA",

            "Calcul..."

        );

        // Le calcul détaillé sera effectué
        // dans map.js avec Google Directions API.

    }

    catch(error){

        console.error(error);

    }

}

/*====================================================
 ACTUALISER LE TABLEAU DE BORD ÉTUDIANT
====================================================*/

async function refreshStudentDashboard(){

    await loadStudentBus();

    loadStudentBusLocation();

    await loadStudentNotifications();

    await calculateStudentETA();

}
/*====================================================
 NOTIFICATIONS GÉNÉRALES
====================================================*/

async function loadNotifications(){

    try{

        if(!currentUserData) return;

        const badge=document.getElementById("notificationCount");

        const snapshot=await db

        .collection(COLLECTIONS.NOTIFICATIONS)

        .where("receiverId","==",currentUserData.id)

        .where("read","==",false)

        .get();

        if(badge){

            badge.textContent=snapshot.size;

        }

    }

    catch(error){

        console.error(error);

    }

}

/*====================================================
 MARQUER UNE NOTIFICATION COMME LUE
====================================================*/

async function markNotificationAsRead(notificationId){

    try{

        await db

        .collection(COLLECTIONS.NOTIFICATIONS)

        .doc(notificationId)

        .update({

            read:true

        });

    }

    catch(error){

        console.error(error);

    }

}

/*====================================================
 TOAST
====================================================*/

function showToast(message,type="success"){

    const toast=document.createElement("div");

    toast.className=`toast ${type}`;

    toast.textContent=message;

    document.body.appendChild(toast);

    setTimeout(()=>{

        toast.classList.add("show");

    },100);

    setTimeout(()=>{

        toast.remove();

    },3000);

}

/*====================================================
 FORMATTER UNE DATE
====================================================*/

function formatDate(date){

    if(!date) return "-";

    return new Date(date)

    .toLocaleDateString("fr-FR");

}

/*====================================================
 FORMATTER UNE HEURE
====================================================*/

function formatTime(date){

    if(!date) return "-";

    return new Date(date)

    .toLocaleTimeString("fr-FR");

}

/*====================================================
 FORMATTER UNE DISTANCE
====================================================*/

function formatDistance(distance){

    if(distance==null) return "0 m";

    if(distance<1000){

        return Math.round(distance)+" m";

    }

    return (distance/1000).toFixed(2)+" km";

}

/*====================================================
 FORMATTER UNE DURÉE
====================================================*/

function formatDuration(seconds){

    if(!seconds) return "00:00";

    const h=Math.floor(seconds/3600);

    const m=Math.floor((seconds%3600)/60);

    const s=Math.floor(seconds%60);

    if(h>0){

        return `${h} h ${m} min`;

    }

    return `${m} min ${s} s`;

}

/*====================================================
 GÉNÉRER UN IDENTIFIANT
====================================================*/

function generateId(prefix="ID"){

    return prefix+

    Date.now()+

    Math.floor(Math.random()*1000);

}

/*====================================================
 VÉRIFIER LA CONNEXION INTERNET
====================================================*/

function isOnline(){

    return navigator.onLine;

}

/*====================================================
 ACTUALISER LA DATE
====================================================*/

function updateCurrentDate(){

    const element=document.getElementById("currentDate");

    if(element){

        element.textContent=

        new Date().toLocaleString("fr-FR");

    }

}

/*====================================================
 RAFRAÎCHIR LES DONNÉES
====================================================*/

async function refreshPage(){

    try{

        showLoader();

        await refreshProfile();

        await loadNotifications();

        updateCurrentDate();

        hideLoader();

    }

    catch(error){

        console.error(error);

        hideLoader();

    }

}
/*====================================================
 INITIALISATION FINALE
====================================================*/

async function initializeApplication(){

    try{

        showLoader();

        await checkAuthentication();

        await loadNotifications();

        updateCurrentDate();

        switch(currentUserData.role){

            case "admin":

                await loadAdminProfile();

                await loadDashboardStats();

                break;

            case "driver":

                await loadDriverProfile();

                await loadAssignedBus();

                await loadDriverStudents();

                await loadDriverStops();

                await loadDriverNotifications();

                await loadTripHistory();

                break;

            case "student":

                await loadStudentProfile();

                await loadStudentBus();

                loadStudentBusLocation();

                await loadStudentNotifications();

                await calculateStudentETA();

                break;

        }

        hideLoader();

    }

    catch(error){

        console.error(error);

        hideLoader();

        showToast(

            "Une erreur est survenue.",

            "error"

        );

    }

}

/*====================================================
 ACTUALISATION AUTOMATIQUE
====================================================*/

let autoRefresh=null;

function startAutoRefresh(){

    stopAutoRefresh();

    autoRefresh=setInterval(async()=>{

        try{

            await loadNotifications();

            updateCurrentDate();

        }

        catch(error){

            console.error(error);

        }

    },30000);

}

function stopAutoRefresh(){

    if(autoRefresh){

        clearInterval(autoRefresh);

        autoRefresh=null;

    }

}

/*====================================================
 ÉVÉNEMENTS
====================================================*/

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

window.addEventListener("beforeunload",()=>{

    stopAutoRefresh();

});

/*====================================================
 LANCEMENT
====================================================*/

document.addEventListener(

    "DOMContentLoaded",

    async()=>{

        await initializeApplication();

        startAutoRefresh();

    }

);