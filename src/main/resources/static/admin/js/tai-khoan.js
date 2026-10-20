
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

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

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

async function apiRequest(url, options = {}) {
    const response = await fetch(url, {
        credentials: "same-origin",
        ...options,
        headers: {
            ...(options.body ? { "Content-Type": "application/json" } : {}),
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
        throw new Error(data.message || `Lỗi máy chủ (${response.status})`);
    }

    return data;
}

async function loadAccounts() {
    tableBody.innerHTML = `
        <tr><td colspan="6" style="text-align:center;padding:30px">
            Đang tải dữ liệu...
        </td></tr>`;

    try {
        accounts = await apiRequest(API_URL);
        renderAccounts();
    } catch (error) {
        tableBody.innerHTML = `
            <tr><td colspan="6" style="text-align:center;padding:30px;color:#dc2626">
                ${escapeHtml(error.message)}
            </td></tr>`;

        accountCount.textContent = "Không tải được tài khoản";
    }
}

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
            <tr><td colspan="6" style="text-align:center;padding:40px;color:#94a3b8">
                Không tìm thấy tài khoản.
            </td></tr>`;
        return;
    }

    tableBody.innerHTML = filtered.map(account => {
        const isAdmin = account.vaiTro === "ADMIN";

        const actions = isAdmin
            ? `<span style="color:#94a3b8;font-size:12px">Tài khoản hệ thống</span>`
            : `
                <button class="account-action edit"
                    onclick="editAccount(${account.maTaiKhoan})">✏️ Sửa</button>
                <button class="account-action delete"
                    onclick="deleteAccount(${account.maTaiKhoan})">🗑️ Xóa</button>
                <button class="account-action ${account.trangThai === "ACTIVE" ? "lock" : "unlock"}"
                    onclick="toggleAccount(${account.maTaiKhoan})">
                    ${account.trangThai === "ACTIVE" ? "🔒 Khóa" : "🔓 Mở khóa"}
                </button>`;

        return `
            <tr>
                <td>
                    <div class="user-cell">
                        <div class="avatar">${isAdmin ? "👑" : "👤"}</div>
                        <div>
                            <div class="user-name">${escapeHtml(account.hoTen)}</div>
                            <div class="user-username">@${escapeHtml(account.tenDangNhap)}</div>
                        </div>
                    </div>
                </td>
                <td>${escapeHtml(account.email || "")}</td>
                <td>${roleHtml(account.vaiTro)}</td>
                <td>${statusHtml(account.trangThai)}</td>
                <td>${escapeHtml(formatDate(account.dangNhapCuoi))}</td>
                <td><div class="account-actions">${actions}</div></td>
            </tr>`;
    }).join("");
}

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

function editAccount(id) {
    const account = accounts.find(item => item.maTaiKhoan === id);
    if (!account) return;

    if (account.vaiTro === "ADMIN") {
        alert("Tài khoản Admin hệ thống không được chỉnh sửa.");
        return;
    }

    editingId = id;
    modalTitle.textContent = "Sửa tài khoản";

    nameInput.value = account.hoTen || "";
    usernameInput.value = account.tenDangNhap || "";
    emailInput.value = account.email || "";
    passwordInput.value = "";
    roleInput.value = account.vaiTro;

    passwordInput.required = false;
    formMessage.textContent = "";
    modal.classList.add("show");
    nameInput.focus();
}

function closeModal() {
    modal.classList.remove("show");
    editingId = null;
    accountForm.reset();
    formMessage.textContent = "";
}

accountForm.addEventListener("submit", async event => {
    event.preventDefault();

    const hoTen = nameInput.value.trim();
    const tenDangNhap = usernameInput.value.trim();
    const email = emailInput.value.trim();
    const matKhau = passwordInput.value;
    const vaiTro = roleInput.value;

    if (!hoTen || !tenDangNhap) {
        formMessage.textContent = "Vui lòng nhập họ tên và tên đăng nhập.";
        return;
    }

    if (editingId === null && !matKhau) {
        formMessage.textContent = "Vui lòng nhập mật khẩu.";
        return;
    }

    const payload = { hoTen, tenDangNhap, email: email || null, vaiTro };

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

async function deleteAccount(id) {
    const account = accounts.find(item => item.maTaiKhoan === id);
    if (!account) return;

    if (account.vaiTro === "ADMIN") {
        alert("Không thể xóa tài khoản Admin hệ thống.");
        return;
    }

    if (!confirm(`Bạn có chắc muốn xóa tài khoản "${account.tenDangNhap}"?`)) {
        return;
    }

    try {
        await apiRequest(`${API_URL}/${id}`, { method: "DELETE" });
        await loadAccounts();
        alert("Đã xóa tài khoản.");
    } catch (error) {
        alert(error.message);
    }
}

async function toggleAccount(id) {
    const account = accounts.find(item => item.maTaiKhoan === id);
    if (!account) return;

    if (account.vaiTro === "ADMIN") {
        alert("Không thể khóa tài khoản Admin hệ thống.");
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

document.getElementById("addAccountBtn").addEventListener("click", openAddModal);
document.getElementById("closeModalBtn").addEventListener("click", closeModal);
document.getElementById("cancelModalBtn").addEventListener("click", closeModal);

modal.addEventListener("click", event => {
    if (event.target === modal) closeModal();
});

searchInput.addEventListener("input", renderAccounts);

loadAccounts();
