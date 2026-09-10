import { animate } from 'animejs';
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const canAnimate = () => !reduce.matches;
// Native horizontal scrolling keeps every image available without JavaScript.
for (const gallery of document.querySelectorAll<HTMLElement>('[data-gallery]')) {
  const track = gallery.querySelector<HTMLElement>('.gallery-track')!;
  const items = [...gallery.querySelectorAll<HTMLElement>('.gallery-item')];
  const controls = gallery.querySelector<HTMLElement>('.gallery-controls')!;
  const buttons = [...controls.querySelectorAll<HTMLButtonElement>('button')];
  controls.hidden = false;
  let selected = 0;
  const update = (index: number) => {
    selected = index;
    buttons.forEach((b, i) => b.setAttribute('aria-pressed', String(i === index)));
  };
  const select = (index: number) => {
    const next = Math.max(0, Math.min(items.length - 1, index));
    const left = items[next].offsetLeft - items[0].offsetLeft;
    track.scrollTo({ left, behavior: canAnimate() ? 'smooth' : 'instant' });
    update(next);
  };
  buttons.forEach((button, i) => button.addEventListener('click', () => select(i)));
  track.addEventListener('keydown', (e) => {
    if (e.target !== track) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      select(selected + (e.key === 'ArrowRight' ? 1 : -1));
    }
  });
  let frame = 0;
  track.addEventListener(
    'scroll',
    () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const origin = items[0].offsetLeft;
        const distances = items.map((item) =>
          Math.abs(item.offsetLeft - origin - track.scrollLeft),
        );
        update(distances.indexOf(Math.min(...distances)));
      });
    },
    { passive: true },
  );
}
for (const viewer of document.querySelectorAll<HTMLElement>('[data-research]')) {
  const controls = viewer.querySelector<HTMLElement>('.research-controls')!;
  const buttons = [...controls.querySelectorAll<HTMLButtonElement>('button')];
  const panels = [...viewer.querySelectorAll<HTMLElement>('[data-stage-panel]')];
  let animation: ReturnType<typeof animate> | undefined;
  const select = (index: number, motion = true) => {
    animation?.revert();
    buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
    panels.forEach((panel, i) => {
      panel.hidden = i !== index;
    });
    if (motion && canAnimate())
      animation = animate(panels[index], { opacity: [0.65, 1], duration: 240, ease: 'outQuad' });
  };
  controls.hidden = false;
  viewer.classList.add('is-enhanced');
  select(0, false);
  buttons.forEach((button, i) => {
    button.addEventListener('click', () => select(i));
    button.addEventListener('keydown', (e) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
      e.preventDefault();
      const next =
        e.key === 'Home'
          ? 0
          : e.key === 'End'
            ? buttons.length - 1
            : (i + (e.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
      select(next);
      buttons[next].focus();
    });
  });
  const stop = () => animation?.revert();
  reduce.addEventListener('change', stop);
  document.addEventListener('waylan:motion-change', stop);
}
const dialog = document.querySelector<HTMLDialogElement>('.image-dialog');
if (dialog) {
  const image = dialog.querySelector<HTMLImageElement>('img')!;
  const caption = dialog.querySelector<HTMLElement>('#image-dialog-caption')!;
  const original = dialog.querySelector<HTMLAnchorElement>('[data-image-original]')!;
  const links = [...document.querySelectorAll<HTMLAnchorElement>('a[data-lightbox]')];
  const close = dialog.querySelector<HTMLButtonElement>('[data-image-close]')!;
  let group: HTMLAnchorElement[] = [],
    current = 0,
    opener: HTMLElement | null = null;
  let priorOverflow = '';
  const zoom = dialog.querySelector<HTMLButtonElement>('[data-image-zoom]')!;
  let opening: ReturnType<typeof animate> | undefined;
  zoom.addEventListener('click', () => {
    const zoomed = dialog.classList.toggle('is-zoomed');
    zoom.setAttribute('aria-pressed', String(zoomed));
    zoom.textContent = zoomed ? '符合畫面' : '原始尺寸';
  });
  const show = (index: number) => {
    current = (index + group.length) % group.length;
    const link = group[current];
    dialog.classList.remove('is-zoomed');
    zoom.setAttribute('aria-pressed', 'false');
    zoom.textContent = '原始尺寸';
    image.src = link.href;
    image.alt = link.querySelector('img')?.alt || link.dataset.caption || '';
    caption.textContent = link.dataset.caption || image.alt;
    original.href = link.href;
    dialog
      .querySelectorAll<HTMLButtonElement>('[data-image-prev], [data-image-next]')
      .forEach((b) => {
        b.disabled = group.length < 2;
      });
  };
  links.forEach((link) =>
    link.addEventListener('click', (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      opener = link;
      const scope = link.closest(
        '[data-gallery], [data-research], .personality-images, .research-document, .case-visual, .personality-feature',
      );
      group = scope ? [...scope.querySelectorAll<HTMLAnchorElement>('a[data-lightbox]')] : [link];
      show(group.indexOf(link));
      priorOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      dialog.showModal();
      opening?.revert();
      if (canAnimate())
        opening = animate(dialog, {
          opacity: [0, 1],
          scale: [0.985, 1],
          duration: 220,
          ease: 'outCubic',
        });
      close.focus();
    }),
  );
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => {
    opening?.revert();
    document.body.style.overflow = priorOverflow;
    opener?.focus({ preventScroll: true });
    image.removeAttribute('src');
  });
  dialog.querySelector('[data-image-prev]')?.addEventListener('click', () => show(current - 1));
  dialog.querySelector('[data-image-next]')?.addEventListener('click', () => show(current + 1));
  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      show(current + (e.key === 'ArrowRight' ? 1 : -1));
    }
  });
  let startX = 0,
    startY = 0;
  image.addEventListener(
    'touchstart',
    (e) => {
      if (e.touches.length === 1) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      }
    },
    { passive: true },
  );
  image.addEventListener(
    'touchend',
    (e) => {
      const t = e.changedTouches[0];
      if (
        t &&
        Math.abs(t.clientX - startX) > 65 &&
        Math.abs(t.clientY - startY) < 40 &&
        group.length > 1
      )
        show(current + (t.clientX < startX ? 1 : -1));
    },
    { passive: true },
  );
}
