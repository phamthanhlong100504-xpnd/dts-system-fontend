# Card05 — RANDOM mock exam integration, 03/11/2026

Applied after Card01–04 on the existing uncommitted `feature/video-simulation-backend-integration` tree, base HEAD `498612284b440b20363efecd4f13bb00fa010bfe`. No new branch, stage, commit, push, install, service restart, migration or database write is part of this source patch.

## Scope and API

SIM07 preparation, SIM08 session, SIM09 result, SIM10 review use the existing shared Practice client (`/api/practice`), auth/session and Gateway proxy. The exam adapter uses `/v1/simulation-exams` and the 15 exact handed-over operations. Practice envelopes unwrap once. CREATE has `Idempotency-Key` and only RANDOM/license/bank body; every later mutation has a caller-owned stable UUID, exact position/nonce/actual time where required, and optional license query. REACTION is PUT. No actor, grade, teaching metadata, local command kind or theory attempt fields are sent.

The wire boundary rejects malformed payloads and foreign scope/session/position/nonce. Current bank comes from preparation; restored historical exams retain their own bank/scoring/policy snapshot, even if the current catalogue has advanced. Active sessions disclose ordinals/status only. Scores, outcome, threshold and reviewed content come from the server, including zero, null first response and `endInclusive`.

Permissions require raw `practice:read`, `simulations:read`, `simulations:exam`, and `media:read` for media/create. Learn/theory permissions and Admin role do not substitute. Queries are scoped by actor/license/session/position and discarded on logout/actor change. Source requests check session scope before and after HTTP. PRESET ports remain absent; Card06 is not mapped to RANDOM.

## Player and commands

One coordinator serializes START, HB, first REACTION, COMPLETE, SUBMIT and CANCEL. Reading a session never creates a new exam. Reload/remount or lost continuity reads the owned current session, RESTARTs from zero with a fresh nonce, resolves playback and waits for START0 ACK before native play or input. A saved first response survives recovery. Actual media position is sampled when HB is sent; busy ticks are dropped rather than queued with stale timestamps.

Reaction captures the first real HTML media time and event immediately, then waits behind prior writes. Real `ended` waits for pending response acknowledgement/reconciliation and sends the measured final media time; it does not substitute fixture duration. Duplicate ended, stale callbacks and detached players cannot complete a later position. Server ACK alone advances positions; after ten, SUBMIT returns Session COMPLETED and the result route separately GETs result.

Pause, seek, rate change, stall/wait, offline, hidden tab, metadata mismatch or failed START/HB invalidate continuity. Input/complete stops; Retry explicitly reconciles and RESTARTs. Fullscreen alone is allowed. An expired current URL also recovers by RESTART+START, rather than pretending URL replacement preserved the clock. Native autoplay refusal surfaces recovery. Unmount/refresh cleans listeners/timers and does not cancel the exam. Review allows native pause/seek and sends no learning/exam mutations.

Timeout/5xx after CREATE reads active before exposing retry; no automatic second POST or implicit cancellation. Write uncertainty GETs the owned session. Already committed terminal/progress ACKs reconcile without duplicate advancement. Failed submit remains an explicit retry state, including READY_TO_SUBMIT; it cannot auto-loop. Retries preserve the exact failed event/body/query. A successful old idempotent snapshot cannot regress current progress or clear recorded response.

## Lazy review

Review snapshot is fetched once, without demanding ten URLs. Only the selected ordinal requests its own safe Gateway playback endpoint; returned arbitrary hosts/paths are not followed. Rapid selection cannot attach a previous URL to the new item. Playback loading/error/renew is independent of the saved result and hints. URL renewal preserves the local viewing position; reload/selection/renew never changes saved grade or marker.

## Preserved UI and release coordination

All stylesheets, layout gutters, sizes, fonts and existing styling expressions are unchanged. Four of the 31 frozen UI source files change behavior: public random CTA is gated by the existing false release flag; exam session/review bindings; exam player lifecycle. The player's existing toolbar uses a start-only button during an exam (the Pause icon branch is removed), as the backend forbids pause. Dimensions/classes remain identical; review retains native pause/seek. This is a source comparison, not a pixel acceptance claim. Card01–04 runtime sources are preserved except the explicitly declared shared hub binding. Historical baseline/delta/verifier reports are not rewritten; use the new Card05 verifier for the cumulative tree.

Per the backend release handoff, `simulationMockExamUiReleased=false` and Card04 `MOCK_EXAM_UNAVAILABLE_V1`/`bank.mockExam.available=false` remain unchanged. Test through the direct integration route `/practice/simulations/exams/random`; do not interpret the closed public CTA as an API failure. A separate coordinated backend policy change and owner release decision are still needed before opening public entry points. Do not edit old guide draft/publication history to force availability.

## Evidence and acceptance

236 frontend tests pass: prior 163 regression tests plus73 Card05 tests (42 contract/controller/HTTP;31 React page/media tests). Typecheck, changed-source lint and production build77/77 pass. Original handoff58 hashes,39 historical evidence hashes,37 response examples,15 request shapes and4738 backend runtime checks validate offline. Production wire schemas also parse the37 captured DTOs. Signed URLs were redacted; only an in-memory QA copy replaces those placeholders with a QA URL for schema checks. Original bytes and production URL validation remain strict. Those tests do not prove real URL reachability/expiry, MP4 decoding or browser wall-clock behavior. QA-only RSS shim and jsdom live outside source and are not shipped as app dependencies.

User evidence retained: Card01 main learning, Card02 main review and replay after F5 accepted; Card03 patch verified/73 contract tests passed; Card04 Admin change was seen by the learner. This is not a claim that every previous card's browser checklist is complete.

Run the original `backend-handoff/ACCEPTANCE_CHECKLIST.md` in a real browser with the handed-over backend. Required next evidence includes one complete real ten-video exam, recovery after response/F5, submission/result reload, immutable lazy review, error/retry, ownership/permissions and regressions. `RuntimeUiAcceptanceCompleted=false`, `FullCard05Accepted=false` remain correct until owner/browser acceptance and release consistency are recorded. No historical backend report is changed to true.
