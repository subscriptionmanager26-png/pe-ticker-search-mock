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
const dropdownRoot = document.getElementById('dropdownRoot');

let rows = createInitialRows();
let costMode = 'invested';
let activeRowId = null;
let dropdownEl = null;

function updateTotals() {
  totalValueEl.textContent = formatInr(sumInvested(rows));
  const n = countHoldings(rows);
  totalHintEl.textContent =
    n === 0
      ? 'Add holdings below — match this with Total invested in your broker app.'
      : `${n} holding${n === 1 ? '' : 's'} · check this against your broker app`;
}

function closeDropdown() {
  activeRowId = null;
  if (dropdownEl) {
    dropdownEl.remove();
    dropdownEl = null;
  }
}

function fixedMenuBox(anchorEl) {
  const rect = anchorEl.getBoundingClientRect();
  const vv = window.visualViewport;
  const offsetTop = vv?.offsetTop ?? 0;
  const offsetLeft = vv?.offsetLeft ?? 0;
  const viewportWidth = vv?.width ?? window.innerWidth;
  const viewportHeight = vv?.height ?? window.innerHeight;
  const gap = 4;
  const maxMenuHeight = Math.min(256, Math.max(120, viewportHeight * 0.4));
  const spaceBelow = viewportHeight - (rect.bottom - offsetTop) - gap - 8;
  const placeAbove = spaceBelow < 120 && rect.top - offsetTop > spaceBelow;
  const width = Math.min(Math.max(rect.width, 240), Math.max(160, viewportWidth - 24));
  const left = Math.min(Math.max(12, rect.left - offsetLeft), Math.max(12, viewportWidth - width - 12));

  if (placeAbove) {
    return {
      bottom: `${viewportHeight - (rect.top - offsetTop) + gap}px`,
      left: `${left}px`,
      width: `${width}px`,
      maxHeight: `${Math.min(maxMenuHeight, Math.max(80, rect.top - offsetTop - 16))}px`,
      top: 'auto',
    };
  }

  return {
    top: `${rect.bottom - offsetTop + gap}px`,
    left: `${left}px`,
    width: `${width}px`,
    maxHeight: `${Math.min(maxMenuHeight, Math.max(80, spaceBelow))}px`,
    bottom: 'auto',
  };
}

function renderDropdown(anchorEl, query) {
  if (!dropdownEl) {
    dropdownEl = document.createElement('div');
    dropdownEl.className = 'dropdown';
    dropdownRoot.appendChild(dropdownEl);
  }

  const style = fixedMenuBox(anchorEl);
  Object.assign(dropdownEl.style, style);

  const q = query.trim();
  if (q.length < 2) {
    dropdownEl.innerHTML = `<p class="dropdown-empty">Type at least 2 characters…</p>`;
    return;
  }

  const matches = filterAssets(q);
  if (!matches.length) {
    dropdownEl.innerHTML = `<p class="dropdown-empty">No matches found.</p>`;
    return;
  }

  dropdownEl.innerHTML = matches.map((asset, i) => resultButtonHtml(asset, i)).join('');
}

function renderRows() {
  rowsEl.innerHTML = rows
    .map((row) => {
      const shown = row.name || row.ticker;
      const costValue = costMode === 'avg' ? row.avg ?? '' : row.invested;
      return `
        <div class="row" data-id="${row.id}">
          <div class="search-anchor">
            <input
              class="field"
              type="text"
              inputmode="search"
              autocomplete="off"
              autocorrect="off"
              autocapitalize="characters"
              spellcheck="false"
              data-role="ticker"
              placeholder="Search stock, ETF, or fund"
              value="${escapeHtml(shown)}"
            />
          </div>
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

function bindDropdownTracking(anchor) {
  const update = () => {
    if (!dropdownEl || !activeRowId) return;
    const input = rowsEl.querySelector(`[data-id="${activeRowId}"] [data-role="ticker"]`);
    if (!input) return;
    Object.assign(dropdownEl.style, fixedMenuBox(input.closest('.search-anchor') || input));
  };
  window.addEventListener('resize', update);
  window.addEventListener('scroll', update, true);
  window.visualViewport?.addEventListener('resize', update);
  window.visualViewport?.addEventListener('scroll', update);
  return update;
}

bindDropdownTracking();

rowsEl.addEventListener('focusin', (event) => {
  const input = event.target.closest('[data-role="ticker"]');
  if (!input) return;
  const row = input.closest('.row');
  activeRowId = row.dataset.id;
  renderDropdown(input.closest('.search-anchor') || input, input.value);
});

rowsEl.addEventListener('input', (event) => {
  const input = event.target;
  const row = input.closest('.row');
  if (!row) return;
  const id = row.dataset.id;
  const role = input.dataset.role;

  if (role === 'ticker') {
    rows = rows.map((entry) =>
      entry.id === id ? { ...entry, ticker: input.value.toUpperCase(), name: '' } : entry
    );
    activeRowId = id;
    renderDropdown(input.closest('.search-anchor') || input, input.value);
    updateTotals();
    return;
  }

  if (role === 'cost') {
    rows = rows.map((entry) => {
      if (entry.id !== id) return entry;
      return costMode === 'avg'
        ? { ...entry, avg: input.value }
        : { ...entry, invested: input.value };
    });
    updateTotals();
    return;
  }

  if (role === 'qty') {
    rows = rows.map((entry) => (entry.id === id ? { ...entry, qty: input.value } : entry));
  }
});

rowsEl.addEventListener('click', (event) => {
  const del = event.target.closest('[data-role="delete"]');
  if (!del) return;
  const row = del.closest('.row');
  rows = rows.filter((entry) => entry.id !== row.dataset.id);
  if (!rows.length) rows = createInitialRows().slice(1);
  closeDropdown();
  renderRows();
});

dropdownRoot.addEventListener('mousedown', (event) => {
  event.preventDefault();
});

dropdownRoot.addEventListener('click', (event) => {
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
  closeDropdown();
  renderRows();
});

document.addEventListener('focusin', (event) => {
  if (!event.target.closest('[data-role="ticker"]') && !event.target.closest('.dropdown')) {
    closeDropdown();
  }
});

addRowBtn.addEventListener('click', () => {
  rows = [
    ...rows,
    { id: crypto.randomUUID(), ticker: '', name: '', invested: '', qty: '', avg: '' },
  ];
  closeDropdown();
  renderRows();
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
