const referenceBody = document.getElementById('reference-body');
const twoSelect = document.getElementById('two-select');
const searchInput = document.getElementById('search-input');
const metricCount = document.getElementById('metric-count');
const metricAtas = document.getElementById('metric-atas');
const metricBawah = document.getElementById('metric-bawah');
const summaryCards = document.getElementById('summary-cards');
const patterns3d = document.getElementById('patterns-3d');
const patterns4d = document.getElementById('patterns-4d');
const patterns5d = document.getElementById('patterns-5d');
const patterns6d = document.getElementById('patterns-6d');
const scrollData = document.getElementById('scroll-data');
const scrollPredict = document.getElementById('scroll-predict');

let referenceData = [];

const createPatternPill = (value) => {
  const span = document.createElement('div');
  span.className = 'pattern-item';
  span.textContent = value;
  return span;
};

const renderSummary = (item) => {
  if (!summaryCards) return;
  summaryCards.innerHTML = '';
  const cards = [
    { label: '2D Terpilih', value: item['2D'] },
    { label: 'Kategori', value: item.category },
    { label: 'Jalur', value: item.jalur },
    { label: 'Sum', value: item.sum },
    { label: 'Parity', value: item.parity },
    { label: 'Reverse', value: item.reverse },
  ];

  cards.forEach((card) => {
    const node = document.createElement('div');
    node.className = 'metric';
    node.innerHTML = `<span>${card.value}</span><p>${card.label}</p>`;
    summaryCards.appendChild(node);
  });
};

const renderPatterns = (item) => {
  if (!patterns3d || !patterns4d || !patterns5d || !patterns6d) return;
  patterns3d.innerHTML = '';
  patterns4d.innerHTML = '';
  patterns5d.innerHTML = '';
  patterns6d.innerHTML = '';

  item['3D_patterns'].forEach((value) => patterns3d.appendChild(createPatternPill(value)));
  item['4D_patterns'].forEach((value) => patterns4d.appendChild(createPatternPill(value)));
  item['5D_patterns'].forEach((value) => patterns5d.appendChild(createPatternPill(value)));
  item['6D_patterns'].forEach((value) => patterns6d.appendChild(createPatternPill(value)));
};

const updateStats = () => {
  if (!metricCount || !metricAtas || !metricBawah) return;
  const total = referenceData.length;
  const atas = referenceData.filter((item) => item.category.toLowerCase() === 'atas').length;
  const bawah = referenceData.filter((item) => item.category.toLowerCase() === 'bawah').length;
  metricCount.textContent = total;
  metricAtas.textContent = atas;
  metricBawah.textContent = bawah;
};

const populateSelect = () => {
  if (!twoSelect) return;
  twoSelect.innerHTML = '';
  referenceData.forEach((item) => {
    const option = document.createElement('option');
    option.value = item['2D'];
    option.textContent = item['2D'];
    twoSelect.appendChild(option);
  });
};

const renderTable = (filter = '') => {
  if (!referenceBody) return;
  const query = filter.trim().toLowerCase();
  referenceBody.innerHTML = '';

  const filtered = referenceData.filter((item) => {
    if (!query) return true;
    return [
      item['2D'],
      item.category,
      item.jalur,
      item.sum.toString(),
      item.parity,
      item.reverse,
      item['kepala besar/kecil'],
      item['ekor besar/kecil'],
      item['kepala genap/ganjil'],
      item['ekor genap/ganjil'],
      item['kepala prima'],
      item['ekor prima'],
    ].some((value) => value.toString().toLowerCase().includes(query));
  });

  filtered.forEach((item) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item['2D']}</td>
      <td>${item.category}</td>
      <td>${item.jalur}</td>
      <td>${item.sum}</td>
      <td>${item.parity}</td>
      <td>${item.reverse}</td>
      <td>${item['kepala besar/kecil']}</td>
      <td>${item['ekor besar/kecil']}</td>
      <td>${item['kepala genap/ganjil']}</td>
      <td>${item['ekor genap/ganjil']}</td>
      <td>${item['kepala prima']}</td>
      <td>${item['ekor prima']}</td>
    `;
    referenceBody.appendChild(row);
  });
};

const selectTwo = (value) => {
  const item = referenceData.find((entry) => entry['2D'] === value);
  if (!item) return;
  renderSummary(item);
  renderPatterns(item);
};

const fetchReferenceData = async () => {
  try {
    const response = await fetch('/reference.json');
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    // ignore and fallback to API
  }
  const response = await fetch('/api/reference');
  return await response.json();
};

const initialize = async () => {
  referenceData = await fetchReferenceData();

  populateSelect();
  updateStats();
  renderTable();

  // initialize 2D builder UI
  if (typeof initBuilder === 'function') initBuilder();

  if (twoSelect && referenceData[0]) {
    selectTwo(referenceData[0]['2D']);
  }
  // load any saved results and render
  if (typeof loadResults === 'function') loadResults();
  if (results && results.length) {
    // ensure selected result is the last one
    currentSelectedResult = results[results.length - 1].value;
    renderResultsList();
    renderRefTableForResults(results);
  }
};

if (searchInput) {
  searchInput.addEventListener('input', (event) => renderTable(event.target.value));
}
if (twoSelect) {
  twoSelect.addEventListener('change', (event) => selectTwo(event.target.value));
}
if (scrollData) {
  scrollData.addEventListener('click', () => document.getElementById('data-section').scrollIntoView({ behavior: 'smooth' }));
}
if (scrollPredict) {
  scrollPredict.addEventListener('click', () => document.getElementById('predict-section').scrollIntoView({ behavior: 'smooth' }));
}

initialize().catch((error) => {
  console.error('Gagal memuat data:', error);
  if (referenceBody) {
    referenceBody.innerHTML = '<tr><td colspan="12">Tidak dapat memuat data. Pastikan server sedang berjalan.</td></tr>';
  }
});

// --- Result page logic ---
const resultValue = document.getElementById('result-value');
const addResultBtn = document.getElementById('add-result');
const clearResultsBtn = document.getElementById('clear-results');
const resultsList = document.getElementById('results-list');
const methodGroup = document.getElementById('method-group');
const tabGroup = document.getElementById('tab-group');
const tabFront = document.getElementById('tab-front');
const tab2dd = document.getElementById('tab-2dd');
const tab2d = document.getElementById('tab-2d');
const refTableBody = document.getElementById('ref-table-body');

let currentRefTab = '2dd';
let currentSelectedResult = null;

let results = [];

const RESULTS_KEY = 'bolean_results_v1';

const saveResults = () => {
  try {
    localStorage.setItem(RESULTS_KEY, JSON.stringify(results));
  } catch (e) {
    // ignore storage errors
  }
};

const loadResults = () => {
  try {
    const raw = localStorage.getItem(RESULTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) results = parsed;
    }
  } catch (e) {
    results = [];
  }
};

const isNumeric = (s) => /^\d+$/.test(String(s));

const inferResultType = (value) => {
  const len = String(value).length;
  if (len >= 2 && len <= 6) return `${len}D`;
  return `${len}D`;
};

const showMethodIfNeeded = () => {
  if (!resultValue) return;
  const input = resultValue.value.trim();
  const len = input.length;
  if (len >= 2 && len <= 4) {
    if (methodGroup) methodGroup.style.display = 'block';
  } else {
    if (methodGroup) methodGroup.style.display = 'none';
  }
};

const kepala = (s) => String(s).slice(0,1);
const ekor = (s) => String(s).slice(-1);

const findReferencesForKop = (val) => {
  // kepala/ekor classifications
  const k = kepala(val);
  const e = ekor(val);
  return referenceData.filter((r) => {
    return r['kepala besar/kecil'] === (parseInt(k) >=5 ? 'besar' : 'kecil') &&
           r['ekor besar/kecil'] === (parseInt(e) >=5 ? 'besar' : 'kecil') &&
           r['kepala genap/ganjil'] === (parseInt(k)%2===0? 'genap':'ganjil') &&
           r['ekor genap/ganjil'] === (parseInt(e)%2===0? 'genap':'ganjil');
  });
};

const findReferencesFor2DD = (val) => {
  // use last two digits as 2D key
  const s = String(val).padStart(2, '0');
  const two = s.slice(-2);
  return referenceData.filter((r) => r['2D'] === two || r['reverse'] === two || String(r['sum']) === String((parseInt(two[0]) + parseInt(two[1]))%10));
};

const splitInto2DChunks = (val) => {
  const s = String(val);
  // if odd length, pad left with 0 to make pairs
  const padded = s.length % 2 === 1 ? '0' + s : s;
  const chunks = [];
  for (let i = 0; i < padded.length; i += 2) {
    chunks.push(padded.slice(i, i + 2));
  }
  return chunks;
};

const extractResultParts = (val) => {
  const chunks = splitInto2DChunks(val);
  const front = chunks.length === 3 ? chunks[0] : '';
  const dd = chunks.length === 3 ? chunks[1] : chunks[0] || '';
  const back = chunks[chunks.length - 1] || '';
  return { front, dd, back, chunks };
};

const findExact2DRefs = (two) => {
  return referenceData.filter((r) => r['2D'] === two);
};

const get2DChunkForValue = (val) => {
  const chunks = splitInto2DChunks(val);
  if (!chunks.length) return '';
  if (currentRefTab === 'front') {
    return chunks[0] || '';
  }
  if (currentRefTab === '2dd') {
    return chunks.length === 3 ? chunks[1] : chunks[0] || '';
  }
  return chunks[chunks.length - 1] || '';
};

const setActiveRefTab = () => {
  if (!tabFront || !tab2dd || !tab2d) return;
  tabFront.classList.toggle('active', currentRefTab === 'front');
  tab2dd.classList.toggle('active', currentRefTab === '2dd');
  tab2d.classList.toggle('active', currentRefTab === '2d');
};

const setSelectedResult = (value) => {
  currentSelectedResult = value;
  renderRefTableForResults(results);
  setActiveRefTab();
};

const renderResultsList = () => {
  if (!resultsList) return;
  resultsList.innerHTML = '';

  results.forEach((r) => {
    const { front, dd, back } = extractResultParts(r.value);
    const li = document.createElement('li');
    li.className = 'result-row';
    li.style.cursor = 'pointer';
    li.style.padding = '0.9rem 1rem';
    li.style.borderBottom = '1px solid rgba(255,255,255,0.06)';
    li.style.listStyle = 'none';
    li.textContent = r.value;

    if (currentSelectedResult === r.value) {
      li.style.background = 'rgba(255,255,255,0.08)';
    }

    li.addEventListener('click', () => {
      setSelectedResult(r.value);
      renderResultsList();
    });

    resultsList.appendChild(li);
  });

  if (results.length) {
    renderRefTableForResults(results);
    setActiveRefTab();
  }
};

const renderReferenceResults = (val, method) => {
  // legacy: kept for compatibility but real rendering uses ref table
  renderRefTableForValue(val);
};

const renderRefTable = (matches) => {
  if (!refTableBody) return;
  refTableBody.innerHTML = '';
  if (!matches || !matches.length) {
    refTableBody.innerHTML = '<tr><td colspan="12">Tidak ditemukan referensi yang cocok.</td></tr>';
    return;
  }
  matches.forEach((m) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${m.result || ''}</td>
      <td>${m.category}</td>
      <td>${m.jalur}</td>
      <td>${m.sum}</td>
      <td>${m.parity}</td>
      <td>${m.reverse}</td>
      <td>${m['kepala besar/kecil']}</td>
      <td>${m['ekor besar/kecil']}</td>
      <td>${m['kepala genap/ganjil']}</td>
      <td>${m['ekor genap/ganjil']}</td>
      <td>${m['kepala prima']}</td>
      <td>${m['ekor prima']}</td>
    `;
    refTableBody.appendChild(tr);
  });
};

const updateRefTabLabels = (val) => {
  if (!tab2dd || !tab2d || !tabGroup) return;
  const { front, dd, back, chunks } = extractResultParts(val);
  if (chunks.length < 1) {
    tabGroup.style.display = 'none';
    tabFront.textContent = 'Front';
    tab2dd.textContent = '2DD';
    tab2d.textContent = '2D';
    return;
  }

  tabGroup.style.display = 'flex';
  if (chunks.length === 2) {
    tabFront.style.display = 'none';
    tab2dd.textContent = `2DD (${dd})`;
    tab2d.textContent = `2D (${back})`;
    if (currentRefTab === 'front') currentRefTab = '2dd';
  } else {
    tabFront.style.display = 'inline-flex';
    tabFront.textContent = `Front (${front})`;
    tab2dd.textContent = `2DD (${dd})`;
    tab2d.textContent = `2D (${back})`;
  }
};

const renderRefTableForValue = (val) => {
  updateRefTabLabels(val);
  if (!val) return renderRefTable([]);
  const chunks = splitInto2DChunks(val);
  if (!chunks.length) return renderRefTable([]);

  const two = get2DChunkForValue(val);
  const matches = two ? findExact2DRefs(two) : [];
  renderRefTable(matches);
};

const renderRefTableForResults = (items) => {
  const lastValue = currentSelectedResult || (items.length ? items[items.length - 1].value : '');
  updateRefTabLabels(lastValue);
  if (!items || !items.length) return renderRefTable([]);

  const rows = items.flatMap((item) => {
    const two = get2DChunkForValue(item.value);
    const matches = two ? findExact2DRefs(two) : [];
    return matches.map((match) => ({ ...match, result: item.value }));
  });

  renderRefTable(rows);
};

if (resultValue) {
  resultValue.addEventListener('input', () => {
    showMethodIfNeeded();
    updateRefTabLabels(resultValue.value.trim());
  });
}

if (addResultBtn) {
  addResultBtn.addEventListener('click', () => {
    const v = resultValue ? resultValue.value.trim() : '';
    if (!v || !isNumeric(v)) return alert('Masukkan nilai numerik valid.');
    if (v.length < 2 || v.length > 6) return alert('Masukkan hasil antara 2 hingga 6 digit.');
    const t = inferResultType(v);
    results.push({ type: t, value: v });
    try { saveResults(); } catch (e) {}
    setSelectedResult(v);
    renderResultsList();
    renderRefTableForResults(results);
    resultValue.value = '';
  });
}

if (tabFront) {
  tabFront.addEventListener('click', () => {
    currentRefTab = 'front';
    setActiveRefTab();
    renderRefTableForResults(results);
  });
}
if (tab2dd) {
  tab2dd.addEventListener('click', () => {
    currentRefTab = '2dd';
    setActiveRefTab();
    renderRefTableForResults(results);
  });
}
if (tab2d) {
  tab2d.addEventListener('click', () => {
    currentRefTab = '2d';
    setActiveRefTab();
    renderRefTableForResults(results);
  });
}

if (clearResultsBtn) {
  clearResultsBtn.addEventListener('click', () => {
    results = [];
    if (resultsList) resultsList.innerHTML = '';
    if (refTableBody) refTableBody.innerHTML = '<tr><td colspan="11">Pilih result untuk melihat referensi terkait.</td></tr>';
    try { localStorage.removeItem(RESULTS_KEY); } catch (e) {}
  });
}

// ensure method visibility initial
showMethodIfNeeded();

// --- Builder sections ---
const builderFields = [
  { key: 'category', suffix: 'kategori', field: 'category' },
  { key: 'jalur', suffix: 'jalur', field: 'jalur' },
  { key: 'sum', suffix: 'sum', field: 'sum' },
  { key: 'parity', suffix: 'parity', field: 'parity' },
  { key: 'reverse', suffix: 'reverse', field: 'reverse' },
  { key: 'kepala_bk', suffix: 'kepala-bk', field: 'kepala besar/kecil' },
  { key: 'ekor_bk', suffix: 'ekor-bk', field: 'ekor besar/kecil' },
  { key: 'kepala_gg', suffix: 'kepala-gg', field: 'kepala genap/ganjil' },
  { key: 'ekor_gg', suffix: 'ekor-gg', field: 'ekor genap/ganjil' },
  { key: 'kepala_prima', suffix: 'kepala-prima', field: 'kepala prima' },
  { key: 'ekor_prima', suffix: 'ekor-prima', field: 'ekor prima' },
];

const builder2dSelections = [];
const builder2ddSelections = [];
const builderfrontSelections = [];
const builder2dEls = {};
const builder2ddEls = {};
const builderfrontEls = {};

const builderConfigs = {
  '2D': {
    prefix: 'builder',
    els: builder2dEls,
    selections: builder2dSelections,
    resultsId: 'builder-results',
    outputId: 'builder2d-output',
    buttonId: 'builder-show',
    enabled: () => true,
    disabledHint: '',
    fields: {},
  },
  '2DD': {
    prefix: 'builder2dd',
    els: builder2ddEls,
    selections: builder2ddSelections,
    resultsId: 'builder2dd-results',
    outputId: 'builder2dd-output',
    buttonId: 'builder2dd-show',
    enabled: () => builder2dSelections.length > 0,
    disabledHint: 'Aktifkan 2D terlebih dahulu.',
    fields: {},
  },
  'front': {
    prefix: 'builderfront',
    els: builderfrontEls,
    selections: builderfrontSelections,
    resultsId: 'builderfront-results',
    outputId: 'builderfront-output',
    buttonId: 'builderfront-show',
    enabled: () => builder2ddSelections.length > 0,
    disabledHint: 'Aktifkan 2DD terlebih dahulu.',
    fields: {},
  },
};

const getUniqueValues = (field, rows) => {
  const set = new Set();
  rows.forEach((r) => set.add(String(r[field] || '')));
  return Array.from(set).filter((v) => v !== 'undefined').sort();
};

const toggleSelection = (selections, value) => {
  const idx = selections.indexOf(value);
  if (idx === -1) {
    selections.push(value);
  } else {
    selections.splice(idx, 1);
  }
};

const getBuilderConfig = (name) => builderConfigs[name];

const initBuilderSection = (name) => {
  const config = getBuilderConfig(name);
  config.fields = {};
  builderFields.forEach((f) => {
    const sel = document.getElementById(`${config.prefix}-${f.suffix}`);
    if (!sel) return;
    sel.innerHTML = '<option value="">—</option>';
    getUniqueValues(f.field, referenceData).forEach((v) => {
      const opt = document.createElement('option');
      opt.value = v;
      opt.textContent = v;
      sel.appendChild(opt);
    });
    sel.addEventListener('change', () => updateBuilderSection(name));
    config.fields[f.field] = sel;
  });

  config.results = document.getElementById(config.resultsId);
  config.output = document.getElementById(config.outputId);
  config.button = document.getElementById(config.buttonId);
  if (config.button) {
    config.button.addEventListener('click', () => updateBuilderSection(name, true));
  }
};

const getBuilderFilters = (config) => {
  const filters = {};
  builderFields.forEach((f) => {
    const sel = config.fields[f.field];
    if (!sel) return;
    if (sel.value) filters[f.field] = sel.value;
  });
  return filters;
};

const filterBuilderRows = (config) => {
  const filters = getBuilderFilters(config);
  return referenceData.filter((r) => Object.keys(filters).every((k) => String(r[k]) === String(filters[k])));
};

const updateBuilderActivation = () => {
  const configs = ['2D', '2DD', 'front'].map(getBuilderConfig);
  configs.forEach((config) => {
    const active = config.prefix === 'builder' ? true : config.enabled();
    builderFields.forEach((f) => {
      const sel = config.fields[f.field];
      if (sel) sel.disabled = !active;
    });
    if (config.button) config.button.disabled = !active;
    if (!active && config.output) config.output.textContent = config.disabledHint;
  });
};

const getBuilderCandidates = (config, rows) => {
  return Array.from(new Set(rows.map((r) => r['2D']))).sort();
};

const renderBuilderCandidates = (config, rows) => {
  if (!config.results) return;
  config.results.innerHTML = '';
  if (!config.enabled()) {
    config.results.textContent = 'Nonaktif sampai tahapan sebelumnya lengkap.';
    return;
  }

  const values = getBuilderCandidates(config, rows);
  if (!values.length) {
    config.results.textContent = 'Tidak ada kandidat 2D.';
    return;
  }

  values.forEach((value) => {
    const btn = document.createElement('button');
    btn.className = 'pattern-item';
    btn.textContent = value;
    if (config.selections.includes(value)) {
      btn.style.border = '1px solid #fff';
      btn.style.background = 'rgba(255,255,255,0.1)';
    }
    btn.addEventListener('click', () => {
      toggleSelection(config.selections, value);
      renderBuilderCandidates(config, rows);
      renderBuilderOutput(config);
      if (config.prefix === 'builder') {
        updateBuilderSection('2DD');
      }
      if (config.prefix === 'builder2dd') {
        updateBuilderSection('front');
      }
      updateBuilderActivation();
    });
    config.results.appendChild(btn);
  });
};

const get3DValues = (twoDD, twoD) => {
  return twoDD.flatMap((dd) => {
    const suffix = dd.slice(-1);
    return twoD.map((two) => `${suffix}${two}`);
  });
};

const get4DValues = (twoDD, twoD) => {
  return twoDD.flatMap((dd) => twoD.map((two) => `${dd}${two}`));
};

const escapeHtml = (value) => {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const renderBuilderOutput = (config) => {
  if (!config.output) return;
  if (!config.enabled()) {
    config.output.innerHTML = `<div class="builder-output-line">${escapeHtml(config.disabledHint)}</div>`;
    return;
  }

  if (config.prefix === 'builder') {
    if (!builder2dSelections.length) {
      config.output.innerHTML = '<div class="builder-output-line">Belum ada kandidat 2D.</div>';
      return;
    }
    config.output.innerHTML = `<div class="builder-output-line"><span class="builder-output-label">2D:</span>${escapeHtml(builder2dSelections.join('*'))}</div>`;
    return;
  }

  if (config.prefix === 'builder2dd') {
    if (!builder2dSelections.length) {
      config.output.innerHTML = '<div class="builder-output-line">Aktifkan builder 2D terlebih dahulu.</div>';
      return;
    }
    const twoDD = builder2ddSelections;
    const twoD = builder2dSelections;
    const values3d = get3DValues(twoDD, twoD);
    const values4d = get4DValues(twoDD, twoD);
    config.output.innerHTML = [
      `<div class="builder-output-line"><span class="builder-output-label">2DD:</span>${escapeHtml(twoDD.length ? twoDD.join('*') : '-')}</div>`,
      `<div class="builder-output-line"><span class="builder-output-label">3D:</span>${escapeHtml(values3d.length ? values3d.join('*') : '-')}</div>`,
      `<div class="builder-output-line"><span class="builder-output-label">4D:</span>${escapeHtml(values4d.length ? values4d.join('*') : '-')}</div>`,
    ].join('');
    return;
  }

  if (config.prefix === 'builderfront') {
    if (!builder2ddSelections.length) {
      config.output.innerHTML = '<div class="builder-output-line">Aktifkan builder 2DD terlebih dahulu.</div>';
      return;
    }
    const values3d = get3DValues(builder2ddSelections, builder2dSelections);
    const values4d = get4DValues(builder2ddSelections, builder2dSelections);
    const values5d = builderfrontSelections.flatMap((front) => values3d.map((v) => `${front}${v}`));
    const values6d = builderfrontSelections.flatMap((front) => values4d.map((v) => `${front}${v}`));
    config.output.innerHTML = [
      `<div class="builder-output-line"><span class="builder-output-label">5D:</span>${escapeHtml(values5d.length ? values5d.join('*') : '-')}</div>`,
      `<div class="builder-output-line"><span class="builder-output-label">6D:</span>${escapeHtml(values6d.length ? values6d.join('*') : '-')}</div>`,
    ].join('');
  }
};

const updateBuilderSection = (name, forceShow = false) => {
  const config = getBuilderConfig(name);
  if (!config) return;
  const rows = filterBuilderRows(config);
  renderBuilderCandidates(config, rows);
  renderBuilderOutput(config);
  updateBuilderActivation();
  if (!forceShow && Object.keys(getBuilderFilters(config)).length === 0) {
    if (config.results) config.results.innerHTML = '';
  }
};

const initBuilder = () => {
  ['2D', '2DD', 'front'].forEach((name) => initBuilderSection(name));
  ['2D', '2DD', 'front'].forEach((name) => updateBuilderSection(name));
};
