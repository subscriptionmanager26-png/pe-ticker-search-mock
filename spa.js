(function () {
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

  const LOGO =
    window.__LOGO_SRC__ ||
    'https://cdn.jsdelivr.net/gh/subscriptionmanager26-png/pe-ticker-search-mock@main/logo.png';

  const root = document.getElementById('root');

  function nav(badge, backHref) {
    return `
      <header class="nav">
        <div class="nav-inner">
          <div class="brand">
            <img src="${LOGO}" alt="" width="28" height="28" />
            <span class="brand-name">PocketEdge</span>
          </div>
          <span class="nav-badge">${escapeHtml(badge)}</span>
        </div>
      </header>
    `;
  }

  function holdingsChrome(mockLabel, lede) {
    return `
      ${nav(mockLabel)}
      <div class="main" id="scrollRoot">
        <div class="main-inner">
          <a class="back" href="#/">← All mocks</a>
          <h1 class="page-title">Add holdings</h1>
          <p class="page-lede">${lede}</p>
          <section class="total-card">
            <p class="section-label">Total invested</p>
            <p class="total-value" id="totalValue">₹0</p>
            <p class="total-hint" id="totalHint">Add holdings below</p>
          </section>
          <div class="holdings-head">
            <p class="section-label">Holdings</p>
            <div class="cost-toggle" role="group" aria-label="Cost input mode">
              <button type="button" class="active" data-cost="invested">Total invested</button>
              <button type="button" data-cost="avg">Avg price</button>
            </div>
          </div>
          <div class="col-head">
            <span>Ticker</span>
            <span class="right" id="costHead">Total invested</span>
            <span class="right">Qty</span>
            <span></span>
          </div>
          <div class="rows" id="rows"></div>
          <button type="button" class="add-row" id="addRow">+ Add holding</button>
        </div>
      </div>
      <footer class="footer">
        <div class="footer-inner">
          <button type="button" class="primary-btn">Continue</button>
        </div>
      </footer>
    `;
  }

  function renderHome() {
    root.innerHTML = `
      <div class="app">
        ${nav('Mocks')}
        <div class="main">
          <div class="main-inner">
            <h1 class="page-title">Ticker search</h1>
            <p class="page-lede">
              Two iPhone Safari approaches for holdings ticker search. Same PocketEdge UI —
              pick one and test on your phone.
            </p>
            <div class="chooser">
              <a class="chooser-card" href="#/a">
                <p class="chooser-kicker">Mock A</p>
                <p class="chooser-title">Anchored dropdown</p>
                <p class="chooser-body">
                  16px inputs (no Safari zoom) + fixed menu under the field, repositioned with
                  visualViewport when the keyboard opens.
                </p>
              </a>
              <a class="chooser-card" href="#/b">
                <p class="chooser-kicker">Mock B</p>
                <p class="chooser-title">Expand to top</p>
                <p class="chooser-body">
                  Tapping the ticker field morphs into a full search sheet at the top — results
                  below. Feels like the page reorganized, not a popup.
                </p>
              </a>
            </div>
            <p class="note">
              Both screens mirror the onboarding / portfolio holdings editor. Try
              <strong>REL</strong>, <strong>INFY</strong>, <strong>flexi</strong>, or
              <strong>gold</strong>.
            </p>
          </div>
        </div>
      </div>
    `;
  }

  function mountMockA() {
    root.innerHTML = `
      <div class="app">
        ${holdingsChrome(
          'Mock A',
          'Type in a ticker field — results stay under the input (anchored dropdown).'
        )}
      </div>
      <div id="dropdownRoot"></div>
    `;
    bootHoldings({ mode: 'a' });
  }

  function mountMockB() {
    root.innerHTML = `
      <div class="app" id="appRoot">
        ${holdingsChrome(
          'Mock B',
          'Tap a ticker field — it lifts to the top and results appear below.'
        )}
      </div>
      <div class="search-layer" id="searchLayer" aria-hidden="true">
        <div class="search-backdrop" id="searchBackdrop"></div>
        <div class="search-sheet" id="searchSheet">
          <div class="search-chrome">
            <button type="button" class="cancel" id="searchCancel">Cancel</button>
            <div class="search-field-wrap">
              <input id="searchInput" type="text" inputmode="search" enterkeyhint="search"
                autocomplete="off" autocorrect="off" autocapitalize="characters" spellcheck="false"
                placeholder="Search stock, ETF, or fund" />
            </div>
          </div>
          <div class="sheet-results" id="sheetResults"></div>
        </div>
      </div>
    `;
    bootHoldings({ mode: 'b' });
  }

  function bootHoldings({ mode }) {
    const rowsEl = document.getElementById('rows');
    const addRowBtn = document.getElementById('addRow');
    const totalValueEl = document.getElementById('totalValue');
    const totalHintEl = document.getElementById('totalHint');
    const costHeadEl = document.getElementById('costHead');
    let rows = createInitialRows();
    let costMode = 'invested';

    function updateTotals() {
      totalValueEl.textContent = formatInr(sumInvested(rows));
      const n = countHoldings(rows);
      totalHintEl.textContent =
        n === 0
          ? 'Add holdings below — match this with Total invested in your broker app.'
          : `${n} holding${n === 1 ? '' : 's'} · check this against your broker app`;
    }

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

    if (mode === 'a') bootA();
    else bootB();

    function bootA() {
      const dropdownRoot = document.getElementById('dropdownRoot');
      let activeRowId = null;
      let dropdownEl = null;

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
        const left = Math.min(
          Math.max(12, rect.left - offsetLeft),
          Math.max(12, viewportWidth - width - 12)
        );
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
        Object.assign(dropdownEl.style, fixedMenuBox(anchorEl));
        const q = query.trim();
        if (q.length < 2) {
          dropdownEl.innerHTML = `<p class="dropdown-empty">Type at least 2 characters…</p>`;
          return;
        }
        const matches = filterAssets(q);
        dropdownEl.innerHTML = matches.length
          ? matches.map((asset, i) => resultButtonHtml(asset, i)).join('')
          : `<p class="dropdown-empty">No matches found.</p>`;
      }

      function track() {
        if (!dropdownEl || !activeRowId) return;
        const input = rowsEl.querySelector(`[data-id="${activeRowId}"] [data-role="ticker"]`);
        if (!input) return;
        Object.assign(dropdownEl.style, fixedMenuBox(input.closest('.search-anchor') || input));
      }
      window.addEventListener('resize', track);
      window.addEventListener('scroll', track, true);
      window.visualViewport?.addEventListener('resize', track);
      window.visualViewport?.addEventListener('scroll', track);

      window.renderRows = function renderRows() {
        rowsEl.innerHTML = rows
          .map((row) => {
            const shown = row.name || row.ticker;
            const costValue = costMode === 'avg' ? row.avg ?? '' : row.invested;
            return `
              <div class="row" data-id="${row.id}">
                <div class="search-anchor">
                  <input class="field" type="text" inputmode="search" autocomplete="off"
                    autocorrect="off" autocapitalize="characters" spellcheck="false"
                    data-role="ticker" placeholder="Search stock, ETF, or fund"
                    value="${escapeHtml(shown)}" />
                </div>
                <input class="field right" type="text" inputmode="decimal" data-role="cost"
                  placeholder="${costMode === 'avg' ? 'Avg price' : 'Invested'}"
                  value="${escapeHtml(costValue)}" />
                <input class="field right" type="text" inputmode="decimal" data-role="qty"
                  placeholder="Qty" value="${escapeHtml(row.qty)}" />
                <button type="button" class="delete-btn" data-role="delete" aria-label="Delete">✕</button>
              </div>`;
          })
          .join('');
        updateTotals();
      };

      rowsEl.addEventListener('focusin', (event) => {
        const input = event.target.closest('[data-role="ticker"]');
        if (!input) return;
        activeRowId = input.closest('.row').dataset.id;
        renderDropdown(input.closest('.search-anchor') || input, input.value);
      });

      rowsEl.addEventListener('input', (event) => {
        const input = event.target;
        const row = input.closest('.row');
        if (!row) return;
        const id = row.dataset.id;
        if (input.dataset.role === 'ticker') {
          rows = rows.map((e) =>
            e.id === id ? { ...e, ticker: input.value.toUpperCase(), name: '' } : e
          );
          activeRowId = id;
          renderDropdown(input.closest('.search-anchor') || input, input.value);
          updateTotals();
        } else if (input.dataset.role === 'cost') {
          rows = rows.map((e) =>
            e.id === id
              ? costMode === 'avg'
                ? { ...e, avg: input.value }
                : { ...e, invested: input.value }
              : e
          );
          updateTotals();
        } else if (input.dataset.role === 'qty') {
          rows = rows.map((e) => (e.id === id ? { ...e, qty: input.value } : e));
        }
      });

      rowsEl.addEventListener('click', (event) => {
        const del = event.target.closest('[data-role="delete"]');
        if (!del) return;
        const id = del.closest('.row').dataset.id;
        rows = rows.filter((e) => e.id !== id);
        if (!rows.length) {
          rows = [{ id: crypto.randomUUID(), ticker: '', name: '', invested: '', qty: '', avg: '' }];
        }
        closeDropdown();
        window.renderRows();
      });

      dropdownRoot.addEventListener('mousedown', (e) => e.preventDefault());
      dropdownRoot.addEventListener('click', (event) => {
        const button = event.target.closest('.result');
        if (!button || !activeRowId) return;
        const asset = ASSETS.find((e) => e.key === button.dataset.key);
        if (!asset) return;
        rows = rows.map((e) =>
          e.id === activeRowId
            ? { ...e, ticker: asset.key, name: asset.kind === 'fund' ? asset.name : asset.name }
            : e
        );
        closeDropdown();
        window.renderRows();
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
        window.renderRows();
      });

      window.renderRows();
    }

    function bootB() {
      const searchLayer = document.getElementById('searchLayer');
      const searchSheet = document.getElementById('searchSheet');
      const searchInput = document.getElementById('searchInput');
      const searchCancel = document.getElementById('searchCancel');
      const searchBackdrop = document.getElementById('searchBackdrop');
      const sheetResults = document.getElementById('sheetResults');
      const appRoot = document.getElementById('appRoot');
      let activeRowId = null;
      let closing = false;

      function renderSheetResults(query) {
        const q = query.trim();
        if (q.length < 2) {
          sheetResults.innerHTML = `<p class="dropdown-empty">Type at least 2 characters…</p>`;
          return;
        }
        const matches = filterAssets(q);
        sheetResults.innerHTML = matches.length
          ? matches.map((asset, i) => resultButtonHtml(asset, i)).join('')
          : `<p class="dropdown-empty">No matches found.</p>`;
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
            searchSheet.style.clipPath = 'inset(0 0 0 0 round 0)';
            searchSheet.style.borderRadius = '0';
            searchInput.focus({ preventScroll: true });
          });
        });
      }

      function closeSearch() {
        if (
          (!searchLayer.classList.contains('open') && !searchLayer.classList.contains('closing')) ||
          closing
        ) {
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
          window.renderRows();
        }, 320);
      }

      window.renderRows = function renderRows() {
        rowsEl.innerHTML = rows
          .map((row) => {
            const shown = row.name || row.ticker || 'Search stock, ETF, or fund';
            const empty = !row.ticker;
            const costValue = costMode === 'avg' ? row.avg ?? '' : row.invested;
            return `
              <div class="row" data-id="${row.id}">
                <button type="button" class="field" data-role="open"
                  style="text-align:left;color:${empty ? 'var(--pe-text-muted)' : 'var(--pe-text)'}">
                  ${escapeHtml(shown)}
                </button>
                <input class="field right" type="text" inputmode="decimal" data-role="cost"
                  placeholder="${costMode === 'avg' ? 'Avg price' : 'Invested'}"
                  value="${escapeHtml(costValue)}" />
                <input class="field right" type="text" inputmode="decimal" data-role="qty"
                  placeholder="Qty" value="${escapeHtml(row.qty)}" />
                <button type="button" class="delete-btn" data-role="delete" aria-label="Delete">✕</button>
              </div>`;
          })
          .join('');
        updateTotals();
      };

      rowsEl.addEventListener('click', (event) => {
        const open = event.target.closest('[data-role="open"]');
        if (open) {
          openSearch(open.closest('.row').dataset.id, open);
          return;
        }
        const del = event.target.closest('[data-role="delete"]');
        if (!del) return;
        const id = del.closest('.row').dataset.id;
        rows = rows.filter((e) => e.id !== id);
        if (!rows.length) {
          rows = [{ id: crypto.randomUUID(), ticker: '', name: '', invested: '', qty: '', avg: '' }];
        }
        window.renderRows();
      });

      rowsEl.addEventListener('input', (event) => {
        const input = event.target;
        const row = input.closest('.row');
        if (!row) return;
        const id = row.dataset.id;
        if (input.dataset.role === 'cost') {
          rows = rows.map((e) =>
            e.id === id
              ? costMode === 'avg'
                ? { ...e, avg: input.value }
                : { ...e, invested: input.value }
              : e
          );
          updateTotals();
        } else if (input.dataset.role === 'qty') {
          rows = rows.map((e) => (e.id === id ? { ...e, qty: input.value } : e));
        }
      });

      addRowBtn.addEventListener('click', () => {
        rows = [
          ...rows,
          { id: crypto.randomUUID(), ticker: '', name: '', invested: '', qty: '', avg: '' },
        ];
        window.renderRows();
      });

      searchInput.addEventListener('input', () => renderSheetResults(searchInput.value));
      searchCancel.addEventListener('click', closeSearch);
      searchBackdrop.addEventListener('click', closeSearch);
      sheetResults.addEventListener('click', (event) => {
        const button = event.target.closest('.result');
        if (!button || !activeRowId) return;
        const asset = ASSETS.find((e) => e.key === button.dataset.key);
        if (!asset) return;
        rows = rows.map((e) =>
          e.id === activeRowId
            ? { ...e, ticker: asset.key, name: asset.kind === 'fund' ? asset.name : asset.name }
            : e
        );
        closeSearch();
      });
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closeSearch();
      });

      window.renderRows();
    }
  }

  function route() {
    const hash = location.hash.replace(/^#/, '') || '/';
    if (hash === '/a') mountMockA();
    else if (hash === '/b') mountMockB();
    else renderHome();
    window.scrollTo(0, 0);
  }

  window.addEventListener('hashchange', route);
  route();
})();
