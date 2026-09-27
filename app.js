/* Kunsh Agrawal portfolio: the "network of work", project detail dialogs, counters and reveals. No libraries. */
(function () {
  'use strict';

  document.documentElement.classList.add('js');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const narrow = window.matchMedia('(max-width: 699px)');

  /* ---------- Top bar background once the page scrolls ---------- */
  const topbar = document.querySelector('.topbar');
  const onScroll = () => topbar.classList.toggle('scrolled', window.scrollY > 24);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Colour helpers (inferno colormap) ---------- */
  const INFERNO = [[155, 63, 209], [210, 65, 122], [242, 102, 58], [252, 165, 10], [252, 227, 138]];
  const colorAt = (t) => {
    const x = Math.min(Math.max(t, 0), 1) * (INFERNO.length - 1);
    const i = Math.min(Math.floor(x), INFERNO.length - 2);
    const f = x - i, a = INFERNO[i], b = INFERNO[i + 1];
    return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
  };
  const rgba = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;

  /* ---------- The network of work ---------- */
  function startNetwork(net) {
    const canvas = net.querySelector('#wires');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const skills = [...net.querySelectorAll('.skill')];
    const h1 = [...net.querySelectorAll('.hidden-layer.one .hn')];
    const h2 = [...net.querySelectorAll('.hidden-layer.two .hn')];
    const projects = [...net.querySelectorAll('.pnode')];

    // Every real skill -> project link becomes a path through one node in each hidden layer.
    const paths = [];
    projects.forEach((p, j) => {
      (p.dataset.skills || '').split(' ').filter(Boolean).forEach((key) => {
        const i = skills.findIndex((s) => s.dataset.skill === key);
        if (i < 0) return;
        paths.push({ s: skills[i], a: h1[(i * 3 + j) % h1.length], b: h2[(i + j * 2) % h2.length], p });
      });
    });
    // Unique edges between layers, for drawing.
    const edgeMap = new Map();
    const edgeKey = (x, y) => `${x.dataset.id}>${y.dataset.id}`;
    [...skills, ...h1, ...h2, ...projects].forEach((el, k) => { el.dataset.id = String(k); });
    for (const path of paths) {
      path.segs = [[path.s, path.a], [path.a, path.b], [path.b, path.p]].map(([x, y]) => {
        const key = edgeKey(x, y);
        if (!edgeMap.has(key)) edgeMap.set(key, { x, y, level: 0, heat: 0 });
        return edgeMap.get(key);
      });
    }
    const edges = [...edgeMap.values()];
    edges.forEach((e) => { e.level = skills.includes(e.x) ? 0 : h1.includes(e.x) ? 1 : 2; });

    let w = 0, h = 0, vertical = false;
    const pos = new Map();

    function anchor(el) {
      const target = el.querySelector('.dot, .orb') || el;
      const r = target.getBoundingClientRect(), n = net.getBoundingClientRect();
      return { x: r.left - n.left + r.width / 2, y: r.top - n.top + r.height / 2 };
    }
    function measure() {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = net.clientWidth; h = net.clientHeight;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      vertical = narrow.matches;
      [...skills, ...h1, ...h2, ...projects].forEach((el) => pos.set(el, anchor(el)));
    }

    // Cubic curve between two anchors, bending along the direction of flow.
    function curve(e) {
      const a = pos.get(e.x), b = pos.get(e.y);
      if (vertical) {
        const d = (b.y - a.y) * 0.5;
        return [a, { x: a.x, y: a.y + d }, { x: b.x, y: b.y - d }, b];
      }
      const d = (b.x - a.x) * 0.5;
      return [a, { x: a.x + d, y: a.y }, { x: b.x - d, y: b.y }, b];
    }
    function pointOn(c, t) {
      const u = 1 - t;
      return {
        x: u * u * u * c[0].x + 3 * u * u * t * c[1].x + 3 * u * t * t * c[2].x + t * t * t * c[3].x,
        y: u * u * u * c[0].y + 3 * u * u * t * c[1].y + 3 * u * t * t * c[2].y + t * t * t * c[3].y,
      };
    }

    // Highlighting: a skill or a project, and every path that touches it.
    let focus = null;
    const litEdges = new Set();
    function setFocus(el) {
      focus = el;
      litEdges.clear();
      skills.concat(projects).forEach((n) => n.classList.remove('on'));
      net.classList.toggle('focusing', !!el);
      if (el) {
        el.classList.add('on');
        for (const path of paths) {
          if (path.s === el || path.p === el) {
            path.segs.forEach((s) => litEdges.add(s));
            path.s.classList.add('on');
            path.p.classList.add('on');
          }
        }
      }
      if (reduceMotion) draw(0);
    }
    skills.forEach((s) => {
      s.addEventListener('mouseenter', () => setFocus(s));
      s.addEventListener('focus', () => setFocus(s));
      s.addEventListener('click', () => setFocus(focus === s ? null : s));
    });
    projects.forEach((p) => {
      p.addEventListener('mouseenter', () => setFocus(p));
      p.addEventListener('focus', () => setFocus(p));
    });
    net.addEventListener('mouseleave', () => setFocus(null));
    net.addEventListener('focusout', (e) => { if (!net.contains(e.relatedTarget)) setFocus(null); });

    // Pulses run a whole path: skill -> hidden -> hidden -> project.
    const pulses = [];
    let lastSpawn = 0, reveal = reduceMotion ? 1 : 0, startTime = 0;
    function spawn() {
      const pool = focus ? paths.filter((p) => p.s === focus || p.p === focus) : paths;
      if (!pool.length) return;
      pulses.push({ path: pool[(Math.random() * pool.length) | 0], t: 0, speed: 0.011 + Math.random() * 0.006 });
    }
    function fire(el) {
      el.classList.remove('fire', 'ping');
      void el.offsetWidth; // restart the CSS animation
      el.classList.add(el.classList.contains('pnode') ? 'ping' : 'fire');
      clearTimeout(el._t);
      el._t = setTimeout(() => el.classList.remove('fire', 'ping'), 700);
    }

    function draw(now) {
      ctx.clearRect(0, 0, w, h);
      if (!startTime) startTime = now;
      if (!reduceMotion) reveal = Math.min(1, Math.max(0, (now - startTime - 700) / 1100));

      ctx.lineWidth = 1.2;
      for (const e of edges) {
        const lit = litEdges.has(e);
        const c = curve(e);
        const col = colorAt((e.level + 0.5) / 3);
        const base = focus ? (lit ? 0.75 : 0.05) : 0.16 + e.heat * 0.5;
        ctx.strokeStyle = rgba(col, base * reveal);
        ctx.lineWidth = lit ? 2 : 1.2;
        ctx.beginPath(); ctx.moveTo(c[0].x, c[0].y);
        ctx.bezierCurveTo(c[1].x, c[1].y, c[2].x, c[2].y, c[3].x, c[3].y);
        ctx.stroke();
        e.heat *= 0.94;
      }

      for (let i = pulses.length - 1; i >= 0; i--) {
        const p = pulses[i];
        p.t += p.speed;
        const seg = Math.min(2, Math.floor(p.t));
        const local = p.t - seg;
        const edge = p.path.segs[seg];
        edge.heat = Math.min(1, edge.heat + 0.06);
        const pt = pointOn(curve(edge), Math.min(local, 1));
        const col = colorAt(p.t / 3);
        const g = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, 11);
        g.addColorStop(0, rgba(col, 1)); g.addColorStop(1, rgba(col, 0));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(pt.x, pt.y, 11, 0, Math.PI * 2); ctx.fill();
        if (p.t >= 1 && !p.f1) { p.f1 = true; fire(p.path.a); }
        if (p.t >= 2 && !p.f2) { p.f2 = true; fire(p.path.b); }
        if (p.t >= 3) { pulses.splice(i, 1); fire(p.path.p); }
      }
    }

    let running = false, frame = 0;
    function loop(now) {
      if (!running) return;
      frame = requestAnimationFrame(loop);
      if (now - lastSpawn > (focus ? 180 : 320) && reveal >= 1 && pulses.length < 40) { spawn(); lastSpawn = now; }
      draw(now);
    }
    const play = () => { if (!running && !reduceMotion) { running = true; frame = requestAnimationFrame(loop); } };
    const pause = () => { running = false; cancelAnimationFrame(frame); };

    measure();
    if (reduceMotion) draw(0); else play();
    // The entrance animation is CSS; once it has finished, lock the final state.
    setTimeout(() => { net.classList.add('ready'); measure(); if (reduceMotion) draw(0); }, reduceMotion ? 0 : 2100);

    if ('ResizeObserver' in window) {
      new ResizeObserver(() => { measure(); if (reduceMotion) draw(0); }).observe(net);
    }
    let visible = true;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; visible ? play() : pause(); }).observe(net);
    }
    document.addEventListener('visibilitychange', () => (document.hidden ? pause() : visible && play()));
  }

  const net = document.querySelector('.net');
  if (net) startNetwork(net);

  /* ---------- Count-up numbers ---------- */
  function countUp(el) {
    const raw = el.dataset.count;
    const target = parseFloat(raw);
    if (Number.isNaN(target)) return;
    const decimals = (raw.split('.')[1] || '').length;
    const suffix = el.dataset.suffix || '';
    const format = (v) => v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix;
    if (reduceMotion) { el.textContent = format(target); return; }
    const start = performance.now(), dur = 1300;
    const tick = (now) => {
      const p = Math.min((now - start) / dur, 1);
      el.textContent = format(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ---------- Project detail dialogs ---------- */
  const dialogs = [...document.querySelectorAll('dialog.detail')];
  const order = dialogs.map((d) => d.id);
  let lastTrigger = null;

  function openProject(id, origin) {
    const dlg = document.getElementById(id);
    if (!dlg || typeof dlg.showModal !== 'function') return;
    dialogs.forEach((d) => { if (d.open && d !== dlg) d.close(); });
    if (origin) {
      const r = origin.getBoundingClientRect();
      dlg.style.setProperty('--ox', `${r.left + r.width / 2 - (window.innerWidth - Math.min(1080, window.innerWidth - 24)) / 2}px`);
      dlg.style.setProperty('--oy', `${Math.min(r.top + r.height / 2, window.innerHeight)}px`);
    }
    dlg.showModal();
    document.body.classList.add('locked');
    const scroller = dlg.querySelector('.detail-scroll');
    if (scroller) scroller.scrollTop = 0;
    dlg.querySelectorAll('[data-count]').forEach(countUp);
    if (location.hash !== `#${id}`) history.replaceState(null, '', `#${id}`);
  }

  dialogs.forEach((dlg, idx) => {
    dlg.addEventListener('close', () => {
      if (!dialogs.some((d) => d.open)) {
        document.body.classList.remove('locked');
        if (location.hash === `#${dlg.id}`) history.replaceState(null, '', location.pathname + location.search);
        if (lastTrigger && document.contains(lastTrigger)) lastTrigger.focus({ preventScroll: true });
      }
    });
    // Clicking the dimmed backdrop closes the dialog.
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
    dlg.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => dlg.close()));
    const prev = dlg.querySelector('[data-prev]'), next = dlg.querySelector('[data-next]');
    const go = (step) => openProject(order[(idx + step + order.length) % order.length]);
    if (prev) prev.addEventListener('click', () => go(-1));
    if (next) next.addEventListener('click', () => go(1));
  });

  document.querySelectorAll('[data-open]').forEach((btn) => {
    btn.addEventListener('click', () => { lastTrigger = btn; openProject(btn.dataset.open, btn); });
  });

  // Deep links: /#margin opens that project directly.
  const fromHash = () => {
    const id = location.hash.slice(1);
    if (order.includes(id)) openProject(id);
  };
  window.addEventListener('hashchange', fromHash);
  fromHash();

  /* ---------- Scroll progress, active nav link and timeline fill ---------- */
  const progress = document.querySelector('.progress');
  const timeline = document.querySelector('.timeline');
  const navLinks = [...document.querySelectorAll('.nav a')];
  const sections = navLinks.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  let ticking = false;
  function onScrollFrame() {
    ticking = false;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.setProperty('--p', max > 0 ? (window.scrollY / max).toFixed(4) : '0');
    if (timeline) {
      const r = timeline.getBoundingClientRect();
      const fill = Math.min(1, Math.max(0, (window.innerHeight * 0.75 - r.top) / Math.max(r.height, 1)));
      timeline.style.setProperty('--fill', fill.toFixed(3));
    }
    // The last section whose top has passed a line a third of the way down the screen is the current one.
    let current = null;
    for (const sec of sections) if (sec.getBoundingClientRect().top < window.innerHeight * 0.35) current = sec;
    navLinks.forEach((a) => a.classList.toggle('active', !!current && a.getAttribute('href') === `#${current.id}`));
  }
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScrollFrame); } }, { passive: true });
  window.addEventListener('resize', onScrollFrame);
  onScrollFrame();

  /* ---------- Copy email ---------- */
  document.querySelectorAll('[data-copy]').forEach((btn) => {
    const status = btn.parentElement.querySelector('.copied');
    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(btn.dataset.copy);
        if (status) status.textContent = 'Copied';
      } catch (err) {
        // Clipboard can be blocked (for example on file:// pages); fall back to opening the mail app.
        window.location.href = `mailto:${btn.dataset.copy}`;
      }
      if (status) setTimeout(() => { status.textContent = ''; }, 2000);
    });
  });

  /* ---------- Reveal on scroll ---------- */
  const revealables = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      }
    }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
    revealables.forEach((el) => io.observe(el));
  } else {
    revealables.forEach((el) => el.classList.add('is-in'));
  }
})();
