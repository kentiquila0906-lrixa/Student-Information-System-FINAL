// Initialize IndexedDB
let db;
let request = indexedDB.open("StudentInformation", 2);

request.onerror = e => console.error(`Error: ${e.target.error}`);
request.onsuccess = e => {
    db = e.target.result;
    loadStudents();
};

request.onupgradeneeded = e => {
    let db = e.target.result;
    if (!db.objectStoreNames.contains("student")) {
        let store = db.createObjectStore("student", { keyPath: "id", autoIncrement: true });
        store.createIndex("idIndex", "studentId", { unique: true });
        store.createIndex("nameIndex", "fullName", { unique: false });
        store.createIndex("courseIndex", "course", { unique: false });
        store.createIndex("yearIndex", "yearLevel", { unique: false });
    }
};

// Load Students in Table Body
function loadStudents() {
    let request = indexedDB.open("StudentInformation", 2);

    request.onsuccess = function (e) {
        let db = e.target.result;
        let tx = db.transaction("student", "readonly");
        let store = tx.objectStore("student");

        const getAllReq = store.getAll();

        getAllReq.onsuccess = function (e) {
            const students = e.target.result;
            const tbody = document.getElementById('tableData');
            tbody.innerHTML = "";

            students.forEach(student => {
                const tr = document.createElement("tr");
                tr.dataset.id = student.id;
                tr.innerHTML = `
                    <td>${student.fullName}</td>
                    <td>${student.studentId}</td>
                    <td>${student.course}</td>
                    <td>${student.yearLevel}</td>
                    <td>${student.email}</td>
                    <td>
                        <button class="btn btn-warning editBtn" data-bs-toggle="modal" data-bs-target="#editUserModal">
                            <i class="bi bi-pencil-square"></i>
                        </button>
                        <button class="btn btn-danger deleteBtn" data-bs-toggle="modal" data-bs-target="#deleteConfirmModal">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
            
            document.querySelectorAll(".editBtn").forEach(btn => {
                btn.addEventListener("click", edit);
            });
            document.querySelectorAll(".deleteBtn").forEach(btn => {
                btn.addEventListener("click", handleDelete);
            });
        };
    };
}

// Prevent page reload and trigger search only on button click
document.querySelector('form[role="search"]').addEventListener('submit', function (e) {
    e.preventDefault();
    const query = document.getElementById('searchInput').value.toLowerCase().trim();
    searchStudentsById(query);
});


function searchStudentsById(query) {
    let request = indexedDB.open("StudentInformation", 2);

    request.onsuccess = function (e) {
        let db = e.target.result;
        let tx = db.transaction("student", "readonly");
        let store = tx.objectStore("student");
        let getAllReq = store.getAll();

        getAllReq.onsuccess = function () {
            const students = getAllReq.result;
            const filtered = students.filter(student =>
                student.studentId.toLowerCase().includes(query)
            );

            const tbody = document.getElementById('tableData');
            tbody.innerHTML = "";

            if (filtered.length === 0) {
                tbody.innerHTML = `
                    <tr><td colspan="6" class="text-center text-muted">No matching Student ID found</td></tr>
                `;
                return;
            }

            filtered.forEach(student => {
                const tr = document.createElement("tr");
                tr.dataset.id = student.id;
                tr.innerHTML = `
                    <td>${student.fullName}</td>
                    <td>${student.studentId}</td>
                    <td>${student.course}</td>
                    <td>${student.yearLevel}</td>
                    <td>${student.email}</td>
                    <td>
                        <button class="btn btn-warning editBtn" data-bs-toggle="modal" data-bs-target="#editUserModal">
                            <i class="bi bi-pencil-square"></i>
                        </button>
                        <button class="btn btn-danger deleteBtn" data-bs-toggle="modal" data-bs-target="#deleteConfirmModal">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });

            // Rebind edit/delete button events
            document.querySelectorAll(".editBtn").forEach(btn => btn.addEventListener("click", edit));
            document.querySelectorAll(".deleteBtn").forEach(btn => btn.addEventListener("click", handleDelete));
        };
    };
}

// Add Student
document.getElementById('addStudentForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const modalEl = document.getElementById('addStudentModal');
    const modal = bootstrap.Modal.getInstance(modalEl);

    const fullName = document.getElementById('fullNameInput').value;
    const id = document.getElementById('idInput').value;
    const course = document.getElementById('courseInput').value;
    const yearLevel = document.getElementById('yearLevelInput').value;
    const email = document.getElementById('emailInput').value;

    let request = indexedDB.open("StudentInformation", 2);
    request.onsuccess = function (e) {
        let db = e.target.result;
        let tx = db.transaction("student", "readwrite");
        let store = tx.objectStore("student");
        let data = {
            studentId: id,
            fullName: fullName,
            course: course,
            yearLevel: yearLevel,
            email: email
        };
        store.add(data);

        tx.oncomplete = function () {
            modal.hide();
            document.getElementById('addStudentForm').reset();
            loadStudents();
        };
    };
});

// Edit Student 
function edit(e) {
    const id = Number(e.target.closest('tr').dataset.id);

    let request = indexedDB.open("StudentInformation", 2);
    request.onsuccess = function (ev) {
        let db = ev.target.result;
        let tx = db.transaction("student", "readonly");
        let store = tx.objectStore("student");
        let getReq = store.get(id);

        getReq.onsuccess = function () {
            const student = getReq.result;
            document.getElementById('fullNameEdit').value = student.fullName;
            document.getElementById('idEdit').value = student.studentId;
            document.getElementById('courseEdit').value = student.course;
            document.getElementById('yearLevelEdit').value = student.yearLevel;
            document.getElementById('emailEdit').value = student.email;
            document.getElementById('editUserForm').dataset.editId = id;
             document.getElementById('editUserName').textContent = student.fullName;
        };
    };
}

// Save Edited Student
document.getElementById('editUserForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const modalEl = document.getElementById('editUserModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    const id = Number(e.target.dataset.editId);

    const updatedStudent = {
        id: id,
        fullName: document.getElementById('fullNameEdit').value,
        studentId: document.getElementById('idEdit').value,
        course: document.getElementById('courseEdit').value,
        yearLevel: document.getElementById('yearLevelEdit').value,
        email: document.getElementById('emailEdit').value
    };

    let request = indexedDB.open("StudentInformation", 2);
    request.onsuccess = function (e) {
        let db = e.target.result;
        let tx = db.transaction("student", "readwrite");
        let store = tx.objectStore("student");
        store.put(updatedStudent);

        tx.oncomplete = function () {
            modal.hide();
            loadStudents();
        };
    };
});

// Delete Student
let deleteId = null;

function handleDelete(e) {
    deleteId = Number(e.target.closest('tr').dataset.id);
}

document.getElementById('deleteConfirmed').addEventListener('click', function () {
    if (deleteId !== null) {
        let request = indexedDB.open("StudentInformation", 2);
        request.onsuccess = function (e) {
            let db = e.target.result;
            let tx = db.transaction("student", "readwrite");
            let store = tx.objectStore("student");
            store.delete(deleteId);

            tx.oncomplete = function () {
                bootstrap.Modal.getInstance(document.getElementById('deleteConfirmModal')).hide();
                loadStudents();
            };
        };
    }
});


