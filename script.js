/**
 * CacheFlow: Interactive Cache Memory Simulator
 * College Operating Systems Mini-Project
 *
 * Core concepts demonstrated:
 * 1. Multi-Level Memory Hierarchy (L1, L2, L3, RAM)
 * 2. Cache Hit & Cache Miss mechanics
 * 3. First-In, First-Out (FIFO) Cache Block Replacement Policy
 * 4. Hit Ratio, Miss Ratio & AMAT Performance Analytics
 * 5. Temporal and Spatial Locality of Reference
 */

// ============================================================================
// 1. DATA STRUCTURES & SIMULATOR STATE
// ============================================================================

const CACHE_SIZE = 4; // 4 cache slots as specified

// Simulator core state
const cacheState = {
  // Slots 0 to 3: each holds { address: string|null, insertionOrder: number|null }
  slots: [
    { id: 0, address: null, insertionOrder: null },
    { id: 1, address: null, insertionOrder: null },
    { id: 2, address: null, insertionOrder: null },
    { id: 3, address: null, insertionOrder: null }
  ],
  // FIFO Queue storing slot indices in order of insertion: oldest at index 0
  fifoQueue: [],
  // Monotonically increasing counter to tag insertion order
  insertionCounter: 0,
  // Performance analytics
  stats: {
    totalRequests: 0,
    hits: 0,
    misses: 0
  },
  // Step-by-step execution history
  history: [],
  // Batch sequence execution timer handle
  sequenceTimer: null,
  isSequenceRunning: false
};

// Architecture node details for interactive inspection
const architectureDetails = {
  cpu: {
    badge: 'PROCESSOR CORE',
    title: 'CPU Execution Engine',
    subtitle: 'High-frequency instruction decoder & Arithmetic Logic Unit (ALU).',
    latency: '0.2 – 0.3 ns (1 cycle)',
    capacity: 'Registers: ~1 KB total',
    location: 'Inside execution core',
    split: 'General Purpose & Vector Registers',
    desc: 'The CPU generates memory read and write requests whenever an instruction references variables, arrays, or stack pointers. Because CPU registers are tiny, the processor immediately relies on the cache hierarchy to satisfy address references without stalling the pipeline.',
    tip: 'OS Concept: A pipeline stall occurs if the CPU must wait for memory data. Effective caching minimizes these CPU stalls.'
  },
  l1: {
    badge: 'L1 CACHE',
    title: 'Level 1 (L1) Cache',
    subtitle: 'Primary on-die cache operating synchronously with CPU clock frequency.',
    latency: '~0.5 – 1.0 ns (1–4 cycles)',
    capacity: '32 KB – 64 KB per core',
    location: 'Integrated directly inside core silicon',
    split: 'Harvard Architecture: L1-Instruction (L1-I) & L1-Data (L1-D)',
    desc: 'L1 cache is the fastest and smallest cache level. It is split into separate Instruction (L1-I) and Data (L1-D) caches to allow simultaneous instruction fetches and operand reads without bus contention.',
    tip: 'OS Concept: A high L1 hit rate ensures high Instructions Per Cycle (IPC), shielding the CPU from off-chip bus delays.'
  },
  l2: {
    badge: 'L2 CACHE',
    title: 'Level 2 (L2) Cache',
    subtitle: 'Secondary dedicated cache serving as high-speed spillover for L1 misses.',
    latency: '~3 – 7 ns (10–14 cycles)',
    capacity: '256 KB – 1 MB per core',
    location: 'Dedicated per core or tightly paired',
    split: 'Unified (Stores both instructions and data)',
    desc: 'When an address is not found in L1 (L1 miss), the memory request forwards to L2. While slightly slower than L1, L2 is much larger and still an order of magnitude faster than accessing system DRAM.',
    tip: 'OS Concept: L2 cache captures medium-sized working sets such as medium loops and frequently called library routines.'
  },
  l3: {
    badge: 'L3 CACHE (LLC)',
    title: 'Level 3 (L3) Cache',
    subtitle: 'Last-Level Cache (LLC) shared across all CPU cores on the chip die.',
    latency: '~10 – 20 ns (40–60 cycles)',
    capacity: '8 MB – 64 MB+ shared',
    location: 'On-chip, shared interconnect bus',
    split: 'Unified, multi-banked slice architecture',
    desc: 'L3 cache is the final cache defense before the processor must venture out to external DRAM. Because it is shared across all cores, L3 also plays a crucial role in multi-core cache coherency and fast inter-thread communication.',
    tip: 'OS Concept: Threads scheduled by the OS on different cores can share cached memory blocks through L3 without touching RAM.'
  },
  ram: {
    badge: 'MAIN MEMORY',
    title: 'Main Memory (DRAM)',
    subtitle: 'High-density, volatile system memory connected across the motherboard bus.',
    latency: '~60 – 100 ns (200+ cycles)',
    capacity: '16 GB – 64 GB+ system-wide',
    location: 'DIMM sockets on motherboard',
    split: 'Row/Column bank matrix (DDR4 / DDR5)',
    desc: 'Dynamic RAM stores the operating system kernel and running user processes. Although spacious and inexpensive per gigabyte, DRAM requires periodic capacitor refreshing and suffers high latency over physical memory buses.',
    tip: 'OS Concept: The "Memory Wall" describes the stark gap between 0.3ns CPU cycle speeds and 70ns DRAM access times.'
  }
};

// ============================================================================
// 2. DOM ELEMENT REFERENCES
// ============================================================================

const dom = {
  // Simulator inputs & buttons
  addressInput: document.getElementById('address-input'),
  sequenceInput: document.getElementById('sequence-input'),
  btnAccess: document.getElementById('btn-access'),
  btnRandom: document.getElementById('btn-random'),
  btnRunSeq: document.getElementById('btn-run-seq'),
  btnStopSeq: document.getElementById('btn-stop-seq'),
  btnReset: document.getElementById('btn-reset'),
  btnClearLog: document.getElementById('btn-clear-log'),
  speedSelect: document.getElementById('speed-select'),

  // Status banner elements
  statusBanner: document.getElementById('status-banner'),
  statusType: document.getElementById('status-type'),
  statusHeadline: document.getElementById('status-headline'),
  statusDetail: document.getElementById('status-detail'),

  // Visual Cache Slots
  slots: [
    document.getElementById('slot-0'),
    document.getElementById('slot-1'),
    document.getElementById('slot-2'),
    document.getElementById('slot-3')
  ],
  fifoQueueDisplay: document.getElementById('fifo-queue-display'),

  // Execution Log
  logTableBody: document.getElementById('log-table-body'),
  logCount: document.getElementById('log-count'),

  // Analytics KPIs
  kpiTotal: document.getElementById('kpi-total'),
  kpiHits: document.getElementById('kpi-hits'),
  kpiMisses: document.getElementById('kpi-misses'),
  kpiHitRatio: document.getElementById('kpi-hit-ratio'),
  kpiMissRatio: document.getElementById('kpi-miss-ratio'),

  // Distribution chart
  distHitFill: document.getElementById('dist-hit-fill'),
  distMissFill: document.getElementById('dist-miss-fill'),
  distHitLabel: document.getElementById('dist-hit-label'),
  distMissLabel: document.getElementById('dist-miss-label'),
  legendHits: document.getElementById('legend-hits'),
  legendMisses: document.getElementById('legend-misses'),
  distSampleLabel: document.getElementById('dist-sample-label'),
  perfInsightText: document.getElementById('perf-insight-text'),

  // Formulas
  calcHitFormula: document.getElementById('calc-hit-formula'),
  calcMissFormula: document.getElementById('calc-miss-formula'),

  // Architecture panel
  archNodes: document.querySelectorAll('.arch-node'),
  detailBadge: document.getElementById('detail-badge'),
  detailTitle: document.getElementById('detail-title'),
  detailSubtitle: document.getElementById('detail-subtitle'),
  detailLatency: document.getElementById('detail-latency'),
  detailCapacity: document.getElementById('detail-capacity'),
  detailLocation: document.getElementById('detail-location'),
  detailSplit: document.getElementById('detail-split'),
  detailDesc: document.getElementById('detail-desc'),
  detailTip: document.getElementById('detail-tip')
};

// ============================================================================
// 3. CORE SIMULATION ENGINE (FIFO REPLACEMENT)
// ============================================================================

/**
 * Standardizes user address input.
 * Strips whitespace and normalizes format.
 */
function normalizeAddress(input) {
  if (typeof input !== 'string') input = String(input);
  return input.trim().toUpperCase();
}

/**
 * Validates a memory address input.
 * Accepts numeric integers (e.g. 10, 2048) or hex strings (e.g. 0x1A, 0xFF).
 */
function isValidAddress(address) {
  if (!address || address.length === 0) return false;
  // Allow decimal digits or valid hex prefix (0x...)
  const isDecimal = /^[0-9]+$/.test(address);
  const isHex = /^0X[0-9A-F]+$/.test(address);
  return isDecimal || isHex;
}

/**
 * Executes a single memory address access in the cache simulator.
 * Core Educational Logic:
 * 1. Check if address already exists in one of the 4 slots.
 *    -> If found: CACHE HIT.
 * 2. If not found: CACHE MISS.
 *    -> If empty slot exists: Load address into the first available empty slot.
 *    -> If all slots are full: FIFO replacement — evict the oldest inserted slot.
 */
function accessAddress(rawAddress) {
  const address = normalizeAddress(rawAddress);

  if (!isValidAddress(address)) {
    updateStatusBanner(
      'error',
      'INVALID ADDRESS',
      `"${rawAddress}" is not a valid memory address.`,
      'Please enter a non-negative decimal (e.g. 10, 20) or hexadecimal address (e.g. 0x1A).'
    );
    return null;
  }

  cacheState.stats.totalRequests++;

  // Step 1: Check for Cache Hit
  const hitSlotIndex = cacheState.slots.findIndex(slot => slot.address === address);

  if (hitSlotIndex !== -1) {
    // --- CACHE HIT ---
    cacheState.stats.hits++;

    const logEntry = {
      step: cacheState.stats.totalRequests,
      address: address,
      outcome: 'HIT',
      slotId: hitSlotIndex,
      action: `Found in Slot ${hitSlotIndex}. Fast SRAM access; no RAM fetch required.`,
      snapshot: getCacheSnapshot()
    };

    cacheState.history.push(logEntry);

    // Update UI components
    updateStatusBanner(
      'hit',
      'CACHE HIT',
      `Address [${address}] found in Slot ${hitSlotIndex}!`,
      `Zero wait penalty. Data served directly from high-speed cache memory.`
    );

    triggerSlotAnimation(hitSlotIndex, 'hit');
    updateSlotsUI();
    updateFIFOQueueUI();
    appendLogRow(logEntry);
    updateAnalyticsUI();

    return { outcome: 'HIT', slotId: hitSlotIndex, address };
  }

  // --- CACHE MISS ---
  cacheState.stats.misses++;

  // Step 2: Check if there is an empty slot available
  const emptySlotIndex = cacheState.slots.findIndex(slot => slot.address === null);

  if (emptySlotIndex !== -1) {
    // Cache Miss with empty slot available
    cacheState.insertionCounter++;
    cacheState.slots[emptySlotIndex].address = address;
    cacheState.slots[emptySlotIndex].insertionOrder = cacheState.insertionCounter;

    // Push into FIFO queue
    cacheState.fifoQueue.push(emptySlotIndex);

    const logEntry = {
      step: cacheState.stats.totalRequests,
      address: address,
      outcome: 'MISS',
      slotId: emptySlotIndex,
      action: `Missed. Fetched from RAM and placed into empty Slot ${emptySlotIndex}.`,
      snapshot: getCacheSnapshot()
    };

    cacheState.history.push(logEntry);

    updateStatusBanner(
      'miss',
      'CACHE MISS',
      `Address [${address}] not in cache. Loaded into empty Slot ${emptySlotIndex}.`,
      `Data retrieved from slower main memory (DRAM) and cached for future requests.`
    );

    triggerSlotAnimation(emptySlotIndex, 'miss');
    updateSlotsUI();
    updateFIFOQueueUI();
    appendLogRow(logEntry);
    updateAnalyticsUI();

    return { outcome: 'MISS', slotId: emptySlotIndex, address, replaced: null };
  }

  // Step 3: Cache Miss when ALL 4 SLOTS ARE FULL -> FIFO Replacement
  // The oldest entry is at the front of fifoQueue
  const victimSlotIndex = cacheState.fifoQueue.shift();
  const evictedAddress = cacheState.slots[victimSlotIndex].address;

  // Insert new address into the victim slot
  cacheState.insertionCounter++;
  cacheState.slots[victimSlotIndex].address = address;
  cacheState.slots[victimSlotIndex].insertionOrder = cacheState.insertionCounter;

  // Add updated slot to the end of FIFO queue
  cacheState.fifoQueue.push(victimSlotIndex);

  const logEntry = {
    step: cacheState.stats.totalRequests,
    address: address,
    outcome: 'EVICT',
    slotId: victimSlotIndex,
    action: `Cache full! Evicted oldest Address [${evictedAddress}] from Slot ${victimSlotIndex} (FIFO) and loaded [${address}].`,
    snapshot: getCacheSnapshot()
  };

  cacheState.history.push(logEntry);

  updateStatusBanner(
    'evict',
    'CACHE MISS — FIFO REPLACEMENT',
    `Evicted Address [${evictedAddress}] from Slot ${victimSlotIndex} to make room for [${address}].`,
    `All 4 slots were full. The FIFO policy evicted the oldest loaded cache block.`
  );

  triggerSlotAnimation(victimSlotIndex, 'evict');
  updateSlotsUI();
  updateFIFOQueueUI();
  appendLogRow(logEntry);
  updateAnalyticsUI();

  return { outcome: 'MISS_REPLACED', slotId: victimSlotIndex, address, replaced: evictedAddress };
}

/**
 * Returns an array snapshot of current slot values for logging.
 */
function getCacheSnapshot() {
  return cacheState.slots.map(s => (s.address !== null ? s.address : '—'));
}

// ============================================================================
// 4. UI UPDATE FUNCTIONS
// ============================================================================

/**
 * Updates the 4 cache slot visual cards.
 */
function updateSlotsUI() {
  cacheState.slots.forEach((slot, index) => {
    const card = dom.slots[index];
    const stateBadge = card.querySelector('.slot-state-badge');
    const valElem = card.querySelector('.slot-value');
    const orderElem = card.querySelector('.slot-order');
    const fifoTagElem = card.querySelector('.slot-fifo-tag');

    if (slot.address === null) {
      stateBadge.className = 'slot-state-badge empty';
      stateBadge.textContent = 'EMPTY';
      valElem.textContent = '—';
      valElem.style.color = '#64748b';
      orderElem.textContent = 'Age: None';
      fifoTagElem.textContent = '—';
    } else {
      stateBadge.className = 'slot-state-badge occupied';
      stateBadge.textContent = 'OCCUPIED';
      valElem.textContent = slot.address;
      valElem.style.color = '#fff';
      orderElem.textContent = `Order #${slot.insertionOrder}`;

      // Check FIFO position
      const fifoPos = cacheState.fifoQueue.indexOf(index);
      if (fifoPos === 0 && cacheState.fifoQueue.length === CACHE_SIZE) {
        fifoTagElem.textContent = '⚠️ Next to Evict';
        fifoTagElem.style.color = 'var(--evict-amber)';
      } else if (fifoPos === 0 && cacheState.fifoQueue.length > 0) {
        fifoTagElem.textContent = 'Oldest';
        fifoTagElem.style.color = 'var(--accent-cyan)';
      } else if (fifoPos === cacheState.fifoQueue.length - 1) {
        fifoTagElem.textContent = 'Newest';
        fifoTagElem.style.color = 'var(--accent-teal)';
      } else {
        fifoTagElem.textContent = `Queue #${fifoPos + 1}`;
        fifoTagElem.style.color = 'var(--text-dim)';
      }
    }
  });
}

/**
 * Updates the horizontal FIFO eviction queue visual bar.
 */
function updateFIFOQueueUI() {
  if (cacheState.fifoQueue.length === 0) {
    dom.fifoQueueDisplay.innerHTML = '<span class="queue-empty">Cache is empty — no replacement pending</span>';
    return;
  }

  let html = '';
  cacheState.fifoQueue.forEach((slotIndex, pos) => {
    const slot = cacheState.slots[slotIndex];
    const isOldest = pos === 0;
    const isFull = cacheState.fifoQueue.length === CACHE_SIZE;

    html += `
      <div class="queue-token ${isOldest && isFull ? 'oldest' : ''}">
        <span>${isOldest ? '👑 Oldest' : `#${pos + 1}`}</span>
        <strong>Slot ${slotIndex} [${slot.address}]</strong>
      </div>
    `;

    if (pos < cacheState.fifoQueue.length - 1) {
      html += `<span class="queue-arrow">➔</span>`;
    }
  });

  dom.fifoQueueDisplay.innerHTML = html;
}

/**
 * Animates a slot card to give visual feedback during an access event.
 */
function triggerSlotAnimation(slotIndex, type) {
  const card = dom.slots[slotIndex];
  if (!card) return;

  // Remove previous animation classes
  card.classList.remove('hit-active', 'miss-active', 'evict-active');

  // Trigger reflow to restart animation
  void card.offsetWidth;

  if (type === 'hit') {
    card.classList.add('hit-active');
  } else if (type === 'miss') {
    card.classList.add('miss-active');
  } else if (type === 'evict') {
    card.classList.add('evict-active');
  }

  setTimeout(() => {
    card.classList.remove('hit-active', 'miss-active', 'evict-active');
  }, 1000);
}

/**
 * Updates the feedback status banner.
 */
function updateStatusBanner(type, badgeText, headline, detail) {
  dom.statusBanner.className = `status-banner status-${type}`;
  dom.statusType.className = `status-pill ${type}`;
  dom.statusType.textContent = badgeText;
  dom.statusHeadline.textContent = headline;
  dom.statusDetail.textContent = detail;

  const iconElem = dom.statusBanner.querySelector('.status-indicator-icon');
  if (type === 'hit') iconElem.textContent = '✓';
  else if (type === 'miss') iconElem.textContent = '✕';
  else if (type === 'evict') iconElem.textContent = '↺';
  else if (type === 'error') iconElem.textContent = '⚠️';
  else iconElem.textContent = '⚡';
}

/**
 * Appends a new event entry into the Execution Log table.
 */
function appendLogRow(entry) {
  // If first row, remove placeholder
  const emptyRow = dom.logTableBody.querySelector('.empty-row');
  if (emptyRow) {
    emptyRow.remove();
  }

  const tr = document.createElement('tr');

  let badgeClass = 'miss';
  let badgeLabel = 'MISS';
  if (entry.outcome === 'HIT') {
    badgeClass = 'hit';
    badgeLabel = 'HIT';
  } else if (entry.outcome === 'EVICT') {
    badgeClass = 'evict';
    badgeLabel = 'MISS (FIFO)';
  }

  tr.innerHTML = `
    <td><strong>#${entry.step}</strong></td>
    <td><code>${entry.address}</code></td>
    <td><span class="log-outcome-badge ${badgeClass}">${badgeLabel}</span></td>
    <td>${entry.action}</td>
    <td><code>[ ${entry.snapshot.join(', ')} ]</code></td>
  `;

  // Prepend to top of log for instant visibility of recent activity
  dom.logTableBody.insertBefore(tr, dom.logTableBody.firstChild);

  // Update event count
  dom.logCount.textContent = `${cacheState.history.length} event${cacheState.history.length === 1 ? '' : 's'}`;
}

/**
 * Updates all Performance Analytics cards, progress bars, and formulas.
 */
function updateAnalyticsUI() {
  const { totalRequests, hits, misses } = cacheState.stats;

  dom.kpiTotal.textContent = totalRequests;
  dom.kpiHits.textContent = hits;
  dom.kpiMisses.textContent = misses;

  let hitRatio = 0;
  let missRatio = 0;

  if (totalRequests > 0) {
    hitRatio = (hits / totalRequests) * 100;
    missRatio = (misses / totalRequests) * 100;
  }

  dom.kpiHitRatio.textContent = `${hitRatio.toFixed(1)}%`;
  dom.kpiMissRatio.textContent = `${missRatio.toFixed(1)}%`;

  // Update Distribution Bar
  if (totalRequests === 0) {
    dom.distHitFill.style.width = '50%';
    dom.distMissFill.style.width = '50%';
    dom.distHitLabel.textContent = '0% Hits';
    dom.distMissLabel.textContent = '0% Misses';
  } else {
    dom.distHitFill.style.width = `${hitRatio}%`;
    dom.distMissFill.style.width = `${missRatio}%`;
    dom.distHitLabel.textContent = `${hitRatio.toFixed(1)}% Hits`;
    dom.distMissLabel.textContent = `${missRatio.toFixed(1)}% Misses`;
  }

  dom.legendHits.textContent = hits;
  dom.legendMisses.textContent = misses;
  dom.distSampleLabel.textContent = `${totalRequests} total sample${totalRequests === 1 ? '' : 's'}`;

  // Update formula breakdown cards
  if (totalRequests === 0) {
    dom.calcHitFormula.textContent = 'Formula: (0 / 0) × 100 = 0.00%';
    dom.calcMissFormula.textContent = 'Formula: (0 / 0) × 100 = 0.00%';
    dom.perfInsightText.textContent = 'Run simulator requests to observe the hit ratio curve. In real programs with strong locality, hit ratios routinely reach 90%–98%.';
  } else {
    dom.calcHitFormula.textContent = `Formula: (${hits} / ${totalRequests}) × 100 = ${hitRatio.toFixed(2)}%`;
    dom.calcMissFormula.textContent = `Formula: (${misses} / ${totalRequests}) × 100 = ${missRatio.toFixed(2)}%`;

    if (hitRatio >= 70) {
      dom.perfInsightText.textContent = `Excellent locality! With a ${hitRatio.toFixed(1)}% hit ratio, the CPU is operating close to peak SRAM speed, avoiding costly RAM latency cycles.`;
    } else if (hitRatio >= 40) {
      dom.perfInsightText.textContent = `Moderate performance (${hitRatio.toFixed(1)}% hit ratio). A larger cache or higher temporal reuse would yield better CPU throughput.`;
    } else {
      dom.perfInsightText.textContent = `High miss rate (${missRatio.toFixed(1)}%). Frequent RAM accesses and FIFO evictions (cache thrashing) are slowing effective execution.`;
    }
  }
}

// ============================================================================
// 5. BATCH SEQUENCE RUNNER
// ============================================================================

/**
 * Parses and runs a comma-separated list of addresses step by step.
 */
function runAddressSequence() {
  if (cacheState.isSequenceRunning) return;

  const rawSeq = dom.sequenceInput.value;
  if (!rawSeq || rawSeq.trim() === '') {
    updateStatusBanner(
      'error',
      'EMPTY SEQUENCE',
      'Sequence input field is empty.',
      'Please enter comma-separated addresses such as: 10, 20, 10, 30, 20, 40.'
    );
    return;
  }

  // Parse comma-separated tokens
  const addresses = rawSeq
    .split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  if (addresses.length === 0) {
    updateStatusBanner('error', 'INVALID FORMAT', 'No valid addresses found in sequence.', 'Please use comma separation.');
    return;
  }

  // Set sequence running state & controls
  cacheState.isSequenceRunning = true;
  dom.btnRunSeq.disabled = true;
  dom.btnStopSeq.disabled = false;
  dom.btnAccess.disabled = true;
  dom.btnRandom.disabled = true;
  dom.sequenceInput.disabled = true;

  const delayMs = parseInt(dom.speedSelect.value, 10) || 750;
  let currentIndex = 0;

  function step() {
    if (!cacheState.isSequenceRunning || currentIndex >= addresses.length) {
      stopSequence();
      return;
    }

    const currentAddr = addresses[currentIndex];
    accessAddress(currentAddr);
    currentIndex++;

    if (currentIndex < addresses.length && cacheState.isSequenceRunning) {
      cacheState.sequenceTimer = setTimeout(step, delayMs);
    } else {
      stopSequence();
    }
  }

  step();
}

/**
 * Stops or completes sequence execution.
 */
function stopSequence() {
  if (cacheState.sequenceTimer) {
    clearTimeout(cacheState.sequenceTimer);
    cacheState.sequenceTimer = null;
  }

  cacheState.isSequenceRunning = false;
  dom.btnRunSeq.disabled = false;
  dom.btnStopSeq.disabled = true;
  dom.btnAccess.disabled = false;
  dom.btnRandom.disabled = false;
  dom.sequenceInput.disabled = false;
}

// ============================================================================
// 6. RESET & CLEANUP
// ============================================================================

/**
 * Resets the simulator, stats, log, and FIFO queue.
 */
function resetSimulator() {
  stopSequence();

  // Reset cache slots
  cacheState.slots = [
    { id: 0, address: null, insertionOrder: null },
    { id: 1, address: null, insertionOrder: null },
    { id: 2, address: null, insertionOrder: null },
    { id: 3, address: null, insertionOrder: null }
  ];
  cacheState.fifoQueue = [];
  cacheState.insertionCounter = 0;

  // Reset stats
  cacheState.stats.totalRequests = 0;
  cacheState.stats.hits = 0;
  cacheState.stats.misses = 0;
  cacheState.history = [];

  // Reset UI
  updateSlotsUI();
  updateFIFOQueueUI();
  updateAnalyticsUI();

  // Reset status banner
  updateStatusBanner(
    'idle',
    'READY',
    'Simulator Reset Complete — Ready for new memory requests',
    'All 4 slots cleared and analytics counters reset to zero.'
  );

  // Reset log table
  dom.logTableBody.innerHTML = `
    <tr class="empty-row">
      <td colspan="5">No memory requests executed yet. Access an address above to generate event logs.</td>
    </tr>
  `;
  dom.logCount.textContent = '0 events';

  if (dom.addressInput) dom.addressInput.value = '';
}

/**
 * Clears the event log table without resetting cache state or stats.
 */
function clearLogTable() {
  cacheState.history = [];
  dom.logTableBody.innerHTML = `
    <tr class="empty-row">
      <td colspan="5">Log cleared. Next memory access will be recorded here.</td>
    </tr>
  `;
  dom.logCount.textContent = '0 events';
}

/**
 * Generates a random memory address from a typical working set.
 */
function generateRandomAddress() {
  const commonWorkingSet = ['10', '20', '30', '40', '50', '60', '10', '20', '70', '80'];
  const randomIndex = Math.floor(Math.random() * commonWorkingSet.length);
  return commonWorkingSet[randomIndex];
}

// ============================================================================
// 7. ARCHITECTURE INTERACTION
// ============================================================================

/**
 * Binds click events to the Multi-Level Architecture nodes.
 */
function setupArchitectureInteractivity() {
  dom.archNodes.forEach(node => {
    node.addEventListener('click', () => {
      // Set active node styling
      dom.archNodes.forEach(n => n.classList.remove('active-node'));
      node.classList.add('active-node');

      const targetKey = node.getAttribute('data-target');
      const data = architectureDetails[targetKey];
      if (!data) return;

      // Update detail panel
      dom.detailBadge.textContent = data.badge;
      dom.detailTitle.textContent = data.title;
      dom.detailSubtitle.textContent = data.subtitle;
      dom.detailLatency.textContent = data.latency;
      dom.detailCapacity.textContent = data.capacity;
      dom.detailLocation.textContent = data.location;
      dom.detailSplit.textContent = data.split;
      dom.detailDesc.textContent = data.desc;
      dom.detailTip.innerHTML = `<strong>OS Concept:</strong> ${data.tip.replace('OS Concept: ', '')}`;
    });
  });
}

// ============================================================================
// 8. EVENT LISTENERS INITIALIZATION
// ============================================================================

function setupEventListeners() {
  // Single Access Button
  dom.btnAccess.addEventListener('click', () => {
    const val = dom.addressInput.value;
    if (!val || val.trim() === '') {
      updateStatusBanner(
        'error',
        'INPUT REQUIRED',
        'Please enter a memory address to access.',
        'Type an address like 10, 20, or click "Random" to pick one.'
      );
      dom.addressInput.focus();
      return;
    }
    accessAddress(val);
    dom.addressInput.select();
  });

  // Enter key in single address input triggers access
  dom.addressInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      dom.btnAccess.click();
    }
  });

  // Random Address Button
  dom.btnRandom.addEventListener('click', () => {
    const randAddr = generateRandomAddress();
    dom.addressInput.value = randAddr;
    accessAddress(randAddr);
  });

  // Sequence Controls
  dom.btnRunSeq.addEventListener('click', runAddressSequence);
  dom.btnStopSeq.addEventListener('click', stopSequence);

  // Preset Chips
  document.querySelectorAll('.preset-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const seq = chip.getAttribute('data-seq');
      dom.sequenceInput.value = seq;
    });
  });

  // Locality Pattern Loaders
  document.querySelectorAll('.load-temporal-btn, .load-spatial-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const seq = btn.getAttribute('data-seq');
      dom.sequenceInput.value = seq;

      // Smooth scroll to simulator section
      const simSection = document.getElementById('simulator');
      if (simSection) {
        simSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // Reset & Clear Buttons
  dom.btnReset.addEventListener('click', resetSimulator);
  dom.btnClearLog.addEventListener('click', clearLogTable);

  // Navigation link smooth scroll & active state
  const navLinks = document.querySelectorAll('.nav-link');
  window.addEventListener('scroll', () => {
    let currentSection = '';
    const sections = document.querySelectorAll('.section');
    sections.forEach(sec => {
      const top = sec.offsetTop - 120;
      if (window.scrollY >= top) {
        currentSection = sec.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${currentSection}`) {
        link.classList.add('active');
      }
    });
  });
}

// ============================================================================
// 9. INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  setupArchitectureInteractivity();
  setupEventListeners();
  updateSlotsUI();
  updateFIFOQueueUI();
  updateAnalyticsUI();
  console.log('CacheFlow Simulator initialized successfully.');
});

