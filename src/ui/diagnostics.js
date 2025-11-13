import { gameEvents, GameEvent } from '../game/events.js';

const panel = document.getElementById('diagnosticsPanel');
const logEl = document.getElementById('diagnosticsLog');
const closeButton = document.getElementById('closeDiagnosticsButton');

export function initDiagnostics() {
  closeButton.addEventListener('click', () => {
    panel.classList.remove('visible');
    gameEvents.emit(GameEvent.CLOSE_DIAGNOSTICS);
  });
  gameEvents.on(GameEvent.TEST_RESULTS, (payload) => {
    renderResults(payload);
    panel.classList.add('visible');
  });
}

function renderResults({ passed, total, results }) {
  logEl.innerHTML = '';
  const summary = document.createElement('div');
  summary.textContent = `Passed ${passed}/${total} checks`;
  summary.style.fontWeight = '600';
  summary.style.marginBottom = '8px';
  logEl.appendChild(summary);
  results.forEach((result) => {
    const line = document.createElement('div');
    line.textContent = result.passed ? `✔ ${result.name}` : `✖ ${result.name} — ${result.detail}`;
    line.style.color = result.passed ? '#a7f3d0' : '#fca5a5';
    logEl.appendChild(line);
  });
}
