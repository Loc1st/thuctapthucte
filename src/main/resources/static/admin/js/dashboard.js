const API = '/api/don-hang';

let orders = [];
const charts = {};

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

const STATUS = {
    0: 'Chờ xác nhận',
    1: 'Đang làm',
    2: 'Hoàn thành',
    3: 'Đã hủy'
};

function getDate(order) {
    const d = new Date(order?.ngayDat);
    return Number.isNaN(d.getTime()) ? null : d;
}

function localKey(date) {
    if (!date) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function getPeriodData(period) {
    if (period === 'all') return orders;

    const days = Number(period);
    if (!Number.isFinite(days) || days <= 0) return orders;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = new Date(today);
    start.setDate(start.getDate() - days + 1);

    return orders.filter((o) => {
        const d = getDate(o);
        return d && d >= start;
    });
}

async function load() {
    const message = $('message');

    try {
        const response = await fetch(API, {
            method: 'GET',
            headers: { Accept: 'application/json' }
        });

        if (!response.ok) {
            throw new Error('Không thể tải dữ liệu đơn hàng.');
        }

        const data = await response.json();
        orders = Array.isArray(data) ? data : [];

        render();

        if (message) message.classList.add('hidden');
    } catch (error) {
        console.error('Dashboard load error:', error);

        if (message) {
            message.textContent = error.message || 'Có lỗi xảy ra.';
            message.classList.remove('hidden');
        }
    }
}

function render() {
    const periodEl = $('period');
    const period = periodEl ? periodEl.value : 'all';

    const data = getPeriodData(period);
    const done = data.filter((o) => Number(o.trangThai) === 2);

    const revenue = done.reduce(
        (sum, o) => sum + Number(o.tongTien || 0),
        0
    );

    const itemCount = done.reduce(
        (sum, o) =>
            sum +
            (Array.isArray(o.items)
                ? o.items.reduce(
                    (x, i) => x + Number(i.soLuong || 0),
                    0
                )
                : 0),
        0
    );

    const setText = (id, value) => {
        const el = $(id);
        if (el) el.textContent = value;
    };

    setText('revenue', money(revenue));
    setText('orderCount', data.length);
    setText('itemCount', itemCount);
    setText(
        'avgOrder',
        money(done.length ? revenue / done.length : 0)
    );

    renderRevenueChart(done, period);
    renderStatusChart(data);
    renderHourChart(done);
    renderTopProducts(done);
    renderRecent(data);
}

function draw(id, config) {
    const canvas = $(id);
    if (!canvas || typeof Chart === 'undefined') return;

    if (charts[id]) {
        charts[id].destroy();
    }

    charts[id] = new Chart(canvas, config);
}

function renderRevenueChart(done, period) {
    const days =
        period === 'all'
            ? 30
            : Math.max(1, Number(period) || 30);

    const labels = [];
    const values = [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = new Date(today);
    start.setDate(start.getDate() - days + 1);

    for (let i = 0; i < days; i++) {
        const current = new Date(start);
        current.setDate(start.getDate() + i);

        const key = localKey(current);

        labels.push(
            current.toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit'
            })
        );

        const total = done
            .filter((o) => localKey(getDate(o)) === key)
            .reduce(
                (sum, o) => sum + Number(o.tongTien || 0),
                0
            );

        values.push(total);
    }

    draw('revenueChart', {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Doanh thu',
                data: values,
                tension: 0.35,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: (value) =>
                            Number(value).toLocaleString('vi-VN')
                    }
                },
                x: {
                    grid: { display: false }
                }
            }
        }
    });
}

function renderStatusChart(data) {
    const values = [0, 1, 2, 3].map(
        (status) =>
            data.filter(
                (o) => Number(o.trangThai) === status
            ).length
    );

    draw('statusChart', {
        type: 'doughnut',
        data: {
            labels: [
                STATUS[0],
                STATUS[1],
                STATUS[2],
                STATUS[3]
            ],
            datasets: [{
                data: values,
                backgroundColor: [
                    '#3498DB', // Chờ xác nhận - xanh dương
                    '#F1C40F', // Đang làm - vàng
                    '#2ECC71', // Hoàn thành - xanh lá
                    '#E74C3C'  // Đã hủy - đỏ
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function renderHourChart(done) {
    const values = Array(24).fill(0);

    done.forEach((order) => {
        const d = getDate(order);
        if (d) values[d.getHours()]++;
    });

    draw('hourChart', {
        type: 'bar',
        data: {
            labels: values.map((_, i) => `${i}h`),
            datasets: [{
                label: 'Đơn hoàn thành',
                data: values
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { precision: 0 }
                },
                x: {
                    grid: { display: false }
                }
            }
        }
    });
}

function renderTopProducts(done) {
    const container = $('topProducts');
    if (!container) return;

    const map = new Map();

    done.forEach((order) => {
        if (!Array.isArray(order.items)) return;

        order.items.forEach((item) => {
            const key =
                item.maSanPham ??
                item.tenSanPham ??
                'unknown';

            const current = map.get(key) || {
                name: item.tenSanPham || 'Không tên',
                quantity: 0,
                revenue: 0
            };

            current.quantity += Number(item.soLuong || 0);
            current.revenue += Number(item.tongTien || 0);

            map.set(key, current);
        });
    });

    const top = [...map.values()]
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 6);

    container.innerHTML = top.length
        ? top.map((item, index) => `
            <div class="rank">
                <span class="rank-num">#${index + 1}</span>
                <div>
                    <div class="rank-name">${esc(item.name)}</div>
                    <div class="rank-meta">${money(item.revenue)}</div>
                </div>
                <strong class="rank-value">${item.quantity}</strong>
            </div>
        `).join('')
        : '<div class="message">Chưa có dữ liệu.</div>';
}

function renderRecent(data) {
    const container = $('recentOrders');
    if (!container) return;

    const recent = [...data]
        .sort(
            (a, b) =>
                (getDate(b)?.getTime() || 0) -
                (getDate(a)?.getTime() || 0)
        )
        .slice(0, 5);

    container.innerHTML = recent.length
        ? recent.map((o) => `
            <div class="recent-row">
                <div>
                    <div class="recent-title">
                        ${esc(o.tenBan || 'Không rõ bàn')} · Đơn #${esc(o.maDonHang)}
                    </div>
                    <div class="recent-meta">
                        ${o.ngayDat
                            ? new Date(o.ngayDat).toLocaleString('vi-VN')
                            : ''}
                    </div>
                </div>
                <span class="badge s${Number(o.trangThai)}">
                    ${STATUS[Number(o.trangThai)] || '?'}
                </span>
                <strong>${money(o.tongTien)}</strong>
            </div>
        `).join('')
        : '<div class="message">Chưa có đơn.</div>';
}

document.addEventListener('DOMContentLoaded', () => {
    $('period')?.addEventListener('change', render);
    $('refreshBtn')?.addEventListener('click', load);
    $('reload')?.addEventListener('click', load);

    load();
});
