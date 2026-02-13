<script>
  import { onMount, onDestroy } from 'svelte';
  import * as d3 from 'd3';

  const WARM_COLORS = ['#D4AF37', '#C9A227', '#E6B800', '#F4E4BC', '#FFE4B5', '#B8860B', '#E8A87C', '#E07B5B', '#D4A574', '#FF8C42'];
  const BINARY_COLORS = ['#8B7355', '#6B5344', '#7D6B5A', '#9B7B5B', '#8B5A2B', '#6B4423', '#7A6B5E'];

  let binaryColumns = [];
  const COOL_COLORS = ['#6B3A3A', '#8B4513', '#A67B5B', '#8B7355', '#C4A574', '#6B5344', '#9B6B5B', '#8B5A2B', '#A0522D', '#BC8F8F'];
  const NODE_COUNT = 160;
  const LINK_COUNT = 420;

  let canvasRef;
  let simulation;
  let nodes = [];
  let links = [];
  let dims = { width: 0, height: 0 };
  let rafId = 0;
  let animationRunning = true;

  function getColorForDistance(distRatio) {
    const colors = distRatio < 0.5 ? WARM_COLORS : COOL_COLORS;
    return colors[Math.floor(Math.random() * colors.length)];
  }

  function initSimulation() {
    dims = { width: window.innerWidth, height: window.innerHeight };
    const centerX = dims.width / 2;
    const centerY = dims.height / 2;
    const maxRadius = Math.min(dims.width, dims.height) * 0.55;

    nodes = [];
    for (let i = 0; i < NODE_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.pow(Math.random(), 0.55) * maxRadius;
      const x = centerX + Math.cos(angle) * r;
      const y = centerY + Math.sin(angle) * r;
      const distRatio = r / maxRadius;
      const radius = 3.5 + (1 - distRatio) * 2.5;
      nodes.push({ id: i, x, y, radius, color: getColorForDistance(distRatio), distRatio });
    }

    const linkSet = new Set();
    links = [];
    for (let i = 0; i < LINK_COUNT; i++) {
      let source = Math.floor(Math.random() * NODE_COUNT);
      let target = Math.floor(Math.random() * NODE_COUNT);
      if (source !== target) {
        const key = [Math.min(source, target), Math.max(source, target)].join('-');
        if (!linkSet.has(key)) {
          linkSet.add(key);
          const avgDist = (nodes[source].distRatio + nodes[target].distRatio) / 2;
          links.push({ source: nodes[source], target: nodes[target], color: getColorForDistance(avgDist), avgDist });
        }
      }
    }

    simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(70))
      .force('charge', d3.forceManyBody().strength(-50))
      .force('center', d3.forceCenter(centerX, centerY).strength(0.2))
      .force('collision', d3.forceCollide().radius(d => d.radius + 3))
      .force('x', d3.forceX(centerX).strength(0.06))
      .force('y', d3.forceY(centerY).strength(0.06))
      .alpha(0.5)
      .alphaDecay(0)
      .alphaMin(0.1);  // Keep simulation active - never fully settle
  }

  function draw(ctx) {
    if (!ctx || !canvasRef) return;
    const { width, height } = dims;
    ctx.clearRect(0, 0, width, height);

    // Links (only between nodes)
    ctx.lineWidth = 0.8;
    for (const l of links) {
      ctx.strokeStyle = l.color;
      ctx.globalAlpha = 0.15 + 0.12 * (1 - l.avgDist);
      ctx.beginPath();
      ctx.moveTo(l.source.x, l.source.y);
      ctx.lineTo(l.target.x, l.target.y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Nodes with glow (simplified: radial gradient)
    for (const n of nodes) {
      const radius = n.radius;
      const glow = radius * 3;
      const gradient = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, glow);
      gradient.addColorStop(0, n.color);
      gradient.addColorStop(0.3, n.color + '80');
      gradient.addColorStop(1, n.color + '00');
      ctx.fillStyle = gradient;
      ctx.globalAlpha = 0.5 + 0.25 * (1 - n.distRatio);
      ctx.beginPath();
      ctx.arc(n.x, n.y, glow, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = n.color;
      ctx.globalAlpha = 0.7 + 0.2 * (1 - n.distRatio);
      ctx.beginPath();
      ctx.arc(n.x, n.y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  function loop() {
    if (!animationRunning || !canvasRef) return;
    draw(canvasRef.getContext('2d'));
    rafId = requestAnimationFrame(loop);
  }

  onMount(() => {
    initSimulation();
    binaryColumns = Array.from({ length: 35 }, (_, c) => ({
      leftPct: 35 > 1 ? (c / 34) * 94 + 3 : 50,
      delay: -(12 + c * 0.8 + Math.random() * 10),
      chars: Array.from({ length: 80 }, () => ({
        char: Math.random() > 0.5 ? '1' : '0',
        color: BINARY_COLORS[Math.floor(Math.random() * BINARY_COLORS.length)],
        opacity: 0.18 + Math.random() * 0.2
      }))
    }));
    if (canvasRef) {
      canvasRef.width = dims.width;
      canvasRef.height = dims.height;
      simulation.on('tick', () => {});
      loop();
    }
    // Periodic nudge every 2s to keep network moving continuously
    const nudgeInterval = setInterval(() => {
      if (simulation) simulation.alpha(0.15).restart();
    }, 2000);
    const resize = () => {
      dims = { width: window.innerWidth, height: window.innerHeight };
      if (canvasRef) {
        canvasRef.width = dims.width;
        canvasRef.height = dims.height;
      }
      const cx = dims.width / 2;
      const cy = dims.height / 2;
      simulation?.force('center', d3.forceCenter(cx, cy).strength(0.15))
        .force('x', d3.forceX(cx).strength(0.04))
        .force('y', d3.forceY(cy).strength(0.04))
        .alpha(0.3).restart();
    };
    window.addEventListener('resize', resize);
    return () => {
      clearInterval(nudgeInterval);
      window.removeEventListener('resize', resize);
    };
  });

  onDestroy(() => {
    animationRunning = false;
    cancelAnimationFrame(rafId);
    simulation?.stop();
  });
</script>

<div class="network-bg" aria-hidden="true">
  <div class="binary-cascade">
    {#each binaryColumns as col}
      <div class="binary-column" style="left: calc({col.leftPct}% - 0.5ch); animation-delay: {col.delay}s">
        {#each col.chars as { char, color, opacity }}
          <span class="binary-char" style="color: {color}; opacity: {opacity}">{char}</span>
        {/each}
      </div>
    {/each}
  </div>
  <canvas id="network-canvas" bind:this={canvasRef}></canvas>
</div>

<style>
  .network-bg {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
    background: #f5f0e8;
  }
  canvas {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }
  .binary-cascade {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 0;
    font-family: "Red Hat Mono", monospace;
    font-size: 1.9rem;
    line-height: 1.5;
    mask-image: linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 60%, transparent 100%);
    -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 60%, transparent 100%);
    overflow: visible;
  }
  .binary-column {
    position: absolute;
    top: 0;
    display: flex;
    flex-direction: column;
    flex-wrap: nowrap;
    align-items: center;
    animation: binaryCascade 30s linear infinite;
  }
  .binary-char {
    display: block;
    width: 1ch;
    text-align: center;
    line-height: 1.6;
  }
  @keyframes binaryCascade {
    0% { transform: translateY(-100%); }
    100% { transform: translateY(100vh); }
  }
</style>
