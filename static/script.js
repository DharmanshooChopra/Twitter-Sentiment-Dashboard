/**
 * script.js — Twitter Sentiment Analysis Chatbot
 * ------------------------------------------------
 * Handles: message sending, API calls, chat UI,
 *          Chart.js visualisations, history panel,
 *          Twitter ID / username fetch mode.
 */

// ── Input Type: Twitter ID mode toggle ────────────────────────────────────────
function onInputTypeChange(val) {
  const twPanel = document.getElementById('twitter-id-panel');
  const normalPanel = document.getElementById('normal-text-panel');
  const analyzeBtn = document.getElementById('analyze-btn');

  if (val === 'twitter_id') {
    twPanel.style.display = 'flex';
    normalPanel.style.display = 'none';
    analyzeBtn.style.display = 'none';
    // Restore saved bearer token
    const saved = localStorage.getItem('tw_bearer_token');
    if (saved) document.getElementById('bearer-token-input').value = saved;
  } else {
    twPanel.style.display = 'none';
    normalPanel.style.display = 'block';
    analyzeBtn.style.display = 'flex';
  }
}

function saveBearerToken(val) {
  // Persist bearer token locally so user doesn't retype it
  localStorage.setItem('tw_bearer_token', val);
}

/**
 * fetchAndAnalyze()
 * -----------------
 * 1. POST /fetch_tweet with query + bearer_token
 * 2. On success: fill tweet text into main textarea & auto-send to /analyze
 */
async function fetchAndAnalyze() {
  const query = (document.getElementById('twitter-query-input').value || '').trim();
  const bearerToken = (document.getElementById('bearer-token-input').value || '').trim();
  const count = document.getElementById('tweet-count-input') ? document.getElementById('tweet-count-input').value : 1;
  const fetchBtn = document.getElementById('fetch-btn');

  if (!query) {
    showFetchError('Please enter a Twitter username or tweet ID.');
    return;
  }

  // Hide old preview
  hideTweetPreview();

  fetchBtn.disabled = true;
  fetchBtn.textContent = '⏳ Fetching…';

  try {
    const res = await fetch('/fetch_tweet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, count, bearer_token: bearerToken }),
    });
    const data = await res.json();

    fetchBtn.disabled = false;
    fetchBtn.innerHTML = `<svg width="15" height="15" fill="currentColor" viewBox="0 0 16 16"><path d="M5.026 15c6.038 0 9.341-5.003 9.341-9.334q.002-.211-.006-.422A6.7 6.7 0 0 0 16 3.542a6.7 6.7 0 0 1-1.889.518 3.3 3.3 0 0 0 1.447-1.817 6.5 6.5 0 0 1-2.087.793A3.286 3.286 0 0 0 7.875 6.03a9.32 9.32 0 0 1-6.767-3.429 3.29 3.29 0 0 0 1.018 4.382A3.3 3.3 0 0 1 .64 6.575v.045a3.288 3.288 0 0 0 2.632 3.218 3.2 3.2 0 0 1-.865.115 3 3 0 0 1-.614-.057 3.283 3.283 0 0 0 3.067 2.277A6.6 6.6 0 0 1 .78 13.58a6 6 0 0 1-.78-.045A9.34 9.34 0 0 0 5.026 15"/></svg> Fetch &amp; Analyze`;

    if (data.error) {
      showFetchError(data.error);
      return;
    }

    // Show tweet preview card for the first one fetched
    const firstTweet = data.tweets[0];
    showTweetPreview(firstTweet);

    // Feed the first tweet text into the normal analyze flow (for manual re-run)
    document.getElementById('tweet-input').value = firstTweet.text;

    // Remove welcome placeholder if present
    const welcome = document.getElementById('chat-welcome');
    if (welcome) welcome.remove();

    // Sequentially analyze all fetched tweets!
    for (let t of data.tweets) {
        appendBubble('user', `🔍 ${t.author}: ${t.text}`);
        await analyzeText(t.text);
    }

  } catch (err) {
    fetchBtn.disabled = false;
    fetchBtn.innerHTML = `Fetch &amp; Analyze`;
    showFetchError('Could not connect to the server. Is Flask running?');
  }
}

function showTweetPreview(t) {
  document.getElementById('preview-author').textContent = t.author;
  document.getElementById('preview-date').textContent = t.created_at ? `· ${t.created_at.slice(0, 10)}` : '';
  document.getElementById('preview-text').textContent = t.text;
  document.getElementById('preview-id').textContent = t.id ? `ID: ${t.id}` : '';
  document.getElementById('tweet-preview').style.display = 'block';
}

function hideTweetPreview() {
  document.getElementById('tweet-preview').style.display = 'none';
}

function showFetchError(msg) {
  const welcome = document.getElementById('chat-welcome');
  if (welcome) welcome.remove();
  appendBotBubble(`⚠️ ${msg}`, null, null, null);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

/**
 * analyzeText(text)
 * ------------------
 * Core analysis call — separated so Twitter mode can reuse it without
 * re-reading the DOM textarea.
 */
async function analyzeText(text) {
  const typingId = showTyping();
  try {
    const res = await fetch('/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    const data = await res.json();
    removeTyping(typingId);

    if (data.error) {
      appendBotBubble(`⚠️ ${data.error}`, null, null, null);
    } else {
      appendBotBubble(null, data.sentiment, data.confidence, text);
      const bucket = bucketLength(text);
      lengthBuckets[bucket]++;
      await refreshStats();
    }
  } catch (err) {
    removeTyping(typingId);
    appendBotBubble('⚠️ Analysis failed. Is Flask running?', null, null, null);
  } finally {
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }
}


// ── Chart.js instances ─────────────────────────────────────────────────────
let sentimentChart = null;
let lengthChart = null;

// ── Length distribution buckets ────────────────────────────────────────────
// Store lengths client-side for the bar chart (avoids extra endpoint)
const lengthBuckets = { Short: 0, Medium: 0, Long: 0 };

function bucketLength(text) {
  const len = text.trim().length;
  if (len < 60) return 'Short';
  else if (len < 160) return 'Medium';
  else return 'Long';
}

// ── DOM refs ───────────────────────────────────────────────────────────────
const chatWindow = document.getElementById('chat-window');
const tweetInput = document.getElementById('tweet-input');
const analyzeBtn = document.getElementById('analyze-btn');
const charCount = document.getElementById('char-count');
const clearBtn = document.getElementById('clear-chat-btn');
const histList = document.getElementById('history-list');
const tabDist = document.getElementById('tab-dist');
const tabLen = document.getElementById('tab-len');
const tabHist = document.getElementById('tab-hist');
const paneDist = document.getElementById('pane-dist');
const panLen = document.getElementById('pane-len');
const paneHist = document.getElementById('pane-hist');
const statPos = document.getElementById('stat-pos');
const statNeu = document.getElementById('stat-neu');
const statNeg = document.getElementById('stat-neg');

// ── Character counter ──────────────────────────────────────────────────────
tweetInput.addEventListener('input', () => {
  const len = tweetInput.value.length;
  charCount.textContent = `${len} / 280`;
  charCount.classList.toggle('warn', len > 280);
});

// ── Enter key (shift+enter = newline) ─────────────────────────────────────
tweetInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// ── Analyze button ─────────────────────────────────────────────────────────
analyzeBtn.addEventListener('click', sendMessage);

// ── Clear chat ─────────────────────────────────────────────────────────────
clearBtn.addEventListener('click', () => {
  chatWindow.innerHTML = `
    <div class="chat-welcome" id="chat-welcome">
      <div class="wifi-icon">💬</div>
      <p>Enter a tweet below and click <strong>Analyze</strong> to get started.</p>
    </div>`;
});

// ── Send message ───────────────────────────────────────────────────────────
async function sendMessage() {
  const text = tweetInput.value.trim();
  if (!text) return;

  // Remove welcome placeholder
  const welcome = document.getElementById('chat-welcome');
  if (welcome) welcome.remove();

  // Append user bubble
  appendBubble('user', text);
  tweetInput.value = '';
  charCount.textContent = '0 / 280';

  // Show typing indicator
  const typingId = showTyping();
  analyzeBtn.disabled = true;

  try {
    const res = await fetch('/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    const data = await res.json();

    removeTyping(typingId);

    if (data.error) {
      appendBotBubble(`⚠️ ${data.error}`, null, null);
    } else {
      appendBotBubble(null, data.sentiment, data.confidence, text);
      // Update length bucket
      const bucket = bucketLength(text);
      lengthBuckets[bucket]++;
      // Refresh stats + charts
      await refreshStats();
    }
  } catch (err) {
    removeTyping(typingId);
    appendBotBubble('⚠️ Could not connect to the server. Is Flask running?', null, null);
  } finally {
    analyzeBtn.disabled = false;
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }
}

// ── Chat bubble helpers ────────────────────────────────────────────────────
function appendBubble(who, text) {
  const row = document.createElement('div');
  row.className = `bubble-row ${who}`;
  const emoji = who === 'user' ? '🧑' : '🤖';
  row.innerHTML = `
    <div class="avatar">${emoji}</div>
    <div class="bubble">${escHtml(text)}</div>`;
  chatWindow.appendChild(row);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function appendBotBubble(errorMsg, sentiment, confidence, originalText) {
  const row = document.createElement('div');
  row.className = 'bubble-row bot';

  let content = '';
  if (errorMsg) {
    content = `<div class="bubble">${errorMsg}</div>`;
  } else {
    const emoji = sentiment === 'positive' ? '🟢' : sentiment === 'negative' ? '🔴' : '🟡';
    const label = sentiment.charAt(0).toUpperCase() + sentiment.slice(1);
    const barW = Math.round(confidence);

    content = `
      <div class="bubble">
        <div>Analysis complete for:</div>
        <div style="font-size:0.8rem;color:var(--text-muted);margin:0.3rem 0 0.5rem;">"${escHtml(originalText)}"</div>
        <div class="sentiment-result ${sentiment}">
          ${emoji} ${label} Sentiment
        </div>
        <div class="confidence-bar-wrap">
          <span>Confidence: ${confidence}%</span>
          <div class="confidence-bar ${sentiment}" style="width:${barW}%"></div>
        </div>
      </div>`;
  }

  row.innerHTML = `<div class="avatar">🤖</div>${content}`;
  chatWindow.appendChild(row);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function showTyping() {
  const id = `typing-${Date.now()}`;
  const row = document.createElement('div');
  row.className = 'bubble-row bot';
  row.id = id;
  row.innerHTML = `
    <div class="avatar">🤖</div>
    <div class="bubble typing-indicator">
      <div class="typing-dots">
        <span></span><span></span><span></span>
      </div>
    </div>`;
  chatWindow.appendChild(row);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  return id;
}

function removeTyping(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

// ── Charts ─────────────────────────────────────────────────────────────────
function initCharts() {
  // Doughnut — sentiment distribution
  const ctxD = document.getElementById('sentiment-chart').getContext('2d');
  sentimentChart = new Chart(ctxD, {
    type: 'doughnut',
    data: {
      labels: ['Positive', 'Neutral', 'Negative'],
      datasets: [{
        data: [0, 0, 0],
        backgroundColor: ['rgba(0,214,143,0.8)', 'rgba(255,179,71,0.8)', 'rgba(255,77,109,0.8)'],
        borderColor: ['#00d68f', '#ffb347', '#ff4d6d'],
        borderWidth: 2,
        hoverOffset: 6,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '72%',
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.parsed} tweets`
          }
        }
      }
    }
  });

  // Bar — tweet length distribution
  const ctxL = document.getElementById('length-chart').getContext('2d');
  lengthChart = new Chart(ctxL, {
    type: 'bar',
    data: {
      labels: ['Short (<60)', 'Medium (60-160)', 'Long (>160)'],
      datasets: [{
        label: 'Tweets',
        data: [0, 0, 0],
        backgroundColor: ['rgba(108,99,255,0.7)', 'rgba(167,139,250,0.7)', 'rgba(199,180,255,0.7)'],
        borderColor: ['#6c63ff', '#a78bfa', '#c7b4ff'],
        borderWidth: 2,
        borderRadius: 6,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: {
          ticks: { color: 'rgba(232,234,246,0.55)', font: { size: 10 } },
          grid: { color: 'rgba(255,255,255,0.05)' },
        },
        y: {
          ticks: { color: 'rgba(232,234,246,0.55)', stepSize: 1 },
          grid: { color: 'rgba(255,255,255,0.05)' },
          beginAtZero: true,
        }
      }
    }
  });
}

async function refreshStats() {
  try {
    const res = await fetch('/stats');
    const stats = await res.json();

    const pos = stats.positive || 0;
    const neu = stats.neutral || 0;
    const neg = stats.negative || 0;

    // Update doughnut
    sentimentChart.data.datasets[0].data = [pos, neu, neg];
    sentimentChart.update();

    // Update stat badges
    statPos.textContent = pos;
    statNeu.textContent = neu;
    statNeg.textContent = neg;

    // Update bar chart (client-side length buckets)
    lengthChart.data.datasets[0].data = [
      lengthBuckets.Short,
      lengthBuckets.Medium,
      lengthBuckets.Long,
    ];
    lengthChart.update();

    // Refresh history if tab is active
    if (paneHist && !paneHist.classList.contains('d-none')) {
      loadHistory();
    }
  } catch (e) {
    console.warn('Stats fetch failed:', e);
  }
}

// ── History ────────────────────────────────────────────────────────────────
async function loadHistory() {
  try {
    const res = await fetch('/history');
    const records = await res.json();

    if (!records.length) {
      histList.innerHTML = '<div style="color:var(--text-muted);font-size:0.82rem;text-align:center;padding:1.5rem 0;">No history yet.</div>';
      return;
    }

    histList.innerHTML = records.map(r => `
      <div class="history-item">
        <div class="hist-text">${escHtml(r.tweet_text)}</div>
        <div class="hist-meta">
          <span class="badge-sm ${r.sentiment}">${r.sentiment}</span>
          ${r.timestamp}
        </div>
      </div>`).join('');
  } catch (e) {
    histList.innerHTML = '<div style="color:var(--text-muted);font-size:0.82rem;">Could not load history.</div>';
  }
}

// ── Tab switching ──────────────────────────────────────────────────────────
function activateTab(tab) {
  [tabDist, tabLen, tabHist].forEach(b => b.classList.remove('active'));
  [paneDist, panLen, paneHist].forEach(p => p.classList.add('d-none'));

  if (tab === 'dist') {
    tabDist.classList.add('active');
    paneDist.classList.remove('d-none');
  } else if (tab === 'len') {
    tabLen.classList.add('active');
    panLen.classList.remove('d-none');
  } else {
    tabHist.classList.add('active');
    paneHist.classList.remove('d-none');
    loadHistory();
  }
}

tabDist.addEventListener('click', () => activateTab('dist'));
tabLen.addEventListener('click', () => activateTab('len'));
tabHist.addEventListener('click', () => activateTab('hist'));

// ── Utility ────────────────────────────────────────────────────────────────
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Init ───────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initCharts();
  refreshStats();
});
