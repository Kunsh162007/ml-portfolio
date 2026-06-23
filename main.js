/* =========================================================================
   Kunsh Agrawal — cinematic dossier
   main.js — atmospheric ember/mist canvas + single-scroll site behaviour.

   No Three.js. The background is a lightweight 2D canvas particle field
   (rising embers + drifting mist) layered under a CSS glow/grain/vignette
   stack. The rest is progressive-enhancement UI: scroll reveals, scrollspy
   nav, animated stat counters, project filters, and the README modal.
   ========================================================================= */

const qs = (sel, root = document) => root.querySelector(sel);
const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* =========================================================================
   Atmosphere canvas — embers rising + mist drifting
   ========================================================================= */

class Atmosphere {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.embers = [];
        this.mist = [];
        this.running = true;
        this.lastT = 0;

        this._resize();
        window.addEventListener('resize', () => this._resize());

        // pause when the tab isn't visible to save battery
        document.addEventListener('visibilitychange', () => {
            this.running = !document.hidden;
            if (this.running) requestAnimationFrame((t) => this._loop(t));
        });

        requestAnimationFrame((t) => this._loop(t));
    }

    _resize() {
        this.dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.w = window.innerWidth;
        this.h = window.innerHeight;
        this.canvas.width = this.w * this.dpr;
        this.canvas.height = this.h * this.dpr;
        this.canvas.style.width = this.w + 'px';
        this.canvas.style.height = this.h + 'px';
        this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

        // density scales with viewport area (capped for perf / phones)
        const area = this.w * this.h;
        const emberCount = Math.min(110, Math.round(area / 16000));
        const mistCount = Math.min(22, Math.round(area / 90000));
        this.embers = Array.from({ length: emberCount }, () => this._newEmber(true));
        this.mist = Array.from({ length: mistCount }, () => this._newMist(true));
    }

    _newEmber(seed = false) {
        return {
            x: Math.random() * this.w,
            y: seed ? Math.random() * this.h : this.h + Math.random() * 40,
            r: 0.6 + Math.random() * 1.8,
            vy: 8 + Math.random() * 22,           // px/sec upward
            drift: (Math.random() - 0.5) * 14,
            phase: Math.random() * Math.PI * 2,
            life: 0,
            ttl: 6 + Math.random() * 8,
            hot: Math.random() > 0.45,            // some glow warm-white, some crimson
        };
    }

    _newMist(seed = false) {
        return {
            x: seed ? Math.random() * this.w : -260,
            y: this.h * (0.45 + Math.random() * 0.55),
            r: 160 + Math.random() * 220,
            vx: 6 + Math.random() * 12,
            alpha: 0.04 + Math.random() * 0.06,
        };
    }

    _loop(t) {
        if (!this.running) return;
        const dt = Math.min((t - this.lastT) / 1000, 0.05) || 0;
        this.lastT = t;
        const { ctx } = this;

        ctx.clearRect(0, 0, this.w, this.h);

        // drifting mist (soft, low, additive-ish)
        ctx.globalCompositeOperation = 'lighter';
        for (const m of this.mist) {
            m.x += m.vx * dt;
            if (m.x - m.r > this.w) Object.assign(m, this._newMist(false));
            const g = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r);
            g.addColorStop(0, `rgba(210, 205, 195, ${m.alpha})`);
            g.addColorStop(1, 'rgba(210, 205, 195, 0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
            ctx.fill();
        }

        // rising embers
        for (const e of this.embers) {
            e.life += dt;
            e.y -= e.vy * dt;
            e.x += Math.sin(e.phase + e.life * 0.8) * e.drift * dt;
            if (e.y < -20 || e.life > e.ttl) Object.assign(e, this._newEmber(false));

            const fade = Math.sin(Math.min(e.life / e.ttl, 1) * Math.PI); // ease in/out
            const a = fade * 0.9;
            const r = e.r;
            const g = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, r * 3.5);
            if (e.hot) {
                g.addColorStop(0, `rgba(255, 226, 190, ${a})`);
                g.addColorStop(0.4, `rgba(255, 140, 70, ${a * 0.7})`);
                g.addColorStop(1, 'rgba(255, 90, 40, 0)');
            } else {
                g.addColorStop(0, `rgba(255, 90, 80, ${a})`);
                g.addColorStop(0.5, `rgba(220, 38, 38, ${a * 0.6})`);
                g.addColorStop(1, 'rgba(160, 20, 20, 0)');
            }
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(e.x, e.y, r * 3.5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalCompositeOperation = 'source-over';

        requestAnimationFrame((t2) => this._loop(t2));
    }
}

/* =========================================================================
   Scroll reveal (IntersectionObserver)
   ========================================================================= */

function initReveal() {
    const items = qsa('.reveal');
    if (prefersReduced || !('IntersectionObserver' in window)) {
        items.forEach((el) => el.classList.add('in'));
        return;
    }
    const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in');
                io.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    items.forEach((el) => io.observe(el));
}

/* =========================================================================
   Animated stat counters
   ========================================================================= */

function initCounters() {
    const nums = qsa('.stat-num[data-count]');
    if (!nums.length) return;
    if (prefersReduced || !('IntersectionObserver' in window)) {
        nums.forEach((el) => { el.textContent = el.dataset.count + (el.dataset.suffix || ''); });
        return;
    }
    const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            io.unobserve(el);
            const target = parseInt(el.dataset.count, 10) || 0;
            const suffix = el.dataset.suffix || '';
            const dur = 1100;
            const start = performance.now();
            const tick = (now) => {
                const p = Math.min((now - start) / dur, 1);
                const eased = 1 - Math.pow(1 - p, 3);
                el.textContent = Math.round(target * eased) + suffix;
                if (p < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
        });
    }, { threshold: 0.5 });
    nums.forEach((el) => io.observe(el));
}

/* =========================================================================
   Navigation — scrollspy, condensed-on-scroll, mobile toggle, smooth links
   ========================================================================= */

function initNav() {
    const nav = qs('#nav');
    const toggle = qs('#nav-toggle');
    const links = qs('#nav-links');
    const rail = qs('#scroll-rail-fill');

    const onScroll = () => {
        const y = window.scrollY;
        if (nav) nav.classList.toggle('scrolled', y > 40);
        if (rail) {
            const max = document.documentElement.scrollHeight - window.innerHeight;
            rail.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
        }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    if (toggle && links) {
        toggle.addEventListener('click', () => {
            const open = toggle.classList.toggle('active');
            links.classList.toggle('active', open);
            toggle.setAttribute('aria-expanded', String(open));
        });
        qsa('a', links).forEach((a) => a.addEventListener('click', () => {
            toggle.classList.remove('active');
            links.classList.remove('active');
            toggle.setAttribute('aria-expanded', 'false');
        }));
    }

    // smooth scroll for in-page links (respects reduced-motion via CSS/native)
    qsa('a[data-scroll]').forEach((a) => {
        a.addEventListener('click', (e) => {
            const href = a.getAttribute('href');
            if (!href || !href.startsWith('#')) return;
            const target = qs(href);
            if (!target) return;
            e.preventDefault();
            target.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
            history.replaceState(null, '', href);
        });
    });

    // scrollspy — highlight the nav link of the section in view
    const sections = ['hero', 'about', 'skills', 'work', 'contact']
        .map((id) => qs('#' + id)).filter(Boolean);
    const navLinks = qsa('#nav-links a:not(.nav-cta)');
    if ('IntersectionObserver' in window && sections.length) {
        const spy = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                const id = entry.target.id;
                navLinks.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + id));
            });
        }, { threshold: 0.55 });
        sections.forEach((s) => spy.observe(s));
    }
}

/* =========================================================================
   Project filters
   ========================================================================= */

function initFilters() {
    const btns = qsa('.filter-btn');
    const cards = qsa('.project-card');
    btns.forEach((btn) => {
        btn.addEventListener('click', () => {
            btns.forEach((b) => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
            btn.classList.add('active');
            btn.setAttribute('aria-selected', 'true');
            const filter = btn.dataset.filter;
            cards.forEach((card) => {
                const match = filter === 'all' || card.dataset.category === filter;
                card.classList.toggle('filter-hidden', !match);
            });
        });
    });
}

/* =========================================================================
   README modal
   ========================================================================= */

function initModal() {
    const modal = qs('#readme-modal');
    const content = qs('#markdown-container');
    const closeBtn = qs('.close-btn');
    const githubLink = qs('#modal-github-link');
    if (!modal || !content || !closeBtn || !githubLink) return;

    function rewritePaths(markdown, githubUrl, subfolder = '') {
        if (!githubUrl || !githubUrl.includes('github.com')) return markdown;
        const repoPath = githubUrl.replace('https://github.com/', '').replace(/\/$/, '');
        const sub = subfolder ? (subfolder.endsWith('/') ? subfolder : `${subfolder}/`) : '';
        const rawBase = `https://raw.githubusercontent.com/${repoPath}/main/${sub}`;

        let out = markdown.replace(/!\[([^\]]*)\]\((?!http|https)([^)]+)\)/g, (m, alt, path) => {
            const clean = path.startsWith('./') ? path.substring(2) : path;
            return `![${alt}](${rawBase}${clean})`;
        });
        out = out.replace(/<img[^>]+src=["'](?!http|https)([^"']+)["'][^>]*>/g, (m, path) => {
            const clean = path.startsWith('./') ? path.substring(2) : path;
            return m.replace(path, `${rawBase}${clean}`);
        });
        out = out.replace(/\[([^\]]*)\]\((?!http|https|#)([^)]+)\)/g, (m, text, path) => {
            const clean = path.startsWith('./') ? path.substring(2) : path;
            return `[${text}](${githubUrl}/blob/main/${sub}${clean})`;
        });
        return out;
    }

    qsa('.btn-text[data-readme]').forEach((button) => {
        button.addEventListener('click', async () => {
            const readmePath = button.dataset.readme;
            const githubUrl = button.dataset.github;
            githubLink.href = githubUrl || '#';

            document.body.style.overflow = 'hidden';
            content.innerHTML = `<div class="loading-state"><div class="spinner"></div><p>Fetching technical documentation…</p></div>`;
            modal.style.display = 'block';
            requestAnimationFrame(() => modal.classList.add('show'));

            try {
                const res = await fetch(readmePath);
                if (!res.ok) throw new Error('Failed to load README');
                let md = await res.text();
                md = rewritePaths(md, githubUrl, button.dataset.repoSubfolder || '');
                content.innerHTML = window.marked ? window.marked.parse(md) : md;
            } catch (err) {
                console.error(err);
                content.innerHTML = `<div class="error-state"><p>Unable to load the mission file directly.</p>
                    <a href="${githubUrl}" target="_blank" rel="noopener" class="btn btn-primary">View on GitHub Instead</a></div>`;
            }
        });
    });

    function close() {
        modal.classList.remove('show');
        document.body.style.overflow = '';
        setTimeout(() => { modal.style.display = 'none'; content.innerHTML = ''; }, 300);
    }
    closeBtn.addEventListener('click', close);
    window.addEventListener('click', (e) => { if (e.target === modal) close(); });
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.classList.contains('show')) close(); });
}

/* =========================================================================
   Boot
   ========================================================================= */

function boot() {
    const canvas = qs('#atmosphere');
    if (canvas && !prefersReduced) {
        try { new Atmosphere(canvas); } catch (err) { console.warn('[atmosphere] disabled', err); }
    }

    initReveal();
    initCounters();
    initNav();
    initFilters();
    initModal();

    // hide the loading screen once everything is wired + first paint settles
    const ls = qs('#loading-screen');
    const bar = qs('#loading-bar-fill');
    if (bar) bar.style.width = '100%';
    const done = () => ls && ls.classList.add('loaded');
    if (document.readyState === 'complete') setTimeout(done, 250);
    else window.addEventListener('load', () => setTimeout(done, 250));
    // hard safety net
    setTimeout(done, 2500);
}

boot();
