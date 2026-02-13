/**
 * Clean network visualization - single centralized cluster,
 * fine delicate lines, dense center fading gracefully toward edges
 */
(function() {
  // Center: gold, amber, warm cream, soft orange
  const WARM_COLORS = ['#D4AF37', '#C9A227', '#E6B800', '#F4E4BC', '#FFE4B5', '#B8860B', '#E8A87C', '#E07B5B', '#D4A574', '#FF8C42'];
  // Edges: burgundy, copper, terracotta, brown, rust (autumnal)
  const COOL_COLORS = ['#6B3A3A', '#8B4513', '#A67B5B', '#8B7355', '#C4A574', '#6B5344', '#9B6B5B', '#8B5A2B', '#A0522D', '#BC8F8F'];

  const NODE_COUNT = 160;
  const LINK_COUNT = 420;
  const STREAKS_PER_NODE = 9;
  const STREAK_MAX_LENGTH = 140;  // Lines fade out, don't extend to edges

  function getColorForDistance(distRatio) {
    const colors = distRatio < 0.5 ? WARM_COLORS : COOL_COLORS;
    return colors[Math.floor(Math.random() * colors.length)];
  }

  function getStreakLength(x, y, angle, w, h) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    let t = Infinity;
    if (cos > 0.001) t = Math.min(t, (w - x) / cos);
    else if (cos < -0.001) t = Math.min(t, -x / cos);
    if (sin > 0.001) t = Math.min(t, (h - y) / sin);
    else if (sin < -0.001) t = Math.min(t, -y / sin);
    const toEdge = Math.max(0, isFinite(t) ? t : 0);
    return Math.min(toEdge, STREAK_MAX_LENGTH);
  }

  const BINARY_COLORS = ['#8B7355', '#6B5344', '#7D6B5A', '#9B7B5B', '#8B5A2B', '#6B4423', '#7A6B5E'];
  const BINARY_COLUMNS = 35;
  const BINARY_CHARS_PER_COL = 80;

  function initNetwork() {
    const container = document.getElementById('network-bg');
    if (!container) return;

    const dims = { width: window.innerWidth, height: window.innerHeight };
    const centerX = dims.width / 2;
    const centerY = dims.height / 2;
    const maxRadius = Math.min(dims.width, dims.height) * 0.55;

    // Cascading binary code - dense at top, fades toward bottom
    const binaryDiv = d3.select('#network-bg')
      .insert('div', ':first-child')
      .attr('class', 'binary-cascade')
      .style('position', 'absolute')
      .style('top', 0).style('left', 0).style('right', 0).style('bottom', 0)
      .style('pointer-events', 'none')
      .style('overflow', 'visible');

    for (let c = 0; c < BINARY_COLUMNS; c++) {
      const leftPct = BINARY_COLUMNS > 1 ? (c / (BINARY_COLUMNS - 1)) * 94 + 3 : 50;
      const col = binaryDiv.append('div')
        .attr('class', 'binary-column')
        .style('left', `calc(${leftPct}% - 0.5ch)`)
        .style('--col-delay', (-(12 + c * 0.8 + Math.random() * 10)) + 's');  // Start well into cycle so visible immediately
      for (let i = 0; i < BINARY_CHARS_PER_COL; i++) {
        const char = Math.random() > 0.5 ? '1' : '0';
        const color = BINARY_COLORS[Math.floor(Math.random() * BINARY_COLORS.length)];
        const opacity = 0.18 + Math.random() * 0.2;
        col.append('span')
          .attr('class', 'binary-char')
          .style('color', color)
          .style('opacity', opacity)
          .text(char);
      }
    }

    const svg = d3.select('#network-bg')
      .append('svg')
      .attr('width', dims.width)
      .attr('height', dims.height);

    const defs = svg.append('defs');
    const nodeFilter = defs.append('filter')
      .attr('id', 'node-glow')
      .attr('x', '-50%').attr('y', '-50%')
      .attr('width', '200%').attr('height', '200%');
    nodeFilter.append('feGaussianBlur').attr('stdDeviation', 3).attr('result', 'blur');
    nodeFilter.append('feMerge')
      .selectAll('feMergeNode')
      .data(['blur', 'SourceGraphic'])
      .join('feMergeNode')
      .attr('in', d => d);

    const linkFilter = defs.append('filter')
      .attr('id', 'link-glow')
      .attr('x', '-30%').attr('y', '-30%')
      .attr('width', '160%').attr('height', '160%');
    linkFilter.append('feGaussianBlur').attr('stdDeviation', 1).attr('result', 'blur');
    linkFilter.append('feMerge')
      .selectAll('feMergeNode')
      .data(['blur', 'SourceGraphic'])
      .join('feMergeNode')
      .attr('in', d => d);

    const nodes = [];
    for (let i = 0; i < NODE_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.pow(Math.random(), 0.55) * maxRadius;
      const x = centerX + Math.cos(angle) * r;
      const y = centerY + Math.sin(angle) * r;
      const distRatio = r / maxRadius;
      const radius = 3.5 + (1 - distRatio) * 2.5;  // Center nodes bigger, edge nodes smaller
      nodes.push({
        id: i,
        x, y,
        radius,
        color: getColorForDistance(distRatio),
        distRatio
      });
    }

    const links = [];
    const linkSet = new Set();
    for (let i = 0; i < LINK_COUNT; i++) {
      let source = Math.floor(Math.random() * NODE_COUNT);
      let target = Math.floor(Math.random() * NODE_COUNT);
      if (source !== target) {
        const key = [Math.min(source, target), Math.max(source, target)].join('-');
        if (!linkSet.has(key)) {
          linkSet.add(key);
          const avgDist = (nodes[source].distRatio + nodes[target].distRatio) / 2;
          links.push({ source, target, color: getColorForDistance(avgDist), avgDist });
        }
      }
    }

    // Fewer streaks, only from center - fade gracefully
    const streaks = [];
    for (let i = 0; i < NODE_COUNT; i++) {
      if (nodes[i].distRatio > 0.7) continue;  // No streaks from outer nodes
      for (let s = 0; s < STREAKS_PER_NODE; s++) {
        const angle = Math.random() * Math.PI * 2;
        streaks.push({
          nodeIdx: i,
          angle,
          color: nodes[i].color,
          opacity: 0.06 + Math.random() * 0.1,
          distRatio: nodes[i].distRatio
        });
      }
    }

    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(70))
      .force('charge', d3.forceManyBody().strength(-50))
      .force('center', d3.forceCenter(centerX, centerY).strength(0.2))
      .force('collision', d3.forceCollide().radius(d => d.radius + 3))
      .force('x', d3.forceX(centerX).strength(0.06))
      .force('y', d3.forceY(centerY).strength(0.06))
      .alpha(0.5)
      .alphaDecay(0);  // Nodes animate continuously


    const streak = svg.append('g')
      .attr('filter', 'url(#link-glow)')
      .selectAll('line')
      .data(streaks)
      .join('line')
      .attr('stroke', d => d.color)
      .attr('stroke-opacity', d => d.opacity * (1 - d.distRatio * 0.5))
      .attr('stroke-width', 0.2);

    const link = svg.append('g')
      .attr('filter', 'url(#link-glow)')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', d => d.color)
      .attr('stroke-opacity', d => 0.15 + 0.12 * (1 - d.avgDist))
      .attr('stroke-width', 0.35);

    const node = svg.append('g')
      .attr('filter', 'url(#node-glow)')
      .selectAll('circle')
      .data(nodes)
      .join('circle')
      .attr('r', d => d.radius)
      .attr('fill', d => d.color)
      .attr('fill-opacity', d => 0.5 + 0.25 * (1 - d.distRatio))
      .call(drag(simulation));

    simulation.on('tick', () => {
      streak
        .attr('x1', d => nodes[d.nodeIdx].x)
        .attr('y1', d => nodes[d.nodeIdx].y)
        .attr('x2', d => {
          const n = nodes[d.nodeIdx];
          const len = getStreakLength(n.x, n.y, d.angle, dims.width, dims.height);
          return n.x + Math.cos(d.angle) * len;
        })
        .attr('y2', d => {
          const n = nodes[d.nodeIdx];
          const len = getStreakLength(n.x, n.y, d.angle, dims.width, dims.height);
          return n.y + Math.sin(d.angle) * len;
        });

      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node
        .attr('cx', d => d.x)
        .attr('cy', d => d.y);
    });

    function drag(simulation) {
      function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }
      function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }
      function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }
      return d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended);
    }

    function resize() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      dims.width = w;
      dims.height = h;
      svg.attr('width', w).attr('height', h);
      const cx = w / 2;
      const cy = h / 2;
      simulation
        .force('center', d3.forceCenter(cx, cy).strength(0.15))
        .force('x', d3.forceX(cx).strength(0.04))
        .force('y', d3.forceY(cy).strength(0.04))
        .alpha(0.3).restart();
    }
    window.addEventListener('resize', resize);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNetwork);
  } else {
    initNetwork();
  }
})();
