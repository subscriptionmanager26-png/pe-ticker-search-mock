const ASSETS = [
  { key: 'RELIANCE', name: 'Reliance Industries Ltd', kind: 'stock', kindLabel: 'Stock' },
  { key: 'TCS', name: 'Tata Consultancy Services', kind: 'stock', kindLabel: 'Stock' },
  { key: 'INFY', name: 'Infosys Limited', kind: 'stock', kindLabel: 'Stock' },
  { key: 'HDFCBANK', name: 'HDFC Bank Limited', kind: 'stock', kindLabel: 'Stock' },
  { key: 'ICICIBANK', name: 'ICICI Bank Limited', kind: 'stock', kindLabel: 'Stock' },
  { key: 'SBIN', name: 'State Bank of India', kind: 'stock', kindLabel: 'Stock' },
  { key: 'BHARTIARTL', name: 'Bharti Airtel Limited', kind: 'stock', kindLabel: 'Stock' },
  { key: 'ITC', name: 'ITC Limited', kind: 'stock', kindLabel: 'Stock' },
  { key: 'LT', name: 'Larsen & Toubro Limited', kind: 'stock', kindLabel: 'Stock' },
  { key: 'AXISBANK', name: 'Axis Bank Limited', kind: 'stock', kindLabel: 'Stock' },
  { key: 'NIFTYBEES', name: 'Nippon India ETF Nifty BeES', kind: 'etf', kindLabel: 'ETF' },
  { key: 'GOLDSHARE', name: 'Nippon India ETF Gold BeES', kind: 'etf', kindLabel: 'ETF' },
  { key: '120503', name: 'HDFC Flexi Cap Fund - Growth', kind: 'fund', kindLabel: 'Fund' },
  { key: '119551', name: 'Parag Parikh Flexi Cap Fund - Growth', kind: 'fund', kindLabel: 'Fund' },
  { key: '125497', name: 'Quant Small Cap Fund - Growth', kind: 'fund', kindLabel: 'Fund' },
  { key: '118989', name: 'UTI Nifty 50 Index Fund - Growth', kind: 'fund', kindLabel: 'Fund' },
];

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function formatInr(value) {
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

function displaySymbol(asset) {
  if (asset.kind === 'fund') return asset.name || asset.key;
  return asset.key;
}

function filterAssets(query) {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  return ASSETS.filter(
    (asset) =>
      asset.key.toLowerCase().includes(q) ||
      asset.name.toLowerCase().includes(q) ||
      asset.kindLabel.toLowerCase().includes(q)
  ).slice(0, 8);
}

function resultButtonHtml(asset, index = 0) {
  const primary = displaySymbol(asset);
  const secondary = asset.kind === 'fund' ? 'Mutual fund' : asset.name;
  return `
    <button type="button" class="result" data-key="${escapeHtml(asset.key)}"
      style="animation: resultIn 320ms cubic-bezier(0.16,1,0.3,1) ${30 + index * 24}ms both">
      <div class="result-top">
        <span class="result-sym">${escapeHtml(primary)}</span>
        <span class="result-kind">${escapeHtml(asset.kindLabel)}</span>
      </div>
      ${asset.kind === 'fund' ? '' : `<p class="result-name">${escapeHtml(secondary)}</p>`}
    </button>
  `;
}

function createInitialRows() {
  return [
    {
      id: crypto.randomUUID(),
      ticker: 'RELIANCE',
      name: 'Reliance Industries Ltd',
      invested: '150000',
      qty: '50',
    },
    {
      id: crypto.randomUUID(),
      ticker: '',
      name: '',
      invested: '90000',
      qty: '',
    },
  ];
}

function sumInvested(rows) {
  return rows.reduce((sum, row) => {
    const n = Number(row.invested);
    return sum + (row.invested !== '' && !Number.isNaN(n) && n >= 0 ? n : 0);
  }, 0);
}

function countHoldings(rows) {
  return rows.filter((row) => String(row.ticker || '').trim()).length;
}

window.PEMock = {
  ASSETS,
  escapeHtml,
  formatInr,
  displaySymbol,
  filterAssets,
  resultButtonHtml,
  createInitialRows,
  sumInvested,
  countHoldings,
};
