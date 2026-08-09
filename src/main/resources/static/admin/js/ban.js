const API = '/api/ban';

let tables = [];

async function loadTables() {

    const message = document.getElementById('message');

    try {

        const response = await fetch(API);

        if (!response.ok) {
            throw new Error('Không thể tải danh sách bàn.');
        }

        tables = await response.json();

        message.style.display = 'none';

        renderTables();

    } catch (error) {

        message.textContent = error.message;

    }
}


function renderTables() {

    const root = document.getElementById('tables');

    root.innerHTML = tables.map(table => {

        const isBusy = table.trangThai === 1;

        const statusClass = isBusy ? 'busy' : 'empty';

        const statusText =
            isBusy ? '🔴 Có khách' : '🟢 Trống';

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


function copyLink(maBan) {

    const url =
        `${window.location.origin}/menu.html?ban=${maBan}`;

    navigator.clipboard.writeText(url);

    alert('Đã sao chép link bàn.');
}


function openMenu(maBan) {

    window.open(
        `/menu.html?ban=${maBan}`,
        '_blank'
    );
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
   WEBSOCKET BÀN
   ========================= */

function connectTableWebSocket() {

    const socket = new SockJS('/ws');

    const stompClient = Stomp.over(socket);

    stompClient.debug = null;

    stompClient.connect({}, function () {

        console.log('Table WebSocket connected');

        stompClient.subscribe('/topic/tables', function (message) {

            const updatedTable = JSON.parse(message.body);

            console.log('Bàn cập nhật:', updatedTable);

            const index = tables.findIndex(
                table => table.maBan === updatedTable.maBan
            );

            if (index !== -1) {

                // Cập nhật bàn trong mảng hiện tại
                tables[index] = updatedTable;

            } else {

                // Trường hợp bàn chưa tồn tại trong danh sách
                tables.push(updatedTable);

            }

            // Vẽ lại giao diện
            renderTables();

        });

    }, function (error) {

        console.error('Table WebSocket error:', error);

    });
}


/* =========================
   KHỞI ĐỘNG
   ========================= */

loadTables();
connectTableWebSocket();