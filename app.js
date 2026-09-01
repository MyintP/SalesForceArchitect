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
      {id:'f3', title:'Security & sharing model — the basics', note:'Profiles, permission sets, org-wide defaults, sharing rules. Deepens later in Sharing & Visibility Design.', tag:'~2h'},
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
      return `${sheetHeader(this)}${sheetMeta('~7 h')}${itemList(this)}
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
      return `${sheetHeader(this)}${sheetMeta('~5 h')}${itemList(this)}`;
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
      return `${sheetHeader(this)}${sheetMeta('~4.5 h · Architect Journey domain')}${itemList(this)}`;
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
      return `${sheetHeader(this)}${sheetMeta('~4.75 h · Architect Journey domain')}${itemList(this)}`;
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
      return `${sheetHeader(this)}${sheetMeta('~3 h · strength area · Architect Journey domain')}${itemList(this)}`;
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
      return `${sheetHeader(this)}${sheetMeta('~5.25 h · Architect Journey domain')}${itemList(this)}`;
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
      return `${sheetHeader(this)}${sheetMeta('~2 h')}${itemList(this)}`;
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
      return `${sheetHeader(this)}${sheetMeta('~6 h · Architect Journey domain')}${itemList(this)}
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
      return `${sheetHeader(this)}${sheetMeta('~5 h · +2,100 pts')}${itemList(this)}`;
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
    id: 'artefacts', group: 'Practice', navLabel: 'Architecture Artefact Studio',
    eyebrow: '14 · Practice',
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
    eyebrow: '15 · Certification',
    title: 'Certification track',
    lede: 'Not a sprint — layer credentials as depth in each domain solidifies. Order matters more than speed.',
    items: [
      {id:'c1', title:'Administrator (ADM-201)', note:'The foundation cert nearly every path assumes.'},
      {id:'c2', title:'Platform App Builder', note:'Declarative build depth.'},
      {id:'c3', title:'Platform Developer I', note:'Enough Apex/LWC credibility to review code, not just design around it.'},
      {id:'c4', title:'Sharing and Visibility Designer', note:'Architect Journey domain cert.'},
      {id:'c5', title:'Data Architecture and Management Designer', note:'Architect Journey domain cert.'},
      {id:'c6', title:'Integration Architecture Designer', note:'Architect Journey domain cert.'},
      {id:'c7', title:'Identity and Access Management Designer', note:'Architect Journey domain cert.'},
      {id:'c8', title:'Development Lifecycle and Deployment Designer', note:'Architect Journey domain cert.'},
      {id:'c9', title:'Application Architect / System Architect', note:'Composite designations once the underlying domain certs are held.'},
      {id:'c10', title:'Certified Technical Architect (CTA)', note:'The board-reviewed capstone — see below.'},
    ],
    render(){
      return `${sheetHeader(this)}${sheetMeta('ongoing')}${itemList(this)}
        <div class="callout amber">
          <b>Cheapest concrete proof point —</b> book the associate-level exam ($75) once foundations feel solid. It's the fastest way to convert study time into something a hiring panel can verify.
        </div>
        <h2 class="section-h">What the CTA board actually is</h2>
        <p class="body-text">Certified Technical Architect isn't a multiple-choice exam — it's a review board: candidates are given a complex, ambiguous business scenario, produce a design under time pressure, then present and defend it to a panel of certified architects who cross-examine the trade-offs live. It's scored across multiple domains at once (data, integration, sharing/security, communication), so a design that's technically sound but poorly defended still fails. The <b>Connected Case Practice</b> sheet and <b>Artefact Studio</b> in this workspace are direct rehearsal for that format. Verify the current exact format on Trailhead before booking — Salesforce revises certification logistics periodically.</p>`;
    }
  },
  {
    id: 'bridge', group: 'Interview Bridge', navLabel: 'Readiness Bridge',
    eyebrow: '16 · Interview Bridge',
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
    eyebrow: '17 · Reference',
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
    eyebrow: '18 · Progress',
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
