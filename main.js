/* =========================================================================
   Kunsh Agrawal — The Kunsh System
   main.js — an explorable WebGL star map built on Three.js.

   The home star (KUNSHARA) sits at the origin and holds the bio + contact.
   Each project is a procedurally-shaded world orbiting it. Drag to roam,
   scroll to zoom, click a world to pop up its short dossier. No external
   3D assets — every surface is generated in GLSL (simplex-noise fbm).
   ========================================================================= */

import * as THREE from './vendor/three.module.js';
import { EffectComposer } from './vendor/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from './vendor/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from './vendor/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from './vendor/jsm/postprocessing/OutputPass.js';

const qs = (s, r = document) => r.querySelector(s);
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* =========================================================================
   System data — the star + the worlds (projects)
   ========================================================================= */

const STAR = {
    name: 'KUNSHARA',
    role: 'Home Star · AI / ML Engineer',
    bio: `First-year B.Tech ECE student at MANIT Bhopal, building across the full AI stack —
          from ML/DL algorithms implemented from mathematical first principles to production-grade
          multi-agent and retrieval-augmented systems. Equally at home in PyTorch and TensorFlow,
          and in shipping FastAPI / React services.`,
    arsenal: ['Multi-Agent Systems', 'LangGraph', 'RAG / Self-RAG', 'PyTorch', 'TensorFlow',
              'CNN · RNN · Seq2Seq', 'Knowledge Graphs', 'Vector DBs', 'FastAPI', 'Docker', 'XAI'],
    email: 'kunsh16906@gmail.com',
    github: 'https://github.com/Kunsh162007',
    linkedin: 'https://www.linkedin.com/in/kunsh-agrawal-b1aa19351/',
};

// type: 0 terran · 1 gas giant · 2 lava · 3 ice
const WORLDS = [
    {
        id: 'aegis', name: 'AEGIS', real: 'AEGIS — Financial-Crime Mesh',
        cat: 'Gas Giant · Featured System', type: 1, featured: true,
        size: 3.1, orbit: 28, speed: 0.10, tilt: 0.18, rings: true,
        colA: [0.55, 0.10, 0.10], colB: [0.95, 0.45, 0.20], colC: [1.0, 0.78, 0.35],
        atmo: [1.0, 0.5, 0.3], glow: '#ff6a4d',
        tags: ['15-Agent Mesh', 'Band Protocol', 'AML'],
        desc: `A 15-agent adversarial mesh where specialists run real statistics, a NetworkX graph and retrieval, while a Challenger argues innocence and a Verifier rejects any uncited claim — cutting false positives ~77% at ~89% recall on the IBM AML benchmark.`,
        stats: [['~77%', 'fewer false positives'], ['~89%', 'recall']],
        live: 'https://aegis-g7vl.onrender.com/', readme: 'assets/readmes/AEGIS.md', github: 'https://github.com/Kunsh162007/AEGIS',
    },
    {
        id: 'nexus', name: 'NEXARA', real: 'Nexus Enterprise AI',
        cat: 'Terran World', type: 0,
        size: 1.7, orbit: 39, speed: 0.085, tilt: 0.32,
        colA: [0.03, 0.18, 0.42], colB: [0.10, 0.42, 0.22], colC: [0.55, 0.45, 0.28],
        atmo: [0.4, 0.7, 1.0], glow: '#5ad7ff',
        tags: ['FastAPI', 'React', 'WebSockets'],
        desc: `Five specialised agents (Scout, Analyst, Strategist, Communicator, Orchestrator) run in parallel behind a FastAPI backend, streaming their reasoning live over WebSockets to a React UI and synthesising one executive brief in under 60 seconds.`,
        stats: [['<60s', 'to executive brief'], ['5', 'parallel agents']],
        live: 'https://nexus-frontend-ksfn.onrender.com/', readme: 'assets/readmes/Nexus.md', github: 'https://github.com/Kunsh162007/nexus-enterprise-ai',
    },
    {
        id: 'nexusintel', name: 'VANTA', real: 'NexusIntel AI',
        cat: 'Ice World', type: 3,
        size: 1.5, orbit: 49, speed: 0.07, tilt: 0.1,
        colA: [0.18, 0.46, 0.62], colB: [0.78, 0.92, 1.0], colC: [0.35, 0.62, 0.78],
        atmo: [0.5, 0.85, 1.0], glow: '#8fe3ff',
        tags: ['Bright Data', 'Cognee Graph'],
        desc: `An Auto-Focus engine that continuously pings live web sources via Bright Data, detects semantic anomalies through embedding comparison, and autonomously dispatches LangChain agents — storing findings in a shared Cognee knowledge graph and firing TriggerWare webhooks.`,
        stats: [['24/7', 'web monitoring'], ['∞', 'auto-dispatch']],
        live: 'https://nexusintel-frontend.vercel.app/', readme: 'assets/readmes/NexusIntel.md', github: 'https://github.com/Kunsh162007/NexusIntel',
    },
    {
        id: 'drishti', name: 'NETRA', real: 'Drishti — Police Intelligence',
        cat: 'Rocky World', type: 0,
        size: 1.6, orbit: 60, speed: 0.06, tilt: 0.42,
        colA: [0.10, 0.06, 0.04], colB: [0.45, 0.26, 0.14], colC: [0.78, 0.55, 0.32],
        atmo: [1.0, 0.7, 0.4], glow: '#ffb259',
        tags: ['PostGIS', 'Neo4j', 'Qdrant RAG'],
        desc: `PostgreSQL/PostGIS, Neo4j graphs and Qdrant semantic search unified behind one FastAPI app to trace criminal linkage, geo-hotspots and missing persons — with a grounded assistant that only answers from retrieved records and cites the source FIRs.`,
        stats: [['3', 'data engines unified'], ['100%', 'grounded answers']],
        live: 'https://drishti-demo.onrender.com/', readme: 'assets/readmes/Drishti.md', github: 'https://github.com/Kunsh162007/Drishti',
    },
    {
        id: 'research', name: 'ARXIA', real: 'Agentic Research Assistant',
        cat: 'Gas Giant', type: 1,
        size: 2.1, orbit: 72, speed: 0.052, tilt: 0.22,
        colA: [0.10, 0.30, 0.34], colB: [0.30, 0.66, 0.62], colC: [0.7, 0.92, 0.85],
        atmo: [0.4, 0.95, 0.85], glow: '#5ff0d0',
        tags: ['Self-RAG', 'LangGraph', 'Claude'],
        desc: `Autonomously searches the web, arXiv and GitHub, then synthesises a cited report through a Self-RAG LangGraph loop that grades retrieval relevance and answer quality (0–100) and re-retrieves until it hits target — with crash-resumable checkpointing.`,
        stats: [['0–100', 'self-graded quality'], ['Self-RAG', 'control loop']],
        live: 'https://research-assistant-0g24.onrender.com/', readme: 'assets/readmes/AgenticResearch.md', github: 'https://github.com/Kunsh162007/multi-research-agent',
    },
    {
        id: 'devramp', name: 'FORGE', real: 'DevRamp AI',
        cat: 'Lava World', type: 2,
        size: 1.7, orbit: 85, speed: 0.045, tilt: 0.15,
        colA: [0.18, 0.06, 0.03], colB: [1.0, 0.55, 0.12], colC: [0.9, 0.2, 0.05],
        atmo: [1.0, 0.45, 0.2], glow: '#ff7a2d',
        tags: ['IBM Bob', 'React + TS', 'AI Mentor'],
        desc: `Analyses any connected repository, generates a personalised learning path, and pairs it with a 24/7 AI mentor grounded in the actual code — turning "cloned the repo" into "first commit" in days, with XP and progress tracking.`,
        stats: [['days', 'to first commit'], ['24/7', 'AI mentor']],
        live: 'https://dev-ramp-ai.vercel.app/', readme: 'assets/readmes/DevRamp.md', github: 'https://github.com/Kunsh162007/DevRamp-AI',
    },
    {
        id: 'rnn', name: 'CHRONOS', real: 'Temporal Neural Architects',
        cat: 'Ringed Ice World', type: 3, rings: true,
        size: 1.5, orbit: 98, speed: 0.038, tilt: 0.46,
        colA: [0.22, 0.4, 0.7], colB: [0.85, 0.9, 1.0], colC: [0.5, 0.55, 0.85],
        atmo: [0.6, 0.7, 1.0], glow: '#9fb6ff',
        tags: ['Seq2Seq', 'PyTorch', 'Time Series'],
        desc: `Seven recurrent architectures (Vanilla RNN, LSTM, GRU, Stacked, BiLSTM, Attention-LSTM, Seq2Seq) hand-coded and benchmarked on Melbourne temperature data with a custom Bahdanau-attention layer and a BPTT gradient visualiser; GRU won (RMSE 2.23).`,
        stats: [['7', 'architectures'], ['2.23', 'best RMSE (GRU)']],
        readme: 'assets/readmes/RNN_Forecasting.md', github: 'https://github.com/Kunsh162007/RNN-Seq2Seq-Temperature-Forecasting',
    },
    {
        id: 'cnn', name: 'CORTEX', real: 'Visualizing Cognitive Decline',
        cat: 'Gas Giant', type: 1,
        size: 1.9, orbit: 112, speed: 0.03, tilt: 0.28,
        colA: [0.22, 0.10, 0.36], colB: [0.55, 0.30, 0.78], colC: [0.85, 0.6, 1.0],
        atmo: [0.8, 0.5, 1.0], glow: '#c89bff',
        tags: ['Computer Vision', 'Explainable AI'],
        desc: `Five CNN architectures benchmarked across TensorFlow and PyTorch on 6,400 brain MRIs (ensemble 95.4% accuracy, AUC 0.993), with a full XAI suite — Grad-CAM, SHAP, LIME, Occlusion, Score-CAM — layered over every model.`,
        stats: [['95.4%', 'ensemble accuracy'], ['0.993', 'AUC']],
        readme: 'assets/readmes/CNN.md', github: 'https://github.com/Kunsh162007/medical-imaging-cnn-xai', sub: 'alzheimer-dl-showcase',
    },
];

/* =========================================================================
   Shared GLSL — simplex noise + fbm
   ========================================================================= */

const NOISE_GLSL = `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g;
  vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857; vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
float fbm(vec3 p){ float f=0.0,a=0.5; for(int i=0;i<5;i++){ f+=a*snoise(p); p*=2.03; a*=0.5; } return f; }
`;

const BODY_VERT = `
varying vec3 vNormalW; varying vec3 vViewDir; varying vec3 vPosL;
void main(){
  vPosL = position;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vNormalW = mat3(modelMatrix) * normal;
  vViewDir = cameraPosition - wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

const PLANET_FRAG = `
precision highp float;
uniform float uTime, uType, uSeed;
uniform vec3 uColA, uColB, uColC, uAtmo, uSunDir;
varying vec3 vNormalW; varying vec3 vViewDir; varying vec3 vPosL;
${NOISE_GLSL}
void main(){
  vec3 sp = normalize(vPosL);
  vec3 p = sp * 2.2 + uSeed;
  vec3 N = normalize(vNormalW);
  vec3 V = normalize(vViewDir);
  float light = clamp(dot(N, normalize(uSunDir)), 0.0, 1.0);
  light = pow(light, 0.9);
  float ambient = 0.07;
  float fres = pow(1.0 - max(dot(N, V), 0.0), 2.4);
  vec3 col;

  if(uType < 0.5){                 // terran / rocky
    float e = fbm(p * 1.7);
    vec3 land = mix(uColB, uColC, smoothstep(0.0, 0.75, e));
    col = e < 0.0 ? uColA : land;
    float lat = abs(sp.y);
    col = mix(col, vec3(0.92), smoothstep(0.80, 0.96, lat) * step(0.0, e + 0.15));
    float cl = smoothstep(0.18, 0.62, fbm(p * 1.15 + vec3(uTime * 0.02, 0.0, 0.0)));
    col = mix(col, vec3(1.0), cl * 0.45);
    col *= (ambient + light);
    col += uAtmo * fres * (0.35 + 0.75 * light);
  } else if(uType < 1.5){          // gas giant
    float n = fbm(p * 1.1);
    float bands = sin(sp.y * 9.0 + n * 2.6 + uSeed);
    col = mix(uColA, uColB, 0.5 + 0.5 * bands);
    vec2 sc = sp.xz; sc.y *= 0.55;
    float spot = smoothstep(0.34, 0.0, length(sc - vec2(0.42, 0.12)));
    col = mix(col, uColC, spot * 0.7);
    col *= (ambient + light);
    col += uAtmo * fres * (0.45 + 0.6 * light);
  } else if(uType < 2.5){          // lava
    float e = fbm(p * 2.3);
    float crust = smoothstep(0.0, 0.5, abs(e));
    col = mix(uColC, uColA * 0.25, crust) * (ambient + light);
    float glow = pow(max(0.0, 0.4 - abs(e)), 1.4) * 3.2;
    col += uColB * glow;          // self-emissive cracks
    col += uAtmo * fres * 0.7;
  } else {                         // ice
    float e = fbm(p * 2.0);
    col = mix(uColA, uColB, smoothstep(-0.25, 0.45, e));
    float cr = smoothstep(0.30, 0.33, fract(e * 5.0));
    col = mix(col, uColC, 0.18 * cr);
    col *= (ambient + light);
    col += uAtmo * fres * (0.4 + 0.7 * light);
  }
  gl_FragColor = vec4(col, 1.0);
}`;

const SUN_FRAG = `
precision highp float;
uniform float uTime;
varying vec3 vNormalW; varying vec3 vViewDir; varying vec3 vPosL;
${NOISE_GLSL}
void main(){
  vec3 p = normalize(vPosL) * 2.0;
  float n = fbm(p * 1.5 + vec3(uTime * 0.06));
  float n2 = fbm(p * 4.0 - vec3(uTime * 0.10));
  float h = n * 0.6 + n2 * 0.4;
  vec3 c = mix(vec3(0.65, 0.13, 0.02), vec3(1.0, 0.55, 0.12), smoothstep(-0.2, 0.5, h));
  c = mix(c, vec3(1.0, 0.92, 0.6), smoothstep(0.45, 0.85, h));
  float fres = pow(1.0 - max(dot(normalize(vNormalW), normalize(vViewDir)), 0.0), 1.6);
  c += vec3(1.0, 0.5, 0.16) * fres * 1.8;
  gl_FragColor = vec4(c * 1.65, 1.0);
}`;

const CORONA_FRAG = `
precision highp float;
uniform vec3 uColor;
varying vec3 vNormalW; varying vec3 vViewDir;
void main(){
  float fres = pow(1.0 - max(dot(normalize(vNormalW), normalize(vViewDir)), 0.0), 2.5);
  gl_FragColor = vec4(uColor, fres * 0.9);
}`;

/* =========================================================================
   Engine
   ========================================================================= */

class System {
    constructor(canvas) {
        this.canvas = canvas;
        this.bodies = [];        // { def, group, mesh, mat, label, orbitAngle }
        this.raycaster = new THREE.Raycaster();
        this.pointer = new THREE.Vector2();
        this.clock = { last: 0 };
        this.hovered = null;
        this.pointers = new Map();
        this.dragging = false;
        this.downInfo = null;

        this._initRenderer();
        this._initScene();
        this._buildStarfield();
        this._buildDustBand();
        this._buildNebulae();
        this._buildMeteors();
        this._buildTrails();
        this._buildSun();
        this._buildWorlds();
        this._initCamera();
        this._initPostFX();
        this._wireInput();
        window.addEventListener('resize', () => this._resize());

        requestAnimationFrame((t) => this._loop(t));
    }

    _initRenderer() {
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: false });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        if ('outputColorSpace' in this.renderer && THREE.SRGBColorSpace) this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.setClearColor(0x02030a, 1);
    }

    _initScene() {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x02030a, 0.0011);
        this.camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 4000);

        this.scene.add(new THREE.AmbientLight(0x223355, 0.5));
        this.sunLight = new THREE.PointLight(0xffd9a0, 3.4, 0, 1.4);
        this.scene.add(this.sunLight);
    }

    _radialTexture(stops) {
        const s = 128, c = document.createElement('canvas'); c.width = c.height = s;
        const x = c.getContext('2d');
        const g = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
        stops.forEach(([o, col]) => g.addColorStop(o, col));
        x.fillStyle = g; x.fillRect(0, 0, s, s);
        const t = new THREE.CanvasTexture(c); t.needsUpdate = true; return t;
    }

    _buildStarfield() {
        const count = 6800;
        const pos = new Float32Array(count * 3);
        const col = new Float32Array(count * 3);
        const siz = new Float32Array(count);
        const pha = new Float32Array(count);
        // a richer spread of stellar colours — white, blue, gold, rose, teal
        const tint = [[1, 1, 1], [0.68, 0.82, 1], [1, 0.88, 0.66], [0.95, 0.78, 1], [0.72, 1, 0.92], [1, 0.74, 0.7]];
        for (let i = 0; i < count; i++) {
            const r = 320 + Math.random() * 1500;
            const th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
            pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
            pos[i * 3 + 1] = r * Math.cos(ph);
            pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
            const c = tint[(Math.random() * tint.length) | 0], b = 0.45 + Math.random() * 0.55;
            col[i * 3] = c[0] * b; col[i * 3 + 1] = c[1] * b; col[i * 3 + 2] = c[2] * b;
            // ~5% are bright "hero" stars that read as foreground beacons
            const hero = Math.random() < 0.05;
            siz[i] = hero ? 4.0 + Math.random() * 4.5 : 1.0 + Math.random() * 2.0;
            pha[i] = Math.random() * Math.PI * 2;
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
        geo.setAttribute('aSize', new THREE.BufferAttribute(siz, 1));
        geo.setAttribute('aPhase', new THREE.BufferAttribute(pha, 1));

        this.starUniforms = {
            uTime: { value: 0 },
            uTex: { value: this._radialTexture([[0, 'rgba(255,255,255,1)'], [0.35, 'rgba(255,255,255,0.55)'], [1, 'rgba(255,255,255,0)']]) },
        };
        const mat = new THREE.ShaderMaterial({
            uniforms: this.starUniforms,
            vertexShader: `
                uniform float uTime;
                attribute vec3 aColor; attribute float aSize; attribute float aPhase;
                varying vec3 vColor; varying float vTw;
                void main(){
                    vColor = aColor;
                    float tw = 0.55 + 0.45 * sin(uTime * 2.2 + aPhase);
                    vTw = tw;
                    vec4 mv = modelViewMatrix * vec4(position, 1.0);
                    gl_PointSize = aSize * (0.7 + 0.6 * tw);
                    gl_Position = projectionMatrix * mv;
                }`,
            fragmentShader: `
                uniform sampler2D uTex;
                varying vec3 vColor; varying float vTw;
                void main(){
                    vec4 t = texture2D(uTex, gl_PointCoord);
                    gl_FragColor = vec4(vColor * (0.6 + 0.7 * vTw), t.a);
                }`,
            transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        });
        this.starfield = new THREE.Points(geo, mat);
        this.scene.add(this.starfield);
    }

    /* A faint, flattened band of dust across the system plane — adds depth. */
    _buildDustBand() {
        const count = 2200, pos = new Float32Array(count * 3), col = new Float32Array(count * 3);
        const tint = [[0.5, 0.6, 1], [0.8, 0.6, 1], [0.5, 0.85, 1], [1, 0.8, 0.7]];
        for (let i = 0; i < count; i++) {
            const r = 60 + Math.random() * 900;
            const th = Math.random() * Math.PI * 2;
            const flat = (Math.random() - 0.5) * 90 * (0.4 + 0.6 * Math.random());
            pos[i * 3] = r * Math.cos(th);
            pos[i * 3 + 1] = flat;
            pos[i * 3 + 2] = r * Math.sin(th);
            const c = tint[(Math.random() * tint.length) | 0], b = 0.12 + Math.random() * 0.3;
            col[i * 3] = c[0] * b; col[i * 3 + 1] = c[1] * b; col[i * 3 + 2] = c[2] * b;
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
        const mat = new THREE.PointsMaterial({
            size: 2.0, map: this._radialTexture([[0, 'rgba(255,255,255,0.8)'], [1, 'rgba(255,255,255,0)']]),
            vertexColors: true, transparent: true, opacity: 0.55, depthWrite: false,
            blending: THREE.AdditiveBlending, sizeAttenuation: true,
        });
        this.dustBand = new THREE.Points(geo, mat);
        this.scene.add(this.dustBand);
    }

    /* Pooled shooting stars / meteors that streak across the backdrop. */
    _buildMeteors() {
        this.meteorTex = this._streakTexture();
        this.meteorPool = [];
        const N = 16;
        for (let i = 0; i < N; i++) {
            const mat = new THREE.SpriteMaterial({
                map: this.meteorTex, color: 0xffffff, transparent: true,
                opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending,
            });
            const sp = new THREE.Sprite(mat);
            sp.visible = false;
            this.scene.add(sp);
            this.meteorPool.push({ sp, alive: false, pos: new THREE.Vector3(), vel: new THREE.Vector3() });
        }
        this.nextMeteor = 0.8;
        this._mTmpA = new THREE.Vector3();
        this._mTmpB = new THREE.Vector3();
    }

    /* A shared ring-buffer of glowing particles meteors deposit as comet tails. */
    _buildTrails() {
        const N = 900;
        this.trailN = N;
        this.trailPos = new Float32Array(N * 3);
        this.trailCol = new Float32Array(N * 3);
        this.trailBase = new Float32Array(N * 3);   // original colour per particle
        this.trailLife = new Float32Array(N);
        this.trailMax = new Float32Array(N);
        for (let i = 0; i < N; i++) this.trailPos[i * 3 + 1] = 1e6;  // park offscreen
        this.trailHead = 0;
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(this.trailPos, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(this.trailCol, 3));
        const mat = new THREE.PointsMaterial({
            size: 2.6, map: this._radialTexture([[0, 'rgba(255,255,255,1)'], [1, 'rgba(255,255,255,0)']]),
            vertexColors: true, transparent: true, depthWrite: false,
            blending: THREE.AdditiveBlending, sizeAttenuation: true,
        });
        this.trails = new THREE.Points(geo, mat);
        this.trails.frustumCulled = false;
        this.scene.add(this.trails);
    }

    _emitTrail(pos, color, maxLife) {
        const i = this.trailHead;
        this.trailHead = (i + 1) % this.trailN;
        this.trailPos[i * 3] = pos.x; this.trailPos[i * 3 + 1] = pos.y; this.trailPos[i * 3 + 2] = pos.z;
        this.trailBase[i * 3] = color.r; this.trailBase[i * 3 + 1] = color.g; this.trailBase[i * 3 + 2] = color.b;
        this.trailLife[i] = maxLife; this.trailMax[i] = maxLife;
    }

    _updateTrails(dt) {
        let dirty = false;
        for (let i = 0; i < this.trailN; i++) {
            if (this.trailLife[i] <= 0) continue;
            this.trailLife[i] -= dt;
            const f = Math.max(this.trailLife[i] / this.trailMax[i], 0);
            this.trailCol[i * 3] = this.trailBase[i * 3] * f;
            this.trailCol[i * 3 + 1] = this.trailBase[i * 3 + 1] * f;
            this.trailCol[i * 3 + 2] = this.trailBase[i * 3 + 2] * f;
            if (this.trailLife[i] <= 0) this.trailPos[i * 3 + 1] = 1e6;  // retire offscreen
            dirty = true;
        }
        if (dirty) {
            this.trails.geometry.attributes.position.needsUpdate = true;
            this.trails.geometry.attributes.color.needsUpdate = true;
        }
    }

    _streakTexture() {
        const w = 160, h = 24, c = document.createElement('canvas'); c.width = w; c.height = h;
        const x = c.getContext('2d');
        const g = x.createLinearGradient(0, 0, w, 0);
        g.addColorStop(0.0, 'rgba(255,255,255,0)');
        g.addColorStop(0.75, 'rgba(255,255,255,0.18)');
        g.addColorStop(0.95, 'rgba(255,255,255,1)');
        g.addColorStop(1.0, 'rgba(255,255,255,0)');
        x.fillStyle = g; x.fillRect(0, 0, w, h);
        // taper the streak vertically so the head reads as a point of light
        x.globalCompositeOperation = 'destination-in';
        const v = x.createLinearGradient(0, 0, 0, h);
        v.addColorStop(0, 'rgba(0,0,0,0)');
        v.addColorStop(0.5, 'rgba(0,0,0,1)');
        v.addColorStop(1, 'rgba(0,0,0,0)');
        x.fillStyle = v; x.fillRect(0, 0, w, h);
        const t = new THREE.CanvasTexture(c); t.needsUpdate = true; return t;
    }

    _spawnMeteor() {
        const m = this.meteorPool.find((x) => !x.alive);
        if (!m) return;
        const R = 220 + Math.random() * 420;
        const th = Math.random() * Math.PI * 2;
        const ph = 0.35 + Math.random() * 2.45;
        m.pos.set(R * Math.sin(ph) * Math.cos(th), R * Math.cos(ph) * 0.7, R * Math.sin(ph) * Math.sin(th));
        m.great = Math.random() < 0.18;             // rare slow, fat comet
        const speed = m.great ? 70 + Math.random() * 60 : 150 + Math.random() * 200;
        m.vel.set(Math.random() * 2 - 1, (Math.random() * 2 - 1) * 0.5, Math.random() * 2 - 1).normalize().multiplyScalar(speed);
        m.dur = m.great ? 3.0 + Math.random() * 2.0 : 1.0 + Math.random() * 1.4;
        m.t = 0;
        m.alive = true;
        m.len = m.great ? 40 + Math.random() * 30 : 18 + Math.random() * 30;
        m.wid = m.great ? 3.4 + Math.random() * 2.0 : 2.0 + Math.random() * 1.8;
        m.bright = (m.great ? 1.1 : 0.8) + Math.random() * 0.5;
        m.emit = 0;
        const tints = [0xffffff, 0xbfe3ff, 0xffe6bf, 0xd9c6ff, 0xc9ffe8, 0xffc9d6];
        m.sp.material.color.setHex(tints[(Math.random() * tints.length) | 0]);
        m.sp.visible = true;
    }

    _updateMeteors(dt) {
        this.nextMeteor -= dt;
        if (this.nextMeteor <= 0) {
            this.nextMeteor = 0.7 + Math.random() * 2.0;
            this._spawnMeteor();
            if (Math.random() < 0.35) this._spawnMeteor();   // frequent twin streaks
            if (Math.random() < 0.12) this._spawnMeteor();   // occasional shower burst
        }
        for (const m of this.meteorPool) {
            if (!m.alive) continue;
            m.t += dt;
            const life = m.t / m.dur;
            if (life >= 1) { m.alive = false; m.sp.visible = false; m.sp.material.opacity = 0; continue; }
            m.pos.addScaledVector(m.vel, dt);
            m.sp.position.copy(m.pos);
            const fade = Math.sin(life * Math.PI);
            m.sp.material.opacity = fade * m.bright;
            // orient the streak along its screen-space velocity
            this._mTmpA.copy(m.pos).project(this.camera);
            this._mTmpB.copy(m.pos).add(m.vel).project(this.camera);
            m.sp.material.rotation = Math.atan2(this._mTmpB.y - this._mTmpA.y, this._mTmpB.x - this._mTmpA.x);
            m.sp.scale.set(m.len, m.wid, 1);
            // sprinkle glowing comet-tail particles behind the head
            m.emit -= dt;
            if (m.emit <= 0) {
                m.emit = m.great ? 0.018 : 0.03;
                this._emitTrail(m.pos, m.sp.material.color, (m.great ? 1.6 : 0.9) * fade + 0.15);
            }
        }
    }

    _buildNebulae() {
        const tex = this._radialTexture([[0, 'rgba(255,255,255,0.9)'], [0.5, 'rgba(255,255,255,0.25)'], [1, 'rgba(255,255,255,0)']]);
        const clouds = [
            { c: 0x4a2f8a, x: -260, y: 120, z: -420, s: 720, o: 0.26 },
            { c: 0x123a6a, x: 320, y: -160, z: -380, s: 640, o: 0.24 },
            { c: 0x7a1f4a, x: -120, y: -220, z: 360, s: 600, o: 0.22 },
            { c: 0x1f5a5a, x: 280, y: 200, z: 300, s: 520, o: 0.22 },
            { c: 0x2a3aaa, x: -420, y: -60, z: 120, s: 560, o: 0.16 },
            { c: 0x8a3a6a, x: 120, y: 300, z: -260, s: 480, o: 0.16 },
        ];
        clouds.forEach((n) => {
            const m = new THREE.SpriteMaterial({ map: tex, color: n.c, transparent: true, opacity: n.o, depthWrite: false, blending: THREE.AdditiveBlending });
            const sp = new THREE.Sprite(m); sp.scale.set(n.s, n.s, 1); sp.position.set(n.x, n.y, n.z);
            sp.material.rotation = Math.random() * Math.PI;
            this.scene.add(sp);
        });
    }

    _buildSun() {
        const R = 6;
        this.sunUniforms = { uTime: { value: 0 } };
        const sun = new THREE.Mesh(
            new THREE.IcosahedronGeometry(R, 24),
            new THREE.ShaderMaterial({ uniforms: this.sunUniforms, vertexShader: BODY_VERT, fragmentShader: SUN_FRAG })
        );
        this.scene.add(sun);

        const corona = new THREE.Mesh(
            new THREE.IcosahedronGeometry(R * 1.28, 24),
            new THREE.ShaderMaterial({
                uniforms: { uColor: { value: new THREE.Color(0xff7a2a) } },
                vertexShader: BODY_VERT, fragmentShader: CORONA_FRAG,
                transparent: true, blending: THREE.AdditiveBlending, side: THREE.BackSide, depthWrite: false,
            })
        );
        this.scene.add(corona);

        const glowMat = new THREE.SpriteMaterial({
            map: this._radialTexture([[0, 'rgba(255,200,120,0.9)'], [0.35, 'rgba(255,130,50,0.45)'], [1, 'rgba(255,90,30,0)']]),
            transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        });
        const glow = new THREE.Sprite(glowMat); glow.scale.set(R * 4.6, R * 4.6, 1);
        this.scene.add(glow);

        this.sunMesh = sun;
        // star is clickable too
        const label = this._makeLabel(STAR.name, '#ffd27a', true, 'Kunsh Agrawal');
        this.bodies.push({ def: { ...STAR, isStar: true, glow: '#ffd27a' }, group: sun, mesh: sun, label, worldPos: new THREE.Vector3(0, 0, 0), radius: R });
    }

    _buildWorlds() {
        WORLDS.forEach((def) => {
            const group = new THREE.Group();          // orbit pivot at origin
            const holder = new THREE.Group();         // body position along orbit
            holder.position.x = def.orbit;
            group.add(holder);

            const uniforms = {
                uTime: { value: 0 }, uType: { value: def.type }, uSeed: { value: Math.random() * 10 },
                uColA: { value: new THREE.Color().fromArray(def.colA) },
                uColB: { value: new THREE.Color().fromArray(def.colB) },
                uColC: { value: new THREE.Color().fromArray(def.colC) },
                uAtmo: { value: new THREE.Color().fromArray(def.atmo) },
                uSunDir: { value: new THREE.Vector3(1, 0, 0) },
            };
            const mat = new THREE.ShaderMaterial({ uniforms, vertexShader: BODY_VERT, fragmentShader: PLANET_FRAG });
            const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(def.size, 32), mat);
            mesh.rotation.z = def.tilt;
            holder.add(mesh);

            if (def.rings) {
                const ring = new THREE.Mesh(
                    new THREE.RingGeometry(def.size * 1.5, def.size * 2.5, 64),
                    new THREE.MeshBasicMaterial({
                        map: this._ringTexture(def.glow), transparent: true, side: THREE.DoubleSide,
                        opacity: 0.85, depthWrite: false,
                    })
                );
                ring.rotation.x = Math.PI / 2 - 0.35;
                ring.rotation.y = 0.2;
                holder.add(ring);
            }

            // faint orbit path
            const orbitLine = new THREE.Mesh(
                new THREE.RingGeometry(def.orbit - 0.04, def.orbit + 0.04, 160),
                new THREE.MeshBasicMaterial({ color: 0x3a5a8a, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false })
            );
            orbitLine.rotation.x = Math.PI / 2;
            this.scene.add(orbitLine);

            this.scene.add(group);
            const label = this._makeLabel(def.name, def.glow, false, def.real);
            this.bodies.push({ def, group, holder, mesh, mat, label, orbitAngle: Math.random() * Math.PI * 2, worldPos: new THREE.Vector3(), radius: def.size });
        });
    }

    _ringTexture(glow) {
        const w = 256, h = 16, c = document.createElement('canvas'); c.width = w; c.height = h;
        const x = c.getContext('2d');
        for (let i = 0; i < w; i++) {
            const a = (0.15 + 0.6 * Math.abs(Math.sin(i * 0.35)) * Math.random());
            x.fillStyle = `rgba(220,210,190,${a.toFixed(3)})`;
            x.fillRect(i, 0, 1, h);
        }
        const t = new THREE.CanvasTexture(c); t.needsUpdate = true; return t;
    }

    _makeLabel(text, color, isStar, sub = '') {
        const el = document.createElement('div');
        el.className = 'body-label' + (isStar ? ' is-star' : '');
        el.innerHTML = `<span class="lbl-name">${text}</span>${sub ? `<span class="lbl-sub">${sub}</span>` : ''}<span class="tick"></span>`;
        el.style.color = color;
        qs('#labels').appendChild(el);
        return el;
    }

    /* ----------------- free-roam camera (orbit + zoom + pan) ----------------- */

    /* HDR-style bloom so suns, lava cracks, hero stars and meteors truly glow. */
    _initPostFX() {
        try {
            const size = new THREE.Vector2(window.innerWidth, window.innerHeight);
            this.composer = new EffectComposer(this.renderer);
            this.composer.addPass(new RenderPass(this.scene, this.camera));
            this.bloomPass = new UnrealBloomPass(size, 1.1, 0.8, 0.2);
            this.bloomPass.strength = prefersReduced ? 0.6 : 1.15;
            this.bloomPass.radius = 0.8;
            this.bloomPass.threshold = 0.2;
            this.composer.addPass(this.bloomPass);
            this.composer.addPass(new OutputPass());
        } catch (err) {
            console.warn('[postfx] bloom unavailable, rendering without it', err);
            this.composer = null;
        }
    }

    _initCamera() {
        this.target = new THREE.Vector3(0, 0, 0);
        this.targetGoal = this.target.clone();
        this.sph = { r: 200, theta: 0.9, phi: 1.08 };       // current
        this.sphGoal = { ...this.sph };                      // eased toward
        this.minR = 9; this.maxR = 1100;
        this._applyCamera(true);
    }

    _applyCamera(snap = false) {
        const k = snap ? 1 : 0.12;
        this.sph.r += (this.sphGoal.r - this.sph.r) * k;
        this.sph.theta += (this.sphGoal.theta - this.sph.theta) * k;
        this.sph.phi += (this.sphGoal.phi - this.sph.phi) * k;
        this.target.lerp(this.targetGoal, snap ? 1 : 0.12);

        const { r, theta, phi } = this.sph;
        this.camera.position.set(
            this.target.x + r * Math.sin(phi) * Math.cos(theta),
            this.target.y + r * Math.cos(phi),
            this.target.z + r * Math.sin(phi) * Math.sin(theta)
        );
        this.camera.lookAt(this.target);
    }

    goTo(body) {
        const wp = body.worldPos;
        this.targetGoal.copy(wp);
        this.sphGoal.r = clamp(body.radius * 6 + 6, this.minR, this.maxR);
        // face the body from a pleasant angle
        this.sphGoal.phi = 1.18;
    }

    resetView() {
        this.targetGoal.set(0, 0, 0);
        this.sphGoal = { r: 200, theta: 0.9, phi: 1.08 };
    }

    /* ----------------- input ----------------- */

    _wireInput() {
        const c = this.canvas;
        c.addEventListener('pointerdown', (e) => this._onDown(e));
        c.addEventListener('pointermove', (e) => this._onMove(e));
        window.addEventListener('pointerup', (e) => this._onUp(e));
        c.addEventListener('wheel', (e) => this._onWheel(e), { passive: false });
        c.addEventListener('pointerleave', () => { this._setHover(null); });
    }

    _onDown(e) {
        this.canvas.setPointerCapture?.(e.pointerId);
        this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        this.dragging = true;
        this.canvas.classList.add('grabbing');
        this.downInfo = { x: e.clientX, y: e.clientY, t: performance.now(), moved: false };
        if (this.pointers.size === 2) {
            const p = [...this.pointers.values()];
            this._pinchDist = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
        }
    }

    _onMove(e) {
        if (this.pointers.has(e.pointerId)) {
            const prev = this.pointers.get(e.pointerId);
            const dx = e.clientX - prev.x, dy = e.clientY - prev.y;
            this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
            if (this.downInfo && Math.hypot(e.clientX - this.downInfo.x, e.clientY - this.downInfo.y) > 6) this.downInfo.moved = true;

            if (this.pointers.size >= 2) {
                const p = [...this.pointers.values()];
                const d = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
                if (this._pinchDist) this.sphGoal.r = clamp(this.sphGoal.r * (this._pinchDist / d), this.minR, this.maxR);
                this._pinchDist = d;
                this._pan(dx * 0.5, dy * 0.5);
            } else if (e.shiftKey || e.pointerType === 'touch' && false) {
                this._pan(dx, dy);
            } else {
                this.sphGoal.theta -= dx * 0.005;
                this.sphGoal.phi = clamp(this.sphGoal.phi - dy * 0.005, 0.12, Math.PI - 0.12);
            }
        } else {
            // hover raycast (only when not dragging)
            this._hoverTest(e);
        }
    }

    _onUp(e) {
        const wasClick = this.downInfo && !this.downInfo.moved && (performance.now() - this.downInfo.t) < 350;
        this.pointers.delete(e.pointerId);
        if (this.pointers.size < 2) this._pinchDist = 0;
        if (this.pointers.size === 0) { this.dragging = false; this.canvas.classList.remove('grabbing'); }
        if (wasClick) this._clickTest(e);
        this.downInfo = null;
    }

    _onWheel(e) {
        e.preventDefault();
        this.sphGoal.r = clamp(this.sphGoal.r * (1 + Math.sign(e.deltaY) * 0.12), this.minR, this.maxR);
    }

    _pan(dx, dy) {
        const right = new THREE.Vector3(), up = new THREE.Vector3();
        this.camera.matrix.extractBasis(right, up, new THREE.Vector3());
        const scale = this.sph.r * 0.0016;
        const delta = right.multiplyScalar(-dx * scale).add(up.multiplyScalar(dy * scale));
        this.targetGoal.add(delta);
    }

    _ndc(e) {
        this.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
        this.pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
    }

    _pickMeshes() { return this.bodies.map((b) => b.mesh); }

    _hoverTest(e) {
        this._ndc(e);
        this.raycaster.setFromCamera(this.pointer, this.camera);
        const hit = this.raycaster.intersectObjects(this._pickMeshes(), false)[0];
        this._setHover(hit ? this.bodies.find((b) => b.mesh === hit.object) : null);
    }

    _setHover(body) {
        if (this.hovered === body) return;
        if (this.hovered) this.hovered.label.classList.remove('is-hover');
        this.hovered = body;
        if (body) body.label.classList.add('is-hover');
        this.canvas.classList.toggle('hovering', !!body);
    }

    _clickTest(e) {
        this._ndc(e);
        this.raycaster.setFromCamera(this.pointer, this.camera);
        const hit = this.raycaster.intersectObjects(this._pickMeshes(), false)[0];
        if (!hit) return;
        const body = this.bodies.find((b) => b.mesh === hit.object);
        if (body) { this.goTo(body); openPopup(body.def); }
    }

    /* ----------------- resize + loop ----------------- */

    _resize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        if (this.composer) this.composer.setSize(window.innerWidth, window.innerHeight);
    }

    _projectLabel(body) {
        const v = body.worldPos.clone().project(this.camera);
        const el = body.label;
        if (v.z > 1 || v.z < -1) { el.style.display = 'none'; return; }
        const x = (v.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-v.y * 0.5 + 0.5) * window.innerHeight;
        const dist = this.camera.position.distanceTo(body.worldPos);
        const op = clamp(1 - (dist - body.radius * 4) / 260, 0.12, 1);
        el.style.display = 'block';
        el.style.left = x + 'px';
        el.style.top = y + 'px';
        if (!el.classList.contains('is-hover')) el.style.opacity = (body.def.isStar ? Math.max(op, 0.5) : op).toFixed(2);
    }

    _loop(t) {
        requestAnimationFrame((t2) => this._loop(t2));
        const dt = Math.min((t - this.clock.last) / 1000, 0.05) || 0;
        this.clock.last = t;
        const time = t * 0.001;

        this.sunUniforms.uTime.value = time;
        if (this.sunMesh) this.sunMesh.rotation.y += dt * 0.04;

        const sunWorld = new THREE.Vector3(0, 0, 0);
        for (const b of this.bodies) {
            if (b.def.isStar) { b.worldPos.set(0, 0, 0); this._projectLabel(b); continue; }
            b.orbitAngle += dt * b.def.speed;
            b.group.rotation.y = b.orbitAngle;
            b.mesh.rotation.y += dt * 0.15;
            b.mesh.getWorldPosition(b.worldPos);
            b.mat.uniforms.uTime.value = time;
            b.mat.uniforms.uSunDir.value.copy(sunWorld).sub(b.worldPos).normalize();
            this._projectLabel(b);
        }

        this._applyCamera(false);
        this.starfield.rotation.y += dt * 0.003;
        if (this.starUniforms) this.starUniforms.uTime.value = time;
        if (this.dustBand) this.dustBand.rotation.y -= dt * 0.006;
        if (!prefersReduced) { this._updateMeteors(dt); this._updateTrails(dt); }
        if (this.composer) this.composer.render(dt);
        else this.renderer.render(this.scene, this.camera);
    }
}

/* =========================================================================
   Pop-up card + README modal
   ========================================================================= */

function openPopup(def) {
    const popup = qs('#popup'), body = qs('#popup-body'), card = qs('.popup-card');
    card.style.setProperty('--accent', hexToRGBA(def.glow, 0.20));
    card.style.setProperty('--accent-text', def.glow);

    if (def.isStar) {
        body.innerHTML = `
            <span class="popup-kicker"><span class="dot"></span>${def.role}</span>
            <h2 class="popup-name">${def.name}</h2>
            <span class="popup-real">Kunsh Agrawal · the heart of the system</span>
            <p class="popup-desc">${def.bio}</p>
            <div class="popup-section-title">Arsenal</div>
            <div class="arsenal">${def.arsenal.map((a) => `<span>${a}</span>`).join('')}</div>
            <div class="popup-section-title">Make contact</div>
            <div class="popup-contact">
                <a class="btn-fill" href="mailto:${def.email}">✉ Email</a>
                <a class="btn-line" href="${def.github}" target="_blank" rel="noopener">GitHub ↗</a>
                <a class="btn-line" href="${def.linkedin}" target="_blank" rel="noopener">LinkedIn ↗</a>
            </div>`;
    } else {
        const stats = (def.stats || []).map((s) => `<div class="popup-stat"><b>${s[0]}</b><span>${s[1]}</span></div>`).join('');
        const actions = [];
        if (def.live) actions.push(`<a class="btn-live" href="${def.live}" target="_blank" rel="noopener"><span class="live-dot"></span> Live Demo</a>`);
        if (def.readme) actions.push(`<button class="btn-line" data-readme="${def.readme}" data-github="${def.github}" ${def.sub ? `data-sub="${def.sub}"` : ''}>Full Dossier →</button>`);
        else if (def.github) actions.push(`<a class="btn-line" href="${def.github}" target="_blank" rel="noopener">GitHub ↗</a>`);
        body.innerHTML = `
            <span class="popup-kicker"><span class="dot"></span>${def.cat}</span>
            <h2 class="popup-name">${def.name}</h2>
            <span class="popup-real">${def.real}</span>
            <div class="popup-tags">${(def.tags || []).map((t) => `<span>${t}</span>`).join('')}</div>
            <p class="popup-desc">${def.desc}</p>
            ${stats ? `<div class="popup-stats">${stats}</div>` : ''}
            <div class="popup-actions">${actions.join('')}</div>`;
        const dossier = body.querySelector('[data-readme]');
        if (dossier) dossier.addEventListener('click', () => openReadme(dossier.dataset.readme, dossier.dataset.github, dossier.dataset.sub || ''));
    }

    popup.classList.add('show');
}

function closePopup() { qs('#popup').classList.remove('show'); }

function hexToRGBA(hex, a) {
    const m = hex.replace('#', '');
    const n = parseInt(m.length === 3 ? m.split('').map((c) => c + c).join('') : m, 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

function rewritePaths(md, githubUrl, sub = '') {
    if (!githubUrl || !githubUrl.includes('github.com')) return md;
    const repo = githubUrl.replace('https://github.com/', '').replace(/\/$/, '');
    const s = sub ? (sub.endsWith('/') ? sub : sub + '/') : '';
    const raw = `https://raw.githubusercontent.com/${repo}/main/${s}`;
    let out = md.replace(/!\[([^\]]*)\]\((?!http|https)([^)]+)\)/g, (m, alt, p) => `![${alt}](${raw}${p.startsWith('./') ? p.slice(2) : p})`);
    out = out.replace(/<img[^>]+src=["'](?!http|https)([^"']+)["'][^>]*>/g, (m, p) => m.replace(p, `${raw}${p.startsWith('./') ? p.slice(2) : p}`));
    out = out.replace(/\[([^\]]*)\]\((?!http|https|#)([^)]+)\)/g, (m, txt, p) => `[${txt}](${githubUrl}/blob/main/${s}${p.startsWith('./') ? p.slice(2) : p})`);
    return out;
}

async function openReadme(path, githubUrl, sub) {
    const modal = qs('#readme-modal'), content = qs('#markdown-container'), link = qs('#modal-github-link');
    link.href = githubUrl || '#';
    document.body.style.overflow = 'hidden';
    content.innerHTML = `<div class="loading-state"><div class="spinner"></div><p>Retrieving mission dossier…</p></div>`;
    modal.style.display = 'block';
    requestAnimationFrame(() => modal.classList.add('show'));
    try {
        const res = await fetch(path);
        if (!res.ok) throw new Error('load failed');
        let md = await res.text();
        md = rewritePaths(md, githubUrl, sub);
        content.innerHTML = window.marked ? window.marked.parse(md) : md;
    } catch (err) {
        console.error(err);
        content.innerHTML = `<div class="error-state"><p>Unable to load the dossier directly.</p>
            <a href="${githubUrl}" target="_blank" rel="noopener" class="btn-sm">View on GitHub Instead ↗</a></div>`;
    }
}

function initModal() {
    const modal = qs('#readme-modal'), content = qs('#markdown-container'), closeBtn = qs('.close-btn');
    const close = () => { modal.classList.remove('show'); document.body.style.overflow = ''; setTimeout(() => { modal.style.display = 'none'; content.innerHTML = ''; }, 300); };
    closeBtn.addEventListener('click', close);
    window.addEventListener('click', (e) => { if (e.target === modal) close(); });
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.classList.contains('show')) close(); });
}

/* =========================================================================
   HUD wiring + boot
   ========================================================================= */

function initHUD(system) {
    // world chips
    const nav = qs('#hud-worlds');
    WORLDS.forEach((w) => {
        const chip = document.createElement('button');
        chip.className = 'world-chip';
        chip.innerHTML = `<span class="dot" style="background:${w.glow};color:${w.glow}"></span><span class="nm">${w.name}</span>`;
        chip.addEventListener('click', () => {
            const body = system.bodies.find((b) => b.def.id === w.id);
            if (body) { system.goTo(body); openPopup(body.def); }
        });
        nav.appendChild(chip);
    });

    qs('#btn-star').addEventListener('click', () => {
        const star = system.bodies.find((b) => b.def.isStar);
        system.resetView();
        openPopup(star.def);
    });
    qs('#btn-reset').addEventListener('click', () => { closePopup(); system.resetView(); });

    qs('#popup-close').addEventListener('click', closePopup);
    qs('#popup').addEventListener('click', (e) => { if (e.target.id === 'popup') closePopup(); });
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePopup(); });
}

function boot() {
    const canvas = qs('#galaxy');
    const ls = qs('#loading-screen');
    const bar = qs('#loading-bar-fill');
    if (bar) { bar.style.width = '15%'; setTimeout(() => bar.style.width = '70%', 150); }

    let system = null;
    try {
        system = new System(canvas);
    } catch (err) {
        console.error('[system] failed to start', err);
        if (ls) ls.classList.add('loaded');
        return;
    }

    initModal();
    initHUD(system);

    if (bar) bar.style.width = '100%';
    const reveal = () => ls && ls.classList.add('loaded');
    // give shaders a couple of frames to compile/paint
    requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(reveal, 350)));
    setTimeout(reveal, 3000);
}

boot();
