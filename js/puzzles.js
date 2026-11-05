/**
 * ============================================================================
 * PUZZLE MANAGER – BLUMEN-SCHIEBEPUZZLE, 4-STUFEN-BRÜCKE & 2-STUFIGES FINALE
 * ============================================================================
 */

class PuzzleManager {
    constructor(game) {
        this.game = game;

        // Challenge 1: Blumen-Schiebepuzzle
        this.flowerState = [0, 1, 2, 3, 4, 5, 6, 7, null];
        this.flowerMoves = 0;
        this.showFlowerNumbers = false;
        this.puzzle1Solved = false;
        this.tileDataUrls = [];

        // Challenge 2: 4-stufige Trittstein-Brücke (8 -> 2 -> 3 -> 7)
        this.currentBridgeRow = 0;
        this.puzzle2Solved = false;
        this.stepCooldown = false;

        // Challenge 3: Altar-Quiz, Himmels-Video & Schatztruhe
        this.puzzle3Solved = false;
        this.chestOpened = false;

        this.prepareFlowerTiles();
        this.buildQuizDOM();
    }

    prepareFlowerTiles() {
        const customUrl = PERSONAL_CONFIG.world1.customFlowerImageUrl;
        if (customUrl && customUrl.trim() !== "") {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
                const c = document.createElement('canvas');
                c.width = 600; c.height = 600;
                c.getContext('2d').drawImage(img, 0, 0, 600, 600);
                this.sliceCanvasInto9Tiles(c);
            };
            img.onerror = () => {
                this.sliceCanvasInto9Tiles(TextureFactory.createFlowerArtworkCanvas());
            };
            img.src = customUrl;
        } else {
            this.sliceCanvasInto9Tiles(TextureFactory.createFlowerArtworkCanvas());
        }
    }

    sliceCanvasInto9Tiles(sourceCanvas) {
        this.tileDataUrls = [];
        const tileSize = 200;
        for (let i = 0; i < 9; i++) {
            const r = Math.floor(i / 3);
            const c = i % 3;
            const sub = document.createElement('canvas');
            sub.width = tileSize;
            sub.height = tileSize;
            sub.getContext('2d').drawImage(
                sourceCanvas,
                c * tileSize, r * tileSize, tileSize, tileSize,
                0, 0, tileSize, tileSize
            );
            this.tileDataUrls.push(sub.toDataURL());
        }
        this.shuffleFlowerPuzzle(false);
    }

    shuffleFlowerPuzzle(playSound = true) {
        if (this.puzzle1Solved) return;
        this.flowerState = [0, 1, 2, 3, 4, 5, 6, 7, null];
        this.flowerMoves = 0;
        let lastEmpty = -1;

        for (let step = 0; step < 22; step++) {
            const emptyIdx = this.flowerState.indexOf(null);
            const r = Math.floor(emptyIdx / 3), c = emptyIdx % 3;
            const neighbors = [];

            if (r > 0) neighbors.push(emptyIdx - 3);
            if (r < 2) neighbors.push(emptyIdx + 3);
            if (c > 0) neighbors.push(emptyIdx - 1);
            if (c < 2) neighbors.push(emptyIdx + 1);

            const candidates = neighbors.filter(n => n !== lastEmpty);
            const pick = candidates[Math.floor(Math.random() * candidates.length)];

            this.flowerState[emptyIdx] = this.flowerState[pick];
            this.flowerState[pick] = null;
            lastEmpty = emptyIdx;
        }

        if (playSound) this.game.sound.slideTile();
        this.renderFlowerGrid();
    }

    toggleFlowerNumbers() {
        this.showFlowerNumbers = !this.showFlowerNumbers;
        const btn = document.getElementById('toggle-numbers-btn');
        btn.innerText = this.showFlowerNumbers ? "🔢 Zahlen-Hilfe: AN" : "🔢 Zahlen-Hilfe: AUS";
        this.renderFlowerGrid();
    }

    renderFlowerGrid() {
        const grid = document.getElementById('slider-grid');
        if (!grid) return;
        grid.innerHTML = '';
        grid.classList.toggle('solved', this.puzzle1Solved);

        document.getElementById('move-counter').innerText = `Züge: ${this.flowerMoves}`;

        this.flowerState.forEach((tileId, posIdx) => {
            const cell = document.createElement('div');
            const effectiveTileId = (this.puzzle1Solved && tileId === null) ? 8 : tileId;

            if (effectiveTileId === null) {
                cell.className = 'flower-tile empty';
            } else {
                cell.className = `flower-tile ${this.puzzle1Solved ? 'solved-tile' : ''}`;
                cell.style.backgroundImage = `url(${this.tileDataUrls[effectiveTileId]})`;

                if (!this.puzzle1Solved) {
                    const numBadge = document.createElement('span');
                    numBadge.className = `tile-number ${this.showFlowerNumbers ? '' : 'hidden-num'}`;
                    numBadge.innerText = effectiveTileId + 1;
                    cell.appendChild(numBadge);
                    cell.onclick = () => this.handleFlowerTileClick(posIdx);
                }
            }
            grid.appendChild(cell);
        });
    }

    handleFlowerTileClick(clickedIdx) {
        if (this.puzzle1Solved) return;
        const emptyIdx = this.flowerState.indexOf(null);
        const r1 = Math.floor(clickedIdx / 3), c1 = clickedIdx % 3;
        const r2 = Math.floor(emptyIdx / 3), c2 = emptyIdx % 3;

        if (Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1) {
            this.flowerState[emptyIdx] = this.flowerState[clickedIdx];
            this.flowerState[clickedIdx] = null;
            this.flowerMoves++;
            this.game.sound.slideTile();
            this.renderFlowerGrid();
            this.checkFlowerPuzzleWin();
        }
    }

    checkFlowerPuzzleWin() {
        const isSolved = this.flowerState.slice(0, 8).every((val, idx) => val === idx);
        if (isSolved) {
            this.completeFlowerPuzzle();
        }
    }

    completeFlowerPuzzle() {
        this.puzzle1Solved = true;
        this.flowerState = [0, 1, 2, 3, 4, 5, 6, 7, 8];
        this.game.sound.puzzleSolved();
        this.renderFlowerGrid();

        if (this.game.worldBuilder.activateHologram) {
            this.game.worldBuilder.activateHologram();
        }

        const altarItem = this.game.worldBuilder.interactables[0].find(i => i.type === 'flower_altar');
        if (altarItem) {
            altarItem.label = 'In die 2. Welt (Dämmerungs-Schlucht) teleportieren ➔';
        }
        document.getElementById('world-objective').innerText = PERSONAL_CONFIG.world1.hologramObjective;

        document.getElementById('flower-reveal-title').innerText = PERSONAL_CONFIG.world1.revealTitle;
        document.getElementById('flower-reveal-caption').innerText = PERSONAL_CONFIG.world1.revealCaption;
        document.getElementById('flower-reveal-banner').classList.remove('hidden');
        document.getElementById('flower-modal-footer').style.display = 'none';
    }

    revealHologramInWorld() {
        this.game.closeAllModals();
        this.game.cameraAngle = 0;
        this.game.cameraPitch = 0.22;
        this.game.cameraDist = 11.5;
        this.game.showToast("✨ Euer Erinnerungs-Hologramm schwebt über dem Altar! Drücke [E] am Altar für Level 2 ✨");
    }

    // ------------------------------------------------------------------------
    // CHALLENGE 2: 4-STUFIGE TRITTSTEIN-BRÜCKE & FLAGGENMAST
    // ------------------------------------------------------------------------
    checkSteppingStones(playerPos) {
        if (this.puzzle2Solved || this.stepCooldown) return;
        const totalSteps = PERSONAL_CONFIG.world2.solutionPath.length;

        for (const stone of this.game.worldBuilder.steppingStones) {
            const dx = Math.abs(playerPos.x - stone.position.x);
            const dz = Math.abs(playerPos.z - stone.position.z);

            if (dx < 1.15 && dz < 1.15 && playerPos.y < 0.45) {
                const { row, number, topMat } = stone.userData;
                const expectedNumber = PERSONAL_CONFIG.world2.solutionPath[row];

                if (row === this.currentBridgeRow && number === expectedNumber) {
                    topMat.map = TextureFactory.createStoneNumberTexture(number, 'active');
                    topMat.needsUpdate = true;
                    this.game.sound.stepCorrect(row);
                    this.currentBridgeRow++;

                    if (this.currentBridgeRow >= totalSteps) {
                        this.completeBridgePuzzle();
                    }
                } else if (row >= this.currentBridgeRow && number !== expectedNumber) {
                    this.stepCooldown = true;
                    topMat.map = TextureFactory.createStoneNumberTexture(number, 'wrong');
                    topMat.needsUpdate = true;
                    this.game.sound.stepWrong();
                    this.game.showToast(`Falscher Stein! Lies Säule ${this.currentBridgeRow + 1} am Start noch einmal.`);

                    setTimeout(() => {
                        this.resetBridge();
                        this.game.llama.pos.set(0, 0, 3.5);
                        this.stepCooldown = false;
                    }, 750);
                }
                break;
            }
        }
    }

    completeBridgePuzzle() {
        this.puzzle2Solved = true;
        this.currentBridgeRow = PERSONAL_CONFIG.world2.solutionPath.length;

        this.game.worldBuilder.steppingStones.forEach(stone => {
            const { row, number, topMat } = stone.userData;
            if (PERSONAL_CONFIG.world2.solutionPath[row] === number) {
                topMat.map = TextureFactory.createStoneNumberTexture(number, 'active');
                topMat.needsUpdate = true;
            }
        });

        this.game.worldBuilder.activateFlag();
        this.game.sound.chestFanfare();
        document.getElementById('world-objective').innerText = PERSONAL_CONFIG.world2.flagObjective;
        this.game.showToast("🚩 Alle 4 Stufen gemeistert! Am Ziel-Plateau fährt eure Erinnerungs-Flagge hoch! Drücke dort [E] für Welt 3.");
    }

    resetBridge() {
        this.currentBridgeRow = 0;
        this.puzzle2Solved = false;
        this.game.worldBuilder.resetFlag();
        this.game.worldBuilder.steppingStones.forEach(stone => {
            const { number, topMat } = stone.userData;
            topMat.map = TextureFactory.createStoneNumberTexture(number, 'default');
            topMat.needsUpdate = true;
        });
    }

    // ------------------------------------------------------------------------
    // CHALLENGE 3: ALTAR DER ERINNERUNGEN -> 1. HIMMELS-VIDEO -> 2. SCHATZTRUHE
    // ------------------------------------------------------------------------
    buildQuizDOM() {
        const container = document.getElementById('quiz-questions-container');
        if (!container) return;
        container.innerHTML = '';

        PERSONAL_CONFIG.world3.questions.forEach((qObj, qIdx) => {
            const block = document.createElement('div');
            block.className = 'quiz-question-block';

            const label = document.createElement('label');
            label.innerText = qObj.question;
            block.appendChild(label);

            const select = document.createElement('select');
            select.className = 'quiz-select';
            select.id = `quiz-select-${qIdx}`;

            qObj.options.forEach((optText, optIdx) => {
                const opt = document.createElement('option');
                opt.value = optIdx;
                opt.innerText = optText;
                select.appendChild(opt);
            });

            block.appendChild(select);
            container.appendChild(block);
        });
    }

    submitQuiz() {
        const questions = PERSONAL_CONFIG.world3.questions;
        let allCorrect = true;

        questions.forEach((q, idx) => {
            const sel = document.getElementById(`quiz-select-${idx}`);
            if (parseInt(sel.value, 10) !== q.correctIndex) {
                allCorrect = false;
            }
        });

        const errEl = document.getElementById('quiz-error');
        if (allCorrect) {
            errEl.innerText = "";
            this.unlockSummitSkyAndChest();
        } else {
            this.game.sound.stepWrong();
            errEl.innerText = "Noch nicht alle Antworten stimmen. Überlege noch einmal!";
        }
    }

    /**
     * STUFE 1 DES FINALES:
     * Nach Lösen des Altars startet im Himmel `lamavideo1.mp4` (mit Ton)
     * und die noch geschlossene Schatztruhe erscheint auf dem Podest.
     */
    unlockSummitSkyAndChest() {
        this.puzzle3Solved = true;
        this.chestOpened = false;
        this.game.closeAllModals();
        this.game.sound.puzzleSolved();

        // Schatztruhe erscheint (Deckel bleibt noch geschlossen!)
        this.game.worldBuilder.chestGroup.visible = true;
        if (this.game.worldBuilder.chestLidPivot) {
            this.game.worldBuilder.chestLidPivot.rotation.x = 0;
        }

        // Interaktions-Text der Truhe auf das Öffnen des wahren Videos setzen
        const chestItem = this.game.worldBuilder.interactables[2].find(i => i.type === 'treasure_chest');
        if (chestItem) {
            chestItem.label = 'Goldene Schatztruhe öffnen 🎁';
        }

        document.getElementById('world-objective').innerText = PERSONAL_CONFIG.world3.chestObjective;

        // Kamera so ausrichten, dass man das Himmels-Video UND die Truhe davor sieht
        this.game.cameraAngle = 0;
        this.game.cameraPitch = 0.16;
        this.game.cameraDist = 12.5;

        // Himmels-Video (lamavideo1) im Hintergrund mit Ton starten!
        this.game.worldBuilder.activateSkyVideo();
        this.game.showToast("✨ Schau hoch in den Himmel! Und lauf danach zur goldenen Schatztruhe [Taste E]! ✨");
    }
}
