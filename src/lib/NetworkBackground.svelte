<script>
  import { onMount, onDestroy } from 'svelte';
  import * as THREE from 'three';

  // --- Palette (neutral, matching NailEngineer: warm cream + muted taupe/greige) ---
  const NODE_HEXES = [0x9b9088, 0xb3a99e, 0x847a71, 0xa89d92, 0x6f665f];
  const HUB_HEX = 0xcdc2b4;     // idle hub tone (light greige)
  const PULSE_HEX = 0xb5946a;   // warm caramel — firing hubs + data pulses
  const LINE_HEX = 0x8c827a;    // soft greige connections
  const FOG_HEX = 0xf1e9dc;     // mid-cream: distant elements dissolve into the page

  // --- Network grid (in 3D world space) ---
  const COLS = 44;
  const ROWS = 26;
  const PLANE_W = 48;
  const NEAR_Z = 10;
  const FAR_Z = -36;
  const WAVE_AMP = 1.7;

  let reduceMotion = false;

  let containerRef;
  let renderer, scene, camera;
  let regGeom, hubGeom, lineGeom, pulseGeom;
  let regPos, hubPos, hubCol, linePos, pulsePos, pulseScale;

  let nodeData = [];   // { x, z, y, hub, fireP, colBase }
  let regList = [];    // indices into nodeData (non-hub)
  let hubList = [];
  let edges = [];      // { a, b }
  let pulses = [];     // { a, b, off, speed, dir }

  let rafId = 0;
  let running = true;
  let startTime = 0;

  const hubBaseLin = new THREE.Color(HUB_HEX).convertSRGBToLinear();
  const pulseLin = new THREE.Color(PULSE_HEX).convertSRGBToLinear();

  function idx(gx, gz) { return gz * COLS + gx; }

  // Soft round sprite (white RGB + radial-gradient alpha); tinted per-vertex.
  function makeDot() {
    const s = 64;
    const c = document.createElement('canvas');
    c.width = c.height = s;
    const g = c.getContext('2d');
    const grd = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    grd.addColorStop(0, 'rgba(255,255,255,1)');
    grd.addColorStop(0.35, 'rgba(255,255,255,0.85)');
    grd.addColorStop(0.7, 'rgba(255,255,255,0.22)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, s, s);
    const tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
  }

  // Animated wave surface — the whole network breathes on this.
  function waveY(x, z, t) {
    return WAVE_AMP * (
      Math.sin(x * 0.35 + t * 0.9) * 0.5 +
      Math.sin(z * 0.30 - t * 0.7) * 0.6 +
      Math.sin((x + z) * 0.20 + t * 0.5) * 0.5 +
      Math.sin(x * 0.15 - z * 0.25 + t * 1.1) * 0.3
    );
  }

  function buildNetwork() {
    nodeData = [];
    for (let gz = 0; gz < ROWS; gz++) {
      for (let gx = 0; gx < COLS; gx++) {
        const u = gx / (COLS - 1);
        const v = gz / (ROWS - 1);
        // Jitter off the grid so it reads as a network, not a lattice.
        const jx = (Math.random() - 0.5) * (PLANE_W / COLS) * 0.85;
        const jz = (Math.random() - 0.5) * (Math.abs(NEAR_Z - FAR_Z) / ROWS) * 0.85;
        const x = (u - 0.5) * PLANE_W + jx;
        const z = NEAR_Z + (FAR_Z - NEAR_Z) * v + jz;
        const hub = Math.random() < 0.12;
        const colBase = hub
          ? hubBaseLin.clone()
          : new THREE.Color(NODE_HEXES[Math.floor(Math.random() * NODE_HEXES.length)]).convertSRGBToLinear();
        nodeData.push({ x, z, y: 0, hub, fireP: Math.random() * Math.PI * 2, colBase });
      }
    }

    regList = [];
    hubList = [];
    nodeData.forEach((n, i) => (n.hub ? hubList : regList).push(i));

    // Connect by nearest-neighbour proximity, hubs get extra links, some dropped.
    edges = [];
    const seen = new Set();
    const N = nodeData.length;
    const add = (i, j) => {
      if (i === j) return;
      const key = i < j ? i * N + j : j * N + i;
      if (seen.has(key)) return;
      seen.add(key);
      edges.push({ a: i, b: j });
    };
    for (let gz = 0; gz < ROWS; gz++) {
      for (let gx = 0; gx < COLS; gx++) {
        const i = idx(gx, gz);
        const p = nodeData[i];
        const cands = [];
        for (let dz = -2; dz <= 2; dz++) {
          for (let dx = -2; dx <= 2; dx++) {
            if (dx === 0 && dz === 0) continue;
            const ngx = gx + dx, ngz = gz + dz;
            if (ngx < 0 || ngx >= COLS || ngz < 0 || ngz >= ROWS) continue;
            const q = nodeData[idx(ngx, ngz)];
            const d = (q.x - p.x) * (q.x - p.x) + (q.z - p.z) * (q.z - p.z);
            cands.push({ j: idx(ngx, ngz), d });
          }
        }
        cands.sort((a, b) => a.d - b.d);
        const k = 2 + (p.hub ? 3 : 0) + (Math.random() < 0.5 ? 1 : 0);
        for (let n = 0; n < k && n < cands.length; n++) {
          if (Math.random() < 0.85) add(i, cands[n].j);
        }
      }
    }

    // Data pulses on a random subset of edges.
    pulses = [];
    const shuffled = edges.slice();
    for (let i = shuffled.length - 1; i > 0; i--) {
      const r = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[r]] = [shuffled[r], shuffled[i]];
    }
    const pulseCount = Math.min(200, Math.floor(edges.length * 0.13));
    for (let i = 0; i < pulseCount; i++) {
      const e = shuffled[i];
      pulses.push({ a: e.a, b: e.b, off: Math.random(), speed: 0.12 + Math.random() * 0.28, dir: Math.random() < 0.5 ? 1 : -1 });
    }
  }

  function buildScene() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(FOG_HEX, 16, 56);

    camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 120);
    camera.position.set(0, 7, 17);
    camera.lookAt(0, 0, -8);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h);
    renderer.setClearAlpha(0); // let the cream CSS backdrop show through
    containerRef.appendChild(renderer.domElement);

    const dot = makeDot();

    // --- Connection lines ---
    linePos = new Float32Array(edges.length * 6);
    lineGeom = new THREE.BufferGeometry();
    lineGeom.setAttribute('position', new THREE.BufferAttribute(linePos, 3));
    const lineMat = new THREE.LineBasicMaterial({ color: LINE_HEX, transparent: true, opacity: 0.4, fog: true });
    scene.add(new THREE.LineSegments(lineGeom, lineMat));

    // --- Regular nodes ---
    regPos = new Float32Array(regList.length * 3);
    const regCol = new Float32Array(regList.length * 3);
    for (let k = 0; k < regList.length; k++) {
      const n = nodeData[regList[k]];
      regPos[k * 3] = n.x; regPos[k * 3 + 2] = n.z;
      regCol[k * 3] = n.colBase.r; regCol[k * 3 + 1] = n.colBase.g; regCol[k * 3 + 2] = n.colBase.b;
    }
    regGeom = new THREE.BufferGeometry();
    regGeom.setAttribute('position', new THREE.BufferAttribute(regPos, 3));
    regGeom.setAttribute('color', new THREE.BufferAttribute(regCol, 3));
    const regMat = new THREE.PointsMaterial({ map: dot, size: 0.55, vertexColors: true, transparent: true, sizeAttenuation: true, depthWrite: false, fog: true });
    scene.add(new THREE.Points(regGeom, regMat));

    // --- Hub nodes (bigger; recoloured toward caramel when firing) ---
    hubPos = new Float32Array(hubList.length * 3);
    hubCol = new Float32Array(hubList.length * 3);
    for (let k = 0; k < hubList.length; k++) {
      const n = nodeData[hubList[k]];
      hubPos[k * 3] = n.x; hubPos[k * 3 + 2] = n.z;
      hubCol[k * 3] = n.colBase.r; hubCol[k * 3 + 1] = n.colBase.g; hubCol[k * 3 + 2] = n.colBase.b;
    }
    hubGeom = new THREE.BufferGeometry();
    hubGeom.setAttribute('position', new THREE.BufferAttribute(hubPos, 3));
    hubGeom.setAttribute('color', new THREE.BufferAttribute(hubCol, 3));
    const hubMat = new THREE.PointsMaterial({ map: dot, size: 1.15, vertexColors: true, transparent: true, sizeAttenuation: true, depthWrite: false, fog: true });
    scene.add(new THREE.Points(hubGeom, hubMat));

    // --- Data pulses (custom shader: per-point size + alpha fade, additive glint) ---
    pulsePos = new Float32Array(pulses.length * 3);
    pulseScale = new Float32Array(pulses.length);
    const pulseCol = new Float32Array(pulses.length * 3);
    for (let k = 0; k < pulses.length; k++) {
      pulseCol[k * 3] = pulseLin.r; pulseCol[k * 3 + 1] = pulseLin.g; pulseCol[k * 3 + 2] = pulseLin.b;
    }
    pulseGeom = new THREE.BufferGeometry();
    pulseGeom.setAttribute('position', new THREE.BufferAttribute(pulsePos, 3));
    pulseGeom.setAttribute('color', new THREE.BufferAttribute(pulseCol, 3));
    pulseGeom.setAttribute('aScale', new THREE.BufferAttribute(pulseScale, 1));
    const pulseMat = new THREE.ShaderMaterial({
      uniforms: { uMap: { value: dot }, uSize: { value: 34.0 }, uPix: { value: dpr } },
      vertexShader: `
        attribute vec3 color;
        attribute float aScale;
        varying vec3 vColor;
        varying float vScale;
        uniform float uSize;
        uniform float uPix;
        void main() {
          vColor = color;
          vScale = aScale;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = uSize * uPix * aScale * (10.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        uniform sampler2D uMap;
        varying vec3 vColor;
        varying float vScale;
        void main() {
          float a = texture2D(uMap, gl_PointCoord).a;
          gl_FragColor = vec4(vColor, a * vScale);
        }`,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    });
    scene.add(new THREE.Points(pulseGeom, pulseMat));
  }

  function update(t) {
    // Subtle camera drift → parallax depth.
    camera.position.x = Math.sin(t * 0.08) * 1.6;
    camera.position.y = 7 + Math.sin(t * 0.11) * 0.5;
    camera.lookAt(0, 0, -8);

    for (const n of nodeData) n.y = waveY(n.x, n.z, t);

    for (let k = 0; k < regList.length; k++) regPos[k * 3 + 1] = nodeData[regList[k]].y;
    regGeom.attributes.position.needsUpdate = true;

    for (let k = 0; k < hubList.length; k++) {
      const n = nodeData[hubList[k]];
      hubPos[k * 3 + 1] = n.y;
      const fire = Math.max(0, Math.sin(t * 2.2 + n.fireP)) * 0.9;
      hubCol[k * 3] = n.colBase.r + (pulseLin.r - n.colBase.r) * fire;
      hubCol[k * 3 + 1] = n.colBase.g + (pulseLin.g - n.colBase.g) * fire;
      hubCol[k * 3 + 2] = n.colBase.b + (pulseLin.b - n.colBase.b) * fire;
    }
    hubGeom.attributes.position.needsUpdate = true;
    hubGeom.attributes.color.needsUpdate = true;

    for (let e = 0; e < edges.length; e++) {
      const a = nodeData[edges[e].a];
      const b = nodeData[edges[e].b];
      const o = e * 6;
      linePos[o] = a.x; linePos[o + 1] = a.y; linePos[o + 2] = a.z;
      linePos[o + 3] = b.x; linePos[o + 4] = b.y; linePos[o + 5] = b.z;
    }
    lineGeom.attributes.position.needsUpdate = true;

    for (let k = 0; k < pulses.length; k++) {
      const pl = pulses[k];
      let u = (pl.off + t * pl.speed) % 1;
      if (pl.dir < 0) u = 1 - u;
      const a = nodeData[pl.a];
      const b = nodeData[pl.b];
      pulsePos[k * 3] = a.x + (b.x - a.x) * u;
      pulsePos[k * 3 + 1] = a.y + (b.y - a.y) * u;
      pulsePos[k * 3 + 2] = a.z + (b.z - a.z) * u;
      pulseScale[k] = Math.sin(u * Math.PI); // fade in/out along the edge
    }
    pulseGeom.attributes.position.needsUpdate = true;
    pulseGeom.attributes.aScale.needsUpdate = true;
  }

  function loop(now) {
    if (!running) return;
    update((now - startTime) / 1000);
    renderer.render(scene, camera);
    rafId = requestAnimationFrame(loop);
  }

  let resizeTimer = 0;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (!renderer || !camera) return;
      const w = window.innerWidth, h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }, 150);
  }

  onMount(() => {
    reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    buildNetwork();
    buildScene();

    startTime = performance.now();
    if (reduceMotion) {
      update(0);
      renderer.render(scene, camera);
    } else {
      rafId = requestAnimationFrame(loop);
    }

    window.addEventListener('resize', onResize);
    return () => {
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', onResize);
    };
  });

  onDestroy(() => {
    running = false;
    cancelAnimationFrame(rafId);
    scene?.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (obj.material.map) obj.material.map.dispose();
        obj.material.dispose();
      }
    });
    renderer?.dispose();
    if (containerRef && renderer?.domElement && containerRef.contains(renderer.domElement)) {
      containerRef.removeChild(renderer.domElement);
    }
  });
</script>

<div class="network-bg" aria-hidden="true">
  <div class="light-source"></div>
  <div class="webgl" bind:this={containerRef}></div>
</div>

<style>
  .network-bg {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
    overflow: hidden;
    background:
      radial-gradient(120% 80% at 50% 6%, rgba(255, 251, 244, 0.9) 0%, rgba(250, 247, 242, 0) 55%),
      linear-gradient(180deg, #faf7f2 0%, #f5efe6 50%, #efe7da 100%);
  }
  .webgl {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }
  .webgl :global(canvas) {
    display: block;
    width: 100% !important;
    height: 100% !important;
  }
  .light-source {
    position: absolute;
    top: -12%;
    left: 50%;
    width: 55vw;
    height: 55vh;
    transform: translateX(-50%);
    background: radial-gradient(closest-side, rgba(255, 252, 246, 0.75) 0%, rgba(230, 220, 205, 0.18) 35%, transparent 70%);
    filter: blur(8px);
    pointer-events: none;
  }
</style>
