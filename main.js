/* =========================================================================
   Kunsh Agrawal — Corps Dossier
   main.js — Three.js click-through-gates corridor engine + ported site UI.

   Architecture: a single fixed full-viewport WebGL canvas renders ONLY the
   3D environment (corridor, doors, gallery wall, sword rack, clouds,
   particles, original art). All real text/content stays in normal 2D HTML
   above the canvas. The journey is broken into five fixed "stations"
   (hero -> corridor -> dojo -> missions -> sendword). The camera holds
   still at each station; clicking the gate ahead (or the on-screen hint)
   flies the camera to the next station and swings that gate open.
   ========================================================================= */

import * as THREE from './vendor/three.module.js';

/* -------------------------------------------------------------------------
   Small utilities
   ------------------------------------------------------------------------- */

const qs = (sel, root = document) => root.querySelector(sel);
const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const smoothstep = (x) => x * x * (3 - 2 * x);
// Overshoot ease: door swings slightly past full-open then settles, for a kicked-open feel.
const easeOutBack = (x) => {
    const c1 = 1.7, c3 = c1 + 1;
    return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};

const STATION_IDS = ['hero', 'corridor', 'dojo', 'missions', 'sendword'];

let rankToastTimer = null;
function showRankToast(text) {
    const toastEl = qs('#rank-toast');
    if (!toastEl) return;
    toastEl.textContent = text;
    toastEl.classList.add('show');
    clearTimeout(rankToastTimer);
    rankToastTimer = setTimeout(() => toastEl.classList.remove('show'), 3200);
}

/* =========================================================================
   PART 1 — Ported 2D site UI (nav, filters, gate controls, README modal)
   ========================================================================= */

function initUI(engine) {
    // Mobile nav toggle
    const navToggle = qs('#nav-toggle');
    const navLinksList = qs('#nav-links');
    if (navToggle && navLinksList) {
        navToggle.addEventListener('click', () => {
            navToggle.classList.toggle('active');
            navLinksList.classList.toggle('active');
        });
        qsa('a', navLinksList).forEach((link) => {
            link.addEventListener('click', () => {
                navToggle.classList.remove('active');
                navLinksList.classList.remove('active');
            });
        });
    }

    // The nav bar always sits over the 3D scene now — give it its
    // backdrop permanently instead of toggling on page scroll.
    const navEl = qs('.corps-nav');
    if (navEl) navEl.classList.add('scrolled');

    // Any link that points at a station id (#hero, #corridor, #dojo,
    // #missions, #sendword) drives the click-through-gates engine instead
    // of a native anchor jump — there's no page scroll to jump to anymore.
    if (engine) {
        qsa('a[href^="#"]').forEach((a) => {
            const id = a.getAttribute('href').slice(1);
            const idx = STATION_IDS.indexOf(id);
            if (idx === -1) return;
            a.addEventListener('click', (e) => {
                e.preventDefault();
                engine.goToStation(idx);
            });
        });

        const gateBack = qs('#gate-back');
        const gateHint = qs('#gate-hint');
        if (gateBack) gateBack.addEventListener('click', () => engine.goToStation(engine.currentIndex - 1));
        if (gateHint) gateHint.addEventListener('click', () => engine.goToStation(engine.currentIndex + 1));
    }

    // Category filter bar
    const filterBtns = qsa('.filter-btn');
    const projectCards = qsa('.project-card');
    filterBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
            filterBtns.forEach((b) => {
                b.classList.remove('active');
                b.setAttribute('aria-selected', 'false');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-selected', 'true');

            const filter = btn.getAttribute('data-filter');
            projectCards.forEach((card) => {
                const category = card.getAttribute('data-category');
                const matches = filter === 'all' || category === filter;
                card.classList.toggle('filter-hidden', !matches);
            });
        });
    });

    initReadmeModal();
}

function initReadmeModal() {
    const modal = qs('#readme-modal');
    const modalContent = qs('#markdown-container');
    const closeBtn = qs('.close-btn');
    const githubLink = qs('#modal-github-link');
    if (!modal || !modalContent || !closeBtn || !githubLink) return;

    function rewriteMarkdownPaths(markdown, githubUrl, subfolder = '') {
        if (!githubUrl || !githubUrl.includes('github.com')) return markdown;

        const repoPath = githubUrl.replace('https://github.com/', '').replace(/\/$/, '');
        const cleanSubfolder = subfolder ? (subfolder.endsWith('/') ? subfolder : `${subfolder}/`) : '';
        const rawBaseUrl = `https://raw.githubusercontent.com/${repoPath}/main/${cleanSubfolder}`;

        let updated = markdown.replace(/!\[([^\]]*)\]\((?!http|https)([^)]+)\)/g, (match, alt, path) => {
            const cleanPath = path.startsWith('./') ? path.substring(2) : path;
            return `![${alt}](${rawBaseUrl}${cleanPath})`;
        });

        updated = updated.replace(/<img[^>]+src=["'](?!http|https)([^"']+)["'][^>]*>/g, (match, path) => {
            const cleanPath = path.startsWith('./') ? path.substring(2) : path;
            return match.replace(path, `${rawBaseUrl}${cleanPath}`);
        });

        updated = updated.replace(/\[([^\]]*)\]\((?!http|https|#)([^)]+)\)/g, (match, text, path) => {
            const cleanPath = path.startsWith('./') ? path.substring(2) : path;
            return `[${text}](${githubUrl}/blob/main/${cleanSubfolder}${cleanPath})`;
        });

        return updated;
    }

    qsa('.btn-text[data-readme]').forEach((button) => {
        button.addEventListener('click', async (e) => {
            const readmePath = button.getAttribute('data-readme');
            const githubUrl = button.getAttribute('data-github');

            githubLink.href = githubUrl || '#';

            document.body.style.overflow = 'hidden';
            modalContent.innerHTML = `
                <div class="loading-state">
                    <div class="spinner"></div>
                    <p>Fetching technical documentation...</p>
                </div>
            `;
            modal.style.display = 'block';
            setTimeout(() => modal.classList.add('show'), 10);

            try {
                const response = await fetch(readmePath);
                if (!response.ok) throw new Error('Failed to load README');

                let markdownText = await response.text();
                const subfolder = button.getAttribute('data-repo-subfolder') || '';
                markdownText = rewriteMarkdownPaths(markdownText, githubUrl, subfolder);

                modalContent.innerHTML = window.marked.parse(markdownText);
            } catch (err) {
                console.error(err);
                modalContent.innerHTML = `
                    <div class="error-state">
                        <p>Unable to load the mission file directly.</p>
                        <a href="${githubUrl}" target="_blank" rel="noopener" class="btn btn-primary">View on GitHub Instead</a>
                    </div>
                `;
            }
        });
    });

    function closeModal() {
        modal.classList.remove('show');
        document.body.style.overflow = '';
        setTimeout(() => {
            modal.style.display = 'none';
            modalContent.innerHTML = '';
        }, 300);
    }

    closeBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('show')) closeModal();
    });
}

/* =========================================================================
   PART 2 — Three.js click-through-gates corridor engine
   ========================================================================= */

const PALETTE = {
    ink: 0x0a0a0d,
    wall: 0x1c1c22,
    floor: 0x14141a,
    door: 0x5c1414,
    blade: 0xd8d4c8,
    edge: 0xdc2626,
    gate: 0x6e1414,
    building: 0x101014,
    outline: 0x0a0a0c,
    wood: 0x2b2018,
    flame: 0xff7a33,
};

const ZONE_WAYPOINTS = {
    hero: { pos: [0, 5.0, 29], look: [0, 2.2, 20] },
    corridor: { pos: [0, 1.7, 13], look: [0, 1.6, 2] },
    dojo: { pos: [-1.2, 1.6, 1], look: [-1.2, 1.6, -10] },
    missions: { pos: [0, 1.8, -17], look: [0, 1.6, -27] },
    sendword: { pos: [0.2, 1.8, -36], look: [0.2, 1.7, -45] },
};

const POSTERS = [
    { src: 'assets/aegis_cover.jpg', aspect: 1400 / 900, target: '#project-aegis', z: -10 },
    { src: 'assets/nexus_cover.jpg', aspect: 1200 / 630, target: '#project-nexus', z: -14 },
    { src: 'assets/nexusintel_cover.jpg', aspect: 1280 / 720, target: '#project-nexusintel', z: -18 },
    { src: 'assets/drishti_cover.jpg', aspect: 1280 / 720, target: '#project-drishti', z: -22 },
    { src: 'assets/research_cover.jpg', aspect: 1280 / 720, target: '#project-research', z: -26 },
    { src: 'assets/devramp_cover.jpg', aspect: 1920 / 1080, target: '#project-devramp', z: -30 },
    { src: 'assets/rnn_forecasting_cover.jpg', aspect: 1280 / 720, target: '#project-rnn-forecasting', z: -34 },
    { src: 'assets/cnn_cover.jpg', aspect: 1280 / 720, target: '#project-cnn', z: -38 },
];

// Each door connects station index (i+1) to (i+2) in STATION_IDS — i.e.
// door 0 gates corridor->dojo, door 1 gates dojo->missions, door 2 gates
// missions->sendword. Clicking a door only advances if you're already
// standing at the station immediately before it.
const DOOR_DEFS = [
    { z: 7, target: '#dojo' },
    { z: -8, target: '#missions' },
    { z: -26.5, target: '#sendword' },
];

class CorridorEngine {
    constructor(canvas, loadingEls) {
        this.canvas = canvas;
        this.loadingBar = loadingEls.bar;
        this.loadingScreen = loadingEls.screen;

        this.clock = { lastTime: 0 };
        this.interactive = [];
        this.hoverables = [];

        this.raycaster = new THREE.Raycaster();
        this.pointer = new THREE.Vector2();

        this._initRenderer();
        this._initScene();
        this._initLights();
        this._initToonGradient();
        this._initTexturePipeline();
        this._buildEnvironment();
        this._buildParticles();
        this._wireInteractivity();
        this._wireResize();
        this._initStations();

        requestAnimationFrame((t) => this._animate(t));
    }

    _initRenderer() {
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        if ('outputColorSpace' in this.renderer && THREE.SRGBColorSpace) {
            this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        }
    }

    _initScene() {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(PALETTE.ink, 10, 58);

        this.camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 120);
        this.camera.position.set(0, 5, 29);
    }

    _initLights() {
        this.scene.add(new THREE.AmbientLight(0x2a2a35, 0.6));

        const key = new THREE.DirectionalLight(0xfff2e0, 0.55);
        key.position.set(6, 10, 8);
        this.scene.add(key);

        const rim = new THREE.DirectionalLight(0xdc2626, 0.65);
        rim.position.set(-6, 4, -6);
        this.scene.add(rim);
    }

    _initToonGradient() {
        const data = new Uint8Array([40, 110, 175, 255]);
        const tex = new THREE.DataTexture(data, data.length, 1, THREE.RedFormat);
        tex.minFilter = THREE.NearestFilter;
        tex.magFilter = THREE.NearestFilter;
        tex.generateMipmaps = false;
        tex.needsUpdate = true;
        this.toonGradient = tex;
    }

    toonMat(color) {
        return new THREE.MeshToonMaterial({ color, gradientMap: this.toonGradient });
    }

    addOutline(mesh, scale = 1.045) {
        const outlineMesh = new THREE.Mesh(
            mesh.geometry,
            new THREE.MeshBasicMaterial({ color: PALETTE.outline, side: THREE.BackSide })
        );
        outlineMesh.scale.multiplyScalar(scale);
        mesh.add(outlineMesh);
        return outlineMesh;
    }

    _initTexturePipeline() {
        this.manager = new THREE.LoadingManager();
        this.manager.onProgress = (_url, loaded, total) => {
            if (this.loadingBar) {
                const pct = total ? Math.round((loaded / total) * 100) : 100;
                this.loadingBar.style.width = `${pct}%`;
            }
        };
        this.manager.onLoad = () => {
            if (this.loadingScreen) this.loadingScreen.classList.add('loaded');
        };
        this.manager.onError = (url) => console.warn('[corridor] failed to load', url);
        this.texLoader = new THREE.TextureLoader(this.manager);
    }

    /* ---------------- procedural sprite / surface textures (no external assets) ---------------- */

    makeRadialTexture(inner, outer = 'rgba(0,0,0,0)') {
        const size = 64;
        const cnv = document.createElement('canvas');
        cnv.width = cnv.height = size;
        const ctx = cnv.getContext('2d');
        const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
        grad.addColorStop(0, inner);
        grad.addColorStop(1, outer);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, size, size);
        const tex = new THREE.CanvasTexture(cnv);
        tex.needsUpdate = true;
        return tex;
    }

    /* ---------------- environment construction ---------------- */

    _buildEnvironment() {
        const wallMat = this.toonMat(PALETTE.wall);
        const floorMat = this.toonMat(PALETTE.floor);

        // Floor + ceiling-less corridor, spanning the full journey
        const floor = new THREE.Mesh(new THREE.PlaneGeometry(10, 84), floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.set(0, 0, -8);
        this.scene.add(floor);

        // Side walls
        [-5, 5].forEach((x) => {
            const wall = new THREE.Mesh(new THREE.BoxGeometry(0.5, 7, 84), wallMat);
            wall.position.set(x, 3.3, -8);
            this.scene.add(wall);
            this.addOutline(wall, 1.02);
        });

        this._buildDoors();
        this._buildTorches();
        this._buildSwordRack();
        this._buildSkyline();
        this._buildToriiGate();
        this._buildPier();
        this._loadCharacterArt();
        this._loadPosters();
        this._buildClouds();
    }

    makeSlashTexture() {
        const size = 160;
        const main = document.createElement('canvas');
        main.width = main.height = size;
        const mctx = main.getContext('2d');

        const drawStreak = (angle, bandFrac, alpha) => {
            const tmp = document.createElement('canvas');
            tmp.width = tmp.height = size;
            const tctx = tmp.getContext('2d');
            const vGrad = tctx.createLinearGradient(0, size * (0.5 - bandFrac), 0, size * (0.5 + bandFrac));
            vGrad.addColorStop(0, 'rgba(255,255,255,0)');
            vGrad.addColorStop(0.5, `rgba(255,241,235,${alpha})`);
            vGrad.addColorStop(1, 'rgba(255,255,255,0)');
            tctx.fillStyle = vGrad;
            tctx.fillRect(0, 0, size, size);

            const hGrad = tctx.createLinearGradient(0, 0, size, 0);
            hGrad.addColorStop(0, 'rgba(255,255,255,0)');
            hGrad.addColorStop(0.5, 'rgba(255,255,255,1)');
            hGrad.addColorStop(1, 'rgba(255,255,255,0)');
            tctx.globalCompositeOperation = 'destination-in';
            tctx.fillStyle = hGrad;
            tctx.fillRect(0, 0, size, size);

            mctx.save();
            mctx.translate(size / 2, size / 2);
            mctx.rotate(angle);
            mctx.translate(-size / 2, -size / 2);
            mctx.globalCompositeOperation = 'lighter';
            mctx.drawImage(tmp, 0, 0);
            mctx.restore();
        };

        drawStreak(-Math.PI / 5, 0.07, 1.0);
        drawStreak(Math.PI / 9, 0.045, 0.55);

        mctx.save();
        mctx.translate(size / 2, size / 2);
        mctx.rotate(-Math.PI / 5);
        mctx.translate(-size / 2, -size / 2);
        const coreGrad = mctx.createLinearGradient(0, size * 0.46, 0, size * 0.54);
        coreGrad.addColorStop(0, 'rgba(220,38,38,0)');
        coreGrad.addColorStop(0.5, 'rgba(220,38,38,0.85)');
        coreGrad.addColorStop(1, 'rgba(220,38,38,0)');
        mctx.globalCompositeOperation = 'source-over';
        mctx.globalAlpha = 0.7;
        mctx.fillStyle = coreGrad;
        mctx.fillRect(size * 0.12, 0, size * 0.76, size);
        mctx.restore();

        const tex = new THREE.CanvasTexture(main);
        tex.needsUpdate = true;
        return tex;
    }

    makeSpeedLinesTexture() {
        const size = 256;
        const cnv = document.createElement('canvas');
        cnv.width = cnv.height = size;
        const ctx = cnv.getContext('2d');
        const cx = size / 2, cy = size / 2;
        const lines = 28;
        for (let i = 0; i < lines; i++) {
            const angle = (i / lines) * Math.PI * 2 + Math.random() * 0.08;
            const innerR = size * (0.12 + Math.random() * 0.06);
            const outerR = size * (0.46 + Math.random() * 0.06);
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(angle);
            const grad = ctx.createLinearGradient(innerR, 0, outerR, 0);
            grad.addColorStop(0, 'rgba(255,255,255,0.95)');
            grad.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.strokeStyle = grad;
            ctx.lineWidth = size * (0.012 + Math.random() * 0.01);
            ctx.beginPath();
            ctx.moveTo(innerR, 0);
            ctx.lineTo(outerR, 0);
            ctx.stroke();
            ctx.restore();
        }
        const tex = new THREE.CanvasTexture(cnv);
        tex.needsUpdate = true;
        return tex;
    }

    makeHamonTexture() {
        const w = 256, h = 32;
        const cnv = document.createElement('canvas');
        cnv.width = w; cnv.height = h;
        const ctx = cnv.getContext('2d');
        ctx.fillStyle = '#e9e6df';
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = 'rgba(20,20,24,0.5)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(0, h * 0.62);
        for (let x = 0; x <= w; x += 6) {
            const y = h * 0.62 + Math.sin(x * 0.18) * 2.4 + Math.sin(x * 0.05) * 1.6;
            ctx.lineTo(x, y);
        }
        ctx.stroke();
        const tex = new THREE.CanvasTexture(cnv);
        tex.wrapS = THREE.RepeatWrapping;
        tex.needsUpdate = true;
        return tex;
    }

    // Aged, fire-worn gate panel: weathered plank grain, soot blotches,
    // rusted iron cross-braces with rivets, and a faded clan-stripe accent.
    makeOldDoorTexture() {
        const size = 256;
        const cnv = document.createElement('canvas');
        cnv.width = cnv.height = size;
        const ctx = cnv.getContext('2d');

        ctx.fillStyle = '#2c2117';
        ctx.fillRect(0, 0, size, size);

        const planks = 6;
        ctx.lineWidth = 2;
        for (let i = 0; i <= planks; i++) {
            const x = (i / planks) * size;
            ctx.strokeStyle = 'rgba(10,8,5,0.6)';
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, size); ctx.stroke();
        }
        for (let i = 0; i < 220; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const len = 6 + Math.random() * 18;
            const dark = Math.random() > 0.5;
            ctx.strokeStyle = dark ? `rgba(10,8,5,${0.15 + Math.random() * 0.2})` : `rgba(60,48,34,${0.15 + Math.random() * 0.2})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + (Math.random() - 0.5) * 3, y + len);
            ctx.stroke();
        }

        for (let i = 0; i < 7; i++) {
            const x = Math.random() * size;
            const y = size * (0.4 + Math.random() * 0.58);
            const r = 16 + Math.random() * 30;
            const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
            grad.addColorStop(0, 'rgba(5,4,3,0.55)');
            grad.addColorStop(1, 'rgba(5,4,3,0)');
            ctx.fillStyle = grad;
            ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
        }

        [0.28, 0.72].forEach((frac) => {
            const y = size * frac;
            ctx.fillStyle = 'rgba(18,17,18,0.88)';
            ctx.fillRect(0, y - 7, size, 14);
            ctx.fillStyle = 'rgba(60,58,56,0.5)';
            ctx.fillRect(0, y - 7, size, 2);
            for (let x = 14; x < size; x += 28) {
                ctx.beginPath();
                ctx.fillStyle = 'rgba(80,76,70,0.7)';
                ctx.arc(x, y, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        const vignette = ctx.createRadialGradient(size / 2, size / 2, size * 0.3, size / 2, size / 2, size * 0.72);
        vignette.addColorStop(0, 'rgba(0,0,0,0)');
        vignette.addColorStop(1, 'rgba(0,0,0,0.55)');
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, size, size);

        ctx.strokeStyle = 'rgba(122,20,20,0.3)';
        ctx.lineWidth = 3;
        ctx.strokeRect(5, 5, size - 10, size - 10);

        const tex = new THREE.CanvasTexture(cnv);
        tex.needsUpdate = true;
        return tex;
    }

    // Stylised torch flame: layered elongated radial gradients, drawn once
    // and billboarded — animated per-frame via scale/opacity flicker.
    makeFlameTexture() {
        const w = 64, h = 96;
        const cnv = document.createElement('canvas');
        cnv.width = w; cnv.height = h;
        const ctx = cnv.getContext('2d');

        ctx.save();
        ctx.translate(w / 2, h * 0.62);
        ctx.scale(1, 1.7);
        const outer = ctx.createRadialGradient(0, 0, 0, 0, 0, w * 0.46);
        outer.addColorStop(0, 'rgba(255,140,40,0.95)');
        outer.addColorStop(0.6, 'rgba(255,90,20,0.55)');
        outer.addColorStop(1, 'rgba(255,60,10,0)');
        ctx.fillStyle = outer;
        ctx.beginPath(); ctx.arc(0, 0, w * 0.46, 0, Math.PI * 2); ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.translate(w / 2, h * 0.48);
        ctx.scale(0.62, 1.5);
        const inner = ctx.createRadialGradient(0, 0, 0, 0, 0, w * 0.34);
        inner.addColorStop(0, 'rgba(255,244,200,0.95)');
        inner.addColorStop(0.55, 'rgba(255,200,90,0.75)');
        inner.addColorStop(1, 'rgba(255,140,40,0)');
        ctx.fillStyle = inner;
        ctx.beginPath(); ctx.arc(0, 0, w * 0.34, 0, Math.PI * 2); ctx.fill();
        ctx.restore();

        const tex = new THREE.CanvasTexture(cnv);
        tex.needsUpdate = true;
        return tex;
    }

    _buildDoors() {
        const doorMat = this.toonMat(PALETTE.door);
        const trimMat = new THREE.MeshBasicMaterial({ color: PALETTE.gate });
        const emberTex = this.makeRadialTexture('rgba(239,68,68,0.95)');
        const dustTex = this.makeRadialTexture('rgba(207,202,191,0.65)');
        const flashTex = this.makeRadialTexture('rgba(255,241,235,0.95)');
        const slashTex = this.makeSlashTexture();
        const speedTex = this.makeSpeedLinesTexture();
        const oldDoorTex = this.makeOldDoorTexture();
        // MeshStandardMaterial (not Basic) so the new torch firelight actually
        // falls across the panels — that flicker is what reads as "old and lit".
        const panelMat = new THREE.MeshStandardMaterial({ map: oldDoorTex, roughness: 0.88, metalness: 0.05 });

        const halfW = 4.2;
        const panelH = 3.1;

        this.doors = [];

        DOOR_DEFS.forEach((def, doorIdx) => {
            const z = def.z;
            const group = new THREE.Group();

            [-halfW - 0.15, halfW + 0.15].forEach((x) => {
                const post = new THREE.Mesh(new THREE.BoxGeometry(0.22, panelH + 0.4, 0.22), doorMat);
                post.position.set(x, (panelH + 0.4) / 2, z);
                group.add(post);
                this.addOutline(post);
            });
            const lintel = new THREE.Mesh(new THREE.BoxGeometry(halfW * 2 + 0.6, 0.22, 0.22), doorMat);
            lintel.position.set(0, panelH + 0.5, z);
            group.add(lintel);
            this.addOutline(lintel);

            const trim = new THREE.Mesh(new THREE.BoxGeometry(halfW * 2 + 0.5, 0.06, 0.26), trimMat);
            trim.position.set(0, panelH + 0.38, z);
            group.add(trim);

            // weathered double panels, hinged at the outer posts
            const leftPivot = new THREE.Group();
            leftPivot.position.set(-halfW, panelH / 2, z);
            const leftPanel = new THREE.Mesh(new THREE.BoxGeometry(halfW, panelH, 0.1), panelMat);
            leftPanel.position.set(halfW / 2, 0, 0);
            leftPivot.add(leftPanel);
            this.addOutline(leftPanel, 1.03);
            group.add(leftPivot);

            const rightPivot = new THREE.Group();
            rightPivot.position.set(halfW, panelH / 2, z);
            const rightPanel = new THREE.Mesh(new THREE.BoxGeometry(halfW, panelH, 0.1), panelMat);
            rightPanel.position.set(-halfW / 2, 0, 0);
            rightPivot.add(rightPanel);
            this.addOutline(rightPanel, 1.03);
            group.add(rightPivot);

            this.scene.add(group);

            // ember burst (mid-air, around door height)
            const count = 60;
            const positions = new Float32Array(count * 3);
            for (let i = 0; i < count; i++) {
                positions[i * 3] = (Math.random() - 0.5) * (halfW * 2);
                positions[i * 3 + 1] = Math.random() * panelH;
                positions[i * 3 + 2] = z + (Math.random() - 0.5) * 0.6;
            }
            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            const burstMat = new THREE.PointsMaterial({ map: emberTex, size: 0.22, transparent: true, depthWrite: false, opacity: 0 });
            const burst = new THREE.Points(geo, burstMat);
            this.scene.add(burst);

            // ground-level dust kicked up by the swing
            const dustCount = 40;
            const dustPositions = new Float32Array(dustCount * 3);
            for (let i = 0; i < dustCount; i++) {
                dustPositions[i * 3] = (Math.random() - 0.5) * (halfW * 2.4);
                dustPositions[i * 3 + 1] = Math.random() * 0.5;
                dustPositions[i * 3 + 2] = z + (Math.random() - 0.5) * 1.2;
            }
            const dustGeo = new THREE.BufferGeometry();
            dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
            const dustMat = new THREE.PointsMaterial({ map: dustTex, size: 0.3, transparent: true, depthWrite: false, opacity: 0 });
            const dust = new THREE.Points(dustGeo, dustMat);
            this.scene.add(dust);

            // crimson slash after-image
            const slashMat = new THREE.SpriteMaterial({ map: slashTex, transparent: true, depthWrite: false, opacity: 0, blending: THREE.AdditiveBlending });
            const slash = new THREE.Sprite(slashMat);
            slash.scale.set(halfW * 2.2, panelH * 1.1, 1);
            slash.position.set(0, panelH / 2, z + 0.05);
            this.scene.add(slash);

            // anime-style impact flash
            const flashMat = new THREE.SpriteMaterial({ map: flashTex, transparent: true, depthWrite: false, opacity: 0, blending: THREE.AdditiveBlending });
            const flash = new THREE.Sprite(flashMat);
            flash.scale.set(halfW * 2.6, panelH * 1.9, 1);
            flash.position.set(0, panelH / 2, z + 0.08);
            this.scene.add(flash);

            // radiating speed-line burst
            const speedMat = new THREE.SpriteMaterial({ map: speedTex, transparent: true, depthWrite: false, opacity: 0, blending: THREE.AdditiveBlending });
            const speedSprite = new THREE.Sprite(speedMat);
            const speedBaseScale = panelH * 1.4;
            speedSprite.scale.set(speedBaseScale, speedBaseScale, 1);
            speedSprite.position.set(0, panelH / 2, z + 0.06);
            this.scene.add(speedSprite);

            const stationIndex = STATION_IDS.indexOf(def.target.slice(1));
            const doorEntry = { type: 'door', doorIndex: doorIdx, stationIndex };
            [lintel, leftPanel, rightPanel].forEach((mesh) => {
                this.interactive.push({ mesh, ...doorEntry });
                this.hoverables.push(mesh);
            });

            this.doors.push({
                z, leftPivot, rightPivot,
                burst, burstMat, dust, dustMat, slash, slashMat,
                flash, flashMat, speedSprite, speedMat, speedBaseScale,
            });
        });
    }

    // Wall- and post-mounted torches: flank every gate, plus a few along the
    // bare corridor stretches, for a fire-lit, lived-in old-corridor feel.
    _buildTorches() {
        const flameTex = this.makeFlameTexture();
        const postMat = this.toonMat(PALETTE.wood);
        const bowlMat = this.toonMat(PALETTE.gate);
        this.torches = [];

        const place = (x, z, scale = 1) => {
            const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06 * scale, 0.08 * scale, 1.5 * scale, 8), postMat);
            post.position.set(x, 0.75 * scale, z);
            this.scene.add(post);
            this.addOutline(post, 1.05);

            const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.16 * scale, 0.1 * scale, 0.18 * scale, 8), bowlMat);
            bowl.position.set(x, 1.5 * scale, z);
            this.scene.add(bowl);

            const flameMat = new THREE.SpriteMaterial({ map: flameTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
            const flame = new THREE.Sprite(flameMat);
            const fw = 0.7 * scale, fh = 1.05 * scale;
            flame.scale.set(fw, fh, 1);
            flame.position.set(x, 1.5 * scale + fh * 0.32, z);
            this.scene.add(flame);

            const light = new THREE.PointLight(PALETTE.flame, 1.0, 7, 2);
            light.position.set(x, 1.7 * scale, z);
            this.scene.add(light);

            this.torches.push({ flame, light, baseScaleX: fw, baseScaleY: fh, offset: Math.random() * Math.PI * 2 });
        };

        DOOR_DEFS.forEach((def) => {
            place(-4.6, def.z + 0.4);
            place(4.6, def.z + 0.4);
        });
        // extra wall torches along the bare corridor stretches between gates
        [[-4.7, 18], [4.7, -1], [-4.7, -17]].forEach(([x, z]) => place(x, z, 0.85));
    }

    _buildSwordRack() {
        // generic nichirin-style blade: tapered body + hamon temper-line + glowing core + tsuba/handle
        const hamonTex = this.makeHamonTexture();
        const bladeMat = new THREE.MeshStandardMaterial({ map: hamonTex, roughness: 0.4, metalness: 0.2 });
        const coreMat = new THREE.MeshStandardMaterial({ color: PALETTE.edge, emissive: PALETTE.edge, emissiveIntensity: 0.85 });
        const fittingMat = this.toonMat(PALETTE.gate);
        const positions = [
            { y: 1.3, z: 4 }, { y: 1.7, z: 2 }, { y: 2.1, z: 0 }, { y: 2.5, z: -2 }, { y: 2.9, z: -4 },
        ];
        positions.forEach((p, i) => {
            const group = new THREE.Group();
            const bladeLen = 1.5;

            const body = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.12, bladeLen), bladeMat);
            const tip = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.22, 4), bladeMat);
            tip.rotation.x = Math.PI / 2;
            tip.rotation.y = Math.PI / 4;
            tip.position.z = -bladeLen / 2 - 0.09;

            const core = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.045, bladeLen * 0.9), coreMat);
            core.position.y = 0.025;

            const tsuba = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.025, 10), fittingMat);
            tsuba.rotation.x = Math.PI / 2;
            tsuba.position.z = bladeLen / 2 + 0.02;

            const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.4, 8), fittingMat);
            handle.rotation.x = Math.PI / 2;
            handle.position.z = bladeLen / 2 + 0.02 + 0.21;

            group.add(body, tip, core, tsuba, handle);
            group.position.set(-4.82, p.y, p.z);
            group.rotation.z = (i % 2 === 0 ? 1 : -1) * 0.04;
            this.scene.add(group);
            this.addOutline(body, 1.18);
        });
    }

    _buildSkyline() {
        // machiya-style silhouettes: square body + pyramidal hip roof, generic traditional-town look
        const buildingMat = this.toonMat(PALETTE.building);
        const roofMat = this.toonMat(PALETTE.door);
        for (let i = 0; i < 10; i++) {
            const h = 2.5 + Math.random() * 6;
            const w = 1.2 + Math.random() * 1.6;
            const x = (Math.random() - 0.5) * 18;
            const z = -49 - Math.random() * 8;

            const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), buildingMat);
            b.position.set(x, h / 2, z);
            this.scene.add(b);

            const roofH = h * 0.22;
            const roof = new THREE.Mesh(new THREE.ConeGeometry(w * 0.78, roofH, 4), roofMat);
            roof.rotation.y = Math.PI / 4;
            roof.position.set(x, h + roofH / 2, z);
            this.scene.add(roof);
        }
    }

    _buildToriiGate() {
        const gateMat = this.toonMat(PALETTE.gate);
        const group = new THREE.Group();
        [-2.4, 2.4].forEach((x) => {
            const post = new THREE.Mesh(new THREE.BoxGeometry(0.3, 4.2, 0.3), gateMat);
            post.position.set(x, 2.1, -44);
            group.add(post);
            this.addOutline(post);
        });
        const lintel = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.3, 0.3), gateMat);
        lintel.position.set(0, 4.3, -44);
        group.add(lintel);
        this.addOutline(lintel);
        const subLintel = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.2, 0.2), gateMat);
        subLintel.position.set(0, 3.9, -44.15);
        group.add(subLintel);
        this.scene.add(group);

        const lanternGeo = new THREE.SphereGeometry(0.22, 12, 12);
        const lanternMat = new THREE.MeshStandardMaterial({ color: PALETTE.edge, emissive: PALETTE.edge, emissiveIntensity: 0.9 });
        this.lantern = new THREE.Mesh(lanternGeo, lanternMat);
        this.lantern.position.set(1.6, 2.6, -41);
        this.scene.add(this.lantern);

        const lanternLight = new THREE.PointLight(0xff5544, 1.1, 9, 2);
        lanternLight.position.copy(this.lantern.position);
        this.scene.add(lanternLight);
        this.lanternLight = lanternLight;
    }

    _loadCharacterArt() {
        // Message crows — drifting near the misty pier (original folklore-style messenger-crow art)
        this.crows = [];
        this.texLoader.load('assets/art/message_crow.png', (tex) => {
            if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
            const crowDefs = [
                { x: -2.6, y: 4.4, z: -33, scale: 1.5, speed: 0.0007, offset: 0 },
                { x: 2.2, y: 5.0, z: -40, scale: 1.1, speed: 0.0009, offset: 2.1 },
                { x: -0.6, y: 3.6, z: -47, scale: 1.3, speed: 0.0006, offset: 4.2 },
            ];
            crowDefs.forEach((c) => {
                const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
                const sprite = new THREE.Sprite(mat);
                const w = c.scale * 1.6, h = w * (600 / 900);
                sprite.scale.set(w, h, 1);
                sprite.position.set(c.x, c.y, c.z);
                this.scene.add(sprite);
                this.crows.push({ sprite, baseX: c.x, baseY: c.y, speed: c.speed, offset: c.offset });
            });
        });
    }

    _loadPosters() {
        this.banners = [];
        const poleMat = new THREE.MeshBasicMaterial({ color: PALETTE.edge });
        POSTERS.forEach((p, i) => {
            this.texLoader.load(p.src, (tex) => {
                if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
                const width = 3.6;
                const height = width / p.aspect;
                const side = i % 2 === 0 ? -1 : 1;

                const frame = new THREE.Mesh(
                    new THREE.PlaneGeometry(width + 0.22, height + 0.22),
                    new THREE.MeshBasicMaterial({ color: PALETTE.edge, side: THREE.DoubleSide })
                );
                const poster = new THREE.Mesh(
                    new THREE.PlaneGeometry(width, height),
                    new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide })
                );
                poster.position.z = side * 0.01;

                // hanging-banner treatment: pole along the top edge + short tassel cords
                const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, width + 0.5, 8), poleMat);
                pole.rotation.z = Math.PI / 2;
                pole.position.set(0, height / 2 + 0.35, 0);
                const cords = [-width / 2 + 0.15, width / 2 - 0.15].map((cx) => {
                    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.3, 6), poleMat);
                    cord.position.set(cx, height / 2 + 0.18, 0);
                    return cord;
                });

                const group = new THREE.Group();
                group.add(frame, poster, pole, ...cords);
                group.position.set(side * 4.85, 2.1, p.z);
                group.rotation.y = Math.PI / 2;
                this.scene.add(group);
                this.banners.push({ group, offset: i * 0.6 });

                this.interactive.push({ mesh: poster, type: 'poster', target: p.target });
                this.interactive.push({ mesh: frame, type: 'poster', target: p.target });
                this.hoverables.push(poster, frame);
            });
        });
    }

    /* ---------------- misty pier reskin (around the torii-gate finale) ---------------- */

    _makePlankTexture() {
        const w = 256, h = 512;
        const cnv = document.createElement('canvas');
        cnv.width = w; cnv.height = h;
        const ctx = cnv.getContext('2d');
        ctx.fillStyle = '#1c1712';
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = 'rgba(0,0,0,0.45)';
        ctx.lineWidth = 2;
        for (let y = 0; y < h; y += 28) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }
        ctx.strokeStyle = 'rgba(80,65,50,0.25)';
        for (let i = 0; i < 40; i++) {
            ctx.beginPath();
            const x = Math.random() * w;
            ctx.moveTo(x, 0);
            ctx.lineTo(x + (Math.random() - 0.5) * 10, h);
            ctx.stroke();
        }
        const tex = new THREE.CanvasTexture(cnv);
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(2, 4);
        tex.needsUpdate = true;
        return tex;
    }

    _buildPier() {
        const plankTex = this._makePlankTexture();
        const plankMat = new THREE.MeshBasicMaterial({ map: plankTex });
        const plank = new THREE.Mesh(new THREE.PlaneGeometry(9.4, 22), plankMat);
        plank.rotation.x = -Math.PI / 2;
        plank.position.set(0, 0.01, -40);
        this.scene.add(plank);

        const pagodaMat = this.toonMat(PALETTE.building);
        for (let i = 0; i < 3; i++) {
            const w = 2.2 - i * 0.4;
            const h = 0.7;
            const tier = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), pagodaMat);
            tier.position.set(-5.5, 6 + i * h, -54);
            this.scene.add(tier);
        }
        const spire = new THREE.Mesh(new THREE.ConeGeometry(0.15, 1.2, 6), pagodaMat);
        spire.position.set(-5.5, 8.7, -54);
        this.scene.add(spire);

        const postMat = this.toonMat(PALETTE.gate);
        [[-3, -36], [3, -36]].forEach(([x, z]) => {
            const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 2.2, 8), postMat);
            post.position.set(x, 1.1, z);
            this.scene.add(post);
            this.addOutline(post, 1.05);

            const lanternMat = new THREE.MeshStandardMaterial({ color: PALETTE.edge, emissive: PALETTE.edge, emissiveIntensity: 0.8 });
            const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 10), lanternMat);
            lantern.position.set(x, 2.35, z);
            this.scene.add(lantern);
            const light = new THREE.PointLight(0xff5544, 0.7, 6, 2);
            light.position.copy(lantern.position);
            this.scene.add(light);
        });
    }

    _buildClouds() {
        const cloudTex = this.makeRadialTexture('rgba(236,232,223,0.85)');
        this.clouds = [];
        for (let i = 0; i < 14; i++) {
            const mat = new THREE.SpriteMaterial({ map: cloudTex, transparent: true, opacity: 0.35 + Math.random() * 0.35, depthWrite: false });
            const sprite = new THREE.Sprite(mat);
            const scale = 2.5 + Math.random() * 3.5;
            sprite.scale.set(scale, scale, 1);
            sprite.position.set((Math.random() - 0.5) * 14, 0.3 + Math.random() * 4.2, 20 + Math.random() * 18);
            this.scene.add(sprite);
            this.clouds.push({ sprite, speed: 0.05 + Math.random() * 0.08, offset: Math.random() * Math.PI * 2 });
        }
    }

    /* ---------------- particle systems ---------------- */

    _buildParticles() {
        const emberTex = this.makeRadialTexture('rgba(239,68,68,0.95)');
        const mistTex = this.makeRadialTexture('rgba(236,232,223,0.7)');

        this.embers = this._makeParticles(280, emberTex, 0.18, { yMin: 0, yMax: 6.4, zMin: -50, zMax: 34, xMin: -6.5, xMax: 6.5 });
        this.mist = this._makeParticles(150, mistTex, 0.55, { yMin: 0, yMax: 0.9, zMin: -50, zMax: 34, xMin: -6.5, xMax: 6.5 });
    }

    _makeParticles(count, texture, size, bounds) {
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            positions[i * 3] = bounds.xMin + Math.random() * (bounds.xMax - bounds.xMin);
            positions[i * 3 + 1] = bounds.yMin + Math.random() * (bounds.yMax - bounds.yMin);
            positions[i * 3 + 2] = bounds.zMin + Math.random() * (bounds.zMax - bounds.zMin);
        }
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const material = new THREE.PointsMaterial({
            map: texture, size, transparent: true, depthWrite: false, sizeAttenuation: true,
        });
        const points = new THREE.Points(geometry, material);
        this.scene.add(points);
        return { points, bounds };
    }

    _updateParticles(dt, time) {
        if (this.embers) {
            const pos = this.embers.points.geometry.attributes.position;
            const { yMin, yMax } = this.embers.bounds;
            for (let i = 0; i < pos.count; i++) {
                let y = pos.getY(i) + dt * 0.5;
                if (y > yMax) y = yMin;
                pos.setY(i, y);
                const x = pos.getX(i) + Math.sin(time * 0.0006 + i) * 0.0025;
                pos.setX(i, x);
            }
            pos.needsUpdate = true;
        }
        if (this.mist) {
            const pos = this.mist.points.geometry.attributes.position;
            const { xMin, xMax } = this.mist.bounds;
            for (let i = 0; i < pos.count; i++) {
                let x = pos.getX(i) + dt * 0.15;
                if (x > xMax) x = xMin;
                pos.setX(i, x);
            }
            pos.needsUpdate = true;
        }
        if (this.clouds) {
            this.clouds.forEach((c) => {
                c.sprite.position.x += Math.sin(time * 0.0003 + c.offset) * 0.002;
            });
        }
    }

    /* ---------------- interactivity (raycast clicks on doors / posters) ---------------- */

    _wireInteractivity() {
        window.addEventListener('click', (e) => this._handlePointer(e, true));
        let hoverPending = false;
        window.addEventListener('mousemove', (e) => {
            if (hoverPending) return;
            hoverPending = true;
            requestAnimationFrame(() => {
                this._handlePointer(e, false);
                hoverPending = false;
            });
        });
    }

    _handlePointer(e, isClick) {
        if (!this.interactive.length) return;
        this.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
        this.pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
        this.raycaster.setFromCamera(this.pointer, this.camera);
        const meshes = this.hoverables.length ? this.hoverables : this.interactive.map((i) => i.mesh);
        const hits = this.raycaster.intersectObjects(meshes, false);

        if (!isClick) {
            document.body.style.cursor = hits.length ? 'pointer' : '';
            return;
        }
        if (!hits.length) return;
        const entry = this.interactive.find((i) => i.mesh === hits[0].object);
        if (!entry) return;

        if (entry.type === 'door') {
            if (this.currentIndex === entry.stationIndex - 1) this.goToStation(entry.stationIndex);
        } else if (entry.type === 'poster') {
            this._goToMissionsAndScroll(entry.target);
        }
    }

    _goToMissionsAndScroll(target) {
        const missionsIndex = STATION_IDS.indexOf('missions');
        if (this.currentIndex === missionsIndex) {
            const el = document.querySelector(target);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            this.pendingScrollTarget = target;
            this.goToStation(missionsIndex);
        }
    }

    /* ---------------- click-through-gates station navigation ---------------- */

    _initStations() {
        this.stations = STATION_IDS.map((id) => ({ id, el: document.getElementById(id), wp: ZONE_WAYPOINTS[id] }));
        this.currentIndex = 0;
        this.doorOpen = new Array(this.doors ? this.doors.length : 0).fill(0);
        this.tween = null;
        this._activeDoorIndices = [];
        this._tweenProgress = 0;
        this.pendingScrollTarget = null;

        const hero = this.stations[0].wp;
        this.camera.position.set(...hero.pos);
        this.camera.lookAt(new THREE.Vector3(...hero.look));
        this._activateStationPanel(0);
    }

    goToStation(targetIndex) {
        if (!this.stations) return;
        targetIndex = clamp(targetIndex, 0, this.stations.length - 1);
        if (this.tween || targetIndex === this.currentIndex) return;

        const fromIdx = this.currentIndex;
        const dir = targetIndex > fromIdx ? 1 : -1;
        const lo = Math.min(fromIdx, targetIndex), hi = Math.max(fromIdx, targetIndex);
        const doorIndices = [];
        for (let s = lo; s < hi; s++) {
            const di = s - 1;
            if (di >= 0 && di < this.doors.length) {
                if (dir === 1 && this.doorOpen[di] !== 1) doorIndices.push(di);
                this.doorOpen[di] = 1;
            }
        }

        qsa('.zone').forEach((z) => z.classList.remove('station-active'));

        const fromWp = this.stations[fromIdx].wp;
        const toWp = this.stations[targetIndex].wp;
        this.tween = {
            start: performance.now(),
            duration: 1300,
            fromPos: new THREE.Vector3(...fromWp.pos),
            toPos: new THREE.Vector3(...toWp.pos),
            fromLook: new THREE.Vector3(...fromWp.look),
            toLook: new THREE.Vector3(...toWp.look),
            targetIndex,
        };
        this._activeDoorIndices = doorIndices;
    }

    _activateStationPanel(idx) {
        const station = this.stations[idx];
        if (!station) return;
        qsa('.zone').forEach((z) => z.classList.remove('station-active'));
        if (station.el) {
            station.el.classList.add('station-active');
            qsa('.fade-in', station.el).forEach((el, i) => {
                el.classList.remove('fade-in-visible');
                setTimeout(() => el.classList.add('fade-in-visible'), i * 90);
            });
            const rank = station.el.getAttribute('data-rank');
            if (rank) showRankToast(rank);
        }
        qsa('.nav-links a').forEach((a) => {
            a.classList.toggle('active', a.getAttribute('href') === `#${station.id}`);
        });

        const gateNav = qs('#gate-nav');
        const backBtn = qs('#gate-back');
        const hintBtn = qs('#gate-hint');
        if (gateNav) gateNav.classList.toggle('hidden', idx === 0);
        if (backBtn) backBtn.disabled = idx === 0;
        if (hintBtn) {
            const atEnd = idx === this.stations.length - 1;
            hintBtn.disabled = atEnd;
            hintBtn.textContent = atEnd ? "Journey's end — Send Word" : 'Click the gate ahead to continue';
        }

        if (this.pendingScrollTarget) {
            const target = this.pendingScrollTarget;
            this.pendingScrollTarget = null;
            requestAnimationFrame(() => {
                const el = document.querySelector(target);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        }
    }

    _updateCameraTween(time) {
        if (!this.tween) return;
        const elapsed = time - this.tween.start;
        const raw = clamp(elapsed / this.tween.duration, 0, 1);
        const eased = smoothstep(raw);
        this._tweenProgress = eased;

        const pos = this.tween.fromPos.clone().lerp(this.tween.toPos, eased);
        const look = this.tween.fromLook.clone().lerp(this.tween.toLook, eased);
        this.camera.position.copy(pos);
        this.camera.lookAt(look);

        if (raw >= 1) {
            const targetIndex = this.tween.targetIndex;
            this.tween = null;
            this._activeDoorIndices = [];
            this._tweenProgress = 0;
            this.currentIndex = targetIndex;
            this._activateStationPanel(targetIndex);
        }
    }

    /* ---------------- door swing + ember/slash burst, driven by camera-tween progress ---------------- */

    _updateDoorEffects() {
        this.doorShake = 0;
        if (!this.doors) return;
        const maxAngle = (Math.PI / 2) * 0.86;
        const activeSet = this._activeDoorIndices || [];
        const t = this._tweenProgress || 0;

        this.doors.forEach((door, idx) => {
            const isOpen = this.doorOpen[idx] === 1;
            const isAnimating = activeSet.includes(idx);
            const windowT = isAnimating ? t : (isOpen ? 1 : 0);
            const openAmt = isAnimating ? clamp(easeOutBack(windowT), -0.18, 1.18) : (isOpen ? 1 : 0);
            door.leftPivot.rotation.y = maxAngle * openAmt;
            door.rightPivot.rotation.y = -maxAngle * openAmt;

            if (!isAnimating) {
                door.burstMat.opacity = 0;
                door.slashMat.opacity = 0;
                if (door.dustMat) door.dustMat.opacity = 0;
                if (door.flashMat) door.flashMat.opacity = 0;
                if (door.speedMat) door.speedMat.opacity = 0;
                return;
            }

            const burstShape = Math.pow(Math.max(0, Math.sin(windowT * Math.PI)), 1.6);
            door.burstMat.opacity = burstShape * 0.9;
            door.slashMat.opacity = burstShape * 0.9;
            if (door.dustMat) door.dustMat.opacity = burstShape * 0.5;

            const flashShape = Math.pow(Math.max(0, 1 - Math.abs(windowT - 0.55) * 2.4), 5);
            if (door.flashMat) door.flashMat.opacity = flashShape * 0.85;
            if (door.speedSprite) {
                const speedScale = 1 + flashShape * 2.6 + burstShape * 0.6;
                door.speedSprite.scale.set(door.speedBaseScale * speedScale, door.speedBaseScale * speedScale, 1);
                door.speedMat.opacity = flashShape * 0.9;
            }
            this.doorShake = Math.max(this.doorShake, flashShape);

            if (burstShape > 0.02) {
                const posAttr = door.burst.geometry.attributes.position;
                for (let p = 0; p < posAttr.count; p++) posAttr.setY(p, posAttr.getY(p) + 0.012);
                posAttr.needsUpdate = true;
            }
            if (door.dust && burstShape > 0.02) {
                const dustAttr = door.dust.geometry.attributes.position;
                for (let p = 0; p < dustAttr.count; p++) {
                    dustAttr.setX(p, dustAttr.getX(p) + (Math.random() - 0.5) * 0.025);
                    dustAttr.setY(p, Math.max(0, dustAttr.getY(p) + (Math.random() - 0.3) * 0.01));
                }
                dustAttr.needsUpdate = true;
            }
        });
    }

    /* ---------------- resize + render loop ---------------- */

    _wireResize() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    _animate(time) {
        requestAnimationFrame((t) => this._animate(t));
        const dt = Math.min((time - this.clock.lastTime) / 1000, 0.1) || 0;
        this.clock.lastTime = time;

        this._updateCameraTween(time);
        this._updateDoorEffects();
        if (this.doorShake > 0.015) {
            const shakeAmt = this.doorShake * 0.16;
            this.camera.position.x += (Math.random() - 0.5) * shakeAmt;
            this.camera.position.y += (Math.random() - 0.5) * shakeAmt * 0.6;
            this.camera.fov = 55 + this.doorShake * 2.5;
            this.camera.updateProjectionMatrix();
        } else if (this.camera.fov !== 55) {
            this.camera.fov = 55;
            this.camera.updateProjectionMatrix();
        }
        this._updateParticles(dt, time);

        if (this.lantern) {
            const pulse = 0.7 + 0.4 * Math.sin(time * 0.0025);
            this.lantern.material.emissiveIntensity = pulse;
            if (this.lanternLight) this.lanternLight.intensity = 0.8 + 0.5 * pulse;
        }
        if (this.torches) {
            this.torches.forEach((tch) => {
                const flicker = 0.85 + 0.25 * Math.sin(time * 0.01 + tch.offset) + 0.1 * Math.sin(time * 0.037 + tch.offset * 2);
                const bob = 0.9 + 0.15 * Math.sin(time * 0.018 + tch.offset);
                tch.flame.scale.set(tch.baseScaleX * flicker, tch.baseScaleY * bob, 1);
                tch.light.intensity = 0.85 * flicker;
            });
        }
        if (this.crows) {
            this.crows.forEach((c) => {
                c.sprite.position.x = c.baseX + Math.sin(time * c.speed + c.offset) * 1.1;
                c.sprite.position.y = c.baseY + Math.cos(time * c.speed * 1.3 + c.offset) * 0.35;
                c.sprite.material.rotation = Math.sin(time * c.speed + c.offset) * 0.18;
            });
        }
        if (this.banners) {
            this.banners.forEach((b) => {
                b.group.rotation.z = Math.sin(time * 0.0005 + b.offset) * 0.025;
            });
        }

        this.renderer.render(this.scene, this.camera);
    }
}

/* =========================================================================
   Boot
   ========================================================================= */

function boot() {
    const canvas = qs('#scene');
    const loadingScreen = qs('#loading-screen');
    const loadingBar = qs('#loading-bar-fill');

    let engine = null;
    if (canvas) {
        engine = new CorridorEngine(canvas, { screen: loadingScreen, bar: loadingBar });
    } else if (loadingScreen) {
        loadingScreen.classList.add('loaded');
    }

    initUI(engine);
}

boot();
