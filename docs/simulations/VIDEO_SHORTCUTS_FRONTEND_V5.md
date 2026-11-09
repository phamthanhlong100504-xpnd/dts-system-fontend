# Frontend: controlled video shortcuts v5 — 2026-11-04

## Agreed behavior

- Ordinary simulation learning, review-needed and bookmarks learning share one player: the only new video action is **Bỏ qua 10s**.
- Card 05 RANDOM and Card 06 PRESET active exams: **Bỏ qua 10s**, then **Tiếp theo** only after the first reaction has been stored and confirmed by the backend's nonce-bound acknowledgement. While a reaction is pending or unconfirmed there is no Next button. A recorded time of zero is valid.
- Clicking Next calls `advance-after-reaction`; the backend freezes the stored reaction's score with the original pinned scoring policy and advances exactly one position. It does not wait for natural video ended. Position 10 still uses the existing separate SUBMIT flow.
- No reaction: Next stays hidden; watching to natural ended still uses the original completion flow, including a zero score when applicable.
- Read-only replay/review retains local Skip with no backend mutation. There is no new Next overlay in read-only review; existing review selection/navigation remains.
- Transparent background, white text/border; both actions align 0.5 cm from the right edge of the video, above the normal playback controls. A successful action disappears for that video. New exam positions have independent usage.

## Backend dependency

Uses the handed-over `dts-controlled-video-shortcuts-v1-20261103` protocol (backend kit revision 3, V34). Its API handoff SHA256 is `e064060e6ec6c9c9bc456dfd1192de8b863cbf847360070cc5099239e569fe8a`.

Gateway prefixes remain `/api/practice/v1/simulations/attempts/{id}/shortcuts` and `/api/practice/v1/simulation-exams/sessions/{id}/shortcuts`. Every shortcut request includes the selected `licenseClass` query. New routes are GET state and POST enable/skip-intro/advance-after-reaction (last route is exams only). Old creation bodies, policies, permissions, bank/preset snapshots, passing score and result routes are unchanged.

Explicit opt-in occurs before first START on a new attempt/session. The frontend respects supported/enabled/canEnable and the backend capabilities. Already started legacy targets are not upgraded. **Test with a new learning attempt or new exam after applying.** If the backend reports migration/feature unavailable, no unsupported shortcut is offered. This patch does not migrate or modify the backend.

## Timing and recovery

Skip means an approved jump to original-video **00:10**, once per position, while playback is live, before any reaction and before the intro has passed. It is not repeated `currentTime + 10` and does not bypass a separate page countdown. The server can refuse short videos or scoring windows beginning before ten seconds; the frontend never substitutes a smaller jump.

On Skip, media is paused/quarantined; old reaction/HB/ended callbacks stop. Only a valid server ACK authorizes a new playback nonce/checkpoint. The player resolves the new grant, seeks to the approved checkpoint, waits for seek completion and START ACK, then plays. Normal manual seeking remains disallowed in scored playback.

At original video 17.432 seconds the request remains 17432 ms. No ten-second subtraction/addition, client-side score, artificial duration, fabricated ended or watched-to-end heartbeat is introduced. Learning still completes at real ended.

Existing ordered coordinators serialize operations. Uncertain Skip/Next keeps the exact original event/body/proof for retry. The receipt confirms the old operation; the accompanying fresh state owns the current position/nonce/checkpoint. An old receipt must never send the UI back to 00:10 or an earlier position. Full exam restart remains zero and preserves recorded reaction and skip-used status. A still-pending authorized skip can resume at 10000. Learning interrupt/resume retains its verified absolute checkpoint, e.g. 13000.

Opaque reaction confirmations stay in private in-memory coordinators. They do not enter workspace view models, local/session storage, URLs or logs. Scope and source ownership/bank/preset validation remain in force.

## Preserved UI / scope

Includes the previously requested v4 removal of learner intros and its 1 cm post-navigation gap. PRESET preparation title stays inside `Thông tin bài thi thử - …`. Shared guide admin preview still includes the CMS heading/description. No theory screen, admin workflow, package dependency, environment variable, database or scoring formula is changed.

The patch accepts the exact reviewed v3 or v4 working files, including interrupted application of either, and verifies all prerequisites. It preserves existing uncommitted work that matches these supplied baselines. It stops on other drift; do not reset or force apply. It does not stage/commit/push/change branch, restart services, install packages or run database commands.

## Owner browser acceptance after applying

1. Start the normal frontend and existing backend; create a **new** ordinary learning attempt. Play to about 3 seconds, Skip, confirm continuation at 00:10 and disappearance of Skip. No Next overlay appears here.
2. React at a known original-video time. Finish naturally and verify the saved time, score and replay after F5.
3. Start a new RANDOM exam. Skip at an early measured time. Press Phát hiện nguy hiểm; Next appears only after confirmation. Press Next before video ended and check one-position progression. Repeat to position 10, submit and inspect result/review.
4. Repeat with a PRESET exam; check its pinned identity, fixed order, latest result and retake.
5. Test a slow/failed reaction request: no premature Next. Test retry after a lost Skip/Next ACK and F5 after pending skip; no double advance or changed stored reaction.
6. Review/replay is read-only; normal seeking remains available there, with only the local Skip overlay.

Automated evidence covers contract/source/controller/DOM media-event tests, supplied HTTP schema compatibility, TypeScript/lint/build and patch safeguards. Real video decoding, owner-browser visual acceptance and live frontend-to-backend acceptance are still pending. No user credentials or live backend business writes were used here.
