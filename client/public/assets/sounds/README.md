# Custom sound effects

Drop an audio file in here using these exact filenames to enable sound.
If a file isn't present, the app tries to play it, fails silently, and
nothing breaks.

| Filename                  | Plays when...                                   |
|---------------------------|--------------------------------------------------|
| `writer-countdown.mp3`    | The Job Seeker's 90s resume timer starts          |
| `manager-countdown.mp3`   | Management's 20s voting timer starts              |
| `round-complete.mp3`      | A round's voting locks in (result screen)         |

Short (1-3s) stinger-style clips work best for round-complete; a subtle
ticking loop or a single rising sting works well for the countdowns — the
app plays them once when the screen mounts, it doesn't loop them.
