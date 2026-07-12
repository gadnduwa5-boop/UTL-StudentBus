const usersCollection = db.collection(COLLECTIONS.USERS);
const busesCollection = db.collection(COLLECTIONS.BUSES);
const notificationsCollection = db.collection(COLLECTIONS.NOTIFICATIONS);

let currentStudent = null;
let notifications = [];

document.addEventListener("DOMContentLoaded", () => {

    loadStudentProfile();

});

async function loadStudentProfile() {

    try {

        showLoader();

        const cardId = localStorage.getItem("cardId");

        if (!cardId) {

            window.location.href = "../login.html";

            return;

        }

        const doc = await usersCollection
            .doc(cardId)
            .get();

        if (!doc.exists) {

            hideLoader();

            showToast(

                "Étudiant introuvable.",

                "error"

            );

            return;

        }

        currentStudent = {

            id: doc.id,

            ...doc.data()

        };

        setText(

            "studentName",

            currentStudent.fullName

        );

        setText(

            "profileName",

            currentStudent.fullName

        );

        setText(

            "profileCardId",

            currentStudent.cardId

        );

        setText(

            "profileFullName",

            currentStudent.fullName

        );

        setText(

            "profileStudentCard",

            currentStudent.cardId

        );

        setText(

            "profileFaculty",

            currentStudent.faculty

        );

        setText(

            "profileDepartment",

            currentStudent.department

        );

        setText(

            "profilePromotion",

            currentStudent.promotion

        );

        setText(

            "profilePhone",

            currentStudent.phone

        );

        setText(

            "profileEmail",

            currentStudent.email

        );

        const photo = document.getElementById("studentPhoto");

        if (photo) {

            photo.src =

                currentStudent.photoURL ||

                "../image/avatar.png";

        }
        await loadStudentBus();
        await loadNotifications();
        await loadTripHistory();
        hideLoader();

    }

    catch (error) {

        console.error(error);

        hideLoader();

        showToast(

            "Impossible de charger le profil.",

            "error"

        );

    }

}
async function loadStudentBus() {

    try {

        if (!currentStudent || !currentStudent.busId) {

            setText("studentBus", "Aucun");

            setText("busNumber", "-");

            setText("driverName", "-");

            setText("driverPhone", "-");

            setText("busCapacity", "-");

            setText("availableSeats", "-");

            setText("busStatus", "Aucun bus");

            return;

        }

        const busDoc = await busesCollection

            .doc(currentStudent.busId)

            .get();

        if (!busDoc.exists) {

            showToast(

                "Bus introuvable.",

                "warning"

            );

            return;

        }

        currentBus = {

            id: busDoc.id,

            ...busDoc.data()

        };

        setText(

            "studentBus",

            currentBus.busNumber

        );

        setText(

            "busNumber",

            currentBus.busNumber

        );

        setText(

            "driverName",

            currentBus.driverName ||

            "Non attribué"

        );

        setText(

            "busCapacity",

            currentBus.capacity || 0

        );

        setText(

            "availableSeats",

            currentBus.availableSeats || 0

        );

        setText(

            "busStatus",

            currentBus.status || "inactive"

        );

        setText(

            "nextStop",

            currentBus.nextStop || "-"

        );

        setText(

            "arrivalTime",

            currentBus.estimatedArrival || "--:--"

        );

        if (currentBus.driverId) {

            const driverDoc = await usersCollection

                .doc(currentBus.driverId)

                .get();

            if (driverDoc.exists) {

                const driver = driverDoc.data();

                setText(

                    "driverPhone",

                    driver.phone || "-"

                );

            }

        }

    }

    catch (error) {

        console.error(error);

        showToast(

            "Impossible de charger le bus.",

            "error"

        );

    }

}
async function loadNotifications() {

    try {

        if (!currentStudent) return;

        const snapshot = await notificationsCollection

            .where("cardId", "==", currentStudent.cardId)

            .orderBy("createdAt", "desc")

            .limit(10)

            .get();

        notifications = [];

        const list = document.getElementById(

            "notificationList"

        );

        list.innerHTML = "";

        snapshot.forEach(doc => {

            const notification = {

                id: doc.id,

                ...doc.data()

            };

            notifications.push(notification);

            list.innerHTML += `

<div class="notification-item">

<i class="fa-solid fa-bell"></i>

<div>

<strong>

${notification.title || "Notification"}

</strong>

<p>

${notification.message || ""}

</p>

</div>

</div>`;

        });

        if (notifications.length === 0) {

            list.innerHTML = `

<div class="notification-item">

<p>

Aucune notification.

</p>

</div>`;

        }

        setText(

            "notificationCount",

            notifications.length

        );

        setText(

            "notificationBadge",

            notifications.length

        );

    }

    catch (error) {

        console.error(error);

    }

}

async function loadTripHistory() {

    const table = document.getElementById(

        "historyTable"

    );

    if (!table) return;

    table.innerHTML = `

<tr>

<td colspan="5"

class="text-center">

Historique bientôt disponible.

</td>

</tr>`;

}

function initializeMap() {

    map = new google.maps.Map(

        document.getElementById("map"),

        {

            center: {

                lat: -10.7148,

                lng: 25.4729

            },

            zoom: 14,

            mapTypeId: "roadmap"

        }

    );

    loadBusLocation();

}

async function loadBusLocation() {

    if (!currentBus) return;

    try {

        const busDoc = await busesCollection

            .doc(currentBus.id)

            .get();

        if (!busDoc.exists) return;

        const bus = busDoc.data();

        if (

            !bus.latitude ||

            !bus.longitude

        ) {

            return;

        }

        const position = {

            lat: bus.latitude,

            lng: bus.longitude

        };

        if (!busMarker) {

            busMarker = new google.maps.Marker({

                position,

                map,

                title: bus.busNumber,

                icon: "../image/bus-marker.png"

            });

        } else {

            busMarker.setPosition(position);

        }

        map.panTo(position);

    }

    catch (error) {

        console.error(error);

    }

}

function followBus() {

    loadBusLocation();

}

function refreshMap() {

    loadBusLocation();

}

function centerOnStudent() {

    if (!navigator.geolocation) {

        return;

    }

    navigator.geolocation.getCurrentPosition(position => {

        const studentPosition = {

            lat: position.coords.latitude,

            lng: position.coords.longitude

        };

        if (!studentMarker) {

            studentMarker = new google.maps.Marker({

                position: studentPosition,

                map,

                title: "Ma position"

            });

        } else {

            studentMarker.setPosition(studentPosition);

        }

        map.panTo(studentPosition);

    });

}

setInterval(() => {

    if (currentBus) {

        loadBusLocation();

    }

}, 10000);
function refreshDashboard() {

    if (!currentStudent) {

        return;

    }

    loadStudentProfile();

}

function listenStudentUpdates() {

    if (!currentStudent) {

        return;

    }

    usersCollection

        .doc(currentStudent.cardId)

        .onSnapshot(doc => {

            if (!doc.exists) {

                return;

            }

            currentStudent = {

                id: doc.id,

                ...doc.data()

            };

            loadStudentBus();

            loadNotifications();

        });

}

function listenBusUpdates() {

    if (!currentStudent ||

        !currentStudent.busId) {

        return;

    }

    busesCollection

        .doc(currentStudent.busId)

        .onSnapshot(doc => {

            if (!doc.exists) {

                return;

            }

            currentBus = {

                id: doc.id,

                ...doc.data()

            };

            setText(

                "busStatus",

                currentBus.status || "-"

            );

            setText(

                "nextStop",

                currentBus.nextStop || "-"

            );

            setText(

                "arrivalTime",

                currentBus.estimatedArrival || "--:--"

            );

            loadBusLocation();

        });

}

async function logout() {

    if (!confirm(

        "Voulez-vous vraiment vous déconnecter ?"

    )) {

        return;

    }

    try {

        await firebase.auth().signOut();

    }

    catch (e) {

        console.error(e);

    }

    localStorage.removeItem("cardId");

    localStorage.removeItem("userRole");

    window.location.href = "../login.html";

}

document

.getElementById("logoutBtn")

?.addEventListener(

    "click",

    logout

);

document.addEventListener(

    "DOMContentLoaded",

    () => {

        setTimeout(() => {

            listenStudentUpdates();

            listenBusUpdates();

        }, 1000);

    }

);
