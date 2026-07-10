// User-Agents Pool for Rotation Simulation
const USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/605.1.15",
    "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36"
];

// Residential Proxy Pool for Rotation Simulation
const PROXIES = [
    "192.168.10.45:9091 (US-Residential)",
    "45.23.189.12:3128 (DE-Residential)",
    "103.45.2.110:8080 (IN-Residential)",
    "88.204.15.66:8888 (UK-Residential)"
];

// Application Monitors State
let monitors = [
    {
        id: 1,
        url: "https://elume.io/careers",
        status: "active", // active, retrying, blocked, checking
        interval: 15, // seconds
        countdown: 15,
        latency: 120, // ms
        lastChecked: "Never",
        retries: 0,
        backoffMultiplier: 1
    },
    {
        id: 2,
        url: "https://api.github.com/users/maruthisriram",
        status: "active",
        interval: 20,
        countdown: 20,
        latency: 245,
        lastChecked: "Never",
        retries: 0,
        backoffMultiplier: 1
    }
];

// Simulation modifiers
let nextCheckOverride = null; // "timeout" or "429" or null

// DOM Elements
const monitorsContainer = document.getElementById("monitors-container");
const consoleOutput = document.getElementById("console-output");
const monitorUrlInput = document.getElementById("monitor-url-input");
const addMonitorBtn = document.getElementById("add-monitor-btn");
const clearConsoleBtn = document.getElementById("clear-console-btn");

// Sim Button Listeners
document.getElementById("sim-success-btn").addEventListener("click", () => {
    nextCheckOverride = "success";
    logConsole("scraper", "[COMMAND] Next scheduled scrape is forced to return success (200 OK).");
});
document.getElementById("sim-slow-btn").addEventListener("click", () => {
    nextCheckOverride = "timeout";
    logConsole("retry", "[COMMAND] Next scheduled scrape is forced to simulate a slow response / Timeout.");
});
document.getElementById("sim-blocked-btn").addEventListener("click", () => {
    nextCheckOverride = "block";
    logConsole("block", "[COMMAND] Next scheduled scrape is forced to simulate a rate-limit block (429 Too Many Requests).");
});

// Clear console
clearConsoleBtn.addEventListener("click", () => {
    consoleOutput.innerHTML = `<div class="log-entry system">[SYSTEM] Console logs cleared.</div>`;
});

// Helper to write to visual console log
function logConsole(type, message) {
    const timestamp = new Date().toLocaleTimeString();
    const entry = document.createElement("div");
    entry.className = `log-entry ${type}`;
    entry.innerText = `[${timestamp}] ${message}`;
    consoleOutput.appendChild(entry);
    
    // Auto-scroll to bottom
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
}

// Add a monitor URL
addMonitorBtn.addEventListener("click", () => {
    const urlVal = monitorUrlInput.value.trim();
    if (!urlVal) return;
    
    try {
        new URL(urlVal); // Validate structure
    } catch (_) {
        alert("Please enter a valid URL (including https:// or http://)");
        return;
    }

    const newId = monitors.length > 0 ? Math.max(...monitors.map(m => m.id)) + 1 : 1;
    const interval = Math.floor(Math.random() * 15) + 15; // 15s to 30s
    
    monitors.push({
        id: newId,
        url: urlVal,
        status: "active",
        interval: interval,
        countdown: interval,
        latency: 0,
        lastChecked: "Never",
        retries: 0,
        backoffMultiplier: 1
    });

    logConsole("scheduler", `[SCHEDULER] Registered monitor for target URL: ${urlVal} (Interval: ${interval}s)`);
    monitorUrlInput.value = "";
    renderMonitors();
});

// Render monitor list cards
function renderMonitors() {
    monitorsContainer.innerHTML = "";
    
    monitors.forEach(m => {
        const card = document.createElement("div");
        card.className = "monitor-card";
        
        let stateText = m.status;
        if (m.status === "active") stateText = "Active (Ok)";
        if (m.status === "checking") stateText = "Checking...";
        if (m.status === "blocked") stateText = "Blocked (429)";
        if (m.status === "retrying") stateText = `Retrying (${m.retries})`;

        const timerPct = m.status === "active" ? (m.countdown / m.interval) * 100 : 0;
        
        card.innerHTML = `
            <div class="monitor-header">
                <div class="monitor-url" title="${m.url}">${m.url}</div>
                <span class="state-badge ${m.status}">${stateText}</span>
            </div>
            <div class="monitor-meta">
                <div class="meta-item">
                    <span class="meta-label">Last checked</span>
                    <span class="meta-val">${m.lastChecked}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Latency / Status</span>
                    <span class="meta-val">${m.latency > 0 ? m.latency + 'ms' : '--'}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Next check</span>
                    <span class="meta-val">${m.status === 'active' ? m.countdown + 's' : 'Queue Paused'}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Interval</span>
                    <span class="meta-val">${m.interval}s</span>
                </div>
            </div>
            ${m.status === 'active' ? `
            <div class="monitor-timer-bar">
                <div class="timer-progress" style="width: ${timerPct}%"></div>
            </div>` : ''}
        `;
        monitorsContainer.appendChild(card);
    });
}

// Scheduler Tick Loop (runs every 1s)
function schedulerTick() {
    monitors.forEach(m => {
        if (m.status === "active") {
            m.countdown--;
            if (m.countdown <= 0) {
                m.status = "checking";
                renderMonitors();
                executeCheck(m);
            }
        }
    });
    renderMonitors();
}

// Execute scheduled scraper check
function executeCheck(monitor) {
    // Choose headers and proxy dynamically
    const agent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
    const proxy = PROXIES[Math.floor(Math.random() * PROXIES.length)];
    
    logConsole("scheduler", `[SCHEDULER] Dispatching check for ${monitor.url}`);
    logConsole("scraper", `[SCRAPER] Routing via residential proxy [${proxy}]`);
    logConsole("scraper", `[SCRAPER] Setting headers: User-Agent = ${agent.substring(0, 45)}...`);

    // Simulate check latency
    setTimeout(() => {
        let type = nextCheckOverride || "success";
        nextCheckOverride = null; // reset override
        
        const timestamp = new Date().toLocaleTimeString();
        monitor.lastChecked = timestamp;

        if (type === "success") {
            // SUCCESS FLOW
            monitor.status = "active";
            monitor.countdown = monitor.interval;
            monitor.retries = 0;
            monitor.backoffMultiplier = 1;
            monitor.latency = Math.floor(Math.random() * 150) + 80;
            logConsole("scraper", `[SCRAPER] Target ${monitor.url} status: 200 OK (Latency: ${monitor.latency}ms)`);
            
        } else if (type === "timeout") {
            // TIMEOUT FLOW (Slow / Error)
            monitor.latency = 0;
            monitor.retries++;
            
            // Timeout retry limit
            if (monitor.retries <= 3) {
                monitor.status = "retrying";
                const delay = 5 * monitor.retries;
                logConsole("retry", `[SCRAPER] Target ${monitor.url} timeout threshold exceeded (10000ms). Scheduling retry #${monitor.retries} in ${delay}s...`);
                
                setTimeout(() => {
                    monitor.status = "active";
                    monitor.countdown = 0; // force instant retry on next tick
                }, delay * 1000);
            } else {
                monitor.status = "active";
                monitor.countdown = monitor.interval;
                monitor.retries = 0;
                logConsole("retry", `[CIRCUIT-BREAKER] Target ${monitor.url} failed repeatedly. Alerting Sentry and cooling down.`);
            }
            
        } else if (type === "block") {
            // RATE-LIMIT BLOCK FLOW (429)
            monitor.latency = 0;
            monitor.status = "blocked";
            
            // Calculate exponential backoff (8s, 16s, 32s...)
            const backoff = 8 * monitor.backoffMultiplier;
            monitor.backoffMultiplier *= 2;
            
            logConsole("block", `[SCRAPER] Target ${monitor.url} returned HTTP 429 Too Many Requests (Temporary block detected).`);
            logConsole("block", `[CIRCUIT-BREAKER] Tripping safety lock. Disabling standard requests to target for ${backoff}s.`);
            logConsole("scraper", `[STEALTH] Rotating IP proxy to new residential IP and resetting TLS fingerprint signature...`);

            setTimeout(() => {
                logConsole("scheduler", `[SCHEDULER] Safety lock cooling period expired. Resuming monitor queue for ${monitor.url}.`);
                monitor.status = "active";
                monitor.countdown = 0; // force check
            }, backoff * 1000);
        }
        
        renderMonitors();
    }, 1500); // 1.5s simulated request duration
}

// Start scheduler loop
setInterval(schedulerTick, 1000);
renderMonitors();


// --- ENVELOPE ENCRYPTION SANDBOX ---
const piiInput = document.getElementById("pii-input");
const encryptBtn = document.getElementById("encrypt-btn");
const visualizer = document.getElementById("encryption-visualizer");

encryptBtn.addEventListener("click", () => {
    const rawVal = piiInput.value.trim();
    if (!rawVal) {
        alert("Please enter some PII value to encrypt (e.g. user's email).");
        return;
    }

    visualizer.innerHTML = `<p class="flow-placeholder">Processing PII encryption payload...</p>`;

    // Step-by-step visual animation simulation
    setTimeout(() => {
        // Step 1: Plaintext input
        visualizer.innerHTML = `
            <div class="encryption-step">
                <span class="step-title">Stage 1: Raw Plaintext Customer PII</span>
                <div class="step-data">${rawVal}</div>
            </div>
        `;
    }, 500);

    setTimeout(() => {
        // Step 2: KEK retrieval & DEK generation
        const mockDEK = Array.from({length: 32}, () => Math.floor(Math.random()*16).toString(16)).join('');
        visualizer.innerHTML += `
            <div class="flow-arrow">▼</div>
            <div class="encryption-step keys">
                <span class="step-title">Stage 2: Local AES-256 DEK Generated</span>
                <div class="step-data">Plaintext DEK: 0x${mockDEK.substring(0, 16)}...${mockDEK.substring(48)}</div>
            </div>
        `;
    }, 1500);

    setTimeout(() => {
        // Step 3: Ciphertext encryption
        // Generate mock ciphertext
        const mockCipher = Array.from({length: 48}, () => Math.floor(Math.random()*16).toString(16)).join('');
        const mockIV = Array.from({length: 12}, () => Math.floor(Math.random()*16).toString(16)).join('');
        visualizer.innerHTML += `
            <div class="flow-arrow">▼</div>
            <div class="encryption-step secure">
                <span class="step-title">Stage 3: Field Encrypted (AES-256-GCM)</span>
                <div class="step-data">Ciphertext: ${mockCipher.substring(0, 24)}... (IV: ${mockIV})</div>
            </div>
        `;
    }, 2500);

    setTimeout(() => {
        // Step 4: Envelope encryption - Encrypted DEK
        const mockEncryptedDEK = Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('');
        visualizer.innerHTML += `
            <div class="flow-arrow">▼</div>
            <div class="encryption-step keys">
                <span class="step-title">Stage 4: DEK Encrypted with KMS Master KEK (Envelope)</span>
                <div class="step-data">Encrypted DEK: 0x${mockEncryptedDEK.substring(0, 20)}...</div>
            </div>
        `;
    }, 3500);

    setTimeout(() => {
        // Step 5: Database record format
        const finalJson = JSON.stringify({
            ciphertext: "aes_256_gcm$enc_data_hash",
            encrypted_dek: "kms_v1$dek_hash",
            iv: "init_vector_12b"
        }, null, 2);
        
        visualizer.innerHTML += `
            <div class="flow-arrow">▼</div>
            <div class="encryption-step secure">
                <span class="step-title">Stage 5: Secure Database Record Storage</span>
                <div class="step-data" style="font-size: 0.7rem; line-height: 1.3; white-space: pre-wrap;">{
  "field": "customer_email",
  "ciphertext": "e5a6a3bcf...92c8a",
  "encrypted_dek": "kms:key-v2:09b1f...d782e",
  "iv": "3aef518c029b"
}</div>
            </div>
        `;
    }, 4500);
});
