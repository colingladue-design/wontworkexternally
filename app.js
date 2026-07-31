const MUSCLES = ['Chest', 'Shoulder', 'Bicep', 'Tricep', 'Trap', 'Back', 'Quad', 'Ham'];
const CARDIO  = ['Cardio 30', 'Cardio 45', 'Cardio 60', '10k Day', '12k Day', '15k Day', '50 Flights', '100 Flights'];
let currentTab = 'muscles';
const STORAGE_KEY = 'workout_data';
let undoSnapshot = null;

// A "workout day" runs from 4am to 3:59am the following morning.
function workoutDayKey(date = new Date()) {
  const d = new Date(date);
  if (d.getHours() < 4) d.setDate(d.getDate() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dy = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dy}`;
}

function pastWorkoutDayKeys(n) {
  const todayKey = workoutDayKey();
  const [y, m, d] = todayKey.split('-').map(Number);
  const base = new Date(y, m - 1, d);
  const keys = [];
  for (let i = 1; i <= n; i++) {
    const prev = new Date(base);
    prev.setDate(prev.getDate() - i);
    const py = prev.getFullYear();
    const pm = String(prev.getMonth() + 1).padStart(2, '0');
    const pd = String(prev.getDate()).padStart(2, '0');
    keys.push(`${py}-${pm}-${pd}`);
  }
  return keys;
}

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    // Migrate old array format (muscle names) to count format ({ muscle: n })
    const result = {};
    for (const [day, val] of Object.entries(raw)) {
      if (Array.isArray(val)) {
        result[day] = {};
        for (const m of val) result[day][m] = 1;
      } else {
        result[day] = val;
      }
    }
    return result;
  } catch { return {}; }
}

function save(data) {
  undoSnapshot = localStorage.getItem(STORAGE_KEY);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  const btn = document.getElementById('undo-btn');
  if (btn) btn.disabled = false;
}

function undo() {
  if (undoSnapshot !== null) {
    localStorage.setItem(STORAGE_KEY, undoSnapshot);
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
  undoSnapshot = null;
  document.getElementById('undo-btn').disabled = true;
  render();
}

function getCount(data, day, muscle) {
  return data[day]?.[muscle] || 0;
}

function muscleState(muscle) {
  const data = load();
  const today = workoutDayKey();
  const past = pastWorkoutDayKeys(6);
  if (getCount(data, today, muscle) > 0) return 'today';
  if (getCount(data, past[0], muscle) > 0) return 'yesterday';
  if (past.slice(1, 5).some(k => getCount(data, k, muscle) > 0)) return 'recent';
  if (getCount(data, past[5], muscle) > 0) return 'expiring';
  return 'none';
}

function todayCount(muscle) {
  return getCount(load(), workoutDayKey(), muscle);
}

function toggle(muscle) {
  const data = load();
  const today = workoutDayKey();
  if (!data[today]) data[today] = {};
  data[today][muscle] = getCount(data, today, muscle) > 0 ? 0 : 1;
  save(data);
  render();
}

function adjust(muscle, delta) {
  const data = load();
  const today = workoutDayKey();
  if (!data[today]) data[today] = {};
  data[today][muscle] = Math.max(0, getCount(data, today, muscle) + delta);
  save(data);
  render();
}

function formatDayLabel(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric'
  });
}

function makeCheckboxSVG() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 14 14');
  svg.classList.add('check-icon');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
  path.setAttribute('points', '2,7 5.5,11 12,3');
  svg.appendChild(path);
  return svg;
}

function makeCountBtn(label, onClick) {
  const btn = document.createElement('button');
  btn.className = 'count-btn';
  btn.textContent = label;
  btn.addEventListener('click', e => { e.stopPropagation(); onClick(); });
  return btn;
}

function render() {
  const today = workoutDayKey();
  document.getElementById('date-display').textContent = formatDayLabel(today);

  document.querySelectorAll('.segment').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === currentTab);
  });

  const items = currentTab === 'muscles' ? MUSCLES : CARDIO;
  const list = document.getElementById('muscle-list');
  list.innerHTML = '';

  for (const muscle of items) {
    const state = muscleState(muscle);
    const n = todayCount(muscle);

    const li = document.createElement('li');
    li.className = `muscle-item ${state}`;

    const box = document.createElement('span');
    box.className = 'checkbox';
    box.setAttribute('role', 'checkbox');
    box.setAttribute('aria-checked', state === 'today' ? 'true' : 'false');
    box.setAttribute('tabindex', '0');
    box.appendChild(makeCheckboxSVG());

    const dot = document.createElement('span');
    dot.className = 'dot';
    box.appendChild(dot);

    const name = document.createElement('span');
    name.className = 'name';
    name.textContent = muscle;

    const countWrap = document.createElement('div');
    countWrap.className = 'count-wrap';
    const countEl = document.createElement('span');
    countEl.className = 'count';
    countEl.textContent = n;
    countWrap.appendChild(countEl);
    countWrap.appendChild(makeCountBtn('+', () => adjust(muscle, 1)));

    li.appendChild(box);
    li.appendChild(name);
    li.appendChild(countWrap);

    const act = () => toggle(muscle);
    li.addEventListener('click', act);
    box.addEventListener('keydown', e => {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); act(); }
    });

    list.appendChild(li);
  }
}

// Refresh display at the next 4am rollover.
function scheduleRollover() {
  const now = new Date();
  const next = new Date(now);
  next.setHours(4, 0, 0, 0);
  if (now >= next) next.setDate(next.getDate() + 1);
  setTimeout(() => { render(); scheduleRollover(); }, next - now);
}

document.getElementById('undo-btn').addEventListener('click', undo);

document.querySelectorAll('.segment').forEach(btn => {
  btn.addEventListener('click', () => {
    currentTab = btn.dataset.tab;
    render();
  });
});

render();
scheduleRollover();
