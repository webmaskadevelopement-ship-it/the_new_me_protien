/**
 * THE NEW ME - 3D Interactive WebGL Engine
 * Built with Three.js & Vanilla JavaScript
 * High performance, zero external asset dependency (procedural 3D rendering)
 */

(function() {
  'use strict';

  // --- CONFIG & STATE ---
  const STATE = {
    flavor: 'vanilla', // 'vanilla', 'cacao', 'matcha'
    lightingMode: 'apothecary', // 'apothecary', 'golden', 'midnight'
    autoRotate: true,
    explodedMode: false,
    hotspotsVisible: true,
    audioMuted: true,
    mouse: { x: 0, y: 0, targetX: 0, targetY: 0 },
    scrollProgress: 0
  };

  const FLAVORS = {
    vanilla: {
      name: 'Vanilla Fudge Reserve',
      tagline: 'Apothecary Grade Vanilla & Creamy Fudge',
      primaryColor: '#102E5C',
      accentColor: '#F58220',
      bgGradient: ['#FAF5EF', '#E6D3C0'],
      particleColors: [0xE6D3C0, 0xF58220, 0x1A63A5, 0xFFFFFF],
      pouchMain: '#FAF8F5',
      pouchAccent: '#102E5C',
      price: '$49.95'
    },
    cacao: {
      name: 'Dark Cacao Silk',
      tagline: 'Raw Ecuadorian Cacao & Velvet Truffle',
      primaryColor: '#3A2312',
      accentColor: '#D4A373',
      bgGradient: ['#F5EBE6', '#D4A373'],
      particleColors: [0x4A3B32, 0xD4A373, 0x8D5B4C, 0xFFFFFF],
      pouchMain: '#2A1B10',
      pouchAccent: '#D4A373',
      price: '$49.95'
    },
    matcha: {
      name: 'Ceremonial Matcha Pure',
      tagline: 'Uji First-Harvest Ceremonial Green Tea',
      primaryColor: '#004B23',
      accentColor: '#38B000',
      bgGradient: ['#F0F7F4', '#B7E4C7'],
      particleColors: [0x008A44, 0x70E000, 0x38B000, 0xFFFFFF],
      pouchMain: '#002B15',
      pouchAccent: '#70E000',
      price: '$52.95'
    }
  };

  // --- GLOBAL THREE.JS INSTANCES ---
  let heroScene, heroCamera, heroRenderer;
  let pouchGroup, pouchMesh, labelCanvas, labelTexture, labelMaterial;
  let ingredientsGroup = [];
  let particleSystem;
  let bgScene, bgCamera, bgRenderer, bgParticles;
  let radarScene, radarCamera, radarRenderer, radarGroup;

  // --- INITIALIZATION ON DOM LOAD ---
  window.addEventListener('DOMContentLoaded', () => {
    initHero3D();
    initBackground3D();
    initNutritionRadar3D();
    initCSSTiltEffects();
    initHotspots();
    setupEventListeners();
    animate();
  });

  // ==========================================
  // 1. HERO 3D PRODUCT CANVAS
  // ==========================================
  function initHero3D() {
    const container = document.getElementById('hero-3d-container');
    if (!container) return;

    // Scene
    heroScene = new THREE.Scene();

    // Camera
    const aspect = container.clientWidth / container.clientHeight;
    heroCamera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    heroCamera.position.set(0, 0.5, 9.5);

    // Renderer
    heroRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    heroRenderer.setSize(container.clientWidth, container.clientHeight);
    heroRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    heroRenderer.shadowMap.enabled = true;
    heroRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
    heroRenderer.toneMapping = THREE.ACESFilmicToneMapping;
    heroRenderer.toneMappingExposure = 1.15;

    // Clear existing children
    container.innerHTML = '';
    container.appendChild(heroRenderer.domElement);

    // Lights
    setupHeroLights();

    // Create 3D Pouch
    create3DPouch();

    // Create Floating 3D Ingredients
    createFloatingIngredients();

    // Create Particle Aura
    createProductParticleAura();

    // Contact Shadow Plane
    const shadowGeo = new THREE.PlaneGeometry(6, 6);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x102E5C,
      transparent: true,
      opacity: 0.12,
      map: createShadowTexture()
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -2.85;
    heroScene.add(shadowMesh);

    // Window Resize Handler
    window.addEventListener('resize', onWindowResize);
  }

  function setupHeroLights() {
    // Ambient Light
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    heroScene.add(ambientLight);

    // Key Light (Warm Apothecary Studio)
    const keyLight = new THREE.DirectionalLight(0xfff8ed, 2.2);
    keyLight.position.set(5, 8, 7);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.bias = -0.0001;
    heroScene.add(keyLight);

    // Fill Light (Cool Soft Blue Reflection)
    const fillLight = new THREE.DirectionalLight(0x71c7fe, 1.1);
    fillLight.position.set(-6, 3, -4);
    heroScene.add(fillLight);

    // Rim Light (Top Specular Highlight)
    const rimLight = new THREE.DirectionalLight(0xffe3ca, 1.8);
    rimLight.position.set(0, 6, -6);
    heroScene.add(rimLight);

    // Soft Point Light under pouch
    const pointLight = new THREE.PointLight(0xF58220, 1.5, 8);
    pointLight.position.set(0, -2, 2);
    heroScene.add(pointLight);
  }

  function createShadowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 120);
    grad.addColorStop(0, 'rgba(0,0,0,0.8)');
    grad.addColorStop(0.5, 'rgba(0,0,0,0.3)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  // ==========================================
  // PROCEDURAL 3D STAND-UP POUCH GEOMETRY & TEXTURE
  // ==========================================
  function create3DPouch() {
    pouchGroup = new THREE.Group();

    // 1. Create Dynamic Canvas Texture for Pouch Label
    labelCanvas = document.createElement('canvas');
    labelCanvas.width = 2048;
    labelCanvas.height = 2048;
    updateLabelTexture();

    labelTexture = new THREE.CanvasTexture(labelCanvas);
    labelTexture.anisotropy = heroRenderer.capabilities.getMaxAnisotropy();
    labelTexture.needsUpdate = true;

    // 2. Stand-up Pouch Shape using Custom Extrude Geometry
    const shape = new THREE.Shape();
    // Rounded pouch silhouette
    const width = 2.2;
    const height = 4.2;
    const radius = 0.5;

    shape.moveTo(-width/2 + radius, -height/2);
    shape.lineTo(width/2 - radius, -height/2);
    shape.quadraticCurveTo(width/2, -height/2, width/2 + 0.15, -height/2 + radius);
    shape.quadraticCurveTo(width/2 + 0.35, 0, width/2 + 0.1, height/2 - radius);
    shape.quadraticCurveTo(width/2, height/2, width/2 - radius, height/2);
    shape.lineTo(-width/2 + radius, height/2);
    shape.quadraticCurveTo(-width/2, height/2, -width/2 - 0.1, height/2 - radius);
    shape.quadraticCurveTo(-width/2 - 0.35, 0, -width/2 - 0.15, -height/2 + radius);
    shape.quadraticCurveTo(-width/2, -height/2, -width/2 + radius, -height/2);

    const extrudeSettings = {
      steps: 30,
      depth: 1.1,
      bevelEnabled: true,
      bevelThickness: 0.35,
      bevelSize: 0.35,
      bevelOffset: 0,
      bevelSegments: 16
    };

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geometry.center();

    // Deform vertices slightly to give natural pouch bulge & gusset curves
    const pos = geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i);
      let y = pos.getY(i);
      let z = pos.getZ(i);

      // Bulge middle
      const factorY = Math.cos((y / (height / 2)) * (Math.PI / 2.2));
      const factorX = Math.cos((x / (width / 2)) * (Math.PI / 2.5));

      z += factorY * factorX * 0.45;

      // Pinch top zip seal
      if (y > height * 0.38) {
        const pinch = 1 - (y - height * 0.38) / (height * 0.15);
        z *= Math.max(0.15, pinch);
        x *= 0.96;
      }

      // Stand-up oval base expansion
      if (y < -height * 0.35) {
        z *= 1.35;
      }

      pos.setXYZ(i, x, y, z);
    }
    geometry.computeVertexNormals();

    // Map UV coordinates smoothly across front face for the label texture
    const uvs = geometry.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i);
      let y = pos.getY(i);
      let u = (x + width / 1.5) / (width * 1.33);
      let v = (y + height / 2) / height;
      uvs.setXY(i, u, v);
    }

    // Material with physical coating & realistic reflection
    labelMaterial = new THREE.MeshPhysicalMaterial({
      map: labelTexture,
      roughness: 0.28,
      metalness: 0.12,
      clearcoat: 0.4,
      clearcoatRoughness: 0.2,
      reflectivity: 0.8,
      side: THREE.DoubleSide
    });

    pouchMesh = new THREE.Mesh(geometry, labelMaterial);
    pouchMesh.castShadow = true;
    pouchMesh.receiveShadow = true;
    pouchGroup.add(pouchMesh);

    // 3. Add Top Ziplock Seal Ridge
    const sealGeo = new THREE.BoxGeometry(width * 1.08, 0.18, 0.25);
    const sealMat = new THREE.MeshStandardMaterial({
      color: 0x102E5C,
      metalness: 0.6,
      roughness: 0.3
    });
    const sealMesh = new THREE.Mesh(sealGeo, sealMat);
    sealMesh.position.set(0, height / 2 + 0.05, 0);
    pouchGroup.add(sealMesh);

    // Tear notch left/right
    const notchGeo = new THREE.ConeGeometry(0.1, 0.12, 3);
    notchGeo.rotateZ(Math.PI / 2);
    const notchLeft = new THREE.Mesh(notchGeo, sealMat);
    notchLeft.position.set(-width / 2 - 0.05, height / 2 - 0.2, 0);
    const notchRight = notchLeft.clone();
    notchRight.rotation.z = -Math.PI / 2;
    notchRight.position.x = width / 2 + 0.05;
    pouchGroup.add(notchLeft, notchRight);

    // 4. Gold Seal Badge Ribbon Overlay
    const ribbonGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.08, 32);
    const ribbonMat = new THREE.MeshStandardMaterial({
      color: 0xF58220,
      metalness: 0.8,
      roughness: 0.2
    });
    const ribbonMesh = new THREE.Mesh(ribbonGeo, ribbonMat);
    ribbonMesh.rotation.x = Math.PI / 2;
    ribbonMesh.position.set(0.75, 1.15, 0.72);
    pouchGroup.add(ribbonMesh);

    pouchGroup.position.set(0, 0.2, 0);
    heroScene.add(pouchGroup);
  }

  // Draw 2048x2048 high-res branding label on canvas
  function updateLabelTexture() {
    if (!labelCanvas) return;
    const ctx = labelCanvas.getContext('2d');
    const flavor = FLAVORS[STATE.flavor];

    // Background base
    ctx.fillStyle = flavor.pouchMain;
    ctx.fillRect(0, 0, 2048, 2048);

    // Subtle apothecary grid texture lines
    ctx.strokeStyle = 'rgba(16, 46, 92, 0.04)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 2048; i += 64) {
      ctx.beginPath();
      ctx.moveTo(i, 0); ctx.lineTo(i, 2048);
      ctx.moveTo(0, i); ctx.lineTo(2048, i);
      ctx.stroke();
    }

    // Top Header Banner
    ctx.fillStyle = flavor.primaryColor;
    ctx.fillRect(0, 0, 2048, 380);

    // Header Gold Foil Line
    ctx.fillStyle = flavor.accentColor;
    ctx.fillRect(0, 380, 2048, 24);

    // Brand Name Top
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 96px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('THE NEW ME', 1024, 210);

    ctx.fillStyle = flavor.accentColor;
    ctx.font = '700 42px "Plus Jakarta Sans", sans-serif';
    ctx.letterSpacing = '12px';
    ctx.fillText('APOTHECARY NUTRITION · EST. 2025', 1024, 300);

    // Center Product Badge Strip
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.shadowColor = 'rgba(16, 46, 92, 0.15)';
    ctx.shadowBlur = 30;
    ctx.beginPath();
    ctx.roundRect(180, 520, 1688, 1200, 40);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Inner Gold Frame
    ctx.strokeStyle = flavor.primaryColor;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.roundRect(220, 560, 1608, 1120, 30);
    ctx.stroke();

    // Vegan Green Tag Badge
    ctx.fillStyle = '#008A44';
    ctx.beginPath();
    ctx.roundRect(620, 630, 808, 80, 40);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 38px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('CERTIFIED VEGAN AUSTRALIA', 1024, 685);

    // Product Title
    ctx.fillStyle = flavor.primaryColor;
    ctx.font = '800 130px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('PLANT PROTEIN', 1024, 880);

    // Flavor Subtitle
    ctx.fillStyle = flavor.accentColor;
    ctx.font = 'italic 700 84px "Playfair Display", Georgia, serif';
    ctx.fillText(flavor.name, 1024, 1010);

    ctx.fillStyle = '#6B7280';
    ctx.font = '500 46px "Inter", sans-serif';
    ctx.fillText(flavor.tagline, 1024, 1100);

    // 4 Key Macro Stat Boxes on Label
    const boxY = 1200;
    const boxWidth = 340;
    const boxHeight = 220;
    const boxGap = 40;
    const startX = 1024 - (boxWidth * 2 + boxGap * 1.5);

    const stats = [
      { num: '18.8g', label: 'PROTEIN' },
      { num: '4.8g', label: 'FIBRE' },
      { num: '0g', label: 'SUGAR' },
      { num: '119', label: 'KCAL' }
    ];

    stats.forEach((st, idx) => {
      const bx = startX + idx * (boxWidth + boxGap);
      ctx.fillStyle = '#F8F9FA';
      ctx.strokeStyle = '#E5E7EB';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(bx, boxY, boxWidth, boxHeight, 20);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = flavor.primaryColor;
      ctx.font = '800 68px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(st.num, bx + boxWidth / 2, boxY + 110);

      ctx.fillStyle = '#6B7280';
      ctx.font = '700 32px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(st.label, bx + boxWidth / 2, boxY + 175);
    });

    // Net Weight & Scoop Notice
    ctx.fillStyle = flavor.primaryColor;
    ctx.font = '700 48px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('NET WT. 500G (1.1 LBS) · 15 CLINICAL DOSES', 1024, 1580);

    // Bottom Apothecary Stamp
    ctx.fillStyle = flavor.primaryColor;
    ctx.fillRect(0, 1850, 2048, 198);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '600 42px "Inter", sans-serif';
    ctx.fillText('NO SOY · NO GLUTEN · ZERO SYNTHETIC GUMS · MELBOURNE CRAFTED', 1024, 1960);

    if (labelTexture) labelTexture.needsUpdate = true;
  }

  // ==========================================
  // FLOATING 3D INGREDIENTS
  // ==========================================
  function createFloatingIngredients() {
    ingredientsGroup.forEach(obj => heroScene.remove(obj));
    ingredientsGroup = [];

    const group = new THREE.Group();

    // 1. Golden Protein Spheres
    for (let i = 0; i < 6; i++) {
      const geo = new THREE.IcosahedronGeometry(0.35 + Math.random() * 0.25, 2);
      const mat = new THREE.MeshPhysicalMaterial({
        color: 0xF58220,
        emissive: 0x753800,
        roughness: 0.1,
        metalness: 0.4,
        transmission: 0.6,
        thickness: 0.5,
        clearcoat: 0.8
      });
      const mesh = new THREE.Mesh(geo, mat);

      // Orbital position around pouch
      const angle = (i / 6) * Math.PI * 2;
      const radius = 2.8 + Math.random() * 0.8;
      mesh.position.set(
        Math.cos(angle) * radius,
        (Math.random() - 0.5) * 3,
        Math.sin(angle) * radius - 0.5
      );

      mesh.userData = {
        baseY: mesh.position.y,
        speed: 0.008 + Math.random() * 0.012,
        rotSpeed: 0.01,
        radius: radius,
        angle: angle
      };

      group.add(mesh);
      ingredientsGroup.push(mesh);
    }

    // 2. Fudge / Chocolate Cubes
    for (let i = 0; i < 4; i++) {
      const geo = new THREE.BoxGeometry(0.45, 0.45, 0.45);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x4A3B32,
        roughness: 0.5,
        metalness: 0.2
      });
      const mesh = new THREE.Mesh(geo, mat);

      const angle = (i / 4) * Math.PI * 2 + 0.5;
      const radius = 2.5 + Math.random() * 0.5;
      mesh.position.set(
        Math.cos(angle) * radius,
        (Math.random() - 0.5) * 2.5,
        Math.sin(angle) * radius
      );

      mesh.userData = {
        baseY: mesh.position.y,
        speed: 0.005 + Math.random() * 0.01,
        rotSpeed: 0.015,
        radius: radius,
        angle: angle
      };

      group.add(mesh);
      ingredientsGroup.push(mesh);
    }

    // 3. Prebiotic Fiber Molecule Crystal Clusters
    for (let i = 0; i < 5; i++) {
      const cluster = new THREE.Group();
      const atomGeo = new THREE.SphereGeometry(0.12, 16, 16);
      const atomMat = new THREE.MeshStandardMaterial({
        color: 0x71c7fe,
        emissive: 0x004b83,
        roughness: 0.2,
        metalness: 0.8
      });

      for (let k = 0; k < 4; k++) {
        const atom = new THREE.Mesh(atomGeo, atomMat);
        atom.position.set(
          (Math.random() - 0.5) * 0.5,
          (Math.random() - 0.5) * 0.5,
          (Math.random() - 0.5) * 0.5
        );
        cluster.add(atom);
      }

      const angle = (i / 5) * Math.PI * 2 + 1.2;
      const radius = 3.2;
      cluster.position.set(
        Math.cos(angle) * radius,
        (Math.random() - 0.5) * 3,
        Math.sin(angle) * radius
      );

      cluster.userData = {
        baseY: cluster.position.y,
        speed: 0.007,
        rotSpeed: 0.02,
        radius: radius,
        angle: angle
      };

      group.add(cluster);
      ingredientsGroup.push(cluster);
    }

    heroScene.add(group);
  }

  // Particle Swarm Aura surrounding product
  function createProductParticleAura() {
    const particleCount = 200;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const scales = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 7;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6;
      scales[i] = Math.random() * 0.1 + 0.03;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('scale', new THREE.BufferAttribute(scales, 1));

    const material = new THREE.PointsMaterial({
      color: 0xF58220,
      size: 0.12,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });

    particleSystem = new THREE.Points(geometry, material);
    heroScene.add(particleSystem);
  }

  // ==========================================
  // 2. FULL-VIEWPORT 3D BACKGROUND CANVAS
  // ==========================================
  function initBackground3D() {
    const bgContainer = document.getElementById('bg-3d-canvas');
    if (!bgContainer) return;

    bgScene = new THREE.Scene();
    bgCamera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    bgCamera.position.z = 20;

    bgRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
    bgRenderer.setSize(window.innerWidth, window.innerHeight);
    bgRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    bgContainer.appendChild(bgRenderer.domElement);

    // Floating Ambient Dust Particles
    const count = 400;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

    const mat = new THREE.PointsMaterial({
      color: 0x1A63A5,
      size: 0.15,
      transparent: true,
      opacity: 0.25,
      blending: THREE.AdditiveBlending
    });

    bgParticles = new THREE.Points(geo, mat);
    bgScene.add(bgParticles);
  }

  // ==========================================
  // 3. NUTRITION SECTION 3D ORBITAL RADAR
  // ==========================================
  // ==========================================
  // 3. NUTRITION SECTION 3D ORBITAL RADAR
  // ==========================================
  function initNutritionRadar3D() {
    const container = document.getElementById('nutrition-radar-3d');
    if (!container) return;

    // Safety fallback dimensions
    const width = container.clientWidth || container.offsetWidth || 800;
    const height = container.clientHeight || container.offsetHeight || 280;

    radarScene = new THREE.Scene();
    radarCamera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    radarCamera.position.set(0, 0, 7.5);

    radarRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    radarRenderer.setSize(width, height);
    radarRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    container.innerHTML = '';
    container.appendChild(radarRenderer.domElement);

    radarGroup = new THREE.Group();

    // Central Core Sphere (Cellular Nucleus)
    const coreGeo = new THREE.IcosahedronGeometry(0.85, 3);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x102E5C,
      emissive: 0x1A63A5,
      roughness: 0.15,
      metalness: 0.85
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    radarGroup.add(coreMesh);

    // Glowing Wireframe Outer Cage
    const cageGeo = new THREE.IcosahedronGeometry(1.15, 1);
    const cageMat = new THREE.MeshBasicMaterial({
      color: 0x71c7fe,
      wireframe: true,
      transparent: true,
      opacity: 0.5
    });
    const cageMesh = new THREE.Mesh(cageGeo, cageMat);
    radarGroup.add(cageMesh);

    // 4 Orbiting Macro Satellites with Text Badges
    const satellites = [
      { name: '18.8g Protein', colorHex: '#F58220', color: 0xF58220, radius: 2.6, speed: 0.012, angle: 0 },
      { name: '4.8g Fibre', colorHex: '#008A44', color: 0x008A44, radius: 2.6, speed: 0.012, angle: Math.PI / 2 },
      { name: '0g Sugar', colorHex: '#71c7fe', color: 0x71c7fe, radius: 2.6, speed: 0.012, angle: Math.PI },
      { name: 'Active B12', colorHex: '#F58220', color: 0xF58220, radius: 2.6, speed: 0.012, angle: (Math.PI * 3) / 2 }
    ];

    satellites.forEach((sat) => {
      // Satellite Parent Group
      const satGroup = new THREE.Group();

      // Orbital Ring Line
      const ringGeo = new THREE.RingGeometry(sat.radius - 0.02, sat.radius + 0.02, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: sat.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.35
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2.5;
      radarGroup.add(ringMesh);

      // Satellite Sphere
      const satGeo = new THREE.SphereGeometry(0.32, 32, 32);
      const satMat = new THREE.MeshStandardMaterial({
        color: sat.color,
        emissive: sat.color,
        emissiveIntensity: 0.3,
        metalness: 0.6,
        roughness: 0.2
      });
      const satMesh = new THREE.Mesh(satGeo, satMat);
      satGroup.add(satMesh);

      // 3D Canvas Text Sprite Label
      const sprite = createSatSprite(sat.name, sat.colorHex);
      sprite.position.set(0, 0.55, 0);
      satGroup.add(sprite);

      satGroup.userData = sat;
      satGroup.position.set(
        Math.cos(sat.angle) * sat.radius,
        0,
        Math.sin(sat.angle) * sat.radius
      );

      radarGroup.add(satGroup);
    });

    // Lights
    const amb = new THREE.AmbientLight(0xffffff, 1.8);
    const dir = new THREE.DirectionalLight(0xffffff, 2.5);
    dir.position.set(5, 8, 5);
    radarScene.add(amb, dir);

    radarScene.add(radarGroup);

    // Resize Observer for Container
    if (window.ResizeObserver) {
      const ro = new ResizeObserver(() => {
        const rw = container.clientWidth || container.offsetWidth || 800;
        const rh = container.clientHeight || container.offsetHeight || 280;
        if (rw && rh && radarCamera && radarRenderer) {
          radarCamera.aspect = rw / rh;
          radarCamera.updateProjectionMatrix();
          radarRenderer.setSize(rw, rh);
        }
      });
      ro.observe(container);
    }
  }

  // Create Canvas Text Sprite for Satellite Labels
  function createSatSprite(text, borderHex) {
    const canvas = document.createElement('canvas');
    canvas.width = 384;
    canvas.height = 96;
    const ctx = canvas.getContext('2d');

    // Pill Background
    ctx.fillStyle = '#102E5C';
    ctx.strokeStyle = borderHex;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.roundRect(8, 8, 368, 80, 40);
    ctx.fill();
    ctx.stroke();

    // Text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 36px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 192, 48);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(1.6, 0.4, 1);
    return sprite;
  }


  // ==========================================
  // 4. 3D CSS TILT & SPECULAR SHINE FOR CARDS
  // ==========================================
  function initCSSTiltEffects() {
    const tiltElements = document.querySelectorAll(
      '.glass-card-premium, .ingredient-card, #col-regular, #col-newme, .tilt-3d'
    );

    tiltElements.forEach(el => {
      // Ensure 3D parent context
      el.style.transformStyle = 'preserve-3d';
      el.style.transition = 'transform 0.15s ease-out, box-shadow 0.3s ease';

      // Insert Specular Reflection Layer
      if (!el.querySelector('.specular-shine')) {
        const shine = document.createElement('div');
        shine.className = 'specular-shine';
        shine.style.cssText = `
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: radial-gradient(circle at 50% 50%, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 70%);
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.3s ease;
          z-index: 20;
        `;
        el.style.position = 'relative';
        el.appendChild(shine);
      }

      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -10; // Max 10 deg tilt
        const rotateY = ((x - centerX) / centerX) * 10;

        el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(8px)`;

        const shine = el.querySelector('.specular-shine');
        if (shine) {
          shine.style.opacity = '1';
          shine.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 65%)`;
        }
      });

      el.addEventListener('mouseleave', () => {
        el.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
        const shine = el.querySelector('.specular-shine');
        if (shine) shine.style.opacity = '0';
      });
    });
  }

  // ==========================================
  // 5. 3D HOTSPOTS ON PRODUCT
  // ==========================================
  function initHotspots() {
    const hotspots = document.querySelectorAll('.3d-hotspot-btn');
    hotspots.forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        const targetAttr = this.getAttribute('data-target');
        const tooltip = document.getElementById(targetAttr);

        // Toggle tooltips
        document.querySelectorAll('.hotspot-tooltip').forEach(t => {
          if (t !== tooltip) t.classList.add('hidden');
        });

        if (tooltip) {
          tooltip.classList.toggle('hidden');
        }

        // Animate 3D Pouch slight rotation towards hotspot
        if (pouchGroup) {
          gsap.to(pouchGroup.rotation, {
            y: (Math.random() - 0.5) * 0.8,
            duration: 0.8,
            ease: 'power2.out'
          });
        }
      });
    });
  }

  // ==========================================
  // 6. EVENT LISTENERS & INTERACTION CONTROLS
  // ==========================================
  function setupEventListeners() {
    // Mouse tracking for parallax
    window.addEventListener('mousemove', (e) => {
      STATE.mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
      STATE.mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    // Scroll tracking
    window.addEventListener('scroll', () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      STATE.scrollProgress = window.scrollY / (maxScroll || 1);

      // Rotate background particles on scroll
      if (bgParticles) {
        bgParticles.rotation.y = STATE.scrollProgress * Math.PI;
      }
    });

    // Flavor Selector Controls
    document.querySelectorAll('[data-flavor]').forEach(btn => {
      btn.addEventListener('click', function() {
        const flavorKey = this.getAttribute('data-flavor');
        if (FLAVORS[flavorKey]) {
          setFlavor(flavorKey);
        }
      });
    });

    // 3D Explosion Mode Toggle Button
    const btnExplode = document.getElementById('btn-3d-explode');
    if (btnExplode) {
      btnExplode.addEventListener('click', toggleExplodedMode);
    }

    // Auto Rotate Toggle
    const btnRotate = document.getElementById('btn-3d-rotate');
    if (btnRotate) {
      btnRotate.addEventListener('click', () => {
        STATE.autoRotate = !STATE.autoRotate;
        btnRotate.classList.toggle('bg-navy-heading');
        btnRotate.classList.toggle('text-white');
      });
    }

    // Drag-to-Rotate 3D Canvas
    const heroContainer = document.getElementById('hero-3d-container');
    if (heroContainer) {
      let isDragging = false;
      let previousMousePosition = { x: 0, y: 0 };

      heroContainer.addEventListener('mousedown', (e) => {
        isDragging = true;
        previousMousePosition = { x: e.clientX, y: e.clientY };
      });

      window.addEventListener('mouseup', () => {
        isDragging = false;
      });

      heroContainer.addEventListener('mousemove', (e) => {
        if (!isDragging || !pouchGroup) return;

        const deltaMove = {
          x: e.clientX - previousMousePosition.x,
          y: e.clientY - previousMousePosition.y
        };

        pouchGroup.rotation.y += deltaMove.x * 0.01;
        pouchGroup.rotation.x += deltaMove.y * 0.01;

        previousMousePosition = { x: e.clientX, y: e.clientY };
      });
    }
  }

  // Set Flavor & update 3D materials dynamically
  function setFlavor(flavorKey) {
    STATE.flavor = flavorKey;
    updateLabelTexture();

    const flavorData = FLAVORS[flavorKey];

    // Animate pouch scale bump
    if (pouchGroup) {
      gsap.to(pouchGroup.scale, {
        x: 1.08, y: 1.08, z: 1.08,
        duration: 0.2,
        yoyo: true,
        repeat: 1,
        ease: 'power2.inOut'
      });
    }

    // Update flavor button visual states
    document.querySelectorAll('[data-flavor]').forEach(btn => {
      const isSelected = btn.getAttribute('data-flavor') === flavorKey;
      if (isSelected) {
        btn.className = 'px-5 py-2.5 rounded-full bg-navy-heading text-white text-xs font-bold shadow-md cursor-pointer transition-all scale-105';
      } else {
        btn.className = 'px-5 py-2.5 rounded-full bg-white/90 border border-border-light text-navy-heading text-xs font-semibold hover:bg-white hover:shadow-xs cursor-pointer transition-all';
      }
    });

    // Update displayed flavor titles & prices across DOM
    const titleElements = document.querySelectorAll('.flavor-title-display');
    titleElements.forEach(el => el.textContent = flavorData.name);

    const priceElements = document.querySelectorAll('.flavor-price-display');
    priceElements.forEach(el => el.textContent = flavorData.price);
  }

  // Toggle 3D Formula Explosion
  function toggleExplodedMode() {
    STATE.explodedMode = !STATE.explodedMode;

    const targetY = STATE.explodedMode ? 1.5 : 0.2;
    const targetSpread = STATE.explodedMode ? 2.2 : 1.0;

    if (pouchGroup) {
      gsap.to(pouchGroup.position, {
        y: targetY,
        duration: 1.2,
        ease: 'back.out(1.7)'
      });
    }

    ingredientsGroup.forEach((mesh) => {
      const origRadius = mesh.userData.radius || 2.5;
      const newRadius = origRadius * targetSpread;

      gsap.to(mesh.position, {
        x: Math.cos(mesh.userData.angle) * newRadius,
        z: Math.sin(mesh.userData.angle) * newRadius,
        duration: 1.2,
        ease: 'elastic.out(1, 0.5)'
      });
    });

    const btn = document.getElementById('btn-3d-explode');
    if (btn) {
      btn.textContent = STATE.explodedMode ? 'Assemble Pouch 3D' : 'Explode 3D Formula';
    }
  }

  function onWindowResize() {
    if (heroCamera && heroRenderer) {
      const container = document.getElementById('hero-3d-container');
      if (container) {
        heroCamera.aspect = container.clientWidth / container.clientHeight;
        heroCamera.updateProjectionMatrix();
        heroRenderer.setSize(container.clientWidth, container.clientHeight);
      }
    }

    if (bgCamera && bgRenderer) {
      bgCamera.aspect = window.innerWidth / window.innerHeight;
      bgCamera.updateProjectionMatrix();
      bgRenderer.setSize(window.innerWidth, window.innerHeight);
    }
  }

  // ==========================================
  // 7. MAIN RENDER LOOP (60FPS)
  // ==========================================
  function animate() {
    requestAnimationFrame(animate);

    // Smooth Mouse Spring Interpolation
    STATE.mouse.x += (STATE.mouse.targetX - STATE.mouse.x) * 0.05;
    STATE.mouse.y += (STATE.mouse.targetY - STATE.mouse.y) * 0.05;

    // --- HERO 3D RENDER LOOP ---
    if (pouchGroup && heroRenderer) {
      if (STATE.autoRotate) {
        pouchGroup.rotation.y += 0.006;
      }

      // Parallax mouse tilt
      pouchGroup.rotation.x = STATE.mouse.y * 0.15;
      pouchGroup.position.x = STATE.mouse.x * 0.3;

      // Float Y Sine Wave
      pouchGroup.position.y += Math.sin(Date.now() * 0.002) * 0.002;

      // Animate Floating Ingredients
      ingredientsGroup.forEach((mesh) => {
        mesh.rotation.x += mesh.userData.rotSpeed || 0.01;
        mesh.rotation.y += mesh.userData.rotSpeed || 0.01;

        // Floating orbit
        mesh.userData.angle += mesh.userData.speed || 0.005;
        const r = mesh.userData.radius;
        mesh.position.x = Math.cos(mesh.userData.angle) * r;
        mesh.position.z = Math.sin(mesh.userData.angle) * r;
        mesh.position.y = mesh.userData.baseY + Math.sin(Date.now() * 0.003 + r) * 0.25;
      });

      // Particle Aura Rotation
      if (particleSystem) {
        particleSystem.rotation.y -= 0.002;
      }

      heroRenderer.render(heroScene, heroCamera);
    }

    // --- BACKGROUND 3D RENDER LOOP ---
    if (bgRenderer && bgScene) {
      if (bgParticles) {
        bgParticles.rotation.y += 0.0005;
        bgParticles.position.x = STATE.mouse.x * 1.5;
        bgParticles.position.y = STATE.mouse.y * 1.5;
      }
      bgRenderer.render(bgScene, bgCamera);
    }

    // --- NUTRITION RADAR 3D RENDER LOOP ---
    if (radarRenderer && radarScene && radarGroup) {
      radarGroup.rotation.y += 0.008;
      radarGroup.rotation.x = Math.sin(Date.now() * 0.001) * 0.1;

      // Update orbiting satellites
      radarGroup.children.forEach(child => {
        if (child.userData && child.userData.radius) {
          const sat = child.userData;
          sat.angle += sat.speed;
          child.position.x = Math.cos(sat.angle) * sat.radius;
          child.position.z = Math.sin(sat.angle) * sat.radius;
        }
      });

      radarRenderer.render(radarScene, radarCamera);
    }
  }

})();
