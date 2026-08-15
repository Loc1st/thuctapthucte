// =========================
// DATABASE ẢO
// =========================

const fakeAccounts = [

    {
        id: 1,
        username: "admin",
        name: "Quản trị viên",
        email: "admin@cavienchien.vn",
        role: "ADMIN",
        status: "ACTIVE",
        lastLogin: "16/08/2026 00:42"
    },

    {
        id: 2,
        username: "staff",
        name: "Nhân viên cửa hàng",
        email: "staff@cavienchien.vn",
        role: "STAFF",
        status: "ACTIVE",
        lastLogin: "15/08/2026 22:18"
    },

    {
        id: 3,
        username: "staff01",
        name: "Nguyễn Văn An",
        email: "an@cavienchien.vn",
        role: "STAFF",
        status: "ACTIVE",
        lastLogin: "15/08/2026 19:35"
    },

    {
        id: 4,
        username: "staff02",
        name: "Trần Minh Khoa",
        email: "khoa@cavienchien.vn",
        role: "STAFF",
        status: "ACTIVE",
        lastLogin: "14/08/2026 20:11"
    },

    {
        id: 5,
        username: "staff03",
        name: "Lê Hoàng Nam",
        email: "nam@cavienchien.vn",
        role: "STAFF",
        status: "LOCKED",
        lastLogin: "10/08/2026 18:42"
    }

];


// =========================
// STATE
// =========================

let editingId = null;


// =========================
// DOM
// =========================

const tableBody =
    document.getElementById(
        "accountTableBody"
    );

const searchInput =
    document.getElementById(
        "accountSearch"
    );

const accountCount =
    document.getElementById(
        "accountCount"
    );

const modal =
    document.getElementById(
        "accountModal"
    );

const modalTitle =
    document.getElementById(
        "modalTitle"
    );

const accountForm =
    document.getElementById(
        "accountForm"
    );

const formMessage =
    document.getElementById(
        "accountFormMessage"
    );

const nameInput =
    document.getElementById(
        "accountName"
    );

const usernameInput =
    document.getElementById(
        "accountUsername"
    );

const emailInput =
    document.getElementById(
        "accountEmail"
    );

const passwordInput =
    document.getElementById(
        "accountPassword"
    );

const roleInput =
    document.getElementById(
        "accountRole"
    );


// =========================
// ESCAPE HTML
// =========================

function escapeHtml(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


// =========================
// ROLE
// =========================

function roleHtml(role) {

    if (role === "ADMIN") {

        return `
            <span class="role-badge role-admin">
                ADMIN
            </span>
        `;

    }

    return `
        <span class="role-badge role-staff">
            STAFF
        </span>
    `;

}


// =========================
// STATUS
// =========================

function statusHtml(status) {

    if (status === "ACTIVE") {

        return `
            <span class="status-badge status-active">
                ● Hoạt động
            </span>
        `;

    }

    return `
        <span class="status-badge status-locked">
            ● Đã khóa
        </span>
    `;

}


// =========================
// RENDER
// =========================

function renderAccounts() {

    const keyword =
        searchInput.value
            .trim()
            .toLowerCase();


    const accounts =
        fakeAccounts.filter(account => {

            return (

                account.username
                    .toLowerCase()
                    .includes(keyword)

                ||

                account.name
                    .toLowerCase()
                    .includes(keyword)

                ||

                account.email
                    .toLowerCase()
                    .includes(keyword)

            );

        });


    accountCount.textContent =
        `${accounts.length} tài khoản`;


    if (accounts.length === 0) {

        tableBody.innerHTML = `
            <tr>

                <td
                    colspan="6"
                    style="
                        text-align:center;
                        padding:40px;
                        color:#94a3b8;
                    "
                >
                    Không tìm thấy tài khoản.
                </td>

            </tr>
        `;

        return;
    }


    tableBody.innerHTML =
        accounts
            .map(account => {

                const isAdmin =
                    account.role === "ADMIN";


                let actions = "";


                if (isAdmin) {

                    actions = `
                        <span
                            style="
                                color:#94a3b8;
                                font-size:12px;
                            "
                        >
                            Tài khoản hệ thống
                        </span>
                    `;

                } else {

                    const lockButton =
                        account.status === "ACTIVE"

                            ? `
                                <button
                                    class="
                                        account-action
                                        lock
                                    "
                                    onclick="
                                        toggleAccount(
                                            ${account.id}
                                        )
                                    "
                                >
                                    🔒 Khóa
                                </button>
                              `

                            : `
                                <button
                                    class="
                                        account-action
                                        unlock
                                    "
                                    onclick="
                                        toggleAccount(
                                            ${account.id}
                                        )
                                    "
                                >
                                    🔓 Mở khóa
                                </button>
                              `;


                    actions = `

                        <button
                            class="
                                account-action
                                edit
                            "
                            onclick="
                                editAccount(
                                    ${account.id}
                                )
                            "
                        >
                            ✏️ Sửa
                        </button>


                        <button
                            class="
                                account-action
                                delete
                            "
                            onclick="
                                deleteAccount(
                                    ${account.id}
                                )
                            "
                        >
                            🗑️ Xóa
                        </button>


                        ${lockButton}

                    `;

                }


                return `

                    <tr>

                        <td>

                            <div class="user-cell">

                                <div class="avatar">

                                    ${
                    isAdmin
                        ? "👑"
                        : "👤"
                }

                                </div>

                                <div>

                                    <div class="user-name">
                                        ${escapeHtml(
                    account.name
                )}
                                    </div>

                                    <div class="user-username">
                                        @${escapeHtml(
                    account.username
                )}
                                    </div>

                                </div>

                            </div>

                        </td>


                        <td>
                            ${escapeHtml(
                    account.email
                )}
                        </td>


                        <td>
                            ${roleHtml(
                    account.role
                )}
                        </td>


                        <td>
                            ${statusHtml(
                    account.status
                )}
                        </td>


                        <td>
                            ${escapeHtml(
                    account.lastLogin
                )}
                        </td>


                        <td>

                            <div
                                class="account-actions"
                            >
                                ${actions}
                            </div>

                        </td>

                    </tr>

                `;

            })
            .join("");

}


// =========================
// OPEN ADD MODAL
// =========================

function openAddModal() {

    editingId = null;

    modalTitle.textContent =
        "Thêm tài khoản";

    accountForm.reset();

    roleInput.value = "STAFF";

    passwordInput.required = true;

    formMessage.textContent = "";

    modal.classList.add("show");

    nameInput.focus();

}


// =========================
// OPEN EDIT MODAL
// =========================

function editAccount(id) {

    const account =
        fakeAccounts.find(
            item => item.id === id
        );


    if (!account) {
        return;
    }


    if (account.role === "ADMIN") {

        alert(
            "Tài khoản Admin hệ thống không được chỉnh sửa."
        );

        return;

    }


    editingId = id;


    modalTitle.textContent =
        "Sửa tài khoản";


    nameInput.value =
        account.name;

    usernameInput.value =
        account.username;

    emailInput.value =
        account.email;

    passwordInput.value =
        "";

    roleInput.value =
        account.role;


    /*
     * Khi sửa:
     * mật khẩu không bắt buộc.
     * Để trống = giữ mật khẩu cũ.
     */

    passwordInput.required = false;


    formMessage.textContent = "";


    modal.classList.add("show");

    nameInput.focus();

}


// =========================
// CLOSE MODAL
// =========================

function closeModal() {

    modal.classList.remove("show");

    editingId = null;

    accountForm.reset();

    formMessage.textContent = "";

}


// =========================
// SAVE ACCOUNT
// =========================

accountForm.addEventListener(
    "submit",
    function (event) {

        event.preventDefault();


        const name =
            nameInput.value.trim();

        const username =
            usernameInput.value.trim();

        const email =
            emailInput.value.trim();

        const password =
            passwordInput.value;

        const role =
            roleInput.value;


        // -------------------------
        // VALIDATE
        // -------------------------

        if (!name) {

            formMessage.textContent =
                "Vui lòng nhập họ và tên.";

            return;

        }


        if (!username) {

            formMessage.textContent =
                "Vui lòng nhập tên đăng nhập.";

            return;

        }


        if (!email) {

            formMessage.textContent =
                "Vui lòng nhập email.";

            return;

        }


        if (
            editingId === null &&
            !password
        ) {

            formMessage.textContent =
                "Vui lòng nhập mật khẩu.";

            return;

        }


        // -------------------------
        // CHECK USERNAME
        // -------------------------

        const duplicate =
            fakeAccounts.find(account => {

                return (

                    account.username
                        .toLowerCase() ===
                    username.toLowerCase()

                    &&

                    account.id !== editingId

                );

            });


        if (duplicate) {

            formMessage.textContent =
                "Tên đăng nhập đã tồn tại.";

            return;

        }


        // -------------------------
        // ADD
        // -------------------------

        if (editingId === null) {

            const newAccount = {

                id:
                    Date.now(),

                username,

                name,

                email,

                role,

                status:
                    "ACTIVE",

                lastLogin:
                    "Chưa đăng nhập"

            };


            fakeAccounts.push(
                newAccount
            );


            closeModal();

            renderAccounts();


            alert(
                "Đã tạo tài khoản thành công."
            );

            return;

        }


        // -------------------------
        // EDIT
        // -------------------------

        const account =
            fakeAccounts.find(
                item =>
                    item.id === editingId
            );


        if (!account) {
            return;
        }


        account.name =
            name;

        account.username =
            username;

        account.email =
            email;

        account.role =
            role;


        /*
         * Nếu nhập mật khẩu mới
         * thì coi như đã đổi mật khẩu.
         */

        if (password) {

            account.password =
                password;

        }


        closeModal();

        renderAccounts();


        alert(
            "Đã cập nhật tài khoản."
        );

    }
);


// =========================
// DELETE
// =========================

function deleteAccount(id) {

    const account =
        fakeAccounts.find(
            item => item.id === id
        );


    if (!account) {
        return;
    }


    if (account.role === "ADMIN") {

        alert(
            "Không thể xóa tài khoản Admin hệ thống."
        );

        return;

    }


    const confirmed =
        confirm(
            `Bạn có chắc muốn xóa tài khoản "${account.username}"?`
        );


    if (!confirmed) {
        return;
    }


    const index =
        fakeAccounts.findIndex(
            item => item.id === id
        );


    if (index === -1) {
        return;
    }


    fakeAccounts.splice(
        index,
        1
    );


    renderAccounts();


    alert(
        "Đã xóa tài khoản."
    );

}


// =========================
// LOCK / UNLOCK
// =========================

function toggleAccount(id) {

    const account =
        fakeAccounts.find(
            item => item.id === id
        );


    if (!account) {
        return;
    }


    if (account.role === "ADMIN") {

        alert(
            "Không thể khóa tài khoản Admin."
        );

        return;

    }


    if (
        account.status ===
        "ACTIVE"
    ) {

        account.status =
            "LOCKED";

    } else {

        account.status =
            "ACTIVE";

    }


    renderAccounts();

}


// =========================
// EVENTS
// =========================

document
    .getElementById("addAccountBtn")
    .addEventListener(
        "click",
        openAddModal
    );


document
    .getElementById("closeModalBtn")
    .addEventListener(
        "click",
        closeModal
    );


document
    .getElementById("cancelModalBtn")
    .addEventListener(
        "click",
        closeModal
    );


modal.addEventListener(
    "click",
    function (event) {

        if (
            event.target === modal
        ) {

            closeModal();

        }

    }
);


searchInput.addEventListener(
    "input",
    renderAccounts
);


// =========================
// INIT
// =========================

renderAccounts();