let stompClient = null;
let socketConnected = false;

let paidSessions = new Set();
const BAN_API = '/api/ban';
const ORDER_API = '/api/don-hang';

const STATUS = {
    WAITING: 0,
    DOING: 1,
    DONE: 2,
    CANCELLED: 3
};

let tables = [];
let orders = [];

const statusText = {
    0: 'Chờ xác nhận',
    1: 'Đang làm',
    2: 'Hoàn thành',
    3: 'Đã hủy'
};

const money = value =>
    Number(value || 0).toLocaleString('vi-VN') + ' đ';

function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

async function loadData() {
    const message = document.getElementById('message');

    try {
        message.textContent = 'Đang tải danh sách bàn...';

        const [banResponse, orderResponse] =
            await Promise.all([
                fetch(BAN_API),
                fetch(ORDER_API)
            ]);

        if (!banResponse.ok) {
            throw new Error('Không thể tải danh sách bàn.');
        }

        if (!orderResponse.ok) {
            throw new Error('Không thể tải danh sách đơn hàng.');
        }

        tables = await banResponse.json();
        orders = await orderResponse.json();

        message.classList.add('hidden');

        renderTables();

    } catch (error) {
        message.textContent = error.message;
        message.classList.remove('hidden');
    }
}

function renderTables() {
    const root = document.getElementById('tables');

    root.innerHTML = tables.map(table => {

        const busy = table.trangThai === 1;

        return `
            <article
                class="table-card"
                onclick="openTable(${table.maBan})"
            >

                <div class="table-name">
                    ${escapeHtml(table.tenBan)}
                </div>

                <span class="status ${busy ? 'busy' : 'empty'}">
                    ${busy ? '🔴 Có khách' : '🟢 Trống'}
                </span>

            </article>
        `;

    }).join('');
}

function openTable(maBan) {

    const table =
        tables.find(t => t.maBan === maBan);

    if (!table) return;

    document
        .getElementById('tables')
        .classList.add('hidden');

    document
        .querySelector('.page-title')
        .classList.add('hidden');

    document
        .getElementById('message')
        .classList.add('hidden');

    document
        .getElementById('tableDetail')
        .classList.remove('hidden');

    document.getElementById('detailTableName')
        .textContent = table.tenBan;

    const status =
        document.getElementById('detailStatus');

    status.textContent =
        table.trangThai === 1
            ? '🔴 Có khách'
            : '🟢 Trống';

    status.className =
        'status ' +
        (table.trangThai === 1
            ? 'busy'
            : 'empty');

    renderOrders(maBan);
}

function renderOrders(maBan) {

    const root =
        document.getElementById('orders');

    const sessionSummary =
        document.getElementById('sessionSummary');

    const tableOrders =
        orders.filter(order => order.maBan === maBan);

    if (!tableOrders.length) {

        sessionSummary.classList.add('hidden');

        root.innerHTML = `
            <div class="message">
                Bàn này chưa có đơn hàng.
            </div>
        `;

        return;
    }

    // Chỉ xem là "phiên hiện tại" khi bàn vẫn đang có khách.
// Sau khi thanh toán:
// - backend đóng phiên
// - bàn chuyển về trạng thái Trống
// => không được lấy phiên cũ làm phiên hiện tại nữa.

    const table = tables.find(
        t => Number(t.maBan) === Number(maBan)
    );

    const tableIsBusy =
        table && Number(table.trangThai) === 1;

    const validOrders = tableOrders.filter(
        order => order.maPhien != null
    );

    const latestSessionId =
        tableIsBusy && validOrders.length
            ? Math.max(
                ...validOrders.map(
                    order => Number(order.maPhien)
                )
            )
            : null;

    const sessions = new Map();

    tableOrders.forEach(order => {

        const key =
            order.maPhien != null
                ? String(order.maPhien)
                : 'unknown';

        if (!sessions.has(key)) {
            sessions.set(key, []);
        }

        sessions.get(key).push(order);
    });

    /*
     * Phiên hiện tại = phiên mới nhất.
     */

    const currentOrders =
        latestSessionId == null
            ? []
            : (
                sessions.get(
                    String(latestSessionId)
                ) || []
            );

    const currentTotal =
        currentOrders.reduce(
            (sum, order) =>
                sum + Number(order.tongTien || 0),
            0
        );

    const firstCurrentOrder =
        currentOrders
            .slice()
            .sort(
                (a, b) =>
                    new Date(a.ngayDat) -
                    new Date(b.ngayDat)
            )[0];

    if (latestSessionId != null) {

        sessionSummary.classList.remove('hidden');
        sessionSummary.classList.add('current');

        sessionSummary.innerHTML = `
            <div class="session-row">

                <div>

                    <div class="session-title">
                        🟢 Phiên hiện tại #${latestSessionId}
                    </div>

                    <div class="session-meta">

                        Bắt đầu từ
                        ${
            firstCurrentOrder
                ? formatDate(
                    firstCurrentOrder.ngayDat
                )
                : '—'
        }

                        · ${currentOrders.length} đơn

                    </div>

                </div>

                <div class="session-total">
                    ${money(currentTotal)}
                </div>

            </div>

            <div class="session-note">

                Các đơn hoàn thành hoặc bị hủy vẫn thuộc phiên này.
                Khách gọi thêm món sẽ tiếp tục dùng cùng phiên.

            </div>
        `;

    } else {

        sessionSummary.classList.add('hidden');
        sessionSummary.classList.remove('current');

    }

    renderSessionActions(
        latestSessionId,
        currentOrders
    );

    const currentHtml =
        currentOrders.length
            ? `
                <div class="session-block">

                    <div class="session-label">
                        Đơn trong phiên hiện tại
                    </div>

                    ${
                currentOrders
                    .slice()
                    .sort(
                        (a, b) =>
                            new Date(b.ngayDat) -
                            new Date(a.ngayDat)
                    )
                    .map(renderOrderCard)
                    .join('')
            }

                </div>
            `
            : '';

    const historySessions =
        [...sessions.entries()]
            .filter(
                ([key]) =>
                    key !== String(latestSessionId)
            )
            .sort(
                (a, b) =>
                    Number(b[0]) -
                    Number(a[0])
            );

    const historyHtml =
        historySessions.length
            ? `
                <div class="history-title">
                    Lịch sử các phiên trước
                </div>

                ${
                historySessions
                    .map(
                        ([sessionId, sessionOrders]) => {

                            const total =
                                sessionOrders.reduce(
                                    (sum, order) =>
                                        sum +
                                        Number(
                                            order.tongTien || 0
                                        ),
                                    0
                                );

                            return `
                                    <div class="session-block">

                                        <div class="session-label">

                                            Phiên #${escapeHtml(sessionId)}
                                            · ${sessionOrders.length} đơn
                                            · ${money(total)}

                                        </div>

                                        ${
                                sessionOrders
                                    .slice()
                                    .sort(
                                        (a, b) =>
                                            new Date(b.ngayDat) -
                                            new Date(a.ngayDat)
                                    )
                                    .map(renderOrderCard)
                                    .join('')
                            }

                                    </div>
                                `;
                        }
                    )
                    .join('')
            }
            `
            : '';

    const unknownHtml =
        sessions.has('unknown')
            ? `
                <div class="history-title">
                    Đơn chưa có thông tin phiên
                </div>

                ${
                sessions
                    .get('unknown')
                    .map(renderOrderCard)
                    .join('')
            }
            `
            : '';

    root.innerHTML =
        currentHtml +
        historyHtml +
        unknownHtml;
}

function renderOrderCard(order) {

    return `
        <article class="order">

            <div class="order-header">

                <div>

                    <div class="order-title">
                        Đơn #${order.maDonHang}
                    </div>

                    <div class="meta">

                        ${formatDate(order.ngayDat)}

                        ${
        order.maPhien != null
            ? ` · Phiên #${order.maPhien}`
            : ''
    }

                    </div>

                </div>

                <span class="order-status s${order.trangThai}">

                    ${
        statusText[order.trangThai]
        || 'Không xác định'
    }

                </span>

            </div>

            <div>

                ${
        (order.items || [])
            .map(
                item => `
                                <div class="item">

                                    <div>

                                        <div class="item-name">
                                            ${escapeHtml(
                    item.tenSanPham
                )}
                                        </div>

                                        <div class="item-info">

                                            ${item.soLuong}
                                            ×
                                            ${money(item.donGia)}

                                        </div>

                                    </div>

                                    <strong>
                                        ${money(item.tongTien)}
                                    </strong>

                                </div>
                            `
            )
            .join('')
    }

            </div>

            <div class="order-footer">

                <span>
                    Tổng
                </span>

                <span class="total">
                    ${money(order.tongTien)}
                </span>

            </div>

            ${renderOrderActions(order)}

        </article>
    `;
}

function renderOrderActions(order) {

    const status =
        Number(order.trangThai);

    if (
        status === STATUS.DONE ||
        status === STATUS.CANCELLED
    ) {
        return '';
    }

    const buttons = [];

    if (status === STATUS.WAITING) {

        buttons.push(`
            <button
                class="confirm"
                onclick="
                    event.stopPropagation();
                    updateOrderStatus(
                        ${order.maDonHang},
                        ${STATUS.DOING}
                    )
                "
            >
                Bắt đầu làm
            </button>
        `);

    }

    if (status === STATUS.DOING) {

        buttons.push(`
            <button
                class="done"
                onclick="
                    event.stopPropagation();
                    updateOrderStatus(
                        ${order.maDonHang},
                        ${STATUS.DONE}
                    )
                "
            >
                Hoàn thành
            </button>
        `);

    }

    buttons.push(`
        <button
            class="cancel"
            onclick="
                event.stopPropagation();
                updateOrderStatus(
                    ${order.maDonHang},
                    ${STATUS.CANCELLED}
                )
            "
        >
            Hủy đơn
        </button>
    `);

    return `
        <div class="order-actions">
            ${buttons.join('')}
        </div>
    `;
}

function renderSessionActions(
    sessionId,
    currentOrders
) {

    const root =
        document.getElementById(
            'sessionActions'
        );

    if (!root) return;

    if (
        sessionId == null ||
        !currentOrders.length
    ) {

        root.classList.add('hidden');
        root.innerHTML = '';

        return;
    }

    const hasUnfinished =
        currentOrders.some(
            order =>
                Number(order.trangThai) !==
                STATUS.DONE &&
                Number(order.trangThai) !==
                STATUS.CANCELLED
        );

    const alreadyPaid =
        paidSessions.has(
            Number(sessionId)
        );

    root.classList.remove('hidden');

    // =========================
    // ĐÃ THANH TOÁN
    // =========================

    if (alreadyPaid) {

        root.innerHTML = `
            <button
                class="pay"
                disabled
                data-payment-session="${sessionId}"
                style="
                    opacity: 0.5;
                    cursor: not-allowed;
                "
            >
                ✓ Đã thanh toán
            </button>
        `;

        return;
    }

    // =========================
    // CHƯA THANH TOÁN
    // =========================

    root.innerHTML = `
        <button
            class="pay"
            data-payment-session="${sessionId}"
            ${
        hasUnfinished
            ? 'disabled'
            : ''
    }
            onclick="paySession(${sessionId})"
        >
            💵 Thanh toán phiên #${sessionId}
        </button>
    `;

    const payButton =
        root.querySelector('button');

    // Có đơn chưa hoàn thành
    if (hasUnfinished) {

        payButton.style.opacity =
            '0.5';

        payButton.style.cursor =
            'not-allowed';
    }
}

async function updateOrderStatus(
    maDonHang,
    trangThai
) {

    const labels = {

        [STATUS.DOING]:
            'bắt đầu làm',

        [STATUS.DONE]:
            'hoàn thành',

        [STATUS.CANCELLED]:
            'hủy'

    };

    const action =
        labels[trangThai] ||
        'cập nhật';

    if (
        trangThai === STATUS.CANCELLED
    ) {

        if (
            !confirm(
                `Bạn có chắc muốn hủy đơn #${maDonHang}?`
            )
        ) {
            return;
        }

    }

    try {

        const response =
            await fetch(
                `${ORDER_API}/${maDonHang}/trang-thai?trangThai=${trangThai}`,
                {
                    method: 'PATCH'
                }
            );

        if (!response.ok) {

            const text =
                await response.text();

            throw new Error(
                text ||
                `Không thể ${action} đơn hàng.`
            );
        }

        await loadData();

        /*
         * Nếu đang ở màn chi tiết bàn,
         * mở lại bàn hiện tại.
         */

        const detail =
            document.getElementById(
                'tableDetail'
            );

        if (
            !detail.classList.contains('hidden')
        ) {

            const title =
                document.getElementById(
                    'detailTableName'
                ).textContent;

            const table =
                tables.find(
                    t => t.tenBan === title
                );

            if (table) {
                renderOrders(table.maBan);
            }

        }

    } catch (error) {

        alert(error.message);

    }
}

async function paySession(maPhien) {

    maPhien = Number(maPhien);

    const currentSessionOrders = orders.filter(
        order =>
            Number(order.maPhien) === maPhien
    );

    const unfinished = currentSessionOrders.some(
        order =>
            Number(order.trangThai) !== STATUS.DONE &&
            Number(order.trangThai) !== STATUS.CANCELLED
    );

    if (unfinished) {
        alert(
            'Chưa thể thanh toán: vẫn còn đơn chưa hoàn thành hoặc chưa hủy.'
        );
        return;
    }

    if (!confirm(
        `Xác nhận thanh toán phiên #${maPhien}?`
    )) {
        return;
    }

    const button = document.querySelector(
        `[data-payment-session="${maPhien}"]`
    );

    if (button) {
        button.disabled = true;
        button.textContent = 'Đang thanh toán...';
        button.style.opacity = '0.5';
        button.style.cursor = 'not-allowed';
    }

    try {

        const response = await fetch(
            `${ORDER_API}/phien/${maPhien}/thanh-toan`,
            {
                method: 'POST'
            }
        );

        if (!response.ok) {
            const text = await response.text();

            throw new Error(
                text || 'Không thể thanh toán phiên.'
            );
        }

        /*
         * THANH TOÁN THÀNH CÔNG
         *
         * Backend đã:
         * - đóng phiên
         * - chuyển bàn về Trống
         * - cập nhật dữ liệu
         * - gửi WebSocket
         */

        // Đánh dấu phiên đã thanh toán
        paidSessions.add(maPhien);

        // Tải lại dữ liệu bàn + đơn
        await loadData();

        // Lấy lại tên bàn đang mở
        const title =
            document.getElementById(
                'detailTableName'
            ).textContent;

        // Tìm bàn sau khi backend đã cập nhật
        const table = tables.find(
            t => t.tenBan === title
        );

        if (!table) {
            return;
        }

        /*
         * Cập nhật trạng thái trên màn hình
         */
        const status =
            document.getElementById(
                'detailStatus'
            );

        const isBusy =
            Number(table.trangThai) === 1;

        status.textContent =
            isBusy
                ? '🔴 Có khách'
                : '🟢 Trống';

        status.className =
            'status ' +
            (isBusy ? 'busy' : 'empty');

        /*
         * Render lại chi tiết bàn.
         *
         * Nếu bàn đã Trống:
         * - không còn "Phiên hiện tại"
         * - không còn nút thanh toán
         * - không còn đơn trong phiên hiện tại
         * - bàn hiển thị 🟢 Trống
         */
        renderOrders(table.maBan);

        // Render lại danh sách bàn bên ngoài
        renderTables();

    } catch (error) {

        console.error(
            'Lỗi thanh toán:',
            error
        );

        if (button) {
            button.disabled = false;

            button.textContent =
                `💵 Thanh toán phiên #${maPhien}`;

            button.style.opacity = '';
            button.style.cursor = '';
        }

        alert(error.message);
    }
}

function formatDate(value) {

    if (!value) return '';

    return new Date(value)
        .toLocaleString('vi-VN');
}

document
    .getElementById('backBtn')
    .addEventListener(
        'click',
        () => {

            document
                .getElementById('tableDetail')
                .classList.add('hidden');

            document
                .getElementById('sessionActions')
                .classList.add('hidden');

            document
                .getElementById('tables')
                .classList.remove('hidden');

            document
                .querySelector('.page-title')
                .classList.remove('hidden');

            renderTables();
        }
    );

document
    .getElementById('refreshBtn')
    .addEventListener(
        'click',
        loadData
    );

loadData();

// =========================
// WEBSOCKET NHÂN VIÊN
// =========================

function connectSocket() {

    if (typeof SockJS === 'undefined') {
        console.error('SockJS chưa được load.');
        return;
    }

    if (typeof Stomp === 'undefined') {
        console.error('STOMP chưa được load.');
        return;
    }

    const socket = new SockJS('/ws');
    const stompClient = Stomp.over(socket);

    stompClient.debug = null;

    stompClient.connect({}, function () {

        console.log('✅ Staff WebSocket connected');

        // Có đơn mới / đơn thay đổi
        stompClient.subscribe('/topic/orders', function (message) {

            try {

                const updatedOrder =
                    JSON.parse(message.body);

                console.log(
                    '🔔 Đơn hàng cập nhật:',
                    updatedOrder
                );

                loadData();

            } catch (error) {

                console.error(
                    'Lỗi xử lý WebSocket order:',
                    error
                );

            }

        });


        // Bàn thay đổi trạng thái
        stompClient.subscribe('/topic/tables', function (message) {

            try {

                const updatedTable =
                    JSON.parse(message.body);

                console.log(
                    '🪑 Bàn cập nhật:',
                    updatedTable
                );

                const index = tables.findIndex(
                    table =>
                        Number(table.maBan) ===
                        Number(updatedTable.maBan)
                );

                if (index !== -1) {

                    tables[index] = updatedTable;

                } else {

                    loadData();
                    return;

                }

                renderTables();

            } catch (error) {

                console.error(
                    'Lỗi xử lý WebSocket bàn:',
                    error
                );

            }

        });

    }, function (error) {

        console.error(
            '❌ WebSocket connection failed:',
            error
        );

        // Thử kết nối lại sau 3 giây
        setTimeout(connectSocket, 3000);

    });
}


// Khởi động WebSocket
connectSocket();