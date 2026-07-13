const {
  escapeHtml,
  formatInr,
  filterAssets,
  resultButtonHtml,
  createInitialRows,
  sumInvested,
  countHoldings,
  ASSETS,
} = window.PEMock;

const rowsEl = document.getElementById('rows');
const addRowBtn = document.getElementById('addRow');
const totalValueEl = document.getElementById('totalValue');
const totalHintEl = document.getElementById('totalHint');
const costHeadEl = document.getElementById('costHead');
const searchLayer = document.getElementById('searchLayer');
const searchSheet = document.getElementById('searchSheet');
const searchInput = document.getElementById('searchInput');
const searchCancel = document.getElementById('searchCancel');
const searchBackdrop = document.getElementById('searchBackdrop');
const sheetResults = document.getElementById('sheetResults');
const appRoot = document.getElementById('appRoot');

let rows = createInitialRows();
let costMode = 'invested';
let activeRowId = null;
let closing = false;

function updateTotals() {
  totalValueEl.textContent = formatInr(sumInvested(rows));
  const n = countHoldings(rows);
  totalHintEl.textContent =
    n === 0
      ? 'Add holdings below — match this with Total invested in your broker app.'
      : `${n} holding${n === 1 ? '' : 's'} · check this against your broker app`;
}

function renderSheetResults(query) {
  const q = query.trim();
  if (q.length < 2) {
    sheetResults.innerHTML = `<p class="dropdown-empty">Type at least 2 characters…</p>`;
    return;
  }
  const matches = filterAssets(q);
  if (!matches.length) {
    sheetResults.innerHTML = `<p class="dropdown-empty">No matches found.</p>`;
    return;
  }
  sheetResults.innerHTML = matches.map((asset, i) => resultButtonHtml(asset, i)).join('');
}

function openSearch(rowId, triggerEl) {
  if (closing) return;
  activeRowId = rowId;
  const rect = triggerEl.getBoundingClientRect();
  const frame = appRoot.getBoundingClientRect();
  const top = rect.top - frame.top;
  const left = rect.left - frame.left;
  const width = rect.width;
  const height = Math.max(rect.height, 40);

  searchLayer.classList.add('open');
  searchLayer.setAttribute('aria-hidden', 'false');

  searchSheet.classList.add('morphing-from');
  searchSheet.style.borderRadius = '8px';
  searchSheet.style.clipPath = `inset(${top}px ${frame.width - left - width}px ${
    frame.height - top - height
  }px ${left}px round 8px)`;
  searchSheet.style.opacity = '1';

  searchInput.value = '';
  renderSheetResults('');

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      searchSheet.classList.remove('morphing-from');
      searchSheet.style.transition =
        'clip-path 420ms cubic-bezier(0.16, 1, 0.3, 1), border-radius 420ms cubic-bezier(0.16, 1, 0.3, 1)';
      searchSheet.style.clipPath = 'inset(0px 0px 0px 0px round 0px)';
      searchSheet.style.borderRadius = '0px';
      searchInput.focus({ preventScroll: true });
    });
  });
}

function closeSearch() {
  if ((!searchLayer.classList.contains('open') && !searchLayer.classList.contains('closing')) || closing) {
    return;
  }
  closing = true;
  searchInput.blur();

  const trigger = rowsEl.querySelector(`[data-id="${activeRowId}"] [data-role="open"]`);
  const frame = appRoot.getBoundingClientRect();

  searchLayer.classList.remove('open');
  searchLayer.classList.add('closing');

  if (trigger) {
    const rect = trigger.getBoundingClientRect();
    const top = rect.top - frame.top;
    const left = rect.left - frame.left;
    const width = rect.width;
    const height = Math.max(rect.height, 40);
    searchSheet.style.transition =
      'clip-path 300ms cubic-bezier(0.4, 0, 0.2, 1), border-radius 300ms ease';
    searchSheet.style.clipPath = `inset(${top}px ${frame.width - left - width}px ${
      frame.height - top - height
    }px ${left}px round 8px)`;
    searchSheet.style.borderRadius = '8px';
  } else {
    searchSheet.style.opacity = '0';
  }

  window.setTimeout(() => {
    searchLayer.classList.remove('closing');
    searchSheet.style.clipPath = '';
    searchSheet.style.borderRadius = '';
    searchSheet.style.transition = '';
    searchSheet.style.opacity = '';
    searchLayer.setAttribute('aria-hidden', 'true');
    activeRowId = null;
    closing = false;
    renderRows();
  }, 320);
}

function renderRows() {
  rowsEl.innerHTML = rows
    .map((row) => {
      const shown = row.name || row.ticker || 'Search stock, ETF, or fund';
      const empty = !row.ticker;
      const costValue = costMode === 'avg' ? row.avg ?? '' : row.invested;
      return `
        <div class="row" data-id="${row.id}">
          <button type="button" class="field" data-role="open" style="text-align:left;color:${
            empty ? 'var(--pe-text-muted)' : 'var(--pe-text)'
          }">
            ${escapeHtml(shown)}
          </button>
          <input
            class="field right"
            type="text"
            inputmode="decimal"
            data-role="cost"
            placeholder="${costMode === 'avg' ? 'Avg price' : 'Invested'}"
            value="${escapeHtml(costValue)}"
          />
          <input
            class="field right"
            type="text"
            inputmode="decimal"
            data-role="qty"
            placeholder="Qty"
            value="${escapeHtml(row.qty)}"
          />
          <button type="button" class="delete-btn" data-role="delete" aria-label="Delete">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
            </svg>
          </button>
        </div>
      `;
    })
    .join('');
  updateTotals();
}

rowsEl.addEventListener('click', (event) => {
  const open = event.target.closest('[data-role="open"]');
  if (open) {
    openSearch(open.closest('.row').dataset.id, open);
    return;
  }
  const del = event.target.closest('[data-role="delete"]');
  if (!del) return;
  const row = del.closest('.row');
  rows = rows.filter((entry) => entry.id !== row.dataset.id);
  if (!rows.length) {
    rows = [{ id: crypto.randomUUID(), ticker: '', name: '', invested: '', qty: '', avg: '' }];
  }
  renderRows();
});

rowsEl.addEventListener('input', (event) => {
  const input = event.target;
  const row = input.closest('.row');
  if (!row) return;
  const id = row.dataset.id;
  const role = input.dataset.role;
  if (role === 'cost') {
    rows = rows.map((entry) => {
      if (entry.id !== id) return entry;
      return costMode === 'avg'
        ? { ...entry, avg: input.value }
        : { ...entry, invested: input.value };
    });
    updateTotals();
  }
  if (role === 'qty') {
    rows = rows.map((entry) => (entry.id === id ? { ...entry, qty: input.value } : entry));
  }
});

addRowBtn.addEventListener('click', () => {
  rows = [
    ...rows,
    { id: crypto.randomUUID(), ticker: '', name: '', invested: '', qty: '', avg: '' },
  ];
  renderRows();
});

searchInput.addEventListener('input', () => renderSheetResults(searchInput.value));
searchCancel.addEventListener('click', closeSearch);
searchBackdrop.addEventListener('click', closeSearch);

sheetResults.addEventListener('click', (event) => {
  const button = event.target.closest('.result');
  if (!button || !activeRowId) return;
  const asset = ASSETS.find((entry) => entry.key === button.dataset.key);
  if (!asset) return;
  rows = rows.map((entry) =>
    entry.id === activeRowId
      ? {
          ...entry,
          ticker: asset.key,
          name: asset.kind === 'fund' ? asset.name : asset.name,
        }
      : entry
  );
  closeSearch();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeSearch();
});

document.querySelectorAll('.cost-toggle button').forEach((button) => {
  button.addEventListener('click', () => {
    costMode = button.dataset.cost;
    document.querySelectorAll('.cost-toggle button').forEach((el) => {
      el.classList.toggle('active', el === button);
    });
    costHeadEl.textContent = costMode === 'avg' ? 'Avg price' : 'Total invested';
    renderRows();
  });
});

renderRows();
