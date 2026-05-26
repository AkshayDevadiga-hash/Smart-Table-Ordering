async function api(path) {
  const res = await fetch(apiUrl(path));
  if (!res.ok) throw new Error();
  return res.json();
}

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return diff + 's ago';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  return Math.floor(diff / 3600) + 'h ago';
}

const STATUS_BADGE = { pending:'badge-yellow', received:'badge-blue', preparing:'badge-orange', ready:'badge-green', delivered:'badge-gray', cancelled:'badge-red' };

function money(value) {
  const amount = Number(value);
  return '₹' + (Number.isFinite(amount) ? amount : 0).toFixed(2);
}
function moneyStat(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '₹0';
  return '₹' + Math.round(amount).toLocaleString('en-IN');
}

const ICON_ORDERS = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M16.5 9.4l-9-5.19"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`;
const ICON_REVENUE = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`;
const ICON_ACTIVE = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>`;
const ICON_TABLES = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="4" rx="1"/><path d="M5 7v14"/><path d="M19 7v14"/><path d="M9 21h6"/></svg>`;

async function loadStats() {
  try {
    const s = await api('/admin/stats');
    document.getElementById('statsGrid').innerHTML = `
      <div class="card stat-card">
        <div class="stat-icon">${ICON_ORDERS}</div>
        <div class="stat-body">
          <div class="stat-meta">Today</div>
          <div class="stat-num">${s.totalOrdersToday}</div>
          <div class="stat-label">Orders Today</div>
        </div>
      </div>
      <div class="card stat-card">
        <div class="stat-icon">${ICON_REVENUE}</div>
        <div class="stat-body">
          <div class="stat-meta">Today</div>
          <div class="stat-num">${moneyStat(s.totalRevenueToday)}</div>
          <div class="stat-label">Paid Revenue Today</div>
        </div>
      </div>
      <div class="card stat-card">
        <div class="stat-icon">${ICON_ACTIVE}</div>
        <div class="stat-body">
          <div class="stat-meta ${s.activeOrders > 0 ? 'active-badge' : ''}">${s.activeOrders > 0 ? s.activeOrders + ' active' : '0 active'}</div>
          <div class="stat-num">${s.activeOrders}</div>
          <div class="stat-label">Active Orders</div>
        </div>
      </div>
      <div class="card stat-card">
        <div class="stat-icon">${ICON_TABLES}</div>
        <div class="stat-body">
          <div class="stat-meta">${s.totalTables} total</div>
          <div class="stat-num">${s.tablesOccupied}</div>
          <div class="stat-label">Tables Occupied</div>
        </div>
      </div>
    `;

    const popularEl = document.getElementById('popularItems');
    if (!s.popularItems || !s.popularItems.length) {
      popularEl.innerHTML = '<div class="no-data">No data yet</div>';
    } else {
      popularEl.innerHTML = s.popularItems.map((item, i) =>
        `<div class="popular-item">
          <div class="popular-rank">${i+1}</div>
          <div class="popular-name">${item.name}</div>
          <div class="popular-count">${item.count} sold</div>
        </div>`
      ).join('');
    }
  } catch {}
}

async function loadRecentOrders() {
  try {
    const orders = await api('/admin/recent-orders');
    const el = document.getElementById('recentOrders');
    if (!orders.length) {
      el.innerHTML = '<div class="no-data">No orders yet</div>';
      return;
    }
    el.innerHTML = orders.map(o =>
      `<div class="order-row">
        <div class="order-row-info">
          <div class="order-row-num">Order #${o.id} · Table ${o.tableNumber}</div>
          <div class="order-row-sub">${timeAgo(o.createdAt)} · ${(o.items||[]).length} item(s)</div>
        </div>
        <div style="display:flex;gap:0.375rem;align-items:center;flex-wrap:wrap;justify-content:flex-end">
          <span class="badge ${STATUS_BADGE[o.status] || 'badge-gray'}">${o.status.charAt(0).toUpperCase()+o.status.slice(1)}</span>
          <span class="badge ${o.paymentStatus === 'paid' ? 'badge-green' : 'badge-yellow'}">${o.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}</span>
        </div>
        <div class="order-row-total">${money(o.total)}</div>
      </div>`
    ).join('');
  } catch {}
}

loadStats();
loadRecentOrders();
