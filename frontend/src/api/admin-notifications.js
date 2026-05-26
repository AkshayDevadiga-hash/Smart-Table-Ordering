let _waiterRequests = [];
let _cashRequests = [];
let _activePanel = null;

const BELL_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`;
const CASH_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>`;

function notifTimeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return diff + 's ago';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  return Math.floor(diff / 3600) + 'h ago';
}

function notifToast(msg, error) {
  const c = document.getElementById('toastContainer');
  if (!c) return;
  const el = document.createElement('div');
  el.className = 'toast' + (error ? ' error' : '');
  el.textContent = msg;
  c.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

function initNotifications() {
  document.body.insertAdjacentHTML('beforeend', `
    <div id="notifBackdrop" class="notif-backdrop hidden" onclick="closeNotifPanel()"></div>
    <div id="notifPanel" class="notif-panel hidden">
      <div class="notif-panel-header">
        <span id="notifPanelTitle"></span>
        <button class="btn-icon" onclick="closeNotifPanel()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="notif-panel-body" id="notifPanelBody"></div>
    </div>
  `);

  fetchAndUpdateNotifs();
  setInterval(fetchAndUpdateNotifs, 10000);
}

async function fetchAndUpdateNotifs() {
  try {
    const [waiter, cash] = await Promise.all([
      fetch(apiUrl('/waiter-requests?type=assistance')).then(r => r.json()),
      fetch(apiUrl('/waiter-requests?type=cash_collection')).then(r => r.json()),
    ]);
    _waiterRequests = (waiter || []).filter(r => r.status !== 'resolved');
    _cashRequests = (cash || []).filter(r => r.status !== 'resolved');
    updateNotifBadges();
    if (_activePanel) renderNotifPanel(_activePanel);
  } catch {}
}

function updateNotifBadges() {
  const waiterBadge = document.getElementById('notifBadgeWaiter');
  const cashBadge = document.getElementById('notifBadgeCash');
  const waiterBtn = document.getElementById('notifBtnWaiter');
  const cashBtn = document.getElementById('notifBtnCash');

  if (waiterBadge) {
    waiterBadge.textContent = _waiterRequests.length;
    waiterBadge.classList.toggle('hidden', _waiterRequests.length === 0);
    waiterBtn?.classList.toggle('has-notif', _waiterRequests.length > 0);
  }
  if (cashBadge) {
    cashBadge.textContent = _cashRequests.length;
    cashBadge.classList.toggle('hidden', _cashRequests.length === 0);
    cashBtn?.classList.toggle('has-notif', _cashRequests.length > 0);
  }
}

function toggleNotifPanel(type) {
  if (_activePanel === type) {
    closeNotifPanel();
    return;
  }
  _activePanel = type;
  renderNotifPanel(type);
  document.getElementById('notifPanel').classList.remove('hidden');
  document.getElementById('notifBackdrop').classList.remove('hidden');
  document.getElementById('notifBtnWaiter')?.classList.toggle('active', type === 'waiter');
  document.getElementById('notifBtnCash')?.classList.toggle('active', type === 'cash');
}

function closeNotifPanel() {
  _activePanel = null;
  document.getElementById('notifPanel')?.classList.add('hidden');
  document.getElementById('notifBackdrop')?.classList.add('hidden');
  document.getElementById('notifBtnWaiter')?.classList.remove('active');
  document.getElementById('notifBtnCash')?.classList.remove('active');
}

function renderNotifPanel(type) {
  const title = document.getElementById('notifPanelTitle');
  const body = document.getElementById('notifPanelBody');

  if (type === 'waiter') {
    title.textContent = 'Waiter Calls';
    const list = _waiterRequests;
    if (!list.length) {
      body.innerHTML = '<div class="notif-empty">No pending waiter calls</div>';
      return;
    }
    body.innerHTML = list.map(r => `
      <div class="notif-item">
        <div class="notif-item-icon" style="background:var(--primary-light);color:var(--primary)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        </div>
        <div class="notif-item-info">
          <div class="notif-item-title">Table ${r.tableNumber}</div>
          <div class="notif-item-sub">${notifTimeAgo(r.requestedAt)} · ${r.status === 'acknowledged' ? '✓ Acknowledged' : 'Awaiting response'}</div>
        </div>
        <div class="notif-item-actions">
          ${r.status === 'pending' ? `<button class="btn btn-outline btn-sm" onclick="notifAck(${r.id})">Ack</button>` : ''}
          <button class="btn btn-primary btn-sm" onclick="notifResolve(${r.id})">Done</button>
        </div>
      </div>
    `).join('');
  } else {
    title.textContent = 'Cash Payments';
    const list = _cashRequests;
    if (!list.length) {
      body.innerHTML = '<div class="notif-empty">No pending cash payments</div>';
      return;
    }
    body.innerHTML = list.map(r => `
      <div class="notif-item">
        <div class="notif-item-icon" style="background:#f0fdf4;color:#16a34a">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>
        </div>
        <div class="notif-item-info">
          <div class="notif-item-title">Table ${r.tableNumber} · Order #${r.orderId}</div>
          <div class="notif-item-sub">${notifTimeAgo(r.requestedAt)}${r.orderTotal ? ' · ₹' + parseFloat(r.orderTotal).toFixed(2) : ''}</div>
        </div>
        <div class="notif-item-actions">
          <button class="btn btn-primary btn-sm" onclick="notifConfirmCash(${r.id}, ${r.orderId})">Confirm</button>
        </div>
      </div>
    `).join('');
  }
}

async function notifAck(id) {
  try {
    await fetch(apiUrl('/waiter-requests/' + id), {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'acknowledged' }),
    });
    await fetchAndUpdateNotifs();
    notifToast('Request acknowledged.');
  } catch { notifToast('Could not update request.', true); }
}

async function notifResolve(id) {
  try {
    await fetch(apiUrl('/waiter-requests/' + id), {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'resolved' }),
    });
    await fetchAndUpdateNotifs();
    notifToast('Request resolved.');
  } catch { notifToast('Could not update request.', true); }
}

async function notifConfirmCash(requestId, orderId) {
  try {
    await fetch(apiUrl('/waiter-requests/' + requestId + '/confirm-cash'), {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    await fetchAndUpdateNotifs();
    notifToast('Cash payment confirmed for Order #' + orderId + '.');
  } catch { notifToast('Could not confirm payment.', true); }
}

document.addEventListener('DOMContentLoaded', initNotifications);
