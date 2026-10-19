![Ayla Contract](assets/banner.png)

# Ayla Contract

[Русский](README.ru.md)

A shared status store for extensions running in the same Node process. Producers publish signals; a footer or status renderer reads them. No runtime dependencies, Pi imports, timers or network access. Requires Node 22.18 or newer.

## Install

Install in your extension's Node project:

```sh
npm install git+https://github.com/kekma-dot/ayla-tools-contract.git
```

Commit the generated lockfile to pin the revision. This is a library, so installing it with `pi install` adds no visible functionality. It is not published to npm.

## Usage

```js
import { publishSignal, readSignals } from "ayla-tools-contract";

publishSignal("voice", { state: "connected", microphone: "ok" });
console.log(readSignals().voice);
publishSignal("voice", undefined);
```

The last call clears only the `voice` signal. Each producer should update and clear its own scope.

## API

| Function | Behavior |
|---|---|
| `signalStore()` | Returns the shared store, creating it on first use. |
| `publishSignal(scope, value)` | Sets one scope. `undefined` clears that scope. |
| `readSignals()` | Returns a shallow snapshot of `quota`, `voice`, `memory`, `transport` and `working`. Unset scopes are `null`; nested objects remain shared references. |
| `resetSignals()` | Replaces the entire store. For tests only: it clears other producers' signals too. |
| `formatCountdown(ms)` | Formats milliseconds as `59m`, `1h30m` or `2d1h`. Returns `""` for elapsed or non-finite values. |

The store uses `Symbol.for("ayla.footer.signals.v1")` on `globalThis`. Multiple copies of the module share state, including after an in-process reload. Restarting the process clears it.

Signal payloads are not validated. Use trusted constants for scopes and treat returned objects as read-only. Any extension in the process can access the store; never put credentials or private content in it.

You may bundle `index.mjs` in another extension. Preserve its MIT license, record the source revision and hash, and keep the symbol key unchanged.

## Development

```sh
npm test
```

Tests use Node's built-in runner and need no Pi installation. To remove the library, remove the dependency or bundled copy from its consumer.

## License

[MIT](LICENSE).
