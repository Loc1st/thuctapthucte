
const API = '/api/ban';

let tables = [];

async function loadTables() {
    const message = document.getElementById('message');

    try {
        await refreshTables();
    } catch (error) {
        message.style.display = 'block';
        message.textContent = error.message;
        console.error('Lỗi tải bàn:', error);
    }
}

async function refreshTables() {
    const response = await fetch(API, { cache: 'no-store' });

    if (!response.ok) {
        throw new Error('Không thể tải danh sách bàn.');
    }

    const data = await response.json();

    // Loại trùng theo mã bàn, không dựa vào tên bàn.
    const uniqueTables = new Map();

    data.forEach(table => {
        uniqueTables.set(String(table.maBan), table);
    });

    tables = Array.from(uniqueTables.values()).sort(
        (a, b) => Number(a.maBan) - Number(b.maBan)
    );

    const message = document.getElementById('message');
    message.style.display = 'none';

    renderTables();
}

function renderTables() {
    const root = document.getElementById('tables');

    root.innerHTML = tables.map(table => {
        const isBusy = Number(table.trangThai) === 1;
        const statusClass = isBusy ? 'busy' : 'empty';
        const statusText = isBusy ? '🔴 Có khách' : '🟢 Trống';

        const menuUrl =
            `${window.location.origin}/menu.html?ban=${table.maBan}`;

        const qrUrl =
            `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(menuUrl)}`;

        return `
            <div class="table-card">
                <div class="table-name">
                    ${escapeHtml(table.tenBan)}
                </div>

                <div class="status ${statusClass}">
                    ${statusText}
                </div>

                <img
                    class="qr-code"
                    src="${qrUrl}"
                    alt="QR ${escapeHtml(table.tenBan)}"
                >

                <div class="buttons">
                    <button onclick="copyLink(${table.maBan})">
                        Sao chép link
                    </button>

                    <button onclick="openMenu(${table.maBan})">
                        Mở menu
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

async function copyLink(maBan) {
    const url = `${window.location.origin}/menu.html?ban=${maBan}`;

    try {
        await navigator.clipboard.writeText(url);
        alert('Đã sao chép link bàn.');
    } catch (error) {
        alert('Không thể sao chép link.');
    }
}

function openMenu(maBan) {
    window.open(`/menu.html?ban=${maBan}`, '_blank');
}

function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

/* =========================
   THAY ĐỔI SỐ LƯỢNG BÀN
   ========================= */

async function changeTableCount() {
    try {
        // Lấy số bàn thực tế từ database trước khi xử lý.
        await refreshTables();
    } catch (error) {
        alert(error.message);
        return;
    }

    const currentCount = tables.length;

    const input = prompt(
        `Hiện có ${currentCount} bàn.\n` +
        'Nhập tổng số bàn mong muốn:'
    );

    if (input === null) return;

    const targetCount = Number(input);

    if (
        !Number.isInteger(targetCount) ||
        targetCount < 1 ||
        targetCount > 200
    ) {
        alert('Vui lòng nhập số nguyên từ 1 đến 200.');
        return;
    }

    if (targetCount === currentCount) {
        alert('Số lượng bàn không thay đổi.');
        return;
    }

    if (!confirm(
        `Bạn muốn thay đổi từ ${currentCount} bàn ` +
        `thành ${targetCount} bàn?`
    )) {
        return;
    }

    try {
        if (targetCount > currentCount) {
            const numberToAdd = targetCount - currentCount;

            // Lấy các số bàn đang tồn tại.
            const usedNumbers = new Set(
                tables.map(table => {
                    const match = String(table.tenBan ?? '')
                        .match(/^Bàn\s+(\d+)$/i);

                    return match ? Number(match[1]) : null;
                }).filter(number => number !== null)
            );

            // Chỉ tăng số bàn sau khi đã dự trữ tên,
            // tránh sinh cùng một tên trong vòng lặp.
            let nextNumber = Math.max(0, ...usedNumbers) + 1;

            for (let i = 0; i < numberToAdd; i++) {
                while (usedNumbers.has(nextNumber)) {
                    nextNumber++;
                }

                const tableName = `Bàn ${nextNumber}`;

                // Dự trữ ngay trước khi gửi request.
                usedNumbers.add(nextNumber);
                nextNumber++;

                const response = await fetch(API, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        tenBan: tableName,
                        trangThai: 0
                    })
                });

                if (!response.ok) {
                    throw new Error(`Không thể thêm ${tableName}.`);
                }

                // Đọc phản hồi để xác nhận API đã tạo bàn.
                await response.json().catch(() => null);
            }
        } else {
            const numberToDelete = currentCount - targetCount;

            // Ưu tiên xóa bàn có mã lớn nhất.
            const sortedTables = [...tables].sort(
                (a, b) => Number(b.maBan) - Number(a.maBan)
            );

            const tablesToDelete =
                sortedTables.slice(0, numberToDelete);

            // Chỉ xóa bàn đang trống.
            const busyTables = tablesToDelete.filter(
                table => Number(table.trangThai) !== 0
            );

            if (busyTables.length > 0) {
                alert(
                    'Không thể giảm số bàn vì bàn dự kiến xóa ' +
                    'đang có khách hoặc không ở trạng thái trống.\n' +
                    'Hãy xử lý các bàn đó trước.'
                );
                return;
            }

            for (const table of tablesToDelete) {
                const response = await fetch(
                    `${API}/${table.maBan}`,
                    { method: 'DELETE' }
                );

                if (!response.ok) {
                    throw new Error(
                        `Không thể xóa ${table.tenBan}. ` +
                        'Có thể bàn đang được đơn hàng tham chiếu.'
                    );
                }
            }
        }

        // Đồng bộ lại danh sách từ database sau khi hoàn tất.
        await refreshTables();

        alert(`Đã cập nhật thành công: ${tables.length} bàn.`);
    } catch (error) {
        alert(error.message || 'Có lỗi khi thay đổi số lượng bàn.');

        // Hiển thị lại dữ liệu thực tế, kể cả khi thao tác dở dang.
        await refreshTables().catch(console.error);
    }
}

/* =========================
   WEBSOCKET BÀN
   ========================= */

function connectTableWebSocket() {
    if (typeof SockJS === 'undefined' ||
        typeof Stomp === 'undefined') {
        console.error('Chưa tải được SockJS hoặc STOMP.');
        return;
    }

    const socket = new SockJS('/ws');
    const stompClient = Stomp.over(socket);

    stompClient.debug = null;

    stompClient.connect({}, function () {
        console.log('Table WebSocket connected');

        stompClient.subscribe('/topic/tables', function (message) {
            try {
                const updatedTable = JSON.parse(message.body);

                const index = tables.findIndex(
                    table =>
                        Number(table.maBan) === Number(updatedTable.maBan)
                );

                if (index !== -1) {
                    tables[index] = updatedTable;
                    renderTables();
                } else {
                    // Không tự push bàn mới vào mảng vì sự kiện có thể
                    // được gửi lặp; tải lại dữ liệu chuẩn từ database.
                    refreshTables().catch(console.error);
                }
            } catch (error) {
                console.error('Lỗi xử lý WebSocket bàn:', error);
            }
        });
    }, function (error) {
        console.error('Table WebSocket error:', error);
    });
}

// Khởi động trang
loadTables();
connectTableWebSocket();
