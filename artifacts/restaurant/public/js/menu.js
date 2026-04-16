const tableId = parseInt(window.location.pathname.split('/menu/')[1]) || 1;
let categories = [];
let menuItems = [];
let cart = {}; // itemId -> { item, qty }
let activeCategory = null;
let currentOrder = null;
const CART_KEY = 'tableorder-cart-' + tableId;
const GST_RATE = 0.18;

function money(value) {
  const amount = Number(value);
  return '₹' + (Number.isFinite(amount) ? amount : 0).toFixed(2);
}

function itemPrice(item) {
  const price = Number(item?.price);
  return Number.isFinite(price) && price >= 0 ? price : 0;
}

function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function loadCart() {
  try {
    const saved = JSON.parse(localStorage.getItem(CART_KEY) || '{}');
    if (saved && typeof saved === 'object') cart = saved;
  } catch {
    cart = {};
  }
}

function showToast(msg, error) {
  const el = document.createElement('div');
  el.className = 'toast' + (error ? ' error' : '');
  el.textContent = msg;
  document.getElementById('toastContainer').appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

async function api(path, opts) {
  const res = await fetch('/api' + path, { headers: { 'Content-Type': 'application/json' }, ...opts });
  if (!res.ok) throw new Error(await res.text());
  if (res.status === 204) return null;
  return res.json();
}

async function load() {
  loadCart();
  try {
    const table = await api('/tables/' + tableId);
    document.getElementById('tableLabel').textContent = 'Table ' + table.tableNumber;
    document.title = 'Menu — Table ' + table.tableNumber;
  } catch {}
  try {
    currentOrder = await api('/orders/current?tableId=' + tableId);
  } catch {
    currentOrder = null;
  }
  renderCurrentBill();
  try {
    [categories, menuItems] = await Promise.all([api('/menu/categories'), api('/menu/items')]);
    renderTabs();
    renderMenu();
  } catch (e) {
    document.getElementById('skeletons').innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:3rem">Failed to load menu. Please try again.</p>';
  }
}

function renderCurrentBill() {
  const el = document.getElementById('currentBill');
  if (!el || !currentOrder) {
    if (el) el.innerHTML = '';
    return;
  }
  el.innerHTML = `
    <div class="card current-bill-card">
      <div>
        <div class="current-bill-title">Unpaid bill in progress</div>
        <div class="current-bill-sub">Order #${currentOrder.id} · ${money(currentOrder.total)} · ${(currentOrder.items || []).length} item(s)</div>
      </div>
      <a class="btn btn-primary btn-sm" href="/order/${currentOrder.id}">View and Pay</a>
    </div>
  `;
}

function renderTabs() {
  const tabs = document.getElementById('categoryTabs');
  tabs.innerHTML = '';
  const all = document.createElement('button');
  all.className = 'tab-btn active';
  all.textContent = 'All';
  all.onclick = () => { activeCategory = null; setActiveTab(all); renderMenu(); };
  tabs.appendChild(all);
  categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'tab-btn';
    btn.textContent = cat.name;
    btn.onclick = () => { activeCategory = cat.id; setActiveTab(btn); renderMenu(); };
    tabs.appendChild(btn);
  });
}

function setActiveTab(el) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
}

function renderMenu() {
  const container = document.getElementById('menuContent');
  const filtered = activeCategory ? categories.filter(c => c.id === activeCategory) : categories;
  container.innerHTML = '';
  filtered.forEach(cat => {
    const items = menuItems.filter(i => i.categoryId === cat.id);
    if (!items.length) return;
    const sec = document.createElement('div');
    sec.className = 'category-section';
    sec.id = 'cat-' + cat.id;
    sec.innerHTML = `<h2 class="category-title">${cat.name}</h2><p class="category-desc">${cat.description || ''}</p>`;
    items.forEach(item => {
      const qty = cart[item.id]?.qty || 0;
      const div = document.createElement('div');
      div.className = 'menu-item' + (!item.isAvailable ? ' unavailable' : '');
      div.innerHTML = `
        <div class="menu-item-info">
          <div class="menu-item-name-row">
            <span class="${item.isVeg ? 'veg-dot' : 'nonveg-dot'}"></span>
            <span class="menu-item-name">${item.name}</span>
          </div>
          ${item.description ? `<div class="menu-item-desc">${item.description}</div>` : ''}
          <div style="display:flex;align-items:center;gap:0.5rem">
            <span class="menu-item-price">${money(itemPrice(item))}</span>
            ${item.isVeg ? '<span class="menu-item-veg">🌿 Veg</span>' : ''}
          </div>
        </div>
        ${item.isAvailable
          ? qty === 0
            ? `<button class="add-btn" onclick="addToCart(${item.id})">+</button>`
            : `<div class="qty-controls">
                <button class="qty-btn" onclick="changeQty(${item.id}, -1)">−</button>
                <span class="qty-value">${qty}</span>
                <button class="qty-btn" onclick="changeQty(${item.id}, 1)">+</button>
              </div>`
          : '<span style="font-size:0.75rem;color:var(--text-muted)">Unavailable</span>'}
      `;
      sec.appendChild(div);
    });
    container.appendChild(sec);
  });
}

function addToCart(itemId) {
  const item = menuItems.find(i => i.id === itemId);
  if (!item) return;
  cart[itemId] = { item, qty: 1 };
  saveCart();
  updateCartUI();
  renderMenu();
}

function changeQty(itemId, delta) {
  if (!cart[itemId]) return;
  cart[itemId].qty += delta;
  if (cart[itemId].qty <= 0) delete cart[itemId];
  saveCart();
  updateCartUI();
  renderMenu();
}

function updateCartUI() {
  const total = Object.values(cart).reduce((s, c) => s + c.qty, 0);
  const cartCount = document.getElementById('cartCount');
  const cartToggle = document.getElementById('cartToggle');
  cartCount.textContent = total;
  cartToggle.style.display = total > 0 ? 'flex' : 'none';
}

function openCart() {
  renderCartDrawer();
  document.getElementById('cartDrawer').classList.remove('hidden');
  document.getElementById('cartBackdrop').classList.remove('hidden');
}

function closeCart() {
  document.getElementById('cartDrawer').classList.add('hidden');
  document.getElementById('cartBackdrop').classList.add('hidden');
}

document.getElementById('cartToggle').addEventListener('click', openCart);

function renderCartDrawer() {
  const items = Object.values(cart);
  const itemsEl = document.getElementById('cartItems');
  const summaryEl = document.getElementById('cartSummary');
  itemsEl.innerHTML = '';
  let subtotal = 0;
  items.forEach(({ item, qty }) => {
    const lineTotal = itemPrice(item) * Number(qty || 0);
    subtotal += lineTotal;
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <div class="qty-controls" style="gap:0.375rem">
        <button class="qty-btn" onclick="changeQty(${item.id}, -1);renderCartDrawer()" style="width:26px;height:26px">−</button>
        <span class="qty-value">${qty}</span>
        <button class="qty-btn" onclick="changeQty(${item.id}, 1);renderCartDrawer()" style="width:26px;height:26px">+</button>
      </div>
      <span class="cart-item-name">${item.name}</span>
      <span class="cart-item-price">${money(lineTotal)}</span>
      <button class="cart-remove" onclick="changeQty(${item.id}, -99);updateCartUI();renderCartDrawer()">✕</button>
    `;
    itemsEl.appendChild(div);
  });
  const tax = subtotal * GST_RATE;
  const total = subtotal + tax;
  summaryEl.innerHTML = `
    <div class="cart-row"><span>Subtotal</span><span>${money(subtotal)}</span></div>
    <div class="cart-row"><span>GST (18%)</span><span>${money(tax)}</span></div>
    <div class="cart-total"><span>Total</span><span>${money(total)}</span></div>
  `;
  updateCartUI();
}

async function placeOrder() {
  const items = Object.values(cart);
  if (!items.length) return;
  const btn = document.getElementById('placeOrderBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner" style="border-color:rgba(255,255,255,0.4);border-top-color:#fff"></span> Placing…';
  try {
    const order = await api('/orders', {
      method: 'POST',
      body: JSON.stringify({
        tableId,
        specialInstructions: document.getElementById('specialInstructions').value || null,
        items: items.map(({ item, qty }) => ({ menuItemId: item.id, quantity: Number(qty || 0) })),
      }),
    });
    cart = {};
    localStorage.removeItem(CART_KEY);
    updateCartUI();
    closeCart();
    showToast('Order placed! Redirecting…');
    setTimeout(() => { window.location.href = '/order/' + order.id; }, 1000);
  } catch {
    showToast('Failed to place order. Try again.', true);
    btn.disabled = false;
    btn.textContent = 'Place Order';
  }
}

load();
