# CacheFlow

> An interactive, browser-based simulator for learning how CPU cache memory works.

[Live demo](https://cacheflow-ten.vercel.app)

CacheFlow turns cache-memory concepts into a hands-on visual exercise. Step through memory accesses, watch a four-slot cache fill and evict entries using FIFO, and see how hit rate, miss rate, and AMAT respond.

## What you can explore

- CPU, L1, L2, L3, and DRAM hierarchy.
- A live four-slot cache visualisation.
- First-In, First-Out (FIFO) replacement.
- Cache hits, misses, and evictions.
- Hit ratio, miss ratio, and average memory access time (AMAT).
- Temporal and spatial locality patterns.

## Built with

- HTML5
- CSS3
- Vanilla JavaScript (ES6+)

No build system, framework, or external dependency is required.

## Run locally

```bash
git clone https://github.com/Kartik-idk/CacheFlow.git
cd CacheFlow
open index.html
```

Or serve the directory with any static file server.

## Project layout

- `index.html` — structure and accessible page content
- `style.css` — responsive interface styling
- `script.js` — simulator state, FIFO logic, and interactions
- `assets/` — project assets

## Educational use

CacheFlow is designed as a compact Operating Systems learning project: it favours visual feedback and approachable explanations over framework complexity.
