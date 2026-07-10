const auth = firebase.auth();

let currentUser = null;
let currentUserData = null;
let currentBus = null;
let map = null;
let busMarker = null;

const loader = document.getElementById("pageLoader");
const toast = document.getElementById("toast");
const logoutBtn = document.getElementById("logoutBtn");

document.addEventListener("DOMContentLoaded", initializeDashboard);

function initializeDashboard() {

    if (logoutBtn) {
        logoutBtn.addEventListener("click", logout);
    }

    auth.onAuthStateChanged(handleAuthState);

}

async function handleAuthState(user) {

    if (!user) {
        window.location.replace("../login.html");
        return;
    }

    currentUser = user;

    try {

        await loadCurrentUser();

    } catch (error) {

        console.error(error);

        await logout();

    }

}
async function loadCurrentUser() {

    const snapshot = await db
        .collection("users")
        .where("uid", "==", currentUser.uid)
        .limit(1)
        .get();

    if (snapshot.empty) {

        throw new Error("Utilisateur introuvable.");

    }

    currentUserData = snapshot.docs[0].data();

    updateProfile();

    await loadBus();

    loadDashboard();

}

function updateProfile() {

    setText("studentName", currentUserData.fullName);
    setText("profileName", currentUserData.fullName);
    setText("profileCardId", currentUserData.cardId);
    setText("profileFaculty", currentUserData.faculty);
    setText("profileDepartment", currentUserData.department);
    setText("profilePromotion", currentUserData.promotion);

    const photo = document.getElementById("studentPhoto");

    if (photo) {

        photo.src = currentUserData.photoURL || "../image/avatar.png";

    }

}

function setText(id, value) {

    const element = document.getElementById(id);

    if (element) {

        element.textContent = value || "-";

    }

}

function loadDashboard() {

    if (currentUserData.role === "admin") {

        loadAdminDashboard();

        return;

    }

    if (currentUserData.role === "driver") {

        loadDriverDashboard();

        return;

    }

    if (currentUserData.role === "student") {

        loadStudentDashboard();

        return;

    }

    throw new Error("Rôle invalide.");

}
async function loadBus() {

    if (!currentUserData.busId) {

        currentBus = null;

        return;

    }

    const busDoc = await db
        .collection("buses")
        .doc(currentUserData.busId)
        .get();

    if (!busDoc.exists) {

        currentBus = null;

        return;

    }

    currentBus = busDoc.data();

    updateBus();

    listenBusLocation();

}

function updateBus() {

    setText("busNumber", currentBus.busNumber);
    setText("busStatus", currentBus.status);
    setText("driverName", currentBus.driverName);
    setText("estimatedArrival", currentBus.estimatedArrival);
    setText("nextStop", currentBus.nextStop);

}

function listenBusLocation() {

    db.collection("bus_locations")
        .doc(currentUserData.busId)
        .onSnapshot(snapshot => {

            if (!snapshot.exists) {

                return;

            }

            const location = snapshot.data();

            updateMap(location);

        });

}

function updateMap(location) {

    if (!map) {

        return;

    }

    const position = {

        lat: location.lat,

        lng: location.lng

    };

    if (!busMarker) {

        busMarker = new google.maps.Marker({

            map,

            position,

            title: currentBus.busNumber

        });

    } else {

        busMarker.setPosition(position);

    }

    map.setCenter(position);

}
function initMap() {

    const mapElement =
        document.getElementById("studentMap") ||
        document.getElementById("driverMap") ||
        document.getElementById("adminMap");

    if (!mapElement) {

        return;

    }

    map = new google.maps.Map(mapElement, {

        center: {
            lat: -10.7144,
            lng: 25.4667
        },

        zoom: 13,

        mapTypeId: "roadmap"

    });

}

async function loadStatistics() {

    if (currentUserData.role !== "admin") {

        return;

    }

    const [users, buses] = await Promise.all([

        db.collection("users").get(),

        db.collection("buses").get()

    ]);

    setText("totalUsers", users.size);

    setText("totalBuses", buses.size);

}

function startRealtimeUpdates() {

    if (currentUserData.role === "student") {

        listenBusLocation();

    }

    if (currentUserData.role === "driver") {

        listenBusLocation();

    }

    if (currentUserData.role === "admin") {

        loadStatistics();

    }

}

window.initStudentMap = function () {

    initMap();

};

window.initDriverMap = function () {

    initMap();

};

window.initAdminMap = function () {

    initMap();

};
function initMap() {

    const mapElement =
        document.getElementById("studentMap") ||
        document.getElementById("driverMap") ||
        document.getElementById("adminMap");

    if (!mapElement) {

        return;

    }

    map = new google.maps.Map(mapElement, {

        center: {
            lat: -10.7144,
            lng: 25.4667
        },

        zoom: 13,

        mapTypeId: "roadmap"

    });

}

async function loadStatistics() {

    if (currentUserData.role !== "admin") {

        return;

    }

    const [users, buses] = await Promise.all([

        db.collection("users").get(),

        db.collection("buses").get()

    ]);

    setText("totalUsers", users.size);

    setText("totalBuses", buses.size);

}

function startRealtimeUpdates() {

    if (currentUserData.role === "student") {

        listenBusLocation();

    }

    if (currentUserData.role === "driver") {

        listenBusLocation();

    }

    if (currentUserData.role === "admin") {

        loadStatistics();

    }

}

window.initStudentMap = function () {

    initMap();

};

window.initDriverMap = function () {

    initMap();

};

window.initAdminMap = function () {

    initMap();

};
function loadAdminDashboard() {

    loadStatistics();

    startRealtimeUpdates();

    hideLoader();

}

function loadDriverDashboard() {

    startRealtimeUpdates();

    hideLoader();

}

function loadStudentDashboard() {

    startRealtimeUpdates();

    hideLoader();

}

function startRealtimeUpdates() {

    if (currentUserData.busId) {

        listenBusLocation();

    }

}

window.addEventListener("beforeunload", () => {

    if (busMarker) {

        busMarker.setMap(null);

        busMarker = null;

    }

});

window.addEventListener("pageshow", () => {

    if (currentUser && !currentUserData) {

        loadCurrentUser();

    }

});