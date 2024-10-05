let scene, camera, renderer, controls, selectedBody = null;
const planets = [];
const cameraOffset = new THREE.Vector3(0, 0, 200); // Adjusted camera offset
const originalCameraPosition = new THREE.Vector3(0, 500, 5000); // Increased z-position for a more zoomed-out view
const originalCameraRotation = new THREE.Euler(0, 0, 0); // Store original camera rotation

let isOrbiting = true; // Flag to track the orbiting state
let isZooming = false; // Flag to check if zooming is in progress

// Define celestial bodies with updated models, sizes, and distances
const celestialBodies = [
    { name: 'Sun', model: 'static/models/centered_Sun.glb', distance: 0, size: 100, speed: 0, color: 0xffff00 },
    { name: 'Mercury', model: 'static/models/centered_Mercury.glb', distance: 1.05 * 1500, size: 0.35 * 2, speed: 0.02, color: 0xaaaaaa },
    { name: 'Venus', model: 'static/models/centered_Venus.glb', distance: 1.96 * 1500, size: 0.87 * 2, speed: 0.015, color: 0xffffaa },
    { name: 'Earth', model: 'static/models/centered_Earth.glb', distance: 2.76 * 1500, size: 0.92 * 2, speed: 0.01, color: 0x0000ff },
    { name: 'Mars', model: 'static/models/centered_Mars.glb', distance: 4.18 * 1500, size: 0.49 * 2, speed: 0.008, color: 0xff0000 },
    { name: 'Jupiter', model: 'static/models/centered_Jupiter.glb', distance: 14.39 * 1500, size: 10.1 * 2, speed: 0.005, color: 0xffaa00 },
    { name: 'Saturn', model: 'static/models/centered_Saturn.glb', distance: 26.59 * 1500, size: 8.44 * 2, speed: 0.004, color: 0xffcc99 },
    { name: 'Uranus', model: 'static/models/centered_Uranus.glb', distance: 53.63 * 1500, size: 3.63 * 2, speed: 0.003, color: 0x00ffff },
    { name: 'Neptune', model: 'static/models/centered_Neptune.glb', distance: 83.05 * 1500, size: 3.56 * 2, speed: 0.002, color: 0x0000ff }
];

function init() {
    // Scene setup
    scene = new THREE.Scene();

    // Add ambient light for overall illumination
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5); // Soft white light
    scene.add(ambientLight);

    // Add point light for the Sun
    const sunLight = new THREE.PointLight(0xe69447, 3, 150000); // Brighter white light with a larger range
    sunLight.position.set(0, 0, 0); // Position it at the Sun's location
    scene.add(sunLight); // Add the light to the scene

    // Camera setup
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100000); // Increased far plane to 100000
    camera.position.copy(originalCameraPosition); // Set to original position

    // Renderer setup
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Add OrbitControls to allow interaction
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.minDistance = 100; // Adjusted minimum zoom distance
    controls.maxDistance = 100000; // Increased maximum zoom distance for wider view

    // Load celestial bodies
    const loader = new THREE.GLTFLoader();

    celestialBodies.forEach((body) => {
        // Load the model
        loader.load(body.model, (gltf) => {
            const bodyMesh = gltf.scene; // The loaded model
            bodyMesh.scale.set(body.size, body.size, body.size); // Set the size according to the accurate scaling
            bodyMesh.position.x = body.distance; // Set initial position
            planets.push({ name: body.name, mesh: bodyMesh, speed: body.speed, distance: body.distance, angle: 0 });

            // Add orbit path if it's not the Sun
            if (body.name !== 'Sun') {
                const orbitGeometry = new THREE.RingGeometry(body.distance - 5, body.distance + 5, 64); // Updated orbit path
                const orbitMaterial = new THREE.MeshBasicMaterial({ color: 0xa8a5a2, side: THREE.DoubleSide });
                const orbitMesh = new THREE.Mesh(orbitGeometry, orbitMaterial);
                orbitMesh.rotation.x = Math.PI / 2; // Rotate to align with the x-y plane
                scene.add(orbitMesh);

                // Create a point light for the planet
                const planetLight = new THREE.PointLight(0xffffff, 2, 500); // Color and range of the light
                planetLight.position.copy(bodyMesh.position); // Set the light position to the planet's position
                planets[planets.length - 1].light = planetLight; // Store reference to the light
                scene.add(planetLight); // Add the point light to the scene
            }

            // Add the mesh to the scene
            scene.add(bodyMesh);
        });
    });

    // Sort celestial bodies by distance and update dropdown options
    const bodySelect = document.getElementById("bodySelect");
    celestialBodies.sort((a, b) => a.distance - b.distance).forEach((body) => {
        const option = document.createElement("option");
        option.value = body.name;
        option.text = body.name;
        bodySelect.appendChild(option);
    });

    // Dropdown event to select body
    bodySelect.addEventListener("change", (event) => {
        const selectedName = event.target.value;
        selectedBody = planets.find(planet => planet.name === selectedName) || null;

        // Update controls target to the selected body position
        if (selectedBody) {
            controls.target.copy(selectedBody.mesh.position); // Set control target to the selected body

            // Calculate a safe zoom distance based on the planet's size
            const safeDistance = selectedBody.mesh.scale.x * 20; // Adjust multiplier if necessary
            const minZoomPosition = selectedBody.mesh.position.clone().add(cameraOffset.clone().normalize().multiplyScalar(safeDistance));

            // Set the target position for zooming
            camera.position.copy(minZoomPosition); // Immediately move to the new position
            isZooming = true; // Set zooming flag to true

            // Stop orbiting when a body is selected
            isOrbiting = false;

            // Change button text and color
            const button = document.getElementById("toggleOrbitButton");
            button.innerText = "Start Orbiting"; // Change button text
            button.style.backgroundColor = "green"; // Change button color
        }
    });

    // Reset button event
    document.getElementById("resetButton").addEventListener("click", resetCamera);

    // Toggle orbit button event
    document.getElementById("toggleOrbitButton").addEventListener("click", toggleOrbit);

    animate();
}

function resetCamera() {
    camera.position.copy(originalCameraPosition); // Reset to original position
    camera.rotation.copy(originalCameraRotation); // Reset to original rotation
    controls.target.set(0, 0, 0); // Reset control target to the origin
    controls.update(); // Update controls

    // Deselect any selected body
    selectedBody = null; // Deselect the body when resetting
    document.getElementById("bodySelect").selectedIndex = 0; // Reset dropdown
}

function toggleOrbit() {
    if (!isOrbiting) {
        resetCamera(); // Reset camera position to default
    }

    isOrbiting = !isOrbiting; // Toggle the orbiting state
    const button = document.getElementById("toggleOrbitButton");
    button.innerText = isOrbiting ? "Stop Orbiting" : "Start Orbiting"; // Update button text
    button.style.backgroundColor = isOrbiting ? "red" : "green"; // Change button color
}

function animate() {
    requestAnimationFrame(animate);

    // Rotate planets around the sun if isOrbiting is true
    if (isOrbiting) {
        planets.forEach((planet) => {
            if (planet.speed > 0) { // Sun doesn't rotate
                planet.angle += planet.speed; // Update the angle based on speed
                // Update the position of the planet based on its angle and distance from the sun
                planet.mesh.position.x = planet.distance * Math.cos(planet.angle);
                planet.mesh.position.z = planet.distance * Math.sin(planet.angle);

                // Update the position of the associated light
                if (planet.light) {
                    planet.light.position.copy(planet.mesh.position); // Update the light position to match the planet's position
                }
            }
        });
    }

    // Check if the planets are not orbiting and a body is selected
    if (!isOrbiting && selectedBody) {
        // Allow user to control camera around the selected body
        controls.target.copy(selectedBody.mesh.position); // Keep the camera focused on the selected body
    }

    // Zoom towards the selected body if isZooming is true
    if (isZooming) {
        // Smoothly interpolate the camera position to the selected body position
        camera.position.lerp(selectedBody.mesh.position.clone().add(cameraOffset), 0.1);

        // Check if the camera has reached the target position (or is close enough)
        if (camera.position.distanceTo(selectedBody.mesh.position.clone().add(cameraOffset)) < 1) {
            isZooming = false; // Stop zooming if close enough to target
        }
    }

    // Follow the selected body if it exists and orbiting is enabled
    if (isOrbiting && selectedBody) {
        const bodyPosition = selectedBody.mesh.position;
        // Update camera position based on the selected body and retain user rotation
        camera.position.lerp(bodyPosition.clone().add(cameraOffset), 0.1); // Smoothly update camera position
    }

    // Update controls and render the scene
    controls.update();
    renderer.render(scene, camera);
}

window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Initialize the scene
init(); // Initialize the scene
