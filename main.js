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

// Each project is mapped onto a real solar-system planet, in solar order.
// planet shader type: 0 Mercury · 1 Venus · 2 Earth · 3 Mars · 4 Jupiter · 5 Saturn · 6 Uranus · 7 Neptune
const WORLDS = [
    {
        id: 'devramp', name: 'DevRamp AI', planet: 'Mercury', real: 'DevRamp AI',
        cat: 'Developer Onboarding · AI Mentor', type: 0,
        size: 1.0, orbit: 26, speed: 0.110, tilt: 0.03,
        colA: [0.18, 0.17, 0.16], colB: [0.46, 0.43, 0.40], colC: [0.66, 0.62, 0.57],
        atmo: [0.6, 0.58, 0.55], glow: '#c2b8a8',
        tags: ['IBM Bob', 'React + TS', 'AI Mentor'],
        desc: `Analyses any connected repository, generates a personalised learning path, and pairs it with a 24/7 AI mentor grounded in the actual code — turning "cloned the repo" into "first commit" in days, with XP and progress tracking.`,
        stats: [['days', 'to first commit'], ['24/7', 'AI mentor']],
        live: 'https://dev-ramp-ai.vercel.app/', readme: 'assets/readmes/DevRamp.md', github: 'https://github.com/Kunsh162007/DevRamp-AI',
    },
    {
        id: 'cnn', name: 'Cognitive Decline', planet: 'Venus', real: 'Visualizing Cognitive Decline',
        cat: 'Medical Imaging · Explainable AI', type: 1,
        size: 1.7, orbit: 39, speed: 0.090, tilt: 0.05,
        colA: [0.72, 0.55, 0.25], colB: [0.92, 0.82, 0.55], colC: [1.0, 0.95, 0.78],
        atmo: [1.0, 0.85, 0.55], glow: '#f5d79a',
        tags: ['Computer Vision', 'Grad-CAM · SHAP', 'XAI'],
        desc: `Five CNN architectures benchmarked across TensorFlow and PyTorch on 6,400 brain MRIs (ensemble 95.4% accuracy, AUC 0.993), with a full XAI suite — Grad-CAM, SHAP, LIME, Occlusion, Score-CAM — layered over every model.`,
        stats: [['95.4%', 'ensemble accuracy'], ['0.993', 'AUC']],
        readme: 'assets/readmes/CNN.md', github: 'https://github.com/Kunsh162007/medical-imaging-cnn-xai', sub: 'alzheimer-dl-showcase',
    },
    {
        id: 'nexus', name: 'Nexus Enterprise AI', planet: 'Earth', real: 'Nexus Enterprise AI',
        cat: 'Enterprise Intelligence · Multi-Agent', type: 2,
        size: 1.8, orbit: 53, speed: 0.075, tilt: 0.41,
        colA: [0.03, 0.18, 0.45], colB: [0.12, 0.42, 0.20], colC: [0.55, 0.45, 0.28],
        atmo: [0.4, 0.7, 1.0], glow: '#5ad7ff',
        tags: ['FastAPI', 'React', 'WebSockets'],
        desc: `Five specialised agents (Scout, Analyst, Strategist, Communicator, Orchestrator) run in parallel behind a FastAPI backend, streaming their reasoning live over WebSockets to a React UI and synthesising one executive brief in under 60 seconds.`,
        stats: [['<60s', 'to executive brief'], ['5', 'parallel agents']],
        live: 'https://nexus-frontend-ksfn.onrender.com/', readme: 'assets/readmes/Nexus.md', github: 'https://github.com/Kunsh162007/nexus-enterprise-ai',
    },
    {
        id: 'drishti', name: 'Drishti', planet: 'Mars', real: 'Drishti — Police Intelligence',
        cat: 'Police Intelligence · Geo-AI', type: 3,
        size: 1.35, orbit: 68, speed: 0.060, tilt: 0.44,
        colA: [0.34, 0.12, 0.06], colB: [0.72, 0.32, 0.16], colC: [0.90, 0.56, 0.34],
        atmo: [1.0, 0.6, 0.4], glow: '#ff7a4d',
        tags: ['PostGIS', 'Neo4j', 'Qdrant RAG'],
        desc: `PostgreSQL/PostGIS, Neo4j graphs and Qdrant semantic search unified behind one FastAPI app to trace criminal linkage, geo-hotspots and missing persons — with a grounded assistant that only answers from retrieved records and cites the source FIRs.`,
        stats: [['3', 'data engines unified'], ['100%', 'grounded answers']],
        live: 'https://drishti-demo.onrender.com/', readme: 'assets/readmes/Drishti.md', github: 'https://github.com/Kunsh162007/Drishti',
    },
    {
        id: 'aegis', name: 'AEGIS', planet: 'Jupiter', real: 'AEGIS — Financial-Crime Mesh',
        cat: 'Financial-Crime · 15-Agent Mesh', type: 4, featured: true,
        size: 3.6, orbit: 90, speed: 0.040, tilt: 0.05,
        colA: [0.45, 0.32, 0.20], colB: [0.88, 0.74, 0.54], colC: [0.80, 0.30, 0.18],
        atmo: [1.0, 0.82, 0.55], glow: '#e8b87a',
        tags: ['15-Agent Mesh', 'Band Protocol', 'AML'],
        desc: `A 15-agent adversarial mesh where specialists run real statistics, a NetworkX graph and retrieval, while a Challenger argues innocence and a Verifier rejects any uncited claim — cutting false positives ~77% at ~89% recall on the IBM AML benchmark.`,
        stats: [['~77%', 'fewer false positives'], ['~89%', 'recall']],
        live: 'https://aegis-g7vl.onrender.com/', readme: 'assets/readmes/AEGIS.md', github: 'https://github.com/Kunsh162007/AEGIS',
    },
    {
        id: 'research', name: 'Agentic Research', planet: 'Saturn', real: 'Agentic Research Assistant',
        cat: 'Autonomous Research · Self-RAG', type: 5, rings: true,
        size: 3.0, orbit: 118, speed: 0.030, tilt: 0.47,
        colA: [0.55, 0.46, 0.28], colB: [0.93, 0.85, 0.63], colC: [0.82, 0.72, 0.47],
        atmo: [1.0, 0.9, 0.65], glow: '#f0d79a',
        tags: ['Self-RAG', 'LangGraph', 'Claude'],
        desc: `Autonomously searches the web, arXiv and GitHub, then synthesises a cited report through a Self-RAG LangGraph loop that grades retrieval relevance and answer quality (0–100) and re-retrieves until it hits target — with crash-resumable checkpointing.`,
        stats: [['0–100', 'self-graded quality'], ['Self-RAG', 'control loop']],
        live: 'https://research-assistant-0g24.onrender.com/', readme: 'assets/readmes/AgenticResearch.md', github: 'https://github.com/Kunsh162007/multi-research-agent',
    },
    {
        id: 'nexusintel', name: 'NexusIntel AI', planet: 'Uranus', real: 'NexusIntel AI',
        cat: 'Web Monitoring · Knowledge Graph', type: 6,
        size: 2.3, orbit: 144, speed: 0.022, tilt: 1.62,
        colA: [0.40, 0.72, 0.74], colB: [0.64, 0.88, 0.88], colC: [0.80, 0.96, 0.96],
        atmo: [0.6, 0.95, 0.95], glow: '#aef0ee',
        tags: ['Bright Data', 'Cognee Graph'],
        desc: `An Auto-Focus engine that continuously pings live web sources via Bright Data, detects semantic anomalies through embedding comparison, and autonomously dispatches LangChain agents — storing findings in a shared Cognee knowledge graph and firing TriggerWare webhooks.`,
        stats: [['24/7', 'web monitoring'], ['∞', 'auto-dispatch']],
        live: 'https://nexusintel-frontend.vercel.app/', readme: 'assets/readmes/NexusIntel.md', github: 'https://github.com/Kunsh162007/NexusIntel',
    },
    {
        id: 'rnn', name: 'Temporal Forecasting', planet: 'Neptune', real: 'Temporal Neural Architects',
        cat: 'Time-Series · Deep Learning', type: 7,
        size: 2.2, orbit: 168, speed: 0.018, tilt: 0.49,
        colA: [0.10, 0.22, 0.62], colB: [0.24, 0.42, 0.84], colC: [0.60, 0.74, 1.0],
        atmo: [0.4, 0.6, 1.0], glow: '#6f8cff',
        tags: ['Seq2Seq', 'PyTorch', 'Time Series'],
        desc: `Seven recurrent architectures (Vanilla RNN, LSTM, GRU, Stacked, BiLSTM, Attention-LSTM, Seq2Seq) hand-coded and benchmarked on Melbourne temperature data with a custom Bahdanau-attention layer and a BPTT gradient visualiser; GRU won (RMSE 2.23).`,
        stats: [['7', 'architectures'], ['2.23', 'best RMSE (GRU)']],
        readme: 'assets/readmes/RNN_Forecasting.md', github: 'https://github.com/Kunsh162007/RNN-Seq2Seq-Temperature-Forecasting',
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

  if(uType < 0.5){                 // ── Mercury: cratered grey rock
    float e = fbm(p * 2.6);
    col = mix(uColB, uColC, smoothstep(-0.35, 0.45, e));
    float craters = smoothstep(0.42, 0.52, fbm(p * 4.2));
    col = mix(col, uColA, craters * 0.65);
    col *= (ambient + light);
    col += uAtmo * fres * 0.10 * light;
  } else if(uType < 1.5){          // ── Venus: thick swirling sulphur clouds
    float n = fbm(p * 1.4 + vec3(uTime * 0.03, 0.0, 0.0));
    float swirl = fbm(p * 2.7 + n * 1.6);
    col = mix(uColA, uColC, smoothstep(-0.4, 0.55, n));
    col = mix(col, uColB, 0.35 + 0.35 * sin(sp.y * 6.0 + swirl * 3.0));
    col *= (ambient + light);
    col += uAtmo * fres * (0.5 + 0.6 * light);
  } else if(uType < 2.5){          // ── Earth: oceans, continents, ice caps, clouds
    float e = fbm(p * 1.8);
    vec3 ocean = mix(uColA * 0.6, uColA, smoothstep(-0.7, 0.02, e));
    vec3 ground = mix(uColB, uColC, smoothstep(0.0, 0.6, e));
    col = mix(ocean, ground, step(0.02, e));
    float lat = abs(sp.y);
    col = mix(col, vec3(0.94), smoothstep(0.78, 0.95, lat));
    float cl = smoothstep(0.22, 0.6, fbm(p * 1.3 + vec3(uTime * 0.02, 0.0, 0.0)));
    col = mix(col, vec3(1.0), cl * 0.5);
    col *= (ambient + light);
    col += uAtmo * fres * (0.4 + 0.85 * light);
  } else if(uType < 3.5){          // ── Mars: rusty deserts + polar caps
    float e = fbm(p * 2.2);
    col = mix(uColA, uColB, smoothstep(-0.3, 0.3, e));
    col = mix(col, uColC, smoothstep(0.3, 0.75, e));
    float lat = abs(sp.y);
    col = mix(col, vec3(0.92, 0.94, 0.97), smoothstep(0.86, 0.97, lat));
    col *= (ambient + light);
    col += uAtmo * fres * 0.3 * light;
  } else if(uType < 4.5){          // ── Jupiter: turbulent bands + great red spot
    float n = fbm(p * 1.2);
    float bands = sin(sp.y * 12.0 + n * 3.0);
    col = mix(uColA, uColB, 0.5 + 0.5 * bands);
    col = mix(col, uColB, 0.18 * fbm(p * 3.2));
    vec2 sc = sp.xz; sc.y *= 0.6;
    float spot = smoothstep(0.30, 0.0, length(sc - vec2(0.5, 0.18)));
    col = mix(col, uColC, spot * 0.85);
    col *= (ambient + light);
    col += uAtmo * fres * (0.4 + 0.6 * light);
  } else if(uType < 5.5){          // ── Saturn: soft pale gold bands
    float n = fbm(p * 1.0);
    float bands = sin(sp.y * 10.0 + n * 2.0);
    col = mix(uColA, uColB, 0.5 + 0.5 * bands);
    col = mix(col, uColC, 0.2 * smoothstep(0.0, 1.0, n));
    col *= (ambient + light);
    col += uAtmo * fres * (0.4 + 0.6 * light);
  } else if(uType < 6.5){          // ── Uranus: near-featureless pale cyan
    float n = fbm(p * 1.6);
    float bands = sin(sp.y * 8.0) * 0.5 + 0.5;
    col = mix(uColA, uColB, bands * 0.6 + 0.2);
    col = mix(col, uColC, 0.15 * n);
    col *= (ambient + light);
    col += uAtmo * fres * (0.5 + 0.6 * light);
  } else {                         // ── Neptune: deep blue, cloud streaks, dark storm
    float n = fbm(p * 1.7 + vec3(uTime * 0.02, 0.0, 0.0));
    float bands = sin(sp.y * 7.0 + n * 1.5) * 0.5 + 0.5;
    col = mix(uColA, uColB, bands * 0.7 + 0.15);
    float streak = smoothstep(0.55, 0.82, fbm(p * 2.4));
    col = mix(col, uColC, streak * 0.5);
    vec2 sc = sp.xz; sc.y *= 0.7;
    float storm = smoothstep(0.22, 0.0, length(sc - vec2(-0.4, 0.2)));
    col = mix(col, uColA * 0.4, storm * 0.7);
    col *= (ambient + light);
    col += uAtmo * fres * (0.5 + 0.7 * light);
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
  c += vec3(1.0, 0.5, 0.16) * fres * 1.5;
  gl_FragColor = vec4(c * 1.28, 1.0);
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
        // filmic tone mapping tames blown-out highlights for a softer, richer image
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 0.82;
        this.renderer.setClearColor(0x02030a, 1);
    }

    _initScene() {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x02030a, 0.0006);
        this.camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 4000);

        this.scene.add(new THREE.AmbientLight(0x223355, 0.4));
        this.sunLight = new THREE.PointLight(0xffd9a0, 2.6, 0, 1.4);
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
                    gl_FragColor = vec4(vColor * (0.5 + 0.55 * vTw), t.a);
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
            { c: 0x4a2f8a, x: -260, y: 120, z: -420, s: 720, o: 0.18 },
            { c: 0x123a6a, x: 320, y: -160, z: -380, s: 640, o: 0.17 },
            { c: 0x7a1f4a, x: -120, y: -220, z: 360, s: 600, o: 0.15 },
            { c: 0x1f5a5a, x: 280, y: 200, z: 300, s: 520, o: 0.15 },
            { c: 0x2a3aaa, x: -420, y: -60, z: 120, s: 560, o: 0.11 },
            { c: 0x8a3a6a, x: 120, y: 300, z: -260, s: 480, o: 0.11 },
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
                // ring sits in the planet's equatorial plane and inherits its axial tilt
                const rInner = def.size * 1.3, rOuter = def.size * 2.35;
                const ringGeo = new THREE.RingGeometry(rInner, rOuter, 128);
                // remap UVs so the band texture runs radially (inner→outer)
                const pos = ringGeo.attributes.position, uv = ringGeo.attributes.uv;
                for (let i = 0; i < pos.count; i++) {
                    const d = Math.hypot(pos.getX(i), pos.getY(i));
                    uv.setXY(i, (d - rInner) / (rOuter - rInner), 0.5);
                }
                uv.needsUpdate = true;
                const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({
                    map: this._ringTexture(def.glow), transparent: true, side: THREE.DoubleSide,
                    opacity: 0.92, depthWrite: false,
                }));
                ring.rotation.x = Math.PI / 2;
                mesh.add(ring);
            }

            // faint orbit path, tinted to the planet
            const orbitLine = new THREE.Mesh(
                new THREE.RingGeometry(def.orbit - 0.05, def.orbit + 0.05, 220),
                new THREE.MeshBasicMaterial({ color: new THREE.Color(def.glow), transparent: true, opacity: 0.10, side: THREE.DoubleSide, depthWrite: false })
            );
            orbitLine.rotation.x = Math.PI / 2;
            this.scene.add(orbitLine);

            this.scene.add(group);
            const label = this._makeLabel(def.name, def.glow, false, def.planet);
            this.bodies.push({ def, group, holder, mesh, mat, label, orbitAngle: Math.random() * Math.PI * 2, worldPos: new THREE.Vector3(), radius: def.size });
        });
    }

    _ringTexture(glow) {
        // texture runs inner→outer along its width; alpha encodes ring bands + gaps
        const w = 512, h = 8, c = document.createElement('canvas'); c.width = w; c.height = h;
        const x = c.getContext('2d');
        const tint = new THREE.Color(glow);
        const r = (tint.r * 255) | 0, g = (tint.g * 255) | 0, b = (tint.b * 255) | 0;
        for (let i = 0; i < w; i++) {
            const u = i / w;
            // layered sine bands for the fine ringlet structure
            let a = 0.35 + 0.4 * Math.abs(Math.sin(u * 46.0)) + 0.2 * Math.abs(Math.sin(u * 130.0));
            a *= 0.7 + 0.3 * Math.random();
            // Cassini division — a dark gap about two-thirds out
            if (u > 0.60 && u < 0.67) a *= 0.10;
            if (u > 0.97 || u < 0.03) a *= 0.4;   // soft fade at edges
            // blend ring particles between icy white and the planet tint
            const cr = (220 + r) >> 1, cg = (212 + g) >> 1, cb = (196 + b) >> 1;
            x.fillStyle = `rgba(${cr},${cg},${cb},${Math.min(a, 1).toFixed(3)})`;
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
            this.bloomPass = new UnrealBloomPass(size, 0.55, 0.6, 0.45);
            this.bloomPass.strength = prefersReduced ? 0.35 : 0.55;
            this.bloomPass.radius = 0.6;
            this.bloomPass.threshold = 0.45;
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
        this.sph = { r: 320, theta: 0.9, phi: 1.0 };        // current
        this.sphGoal = { ...this.sph };                      // eased toward
        this.minR = 9; this.maxR = 1300;
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
        this.sphGoal = { r: 320, theta: 0.9, phi: 1.0 };
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

    _focalPx() { return (window.innerHeight * 0.5) / Math.tan((this.camera.fov * Math.PI / 180) / 2); }

    /* Forgiving screen-space picker: the nearest body within a generous halo,
       so a click *near* a planet still selects it. */
    _pickNearest(e) {
        const focal = this._focalPx();
        const v = new THREE.Vector3();
        let best = null, bestScore = Infinity;
        for (const b of this.bodies) {
            v.copy(b.worldPos).project(this.camera);
            if (v.z > 1 || v.z < -1) continue;             // behind / clipped
            const sx = (v.x * 0.5 + 0.5) * window.innerWidth;
            const sy = (-v.y * 0.5 + 0.5) * window.innerHeight;
            const dist = this.camera.position.distanceTo(b.worldPos);
            const screenR = (b.radius * focal) / Math.max(dist, 0.001);
            const pixDist = Math.hypot(e.clientX - sx, e.clientY - sy);
            const pad = Math.max(38, screenR * 1.5);        // generous click halo
            if (pixDist > screenR + pad) continue;
            const score = pixDist - screenR;                // prefer the closer planet
            if (score < bestScore) { bestScore = score; best = b; }
        }
        return best;
    }

    _hoverTest(e) { this._setHover(this._pickNearest(e)); }

    _setHover(body) {
        if (this.hovered === body) return;
        if (this.hovered) this.hovered.label.classList.remove('is-hover');
        this.hovered = body;
        if (body) body.label.classList.add('is-hover');
        this.canvas.classList.toggle('hovering', !!body);
    }

    _clickTest(e) {
        const body = this._pickNearest(e);
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
        const op = clamp(1 - (dist - body.radius * 6) / 520, 0.2, 1);
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
        if (def.github) actions.push(`<a class="btn-ghost-sm" href="${def.github}" target="_blank" rel="noopener">GitHub ↗</a>`);
        // a small rendered "planet disc" themed to this body, with its tilt + ring
        const planetDisc = `
            <div class="planet-disc" style="--p:${def.glow}">
                <span class="pd-orb"></span>
                ${def.rings ? '<span class="pd-ring"></span>' : ''}
                <span class="pd-shadow"></span>
            </div>`;
        body.innerHTML = `
            <div class="popup-hero">
                ${planetDisc}
                <div class="popup-hero-text">
                    <span class="popup-planet">${def.featured ? '★ ' : ''}${def.planet}</span>
                    <h2 class="popup-name">${def.name}</h2>
                    <span class="popup-real">${def.real}</span>
                </div>
            </div>
            <span class="popup-kicker"><span class="dot"></span>${def.cat}</span>
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
    // project dock — every project one click away
    const nav = qs('#hud-worlds');
    WORLDS.forEach((w) => {
        const chip = document.createElement('button');
        chip.className = 'world-chip' + (w.featured ? ' is-featured' : '');
        chip.title = `${w.real} — ${w.planet}`;
        chip.innerHTML = `<span class="dot" style="background:${w.glow};color:${w.glow}"></span>` +
            `<span class="chip-text"><span class="nm">${w.name}</span><span class="pl">${w.planet}</span></span>`;
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

function initIntro(system) {
    const enter = qs('#enter-btn');
    const go = () => {
        if (!document.body.classList.contains('pre-enter')) return;
        document.body.classList.remove('pre-enter');
        // cinematic fly-in: snap the camera out, then ease back to the overview
        if (system) { system.sph.r = 660; system.sphGoal.r = 320; }
    };
    if (enter) enter.addEventListener('click', go);
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && document.body.classList.contains('pre-enter')) go();
    });
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
    initIntro(system);

    if (bar) bar.style.width = '100%';
    const reveal = () => ls && ls.classList.add('loaded');
    // give shaders a couple of frames to compile/paint
    requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(reveal, 350)));
    setTimeout(reveal, 3000);
}

boot();
