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
let selectedRating = 0;
let reviewDraft = '';
let paymentTableId = null;

function cashPendingKey() { return 'cash-pending-' + orderId; }
function hasCashPending() { return !!localStorage.getItem(cashPendingKey()); }
function setCashPending() { localStorage.setItem(cashPendingKey(), '1'); }
function clearCashPending() { localStorage.removeItem(cashPendingKey()); }

function money(value) {
  const amount = Number(value);
  return '₹' + (Number.isFinite(amount) ? amount : 0).toFixed(2);
}

function safeNumber(value) {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
}

function showToast(msg, error) {
  const el = document.createElement('div');
  el.className = 'toast' + (error ? ' error' : '');
  el.textContent = msg;
  document.getElementById('toastContainer').appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

async function api(path, opts) {
  const res = await fetch(apiUrl(path), { headers: { 'Content-Type': 'application/json' }, ...opts });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return diff + 's ago';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  return Math.floor(diff / 3600) + 'h ago';
}

function reviewKey() { return 'review-submitted-' + orderId; }
function hasReviewSubmitted() { return !!localStorage.getItem(reviewKey()); }
function markReviewSubmitted() { localStorage.setItem(reviewKey(), '1'); }

function renderReviewForm() {
  if (hasReviewSubmitted()) {
    return `<div class="review-section">
      <div class="status-message badge-green" style="margin-bottom:0;background:var(--secondary-light)">
        ⭐ Thank you for your review!
      </div>
    </div>`;
  }
  const starsHtml = [1,2,3,4,5].map(n =>
    `<button class="star-btn${n <= selectedRating ? ' active' : ''}" data-val="${n}" onclick="setRating(${n})">${n <= selectedRating ? '⭐' : '☆'}</button>`
  ).join('');
  return `<div class="review-section">
    <h3 class="review-title">How was your experience?</h3>
    <div class="star-rating" id="starRating" data-rating="${selectedRating}">
      ${starsHtml}
    </div>
    <textarea id="reviewComment" class="form-textarea" placeholder="Leave a comment… (optional, max 500 chars)" rows="3" maxlength="500" oninput="reviewDraft=this.value">${reviewDraft ? reviewDraft.replace(/</g,'&lt;') : ''}</textarea>
    <button class="btn btn-primary" style="width:100%" id="submitReviewBtn" onclick="submitReview()">Submit Review</button>
  </div>`;
}

function setRating(val) {
  selectedRating = val;
  const container = document.getElementById('starRating');
  if (container) {
    container.dataset.rating = val;
    container.querySelectorAll('.star-btn').forEach((btn, i) => {
      btn.textContent = i < val ? '⭐' : '☆';
      btn.classList.toggle('active', i < val);
    });
  }
}

async function submitReview() {
  if (!selectedRating) { showToast('Please select a star rating.', true); return; }
  const comment = reviewDraft.trim() || null;
  if (comment && comment.length > 500) { showToast('Comment must be 500 characters or fewer.', true); return; }
  const btn = document.getElementById('submitReviewBtn');
  btn.disabled = true;
  btn.textContent = 'Submitting…';
  try {
    await api('/reviews', { method: 'POST', body: JSON.stringify({ orderId, rating: selectedRating, comment }) });
    markReviewSubmitted();
    selectedRating = 0;
    reviewDraft = '';
    showToast('Thank you for your review!');
    renderContent(order);
  } catch (e) {
    let msg = 'Failed to submit review. Please try again.';
    try { const parsed = JSON.parse(e.message); if (parsed.error) msg = parsed.error; } catch {}
    showToast(msg, true);
    btn.disabled = false;
    btn.textContent = 'Submit Review';
  }
}

function renderContent(o) {
  const stepIdx = STATUS_STEPS.indexOf(o.status);
  const meta = STATUS_MESSAGES[o.status] || STATUS_MESSAGES.pending;
  const tableLink = document.getElementById('tableLink');
  if (o.tableId) {
    tableLink.innerHTML = `<a href="/menu/${o.tableId}" class="btn btn-outline btn-sm">Back to Menu</a>`;
  }

  const stepsHtml = STATUS_STEPS.map((s, i) => {
    const done = i < stepIdx;
    const active = i === stepIdx && o.status !== 'cancelled';
    return `<div class="step-node ${done?'done':''} ${active?'active':''}">
      <div class="step-circle">${done ? '✓' : i+1}</div>
      <div class="step-label">${STATUS_LABELS[s]}</div>
    </div>`;
  }).join('');

  const itemsHtml = (o.items || []).map(item =>
    `<div class="order-line"><span>${item.quantity}× ${item.menuItemName}</span><span>${money(safeNumber(item.unitPrice) * safeNumber(item.quantity))}</span></div>`
  ).join('');

  const subtotal = safeNumber(o.subtotal);
  const tax = safeNumber(o.tax);
  const total = safeNumber(o.total);
  const paymentStatus = o.paymentStatus || 'pending';
  const canCancel = (o.status === 'pending' || o.status === 'received') && paymentStatus !== 'paid';
  const showReview = (o.status === 'delivered' || paymentStatus === 'paid') && o.status !== 'cancelled';

  let paymentSection = '';
  if (o.status === 'cancelled') {
    paymentSection = '';
  } else if (paymentStatus === 'paid') {
    clearCashPending();
    const methodLabel = o.paymentMethod === 'cash' ? ' (Cash)' : ' (Online)';
    paymentSection = `
      <div class="payment-success">
        <div class="payment-success-icon">✅</div>
        <div>
          <div class="payment-success-title">Payment Successful${methodLabel}</div>
          <div class="payment-success-sub">Total paid: ${money(total)}</div>
        </div>
      </div>`;
  } else if (hasCashPending()) {
    paymentSection = `
      <div class="payment-waiting">
        <div class="payment-waiting-icon">🛎️</div>
        <div>
          <div class="payment-waiting-title">Awaiting cash collection</div>
          <div class="payment-waiting-sub">A waiter will come to collect ${money(total)} from your table shortly.</div>
        </div>
      </div>`;
  } else {
    paymentSection = `
      <button class="btn btn-primary" style="width:100%;margin-top:1rem" onclick="openPaymentModal(${total}, ${o.tableId})">
        Pay ${money(total)}
      </button>`;
  }

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
        <div style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap;justify-content:flex-end">
          <span class="badge badge-${getStatusBadge(o.status)}">${o.status.charAt(0).toUpperCase()+o.status.slice(1)}</span>
          ${o.status !== 'cancelled' ? `<span class="badge ${paymentStatus === 'paid' ? 'badge-green' : 'badge-yellow'}">${paymentStatus === 'paid' ? 'Paid' : 'Payment Pending'}</span>` : ''}
        </div>
      </div>
      <div class="order-items-list">
        ${itemsHtml}
        <div class="order-subtotal">
          <div class="order-subtotal-line"><span>Subtotal</span><span>${money(subtotal)}</span></div>
          <div class="order-subtotal-line"><span>GST (18%)</span><span>${money(tax)}</span></div>
          <div class="order-total-line"><span>Total</span><span>${money(total)}</span></div>
        </div>
      </div>
      ${o.specialInstructions ? `<div style="margin-top:1rem;padding-top:1rem;border-top:1px solid var(--border);font-size:0.8rem;color:var(--text-muted)">📝 ${o.specialInstructions}</div>` : ''}
      ${paymentSection}
      ${canCancel ? `<button class="btn btn-outline" style="width:100%;margin-top:0.75rem;color:var(--destructive);border-color:var(--destructive)" onclick="confirmCancel()">Cancel Order</button>` : ''}
    </div>

    ${showReview ? renderReviewForm() : ''}

    ${(o.status !== 'delivered' && o.status !== 'cancelled') || hasCashPending()
      ? '<div class="refresh-hint">🔄 Auto-refreshing every 5 seconds…</div>'
      : ''}
  `;
}

function openPaymentModal(total, tableId) {
  paymentTableId = tableId;
  document.getElementById('payModalTotal').textContent = money(total);
  document.getElementById('paymentModal').classList.remove('hidden');
  switchPayTab('upi');
}

function closePaymentModal() {
  document.getElementById('paymentModal').classList.add('hidden');
  resetPaymentForm();
}

function switchPayTab(tab) {
  ['upi','card','cash'].forEach(t => {
    document.getElementById('payTab-' + t).classList.toggle('pay-tab-active', t === tab);
    document.getElementById('payContent-' + t).classList.toggle('hidden', t !== tab);
  });
}

function resetPaymentForm() {
  const upiId = document.getElementById('upiId');
  const cardNum = document.getElementById('cardNumber');
  const cardExp = document.getElementById('cardExpiry');
  const cardCvv = document.getElementById('cardCvv');
  const cardName = document.getElementById('cardName');
  if (upiId) upiId.value = '';
  if (cardNum) cardNum.value = '';
  if (cardExp) cardExp.value = '';
  if (cardCvv) cardCvv.value = '';
  if (cardName) cardName.value = '';
}

function formatCardNumber(input) {
  let val = input.value.replace(/\D/g, '').slice(0, 16);
  input.value = val.replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry(input) {
  let val = input.value.replace(/\D/g, '').slice(0, 4);
  if (val.length >= 3) val = val.slice(0, 2) + '/' + val.slice(2);
  input.value = val;
}

async function simulatePay(method) {
  if (method === 'cash') {
    closePaymentModal();
    await requestCashPayment(paymentTableId);
    return;
  }
  if (method === 'upi') {
    const upiVal = document.getElementById('upiId').value.trim();
    if (!upiVal || !upiVal.includes('@') || upiVal.length < 5) {
      showToast('Enter a valid UPI ID (e.g. name@upi)', true);
      return;
    }
  }
  if (method === 'card') {
    const num = document.getElementById('cardNumber').value.replace(/\s/g,'');
    const exp = document.getElementById('cardExpiry').value;
    const cvv = document.getElementById('cardCvv').value;
    const name = document.getElementById('cardName').value.trim();
    if (num.length < 16) { showToast('Enter a valid 16-digit card number', true); return; }
    if (!/^\d{2}\/\d{2}$/.test(exp)) { showToast('Enter expiry as MM/YY', true); return; }
    if (cvv.length < 3) { showToast('Enter a valid 3-digit CVV', true); return; }
    if (!name) { showToast('Enter cardholder name', true); return; }
  }

  closePaymentModal();
  document.getElementById('payProcessingModal').classList.remove('hidden');
  await new Promise(r => setTimeout(r, 2000));
  document.getElementById('payProcessingModal').classList.add('hidden');

  try {
    order = await api('/orders/' + orderId + '/payment', {
      method: 'PATCH',
      body: JSON.stringify({ paymentStatus: 'paid', paymentMethod: 'online' }),
    });
    renderContent(order);
    clearInterval(interval);
    showToast('Payment successful! Thank you.');
  } catch {
    showToast('Payment failed. Please try again.', true);
  }
}

async function requestCashPayment(tableId) {
  try {
    await api('/waiter-requests', {
      method: 'POST',
      body: JSON.stringify({ tableId, orderId, type: 'cash_collection' }),
    });
    setCashPending();
    renderContent(order);
    showToast('Waiter notified — they will collect payment shortly.');
  } catch {
    showToast('Could not send request. Please try again.', true);
  }
}

function confirmCancel() {
  document.getElementById('cancelModal').classList.remove('hidden');
}

function closeCancelModal() {
  document.getElementById('cancelModal').classList.add('hidden');
}

async function cancelOrder() {
  const btn = document.getElementById('confirmCancelBtn');
  btn.disabled = true;
  btn.textContent = 'Cancelling…';
  try {
    order = await api('/orders/' + orderId, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'cancelled' }),
    });
    closeCancelModal();
    clearInterval(interval);
    renderContent(order);
    showToast('Order cancelled successfully.');
  } catch (e) {
    let msg = 'Could not cancel order. Please try again.';
    try { const parsed = JSON.parse(e.message); if (parsed.error) msg = parsed.error; } catch {}
    showToast(msg, true);
    btn.disabled = false;
    btn.textContent = 'Yes, Cancel Order';
  }
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
    const paymentStatus = o.paymentStatus || 'pending';
    const isDone = (o.status === 'delivered' && paymentStatus === 'paid' && !hasCashPending())
      || o.status === 'cancelled';
    if (isDone) clearInterval(interval);
  } catch {
    document.getElementById('content').innerHTML = '<div class="empty-state"><h3>Order not found</h3><p>This order may not exist.</p><a href="/" class="btn btn-primary">Go Home</a></div>';
    clearInterval(interval);
  }
}

loadOrder();
interval = setInterval(loadOrder, 5000);
