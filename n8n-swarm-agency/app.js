/* ============================================================
   SwarmAI — Application Logic
   ============================================================ */

// ─── Configuration ───────────────────────────────────────────
const WEBHOOK_URL = 'https://dipmane.app.n8n.cloud/webhook/ai-swarm-agency';
const MAX_CHARS = 2000;
const HISTORY_KEY = 'swarm_history';
const MAX_HISTORY = 10;

// ─── State ───────────────────────────────────────────────────
let isProcessing = false;
let timerInterval = null;
let startTime = null;
let taskHistory = [];
let rawResultText = '';

// ─── DOM refs ────────────────────────────────────────────────
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

// ─── Init ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const input = $('#taskInput');
  const counter = $('#charCounter');

  // Character counter
  input.addEventListener('input', () => {
    const len = input.value.length;
    counter.textContent = `${len.toLocaleString()} / 2,000`;
    counter.classList.toggle('warn', len > 1600 && len <= MAX_CHARS);
    counter.classList.toggle('over', len > MAX_CHARS);
    autoResize(input);
  });

  // Ctrl+Enter submit
  input.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      submitTask();
    }
  });

  // Navbar scroll shadow
  window.addEventListener('scroll', () => {
    $('#navbar').classList.toggle('scrolled', window.scrollY > 10);
  }, { passive: true });

  // Load history
  loadHistory();
  renderHistory();
});

// ─── Auto-resize textarea ────────────────────────────────────
function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 300) + 'px';
}

// ─── Set task from quick buttons ─────────────────────────────
function setTask(text) {
  const input = $('#taskInput');
  input.value = text;
  input.dispatchEvent(new Event('input'));
  input.focus();
  input.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// ─── Submit task ─────────────────────────────────────────────
async function submitTask() {
  if (isProcessing) return;

  const input = $('#taskInput');
  const objective = input.value.trim();

  if (!objective) {
    shakeInput();
    showToast('⚠️ Please describe your objective first.');
    return;
  }

  if (objective.length > MAX_CHARS) {
    shakeInput();
    showToast(`⚠️ Objective too long (${objective.length}/${MAX_CHARS} chars).`);
    return;
  }

  isProcessing = true;

  // UI transitions
  const submitBtn = $('#submitBtn');
  submitBtn.disabled = true;
  submitBtn.querySelector('.submit-btn__label').style.display = 'none';
  submitBtn.querySelector('.submit-btn__loading').style.display = 'inline-flex';

  hideSection('resultCard');
  hideSection('errorCard');
  showSection('processingCard');
  $('#taskCard').scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Start timer + animate steps
  startTimer();
  animateSteps();

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ objective })
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('API Rate Limit: The swarm is receiving too many requests. Please wait 60 seconds before trying again.');
      }
      throw new Error(`Server returned ${response.status}: ${response.statusText}`);
    }

    let data;
    try {
      const text = await response.text();
      if (!text || text.trim() === '') {
        throw new Error('The AI Swarm encountered a temporary API rate limit. Please wait 60 seconds and try again.');
      }
      data = JSON.parse(text);
    } catch (parseErr) {
      if (parseErr.message.includes('Rate Limit') || parseErr.message.includes('temporary API rate limit')) {
        throw parseErr;
      }
      throw new Error('The AI Swarm encountered a temporary API rate limit or server error. Please wait 60 seconds and try again.');
    }

    const output = extractOutput(data);

    if (!output) {
      throw new Error('The swarm returned an empty response. The agents may be busy — please try again.');
    }

    // Stop timer, get elapsed
    const elapsed = stopTimer();

    // Compute word count
    const wordCount = output.split(/\s+/).filter(Boolean).length;

    // Show result
    $('#resultMeta').textContent = `⏱ ${elapsed}  •  📝 ${wordCount.toLocaleString()} words`;
    $('#resultBody').innerHTML = renderMarkdown(output);
    rawResultText = output;

    hideSection('processingCard');
    showSection('resultCard');
    $('#resultCard').scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Save to history
    addToHistory(objective, elapsed, wordCount);
    showToast('✅ Swarm mission complete!');

  } catch (err) {
    stopTimer();
    hideSection('processingCard');
    $('#errorMessage').textContent = err.message || 'An unexpected error occurred.';
    showSection('errorCard');
    $('#errorCard').scrollIntoView({ behavior: 'smooth', block: 'center' });
    showToast('❌ Mission failed. See error details.');
  } finally {
    isProcessing = false;
    const submitBtn = $('#submitBtn');
    submitBtn.disabled = false;
    submitBtn.querySelector('.submit-btn__label').style.display = 'inline-flex';
    submitBtn.querySelector('.submit-btn__loading').style.display = 'none';
    resetSteps();
  }
}

// ─── Extract output from various response formats ───────────
function extractOutput(data) {
  // Handle array responses
  if (Array.isArray(data)) {
    data = data[0];
  }
  if (!data) return null;

  // Primary: data.report.raw_markdown
  if (data.report && data.report.raw_markdown) {
    return data.report.raw_markdown;
  }

  // Fallback: build from sections
  if (data.report && Array.isArray(data.report.sections) && data.report.sections.length > 0) {
    let md = '';
    if (data.report.title) {
      md += `# ${data.report.title}\n\n`;
    }
    data.report.sections.forEach((sec) => {
      if (sec.title) md += `## ${sec.title}\n\n`;
      if (sec.body) md += `${sec.body}\n\n`;
    });
    return md.trim();
  }

  // Fallback: data.output
  if (data.output && typeof data.output === 'string') {
    return data.output;
  }

  // Fallback: data.text
  if (data.text && typeof data.text === 'string') {
    return data.text;
  }

  // Fallback: data.message
  if (data.message && typeof data.message === 'string') {
    return data.message;
  }

  // Fallback: data.result
  if (data.result && typeof data.result === 'string') {
    return data.result;
  }

  // Rate-limit / error detection
  if (data.error) {
    throw new Error(data.error);
  }

  // Last resort: stringify
  const str = JSON.stringify(data, null, 2);
  if (str && str !== '{}' && str !== 'null') {
    return '```json\n' + str + '\n```';
  }

  return null;
}

// ─── Markdown renderer ──────────────────────────────────────
function renderMarkdown(text) {
  if (!text) return '';

  let html = escapeHtml(text);

  // Code blocks (``` ... ```)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const cls = lang ? ` class="language-${lang}"` : '';
    return `<pre><code${cls}>${code.trim()}</code></pre>`;
  });

  // Tables
  html = renderTables(html);

  // Blockquotes
  html = html.replace(/^&gt;\s?(.*)$/gm, '<blockquote>$1</blockquote>');
  // Merge adjacent blockquotes
  html = html.replace(/<\/blockquote>\n<blockquote>/g, '\n');

  // Horizontal rules
  html = html.replace(/^(?:---|\*\*\*|___)\s*$/gm, '<hr/>');

  // Headers (h1–h4)
  html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Bold + italic combos
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Inline code (must come after code blocks)
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  // Unordered lists
  html = html.replace(/^[\-\*] (.+)$/gm, '<li>$1</li>');
  html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>');

  // Ordered lists
  html = html.replace(/^\d+\.\s(.+)$/gm, '<li>$1</li>');
  // Wrap consecutive <li> not in <ul> into <ol>
  html = html.replace(/(<li>(?:(?!<\/?[uo]l>).)*<\/li>\n?)+/g, (match) => {
    if (match.includes('<ul>')) return match;
    return '<ol>' + match + '</ol>';
  });

  // Paragraphs: wrap remaining text blocks
  html = html.replace(/^(?!<[a-z/])(.+)$/gm, '<p>$1</p>');

  // Line breaks within paragraphs
  html = html.replace(/<\/p>\n<p>/g, '</p>\n<p>');

  // Clean up extra newlines
  html = html.replace(/\n{3,}/g, '\n\n');

  return html;
}

// ─── Table renderer ──────────────────────────────────────────
function renderTables(html) {
  const lines = html.split('\n');
  const result = [];
  let i = 0;

  while (i < lines.length) {
    // Detect table: at least a header row, separator row, and data row
    if (i + 2 < lines.length &&
        lines[i].includes('|') &&
        /^\|?[\s\-:|]+\|/.test(lines[i + 1])) {

      const headerCells = parseTableRow(lines[i]);
      // Check alignment row
      const alignRow = parseTableRow(lines[i + 1]);
      const aligns = alignRow.map(cell => {
        const t = cell.trim();
        if (t.startsWith(':') && t.endsWith(':')) return 'center';
        if (t.endsWith(':')) return 'right';
        return 'left';
      });

      let tableHtml = '<table><thead><tr>';
      headerCells.forEach((cell, ci) => {
        const align = aligns[ci] || 'left';
        tableHtml += `<th style="text-align:${align}">${cell.trim()}</th>`;
      });
      tableHtml += '</tr></thead><tbody>';

      i += 2; // skip header + separator

      while (i < lines.length && lines[i].includes('|')) {
        const cells = parseTableRow(lines[i]);
        tableHtml += '<tr>';
        cells.forEach((cell, ci) => {
          const align = aligns[ci] || 'left';
          tableHtml += `<td style="text-align:${align}">${cell.trim()}</td>`;
        });
        tableHtml += '</tr>';
        i++;
      }

      tableHtml += '</tbody></table>';
      result.push(tableHtml);
    } else {
      result.push(lines[i]);
      i++;
    }
  }

  return result.join('\n');
}

function parseTableRow(row) {
  return row.replace(/^\|/, '').replace(/\|$/, '').split('|');
}

// ─── Escape HTML ─────────────────────────────────────────────
function escapeHtml(text) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;' };
  return text.replace(/[&<>]/g, c => map[c]);
}

// ─── Timer ───────────────────────────────────────────────────
function startTimer() {
  startTime = Date.now();
  const display = $('#timerDisplay');
  display.textContent = '00:00';

  timerInterval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const mins = String(Math.floor(elapsed / 60000)).padStart(2, '0');
    const secs = String(Math.floor((elapsed % 60000) / 1000)).padStart(2, '0');
    display.textContent = `${mins}:${secs}`;
  }, 250);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  const elapsed = Date.now() - startTime;
  const mins = Math.floor(elapsed / 60000);
  const secs = Math.floor((elapsed % 60000) / 1000);
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}

// ─── Step animation ──────────────────────────────────────────
function animateSteps() {
  const step1 = $('#step1');
  const step2 = $('#step2');
  const step3 = $('#step3');

  // Step 1 active immediately
  step1.classList.add('active');

  // Step 2 after 800ms
  setTimeout(() => {
    step1.classList.remove('active');
    step1.classList.add('done');
    step2.classList.add('active');
  }, 800);

  // Step 3 after 2500ms
  setTimeout(() => {
    step2.classList.remove('active');
    step2.classList.add('done');
    step3.classList.add('active');
  }, 2500);
}

function resetSteps() {
  ['step1', 'step2', 'step3'].forEach(id => {
    const el = $(`#${id}`);
    el.classList.remove('active', 'done');
  });
}

// ─── History ─────────────────────────────────────────────────
function loadHistory() {
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    taskHistory = stored ? JSON.parse(stored) : [];
  } catch {
    taskHistory = [];
  }
}

function saveHistory() {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(taskHistory));
  } catch { /* storage full, ignore */ }
}

function addToHistory(objective, elapsed, wordCount) {
  const entry = {
    id: Date.now(),
    objective: objective.substring(0, 200),
    elapsed,
    wordCount,
    timestamp: new Date().toLocaleString()
  };

  taskHistory.unshift(entry);
  if (taskHistory.length > MAX_HISTORY) taskHistory.pop();
  saveHistory();
  renderHistory();
}

function renderHistory() {
  const container = $('#historyList');
  const card = $('#historyCard');

  if (!taskHistory.length) {
    card.style.display = 'none';
    return;
  }

  card.style.display = 'block';
  container.innerHTML = taskHistory.map((item) => `
    <div class="history-item" onclick="loadHistoryTask('${item.id}')">
      <span class="history-item__text">${escapeHtml(item.objective)}</span>
      <span class="history-item__time">${item.elapsed} • ${item.wordCount.toLocaleString()} words</span>
    </div>
  `).join('');
}

function loadHistoryTask(id) {
  const item = taskHistory.find(h => h.id === Number(id));
  if (item) {
    setTask(item.objective);
    showToast('📋 Task loaded from history.');
  }
}

function clearHistory() {
  taskHistory = [];
  saveHistory();
  renderHistory();
  showToast('🗑️ History cleared.');
}

// ─── Reset ───────────────────────────────────────────────────
function resetTask() {
  const input = $('#taskInput');
  input.value = '';
  input.dispatchEvent(new Event('input'));
  input.style.height = 'auto';

  hideSection('resultCard');
  hideSection('errorCard');
  hideSection('processingCard');

  input.focus();
  input.scrollIntoView({ behavior: 'smooth', block: 'center' });
  showToast('🆕 Ready for a new mission.');
}

// ─── Copy result ─────────────────────────────────────────────
async function copyResult() {
  try {
    await navigator.clipboard.writeText(rawResultText);
    showToast('📋 Copied to clipboard!');
  } catch {
    // Fallback
    const ta = document.createElement('textarea');
    ta.value = rawResultText;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast('📋 Copied to clipboard!');
  }
}

// ─── Toast ───────────────────────────────────────────────────
function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.remove('hidden');
  // Force reflow
  void toast.offsetWidth;
  toast.classList.add('visible');

  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.classList.add('hidden'), 400);
  }, 3000);
}

// ─── Shake animation ─────────────────────────────────────────
function shakeInput() {
  const wrap = $('.textarea-wrap');
  wrap.style.animation = 'shake 0.5s ease';
  setTimeout(() => { wrap.style.animation = ''; }, 500);
}

// ─── Section helpers ─────────────────────────────────────────
function showSection(id) {
  const el = $(`#${id}`);
  el.classList.remove('hidden');
  // Re-trigger animation
  el.style.animation = 'none';
  void el.offsetWidth;
  el.style.animation = '';
}

function hideSection(id) {
  $(`#${id}`).classList.add('hidden');
}
