/* Salesforce Architect Career Workspace — shell behaviour:
   sheet routing, sidebar/context sync, Study Desk notes, progress tracker, search. */

(function(){

const LS_CHECKED = 'sfaw-checked';
const LS_NOTES_PREFIX = 'sfaw-notes-';
const LS_BOOKMARKS = 'sfaw-bookmarks';
const LS_DESK_COLLAPSED = 'sfaw-desk-collapsed';

function lsGet(key, fallback){
  try{
    const v = localStorage.getItem(key);
    return v === null ? fallback : JSON.parse(v);
  }catch(e){ return fallback; }
}
function lsSet(key, value){
  try{ localStorage.setItem(key, JSON.stringify(value)); }catch(e){ /* storage unavailable */ }
}

let checked = lsGet(LS_CHECKED, {});
let bookmarks = new Set(lsGet(LS_BOOKMARKS, []));

function isChecked(id){ return !!checked[id]; }
function toggleChecked(id, val){
  checked[id] = val;
  lsSet(LS_CHECKED, checked);
}

/* ---------------------------------------------------------------- */
/* Content helpers                                                  */
/* ---------------------------------------------------------------- */

function itemRow(id, title, note, tag){
  const c = isChecked(id);
  return `<div class="item-row">
    <input type="checkbox" id="cb-${id}" data-item="${id}" ${c ? 'checked' : ''}>
    <div class="item-text">
      <p class="item-title${c ? ' checked' : ''}">${title}</p>
      <p class="item-note">${note}</p>
    </div>
    ${tag ? `<span class="item-tag">${tag}</span>` : ''}
  </div>`;
}

function kad(icon, title, desc){
  return `<div class="kad-card"><span class="k-icon">${icon}</span><b>${title}</b><span>${desc}</span></div>`;
}

function resourceItem(title, desc, url, label){
  return `<li>
    <p class="r-title">${title}</p>
    <p class="r-desc">${desc}</p>
    <a href="${url}" target="_blank" rel="noopener">${label || 'Open'} &#8599;</a>
  </li>`;
}

/* ---------------------------------------------------------------- */
/* Sheet definitions                                                */
/* ---------------------------------------------------------------- */

const SHEETS = [
  {
    id: 'start', group: 'Get Started', navLabel: 'Start',
    eyebrow: '00 · Orientation',
    title: 'Build your architect career on Salesforce',
    lede: 'This workspace turns the official Trailhead architect trail into a sequence you can actually work through: platform fluency first, then integration and governance, then the certification track. The unit of progress is the checklist item, not the badge.',
    items: [],
    render(){
      return `
        ${sheetHeader(this)}
        <div class="kad-strip">
          ${kad('📖', 'Learn', 'Platform vocabulary, data model, security, automation — the mechanics an architect is assumed to already know.')}
          ${kad('🔧', 'Apply', 'Integration patterns, multi-cloud design, and governance — where enterprise architecture experience does the heavy lifting.')}
          ${kad('🏅', 'Certify', 'Layer credentials — Administrator through Certified Technical Architect — as each domain solidifies.')}
        </div>
        <h2 class="section-h">How to use this workspace</h2>
        <ol class="step-list">
          <li>Work the left-hand map top to bottom — each sheet builds on the last.</li>
          <li>Check items off as you complete them; the <b>Progress</b> sheet tracks completion across the whole path.</li>
          <li>Star any sheet with <b>Bookmark</b> to pin it to the review queue.</li>
          <li>Use <b>Search</b> (Ctrl/Cmd+K) to jump straight to a sheet by name.</li>
          <li>Keep running notes per sheet in the Study Desk below — it remembers a separate note for each one.</li>
        </ol>
        <div class="callout">
          <b>Source material —</b> this roadmap is built from Trailhead's official <a href="https://trailhead.salesforce.com/content/learn/trails/salesforce-architect-careers" target="_blank" rel="noopener">"Build Your Architect Career on Salesforce"</a> trail, cross-referenced against <a href="https://salesforcedictionary.com/dashboard" target="_blank" rel="noopener">Salesforce Dictionary</a>'s certification and learning resources.
        </div>
      `;
    }
  },
  {
    id: 'role', group: 'The Role', navLabel: 'Discover the Architect Role',
    eyebrow: '01 · The Role',
    title: 'Discover the Salesforce Architect role',
    lede: 'Orient to what the role actually does before investing in platform mechanics — responsibilities, where it sits relative to admin/dev, and how it is expanding.',
    items: [
      {id:'r1', title:'Read "What is a Salesforce Architect?"', note:'Role definition and career pathway overview.'},
      {id:'r2', title:'Complete Salesforce Architect: Quick Look badge', note:'Core responsibilities and required competencies.', tag:'+100 pts'},
      {id:'r3', title:'Read "How the Architect Role Is Evolving in the Agentic AI Era"', note:'Where responsibilities are expanding fastest right now.'},
      {id:'r4', title:'Read "Think Like an Architect"', note:'Expert analysis of real-world design scenarios — the closest thing to a worked example.'},
    ],
    render(){
      return `${sheetHeader(this)}${sheetMeta('~20 min · +100 pts')}${itemList(this)}
        <div class="callout">
          <b>Why this order —</b> everything downstream assumes you already know what the job is judging you on: trade-off reasoning under real constraints, not tool trivia.
        </div>`;
    }
  },
  {
    id: 'foundations', group: 'Foundations', navLabel: 'Platform Foundations',
    eyebrow: '02 · Foundations',
    title: 'Platform foundations',
    lede: 'Org structure, data model, and the security model — the vocabulary every later stage assumes you already have.',
    items: [
      {id:'f1', title:'Salesforce Platform Basics trail', note:'Orgs, objects, fields, records — the core vocabulary.', tag:'~2h'},
      {id:'f2', title:'Data model & relationships', note:'Lookup vs master-detail, junction objects, schema builder.', tag:'~1.5h'},
      {id:'f3', title:'Security & sharing model', note:'Profiles, permission sets, org-wide defaults, sharing rules.', tag:'~2h'},
    ],
    render(){
      return `${sheetHeader(this)}${sheetMeta('~5.5 h')}${itemList(this)}`;
    }
  },
  {
    id: 'automation', group: 'Foundations', navLabel: 'Automation & Declarative Tools',
    eyebrow: '03 · Foundations',
    title: 'Automation & declarative tools',
    lede: 'Flow is the single most likely concrete example a hiring panel — or the exam — will probe.',
    items: [
      {id:'a1', title:'Flow Builder fundamentals', note:'Screen flows, record-triggered flows, core logic.', tag:'~2h'},
      {id:'a2', title:'When to use Flow vs Apex', note:'A framing you can argue confidently without being a developer.', tag:'~30m'},
    ],
    render(){
      return `${sheetHeader(this)}${sheetMeta('~2.5 h')}${itemList(this)}`;
    }
  },
  {
    id: 'integration', group: 'Architecture', navLabel: 'Integration Architecture',
    eyebrow: '04 · Architecture',
    title: 'Integration architecture',
    lede: 'The domain where prior enterprise architecture experience transfers most directly — this is mostly re-labelling, not re-learning.',
    items: [
      {id:'i1', title:'REST & SOAP APIs on the platform', note:'How Salesforce exposes and consumes web services.', tag:'~1h'},
      {id:'i2', title:'Platform Events & event-driven patterns', note:"The platform's take on event-driven architecture.", tag:'~1h'},
      {id:'i3', title:'External identity & SSO', note:'Maps closely to Entra ID / broader IAM background.', tag:'~1h'},
    ],
    render(){
      return `${sheetHeader(this)}${sheetMeta('~3 h · strength area')}${itemList(this)}`;
    }
  },
  {
    id: 'governance', group: 'Architecture', navLabel: 'Multi-Cloud & Governance',
    eyebrow: '05 · Architecture',
    title: 'Multi-cloud & governance',
    lede: 'How Sales, Service and Experience Cloud relate, and how architecture governance is actually exercised on-platform.',
    items: [
      {id:'g1', title:'Sales, Service & Experience Cloud overview', note:'What each cloud is for, at discussion-level fluency.', tag:'~1h'},
      {id:'g2', title:'Architecture governance on Salesforce', note:'Design reviews, quality gates, target-state roadmaps.', tag:'~1h'},
    ],
    render(){
      return `${sheetHeader(this)}${sheetMeta('~2 h')}${itemList(this)}`;
    }
  },
  {
    id: 'agentic', group: 'Architecture', navLabel: 'Architect the Agentic Enterprise',
    eyebrow: '06 · Architecture',
    title: 'Architect the agentic enterprise',
    lede: 'The newest, heaviest module on the official trail — where the role is expanding fastest right now.',
    items: [
      {id:'ag1', title:'IT Architecture of the Agentic Enterprise', note:'System design for agent-driven orgs.', tag:'~30m'},
      {id:'ag2', title:'The Agent Development Lifecycle', note:'', tag:'~30m'},
      {id:'ag3', title:'Agentic Patterns and Implementation with Agentforce', note:'', tag:'~1h 10m'},
      {id:'ag4', title:'Data 360 Architecture', note:'Unified data & integration foundation.', tag:'~1h'},
      {id:'ag5', title:'Technical Debt badge', note:"The trail's largest single badge.", tag:'+2,000 pts'},
      {id:'ag6', title:'Agent Customization: Quick Look badge', note:'', tag:'+100 pts'},
    ],
    render(){
      return `${sheetHeader(this)}${sheetMeta('~5 h · +2,100 pts')}${itemList(this)}`;
    }
  },
  {
    id: 'certification', group: 'Certification', navLabel: 'Certification Track',
    eyebrow: '07 · Certification',
    title: 'Certification track',
    lede: 'Not a sprint — layer credentials as depth in each domain solidifies. Order matters more than speed.',
    items: [
      {id:'c1', title:'Administrator (ADM-201)', note:'The foundation cert nearly every path assumes.'},
      {id:'c2', title:'Platform App Builder', note:'Declarative build depth.'},
      {id:'c3', title:'Architect Journey trailmix', note:'Data Architecture, Sharing & Visibility, Platform Dev, Integration Architecture, Identity & Access Management.'},
      {id:'c4', title:'Application / System Architect', note:'Domain architect designations.'},
      {id:'c5', title:'Certified Technical Architect (CTA)', note:'The board-reviewed capstone.'},
    ],
    render(){
      return `${sheetHeader(this)}${sheetMeta('ongoing')}${itemList(this)}
        <div class="callout amber">
          <b>Cheapest concrete proof point —</b> book the associate-level exam ($75) once foundations feel solid. It's the fastest way to convert study time into something a hiring panel can verify.
        </div>`;
    }
  },
  {
    id: 'bridge', group: 'Interview Bridge', navLabel: 'Readiness Bridge',
    eyebrow: '08 · Interview Bridge',
    title: 'What already transfers',
    lede: 'Translation notes for walking into a Salesforce Solution Architect conversation on the strength of existing enterprise architecture experience — lead with this.',
    items: [
      {id:'b1', title:'Frame integration patterns explicitly', note:'REST/SOAP, event-driven and SSO work on Azure/AWS maps directly onto the API, Platform Events and external identity model. The vocabulary changes; the architecture thinking doesn’t.'},
      {id:'b2', title:'Frame governance frameworks explicitly', note:'Design review boards and architecture decision records are the same discipline Salesforce calls governance gates and design authority.'},
      {id:'b3', title:'Frame data & security architecture explicitly', note:'Sharing models and object-level security are a new syntax for a familiar problem: who can see what, and why.'},
      {id:'b4', title:'Prepare multi-cloud talking points', note:'Be ready to discuss Sales Cloud, Service Cloud and Experience Cloud ownership at a solution-architecture level, even without hands-on build time in each.'},
      {id:'b5', title:'Prepare SDLC & governance talking points', note:'Structured SDLC, design reviews, unit/system testing discipline, and production stewardship — name the existing practice, then map it to Salesforce delivery.'},
    ],
    render(){
      return `${sheetHeader(this)}${sheetMeta('before interview')}${itemList(this)}
        <div class="callout">
          <b>Use this sheet as an interview outline —</b> each item above is a talking point, not a study task. Jot supporting examples in the Study Desk below as they come to mind.
        </div>`;
    }
  },
  {
    id: 'resources', group: 'Reference', navLabel: 'Resources',
    eyebrow: '09 · Reference',
    title: 'Reference resources',
    lede: 'The primary sources this workspace is built from, plus ongoing references worth bookmarking.',
    items: [],
    render(){
      return `${sheetHeader(this)}
        <ul class="resource-list">
          ${resourceItem('Trailhead — Build Your Architect Career', 'Official trail; the source for the roadmap in this workspace.', 'https://trailhead.salesforce.com/content/learn/trails/salesforce-architect-careers', 'Open trail')}
          ${resourceItem('Trailhead Credentials Directory', 'Full credentials directory and the Architect Journey trailmix — bookmark and work over months.', 'https://trailhead.salesforce.com/credentials', 'Open directory')}
          ${resourceItem('Salesforce Dictionary — Dashboard', 'Terminology, certification prep, interview prep, learning paths, and a salary calculator in one place.', 'https://salesforcedictionary.com/dashboard', 'Open dashboard')}
          ${resourceItem('Architect Journey Trailmix', 'Built specifically for the architect certification path.', 'https://trailhead.salesforce.com/users/strailhead/trailmixes/architect-trailmix-master', 'Open trailmix')}
        </ul>`;
    }
  },
  {
    id: 'progress', group: 'Progress', navLabel: 'Progress & Review Queue',
    eyebrow: '10 · Progress',
    title: 'Progress & review queue',
    lede: 'Completion across every sheet, plus anything you’ve bookmarked or left half-finished.',
    items: [],
    render(){
      const {done, total} = overallProgress();
      const pct = total ? Math.round((done/total)*100) : 0;
      const circumference = 150.8;
      const offset = circumference - (pct/100)*circumference;
      const rows = SHEETS.filter(s => s.items.length).map(s => {
        const d = s.items.filter(it => isChecked(it.id)).length;
        const t = s.items.length;
        const p = Math.round((d/t)*100);
        return `<tr>
          <td onclick="location.hash='${s.id}'">${s.navLabel}</td>
          <td><span class="mini-bar"><span class="mini-bar-fill" style="width:${p}%"></span></span>${d}/${t}</td>
        </tr>`;
      }).join('');

      const bookmarked = SHEETS.filter(s => bookmarks.has(s.id));
      const incomplete = SHEETS.filter(s => s.items.length && s.items.some(it => !isChecked(it.id)) && !bookmarks.has(s.id));
      const queue = [...bookmarked, ...incomplete];
      const queueHtml = queue.length ? `<ul class="plain-list">${queue.map(s => {
        const star = bookmarks.has(s.id) ? '★ ' : '';
        return `<li><a href="#${s.id}">${star}${s.navLabel}</a></li>`;
      }).join('')}</ul>` : `<p class="body-text">Nothing queued — bookmark a sheet or leave an item unchecked and it'll show up here.</p>`;

      return `${sheetHeader(this)}
        <div class="progress-summary">
          <svg class="progress-ring" viewBox="0 0 56 56">
            <circle cx="28" cy="28" r="24" fill="none" stroke="#E2E6EF" stroke-width="5"></circle>
            <circle cx="28" cy="28" r="24" fill="none" stroke="#0176D3" stroke-width="5"
              stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" stroke-linecap="round"
              transform="rotate(-90 28 28)"></circle>
          </svg>
          <div>
            <p class="p-label">Overall progress</p>
            <p class="p-count">${done} / ${total} items &middot; ${pct}%</p>
          </div>
        </div>
        <h2 class="section-h">By sheet</h2>
        <table class="sheet-progress-table"><tbody>${rows}</tbody></table>
        <h2 class="section-h">Review queue</h2>
        ${queueHtml}`;
    }
  },
];

function overallProgress(){
  let total = 0, done = 0;
  SHEETS.forEach(s => { total += s.items.length; done += s.items.filter(it => isChecked(it.id)).length; });
  return {done, total};
}

function sheetHeader(sheet){
  return `<p class="sheet-eyebrow">${sheet.eyebrow}</p>
    <h1 class="sheet-title">${sheet.title}</h1>
    <p class="sheet-lede">${sheet.lede}</p>`;
}
function sheetMeta(text){
  return `<div class="sheet-meta"><span>${text}</span></div>`;
}
function itemList(sheet){
  return sheet.items.map(it => itemRow(it.id, it.title, it.note, it.tag)).join('');
}

/* ---------------------------------------------------------------- */
/* Sidebar                                                          */
/* ---------------------------------------------------------------- */

function sheetDotClass(sheet){
  if(!sheet.items.length) return '';
  const d = sheet.items.filter(it => isChecked(it.id)).length;
  if(d === 0) return '';
  if(d === sheet.items.length) return ' done';
  return ' partial';
}

function renderSidebar(currentId){
  const groups = [];
  SHEETS.forEach(s => {
    let g = groups.find(g => g.name === s.group);
    if(!g){ g = {name: s.group, sheets: []}; groups.push(g); }
    g.sheets.push(s);
  });
  const sidebar = document.getElementById('sidebar');
  sidebar.innerHTML = groups.map(g => `
    <div class="nav-group">
      <p class="nav-group-label">${g.name}</p>
      ${g.sheets.map(s => `
        <div class="nav-item${s.id === currentId ? ' current' : ''}${bookmarks.has(s.id) ? ' bookmarked' : ''}" data-sheet="${s.id}">
          <span class="nav-dot${sheetDotClass(s)}"></span>
          <span>${s.navLabel}</span>
          <span class="nav-star">${bookmarks.has(s.id) ? '★' : ''}</span>
        </div>
      `).join('')}
    </div>
  `).join('');

  sidebar.querySelectorAll('.nav-item').forEach(el => {
    el.addEventListener('click', () => {
      location.hash = el.getAttribute('data-sheet');
      if(window.innerWidth <= 860) document.getElementById('sidebar').classList.remove('open');
    });
  });
}

/* ---------------------------------------------------------------- */
/* Canvas / routing                                                 */
/* ---------------------------------------------------------------- */

function currentSheet(){
  const id = location.hash.replace('#','') || SHEETS[0].id;
  return SHEETS.find(s => s.id === id) || SHEETS[0];
}

function renderSheet(){
  const sheet = currentSheet();
  document.getElementById('canvas').innerHTML = `<div class="canvas-inner">${sheet.render()}</div>`;
  document.getElementById('canvas').scrollTop = 0;
  document.getElementById('context-current').textContent = sheet.group + ' / ' + sheet.navLabel;
  document.title = sheet.navLabel + ' · Salesforce Architect Workspace';

  document.getElementById('canvas').querySelectorAll('input[type=checkbox][data-item]').forEach(cb => {
    cb.addEventListener('change', () => {
      toggleChecked(cb.getAttribute('data-item'), cb.checked);
      renderSheet();
      renderSidebar(sheet.id);
    });
  });

  const bookmarkBtn = document.getElementById('bookmark-btn');
  bookmarkBtn.classList.toggle('active', bookmarks.has(sheet.id));

  loadNotes(sheet.id);
  renderSidebar(sheet.id);
}

window.addEventListener('hashchange', renderSheet);

/* ---------------------------------------------------------------- */
/* Bookmarks                                                        */
/* ---------------------------------------------------------------- */

document.getElementById('bookmark-btn').addEventListener('click', () => {
  const sheet = currentSheet();
  if(bookmarks.has(sheet.id)) bookmarks.delete(sheet.id); else bookmarks.add(sheet.id);
  lsSet(LS_BOOKMARKS, Array.from(bookmarks));
  renderSheet();
});

/* ---------------------------------------------------------------- */
/* Study desk                                                       */
/* ---------------------------------------------------------------- */

function loadNotes(sheetId){
  const notes = lsGet(LS_NOTES_PREFIX + sheetId, '');
  document.getElementById('desk-notes').value = notes;
}

document.getElementById('desk-notes').addEventListener('input', (e) => {
  lsSet(LS_NOTES_PREFIX + currentSheet().id, e.target.value);
});

const deskCollapsed = lsGet(LS_DESK_COLLAPSED, false);
if(deskCollapsed) document.getElementById('study-desk').classList.add('collapsed');
document.getElementById('desk-head').addEventListener('click', (e) => {
  if(e.target.id === 'desk-notes') return;
  const desk = document.getElementById('study-desk');
  desk.classList.toggle('collapsed');
  lsSet(LS_DESK_COLLAPSED, desk.classList.contains('collapsed'));
});

/* ---------------------------------------------------------------- */
/* Search (Ctrl/Cmd+K)                                              */
/* ---------------------------------------------------------------- */

const overlay = document.getElementById('search-overlay');
const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');
let searchIndex = -1;

function openSearch(){
  overlay.classList.add('open');
  searchInput.value = '';
  renderSearchResults('');
  setTimeout(() => searchInput.focus(), 0);
}
function closeSearch(){
  overlay.classList.remove('open');
}
function renderSearchResults(query){
  const q = query.trim().toLowerCase();
  const matches = SHEETS.filter(s => !q || s.navLabel.toLowerCase().includes(q) || s.group.toLowerCase().includes(q));
  searchIndex = matches.length ? 0 : -1;
  if(!matches.length){
    searchResults.innerHTML = `<div class="search-empty">No sheets match "${query}".</div>`;
    return;
  }
  searchResults.innerHTML = matches.map((s, i) => `
    <div class="search-result${i === 0 ? ' active' : ''}" data-sheet="${s.id}">
      <span>${s.navLabel}</span><span class="sr-group">${s.group}</span>
    </div>
  `).join('');
  searchResults.querySelectorAll('.search-result').forEach(el => {
    el.addEventListener('click', () => {
      location.hash = el.getAttribute('data-sheet');
      closeSearch();
    });
  });
}

document.getElementById('search-btn').addEventListener('click', openSearch);
searchInput.addEventListener('input', (e) => renderSearchResults(e.target.value));
overlay.addEventListener('click', (e) => { if(e.target === overlay) closeSearch(); });

document.addEventListener('keydown', (e) => {
  if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k'){
    e.preventDefault();
    overlay.classList.contains('open') ? closeSearch() : openSearch();
    return;
  }
  if(!overlay.classList.contains('open')) return;
  const results = Array.from(searchResults.querySelectorAll('.search-result'));
  if(e.key === 'Escape'){ closeSearch(); }
  else if(e.key === 'ArrowDown'){
    e.preventDefault();
    if(!results.length) return;
    searchIndex = Math.min(searchIndex + 1, results.length - 1);
    results.forEach((r,i) => r.classList.toggle('active', i === searchIndex));
    results[searchIndex].scrollIntoView({block:'nearest'});
  }else if(e.key === 'ArrowUp'){
    e.preventDefault();
    if(!results.length) return;
    searchIndex = Math.max(searchIndex - 1, 0);
    results.forEach((r,i) => r.classList.toggle('active', i === searchIndex));
    results[searchIndex].scrollIntoView({block:'nearest'});
  }else if(e.key === 'Enter'){
    if(results[searchIndex]){
      location.hash = results[searchIndex].getAttribute('data-sheet');
      closeSearch();
    }
  }
});

/* ---------------------------------------------------------------- */
/* Mobile nav toggle                                                */
/* ---------------------------------------------------------------- */

document.getElementById('nav-toggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});

/* ---------------------------------------------------------------- */
/* Boot                                                              */
/* ---------------------------------------------------------------- */

renderSheet();

})();
