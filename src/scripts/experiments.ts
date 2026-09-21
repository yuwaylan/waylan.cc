const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

type Point3D = readonly [number, number, number];

function setupTorus() {
  const torus = document.querySelector<HTMLElement>('[data-torus]');
  const canvas = torus?.querySelector<HTMLCanvasElement>('[data-torus-canvas]');
  const toggle = document.querySelector<HTMLButtonElement>('[data-torus-toggle]');
  if (!torus || !canvas || !toggle) return;
  const context = canvas.getContext('2d');
  if (!context) return;
  const torusRoot = torus;
  const torusCanvas = canvas;
  const torusToggle = toggle;
  const torusContext = context;

  const rings = 24;
  const segments = 12;
  const points: Point3D[] = [];
  const edges: Array<readonly [number, number]> = [];
  const majorRadius = 1.06;
  const tubeRadius = 0.43;
  for (let ring = 0; ring < rings; ring += 1) {
    const u = (ring / rings) * Math.PI * 2;
    for (let segment = 0; segment < segments; segment += 1) {
      const v = (segment / segments) * Math.PI * 2;
      points.push([
        (majorRadius + tubeRadius * Math.cos(v)) * Math.cos(u),
        tubeRadius * Math.sin(v),
        (majorRadius + tubeRadius * Math.cos(v)) * Math.sin(u),
      ]);
      const index = ring * segments + segment;
      edges.push([index, ring * segments + ((segment + 1) % segments)]);
      edges.push([index, ((ring + 1) % rings) * segments + segment]);
    }
  }

  let width = 0;
  let height = 0;
  let angle = 0.42;
  let pointerX = 0;
  let pointerY = 0;
  let targetX = 0;
  let targetY = 0;
  let manuallyPaused = false;
  let visible = false;
  let frame = 0;
  let previousTime = performance.now();
  const isRunning = () =>
    !manuallyPaused && !reducedMotion.matches && visible && document.visibilityState === 'visible';

  function syncToggle() {
    const paused = manuallyPaused || reducedMotion.matches;
    torusToggle.textContent = reducedMotion.matches
      ? 'Static motion'
      : paused
        ? 'Resume motion'
        : 'Pause motion';
    torusToggle.setAttribute('aria-pressed', String(paused));
    torusToggle.disabled = reducedMotion.matches;
  }

  function resize() {
    const bounds = torusCanvas.getBoundingClientRect();
    const ratio = Math.min(devicePixelRatio || 1, 2);
    width = Math.max(1, Math.round(bounds.width * ratio));
    height = Math.max(1, Math.round(bounds.height * ratio));
    if (torusCanvas.width !== width || torusCanvas.height !== height) {
      torusCanvas.width = width;
      torusCanvas.height = height;
    }
    draw();
  }

  function project([x, y, z]: Point3D) {
    const yaw = angle + pointerX * 0.24;
    const cosY = Math.cos(yaw);
    const sinY = Math.sin(yaw);
    const x1 = x * cosY - z * sinY;
    const z1 = x * sinY + z * cosY;
    const pitch = -0.52 + Math.sin(angle * 0.65) * 0.1 + pointerY * 0.14;
    const cosX = Math.cos(pitch);
    const sinX = Math.sin(pitch);
    const y1 = y * cosX - z1 * sinX;
    const z2 = y * sinX + z1 * cosX;
    const perspective = 3.5 / (4.6 + z2);
    const scale = Math.min(width, height) * 0.43;
    return [
      width / 2 + x1 * scale * perspective,
      height / 2 + y1 * scale * perspective,
      z2,
    ] as const;
  }

  function draw() {
    torusContext.clearRect(0, 0, width, height);
    const projected = points.map(project);
    const lines = edges
      .map(([from, to]) => ({
        from: projected[from],
        to: projected[to],
        depth: (projected[from][2] + projected[to][2]) / 2,
      }))
      .sort((a, b) => b.depth - a.depth);
    torusContext.lineWidth = Math.max(0.7, Math.min(width, height) / 580);
    torusContext.lineCap = 'round';
    for (const line of lines) {
      const farDepth = Math.max(0, Math.min(1, (line.depth + 1.7) / 3.4));
      torusContext.strokeStyle = `rgb(255 255 255 / ${0.16 + (1 - farDepth) * 0.72})`;
      torusContext.beginPath();
      torusContext.moveTo(line.from[0], line.from[1]);
      torusContext.lineTo(line.to[0], line.to[1]);
      torusContext.stroke();
    }
  }

  function tick(timestamp: number) {
    if (!isRunning()) return;
    const delta = Math.min(34, Math.max(0, timestamp - previousTime));
    previousTime = timestamp;
    pointerX += (targetX - pointerX) * 0.045;
    pointerY += (targetY - pointerY) * 0.045;
    angle += 0.0032 * (delta / (1000 / 60));
    draw();
    frame = requestAnimationFrame(tick);
  }

  function updateSchedule() {
    cancelAnimationFrame(frame);
    draw();
    if (isRunning()) {
      previousTime = performance.now();
      frame = requestAnimationFrame(tick);
    }
  }

  torusRoot.addEventListener('pointermove', (event) => {
    if (!isRunning()) return;
    const bounds = torusRoot.getBoundingClientRect();
    targetX = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
    targetY = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
  });
  torusRoot.addEventListener('pointerleave', () => {
    if (!isRunning()) return;
    targetX = 0;
    targetY = 0;
  });
  torusToggle.addEventListener('click', () => {
    manuallyPaused = !manuallyPaused;
    syncToggle();
    updateSchedule();
  });

  const intersection = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
      updateSchedule();
    },
    { threshold: 0.02 },
  );
  intersection.observe(torusRoot);
  new ResizeObserver(resize).observe(torusCanvas);
  document.addEventListener('visibilitychange', updateSchedule);
  addEventListener('pagehide', () => cancelAnimationFrame(frame));
  addEventListener('pageshow', updateSchedule);
  reducedMotion.addEventListener('change', () => {
    syncToggle();
    updateSchedule();
  });
  syncToggle();
  resize();
}

function setupLife() {
  const lifeLab = document.querySelector<HTMLElement>('[data-life-lab]');
  const canvas = lifeLab?.querySelector<HTMLCanvasElement>('[data-life-canvas]');
  const toggle = lifeLab?.querySelector<HTMLButtonElement>('[data-life-toggle]');
  const reset = lifeLab?.querySelector<HTMLButtonElement>('[data-life-reset]');
  const generationLabel = lifeLab?.querySelector<HTMLElement>('[data-life-generation]');
  if (!lifeLab || !canvas || !toggle || !reset) return;
  const context = canvas.getContext('2d');
  if (!context) return;
  const lifeRoot = lifeLab;
  const lifeCanvas = canvas;
  const lifeToggle = toggle;
  const lifeReset = reset;
  const lifeContext = context;

  const columns = 44;
  const rows = 20;
  let cells: boolean[][] = [];
  let generation = 0;
  let manuallyPaused = false;
  let visible = false;
  let timer = 0;
  const isRunning = () =>
    !manuallyPaused && !reducedMotion.matches && visible && document.visibilityState === 'visible';

  function syncToggle() {
    const paused = manuallyPaused || reducedMotion.matches;
    lifeToggle.textContent = reducedMotion.matches
      ? 'Static motion'
      : paused
        ? 'Resume motion'
        : 'Pause motion';
    lifeToggle.setAttribute('aria-pressed', String(paused));
    lifeToggle.disabled = reducedMotion.matches;
  }

  function seed() {
    cells = Array.from({ length: rows }, () =>
      Array.from({ length: columns }, () => Math.random() > 0.73),
    );
    generation = 0;
  }

  function evolve() {
    cells = cells.map((row, y) =>
      row.map((alive, x) => {
        let neighbors = 0;
        for (let dy = -1; dy <= 1; dy += 1) {
          for (let dx = -1; dx <= 1; dx += 1) {
            if (!dx && !dy) continue;
            if (cells[(y + dy + rows) % rows][(x + dx + columns) % columns]) neighbors += 1;
          }
        }
        return neighbors === 3 || (alive && neighbors === 2);
      }),
    );
    generation += 1;
  }

  function draw() {
    const cellWidth = lifeCanvas.width / columns;
    const cellHeight = lifeCanvas.height / rows;
    lifeContext.fillStyle = '#ed829c';
    lifeContext.fillRect(0, 0, lifeCanvas.width, lifeCanvas.height);
    lifeContext.fillStyle = '#171717';
    cells.forEach((row, y) =>
      row.forEach((alive, x) => {
        if (alive)
          lifeContext.fillRect(
            Math.floor(x * cellWidth) + 1,
            Math.floor(y * cellHeight) + 1,
            Math.ceil(cellWidth) - 2,
            Math.ceil(cellHeight) - 2,
          );
      }),
    );
    if (generationLabel) generationLabel.textContent = `GEN ${String(generation).padStart(3, '0')}`;
  }

  function loop() {
    if (!isRunning()) return;
    evolve();
    draw();
    timer = window.setTimeout(loop, 180);
  }

  function updateSchedule() {
    clearTimeout(timer);
    draw();
    if (isRunning()) timer = window.setTimeout(loop, 180);
  }

  lifeToggle.addEventListener('click', () => {
    manuallyPaused = !manuallyPaused;
    syncToggle();
    updateSchedule();
  });
  lifeReset.addEventListener('click', () => {
    seed();
    draw();
  });
  const intersection = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
      updateSchedule();
    },
    { threshold: 0.02 },
  );
  intersection.observe(lifeRoot);
  document.addEventListener('visibilitychange', updateSchedule);
  addEventListener('pagehide', () => clearTimeout(timer));
  addEventListener('pageshow', updateSchedule);
  reducedMotion.addEventListener('change', () => {
    syncToggle();
    updateSchedule();
  });
  seed();
  syncToggle();
  draw();
}

setupTorus();
setupLife();
