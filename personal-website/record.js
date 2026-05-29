const PREFIX = 'diary_';

function getEntry(d) {
  const raw = localStorage.getItem(PREFIX + d);
  return raw ? JSON.parse(raw) : null;
}

function saveEntry(d, rating, text) {
  localStorage.setItem(PREFIX + d, JSON.stringify({ rating, text }));
}

function toDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ── 输入区 ──
const todayStr = toDateStr(new Date());
const dateInput = document.getElementById('record-date');
const textInput = document.getElementById('record-text');
const charCount = document.getElementById('char-count');
const submitBtn = document.getElementById('record-submit');
const recordMsg = document.getElementById('record-msg');
const ratingBtns = document.querySelectorAll('.rating-btn');

let selectedRating = null;

dateInput.value = todayStr;
dateInput.max = todayStr;

syncInputState();

dateInput.addEventListener('change', syncInputState);

function syncInputState() {
  const entry = getEntry(dateInput.value);
  ratingBtns.forEach(b => b.classList.remove('selected'));
  selectedRating = null;
  textInput.value = '';
  charCount.textContent = '0 / 30';

  if (entry) {
    submitBtn.disabled = true;
    submitBtn.textContent = '已记录';
    recordMsg.textContent = `${entry.rating}  ·  ${entry.text}`;
  } else {
    submitBtn.disabled = false;
    submitBtn.textContent = '记录';
    recordMsg.textContent = '';
  }
}

ratingBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    ratingBtns.forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedRating = btn.dataset.r;
  });
});

textInput.addEventListener('input', () => {
  charCount.textContent = `${textInput.value.length} / 30`;
});

submitBtn.addEventListener('click', () => {
  const d = dateInput.value;
  const text = textInput.value.trim();
  if (!selectedRating) { recordMsg.textContent = '请选择今日评价'; return; }
  if (!text) { recordMsg.textContent = '请写一句话'; return; }
  saveEntry(d, selectedRating, text);
  syncInputState();
  renderCal();
});

// ── 日历区 ──
const today = new Date();
let calYear = today.getFullYear();
let calMonth = today.getMonth();
let selectedDay = null;

document.getElementById('prev-month').addEventListener('click', () => {
  calMonth--;
  if (calMonth < 0) { calMonth = 11; calYear--; }
  selectedDay = null;
  document.getElementById('cal-detail').innerHTML = '';
  renderCal();
});

document.getElementById('next-month').addEventListener('click', () => {
  calMonth++;
  if (calMonth > 11) { calMonth = 0; calYear++; }
  selectedDay = null;
  document.getElementById('cal-detail').innerHTML = '';
  renderCal();
});

function renderCal() {
  document.getElementById('cal-title').textContent =
    `${calYear} 年 ${calMonth + 1} 月`;

  const grid = document.getElementById('cal-grid');
  grid.innerHTML = '';

  const firstDay = new Date(calYear, calMonth, 1);
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

  // 周一为第一列
  let startOffset = firstDay.getDay();
  startOffset = startOffset === 0 ? 6 : startOffset - 1;

  for (let i = 0; i < startOffset; i++) {
    const empty = document.createElement('div');
    empty.className = 'cal-day empty';
    grid.appendChild(empty);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const ds = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const entry = getEntry(ds);
    const isToday = ds === todayStr;
    const isSelected = ds === selectedDay;

    const cell = document.createElement('div');
    cell.className = 'cal-day'
      + (entry ? ' has-entry' : '')
      + (isToday ? ' is-today' : '')
      + (isSelected ? ' is-selected' : '');

    const circle = document.createElement('div');
    circle.className = 'day-circle';

    const numEl = document.createElement('span');
    numEl.className = 'day-num';
    numEl.textContent = d;

    const ratingEl = document.createElement('span');
    ratingEl.className = 'day-rating';
    ratingEl.textContent = entry ? entry.rating : '';

    circle.appendChild(numEl);
    circle.appendChild(ratingEl);
    cell.appendChild(circle);

    if (entry) {
      cell.addEventListener('click', () => {
        selectedDay = ds;
        renderCal();
        const detail = document.getElementById('cal-detail');
        detail.style.opacity = '0';
        detail.innerHTML =
          `<span class="detail-date">${ds}</span>` +
          `<span class="detail-sep">·</span>` +
          `<span class="detail-rating">${entry.rating}</span>` +
          `<span class="detail-sep">·</span>` +
          `<span class="detail-text">${entry.text}</span>`;
        requestAnimationFrame(() => { detail.style.opacity = '1'; });
      });
    }

    grid.appendChild(cell);
  }
}

renderCal();
