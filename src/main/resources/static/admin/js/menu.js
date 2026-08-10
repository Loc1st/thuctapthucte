const API = '/api/san-pham';

let products = [];

const $ = (id) => document.getElementById(id);

const money = (n) =>
    Number(n || 0).toLocaleString('vi-VN') + ' đ';

const esc = (v) =>
    String(v ?? '').replace(/[&<>"']/g, (c) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    }[c]));

async function load() {
    const message = $('message');

    try {
        const response = await fetch(API, {
            method: 'GET',
            headers: { Accept: 'application/json' }
        });

        if (!response.ok) {
            throw new Error('Không thể tải danh sách món.');
        }

        const data = await response.json();
        products = Array.isArray(data) ? data : [];

        render();

        if (message) message.classList.add('hidden');
    } catch (error) {
        console.error('Menu load error:', error);

        if (message) {
            message.textContent =
                error.message || 'Có lỗi xảy ra.';
            message.classList.remove('hidden');
        }
    }
}

function render() {
    const searchEl = $('search');
    const productsEl = $('products');
    const countEl = $('count');

    if (!productsEl) return;

    const query = String(searchEl?.value || '')
        .trim()
        .toLowerCase();

    const filtered = products.filter((product) => {
        const name = String(
            product.tenSanPham || ''
        ).toLowerCase();

        return !query || name.includes(query);
    });

    if (countEl) {
        countEl.textContent = `${filtered.length} món`;
    }

    productsEl.innerHTML = filtered.length
        ? filtered.map((product) => `
            <article class="product">
                <div class="product-img">
                    ${product.anhSanPham ? '🖼️' : '🍢'}
                </div>

                <div class="product-body">
                    <h3>${esc(product.tenSanPham)}</h3>

                    <p>
                        ${esc(
                            product.moTa ||
                            'Chưa có mô tả'
                        )}
                    </p>

                    <div class="price">
                        ${money(product.giaBan)}
                    </div>
                </div>
            </article>
        `).join('')
        : '<div class="message">Không có món phù hợp.</div>';
}

document.addEventListener('DOMContentLoaded', () => {
    $('search')?.addEventListener('input', render);
    $('refreshBtn')?.addEventListener('click', load);

    load();
});
