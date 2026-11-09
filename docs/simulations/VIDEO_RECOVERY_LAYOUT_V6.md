# Frontend v6 — exam video recovery and layout, 2026-11-04

## Diagnosis and implemented behavior

Screenshots alone do not establish a corrupt or unstable video file. The reviewed frontend immediately faulted every active `waiting`/`stalled` event, including a stalled background download while buffered playback was progressing. A failed optional shortcut-state GET after an acknowledged START also changed the whole player to video-error, causing an unnecessary restart.

The exam player now preloads automatically and waits for actual future data before starting the server clock. A background stalled download does not fault healthy playback. A real playback wait blocks reactions and heartbeat, with a cumulative 750 ms grace budget per media generation. Longer waits still require recovery: the supplied backend permits only 1500 ms position drift against an uninterrupted server clock. No fake timestamps, heartbeat, duration or ended are produced; original reaction milliseconds and backend scoring remain authoritative.

Capability read failures now show a separate reconnect action while keeping the acknowledged session/media snapshot. Reconnecting those controls is read-only and does not restart a healthy video. An older capability response cannot erase an acknowledged first reaction. Fault text distinguishes failed media loading/decoding, duration mismatch and a session clock needing recovery.

## Buttons and backend boundary

- Next stays visible but disabled until a committed first reaction is confirmed. This is the latest requested presentation, replacing v5's hidden-before-confirmation presentation. Zero milliseconds is still a stored reaction.
- Confirmed Next can be used even when video playback or its grant has failed. It uses the same atomic backend advance-after-reaction, not a fabricated completion. Saved reaction/time/score calculation stay intact.
- Restart before Skip has ever been used restores available Skip after playback confirmation.
- **Backend work still required:** current shortcuts v1 keeps `skipped_positions` across full RESTART, even with no first reaction. Used Skip therefore remains disabled on the frontend. Send `GUI_BACKEND_REOPEN_UNANSWERED_SKIP_V6.md` to the backend owner to reopen it on an unanswered restart. The frontend already follows the existing capability response; no forced local seek is introduced.
- Screenshot 1 displays “Đã ghi nhận phản ứng”. The frontend cannot safely discard that state because Space was not pressed during the latest replay. The revised badge and description explain that saved state instead of simultaneously saying unstarted and continuously playing.
- Ordinary learning retains only Skip. Review remains read-only; no exam Next command is added there.

## Requested layout

RANDOM/PRESET result and review pages remove their route heading/description. Completed or preset/score badge shares the Back navigation row, with 1 cm to the first card. PRESET result card title is `Kết quả bài thi - <preset title>`. Preparation and other already-hidden-intro pages retain 1 cm navigation-to-content spacing.

Section heading/description pairs use 0.6 cm; preparation pairs use 0.7 cm. Supported text-edge trimming also handles section headings with icons without propagating through anonymous flex text. See the [CSS Inline Layout specification](https://drafts.csswg.org/css-inline/#text-box-trim). Unsupported browsers retain the explicit line-box gap. The three information cards have 18 px bold labels/icons, 17 px values and existing 15.5 px descriptions.

Theory/admin, dependencies, environment, video files, backend source, database and scoring formula are unchanged. The backend document is a change request, not an applied backend patch. Actual browser/video decoding, authenticated frontend/backend acceptance and reopening used Skip after unanswered restart are not yet accepted.

## Owner acceptance

Create a new RANDOM and PRESET exam. Check buffered startup, incidental stalled events, a brief real wait and a sustained wait. After a capability request failure, reconnect controls without restarting the video. After a stored reaction, test Next during a video fault and confirm original time/result. Test restart before using Skip, then used Skip after restart; the latter remains server-disabled until the backend change is installed. Check result/review badges, 1 cm navigation gap, 0.6/0.7 cm heading pairs and card typography in the real browser.
