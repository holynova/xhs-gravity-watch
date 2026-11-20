"use strict";
const canvas = document.querySelector("#face"),
  ctx = canvas.getContext("2d");
const W = 352,
  H = 430,
  stage = document.querySelector("#stage"),
  glass = document.querySelector("#glass");
const names = ["网球", "篮球", "足球", "水晶", "金条"];
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
let theme = 0,
  bodies = [],
  sprites = [],
  gravity = { x: -185, y: -680 },
  lastInput = -100,
  dragging = false,
  sensor = false,
  tiltX = 0,
  tiltY = 0;
let startX = 0,
  startY = 0,
  initialX = 0,
  initialY = 0,
  viewScale = 1,
  clock = 0;
let seed = 1492;
function random() {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 4294967296;
}
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
function gradient(c, x, y, r, stops) {
  const g = c.createRadialGradient(x, y, 0, 0, 0, r);
  stops.forEach(([at, color]) => g.addColorStop(at, color));
  return g;
}
function line(c, pts, color, width = 1) {
  c.beginPath();
  pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.strokeStyle = color;
  c.lineWidth = width;
  c.stroke();
}
function polygon(c, pts, fill) {
  c.beginPath();
  pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
  c.fillStyle = fill;
  c.fill();
}
function surface(kind, variant) {
  const tex = document.createElement("canvas");
  tex.width = tex.height = 120;
  const c = tex.getContext("2d");
  c.translate(60, 60);
  const r = 51;
  c.save();
  c.beginPath();
  c.arc(0, 0, r, 0, Math.PI * 2);
  c.clip();
  if (kind < 3) {
    const palettes = [
      ["#e0e969", "#b9ca36", "#95a51b", "#586512"],
      ["#e26739", "#b44925", "#993718", "#542014"],
      ["#f9f6e8", "#d5d4c7", "#b4b3aa", "#77786f"],
    ];
    const p = palettes[kind];
    c.fillStyle = gradient(c, -21, -26, 58, [
      [0, p[0]],
      [0.48, p[1]],
      [0.79, p[2]],
      [1, p[3]],
    ]);
    c.fillRect(-56, -56, 112, 112);
    for (let i = 0; i < (kind === 0 ? 1900 : 1150); i++) {
      const x = random() * 106 - 53,
        y = random() * 106 - 53;
      c.fillStyle = i % 3 ? "rgba(36,34,6,.12)" : "rgba(255,255,218,.24)";
      c.fillRect(
        x,
        y,
        kind === 0 ? 0.5 + random() * 2 : 1,
        kind === 0 ? 1.3 : 1.6,
      );
    }
    c.rotate(variant * 0.96 + 0.15);
    if (kind === 0) {
      // Trace the visible half of a curved seam on the surface of a sphere.
      c.beginPath();
      let previousVisible = false;
      const tilt = 0.65 + variant * 0.17;
      for (let j = 0; j <= 180; j++) {
        const phase = (2 * Math.PI * j) / 180;
        const latitude = 0.61 * Math.sin(2 * phase);
        const x = Math.cos(latitude) * Math.cos(phase);
        const y = Math.sin(latitude);
        const z = Math.cos(latitude) * Math.sin(phase);
        const visible = y * Math.sin(tilt) + z * Math.cos(tilt) >= 0;
        if (visible) {
          const sy = (y * Math.cos(tilt) - z * Math.sin(tilt)) * r;
          if (previousVisible) c.lineTo(x * r, sy);
          else c.moveTo(x * r, sy);
        }
        previousVisible = visible;
      }
      c.strokeStyle = "#eeeea8c9";
      c.lineWidth = 2.1;
      c.stroke();
    }
    if (kind === 1) {
      for (const a of [-1, 1]) {
        c.beginPath();
        c.moveTo(a * 44, -35);
        c.bezierCurveTo(a * 11, -11, a * 9, 16, a * 43, 37);
        c.strokeStyle = "#421f13";
        c.lineWidth = 2.7;
        c.stroke();
      }
      line(
        c,
        [
          [-56, 3],
          [55, -4],
        ],
        "#472014",
        3,
      );
      c.beginPath();
      c.moveTo(-18, -52);
      c.quadraticCurveTo(4, -2, -6, 51);
      c.stroke();
    }
    if (kind === 2) {
      const pent = (x, y, s, a) =>
        Array.from({ length: 5 }, (_, j) => [
          x + Math.cos(a + j * 1.257) * s,
          y + Math.sin(a + j * 1.257) * s,
        ]);
      const center = pent(-5, -7, 14, 0.2);
      polygon(c, center, "#25292b");
      for (let i = 0; i < 5; i++) {
        let a = 0.2 + i * 1.257;
        let x = Math.cos(a) * 48,
          y = Math.sin(a) * 48;
        polygon(c, pent(x, y, 12, a), "#272928");
        line(c, [center[i], [x * 0.79, y * 0.79]], "#807f75", 0.9);
      }
    }
  } else {
    c.restore();
    c.save();
    c.rotate((variant - 1) * 0.18);
    if (kind === 3) {
      const ring = Array.from({ length: 8 }, (_, j) => {
        let a = (j * Math.PI) / 4;
        return [
          Math.cos(a) * (41 + random() * 8),
          Math.sin(a) * (37 + random() * 9),
        ];
      });
      const inner = ring.map(([x, y]) => [x * 0.48 + 2, y * 0.48 - 4]);
      const colors = [
        "#28292b",
        "#9f9f99",
        "#dad8d3",
        "#454748",
        "#faf8ee",
        "#727272",
        "#b3b3ae",
        "#363739",
      ];
      for (let j = 0; j < 8; j++) {
        let k = (j + 1) % 8;
        polygon(c, [ring[j], ring[k], inner[j]], colors[(j + variant) % 8]);
        polygon(
          c,
          [inner[j], ring[k], inner[k]],
          colors[(j * 3 + variant + 1) % 8],
        );
        line(c, [ring[j], inner[j]], "#f9f8eb70", 1);
      }
      polygon(c, inner, "#bab9b3");
      polygon(c, [inner[0], inner[2], inner[5]], "#e7e6e0");
    } else {
      const g = c.createLinearGradient(-45, -20, 35, 18);
      g.addColorStop(0, "#b58b31");
      g.addColorStop(0.3, "#ffe394");
      g.addColorStop(0.7, "#eac25f");
      g.addColorStop(1, "#bd8b29");
      polygon(
        c,
        [
          [-50, -15],
          [37, -22],
          [49, 5],
          [-36, 19],
        ],
        g,
      );
      polygon(
        c,
        [
          [-36, 19],
          [49, 5],
          [46, 16],
          [-38, 31],
        ],
        "#9c7123",
      );
      polygon(
        c,
        [
          [-50, -15],
          [-36, 19],
          [-38, 31],
          [-54, -1],
        ],
        "#d6aa4a",
      );
      c.rotate(-0.15);
      c.fillStyle = "#89621d";
      c.font = "bold 7px Georgia";
      c.fillText("FINE GOLD", -24, 1);
      c.font = "5px sans-serif";
      c.fillText("999.9", -11, 8);
    }
  }
  c.restore();
  return tex;
}
const court = document.createElement("canvas");
court.width = W * 2;
court.height = H * 2;
function courtTexture() {
  const c = court.getContext("2d");
  c.setTransform(2, 0, 0, 2, 0, 0);
  const colors = [
    ["#173b35", "#a94b30"],
    ["#251e1b", "#35241e"],
    ["#34441e", "#4a5e24"],
    ["#171919", "#2b2b29"],
    ["#28231d", "#3d3326"],
  ][theme];
  c.fillStyle = colors[0];
  c.fillRect(0, 0, W, H);
  c.fillStyle = colors[1];
  if (theme === 0) c.fillRect(27, 0, 298, H);
  else c.fillRect(0, 0, W, H);
  for (let i = 0; i < 26000; i++) {
    c.fillStyle = i % 3 ? "#06110b13" : "#fffad117";
    c.fillRect(
      random() * W,
      random() * H,
      0.4 + random() * 1.5,
      0.5 + random() * 1.1,
    );
  }
  const ink = theme === 1 ? "#c4b5a2" : "#e6dfc6";
  c.strokeStyle = ink;
  c.lineWidth = 1.45;
  const rect = (x, y, w, h) => c.strokeRect(x, y, w, h);
  if (theme === 0) {
    rect(29, -21, 294, 472);
    rect(48, -21, 256, 472);
    rect(48, 84, 256, 262);
    line(
      c,
      [
        [176, 84],
        [176, 346],
      ],
      ink,
      1.5,
    );
    line(
      c,
      [
        [29, 215],
        [323, 215],
      ],
      "#e9d9b6",
      2,
    );
  }
  if (theme === 1) {
    rect(22, 18, 308, 394);
    for (const y of [18, 412]) {
      const d = y === 18 ? 1 : -1;
      rect(127, Math.min(y, y + 100 * d), 98, 100);
      c.beginPath();
      c.arc(176, y + 100 * d, 49, 0, 2 * Math.PI);
      c.stroke();
      c.beginPath();
      c.arc(176, y, 128, 0, d * Math.PI, d < 0);
      c.stroke();
    }
    line(
      c,
      [
        [22, 215],
        [330, 215],
      ],
      ink,
    );
    c.beginPath();
    c.arc(176, 215, 44, 0, 7);
    c.stroke();
  }
  if (theme === 2) {
    for (let y = 0; y < H; y += 60) {
      c.fillStyle = "#171b0b1e";
      c.fillRect(0, y, W, 30);
    }
    rect(20, 16, 312, 398);
    line(
      c,
      [
        [20, 215],
        [332, 215],
      ],
      ink,
    );
    c.beginPath();
    c.arc(176, 215, 50, 0, 7);
    c.stroke();
    rect(86, 16, 180, 78);
    rect(86, 336, 180, 78);
    rect(127, 16, 98, 31);
    rect(127, 383, 98, 31);
  }
}
function setTheme(n) {
  theme = n;
  seed = 492 + theme;
  courtTexture();
  sprites = Array.from({ length: 6 }, (_, i) => surface(theme, i));
  bodies = Array.from({ length: theme === 4 ? 18 : 16 }, (_, i) => {
    const r = theme === 4 ? 20 : 21 + random() * 2;
    return {
      x: 40 + (i % 5) * 60 + random() * 6,
      y: 45 + Math.floor(i / 5) * 53,
      r,
      vx: random() * 15 - 7,
      vy: random() * 20,
      angle: random() * 6.28,
      spin: 0,
      sprite: i % 6,
    };
  });
  [...materialNav.children].forEach((el, i) =>
    el.setAttribute("aria-pressed", i === n),
  );
}
const materialNav = document.querySelector("#materials");
names.forEach((name, i) => {
  const b = document.createElement("button");
  b.textContent = name;
  b.onclick = () => setTheme(i);
  materialNav.append(b);
});
function solve(dt) {
  for (const b of bodies) {
    b.vx = (b.vx + gravity.x * dt) * 0.998;
    b.vy = (b.vy + gravity.y * dt) * 0.998;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.angle += b.spin * dt;
    b.spin *= 0.991;
  }
  for (let pass = 0; pass < 3; pass++) {
    for (let i = 0; i < bodies.length; i++) {
      const a = bodies[i];
      for (let j = i + 1; j < bodies.length; j++) {
        const b = bodies[j],
          dx = b.x - a.x,
          dy = b.y - a.y,
          d = Math.hypot(dx, dy) || 0.01,
          overlap = a.r + b.r - d;
        if (overlap <= 0) continue;
        const nx = dx / d,
          ny = dy / d,
          correction = overlap * 0.505;
        a.x -= nx * correction;
        a.y -= ny * correction;
        b.x += nx * correction;
        b.y += ny * correction;
        const dv = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
        if (dv < 0) {
          const imp = -dv * 0.64;
          a.vx -= imp * nx;
          a.vy -= imp * ny;
          b.vx += imp * nx;
          b.vy += imp * ny;
          const slip = (b.vy - a.vy) * nx - (b.vx - a.vx) * ny;
          a.spin += slip * 0.001;
          b.spin -= slip * 0.001;
        }
      }
      // Signed distance to a rounded rectangular enclosure.
      const x = clamp(a.x, 51, W - 51),
        y = clamp(a.y, 51, H - 51),
        dx = a.x - x,
        dy = a.y - y,
        d = Math.hypot(dx, dy),
        excess = d - (51 - a.r);
      if (excess > 0 && d) {
        const nx = dx / d,
          ny = dy / d;
        a.x -= nx * excess;
        a.y -= ny * excess;
        const v = a.vx * nx + a.vy * ny;
        if (v > 0) {
          a.vx -= nx * v * 1.34;
          a.vy -= ny * v * 1.34;
          const tangent = a.vx * -ny + a.vy * nx;
          a.spin = a.spin * 0.82 + (tangent / a.r) * 0.16;
          a.vx *= 0.965;
          a.vy *= 0.965;
        }
      }
    }
  }
}
// A stationary light source keeps the highlights fixed as the felt and seams roll.
const lightMap = document.createElement("canvas");
lightMap.width = lightMap.height = 120;
const lightCtx = lightMap.getContext("2d");
lightCtx.translate(60, 60);
lightCtx.beginPath();
lightCtx.arc(0, 0, 50.9, 0, Math.PI * 2);
lightCtx.fillStyle = gradient(lightCtx, -22, -28, 57, [
  [0, "#fffdd22f"],
  [0.38, "#fffed409"],
  [0.61, "#161c0807"],
  [0.86, "#1118042b"],
  [1, "#0c130a59"],
]);
lightCtx.fill();
function draw() {
  ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
  ctx.drawImage(court, 0, 0, W, H);
  for (const b of bodies) {
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(b.angle);
    const s = b.r * 2.34;
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 3;
    ctx.shadowColor = "#0009";
    ctx.drawImage(sprites[b.sprite], -s / 2, -s / 2, s, s);
    if (theme < 3) {
      ctx.shadowColor = "transparent";
      ctx.rotate(-b.angle);
      ctx.drawImage(lightMap, -s / 2, -s / 2, s, s);
    }
    ctx.restore();
  }
  const precious = theme > 2;
  ctx.fillStyle = "#fff";
  ctx.textAlign = "right";
  ctx.shadowBlur = 4;
  ctx.shadowColor = "#0004";
  ctx.font = "600 19px -apple-system,Arial,sans-serif";
  ctx.fillText(precious ? "MON 6" : "WED 12", W - 29, 38);
  ctx.font =
    (precious ? "650 75px" : "500 71px") + " -apple-system,Arial,sans-serif";
  ctx.fillText(precious ? "9:41" : "10:09", W - 24, 101);
  ctx.shadowBlur = 0;
  if (precious) {
    ctx.strokeStyle = "#fffc";
    ctx.lineWidth = 4;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(283, 365, 20 - i * 5, 0.2, 6.05 - i * 0.3);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(61, 365, 21, 0, 7);
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.font = "600 14px Arial";
    ctx.fillText("89%", 61, 370);
  }
}
function mapScreen() {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = [
    [147, 485],
    [521, 323],
    [690, 802],
    [328, 964],
  ];
  const ax = x1 - x2,
    bx = x3 - x2,
    ay = y1 - y2,
    by = y3 - y2,
    cx = x0 - x1 + x2 - x3,
    cy = y0 - y1 + y2 - y3;
  const det = ax * by - bx * ay,
    g = (cx * by - bx * cy) / det,
    h = (ax * cy - cx * ay) / det;
  const m = [
    (x1 - x0 + g * x1) / W,
    (y1 - y0 + g * y1) / W,
    0,
    g / W,
    (x3 - x0 + h * x3) / H,
    (y3 - y0 + h * y3) / H,
    0,
    h / H,
    0,
    0,
    1,
    0,
    x0,
    y0,
    0,
    1,
  ];
  glass.style.transform = "matrix3d(" + m.join(",") + ")";
}
function resize() {
  viewScale = Math.min(
    Math.max(innerWidth / 720, innerHeight / 1180),
    innerHeight / 810,
  );
  const d = Math.min(
    3,
    Math.max(
      1,
      devicePixelRatio * (dial ? mount.clientWidth / W : viewScale * 1.5),
    ),
  );
  canvas.width = Math.ceil(W * d);
  canvas.height = Math.ceil(H * d);
}
function steer(x, y) {
  gravity.x = clamp(x, -1000, 1000);
  gravity.y = clamp(y, -1000, 1000);
  lastInput = clock;
}
const main = document.querySelector("main");
main.onpointerdown = (e) => {
  if (e.target.closest("button,nav")) return;
  dragging = true;
  startX = e.clientX;
  startY = e.clientY;
  initialX = gravity.x;
  initialY = gravity.y;
  main.setPointerCapture(e.pointerId);
};
main.onpointermove = (e) => {
  if (dragging)
    steer(
      initialX + (e.clientX - startX) * 5,
      initialY + (e.clientY - startY) * 5,
    );
};
main.onpointerup = main.onpointercancel = () => (dragging = false);
onkeydown = (e) => {
  const motion = {
    ArrowLeft: [-800, 0],
    ArrowRight: [800, 0],
    ArrowUp: [0, -800],
    ArrowDown: [0, 800],
  }[e.key];
  if (motion) {
    e.preventDefault();
    steer(...motion);
  }
};
const tilt = document.querySelector("#tilt");
const hint = document.querySelector("#hint"),
  mount = document.querySelector("#dial-mount"),
  viewButton = document.querySelector("#view");
const mobile =
  matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0;
let dial = mobile,
  sensorTime = -1,
  filteredX = 0,
  filteredY = 0,
  orientationTime = -1,
  watchdog = 0,
  sensing = false;
function updateView() {
  document.body.classList.toggle("dial", dial);
  (dial ? mount : stage).append(glass);
  viewButton.textContent = dial ? "手腕视角" : "正面表盘";
  if (!dial) mapScreen();
  resize();
}
viewButton.onclick = () => {
  dial = !dial;
  updateView();
};
function reading(x, y) {
  if (!sensing || !Number.isFinite(x) || !Number.isFinite(y)) return;
  const now = performance.now();
  const [gx, gy] = Gravity.screenVector(
    x,
    y,
    screen.orientation?.angle ?? window.orientation ?? 0,
  );
  const k =
    sensorTime < 0 ? 1 : 1 - Math.exp(-Math.min(1000, now - sensorTime) / 65);
  sensorTime = now;
  filteredX += (gx - filteredX) * k;
  filteredY += (gy - filteredY) * k;
  if (!sensor) {
    sensor = true;
    tilt.hidden = true;
    hint.textContent = "体感已连接 · 倾斜手机让小球滚动";
  }
  clearTimeout(watchdog);
  if (!dragging) {
    const rotation = dial ? 0 : 0.4,
      c = Math.cos(rotation),
      s = Math.sin(rotation);
    steer(
      1000 * (filteredX * c - filteredY * s),
      1000 * (filteredX * s + filteredY * c),
    );
  }
}
function orientation(e) {
  if (!Number.isFinite(e.gamma) || !Number.isFinite(e.beta)) return;
  orientationTime = performance.now();
  reading(...Gravity.orientationVector(e.beta, e.gamma));
}
function motion(e) {
  if (orientationTime >= 0 && performance.now() - orientationTime < 450) return;
  const g = e.accelerationIncludingGravity;
  if (Number.isFinite(g?.x) && Number.isFinite(g?.y))
    reading(-g.x / 9.81, g.y / 9.81);
}
const available = [
  ["deviceorientation", window.DeviceOrientationEvent, orientation],
  ["devicemotion", window.DeviceMotionEvent, motion],
].filter(([, api]) => api);
async function enableSensors(request) {
  if (!window.isSecureContext) {
    tilt.hidden = true;
    hint.textContent = "请通过 HTTPS 打开以使用体感 · 当前可拖动";
    return;
  }
  if (!available.length) {
    tilt.hidden = true;
    hint.textContent = "此浏览器未提供体感 · 拖动改变重力";
    return;
  }
  const grants = await Promise.all(
    available.map(async ([, api]) => {
      if (typeof api.requestPermission !== "function") return true;
      if (!request) return false;
      try {
        return (await api.requestPermission()) === "granted";
      } catch {
        return false;
      }
    }),
  );
  if (!grants.some(Boolean)) {
    tilt.hidden = false;
    tilt.textContent = "启用体感";
    hint.textContent = request
      ? "未获得体感权限 · 可重试或拖动"
      : "点一下启用体感，然后倾斜手机";
    return;
  }
  sensing = true;
  sensorTime = -1;
  available.forEach(([name, , fn], i) => {
    if (grants[i]) window.addEventListener(name, fn, { passive: true });
  });
  if (!sensor) {
    hint.textContent = "轻轻倾斜手机，等待传感器读数";
    tilt.hidden = true;
    clearTimeout(watchdog);
    watchdog = setTimeout(() => {
      if (!sensor) {
        hint.textContent = "尚未收到体感数据 · 可重试或拖动";
        tilt.hidden = false;
        tilt.textContent = "重试体感";
      }
    }, 3500);
  }
}
tilt.onclick = () => enableSensors(true);
if (mobile) {
  tilt.hidden = false;
  enableSensors(false);
}
let last = 0,
  acc = 0;
function frame(now) {
  const dt = Math.min(0.04, (now - last) / 1000 || 0);
  last = now;
  clock += dt;
  if (!reduced && !sensor && !dragging && clock - lastInput > 8) {
    const a =
      -1.95 + 0.95 * Math.sin(clock * 0.48) + 0.8 * Math.sin(clock * 0.29);
    gravity.x = Math.cos(a) * 805;
    gravity.y = Math.sin(a) * 805;
  }
  acc += dt;
  while (acc >= 1 / 120) {
    solve(1 / 120);
    acc -= 1 / 120;
  }
  const ease = 1 - Math.exp(-dt * 3);
  tiltX += (gravity.x / 900 - tiltX) * ease;
  tiltY += (gravity.y / 900 - tiltY) * ease;
  stage.style.transform =
    "translate(-50%,-50%) scale(" +
    viewScale +
    ") perspective(1800px) rotateX(" +
    (reduced ? 0 : tiltY * 2.1) +
    "deg) rotateY(" +
    (reduced ? 0 : tiltX * 3.1) +
    "deg) rotateZ(" +
    (reduced ? 0 : tiltX * 2.3) +
    "deg)";
  draw();
  requestAnimationFrame(frame);
}
mapScreen();
updateView();
setTheme(0);
addEventListener("resize", resize);
requestAnimationFrame(frame);
