let currentPeriod = 'daily';

async function api(path) {
  const res = await fetch('/api' + path);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

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

function setPeriod(period, btn) {
  currentPeriod = period;
  document.querySelectorAll('.report-tabs .tab-btn').forEach(el => el.classList.remove('active'));
  btn.classList.add('active');
  loadReport();
}

function renderReport(report) {
  document.getElementById('reportSummary').innerHTML = `
    <div class="card summary-card">
      <div class="summary-label">Paid Revenue</div>
      <div class="summary-value">${money(report.totalRevenue)}</div>
    </div>
    <div class="card summary-card">
      <div class="summary-label">Paid Orders</div>
      <div class="summary-value">${report.totalOrders}</div>
    </div>
    <div class="card summary-card">
      <div class="summary-label">Average Order</div>
      <div class="summary-value">${money(report.averageOrderValue)}</div>
    </div>
  `;

  const rows = report.rows || [];
  if (!rows.length) {
    document.getElementById('reportRows').innerHTML = '<div class="no-data">No paid revenue found for this period.</div>';
    return;
  }

  const maxRevenue = Math.max(...rows.map(row => Number(row.revenue) || 0), 1);
  document.getElementById('reportRows').innerHTML = `
    <table class="report-table">
      <thead>
        <tr>
          <th>Period</th>
          <th>Orders</th>
          <th>Revenue</th>
          <th>Trend</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(row => {
          const revenue = Number(row.revenue) || 0;
          const width = Math.max(4, Math.round((revenue / maxRevenue) * 100));
          return `
            <tr>
              <td>${row.label}</td>
              <td>${row.orders}</td>
              <td><strong>${money(revenue)}</strong></td>
              <td class="bar-cell"><div class="bar-track"><div class="bar-fill" style="width:${width}%"></div></div></td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
}

async function loadReport() {
  try {
    const report = await api('/admin/reports?period=' + currentPeriod);
    renderReport(report);
  } catch {
    showToast('Failed to load report', true);
  }
}

loadReport();