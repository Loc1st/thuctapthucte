const API = '/api/don-hang';

let orders = [];

const statusText = {
    0: 'Chờ xác nhận',
    1: 'Đang làm',
    2: 'Hoàn thành',
    3: 'Đã hủy'
};

const money = n =>
    Number(n || 0).toLocaleString('vi-VN') + ' đ';

const esc = v =>
    String(v ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');


// =========================
// LOAD ĐƠN HÀNG
// =========================

async function load() {

    const msg = document.getElementById('message');

    if (msg) {
        msg.textContent = 'Đang tải...';
        msg.classList.remove('error');
    }

    try {

        const r = await fetch(API);

        if (!r.ok) {
            throw new Error('Không thể tải danh sách đơn hàng.');
        }

        orders = await r.json();

        render();

        if (msg) {
            msg.classList.add('hidden');
        }

    } catch (e) {

        if (msg) {
            msg.textContent = e.message;
            msg.classList.add('error');
        }

    }
}


// =========================
// RENDER
// =========================

function render() {

    const filter = document.getElementById('filter').value;

    const list =
        filter === 'all'
            ? orders
            : orders.filter(
                o => String(o.trangThai) === filter
            );


    document.getElementById('pendingCount').textContent =
        orders.filter(o => o.trangThai === 0).length;

    document.getElementById('workingCount').textContent =
        orders.filter(o => o.trangThai === 1).length;

    document.getElementById('doneCount').textContent =
        orders.filter(o => o.trangThai === 2).length;

    document.getElementById('revenue').textContent =
        money(
            orders
                .filter(o => o.trangThai === 2)
                .reduce(
                    (s, o) => s + Number(o.tongTien || 0),
                    0
                )
        );


    const root = document.getElementById('orders');

    if (!list.length) {

        root.innerHTML =
            '<div class="message">Không có đơn hàng.</div>';

        return;
    }


    root.innerHTML = list.map(o => `

        <article class="order">

            <div class="order-head">

                <div>

                    <div class="order-title">
                        ${esc(o.tenBan)} · Đơn #${o.maDonHang}
                    </div>

                    <div class="meta">
                        ${formatDate(o.ngayDat)}
                    </div>

                </div>

                <span class="badge s${o.trangThai}">
                    ${statusText[o.trangThai] || 'Không xác định'}
                </span>

            </div>


            <div class="items">

                ${(o.items || []).map(i => `

                    <div class="item">

                        <div>
                            <b>${esc(i.tenSanPham)}</b>
                            <br>

                            <small>
                                ${i.soLuong} × ${money(i.donGia)}
                            </small>
                        </div>

                        <strong>
                            ${money(i.tongTien)}
                        </strong>

                    </div>

                `).join('')}

            </div>


            <div class="order-bottom">

                <div class="total">
                    Tổng: ${money(o.tongTien)}
                </div>

                <div class="actions">
                    ${actions(o)}
                </div>

            </div>

        </article>

    `).join('');
}


// =========================
// BUTTON TRẠNG THÁI
// =========================

function actions(o) {

    if (o.trangThai === 0) {

        return `
            <button
                class="action"
                onclick="setStatus(${o.maDonHang},1)"
            >
                Nhận đơn
            </button>

            <button
                class="action"
                onclick="setStatus(${o.maDonHang},3)"
            >
                Hủy
            </button>
        `;
    }


    if (o.trangThai === 1) {

        return `
            <button
                class="action"
                onclick="setStatus(${o.maDonHang},2)"
            >
                Hoàn thành
            </button>

            <button
                class="action"
                onclick="setStatus(${o.maDonHang},3)"
            >
                Hủy
            </button>
        `;
    }


    return '';
}


// =========================
// UPDATE TRẠNG THÁI
// =========================

async function setStatus(id, status) {

    try {

        const r = await fetch(
            `${API}/${id}/trang-thai?trangThai=${status}`,
            {
                method: 'PATCH'
            }
        );


        if (!r.ok) {

            alert('Cập nhật trạng thái thất bại.');

            return;
        }


        await load();

    } catch (e) {

        alert('Không thể kết nối server.');

    }
}


// =========================
// FORMAT DATE
// =========================

function formatDate(v) {

    if (!v) return '';

    return new Date(v).toLocaleString('vi-VN');
}


// =========================
// EVENTS
// =========================

document
    .getElementById('filter')
    .addEventListener('change', render);


document
    .getElementById('refreshBtn')
    .addEventListener('click', load);


// =========================
// WEBSOCKET ĐƠN HÀNG
// =========================

function connectOrderWebSocket() {

    const socket = new SockJS('/ws');

    const stompClient = Stomp.over(socket);

    stompClient.debug = null;

    stompClient.connect({}, function () {

        console.log('WebSocket đơn hàng connected');


        // =========================
        // ĐƠN MỚI
        // =========================

        stompClient.subscribe(
            '/topic/orders',
            function (message) {

                const order = JSON.parse(message.body);

                console.log('Đơn mới:', order);

                alert(
                    `🔔 ĐƠN HÀNG MỚI\n\n` +
                    `${order.tenBan}\n` +
                    `Đơn #${order.maDonHang}\n` +
                    `Tổng: ${Number(order.tongTien).toLocaleString('vi-VN')}đ`
                );

                // Thêm đơn mới ngay vào danh sách
                load();
            }
        );


        // =========================
        // CẬP NHẬT TRẠNG THÁI ĐƠN
        // =========================

        stompClient.subscribe(
            '/topic/order-status',
            function (message) {

                const updatedOrder = JSON.parse(message.body);

                console.log(
                    'Trạng thái đơn cập nhật:',
                    updatedOrder
                );

                const index = orders.findIndex(
                    order =>
                        order.maDonHang === updatedOrder.maDonHang
                );


                if (index !== -1) {

                    // Cập nhật đơn ngay trong mảng
                    orders[index] = updatedOrder;

                    // Vẽ lại giao diện
                    render();

                } else {

                    // Nếu không tìm thấy đơn
                    // thì tải lại danh sách
                    load();
                }

            }
        );

    }, function (error) {

        console.error(
            'WebSocket đơn hàng lỗi:',
            error
        );

        // Tự kết nối lại
        setTimeout(
            connectOrderWebSocket,
            3000
        );

    });
}

// =========================
// START
// =========================

load();

connectOrderWebSocket();