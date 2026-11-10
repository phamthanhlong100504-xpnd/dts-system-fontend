# Card06 — Bộ đề có sẵn — integration v1 (2026-11-03)

## Scope and preservation

Integrates the supplied PRESET contract into the current frontend received in `DTS-Frontend-Current-Card06-20261103-173246.zip` (SHA256 `fbd613cbd1ea58547d8fd3b48fc27b041eb899f31debe7f12b9526bc34de09be`). Parent is the accepted UI polish v2 working tree, not the older frontend reference in the backend handoff. Owner branch remains `feature/video-simulation-backend-integration`; no commit, staging, push, checkout, package/lock/config/CSS, theory, learning, review-needed, bookmarks, guide or video-player changes are included.

Handoff: `DTS-Card06-Frontend-Handoff-20261103(1).zip`, SHA256 `de560464b9b7716812a4968c9ed41b5464fefb071204a50db5451ca15243e165`. The original 94-file hash set, 70 response records and backend validator pass. Historical 900 backend tests and 11,732 runtime checks are evidence supplied by backend, not frontend tests run here. No migrations, database, backend runtime or real asset playback was run.

## Normal entry and boundaries

Open `/practice` → Mô phỏng tình huống → Bộ đề có sẵn → Xem bộ đề, or `/practice/simulations/exams/presets`. Hub reads actual published/completed counts, including zero; no fixed 15, invented counts or preparing label after a successful read. It requires raw practice:read, simulations:read, simulations:exam grants; media:read is additionally required for create/playback. Roles and simulations:learn do not substitute.

`practiceApi` unwraps the Practice envelope once. GET `/v1/simulation-exams/presets` and `/{presetSetId}` use selected license, no-cache and user/license/bank query isolation. Catalogue/detail reads never create sessions, request playback, or write learning progress. Wrong scope, malformed payload, inconsistent latest/active metadata and teaching disclosures fail at the boundary; errors never become empty success.

A versioned adapter supplies `maxScenarioScore:5` and policyVersion `simulation-preset-10-v1-pass35` only after wire literals 10/50/35 have been validated. These two adapter values are not claimed as catalogue/detail server fields. Session/result policy remains the actual server snapshot.

PRESET session/result parse as strict discriminated unions with full eight-field preset reference and checked top-level set/version/title aliases. RANDOM remains strict and refuses preset fields. Session command reconciliation pins title, manifest/source hashes, version, bank, scoring and policy; current publication cannot relabel historical results.

## Start, active slot and recovery

POST `/sessions` sends mode PRESET, selected set/version, selected license and frozen optional bank; its original canonical UUID is the Idempotency-Key header only. There is no user, order, score, policy or idempotency field in the body. A double press is locked. Uncertain creation retains original key/body/bank across render, detail refetch and current-version changes. An explicit retry reuses that request; similar active sessions are offered for resume/cancel, never silently adopted as proof of ownership. A same-key terminal ACK routes COMPLETED to result, or reports CANCELLED without resuming it. A definitively rejected bank/version requires refreshed, explicit selection before a new intent.

One active actor slot is shared between RANDOM/PRESET and supported licenses. Exact current-version active sessions appear on their own card; RANDOM/older-version active appears separately with explicit resume. Preparation supports explicit resume/cancel and preserves a prior latest completion during a retake. Create/cancel/submission refresh catalogue/detail/preparation/active caches for the actor across cached licenses, while historical result/review caches and other actors remain untouched. Logout clears exam queries; unmounted actor/license requests cannot navigate.

The Card05 ordered controller/player is reused unchanged. START0 ACK, measured heartbeat/reaction/ended, first-reaction preservation, restart nonce recovery, READY_TO_SUBMIT followed by explicit submit, terminal read-only result and lazy selected review playback use the existing engine. No client grading, fabricated media time, autoplay create, auto-cancel or arbitrary playback URLs are introduced.

## Latest result and UI

Latest means most recently completed session, not best score. Exact latest session ID and score remain paired, including 0. Fixture evidence 34 → 35 → 50 → 45 → 30 shows 30 at the end; retake/READY/cancel preserve the previous completion until a successful submit. Review retains firstResponseMs 0/null and segment endInclusive.

All existing stylesheets and existing static class/tag structure are retained. The only new rendered block is a global-active notice on the presets catalogue using existing card/title/body/button styles, plus an explicit original-request retry action in the existing feedback modal. Hub metadata/action bindings, preset page handlers, strict parsers and actor-wide cache invalidation are behavioral changes. UI polish v2 headings, spacing, theory chapter cards, chapter-list continuation, chapter badge and scenario video overlay remain unchanged.

`simulationMockExamUiReleased=false` remains unchanged. Guide publication/release coordination remains a separate owner/backend decision; this integration connects the normal authorized PRESET test entry without editing guide content or flipping the flag. Do not mark public release consistency or full UI acceptance complete from offline tests.

## Verification and owner acceptance

- 373 frontend automated tests pass: all previous 257 plus 116 new PRESET checks (70 real redacted DTOs, adversarial boundaries, controller and React/Query callback harnesses).
- Full Next webpack production build and TypeScript pass; 77/77 pages generated. Changed TypeScript lint passes. Package files and CSS unchanged.
- 17 unauthenticated SSR routes pass with an isolated local standalone server. This is shell/render smoke coverage, not an authenticated browser/video/backend test.
- Redacted signed URLs are substituted only in test memory by an explicitly labeled QA URL. Their real decode/expiry is not asserted. No app source imports the QA corpus.
- Safe patch guard verifies expected branch/HEAD, source prerequisites, original and payload hashes. UTF-8 BOM/CRLF are normalized; trailing blank lines are significant. Unexpected source stops the patch. Original bytes are backed up outside the repo. Git index/HEAD/refs/config and unrelated source are preserved.

Owner browser acceptance remains pending: enter normally from hub, start one preset, play all 10 real MP4s using Space/button, test reload/recovery, submit, open latest result, review positions 1/10 and refresh. Test a retake with a lower score and cancelled retake; check RANDOM recovery and license switch. Boundary/empty/archived cases use isolated QA fixtures, never modify the published catalogue to force them. The backend checklist FE06-01..34 is shipped unchanged; every browser row remains NOT_RUN until owner evidence is recorded. FullCard06Accepted=false.

Run the new cumulative verifier `python .\scripts\verify-simulation-card06-integration.py`; older verifiers describe historical checkpoints and are not the final working-tree authority after Card06. The patch does not install jsdom or Prettier into the app. Contract/controller tests run with existing dependencies; DOM harnesses require external QA jsdom through DTS_QA_NODE_MODULES.
