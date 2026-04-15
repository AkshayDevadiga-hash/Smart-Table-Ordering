let categories = [];
let menuItems = [];
let editingId = null;
let activeFilter = null;

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

async function load() {
  try {
    [categories, menuItems] = await Promise.all([api('/menu/categories'), api('/menu/items')]);
    renderFilter();
    renderMenu();
  } catch {
    document.getElementById('menuBody').innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:2rem">Failed to load menu.</p>';
  }
}

function renderFilter() {
  const el = document.getElementById('catFilter');
  el.innerHTML = '';
  const all = document.createElement('button');
  all.className = 'tab-btn active';
  all.textContent = 'All';
  all.onclick = () => { activeFilter = null; setFilterActive(all); renderMenu(); };
  el.appendChild(all);
  categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'tab-btn';
    btn.textContent = cat.name;
    btn.onclick = () => { activeFilter = cat.id; setFilterActive(btn); renderMenu(); };
    el.appendChild(btn);
  });
}

function setFilterActive(el) {
  document.querySelectorAll('#catFilter .tab-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
}

function renderMenu() {
  const body = document.getElementById('menuBody');
  const filteredCats = activeFilter ? categories.filter(c => c.id === activeFilter) : categories;
  body.innerHTML = '';
  filteredCats.forEach(cat => {
    const items = menuItems.filter(i => i.categoryId === cat.id);
    const sec = document.createElement('div');
    sec.className = 'cat-section';
    sec.innerHTML = `<h2 class="cat-heading">${cat.name}</h2><div class="cat-count">${items.length} item${items.length !== 1 ? 's' : ''}</div>`;
    if (!items.length) {
      const empty = document.createElement('div');
      empty.style.cssText = 'border:1px dashed var(--border);border-radius:12px;padding:1.5rem;text-align:center;color:var(--text-muted);font-size:0.875rem';
      empty.textContent = 'No items in this category';
      sec.appendChild(empty);
    } else {
      items.forEach(item => {
        const row = document.createElement('div');
        row.className = 'item-row' + (!item.isAvailable ? ' unavailable' : '');
        row.innerHTML = `
          <div class="item-row-info">
            <div class="item-row-name">
              <span class="${item.isVeg ? 'veg-dot' : 'nonveg-dot'}"></span>
              ${item.name}
              ${!item.isAvailable ? '<span class="unavail-tag">Unavailable</span>' : ''}
            </div>
            ${item.description ? `<div class="item-row-desc">${item.description}</div>` : ''}
          </div>
          <div class="item-price">$${parseFloat(item.price).toFixed(2)}</div>
          <div class="item-actions">
            <button class="icon-btn" title="${item.isAvailable ? 'Mark unavailable' : 'Mark available'}" onclick="toggleAvail(${item.id})">${item.isAvailable ? '👁️' : '🙈'}</button>
            <button class="icon-btn" title="Edit" onclick="openEdit(${item.id})">✏️</button>
            <button class="icon-btn danger" title="Delete" onclick="deleteItem(${item.id}, '${item.name.replace(/'/g, "\\'")}')">🗑️</button>
          </div>
        `;
        sec.appendChild(row);
      });
    }
    body.appendChild(sec);
  });
}

function populateCategorySelect(selectedId) {
  const sel = document.getElementById('fCategory');
  sel.innerHTML = '';
  categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat.id;
    opt.textContent = cat.name;
    if (cat.id === selectedId) opt.selected = true;
    sel.appendChild(opt);
  });
}

function openAdd() {
  editingId = null;
  document.getElementById('modalTitle').textContent = 'Add Menu Item';
  document.getElementById('submitBtn').textContent = 'Add Item';
  document.getElementById('itemForm').reset();
  // Set defaults
  populateCategorySelect(categories[0]?.id ?? null);
  document.getElementById('fAvailable').checked = true;
  document.getElementById('fSort').value = menuItems.length + 1;
  document.getElementById('formModal').classList.remove('hidden');
}

function openEdit(itemId) {
  const item = menuItems.find(i => i.id === itemId);
  if (!item) return;
  editingId = itemId;
  document.getElementById('modalTitle').textContent = 'Edit Item';
  document.getElementById('submitBtn').textContent = 'Save Changes';
  populateCategorySelect(item.categoryId);
  document.getElementById('fName').value = item.name;
  document.getElementById('fDesc').value = item.description || '';
  document.getElementById('fPrice').value = parseFloat(item.price).toFixed(2);
  document.getElementById('fSort').value = item.sortOrder;
  document.getElementById('fVeg').checked = item.isVeg;
  document.getElementById('fAvailable').checked = item.isAvailable;
  document.getElementById('formModal').classList.remove('hidden');
}

function closeForm() {
  document.getElementById('formModal').classList.add('hidden');
}

async function submitForm(e) {
  e.preventDefault();
  const btn = document.getElementById('submitBtn');
  btn.disabled = true;
  const categoryId = parseInt(document.getElementById('fCategory').value, 10);
  const data = {
    categoryId,
    name: document.getElementById('fName').value.trim(),
    description: document.getElementById('fDesc').value.trim() || null,
    price: parseFloat(document.getElementById('fPrice').value).toFixed(2),
    sortOrder: parseInt(document.getElementById('fSort').value, 10) || 0,
    isVeg: document.getElementById('fVeg').checked,
    isAvailable: document.getElementById('fAvailable').checked,
  };
  try {
    if (editingId) {
      await api('/menu/items/' + editingId, { method: 'PUT', body: JSON.stringify(data) });
      showToast('Item updated');
    } else {
      await api('/menu/items', { method: 'POST', body: JSON.stringify(data) });
      showToast('Item added');
    }
    closeForm();
    await load();
  } catch {
    showToast('Failed to save item', true);
  } finally {
    btn.disabled = false;
  }
}

async function toggleAvail(itemId) {
  const item = menuItems.find(i => i.id === itemId);
  if (!item) return;
  try {
    await api('/menu/items/' + itemId, {
      method: 'PUT',
      body: JSON.stringify({
        categoryId: item.categoryId, name: item.name, description: item.description || null,
        price: item.price, sortOrder: item.sortOrder, isVeg: item.isVeg, isAvailable: !item.isAvailable,
      }),
    });
    await load();
  } catch { showToast('Failed to update', true); }
}

async function deleteItem(itemId, name) {
  if (!confirm(`Delete "${name}"?`)) return;
  try {
    await api('/menu/items/' + itemId, { method: 'DELETE' });
    showToast('Item deleted');
    await load();
  } catch { showToast('Failed to delete', true); }
}

document.getElementById('formModal').addEventListener('click', function(e) {
  if (e.target === this) closeForm();
});

load();
