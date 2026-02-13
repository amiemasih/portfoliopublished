<script>
  import { onMount, onDestroy } from 'svelte';
  import * as THREE from 'three';

  let containerRef;
  let scene, camera, renderer, particles, particleSystem;
  let rafId = 0;
  const PARTICLE_COUNT = 12000;
  const TORUS_RADIUS = 1.2;
  const TUBE_RADIUS = 0.35;

  function lerpColor(c1, c2, t) {
    const r = c1.r + (c2.r - c1.r) * t;
    const g = c1.g + (c2.g - c1.g) * t;
    const b = c1.b + (c2.b - c1.b) * t;
    return new THREE.Color(r, g, b);
  }

  function init() {
    const width = containerRef.clientWidth;
    const height = containerRef.clientHeight;

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.z = 2.8;

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x0a0a0f, 1);
    containerRef.appendChild(renderer.domElement);

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);

    const teal = new THREE.Color(0x00d4aa);
    const cyan = new THREE.Color(0x00bfff);
    const purple = new THREE.Color(0x9d7bff);
    const lavender = new THREE.Color(0xbf9fff);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const u = Math.random() * Math.PI * 2;
      const v = Math.random() * Math.PI * 2;
      const spread = 0.3 + Math.random() * 0.7;
      const x = (TORUS_RADIUS + TUBE_RADIUS * Math.cos(v)) * Math.cos(u) * spread;
      const y = (TORUS_RADIUS + TUBE_RADIUS * Math.cos(v)) * Math.sin(u) * spread;
      const z = TUBE_RADIUS * Math.sin(v) * spread;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      const t = Math.random();
      const color = t < 0.5 ? lerpColor(teal, cyan, t * 2) : lerpColor(purple, lavender, (t - 0.5) * 2);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.025,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    particleSystem = new THREE.Points(geometry, material);
    particles = particleSystem;
    scene.add(particleSystem);
  }

  function animate() {
    rafId = requestAnimationFrame(animate);
    if (particleSystem) {
      particleSystem.rotation.x += 0.002;
      particleSystem.rotation.y += 0.003;
    }
    renderer.render(scene, camera);
  }

  function resize() {
    if (!containerRef || !camera || !renderer) return;
    const width = containerRef.clientWidth;
    const height = containerRef.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  onMount(() => {
    init();
    animate();
    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(rafId);
      renderer?.dispose();
      if (containerRef && renderer?.domElement) {
        containerRef.removeChild(renderer.domElement);
      }
    };
  });

  onDestroy(() => {
    cancelAnimationFrame(rafId);
  });
</script>

<div class="particle-bg" bind:this={containerRef} aria-hidden="true"></div>

<style>
  .particle-bg {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
    background: #0a0a0f;
  }
  .particle-bg canvas {
    display: block;
    width: 100%;
    height: 100%;
  }
</style>
