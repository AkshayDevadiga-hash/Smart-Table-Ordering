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

async function apiPost(path, body) {
  const res = await fetch(apiUrl(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error();
  return res.json();
}

async function apiPatch(path, body) {
  const res = await fetch(apiUrl(path), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error();
  return res.json();
}

function showToast(msg, error) {
  const el = document.createElement('div');
  el.className = 'toast' + (error ? ' error' : '');
  el.textContent = msg;
  document.getElementById('toastContainer').appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

async function acknowledgeWaiterRequest(id) {
  try {
    await apiPatch('/waiter-requests/' + id, { status: 'acknowledged' });
    loadWaiterRequests();
    showToast('Request acknowledged.');
  } catch { showToast('Could not update request.', true); }
}

async function resolveWaiterRequest(id) {
  try {
    await apiPatch('/waiter-requests/' + id, { status: 'resolved' });
    loadWaiterRequests();
    showToast('Request resolved.');
  } catch { showToast('Could not update request.', true); }
}

async function confirmCashPayment(requestId, orderId) {
  try {
    await apiPost('/waiter-requests/' + requestId + '/confirm-cash', {});
    loadCashPayments();
    showToast('Cash payment confirmed for Order #' + orderId + '.');
  } catch { showToast('Could not confirm payment.', true); }
}

async function loadWaiterRequests() {
  try {
    const requests = await api('/waiter-requests?type=assistance');
    const active = requests.filter(r => r.status === 'pending' || r.status === 'acknowledged');
    const el = document.getElementById('waiterRequestsList');
    if (!active.length) {
      el.innerHTML = '<div class="no-data">No pending requests</div>';
      return;
    }
    el.innerHTML = active.map(r => `
      <div class="waiter-row">
        <div class="waiter-row-info">
          <div class="waiter-row-num">Table ${r.tableNumber}</div>
          <div class="waiter-row-sub">${timeAgo(r.requestedAt)} · ${r.status === 'acknowledged' ? '✓ Acknowledged' : 'Awaiting response'}</div>
          ${r.note ? `<div class="waiter-row-sub" style="margin-top:0.25rem">📝 ${r.note}</div>` : ''}
        </div>
        <div class="waiter-row-actions">
          ${r.status === 'pending'
            ? `<button class="btn btn-outline btn-sm" onclick="acknowledgeWaiterRequest(${r.id})">Acknowledge</button>`
            : ''}
          <button class="btn btn-primary btn-sm" onclick="resolveWaiterRequest(${r.id})">Resolve</button>
        </div>
      </div>
    `).join('');
  } catch {}
}

async function loadCashPayments() {
  try {
    const requests = await api('/waiter-requests?type=cash_collection');
    const active = requests.filter(r => r.status === 'pending' || r.status === 'acknowledged');
    const el = document.getElementById('cashPaymentsList');
    if (!active.length) {
      el.innerHTML = '<div class="no-data">No pending cash payments</div>';
      return;
    }
    el.innerHTML = active.map(r => `
      <div class="waiter-row">
        <div class="waiter-row-info">
          <div class="waiter-row-num">Table ${r.tableNumber} · Order #${r.orderId || '—'}</div>
          <div class="waiter-row-sub">${timeAgo(r.requestedAt)} ${r.orderTotal ? '· ' + money(r.orderTotal) : ''}</div>
        </div>
        <div class="waiter-row-actions">
          <button class="btn btn-primary btn-sm" onclick="confirmCashPayment(${r.id}, ${r.orderId})">Confirm Received</button>
        </div>
      </div>
    `).join('');
  } catch {}
}

loadStats();
loadRecentOrders();
loadWaiterRequests();
loadCashPayments();
setInterval(() => { loadWaiterRequests(); loadCashPayments(); }, 10000);
