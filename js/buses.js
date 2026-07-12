let buses = [];

let drivers = [];

let selectedBus = null;

document.addEventListener("DOMContentLoaded", () => {

    loadBuses();

});

async function loadBuses() {

    try {

        showLoader();

        const snapshot = await busesRef.get();

        buses = [];

        snapshot.forEach(doc => {

            buses.push({

                id: doc.id,

                ...doc.data()

            });

        });

        renderBuses(buses);

        await loadDrivers();

        hideLoader();

    }

    catch(error){

        console.error(error);

        hideLoader();

        showToast(

            "Impossible de charger les bus.",

            "error"

        );

    }

}
updateStatistics();

function renderBuses(list){

    const table = document.getElementById(

        "busesTable"

    );

    if(!table){

        return;

    }

    table.innerHTML = "";

    if(list.length===0){

        table.innerHTML = `

<tr>

<td colspan="7">

Aucun bus enregistré.

</td>

</tr>`;

        return;

    }

    list.forEach(bus=>{

        table.innerHTML += `

<tr>

<td>${bus.busNumber||"-"}</td>

<td>${bus.driverName||"-"}</td>

<td>${bus.capacity||0}</td>

<td>${bus.availableSeats||0}</td>

<td>${bus.students ? bus.students.length : 0}</td>

<td>${bus.status||"-"}</td>

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

        selectedBus.students ?

        selectedBus.students.length : 0

    );

    setText(

        "busStatus",

        selectedBus.status

    );

    document.getElementById(

        "busId"

    ).value = selectedBus.busId || selectedBus.id;

    document.getElementById(

        "busNumberInput"

    ).value = selectedBus.busNumber || "";

    document.getElementById(

        "busCapacityInput"

    ).value = selectedBus.capacity || "";

    document.getElementById(

        "availableSeatsInput"

    ).value = selectedBus.availableSeats || "";

    document.getElementById(

        "busStatusInput"

    ).value = selectedBus.status || "active";

    document.getElementById(

        "nextStopInput"

    ).value = selectedBus.nextStop || "";

    const driverSelect = document.getElementById(

        "driverSelect"

    );

    if (driverSelect) {

        driverSelect.value =

        selectedBus.driverId || "";

    }

}

async function loadDrivers() {

    const select = document.getElementById(

        "driverSelect"

    );

    if (!select) {

        return;

    }

    select.innerHTML = `

<option value="">

Sélectionner un chauffeur

</option>`;

    const snapshot = await usersRef

        .where("role","==","driver")

        .get();

    drivers = [];

    snapshot.forEach(doc => {

        const driver = {

            id: doc.id,

            ...doc.data()

        };

        drivers.push(driver);

        select.innerHTML += `

<option value="${driver.id}">

${driver.fullName}

</option>`;

    });

}
function filterBuses() {

    const search = document

        .getElementById("searchBus")

        .value

        .trim()

        .toLowerCase();

    const status = document

        .getElementById("statusFilter")

        .value;

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

function updateStatistics() {

    let active = 0;

    let maintenance = 0;

    let seats = 0;

    buses.forEach(bus => {

        if (bus.status === "active") {

            active++;

        }

        if (bus.status === "maintenance") {

            maintenance++;

        }

        seats += Number(

            bus.availableSeats || 0

        );

    });

    setText(

        "totalBuses",

        buses.length

    );

    setText(

        "activeBuses",

        active

    );

    setText(

        "maintenanceBuses",

        maintenance

    );

    setText(

        "availableSeats",

        seats

    );

}

function refreshBuses() {

    loadBuses();

}

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
async function saveBus(event) {

    event.preventDefault();

    const busId = document

        .getElementById("busId")

        .value

        .trim();

    const busNumber = document

        .getElementById("busNumberInput")

        .value

        .trim();

    const capacity = Number(

        document

        .getElementById("busCapacityInput")

        .value

    );

    const availableSeats = Number(

        document

        .getElementById("availableSeatsInput")

        .value

    );

    const status = document

        .getElementById("busStatusInput")

        .value;

    const nextStop = document

        .getElementById("nextStopInput")

        .value

        .trim();

    if (

        !busId ||

        !busNumber

    ) {

        showToast(

            "Complétez les informations du bus.",

            "warning"

        );

        return;

    }

    await busesRef

        .doc(busId)

        .set({

            busId,

            busNumber,

            capacity,

            availableSeats,

            status,

            nextStop,

            driverId: selectedBus?.driverId || "",

            driverName: selectedBus?.driverName || "",

            students: selectedBus?.students || []

        });

    showToast(

        "Bus enregistré avec succès.",

        "success"

    );

    document

        .getElementById("busForm")

        .reset();

    selectedBus = null;

    loadBuses();

}

async function deleteBus() {

    if (!selectedBus) {

        showToast(

            "Sélectionnez un bus.",

            "warning"

        );

        return;

    }

    if (

        !confirm(

            "Supprimer ce bus ?"

        )

    ) {

        return;

    }

    await busesRef

        .doc(selectedBus.id)

        .delete();

    selectedBus = null;

    showToast(

        "Bus supprimé.",

        "success"

    );

    document

        .getElementById("busForm")

        .reset();

    loadBuses();

}

document

.getElementById("busForm")

?.addEventListener(

    "submit",

    saveBus

);

document

.getElementById("deleteBusBtn")

?.addEventListener(

    "click",

    deleteBus

);
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

    const driver = drivers.find(

        d => d.id === driverId

    );

    await busesRef

        .doc(selectedBus.id)

        .update({

            driverId: driver.id,

            driverName: driver.fullName

        });

    await usersRef

        .doc(driver.id)

        .update({

            busId: selectedBus.id

        });

    showToast(

        "Chauffeur attribué avec succès.",

        "success"

    );

    loadBuses();

}

function viewStudents() {

    if (!selectedBus) {

        showToast(

            "Sélectionnez un bus.",

            "warning"

        );

        return;

    }

    const total =

        selectedBus.students ?

        selectedBus.students.length : 0;

    showToast(

        total +

        " étudiant(s) affecté(s) à ce bus.",

        "success"

    );

}

busesRef.onSnapshot(() => {

    loadBuses();

});

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
