# claude-mods

**English** · [Türkçe](#türkçe)

Small, focused mods for [Claude Code](https://claude.com/claude-code), built on its function-hook plugin API. Each folder is one plugin; the repo root is a plugin marketplace, so you install only the mods you want.

![Clawd acting out the spinner word above the prompt](docs/clawd.svg)

## What's inside

### See what Claude is doing

| Mod | What it does |
| --- | --- |
| [`usage-meter`](usage-meter) | Status line: context fill bar with tokens/window, a live turn timer, the last turn's tokens, session cost and 5-hour rate-limit usage. |
| [`clear-reminder`](clear-reminder) | Status line counting prompts since the last `/clear` (`🟢 mesaj ▰▰▱ 7/20`); turns yellow at 17 and red at 20, with a toast. |
| [`git-band`](git-band) | One line above the prompt: branch, changed-file count, ahead/behind. Refreshes every 15 s and after each turn. |
| [`todo-pane`](todo-pane) | Live pane of Claude's todo list (TodoWrite or TaskCreate/TaskUpdate) with a progress bar. Opens by itself; `/todos` reopens it. |
| [`agents-pane`](agents-pane) | Live pane of subagents with status, elapsed time and a **Stop** button for each running one. `/subagents` reopens it. |
| [`session-diff`](session-diff) | `/session-diff` lists every file changed this session with `+/−` counts; press a file to read its diff (`b` back, `k`/`j` page). |

![Status lines and the git band](docs/prompt-area.svg)

![todo-pane, agents-pane and session-diff](docs/panes.svg)

### Habits and records

| Mod | What it does |
| --- | --- |
| [`prompt-score`](prompt-score) | Toasts a quality score for every prompt you type (clarity, context, specificity, verifiability) with one hint for the weakest part. Local rules, no API calls. Hints are in Turkish. |
| [`time-tracker`](time-tracker) | Adds up how long Claude works per project per day; `/zaman` shows the last 7 days. |
| [`session-journal`](session-journal) | Appends one line per turn to `~/.claude/journal/<date>.md`; `/gunluk` adds a Haiku-written summary of the session. |

### Fun

| Mod | What it does |
| --- | --- |
| [`clawd-spinner`](clawd-spinner) | Pixel-art Clawd acts out the spinner word (beaming, cooking, pondering, forging, planning, wiggling) in a two-row band, with a time-of-day backdrop: morning coffee, a night sky, Friday-evening confetti. |
| [`done-sound`](done-sound) | Plays a sound when Claude finishes answering (Windows, through PowerShell's MediaPlayer). |

## Install

At a Claude Code prompt:

```
/plugin install usage-meter --marketplace kad1r/claude-mods
```

Answer `y` to add the marketplace, then pick a scope. Repeat with any mod name from the tables above. `/reload-plugins` picks up updates.

**done-sound:** the sound file is not in the repo. Put any mp3 at `done-sound/sounds/done.mp3` inside the installed plugin folder.

## Notes

- Function hooks are an early-access API of Claude Code and may change between releases. These mods were written and tested on Claude Code 2.1.296.
- `session-journal` writes the first line of your prompts to disk in plain text. Keep that in mind if you paste secrets into prompts.
- `/gunluk` makes one Haiku request each time you run it.
- The images above are drawn from the mods' own output (Clawd's frames from `scene.ts`, the status-line and pane text from each mod's functions), not cropped from a live session.

## Develop

Each mod is three files: `.claude-plugin/plugin.json`, `hooks/hooks.json` and a hooks module in `hooks/`. Mods that keep values in `$.state` also have `types/index.d.ts`.

```
claude plugin validate ./<mod>
claude plugin test ./<mod>
```

To run from a local clone, add it as a marketplace (`claude plugin marketplace add <path>`), install from it, and run `/reload-plugins` after edits; the plugin is read straight from the folder.

---

<a id="türkçe"></a>

# claude-mods (Türkçe)

[English](#claude-mods) · **Türkçe**

[Claude Code](https://claude.com/claude-code) için küçük, tek işe odaklı mod'lar. Hepsi Claude Code'un function-hook plugin API'si ile yazıldı. Her klasör bir plugin; repo kökü bir plugin marketplace'i, yani sadece istediğin mod'ları kurarsın.

![Clawd, prompt'un üstünde spinner kelimesini canlandırıyor](docs/clawd.svg)

## Neler var

### Claude ne yapıyor, gör

| Mod | Ne yapar |
| --- | --- |
| [`usage-meter`](usage-meter) | Durum satırı: context doluluk çubuğu ve token/pencere, canlı turn sayacı, son turn'ün token'ı, oturum maliyeti, 5 saatlik limit kullanımı. |
| [`clear-reminder`](clear-reminder) | Son `/clear`'dan beri yazdığın mesajları sayan durum satırı (`🟢 mesaj ▰▰▱ 7/20`); 17'de sarı, 20'de kırmızı olur ve toast gösterir. |
| [`git-band`](git-band) | Prompt'un üstünde tek satır: branch, değişen dosya sayısı, ahead/behind. 15 saniyede bir ve her turn sonunda yenilenir. |
| [`todo-pane`](todo-pane) | Claude'un yapılacaklar listesini (TodoWrite veya TaskCreate/TaskUpdate) ilerleme çubuğuyla gösteren canlı panel. Kendiliğinden açılır; `/todos` tekrar açar. |
| [`agents-pane`](agents-pane) | Subagent'ları durum ve süreyle gösteren canlı panel; çalışan her birinin yanında **Durdur** butonu. `/subagents` tekrar açar. |
| [`session-diff`](session-diff) | `/session-diff` bu oturumda değişen dosyaları `+/−` sayılarıyla listeler; bir dosyaya basınca diff'ini gösterir (`b` geri, `k`/`j` sayfa). |

![Durum satırları ve git bandı](docs/prompt-area.svg)

![todo-pane, agents-pane ve session-diff](docs/panes.svg)

### Alışkanlık ve kayıt

| Mod | Ne yapar |
| --- | --- |
| [`prompt-score`](prompt-score) | Yazdığın her prompt'a kalite puanı verir (netlik, bağlam, kapsam, doğrulanabilirlik) ve en zayıf kısım için tek bir ipucu gösterir. Yerel kurallar, API çağrısı yok. |
| [`time-tracker`](time-tracker) | Claude'un proje bazında günlük çalıştığı süreyi toplar; `/zaman` son 7 günü gösterir. |
| [`session-journal`](session-journal) | Her turn için `~/.claude/journal/<tarih>.md` dosyasına bir satır ekler; `/gunluk` oturumun Haiku ile yazılmış özetini ekler. |

### Eğlence

| Mod | Ne yapar |
| --- | --- |
| [`clawd-spinner`](clawd-spinner) | Piksel Clawd, spinner kelimesini (beaming, cooking, pondering, forging, planning, wiggling) iki satırlık bir bantta canlandırır. Arka plan saate göre değişir: sabah kahve, gece gökyüzü, cuma akşamı konfeti. |
| [`done-sound`](done-sound) | Claude cevabı bitirince ses çalar (Windows, PowerShell MediaPlayer ile). |

## Kurulum

Claude Code prompt'unda:

```
/plugin install usage-meter --marketplace kad1r/claude-mods
```

Marketplace'i eklemek için `y` de, sonra scope seç. Tablolardaki diğer mod adlarıyla tekrarla. Güncellemeler için `/reload-plugins`.

**done-sound:** Ses dosyası repoda yok. Kurulan plugin klasöründe `done-sound/sounds/done.mp3` yoluna istediğin bir mp3 koy.

## Notlar

- Function hook'lar Claude Code'un erken erişim API'si; sürümler arasında değişebilir. Bu mod'lar Claude Code 2.1.296 üzerinde yazılıp test edildi.
- `session-journal`, prompt'larının ilk satırını diske düz metin olarak yazar. Prompt'a secret yapıştırıyorsan bunu göz önünde tut.
- `/gunluk` her çalıştığında bir Haiku isteği yapar.
- Yukarıdaki görseller mod'ların kendi çıktısından çizildi (Clawd kareleri `scene.ts`'den, durum satırı ve panel metinleri mod fonksiyonlarından); canlı oturumdan kırpılmadı.

## Geliştirme

Her mod üç dosyadan oluşur: `.claude-plugin/plugin.json`, `hooks/hooks.json` ve `hooks/` altında bir hooks modülü. `$.state` kullananlarda ayrıca `types/index.d.ts` vardır.

```
claude plugin validate ./<mod>
claude plugin test ./<mod>
```

Yerel bir klondan çalıştırmak için klonu marketplace olarak ekle (`claude plugin marketplace add <yol>`), oradan kur ve değişikliklerden sonra `/reload-plugins` çalıştır; plugin doğrudan klasörden okunur.
