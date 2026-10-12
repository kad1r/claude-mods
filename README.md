# claude-mods

Small [Claude Code](https://claude.com/claude-code) mods (function-hook plugins). Each folder is one plugin; the repo root is a plugin marketplace.

| Mod | What it does |
| --- | --- |
| [`usage-meter`](usage-meter) | Status line: context fill bar and tokens/window, live turn timer, last turn's tokens, session cost, 5-hour rate-limit usage. |
| [`session-diff`](session-diff) | `/session-diff` opens a pane listing the files changed this session by Edit/Write with `+/−` line counts; press a file to see its diff (`b` back, `k`/`j` page). |
| [`prompt-score`](prompt-score) | Toasts a heuristic quality score (clarity, context, specificity, verifiability) with a hint for every prompt you type. Local only, no API calls. Hints are in Turkish. |
| [`clawd-spinner`](clawd-spinner) | Pixel-art Clawd acts out the spinner word above the prompt while Claude works, with a time-of-day backdrop (morning coffee, night sky, Friday-evening confetti). |
| [`done-sound`](done-sound) | Plays a sound when Claude finishes answering (Windows, via PowerShell MediaPlayer). |
| [`clear-reminder`](clear-reminder) | Counts prompts since the last `/clear` and reminds you to clear before the limit. |

## Install

At a Claude Code prompt:

```
/plugin install usage-meter --marketplace kad1r/claude-mods
```

Answer `y` to add the marketplace, then pick a scope. Repeat with any other mod name from the table.

### done-sound

The sound file is not in the repo. Put any mp3 at `done-sound/sounds/done.mp3` in the installed plugin folder.

## Develop

Each mod is `.claude-plugin/plugin.json`, `hooks/hooks.json` and a hooks module in `hooks/`.

```
claude plugin validate ./<mod>
claude plugin test ./<mod>
```

To run from a local clone, add it as a marketplace (`claude plugin marketplace add <path>`), install from it, and use `/reload-plugins` after edits.
