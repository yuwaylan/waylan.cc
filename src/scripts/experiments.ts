const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

type Point3D = [number, number, number];

const wireframeLab = document.querySelector<HTMLElement>('[data-wireframe-lab]');
const wireframeCanvas = wireframeLab?.querySelector<HTMLCanvasElement>('[data-wireframe]');
const wireframeToggle = wireframeLab?.querySelector<HTMLButtonElement>('[data-wireframe-toggle]');
const wireframeCoordinates = wireframeLab?.querySelector<HTMLElement>(
  '[data-wireframe-coordinates]',
);

if (wireframeLab && wireframeCanvas && wireframeToggle) {
  const canvas = wireframeCanvas;
  const context = canvas.getContext('2d');
  const points: Point3D[] = [
    [-1.35, -0.8, -0.55],
    [-0.78, 0.95, -0.55],
    [0, -0.15, -0.55],
    [0.78, 0.95, -0.55],
    [1.35, -0.8, -0.55],
    [-1.35, -0.8, 0.55],
    [-0.78, 0.95, 0.55],
    [0, -0.15, 0.55],
    [0.78, 0.95, 0.55],
    [1.35, -0.8, 0.55],
    [0, -1.05, 0],
    [0, 0.95, 0],
  ];
  const edges = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [5, 6],
    [6, 7],
    [7, 8],
    [8, 9],
    [0, 5],
    [1, 6],
    [2, 7],
    [3, 8],
    [4, 9],
    [2, 10],
    [7, 10],
    [1, 11],
    [3, 11],
    [6, 11],
    [8, 11],
  ];
  let angle = 0;
  let pointerX = 0;
  let pointerY = 0;
  let targetX = 0;
  let targetY = 0;
  let paused = reducedMotion.matches;
  let animationFrame = 0;

  wireframeToggle.textContent = paused ? 'PLAY' : 'PAUSE';
  wireframeToggle.setAttribute('aria-pressed', String(paused));

  function resizeWireframe() {
    const ratio = Math.min(devicePixelRatio || 1, 2);
    const size = canvas.clientWidth;
    canvas.width = Math.max(1, Math.round(size * ratio));
    canvas.height = Math.max(1, Math.round(size * ratio));
  }

  function project([x, y, z]: Point3D) {
    const cosY = Math.cos(angle + pointerX * 0.45);
    const sinY = Math.sin(angle + pointerX * 0.45);
    const x1 = x * cosY - z * sinY;
    const z1 = x * sinY + z * cosY;
    const tilt = -0.2 + pointerY * 0.32;
    const cosX = Math.cos(tilt);
    const sinX = Math.sin(tilt);
    const y1 = y * cosX - z1 * sinX;
    const z2 = y * sinX + z1 * cosX;
    const perspective = 3.8 / (4.4 + z2);
    const scale = canvas.width * 0.25;
    return [
      canvas.width / 2 + x1 * scale * perspective,
      canvas.height / 2 + y1 * scale * perspective,
    ] as const;
  }

  function drawWireframe() {
    if (!context) return;
    pointerX += (targetX - pointerX) * 0.055;
    pointerY += (targetY - pointerY) * 0.055;
    if (!paused) angle += 0.0045;
    context.clearRect(0, 0, canvas.width, canvas.height);
    const projected = points.map(project);
    context.strokeStyle = '#171717';
    context.lineWidth = Math.max(1, canvas.width / 560);
    context.beginPath();
    for (const [start, end] of edges) {
      context.moveTo(projected[start][0], projected[start][1]);
      context.lineTo(projected[end][0], projected[end][1]);
    }
    context.stroke();
    context.fillStyle = '#171717';
    for (const [x, y] of projected) {
      context.fillRect(x - 2, y - 2, 4, 4);
    }
    animationFrame = requestAnimationFrame(drawWireframe);
  }

  wireframeLab.addEventListener('pointermove', (event) => {
    const bounds = wireframeLab.getBoundingClientRect();
    targetX = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
    targetY = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
    if (wireframeCoordinates)
      wireframeCoordinates.textContent = `X ${String(Math.round((targetX + 1) * 50)).padStart(3, '0')} / Y ${String(Math.round((targetY + 1) * 50)).padStart(3, '0')}`;
  });
  wireframeLab.addEventListener('pointerleave', () => {
    targetX = 0;
    targetY = 0;
  });
  wireframeToggle.addEventListener('click', () => {
    paused = !paused;
    wireframeToggle.textContent = paused ? 'PLAY' : 'PAUSE';
    wireframeToggle.setAttribute('aria-pressed', String(paused));
  });
  reducedMotion.addEventListener('change', () => {
    paused = reducedMotion.matches;
    wireframeToggle.textContent = paused ? 'PLAY' : 'PAUSE';
    wireframeToggle.setAttribute('aria-pressed', String(paused));
  });
  new ResizeObserver(resizeWireframe).observe(canvas);
  resizeWireframe();
  drawWireframe();
  addEventListener('pagehide', () => cancelAnimationFrame(animationFrame), { once: true });
}

const lifeLab = document.querySelector<HTMLElement>('[data-life-lab]');
const lifeCanvas = lifeLab?.querySelector<HTMLCanvasElement>('[data-life-canvas]');
const lifeToggle = lifeLab?.querySelector<HTMLButtonElement>('[data-life-toggle]');
const lifeReset = lifeLab?.querySelector<HTMLButtonElement>('[data-life-reset]');
const lifeGeneration = lifeLab?.querySelector<HTMLElement>('[data-life-generation]');

if (lifeCanvas && lifeToggle && lifeReset) {
  const canvas = lifeCanvas;
  const context = canvas.getContext('2d');
  const columns = 44;
  const rows = 20;
  let cells: boolean[][] = [];
  let generation = 0;
  let paused = reducedMotion.matches;
  let timer = 0;

  lifeToggle.textContent = paused ? 'PLAY' : 'PAUSE';
  lifeToggle.setAttribute('aria-pressed', String(paused));

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

  function drawLife() {
    if (!context) return;
    const cellWidth = canvas.width / columns;
    const cellHeight = canvas.height / rows;
    context.fillStyle = '#ef7696';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#171717';
    cells.forEach((row, y) =>
      row.forEach((alive, x) => {
        if (alive)
          context.fillRect(
            Math.floor(x * cellWidth) + 1,
            Math.floor(y * cellHeight) + 1,
            Math.ceil(cellWidth) - 2,
            Math.ceil(cellHeight) - 2,
          );
      }),
    );
    if (lifeGeneration) lifeGeneration.textContent = `GEN ${String(generation).padStart(3, '0')}`;
  }

  function loop() {
    if (!paused) evolve();
    drawLife();
    timer = window.setTimeout(loop, 180);
  }

  lifeToggle.addEventListener('click', () => {
    paused = !paused;
    lifeToggle.textContent = paused ? 'PLAY' : 'PAUSE';
    lifeToggle.setAttribute('aria-pressed', String(paused));
  });
  lifeReset.addEventListener('click', () => {
    seed();
    drawLife();
  });
  reducedMotion.addEventListener('change', () => {
    paused = reducedMotion.matches;
    lifeToggle.textContent = paused ? 'PLAY' : 'PAUSE';
    lifeToggle.setAttribute('aria-pressed', String(paused));
  });
  seed();
  loop();
  addEventListener('pagehide', () => clearTimeout(timer), { once: true });
}
