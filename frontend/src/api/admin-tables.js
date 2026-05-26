let tables = [];

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
  if (res.status === 204) return null;
  return res.json();
}

async function load() {
  try {
    tables = await api('/tables');
    renderSummary();
    renderTables();
  } catch {
    document.getElementById('tablesGrid').innerHTML = '<p style="color:var(--text-muted)">Failed to load tables.</p>';
  }
}

function renderSummary() {
  const available = tables.filter(t => t.status === 'available').length;
  const occupied = tables.filter(t => t.status === 'occupied').length;
  document.getElementById('tableSummary').innerHTML = `
    <div class="card" style="padding:1rem 1.25rem;text-align:center">
      <div style="font-size:1.5rem;font-weight:700">${tables.length}</div>
      <div style="font-size:0.75rem;color:var(--text-muted)">Total Tables</div>
    </div>
    <div class="card" style="padding:1rem 1.25rem;text-align:center">
      <div style="font-size:1.5rem;font-weight:700;color:var(--secondary)">${available}</div>
      <div style="font-size:0.75rem;color:var(--text-muted)">Available</div>
    </div>
    <div class="card" style="padding:1rem 1.25rem;text-align:center">
      <div style="font-size:1.5rem;font-weight:700;color:var(--primary)">${occupied}</div>
      <div style="font-size:0.75rem;color:var(--text-muted)">Occupied</div>
    </div>
  `;
}

function statusBadge(status) {
  const map = { available: 'badge-green', occupied: 'badge-orange', reserved: 'badge-yellow' };
  return `<span class="badge ${map[status] || 'badge-gray'}">${status.charAt(0).toUpperCase()+status.slice(1)}</span>`;
}

function renderTables() {
  const grid = document.getElementById('tablesGrid');
  if (!tables.length) {
    grid.innerHTML = '<div class="empty-state"><h3>No Tables Yet</h3><p>Add your first table to generate QR codes.</p><button class="btn btn-primary" onclick="openAddTable()">Add First Table</button></div>';
    return;
  }
  grid.innerHTML = tables.map(t => {
    const menuUrl = encodeURIComponent(window.location.origin + '/menu/' + t.id);
    const qrSrc = apiUrl('/qr?url=' + menuUrl);
    return `
      <div class="table-card">
        <div class="table-card-top">
          <div>
            <div class="table-num">Table ${t.tableNumber}</div>
            <div class="table-seats">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px"><rect x="3" y="5" width="18" height="10" rx="1"/><path d="M5 19v-4"/><path d="M19 19v-4"/><path d="M8 19h8"/></svg>
              ${t.capacity} seats
            </div>
          </div>
          ${statusBadge(t.status)}
        </div>
        <div class="qr-wrap">
          <img src="${qrSrc}" alt="QR Code for Table ${t.tableNumber}" />
          <a class="qr-dl" href="${qrSrc}" download="table-${t.tableNumber}-qr.png">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Download PNG
          </a>
        </div>
        <button class="table-preview" onclick="window.open('/menu/${t.id}','_blank')">Preview Menu →</button>
      </div>
    `;
  }).join('');
}

function openAddTable() {
  document.getElementById('addModal').classList.remove('hidden');
  document.getElementById('tNumber').focus();
}

function closeModal() {
  document.getElementById('addModal').classList.add('hidden');
}

async function submitTable(e) {
  e.preventDefault();
  const btn = document.getElementById('addTableBtn');
  btn.disabled = true;
  try {
    await api('/tables', {
      method: 'POST',
      body: JSON.stringify({
        tableNumber: parseInt(document.getElementById('tNumber').value, 10),
        capacity: parseInt(document.getElementById('tCapacity').value, 10),
      }),
    });
    closeModal();
    showToast('Table added!');
    await load();
  } catch {
    showToast('Failed to add table', true);
  } finally {
    btn.disabled = false;
    e.target.reset();
    document.getElementById('tCapacity').value = '4';
  }
}

document.getElementById('addModal').addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});

load();
