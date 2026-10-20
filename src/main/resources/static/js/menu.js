const API_BASE = "/api";

const params = new URLSearchParams(window.location.search);
const tableId = Number(params.get("ban")) || null;

let products = [];
let selectedCategory = "all";

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
    if (!fileName) {
        return "";
    }

    let image = String(fileName).trim();

    if (!image) {
        return "";
    }

    // Nếu backend trả URL đầy đủ
    if (
        image.startsWith("http://") ||
        image.startsWith("https://")
    ) {
        return image;
    }

    // Nếu DB đã lưu dạng /images/abc.jpg
    if (image.startsWith("/images/")) {
        return image;
    }

    // Nếu DB lưu dạng images/abc.jpg
    if (image.startsWith("images/")) {
        return "/" + image;
    }

    // Nếu DB chỉ lưu tên file: abc.jpg
    return "/images/" + encodeURIComponent(image);
}

function getCategoryId(product) {
    return String(
        product.danhMuc?.maDanhMuc
        ?? product.danhMuc?.madanhmuc
        ?? product.maDanhMuc
        ?? product.madanhmuc
        ?? ''
    );
}

function renderProducts() {

    productList.innerHTML = "";

    const filteredProducts =
        products.filter(product => {

            if (selectedCategory === "all") {
                return true;
            }

            return getCategoryId(product) === selectedCategory;
        });

    if (filteredProducts.length === 0) {

        productList.innerHTML = `
            <div class="message">
                Không có món nào trong danh mục này.
            </div>
        `;

        return;
    }

    filteredProducts.forEach(product => {

        const card =
            document.createElement("article");

        card.className =
            "product-card";

        const image =
            getImageUrl(product.anhSanPham);

        const categoryName =
            product.danhMuc?.tenDanhMuc
            ?? product.danhMuc?.tendanhmuc
            ?? "";

        card.innerHTML = `

            ${
            image
                ? `
                        <img
                            class="product-image"
                            src="${image}"
                            alt="${escapeHtml(product.tenSanPham)}"
                            onerror="this.style.display='none'"
                        >
                    `
                : `
                        <div class="product-image"></div>
                    `
        }

            <div class="product-content">

                ${
            categoryName
                ? `
                            <span class="product-category">
                                ${escapeHtml(categoryName)}
                            </span>
                        `
                : ""
        }

                <h3 class="product-name">
                    ${escapeHtml(product.tenSanPham)}
                </h3>

                <p class="product-description">
                    ${escapeHtml(product.moTa || "")}
                </p>

                <div class="product-price">
                    ${money(product.giaBan)}
                </div>

                <button class="add-button">
                    + Thêm món
                </button>

            </div>
        `;

        card
            .querySelector(".add-button")
            .addEventListener("click", (event) => {
                addToCart(product, event.currentTarget);
            });

        productList.appendChild(card);
    });
}


function animateFlyToCart(product, sourceElement) {
    const cartButton = document.getElementById("cartButton");
    const countBadge = document.getElementById("cartCount");

    const sourceImage = sourceElement
        ?.closest(".product-card")
        ?.querySelector(".product-image");

    const sourceRect = (sourceImage || sourceElement).getBoundingClientRect();
    const targetRect = cartButton.getBoundingClientRect();

    // Tạo bản sao hình ảnh bay đến giỏ hàng
    const flyingItem = document.createElement("div");
    flyingItem.className = "flying-food";

    const imageUrl = getImageUrl(product.anhSanPham);

    if (imageUrl) {
        const image = document.createElement("img");
        image.src = imageUrl;
        image.alt = "";
        flyingItem.appendChild(image);
    } else {
        flyingItem.textContent = "🍢";
    }

    flyingItem.style.left = `${sourceRect.left}px`;
    flyingItem.style.top = `${sourceRect.top}px`;
    flyingItem.style.width = `${Math.min(sourceRect.width, 100)}px`;
    flyingItem.style.height = `${Math.min(sourceRect.height, 100)}px`;

    document.body.appendChild(flyingItem);

    const startX = sourceRect.left + sourceRect.width / 2;
    const startY = sourceRect.top + sourceRect.height / 2;
    const endX = targetRect.left + targetRect.width / 2;
    const endY = targetRect.top + targetRect.height / 2;

    const deltaX = endX - startX;
    const deltaY = endY - startY;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        flyingItem.remove();
    } else {
        const animation = flyingItem.animate(
            [
                {
                    transform: "translate(0, 0) scale(1) rotate(0deg)",
                    opacity: 1
                },
                {
                    transform: `translate(${deltaX * 0.55}px, ${deltaY * 0.55 - 65}px) scale(0.65) rotate(12deg)`,
                    opacity: 0.95,
                    offset: 0.55
                },
                {
                    transform: `translate(${deltaX}px, ${deltaY}px) scale(0.12) rotate(25deg)`,
                    opacity: 0.15
                }
            ],
            {
                duration: 650,
                easing: "cubic-bezier(0.22, 0.8, 0.25, 1)",
                fill: "forwards"
            }
        );

        animation.onfinish = () => flyingItem.remove();
    }

    // Hiệu ứng nhấn giỏ hàng và số lượng
    cartButton.classList.remove("cart-bounce");
    countBadge.classList.remove("count-pop");

    // Buộc trình duyệt khởi động lại animation
    void cartButton.offsetWidth;

    cartButton.classList.add("cart-bounce");
    countBadge.classList.add("count-pop");

    setTimeout(() => {
        cartButton.classList.remove("cart-bounce");
        countBadge.classList.remove("count-pop");
    }, 500);
}

function addToCart(product, sourceElement) {
    // Hiệu ứng chạy độc lập với việc lưu dữ liệu
    animateFlyToCart(product, sourceElement);

    const existing = cart.find(
        item => item.maSanPham === product.maSanPham
    );

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

    // Phản hồi trực tiếp trên nút vừa nhấn
    if (sourceElement) {
        const originalText = sourceElement.textContent;

        sourceElement.textContent = "✓ Đã thêm";
        sourceElement.classList.add("added");

        setTimeout(() => {
            sourceElement.textContent = originalText;
            sourceElement.classList.remove("added");
        }, 700);
    }
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

document
    .querySelectorAll(".category-btn")
    .forEach(button => {

        button.addEventListener("click", () => {

            selectedCategory =
                button.dataset.category;

            document
                .querySelectorAll(".category-btn")
                .forEach(btn => {
                    btn.classList.remove("active");
                });

            button.classList.add("active");

            renderProducts();
        });

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
