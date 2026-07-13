const ASSETS = [
  { key: 'RELIANCE', name: 'Reliance Industries Ltd', kind: 'Stock', kindLabel: 'Stock' },
  { key: 'TCS', name: 'Tata Consultancy Services', kind: 'Stock', kindLabel: 'Stock' },
  { key: 'INFY', name: 'Infosys Limited', kind: 'Stock', kindLabel: 'Stock' },
  { key: 'HDFCBANK', name: 'HDFC Bank Limited', kind: 'Stock', kindLabel: 'Stock' },
  { key: 'ICICIBANK', name: 'ICICI Bank Limited', kind: 'Stock', kindLabel: 'Stock' },
  { key: 'SBIN', name: 'State Bank of India', kind: 'Stock', kindLabel: 'Stock' },
  { key: 'BHARTIARTL', name: 'Bharti Airtel Limited', kind: 'Stock', kindLabel: 'Stock' },
  { key: 'ITC', name: 'ITC Limited', kind: 'Stock', kindLabel: 'Stock' },
  { key: 'LT', name: 'Larsen & Toubro Limited', kind: 'Stock', kindLabel: 'Stock' },
  { key: 'AXISBANK', name: 'Axis Bank Limited', kind: 'Stock', kindLabel: 'Stock' },
  { key: 'NIFTYBEES', name: 'Nippon India ETF Nifty BeES', kind: 'ETF', kindLabel: 'ETF' },
  { key: 'GOLDSHARE', name: 'Nippon India ETF Gold BeES', kind: 'ETF', kindLabel: 'ETF' },
  {
    key: '120503',
    name: 'HDFC Flexi Cap Fund - Growth',
    kind: 'Fund',
    kindLabel: 'Fund',
  },
  {
    key: '119551',
    name: 'Parag Parikh Flexi Cap Fund - Growth',
    kind: 'Fund',
    kindLabel: 'Fund',
  },
  {
    key: '125497',
    name: 'Quant Small Cap Fund - Growth',
    kind: 'Fund',
    kindLabel: 'Fund',
  },
  {
    key: '118989',
    name: 'UTI Nifty 50 Index Fund - Growth',
    kind: 'Fund',
    kindLabel: 'Fund',
  },
];

const phone = document.querySelector('.phone');
const rowsEl = document.getElementById('rows');
const addRowBtn = document.getElementById('addRow');
const searchLayer = document.getElementById('searchLayer');
const searchSheet = document.getElementById('searchSheet');
const searchInput = document.getElementById('searchInput');
const searchCancel = document.getElementById('searchCancel');
const searchBackdrop = document.getElementById('searchBackdrop');
const resultsEl = document.getElementById('results');

/** @type {{ id: string, ticker: string, name: string, invested: string, qty: string }[]} */
let rows = [
  { id: crypto.randomUUID(), ticker: 'RELIANCE', name: 'Reliance Industries Ltd', invested: '150000', qty: '50' },
  { id: crypto.randomUUID(), ticker: '', name: '', invested: '90000', qty: '' },
];

let activeRowId = null;
let closing = false;

function formatDisplay(row) {
  if (!row.ticker) return { empty: true, sym: 'Search stock, ETF, or fund', name: '' };
  if (row.name && /^\d{6,}$/.test(row.ticker)) {
    return { empty: false, sym: row.name, name: 'Mutual fund' };
  }
  return { empty: false, sym: row.ticker, name: row.name || '' };
}

function renderRows() {
  rowsEl.innerHTML = rows
    .map((row) => {
      const display = formatDisplay(row);
      return `
        <div class="row" data-id="${row.id}">
          <button
            type="button"
            class="ticker-trigger ${display.empty ? 'is-empty' : ''}"
            data-action="open-search"
            aria-label="Search ticker"
          >
            <span class="sym">${escapeHtml(display.sym)}</span>
            ${display.name ? `<span class="name">${escapeHtml(display.name)}</span>` : ''}
          </button>
          <label class="cell right">
            <input
              type="text"
              inputmode="decimal"
              data-field="invested"
              value="${escapeAttr(row.invested)}"
              placeholder="₹"
              aria-label="Invested"
            />
          </label>
          <label class="cell right">
            <input
              type="text"
              inputmode="decimal"
              data-field="qty"
              value="${escapeAttr(row.qty)}"
              placeholder="0"
              aria-label="Quantity"
            />
          </label>
        </div>
      `;
    })
    .join('');
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function escapeAttr(value) {
  return escapeHtml(value);
}

function filterAssets(query) {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  return ASSETS.filter((asset) => {
    return (
      asset.key.toLowerCase().includes(q) ||
      asset.name.toLowerCase().includes(q) ||
      asset.kindLabel.toLowerCase().includes(q)
    );
  }).slice(0, 10);
}

function renderResults(query) {
  const q = query.trim();
  if (q.length < 2) {
    resultsEl.innerHTML = `<p class="results-hint">Type at least 2 characters…</p>`;
    return;
  }

  const matches = filterAssets(q);
  if (!matches.length) {
    resultsEl.innerHTML = `<p class="results-empty">No matches for “${escapeHtml(q)}”</p>`;
    return;
  }

  resultsEl.innerHTML = matches
    .map((asset, index) => {
      const primary = asset.kind === 'Fund' ? asset.name : asset.key;
      const secondary = asset.kind === 'Fund' ? 'Mutual fund' : asset.name;
      return `
        <button
          type="button"
          class="result"
          data-key="${escapeAttr(asset.key)}"
          style="animation: resultIn 360ms var(--ease-spring) ${40 + index * 28}ms both"
        >
          <div class="result-top">
            <span class="result-sym">${escapeHtml(primary)}</span>
            <span class="result-kind">${escapeHtml(asset.kindLabel)}</span>
          </div>
          <span class="result-name">${escapeHtml(secondary)}</span>
        </button>
      `;
    })
    .join('');
}

function openSearch(rowId, triggerEl) {
  if (closing) return;
  activeRowId = rowId;
  const rect = triggerEl.getBoundingClientRect();
  const phoneRect = phone.getBoundingClientRect();

  // Start sheet as a card over the tapped field (FLIP-ish), then expand to full.
  const top = rect.top - phoneRect.top;
  const left = rect.left - phoneRect.left;
  const width = rect.width;
  const height = Math.max(rect.height, 44);

  searchLayer.classList.add('open');
  searchLayer.setAttribute('aria-hidden', 'false');
  phone.classList.add('is-searching');

  searchSheet.classList.add('morphing-from');
  searchSheet.style.borderRadius = '12px';
  searchSheet.style.clipPath = `inset(${top}px ${phoneRect.width - left - width}px ${
    phoneRect.height - top - height
  }px ${left}px round 12px)`;
  searchSheet.style.opacity = '1';
  searchSheet.style.transform = 'none';

  searchInput.value = '';
  renderResults('');

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      searchSheet.classList.remove('morphing-from');
      searchSheet.style.transition =
        'clip-path 420ms cubic-bezier(0.16, 1, 0.3, 1), border-radius 420ms cubic-bezier(0.16, 1, 0.3, 1), opacity 240ms ease';
      searchSheet.style.clipPath = 'inset(0px 0px 0px 0px round 0px)';
      searchSheet.style.borderRadius = '0px';
      searchInput.focus({ preventScroll: true });
    });
  });
}

function closeSearch({ selected } = {}) {
  if ((!searchLayer.classList.contains('open') && !searchLayer.classList.contains('closing')) || closing) {
    return;
  }
  closing = true;
  searchInput.blur();

  const trigger = rowsEl.querySelector(`[data-id="${activeRowId}"] .ticker-trigger`);
  const phoneRect = phone.getBoundingClientRect();

  searchLayer.classList.remove('open');
  searchLayer.classList.add('closing');
  phone.classList.remove('is-searching');

  if (trigger) {
    const rect = trigger.getBoundingClientRect();
    const top = rect.top - phoneRect.top;
    const left = rect.left - phoneRect.left;
    const width = rect.width;
    const height = Math.max(rect.height, 44);

    searchSheet.style.transition =
      'clip-path 320ms cubic-bezier(0.4, 0, 0.2, 1), border-radius 320ms ease, opacity 220ms ease';
    searchSheet.style.clipPath = `inset(${top}px ${phoneRect.width - left - width}px ${
      phoneRect.height - top - height
    }px ${left}px round 12px)`;
    searchSheet.style.borderRadius = '12px';
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
    if (selected) renderRows();
    else renderRows();
  }, 340);
}

function selectAsset(key) {
  const asset = ASSETS.find((entry) => entry.key === key);
  if (!asset || !activeRowId) return;
  rows = rows.map((row) =>
    row.id === activeRowId
      ? {
          ...row,
          ticker: asset.key,
          name: asset.kind === 'Fund' ? asset.name : asset.name,
        }
      : row
  );
  closeSearch({ selected: true });
}

rowsEl.addEventListener('click', (event) => {
  const trigger = event.target.closest('[data-action="open-search"]');
  if (!trigger) return;
  const row = trigger.closest('.row');
  if (!row) return;
  openSearch(row.dataset.id, trigger);
});

rowsEl.addEventListener('input', (event) => {
  const input = event.target;
  if (!(input instanceof HTMLInputElement)) return;
  const field = input.dataset.field;
  const row = input.closest('.row');
  if (!field || !row) return;
  rows = rows.map((entry) =>
    entry.id === row.dataset.id ? { ...entry, [field]: input.value } : entry
  );
});

addRowBtn.addEventListener('click', () => {
  rows = [
    ...rows,
    { id: crypto.randomUUID(), ticker: '', name: '', invested: '', qty: '' },
  ];
  renderRows();
});

searchInput.addEventListener('input', () => {
  renderResults(searchInput.value);
});

searchCancel.addEventListener('click', () => closeSearch());
searchBackdrop.addEventListener('click', () => closeSearch());

resultsEl.addEventListener('click', (event) => {
  const button = event.target.closest('.result');
  if (!button) return;
  selectAsset(button.dataset.key);
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeSearch();
});

const style = document.createElement('style');
style.textContent = `
  @keyframes resultIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;
document.head.appendChild(style);

renderRows();
