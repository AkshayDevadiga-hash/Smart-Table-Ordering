const orderId = parseInt(window.location.pathname.split('/order/')[1]);
const STATUS_STEPS = ['pending','received','preparing','ready','delivered'];
const STATUS_LABELS = { pending:'Pending', received:'Received', preparing:'Preparing', ready:'Ready!', delivered:'Delivered' };
const STATUS_MESSAGES = {
  pending: { icon:'⏳', msg:'Your order has been received and is waiting to be confirmed.', class:'badge-yellow' },
  received: { icon:'✅', msg:'Great! The kitchen has received your order.', class:'badge-blue' },
  preparing: { icon:'👨‍🍳', msg:'Your food is being prepared right now!', class:'badge-orange' },
  ready: { icon:'🔔', msg:'Your order is ready! A server will bring it to you shortly.', class:'badge-green' },
  delivered: { icon:'🎉', msg:'Enjoy your meal! Thank you for dining with us.', class:'badge-gray' },
  cancelled: { icon:'❌', msg:'This order was cancelled.', class:'badge-red' },
};

let order = null;
let interval = null;

function showToast(msg, error) {
  const el = document.createElement('div');
  el.className = 'toast' + (error ? ' error' : '');
  el.textContent = msg;
  document.getElementById('toastContainer').appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

async function api(path) {
  const res = await fetch('/api' + path);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return diff + 's ago';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  return Math.floor(diff / 3600) + 'h ago';
}

function renderContent(o) {
  const stepIdx = STATUS_STEPS.indexOf(o.status);
  const meta = STATUS_MESSAGES[o.status] || STATUS_MESSAGES.pending;
  const tableLink = document.getElementById('tableLink');
  if (o.tableId) {
    tableLink.innerHTML = `<a href="/menu/${o.tableId}" class="btn btn-outline btn-sm">Back to Menu</a>`;
  }

  let stepsHtml = STATUS_STEPS.map((s, i) => {
    const done = i < stepIdx;
    const active = i === stepIdx && o.status !== 'cancelled';
    return `<div class="step-node ${done?'done':''} ${active?'active':''}">
      <div class="step-circle">${done ? '✓' : i+1}</div>
      <div class="step-label">${STATUS_LABELS[s]}</div>
    </div>`;
  }).join('');

  let itemsHtml = (o.items || []).map(item =>
    `<div class="order-line"><span>${item.quantity}× ${item.menuItemName}</span><span>$${(parseFloat(item.unitPrice)*item.quantity).toFixed(2)}</span></div>`
  ).join('');

  const subtotal = parseFloat(o.totalAmount) / 1.05;
  const tax = parseFloat(o.totalAmount) - subtotal;

  document.getElementById('content').innerHTML = `
    <div class="status-message ${meta.class}" style="background:var(--primary-light)">
      <span style="font-size:1.5rem">${meta.icon}</span>
      <span>${meta.msg}</span>
    </div>

    <div class="status-steps">${stepsHtml}</div>

    <div class="card order-card">
      <div class="order-meta">
        <div>
          <div class="order-num">Order #${o.id}</div>
          <div class="order-time">${timeAgo(o.createdAt)} · Table ${o.tableNumber || ''}</div>
        </div>
        <span class="badge badge-${getStatusBadge(o.status)}">${o.status.charAt(0).toUpperCase()+o.status.slice(1)}</span>
      </div>
      <div class="order-items-list">
        ${itemsHtml}
        <div class="order-subtotal">
          <div class="order-subtotal-line"><span>Subtotal</span><span>$${subtotal.toFixed(2)}</span></div>
          <div class="order-subtotal-line"><span>GST (5%)</span><span>$${tax.toFixed(2)}</span></div>
          <div class="order-total-line"><span>Total</span><span>$${parseFloat(o.totalAmount).toFixed(2)}</span></div>
        </div>
      </div>
      ${o.specialInstructions ? `<div style="margin-top:1rem;padding-top:1rem;border-top:1px solid var(--border);font-size:0.8rem;color:var(--text-muted)">📝 ${o.specialInstructions}</div>` : ''}
    </div>
    ${o.status !== 'delivered' && o.status !== 'cancelled'
      ? '<div class="refresh-hint">🔄 Auto-refreshing every 5 seconds…</div>'
      : ''}
  `;
}

function getStatusBadge(s) {
  const map = { pending:'yellow', received:'blue', preparing:'orange', ready:'green', delivered:'gray', cancelled:'red' };
  return map[s] || 'gray';
}

async function loadOrder() {
  try {
    const o = await api('/orders/' + orderId);
    order = o;
    renderContent(o);
    if (o.status === 'delivered' || o.status === 'cancelled') {
      clearInterval(interval);
    }
  } catch {
    document.getElementById('content').innerHTML = '<div class="empty-state"><h3>Order not found</h3><p>This order may not exist.</p><a href="/" class="btn btn-primary">Go Home</a></div>';
    clearInterval(interval);
  }
}

loadOrder();
interval = setInterval(loadOrder, 5000);
