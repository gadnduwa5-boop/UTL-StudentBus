let currentUser = null;
let currentUserData = null;
let currentBus = null;

let map = null;
let busMarker = null;
let unsubscribeBusLocation = null;

document.addEventListener("DOMContentLoaded", initializeDashboard);

function initializeDashboard() {

    const logoutBtn = document.getElementById("logoutBtn");

    if (logoutBtn) {

        logoutBtn.addEventListener("click", logout);

    }

    const overlayBtn =

        document.getElementById("overlayBtn") ||

        document.getElementById("menuBtn") ||

        document.getElementById("profileBtn");

    const overlay =

        document.getElementById("overlay") ||

        document.getElementById("sidebarOverlay");

    if (overlayBtn && overlay) {

        overlayBtn.addEventListener("click", () => {

            overlay.classList.toggle("active");

        });

        overlay.addEventListener("click", () => {

            overlay.classList.remove("active");

        });

    }

    auth.onAuthStateChanged(handleAuthState);

}

async function handleAuthState(user) {

    if (!user) {

        window.location.replace("../login.html");

        return;

    }

    currentUser = user;

    showLoader();

    try {

        await loadCurrentUser();

    } catch (error) {

        console.error(error);

        await logout();

    }

}

async function loadCurrentUser() {

    const snapshot = await db

        .collection(COLLECTIONS.USERS)

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

    setText("profileName", currentUserData.fullName);

    setText("profileCardId", currentUserData.cardId);

    if (currentUserData.role === ROLES.STUDENT) {

        setText("profileFaculty", currentUserData.faculty);

        setText("profileDepartment", currentUserData.department);

        setText("profilePromotion", currentUserData.promotion);

    }

    if (currentUserData.role === ROLES.DRIVER) {

        setText("profileBus", currentUserData.busId);

    }

    const photo =

        document.getElementById("studentPhoto") ||

        document.getElementById("driverPhoto") ||

        document.getElementById("adminPhoto");

    if (photo) {

        photo.src = currentUserData.photoURL || "../image/avatar.png";

    }

}

async function loadBus() {

    if (!currentUserData.busId) {

        currentBus = null;

        return;

    }

    const busDoc = await db

        .collection(COLLECTIONS.BUSES)

        .doc(currentUserData.busId)

        .get();

    if (!busDoc.exists) {

        currentBus = null;

        return;

    }

    currentBus = busDoc.data();

    updateBus();

}

function updateBus() {

    if (!currentBus) {

        return;

    }

    setText("busNumber", currentBus.busNumber);

    setText("busStatus", currentBus.status);

    setText("driverName", currentBus.driverName);

    setText("estimatedArrival", currentBus.estimatedArrival);

    setText("nextStop", currentBus.nextStop);

    setText("profileBus", currentBus.busId || currentUserData.busId);

}
function loadDashboard() {

    switch (currentUserData.role) {

        case ROLES.ADMIN:

            loadAdminDashboard();

            break;

        case ROLES.DRIVER:

            loadDriverDashboard();

            break;

        case ROLES.STUDENT:

            loadStudentDashboard();

            break;

        default:

            throw new Error("Rôle inconnu.");

    }

}

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

    if (currentUserData.role === ROLES.ADMIN) {

        loadStatistics();

    }

}
function listenBusLocation() {

    if (!currentUserData.busId) {

        return;

    }

    if (unsubscribeBusLocation) {

        unsubscribeBusLocation();

    }

    unsubscribeBusLocation = db

        .collection(COLLECTIONS.BUS_LOCATIONS)

        .doc(currentUserData.busId)

        .onSnapshot(snapshot => {

            if (!snapshot.exists) {

                return;

            }

            updateMap(snapshot.data());

        });

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

            lat: MAP_CONFIG.defaultCenter.lat,

            lng: MAP_CONFIG.defaultCenter.lng

        },

        zoom: MAP_CONFIG.defaultZoom,

        mapTypeId: MAP_CONFIG.mapTypeId

    });

}

function updateMap(location) {

    if (!map || !location) {

        return;

    }

    const position = {

        lat: location.lat,

        lng: location.lng

    };

    if (!busMarker) {

        busMarker = new google.maps.Marker({

            map: map,

            position: position,

            title: currentBus ? currentBus.busNumber : "Bus"

        });

    } else {

        busMarker.setPosition(position);

    }

    map.setCenter(position);

}

window.initStudentMap = initMap;

window.initDriverMap = initMap;

window.initAdminMap = initMap;
async function loadStatistics() {

    if (currentUserData.role !== ROLES.ADMIN) {

        return;

    }

    const [usersSnapshot, busesSnapshot] = await Promise.all([

        db.collection(COLLECTIONS.USERS).get(),

        db.collection(COLLECTIONS.BUSES).get()

    ]);

    setText("totalUsers", usersSnapshot.size);

    setText("totalBuses", busesSnapshot.size);

}

async function logout() {

    try {

        if (unsubscribeBusLocation) {

            unsubscribeBusLocation();

            unsubscribeBusLocation = null;

        }

        await auth.signOut();

        window.location.replace("../login.html");

    } catch (error) {

        console.error(error);

        showToast("Erreur lors de la déconnexion.", "error");

    }

}

window.addEventListener("beforeunload", () => {

    if (unsubscribeBusLocation) {

        unsubscribeBusLocation();

    }

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
function setText(id, value) {

    const element = document.getElementById(id);

    if (!element) {

        return;

    }

    element.textContent = value ?? "-";

}

function showLoader() {

    const loader =

        document.getElementById("loader") ||

        document.getElementById("pageLoader");

    if (loader) {

        loader.style.display = "flex";

    }

}

function hideLoader() {

    const loader =

        document.getElementById("loader") ||

        document.getElementById("pageLoader");

    if (loader) {

        loader.style.display = "none";

    }

}

function showToast(message, type = "success") {

    const toast = document.getElementById("toast");

    if (!toast) {

        return;

    }

    toast.className = "toast " + type;

    toast.textContent = message;

    toast.style.display = "block";

    clearTimeout(showToast.timer);

    showToast.timer = setTimeout(() => {

        toast.style.display = "none";

    }, 3000);

}
function toggleSidebar() {

    const sidebar = document.getElementById("sidebar");

    const overlay = document.getElementById("overlay");

    if (!sidebar || !overlay) {

        return;

    }

    sidebar.classList.toggle("active");

    overlay.classList.toggle("active");

}

document.getElementById("overlay")?.addEventListener("click", () => {

    document.getElementById("sidebar")?.classList.remove("active");

    document.getElementById("overlay")?.classList.remove("active");

});
function toggleSidebar() {

    const sidebar = document.getElementById("sidebar");

    const overlay = document.getElementById("overlay");

    if (!sidebar || !overlay) return;

    sidebar.classList.toggle("active");

    overlay.classList.toggle("active");

}