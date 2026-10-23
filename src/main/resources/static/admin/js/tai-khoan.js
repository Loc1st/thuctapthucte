const API_URL = "/api/tai-khoan";

let accounts = [];
let editingId = null;

const tableBody = document.getElementById("accountTableBody");
const searchInput = document.getElementById("accountSearch");
const accountCount = document.getElementById("accountCount");
const modal = document.getElementById("accountModal");
const modalTitle = document.getElementById("modalTitle");
const accountForm = document.getElementById("accountForm");
const formMessage = document.getElementById("accountFormMessage");

const nameInput = document.getElementById("accountName");
const usernameInput = document.getElementById("accountUsername");
const emailInput = document.getElementById("accountEmail");
const passwordInput = document.getElementById("accountPassword");
const roleInput = document.getElementById("accountRole");

// =========================
// ESCAPE HTML
// =========================

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

// =========================
// FORMAT DATA
// =========================

function formatDate(value) {
    if (!value) return "Chưa đăng nhập";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Chưa đăng nhập";

    return new Intl.DateTimeFormat("vi-VN", {
        dateStyle: "short",
        timeStyle: "short"
    }).format(date);
}

function roleHtml(role) {
    return role === "ADMIN"
        ? '<span class="role-badge role-admin">ADMIN</span>'
        : '<span class="role-badge role-staff">STAFF</span>';
}

function statusHtml(status) {
    return status === "ACTIVE"
        ? '<span class="status-badge status-active">● Hoạt động</span>'
        : '<span class="status-badge status-locked">● Đã khóa</span>';
}

// =========================
// API REQUEST
// =========================

async function apiRequest(url, options = {}) {
    const response = await fetch(url, {
        credentials: "same-origin",
        ...options,
        headers: {
            ...(options.body
                ? { "Content-Type": "application/json" }
                : {}),
            ...options.headers
        }
    });

    const text = await response.text();
    let data = {};

    try {
        data = text ? JSON.parse(text) : {};
    } catch {
        data = { message: text };
    }

    if (!response.ok) {
        throw new Error(
            data.message || `Lỗi máy chủ (${response.status})`
        );
    }

    return data;
}

// =========================
// LOAD ACCOUNTS
// =========================

async function loadAccounts() {
    tableBody.innerHTML = `
        <tr>
            <td colspan="6" style="text-align:center;padding:30px">
                Đang tải dữ liệu...
            </td>
        </tr>`;

    try {
        const result = await apiRequest(API_URL);

        if (!Array.isArray(result)) {
            throw new Error(
                "API trả về danh sách tài khoản không hợp lệ."
            );
        }

        accounts = result;
        renderAccounts();

    } catch (error) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6"
                    style="text-align:center;padding:30px;color:#dc2626">
                    ${escapeHtml(error.message)}
                </td>
            </tr>`;

        accountCount.textContent = "Không tải được tài khoản";
    }
}

// =========================
// CHECK ADMIN
// =========================

function countActiveAdmins() {
    return accounts.filter(account =>
        account.vaiTro === "ADMIN" &&
        account.trangThai === "ACTIVE"
    ).length;
}

// =========================
// RENDER TABLE
// =========================

function renderAccounts() {
    const keyword = searchInput.value.trim().toLowerCase();

    const filtered = accounts.filter(account =>
        (account.hoTen || "").toLowerCase().includes(keyword) ||
        (account.tenDangNhap || "").toLowerCase().includes(keyword) ||
        (account.email || "").toLowerCase().includes(keyword)
    );

    accountCount.textContent = `${filtered.length} tài khoản`;

    if (filtered.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6"
                    style="text-align:center;padding:40px;color:#94a3b8">
                    Không tìm thấy tài khoản.
                </td>
            </tr>`;
        return;
    }

    tableBody.innerHTML = filtered.map(account => {
        const isAdmin = account.vaiTro === "ADMIN";

        // ADMIN cũng có nút sửa và xóa.
        // Chỉ ẩn nút khóa/mở khóa đối với ADMIN.
        const lockButton = isAdmin ? "" : `
            <button
                class="account-action ${
            account.trangThai === "ACTIVE" ? "lock" : "unlock"
        }"
                onclick="toggleAccount(${account.maTaiKhoan})">
                ${
            account.trangThai === "ACTIVE"
                ? "🔒 Khóa"
                : "🔓 Mở khóa"
        }
            </button>`;

        const actions = `
            <button
                class="account-action edit"
                onclick="editAccount(${account.maTaiKhoan})">
                ✏️ Sửa
            </button>

            <button
                class="account-action delete"
                onclick="deleteAccount(${account.maTaiKhoan})">
                🗑️ Xóa
            </button>

            ${lockButton}
        `;

        return `
            <tr>
                <td>
                    <div class="user-cell">
                        <div class="avatar">
                            ${isAdmin ? "👑" : "👤"}
                        </div>

                        <div>
                            <div class="user-name">
                                ${escapeHtml(account.hoTen)}
                            </div>

                            <div class="user-username">
                                @${escapeHtml(account.tenDangNhap)}
                            </div>
                        </div>
                    </div>
                </td>

                <td>${escapeHtml(account.email || "")}</td>
                <td>${roleHtml(account.vaiTro)}</td>
                <td>${statusHtml(account.trangThai)}</td>
                <td>${escapeHtml(formatDate(account.dangNhapCuoi))}</td>

                <td>
                    <div class="account-actions">
                        ${actions}
                    </div>
                </td>
            </tr>`;
    }).join("");
}

// =========================
// ADD ACCOUNT
// =========================

function openAddModal() {
    editingId = null;

    modalTitle.textContent = "Thêm tài khoản";

    accountForm.reset();
    roleInput.value = "STAFF";
    passwordInput.required = true;
    formMessage.textContent = "";

    modal.classList.add("show");
    nameInput.focus();
}

// =========================
// EDIT ACCOUNT
// =========================

function editAccount(id) {
    const account = accounts.find(
        item => item.maTaiKhoan === id
    );

    if (!account) {
        alert("Không tìm thấy tài khoản.");
        return;
    }

    // Không chặn ADMIN sửa tài khoản nữa.
    editingId = id;

    modalTitle.textContent = "Sửa tài khoản";

    nameInput.value = account.hoTen || "";
    usernameInput.value = account.tenDangNhap || "";
    emailInput.value = account.email || "";
    passwordInput.value = "";
    roleInput.value = account.vaiTro || "STAFF";

    // Để trống mật khẩu nếu không muốn đổi.
    passwordInput.required = false;
    passwordInput.placeholder = "Để trống nếu giữ mật khẩu cũ";

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

    passwordInput.required = false;
    passwordInput.placeholder = "Nhập mật khẩu";
}

// =========================
// SAVE ACCOUNT
// =========================

accountForm.addEventListener("submit", async event => {
    event.preventDefault();

    const hoTen = nameInput.value.trim();
    const tenDangNhap = usernameInput.value.trim();
    const email = emailInput.value.trim();
    const matKhau = passwordInput.value;
    const vaiTro = roleInput.value;

    if (!hoTen || !tenDangNhap) {
        formMessage.textContent =
            "Vui lòng nhập họ tên và tên đăng nhập.";
        return;
    }

    if (editingId === null && !matKhau) {
        formMessage.textContent = "Vui lòng nhập mật khẩu.";
        return;
    }

    // Không để hạ quyền ADMIN hoạt động cuối cùng.
    if (editingId !== null) {
        const current = accounts.find(
            item => item.maTaiKhoan === editingId
        );

        if (
            current &&
            current.vaiTro === "ADMIN" &&
            current.trangThai === "ACTIVE" &&
            vaiTro !== "ADMIN" &&
            countActiveAdmins() <= 1
        ) {
            formMessage.textContent =
                "Không thể hạ quyền ADMIN đang hoạt động cuối cùng.";
            return;
        }
    }

    const payload = {
        hoTen,
        tenDangNhap,
        email: email || null,
        vaiTro
    };

    if (matKhau) {
        payload.matKhau = matKhau;
    }

    try {
        if (editingId === null) {
            payload.trangThai = "ACTIVE";

            await apiRequest(API_URL, {
                method: "POST",
                body: JSON.stringify(payload)
            });

            alert("Đã tạo tài khoản thành công.");

        } else {
            await apiRequest(`${API_URL}/${editingId}`, {
                method: "PUT",
                body: JSON.stringify(payload)
            });

            alert("Đã cập nhật tài khoản.");
        }

        closeModal();
        await loadAccounts();

    } catch (error) {
        formMessage.textContent = error.message;
    }
});

// =========================
// DELETE ACCOUNT
// =========================

async function deleteAccount(id) {
    const account = accounts.find(
        item => item.maTaiKhoan === id
    );

    if (!account) {
        alert("Không tìm thấy tài khoản.");
        return;
    }

    // Bảo vệ ADMIN hoạt động cuối cùng.
    if (
        account.vaiTro === "ADMIN" &&
        account.trangThai === "ACTIVE" &&
        countActiveAdmins() <= 1
    ) {
        alert(
            "Không thể xóa ADMIN đang hoạt động cuối cùng. " +
            "Hãy tạo một ADMIN khác trước."
        );
        return;
    }

    const confirmed = confirm(
        `Bạn có chắc muốn xóa tài khoản "${account.tenDangNhap}" ` +
        `(${account.vaiTro})?\n\nThao tác này có thể không hoàn tác được.`
    );

    if (!confirmed) return;

    try {
        await apiRequest(`${API_URL}/${id}`, {
            method: "DELETE"
        });

        await loadAccounts();

        alert("Đã xóa tài khoản.");

    } catch (error) {
        alert(`Không thể xóa tài khoản: ${error.message}`);
    }
}

// =========================
// LOCK / UNLOCK STAFF
// =========================

async function toggleAccount(id) {
    const account = accounts.find(
        item => item.maTaiKhoan === id
    );

    if (!account) return;

    if (account.vaiTro === "ADMIN") {
        alert("Không hỗ trợ khóa/mở khóa ADMIN tại màn hình này.");
        return;
    }

    try {
        await apiRequest(`${API_URL}/${id}/trang-thai`, {
            method: "PATCH"
        });

        await loadAccounts();

    } catch (error) {
        alert(error.message);
    }
}

// =========================
// EVENTS
// =========================

document
    .getElementById("addAccountBtn")
    .addEventListener("click", openAddModal);

document
    .getElementById("closeModalBtn")
    .addEventListener("click", closeModal);

document
    .getElementById("cancelModalBtn")
    .addEventListener("click", closeModal);

modal.addEventListener("click", event => {
    if (event.target === modal) {
        closeModal();
    }
});

searchInput.addEventListener("input", renderAccounts);

// =========================
// INIT
// =========================

loadAccounts();