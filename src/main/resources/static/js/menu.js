const API_BASE = "/api";

const params = new URLSearchParams(window.location.search);
const tableId = Number(params.get("ban")) || null;

let products = [];

const cartKey = tableId
    ? `cart_ban_${tableId}`
    : "cart_invalid";

let cart = JSON.parse(
    localStorage.getItem(cartKey) || "[]"
);

const productList = document.getElementById("productList");
const loading = document.getElementById("loading");
const errorBox = document.getElementById("error");
const tableInfo = document.getElementById("tableInfo");
const cartCount = document.getElementById("cartCount");
const cartTotal = document.getElementById("cartTotal");
const cartItems = document.getElementById("cartItems");
const cartPanel = document.getElementById("cartPanel");
const overlay = document.getElementById("overlay");

function money(value) {
    return Number(value || 0).toLocaleString("vi-VN") + " đ";
}


function saveCart() {
    localStorage.setItem(
        cartKey,
        JSON.stringify(cart)
    );

    renderCart();
}

function getImageUrl(fileName) {
    // Hiện tại backend chưa phục vụ ảnh cũ.
    // Khi làm upload/ảnh món, chỉ cần đổi hàm này.
    return fileName ? `/images/${encodeURIComponent(fileName)}` : "";
}

function renderProducts() {
    productList.innerHTML = "";

    products.forEach(product => {
        const card = document.createElement("article");
        card.className = "product-card";

        const image = getImageUrl(product.anhSanPham);
        card.innerHTML = `
            ${image
                ? `<img class="product-image" src="${image}" alt="${escapeHtml(product.tenSanPham)}"
                       onerror="this.style.display='none'">`
                : `<div class="product-image"></div>`}
            <div class="product-content">
                <h3>${escapeHtml(product.tenSanPham)}</h3>
                <p class="description">${escapeHtml(product.moTa || "")}</p>
                <div class="price">${money(product.giaBan)}</div>
                <button class="add-button">+ Thêm món</button>
            </div>
        `;

        card.querySelector(".add-button").addEventListener("click", () => {
            addToCart(product);
        });

        productList.appendChild(card);
    });
}

function addToCart(product) {
    const existing = cart.find(item => item.maSanPham === product.maSanPham);

    if (existing) {
        existing.soLuong++;
    } else {
        cart.push({
            maSanPham: product.maSanPham,
            tenSanPham: product.tenSanPham,
            giaBan: Number(product.giaBan),
            soLuong: 1
        });
    }

    saveCart();
}

function changeQuantity(code, delta) {
    const item = cart.find(x => x.maSanPham === code);
    if (!item) return;

    item.soLuong += delta;

    if (item.soLuong <= 0) {
        cart = cart.filter(x => x.maSanPham !== code);
    }

    saveCart();
}

function removeFromCart(code) {
    cart = cart.filter(item => item.maSanPham !== code);
    saveCart();
}

function renderCart() {
    const count = cart.reduce((sum, item) => sum + item.soLuong, 0);
    const total = cart.reduce((sum, item) => sum + item.soLuong * item.giaBan, 0);

    cartCount.textContent = count;
    cartTotal.textContent = money(total);

    if (cart.length === 0) {
        cartItems.innerHTML = `<p class="message">Chưa có món nào.</p>`;
        return;
    }

    cartItems.innerHTML = cart.map(item => `
    <div class="cart-item">

        <div>
            <div class="cart-item-name">
                ${escapeHtml(item.tenSanPham)}
            </div>

            <small>
                ${money(item.giaBan)}
            </small>
        </div>

        <div class="quantity">

            <button
                data-code="${item.maSanPham}"
                data-delta="-1">
                −
            </button>

            <span>
                ${item.soLuong}
            </span>

            <button
                data-code="${item.maSanPham}"
                data-delta="1">
                +
            </button>

            <button
                class="remove-item"
                data-code="${item.maSanPham}">
                🗑
            </button>

        </div>

    </div>
`).join("");

    cartItems.querySelectorAll(
        "button[data-delta]"
    ).forEach(button => {

        button.addEventListener("click", () => {

            changeQuantity(
                button.dataset.code,
                Number(button.dataset.delta)
            );

        });

    });


    cartItems.querySelectorAll(
        ".remove-item"
    ).forEach(button => {

        button.addEventListener("click", () => {

            removeFromCart(button.dataset.code);

        });

    });
}

async function loadTable() {
    if (!tableId) {
        tableInfo.textContent = "Chưa xác định bàn";
        return;
    }

    const response = await fetch(`${API_BASE}/ban/${tableId}`);
    if (!response.ok) throw new Error("Không tìm thấy bàn.");

    const table = await response.json();
    tableInfo.textContent = `Bạn đang gọi món tại ${table.tenBan}`;
}

async function loadProducts() {
    const response = await fetch(`${API_BASE}/san-pham`);
    if (!response.ok) throw new Error("Không thể tải danh sách món.");

    products = await response.json();
    renderProducts();
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

document.getElementById("cartButton").addEventListener("click", () => {
    cartPanel.classList.remove("hidden");
    overlay.classList.remove("hidden");
});

document.getElementById("closeCart").addEventListener("click", closeCart);
overlay.addEventListener("click", closeCart);

function closeCart() {
    cartPanel.classList.add("hidden");
    overlay.classList.add("hidden");
}

document.getElementById("orderButton").addEventListener("click", async () => {
    if (!tableId) {
        alert("Không xác định được bàn.");
        return;
    }

    if (cart.length === 0) {
        alert("Giỏ hàng đang trống.");
        return;
    }

    const button = document.getElementById("orderButton");
    button.disabled = true;
    button.textContent = "Đang gửi đơn...";

    try {
        const response = await fetch(`${API_BASE}/don-hang`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                maBan: tableId,
                items: cart.map(item => ({
                    maSanPham: item.maSanPham,
                    soLuong: item.soLuong
                }))
            })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || "Không thể đặt món.");
        }

        alert(`Đặt món thành công! Mã đơn #${data.maDonHang} - ${data.tenBan}`);
        cart = [];
        saveCart();
        closeCart();
    } catch (error) {
        alert(error.message);
    } finally {
        button.disabled = false;
        button.textContent = "Đặt món";
    }
});

async function init() {
    try {
        await Promise.all([loadTable(), loadProducts()]);
        loading.classList.add("hidden");
    } catch (error) {
        loading.classList.add("hidden");
        errorBox.textContent = error.message;
        errorBox.classList.remove("hidden");
    }

    renderCart();
}

init();
