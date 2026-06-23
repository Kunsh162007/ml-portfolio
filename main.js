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
        this._loadCharacterArt();
        this._loadPosters();
        this._buildClouds();
    }

    _buildDoors() {
        const doorMat = this.toonMat(PALETTE.door);
        const makeFrame = (x, target) => {
            const group = new THREE.Group();
            [-0.8, 0.8].forEach((dz) => {
                const post = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.6, 0.18), doorMat);
                post.position.set(x, 1.3, 10 + dz);
                group.add(post);
                this.addOutline(post);
            });
            const lintel = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 1.8), doorMat);
            lintel.position.set(x, 2.7, 10);
            group.add(lintel);
            this.addOutline(lintel);

            const panel = new THREE.Mesh(
                new THREE.PlaneGeometry(1.5, 2.4),
                new THREE.MeshBasicMaterial({ color: PALETTE.door, transparent: true, opacity: 0.35, side: THREE.DoubleSide })
            );
            panel.position.set(x > 0 ? x - 0.02 : x + 0.02, 1.3, 10);
            panel.rotation.y = Math.PI / 2;
            group.add(panel);

            this.scene.add(group);
            this.interactive.push({ mesh: panel, target });
            this.hoverables.push(panel);
        };
        makeFrame(-4.75, '#dojo');
        makeFrame(4.75, '#missions');
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
    }

    _loadPosters() {
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

                const group = new THREE.Group();
                group.add(frame, poster);
                group.position.set(side * 4.85, 2.1, p.z);
                group.rotation.y = Math.PI / 2;
                this.scene.add(group);

                this.interactive.push({ mesh: poster, target: p.target });
                this.interactive.push({ mesh: frame, target: p.target });
                this.hoverables.push(poster, frame);
            });
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
    }

    updateCamera() {
        if (!this.breakpoints.length) return;
        const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
        const t = clamp(window.scrollY / maxScroll, 0, 1);

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
