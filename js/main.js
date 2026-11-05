/**
 * ============================================================================
 * MAIN GAME ENGINE – KAMERA, STEUERUNG, INTERAKTIONEN & RENDER-LOOP
 * ============================================================================
 */

class AnniversaryGame {
    constructor() {
        this.sound = new SoundSystem();
        this.currentWorld = 0;
        this.clock = new THREE.Clock();

        this.keys = { w: false, a: false, s: false, d: false };
        this.mouse = { isDown: false, x: 0, y: 0 };
        this.cameraAngle = 0;
        this.cameraPitch = 0.36;
        this.cameraDist = 9.5;
        this.activeInteractable = null;

        this.initThree();
        this.llama = new LlamaPlayer(this.scene);
        this.worldBuilder = new WorldBuilder(this.scene);
        this.puzzles = new PuzzleManager(this);

        this.initEvents();
        this.updateHUD();

        setTimeout(() => {
            const loader = document.getElementById('loader');
            loader.style.opacity = '0';
            setTimeout(() => loader.style.display = 'none', 700);
        }, 400);

        this.animate();
    }

    initThree() {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x3a1c4e, 0.012);

        this.camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 600);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.15;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.body.appendChild(this.renderer.domElement);

        const hemiLight = new THREE.HemisphereLight(0xffb74d, 0x2a1442, 0.75);
        this.scene.add(hemiLight);

        this.sunLight = new THREE.DirectionalLight(0xffdfba, 1.65);
        this.sunLight.position.set(28, 42, -35);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.set(2048, 2048);
        const d = 32;
        this.sunLight.shadow.camera.left = -d;
        this.sunLight.shadow.camera.right = d;
        this.sunLight.shadow.camera.top = d;
        this.sunLight.shadow.camera.bottom = -d;
        this.scene.add(this.sunLight);
    }

    initEvents() {
        window.addEventListener('keydown', e => {
            if (this.isAnyModalOpen() && e.code !== 'Escape') return;

            if (e.code === 'KeyW' || e.code === 'ArrowUp') this.keys.w = true;
            if (e.code === 'KeyS' || e.code === 'ArrowDown') this.keys.s = true;
            if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.keys.a = true;
            if (e.code === 'KeyD' || e.code === 'ArrowRight') this.keys.d = true;

            if (e.code === 'Space' && this.llama.isGrounded) {
                this.llama.velY = 0.23;
                this.llama.isGrounded = false;
                this.sound.jump();
            }

            if (e.code === 'KeyE') this.triggerInteraction();
            if (e.code === 'KeyH') this.solveCurrentPuzzle();
            if (e.code === 'Escape') this.closeAllModals();
        });

        window.addEventListener('keyup', e => {
            if (e.code === 'KeyW' || e.code === 'ArrowUp') this.keys.w = false;
            if (e.code === 'KeyS' || e.code === 'ArrowDown') this.keys.s = false;
            if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.keys.a = false;
            if (e.code === 'KeyD' || e.code === 'ArrowRight') this.keys.d = false;
        });

        window.addEventListener('mousedown', e => {
            if (this.isAnyModalOpen()) return;
            this.mouse.isDown = true;
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });

        window.addEventListener('mousemove', e => {
            if (!this.mouse.isDown) return;
            const dx = e.clientX - this.mouse.x;
            const dy = e.clientY - this.mouse.y;
            this.cameraAngle -= dx * 0.007;
            this.cameraPitch = Math.max(0.12, Math.min(1.05, this.cameraPitch + dy * 0.005));
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });

        window.addEventListener('mouseup', () => { this.mouse.isDown = false; });

        window.addEventListener('wheel', e => {
            if (this.isAnyModalOpen()) return;
            this.cameraDist = Math.max(5.5, Math.min(18, this.cameraDist + e.deltaY * 0.01));
        });

        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        const videoInput = document.getElementById('local-video-input');
        if (videoInput) {
            videoInput.addEventListener('change', e => {
                const file = e.target.files[0];
                if (file) {
                    const url = URL.createObjectURL(file);
                    const video = document.getElementById('reveal-video');
                    video.src = url;
                    video.play();
                }
            });
        }
    }

    isAnyModalOpen() {
        return document.querySelectorAll('.modal-backdrop.active').length > 0;
    }

    closeAllModals() {
        document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('active'));
    }

    closeVideoModal() {
        const video = document.getElementById('reveal-video');
        if (video) video.pause();
        document.getElementById('video-modal').classList.remove('active');
    }

    showToast(text) {
        const toast = document.getElementById('toast-message');
        toast.innerText = text;
        toast.classList.add('show');
        clearTimeout(this.toastTimeout);
        this.toastTimeout = setTimeout(() => toast.classList.remove('show'), 4500);
    }

    triggerInteraction() {
        if (!this.activeInteractable) return;
        const item = this.activeInteractable;

        if (item.type === 'flower_altar') {
            if (this.puzzles.puzzle1Solved) {
                this.teleportToWorld(1);
            } else {
                this.puzzles.renderFlowerGrid();
                document.getElementById('flower-puzzle-modal').classList.add('active');
            }
        } else if (item.type === 'tablet_w1') {
            const data = PERSONAL_CONFIG.world1.tablets[item.index];
            document.getElementById('tablet-title').innerText = data.title;
            document.getElementById('tablet-text').innerText = data.text;
            document.getElementById('tablet-modal').classList.add('active');
        } else if (item.type === 'obelisk_w2') {
            const data = PERSONAL_CONFIG.world2.obelisks[item.index];
            document.getElementById('tablet-title').innerText = data.title;
            document.getElementById('tablet-text').innerText = data.text;
            document.getElementById('tablet-modal').classList.add('active');
        } else if (item.type === 'flagpole_w2') {
            if (this.puzzles.puzzle2Solved) {
                this.teleportToWorld(2);
            }
        } else if (item.type === 'quiz_altar') {
            if (!this.puzzles.puzzle3Solved) {
                document.getElementById('quiz-modal').classList.add('active');
            } else {
                this.showToast("Das Siegel ist bereits geöffnet! Geh zur goldenen Schatztruhe.");
            }
        } else if (item.type === 'treasure_chest') {
            if (!this.puzzles.puzzle3Solved) return;
            this.openTreasureChestSequence();
        }
    }

    openTreasureChestSequence() {
        this.puzzles.chestOpened = true;
        this.sound.chestFanfare();

        let openProgress = 0;
        const openInterval = setInterval(() => {
            openProgress += 0.08;
            this.worldBuilder.chestLidPivot.rotation.x = -Math.min(1.9, openProgress);
            if (openProgress >= 1.9) {
                clearInterval(openInterval);
                setTimeout(() => {
                    document.getElementById('video-modal').classList.add('active');
                    const video = document.getElementById('reveal-video');
                    video.play().catch(() => {});
                }, 450);
            }
        }, 25);
    }

    teleportToWorld(targetIdx) {
        this.closeAllModals();
        this.sound.teleport();

        const fade = document.getElementById('fade-overlay');
        fade.classList.add('active');

        setTimeout(() => {
            this.worldBuilder.worlds[this.currentWorld].visible = false;
            this.currentWorld = targetIdx;
            this.worldBuilder.worlds[this.currentWorld].visible = true;

            if (targetIdx === 0) {
                this.llama.pos.set(0, 0, 6);
            } else if (targetIdx === 1) {
                this.llama.pos.set(0, 0, 5.5);
                this.puzzles.resetBridge();
            } else if (targetIdx === 2) {
                this.llama.pos.set(0, 0, 7);
            }

            this.llama.group.rotation.y = Math.PI;
            this.cameraAngle = 0;
            this.cameraPitch = 0.36;
            this.updateHUD();

            setTimeout(() => fade.classList.remove('active'), 250);
        }, 600);
    }

    updateHUD() {
        const cfg = [PERSONAL_CONFIG.world1, PERSONAL_CONFIG.world2, PERSONAL_CONFIG.world3][this.currentWorld];
        document.getElementById('world-badge').innerText = cfg.badge;
        document.getElementById('world-title').innerText = cfg.title;
        if (this.currentWorld === 0 && this.puzzles.puzzle1Solved) {
            document.getElementById('world-objective').innerText = cfg.hologramObjective;
        } else if (this.currentWorld === 1 && this.puzzles.puzzle2Solved) {
            document.getElementById('world-objective').innerText = cfg.flagObjective;
        } else {
            document.getElementById('world-objective').innerText = cfg.objective;
        }
    }

    openChestDirectly() {
        this.puzzles.puzzle3Solved = true;
        this.worldBuilder.chestGroup.visible = true;
        this.teleportToWorld(2);
        setTimeout(() => {
            this.llama.pos.set(0, 0, -9.5);
            this.openTreasureChestSequence();
        }, 900);
    }

    solveCurrentPuzzle() {
        if (this.currentWorld === 0) {
            this.puzzles.completeFlowerPuzzle();
            this.puzzles.revealHologramInWorld();
        } else if (this.currentWorld === 1) {
            this.llama.pos.set(0, 0, -18.5);
            this.cameraAngle = 0;
            this.cameraPitch = 0.2;
            this.puzzles.completeBridgePuzzle();
        } else if (this.currentWorld === 2) {
            this.openChestDirectly();
        }
    }

    update() {
        const elapsed = this.clock.getElapsedTime();
        this.worldBuilder.updateEnvironment(elapsed);

        if (!this.isAnyModalOpen()) {
            let moveX = 0, moveZ = 0;
            if (this.keys.w) moveZ -= 1;
            if (this.keys.s) moveZ += 1;
            if (this.keys.a) moveX -= 1;
            if (this.keys.d) moveX += 1;

            const isMoving = (moveX !== 0 || moveZ !== 0);
            if (isMoving) {
                const moveAngle = Math.atan2(moveX, moveZ) + this.cameraAngle;
                this.llama.pos.x += Math.sin(moveAngle) * this.llama.speed;
                this.llama.pos.z += Math.cos(moveAngle) * this.llama.speed;

                let diff = moveAngle - this.llama.group.rotation.y;
                while (diff < -Math.PI) diff += Math.PI * 2;
                while (diff > Math.PI) diff -= Math.PI * 2;
                this.llama.group.rotation.y += diff * 0.14;
            }

            this.llama.velY -= 0.012;
            this.llama.pos.y += this.llama.velY;
            if (this.llama.pos.y <= 0) {
                this.llama.pos.y = 0;
                this.llama.velY = 0;
                this.llama.isGrounded = true;
            }

            this.llama.updateAnimation(isMoving, elapsed);
        }

        if (this.currentWorld === 1) {
            this.puzzles.checkSteppingStones(this.llama.pos);
        }

        this.activeInteractable = null;
        const list = this.worldBuilder.interactables[this.currentWorld] || [];
        for (const item of list) {
            if (item.type === 'treasure_chest' && !this.puzzles.puzzle3Solved) continue;
            if (item.type === 'flagpole_w2' && !this.puzzles.puzzle2Solved) continue;
            if (this.llama.pos.distanceTo(item.pos) < item.radius) {
                this.activeInteractable = item;
                break;
            }
        }

        const promptEl = document.getElementById('interaction-prompt');
        if (this.activeInteractable && !this.isAnyModalOpen()) {
            document.getElementById('prompt-text').innerText = this.activeInteractable.label;
            promptEl.style.display = 'flex';
        } else {
            promptEl.style.display = 'none';
        }

        const camX = this.llama.pos.x + Math.sin(this.cameraAngle) * Math.cos(this.cameraPitch) * this.cameraDist;
        const camZ = this.llama.pos.z + Math.cos(this.cameraAngle) * Math.cos(this.cameraPitch) * this.cameraDist;
        const camY = this.llama.pos.y + Math.sin(this.cameraPitch) * this.cameraDist + 1.2;

        // Kamera-Blickhöhe automatisch leicht anheben, wenn Hologramm (Welt 1) oder Flagge (Welt 2) aktiv ist
        let lookAtY = this.llama.pos.y + 1.6;
        if (this.currentWorld === 0 && this.puzzles.puzzle1Solved) {
            lookAtY = this.llama.pos.y + 2.4;
        } else if (this.currentWorld === 1 && this.puzzles.puzzle2Solved) {
            lookAtY = this.llama.pos.y + 2.8;
        }

        this.camera.position.lerp(new THREE.Vector3(camX, camY, camZ), 0.1);
        this.camera.lookAt(this.llama.pos.x, lookAtY, this.llama.pos.z);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.update();
        this.renderer.render(this.scene, this.camera);
    }
}

let game;
window.addEventListener('DOMContentLoaded', () => {
    game = new AnniversaryGame();
});
