// antigravity.js - Custom Boids with Amber/Orange styling and Vanta-like smooth flocking

let scene, camera, renderer;
let boids = [];
const BIRD_COUNT = 80;

// Tuned parameters for balanced "Random Float" + "Flock" feeling
const params = {
    separation: 3.5,  // Increased to keep them apart
    alignment: 0.2,   // Reduced alignment (less "marching in formation")
    cohesion: 0.1,    // Reduced cohesion (less "balling up")
    freedom: 2.0,     // High random movement factor
    predator: 80,     // Responsive repulsion
    speed: 0.05,
    maxSpeed: 0.1,
    minSpeed: 0.03
};

// Colors from Vanta snippet
const COLOR_1 = 0xd97706; // Amber
const COLOR_2 = 0x92400e; // Dark Orange

// Materials
let bodyMat1, bodyMat2, wingMat1, wingMat2;

function initMaterials() {
    // We create two sets of materials to vary the flock color
    bodyMat1 = new THREE.MeshStandardMaterial({
        color: COLOR_1,
        roughness: 0.4,
        metalness: 0.1,
        flatShading: true
    });

    wingMat1 = new THREE.MeshStandardMaterial({
        color: COLOR_1,
        roughness: 0.5,
        side: THREE.DoubleSide
    });

    bodyMat2 = new THREE.MeshStandardMaterial({
        color: COLOR_2,
        roughness: 0.4,
        metalness: 0.1,
        flatShading: true
    });

    wingMat2 = new THREE.MeshStandardMaterial({
        color: COLOR_2,
        roughness: 0.5,
        side: THREE.DoubleSide
    });
}

// Bird Geometry Helper
function createBirdGeometry(useColor2) {
    const birdGroup = new THREE.Group();

    const bMat = useColor2 ? bodyMat2 : bodyMat1;
    const wMat = useColor2 ? wingMat2 : wingMat1;

    // Body: A sleek cone pointing forward
    const bodyGeo = new THREE.ConeGeometry(0.06, 0.3, 8);
    bodyGeo.rotateX(-Math.PI / 2); // Point towards +Z

    const body = new THREE.Mesh(bodyGeo, bMat);
    birdGroup.add(body);

    // Wings
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 0);     // Shoulder
    wingShape.lineTo(0.4, 0.0); // Tip side
    wingShape.lineTo(0.1, -0.2); // Trailing edge back
    wingShape.lineTo(0, -0.1);  // Trailing edge inner

    const wingGeo = new THREE.ShapeGeometry(wingShape);
    wingGeo.rotateX(-Math.PI / 2);

    // Left Wing Container
    const leftWingPivot = new THREE.Group();
    leftWingPivot.position.set(0.02, 0.02, 0);
    const leftWing = new THREE.Mesh(wingGeo, wMat);
    leftWingPivot.add(leftWing);
    birdGroup.add(leftWingPivot);

    // Right Wing Container
    const rightWingPivot = new THREE.Group();
    rightWingPivot.position.set(-0.02, 0.02, 0);
    const rightWing = new THREE.Mesh(wingGeo, wMat);
    rightWing.scale.x = -1;
    rightWingPivot.add(rightWing);
    birdGroup.add(rightWingPivot);

    return { mesh: birdGroup, leftWingPivot, rightWingPivot };
}

class Boid {
    constructor() {
        this.position = new THREE.Vector3(
            (Math.random() - 0.5) * 25,
            (Math.random() - 0.5) * 15,
            (Math.random() - 0.5) * 10
        );
        this.velocity = new THREE.Vector3(
            (Math.random() - 0.5),
            (Math.random() - 0.5),
            (Math.random() - 0.5)
        ).normalize().multiplyScalar(params.speed);

        this.acceleration = new THREE.Vector3();

        // Randomly assign one of the two colors
        const useColor2 = Math.random() > 0.5;
        const { mesh, leftWingPivot, rightWingPivot } = createBirdGeometry(useColor2);
        this.mesh = mesh;
        this.leftWing = leftWingPivot;
        this.rightWing = rightWingPivot;

        this.phase = Math.random() * Math.PI * 2;

        scene.add(this.mesh);
    }

    update(boids, mousePos, mouseActive) {
        // 1. FLOCKING
        this.flock(boids);

        // 2. MOUSE AVOIDANCE
        if (mouseActive) {
            const repel = this.repel(mousePos);
            this.acceleration.add(repel);
        }

        // 3. BOUNDARY CONTROL (XY + Z Constraints)
        const center = new THREE.Vector3(0, 0, 0);
        const dist = this.position.distanceTo(center);

        // Soft boundary for XY (Circle)
        if (dist > 18) {
            const steer = new THREE.Vector3().subVectors(center, this.position);
            steer.normalize().multiplyScalar((dist - 18) * 0.005);
            this.acceleration.add(steer);
        }

        // Strong Z-Axis Constraint (Depth)
        // Keep them roughly on the plane so they don't get "small"
        if (Math.abs(this.position.z) > 4) {
            const steerZ = -this.position.z * 0.02; // Push back to Z=0
            this.acceleration.z += steerZ;
        }

        // 4. PHYSICS
        this.velocity.add(this.acceleration);
        const speed = this.velocity.length();

        if (speed > params.maxSpeed) {
            this.velocity.multiplyScalar(params.maxSpeed / speed);
        } else if (speed < params.minSpeed) {
            this.velocity.multiplyScalar(params.minSpeed / speed);
        }

        this.position.add(this.velocity);
        this.acceleration.set(0, 0, 0);

        // 5. ANIMATION
        this.mesh.position.copy(this.position);

        // Look ahead
        const lookTarget = this.position.clone().add(this.velocity);
        this.mesh.lookAt(lookTarget);

        // Flap wings
        const freq = 0.005 + (speed * 0.1); // Flap faster
        // Add random offset to flap so they don't sync
        const angle = Math.sin(Date.now() * freq * 1000 + this.phase) * 0.5;

        this.leftWing.rotation.z = -angle;
        this.rightWing.rotation.z = angle;
    }

    flock(boids) {
        const separation = new THREE.Vector3();
        const alignment = new THREE.Vector3();
        const cohesion = new THREE.Vector3();
        let count = 0;

        for (let i = 0; i < boids.length; i++) {
            const other = boids[i];
            if (other === this) continue;

            const distSq = this.position.distanceToSquared(other.position);

            if (distSq < 16) { // Perception radius
                count++;

                // Separation
                if (distSq < 2) {
                    const diff = new THREE.Vector3().subVectors(this.position, other.position);
                    diff.normalize().divideScalar(Math.sqrt(distSq));
                    separation.add(diff);
                }

                alignment.add(other.velocity);
                cohesion.add(other.position);
            }
        }

        if (count > 0) {
            alignment.divideScalar(count).normalize().multiplyScalar(params.maxSpeed).sub(this.velocity).multiplyScalar(0.05);
            cohesion.divideScalar(count).sub(this.position).normalize().multiplyScalar(params.maxSpeed).sub(this.velocity).multiplyScalar(0.05);
            separation.divideScalar(count).multiplyScalar(0.1);

            this.acceleration.add(separation.multiplyScalar(params.separation));
            this.acceleration.add(alignment.multiplyScalar(params.alignment));
            this.acceleration.add(cohesion.multiplyScalar(params.cohesion));
        }
    }

    repel(target) {
        const steer = new THREE.Vector3();
        const distSq = this.position.distanceToSquared(target);
        // Repulsion radius matched to earlier tuning (64) for responsiveness
        if (distSq < 64) {
            const diff = new THREE.Vector3().subVectors(this.position, target);
            diff.normalize().multiplyScalar(50 / (Math.sqrt(distSq) + 0.1));
            steer.add(diff);
        }
        return steer.multiplyScalar(params.predator * 0.002);
    }
}

// --- MAIN SETUP ---

const mousePos = new THREE.Vector3(0, 0, 0);
let mouseActive = false;

function init() {
    const canvasContainer = document.getElementById('antigravity-canvas');
    initMaterials();

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 12;

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    canvasContainer.appendChild(renderer.domElement);

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambient);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    for (let i = 0; i < BIRD_COUNT; i++) {
        boids.push(new Boid());
    }

    // Mouse Plane Projection
    const raycaster = new THREE.Raycaster();
    const mouse2D = new THREE.Vector2();
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    window.addEventListener('mousemove', (e) => {
        mouse2D.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse2D.y = -(e.clientY / window.innerHeight) * 2 + 1;
        mouseActive = true;

        raycaster.setFromCamera(mouse2D, camera);
        raycaster.ray.intersectPlane(plane, mousePos);
    });

    animate();
}

function animate() {
    requestAnimationFrame(animate);
    boids.forEach(boid => boid.update(boids, mousePos, mouseActive));
    renderer.render(scene, camera);
}

window.addEventListener('load', () => {
    if (typeof THREE !== 'undefined') {
        init();
    } else {
        console.error('THREE library not loaded');
    }
});
