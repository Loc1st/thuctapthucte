'use strict';

const API = '/api/don-hang';

let orders = [];
let charts = {};

/* =========================
   DOM
========================= */

const $ = id => document.getElementById(id);

const periodEl = $('period');
const revenueEl = $('revenue');
const orderCountEl = $('orderCount');
const itemCountEl = $('itemCount');
const avgOrderEl = $('avgOrder');
const topProductsEl = $('topProducts');
const recentOrdersEl = $('recentOrders');
const messageEl = $('message');
const refreshBtn = $('refreshBtn');
const reloadBtn = $('reload');

/* =========================
   CONSTANTS
========================= */

const STATUS = {
    WAITING: 0,
    DOING: 1,
    DONE: 2,
    CANCELLED: 3
};

const STATUS_LABEL = {
    0: 'Chờ xác nhận',
    1: 'Đang làm',
    2: 'Hoàn thành',
    3: 'Đã hủy'
};

/* =========================
   UTILS
========================= */

function money(value) {
    const number = Number(value || 0);

    return number.toLocaleString('vi-VN') + ' đ';
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/[&<>"']/g, char => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        }[char]));
}

function getOrderDate(order) {
    if (!order || !order.ngayDat) {
        return null;
    }

    const date = new Date(order.ngayDat);

    return Number.isNaN(date.getTime())
        ? null
        : date;
}

function getOrderItems(order) {
    if (!order || !Array.isArray(order.items)) {
        return [];
    }

    return order.items;
}

function getOrderTotal(order) {
    return Number(
        order?.tongTien ??
        order?.total ??
        order?.totalAmount ??
        0
    );
}

/* =========================
   DATE FILTER
========================= */

function isInPeriod(order, period) {

    if (period === 'all') {
        return true;
    }

    const date = getOrderDate(order);

    if (!date) {
        return false;
    }

    const days = Number(period);

    if (!Number.isFinite(days)) {
        return true;
    }

    const now = new Date();

    const start = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
    );

    start.setDate(
        start.getDate() - days + 1
    );

    return date >= start;
}

/* =========================
   LOAD DATA
========================= */

async function load() {

    try {

        setLoading(true);

        const response = await fetch(API, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            },
            cache: 'no-store'
        });

        if (!response.ok) {
            throw new Error(
                `Không thể tải dữ liệu đơn hàng. HTTP ${response.status}`
            );
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error(
                'Dữ liệu đơn hàng trả về không đúng định dạng.'
            );
        }

        orders = data;

        render();

        hideMessage();

    } catch (error) {

        console.error(
            'Admin load error:',
            error
        );

        showMessage(
            error.message ||
            'Không thể tải dữ liệu.'
        );

    } finally {

        setLoading(false);

    }
}

/* =========================
   LOADING
========================= */

function setLoading(loading) {

    if (refreshBtn) {
        refreshBtn.disabled = loading;

        if (loading) {
            refreshBtn.dataset.oldText =
                refreshBtn.textContent;

            refreshBtn.textContent =
                'Đang tải...';
        } else {
            refreshBtn.textContent =
                refreshBtn.dataset.oldText ||
                'Làm mới';
        }
    }

}

/* =========================
   MESSAGE
========================= */

function showMessage(text) {

    if (!messageEl) {
        return;
    }

    messageEl.textContent = text;
    messageEl.classList.remove('hidden');

}

function hideMessage() {

    if (!messageEl) {
        return;
    }

    messageEl.classList.add('hidden');

}

/* =========================
   MAIN RENDER
========================= */

function render() {

    if (!periodEl) {
        console.error(
            'Không tìm thấy #period trong admin/index.html'
        );
        return;
    }

    const period = periodEl.value || '7';

    const filteredOrders =
        orders.filter(order =>
            isInPeriod(order, period)
        );

    const completedOrders =
        filteredOrders.filter(order =>
            Number(order.trangThai) === STATUS.DONE
        );

    /* Tổng doanh thu */
    const revenue =
        completedOrders.reduce(
            (sum, order) =>
                sum + getOrderTotal(order),
            0
        );

    /* Tổng số đơn */
    const orderCount =
        filteredOrders.length;

    /* Tổng số món */
    const itemCount =
        completedOrders.reduce(
            (sum, order) => {

                const items =
                    getOrderItems(order);

                return sum +
                    items.reduce(
                        (total, item) =>
                            total +
                            Number(
                                item.soLuong ??
                                item.quantity ??
                                0
                            ),
                        0
                    );

            },
            0
        );

    /* Giá trị đơn trung bình */
    const avgOrder =
        completedOrders.length > 0
            ? revenue / completedOrders.length
            : 0;

    if (revenueEl) {
        revenueEl.textContent =
            money(revenue);
    }

    if (orderCountEl) {
        orderCountEl.textContent =
            orderCount;
    }

    if (itemCountEl) {
        itemCountEl.textContent =
            itemCount;
    }

    if (avgOrderEl) {
        avgOrderEl.textContent =
            money(avgOrder);
    }

    renderRevenueChart(
        completedOrders,
        period
    );

    renderStatusChart(
        filteredOrders
    );

    renderHourChart(
        completedOrders
    );

    renderTopProducts(
        completedOrders
    );

    renderRecentOrders(
        filteredOrders
    );
}

/* =========================
   CHART HELPER
========================= */

function drawChart(id, config) {

    const canvas = $(id);

    if (!canvas) {
        console.warn(
            `Không tìm thấy canvas #${id}`
        );
        return;
    }

    if (
        typeof Chart === 'undefined'
    ) {
        console.error(
            'Chart.js chưa được load.'
        );
        return;
    }

    if (charts[id]) {
        charts[id].destroy();
    }

    charts[id] =
        new Chart(canvas, config);
}

/* =========================
   REVENUE CHART
========================= */

function renderRevenueChart(
    completedOrders,
    period
) {

    let days;

    if (period === 'all') {

        const dates =
            completedOrders
                .map(getOrderDate)
                .filter(Boolean)
                .sort((a, b) => a - b);

        if (!dates.length) {
            days = 7;
        } else {

            const first =
                new Date(dates[0]);

            const last =
                new Date(dates[dates.length - 1]);

            first.setHours(0, 0, 0, 0);
            last.setHours(0, 0, 0, 0);

            days =
                Math.max(
                    7,
                    Math.min(
                        31,
                        Math.ceil(
                            (last - first) /
                            86400000
                        ) + 1
                    )
                );
        }

    } else {

        days =
            Number(period) || 7;

    }

    /* Không cho biểu đồ quá dài */
    days =
        Math.min(
            Math.max(days, 1),
            31
        );

    const labels = [];
    const values = [];

    const today = new Date();

    today.setHours(
        0,
        0,
        0,
        0
    );

    const start = new Date(today);

    start.setDate(
        start.getDate() -
        days +
        1
    );

    for (
        let i = 0;
        i < days;
        i++
    ) {

        const current =
            new Date(start);

        current.setDate(
            start.getDate() + i
        );

        const year =
            current.getFullYear();

        const month =
            String(
                current.getMonth() + 1
            ).padStart(2, '0');

        const day =
            String(
                current.getDate()
            ).padStart(2, '0');

        const key =
            `${year}-${month}-${day}`;

        labels.push(
            `${day}/${month}`
        );

        const total =
            completedOrders
                .filter(order => {

                    const date =
                        getOrderDate(order);

                    if (!date) {
                        return false;
                    }

                    return (
                        date.getFullYear() === year &&
                        date.getMonth() + 1 === Number(month) &&
                        date.getDate() === Number(day)
                    );

                })
                .reduce(
                    (sum, order) =>
                        sum +
                        getOrderTotal(order),
                    0
                );

        values.push(total);
    }

    drawChart(
        'revenueChart',
        {
            type: 'line',

            data: {
                labels,

                datasets: [{
                    label: 'Doanh thu',

                    data: values,

                    tension: 0.4,

                    fill: true,

                    pointRadius: 3,

                    pointHoverRadius: 6
                }]
            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                interaction: {
                    intersect: false,
                    mode: 'index'
                },

                plugins: {

                    legend: {
                        display: false
                    },

                    tooltip: {

                        callbacks: {

                            label: context =>
                                money(
                                    context.raw
                                )

                        }

                    }

                },

                scales: {

                    y: {

                        beginAtZero: true,

                        ticks: {

                            callback: value =>
                                Number(value)
                                    .toLocaleString(
                                        'vi-VN'
                                    ) + ' đ'

                        }

                    },

                    x: {

                        grid: {
                            display: false
                        }

                    }

                }

            }
        }
    );
}

/* =========================
   STATUS CHART
========================= */

function renderStatusChart(
    data
) {

    const values =
        [
            STATUS.WAITING,
            STATUS.DOING,
            STATUS.DONE,
            STATUS.CANCELLED
        ].map(status =>
            data.filter(
                order =>
                    Number(order.trangThai) ===
                    status
            ).length
        );

    drawChart(
        'statusChart',
        {

            type: 'doughnut',

            data: {

                labels: [
                    'Chờ xác nhận',
                    'Đang làm',
                    'Hoàn thành',
                    'Đã hủy'
                ],

                datasets: [{
                    data: values,

                    borderWidth: 0
                }]

            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                cutout: '68%',

                plugins: {

                    legend: {
                        position: 'bottom'
                    }

                }

            }

        }
    );
}

/* =========================
   HOURLY CHART
========================= */

function renderHourChart(
    completedOrders
) {

    const values =
        Array(24).fill(0);

    completedOrders.forEach(
        order => {

            const date =
                getOrderDate(order);

            if (!date) {
                return;
            }

            values[
                date.getHours()
                ]++;

        }
    );

    drawChart(
        'hourChart',
        {

            type: 'bar',

            data: {

                labels:
                    values.map(
                        (_, index) =>
                            `${index}h`
                    ),

                datasets: [{

                    label:
                        'Số đơn',

                    data:
                    values

                }]

            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                plugins: {

                    legend: {
                        display: false
                    }

                },

                scales: {

                    y: {

                        beginAtZero: true,

                        ticks: {
                            precision: 0
                        }

                    },

                    x: {

                        grid: {
                            display: false
                        }

                    }

                }

            }

        }
    );
}

/* =========================
   TOP PRODUCTS
========================= */

function renderTopProducts(
    completedOrders
) {

    if (!topProductsEl) {
        return;
    }

    const map =
        new Map();

    completedOrders.forEach(
        order => {

            const items =
                getOrderItems(order);

            items.forEach(
                item => {

                    const key =
                        item.maSanPham ??
                        item.tenSanPham ??
                        item.name ??
                        'unknown';

                    const current =
                        map.get(key) || {

                            name:
                                item.tenSanPham ??
                                item.name ??
                                'Không tên',

                            quantity: 0,

                            revenue: 0

                        };

                    current.quantity +=
                        Number(
                            item.soLuong ??
                            item.quantity ??
                            0
                        );

                    current.revenue +=
                        Number(
                            item.tongTien ??
                            item.total ??
                            (
                                Number(
                                    item.soLuong ??
                                    item.quantity ??
                                    0
                                ) *
                                Number(
                                    item.giaBan ??
                                    item.price ??
                                    0
                                )
                            )
                        );

                    map.set(
                        key,
                        current
                    );

                }
            );

        }
    );

    const products =
        [...map.values()]
            .sort(
                (a, b) =>
                    b.quantity -
                    a.quantity
            )
            .slice(0, 6);

    if (!products.length) {

        topProductsEl.innerHTML =
            '<div class="message">Chưa có dữ liệu.</div>';

        return;
    }

    topProductsEl.innerHTML =
        products.map(
            (product, index) => `

                <div class="rank">

                    <span class="rank-num">
                        #${index + 1}
                    </span>

                    <div>

                        <div class="rank-name">
                            ${escapeHtml(
                product.name
            )}
                        </div>

                        <div class="rank-meta">
                            ${money(
                product.revenue
            )}
                        </div>

                    </div>

                    <strong class="rank-value">
                        ${product.quantity}
                    </strong>

                </div>

            `
        ).join('');
}

/* =========================
   RECENT ORDERS
========================= */

function renderRecentOrders(
    data
) {

    if (!recentOrdersEl) {
        return;
    }

    const recent =
        [...data]
            .sort(
                (a, b) => {

                    const da =
                        getOrderDate(a);

                    const db =
                        getOrderDate(b);

                    return (
                        (db?.getTime() || 0) -
                        (da?.getTime() || 0)
                    );

                }
            )
            .slice(0, 8);

    if (!recent.length) {

        recentOrdersEl.innerHTML =
            '<div class="message">Chưa có đơn.</div>';

        return;
    }

    recentOrdersEl.innerHTML =
        recent.map(
            order => {

                const date =
                    getOrderDate(order);

                const status =
                    Number(
                        order.trangThai
                    );

                return `

                    <div class="recent-row">

                        <div>

                            <div class="recent-title">

                                ${escapeHtml(
                    order.tenBan ||
                    'Không rõ bàn'
                )}

                                ·

                                Đơn #${escapeHtml(
                    order.maDonHang
                )}

                            </div>

                            <div class="recent-meta">

                                ${
                    date
                        ? date.toLocaleString(
                            'vi-VN'
                        )
                        : ''
                }

                            </div>

                        </div>

                        <span
                            class="badge s${status}"
                        >
                            ${
                    STATUS_LABEL[
                        status
                        ] || 'Không rõ'
                }
                        </span>

                        <strong>
                            ${money(
                    getOrderTotal(
                        order
                    )
                )}
                        </strong>

                    </div>

                `;

            }
        ).join('');
}

/* =========================
   EVENTS
========================= */

document.addEventListener(
    'DOMContentLoaded',
    () => {

        if (periodEl) {

            periodEl.addEventListener(
                'change',
                render
            );

        }

        if (refreshBtn) {

            refreshBtn.addEventListener(
                'click',
                load
            );

        }

        if (reloadBtn) {

            reloadBtn.addEventListener(
                'click',
                load
            );

        }

        load();

    }
);