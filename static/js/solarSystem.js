let scene, camera, renderer, controls, selectedBody = null;
const planets = [];
const cameraOffset = new THREE.Vector3(0, 0, 200); // Adjusted camera offset
const originalCameraPosition = new THREE.Vector3(0, 500, 5000); // Increased z-position for a more zoomed-out view
const originalCameraRotation = new THREE.Euler(0, 0, 0); // Store original camera rotation

let isOrbiting = true; // Flag to track the orbiting state
let isZooming = false; // Flag to check if zooming is in progress

let stars = []; // Array to hold star points
let cometParticles = []; // Array to hold comet particles

// Define celestial bodies with updated models, sizes, distances, zoom distances, and min distances
const celestialBodies = [
    { name: 'Sun', model: 'static/models/centered_Sun.glb', distance: 0, size: 100, speed: 0, color: 0xffff00, zoomDistance: 1600, minDistance: 1500 }, // Added minDistance
    { name: 'Mercury', model: 'static/models/centered_Mercury.glb', distance: 1.05 * 1500, size: 0.35 * 2, speed: 0.02, color: 0xaaaaaa, zoomDistance: 100, minDistance: 50 },
    { name: 'Venus', model: 'static/models/centered_Venus.glb', distance: 1.96 * 1500, size: 0.87 * 2, speed: 0.015, color: 0xffffaa, zoomDistance: 200, minDistance: 80 },
    { name: 'Earth', model: 'static/models/centered_Earth.glb', distance: 2.76 * 1500, size: 0.92 * 2, speed: 0.01, color: 0x0000ff, zoomDistance: 200, minDistance: 100 },
    { name: 'Mars', model: 'static/models/centered_Mars.glb', distance: 4.18 * 1500, size: 0.49 * 2, speed: 0.008, color: 0xff0000, zoomDistance: 100, minDistance: 70 },
    { name: 'Jupiter', model: 'static/models/centered_Jupiter.glb', distance: 14.39 * 1500, size: 10.1 * 2, speed: 0.005, color: 0xffaa00, zoomDistance: 800, minDistance: 500 },
    { name: 'Saturn', model: 'static/models/centered_Saturn.glb', distance: 26.59 * 1500, size: 8.44 * 2, speed: 0.004, color: 0xffcc99, zoomDistance: 650, minDistance: 350 },
    { name: 'Uranus', model: 'static/models/centered_Uranus.glb', distance: 53.63 * 1500, size: 3.63 * 2, speed: 0.003, color: 0x00ffff, zoomDistance: 300, minDistance: 200 },
    { name: 'Neptune', model: 'static/models/centered_Neptune.glb', distance: 83.05 * 1500, size: 3.56 * 2, speed: 0.002, color: 0x0000ff, zoomDistance: 400, minDistance: 200 }
];

const celestialInfo = {
    'Sun': {
        name: 'Sun',
        description: 'Diameter: 1,392,700 km<br>Year length: 225 million Earth years<br>Facts: Contains 99.86% of the mass of the solar system<br>More information: <a href="https://science.nasa.gov/sun/" target="_blank">NASA Sun Info</a>'
    },
    'Mercury': {
        name: 'Mercury',
        description: 'Diameter: 4,880 km<br>Year length: 88 Earth days<br>Moons: None<br>Facts: Closest planet to the Sun. Mercury has no atmosphere to retain heat and as a result, the side facing the sun reaches temperatures of 430°C while the side facing away can plummet to -180°C.<br>More information: <a href="https://science.nasa.gov/mercury/" target="_blank">NASA Mercury Info</a>'
    },
    'Venus': {
        name: 'Venus',
        description: 'Diameter: 12,104 km<br>Year length: 225 Earth days<br>Moons: None<br>Facts: Sometimes called Earth’s twin due to its similar size to Earth. Venus has a thick, toxic atmosphere and is the hottest planet in the solar system.<br>More information: <a href="https://science.nasa.gov/venus/" target="_blank">NASA Venus Info</a>'
    },
    'Earth': {
        name: 'Earth',
        description: 'Diameter: 12,742 km<br>Year length: 365.25 days<br>Moons: 1<br>Facts: Only known planet to support life. Earth is in the "Goldilocks zone", where water exists in liquid form.<br>More information: <a href="https://science.nasa.gov/earth/" target="_blank">NASA Earth Info</a>'
    },
    'Mars': {
        name: 'Mars',
        description: 'Diameter: 6,779 km<br>Year length: 687 Earth days<br>Moons: 2<br>Facts: Known as the Red Planet due to rust. Mars has the largest volcano and canyon in the solar system.<br>More information: <a href="https://science.nasa.gov/mars/" target="_blank">NASA Mars Info</a>'
    },
    'Jupiter': {
        name: 'Jupiter',
        description: 'Diameter: 139,820 km<br>Year length: 11.86 Earth years<br>Moons: 79<br>Facts: Jupiter is a Gas Giant and the largest planet in the solar system. Its Great Red Spot is a storm bigger than Earth.<br>More information: <a href="https://science.nasa.gov/jupiter/" target="_blank">NASA Jupiter Info</a>'
    },
    'Saturn': {
        name: 'Saturn',
        description: 'Diameter: 116,460 km<br>Year length: 29.46 Earth years<br>Moons: 83<br>Facts: Saturn is famous for its prominent ring system. It’s the second largest planet but less massive than Jupiter.<br>More information: <a href="https://science.nasa.gov/saturn/" target="_blank">NASA Saturn Info</a>'
    },
    'Uranus': {
        name: 'Uranus',
        description: 'Diameter: 50,724 km<br>Year length: 84 Earth years<br>Moons: 27<br>Facts: Uranus has a unique sideways rotation. It’s one of the two "ice giants" along with Neptune.<br>More information: <a href="https://science.nasa.gov/uranus/" target="_blank">NASA Uranus Info</a>'
    },
    'Neptune': {
        name: 'Neptune',
        description: 'Diameter: 49,244 km<br>Year length: 165 Earth years<br>Moons: 14<br>Facts: Neptune is the farthest planet from the Sun and is not visible to the naked eye.<br>More information: <a href="https://science.nasa.gov/neptune/" target="_blank">NASA Neptune Info</a>'
    }
};

function createStars() {
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 10000; // Number of stars
    const positions = new Float32Array(starCount * 3); // x, y, z for each star

    for (let i = 0; i < starCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 400000; // Random x position (increased range)
        positions[i * 3 + 1] = (Math.random() - 0.5) * 400000; // Random y position (increased range)
        positions[i * 3 + 2] = (Math.random() - 0.5) * 400000; // Random z position (increased range)
    }

    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

    const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 1 }); // Increased size for better visibility
    const starsMesh = new THREE.Points(starGeometry, starMaterial);
    scene.add(starsMesh);
    stars.push(starsMesh);
}

function createComets() {
    const cometGeometry = new THREE.SphereGeometry(2, 8, 8); // Comet shape
    const cometMaterial = new THREE.MeshBasicMaterial({ color: 0xffcc00 });

    for (let i = 0; i < 50; i++) { // Create a few comets
        const comet = new THREE.Mesh(cometGeometry, cometMaterial);
        comet.position.set(
            (Math.random() - 0.5) * 20000,
            (Math.random() - 0.5) * 20000,
            (Math.random() - 0.5) * 20000
        );
        comet.direction = new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize();
        comet.speed = Math.random() * 2 + 1; // Random speed
        cometParticles.push(comet);
        scene.add(comet);
    }
}

function animateComets() {
    cometParticles.forEach(comet => {
        comet.position.add(comet.direction.clone().multiplyScalar(comet.speed));

        // Reset comet position if it goes too far
        if (comet.position.length() > 20000) {
            comet.position.set(
                (Math.random() - 0.5) * 20000,
                (Math.random() - 0.5) * 20000,
                (Math.random() - 0.5) * 20000
            );
            comet.direction.set(Math.random(), Math.random(), Math.random()).normalize(); // New direction
        }
    });
}

function init() {
    // Scene setup
    scene = new THREE.Scene();

    // Add ambient light for overall illumination
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5); // Soft white light
    scene.add(ambientLight);

    // Add point light for the Sun
    const sunLight = new THREE.PointLight(0x404040, 3, 150000); // Brighter white light with a larger range
    sunLight.position.set(0, 0, 0); // Position it at the Sun's location
    scene.add(sunLight); // Add the light to the scene

    // Camera setup
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000000); // Set the far plane to 1000000 for even more distant stars
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
    controls.minDistance = 1500; // Default minDistance, will be updated per body
    controls.maxDistance = 100000; // Increased maximum zoom distance for wider view

    // Load celestial bodies
    const loader = new THREE.GLTFLoader();

    // Handle the Apply Speed button click event
    document.getElementById("applySpeedButton").addEventListener("click", () => {
        const multiplier = parseFloat(document.getElementById("speedMultiplier").value);

        if (!isNaN(multiplier) && multiplier > 0) {
            planets.forEach(planet => {
                planet.speed = planet.originalSpeed * multiplier; // Multiply the original speed by the input value
            });
        }
    });

    // Handle the Reset Speed button click event
    document.getElementById("resetSpeedButton").addEventListener("click", () => {
        planets.forEach(planet => {
            planet.speed = planet.originalSpeed; // Reset the speed to the original value
        });

        // Optionally reset the speed multiplier input to 1
        document.getElementById("speedMultiplier").value = 1;
    });

    celestialBodies.forEach((body) => {
        // Load the model
        loader.load(body.model, (gltf) => {
            const bodyMesh = gltf.scene; // The loaded model
            bodyMesh.scale.set(body.size, body.size, body.size); // Set the size according to the accurate scaling
            bodyMesh.position.x = body.distance; // Set initial position

            // Check if the body is the Sun to apply specific material settings
            if (body.name === 'Sun') {
                bodyMesh.traverse((child) => {
                    if (child.isMesh) {
                        child.material = new THREE.MeshBasicMaterial({
                            color: 0xfdb813, // A yellowish-white color for the Sun
                            emissive: 0x404040, // Light emitted by the Sun (bright yellow)
                            emissiveIntensity: 1.5, // Adjust the intensity to make it more realistic
                        });
                    }
                });
            }

            if (body.name === 'Earth') {
                // Load the moon model
                loader.load('static/models/centered_Moon.glb', (moonGltf) => {
                    const moonMesh = moonGltf.scene;
                    moonMesh.scale.set(0.27 * 2, 0.27 * 2, 0.27 * 2); // Set the moon size
                    moonMesh.position.set(0, 0, 0); // Start position at the center of Earth
                    const moonPlanet = {
                        name: 'Moon',
                        mesh: moonMesh,
                        speed: 0.02,
                        angle: 0,
                        distance: 100,
                        parent: bodyMesh,
                        zoomDistance: 120, // Set zoom distance for the Moon
                        minDistance: 100 // Set minimum zoom distance for the Moon
                    };
                    planets.push(moonPlanet); // Store reference to the Moon
                    bodyMesh.add(moonMesh); // Add the moon mesh to the Earth

                    // Now, add the Moon to the dropdown menu
                    const moonOption = document.createElement("option");
                    moonOption.value = moonPlanet.name;
                    moonOption.text = moonPlanet.name;
                    bodySelect.appendChild(moonOption);
                });
            }

            planets.push({ name: body.name,
                           mesh: bodyMesh,
                           speed: body.speed,
                           originalSpeed: body.speed, // Store the original speed for later use
                           distance: body.distance,
                           angle: 0,
                           zoomDistance: body.zoomDistance,
                           minDistance: body.minDistance
                        });

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

    // Update the dropdown event to display information when a body is selected
    bodySelect.addEventListener("change", (event) => {
        const selectedName = event.target.value;

        // Find the selected celestial body
        if (selectedName === 'Moon') {
            // For the Moon, find the parent (Earth) to center on
            const earth = planets.find(planet => planet.name === 'Earth');
            selectedBody = planets.find(planet => planet.name === 'Moon') || null;

            if (selectedBody && earth) {
                // Center on Moon's position relative to Earth
                const moonPosition = earth.mesh.position.clone().add(selectedBody.mesh.position.clone().normalize().multiplyScalar(selectedBody.distance));
                controls.target.copy(moonPosition); // Set controls target to the Moon's position
                camera.position.copy(moonPosition.clone().add(cameraOffset.clone().normalize().multiplyScalar(selectedBody.zoomDistance)));
                controls.minDistance = selectedBody.minDistance; // Set the min distance for controls
            }
        } else {
            selectedBody = planets.find(planet => planet.name === selectedName) || null;

            // Update controls target to the selected body position
            if (selectedBody) {
                controls.target.copy(selectedBody.mesh.position);
                controls.minDistance = selectedBody.minDistance; // Set controls.minDistance to selected body's minDistance
                const cameraPosition = selectedBody.mesh.position.clone().add(cameraOffset.clone().normalize().multiplyScalar(selectedBody.zoomDistance));

                // Ensure the camera does not zoom in closer than minDistance
                const distanceToBody = camera.position.distanceTo(selectedBody.mesh.position);
                if (distanceToBody < controls.minDistance) {
                    // If the camera is too close, position it at minDistance
                    const direction = camera.position.clone().sub(selectedBody.mesh.position).normalize();
                    camera.position.copy(selectedBody.mesh.position.clone().add(direction.multiplyScalar(controls.minDistance)));
                } else {
                    camera.position.copy(cameraPosition);
                }
            }
        }

        isZooming = true;
        isOrbiting = false;

        // Show info in the panel
        const infoPanel = document.getElementById('infoPanel');
        const bodyName = document.getElementById('bodyName');
        const bodyDescription = document.getElementById('bodyDescription');

        // Populate the panel with selected celestial body info
        if (celestialInfo[selectedName]) {
            bodyName.innerHTML = celestialInfo[selectedName].name;
            bodyDescription.innerHTML = celestialInfo[selectedName].description;
            infoPanel.style.display = 'block'; // Show the panel
        }

        // Change button text and color
        const button = document.getElementById("toggleOrbitButton");
        button.innerText = "Start Orbiting";
        button.style.backgroundColor = "green";
    });


    // Hide the info panel when the reset button is clicked
    document.getElementById("resetButton").addEventListener("click", () => {
        selectedBody = null;
        camera.position.copy(originalCameraPosition); // Reset the camera to the original position
        controls.target.set(0, 0, 0); // Reset controls target to the origin
        controls.update();

        // Hide info panel
        const infoPanel = document.getElementById('infoPanel');
        infoPanel.style.display = 'none';

        // Reset the dropdown to the default value
        const bodySelect = document.getElementById("bodySelect");
        bodySelect.selectedIndex = 0; // Reset to the first option

        // Change button text and color
        const button = document.getElementById("toggleOrbitButton");
        button.innerText = "Stop Orbiting"; // Set the text to Stop Orbiting
        button.style.backgroundColor = "red"; // Set the button color to red

        // Start orbiting again
        isOrbiting = true; // Enable orbiting
    });

    // Handle the button click event to toggle orbiting
    document.getElementById("toggleOrbitButton").addEventListener("click", () => {
        isOrbiting = !isOrbiting;

        const button = document.getElementById("toggleOrbitButton");
        if (isOrbiting) {
            button.innerText = "Stop Orbiting";
            button.style.backgroundColor = "red";
        } else {
            button.innerText = "Start Orbiting";
            button.style.backgroundColor = "green";
        }
    });

    // Create stars and comets
    createStars();
    createComets();

    animate();
}


// Animation loop
function animate() {
    requestAnimationFrame(animate);

    // Rotate planets if orbiting is enabled
    if (isOrbiting) {
        planets.forEach(planet => {
            if (planet.speed > 0) {
                if (planet.name === 'Moon') {
                    // Moon orbiting the Earth
                    planet.angle += planet.speed; // Increase the angle for the moon's orbit
                    const x = planet.distance * Math.cos(planet.angle); // Calculate x position
                    const z = planet.distance * Math.sin(planet.angle); // Calculate z position
                    planet.mesh.position.set(x, 0, z); // Update moon position relative to Earth
                } else {
                    // Planets orbiting the Sun
                    planet.angle += planet.speed; // Increase the angle for the planet's orbit
                    const x = planet.distance * Math.cos(planet.angle); // Calculate x position
                    const z = planet.distance * Math.sin(planet.angle); // Calculate z position
                    planet.mesh.position.set(x, 0, z); // Update planet position
                    if (planet.light) planet.light.position.copy(planet.mesh.position); // Move the point light with the planet
                }
            }
        });
    }

    animateComets(); // Animate the comets

    // Update controls
    controls.update();
    renderer.render(scene, camera);
}

// Window resize handler
window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

init();
