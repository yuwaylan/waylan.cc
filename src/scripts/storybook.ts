import { getCountdown } from '../lib/countdown';

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const root = document.documentElement;
const motionButton = document.querySelector<HTMLButtonElement>('[data-story-motion]');
let paused = false;
function syncMotion() {
  root.dataset.storyMotion =
    paused || reducedMotion.matches
      ? 'paused'
      : document.visibilityState === 'hidden'
        ? 'hidden'
        : 'running';
  if (!motionButton) return;
  motionButton.hidden = false;
  motionButton.disabled = reducedMotion.matches;
  motionButton.textContent = reducedMotion.matches
    ? '已減少動畫'
    : paused
      ? '播放動畫'
      : '暫停動畫';
  motionButton.setAttribute('aria-pressed', String(paused || reducedMotion.matches));
}
motionButton?.addEventListener('click', () => {
  paused = !paused;
  syncMotion();
});
reducedMotion.addEventListener('change', syncMotion);
document.addEventListener('visibilitychange', syncMotion);
syncMotion();

for (const notebook of document.querySelectorAll<HTMLElement>('[data-project-tabs]')) {
  const controls = notebook.querySelector<HTMLElement>('[data-project-controls]')!;
  const tabs = [...controls.querySelectorAll<HTMLButtonElement>('button')];
  const panels = [...notebook.querySelectorAll<HTMLElement>('[data-project-panel]')];
  controls.hidden = false;
  controls.setAttribute('role', 'tablist');
  tabs.forEach((tab, i) => {
    tab.setAttribute('role', 'tab');
    panels[i].setAttribute('role', 'tabpanel');
    panels[i].setAttribute('aria-labelledby', tab.id);
    panels[i].tabIndex = 0;
  });
  function select(index: number, motion = true) {
    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(index === i));
      tab.tabIndex = i === index ? 0 : -1;
      panels[i].hidden = index !== i;
      panels[i].classList.remove('story-bounce');
    });
    if (motion && !reducedMotion.matches && !paused) {
      void panels[index].offsetWidth;
      panels[index].classList.add('story-bounce');
    }
  }
  select(0, false);
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(i));
    tab.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const next =
        event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? tabs.length - 1
            : (i + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      select(next);
      tabs[next].focus();
    });
  });
}

const countdown = document.querySelector<HTMLElement>('[data-countdown]');
if (countdown) {
  const target = countdown.dataset.departureAt;
  const digits = countdown.querySelector<HTMLElement>('[data-countdown-digits]')!;
  const status = countdown.querySelector<HTMLElement>('[data-countdown-status]')!;
  const units = [...digits.querySelectorAll<HTMLElement>('[data-countdown-unit]')];
  let timer: number | undefined;
  function update() {
    const remaining = getCountdown(target);
    if (!remaining) return;
    digits.hidden = remaining.departed;
    status.textContent = remaining.departed ? '已經出發，旅程開始！' : '距離出發還有';
    [remaining.days, remaining.hours, remaining.minutes, remaining.seconds].forEach((value, i) => {
      units[i].textContent = String(value).padStart(2, '0');
    });
    if (!remaining.departed && document.visibilityState === 'visible')
      timer = window.setTimeout(update, 1000);
  }
  function resume() {
    clearTimeout(timer);
    update();
  }
  document.addEventListener('visibilitychange', resume);
  addEventListener('pagehide', () => clearTimeout(timer));
  addEventListener('pageshow', resume);
  update();
}
