async function api(path) {
  const res = await fetch('/api' + path);
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

async function loadStats() {
  try {
    const s = await api('/admin/stats');
    document.getElementById('statsGrid').innerHTML = `
      <div class="card stat-card">
        <div class="stat-icon">📦</div>
        <div>
          <div class="stat-meta">Today</div>
          <div class="stat-num">${s.totalOrdersToday}</div>
          <div class="stat-label">Orders Today</div>
        </div>
      </div>
      <div class="card stat-card">
        <div class="stat-icon">💰</div>
        <div>
          <div class="stat-meta">Today</div>
          <div class="stat-num">${money(s.totalRevenueToday)}</div>
          <div class="stat-label">Paid Revenue Today</div>
        </div>
      </div>
      <div class="card stat-card">
        <div class="stat-icon">📋</div>
        <div>
          <div class="stat-meta ${s.activeOrders > 0 ? 'active-badge' : ''}">${s.activeOrders > 0 ? s.activeOrders + ' active' : '0 active'}</div>
          <div class="stat-num">${s.activeOrders}</div>
          <div class="stat-label">Active Orders</div>
        </div>
      </div>
      <div class="card stat-card">
        <div class="stat-icon">🪑</div>
        <div>
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
