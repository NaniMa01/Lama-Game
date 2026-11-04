/**
 * ============================================================================
 * TEXTURE FACTORY – PROZEDURALE PBR-OBERFLÄCHEN & BLUMEN-MOSAIK-GENERATOR
 * ============================================================================
 */

class TextureFactory {

    static hash(x, y, seed = 1) {
        let n = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453123;
        return n - Math.floor(n);
    }

    static smoothNoise(x, y, period = 16, seed = 1) {
        const ix = Math.floor(x), iy = Math.floor(y);
        const fx = x - ix, fy = y - iy;
        const ux = fx * fx * (3 - 2 * fx);
        const uy = fy * fy * (3 - 2 * fy);

        const x0 = ((ix % period) + period) % period;
        const x1 = (((ix + 1) % period) + period) % period;
        const y0 = ((iy % period) + period) % period;
        const y1 = (((iy + 1) % period) + period) % period;

        const a = this.hash(x0, y0, seed);
        const b = this.hash(x1, y0, seed);
        const c = this.hash(x0, y1, seed);
        const d = this.hash(x1, y1, seed);

        return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
    }

    static fbm(u, v, octaves = 4, basePeriod = 8, seed = 1) {
        let value = 0, amp = 0.5, freq = 1;
        for (let i = 0; i < octaves; i++) {
            const p = basePeriod * freq;
            value += amp * this.smoothNoise(u * p, v * p, p, seed + i * 19);
            freq *= 2;
            amp *= 0.5;
        }
        return value;
    }

    static createPBRSet(type, repeatX = 4, repeatY = 4) {
        const size = 256;
        const colorCanvas = document.createElement('canvas');
        const bumpCanvas = document.createElement('canvas');
        colorCanvas.width = bumpCanvas.width = size;
        colorCanvas.height = bumpCanvas.height = size;

        const cCtx = colorCanvas.getContext('2d');
        const bCtx = bumpCanvas.getContext('2d');
        const cImg = cCtx.createImageData(size, size);
        const bImg = bCtx.createImageData(size, size);

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const u = x / size, v = y / size;
                const idx = (y * size + x) * 4;
                const n = this.fbm(u, v, 4, 8, type.length * 13);
                const detail = this.fbm(u, v, 3, 24, 99);

                let r = 128, g = 128, b = 128, h = n * 255;

                if (type === 'meadow') {
                    r = 45 + n * 45 + detail * 15;
                    g = 110 + n * 65 + detail * 20;
                    b = 52 + n * 30;
                } else if (type === 'granite') {
                    const gVal = 95 + n * 70 + (detail - 0.5) * 35;
                    r = gVal * 1.03; g = gVal * 0.96; b = gVal * 0.92;
                } else if (type === 'sandstone') {
                    const strata = Math.sin(v * Math.PI * 16 + n * 4) * 0.5 + 0.5;
                    r = 165 + strata * 55 + detail * 15;
                    g = 98 + strata * 42 + detail * 10;
                    b = 58 + strata * 25;
                    h = (strata * 0.6 + detail * 0.4) * 255;
                } else if (type === 'slate') {
                    const sVal = 48 + n * 45 + detail * 20;
                    r = sVal * 0.95; g = sVal * 0.92; b = sVal * 1.25;
                } else if (type === 'wool') {
                    const curls = Math.sin(u * 60 + n * 12) * Math.cos(v * 60 + detail * 12) * 0.5 + 0.5;
                    r = 232 + curls * 20;
                    g = 220 + curls * 20;
                    b = 200 + curls * 18;
                    h = curls * 255;
                } else if (type === 'bark') {
                    const ridges = Math.sin(u * Math.PI * 24 + n * 5) * 0.5 + 0.5;
                    r = 78 + ridges * 40;
                    g = 48 + ridges * 26;
                    b = 30 + ridges * 16;
                    h = ridges * 255;
                }

                cImg.data[idx] = Math.min(255, Math.max(0, r));
                cImg.data[idx + 1] = Math.min(255, Math.max(0, g));
                cImg.data[idx + 2] = Math.min(255, Math.max(0, b));
                cImg.data[idx + 3] = 255;

                bImg.data[idx] = bImg.data[idx + 1] = bImg.data[idx + 2] = Math.min(255, Math.max(0, h));
                bImg.data[idx + 3] = 255;
            }
        }

        cCtx.putImageData(cImg, 0, 0);
        bCtx.putImageData(bImg, 0, 0);

        const map = new THREE.CanvasTexture(colorCanvas);
        const bumpMap = new THREE.CanvasTexture(bumpCanvas);
        map.encoding = THREE.sRGBEncoding;

        [map, bumpMap].forEach(t => {
            t.wrapS = THREE.RepeatWrapping;
            t.wrapT = THREE.RepeatWrapping;
            t.repeat.set(repeatX, repeatY);
        });

        return { map, bumpMap };
    }

    /**
     * Erzeugt die Boho-/Anden-Satteldecken-Textur für das Lama
     */
    static createSaddleTexture() {
        const c = document.createElement('canvas');
        c.width = 256; c.height = 256;
        const ctx = c.getContext('2d');

        ctx.fillStyle = '#8e244d';
        ctx.fillRect(0, 0, 256, 256);

        const stripes = ['#ffb74d', '#26a69a', '#ff7043', '#ffd54f', '#5c6bc0'];
        for (let y = 0; y < 256; y += 32) {
            ctx.fillStyle = stripes[(y / 32) % stripes.length];
            ctx.fillRect(0, y, 256, 12);

            ctx.fillStyle = '#fff8e1';
            for (let x = 0; x < 256; x += 16) {
                ctx.beginPath();
                ctx.moveTo(x + 8, y + 14);
                ctx.lineTo(x + 14, y + 22);
                ctx.lineTo(x + 8, y + 30);
                ctx.lineTo(x + 2, y + 22);
                ctx.fill();
            }
        }

        const tex = new THREE.CanvasTexture(c);
        tex.encoding = THREE.sRGBEncoding;
        return tex;
    }

    /**
     * Erzeugt ein weiches Glow-Sprite für Laternen, Kristalle und Portale
     */
    static createGlowTexture(colorHex = '#ffbe64') {
        const c = document.createElement('canvas');
        c.width = 128; c.height = 128;
        const ctx = c.getContext('2d');
        const grad = ctx.createRadialGradient(64, 64, 4, 64, 64, 60);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.35, colorHex);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 128, 128);
        return new THREE.CanvasTexture(c);
    }

    /**
     * Erzeugt eine Zahlen-Textur für die Trittsteine in Welt 2
     */
    static createStoneNumberTexture(number, state = 'default') {
        const c = document.createElement('canvas');
        c.width = 256; c.height = 256;
        const ctx = c.getContext('2d');

        ctx.fillStyle = state === 'active' ? '#1e4620' : (state === 'wrong' ? '#5c1616' : '#3a2d28');
        ctx.fillRect(0, 0, 256, 256);

        ctx.strokeStyle = state === 'active' ? '#69f0ae' : '#ffbe64';
        ctx.lineWidth = 8;
        ctx.strokeRect(14, 14, 228, 228);

        ctx.fillStyle = state === 'active' ? '#b9f6ca' : '#ffecd2';
        ctx.font = 'bold 110px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(number), 128, 132);

        const tex = new THREE.CanvasTexture(c);
        tex.encoding = THREE.sRGBEncoding;
        return tex;
    }

    /**
     * Generiert das hochdetaillierte 600x600 Blumen-Mandala-Kunstwerk für Challenge 1.
     * Jedes der 9 Felder ist über goldene Ranken, Farbverläufe und Blütenblätter
     * optisch miteinander verbunden, sodass man das Bild logisch zusammensetzen kann.
     */
    static createFlowerArtworkCanvas() {
        const c = document.createElement('canvas');
        c.width = 600;
        c.height = 600;
        const ctx = c.getContext('2d');

        // 1. Warmer Sonnenuntergangs-Gartenhintergrund (Oben Koralle/Gold -> Unten Tiefblau/Violett)
        const bgGrad = ctx.createLinearGradient(0, 0, 0, 600);
        bgGrad.addColorStop(0, '#4a1942');
        bgGrad.addColorStop(0.5, '#1f2f38');
        bgGrad.addColorStop(1, '#101935');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, 600, 600);

        // 2. Großer goldener Mandala-Kreis & Raute (verbindet alle 9 Kacheln miteinander!)
        ctx.strokeStyle = 'rgba(255, 202, 100, 0.55)';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(300, 300, 220, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(129, 199, 132, 0.6)';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(300, 50);
        ctx.lineTo(550, 300);
        ctx.lineTo(300, 550);
        ctx.lineTo(50, 300);
        ctx.closePath();
        ctx.stroke();

        // 3. Geschwungene grüne Blumenstängel vom Zentrum in alle 8 äußeren Kacheln
        const positions = [
            [100, 100], [300, 100], [500, 100],
            [100, 300], [300, 300], [500, 300],
            [100, 500], [300, 500], [500, 500]
        ];

        ctx.strokeStyle = '#66bb6a';
        ctx.lineWidth = 7;
        positions.forEach(([px, py], idx) => {
            if (idx === 4) return;
            ctx.beginPath();
            ctx.moveTo(300, 300);
            ctx.quadraticCurveTo(300 + (px - 300) * 0.35, py, px, py);
            ctx.stroke();
        });

        // 4. Hilfsfunktion zum Zeichnen einer reichhaltigen mehrschichtigen Blüte
        const drawFlower = (cx, cy, radius, petalColor1, petalColor2, centerColor, petalCount = 12) => {
            ctx.save();
            ctx.translate(cx, cy);

            // Äußerer Schein
            const glow = ctx.createRadialGradient(0, 0, radius * 0.2, 0, 0, radius * 1.25);
            glow.addColorStop(0, petalColor1);
            glow.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(0, 0, radius * 1.25, 0, Math.PI * 2);
            ctx.fill();

            // Blütenblätter (2 Lagen)
            for (let layer = 0; layer < 2; layer++) {
                const count = petalCount;
                const r = layer === 0 ? radius : radius * 0.72;
                ctx.fillStyle = layer === 0 ? petalColor1 : petalColor2;
                for (let i = 0; i < count; i++) {
                    ctx.save();
                    ctx.rotate((i * Math.PI * 2) / count + (layer * Math.PI) / count);
                    ctx.beginPath();
                    ctx.ellipse(0, -r * 0.55, r * 0.24, r * 0.52, 0, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = 'rgba(255,255,255,0.28)';
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                    ctx.restore();
                }
            }

            // Blütenstempel
            ctx.fillStyle = centerColor;
            ctx.beginPath();
            ctx.arc(0, 0, radius * 0.26, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#fff8e1';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.restore();
        };

        // 5. Neun charakteristische Blumen für die 9 Sektoren:
        // Obere Reihe (Abendrot, Sonnenblume, Lavendel-Stern)
        drawFlower(100, 100, 68, '#ff5252', '#ff8a80', '#ffd54f', 10);
        drawFlower(300, 100, 72, '#ffb300', '#ffe082', '#5d4037', 16);
        drawFlower(500, 100, 68, '#ab47bc', '#ea80fc', '#fff59d', 12);

        // Mittlere Reihe (Türkis-Lotus, Große Gold-Rose im Zentrum, Korallen-Dahlie)
        drawFlower(100, 300, 70, '#26a69a', '#80cbc4', '#ffd54f', 12);
        drawFlower(300, 300, 95, '#ffca28', '#ff7043', '#fff8e1', 18); // Herzstück
        drawFlower(500, 300, 70, '#ec407a', '#f48fb1', '#ffd54f', 12);

        // Untere Reihe (Blaue Enzian-Blüte, Weiße Lilie, Magische Nacht-Orchidee)
        drawFlower(100, 500, 68, '#42a5f5', '#90caf9', '#ffe082', 10);
        drawFlower(300, 500, 72, '#ec407a', '#fff59d', '#ff6f00', 14);
        drawFlower(500, 500, 68, '#7e57c2', '#b388ff', '#ffd54f', 10);

        // 6. Durchgehender goldener Zierrahmen am äußeren Rand (wichtiger Hinweis für Rand- & Eckteile!)
        ctx.strokeStyle = '#ffca64';
        ctx.lineWidth = 14;
        ctx.strokeRect(18, 18, 564, 564);

        ctx.strokeStyle = '#fff3e0';
        ctx.lineWidth = 3;
        ctx.strokeRect(30, 30, 540, 540);

        return c;
    }
}
