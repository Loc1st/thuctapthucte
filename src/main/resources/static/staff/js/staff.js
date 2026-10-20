let stompClient = null;
let socketConnected = false;

let paidSessions = new Set();
const BAN_API = '/api/ban';
const ORDER_API = '/api/don-hang';

// =========================
// THÔNG TIN NHẬN CHUYỂN KHOẢN
// =========================

const PAYMENT_CONFIG = {
    bankId: 'TPB',
    accountNo: '00005606706',
    accountName: 'NGUYEN DUY LOC'
};

const STATUS = {
    WAITING: 0,
    DOING: 1,
    DONE: 2,
    CANCELLED: 3
};

const TABLE_STATUS = {
    EMPTY: 0,
    BUSY: 1,
    WAITING_PAYMENT: 2
};

let tables = [];
let orders = [];
let ordersLoadError = null;

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

function getTableStatusMeta(value) {
    const status = Number(value);

    if (status === TABLE_STATUS.EMPTY) {
        return {
            text: '🟢 Trống',
            className: 'empty'
        };
    }

    if (status === TABLE_STATUS.BUSY) {
        return {
            text: '🔴 Có khách',
            className: 'busy'
        };
    }

    if (status === TABLE_STATUS.WAITING_PAYMENT) {
        return {
            text: '🟡 Chờ thanh toán',
            className: 'waiting-payment'
        };
    }

    return {
        text: '⚪ Không xác định',
        className: 'unknown'
    };
}

function tableHasCurrentSession(table) {
    const status = Number(table?.trangThai);

    return status === TABLE_STATUS.BUSY ||
        status === TABLE_STATUS.WAITING_PAYMENT;
}

async function loadData() {
    const message = document.getElementById('message');

    try {
        message.textContent = 'Đang tải danh sách bàn...';

        const banResponse = await fetch(BAN_API);

        if (!banResponse.ok) {
            throw new Error('Không thể tải danh sách bàn.');
        }

        tables = await banResponse.json();

        message.classList.add('hidden');

        renderTables();

    } catch (error) {
        message.textContent = error.message;
        message.classList.remove('hidden');
        return;
    }

    try {
        const orderResponse = await fetch(ORDER_API);

        if (!orderResponse.ok) {
            throw new Error('Không thể tải danh sách đơn hàng.');
        }

        orders = await orderResponse.json();
        ordersLoadError = null;

    } catch (error) {
        orders = [];
        ordersLoadError = error;

        message.textContent = error.message;
        message.classList.remove('hidden');
    }
}

function renderTables() {
    const root = document.getElementById('tables');

    root.innerHTML = tables.map(table => {

        const status = getTableStatusMeta(table.trangThai);

        return `
            <article
                class="table-card"
                onclick="openTable(${table.maBan})"
            >

                <div class="table-name">
                    ${escapeHtml(table.tenBan)}
                </div>

                <span class="status ${status.className}">
                    ${status.text}
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

    const tableStatus =
        getTableStatusMeta(table.trangThai);

    status.textContent =
        tableStatus.text;

    status.className =
        'status ' + tableStatus.className;

    renderOrders(maBan);
}

function renderOrders(maBan) {

    const root =
        document.getElementById('orders');

    const sessionSummary =
        document.getElementById('sessionSummary');

    if (ordersLoadError) {

        sessionSummary.classList.add('hidden');

        const sessionActions =
            document.getElementById(
                'sessionActions'
            );

        if (sessionActions) {
            sessionActions.classList.add('hidden');
            sessionActions.innerHTML = '';
        }

        root.innerHTML = `
        <div class="message">
            ${escapeHtml(ordersLoadError.message)}
        </div>
    `;

        return;
    }

    const tableOrders =
        orders.filter(order => order.maBan === maBan);

    if (!tableOrders.length) {

        sessionSummary.classList.add('hidden');

        const sessionActions =
            document.getElementById(
                'sessionActions'
            );

        if (sessionActions) {
            sessionActions.classList.add('hidden');
            sessionActions.innerHTML = '';
        }

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
        tableHasCurrentSession(table);

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
        currentOrders
            .filter(
                order =>
                    Number(order.trangThai) === STATUS.DONE
            )
            .reduce(
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
                Number(order.trangThai) !== STATUS.DONE &&
                Number(order.trangThai) !== STATUS.CANCELLED
        );

    const hasCompleted =
        currentOrders.some(
            order =>
                Number(order.trangThai) === STATUS.DONE
        );

// Không có đơn hoàn thành => không có tiền để thanh toán
    if (!hasCompleted) {

        root.classList.add('hidden');
        root.innerHTML = '';

        return;
    }

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
        [STATUS.DOING]: 'bắt đầu làm',
        [STATUS.DONE]: 'hoàn thành',
        [STATUS.CANCELLED]: 'hủy'
    };

    const action =
        labels[trangThai] || 'cập nhật';


    // ==============================
    // XÁC NHẬN HỦY
    // ==============================

    if (trangThai === STATUS.CANCELLED) {

        if (!confirm(
            `Bạn có chắc muốn hủy đơn #${maDonHang}?`
        )) {
            return;
        }
    }


    try {

        // ==============================
        // GỌI BACKEND
        // ==============================

        const response = await fetch(
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


        // ==================================================
        // LẤY THÔNG TIN ĐƠN VỪA THAY ĐỔI
        // ==================================================

        const changedOrder =
            orders.find(
                order =>
                    Number(order.maDonHang) ===
                    Number(maDonHang)
            );


        // ==================================================
        // HỦY ĐƠN
        // ==================================================

        if (
            trangThai === STATUS.CANCELLED &&
            changedOrder
        ) {

            const maBan =
                Number(changedOrder.maBan);

            const maPhien =
                changedOrder.maPhien != null
                    ? Number(changedOrder.maPhien)
                    : null;


            // ==============================================
            // LOAD DATA MỚI NHẤT TỪ BACKEND
            // ==============================================

            await loadData();


            // ==============================================
            // TÌM LẠI BÀN
            // ==============================================

            const table =
                tables.find(
                    t =>
                        Number(t.maBan) ===
                        maBan
                );


            if (!table) {
                return;
            }


            // ==============================================
            // CHỈ KIỂM TRA ĐƠN TRONG PHIÊN HIỆN TẠI
            //
            // KHÔNG kiểm tra đơn cũ của những phiên trước.
            // ==============================================

            const sessionOrders =
                orders.filter(order =>
                    Number(order.maBan) === maBan &&
                    (
                        maPhien == null ||
                        Number(order.maPhien) === maPhien
                    )
                );


            // ==============================================
            // CÒN ĐƠN CHƯA HỦY?
            // ==============================================

            const hasActiveOrder =
                sessionOrders.some(order => {

                    const status =
                        Number(order.trangThai);

                    return (
                        status !== STATUS.CANCELLED
                    );
                });


            // ==============================================
            // KHÔNG CÒN ĐƠN HOẠT ĐỘNG
            // => BÀN TRỐNG
            // => XÓA NÚT THANH TOÁN
            // ==============================================

            if (!hasActiveOrder) {

                // Cập nhật trạng thái bàn trên giao diện
                table.trangThai = 0;


                // Trạng thái
                const status =
                    document.getElementById(
                        'detailStatus'
                    );

                if (status) {

                    status.textContent =
                        '🟢 Trống';

                    status.className =
                        'status empty';
                }


                // Xóa nút thanh toán
                const sessionActions =
                    document.getElementById(
                        'sessionActions'
                    );

                if (sessionActions) {

                    sessionActions.innerHTML = '';

                    sessionActions.classList.add(
                        'hidden'
                    );
                }


                // Render lại danh sách đơn
                renderOrders(maBan);


                // Render lại danh sách bàn
                renderTables();


                return;
            }


            // ==============================================
            // VẪN CÒN ĐƠN TRONG PHIÊN
            // => BÀN VẪN CÓ KHÁCH
            // ==============================================

            renderOrders(maBan);

            renderTables();

            return;
        }


        // ==================================================
        // DOING / DONE
        // ==================================================

        await loadData();


        const detail =
            document.getElementById(
                'tableDetail'
            );


        if (
            detail &&
            !detail.classList.contains('hidden')
        ) {

            const title =
                document.getElementById(
                    'detailTableName'
                ).textContent;


            const table =
                tables.find(
                    t =>
                        t.tenBan === title
                );


            if (table) {

                renderOrders(
                    table.maBan
                );
            }
        }


    } catch (error) {

        console.error(
            'Lỗi cập nhật trạng thái:',
            error
        );

        alert(error.message);
    }
}

async function paySession(maPhien) {

    maPhien = Number(maPhien);

    // Lấy đúng các đơn thuộc phiên
    const currentSessionOrders = orders.filter(
        order => Number(order.maPhien) === maPhien
    );

    if (!currentSessionOrders.length) {
        alert(`Không tìm thấy đơn hàng của phiên #${maPhien}.`);
        return;
    }

    // =====================================================
    // 1. Nếu còn đơn đang chờ / đang làm -> KHÔNG thanh toán
    // =====================================================

    const unfinished = currentSessionOrders.some(order => {

        const status = Number(order.trangThai);

        return (
            status !== STATUS.DONE &&
            status !== STATUS.CANCELLED
        );

    });

    if (unfinished) {

        alert(
            'Chưa thể thanh toán: vẫn còn đơn chưa hoàn thành hoặc chưa hủy.'
        );

        return;
    }


    // =====================================================
    // 2. CHỈ lấy đơn HOÀN THÀNH
    //    Đơn ĐÃ HỦY tuyệt đối không tính tiền
    // =====================================================

    const payableOrders =
        currentSessionOrders.filter(order => {

            return Number(order.trangThai) === STATUS.DONE;

        });


    // =====================================================
    // 3. Nếu tất cả đơn đều ĐÃ HỦY
    // =====================================================

    if (payableOrders.length === 0) {

        alert(
            `Phiên #${maPhien} không có đơn hoàn thành để thanh toán.`
        );

        return;
    }


    // =====================================================
    // 4. Tính tiền CHỈ từ đơn hoàn thành
    // =====================================================

    const total =
        payableOrders.reduce(
            (sum, order) => {

                return sum + Number(order.tongTien || 0);

            },
            0
        );


    if (total <= 0) {

        alert(
            `Phiên #${maPhien} không có số tiền cần thanh toán.`
        );

        return;
    }


    // =====================================================
    // 5. Mở bill chuyển khoản
    // =====================================================

    showPaymentBill(
        maPhien,
        payableOrders,
        total
    );
}

function showPaymentBill(
    maPhien,
    sessionOrders,
    total
) {

    let modal =
        document.getElementById(
            'paymentModal'
        );

    if (!modal) {

        modal =
            document.createElement('div');

        modal.id = 'paymentModal';

        modal.className =
            'payment-modal hidden';

        document.body.appendChild(modal);
    }

    const transferContent =
        `CAVIENCHIEN PHIEN ${maPhien}`;

    const qrUrl =
        `https://img.vietqr.io/image/${PAYMENT_CONFIG.bankId}-${PAYMENT_CONFIG.accountNo}-compact2.png` +
        `?amount=${total}` +
        `&addInfo=${encodeURIComponent(`CAVIENCHIEN PHIEN ${maPhien}`)}` +
        `&accountName=${encodeURIComponent(PAYMENT_CONFIG.accountName)}`;

    const items = [];

    sessionOrders.forEach(order => {

        (order.items || []).forEach(item => {

            items.push(`
                <div class="payment-item">

                    <div class="payment-item-name">
                        ${escapeHtml(
                item.tenSanPham
            )}

                        × ${item.soLuong}
                    </div>

                    <div class="payment-item-price">
                        ${money(item.tongTien)}
                    </div>

                </div>
            `);

        });

    });

    modal.innerHTML = `

        <div
            class="payment-bill"
            onclick="event.stopPropagation()"
        >

            <div class="payment-bill-header">

                <h2>
                    🧾 HÓA ĐƠN THANH TOÁN
                </h2>

                <p>
                    Cá Viên Chiên
                </p>

                <p>
                    Phiên #${maPhien}
                </p>

            </div>


            <div class="payment-items">

                ${items.join('')}

            </div>


            <div class="payment-transfer">

                <div class="payment-row">

                    <span>Ngân hàng</span>

                    <strong>
                        ${escapeHtml(
        PAYMENT_CONFIG.bankId
    )}
                    </strong>

                </div>


                <div class="payment-row">

                    <span>Số tài khoản</span>

                    <strong>
                        ${escapeHtml(
        PAYMENT_CONFIG.accountNo
    )}
                    </strong>

                </div>


                <div class="payment-row">

                    <span>Chủ tài khoản</span>

                    <strong>
                        ${escapeHtml(
        PAYMENT_CONFIG.accountName
    )}
                    </strong>

                </div>


                <div class="payment-row">

                    <span>Nội dung</span>

                    <strong class="payment-content">
                        ${escapeHtml(
        transferContent
    )}
                    </strong>

                </div>


                <div class="payment-row">

                    <span>Tổng tiền</span>

                    <strong class="payment-amount">
                        ${money(total)}
                    </strong>

                </div>

            </div>


            <div class="payment-qr">

                <img
                    src="${qrUrl}"
                    alt="QR thanh toán"
                >

                <p>
                    Quét mã QR để chuyển khoản
                </p>

            </div>


            <div class="payment-bill-actions">

                <button
                    class="payment-cancel"
                    onclick="closePaymentBill()"
                >
                    Đóng
                </button>


                <button
                    class="payment-confirm"
                    onclick="
                        confirmPaymentReceived(
                            ${maPhien}
                        )
                    "
                >
                    ✓ Đã nhận tiền
                </button>

            </div>

        </div>

    `;

    modal.classList.remove('hidden');
}

function closePaymentBill() {

    const modal =
        document.getElementById(
            'paymentModal'
        );

    if (!modal) return;

    modal.classList.add('hidden');
}

function refreshCurrentTable() {

    const detail =
        document.getElementById('tableDetail');

    if (!detail || detail.classList.contains('hidden')) {
        return;
    }

    const title =
        document.getElementById(
            'detailTableName'
        )?.textContent?.trim();

    if (!title) return;

    const table =
        tables.find(
            t => String(t.tenBan).trim() === title
        );

    if (!table) return;

    // =========================
    // CẬP NHẬT TRẠNG THÁI BÀN
    // =========================

    const status =
        document.getElementById('detailStatus');

    const tableStatus =
        getTableStatusMeta(table.trangThai);

    if (status) {

        status.textContent =
            tableStatus.text;

        status.className =
            'status ' + tableStatus.className;
    }

    // =========================
    // RENDER LẠI ĐƠN
    // =========================

    renderOrders(
        Number(table.maBan)
    );
}

async function confirmPaymentReceived(
    maPhien
) {

    maPhien = Number(maPhien);

    const confirmResult =
        confirm(
            `Xác nhận đã nhận đủ tiền cho phiên #${maPhien}?`
        );

    if (!confirmResult) {
        return;
    }

    const modal =
        document.getElementById(
            'paymentModal'
        );

    const confirmButton =
        modal?.querySelector(
            '.payment-confirm'
        );

    if (confirmButton) {

        confirmButton.disabled = true;

        confirmButton.textContent =
            'Đang xác nhận...';

        confirmButton.style.opacity =
            '0.6';

        confirmButton.style.cursor =
            'not-allowed';
    }

    try {

        const response =
            await fetch(
                `${ORDER_API}/phien/${maPhien}/thanh-toan`,
                {
                    method: 'POST'
                }
            );

        if (!response.ok) {

            const text =
                await response.text();

            throw new Error(
                text ||
                'Không thể xác nhận thanh toán.'
            );
        }


        // =========================
        // THANH TOÁN THÀNH CÔNG
        // =========================

        paidSessions.add(maPhien);

        closePaymentBill();

        alert(
            `Đã thanh toán phiên #${maPhien}.`
        );

        // Backend đã:
        // - đóng phiên
        // - trả bàn về Trống
        // - gửi WebSocket
        await loadData();

        // Cập nhật lại màn hình bàn hiện tại
        if (
            typeof refreshCurrentTable ===
            'function'
        ) {
            refreshCurrentTable();
        }

    } catch (error) {

        if (confirmButton) {

            confirmButton.disabled =
                false;

            confirmButton.textContent =
                '✓ Đã nhận tiền';

            confirmButton.style.opacity =
                '';

            confirmButton.style.cursor =
                '';
        }

        alert(
            error.message
        );
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
