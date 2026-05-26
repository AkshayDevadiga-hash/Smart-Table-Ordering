async function api(path, opts) {
  const token = getToken();
  const res = await fetch(apiUrl(path), {
    headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': 'Bearer ' + token } : {}) },
    ...opts,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function showToast(msg, error) {
  const el = document.createElement('div');
  el.className = 'toast' + (error ? ' error' : '');
  el.textContent = msg;
  document.getElementById('toastContainer').appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

function starSvg(filled) {
  return `<svg width="14" height="14" viewBox="0 0 24 24" fill="${filled ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="color:${filled ? '#f59e0b' : '#d1d5db'}"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
}
function stars(rating) {
  return Array.from({ length: 5 }, (_, i) => starSvg(i < rating)).join('');
}

function formatDate(str) {
  return new Date(str).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

async function loadTableOptions() {
  try {
    const tables = await api('/tables');
    const sel = document.getElementById('tableFilter');
    if (!sel) return;
    tables.sort((a, b) => a.tableNumber - b.tableNumber).forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = 'Table ' + t.tableNumber;
      sel.appendChild(opt);
    });
  } catch {}
}

async function loadReviews() {
  const rating = document.getElementById('ratingFilter').value;
  const tableId = document.getElementById('tableFilter').value;
  const from = document.getElementById('fromDate').value;
  const to = document.getElementById('toDate').value;

  const params = new URLSearchParams();
  if (rating) params.set('rating', rating);
  if (tableId) params.set('tableId', tableId);
  if (from) params.set('from', from);
  if (to) params.set('to', to);

  const listEl = document.getElementById('reviewsList');
  listEl.innerHTML = '<div class="card skeleton" style="height:100px;margin-bottom:0.875rem"></div><div class="card skeleton" style="height:100px"></div>';

  try {
    const reviews = await api('/reviews' + (params.toString() ? '?' + params : ''));

    const statsEl = document.getElementById('statsRow');
    if (reviews.length > 0) {
      const avg = (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1);
      statsEl.innerHTML = `
        <span class="stat-pill">${reviews.length} review${reviews.length !== 1 ? 's' : ''}</span>
        <span class="stat-pill" style="display:inline-flex;align-items:center;gap:0.25rem">${starSvg(true)} ${avg} avg rating</span>
      `;
    } else {
      statsEl.innerHTML = '';
    }

    if (!reviews.length) {
      listEl.innerHTML = '<div class="no-reviews"><div style="margin-bottom:0.75rem;display:flex;justify-content:center;gap:2px">' + Array.from({length:5},()=>starSvg(false)).join('') + '</div><p>No reviews found for the selected filters.</p></div>';
      return;
    }

    listEl.innerHTML = reviews.map(r => `
      <div class="review-card">
        <div class="review-header">
          <div>
            <div class="review-stars">${stars(r.rating)}</div>
            <div class="review-order">Order #${r.orderId}${r.tableNumber != null ? ' · Table ' + r.tableNumber : ''}</div>
          </div>
          <div class="review-date">${formatDate(r.createdAt)}</div>
        </div>
        ${r.comment ? `<div class="review-comment">${escHtml(r.comment)}</div>` : '<div class="review-comment" style="color:var(--text-muted);font-style:italic">No comment left.</div>'}
      </div>
    `).join('');
  } catch (e) {
    showToast('Failed to load reviews', true);
    listEl.innerHTML = '<div class="no-reviews"><p>Failed to load reviews. Please try again.</p></div>';
  }
}

function clearFilters() {
  document.getElementById('ratingFilter').value = '';
  document.getElementById('tableFilter').value = '';
  document.getElementById('fromDate').value = '';
  document.getElementById('toDate').value = '';
  loadReviews();
}

loadTableOptions();
loadReviews();
