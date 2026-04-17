let categories = [];
let menuItems = [];
let editingId = null;
let activeFilter = null;
let pendingImageUrl = null;

function money(value) {
  const amount = Number(value);
  return '₹' + (Number.isFinite(amount) ? amount : 0).toFixed(2);
}

function showToast(msg, error) {
  const el = document.createElement('div');
  el.className = 'toast' + (error ? ' error' : '');
  el.textContent = msg;
  document.getElementById('toastContainer').appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

async function api(path, opts) {
  const res = await fetch(apiUrl(path), { headers: { 'Content-Type': 'application/json' }, ...opts });
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
  if (!categories.length) {
    body.innerHTML = '<div class="empty-state"><h3>No Categories Yet</h3><p>Add menu categories first, then you can create items.</p></div>';
    return;
  }
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
          ${item.imageUrl
            ? `<img class="item-thumb" src="${assetUrl(item.imageUrl)}" alt="${item.name}" loading="lazy" />`
            : `<div class="item-thumb-placeholder">🍽️</div>`}
          <div class="item-row-info">
            <div class="item-row-name">
              <span class="${item.isVeg ? 'veg-dot' : 'nonveg-dot'}"></span>
              ${item.name}
              ${!item.isAvailable ? '<span class="unavail-tag">Unavailable</span>' : ''}
            </div>
            ${item.description ? `<div class="item-row-desc">${item.description}</div>` : ''}
          </div>
          <div class="item-price">${money(item.price)}</div>
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
  if (!categories.length) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = 'No categories available';
    sel.appendChild(opt);
    sel.disabled = true;
    return;
  }
  sel.disabled = false;
  categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat.id;
    opt.textContent = cat.name;
    if (cat.id === selectedId) opt.selected = true;
    sel.appendChild(opt);
  });
}

function resetImageFields() {
  pendingImageUrl = null;
  document.getElementById('fImageUrl').value = '';
  document.getElementById('fImageFile').value = '';
  document.getElementById('imgPreview').style.display = 'none';
  document.getElementById('imgPreview').src = '';
  document.getElementById('uploadStatus').textContent = '';
}

function setImagePreview(url) {
  const preview = document.getElementById('imgPreview');
  preview.src = assetUrl(url);
  preview.style.display = 'block';
}

async function handleImageSelect() {
  const file = document.getElementById('fImageFile').files[0];
  if (!file) return;
  const status = document.getElementById('uploadStatus');
  status.textContent = 'Uploading…';
  try {
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch(apiUrl('/menu/upload'), { method: 'POST', body: formData });
    if (!res.ok) throw new Error('Upload failed');
    const data = await res.json();
    pendingImageUrl = data.url;
    document.getElementById('fImageUrl').value = data.url;
    setImagePreview(data.url);
    status.textContent = '✓ Uploaded';
  } catch {
    status.textContent = '✗ Upload failed';
    showToast('Image upload failed', true);
  }
}

function openAdd() {
  if (!categories.length) {
    showToast('No categories found. Please refresh and try again.', true);
    load();
    return;
  }
  editingId = null;
  document.getElementById('modalTitle').textContent = 'Add Menu Item';
  document.getElementById('submitBtn').textContent = 'Add Item';
  document.getElementById('itemForm').reset();
  resetImageFields();
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
  resetImageFields();
  populateCategorySelect(item.categoryId);
  document.getElementById('fName').value = item.name;
  document.getElementById('fDesc').value = item.description || '';
  document.getElementById('fPrice').value = parseFloat(item.price).toFixed(2);
  document.getElementById('fSort').value = item.sortOrder;
  document.getElementById('fVeg').checked = item.isVeg;
  document.getElementById('fAvailable').checked = item.isAvailable;
  if (item.imageUrl) {
    pendingImageUrl = item.imageUrl;
    document.getElementById('fImageUrl').value = item.imageUrl;
    setImagePreview(item.imageUrl);
    document.getElementById('uploadStatus').textContent = 'Current image';
  }
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
  if (!Number.isInteger(categoryId)) {
    showToast('Please select a category first.', true);
    btn.disabled = false;
    return;
  }
  const imageUrl = document.getElementById('fImageUrl').value.trim() || null;
  const data = {
    categoryId,
    name: document.getElementById('fName').value.trim(),
    description: document.getElementById('fDesc').value.trim() || null,
    price: parseFloat(document.getElementById('fPrice').value).toFixed(2),
    imageUrl,
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
        price: item.price, imageUrl: item.imageUrl || null, sortOrder: item.sortOrder, isVeg: item.isVeg, isAvailable: !item.isAvailable,
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
