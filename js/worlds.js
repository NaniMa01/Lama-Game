/**
 * ============================================================================
 * WORLD BUILDER – ERZEUGT DIE 3 ETAPPEN, HOLOGRAMM, FLAGGE & GIPFEL-PANORAMA
 * ============================================================================
 */

class WorldBuilder {
    constructor(scene) {
        this.scene = scene;
        this.worlds = [];
        this.interactables = [[], [], []];
        this.steppingStones = [];
        this.floatingCrystals = [];
        this.waterMesh = null;
        this.chestLidPivot = null;
        this.chestGroup = null;

        // Hologramm-Referenzen (Welt 1)
        this.hologramGroup = null;
        this.hologramRings = [];
        this.hologramScale = 0;
        this.hologramActive = false;

        // Flaggenmast-Referenzen (Welt 2)
        this.flagpoleRisingGroup = null;
        this.flagBannerGroup = null;
        this.flagMesh = null;
        this.flagBaseVertices = null;
        this.flagActive = false;
        this.flagPoleProgress = 0;
        this.flagHoistProgress = 0;

        // Welt 3 Panorama, Nebelmeer, Feuer & Himmels-Kino-Video (lamavideo1)
        this.cloudLayers = [];
        this.flameSprites = [];
        this.snowParticles = null;
        this.skyCinemaGroup = null;
        this.skyVideoElement = null;
        this.skyVideoTexture = null;
        this.skyCinemaActive = false;
        this.skyCinemaScale = 0;

        this.buildSkyAndHorizon();
        this.buildWorld1();
        this.buildWorld2();
        this.buildWorld3();
    }

    buildSkyAndHorizon() {
        const skyGeo = new THREE.SphereGeometry(460, 32, 32);
        const skyMat = new THREE.ShaderMaterial({
            side: THREE.BackSide,
            depthWrite: false,
            uniforms: {
                topColor: { value: new THREE.Color(0x0c061c) },
                midColor: { value: new THREE.Color(0x5e2250) },
                horizonColor: { value: new THREE.Color(0xff9452) }
            },
            vertexShader: `
                varying vec3 vWorldPos;
                void main() {
                    vec4 wp = modelMatrix * vec4(position, 1.0);
                    vWorldPos = wp.xyz;
                    gl_Position = projectionMatrix * viewMatrix * wp;
                }
            `,
            fragmentShader: `
                varying vec3 vWorldPos;
                uniform vec3 topColor;
                uniform vec3 midColor;
                uniform vec3 horizonColor;
                void main() {
                    float h = clamp(normalize(vWorldPos).y, 0.0, 1.0);
                    vec3 col = mix(horizonColor, midColor, smoothstep(0.0, 0.25, h));
                    col = mix(col, topColor, smoothstep(0.25, 0.82, h));
                    gl_FragColor = vec4(col, 1.0);
                }
            `
        });
        this.scene.add(new THREE.Mesh(skyGeo, skyMat));

        const sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({
            map: TextureFactory.createGlowTexture('#ffae52'),
            blending: THREE.AdditiveBlending
        }));
        sunGlow.position.set(0, 28, -240);
        sunGlow.scale.set(110, 110, 1);
        this.scene.add(sunGlow);
    }

    // ------------------------------------------------------------------------
    // WELT 1: SCHWEBENDE WIESEN-OASE
    // ------------------------------------------------------------------------
    buildWorld1() {
        const group = new THREE.Group();
        const meadowPBR = TextureFactory.createPBRSet('meadow', 8, 8);
        const granitePBR = TextureFactory.createPBRSet('granite', 4, 4);
        const barkPBR = TextureFactory.createPBRSet('bark', 2, 4);

        const islandTop = new THREE.Mesh(
            new THREE.CylinderGeometry(24, 22, 2.2, 48),
            new THREE.MeshStandardMaterial({
                map: meadowPBR.map,
                bumpMap: meadowPBR.bumpMap,
                bumpScale: 0.08,
                roughness: 0.85
            })
        );
        islandTop.position.y = -1.1;
        islandTop.receiveShadow = true;
        group.add(islandTop);

        const islandRock = new THREE.Mesh(
            new THREE.ConeGeometry(22, 16, 24),
            new THREE.MeshStandardMaterial({
                map: granitePBR.map,
                bumpMap: granitePBR.bumpMap,
                bumpScale: 0.15,
                roughness: 0.9
            })
        );
        islandRock.rotation.x = Math.PI;
        islandRock.position.y = -10;
        group.add(islandRock);

        this.waterMesh = new THREE.Mesh(
            new THREE.CircleGeometry(5.5, 36),
            new THREE.MeshPhysicalMaterial({
                color: 0x26a69a,
                roughness: 0.12,
                metalness: 0.1,
                clearcoat: 1.0
            })
        );
        this.waterMesh.rotation.x = -Math.PI / 2;
        this.waterMesh.position.set(-7.5, 0.03, -5);
        group.add(this.waterMesh);

        const treeCoords = [[-14, -8], [-12, 8], [14, -7], [13, 9], [-5, -16], [7, -16]];
        treeCoords.forEach(([tx, tz]) => {
            const tree = this.createTree(barkPBR);
            tree.position.set(tx, 0, tz);
            group.add(tree);
        });

        const altarGroup = new THREE.Group();
        altarGroup.position.set(0, 0, -11);

        const pedestal = new THREE.Mesh(
            new THREE.CylinderGeometry(1.7, 2.1, 1.3, 16),
            new THREE.MeshStandardMaterial({ map: granitePBR.map, roughness: 0.6 })
        );
        pedestal.position.y = 0.65;
        pedestal.castShadow = true;
        altarGroup.add(pedestal);

        const goldFrame = new THREE.Mesh(
            new THREE.BoxGeometry(2.1, 0.35, 2.1),
            new THREE.MeshStandardMaterial({ color: 0xffca28, metalness: 0.75, roughness: 0.25 })
        );
        goldFrame.position.y = 1.4;
        goldFrame.castShadow = true;
        altarGroup.add(goldFrame);

        this.altarGem = new THREE.Mesh(
            new THREE.OctahedronGeometry(0.55, 0),
            new THREE.MeshStandardMaterial({
                color: 0xff80ab,
                emissive: 0xff4081,
                emissiveIntensity: 0.7,
                roughness: 0.2
            })
        );
        this.altarGem.position.y = 2.55;
        altarGroup.add(this.altarGem);

        const glow = new THREE.Sprite(new THREE.SpriteMaterial({
            map: TextureFactory.createGlowTexture('#ff80ab'),
            blending: THREE.AdditiveBlending
        }));
        glow.position.y = 2.55;
        glow.scale.set(3.2, 3.2, 1);
        altarGroup.add(glow);

        group.add(altarGroup);
        this.buildHologramDisplay(group);

        this.interactables[0].push({
            pos: new THREE.Vector3(0, 0, -11),
            radius: 4.5,
            type: 'flower_altar',
            label: 'Blumen-Mosaik untersuchen'
        });

        const tabletCoords = [[-5.5, -8.5], [5.5, -8.5]];
        tabletCoords.forEach(([sx, sz], idx) => {
            const tab = this.createStoneTablet(granitePBR);
            tab.position.set(sx, 0, sz);
            group.add(tab);

            this.interactables[0].push({
                pos: new THREE.Vector3(sx, 0, sz),
                radius: 3.2,
                type: 'tablet_w1',
                index: idx,
                label: 'Steintafel lesen'
            });
        });

        this.scene.add(group);
        this.worlds.push(group);
    }

    buildHologramDisplay(worldGroup) {
        this.hologramGroup = new THREE.Group();
        this.hologramGroup.position.set(0, 4.9, -11);
        this.hologramGroup.visible = false;
        this.hologramGroup.scale.set(0.01, 0.01, 0.01);

        const coneGeo = new THREE.ConeGeometry(3.2, 3.4, 32, 1, true);
        const coneMat = new THREE.MeshBasicMaterial({
            color: 0x64ffda,
            transparent: true,
            opacity: 0.18,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        const projectorCone = new THREE.Mesh(coneGeo, coneMat);
        projectorCone.rotation.x = Math.PI;
        projectorCone.position.y = -1.7;
        this.hologramGroup.add(projectorCone);

        const fallbackCanvas = document.createElement('canvas');
        fallbackCanvas.width = 800;
        fallbackCanvas.height = 600;
        const fCtx = fallbackCanvas.getContext('2d');
        const grad = fCtx.createLinearGradient(0, 0, 800, 600);
        grad.addColorStop(0, '#ad1457');
        grad.addColorStop(0.5, '#ff6f00');
        grad.addColorStop(1, '#4a148c');
        fCtx.fillStyle = grad;
        fCtx.fillRect(0, 0, 800, 600);
        fCtx.fillStyle = '#ffffff';
        fCtx.font = 'bold 50px "Segoe UI", sans-serif';
        fCtx.textAlign = 'center';
        fCtx.fillText('Erinnerung 1', 400, 300);

        const fallbackTex = new THREE.CanvasTexture(fallbackCanvas);
        fallbackTex.encoding = THREE.sRGBEncoding;

        const imgMat = new THREE.MeshBasicMaterial({
            map: fallbackTex,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.94
        });

        this.loadSmartTexture(PERSONAL_CONFIG.world1.hologramImageUrl, imgMat);

        const picPlane = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 3.9), imgMat);
        this.hologramGroup.add(picPlane);

        const scanCanvas = document.createElement('canvas');
        scanCanvas.width = 64;
        scanCanvas.height = 256;
        const sCtx = scanCanvas.getContext('2d');
        for (let y = 0; y < 256; y += 4) {
            sCtx.fillStyle = (y % 8 === 0) ? 'rgba(100, 255, 218, 0.16)' : 'rgba(255, 213, 79, 0.08)';
            sCtx.fillRect(0, y, 64, 2);
        }
        const scanTex = new THREE.CanvasTexture(scanCanvas);
        scanTex.wrapS = THREE.RepeatWrapping;
        scanTex.wrapT = THREE.RepeatWrapping;
        this.hologramScanTex = scanTex;

        const scanMat = new THREE.MeshBasicMaterial({
            map: scanTex,
            transparent: true,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        const scanOverlay = new THREE.Mesh(new THREE.PlaneGeometry(5.24, 3.94), scanMat);
        this.hologramGroup.add(scanOverlay);

        const borderMat = new THREE.MeshBasicMaterial({ color: 0x80deea });
        const topBar = new THREE.Mesh(new THREE.BoxGeometry(5.45, 0.1, 0.1), borderMat);
        topBar.position.y = 2.0;
        const botBar = new THREE.Mesh(new THREE.BoxGeometry(5.45, 0.1, 0.1), borderMat);
        botBar.position.y = -2.0;
        this.hologramGroup.add(topBar, botBar);

        this.hologramRings = [];
        [1.9, 2.5].forEach((radius, idx) => {
            const ring = new THREE.Mesh(
                new THREE.TorusGeometry(radius, 0.035, 12, 48),
                new THREE.MeshBasicMaterial({
                    color: idx === 0 ? 0x64ffda : 0xffd54f,
                    transparent: true,
                    opacity: 0.75
                })
            );
            ring.rotation.x = Math.PI / 2;
            ring.position.y = -2.3 + idx * 0.45;
            this.hologramGroup.add(ring);
            this.hologramRings.push(ring);
        });

        const backGlow = new THREE.Sprite(new THREE.SpriteMaterial({
            map: TextureFactory.createGlowTexture('#64ffda'),
            blending: THREE.AdditiveBlending,
            transparent: true,
            opacity: 0.55
        }));
        backGlow.scale.set(8.5, 6.5, 1);
        this.hologramGroup.add(backGlow);

        worldGroup.add(this.hologramGroup);
    }

    activateHologram() {
        this.hologramActive = true;
        this.hologramGroup.visible = true;
    }

    // ------------------------------------------------------------------------
    // WELT 2: DÄMMERUNGS-SCHLUCHT (4 Säulen, 4 Stufen & Ausfahrender Flaggenmast)
    // ------------------------------------------------------------------------
    buildWorld2() {
        const group = new THREE.Group();
        const sandPBR = TextureFactory.createPBRSet('sandstone', 4, 4);
        const stoneMat = new THREE.MeshStandardMaterial({
            map: sandPBR.map,
            bumpMap: sandPBR.bumpMap,
            bumpScale: 0.12,
            roughness: 0.85
        });

        const startPlat = new THREE.Mesh(new THREE.BoxGeometry(24, 4, 14), stoneMat);
        startPlat.position.set(0, -2, 4.5);
        startPlat.receiveShadow = true;
        group.add(startPlat);

        const endPlat = new THREE.Mesh(new THREE.BoxGeometry(22, 4, 14), stoneMat);
        endPlat.position.set(0, -2, -23.5);
        endPlat.receiveShadow = true;
        group.add(endPlat);

        const pillarXPositions = [-8.4, -2.8, 2.8, 8.4];
        pillarXPositions.forEach((px, idx) => {
            const pillar = this.createHintPillar(sandPBR, idx + 1);
            pillar.position.set(px, 0, -0.6);
            group.add(pillar);

            this.interactables[1].push({
                pos: new THREE.Vector3(px, 0, -0.6),
                radius: 2.7,
                type: 'obelisk_w2',
                index: idx,
                label: `Säule ${idx + 1} lesen (Hinweis für ${idx + 1}. Stufe)`
            });
        });

        const gridNums = PERSONAL_CONFIG.world2.gridNumbers;
        const numRows = gridNums.length;
        const startZ = -5.5;
        const rowSpacing = 3.4;
        const colSpacing = 3.2;

        for (let r = 0; r < numRows; r++) {
            for (let c = 0; c < 4; c++) {
                const num = gridNums[r][c];
                const topMat = new THREE.MeshStandardMaterial({
                    map: TextureFactory.createStoneNumberTexture(num, 'default'),
                    roughness: 0.65
                });

                const mats = [stoneMat, stoneMat, topMat, stoneMat, stoneMat, stoneMat];
                const tile = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.5, 2.5), mats);
                const x = (c - 1.5) * colSpacing;
                const z = startZ - r * rowSpacing;
                tile.position.set(x, -0.22, z);
                tile.castShadow = true;
                tile.receiveShadow = true;

                tile.userData = { row: r, col: c, number: num, topMat: topMat };
                group.add(tile);
                this.steppingStones.push(tile);
            }
        }

        this.buildRisingFlagpole(group, sandPBR);

        this.interactables[1].push({
            pos: new THREE.Vector3(0, 0, -21.5),
            radius: 4.8,
            type: 'flagpole_w2',
            label: 'Weiter zum Sternenhimmel-Gipfel (Welt 3) teleportieren ➔'
        });

        group.visible = false;
        this.scene.add(group);
        this.worlds.push(group);
    }

    createHintPillar(pbr, pillarNumber) {
        const g = new THREE.Group();
        const mat = new THREE.MeshStandardMaterial({
            map: pbr.map,
            bumpMap: pbr.bumpMap,
            bumpScale: 0.1,
            roughness: 0.8
        });

        const base = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.45, 1.5), mat);
        base.position.y = 0.225;
        base.castShadow = true;
        g.add(base);

        const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.62, 2.4, 16), mat);
        shaft.position.y = 1.6;
        shaft.castShadow = true;
        g.add(shaft);

        const cap = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.35, 1.4), mat);
        cap.position.y = 2.9;
        cap.castShadow = true;
        g.add(cap);

        const badgeCanvas = document.createElement('canvas');
        badgeCanvas.width = 128;
        badgeCanvas.height = 128;
        const ctx = badgeCanvas.getContext('2d');
        ctx.fillStyle = '#2b1810';
        ctx.fillRect(0, 0, 128, 128);
        ctx.strokeStyle = '#ffca64';
        ctx.lineWidth = 8;
        ctx.strokeRect(8, 8, 112, 112);
        ctx.fillStyle = '#ffecd2';
        ctx.font = 'bold 72px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(pillarNumber), 64, 68);

        const badgeTex = new THREE.CanvasTexture(badgeCanvas);
        badgeTex.encoding = THREE.sRGBEncoding;

        const plaque = new THREE.Mesh(
            new THREE.PlaneGeometry(0.75, 0.75),
            new THREE.MeshBasicMaterial({ map: badgeTex })
        );
        plaque.position.set(0, 1.65, 0.62);
        g.add(plaque);

        const glow = new THREE.Sprite(new THREE.SpriteMaterial({
            map: TextureFactory.createGlowTexture('#ffbe64'),
            blending: THREE.AdditiveBlending
        }));
        glow.position.set(0, 1.65, 0.7);
        glow.scale.set(1.5, 1.5, 1);
        g.add(glow);

        return g;
    }

    buildRisingFlagpole(worldGroup, sandPBR) {
        const anchor = new THREE.Group();
        anchor.position.set(0, 0, -22.5);

        const pedestal = new THREE.Mesh(
            new THREE.CylinderGeometry(1.5, 1.9, 1.1, 20),
            new THREE.MeshStandardMaterial({ map: sandPBR.map, roughness: 0.7 })
        );
        pedestal.position.y = 0.55;
        pedestal.castShadow = true;
        anchor.add(pedestal);

        const goldRing = new THREE.Mesh(
            new THREE.CylinderGeometry(1.2, 1.3, 0.25, 20),
            new THREE.MeshStandardMaterial({ color: 0xffd54f, metalness: 0.8, roughness: 0.25 })
        );
        goldRing.position.y = 1.15;
        anchor.add(goldRing);

        this.flagpoleRisingGroup = new THREE.Group();
        this.flagpoleRisingGroup.position.y = -8.5;
        this.flagpoleRisingGroup.visible = false;

        const poleMat = new THREE.MeshStandardMaterial({
            color: 0xffdf73,
            metalness: 0.85,
            roughness: 0.2
        });

        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 8.2, 16), poleMat);
        pole.position.y = 4.6;
        pole.castShadow = true;
        this.flagpoleRisingGroup.add(pole);

        const finial = new THREE.Mesh(new THREE.SphereGeometry(0.38, 16, 16), poleMat);
        finial.position.y = 8.8;
        this.flagpoleRisingGroup.add(finial);

        const topGlow = new THREE.Sprite(new THREE.SpriteMaterial({
            map: TextureFactory.createGlowTexture('#ffd54f'),
            blending: THREE.AdditiveBlending
        }));
        topGlow.position.y = 8.8;
        topGlow.scale.set(3.2, 3.2, 1);
        this.flagpoleRisingGroup.add(topGlow);

        this.flagBannerGroup = new THREE.Group();
        this.flagBannerGroup.position.set(0.16, 2.2, 0);

        const crossbar = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 5.5, 12), poleMat);
        crossbar.rotation.z = Math.PI / 2;
        crossbar.position.set(2.75, 1.95, 0);
        this.flagBannerGroup.add(crossbar);

        const fbCanvas = document.createElement('canvas');
        fbCanvas.width = 800;
        fbCanvas.height = 600;
        const ctx = fbCanvas.getContext('2d');
        ctx.fillStyle = '#4a1942';
        ctx.fillRect(0, 0, 800, 600);
        ctx.strokeStyle = '#ffd54f';
        ctx.lineWidth = 16;
        ctx.strokeRect(20, 20, 760, 560);
        ctx.fillStyle = '#ffecd2';
        ctx.font = 'bold 48px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Erinnerung 2 (erinnerung2.jpg)', 400, 300);

        const fbTex = new THREE.CanvasTexture(fbCanvas);
        fbTex.encoding = THREE.sRGBEncoding;

        const flagMat = new THREE.MeshBasicMaterial({
            map: fbTex,
            side: THREE.DoubleSide
        });

        this.loadSmartTexture(PERSONAL_CONFIG.world2.flagImageUrl, flagMat);

        const flagGeo = new THREE.PlaneGeometry(5.2, 3.9, 20, 12);
        this.flagBaseVertices = flagGeo.attributes.position.array.slice();

        this.flagMesh = new THREE.Mesh(flagGeo, flagMat);
        this.flagMesh.position.set(2.75, 0, 0);
        this.flagMesh.castShadow = true;
        this.flagBannerGroup.add(this.flagMesh);

        const flagGlow = new THREE.Sprite(new THREE.SpriteMaterial({
            map: TextureFactory.createGlowTexture('#ffbe64'),
            blending: THREE.AdditiveBlending,
            transparent: true,
            opacity: 0.45
        }));
        flagGlow.position.set(2.75, 0, -0.2);
        flagGlow.scale.set(7.5, 5.5, 1);
        this.flagBannerGroup.add(flagGlow);

        this.flagpoleRisingGroup.add(this.flagBannerGroup);
        anchor.add(this.flagpoleRisingGroup);
        worldGroup.add(anchor);
    }

    loadSmartTexture(url, targetMaterial) {
        if (!url) return;
        const baseName = url.replace(/\.(jpg|jpeg|png|webp)$/i, '');
        const candidates = [url, `${baseName}.jpg`, `${baseName}.jpeg`, `${baseName}.png`, `${baseName}.JPG`];
        let attempt = 0;

        const loader = new THREE.TextureLoader();
        const tryNext = () => {
            if (attempt >= candidates.length) return;
            const currentUrl = candidates[attempt++];
            loader.load(
                currentUrl,
                (tex) => {
                    tex.encoding = THREE.sRGBEncoding;
                    targetMaterial.map = tex;
                    targetMaterial.needsUpdate = true;
                },
                undefined,
                () => tryNext()
            );
        };
        tryNext();
    }

    activateFlag() {
        this.flagActive = true;
        if (this.flagpoleRisingGroup) {
            this.flagpoleRisingGroup.visible = true;
        }
    }

    resetFlag() {
        this.flagActive = false;
        this.flagPoleProgress = 0;
        this.flagHoistProgress = 0;
        if (this.flagpoleRisingGroup) {
            this.flagpoleRisingGroup.position.y = -8.5;
            this.flagpoleRisingGroup.visible = false;
        }
        if (this.flagBannerGroup) {
            this.flagBannerGroup.position.y = 2.2;
        }
    }

    // ------------------------------------------------------------------------
    // WELT 3: DER STERNENHIMMEL-GIPFEL (Detailverliebtes Hochgebirgs-Panorama
    //         & Riesiges Himmels-Kino für lamavideo1 mit Ton)
    // ------------------------------------------------------------------------
    buildWorld3() {
        const group = new THREE.Group();

        const sanctuaryPBR = TextureFactory.createSummitSanctuaryFloor();
        const slatePBR = TextureFactory.createPBRSet('slate', 4, 4);
        const alpinePeakPBR = TextureFactory.createPBRSet('alpinePeak', 3, 3);
        const snowPBR = TextureFactory.createPBRSet('snow', 4, 4);

        const rockMat = new THREE.MeshStandardMaterial({
            map: slatePBR.map,
            bumpMap: slatePBR.bumpMap,
            bumpScale: 0.18,
            roughness: 0.76,
            metalness: 0.12
        });

        const snowMat = new THREE.MeshStandardMaterial({
            map: snowPBR.map,
            bumpMap: snowPBR.bumpMap,
            bumpScale: 0.08,
            roughness: 0.45,
            metalness: 0.05
        });

        const goldMat = new THREE.MeshStandardMaterial({
            color: 0xffd54f,
            metalness: 0.88,
            roughness: 0.22
        });

        // 1. Haupt-Gipfelplateau mit gemeißeltem Naturstein-Sternen-Boden
        const summitDisc = new THREE.Mesh(
            new THREE.CylinderGeometry(23, 25, 1.8, 64),
            new THREE.MeshStandardMaterial({
                map: sanctuaryPBR.map,
                bumpMap: sanctuaryPBR.bumpMap,
                bumpScale: 0.12,
                roughness: 0.62,
                metalness: 0.15
            })
        );
        summitDisc.position.y = -0.9;
        summitDisc.receiveShadow = true;
        group.add(summitDisc);

        // Massiver, schroffer Felsunterbau des Gipfels, der steil in die Tiefe abfällt
        const cliffCore = new THREE.Mesh(
            new THREE.ConeGeometry(26, 36, 28),
            rockMat
        );
        cliffCore.rotation.x = Math.PI;
        cliffCore.position.y = -19.5;
        group.add(cliffCore);

        // Zerklüftete Felsvorsprünge & Schneewächten rund um die Gipfelkante
        for (let i = 0; i < 20; i++) {
            const angle = (i / 20) * Math.PI * 2;
            // Aussparung im Norden (Blick frei auf das Panorama & Himmels-Kino)
            const isNorthVista = (angle > Math.PI * 1.32 && angle < Math.PI * 1.68);
            const radius = 22.8 + (i % 3) * 1.2;
            const cragX = Math.cos(angle) * radius;
            const cragZ = Math.sin(angle) * radius;

            const cragHeight = isNorthVista ? 3.5 : (5.5 + (i % 4) * 1.8);
            const crag = new THREE.Mesh(
                new THREE.ConeGeometry(3.2, cragHeight, 7),
                rockMat
            );
            crag.position.set(cragX, -1.8, cragZ);
            crag.rotation.y = angle;
            crag.rotation.z = (i % 2 === 0 ? 0.15 : -0.15);
            group.add(crag);

            // Schneepolster am Fuß der Felsen
            if (i % 2 === 0) {
                const snowDrift = new THREE.Mesh(
                    new THREE.SphereGeometry(2.1, 14, 10),
                    snowMat
                );
                snowDrift.scale.set(1.4, 0.32, 0.9);
                snowDrift.position.set(Math.cos(angle) * 20.5, 0.05, Math.sin(angle) * 20.5);
                snowDrift.rotation.y = -angle;
                snowDrift.receiveShadow = true;
                group.add(snowDrift);
            }
        }

        // 2.Goldener Kompass-Ring & Aussichts-Empore im Norden des Gipfels
        const compassRing = new THREE.Mesh(
            new THREE.TorusGeometry(9.5, 0.12, 12, 64),
            goldMat
        );
        compassRing.rotation.x = Math.PI / 2;
        compassRing.position.y = 0.02;
        group.add(compassRing);

        // Erhabenes Podest für die Schatztruhe mit bestem Blick auf das Panorama
        const chestDais = new THREE.Mesh(
            new THREE.CylinderGeometry(4.2, 4.8, 0.36, 32),
            rockMat
        );
        chestDais.position.set(0, 0.18, -12.5);
        chestDais.receiveShadow = true;
        group.add(chestDais);

        const daisGoldTrim = new THREE.Mesh(
            new THREE.TorusGeometry(4.3, 0.09, 12, 48),
            goldMat
        );
        daisGoldTrim.rotation.x = Math.PI / 2;
        daisGoldTrim.position.set(0, 0.36, -12.5);
        group.add(daisGoldTrim);

        // 3. Vier kunstvolle goldene Feuerschalen (Braziers) mit warmem Punktlicht
        const brazierCoords = [[-6.2, -3.5], [6.2, -3.5], [-6.8, -11.5], [6.8, -11.5]];
        brazierCoords.forEach(([bx, bz], idx) => {
            const brazier = this.createFireBrazier(rockMat, goldMat, idx);
            brazier.position.set(bx, 0, bz);
            group.add(brazier);
        });

        // 4. Leuchtende Gletscher-Kristall-Cluster am Rand
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2 + 0.25;
            if (Math.sin(angle) < -0.75) continue; // Nord-Sichtachse frei halten
            const cx = Math.cos(angle) * 17.5;
            const cz = Math.sin(angle) * 17.5;

            const cluster = new THREE.Group();
            cluster.position.set(cx, 0, cz);

            const mainCrystal = new THREE.Mesh(
                new THREE.OctahedronGeometry(1.15, 0),
                new THREE.MeshPhysicalMaterial({
                    color: 0x80d8ff,
                    emissive: 0x0091ea,
                    emissiveIntensity: 0.65,
                    roughness: 0.1,
                    metalness: 0.1,
                    clearcoat: 1.0
                })
            );
            mainCrystal.scale.set(0.65, 2.3, 0.65);
            mainCrystal.position.y = 2.2;
            cluster.add(mainCrystal);
            this.floatingCrystals.push(mainCrystal);

            const cGlow = new THREE.Sprite(new THREE.SpriteMaterial({
                map: TextureFactory.createGlowTexture('#40c4ff'),
                blending: THREE.AdditiveBlending
            }));
            cGlow.position.y = 2.2;
            cGlow.scale.set(3.8, 3.8, 1);
            cluster.add(cGlow);

            group.add(cluster);
        }

        // 5. DAS HEFTIGE 360°-HOCHGEBIRGS-PANORAMA & NEBELMEER
        this.buildAlpinePanorama(group, alpinePeakPBR);
        this.buildCloudSeaAndStars(group);

        // 6. Altar der Erinnerungen (für Rätsel 3)
        const altar = this.createStoneTablet(slatePBR);
        altar.position.set(0, 0, -6);
        group.add(altar);

        this.interactables[2].push({
            pos: new THREE.Vector3(0, 0, -6),
            radius: 3.6,
            type: 'quiz_altar',
            label: 'Altar der Erinnerungen öffnen'
        });

        // 7. Die Goldene Schatztruhe
        this.chestGroup = new THREE.Group();
        this.chestGroup.position.set(0, 0.36, -12.5);
        this.chestGroup.visible = false;

        const woodMat = new THREE.MeshStandardMaterial({ color: 0x5d3a1a, roughness: 0.45 });

        const base = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.1, 1.4), woodMat);
        base.position.y = 0.55;
        base.castShadow = true;
        this.chestGroup.add(base);

        const trim = new THREE.Mesh(new THREE.BoxGeometry(2.28, 0.2, 1.48), goldMat);
        trim.position.y = 1.0;
        this.chestGroup.add(trim);

        this.chestLidPivot = new THREE.Group();
        this.chestLidPivot.position.set(0, 1.1, -0.7);

        const lid = new THREE.Mesh(
            new THREE.CylinderGeometry(0.7, 0.7, 2.2, 16, 1, false, 0, Math.PI),
            woodMat
        );
        lid.rotation.z = Math.PI / 2;
        lid.position.set(0, 0, 0.7);
        this.chestLidPivot.add(lid);
        this.chestGroup.add(this.chestLidPivot);

        const beam = new THREE.Sprite(new THREE.SpriteMaterial({
            map: TextureFactory.createGlowTexture('#ffd54f'),
            blending: THREE.AdditiveBlending
        }));
        beam.position.y = 2.5;
        beam.scale.set(5.5, 5.5, 1);
        this.chestGroup.add(beam);

        group.add(this.chestGroup);

        this.interactables[2].push({
            pos: new THREE.Vector3(0, 0, -12.5),
            radius: 4.0,
            type: 'treasure_chest',
            label: 'Himmels-Video neu starten / im Vollbild öffnen 🎬'
        });

        // 8. RIESIGE HIMMELS-PROJEKTION FÜR LAMAVIDEO1 (IM HINTERGRUND AM HIMMEL)
        this.buildSkyVideoCinema(group);

        group.visible = false;
        this.scene.add(group);
        this.worlds.push(group);
    }

    /**
     * Erzeugt eine goldene Feuerschale mit animierter Flamme
     */
    createFireBrazier(rockMat, goldMat, idx) {
        const g = new THREE.Group();
        const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.65, 1.6, 12), rockMat);
        pillar.position.y = 0.8;
        pillar.castShadow = true;
        g.add(pillar);

        const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.4, 0.45, 16), goldMat);
        bowl.position.y = 1.75;
        bowl.castShadow = true;
        g.add(bowl);

        const flame = new THREE.Sprite(new THREE.SpriteMaterial({
            map: TextureFactory.createGlowTexture('#ff9100'),
            blending: THREE.AdditiveBlending
        }));
        flame.position.y = 2.35;
        flame.scale.set(2.4, 2.9, 1);
        flame.userData = { phase: idx * 1.7 };
        g.add(flame);
        this.flameSprites.push(flame);

        if (idx < 2) {
            const pLight = new THREE.PointLight(0xffa726, 0.85, 18);
            pLight.position.set(0, 2.6, 0);
            g.add(pLight);
        }
        return g;
    }

    /**
     * Baut das gewaltige 360°-Alpen-Bergpanorama aus 44 individuell geformten
     * 3D-Gipfeln in zwei Entfernungsringen.
     */
    buildAlpinePanorama(worldGroup, alpinePeakPBR) {
        const peakMat = new THREE.MeshStandardMaterial({
            map: alpinePeakPBR.map,
            bumpMap: alpinePeakPBR.bumpMap,
            bumpScale: 0.35,
            roughness: 0.72,
            metalness: 0.08
        });

        // Hilfsfunktion für einen realistisch zerklüfteten 3D-Berggipfel
        const createJaggedMountain = (radiusBottom, height, seed) => {
            const geo = new THREE.ConeGeometry(radiusBottom, height, 14, 10);
            const pos = geo.attributes.position;
            for (let i = 0; i < pos.count; i++) {
                const vx = pos.getX(i);
                const vy = pos.getY(i);
                const vz = pos.getZ(i);
                const normY = (vy + height / 2) / height; // 0 unten, 1 Spitze

                if (normY < 0.96) {
                    const angle = Math.atan2(vz, vx);
                    // Schroffe Grate und Felskanten modellieren
                    const ridgeFactor = Math.sin(angle * 5 + seed) * 0.18 + Math.cos(angle * 8 - seed * 2) * 0.1;
                    const scale = 1.0 + ridgeFactor * (1.0 - normY * 0.5);
                    pos.setX(i, vx * scale);
                    pos.setZ(i, vz * scale);
                } else {
                    // Markante Gipfelspitze (Matterhorn-Knick)
                    pos.setX(i, vx + Math.sin(seed) * 1.8);
                }
            }
            geo.computeVertexNormals();
            return new THREE.Mesh(geo, peakMat);
        };

        // Innerer Gebirgskranz (20 markante Hochgipfel)
        for (let i = 0; i < 20; i++) {
            const angle = (i / 20) * Math.PI * 2;
            const dist = 105 + (i % 3) * 14;
            const mx = Math.cos(angle) * dist;
            const mz = Math.sin(angle) * dist;

            // Im Norden rahmen zwei majestätische Wächter-Berge das Himmels-Video ein
            const isVideoCenter = (mx > -28 && mx < 28 && mz < -60);
            const height = isVideoCenter ? (46 + (i % 2) * 8) : (64 + (i % 4) * 16);
            const width = 34 + (i % 3) * 8;

            const mtn = createJaggedMountain(width, height, i * 3.7);
            mtn.position.set(mx, height * 0.22 - 22, mz);
            mtn.rotation.y = angle + i;
            worldGroup.add(mtn);
        }

        // Äußerer Horizont-Gebirgskranz (24 gigantische Fern-Massive)
        for (let i = 0; i < 24; i++) {
            const angle = (i / 24) * Math.PI * 2 + 0.13;
            const dist = 195 + (i % 2) * 20;
            const mx = Math.cos(angle) * dist;
            const mz = Math.sin(angle) * dist;
            const height = 95 + (i % 5) * 22;
            const width = 56 + (i % 3) * 12;

            const farMtn = createJaggedMountain(width, height, i * 7.1 + 50);
            farMtn.position.set(mx, height * 0.25 - 30, mz);
            farMtn.rotation.y = -angle;
            worldGroup.add(farMtn);
        }
    }

    /**
     * Erzeugt das wogende Nebelmeer unterhalb des Gipfels sowie 1.200 Sterne
     * und sanft schwebende Schneekristalle in der Luft.
     */
    buildCloudSeaAndStars(worldGroup) {
        const cloudTex = TextureFactory.createCloudSeaTexture();

        // 2 Schichten Wolkenmeer rund um den Gipfel in der Tiefe
        for (let layer = 0; layer < 2; layer++) {
            const cloudRing = new THREE.Group();
            const count = 18;
            const radius = 58 + layer * 36;
            const yPos = -8.5 - layer * 5.5;

            for (let i = 0; i < count; i++) {
                const angle = (i / count) * Math.PI * 2;
                const puff = new THREE.Mesh(
                    new THREE.PlaneGeometry(55, 55),
                    new THREE.MeshBasicMaterial({
                        map: cloudTex,
                        transparent: true,
                        opacity: layer === 0 ? 0.55 : 0.4,
                        depthWrite: false,
                        side: THREE.DoubleSide
                    })
                );
                puff.rotation.x = -Math.PI / 2;
                puff.rotation.z = angle + i;
                puff.position.set(
                    Math.cos(angle) * radius,
                    yPos + (i % 3) * 0.6,
                    Math.sin(angle) * radius
                );
                cloudRing.add(puff);
            }
            worldGroup.add(cloudRing);
            this.cloudLayers.push(cloudRing);
        }

        // 1.200 funkelnde Sterne am hohen Nachthimmel über dem Gipfel
        const starGeo = new THREE.BufferGeometry();
        const starCount = 1200;
        const starPositions = new Float32Array(starCount * 3);
        for (let i = 0; i < starCount; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI * 0.46; // Obere Himmelshälfte
            const r = 340 + Math.random() * 40;
            starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            starPositions[i * 3 + 1] = r * Math.cos(phi) + 10;
            starPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
        }
        starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
        const starMat = new THREE.PointsMaterial({
            color: 0xfff8e7,
            size: 1.9,
            transparent: true,
            opacity: 0.9
        });
        worldGroup.add(new THREE.Points(starGeo, starMat));

        // Schwebender Gipfel-Schnee / Sternenstaub direkt auf dem Plateau
        const snowGeo = new THREE.BufferGeometry();
        const snowCount = 220;
        const snowPos = new Float32Array(snowCount * 3);
        for (let i = 0; i < snowCount; i++) {
            snowPos[i * 3] = (Math.random() - 0.5) * 50;
            snowPos[i * 3 + 1] = Math.random() * 18;
            snowPos[i * 3 + 2] = (Math.random() - 0.5) * 50;
        }
        snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPos, 3));
        this.snowParticles = new THREE.Points(
            snowGeo,
            new THREE.PointsMaterial({
                color: 0xe1f5fe,
                size: 0.28,
                transparent: true,
                opacity: 0.75
            })
        );
        worldGroup.add(this.snowParticles);
    }

    /**
     * Erstellt die riesige Himmels-Kino-Projektion im Hintergrund des Gipfels,
     * die nach dem Lösen der 3. Aufgabe `lamavideo1` inklusive Ton abspielt.
     */
    buildSkyVideoCinema(worldGroup) {
        this.skyCinemaGroup = new THREE.Group();
        // Groß im Himmel direkt hinter dem Gipfel über den Bergen positioniert
        this.skyCinemaGroup.position.set(0, 15.2, -42);
        this.skyCinemaGroup.rotation.x = 0.08; // Leicht zum Betrachter auf dem Gipfel geneigt
        this.skyCinemaGroup.visible = false;
        this.skyCinemaGroup.scale.set(0.01, 0.01, 0.01);

        // HTML5 Video-Element für lamavideo1 (mit Ton!) erstellen
        const vid = document.createElement('video');
        vid.id = 'sky-cinema-video';
        vid.crossOrigin = 'anonymous';
        vid.playsInline = true;
        vid.loop = false;
        vid.muted = false;
        vid.volume = 1.0;
        vid.preload = 'auto';

        // Smart-Quellen: sucht automatisch nach lamavideo1.mp4, .mov, .webm & video.mp4
        const baseUrl = (PERSONAL_CONFIG.world3.skyVideoUrl || 'lamavideo1.mp4').replace(/\.(mp4|mov|webm)$/i, '');
        const sources = [
            { src: `${baseUrl}.mp4`, type: 'video/mp4' },
            { src: `${baseUrl}.mov`, type: 'video/quicktime' },
            { src: `${baseUrl}.MOV`, type: 'video/mp4' },
            { src: `${baseUrl}.MP4`, type: 'video/mp4' },
            { src: 'video.mp4', type: 'video/mp4' }
        ];
        sources.forEach(s => {
            const sourceEl = document.createElement('source');
            sourceEl.src = s.src;
            sourceEl.type = s.type;
            vid.appendChild(sourceEl);
        });

        this.skyVideoElement = vid;

        this.skyVideoTexture = new THREE.VideoTexture(vid);
        this.skyVideoTexture.minFilter = THREE.LinearFilter;
        this.skyVideoTexture.magFilter = THREE.LinearFilter;
        this.skyVideoTexture.encoding = THREE.sRGBEncoding;

        // Gigantische 16:9 Himmels-Projektionsfläche (36 x 20.25 Meter im Himmel!)
        const screenWidth = 36.0;
        const screenHeight = 20.25;

        // Sanfter himmlischer Aura-Schein hinter dem Video
        const auraSprite = new THREE.Sprite(new THREE.SpriteMaterial({
            map: TextureFactory.createGlowTexture('#ffca64'),
            blending: THREE.AdditiveBlending,
            transparent: true,
            opacity: 0.65
        }));
        auraSprite.position.set(0, 0, -0.8);
        auraSprite.scale.set(screenWidth * 1.45, screenHeight * 1.45, 1);
        this.skyCinemaGroup.add(auraSprite);

        // Edler goldener Himmels-Rahmen um das Video
        const frameMat = new THREE.MeshBasicMaterial({ color: 0xffdf80 });
        const topFrame = new THREE.Mesh(new THREE.BoxGeometry(screenWidth + 0.8, 0.35, 0.3), frameMat);
        topFrame.position.y = screenHeight / 2 + 0.18;
        const botFrame = new THREE.Mesh(new THREE.BoxGeometry(screenWidth + 0.8, 0.35, 0.3), frameMat);
        botFrame.position.y = -screenHeight / 2 - 0.18;
        const leftFrame = new THREE.Mesh(new THREE.BoxGeometry(0.35, screenHeight + 0.8, 0.3), frameMat);
        leftFrame.position.x = -screenWidth / 2 - 0.18;
        const rightFrame = new THREE.Mesh(new THREE.BoxGeometry(0.35, screenHeight + 0.8, 0.3), frameMat);
        rightFrame.position.x = screenWidth / 2 + 0.18;
        this.skyCinemaGroup.add(topFrame, botFrame, leftFrame, rightFrame);

        // Die eigentliche Video-Fläche im Himmel
        const screenMesh = new THREE.Mesh(
            new THREE.PlaneGeometry(screenWidth, screenHeight),
            new THREE.MeshBasicMaterial({
                map: this.skyVideoTexture,
                side: THREE.DoubleSide
            })
        );
        this.skyCinemaGroup.add(screenMesh);

        // Lichtkegel von der Schatztruhe hoch zum Himmels-Video
        const beamGeo = new THREE.ConeGeometry(8.5, 28, 32, 1, true);
        const beamMat = new THREE.MeshBasicMaterial({
            color: 0xffd54f,
            transparent: true,
            opacity: 0.11,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        const skyBeam = new THREE.Mesh(beamGeo, beamMat);
        skyBeam.rotation.x = -Math.PI * 0.32;
        skyBeam.position.set(0, -8.5, 14);
        this.skyCinemaGroup.add(skyBeam);

        worldGroup.add(this.skyCinemaGroup);
        this.createSkyVideoHUDControls();
    }

    /**
     * Erzeugt eine dezente Steuerleiste unten rechts, sobald das Himmels-Video läuft
     * (damit man Ton, Pause, Neustart oder eine lokale Testdatei jederzeit steuern kann).
     */
    createSkyVideoHUDControls() {
        if (document.getElementById('sky-video-controls')) return;
        const bar = document.createElement('div');
        bar.id = 'sky-video-controls';
        bar.style.cssText = `
            position: fixed; bottom: 22px; right: 22px; z-index: 95;
            background: rgba(20, 9, 38, 0.88); border: 1.5px solid #ffbe64;
            backdrop-filter: blur(10px); padding: 10px 14px; border-radius: 14px;
            display: none; align-items: center; gap: 8px;
            box-shadow: 0 8px 30px rgba(0,0,0,0.6);
        `;
        bar.innerHTML = `
            <span style="font-size:12px; color:#ffecd2; font-weight:700; margin-right:4px;">🎬 Himmels-Kino:</span>
            <button class="btn-small" id="sky-play-btn">⏸ Pause</button>
            <button class="btn-small" id="sky-mute-btn">🔊 Ton AN</button>
            <button class="btn-small" id="sky-restart-btn">↻ Neustart</button>
            <label class="btn-small" style="cursor:pointer; margin:0;">
                📂 Video wählen
                <input type="file" id="sky-file-picker" accept="video/*" style="display:none;">
            </label>
        `;
        document.body.appendChild(bar);

        document.getElementById('sky-play-btn').onclick = () => {
            if (!this.skyVideoElement) return;
            if (this.skyVideoElement.paused) {
                this.skyVideoElement.play();
                document.getElementById('sky-play-btn').innerText = '⏸ Pause';
            } else {
                this.skyVideoElement.pause();
                document.getElementById('sky-play-btn').innerText = '▶ Abspielen';
            }
        };

        document.getElementById('sky-mute-btn').onclick = () => {
            if (!this.skyVideoElement) return;
            this.skyVideoElement.muted = !this.skyVideoElement.muted;
            document.getElementById('sky-mute-btn').innerText = this.skyVideoElement.muted ? '🔇 Ton AUS' : '🔊 Ton AN';
        };

        document.getElementById('sky-restart-btn').onclick = () => {
            if (!this.skyVideoElement) return;
            this.skyVideoElement.currentTime = 0;
            this.skyVideoElement.muted = false;
            this.skyVideoElement.play();
            document.getElementById('sky-play-btn').innerText = '⏸ Pause';
        };

        document.getElementById('sky-file-picker').onchange = (e) => {
            const file = e.target.files[0];
            if (file && this.skyVideoElement) {
                const url = URL.createObjectURL(file);
                this.skyVideoElement.src = url;
                this.skyVideoElement.muted = false;
                this.skyVideoElement.volume = 1.0;
                this.skyVideoElement.play();
                document.getElementById('sky-play-btn').innerText = '⏸ Pause';
            }
        };
    }

    /**
     * Startet das große Himmels-Video (lamavideo1) im Hintergrund mit Ton!
     */
    activateSkyVideo() {
        this.skyCinemaActive = true;
        if (this.skyCinemaGroup) {
            this.skyCinemaGroup.visible = true;
        }
        const ctrlBar = document.getElementById('sky-video-controls');
        if (ctrlBar) ctrlBar.style.display = 'flex';

        if (this.skyVideoElement) {
            this.skyVideoElement.muted = false;
            this.skyVideoElement.volume = 1.
