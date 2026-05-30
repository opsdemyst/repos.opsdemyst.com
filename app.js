let ALL_REPOS = [];
let heroCharts = [];

// ── HELPERS ──────────────────────────────────────────────
const fmt = n => n != null ? Number(n).toLocaleString() : '—';
const fmtD = n => n == null ? '—'
    : (n >= 0 ? `+${fmt(n)}` : fmt(n));

const delta_class = n => n == null ? '' : n >= 0 ? 'trend-up' : 'trend-down';

function chartDefaults() {
    return {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
            x: {
                ticks: { color: '#8892a4', font: { size: 10 } },
                grid: { color: '#2a2f45' }
            },
            y: {
                ticks: { color: '#8892a4', font: { size: 10 } },
                grid: { color: '#2a2f45' }
            }
        }
    };
}

function destroyCharts() {
    heroCharts.forEach(c => c.destroy());
    heroCharts = [];
}

// ── HERO ─────────────────────────────────────────────────
function renderHero(repo) {
    destroyCharts();

    document.getElementById('hero-date').textContent = repo.publish_date;
    document.getElementById('hero-name').textContent = repo.full_name;
    document.getElementById('hero-name').href = repo.url;
    document.getElementById('hero-desc').textContent = repo.description || '';
    document.getElementById('hero-note').textContent = repo.curator_note || '';
    document.getElementById('hero-usecase').textContent = repo.use_case || '';
    document.getElementById('hero-category').textContent = repo.category || '';
    document.getElementById('hero-language').textContent = repo.language || '';

    const lic = document.getElementById('hero-license');
    lic.textContent = repo.license || '';
    lic.style.display = repo.license ? '' : 'none';

    document.getElementById('hero-stars').textContent = fmt(repo.stars);
    document.getElementById('hero-forks').textContent = fmt(repo.forks);
    document.getElementById('hero-issues').textContent = fmt(repo.open_issues);

    const hw = document.getElementById('hero-weekly');
    hw.textContent = fmtD(repo.weekly_delta);
    hw.className = `stat-val ${delta_class(repo.weekly_delta)}`;

    const hm = document.getElementById('hero-monthly');
    hm.textContent = fmtD(repo.monthly_delta);
    hm.className = `stat-val ${delta_class(repo.monthly_delta)}`;

    // topics
    const topicsEl = document.getElementById('hero-topics');
    topicsEl.innerHTML = (repo.topics || [])
        .map(t => `<span class="topic-tag">#${t}</span>`).join('');

    // charts
    if (repo.history && repo.history.length > 1) {
        const labels = repo.history.map(h => h.date.slice(5));

        heroCharts.push(new Chart(
            document.getElementById('chart-stars').getContext('2d'), {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    data: repo.history.map(h => h.stars),
                    borderColor: '#f5a623',
                    backgroundColor: 'rgba(245,166,35,0.08)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 3
                }]
            },
            options: chartDefaults()
        }
        ));

        heroCharts.push(new Chart(
            document.getElementById('chart-delta').getContext('2d'), {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    data: repo.history.map(h => h.weekly_delta || 0),
                    backgroundColor: repo.history.map(h =>
                        (h.weekly_delta || 0) >= 0
                            ? 'rgba(46,204,113,0.7)'
                            : 'rgba(231,76,60,0.7)'
                    )
                }]
            },
            options: chartDefaults()
        }
        ));

        heroCharts.push(new Chart(
            document.getElementById('chart-forks').getContext('2d'), {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    data: repo.history.map(h => h.forks),
                    borderColor: '#6c63ff',
                    backgroundColor: 'rgba(108,99,255,0.08)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 3
                }]
            },
            options: chartDefaults()
        }
        ));
    }
}

// ── CARDS ─────────────────────────────────────────────────
function renderCard(repo) {
    const weekly = repo.weekly_delta;
    const trendHtml = weekly != null
        ? `<span class="card-trending ${weekly < 0 ? 'down' : ''}">
        ${weekly >= 0 ? '▲' : '▼'} ${fmt(Math.abs(weekly))} / wk
       </span>`
        : '';

    const div = document.createElement('div');
    div.className = `card${repo.featured ? ' featured' : ''}`;
    div.innerHTML = `
    <div class="card-top">
      <div class="card-name">
        <a href="${repo.url}" target="_blank" onclick="event.stopPropagation()">
          ${repo.full_name}
        </a>
      </div>
      <div class="card-date">${repo.publish_date}</div>
    </div>
    <div class="card-desc">${repo.description || '—'}</div>
    <div class="card-note">${repo.curator_note || ''}</div>
    <div class="card-stats">
      <span>⭐ <span class="card-stat-val">${fmt(repo.stars)}</span></span>
      <span>🍴 <span class="card-stat-val">${fmt(repo.forks)}</span></span>
      <span>🗣 <span class="card-stat-val">${repo.language || '—'}</span></span>
    </div>
    <div class="card-bottom">
      <span class="card-category">${repo.category || ''}</span>
      ${trendHtml}
    </div>
  `;
    div.addEventListener('click', () => openModal(repo));
    return div;
}

function renderGrid(repos) {
    const grid = document.getElementById('repo-grid');
    grid.innerHTML = '';
    document.getElementById('archive-count').textContent = `${repos.length} repos`;
    if (!repos.length) {
        grid.innerHTML = '<div class="empty">No repos match your filters.</div>';
        return;
    }
    repos.forEach(r => grid.appendChild(renderCard(r)));
}

// ── MODAL ─────────────────────────────────────────────────
function openModal(repo) {
    const labels = (repo.history || []).map(h => h.date.slice(5));
    const hasHistory = repo.history && repo.history.length > 1;

    document.getElementById('modal-content').innerHTML = `
    <h2 style="margin-bottom:0.5rem">
      <a href="${repo.url}" target="_blank"
         style="color:var(--text);text-decoration:none">${repo.full_name}</a>
    </h2>
    <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:1rem">
      <span class="badge">${repo.category || ''}</span>
      ${repo.language ? `<span class="badge badge-lang">${repo.language}</span>` : ''}
      ${repo.license ? `<span class="badge badge-muted">${repo.license}</span>` : ''}
    </div>
    <p style="color:var(--muted);margin-bottom:1rem">${repo.description || ''}</p>

    <div class="curator-box" style="margin-bottom:1rem">
      <div class="curator-label">💬 Curator's Note</div>
      <p>${repo.curator_note || '—'}</p>
    </div>

    <div class="use-case-box" style="margin-bottom:1.5rem">
      <span class="use-case-label">🎯 Best for:</span>${repo.use_case || '—'}
    </div>

    <div style="display:flex;gap:2rem;flex-wrap:wrap;margin-bottom:1.5rem">
      <div class="stat">
        <span class="stat-val">${fmt(repo.stars)}</span>
        <span class="stat-lbl">⭐ Stars</span>
      </div>
      <div class="stat">
        <span class="stat-val">${fmt(repo.forks)}</span>
        <span class="stat-lbl">🍴 Forks</span>
      </div>
      <div class="stat">
        <span class="stat-val ${delta_class(repo.weekly_delta)}">${fmtD(repo.weekly_delta)}</span>
        <span class="stat-lbl">📈 This Week</span>
      </div>
      <div class="stat">
        <span class="stat-val ${delta_class(repo.monthly_delta)}">${fmtD(repo.monthly_delta)}</span>
        <span class="stat-lbl">📅 This Month</span>
      </div>
    </div>

    ${hasHistory ? `
    <div class="chart-card" style="margin-bottom:1rem">
      <div class="chart-title">⭐ Star Growth History</div>
      <canvas id="modal-chart"></canvas>
    </div>` : ''}

    <div style="display:flex;gap:0.4rem;flex-wrap:wrap">
      ${(repo.topics || []).map(t => `<span class="topic-tag">#${t}</span>`).join('')}
    </div>
  `;

    if (hasHistory) {
        new Chart(document.getElementById('modal-chart').getContext('2d'), {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    data: repo.history.map(h => h.stars),
                    borderColor: '#f5a623',
                    backgroundColor: 'rgba(245,166,35,0.08)',
                    fill: true, tension: 0.4, pointRadius: 3
                }]
            },
            options: chartDefaults()
        });
    }

    document.getElementById('modal-overlay').classList.add('active');
}

document.getElementById('modal-close').addEventListener('click', () => {
    document.getElementById('modal-overlay').classList.remove('active');
});
document.getElementById('modal-overlay').addEventListener('click', e => {
    if (e.target === document.getElementById('modal-overlay'))
        document.getElementById('modal-overlay').classList.remove('active');
});

// ── FILTERS ───────────────────────────────────────────────
function applyFilters() {
    const search = document.getElementById('search').value.toLowerCase();
    const category = document.getElementById('filter-category').value;
    const language = document.getElementById('filter-language').value;
    const sortBy = document.getElementById('sort-by').value;

    let filtered = ALL_REPOS.filter(r => {
        const matchSearch = !search ||
            r.full_name.toLowerCase().includes(search) ||
            (r.description || '').toLowerCase().includes(search) ||
            (r.curator_note || '').toLowerCase().includes(search);
        const matchCat = !category || r.category === category;
        const matchLang = !language || r.language === language;
        return matchSearch && matchCat && matchLang;
    });

    filtered.sort((a, b) => {
        if (sortBy === 'stars') return (b.stars || 0) - (a.stars || 0);
        if (sortBy === 'forks') return (b.forks || 0) - (a.forks || 0);
        if (sortBy === 'trending') return (b.weekly_delta || 0) - (a.weekly_delta || 0);
        return new Date(b.publish_date) - new Date(a.publish_date);
    });

    renderGrid(filtered);
}

['search', 'filter-category', 'filter-language', 'sort-by']
    .forEach(id => document.getElementById(id)
        .addEventListener('input', applyFilters));

// ── CHANGELOG ─────────────────────────────────────────────
function renderChangelog(changelog) {
    const el = document.getElementById('changelog-list');
    if (!changelog || !changelog.length) {
        el.innerHTML = '<div class="empty">No changelog entries yet.</div>';
        return;
    }
    el.innerHTML = changelog.map(e => `
    <div class="changelog-item">
      <span class="changelog-date">${e.date}</span>
      <span class="changelog-type type-${e.type}">${e.type}</span>
      <span>${e.full_name} — ${e.note}</span>
    </div>
  `).join('');
}

// ── POPULATE FILTERS ──────────────────────────────────────
function populateFilters(repos) {
    const cats = [...new Set(repos.map(r => r.category).filter(Boolean))].sort();
    const langs = [...new Set(repos.map(r => r.language).filter(Boolean))].sort();

    const catSel = document.getElementById('filter-category');
    cats.forEach(c => {
        const o = document.createElement('option');
        o.value = c; o.textContent = c;
        catSel.appendChild(o);
    });

    const langSel = document.getElementById('filter-language');
    langs.forEach(l => {
        const o = document.createElement('option');
        o.value = l; o.textContent = l;
        langSel.appendChild(o);
    });
}

// ── INIT ──────────────────────────────────────────────────
fetch('data/repos.json')
    .then(r => r.json())
    .then(data => {
        ALL_REPOS = data.repos || [];

        // hero = today's or most recent published
        const today = new Date().toISOString().slice(0, 10);
        const hero = ALL_REPOS.find(r => r.publish_date === today)
            || ALL_REPOS[0];

        if (hero) renderHero(hero);

        // archive = all except hero
        const archive = ALL_REPOS.filter(r => r.full_name !== hero?.full_name);
        populateFilters(ALL_REPOS);
        renderGrid(archive);
        renderChangelog(data.changelog);

        document.getElementById('footer-updated').textContent =
            `Last updated: ${data.exported_at}`;
    })
    .catch(() => {
        document.getElementById('repo-grid').innerHTML =
            '<div class="empty">Could not load repo data.</div>';
    });