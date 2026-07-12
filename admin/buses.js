const busesCollection = db.collection(COLLECTIONS.BUSES);
const usersCollection = db.collection(COLLECTIONS.USERS);

let buses = [];
let selectedBus = null;

document.addEventListener("DOMContentLoaded", () => {

    initializePage();

});

async function initializePage() {

    await loadBuses();

}

async function loadBuses() {

    try {

        showLoader();

        const snapshot = await busesCollection

            .orderBy("busNumber")

            .get();

        buses = [];

        for (const doc of snapshot.docs) {

            const bus = {

                id: doc.id,

                ...doc.data()

            };

            const studentsSnapshot = await usersCollection

                .where("role", "==", "student")

                .where("busId", "==", bus.id)

                .get();

            bus.studentCount = studentsSnapshot.size;

            bus.availableSeats =

                Math.max(

                    0,

                    (bus.capacity || 0)

                    -

                    bus.studentCount

                );

            buses.push(bus);

        }

        renderBuses(buses);

        updateStatistics();

        hideLoader();

    }

    catch (error) {

        console.error(error);

        hideLoader();

        showToast(

            "Impossible de charger les bus.",

            "error"

        );

    }

}

function renderBuses(list) {

    const table = document.getElementById(

        "busesTable"

    );

    if (!table) return;

    table.innerHTML = "";

    if (list.length === 0) {

        table.innerHTML = `

<tr>

<td colspan="7">

Aucun bus trouvé.

</td>

</tr>`;

        return;

    }

    list.forEach(bus => {

        table.innerHTML += `

<tr>

<td>${bus.busNumber}</td>

<td>${bus.driverName || "-"}</td>

<td>${bus.capacity}</td>

<td>${bus.availableSeats}</td>

<td>${bus.studentCount}</td>

<td>${bus.status}</td>

<td>

<button

class="quick-btn"

onclick="selectBus('${bus.id}')">

Voir

</button>

</td>

</tr>`;

    });

}
function selectBus(busId) {

    selectedBus = buses.find(

        bus => bus.id === busId

    );

    if (!selectedBus) {

        return;

    }

    setText(

        "busNumber",

        selectedBus.busNumber

    );

    setText(

        "driverName",

        selectedBus.driverName || "Non attribué"

    );

    setText(

        "busCapacity",

        selectedBus.capacity

    );

    setText(

        "busAvailableSeats",

        selectedBus.availableSeats

    );

    setText(

        "busStudents",

        selectedBus.studentCount

    );

    setText(

        "busStatus",

        selectedBus.status

    );

    setValue(

        "busId",

        selectedBus.busId || selectedBus.id

    );

    setValue(

        "busNumberInput",

        selectedBus.busNumber

    );

    setValue(

        "busCapacityInput",

        selectedBus.capacity

    );

    setValue(

        "availableSeatsInput",

        selectedBus.availableSeats

    );

    setValue(

        "busStatusInput",

        selectedBus.status

    );

    setValue(

        "nextStopInput",

        selectedBus.nextStop || ""

    );

}

function updateStatistics() {

    setText(

        "totalBuses",

        buses.length

    );

    setText(

        "activeBuses",

        buses.filter(

            bus => bus.status === "active"

        ).length

    );

    setText(

        "maintenanceBuses",

        buses.filter(

            bus => bus.status === "maintenance"

        ).length

    );

    const available = buses.reduce(

        (sum, bus) =>

            sum + bus.availableSeats,

        0

    );

    setText(

        "availableSeats",

        available

    );

}
function filterBuses() {

    const search = document

        .getElementById("searchBus")

        ?.value

        .trim()

        .toLowerCase();

    const status = document

        .getElementById("statusFilter")

        ?.value;

    const filtered = buses.filter(bus => {

        const matchSearch =

            (bus.busNumber || "")

            .toLowerCase()

            .includes(search)

            ||

            (bus.driverName || "")

            .toLowerCase()

            .includes(search);

        const matchStatus =

            !status ||

            bus.status === status;

        return matchSearch && matchStatus;

    });

    renderBuses(filtered);

}

async function saveBus(event) {

    event.preventDefault();

    try {

        const busId = document

            .getElementById("busId")

            .value

            .trim();

        const data = {

            busId: busId,

            busNumber: document

                .getElementById("busNumberInput")

                .value

                .trim(),

            capacity: Number(

                document

                .getElementById("busCapacityInput")

                .value

            ),

            status: document

                .getElementById("busStatusInput")

                .value,

            nextStop: document

                .getElementById("nextStopInput")

                .value

                .trim()

        };

        const doc = await busesCollection

            .doc(busId)

            .get();

        if (doc.exists) {

            await busesCollection

                .doc(busId)

                .update(data);

            showToast(

                "Bus modifié avec succès.",

                "success"

            );

        }

        else {

            data.driverId = "";

            data.driverName = "";

            data.createdAt =

                firebase.firestore.FieldValue.serverTimestamp();

            await busesCollection

                .doc(busId)

                .set(data);

            showToast(

                "Bus ajouté avec succès.",

                "success"

            );

        }

        document

            .getElementById("busForm")

            .reset();

        selectedBus = null;

        loadBuses();

    }

    catch (error) {

        console.error(error);

        showToast(

            "Impossible d'enregistrer le bus.",

            "error"

        );

    }

}

function refreshBuses() {

    loadBuses();

}

document

.getElementById("busForm")

?.addEventListener(

    "submit",

    saveBus

);

document

.getElementById("refreshBuses")

?.addEventListener(

    "click",

    refreshBuses

);

document

.getElementById("searchBus")

?.addEventListener(

    "input",

    filterBuses

);

document

.getElementById("statusFilter")

?.addEventListener(

    "change",

    filterBuses

);
async function deleteBus() {

    if (!selectedBus) {

        showToast(

            "Sélectionnez un bus.",

            "warning"

        );

        return;

    }

    if (!confirm("Supprimer ce bus ?")) {

        return;

    }

    try {

        await busesCollection

            .doc(selectedBus.id)

            .delete();

        showToast(

            "Bus supprimé.",

            "success"

        );

        selectedBus = null;

        loadBuses();

    }

    catch (error) {

        console.error(error);

        showToast(

            "Impossible de supprimer le bus.",

            "error"

        );

    }

}

async function assignDriver() {

    if (!selectedBus) {

        showToast(

            "Sélectionnez un bus.",

            "warning"

        );

        return;

    }

    const driverId = document

        .getElementById("driverSelect")

        .value;

    if (!driverId) {

        showToast(

            "Sélectionnez un chauffeur.",

            "warning"

        );

        return;

    }

    try {

        const driverDoc = await usersCollection

            .doc(driverId)

            .get();

        if (!driverDoc.exists) {

            showToast(

                "Chauffeur introuvable.",

                "error"

            );

            return;

        }

        const driver = driverDoc.data();

        await busesCollection

            .doc(selectedBus.id)

            .update({

                driverId: driverId,

                driverName: driver.fullName

            });

        showToast(

            "Chauffeur attribué.",

            "success"

        );

        loadBuses();

    }

    catch (error) {

        console.error(error);

        showToast(

            "Impossible d'attribuer le chauffeur.",

            "error"

        );

    }

}

async function viewStudents() {

    if (!selectedBus) {

        showToast(

            "Sélectionnez un bus.",

            "warning"

        );

        return;

    }

    const snapshot = await usersCollection

        .where("role", "==", "student")

        .where("busId", "==", selectedBus.id)

        .get();

    showToast(

        `${snapshot.size} étudiant(s) dans ce bus.`,

        "success"

    );

}

document

.getElementById("deleteBusBtn")

?.addEventListener(

    "click",

    deleteBus

);

document

.getElementById("saveDriverBtn")

?.addEventListener(

    "click",

    assignDriver

);

document

.getElementById("viewStudentsBtn")

?.addEventListener(

    "click",

    viewStudents

);
async function loadDrivers() {

    try {

        const select = document.getElementById(

            "driverSelect"

        );

        if (!select) return;

        select.innerHTML = `

<option value="">

Sélectionner un chauffeur

</option>`;

        snapshot.forEach(doc => {

            const driver = doc.data();

            select.innerHTML += `

<option value="${doc.id}">

${driver.fullName}

</option>`;

        });

    }

    catch (error) {

        console.error(error);

        showToast(

            "Impossible de charger les chauffeurs.",

            "error"

        );

    }

}

document.addEventListener(

    "DOMContentLoaded",

    () => {

        loadDrivers();

    }

);

window.selectBus = selectBus;