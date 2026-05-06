const MUSCLES = ['Chest', 'Shoulder', 'Bicep', 'Tricep', 'Trap', 'Back', 'Quad', 'Ham'];
const CARDIO  = ['Cardio 30', 'Cardio 45', 'Cardio 60'];
let currentTab = 'muscles';
const STORAGE_KEY = 'workout_data';

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
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
  catch { return {}; }
}

function save(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function muscleState(muscle) {
  const data = load();
  const today = workoutDayKey();
  const past = pastWorkoutDayKeys(6); // days 1–6 back (< 7 calendar days)
  if (data[today]?.includes(muscle)) return 'today';
  if (data[past[0]]?.includes(muscle)) return 'yesterday';
  if (past.slice(1).some(k => data[k]?.includes(muscle))) return 'recent';
  return 'none';
}

function toggle(muscle) {
  const data = load();
  const today = workoutDayKey();
  if (!data[today]) data[today] = [];
  const idx = data[today].indexOf(muscle);
  if (idx === -1) data[today].push(muscle);
  else data[today].splice(idx, 1);
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

    li.appendChild(box);
    li.appendChild(name);

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

document.querySelectorAll('.segment').forEach(btn => {
  btn.addEventListener('click', () => {
    currentTab = btn.dataset.tab;
    render();
  });
});

render();
scheduleRollover();
