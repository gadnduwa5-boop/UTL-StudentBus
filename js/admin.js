const usersRef = db.collection(COLLECTIONS.USERS);

const busesRef = db.collection(COLLECTIONS.BUSES);

const routesRef = db.collection(COLLECTIONS.ROUTES);

const stopsRef = db.collection(COLLECTIONS.STOPS);

const notificationsRef = db.collection(COLLECTIONS.NOTIFICATIONS);

document.addEventListener("DOMContentLoaded", initializeAdmin);

async function initializeAdmin() {

    try {

        showLoader();

        await loadAdminProfile();

        await loadDashboardStats();

        await loadRecentUsers();

        await loadActiveBuses();

        await loadNotifications();

        hideLoader();

    }

    catch(error){

        console.error(error);

        hideLoader();

        showToast(

            "Impossible de charger le tableau de bord.",

            "error"

        );

    }

}

async function loadAdminProfile(){

    if(!currentUserData){

        return;

    }

    setText(

        "profileName",

        currentUserData.fullName

    );

    setText(

        "profileNameHeader",

        currentUserData.fullName

    );

    setText(

        "profileNameInfo",

        currentUserData.fullName

    );

    setText(

        "profileCardId",

        currentUserData.cardId

    );

    setText(

        "profileCardIdInfo",

        currentUserData.cardId

    );

    setText(

        "profilePhone",

        currentUserData.phone

    );

    setText(

        "profileEmail",

        currentUserData.email

    );

    setText(

        "profileStatus",

        currentUserData.status

    );

    const photo = document.getElementById(

        "adminPhoto"

    );

    if(photo){

        photo.src =

        currentUserData.photoURL ||

        "../image/avatar.png";

    }

}
async function loadDashboardStats() {

    const [

        users,

        buses,

        routes,

        stops

    ] = await Promise.all([

        usersRef.get(),

        busesRef.get(),

        routesRef.get(),

        stopsRef.get()

    ]);

    let students = 0;

    let drivers = 0;

    users.forEach(doc => {

        const user = doc.data();

        if (user.role === ROLES.STUDENT) {

            students++;

        }

        if (user.role === ROLES.DRIVER) {

            drivers++;

        }

    });

    setText(

        "totalUsers",

        users.size

    );

    setText(

        "totalStudents",

        students

    );

    setText(

        "totalDrivers",

        drivers

    );

    setText(

        "totalBuses",

        buses.size

    );

    setText(

        "totalStops",

        stops.size

    );

    setText(

        "totalRoutes",

        routes.size

    );

}

async function loadRecentUsers() {

    const tbody = document.getElementById(

        "recentUsers"

    );

    if (!tbody) {

        return;

    }

    const snapshot = await usersRef

        .orderBy("createdAt", "desc")

        .limit(5)

        .get();

    tbody.innerHTML = "";

    if (snapshot.empty) {

        tbody.innerHTML = `

<tr>

<td colspan="2">

Aucun utilisateur

</td>

</tr>`;

        return;

    }

    snapshot.forEach(doc => {

        const user = doc.data();

        tbody.innerHTML += `

<tr>

<td>${user.fullName}</td>

<td>${user.role}</td>

</tr>`;

    });

}
async function loadActiveBuses() {

    const table = document.getElementById(

        "activeBusTable"

    );

    if (!table) {

        return;

    }

    const snapshot = await busesRef.get();

    table.innerHTML = "";

    if (snapshot.empty) {

        table.innerHTML = `

<tr>

<td colspan="3">

Aucun bus enregistré.

</td>

</tr>`;

        return;

    }

    snapshot.forEach(doc => {

        const bus = doc.data();

        table.innerHTML += `

<tr>

<td>${bus.busNumber || "-"}</td>

<td>${bus.driverName || "-"}</td>

<td>${bus.status || "-"}</td>

</tr>`;

    });

}

async function loadNotifications() {

    const container = document.getElementById(

        "notificationList"

    );

    if (!container) {

        return;

    }

    const snapshot = await notificationsRef

        .orderBy("createdAt", "desc")

        .limit(5)

        .get();

    container.innerHTML = "";

    if (snapshot.empty) {

        container.innerHTML = `

<div class="notification-item">

<i class="fa-solid fa-bell"></i>

<div>

<strong>

Aucune notification

</strong>

<p>

Aucune notification disponible.

</p>

</div>

</div>`;

        return;

    }

    snapshot.forEach(doc => {

        const notification = doc.data();

        container.innerHTML += `

<div class="notification-item">

<i class="fa-solid fa-bell"></i>

<div>

<strong>

${notification.title || "Notification"}

</strong>

<p>

${notification.message || "-"}

</p>

</div>

</div>`;

    });

}
async function loadActivity() {

    const activityList = document.getElementById(

        "activityList"

    );

    if (!activityList) {

        return;

    }

    activityList.innerHTML = "";

    const snapshot = await usersRef

        .orderBy("createdAt", "desc")

        .limit(5)

        .get();

    if (snapshot.empty) {

        activityList.innerHTML = `

<div class="activity-item">

<i class="fa-solid fa-clock"></i>

<div>

<strong>

Aucune activité

</strong>

<p>

Aucune activité récente.

</p>

</div>

</div>`;

        return;

    }

    snapshot.forEach(doc => {

        const user = doc.data();

        activityList.innerHTML += `

<div class="activity-item">

<i class="fa-solid fa-user-plus"></i>

<div>

<strong>

${user.fullName}

</strong>

<p>

Nouvel utilisateur (${user.role})

</p>

</div>

</div>`;

    });

}

async function refreshDashboard() {

    showLoader();

    try {

        await loadDashboardStats();

        await loadRecentUsers();

        await loadActiveBuses();

        await loadNotifications();

        await loadActivity();

    }

    catch (error) {

        console.error(error);

        showToast(

            "Impossible d'actualiser le tableau de bord.",

            "error"

        );

    }

    finally {

        hideLoader();

    }

}

const refreshBtn = document.getElementById(

    "refreshBtn"

);

if (refreshBtn) {

    refreshBtn.addEventListener(

        "click",

        refreshDashboard

    );

}
function listenRealtimeUpdates() {

    usersRef.onSnapshot(() => {

        loadDashboardStats();

        loadRecentUsers();

        loadActivity();

    });

    busesRef.onSnapshot(() => {

        loadDashboardStats();

        loadActiveBuses();

    });

    notificationsRef

    .orderBy("createdAt", "desc")

    .limit(5)

    .onSnapshot(() => {

        loadNotifications();

    });

}

window.addEventListener("load", () => {

    listenRealtimeUpdates();

});

window.addEventListener("online", () => {

    showToast(

        "Connexion Internet rétablie.",

        "success"

    );

});

window.addEventListener("offline", () => {

    showToast(

        "Connexion Internet perdue.",

        "warning"

    );

});

window.addEventListener("beforeunload", () => {

    hideLoader();

});