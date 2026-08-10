const API = '/api/don-hang';

let orders = [];

const STATUS = {
    0: 'Chờ xác nhận',
    1: 'Đang làm',
    2: 'Hoàn thành',
    3: 'Đã hủy'
};

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
            throw new Error(
                'Không thể tải danh sách đơn hàng.'
            );
        }

        const data = await response.json();
        orders = Array.isArray(data) ? data : [];

        render();

        if (message) message.classList.add('hidden');
    } catch (error) {
        console.error('Orders load error:', error);

        if (message) {
            message.textContent =
                error.message || 'Có lỗi xảy ra.';
            message.classList.remove('hidden');
        }
    }
}

function updateCounters() {
    const count = (status) =>
        orders.filter(
            (o) => Number(o.trangThai) === status
        ).length;

    const setText = (id, value) => {
        const el = $(id);
        if (el) el.textContent = value;
    };

    setText('pending', count(0));
    setText('doing', count(1));
    setText('done', count(2));
    setText('cancelled', count(3));
}

function matchesSearch(order, query) {
    if (!query) return true;

    const id = String(order.maDonHang ?? '');
    const table = String(order.tenBan ?? '')
        .toLowerCase();

    const items = Array.isArray(order.items)
        ? order.items
        : [];

    const productMatch = items.some((item) =>
        String(item.tenSanPham ?? '')
            .toLowerCase()
            .includes(query)
    );

    return (
        id.includes(query) ||
        table.includes(query) ||
        productMatch
    );
}

function render() {
    updateCounters();

    const container = $('orders');
    if (!container) return;

    const query = String($('search')?.value || '')
        .trim()
        .toLowerCase();

    const filter = $('filter')?.value || 'all';

    const filtered = orders.filter((order) => {
        const statusMatch =
            filter === 'all' ||
            String(order.trangThai) === filter;

        return (
            statusMatch &&
            matchesSearch(order, query)
        );
    });

    container.innerHTML = filtered.length
        ? filtered.map(card).join('')
        : '<div class="message">Không có đơn phù hợp.</div>';
}

function card(order) {
    const status = Number(order.trangThai);

    let actions = '';

    if (status === 0) {
        actions = `
            <button
                class="action"
                onclick="setStatus(${Number(order.maDonHang)}, 1)"
            >
                Nhận đơn
            </button>

            <button
                class="action red"
                onclick="setStatus(${Number(order.maDonHang)}, 3)"
            >
                Hủy
            </button>
        `;
    } else if (status === 1) {
        actions = `
            <button
                class="action green"
                onclick="setStatus(${Number(order.maDonHang)}, 2)"
            >
                Hoàn thành
            </button>

            <button
                class="action red"
                onclick="setStatus(${Number(order.maDonHang)}, 3)"
            >
                Hủy
            </button>
        `;
    }

    const items = Array.isArray(order.items)
        ? order.items
        : [];

    return `
        <article class="order">
            <div class="order-head">
                <div>
                    <div class="order-title">
                        ${esc(order.tenBan || 'Không rõ bàn')}
                        · Đơn #${esc(order.maDonHang)}
                    </div>

                    <div class="meta">
                        ${
                            order.ngayDat
                                ? new Date(order.ngayDat)
                                    .toLocaleString('vi-VN')
                                : ''
                        }
                        · Phiên ${esc(order.maPhien ?? '—')}
                    </div>
                </div>

                <span class="badge s${status}">
                    ${STATUS[status] || '?'}
                </span>
            </div>

            <div class="items">
                ${
                    items.length
                        ? items.map((item) => `
                            <div class="item">
                                <div>
                                    <b>${esc(item.tenSanPham)}</b>
                                    <br>
                                    <small>
                                        ${Number(item.soLuong || 0)}
                                        ×
                                        ${money(item.donGia)}
                                    </small>
                                </div>

                                <strong>
                                    ${money(item.tongTien)}
                                </strong>
                            </div>
                        `).join('')
                        : '<div class="message">Không có món.</div>'
                }
            </div>

            <div class="order-bottom">
                <strong class="total">
                    ${money(order.tongTien)}
                </strong>

                <div class="actions">
                    ${actions}
                </div>
            </div>
        </article>
    `;
}

async function setStatus(id, status) {
    if (!Number.isFinite(Number(id))) {
        alert('Mã đơn hàng không hợp lệ.');
        return;
    }

    if (![0, 1, 2, 3].includes(Number(status))) {
        alert('Trạng thái không hợp lệ.');
        return;
    }

    if (
        Number(status) === 3 &&
        !confirm(`Hủy đơn #${id}?`)
    ) {
        return;
    }

    try {
        const response = await fetch(
            `${API}/${id}/trang-thai?trangThai=${status}`,
            {
                method: 'PATCH',
                headers: {
                    Accept: 'application/json'
                }
            }
        );

        if (!response.ok) {
            const text = await response.text();
            throw new Error(
                text || 'Cập nhật trạng thái thất bại.'
            );
        }

        await load();
    } catch (error) {
        console.error('Set status error:', error);
        alert(error.message || 'Cập nhật thất bại.');
    }
}

/*
 * Giữ hàm ở window vì HTML hiện tại
 * đang dùng onclick="setStatus(...)"
 */
window.setStatus = setStatus;

document.addEventListener('DOMContentLoaded', () => {
    $('filter')?.addEventListener('change', render);
    $('search')?.addEventListener('input', render);
    $('refreshBtn')?.addEventListener('click', load);

    load();
});
