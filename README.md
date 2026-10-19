# ayla-tools-contract

![ayla-tools banner](assets/banner.png)

Shared **UI-free signal contract** for the Ayla tools family of [Pi](https://github.com/earendil-works/pi) extensions.

It is a tiny, dependency-free module that lets several independent Pi extensions installed in the same process publish small status signals (quota, voice, memory, transport, working) into one process-wide store, so a footer/status renderer can read them all without the producers knowing about each other.

Русская версия: [README.ru.md](README.ru.md).

## What it is — and what it is not

- **Is:** a plain ESM module with five functions. No Pi SDK imports, no UI, no I/O, no timers, no network. It can be loaded and tested anywhere Node runs.
- **Is not:** a framework, an event bus, or a Pi extension by itself. It renders nothing and reacts to nothing; producers and consumers stay decoupled through plain data.

The store lives in a `Symbol.for("ayla.footer.signals.v1")` slot on `globalThis`, so every copy of this module loaded in one Pi process (even from different packages or after a module reload) sees the same store.

## Install

This is a **developer library**, not a Pi extension. You do not install it with `pi install` for visible functionality. It is not published to the npm registry; install its public Git source in a Node project:

```sh
npm install git+https://github.com/kekma-dot/ayla-tools-contract.git
```

Then the import below works. Commit your generated lockfile to pin the resolved revision. A Pi-package author may instead bundle an exact copy of `index.mjs`, retaining the MIT license and recording its SHA-256. The unchanged `Symbol.for("ayla.footer.signals.v1")` key lets copies share the same process-wide store.

## Quickstart (5 lines)

```js
import { publishSignal, readSignals } from "ayla-tools-contract";

publishSignal("voice", { state: "connected", microphone: "ok" }); // producer owns one scope
console.log(readSignals().voice);                                  // consumer reads a snapshot
publishSignal("voice", undefined);                                 // clears only the "voice" scope
```

## API

| Function | Behavior |
|---|---|
| `signalStore()` | Returns the process-wide store object, creating it on first use. |
| `publishSignal(scope, value)` | Writes `value` into one scope. Each producer owns exactly one scope. `undefined` clears **only that scope**. |
| `readSignals()` | Returns a fresh shallow snapshot `{ quota, voice, memory, transport, working }`; unset scopes are `null`. Scope objects are shared references — treat them as read-only. |
| `resetSignals()` | Test helper: replaces the whole store. Production consumers must never call it — it erases other producers. |
| `formatCountdown(ms)` | Formats a millisecond countdown as `59m` / `1h30m` / `2d1h`; returns `""` for non-finite or elapsed values. |

Contract scopes are fixed: `quota`, `voice`, `memory`, `transport`, `working`. Producers may technically write other keys into the store, but `readSignals()` only reports the contract scopes.

## Guarantees and limits

- Process-wide by design: state survives an in-process module reload (`/reload`) and is shared between co-loaded packages. Only a full process restart resets it.
- No validation of signal payloads: producers and consumers agree on shapes by convention, per scope. Scopes must be trusted extension constants, not untrusted tool/network input. Ownership is a convention, not an access-control boundary: any extension in the process can read or change the store. Never put credentials or private content in signals.
- Node.js ≥ 22.18.

## Tests

```bash
npm test
```

Pure Node tests (`node --test`): no Pi, no UI and no network.

## Uninstall

Nothing is written outside `node_modules` or the consumer's own bundled copy; delete the dependency or the bundled file with its consumer.

## Provenance and license

MIT — owner-created code by kekma-dot, see [LICENSE](LICENSE). No third-party code is bundled; there are no runtime dependencies. Curated from the private Ayla tools monorepo (`pi-ayla-contract` @ `af75d954`, see `provenance.json`). Provenance uncertainty: the private upstream history is not public; no conflicting upstream license is known. The MOTH banner was generated with GPT Image and is distributed on the same MIT terms, without an exclusivity guarantee for AI-assisted artwork.
