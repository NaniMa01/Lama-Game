/**
 * ============================================================================
 * PUZZLE MANAGER – BLUMEN-SCHIEBEPUZZLE, TRITTSTEINE & ALTAR-QUIZ
 * ============================================================================
 */

class PuzzleManager {
    constructor(game) {
        this.game = game;

        // Challenge 1: Blumen-Schiebepuzzle (3x3)
        this.flowerState = [0, 1, 2, 3, 4, 5, 6, 7, null];
        this.flowerMoves = 0;
        this.showFlowerNumbers = false; // Erwachsenen-Schwierigkeit: Standardmäßig AUS
        this.puzzle1Solved = false;
        this.tileDataUrls = [];

        // Challenge 2: Trittsteine
        this.currentBridgeRow = 0;
        this.puzzle2Solved = false;
        this.stepCooldown = false;

        // Challenge 3: Altar-Quiz & Schatztruhe
        this.puzzle3Solved = false;
        this.chestOpened = false;

        this.prepareFlowerTiles();
        this.buildQuizDOM();
    }

    /**
     * Schneidet entweder das prozedurale Blumen-Kunstwerk oder das eigene Bild
     * aus PERSONAL_CONFIG.world1.customFlowerImageUrl in 9 exakt passende Kacheln.
     */
    prepareFlowerTiles() {
        const customUrl = PERSONAL_CONFIG.world1.customFlowerImageUrl;
        if (customUrl && customUrl.trim() !== "") {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
                const c = document.createElement('canvas');
                c.width = 600; c.height = 600;
                const ctx = c.getContext('2d');
                ctx.drawImage(img, 0, 0, 600, 600);
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

    /**
     * Garantiert lösbares Mischen auf mittlerer Erwachsenen-Schwierigkeit (22 echte Züge)
     */
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

            // Wenn gelöst, wird auch das 9. Teil (Index 8) angezeigt, damit das Bild komplett ist!
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

        document.getElementById('flower-reveal-title').innerText = PERSONAL_CONFIG.world1.revealTitle;
        document.getElementById('flower-reveal-caption').innerText = PERSONAL_CONFIG.world1.revealCaption;
        document.getElementById('flower-reveal-banner').classList.remove('hidden');
        document.getElementById('flower-modal-footer').style.display = 'none';
    }

    proceedFromFlowerPuzzle() {
        this.game.closeAllModals();
        this.game.teleportToWorld(1);
    }

    // ------------------------------------------------------------------------
    // CHALLENGE 2: TRITTSTEIN-BRÜCKE IN WELT 2
    // ------------------------------------------------------------------------
    checkSteppingStones(playerPos) {
        if (this.puzzle2Solved || this.stepCooldown) return;

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

                    if (this.currentBridgeRow >= 5) {
                        this.puzzle2Solved = true;
                        this.game.showToast("✨ Der Pfad der Schlucht ist gemeistert! Teleportiere zum Gipfel... ✨");
                        this.game.sound.puzzleSolved();
                        setTimeout(() => this.game.teleportToWorld(2), 1300);
                    }
                } else if (row >= this.currentBridgeRow && number !== expectedNumber) {
                    this.stepCooldown = true;
                    topMat.map = TextureFactory.createStoneNumberTexture(number, 'wrong');
                    topMat.needsUpdate = true;
                    this.game.sound.stepWrong();
                    this.game.showToast("Falscher Trittstein! Schau dir die Obelisken am Start noch einmal an.");

                    setTimeout(() => {
                        this.resetBridge();
                        this.game.llama.pos.set(0, 0, 2);
                        this.stepCooldown = false;
                    }, 700);
                }
                break;
            }
        }
    }

    resetBridge() {
        this.currentBridgeRow = 0;
        this.game.worldBuilder.steppingStones.forEach(stone => {
            const { number, topMat } = stone.userData;
            topMat.map = TextureFactory.createStoneNumberTexture(number, 'default');
            topMat.needsUpdate = true;
        });
    }

    // ------------------------------------------------------------------------
    // CHALLENGE 3: ALTAR DER ERINNERUNGEN (WELT 3)
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
            this.puzzle3Solved = true;
            this.game.sound.puzzleSolved();
            this.game.closeAllModals();
            this.game.worldBuilder.chestGroup.visible = true;
            document.getElementById('world-objective').innerText = PERSONAL_CONFIG.world3.chestObjective;
            this.game.showToast("✨ Die goldene Schatztruhe ist auf dem Gipfel erschienen! ✨");
        } else {
            this.game.sound.stepWrong();
            errEl.innerText = "Noch nicht alle Antworten stimmen. Überlege noch einmal!";
        }
    }
}
