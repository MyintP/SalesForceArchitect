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
let quizAnswers = lsGet('sfaw-quiz-answers', {});
let quizFilter = 'all';

function isChecked(id){ return !!checked[id]; }
function toggleChecked(id, val){
  checked[id] = val;
  lsSet(LS_CHECKED, checked);
}

/* ---------------------------------------------------------------- */
/* Content helpers                                                  */
/* ---------------------------------------------------------------- */

function itemRow(id, title, note, tag, url){
  const c = isChecked(id);
  return `<div class="item-row">
    <input type="checkbox" id="cb-${id}" data-item="${id}" ${c ? 'checked' : ''}>
    <div class="item-text">
      <p class="item-title${c ? ' checked' : ''}">${title}</p>
      <p class="item-note">${note}${url ? ` — <a href="${url}" target="_blank" rel="noopener" class="item-link">Trailhead page &#8599;</a>` : ''}</p>
    </div>
    ${tag ? `<span class="item-tag">${tag}</span>` : ''}
  </div>`;
}

function kad(icon, title, desc){
  return `<div class="kad-card"><span class="k-icon">${icon}</span><b>${title}</b><span>${desc}</span></div>`;
}

function quizSummaryTile(){
  const total = QUIZ_BANK.length;
  const attempted = QUIZ_BANK.filter(q => quizAnswers[q.id] !== undefined).length;
  const correct = QUIZ_BANK.filter(q => quizAnswers[q.id] === q.correct).length;
  const pct = total ? Math.round((correct / total) * 100) : 0;
  const circumference = 138.2;
  const offset = circumference - (pct / 100) * circumference;
  const subtext = attempted
    ? `${correct} / ${attempted} attempted correct &middot; ${total - attempted} left to try`
    : `${total} questions, not started yet`;
  return `<div class="progress-summary quiz-summary-tile">
    <svg class="progress-ring" viewBox="0 0 56 56">
      <circle cx="28" cy="28" r="22" fill="none" stroke="#E2E6EF" stroke-width="5"></circle>
      <circle cx="28" cy="28" r="22" fill="none" stroke="#0176D3" stroke-width="5"
        stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" stroke-linecap="round"
        transform="rotate(-90 28 28)"></circle>
    </svg>
    <div>
      <p class="p-label">Quiz score</p>
      <p class="p-count">${correct} / ${total} correct &middot; ${pct}%</p>
      <p class="quiz-summary-sub">${subtext}</p>
    </div>
    <a href="#quiz" class="quiz-summary-link">Open Quiz Bank &#8594;</a>
  </div>`;
}

function quizQuestionHtml(q, num){
  const answered = quizAnswers[q.id];
  const isAnswered = answered !== undefined;
  const choicesHtml = q.choices.map((c, idx) => {
    let cls = '';
    if(isAnswered){
      if(idx === q.correct) cls = ' correct';
      else if(idx === answered) cls = ' incorrect';
    }
    return `<label class="quiz-choice${cls}">
      <input type="radio" name="${q.id}" value="${idx}" data-qid="${q.id}" ${answered === idx ? 'checked' : ''} ${isAnswered ? 'disabled' : ''}>
      <span>${c}</span>
    </label>`;
  }).join('');
  const explainHtml = isAnswered
    ? `<p class="quiz-explain${answered === q.correct ? ' right' : ' wrong'}">${answered === q.correct ? '✓ Correct — ' : '✗ Not quite — '}${q.explain}</p>`
    : '';
  return `<div class="quiz-q">
    <p class="quiz-domain-tag">${DOMAIN_LABELS[q.domain]}</p>
    <p class="quiz-question-text">${num}. ${q.q}</p>
    <div class="quiz-choices">${choicesHtml}</div>
    ${explainHtml}
  </div>`;
}

function resourceItem(title, desc, url, label){
  return `<li>
    <p class="r-title">${title}</p>
    <p class="r-desc">${desc}</p>
    <a href="${url}" target="_blank" rel="noopener">${label || 'Open'} &#8599;</a>
  </li>`;
}

function scenario(num, title, setup, prompt, considerations, modelAnswer, rubricItems){
  return `
    <div class="scenario-card">
      <p class="scenario-num">SCENARIO ${num}</p>
      <h3 class="scenario-title">${title}</h3>
      <p class="body-text">${setup}</p>
      <div class="scenario-prompt"><b>Your call —</b> ${prompt}</div>
      <ul class="plain-list">
        ${considerations.map(c => `<li>${c}</li>`).join('')}
      </ul>
      <details class="reveal">
        <summary>Reveal model approach &amp; self-score rubric</summary>
        <div class="reveal-body">
          <p class="body-text">${modelAnswer}</p>
          <p class="rubric-label">Score your answer — did you cover:</p>
          ${rubricItems.map(it => itemRow(it.id, it.title, it.note || '')).join('')}
        </div>
      </details>
    </div>
  `;
}

/* ---------------------------------------------------------------- */
/* Quiz bank                                                        */
/* ---------------------------------------------------------------- */

const DOMAIN_LABELS = {
  role: 'The Role', foundations: 'Platform Foundations', automation: 'Automation',
  apex: 'Apex', lwc: 'Lightning Web Components', 'data-architecture': 'Data Architecture',
  'sharing-visibility': 'Sharing & Visibility', integration: 'Integration',
  iam: 'Identity & Access Mgmt', governance: 'Multi-Cloud & Governance',
  'dev-lifecycle': 'Dev Lifecycle & Deployment', agentic: 'Agentic Enterprise',
  certification: 'Certification Path',
};

const QUIZ_BANK = [
  {id:'q-role-1', domain:'role', q:'Which architect tier is primarily responsible for cross-org, cross-cloud, cross-platform strategy?', choices:['Application Architect','System Architect','Enterprise / Technical Architect','Platform App Builder'], correct:2, explain:'Application Architect stays inside one org (data, sharing, UI); System Architect covers integration and identity across systems; Enterprise/Technical Architect — the tier CTA sits at — owns cross-org, cross-cloud, cross-platform strategy.'},
  {id:'q-role-2', domain:'role', q:'A stakeholder asks for a feature buildable with either a validation rule or a trigger. What should you evaluate first?', choices:['Whichever the developer prefers','Whether declarative tools can satisfy the requirement cleanly','Whether Apex looks better in documentation','Whether it can be built fastest regardless of tool'], correct:1, explain:'Default to declarative; only escalate to code when the requirement genuinely needs something declarative tools can’t express cleanly.'},
  {id:'q-role-3', domain:'role', q:'What is the primary skill a CTA review board is actually scoring?', choices:['Memorised governor limits','Typing speed in Apex','Trade-off judgement under ambiguity, defended live','Familiarity with every AppExchange package'], correct:2, explain:'The board hands you an ambiguous scenario and watches how you reason and defend a design under cross-examination — not whether you recite facts.'},

  {id:'q-fnd-1', domain:'foundations', q:'Which relationship type causes the child record to inherit the parent’s security and be deleted along with the parent?', choices:['Lookup','Master-detail','Many-to-many junction on lookups','Hierarchical'], correct:1, explain:'Master-detail is the tight relationship: security and lifecycle both cascade from parent to child, and it’s also what powers roll-up summary fields.'},
  {id:'q-fnd-2', domain:'foundations', q:'What is the most restrictive Organization-Wide Default setting for a standard object?', choices:['Public Read/Write','Public Read Only','Private','Controlled by Parent'], correct:2, explain:'Private grants access only to the owner (and up the role hierarchy) by default — the tightest starting posture.'},
  {id:'q-fnd-3', domain:'foundations', q:'Which security layer controls whether a user can see one specific field, independent of object access?', choices:['Organization-Wide Defaults','Field-Level Security','Sharing rules','Role hierarchy'], correct:1, explain:'Field-Level Security (via profiles/permission sets) is layered independently on top of object- and record-level security.'},
  {id:'q-fnd-4', domain:'foundations', q:'How do you model a many-to-many relationship between two objects?', choices:['A single lookup field','A junction object with two master-detail relationships','A formula field','A role hierarchy branch'], correct:1, explain:'A junction object — two master-detail relationships, one to each side — is the standard many-to-many pattern.'},

  {id:'q-auto-1', domain:'automation', q:'Which Flow type is designed for guided, multi-step user input?', choices:['Scheduled Flow','Screen Flow','Autolaunched Flow','Record-Triggered Flow'], correct:1, explain:'Screen Flows walk a user through a wizard-style sequence of input screens.'},
  {id:'q-auto-2', domain:'automation', q:'A before-save record-triggered flow can do which of the following?', choices:['Send an outbound email','Create a related record','Update a field on the triggering record with no extra DML','Call an external REST API'], correct:2, explain:'Before-save flows update the triggering record’s own fields in-memory, before the save — no extra DML, and fast. Related-record creation, callouts, and emails need after-save (or Apex/async).'},
  {id:'q-auto-3', domain:'automation', q:'What is the actual decision rule for choosing Apex over Flow?', choices:['Apex is always more "senior" so prefer it','Only when Flow genuinely can’t express the logic cleanly (complex recursion, sync callouts, unmanageable branching)','Whenever the requirement mentions an object','Whenever there is more than one screen involved'], correct:1, explain:'Default to Flow; escalate to Apex only when there’s a concrete, nameable reason Flow can’t cleanly do the job.'},

  {id:'q-apex-1', domain:'apex', q:'What is the maximum number of SOQL queries allowed in a single synchronous Apex transaction?', choices:['50','100','150','200'], correct:1, explain:'100 SOQL queries synchronous (200 async) — one of the limits that shapes bulkification discipline.'},
  {id:'q-apex-2', domain:'apex', q:'What is the maximum number of DML statements allowed in a single Apex transaction?', choices:['100','150','200','50'], correct:1, explain:'150 DML statements per transaction — regardless of sync or async context.'},
  {id:'q-apex-3', domain:'apex', q:'What is the single most common root cause of governor-limit exceptions in Apex?', choices:['Using too many custom objects','A SOQL query or DML statement placed inside a loop','Using Lightning Web Components','Long variable names'], correct:1, explain:'Querying or writing once per record in a loop burns through the per-transaction limits at exactly the point bulk operations (data loads, API batches) send 200 records at once.'},
  {id:'q-apex-4', domain:'apex', q:'Which async Apex tool is chainable, trackable by Id, and takes typed parameters?', choices:['@future method','Queueable Apex','Batch Apex','Scheduled Apex'], correct:1, explain:'Queueable Apex supports chaining (one job enqueues the next), typed constructor parameters, and job-Id tracking — @future supports none of these.'},
  {id:'q-apex-5', domain:'apex', q:'Which tool is purpose-built for processing millions of records in scoped chunks?', choices:['@future method','Queueable Apex','Batch Apex','A record-triggered Flow'], correct:2, explain:'Batch Apex’s start/execute/finish model is designed exactly for large-volume, chunked processing.'},

  {id:'q-lwc-1', domain:'lwc', q:'Which decorator marks a property public so a parent component can pass data down to a child?', choices:['@track','@api','@wire','@public'], correct:1, explain:'@api exposes a property or method publicly for parent-to-child (or method-call) access.'},
  {id:'q-lwc-2', domain:'lwc', q:'Which decorator reactively binds a component property to an Apex method or platform data source?', choices:['@api','@track','@wire','@reactive'], correct:2, explain:'@wire binds to a reactive data source; the component re-renders automatically when the underlying data changes.'},
  {id:'q-lwc-3', domain:'lwc', q:'For simple record CRUD, which approach gives you client-side caching for free?', choices:['A custom Apex controller called imperatively','Lightning Data Service (via getRecord/updateRecord)','A Visualforce remoting call','A scheduled Flow'], correct:1, explain:'Lightning Data Service caches records client-side and shares that cache across components — a custom Apex round-trip throws that away.'},
  {id:'q-lwc-4', domain:'lwc', q:'Since Spring ‘20, is @track required for a component to re-render when a simple property is reassigned?', choices:['Yes, always required', 'No — simple field reassignment is reactive automatically', 'Only for arrays', 'Only inside Aura components'], correct:1, explain:'The framework tracks simple reassignment automatically now; @track is only relevant for deeper mutation tracking on objects/arrays.'},

  {id:'q-data-1', domain:'data-architecture', q:'What is a "skinny table" in a Salesforce data-architecture context?', choices:['A custom object with fewer fields','A Salesforce-managed denormalised copy of select fields, used to speed up wide queries','A Big Object variant','A sandbox with reduced data'], correct:1, explain:'Skinny tables are requested through Salesforce support and used when standard indexing isn’t enough for queries joining across many fields.'},
  {id:'q-data-2', domain:'data-architecture', q:'What is a Big Object best suited for?', choices:['Frequently updated transactional records','Billions of immutable, audit/history-style records queried by a known key','Real-time dashboards','Small reference/lookup data'], correct:1, explain:'Big Objects trade ad hoc query flexibility for massive scale on immutable, key-based data.'},
  {id:'q-data-3', domain:'data-architecture', q:'What makes a SOQL query "selective"?', choices:['It uses a SELECT *','It can use an index to avoid scanning the full table','It returns fewer than 10 fields','It filters on a formula field'], correct:1, explain:'Selectivity is about whether the query planner can use an index — not about field count or syntax style.'},

  {id:'q-sv-1', domain:'sharing-visibility', q:'What should you always name first when describing a sharing/visibility design?', choices:['The sharing rule that grants the most access','The Organization-Wide Default','The role hierarchy depth','The Apex managed sharing reason'], correct:1, explain:'OWD is the ceiling everything else widens from — stating it first is the review-board tell of a strong answer.'},
  {id:'q-sv-2', domain:'sharing-visibility', q:'Which mechanism should be the last resort for visibility logic, reached for only when a criteria-based rule can’t express it?', choices:['Role hierarchy','Owner-based sharing rule','Apex managed sharing','Public Read Only OWD'], correct:2, explain:'Apex managed sharing is the most powerful and the hardest to review/maintain — reach for it last, not first.'},
  {id:'q-sv-3', domain:'sharing-visibility', q:'Which mechanism grants access automatically up a management chain?', choices:['Sharing rule','Role hierarchy','Manual sharing','Restriction rule'], correct:1, explain:'Role hierarchy is the free, coarse mechanism for "my manager can see my records" — it doesn’t fit every requirement.'},

  {id:'q-int-1', domain:'integration', q:'What does a Named Credential do?', choices:['Stores a user’s Salesforce password','Bundles an external endpoint and its authentication so Apex never handles raw tokens','Defines an Apex trigger’s execution order','Configures a sandbox refresh schedule'], correct:1, explain:'Named Credentials keep endpoint URLs and auth details out of Apex code, managed centrally instead.'},
  {id:'q-int-2', domain:'integration', q:'Why do Platform Events decouple integration compared to a direct REST callout?', choices:['They are faster per-call','A publisher fires an event and moves on; subscribers process independently without blocking the publisher','They don’t count against any limits','They replace the need for authentication'], correct:1, explain:'The publish/subscribe model means a slow or failing subscriber doesn’t block the publisher’s transaction — unlike a synchronous callout.'},
  {id:'q-int-3', domain:'integration', q:'Which API is purpose-built for moving millions of records rather than one record at a time?', choices:['Standard REST API','Bulk API','Streaming API','Metadata API'], correct:1, explain:'Bulk API is async and chunked, designed for large-volume data movement; standard REST API is built for per-record traffic.'},

  {id:'q-iam-1', domain:'iam', q:'Which OAuth flow fits a server-to-server integration with no human present?', choices:['Web Server Flow','JWT Bearer Flow','Device Flow','Username-Password Flow (legacy)'], correct:1, explain:'JWT Bearer Flow uses a pre-registered certificate to prove identity without any user interaction — the standard fit for scheduled, unattended integrations.'},
  {id:'q-iam-2', domain:'iam', q:'What does Just-in-Time (JIT) provisioning do?', choices:['Pre-creates every possible user account overnight','Auto-creates or updates the Salesforce user record on first federated login','Grants temporary admin access for support tickets','Provisions a new sandbox on demand'], correct:1, explain:'JIT provisioning means accounts don’t need to be pre-created by an admin — the IdP-asserted attributes create/update the user at login time.'},
  {id:'q-iam-3', domain:'iam', q:'What does a Connected App primarily define?', choices:['A user’s MFA method','The callback URL, OAuth scopes, and (for JWT) trusted certificate for an external system','The org’s sandbox refresh cadence','A sharing rule template'], correct:1, explain:'A Connected App is the registration record that governs how an external system authenticates against and is scoped within the org.'},

  {id:'q-gov-1', domain:'governance', q:'Which objects most commonly cause governance disputes when Sales, Service, and Experience Cloud share one org?', choices:['Campaign and Lead','Account and Contact','Report and Dashboard','Profile and Permission Set'], correct:1, explain:'Account and Contact sit under all three clouds, so competing automation/ownership claims collide there first.'},
  {id:'q-gov-2', domain:'governance', q:'What artefact is recommended for recording who owns a shared object and why?', choices:['A page layout','An Architecture Decision Record (ADR)','A permission set','A validation rule'], correct:1, explain:'An ADR captures the decision, the alternatives considered, and the condition that would invalidate it — exactly what a cross-team ownership dispute needs on record.'},

  {id:'q-dl-1', domain:'dev-lifecycle', q:'Which sandbox type includes a full copy of production data and refreshes roughly every 29 days?', choices:['Developer','Developer Pro','Partial Copy','Full'], correct:3, explain:'Full sandboxes mirror production data and metadata; the long refresh cycle makes them fit for staging/UAT, not daily development.'},
  {id:'q-dl-2', domain:'dev-lifecycle', q:'In source-driven development, what is the source of truth?', choices:['The production org','Version-controlled metadata (e.g. via Salesforce CLI)','A change set','The most recently refreshed sandbox'], correct:1, explain:'The modern model inverts the older org-as-source-of-truth pattern: Git holds the source of truth, and orgs become disposable deployment targets.'},
  {id:'q-dl-3', domain:'dev-lifecycle', q:'Which sandbox type is best suited to daily individual development and unit testing?', choices:['Full','Partial Copy','Developer / Developer Pro','Production itself'], correct:2, explain:'Developer/Developer Pro sandboxes are metadata-only and refresh quickly, matching a fast individual build-and-test loop.'},

  {id:'q-ag-1', domain:'agentic', q:'What permission scope does an Agentforce agent typically operate under?', choices:['A special super-admin scope reserved for agents','The permissions of the running user it acts on behalf of','Unrestricted access to all org data','Whatever scope is hardcoded in the agent prompt'], correct:1, explain:'Agents call the same declarative/programmatic building blocks as any other automation and inherit the running user’s permissions — the existing sharing model still applies.'},
  {id:'q-ag-2', domain:'agentic', q:'Beyond scope and data grounding, what is the third key design question for an agent action?', choices:['What font the agent’s UI uses','Escalation — when the agent hands off to a human','How many Trailhead badges it has earned','Which Sandbox it was built in'], correct:1, explain:'Knowing when an agent should stop and hand off to a human is as much a design decision as what it’s allowed to touch.'},

  {id:'q-cert-1', domain:'certification', q:'What distinguishes the Certified Technical Architect (CTA) exam from other Salesforce certifications?', choices:['It’s entirely multiple-choice','It’s a live review board: a hands-on design exercise followed by a panel presentation and cross-examination','It has no prerequisites at all','It can be completed anonymously online with no interaction'], correct:1, explain:'CTA is scored across multiple domains at once by a panel that actively probes your design’s trade-offs — technically correct but poorly defended still fails.'},
  {id:'q-cert-2', domain:'certification', q:'Which certification does nearly every architect path assume as the foundation?', choices:['Certified Technical Architect','Administrator (ADM-201)','Platform Developer II','Identity and Access Management Designer'], correct:1, explain:'Administrator is the near-universal starting credential every later path builds from.'},
];

/* ---------------------------------------------------------------- */
/* Sheet definitions                                                */
/* ---------------------------------------------------------------- */

const SHEETS = [
  {
    id: 'start', group: 'Get Started', navLabel: 'Start',
    eyebrow: '00 · Orientation',
    title: 'Zero to hero: Salesforce Architect',
    lede: 'A complete path from platform basics to Certified Technical Architect. Built from the official Trailhead architect trail and cross-referenced against Salesforce Dictionary, then filled out with the domains a real exam or review board actually probes — Apex, LWC, data architecture at scale, sharing design, identity, DevOps, and hands-on scenario practice.',
    items: [],
    render(){
      return `
        ${sheetHeader(this)}
        <div class="kad-strip">
          ${kad('📖', 'Learn', 'Twelve domains, foundations through the agentic-AI module — the mechanics an architect is assumed to already know.')}
          ${kad('🔧', 'Practice', 'Connected Case scenarios and an Artefact Studio — decide first, then check your reasoning against a model answer and rubric.')}
          ${kad('🏅', 'Certify', 'Layer credentials — Administrator through Certified Technical Architect — as each domain solidifies.')}
        </div>
        ${quizSummaryTile()}
        <h2 class="section-h">How this site and Trailhead work together</h2>
        <p class="body-text">This workspace does not replace <a href="https://trailhead.salesforce.com/today" target="_blank" rel="noopener">Trailhead</a> — it can't. Trailhead is the system of record: it issues the badges, holds the points and rank, hosts the hands-on orgs, and is where every certification is actually booked and sat. Nothing here duplicates that.</p>
        <table class="division-table">
          <tr><td><b>Trailhead does</b></td><td>Hands-on modules, badges, points/rank, trailmixes, official exam guides, exam registration and delivery.</td></tr>
          <tr><td><b>This site does</b></td><td>The synthesis layer Trailhead doesn't: one page per domain explaining the "so what," a scored quiz bank, decide-then-reveal scenario practice, an artefact-writing studio, and a single tracker across all of it.</td></tr>
        </table>
        <p class="body-text">Practically: read a sheet here first for the shape of the domain, do the linked Trailhead module for the hands-on depth and the badge, then come back and prove it stuck in the Quiz Bank or a Connected Case scenario. Certification Track items link straight to each credential's official Trailhead page — book and sit every exam there.</p>
        <h2 class="section-h">How to use this workspace</h2>
        <ol class="step-list">
          <li>Work the left-hand map top to bottom — each sheet builds on the last.</li>
          <li>Check items off as you complete them; the <b>Progress</b> sheet tracks completion across the whole path.</li>
          <li>When you reach <b>Practice</b>, decide before you reveal — the model answer is only useful after you've committed to a call.</li>
          <li>Star any sheet with <b>Bookmark</b> to pin it to the review queue.</li>
          <li>Use <b>Search</b> (Ctrl/Cmd+K) to jump straight to a sheet by name.</li>
          <li>Keep running notes per sheet in the Study Desk below — it remembers a separate note for each one.</li>
        </ol>
        <div class="callout">
          <b>Source material —</b> this roadmap is built from Trailhead's official <a href="https://trailhead.salesforce.com/content/learn/trails/salesforce-architect-careers" target="_blank" rel="noopener">"Build Your Architect Career on Salesforce"</a> trail, cross-referenced against <a href="https://salesforcedictionary.com/dashboard" target="_blank" rel="noopener">Salesforce Dictionary</a>'s certification and learning resources, and extended to cover every domain the Architect Journey and CTA review board actually test.
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
      return `${sheetHeader(this)}${sheetMeta('~20 min · +100 pts')}
        <h2 class="section-h">What the role actually does</h2>
        <p class="body-text">A Salesforce Architect is not "the best admin" or "the senior developer." The job is deciding <i>how</i> a business requirement should be built on the platform — declarative or programmatic, one org or several, real-time integration or batch — and then defending that decision to stakeholders who each have a narrower, conflicting view of what's right. Three architect tiers exist in practice: <b>Application Architect</b> (data model, sharing, UI, and process inside one org), <b>System Architect</b> (integration, identity, and multi-system topology), and <b>Enterprise/Technical Architect</b> (cross-org, cross-cloud, cross-platform strategy — where CTA sits).</p>
        <p class="body-text">Day to day, that means: reviewing a proposed data model before anyone builds it; saying no to a well-intentioned but unbulkified trigger; drawing the line between "configure this" and "write code for this"; and writing the one-page document that a build team can execute against without asking you ten follow-up questions. The skill being tested is judgment under ambiguity, not platform trivia.</p>
        <h2 class="section-h">Suggested reading</h2>
        ${itemList(this)}
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
      {id:'f3', title:'Security & sharing model — the basics', note:'Profiles, permission sets, org-wide defaults, sharing rules. Deepens later in Sharing & Visibility Design.', tag:'~2h'},
    ],
    render(){
      return `${sheetHeader(this)}${sheetMeta('~5.5 h')}
        <h2 class="section-h">The org, in one paragraph</h2>
        <p class="body-text">An <b>org</b> is one isolated tenant of the platform — its own data, metadata, and configuration. Everything you build lives as <b>objects</b> (tables), which have <b>fields</b> (columns) and hold <b>records</b> (rows). Standard objects (Account, Contact, Opportunity, Case) ship with the platform; <b>custom objects</b> (suffixed <code>__c</code>) are ones you define. Relationships between objects come in two flavours: <b>lookup</b> (loose — child can exist without a parent, no cascade delete by default) and <b>master-detail</b> (tight — child inherits the parent's security and is deleted with it; also the mechanism behind roll-up summary fields). A <b>junction object</b> — two master-detail relationships on one object — is how you model many-to-many.</p>
        <h2 class="section-h">The security model, in one paragraph</h2>
        <p class="body-text"><b>Object-level security</b> (can this user see the object at all) is set by <b>profiles</b> and <b>permission sets</b> — profile is the one mandatory baseline per user, permission sets are the stackable additions on top. <b>Record-level security</b> starts with <b>Organization-Wide Defaults (OWD)</b> — the maximum-restrictive baseline per object (Private, Public Read Only, Public Read/Write, or Controlled by Parent) — and is then <i>opened up</i> by role hierarchy, sharing rules, or manual sharing. <b>Field-level security</b> (can this user see this specific field) is layered independently on top of both. The exam-and-review-board habit to build now: state OWD first, every time, before naming any mechanism that widens access.</p>
        ${itemList(this)}`;
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
      return `${sheetHeader(this)}${sheetMeta('~2.5 h')}
        <h2 class="section-h">Flow, in one paragraph</h2>
        <p class="body-text">Flow is the platform's declarative process engine. <b>Screen Flows</b> collect input across guided steps (a wizard). <b>Record-Triggered Flows</b> fire on create/update/delete of a record, before-save (fast, same-transaction field updates, no DML needed) or after-save (can create related records, send emails, call sub-flows). <b>Scheduled</b> and <b>Autolaunched</b> flows run on a timer or are invoked from elsewhere (Apex, another flow, a Platform Event). Order of execution matters: before-save flows run alongside before-triggers; after-save flows and after-triggers run afterward — mixing declarative and programmatic automation on the same object without knowing this ordering is a common source of "why did this run twice" bugs.</p>
        <h2 class="section-h">Flow vs Apex — the actual decision rule</h2>
        <p class="body-text">Default to Flow. Reach for Apex only when the requirement needs something Flow genuinely can't do cleanly: complex recursive logic, calling an external API synchronously within a transaction, bulk processing beyond what Flow's loop elements handle efficiently, or logic so branching that a flow diagram becomes unreadable and unmaintainable. The architect's job is naming <i>which</i> of those triggers applies — "it's complicated" is not a justification a reviewer accepts.</p>
        ${itemList(this)}`;
    }
  },
  {
    id: 'apex', group: 'Foundations', navLabel: 'Apex & Programmatic Architecture',
    eyebrow: '04 · Foundations',
    title: 'Apex & programmatic architecture',
    lede: "An architect doesn't need to live in code, but has to judge it: bulkification, limits, and when programmatic is the right call at all.",
    items: [
      {id:'ax1', title:'Apex fundamentals', note:'Classes, triggers, collections, SOQL/SOSL basics.', tag:'~2h'},
      {id:'ax2', title:'Governor limits', note:'The constraint set that shapes every design decision on the platform — SOQL/DML limits, heap size, CPU time.', tag:'~1h'},
      {id:'ax3', title:'Trigger framework pattern', note:'One trigger per object, delegated to a handler class — why this is the default recommendation, not a style preference.', tag:'~1h'},
      {id:'ax4', title:'Bulkification discipline', note:'Why loops with SOQL/DML inside them are the single most common review-board failure mode.', tag:'~45m'},
      {id:'ax5', title:'Async Apex patterns', note:'Future methods vs Queueable vs Batch vs Scheduled — matching the tool to volume and latency needs.', tag:'~1.5h'},
      {id:'ax6', title:'Testing discipline', note:'Test classes, meaningful assertions vs coverage theatre, mocking with Test.isRunningTest().', tag:'~1h'},
    ],
    render(){
      return `${sheetHeader(this)}${sheetMeta('~7 h')}
        <h2 class="section-h">Governor limits that actually matter</h2>
        <p class="body-text">Every Apex transaction runs inside a sandbox of hard limits, reset per transaction. The ones that shape design decisions: <b>100 SOQL queries</b> per synchronous transaction (200 async), <b>150 DML statements</b>, <b>50,000 records</b> retrieved by SOQL in one transaction, <b>10 seconds</b> of CPU time synchronous (60 seconds async), and <b>6MB heap</b> synchronous (12MB async). None of these are "raise a ticket" limits — they're per-transaction and non-negotiable. Every one of them is hit by the same root cause: a SOQL query or DML statement sitting inside a loop.</p>
        <h2 class="section-h">Bulkification, concretely</h2>
        <p class="body-text">Salesforce can invoke a trigger with up to 200 records in one context (a bulk data load, an API batch update). Code that queries or writes once per record — <code>for(Account a : accs){ update a; }</code> — burns through the DML limit at 150 records and fails outright, even though it "worked" in every manual test with one record. The fix is always the same shape: collect into a list, then one <code>update accountList;</code> after the loop. This single pattern is the most common review-board and code-review failure, and the fastest credibility signal an architect can give by catching it in someone else's pull request.</p>
        <h2 class="section-h">Async Apex — which tool, when</h2>
        <ul class="plain-list">
          <li><b>@future</b> — fire-and-forget, no chaining, no job monitoring. Legacy; Queueable has mostly replaced it.</li>
          <li><b>Queueable</b> — chainable (one job can enqueue the next), takes typed parameters, trackable via Id. Default choice for "do this async."</li>
          <li><b>Batch Apex</b> — processes millions of records in scoped chunks (start/execute/finish); the tool for large-volume data jobs.</li>
          <li><b>Scheduled Apex</b> — cron-based, typically kicks off a Batch job on a timer.</li>
        </ul>
        ${itemList(this)}
        <div class="callout">
          <b>The architect's job here isn't to write it —</b> it's to know when Apex is the right call over Flow, and to review someone else's Apex for the limits and bulkification mistakes that don't show up until production load.
        </div>`;
    }
  },
  {
    id: 'lwc', group: 'Foundations', navLabel: 'Lightning Web Components',
    eyebrow: '05 · Foundations',
    title: 'Lightning Web Components architecture',
    lede: 'The modern UI layer — explicitly named in most Salesforce architect job descriptions alongside Apex and Flow.',
    items: [
      {id:'lw1', title:'LWC component model', note:'Standard web components + Salesforce-specific decorators: @api, @track, @wire.', tag:'~1.5h'},
      {id:'lw2', title:'Wire service vs imperative Apex calls', note:'Reactive data binding vs on-demand calls — when each is appropriate.', tag:'~1h'},
      {id:'lw3', title:'LWC vs Aura vs Flow vs declarative', note:'The decision ladder — start declarative, escalate only when the requirement forces it.', tag:'~45m'},
      {id:'lw4', title:'Where components live', note:'Lightning App Builder pages, Experience Cloud sites, Flow screen components, utility bar.', tag:'~1h'},
      {id:'lw5', title:'Performance basics', note:'Client-side caching, Lightning Data Service, avoiding unnecessary Apex round-trips.', tag:'~45m'},
    ],
    render(){
      return `${sheetHeader(this)}${sheetMeta('~5 h')}
        <h2 class="section-h">Component anatomy</h2>
        <p class="body-text">An LWC is three files sharing a name: an HTML template, a JavaScript class, and metadata (<code>.js-meta.xml</code>) declaring where it's allowed to be placed (App Builder page, record page, Experience Cloud site, Flow screen). It's standard web-component technology underneath — no proprietary framework to learn beyond a handful of Salesforce-specific decorators.</p>
        <h2 class="section-h">The three decorators</h2>
        <ul class="plain-list">
          <li><b>@api</b> — marks a property or method public; this is how a parent component passes data down to a child.</li>
          <li><b>@track</b> — forces re-render on mutation of an object/array's internal fields. Rarely needed today: since Spring '20 the framework reactively tracks simple field reassignment automatically.</li>
          <li><b>@wire</b> — binds a component property to a reactive data source (an Apex method or a platform wire adapter like <code>getRecord</code>). The component re-renders automatically whenever the underlying data changes — no manual refresh call.</li>
        </ul>
        <p class="body-text">The architectural decision that matters more than any of the syntax: prefer <b>Lightning Data Service</b> (via <code>getRecord</code>/<code>updateRecord</code> wire adapters) over a custom Apex controller whenever you're just doing record CRUD. LDS gives you client-side caching and offline support for free; a custom Apex round-trip for every field read throws that away.</p>
        ${itemList(this)}`;
    }
  },
  {
    id: 'data-architecture', group: 'Architecture Domains', navLabel: 'Data Architecture & Management',
    eyebrow: '06 · Architecture Domains',
    title: 'Data architecture & management',
    lede: 'One of the five official Architect Journey domains. The questions here are about scale and lifecycle, not just schema.',
    items: [
      {id:'da1', title:'Large Data Volume (LDV) strategy', note:'Selective queries, indexing (standard and custom), skinny tables, when record counts start changing your design.', tag:'~1.5h'},
      {id:'da2', title:'Archiving & Big Objects', note:'What to keep queryable vs what to archive, and the platform-native tools for each.', tag:'~1h'},
      {id:'da3', title:'Master data & system-of-record decisions', note:'Which system owns the golden record when the same entity exists in Salesforce and elsewhere — the recurring enterprise-architecture question, Salesforce-flavoured.', tag:'~1h'},
      {id:'da4', title:'Data migration patterns', note:'Bulk API vs Data Loader vs ETL tooling; sequencing for referential integrity.', tag:'~1h'},
    ],
    render(){
      return `${sheetHeader(this)}${sheetMeta('~4.5 h · Architect Journey domain')}
        <h2 class="section-h">When "large" becomes a design constraint</h2>
        <p class="body-text">Salesforce calls it a <b>Large Data Volume (LDV)</b> concern once an object crosses roughly the low millions of records — the exact number matters less than the symptom: list views, reports, and SOQL queries that were instant at 10,000 records start timing out or scanning the whole table. A query is <b>selective</b> when it can use an index to avoid a full table scan; the platform auto-indexes Id, Name, OwnerId, and most lookup/master-detail fields, and you can add custom indexes on other fields you filter by often. <b>Skinny tables</b> (Salesforce-managed, requested via support) are a denormalised copy of a subset of fields, used when a query joins across many fields and standard indexing isn't enough.</p>
        <h2 class="section-h">Archiving & Big Objects</h2>
        <p class="body-text">Not everything needs to stay in the standard, fully-indexed, fully-queryable object forever. <b>Big Objects</b> are built for the other end of the scale — billions of records, immutable audit/history-style data, queried by indexed key rather than ad hoc filters. The design question an architect actually answers: does this data need to support arbitrary reporting (keep it in a standard object, manage volume actively), or just needs to be retrievable by a known key for compliance/history (move it to a Big Object or an external archive)?</p>
        ${itemList(this)}`;
    }
  },
  {
    id: 'sharing-visibility', group: 'Architecture Domains', navLabel: 'Sharing & Visibility Design',
    eyebrow: '07 · Architecture Domains',
    title: 'Sharing & visibility design',
    lede: 'Its own Architect Journey certification domain — "who can see what, and why" as a first-class design problem, not an afterthought.',
    items: [
      {id:'sv1', title:'OWD-first design discipline', note:'Start private, open deliberately — the default posture and why reviewers check for it first.', tag:'~30m'},
      {id:'sv2', title:'Role hierarchy vs sharing rules vs manual sharing', note:'The decision framework for which mechanism to reach for, and when stacking them creates unreviewable complexity.', tag:'~1.5h'},
      {id:'sv3', title:'Restriction rules & scoping rules', note:'Newer, more surgical visibility tools — when they replace a sharing-rule sprawl.', tag:'~45m'},
      {id:'sv4', title:'Territory management basics', note:'Visibility driven by account assignment rather than ownership.', tag:'~1h'},
      {id:'sv5', title:'Apex managed sharing', note:'The escape hatch for visibility logic too dynamic for declarative sharing — and why it should be rare, not default.', tag:'~1h'},
    ],
    render(){
      return `${sheetHeader(this)}${sheetMeta('~4.75 h · Architect Journey domain')}
        <h2 class="section-h">The four levers, in the order you reach for them</h2>
        <ol class="step-list">
          <li><b>Organization-Wide Defaults</b> — the ceiling. Set it to the most restrictive level the business can live with, always.</li>
          <li><b>Role hierarchy</b> — grants access upward through management chains automatically. Free, but coarse; only fits when "my manager can see my records" is actually the rule.</li>
          <li><b>Sharing rules</b> — owner-based ("everyone in Group X gets access to Owner Y's records") or criteria-based ("any record where Region = APAC"). The workhorse for most real requirements.</li>
          <li><b>Manual / Apex managed sharing</b> — one-off or fully programmatic. Manual sharing doesn't scale past a handful of ad hoc grants; Apex managed sharing is for visibility logic too dynamic for a criteria rule to express, and it's the hardest of the four to review, so it should be the last resort, not the first idea.</li>
        </ol>
        <p class="body-text">The review-board tell of a weak answer is naming a mechanism before naming the OWD. Always state the default-private posture first, then justify each widening step against a specific requirement.</p>
        ${itemList(this)}`;
    }
  },
  {
    id: 'integration', group: 'Architecture Domains', navLabel: 'Integration Architecture',
    eyebrow: '08 · Architecture Domains',
    title: 'Integration architecture',
    lede: 'The domain where prior enterprise architecture experience transfers most directly — this is mostly re-labelling, not re-learning.',
    items: [
      {id:'i1', title:'REST & SOAP APIs on the platform', note:'How Salesforce exposes and consumes web services.', tag:'~1h'},
      {id:'i2', title:'Platform Events & event-driven patterns', note:"The platform's take on event-driven architecture.", tag:'~1h'},
      {id:'i3', title:'External identity & SSO', note:'Maps closely to Entra ID / broader IAM background — deepens next in Identity & Access Management.', tag:'~1h'},
    ],
    render(){
      return `${sheetHeader(this)}${sheetMeta('~3 h · strength area · Architect Journey domain')}
        <h2 class="section-h">Inbound vs outbound, sync vs async</h2>
        <p class="body-text">Salesforce as the <b>caller</b> uses <b>Named Credentials</b> (endpoint + auth bundled, so Apex never handles raw tokens) to hit an external REST or SOAP API — synchronous, inside the same transaction, subject to the same limits as everything else. Salesforce as the <b>callee</b> exposes Apex REST/SOAP endpoints or standard REST API for external systems to call in. Both are synchronous and tightly coupled — the caller waits, and a slow or down endpoint on either side blocks the transaction.</p>
        <p class="body-text"><b>Platform Events</b> decouple that: a publisher fires an event and moves on; any number of subscribers (internal Apex triggers/flows, or external systems via the CometD-based streaming API) pick it up independently, on their own schedule, without blocking the publisher. <b>Change Data Capture</b> is the same subscribe model but auto-generated from record changes rather than an event you explicitly publish. For moving large volumes rather than individual events, the <b>Bulk API</b> (async, chunked, built for millions of records) replaces the standard REST API, which is built for one-record-at-a-time traffic.</p>
        ${itemList(this)}`;
    }
  },
  {
    id: 'iam', group: 'Architecture Domains', navLabel: 'Identity & Access Management',
    eyebrow: '09 · Architecture Domains',
    title: 'Identity & access management',
    lede: 'Its own Architect Journey domain, and the part of "external identity & SSO" a solution-architect conversation will actually drill into.',
    items: [
      {id:'iam1', title:'OAuth 2.0 flows on the platform', note:'Web server flow, JWT bearer flow, device flow — which fits server-to-server vs user-present scenarios.', tag:'~1.5h'},
      {id:'iam2', title:'Connected Apps & scopes', note:'Registering external systems, scoping what they can touch.', tag:'~1h'},
      {id:'iam3', title:'SSO & Just-in-Time provisioning', note:'Federating identity from an external IdP and auto-creating/updating users on login.', tag:'~1h'},
      {id:'iam4', title:'MFA & session security policies', note:'Login IP ranges, session timeout, high-assurance transactions.', tag:'~45m'},
      {id:'iam5', title:'Experience Cloud identity licensing', note:'Customer vs partner identity models and how they change the access design.', tag:'~1h'},
    ],
    render(){
      return `${sheetHeader(this)}${sheetMeta('~5.25 h · Architect Journey domain')}
        <h2 class="section-h">OAuth flows — matched to who's present</h2>
        <ul class="plain-list">
          <li><b>Web Server Flow</b> — a human is present in a browser; the standard "Login with Salesforce" redirect-and-callback pattern.</li>
          <li><b>JWT Bearer Flow</b> — no human present, server-to-server. A pre-registered certificate proves identity; used for scheduled integrations and system accounts.</li>
          <li><b>Device Flow</b> — no browser available on the device itself (a TV app, a CLI tool); the user authorises on a second device using a displayed code.</li>
        </ul>
        <p class="body-text">A <b>Connected App</b> is the registration record for any external system that authenticates against Salesforce — it defines the callback URL, the OAuth scopes granted, and (for JWT flows) the trusted certificate. <b>SSO</b> typically means Salesforce trusts an external Identity Provider via SAML or OpenID Connect; <b>Just-in-Time provisioning</b> auto-creates or updates the Salesforce user record on that first federated login, so accounts don't need to be pre-created by an admin. Session security (login IP ranges, MFA enforcement, session timeout, "high-assurance" step-up for sensitive actions) sits on top of all of this as a separate, stackable layer.</p>
        ${itemList(this)}`;
    }
  },
  {
    id: 'governance', group: 'Architecture Domains', navLabel: 'Multi-Cloud & Governance',
    eyebrow: '10 · Architecture Domains',
    title: 'Multi-cloud & governance',
    lede: 'How Sales, Service and Experience Cloud relate, and how architecture governance is actually exercised on-platform.',
    items: [
      {id:'g1', title:'Sales, Service & Experience Cloud overview', note:'What each cloud is for, at discussion-level fluency.', tag:'~1h'},
      {id:'g2', title:'Architecture governance on Salesforce', note:'Design reviews, quality gates, target-state roadmaps.', tag:'~1h'},
    ],
    render(){
      return `${sheetHeader(this)}${sheetMeta('~2 h')}
        <h2 class="section-h">Where the clouds overlap</h2>
        <p class="body-text"><b>Sales Cloud</b> is built around Lead → Opportunity → forecast. <b>Service Cloud</b> adds Case, Entitlements, and omni-channel routing on top of the same Account/Contact foundation. <b>Experience Cloud</b> is the external-facing layer — customer or partner portals — built on either. All three commonly sit in one org and share Account and Contact, which is exactly where governance disputes start: whose process owns a field, whose automation fires first, whose page layout wins. That's a governance problem, not a technical one — the platform doesn't arbitrate it for you.</p>
        <h2 class="section-h">What "governance" means in practice here</h2>
        <p class="body-text">Concretely: a named design authority with tie-breaking power, a lightweight design-review checkpoint before a team builds on shared objects, and a short written artefact (an ADR, see the Artefact Studio) recording who owns what and why — reviewed and re-confirmed whenever a new cloud or team joins the org. Without this, the failure mode is always the same: two teams each optimise their own cloud's automation on Account, and six months later nobody can predict what happens when a record is saved.</p>
        ${itemList(this)}`;
    }
  },
  {
    id: 'dev-lifecycle', group: 'Architecture Domains', navLabel: 'Development Lifecycle & Deployment',
    eyebrow: '11 · Architecture Domains',
    title: 'Development lifecycle & deployment',
    lede: 'The Architect Journey domain most job descriptions name directly as "Agile / DevOps / CI-CD" — and the one most self-taught architects skip.',
    items: [
      {id:'dl1', title:'Sandbox strategy', note:'Dev, Dev Pro, Partial Copy, Full — what each is for and how a release pipeline threads through them.', tag:'~1h'},
      {id:'dl2', title:'Source-driven development & SFDX/CLI', note:'Org-based vs package-based development; metadata as version-controlled source of truth.', tag:'~1.5h'},
      {id:'dl3', title:'CI/CD pipeline design', note:'DevOps Center vs third-party tooling (Gearset, Copado, GitHub Actions) — the shape of an automated pipeline either way.', tag:'~1.5h'},
      {id:'dl4', title:'Change & release governance', note:'Change sets vs packages, approval gates, rollback strategy.', tag:'~1h'},
      {id:'dl5', title:'Branching strategy for metadata', note:'Trunk-based vs Gitflow applied to org metadata — where it breaks down and why.', tag:'~1h'},
    ],
    render(){
      return `${sheetHeader(this)}${sheetMeta('~6 h · Architect Journey domain')}
        <h2 class="section-h">Sandbox tiers</h2>
        <ul class="plain-list">
          <li><b>Developer / Developer Pro</b> — metadata only, no production data, refreshable daily. Individual build and unit testing.</li>
          <li><b>Partial Copy</b> — metadata plus a sampled data subset, refreshable every 5 days. Integration and QA testing against realistic-but-small data.</li>
          <li><b>Full</b> — a complete copy of production data and metadata, refreshable every 29 days. UAT, performance testing, and staging.</li>
        </ul>
        <p class="body-text">A release pipeline threads through these in order: build in Developer, integrate in Partial Copy, validate in Full, then deploy to production. Skipping straight to Full for daily development is the most common sandbox-strategy mistake — the refresh cadence makes it unusable for fast iteration.</p>
        <h2 class="section-h">Source-driven development</h2>
        <p class="body-text">The older model treats a sandbox org itself as the source of truth — build in the org, retrieve metadata into a change set, promote it up. The modern model inverts that: version-controlled metadata (via <b>Salesforce CLI / SFDX</b>) is the source of truth, and orgs — including production — are disposable, rebuildable targets. That shift is what makes real CI/CD possible: a pipeline (DevOps Center, or third-party tooling like Gearset/Copado/GitHub Actions) validates and deploys straight from a Git branch, with peer review happening on the pull request rather than by eyeballing a change set.</p>
        ${itemList(this)}
        <div class="callout">
          <b>This is the domain to over-index on —</b> it's explicitly named in most Solution Architect job descriptions ("Agile and product-based delivery... DevOps or CI/CD practices") and rarely covered by generalist Trailhead study plans.
        </div>`;
    }
  },
  {
    id: 'agentic', group: 'Architecture Domains', navLabel: 'Architect the Agentic Enterprise',
    eyebrow: '12 · Architecture Domains',
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
      return `${sheetHeader(this)}${sheetMeta('~5 h · +2,100 pts')}
        <h2 class="section-h">Why this belongs in the core path now</h2>
        <p class="body-text">Agentforce adds a new architectural layer on top of everything in this workspace so far: autonomous agents that read data, call Apex/Flow as tools, and take action within guardrails you design. That means the sharing model, the automation you built, and the integration patterns you chose don't go away — an agent inherits the running user's permissions and calls the same declarative/programmatic building blocks as any other automation. The new design questions are about scope (what is this agent allowed to touch), grounding (what data it's allowed to reason over), and escalation (when it hands off to a human). <b>Data 360</b> is the unified data layer underneath, giving agents (and everything else) one consistent view across what were previously separate data sources.</p>
        <p class="body-text">Treat this domain as evolving faster than the rest — verify current Trailhead content before relying on specifics, and focus study time on the architectural pattern (permission scoping, action design, human-in-the-loop) over any single product screen.</p>
        ${itemList(this)}`;
    }
  },
  {
    id: 'practice', group: 'Practice', navLabel: 'Connected Case Practice',
    eyebrow: '13 · Practice',
    title: 'Connected case practice',
    lede: 'Decide first. Reveal second. This is the rehearsal for what a review board or a hiring panel actually does — hands you an ambiguous scenario and watches how you reason, not whether you recite a definition.',
    items: [
      {id:'sc1a', title:'Named the trade-off, not just the answer', note:'Latency/coupling vs simplicity, or similar.'},
      {id:'sc1b', title:'Considered volume & scale', note:'What happens at 10x the stated transaction volume.'},
      {id:'sc1c', title:'Addressed failure handling', note:'Retries, idempotency, dead-letter behaviour.'},
      {id:'sc1d', title:'Named a governor-limit or platform constraint', note:'Something concrete, not generic "limits exist."'},
      {id:'sc2a', title:'Started from OWD, not from sharing rules', note:'Default-private posture stated explicitly.'},
      {id:'sc2b', title:'Chose a mechanism and justified rejecting the others', note:'Not just "use sharing rules" — why not role hierarchy or territories.'},
      {id:'sc2c', title:'Addressed the cross-business-unit edge case', note:'What happens when a record needs to move between units.'},
      {id:'sc2d', title:'Named a performance or maintainability risk', note:'Sharing recalculation cost, rule sprawl, or similar.'},
      {id:'sc3a', title:'Proposed a concrete governance gate', note:'Not "we should have reviews" — an actual checkpoint with an owner.'},
      {id:'sc3b', title:'Addressed data model overlap across clouds', note:'Where Sales/Service/Experience Cloud objects collide.'},
      {id:'sc3c', title:'Named the target-state artefact this scenario produces', note:'Roadmap slide, ADR, or integration diagram — see Artefact Studio.'},
      {id:'sc3d', title:'Flagged a change-management risk', note:'Who has to agree, and what happens if they don’t.'},
    ],
    render(){
      const s1 = scenario(1, 'The payments webhook',
        'A partner system needs to notify Salesforce the instant a payment settles, so a case can auto-close and a customer email can go out. Volume: roughly 200 events/minute at peak, growing.',
        'Point-to-point REST callout from the partner straight into an Apex REST endpoint, or Platform Events with a partner-facing publish mechanism? Decide, and be ready to defend it against the other option.',
        [
          'What happens to the 201st event if the platform is mid-deployment?',
          'Who retries on failure — the partner, or Salesforce?',
          'Does this need to be synchronous from the partner’s point of view at all?',
        ],
        'Platform Events (or Change Data Capture if the trigger is a data change) generally wins here: the partner publishes once, Salesforce subscribes asynchronously, and a failed subscriber doesn’t block the publisher or the partner’s request thread. Point-to-point REST is defensible only if the partner needs a synchronous success/failure response in the same call — and even then, pair it with an idempotency key, because "retry on timeout" without one double-closes cases.',
        [
          {id:'sc1a', title:'Named the trade-off, not just the answer', note:'Latency/coupling vs simplicity, or similar.'},
          {id:'sc1b', title:'Considered volume & scale', note:'What happens at 10x the stated transaction volume.'},
          {id:'sc1c', title:'Addressed failure handling', note:'Retries, idempotency, dead-letter behaviour.'},
          {id:'sc1d', title:'Named a governor-limit or platform constraint', note:'Something concrete, not generic "limits exist."'},
        ]
      );
      const s2 = scenario(2, 'The multi-business-unit account',
        'Three business units share one org. Each unit’s reps should see their own accounts and opportunities. A shared national-accounts team needs visibility across all three units, but only for accounts flagged "strategic."',
        'Design the sharing model: what combination of OWD, role hierarchy, sharing rules, and/or Apex managed sharing, and why not the alternatives?',
        [
          'Does a record ever need to move from one unit’s ownership to another’s?',
          'Is "strategic" a static flag or something that changes over the account’s lifecycle?',
          'What’s the sharing-recalculation cost if this is built on criteria-based sharing rules at scale?',
        ],
        'OWD private by unit (or a single private OWD with unit as a filtered field) as the default, standard sharing rules to grant each unit’s reps access to their own records, and a criteria-based sharing rule (flag = strategic) to extend read access to the national-accounts team. Apex managed sharing is the fallback only if "strategic" changes based on logic too complex for a criteria rule to express — reach for it last, because it’s the hardest of the four to review and maintain.',
        [
          {id:'sc2a', title:'Started from OWD, not from sharing rules', note:'Default-private posture stated explicitly.'},
          {id:'sc2b', title:'Chose a mechanism and justified rejecting the others', note:'Not just "use sharing rules" — why not role hierarchy or territories.'},
          {id:'sc2c', title:'Addressed the cross-business-unit edge case', note:'What happens when a record needs to move between units.'},
          {id:'sc2d', title:'Named a performance or maintainability risk', note:'Sharing recalculation cost, rule sprawl, or similar.'},
        ]
      );
      const s3 = scenario(3, 'The overlapping target state',
        'Sales Cloud has been live for three years. Service Cloud is being added this year. Both teams want to "own" the Account and Contact objects, and both have opinions about the case/opportunity relationship.',
        'What governance gate do you put in place before either team writes a line of config, and what artefact comes out of it?',
        [
          'Who has the authority to resolve the disagreement if the two teams don’t converge on their own?',
          'What’s the cost of getting this wrong six months into Service Cloud being live?',
          'Does this decision need to be revisited when Experience Cloud arrives next?',
        ],
        'A joint design-review session with both teams and a named design authority (often the architect) with tie-breaking power — the Salesforce-flavoured version of a design review board. The output is a short design decision record naming the single system of record for Account/Contact ownership fields, the shared data model, and the case-to-opportunity relationship, signed off by both team leads before either builds. Revisit it explicitly when a third cloud is added rather than assuming it still holds.',
        [
          {id:'sc3a', title:'Proposed a concrete governance gate', note:'Not "we should have reviews" — an actual checkpoint with an owner.'},
          {id:'sc3b', title:'Addressed data model overlap across clouds', note:'Where Sales/Service/Experience Cloud objects collide.'},
          {id:'sc3c', title:'Named the target-state artefact this scenario produces', note:'Roadmap slide, ADR, or integration diagram — see Artefact Studio.'},
          {id:'sc3d', title:'Flagged a change-management risk', note:'Who has to agree, and what happens if they don’t.'},
        ]
      );
      return `${sheetHeader(this)}${sheetMeta('3 scenarios · decide before you reveal')}${s1}${s2}${s3}`;
    }
  },
  {
    id: 'quiz', group: 'Practice', navLabel: 'Quiz Bank',
    eyebrow: '14 · Practice',
    title: 'Quiz bank',
    lede: 'Certification-style multiple choice, scored immediately. Filter by domain, or run the whole bank. Answers persist — come back and pick up where you left off.',
    items: [],
    render(){
      const filtered = quizFilter === 'all' ? QUIZ_BANK : QUIZ_BANK.filter(q => q.domain === quizFilter);
      const attempted = filtered.filter(q => quizAnswers[q.id] !== undefined);
      const correctCount = attempted.filter(q => quizAnswers[q.id] === q.correct).length;
      const domainOptions = ['all', ...Object.keys(DOMAIN_LABELS)];
      const controls = `<div class="quiz-controls">
          <select id="quiz-filter">
            ${domainOptions.map(d => `<option value="${d}"${d === quizFilter ? ' selected' : ''}>${d === 'all' ? 'All domains' : DOMAIN_LABELS[d]}</option>`).join('')}
          </select>
          <span class="quiz-score">Score: <b>${correctCount} / ${attempted.length}</b> attempted <span class="quiz-score-total">&middot; ${filtered.length} in view</span></span>
          <button class="quiz-reset-btn" id="quiz-reset" type="button">Reset answers</button>
        </div>`;
      const questions = filtered.map((q, i) => quizQuestionHtml(q, i + 1)).join('');
      return `${sheetHeader(this)}${sheetMeta(`${QUIZ_BANK.length} questions across ${Object.keys(DOMAIN_LABELS).length} domains`)}${controls}${questions}`;
    }
  },
  {
    id: 'artefacts', group: 'Practice', navLabel: 'Architecture Artefact Studio',
    eyebrow: '15 · Practice',
    title: 'Architecture artefact studio',
    lede: 'Job descriptions ask for "architecture artefacts — solution diagrams, integration documentation, design decision records." That’s existing TOGAF/enterprise-architecture muscle; this sheet is the Salesforce-shaped rep.',
    items: [
      {id:'art1', title:'Write an ADR for the payments webhook decision', note:'Use the Scenario 1 outcome from Connected Case Practice as the subject.'},
      {id:'art2', title:'Sketch a solution diagram for the multi-business-unit sharing model', note:'Objects, OWD, sharing rules, and the national-accounts exception, on one page.'},
      {id:'art3', title:'Draft an integration document for one real or hypothetical system', note:'Endpoints, auth method, payload shape, error handling, retry policy.'},
      {id:'art4', title:'Produce a one-slide target-state roadmap', note:'Current state → this quarter → next two quarters, for the Sales/Service Cloud overlap scenario.'},
    ],
    render(){
      return `${sheetHeader(this)}${sheetMeta('produce, don’t just read')}${itemList(this)}
        <h2 class="section-h">ADR template</h2>
        <p class="body-text">The same shape as any architecture decision record — nothing Salesforce-specific about the format, only the content.</p>
        <pre class="adr-template">## ADR-NNN: &lt;short decision title&gt;

**Status:** proposed / accepted / superseded
**Context:** what forced this decision — volume, constraint, requirement
**Decision:** the one sentence that states what was chosen
**Alternatives considered:** each option, and the specific reason it was rejected
**Consequences:** what this makes easier, what it makes harder, what it forecloses
**Revisit when:** the condition that would invalidate this decision</pre>
        <div class="callout amber">
          <b>Do this in the Study Desk below —</b> each artefact item above is a real exercise, not a reading task. Draft it in the notes panel, then paste the finished version wherever you're building a portfolio.
        </div>`;
    }
  },
  {
    id: 'certification', group: 'Certification', navLabel: 'Certification Track',
    eyebrow: '16 · Certification',
    title: 'Certification track',
    lede: 'Not a sprint — layer credentials as depth in each domain solidifies. Order matters more than speed.',
    items: [
      {id:'c1', title:'Platform Administrator', note:'The foundation cert nearly every path assumes. (Formerly "Administrator ADM-201.")', url:'https://trailhead.salesforce.com/credentials/administrator'},
      {id:'c2', title:'Platform App Builder', note:'Declarative build depth.', url:'https://trailhead.salesforce.com/credentials/platformappbuilder'},
      {id:'c3', title:'Platform Developer I', note:'Enough Apex/LWC credibility to review code, not just design around it.', url:'https://trailhead.salesforce.com/credentials/platformdeveloperi'},
      {id:'c4', title:'Platform Sharing and Visibility Architect', note:'Architect Journey domain cert. (Formerly "Sharing and Visibility Designer.")', url:'https://trailhead.salesforce.com/credentials/sharingandvisibilityarchitect'},
      {id:'c5', title:'Platform Data Architect', note:'Architect Journey domain cert. (Formerly "Data Architecture and Management Designer.")', url:'https://trailhead.salesforce.com/en/credentials/dataarchitect'},
      {id:'c6', title:'Platform Integration Architect', note:'Architect Journey domain cert. (Formerly "Integration Architecture Designer.")', url:'https://trailhead.salesforce.com/credentials/integrationarchitect'},
      {id:'c7', title:'Platform Identity and Access Management Architect', note:'Architect Journey domain cert. (Formerly "Identity and Access Management Designer.")', url:'https://trailhead.salesforce.com/credentials/platformidentityandaccessmanagementarchitect'},
      {id:'c8', title:'Platform Development Lifecycle and Deployment Architect', note:'Architect Journey domain cert. (Formerly "Development Lifecycle and Deployment Designer.")', url:'https://trailhead.salesforce.com/en/credentials/developmentlifecycledeploymentarchitect'},
      {id:'c9a', title:'Application Architect', note:'Composite designation — requires Data Architect + Sharing and Visibility Architect.', url:'https://trailhead.salesforce.com/en/credentials/applicationarchitect'},
      {id:'c9b', title:'System Architect', note:'Composite designation — requires Integration, Identity & Access Management, and Development Lifecycle & Deployment Architect.', url:'https://trailhead.salesforce.com/en/credentials/systemarchitect'},
      {id:'c10', title:'Certified Technical Architect (CTA)', note:'The board-reviewed capstone, prerequisite: both System Architect and Application Architect — see below.', url:'https://trailhead.salesforce.com/credentials/technicalarchitect'},
    ],
    render(){
      return `${sheetHeader(this)}${sheetMeta('ongoing')}
        <div class="callout">
          <b>Naming note —</b> Salesforce renamed the domain "Designer" certifications to "Architect" in recent years (e.g. Sharing and Visibility Designer → Platform Sharing and Visibility Architect). Both names refer to the same exam lineage — verify current naming on Trailhead before booking, since Salesforce revises this periodically.
        </div>
        ${itemList(this)}
        <div class="callout amber">
          <b>Cheapest concrete proof point —</b> book the associate-level exam ($75) once foundations feel solid. It's the fastest way to convert study time into something a hiring panel can verify.
        </div>
        <h2 class="section-h">What the CTA board actually is</h2>
        <p class="body-text">Certified Technical Architect isn't a multiple-choice exam — it's a review board: candidates are given a complex, ambiguous business scenario, produce a design under time pressure, then present and defend it to a panel of certified architects who cross-examine the trade-offs live. It's scored across multiple domains at once (data, integration, sharing/security, communication), so a design that's technically sound but poorly defended still fails. The <b>Connected Case Practice</b> sheet and <b>Artefact Studio</b> in this workspace are direct rehearsal for that format. Verify the current exact format on Trailhead before booking — Salesforce revises certification logistics periodically.</p>`;
    }
  },
  {
    id: 'bridge', group: 'Interview Bridge', navLabel: 'Readiness Bridge',
    eyebrow: '17 · Interview Bridge',
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
      return `${sheetHeader(this)}${sheetMeta('before an interview')}${itemList(this)}
        <div class="callout">
          <b>Use this sheet as an interview outline —</b> each item above is a talking point, not a study task. Jot supporting examples in the Study Desk below as they come to mind.
        </div>`;
    }
  },
  {
    id: 'resources', group: 'Reference', navLabel: 'Resources',
    eyebrow: '18 · Reference',
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
    eyebrow: '19 · Progress',
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

      const thp = lsGet('sfaw-trailhead-profile', {url:'', points:'', rank:'', badges:''});
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
        <h2 class="section-h">Your Trailhead profile</h2>
        <p class="body-text">Points, rank, and badges live on Trailhead — this workspace can't read them (Trailhead has no public API for that). Log them here yourself after a study session so both systems stay in one view.</p>
        <div class="th-profile-card">
          <div class="th-profile-grid">
            <label>Trailblazer profile URL<input type="text" id="th-url" data-thf="url" value="${thp.url}" placeholder="https://trailhead.salesforce.com/id/..."></label>
            <label>Points<input type="text" id="th-points" data-thf="points" value="${thp.points}" placeholder="e.g. 42,300"></label>
            <label>Rank<input type="text" id="th-rank" data-thf="rank" value="${thp.rank}" placeholder="e.g. Ranger"></label>
            <label>Badges earned<input type="text" id="th-badges" data-thf="badges" value="${thp.badges}" placeholder="e.g. 65"></label>
          </div>
          ${thp.url ? `<a href="${thp.url}" target="_blank" rel="noopener" class="th-profile-link">Open your Trailhead profile &#8599;</a>` : ''}
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
  return sheet.items.map(it => itemRow(it.id, it.title, it.note, it.tag, it.url)).join('');
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

  if(sheet.id === 'progress'){
    document.getElementById('canvas').querySelectorAll('input[data-thf]').forEach(input => {
      input.addEventListener('change', () => {
        const thp = lsGet('sfaw-trailhead-profile', {url:'', points:'', rank:'', badges:''});
        thp[input.getAttribute('data-thf')] = input.value.trim();
        lsSet('sfaw-trailhead-profile', thp);
        renderSheet();
      });
    });
  }

  if(sheet.id === 'quiz'){
    document.getElementById('canvas').querySelectorAll('input[type=radio][data-qid]').forEach(radio => {
      radio.addEventListener('change', () => {
        quizAnswers[radio.getAttribute('data-qid')] = Number(radio.value);
        lsSet('sfaw-quiz-answers', quizAnswers);
        renderSheet();
      });
    });
    const filterSelect = document.getElementById('quiz-filter');
    if(filterSelect) filterSelect.addEventListener('change', (e) => {
      quizFilter = e.target.value;
      renderSheet();
    });
    const resetBtn = document.getElementById('quiz-reset');
    if(resetBtn) resetBtn.addEventListener('click', () => {
      if(confirm('Clear all quiz answers?')){
        quizAnswers = {};
        lsSet('sfaw-quiz-answers', quizAnswers);
        renderSheet();
      }
    });
  }

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
