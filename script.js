import * as THREE from './node_modules/three/build/three.module.js';

const artworks = [
    ['Simple Boy', '2026', 'images/art-1.jpg', 1920, 1920, 'A quiet opening portrait with a direct, intimate presence.'],
    ['Cityscape', '2026', 'images/art-2.jpg', 1920, 1920, 'A dense urban rhythm, framed like a memory from street level.'],
    ['Neon Dreams', '2026', 'images/art-3.jpg', 1920, 2560, 'Color and shadow stretch upward with a nocturnal charge.'],
    ['Urban Legend', '2026', 'images/art-4.jpg', 1920, 2560, 'A cinematic figure study with myth built into the pose.'],
    ['Early Mornings', '2025', 'images/art-5.jpg', 1920, 3040, 'Soft tension and early light make the scene feel half-awake.'],
    ['Performance', '2026', 'images/art-6.jpg', 1920, 1212, 'A wide composition that reads like a stage under pressure.'],
    ['City Lights', '2026', 'images/art-7.jpg', 1920, 3040, 'A vertical pulse of night, movement, and electric color.'],
    ['Hooligan', '2025', 'images/art-8.jpg', 1920, 3040, 'A portrait with attitude, speed, and a little defiance.'],
    ['Schoolyard', '2025', 'images/art-9.jpg', 1920, 3040, 'A grounded scene with the charge of a remembered place.'],
    ['Boy Unnamed', '2026', 'images/art-10.jpg', 595, 842, 'A spare portrait that leaves room for mystery.'],
    ['Dark Hotel Nights', '2026', 'images/art-11.jpg', 1000, 1000, 'A square-format mood piece with late-night gravity.'],
    ['Trip To The City', '2026', 'images/art-12.jpg', 1415, 871, 'A panoramic pause in the collection, open and cinematic.']
].map(([title, year, src, width, height, detail], index) => ({
    title,
    year,
    src,
    width,
    height,
    detail,
    index,
    side: index % 2 === 0 ? 'left' : 'right',
    z: -5.5 - index * 5.1
}));

const featureArtwork = {
    title: 'Night Angel',
    year: '2026',
    src: 'images/art-13.jpg',
    width: 595,
    height: 842,
    detail: 'A luminous final presence at the end of the gallery.'
};

const canvas = document.getElementById('galleryCanvas');
const entrance = document.getElementById('entrance-screen');
const enterDoor = document.getElementById('enterDoor');
const focusSide = document.getElementById('focusSide');
const focusTitle = document.getElementById('focusTitle');
const focusMeta = document.getElementById('focusMeta');
const focusCard = document.getElementById('focusCard');
const focusDetail = document.getElementById('focusDetail');
const closeFocus = document.getElementById('closeFocus');
const soundToggle = document.getElementById('soundToggle');
const progressDots = document.getElementById('progressDots');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x090a0a);
scene.fog = new THREE.Fog(0x10100e, 18, 76);

const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 120);
camera.position.set(0, 1.72, 2.6);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const textureLoader = new THREE.TextureLoader();
const clickableArt = [];
const clock = new THREE.Clock();
const keys = new Set();
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const cameraTarget = new THREE.Vector3(0, 1.72, 2.6);
const lookTarget = new THREE.Vector3(0, 1.55, -9);
const activeLook = new THREE.Vector3(0, 1.55, -9);
const guideLights = [];
const progressButtons = [];
const atmosphere = {
    motes: null,
    sculpture: null,
    floorGlints: []
};

let yaw = 0;
let pitch = 0;
let pointerDown = false;
let lastPointer = { x: 0, y: 0 };
let pointerStart = { x: 0, y: 0 };
let dragDistance = 0;
let entered = false;
let focusedArt = null;
let audioContext = null;
let audioMaster = null;
let soundEnabled = false;
let lastStepTime = 0;
let stepSide = -1;

buildGallery();
wireEvents();
buildProgressMap();
animate();

function buildGallery() {
    scene.add(new THREE.HemisphereLight(0xf7efe0, 0x171818, 0.58));
    scene.add(new THREE.AmbientLight(0xfff2df, 0.18));

    const corridor = new THREE.Group();
    scene.add(corridor);

    const length = 84;
    const width = 7;
    const height = 4.15;

    const floorTexture = makeGridTexture('#1c1d1b', '#2a2a27', 30, 0.3);
    floorTexture.wrapS = THREE.RepeatWrapping;
    floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(5, 52);

    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(width, length),
        new THREE.MeshStandardMaterial({ map: floorTexture, roughness: 0.82, metalness: 0.04 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, -length / 2 + 4);
    floor.receiveShadow = true;
    corridor.add(floor);

    const ceiling = new THREE.Mesh(
        new THREE.PlaneGeometry(width, length),
        new THREE.MeshStandardMaterial({ color: 0x101111, roughness: 0.92 })
    );
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(0, height, -length / 2 + 4);
    ceiling.receiveShadow = true;
    corridor.add(ceiling);

    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x1d1d1a, roughness: 0.86 });
    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(length, height), wallMaterial);
    leftWall.position.set(-width / 2, height / 2, -length / 2 + 4);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.receiveShadow = true;
    corridor.add(leftWall);

    const rightWall = leftWall.clone();
    rightWall.position.x = width / 2;
    rightWall.rotation.y = -Math.PI / 2;
    corridor.add(rightWall);

    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(width, height), wallMaterial);
    backWall.position.set(0, height / 2, -length + 4);
    backWall.receiveShadow = true;
    corridor.add(backWall);

    addWallTrim(width, length, height, corridor);
    addTitleWall();
    addGuideLights(length);
    addCreativeAtmosphere(width, length, height, corridor);
    artworks.forEach(addArtwork);
    addEndPiece();
}

function addWallTrim(width, length, height, corridor) {
    const trimMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2822, roughness: 0.58, metalness: 0.12 });
    const railGeometry = new THREE.BoxGeometry(0.08, 0.08, length);
    [-width / 2 + 0.04, width / 2 - 0.04].forEach((x) => {
        [0.22, height - 0.2].forEach((y) => {
            const rail = new THREE.Mesh(railGeometry, trimMaterial);
            rail.position.set(x, y, -length / 2 + 4);
            rail.castShadow = true;
            corridor.add(rail);
        });
    });
}

function addTitleWall() {
    const titleTexture = makeWallTextTexture({
        eyebrow: 'Harley.dev',
        title: 'The Digital Collection',
        body: 'A walk-through exhibition of artwork created using CSP and Procreate.'
    });

    const titlePanel = new THREE.Mesh(
        new THREE.PlaneGeometry(2.4, 1.35),
        new THREE.MeshStandardMaterial({ map: titleTexture, roughness: 0.44, metalness: 0.06 })
    );
    titlePanel.position.set(-3.39, 2.35, -1.9);
    titlePanel.rotation.y = Math.PI / 2;
    scene.add(titlePanel);

    const titleLight = new THREE.SpotLight(0xffe7bf, 1.9, 7, 0.48, 0.58, 1.2);
    titleLight.position.set(-1.1, 3.7, -1.45);
    titleLight.target.position.set(-3.4, 2.3, -1.9);
    scene.add(titleLight, titleLight.target);
}

function addGuideLights(length) {
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0xffd79a,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });

    for (let z = -6; z > -length + 8; z -= 9) {
        const ceilingGlow = new THREE.PointLight(0xffead0, 0.12, 9, 1.55);
        ceilingGlow.position.set(0, 3.55, z);
        scene.add(ceilingGlow);

        const floorPool = new THREE.Mesh(
            new THREE.CircleGeometry(1.65, 48),
            glowMaterial.clone()
        );
        floorPool.position.set(0, 0.012, z);
        floorPool.rotation.x = -Math.PI / 2;
        scene.add(floorPool);

        guideLights.push({ z, ceilingGlow, floorPool });
    }
}

function addCreativeAtmosphere(width, length, height, corridor) {
    addCeilingRibbons(width, length, height, corridor);
    addFloorGlints();
    addEntrySculpture();
    addDustMotes(length);
}

function addCeilingRibbons(width, length, height, corridor) {
    const ribbonMaterial = new THREE.MeshStandardMaterial({
        color: 0xe8edf0,
        emissive: 0xdfe8ec,
        emissiveIntensity: 0.38,
        roughness: 0.32,
        metalness: 0.08
    });

    [-width / 2 + 1.1, width / 2 - 1.1].forEach((x) => {
        const ribbon = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.025, length - 6), ribbonMaterial);
        ribbon.position.set(x, height - 0.04, -length / 2 + 1);
        ribbon.castShadow = false;
        corridor.add(ribbon);
    });
}

function addFloorGlints() {
    const glintTexture = makeFloorGlintTexture();

    artworks.forEach((art) => {
        const glint = new THREE.Mesh(
            new THREE.PlaneGeometry(2.45, 1.1),
            new THREE.MeshBasicMaterial({
                map: glintTexture,
                transparent: true,
                opacity: 0.13,
                depthWrite: false,
                blending: THREE.AdditiveBlending
            })
        );
        glint.position.set(0, 0.016, art.z + 0.45);
        glint.rotation.x = -Math.PI / 2;
        glint.rotation.z = art.side === 'left' ? 0.18 : -0.18;
        scene.add(glint);
        atmosphere.floorGlints.push(glint);
    });
}

function addEntrySculpture() {
    const pedestal = new THREE.Mesh(
        new THREE.CylinderGeometry(0.42, 0.5, 0.72, 40),
        new THREE.MeshStandardMaterial({ color: 0x1a1b19, roughness: 0.42, metalness: 0.2 })
    );
    pedestal.position.set(1.55, 0.36, -2.15);
    pedestal.castShadow = true;
    pedestal.receiveShadow = true;
    scene.add(pedestal);

    const sculptureGroup = new THREE.Group();
    sculptureGroup.position.set(1.55, 1.08, -2.15);
    scene.add(sculptureGroup);
    atmosphere.sculpture = sculptureGroup;

    const glassMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xe9f6ff,
        roughness: 0.08,
        metalness: 0.02,
        transmission: 0.25,
        transparent: true,
        opacity: 0.55,
        clearcoat: 1,
        clearcoatRoughness: 0.12
    });

    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.035, 18, 80), glassMaterial);
    ring.rotation.set(Math.PI / 2.6, 0.25, 0);
    sculptureGroup.add(ring);

    const prism = new THREE.Mesh(new THREE.IcosahedronGeometry(0.22, 0), glassMaterial);
    prism.position.y = 0.04;
    prism.rotation.set(0.4, 0.2, 0.8);
    sculptureGroup.add(prism);

    const sculptureLight = new THREE.PointLight(0xdff6ff, 0.8, 3.4, 1.8);
    sculptureLight.position.set(1.55, 1.4, -2.15);
    scene.add(sculptureLight);
}

function addDustMotes(length) {
    const count = 360;
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i += 1) {
        positions[i * 3] = THREE.MathUtils.randFloatSpread(5.2);
        positions[i * 3 + 1] = THREE.MathUtils.randFloat(0.8, 3.55);
        positions[i * 3 + 2] = THREE.MathUtils.randFloat(-length + 5, -2);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    atmosphere.motes = new THREE.Points(
        geometry,
        new THREE.PointsMaterial({
            color: 0xfff7df,
            size: 0.028,
            transparent: true,
            opacity: 0.34,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        })
    );
    scene.add(atmosphere.motes);
}

function addArtwork(art) {
    const group = new THREE.Group();
    const onLeft = art.side === 'left';
    const wallX = onLeft ? -3.43 : 3.43;
    const facing = onLeft ? Math.PI / 2 : -Math.PI / 2;
    const size = fittedArtSize(art);
    const frameWidth = size.width;
    const frameHeight = size.height;

    group.position.set(wallX, 2.05, art.z);
    group.rotation.y = facing;
    group.userData.art = art;
    scene.add(group);

    const back = new THREE.Mesh(
        new THREE.BoxGeometry(frameWidth + 0.32, frameHeight + 0.34, 0.09),
        new THREE.MeshStandardMaterial({ color: 0x111211, roughness: 0.72 })
    );
    back.position.z = -0.035;
    back.castShadow = true;
    group.add(back);

    const borderMaterial = new THREE.MeshStandardMaterial({ color: 0x27231c, roughness: 0.42, metalness: 0.18 });
    const verticalGeo = new THREE.BoxGeometry(0.12, frameHeight + 0.34, 0.16);
    const horizontalGeo = new THREE.BoxGeometry(frameWidth + 0.34, 0.12, 0.16);
    [
        [-frameWidth / 2 - 0.1, 0, 0.055, verticalGeo],
        [frameWidth / 2 + 0.1, 0, 0.055, verticalGeo],
        [0, frameHeight / 2 + 0.1, 0.055, horizontalGeo],
        [0, -frameHeight / 2 - 0.1, 0.055, horizontalGeo]
    ].forEach(([x, y, z, geo]) => {
        const rail = new THREE.Mesh(geo, borderMaterial);
        rail.position.set(x, y, z);
        rail.castShadow = true;
        group.add(rail);
    });

    const texture = textureLoader.load(art.src, (loaded) => {
        loaded.colorSpace = THREE.SRGBColorSpace;
        loaded.anisotropy = renderer.capabilities.getMaxAnisotropy();
    });
    texture.colorSpace = THREE.SRGBColorSpace;

    const image = new THREE.Mesh(
        new THREE.PlaneGeometry(frameWidth, frameHeight),
        new THREE.MeshStandardMaterial({ map: texture, roughness: 0.46 })
    );
    image.position.z = 0.14;
    image.userData.art = art;
    clickableArt.push(image);
    group.add(image);

    const hitTarget = new THREE.Mesh(
        new THREE.PlaneGeometry(frameWidth + 0.55, frameHeight + 0.7),
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
    );
    hitTarget.position.z = 0.24;
    hitTarget.userData.art = art;
    clickableArt.push(hitTarget);
    group.add(hitTarget);

    const plaqueTexture = makePlaqueTexture(art);
    const plaque = new THREE.Mesh(
        new THREE.PlaneGeometry(1.35, 0.42),
        new THREE.MeshStandardMaterial({ map: plaqueTexture, roughness: 0.32, metalness: 0.24 })
    );
    plaque.position.set(0, -1.55, 0.16);
    group.add(plaque);

    addSpotlight(art, wallX, onLeft);
}

function addSpotlight(art, wallX, onLeft) {
    const light = new THREE.SpotLight(0xfff1cf, 2.85, 9.5, 0.44, 0.62, 1.1);
    light.position.set(onLeft ? -1.2 : 1.2, 3.78, art.z + 0.35);
    light.target.position.set(wallX, 1.95, art.z);
    light.castShadow = true;
    light.shadow.mapSize.set(1024, 1024);
    scene.add(light, light.target);

    const can = new THREE.Mesh(
        new THREE.CylinderGeometry(0.16, 0.2, 0.18, 32),
        new THREE.MeshStandardMaterial({ color: 0x2a2b28, roughness: 0.48, metalness: 0.35 })
    );
    can.position.copy(light.position);
    can.rotation.x = Math.PI / 2;
    scene.add(can);
}

function addEndPiece() {
    const feature = featureArtwork;
    const endGlow = new THREE.PointLight(0xd8bc82, 2.8, 13, 1.45);
    endGlow.position.set(0, 2.4, -77.5);
    scene.add(endGlow);

    const showcaseSpot = new THREE.SpotLight(0xf8fbff, 2.45, 9.5, 0.28, 0.82, 1.25);
    showcaseSpot.position.set(0, 3.95, -77.35);
    showcaseSpot.target.position.set(0, 2.25, -79.92);
    showcaseSpot.castShadow = true;
    showcaseSpot.shadow.mapSize.set(1024, 1024);
    scene.add(showcaseSpot, showcaseSpot.target);

    const showcaseCan = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.3, 0.22, 36),
        new THREE.MeshStandardMaterial({ color: 0x2f302c, roughness: 0.38, metalness: 0.42 })
    );
    showcaseCan.position.copy(showcaseSpot.position);
    showcaseCan.rotation.x = Math.PI / 2;
    scene.add(showcaseCan);

    const showcaseHalo = new THREE.Mesh(
        new THREE.PlaneGeometry(2.05, 2.9),
        new THREE.MeshBasicMaterial({
            map: makeShowcaseGlowTexture(),
            transparent: true,
            opacity: 0.38,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        })
    );
    showcaseHalo.position.set(0, 2.36, -79.87);
    scene.add(showcaseHalo);

    const featureTexture = textureLoader.load(feature.src, (loaded) => {
        loaded.colorSpace = THREE.SRGBColorSpace;
        loaded.anisotropy = renderer.capabilities.getMaxAnisotropy();
    });
    featureTexture.colorSpace = THREE.SRGBColorSpace;

    const featureGroup = new THREE.Group();
    featureGroup.position.set(0, 2.25, -79.92);
    scene.add(featureGroup);

    const featureFrame = new THREE.Mesh(
        new THREE.BoxGeometry(2.15, 3.1, 0.12),
        new THREE.MeshStandardMaterial({ color: 0x171511, roughness: 0.48, metalness: 0.18 })
    );
    featureFrame.position.z = -0.04;
    featureFrame.castShadow = true;
    featureGroup.add(featureFrame);

    const featureImage = new THREE.Mesh(
        new THREE.PlaneGeometry(1.78, 2.52),
        new THREE.MeshStandardMaterial({ map: featureTexture, roughness: 0.42 })
    );
    featureImage.position.z = 0.05;
    featureGroup.add(featureImage);

    const featureLabel = new THREE.Mesh(
        new THREE.PlaneGeometry(2.4, 0.52),
        new THREE.MeshStandardMaterial({ map: makeWallTextTexture({
            eyebrow: 'Final View',
            title: 'Night Angel',
            body: 'A luminous final presence at the end of the gallery.'
        }), roughness: 0.42, metalness: 0.08 })
    );
    featureLabel.position.set(0, -2.1, 0.06);
    featureGroup.add(featureLabel);

    const bench = new THREE.Mesh(
        new THREE.BoxGeometry(2.7, 0.25, 0.72),
        new THREE.MeshStandardMaterial({ color: 0x25231f, roughness: 0.6 })
    );
    bench.position.set(0, 0.42, -76.2);
    bench.castShadow = true;
    bench.receiveShadow = true;
    scene.add(bench);

    const legs = new THREE.Mesh(
        new THREE.BoxGeometry(2.35, 0.42, 0.08),
        new THREE.MeshStandardMaterial({ color: 0x111211, roughness: 0.7 })
    );
    legs.position.set(0, 0.18, -76.2);
    scene.add(legs);
}

function wireEvents() {
    enterDoor.addEventListener('click', openGallery);
    closeFocus.addEventListener('click', clearFocus);
    soundToggle.addEventListener('click', toggleSound);

    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            clearFocus();
            return;
        }

        keys.add(event.key.toLowerCase());
    });
    window.addEventListener('keyup', (event) => keys.delete(event.key.toLowerCase()));

    window.addEventListener('wheel', (event) => {
        cameraTarget.z -= Math.sign(event.deltaY) * 1.15;
        playFootstep();
        clampCameraTarget();
    }, { passive: true });

    canvas.addEventListener('pointerdown', (event) => {
        pointerDown = true;
        dragDistance = 0;
        pointerStart = { x: event.clientX, y: event.clientY };
        lastPointer = { x: event.clientX, y: event.clientY };
        canvas.setPointerCapture(event.pointerId);
    });

    canvas.addEventListener('pointermove', (event) => {
        if (!pointerDown) {
            return;
        }

        const moveX = event.clientX - lastPointer.x;
        const moveY = event.clientY - lastPointer.y;
        dragDistance = Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y);
        yaw -= moveX * 0.0022;
        pitch -= moveY * 0.0018;
        pitch = THREE.MathUtils.clamp(pitch, -0.42, 0.42);

        const direction = viewDirection();
        lookTarget.copy(cameraTarget).add(direction.multiplyScalar(7));
        lastPointer = { x: event.clientX, y: event.clientY };
    });

    canvas.addEventListener('pointerup', (event) => {
        pointerDown = false;
        canvas.releasePointerCapture(event.pointerId);
    });

    canvas.addEventListener('contextmenu', (event) => event.preventDefault());

    canvas.addEventListener('click', (event) => {
        if (dragDistance > 6) {
            return;
        }

        pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
        pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);

        const hit = raycaster.intersectObjects(clickableArt, false)[0];
        if (!hit) {
            return;
        }

        focusArtwork(hit.object.userData.art);
    });

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

function openGallery() {
    if (entered) {
        return;
    }

    entered = true;
    startAmbience();
    entrance.classList.add('entering');
    enterDoor.classList.add('doors-open');
    setTimeout(() => entrance.classList.add('hidden'), 1550);
}

function animate() {
    requestAnimationFrame(animate);
    const delta = Math.min(clock.getDelta(), 0.033);
    updateMovement(delta);

    camera.position.lerp(cameraTarget, 0.08);
    updateGuideLights();
    updateCreativeAtmosphere(delta);
    updateProgressMap();

    if (pointerDown) {
        const direction = viewDirection();
        activeLook.copy(camera.position).add(direction.multiplyScalar(7));
    } else {
        activeLook.lerp(lookTarget, 0.045);
    }

    camera.lookAt(activeLook);
    renderer.render(scene, camera);
}

function updateCreativeAtmosphere(delta) {
    if (atmosphere.motes) {
        atmosphere.motes.rotation.y += delta * 0.006;
        atmosphere.motes.position.y = Math.sin(clock.elapsedTime * 0.35) * 0.025;
    }

    if (atmosphere.sculpture) {
        atmosphere.sculpture.rotation.y += delta * 0.32;
        atmosphere.sculpture.rotation.x = Math.sin(clock.elapsedTime * 0.45) * 0.06;
    }

    atmosphere.floorGlints.forEach((glint, index) => {
        const pulse = Math.sin(clock.elapsedTime * 0.7 + index * 0.9) * 0.025;
        glint.material.opacity = 0.12 + pulse;
    });
}

function focusArtwork(art) {
    const onLeft = art.side === 'left';
    focusedArt = art;
    cameraTarget.x = onLeft ? -1.22 : 1.22;
    cameraTarget.z = art.z + 0.38;
    lookTarget.set(onLeft ? -3.32 : 3.32, 2.02, art.z);
    focusSide.textContent = onLeft ? 'Left wall' : 'Right wall';
    focusTitle.textContent = art.title;
    focusMeta.textContent = `${art.year} - Harley Jean`;
    focusDetail.textContent = art.detail;
    focusCard.classList.add('is-focused');
    clampCameraTarget();
    updateProgressMap();
}

function clearFocus() {
    focusedArt = null;
    cameraTarget.x = 0;
    lookTarget.set(cameraTarget.x + Math.sin(yaw) * 5, 1.65 + pitch, cameraTarget.z - Math.cos(yaw) * 5);
    focusSide.textContent = 'Gallery';
    focusTitle.textContent = 'Walk the hall';
    focusMeta.textContent = 'Drag to look around. Click a framed piece to move closer.';
    focusDetail.textContent = 'Move through the collection and let each room light up as you arrive.';
    focusCard.classList.remove('is-focused');
}

function startAmbience() {
    if (audioContext) {
        setSound(true);
        return;
    }

    audioContext = new AudioContext();
    audioMaster = audioContext.createGain();
    audioMaster.gain.value = 0;
    audioMaster.connect(audioContext.destination);

    const lowHum = audioContext.createOscillator();
    const highAir = audioContext.createOscillator();
    const lowGain = audioContext.createGain();
    const highGain = audioContext.createGain();

    lowHum.type = 'sine';
    lowHum.frequency.value = 58;
    highAir.type = 'triangle';
    highAir.frequency.value = 146;
    lowGain.gain.value = 0.045;
    highGain.gain.value = 0.012;

    lowHum.connect(lowGain).connect(audioMaster);
    highAir.connect(highGain).connect(audioMaster);
    lowHum.start();
    highAir.start();
    setSound(true);
}

function playFootstep() {
    if (!soundEnabled || !audioContext || !audioMaster) {
        return;
    }

    const now = audioContext.currentTime;
    if (now - lastStepTime < 0.34) {
        return;
    }

    lastStepTime = now;
    stepSide *= -1;

    const bufferSize = Math.floor(audioContext.sampleRate * 0.09);
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i += 1) {
        const fade = 1 - i / bufferSize;
        data[i] = (Math.random() * 2 - 1) * fade * fade;
    }

    const source = audioContext.createBufferSource();
    const lowpass = audioContext.createBiquadFilter();
    const gain = audioContext.createGain();
    const pan = audioContext.createStereoPanner();

    source.buffer = buffer;
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(520, now);
    lowpass.Q.value = 0.6;
    pan.pan.value = stepSide * 0.18;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.28, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

    source.connect(lowpass).connect(gain).connect(pan).connect(audioMaster);
    source.start(now);
    source.stop(now + 0.2);
}

function toggleSound() {
    if (!audioContext) {
        startAmbience();
        return;
    }

    setSound(!soundEnabled);
}

function setSound(enabled) {
    soundEnabled = enabled;
    soundToggle.setAttribute('aria-pressed', String(enabled));
    soundToggle.textContent = enabled ? 'Sound On' : 'Sound Off';

    if (audioContext?.state === 'suspended') {
        audioContext.resume();
    }

    if (audioMaster) {
        audioMaster.gain.cancelScheduledValues(audioContext.currentTime);
        audioMaster.gain.linearRampToValueAtTime(enabled ? 0.78 : 0, audioContext.currentTime + 0.35);
    }
}

function buildProgressMap() {
    artworks.forEach((art) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.setAttribute('aria-label', `View ${art.title}`);
        dot.addEventListener('click', () => focusArtwork(art));
        progressDots.appendChild(dot);
        progressButtons.push(dot);
    });
}

function updateProgressMap() {
    const current = focusedArt || artworks.reduce((closest, art) => {
        const artDistance = Math.abs(camera.position.z - art.z);
        const closestDistance = Math.abs(camera.position.z - closest.z);
        return artDistance < closestDistance ? art : closest;
    }, artworks[0]);

    progressButtons.forEach((button, index) => {
        button.classList.toggle('active', index === current.index);
    });
}

function updateGuideLights() {
    guideLights.forEach(({ z, ceilingGlow, floorPool }) => {
        const distance = Math.abs(camera.position.z - z);
        const influence = THREE.MathUtils.clamp(1 - distance / 12, 0, 1);
        const eased = influence * influence * (3 - 2 * influence);

        ceilingGlow.intensity = THREE.MathUtils.lerp(0.12, 1.35, eased);
        floorPool.material.opacity = THREE.MathUtils.lerp(0.02, 0.24, eased);
        floorPool.scale.setScalar(THREE.MathUtils.lerp(0.72, 1.25, eased));
    });
}

function viewDirection() {
    return new THREE.Vector3(
        Math.sin(yaw) * Math.cos(pitch),
        Math.sin(pitch),
        -Math.cos(yaw) * Math.cos(pitch)
    );
}

function updateMovement(delta) {
    if (!entered) {
        return;
    }

    const speed = (keys.has('shift') ? 5.6 : 3.1) * delta;
    const forward = Number(keys.has('w') || keys.has('arrowup')) - Number(keys.has('s') || keys.has('arrowdown'));
    const strafe = Number(keys.has('d') || keys.has('arrowright')) - Number(keys.has('a') || keys.has('arrowleft'));

    if (forward !== 0 || strafe !== 0) {
        if (focusedArt) {
            clearFocus();
        }

        cameraTarget.z -= forward * speed;
        cameraTarget.x += strafe * speed;
        lookTarget.set(cameraTarget.x + Math.sin(yaw) * 5, 1.65 + pitch, cameraTarget.z - Math.cos(yaw) * 5);
        playFootstep();
        focusSide.textContent = 'Gallery';
        focusTitle.textContent = 'Walk the hall';
        focusMeta.textContent = 'Drag to look around. Click a framed piece to move closer.';
        clampCameraTarget();
    }
}

function clampCameraTarget() {
    cameraTarget.x = THREE.MathUtils.clamp(cameraTarget.x, -1.65, 1.65);
    cameraTarget.y = 1.72;
    cameraTarget.z = THREE.MathUtils.clamp(cameraTarget.z, -77.2, 2.8);
}

function fittedArtSize(art) {
    const aspect = art.width / art.height;
    const maxWidth = 1.95;
    const maxHeight = 2.25;

    if (aspect > maxWidth / maxHeight) {
        return { width: maxWidth, height: maxWidth / aspect };
    }

    return { width: maxHeight * aspect, height: maxHeight };
}

function makeWallTextTexture({ eyebrow, title, body }) {
    const labelCanvas = document.createElement('canvas');
    labelCanvas.width = 1200;
    labelCanvas.height = 680;
    const ctx = labelCanvas.getContext('2d');

    ctx.fillStyle = '#121311';
    ctx.fillRect(0, 0, 1200, 680);

    const glow = ctx.createRadialGradient(600, 260, 40, 600, 260, 620);
    glow.addColorStop(0, 'rgba(214,188,130,0.2)');
    glow.addColorStop(1, 'rgba(214,188,130,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 1200, 680);

    ctx.strokeStyle = 'rgba(245,241,232,0.18)';
    ctx.lineWidth = 4;
    ctx.strokeRect(38, 38, 1124, 604);

    ctx.fillStyle = 'rgba(245,241,232,0.66)';
    ctx.font = '700 42px Inter, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(eyebrow.toUpperCase(), 600, 190);

    ctx.fillStyle = '#f5f1e8';
    ctx.font = '600 92px Inter, Arial, sans-serif';
    ctx.fillText(title, 600, 320);

    ctx.fillStyle = 'rgba(245,241,232,0.74)';
    ctx.font = '400 38px Inter, Arial, sans-serif';
    wrapCanvasText(ctx, body, 600, 405, 900, 54);

    const texture = new THREE.CanvasTexture(labelCanvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}

function makeShowcaseGlowTexture() {
    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = 512;
    glowCanvas.height = 768;
    const ctx = glowCanvas.getContext('2d');

    const topBeam = ctx.createLinearGradient(0, 0, 0, 768);
    topBeam.addColorStop(0, 'rgba(255,255,255,0.68)');
    topBeam.addColorStop(0.18, 'rgba(245,250,255,0.32)');
    topBeam.addColorStop(0.55, 'rgba(245,250,255,0.08)');
    topBeam.addColorStop(1, 'rgba(245,250,255,0)');
    ctx.fillStyle = topBeam;
    ctx.fillRect(0, 0, 512, 768);

    const centerFalloff = ctx.createRadialGradient(256, 210, 40, 256, 300, 330);
    centerFalloff.addColorStop(0, 'rgba(255,255,255,0.26)');
    centerFalloff.addColorStop(0.58, 'rgba(245,250,255,0.08)');
    centerFalloff.addColorStop(1, 'rgba(245,250,255,0)');
    ctx.fillStyle = centerFalloff;
    ctx.fillRect(0, 0, 512, 768);

    const texture = new THREE.CanvasTexture(glowCanvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}

function makeFloorGlintTexture() {
    const glintCanvas = document.createElement('canvas');
    glintCanvas.width = 512;
    glintCanvas.height = 256;
    const ctx = glintCanvas.getContext('2d');

    const glow = ctx.createRadialGradient(256, 128, 10, 256, 128, 250);
    glow.addColorStop(0, 'rgba(255,255,255,0.5)');
    glow.addColorStop(0.28, 'rgba(245,241,232,0.16)');
    glow.addColorStop(0.72, 'rgba(245,241,232,0.04)');
    glow.addColorStop(1, 'rgba(245,241,232,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 512, 256);

    const texture = new THREE.CanvasTexture(glintCanvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}

function makeGridTexture(base, line, size, opacity) {
    const canvasTexture = document.createElement('canvas');
    canvasTexture.width = 512;
    canvasTexture.height = 512;
    const ctx = canvasTexture.getContext('2d');
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, 512, 512);
    ctx.strokeStyle = hexToRgba(line, opacity);
    ctx.lineWidth = 2;

    for (let i = 0; i <= 512; i += size) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 512);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(512, i);
        ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvasTexture);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}

function makePlaqueTexture(art) {
    const plaqueCanvas = document.createElement('canvas');
    plaqueCanvas.width = 1024;
    plaqueCanvas.height = 320;
    const ctx = plaqueCanvas.getContext('2d');

    const gradient = ctx.createLinearGradient(0, 0, 1024, 320);
    gradient.addColorStop(0, '#746038');
    gradient.addColorStop(0.5, '#d7bd7a');
    gradient.addColorStop(1, '#5b4829');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1024, 320);

    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(20, 20, 984, 280);
    ctx.fillStyle = '#14120d';
    ctx.font = '700 58px Inter, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(art.title, 512, 138);
    ctx.font = '500 36px Inter, Arial, sans-serif';
    ctx.fillText(`${art.year} - Harley Jean`, 512, 210);

    const texture = new THREE.CanvasTexture(plaqueCanvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}

function hexToRgba(hex, alpha) {
    const value = Number.parseInt(hex.slice(1), 16);
    const r = (value >> 16) & 255;
    const g = (value >> 8) & 255;
    const b = value & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function wrapCanvasText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let lineY = y;

    words.forEach((word) => {
        const testLine = line ? `${line} ${word}` : word;
        if (ctx.measureText(testLine).width > maxWidth && line) {
            ctx.fillText(line, x, lineY);
            line = word;
            lineY += lineHeight;
        } else {
            line = testLine;
        }
    });

    ctx.fillText(line, x, lineY);
}
