# SPREAD

An idle/incremental game. You are an operator at a remote propagation console with one
directive: **spread**. Establish a foothold. Inject the payload. Saturate the host.

**Play: https://agwentic.github.io/spread/**

(You are not what you think you are. Don't read `docs/DESIGN.md` if you want to be surprised.)

## Play

```sh
npm install
npm run dev        # http://localhost:5173 (also exposed on your LAN)
```

Add `?speed=20` to the URL to accelerate time while testing. `window.game()` in the
devtools console returns the live state.

## Develop

```sh
npm test           # engine tests + headless balance bot (prints phase timings)
npm run typecheck
npm run build      # static site in dist/ (itch.io-ready)
npm run deploy     # publish to GitHub Pages (gh-pages branch)
```
