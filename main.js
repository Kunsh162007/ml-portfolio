/* =========================================================================
   Kunsh Agrawal — Corps Dossier
   main.js — Three.js corridor-walkthrough engine + ported site UI logic.

   Architecture: a single fixed full-viewport WebGL canvas renders ONLY the
   3D environment (corridor, doors, gallery wall, sword rack, clouds,
   particles, original silhouette art). All real text/content stays in
   normal 2D HTML above the canvas. Camera position is driven purely by
   page scroll position, read every animation frame.
   ========================================================================= */

import * as THREE from './vendor/three.module.js';

/* -------------------------------------------------------------------------
   Small utilities
   ------------------------------------------------------------------------- */

const qs = (sel, root = document) => root.querySelector(sel);
const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

/* =========================================================================
   PART 1 — Ported 2D site UI (nav, filters, fade-ins, README modal)
   ========================================================================= */

function initUI() {
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

    // Sticky nav background
    const navEl = qs('.corps-nav');
    if (navEl) {
        window.addEventListener('scroll', () => {
            navEl.classList.toggle('scrolled', window.scrollY > 50);
        }, { passive: true });
    }

    // Scrollspy — highlight active nav link
    const navLinkEls = qsa('.nav-links a');
    const spy = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                navLinkEls.forEach((a) => {
                    a.classList.toggle('active', a.getAttribute('href') === `#${id}`);
                });
            }
        });
    }, { rootMargin: '-45% 0px -50% 0px' });
    qsa('.zone[id]').forEach((s) => spy.observe(s));

    // Staggered fade-in reveal
    const fadeObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => entry.target.classList.add('fade-in-visible'), index * 100);
                fadeObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    qsa('.fade-in').forEach((el) => fadeObserver.observe(el));

    // Scroll indicator auto-hide
    const scrollIndicator = qs('.scroll-indicator');
    if (scrollIndicator) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 80) {
                scrollIndicator.style.opacity = '0';
                scrollIndicator.style.pointerEvents = 'none';
            } else {
                scrollIndicator.style.opacity = '';
                scrollIndicator.style.pointerEvents = '';
            }
        }, { passive: true });
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

    // Rank-up toast — fires once per zone the first time it enters view
    const toastEl = qs('#rank-toast');
    let toastTimer = null;
    function showRankToast(text) {
        if (!toastEl) return;
        toastEl.textContent = text;
        toastEl.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toastEl.classList.remove('show'), 3200);
    }
    const rankObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const rank = entry.target.getAttribute('data-rank');
                if (rank) showRankToast(rank);
                rankObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.35 });
    qsa('.zone[data-rank]').forEach((z) => rankObserver.observe(z));

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
   PART 2 — Three.js corridor-walkthrough engine
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

// Door thresholds sit at the midpoints between adjacent zone camera waypoints
// (corridor/dojo, dojo/missions, missions/sendword) so each door swings open
// exactly as the scroll-driven camera crosses that threshold.
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
        this.breakpoints = [];
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

        this.buildBreakpoints();
        window.addEventListener('load', () => this.buildBreakpoints());

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

    /* ---------------- procedural sprite textures (no external assets) ---------------- */

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
        this._buildSwordRack();
        this._buildSkyline();
        this._buildToriiGate();
        this._buildPier();
        this._loadCharacterArt();
        this._loadPosters();
        this._buildClouds();
    }

    makeSlashTexture() {
        const size = 128;
        const cnv = document.createElement('canvas');
        cnv.width = cnv.height = size;
        const ctx = cnv.getContext('2d');
        ctx.translate(size / 2, size / 2);
        ctx.rotate(-Math.PI / 5);
        ctx.translate(-size / 2, -size / 2);
        const grad = ctx.createLinearGradient(0, size * 0.4, size, size * 0.6);
        grad.addColorStop(0, 'rgba(239,68,68,0)');
        grad.addColorStop(0.5, 'rgba(239,68,68,0.95)');
        grad.addColorStop(1, 'rgba(239,68,68,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, size * 0.32, size, size * 0.36);
        const tex = new THREE.CanvasTexture(cnv);
        tex.needsUpdate = true;
        return tex;
    }

    _buildDoors() {
        const doorMat = this.toonMat(PALETTE.door);
        const trimMat = new THREE.MeshBasicMaterial({ color: PALETTE.edge });
        const emberTex = this.makeRadialTexture('rgba(239,68,68,0.95)');
        const slashTex = this.makeSlashTexture();

        const halfW = 4.2;
        const panelH = 3.1;

        this.doors = [];

        DOOR_DEFS.forEach((def) => {
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

            const leftPivot = new THREE.Group();
            leftPivot.position.set(-halfW, panelH / 2, z);
            const leftPanel = new THREE.Mesh(new THREE.BoxGeometry(halfW, panelH, 0.12), doorMat);
            leftPanel.position.set(halfW / 2, 0, 0);
            leftPivot.add(leftPanel);
            this.addOutline(leftPanel, 1.03);
            group.add(leftPivot);

            const rightPivot = new THREE.Group();
            rightPivot.position.set(halfW, panelH / 2, z);
            const rightPanel = new THREE.Mesh(new THREE.BoxGeometry(halfW, panelH, 0.12), doorMat);
            rightPanel.position.set(-halfW / 2, 0, 0);
            rightPivot.add(rightPanel);
            this.addOutline(rightPanel, 1.03);
            group.add(rightPivot);

            this.scene.add(group);

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

            const slashMat = new THREE.SpriteMaterial({ map: slashTex, transparent: true, depthWrite: false, opacity: 0 });
            const slash = new THREE.Sprite(slashMat);
            slash.scale.set(halfW * 2.2, panelH * 1.1, 1);
            slash.position.set(0, panelH / 2, z + 0.05);
            this.scene.add(slash);

            this.interactive.push({ mesh: lintel, target: def.target });
            this.hoverables.push(lintel);

            this.doors.push({ z, leftPivot, rightPivot, burst, burstMat, slash, slashMat });
        });
    }

    _buildSwordRack() {
        const bladeMat = this.toonMat(PALETTE.blade);
        const edgeMat = new THREE.MeshBasicMaterial({ color: PALETTE.edge });
        const positions = [
            { y: 1.3, z: 4 }, { y: 1.7, z: 2 }, { y: 2.1, z: 0 }, { y: 2.5, z: -2 }, { y: 2.9, z: -4 },
        ];
        positions.forEach((p, i) => {
            const group = new THREE.Group();
            const blade = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.12, 2.0), bladeMat);
            const edge = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.03, 2.0), edgeMat);
            edge.position.y = 0.07;
            group.add(blade, edge);
            group.position.set(-4.82, p.y, p.z);
            group.rotation.z = (i % 2 === 0 ? 1 : -1) * 0.04;
            this.scene.add(group);
            this.addOutline(blade, 1.15);
        });
    }

    _buildSkyline() {
        const buildingMat = this.toonMat(PALETTE.building);
        for (let i = 0; i < 10; i++) {
            const h = 2.5 + Math.random() * 6;
            const w = 1.2 + Math.random() * 1.6;
            const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), buildingMat);
            b.position.set((Math.random() - 0.5) * 18, h / 2, -49 - Math.random() * 8);
            this.scene.add(b);
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
        // Seated hunter — hero cloud platform (original silhouette art, not copyrighted character art)
        this.texLoader.load('assets/art/hunter_sitting.png', (tex) => {
            if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
            const w = 4.0, h = 4.0;
            const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
            sprite.scale.set(w, h, 1);
            sprite.position.set(0, h / 2, 24);
            this.scene.add(sprite);
            this.heroSprite = sprite;
            this._heroBaseY = h / 2;
        });

        // Standing guardian — corridor, beside the left door
        this.texLoader.load('assets/art/hunter_stance.png', (tex) => {
            if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
            const w = 3.0, h = 3.0 * (1200 / 760);
            const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
            sprite.scale.set(w, h, 1);
            sprite.position.set(-3.6, h / 2, 12.5);
            this.scene.add(sprite);
        });

        // Guardian mask — hung on the corridor wall
        this.texLoader.load('assets/art/guardian_mask.png', (tex) => {
            if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
            const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
            sprite.scale.set(1.8, 1.8, 1);
            sprite.position.set(4.5, 3.6, 14);
            this.scene.add(sprite);
            this.maskSprite = sprite;
        });

        // Blade guardian — beside the dojo -> missions door threshold (original silhouette art)
        this.texLoader.load('assets/art/blade_guardian.png', (tex) => {
            if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
            const w = 3.2, h = w * (1000 / 800);
            const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
            sprite.scale.set(w, h, 1);
            sprite.position.set(-3.3, h / 2, -7.2);
            this.scene.add(sprite);
        });

        // Lantern keeper — beside the missions -> sendword door threshold (original silhouette art)
        this.texLoader.load('assets/art/lantern_keeper.png', (tex) => {
            if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
            const w = 2.6, h = w * (1100 / 700);
            const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
            sprite.scale.set(w, h, 1);
            sprite.position.set(3.4, h / 2, -25.8);
            this.scene.add(sprite);
        });

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

                this.interactive.push({ mesh: poster, target: p.target });
                this.interactive.push({ mesh: frame, target: p.target });
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
        if (hits.length) {
            const entry = this.interactive.find((i) => i.mesh === hits[0].object);
            if (entry) {
                const el = document.querySelector(entry.target);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    }

    /* ---------------- scroll-driven camera path ---------------- */

    buildBreakpoints() {
        const zones = qsa('.zone[data-zone]');
        if (!zones.length) return;
        const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
        this.breakpoints = zones
            .map((z) => {
                const key = z.getAttribute('data-zone');
                const wp = ZONE_WAYPOINTS[key] || ZONE_WAYPOINTS.hero;
                return {
                    t: clamp(z.offsetTop / maxScroll, 0, 1),
                    pos: new THREE.Vector3(...wp.pos),
                    look: new THREE.Vector3(...wp.look),
                };
            })
            .sort((a, b) => a.t - b.t);

        // Door thresholds: midpoints between (corridor,dojo), (dojo,missions), (missions,sendword) —
        // i.e. breakpoint pairs (1,2), (2,3), (3,4) given the 5-zone order [hero,corridor,dojo,missions,sendword].
        this.doorThresholds = [];
        for (let i = 1; i + 1 < this.breakpoints.length; i++) {
            this.doorThresholds.push((this.breakpoints[i].t + this.breakpoints[i + 1].t) / 2);
        }
    }

    updateCamera() {
        if (!this.breakpoints.length) return;
        const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
        const t = clamp(window.scrollY / maxScroll, 0, 1);
        this.scrollT = t;

        let i = 0;
        while (i < this.breakpoints.length - 1 && this.breakpoints[i + 1].t <= t) i++;
        const a = this.breakpoints[i];
        const b = this.breakpoints[Math.min(i + 1, this.breakpoints.length - 1)];

        let localT = 0;
        if (b.t > a.t) localT = clamp((t - a.t) / (b.t - a.t), 0, 1);
        const eased = localT * localT * (3 - 2 * localT);

        const pos = a.pos.clone().lerp(b.pos, eased);
        const look = a.look.clone().lerp(b.look, eased);
        this.camera.position.copy(pos);
        this.camera.lookAt(look);
    }

    /* ---------------- door swing + ember/slash burst, driven by scroll ---------------- */

    _updateDoors() {
        if (!this.doors || !this.doorThresholds || !this.doorThresholds.length) return;
        const t = this.scrollT || 0;
        const halfWidth = 0.05;
        const maxAngle = (Math.PI / 2) * 0.82;

        this.doors.forEach((door, i) => {
            const dt = this.doorThresholds[i];
            if (dt === undefined) return;
            const edge0 = dt - halfWidth;
            const edge1 = dt + halfWidth;

            const windowT = clamp((t - edge0) / (edge1 - edge0), 0, 1);
            const openAmt = windowT * windowT * (3 - 2 * windowT);
            door.leftPivot.rotation.y = maxAngle * openAmt;
            door.rightPivot.rotation.y = -maxAngle * openAmt;

            const burstOpacity = Math.sin(windowT * Math.PI);
            door.burstMat.opacity = Math.max(0, burstOpacity) * 0.9;
            door.slashMat.opacity = Math.max(0, burstOpacity) * 0.85;

            if (burstOpacity > 0.02) {
                const posAttr = door.burst.geometry.attributes.position;
                for (let p = 0; p < posAttr.count; p++) {
                    posAttr.setY(p, posAttr.getY(p) + 0.012);
                }
                posAttr.needsUpdate = true;
            }
        });
    }

    /* ---------------- resize + render loop ---------------- */

    _wireResize() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.buildBreakpoints();
        });
    }

    _animate(time) {
        requestAnimationFrame((t) => this._animate(t));
        const dt = Math.min((time - this.clock.lastTime) / 1000, 0.1) || 0;
        this.clock.lastTime = time;

        this.updateCamera();
        this._updateDoors();
        this._updateParticles(dt, time);

        if (this.heroSprite) {
            this.heroSprite.position.y = this._heroBaseY + Math.sin(time * 0.0006) * 0.08;
        }
        if (this.maskSprite) {
            this.maskSprite.material.rotation = Math.sin(time * 0.0004) * 0.05;
        }
        if (this.lantern) {
            const pulse = 0.7 + 0.4 * Math.sin(time * 0.0025);
            this.lantern.material.emissiveIntensity = pulse;
            if (this.lanternLight) this.lanternLight.intensity = 0.8 + 0.5 * pulse;
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
    initUI();

    const canvas = qs('#scene');
    const loadingScreen = qs('#loading-screen');
    const loadingBar = qs('#loading-bar-fill');

    if (canvas) {
        new CorridorEngine(canvas, { screen: loadingScreen, bar: loadingBar });
    } else if (loadingScreen) {
        loadingScreen.classList.add('loaded');
    }
}

boot();
