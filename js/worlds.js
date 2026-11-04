/**
 * ============================================================================
 * WORLD BUILDER – ERZEUGT DIE 3 ETAPPEN, SONNENUNTERGANG & 3D-HOLOGRAMM
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

        // Hologramm-Referenzen für Welt 1
        this.hologramGroup = null;
        this.hologramRings = [];
        this.hologramScale = 0;
        this.hologramActive = false;

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
    // WELT 1: SCHWEBENDE WIESEN-OASE (Blumen-Altar & Schwebendes Hologramm)
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

        // Goldener Blumen-Altar
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

        // --- DAS SCHWEBENDE 3D-HOLOGRAMM ÜBER DEM ALTAR ---
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

    /**
     * Erstellt den 3D-Hologramm-Projektor samt Bildfläche, Scanline-Shader-Look
     * und rotierenden Energieringen über dem Blumen-Altar.
     */
    buildHologramDisplay(worldGroup) {
        this.hologramGroup = new THREE.Group();
        this.hologramGroup.position.set(0, 4.9, -11);
        this.hologramGroup.visible = false;
        this.hologramGroup.scale.set(0.01, 0.01, 0.01);

        // 1. Halbtransparenter Projektions-Lichtkegel vom Altar nach oben
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
        projectorCone.rotation.x = Math.PI; // Spitze zeigt nach unten zum Altar
        projectorCone.position.y = -1.7;
        this.hologramGroup.add(projectorCone);

        // 2. Fallback-Textur (falls Bild noch lädt) + Laden von erinnerung1.jpg
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
        fCtx.font = 'bold 54px "Segoe UI", sans-serif';
        fCtx.textAlign = 'center';
        fCtx.fillText('+ SWISS INDOORS', 400, 260);
        fCtx.font = '28px "Segoe UI", sans-serif';
        fCtx.fillText('Lege "erinnerung1.jpg" in den Hauptordner', 400, 340);

        const fallbackTex = new THREE.CanvasTexture(fallbackCanvas);
        fallbackTex.encoding = THREE.sRGBEncoding;

        const imgMat = new THREE.MeshBasicMaterial({
            map: fallbackTex,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.94
        });

        // Lade das echte Foto (erinnerung1.jpg)
        const loader = new THREE.TextureLoader();
        loader.load(
            PERSONAL_CONFIG.world1.hologramImageUrl,
            (loadedTex) => {
                loadedTex.encoding = THREE.sRGBEncoding;
                imgMat.map = loadedTex;
                imgMat.needsUpdate = true;
            }
        );

        // 4:3 Bildfläche (passend zum Foto)
        const picPlane = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 3.9), imgMat);
        this.hologramGroup.add(picPlane);

        // 3. Feines Hologramm-Scanline-Overlay vor und hinter dem Bild
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

        // 4. Leuchtender Hologramm-Energierahmen (Cyan & Gold)
        const borderMat = new THREE.MeshBasicMaterial({ color: 0x80deea });
        const topBar = new THREE.Mesh(new THREE.BoxGeometry(5.45, 0.1, 0.1), borderMat);
        topBar.position.y = 2.0;
        const botBar = new THREE.Mesh(new THREE.BoxGeometry(5.45, 0.1, 0.1), borderMat);
        botBar.position.y = -2.0;
        this.hologramGroup.add(topBar, botBar);

        // 5. Zwei schwebende Hologramm-Ringe um den Altar
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

        // 6. Hintergrund-Schein
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
    // WELT 2: DÄMMERUNGS-SCHLUCHT
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

        const startPlat = new THREE.Mesh(new THREE.BoxGeometry(20, 4, 14), stoneMat);
        startPlat.position.set(0, -2, 4);
        startPlat.receiveShadow = true;
        group.add(startPlat);

        const endPlat = new THREE.Mesh(new THREE.BoxGeometry(20, 4, 12), stoneMat);
        endPlat.position.set(0, -2, -26);
        endPlat.receiveShadow = true;
        group.add(endPlat);

        [[-5.5, -1], [5.5, -1]].forEach(([ox, oz], idx) => {
            const ob = this.createStoneTablet(sandPBR);
            ob.position.set(ox, 0, oz);
            group.add(ob);

            this.interactables[1].push({
                pos: new THREE.Vector3(ox, 0, oz),
                radius: 3.2,
                type: 'obelisk_w2',
                index: idx,
                label: 'Obelisk-Inschrift lesen'
            });
        });

        const gridNums = PERSONAL_CONFIG.world2.gridNumbers;
        const startZ = -6.0;
        const rowSpacing = 3.4;
        const colSpacing = 3.2;

        for (let r = 0; r < 5; r++) {
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

        group.visible = false;
        this.scene.add(group);
        this.worlds.push(group);
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

        // Schwebendes 3D-Hologramm sanft entfalten & animieren
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

        this.floatingCrystals.forEach((c, idx) => {
            c.rotation.y = time * 0.6 + idx;
            c.position.y = 2.4 + Math.sin(time * 2 + idx) * 0.25;
        });
    }
}
