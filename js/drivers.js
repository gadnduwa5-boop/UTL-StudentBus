const driversCollection = db.collection(COLLECTIONS.USERS);

const busesCollection = db.collection(COLLECTIONS.BUSES);

let drivers = [];

let buses = [];

let selectedDriver = null;

document.addEventListener("DOMContentLoaded", () => {

    loadDrivers();

});

async function loadDrivers() {

    try {

        showLoader();

        const snapshot = await driversCollection

            .where("role", "==", "driver")

            .get();

        drivers = [];

        snapshot.forEach(doc => {

            drivers.push({

                id: doc.id,

                ...doc.data()

            });

        });

        renderDrivers(drivers);

        updateStatistics();

        await loadBuses();

        hideLoader();

    }

    catch (error) {

        console.error(error);

        hideLoader();

        showToast(

            "Impossible de charger les chauffeurs.",

            "error"

        );

    }

}

function renderDrivers(list) {

    const table = document.getElementById(

        "driversTable"

    );

    if (!table) {

        return;

    }

    table.innerHTML = "";

    if (list.length === 0) {

        table.innerHTML = `

<tr>

<td colspan="7">

Aucun chauffeur enregistré.

</td>

</tr>`;

        return;

    }

    list.forEach(driver => {

        table.innerHTML += `

<tr>

<td>

<img

src="${driver.photoURL || "../image/avatar.png"}"

class="table-avatar">

</td>

<td>${driver.cardId || "-"}</td>

<td>${driver.fullName || "-"}</td>

<td>${driver.phone || "-"}</td>

<td>${driver.busId || "-"}</td>

<td>${driver.status || "available"}</td>

<td>

<button

class="quick-btn"

onclick="selectDriver('${driver.id}')">

Voir

</button>

</td>

</tr>`;

    });

}
function selectDriver(driverId) {

    selectedDriver = drivers.find(

        driver => driver.id === driverId

    );

    if (!selectedDriver) {

        return;

    }

    setText(

        "driverFullName",

        selectedDriver.fullName

    );

    setText(

        "driverCardId",

        selectedDriver.cardId

    );

    setText(

        "driverPhone",

        selectedDriver.phone

    );

    setText(

        "driverEmail",

        selectedDriver.email

    );

    setText(

        "driverBus",

        selectedDriver.busId || "Non attribué"

    );

    setText(

        "driverStatus",

        selectedDriver.status || "available"

    );

    document.getElementById(

        "driverCardIdInput"

    ).value = selectedDriver.cardId || "";

    document.getElementById(

        "driverFullNameInput"

    ).value = selectedDriver.fullName || "";

    document.getElementById(

        "driverPhoneInput"

    ).value = selectedDriver.phone || "";

    document.getElementById(

        "driverEmailInput"

    ).value = selectedDriver.email || "";

    document.getElementById(

        "driverStatusInput"

    ).value = selectedDriver.status || "available";

    document.getElementById(

        "driverBusSelect"

    ).value = selectedDriver.busId || "";

}

async function loadBuses() {

    const select = document.getElementById(

        "driverBusSelect"

    );

    const assignSelect = document.getElementById(

        "assignBusSelect"

    );

    if (!select || !assignSelect) {

        return;

    }

    select.innerHTML = `

<option value="">

Sélectionner un bus

</option>`;

    assignSelect.innerHTML = `

<option value="">

Sélectionner un bus

</option>`;

    const snapshot = await busesCollection.get();

    buses = [];

    snapshot.forEach(doc => {

        const bus = {

            id: doc.id,

            ...doc.data()

        };

        buses.push(bus);

        select.innerHTML += `

<option value="${bus.id}">

${bus.busNumber}

</option>`;

        assignSelect.innerHTML += `

<option value="${bus.id}">

${bus.busNumber}

</option>`;

    });

}
function updateStatistics() {

    let available = 0;

    let working = 0;

    let inactive = 0;

    drivers.forEach(driver => {

        switch (driver.status) {

            case "available":

                available++;

                break;

            case "working":

                working++;

                break;

            case "inactive":

                inactive++;

                break;

        }

    });

    setText(

        "totalDrivers",

        drivers.length

    );

    setText(

        "availableDrivers",

        available

    );

    setText(

        "workingDrivers",

        working

    );

    setText(

        "inactiveDrivers",

        inactive

    );

}

function filterDrivers() {

    const search = document

        .getElementById("searchDriver")

        .value

        .trim()

        .toLowerCase();

    const status = document

        .getElementById("driverStatusFilter")

        .value;

    const filtered = drivers.filter(driver => {

        const matchSearch =

            (driver.fullName || "")

            .toLowerCase()

            .includes(search)

            ||

            (driver.cardId || "")

            .toLowerCase()

            .includes(search)

            ||

            (driver.phone || "")

            .toLowerCase()

            .includes(search);

        const matchStatus =

            !status ||

            driver.status === status;

        return matchSearch && matchStatus;

    });

    renderDrivers(filtered);

}

function refreshDrivers() {

    loadDrivers();

}

document

.getElementById("refreshDrivers")

?.addEventListener(

    "click",

    refreshDrivers

);

document

.getElementById("searchDriver")

?.addEventListener(

    "input",

    filterDrivers

);

document

.getElementById("driverStatusFilter")

?.addEventListener(

    "change",

    filterDrivers

);
async function saveDriver(event) {

    event.preventDefault();

    const cardId = document

        .getElementById("driverCardIdInput")

        .value

        .trim();

    const fullName = document

        .getElementById("driverFullNameInput")

        .value

        .trim();

    const phone = document

        .getElementById("driverPhoneInput")

        .value

        .trim();

    const email = document

        .getElementById("driverEmailInput")

        .value

        .trim();

    const status = document

        .getElementById("driverStatusInput")

        .value;

    const busId = document

        .getElementById("driverBusSelect")

        .value;

    if (!cardId || !fullName) {

        showToast(

            "Complétez les informations du chauffeur.",

            "warning"

        );

        return;

    }

    await driversCollection

        .doc(cardId)

        .set({

            ...(selectedDriver || {}),

            cardId,

            fullName,

            phone,

            email,

            status,

            busId,

            role: "driver"

        }, {

            merge: true

        });

    if (busId) {

        const bus = buses.find(

            bus => bus.id === busId

        );

        if (bus) {

            await busesCollection

                .doc(busId)

                .update({

                    driverId: cardId,

                    driverName: fullName

                });

        }

    }

    showToast(

        "Chauffeur enregistré avec succès.",

        "success"

    );

    document

        .getElementById("driverForm")

        .reset();

    selectedDriver = null;

    loadDrivers();

}

async function deleteDriver() {

    if (!selectedDriver) {

        showToast(

            "Sélectionnez un chauffeur.",

            "warning"

        );

        return;

    }

    if (!confirm(

        "Supprimer ce chauffeur ?"

    )) {

        return;

    }

    if (selectedDriver.busId) {

        await busesCollection

            .doc(selectedDriver.busId)

            .update({

                driverId: "",

                driverName: ""

            });

    }

    await driversCollection

        .doc(selectedDriver.id)

        .delete();

    selectedDriver = null;

    document

        .getElementById("driverForm")

        .reset();

    showToast(

        "Chauffeur supprimé.",

        "success"

    );

    loadDrivers();

}

document

.getElementById("driverForm")

?.addEventListener(

    "submit",

    saveDriver

);

document

.getElementById("deleteDriverBtn")

?.addEventListener(

    "click",

    deleteDriver

);
async function assignBusToDriver() {

    if (!selectedDriver) {

        showToast(

            "Sélectionnez un chauffeur.",

            "warning"

        );

        return;

    }

    const busId = document

        .getElementById("assignBusSelect")

        .value;

    if (!busId) {

        showToast(

            "Sélectionnez un bus.",

            "warning"

        );

        return;

    }

    const bus = buses.find(

        bus => bus.id === busId

    );

    if (!bus) {

        showToast(

            "Bus introuvable.",

            "error"

        );

        return;

    }

    if (bus.driverId && bus.driverId !== selectedDriver.cardId) {

        showToast(

            "Ce bus possède déjà un chauffeur.",

            "warning"

        );

        return;

    }

    await driversCollection

        .doc(selectedDriver.cardId)

        .update({

            busId: bus.id,

            status: "working"

        });

    await busesCollection

        .doc(bus.id)

        .update({

            driverId: selectedDriver.cardId,

            driverName: selectedDriver.fullName

        });

    showToast(

        "Bus attribué avec succès.",

        "success"

    );

    loadDrivers();

}

function viewBus() {

    if (!selectedDriver) {

        showToast(

            "Sélectionnez un chauffeur.",

            "warning"

        );

        return;

    }

    if (!selectedDriver.busId) {

        showToast(

            "Aucun bus attribué.",

            "warning"

        );

        return;

    }

    window.location.href =

        "buses.html";

}

driversCollection

.where("role","==","driver")

.onSnapshot(() => {

    loadDrivers();

});

document

.getElementById("saveDriverBusBtn")

?.addEventListener(

    "click",

    assignBusToDriver

);

document

.getElementById("viewBusBtn")

?.addEventListener(

    "click",

    viewBus

);