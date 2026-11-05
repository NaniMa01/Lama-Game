/**
 * ============================================================================
 * WORLD BUILDER – ERZEUGT DIE 3 ETAPPEN, HOLOGRAMM & AUSFAHRENDEN FLAGGENMAST
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

        this.buildSkyAndHorizon();
        this.buildWorld1();
        this.buildWorld2();
        this.buildWorld3();
    }

    buildSkyAndHorizon() {
        const skyGeo = new THREE.SphereGeometry(420, 32, 32);
        const skyMat = new THREE.ShaderMaterial({
            side: THREE.BackSide,
            depthWrite: false,
            uniforms: {
                topColor: { value: new THREE.Color(0x160a2e) },
                midColor: { value: new THREE.Color(0x7b2c5c) },
                horizonColor: { value: new THREE.Color(0xff9e5e) }
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
                    vec3 col = mix(horizonColor, midColor, smoothstep(0.0, 0.28, h));
                    col = mix(col, topColor, smoothstep(0.28, 0.85, h));
                    gl_FragColor = vec4(col, 1.0);
                }
            `
        });
        this.scene.add(new THREE.Mesh(skyGeo, skyMat));

        const sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({
            map: TextureFactory.createGlowTexture('#ffae52'),
            blending: THREE.AdditiveBlending
        }));
        sunGlow.position.set(0, 28, -220);
        sunGlow.scale.set(95, 95, 1);
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

        // Start-Plateau (Süden) – breit genug für die 4 Säulen nebeneinander
        const startPlat = new THREE.Mesh(new THREE.BoxGeometry(24, 4, 14), stoneMat);
        startPlat.position.set(0, -2, 4.5);
        startPlat.receiveShadow = true;
        group.add(startPlat);

        // Ziel-Plateau (Norden) hinter den 4 Stufen
        const endPlat = new THREE.Mesh(new THREE.BoxGeometry(22, 4, 14), stoneMat);
        endPlat.position.set(0, -2, -23.5);
        endPlat.receiveShadow = true;
        group.add(endPlat);

        // 4 Hinweis-Säulen von links nach rechts am Rand des Start-Plateaus
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

        // 4 Reihen (Stufen) x 4 Spalten Trittsteine über die Schlucht
        const gridNums = PERSONAL_CONFIG.world2.gridNumbers;
        const numRows = gridNums.length; // 4 Stufen
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

        // Ausfahrender Flaggenmast mit der Erinnerungs-Flagge auf dem Ziel-Plateau
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

    /**
     * Erstellt eine antike Sandstein-Säule mit eingravierter römischer/arabischer Nummer
     */
    createHintPillar(pbr, pillarNumber) {
        const g = new THREE.Group();
        const mat = new THREE.MeshStandardMaterial({
            map: pbr.map,
            bumpMap: pbr.bumpMap,
            bumpScale: 0.1,
            roughness: 0.8
        });

        // Sockel
        const base = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.45, 1.5), mat);
        base.position.y = 0.225;
        base.castShadow = true;
        g.add(base);

        // Säulenschaft
        const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.62, 2.4, 16), mat);
        shaft.position.y = 1.6;
        shaft.castShadow = true;
        g.add(shaft);

        // Kapitell (Oben)
        const cap = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.35, 1.4), mat);
        cap.position.y = 2.9;
        cap.castShadow = true;
        g.add(cap);

        // Leuchtende Plakette mit Säulen-Nummer
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

    /**
     * Baut den goldenen Flaggenmast am Ziel-Plateau, der nach dem 4. Trittstein
     * aus dem Podest hochfährt und die Flagge mit `erinnerung2.jpg` hisst.
     */
    buildRisingFlagpole(worldGroup, sandPBR) {
        const anchor = new THREE.Group();
        anchor.position.set(0, 0, -22.5);

        // Festes Stein- & Gold-Podest am Boden
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

        // Bewegliche Mast-Gruppe (startet versenkt im Boden und fährt bei Sieg hoch!)
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

        // Goldene Kugel auf der Mastspitze
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

        // Die Flaggen-Tuch-Gruppe (gleitet am Mast nach oben)
        this.flagBannerGroup = new THREE.Group();
        this.flagBannerGroup.position.set(0.16, 2.2, 0); // Startet unten am Mast

        // Querträger-Stab oben an der Flagge, damit das Foto immer perfekt lesbar hängt
        const crossbar = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 5.5, 12), poleMat);
        crossbar.rotation.z = Math.PI / 2;
        crossbar.position.set(2.75, 1.95, 0);
        this.flagBannerGroup.add(crossbar);

        // Fallback-Textur + Smart-Loader für erinnerung2.jpg
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

        // Unterteilte PlaneGeometry für sanftes Wehen im Wind
        const flagGeo = new THREE.PlaneGeometry(5.2, 3.9, 20, 12);
        this.flagBaseVertices = flagGeo.attributes.position.array.slice();

        this.flagMesh = new THREE.Mesh(flagGeo, flagMat);
        this.flagMesh.position.set(2.75, 0, 0);
        this.flagMesh.castShadow = true;
        this.flagBannerGroup.add(this.flagMesh);

        // Hintergrund-Schein hinter der Flagge für perfekte Sichtbarkeit in der Dämmerung
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

    /**
     * Lädt ein Bild und probiert automatisch .jpg, .jpeg und .png durch,
     * falls die Dateiendung im Ordner anders geschrieben ist.
     */
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
    // WELT 3: STERNENHIMMEL-GIPFEL
    // ------------------------------------------------------------------------
    buildWorld3() {
        const group = new THREE.Group();
        const slatePBR = TextureFactory.createPBRSet('slate', 6, 6);

        const peak = new THREE.Mesh(
            new THREE.CylinderGeometry(22, 26, 3, 40),
            new THREE.MeshStandardMaterial({
                map: slatePBR.map,
                bumpMap: slatePBR.bumpMap,
                bumpScale: 0.14,
                roughness: 0.78
            })
        );
        peak.position.y = -1.5;
        peak.receiveShadow = true;
        group.add(peak);

        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const cx = Math.cos(angle) * 16;
            const cz = Math.sin(angle) * 16;

            const crystal = new THREE.Mesh(
                new THREE.OctahedronGeometry(1.3, 0),
                new THREE.MeshStandardMaterial({
                    color: 0x80d8ff,
                    emissive: 0x00b0ff,
                    emissiveIntensity: 0.6,
                    roughness: 0.15
                })
            );
            crystal.scale.set(0.7, 2.2, 0.7);
            crystal.position.set(cx, 2.4, cz);
            group.add(crystal);
            this.floatingCrystals.push(crystal);
        }

        const altar = this.createStoneTablet(slatePBR);
        altar.position.set(0, 0, -6);
        group.add(altar);

        this.interactables[2].push({
            pos: new THREE.Vector3(0, 0, -6),
            radius: 3.6,
            type: 'quiz_altar',
            label: 'Altar der Erinnerungen öffnen'
        });

        this.chestGroup = new THREE.Group();
        this.chestGroup.position.set(0, 0, -12.5);
        this.chestGroup.visible = false;

        const woodMat = new THREE.MeshStandardMaterial({ color: 0x5d3a1a, roughness: 0.55 });
        const goldMat = new THREE.MeshStandardMaterial({ color: 0xffd54f, metalness: 0.85, roughness: 0.2 });

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
            radius: 3.8,
            type: 'treasure_chest',
            label: 'Goldene Schatztruhe öffnen 🎁'
        });

        group.visible = false;
        this.scene.add(group);
        this.worlds.push(group);
    }

    createTree(barkPBR) {
        const tree = new THREE.Group();
        const trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(0.32, 0.5, 2.8, 12),
            new THREE.MeshStandardMaterial({ map: barkPBR.map, roughness: 0.9 })
        );
        trunk.position.y = 1.4;
        trunk.castShadow = true;
        tree.add(trunk);

        const crownColors = [0x2e7d32, 0x388e3c, 0x43a047];
        crownColors.forEach((col, i) => {
            const foliage = new THREE.Mesh(
                new THREE.DodecahedronGeometry(1.65 - i * 0.3, 1),
                new THREE.MeshStandardMaterial({ color: col, roughness: 0.75 })
            );
            foliage.position.set((i - 1) * 0.35, 3.1 + i * 0.75, 0);
            foliage.castShadow = true;
            tree.add(foliage);
        });
        return tree;
    }

    createStoneTablet(pbr) {
        const g = new THREE.Group();
        const slab = new THREE.Mesh(
            new THREE.BoxGeometry(1.4, 2.2, 0.45),
            new THREE.MeshStandardMaterial({ map: pbr.map, bumpMap: pbr.bumpMap, bumpScale: 0.08, roughness: 0.8 })
        );
        slab.position.y = 1.1;
        slab.castShadow = true;
        g.add(slab);

        const runeGlow = new THREE.Sprite(new THREE.SpriteMaterial({
            map: TextureFactory.createGlowTexture('#ffbe64'),
            blending: THREE.AdditiveBlending
        }));
        runeGlow.position.set(0, 1.3, 0.3);
        runeGlow.scale.set(1.4, 1.4, 1);
        g.add(runeGlow);
        return g;
    }

    updateEnvironment(time) {
        if (this.altarGem) {
            this.altarGem.rotation.y = time * 1.4;
            this.altarGem.position.y = 2.55 + Math.sin(time * 2.5) * 0.15;
        }

        // Welt 1: Schwebendes 3D-Hologramm
        if (this.hologramActive && this.hologramGroup) {
            this.hologramScale = Math.min(1.0, this.hologramScale + 0.035);
            this.hologramGroup.scale.setScalar(this.hologramScale);
            this.hologramGroup.position.y = 4.9 + Math.sin(time * 2.2) * 0.18;
            this.hologramGroup.rotation.y = Math.sin(time * 0.7) * 0.18;

            if (this.hologramScanTex) {
                this.hologramScanTex.offset.y = (time * 0.25) % 1;
            }
            this.hologramRings.forEach((ring, i) => {
                ring.rotation.z = time * (i === 0 ? 1.2 : -0.9);
            });
        }

        // Welt 2: Flaggenmast fährt aus dem Podest hoch & Flagge weht sanft im Wind
        if (this.flagActive && this.flagpoleRisingGroup) {
            this.flagPoleProgress = Math.min(1.0, this.flagPoleProgress + 0.018);
            const easeOut = 1 - Math.pow(1 - this.flagPoleProgress, 3);
            this.flagpoleRisingGroup.position.y = -8.5 + easeOut * 8.5;

            if (this.flagPoleProgress > 0.35) {
                this.flagHoistProgress = Math.min(1.0, this.flagHoistProgress + 0.02);
                const hoistEase = 1 - Math.pow(1 - this.flagHoistProgress, 2);
                this.flagBannerGroup.position.y = 2.2 + hoistEase * 4.3;
            }

            // Sanfte Wellenbewegung im Fahnentuch
            if (this.flagMesh && this.flagBaseVertices) {
                const posAttr = this.flagMesh.geometry.attributes.position;
                const arr = posAttr.array;
                for (let i = 0; i < arr.length; i += 3) {
                    const bx = this.flagBaseVertices[i];
                    const by = this.flagBaseVertices[i + 1];
                    // Je weiter rechts vom Mast (bx > -2.6), desto stärker weht der Stoff
                    const distFromPole = (bx + 2.6) / 5.2;
                    arr[i + 2] = Math.sin(bx * 1.4 - time * 3.8 + by * 0.5) * 0.22 * distFromPole;
                }
                posAttr.needsUpdate = true;
            }
        }

        this.floatingCrystals.forEach((c, idx) => {
            c.rotation.y = time * 0.6 + idx;
            c.position.y = 2.4 + Math.sin(time * 2 + idx) * 0.25;
        });
    }
}
