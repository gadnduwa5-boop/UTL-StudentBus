const studentsCollection = db.collection(COLLECTIONS.USERS);
const busesCollection = db.collection(COLLECTIONS.BUSES);

let students = [];
let buses = [];
let selectedStudent = null;

document.addEventListener("DOMContentLoaded", async () => {

    await loadStudents();

    await loadBuses();

});

async function loadStudents() {

    try {

        showLoader();

        const snapshot = await studentsCollection

            .where("role", "==", ROLES.STUDENT)

            .get();

        students = [];

        snapshot.forEach(doc => {

            students.push({

                id: doc.id,

                ...doc.data()

            });

        });

        renderStudents(students);

        updateStatistics();

        hideLoader();

    }

    catch (error) {

        console.error(error);

        hideLoader();

        showToast(

            "Impossible de charger les étudiants.",

            "error"

        );

    }

}

function renderStudents(list) {

    const table = document.getElementById(

        "studentsTable"

    );

    if (!table) return;

    table.innerHTML = "";

    if (list.length === 0) {

        table.innerHTML = `

<tr>

<td colspan="9">

Aucun étudiant trouvé.

</td>

</tr>`;

        return;

    }

    list.forEach(student => {

        table.innerHTML += `

<tr>

<td>

<img

src="${student.photoURL || "../image/avatar.png"}"

class="table-avatar">

</td>

<td>${student.cardId}</td>

<td>${student.fullName}</td>

<td>${student.faculty || "-"}</td>

<td>${student.department || "-"}</td>

<td>${student.promotion || "-"}</td>

<td>${student.busId || "-"}</td>

<td>${student.status}</td>

<td>

<button

class="quick-btn"

onclick="selectStudent('${student.id}')">

Voir

</button>

</td>

</tr>`;

    });

}
function selectStudent(studentId) {

    selectedStudent = students.find(

        student => student.id === studentId

    );

    if (!selectedStudent) {

        return;

    }

    setText("studentFullName", selectedStudent.fullName);
    setText("studentCardId", selectedStudent.cardId);
    setText("studentEmail", selectedStudent.email);
    setText("studentPhone", selectedStudent.phone);
    setText("studentFaculty", selectedStudent.faculty);
    setText("studentDepartment", selectedStudent.department);
    setText("studentPromotion", selectedStudent.promotion);
    setText("studentStatus", selectedStudent.status);
    setText("studentBus", selectedStudent.busId || "Non attribué");

    setValue("editFullName", selectedStudent.fullName);
    setValue("editPhone", selectedStudent.phone);
    setValue("editFaculty", selectedStudent.faculty);
    setValue("editDepartment", selectedStudent.department);
    setValue("editPromotion", selectedStudent.promotion);
    setValue("editStatus", selectedStudent.status);

    setImage(
        "studentPhoto",
        selectedStudent.photoURL
    );

}

async function loadBuses() {

    try {

        const select = document.getElementById("busSelect");

        if (!select) return;

        select.innerHTML = `

<option value="">

Sélectionner un bus

</option>`;

        buses = [];

        const snapshot = await busesCollection

            .orderBy("busNumber")

            .get();

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

        });

    }

    catch (error) {

        console.error(error);

        showToast(

            "Impossible de charger les bus.",

            "error"

        );

    }

}
function filterStudents() {

    const search = document

        .getElementById("searchStudent")

        ?.value

        .trim()

        .toLowerCase();

    const status = document

        .getElementById("statusFilter")

        ?.value;

    const faculty = document

        .getElementById("facultyFilter")

        ?.value;

    const filtered = students.filter(student => {

        const matchSearch =

            (student.fullName || "")

            .toLowerCase()

            .includes(search)

            ||

            (student.cardId || "")

            .toLowerCase()

            .includes(search);

        const matchStatus =

            !status ||

            student.status === status;

        const matchFaculty =

            !faculty ||

            student.faculty === faculty;

        return (

            matchSearch &&

            matchStatus &&

            matchFaculty

        );

    });

    renderStudents(filtered);

}

function populateFacultyFilter() {

    const select = document.getElementById(

        "facultyFilter"

    );

    if (!select) return;

    const faculties = [

        ...new Set(

            students

            .map(student => student.faculty)

            .filter(Boolean)

        )

    ];

    select.innerHTML = `

<option value="">

Toutes les facultés

</option>`;

    faculties.sort().forEach(faculty => {

        select.innerHTML += `

<option value="${faculty}">

${faculty}

</option>`;

    });

}

function updateStatistics() {

    setText(

        "totalStudents",

        students.length

    );

    setText(

        "approvedStudents",

        students.filter(student =>

            student.status === "approved"

        ).length

    );

    setText(

        "pendingStudents",

        students.filter(student =>

            student.status === "pending"

        ).length

    );

    setText(

        "rejectedStudents",

        students.filter(student =>

            student.status === "rejected"

        ).length

    );

    populateFacultyFilter();

}

function refreshStudents() {

    loadStudents();

}

document

.getElementById("searchStudent")

?.addEventListener(

    "input",

    filterStudents

);

document

.getElementById("statusFilter")

?.addEventListener(

    "change",

    filterStudents

);

document

.getElementById("facultyFilter")

?.addEventListener(

    "change",

    filterStudents

);

document

.getElementById("refreshStudents")

?.addEventListener(

    "click",

    refreshStudents

);
async function approveStudent() {

    if (!selectedStudent) {

        showToast(

            "Sélectionnez un étudiant.",

            "warning"

        );

        return;

    }

    await studentsCollection

        .doc(selectedStudent.id)

        .update({

            status: "approved"

        });

    showToast(

        "Étudiant approuvé.",

        "success"

    );

    loadStudents();

}

async function rejectStudent() {

    if (!selectedStudent) {

        showToast(

            "Sélectionnez un étudiant.",

            "warning"

        );

        return;

    }

    await studentsCollection

        .doc(selectedStudent.id)

        .update({

            status: "rejected"

        });

    showToast(

        "Étudiant refusé.",

        "success"

    );

    loadStudents();

}

async function assignBus() {

    if (!selectedStudent) {

        showToast(

            "Sélectionnez un étudiant.",

            "warning"

        );

        return;

    }

    const busId = document

        .getElementById("busSelect")

        .value;

    if (!busId) {

        showToast(

            "Sélectionnez un bus.",

            "warning"

        );

        return;

    }

    await studentsCollection

        .doc(selectedStudent.id)

        .update({

            busId: busId

        });

    showToast(

        "Bus attribué avec succès.",

        "success"

    );

    loadStudents();

}

async function updateStudent(event) {

    event.preventDefault();

    if (!selectedStudent) {

        showToast(

            "Sélectionnez un étudiant.",

            "warning"

        );

        return;

    }

    await studentsCollection

        .doc(selectedStudent.id)

        .update({

            fullName: document.getElementById("editFullName").value.trim(),

            phone: document.getElementById("editPhone").value.trim(),

            faculty: document.getElementById("editFaculty").value.trim(),

            department: document.getElementById("editDepartment").value.trim(),

            promotion: document.getElementById("editPromotion").value.trim(),

            status: document.getElementById("editStatus").value

        });

    showToast(

        "Étudiant modifié.",

        "success"

    );

    loadStudents();

}

async function deleteStudent() {

    if (!selectedStudent) {

        showToast(

            "Sélectionnez un étudiant.",

            "warning"

        );

        return;

    }

    if (!confirm("Supprimer cet étudiant ?")) {

        return;

    }

    await studentsCollection

        .doc(selectedStudent.id)

        .delete();

    selectedStudent = null;

    showToast(

        "Étudiant supprimé.",

        "success"

    );

    loadStudents();

}
studentsCollection

.where("role", "==", ROLES.STUDENT)

.onSnapshot(() => {

    loadStudents();

});

document

.getElementById("approveStudentBtn")

?.addEventListener(

    "click",

    approveStudent

);

document

.getElementById("rejectStudentBtn")

?.addEventListener(

    "click",

    rejectStudent

);

document

.getElementById("deleteStudentBtn")

?.addEventListener(

    "click",

    deleteStudent

);

document

.getElementById("saveBusAssignmentBtn")

?.addEventListener(

    "click",

    assignBus

);

document

.getElementById("editStudentForm")

?.addEventListener(

    "submit",

    updateStudent

);

window.selectStudent = selectStudent;