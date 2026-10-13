# Prototype behavior contract

Authoritative context: current cert AGENTS.md, UX-CONTRACT.md, source storage.js and session-rules.js inspected; AWS primary sources are linked in src/content.js. User explicitly authorized a standalone Explore → Learn → Recall → Apply → review prototype with local resume.

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
|---|---|---|---|---|
| Select/Listbox | Native labeled select | Course profile registry | Switch course without replacing saved sessions | Browser switch and isolated-storage tests |
| Navigation | App shared dispatcher | Selected mockup and requested flow | Prototype destinations only | Browser flow |
| Form | Recall form | Self-assessment contract | Optional disclosed textarea, noValidate | Empty optional draft + feedback |
| Session recovery | Mirrored cert storage.js | Existing read/write health handling | Namespaced adapter, prototype property only | Reload/resume |
| Feedback | Shared feedback region | Separate recall and practice | Reference answer/self-rating; authored MCQ scoring | Browser wrong/right |
| Dialog | Native HTML dialog | Preserve unfinished session | Cancel/Escape + explicit replace | Browser cancel |
| Scrollbar | Official site-shell.css | Portfolio canonical tokens | Document scroll | Narrow overflow |
| Theme | Exact site-shell.js mirror | Fresh light + explicit saved preference | Same icon recipe | Browser toggle |

No backend requests, protected hydration, async mutations, auth, payment, upload, automatic scheduling or certification readiness score. Original source payloads never enter this prototype. Local draft storage contains only this prototype's user-authored explanation, selections and small lifecycle state. On storage failure, retain in-memory work and show a persistent notice. All interface labels and guidance are Vietnamese. Source questions retain English/Japanese.

## Language-learning variation

JLPT study groups are not official test-section weights. Japanese prompts, choices and examples stay Japanese with explicit lang markers and CJK fonts. Vietnamese explanations are optional disclosures; Apply support appears only after checking. Recall is self-assessed and no free-text AI scoring is claimed. Course selection persists separately; AWS retains its previous storage namespace, JLPT uses a new isolated namespace. One original partial-negation lesson and two original questions are available. Listening has no audio and remains unavailable. Neither lesson is labeled an official N1/N3 grammar list.

## Protected question-bank integration

The new Luyện câu hỏi destination consumes the existing jlpt-app/api.js client mirrored in src/bank-api/api.js. Its production Worker already allows local origins on8797. No new allowed origin, proxy, keys, published prompt packs or answer prefetch. Use the existing createPracticePlan owner for random mixed bounded sessions. Index metadata is held in memory; prompts are requested one at a time. /feedback performs canonical server scoring and returns feedback only after the user requests a check. Custom response UI adapts canonical QuestionResponse labels into Vietnamese without changing scoring semantics.

Persist only queue IDs, cursor, learner responses, result labels and completion state under a dedicated bank namespace via canonical storage.js. Never persist protected prompts, answers, explanations, references, session token or media URL. Resume reissues prompts; feedback is fetched again only upon explicit check. Changing bank certification preserves its saved session. A new session is offered only after completion. Empty banks cannot start; PMP stays in its dedicated workspace. Unsupported source modes link to the original workspace and can be skipped without a result. Self-check results do not count as objective correct/wrong. No simulated full-exam or pass claims.

## Study modes

Default destination is Luyện đề nhanh (existing bank planner and server grading). Học để nhớ owns Understand → optional written Recall → Apply → Review. Blank recall may reveal reference guidance; self-rating remains separate from objective scoring. Source written exam questions remain required according to their own response contract. Existing drafts and session namespaces are preserved.

## Independent certification workspaces

Learning is a directory. Native links open /<catalog slug>/ in this preview; the certification is fixed by the URL and its header. No certification dropdown. Default workspace view is quick practice. Guided lessons exist only for AWS and JLPT; other certificates show explicit unavailable lesson states. Persisted bank sessions stay isolated by canonical cert ID. Existing production certification routes are not changed by the preview.
