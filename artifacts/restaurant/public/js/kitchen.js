let orders = [];

function showToast(msg, error) {
  const el = document.createElement('div');
  el.className = 'toast' + (error ? ' error' : '');
  el.textContent = msg;
  document.getElementById('toastContainer').appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

async function api(path, opts) {
  const res = await fetch('/api' + path, { headers: { 'Content-Type': 'application/json' }, ...opts });
  if (!res.ok) throw new Error(await res.text());
  if (res.status === 204) return null;
  return res.json();
}

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return diff + 's ago';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  return Math.floor(diff / 3600) + 'h ago';
}

const COLUMNS = [
  { key: 'pending', label: 'Pending', next: [{ to:'received', label:'Accept' }, { to:'cancelled', label:'Cancel', style:'color:var(--destructive);background:var(--destructive-light)' }] },
  { key: 'received', label: 'Received', next: [{ to:'preparing', label:'Start Preparing', style:'background:var(--primary);color:#fff' }] },
  { key: 'preparing', label: 'Preparing', next: [{ to:'ready', label:'Mark Ready', style:'background:var(--secondary);color:#fff' }] },
  { key: 'ready', label: 'Ready ✓', next: [{ to:'delivered', label:'Mark Delivered', style:'background:#6b7280;color:#fff' }] },
];

async function updateStatus(orderId, status) {
  try {
    await api('/orders/' + orderId, { method: 'PATCH', body: JSON.stringify({ status }) });
    await loadOrders();
    showToast('Status updated to ' + status);
  } catch {
    showToast('Failed to update status', true);
  }
}

function renderTicket(order) {
  const actionBtns = (() => {
    const col = COLUMNS.find(c => c.key === order.status);
    if (!col) return '';
    return col.next.map(n =>
      `<button class="status-btn" style="${n.style || 'background:var(--primary-light);color:var(--primary)'}" onclick="updateStatus(${order.id},'${n.to}')">${n.label}</button>`
    ).join('');
  })();

  const itemLines = (order.items || []).map(i =>
    `<div class="ticket-item-line"><span class="ticket-qty">${i.quantity}×</span><span>${i.menuItemName}</span></div>`
  ).join('');

  return `
    <div class="order-ticket">
      <div class="ticket-header">
        <div>
          <div class="ticket-table">Table ${order.tableNumber}</div>
          <div class="ticket-time">Order #${order.id} · ${timeAgo(order.createdAt)}</div>
        </div>
      </div>
      <div class="ticket-items">${itemLines}</div>
      ${order.specialInstructions ? `<div class="ticket-note">📝 ${order.specialInstructions}</div>` : ''}
      <div class="ticket-actions">${actionBtns}</div>
    </div>
  `;
}

function renderBoard() {
  const root = document.getElementById('boardRoot');
  root.innerHTML = '<div class="columns">' + COLUMNS.map(col => {
    const colOrders = orders.filter(o => o.status === col.key);
    return `
      <div class="col-${col.key}">
        <div class="col-header">
          <span>${col.label}</span>
          <span class="col-count">${colOrders.length}</span>
        </div>
        <div class="col-body">
          ${colOrders.length === 0
            ? '<div class="empty-col">No orders</div>'
            : colOrders.map(renderTicket).join('')
          }
        </div>
      </div>
    `;
  }).join('') + '</div>';
}

async function loadOrders() {
  try {
    orders = await api('/kitchen/active-orders');
    renderBoard();
  } catch {
    if (!orders.length) {
      document.getElementById('boardRoot').innerHTML = '<div style="text-align:center;padding:3rem;color:var(--text-muted)">Failed to load orders.</div>';
    }
  }
}

loadOrders();
setInterval(loadOrders, 5000);
