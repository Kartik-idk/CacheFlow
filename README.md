# CacheFlow — Interactive Cache Memory Simulator

An interactive, educational Operating Systems mini-project demonstrating CPU cache memory, multi-level hierarchy (L1/L2/L3), First-In First-Out (FIFO) cache replacement, performance analytics (Hit & Miss ratios), and Locality of Reference principles.

Designed for college students and faculty to visualize computer system memory concepts without unnecessary framework overhead.

---

## 📌 Project Objective

The gap between CPU execution speed (sub-nanosecond) and main memory DRAM latency (~60–100ns) is known as the **Memory Wall**. Operating systems and hardware architectures bridge this disparity using a multi-tiered cache memory hierarchy. 

**CacheFlow** provides a hands-on, visual dashboard to:
1. Understand how CPU cache minimizes pipeline stalls.
2. Observe how memory addresses are checked, placed, and evicted in a 4-slot cache.
3. Trace the **FIFO (First-In, First-Out)** replacement policy step by step.
4. Calculate mathematical performance indicators (**Hit Ratio**, **Miss Ratio**, and **AMAT**).
5. Explore **Temporal Locality** and **Spatial Locality** through interactive test patterns.

---

## 🛠️ Technology Stack

Built entirely client-side using standard web technologies:
- **HTML5**: Clean, semantic markup structured for educational inspection.
- **CSS3**: Modern dark-tech dashboard theme using CSS Grid, Flexbox, custom properties, and smooth hardware-accelerated transitions.
- **Vanilla JavaScript (ES6+)**: Zero external dependencies or frameworks; clean, readable state management and event-driven DOM updates.

---

## ✨ Features

- **Computer System Dashboard**: Dark navy and charcoal tech aesthetics mimicking an OS memory monitor.
- **Multi-Level Architecture Explorer**: Clickable inspection cards for CPU, L1 Cache, L2 Cache, L3 Cache, and Main Memory (DRAM) detailing latency, capacity, and role.
- **Interactive 4-Slot Cache**:
  - Live slot visualization showing stored address, occupancy state, insertion age, and FIFO status.
  - Instant visual feedback on **Cache Hits** (green pulse), **Cache Misses** (cyan pulse), and **FIFO Evictions** (amber pulse).
  - Clear, informative notification banner explaining each action in human-readable terms.
- **FIFO Eviction Queue Bar**: Dedicated horizontal visual queue identifying the oldest loaded block marked next in line for eviction.
- **Address Sequence Runner**: Process batch memory addresses (e.g., `10, 20, 10, 30, 20, 40`) with customizable speed (Fast, Normal, Slow) and Play/Stop controls.
- **Quick Preset Workloads**:
  - College Example (`10, 20, 10, 30, 20, 40`)
  - Temporal Heavy (`10, 10, 10, 20, 20, 10`)
  - Spatial Walk (`10, 11, 12, 13, 14, 15`)
  - FIFO Thrashing (`1, 2, 3, 4, 5, 1, 2`)
- **Step-by-Step Execution Log**: Scrollable audit table detailing step count, memory address, outcome, action description, and slot snapshots.
- **Live Performance Analytics**:
  - Total requests, hits, misses.
  - Dynamically calculated **Hit Ratio** and **Miss Ratio** percentages.
  - Segmented visual distribution progress bar.
  - Formula preview showing college exam calculations.
- **Locality of Reference Section**: Visual side-by-side breakdown of Temporal vs. Spatial Locality with runnable C code examples.
- **OS Exam Study Guide**: High-yield summaries covering standard Operating Systems viva and exam questions.

---

## 🔬 How the Simulator Works

The simulator models a fully associative 4-block cache utilizing a **First-In, First-Out (FIFO)** replacement policy:

1. **Address Access**:
   When an address (e.g. `10`) is requested:
   - The simulator checks all 4 slots.
   - **Cache Hit**: If the address already exists in any slot, a hit is recorded. No memory bus transfer is needed.
   - **Cache Miss**: If absent, a miss is recorded.
2. **Placement**:
   - If an empty slot exists (slots 0–3), the address is placed in the first vacant slot and recorded at the back of the FIFO queue.
3. **FIFO Replacement**:
   - When all 4 slots are occupied and a miss occurs, the slot that was inserted earliest (front of the FIFO queue) is chosen as the victim.
   - The victim's address is evicted, the new address is loaded into that slot, and the slot is moved to the back of the FIFO queue.
4. **Formulas Applied**:
   $$\text{Hit Ratio} = \left( \frac{\text{Cache Hits}}{\text{Total Requests}} \right) \times 100$$
   $$\text{Miss Ratio} = \left( \frac{\text{Cache Misses}}{\text{Total Requests}} \right) \times 100$$

---

## 📁 Project Structure

```
CacheFlow/
├── index.html       # Single-page HTML structure & semantic sections
├── style.css        # Minimalist dark dashboard styling & responsive layout
├── script.js        # Simulator engine, FIFO queue logic, and UI controllers
└── README.md        # Comprehensive documentation & deployment guide
```

---

## 🚀 Running Locally

Because CacheFlow is a 100% static client-side project, you can run it directly:

### Option 1: Open Directly in Browser
Double-click `index.html` or open it with any web browser (Chrome, Safari, Firefox, Edge).

### Option 2: Using Python Simple Server (Recommended)
From the project root:
```bash
python3 -m http.server 8000
```
Then navigate to: `http://localhost:8000`

### Option 3: Using Node / npx
```bash
npx serve .
```

---

## 🌐 Deployment on Vercel

CacheFlow is fully prepared for instant, zero-configuration static deployment on Vercel:

1. **Push your code to GitHub**:
   Ensure your local repository is pushed to your GitHub account (see instructions below).
2. **Log in to Vercel**:
   Go to [vercel.com](https://vercel.com) and log in with your GitHub account.
3. **Import Project**:
   - Click **Add New...** → **Project**.
   - Select your `CacheFlow` repository.
4. **Deploy**:
   - Framework Preset: **Other** (Static).
   - Root Directory: `./` (leave default).
   - Build Command: None (leave blank).
   - Output Directory: None (leave blank).
   - Click **Deploy**.
5. Your project will be live with an official `*.vercel.app` URL within seconds!

---

## 🐙 Connecting to GitHub

If you wish to link this local repository to your GitHub account:

1. Create a new repository on [GitHub](https://github.com/new) named `CacheFlow` (do not initialize with README, as we already have one).
2. Add the remote and push:
   ```bash
   git remote add origin https://github.com/<YOUR_USERNAME>/CacheFlow.git
   git branch -M main
   git push -u origin main
   ```

*(Alternatively, if using the GitHub CLI: `gh repo create CacheFlow --public --source=. --push`)*

---

## 🎓 Academic Coursework Note

- **Course**: Operating Systems (CS / IT)
- **Topic**: Memory Management, Cache Hierarchies & Replacement Algorithms
- **Author**: Kartikeya Pradhan
- **License**: MIT

