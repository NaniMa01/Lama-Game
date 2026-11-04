/**
 * ============================================================================
 * LLAMA PLAYER – MODELLIERUNG, SATTELDECKE & BEWEGUNGS-ANIMATIONEN
 * ============================================================================
 */

class LlamaPlayer {
    constructor(scene) {
        this.group = new THREE.Group();
        this.pos = this.group.position;
        this.velY = 0;
        this.speed = 0.11;
        this.isGrounded = true;

        this.buildModel();
        scene.add(this.group);
    }

    buildModel() {
        const woolPBR = TextureFactory.createPBRSet('wool', 3, 3);
        const saddleTex = TextureFactory.createSaddleTexture();

        const woolMat = new THREE.MeshStandardMaterial({
            map: woolPBR.map,
            bumpMap: woolPBR.bumpMap,
            bumpScale: 0.04,
            roughness: 0.88
        });

        const faceMat = new THREE.MeshStandardMaterial({
            color: 0xd7c0a3,
            roughness: 0.65
        });

        const darkMat = new THREE.MeshStandardMaterial({
            color: 0x241a29,
            roughness: 0.25
        });

        const saddleMat = new THREE.MeshStandardMaterial({
            map: saddleTex,
            roughness: 0.55
        });

        const goldMat = new THREE.MeshStandardMaterial({
            color: 0xffd54f,
            metalness: 0.8,
            roughness: 0.25
        });

        // Torso
        this.torso = new THREE.Group();
        const mainBody = new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.05, 1.95), woolMat);
        mainBody.position.y = 1.35;
        mainBody.castShadow = true;
        mainBody.receiveShadow = true;
        this.torso.add(mainBody);

        // Brust & flauschiger Schwanz
        const chest = new THREE.Mesh(new THREE.SphereGeometry(0.62, 16, 16), woolMat);
        chest.position.set(0, 1.42, 0.78);
        chest.castShadow = true;
        this.torso.add(chest);

        const tail = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 12), woolMat);
        tail.position.set(0, 1.65, -1.02);
        this.torso.add(tail);

        // Boho-Satteldecke + goldene Quasten
        const blanket = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.55, 1.18), saddleMat);
        blanket.position.set(0, 1.64, -0.05);
        blanket.castShadow = true;
        this.torso.add(blanket);

        [-0.64, 0.64].forEach(xSide => {
            for (let z = -0.4; z <= 0.4; z += 0.4) {
                const tassel = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.2, 8), goldMat);
                tassel.position.set(xSide, 1.32, z);
                this.torso.add(tassel);
            }
        });

        // Langer Hals & Kopf-Gruppe
        this.neckGroup = new THREE.Group();
        this.neckGroup.position.set(0, 1.75, 0.78);

        const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.42, 1.35, 16), woolMat);
        neck.position.set(0, 0.55, 0.15);
        neck.rotation.x = 0.22;
        neck.castShadow = true;
        this.neckGroup.add(neck);

        const head = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.62, 0.78), woolMat);
        head.position.set(0, 1.25, 0.32);
        head.castShadow = true;
        this.neckGroup.add(head);

        const snout = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.36, 0.52), faceMat);
        snout.position.set(0, 1.15, 0.78);
        this.neckGroup.add(snout);

        const nose = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.08), darkMat);
        nose.position.set(0, 1.22, 1.05);
        this.neckGroup.add(nose);

        // Kulleraugen mit Glanzpunkt
        [-0.26, 0.26].forEach(xEye => {
            const eye = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12), darkMat);
            eye.position.set(xEye, 1.32, 0.66);
            this.neckGroup.add(eye);
        });

        // Lange Lama-Ohren
        this.ears = [];
        [-0.22, 0.22].forEach((xEar, i) => {
            const ear = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.52, 10), woolMat);
            ear.position.set(xEar, 1.72, 0.22);
            ear.rotation.z = i === 0 ? 0.22 : -0.22;
            this.neckGroup.add(ear);
            this.ears.push(ear);
        });

        this.torso.add(this.neckGroup);
        this.group.add(this.torso);

        // Vier Beine mit Hufen
        this.legs = [];
        const legCoords = [
            [-0.36, 0.85, 0.68],
            [0.36, 0.85, 0.68],
            [-0.36, 0.85, -0.68],
            [0.36, 0.85, -0.68]
        ];

        legCoords.forEach(([lx, ly, lz]) => {
            const legPivot = new THREE.Group();
            legPivot.position.set(lx, ly, lz);

            const legMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.12, 0.9, 12), woolMat);
            legMesh.position.y = -0.42;
            legMesh.castShadow = true;
            legPivot.add(legMesh);

            const hoof = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.16, 12), darkMat);
            hoof.position.y = -0.82;
            legPivot.add(hoof);

            this.group.add(legPivot);
            this.legs.push(legPivot);
        });
    }

    updateAnimation(isMoving, time) {
        if (isMoving) {
            const walkCycle = time * 11;
            this.legs[0].rotation.x = Math.sin(walkCycle) * 0.55;
            this.legs[1].rotation.x = -Math.sin(walkCycle) * 0.55;
            this.legs[2].rotation.x = -Math.sin(walkCycle) * 0.55;
            this.legs[3].rotation.x = Math.sin(walkCycle) * 0.55;

            this.torso.position.y = Math.abs(Math.sin(walkCycle * 2)) * 0.08;
            this.neckGroup.rotation.x = Math.sin(walkCycle * 2) * 0.07;
        } else {
            this.legs.forEach(leg => {
                leg.rotation.x *= 0.82;
            });
            // Sanfte Idle-Atmung
            this.torso.position.y = Math.sin(time * 2.5) * 0.03;
            this.neckGroup.rotation.x = Math.sin(time * 1.8) * 0.03;
        }

        // Ohren wackeln leicht
        this.ears[0].rotation.z = 0.22 + Math.sin(time * 3) * 0.06;
        this.ears[1].rotation.z = -0.22 - Math.sin(time * 3) * 0.06;
    }
}
