const API = '/api/san-pham';

const state = {
    products: [],
    editingId: null,
    imageObjectUrl: null
};

const $ = (id) =>
    document.getElementById(id);


// =========================================================
// DATA
// =========================================================

function getId(product) {
    return product.masanpham
        ?? product.maSanPham
        ?? product.id;
}

function getName(product) {
    return product.tensanpham
        ?? product.tenSanPham
        ?? product.name
        ?? '';
}

function getPrice(product) {
    return Number(
        product.giaban
        ?? product.giaBan
        ?? product.price
        ?? 0
    );
}

function getDescription(product) {
    return product.mota
        ?? product.moTa
        ?? product.description
        ?? '';
}

function getImage(product) {
    return product.anhsanpham
        ?? product.anhSanPham
        ?? product.image
        ?? '';
}


// =========================================================
// ESCAPE
// =========================================================

function escapeHtml(value) {

    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}


// =========================================================
// IMAGE URL
// =========================================================

function getImageUrl(image) {

    if (!image) {
        return '';
    }

    image = String(image).trim();

    // URL đầy đủ
    if (
        image.startsWith('http://') ||
        image.startsWith('https://')
    ) {
        return image;
    }

    // Đã là đường dẫn /images/...
    if (image.startsWith('/images/')) {
        return image;
    }

    // DB lưu images/abc.jpg
    if (image.startsWith('images/')) {
        return '/' + image;
    }

    // DB chỉ lưu tên file: abc.jpg
    return '/images/' + encodeURIComponent(image);
}


// =========================================================
// MONEY
// =========================================================

function formatMoney(value) {

    return new Intl.NumberFormat(
        'vi-VN'
    ).format(value) + ' đ';
}


// =========================================================
// LOAD
// =========================================================

async function loadProducts() {

    const messageEl = $('message');

    messageEl.textContent =
        'Đang tải danh sách món...';

    try {

        const response =
            await fetch(API, {
                method: 'GET',
                headers: {
                    'Accept':
                        'application/json'
                }
            });

        if (!response.ok) {

            throw new Error(
                `Không thể tải thực đơn (${response.status}).`
            );
        }

        const data =
            await response.json();

        if (Array.isArray(data)) {

            state.products = data;

        } else if (
            Array.isArray(data.content)
        ) {

            state.products =
                data.content;

        } else if (
            Array.isArray(data.data)
        ) {

            state.products =
                data.data;

        } else {

            state.products = [];
        }

        renderProducts();

        messageEl.textContent = '';

    } catch (error) {

        console.error(
            'Load products error:',
            error
        );

        state.products = [];

        $('products').innerHTML = '';

        messageEl.textContent =
            error.message ||
            'Không thể tải thực đơn.';
    }
}


// =========================================================
// RENDER
// =========================================================

function renderProducts() {

    const productsEl =
        $('products');

    const searchEl =
        $('search');

    const countEl =
        $('count');

    const keyword =
        String(
            searchEl?.value || ''
        )
            .trim()
            .toLowerCase();

    const filtered =
        state.products.filter(
            product =>
                getName(product)
                    .toLowerCase()
                    .includes(keyword)
        );

    countEl.textContent =
        `${filtered.length} món`;

    if (!filtered.length) {

        productsEl.innerHTML = `
            <div class="message">
                Không tìm thấy món ăn.
            </div>
        `;

        return;
    }

    productsEl.innerHTML =
        filtered.map(product => {

            const id =
                getId(product);

            const name =
                getName(product);

            const price =
                getPrice(product);

            const description =
                getDescription(product);

            const image =
                getImage(product);

            const imageUrl =
                getImageUrl(image);

            const imageHtml =
                imageUrl
                    ? `
                        <img
                            src="${escapeHtml(imageUrl)}"
                            alt="${escapeHtml(name)}"
                            onerror="
                                this.style.display='none';
                                this.nextElementSibling.style.display='flex';
                            "
                        >

                        <div
                            class="product-image-placeholder"
                            style="display:none"
                        >
                            🍢
                        </div>
                    `
                    : `
                        <div class="product-image-placeholder">
                            🍢
                        </div>
                    `;

            return `
                <article class="product-card">

                    <div class="product-image">
                        ${imageHtml}
                    </div>

                    <div class="product-content">

                        <h3>
                            ${escapeHtml(name)}
                        </h3>

                        <p class="muted">
                            ${escapeHtml(
                description ||
                'Chưa có mô tả.'
            )}
                        </p>

                        <strong class="product-price">
                            ${formatMoney(price)}
                        </strong>

                        <div class="product-actions">

                            <button
                                type="button"
                                class="secondary-btn edit-product"
                                data-id="${escapeHtml(id)}"
                            >
                                ✏️ Sửa
                            </button>

                            <button
                                type="button"
                                class="danger-btn delete-product"
                                data-id="${escapeHtml(id)}"
                            >
                                🗑️ Xóa
                            </button>

                        </div>

                    </div>

                </article>
            `;

        }).join('');
}


// =========================================================
// IMAGE PREVIEW
// =========================================================

function clearImagePreview() {

    if (state.imageObjectUrl) {

        URL.revokeObjectURL(
            state.imageObjectUrl
        );

        state.imageObjectUrl = null;
    }

    const preview =
        $('imagePreview');

    if (!preview) {
        return;
    }

    preview.src = '';

    preview.classList.remove(
        'show'
    );
}


function showImagePreview(file) {

    clearImagePreview();

    if (!file) {
        return;
    }

    if (
        !file.type.startsWith('image/')
    ) {

        $('formMessage').textContent =
            'Vui lòng chọn file hình ảnh.';

        $('productImageFile').value =
            '';

        return;
    }

    if (
        file.size > 5 * 1024 * 1024
    ) {

        $('formMessage').textContent =
            'Ảnh không được vượt quá 5MB.';

        $('productImageFile').value =
            '';

        return;
    }

    state.imageObjectUrl =
        URL.createObjectURL(file);

    const preview =
        $('imagePreview');

    preview.src =
        state.imageObjectUrl;

    preview.classList.add(
        'show'
    );

    $('formMessage').textContent =
        '';
}


// =========================================================
// OPEN MODAL
// =========================================================

function openModal(product = null) {

    state.editingId =
        product
            ? getId(product)
            : null;

    $('productModalTitle').textContent =
        product
            ? 'Sửa món'
            : 'Thêm món';

    $('productId').value =
        product
            ? getId(product)
            : '';

    $('productName').value =
        product
            ? getName(product)
            : '';

    $('productPrice').value =
        product
            ? getPrice(product)
            : '';

    $('productDescription').value =
        product
            ? getDescription(product)
            : '';

    $('productImageFile').value =
        '';

    clearImagePreview();

    const oldImage =
        product
            ? getImage(product)
            : '';

    $('currentImage').textContent =
        oldImage
            ? 'Ảnh hiện tại sẽ được giữ lại nếu không chọn ảnh mới.'
            : 'Chưa có ảnh.';

    $('formMessage').textContent =
        '';

    $('productModal')
        .classList
        .remove('hidden');

    $('productModal')
        .setAttribute(
            'aria-hidden',
            'false'
        );

    setTimeout(
        () => $('productName')?.focus(),
        50
    );
}


// =========================================================
// CLOSE MODAL
// =========================================================

function closeModal() {

    const modal =
        $('productModal');

    modal.classList.add(
        'hidden'
    );

    modal.setAttribute(
        'aria-hidden',
        'true'
    );

    $('productForm').reset();

    state.editingId = null;

    $('formMessage').textContent =
        '';

    $('currentImage').textContent =
        '';

    clearImagePreview();
}


// =========================================================
// SAVE
// =========================================================

async function saveProduct(event) {

    event.preventDefault();

    const formMessage =
        $('formMessage');

    const name =
        $('productName')
            .value
            .trim();

    const price =
        Number(
            $('productPrice').value
        );

    const description =
        $('productDescription')
            .value
            .trim();

    const imageFile =
        $('productImageFile')
            .files[0];

    // -------------------------
    // Validate
    // -------------------------

    if (!name) {

        formMessage.textContent =
            'Vui lòng nhập tên món.';

        return;
    }

    if (
        !Number.isFinite(price) ||
        price < 0
    ) {

        formMessage.textContent =
            'Giá bán không hợp lệ.';

        return;
    }

    const isEdit =
        state.editingId !== null;

    const url =
        isEdit
            ? `${API}/${encodeURIComponent(
                state.editingId
            )}`
            : API;

    const button =
        $('saveProductBtn');

    button.disabled = true;

    button.textContent =
        isEdit
            ? '⏳ Đang lưu...'
            : '⏳ Đang thêm...';

    formMessage.textContent =
        '';

    try {

        /*
         * Quan trọng:
         *
         * Không set Content-Type.
         * Browser tự tạo multipart boundary.
         */

        const formData =
            new FormData();

        formData.append(
            'tensanpham',
            name
        );

        formData.append(
            'giaban',
            String(price)
        );

        formData.append(
            'mota',
            description
        );

        if (imageFile) {

            formData.append(
                'imageFile',
                imageFile
            );
        }

        const response =
            await fetch(
                url,
                {
                    method:
                        isEdit
                            ? 'PUT'
                            : 'POST',

                    body:
                    formData
                }
            );

        if (!response.ok) {

            const text =
                await response.text();

            throw new Error(
                text ||
                `Không thể ${
                    isEdit
                        ? 'sửa'
                        : 'thêm'
                } món. HTTP ${
                    response.status
                }`
            );
        }

        closeModal();

        await loadProducts();

    } catch (error) {

        console.error(
            'Save product error:',
            error
        );

        formMessage.textContent =
            error.message ||
            'Không thể lưu món.';

    } finally {

        button.disabled = false;

        button.textContent =
            isEdit
                ? '💾 Lưu thay đổi'
                : '💾 Lưu món';
    }
}


// =========================================================
// DELETE
// =========================================================

async function deleteProduct(id) {

    const product =
        state.products.find(
            item =>
                String(
                    getId(item)
                ) === String(id)
        );

    if (!product) {

        alert(
            'Không tìm thấy món.'
        );

        return;
    }

    if (
        !confirm(
            `Bạn có chắc muốn xóa món "${getName(product)}"?`
        )
    ) {

        return;
    }

    try {

        const response =
            await fetch(
                `${API}/${encodeURIComponent(id)}`,
                {
                    method: 'DELETE'
                }
            );

        if (!response.ok) {

            const text =
                await response.text();

            throw new Error(
                text ||
                'Không thể xóa món.'
            );
        }

        await loadProducts();

    } catch (error) {

        console.error(
            'Delete product error:',
            error
        );

        alert(
            error.message ||
            'Không thể xóa món.'
        );
    }
}


// =========================================================
// EVENTS
// =========================================================

document.addEventListener(
    'DOMContentLoaded',
    () => {

        $('search')
            ?.addEventListener(
                'input',
                renderProducts
            );

        $('refreshBtn')
            ?.addEventListener(
                'click',
                loadProducts
            );

        $('addProductBtn')
            ?.addEventListener(
                'click',
                () => openModal()
            );

        $('closeProductModalBtn')
            ?.addEventListener(
                'click',
                closeModal
            );

        $('cancelProductBtn')
            ?.addEventListener(
                'click',
                closeModal
            );

        $('productImageFile')
            ?.addEventListener(
                'change',
                event => {

                    const file =
                        event.target
                            .files[0];

                    showImagePreview(
                        file
                    );
                }
            );

        $('productForm')
            ?.addEventListener(
                'submit',
                saveProduct
            );

        $('productModal')
            ?.addEventListener(
                'click',
                event => {

                    if (
                        event.target ===
                        $('productModal')
                    ) {

                        closeModal();
                    }
                }
            );

        $('products')
            ?.addEventListener(
                'click',
                event => {

                    const editBtn =
                        event.target.closest(
                            '.edit-product'
                        );

                    const deleteBtn =
                        event.target.closest(
                            '.delete-product'
                        );

                    // SỬA
                    if (editBtn) {

                        const product =
                            state.products.find(
                                item =>
                                    String(
                                        getId(item)
                                    ) ===
                                    String(
                                        editBtn.dataset.id
                                    )
                            );

                        if (product) {

                            openModal(
                                product
                            );
                        }
                    }

                    // XÓA
                    if (deleteBtn) {

                        deleteProduct(
                            deleteBtn.dataset.id
                        );
                    }
                }
            );

        document.addEventListener(
            'keydown',
            event => {

                if (
                    event.key === 'Escape' &&
                    !$('productModal')
                        .classList
                        .contains('hidden')
                ) {

                    closeModal();
                }
            }
        );

        loadProducts();
    }
);