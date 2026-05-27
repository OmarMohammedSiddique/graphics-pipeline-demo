const canvas = document.getElementById('graphicsCanvas');
const ctx = canvas.getContext('2d');

let width, height;
function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
}
window.addEventListener('resize', resize);
resize();

// Global states for interactivity
let reverseOrbit = false;
window.addEventListener('click', () => {
    reverseOrbit = !reverseOrbit;
});

// --- DATA DEFINITION ---
// Defining the properties for our celestial objects.
const sun = {
    name: 'Sun',
    radius: 50,
    color: '#FFCC00', // Bright Yellow/Gold
    glow: '#FFAA00'
};

const planets = [
    { name: 'Mercury', distance: 100, radius: 8, angle: Math.random() * Math.PI * 2, speed: 0.02, color: '#A8A8A8' },
    { name: 'Venus',   distance: 160, radius: 14, angle: Math.random() * Math.PI * 2, speed: 0.015, color: '#E0C097' },
    { name: 'Earth',   distance: 240, radius: 16, angle: Math.random() * Math.PI * 2, speed: 0.01, color: '#4B90FF' },
    { name: 'Mars',    distance: 320, radius: 12, angle: Math.random() * Math.PI * 2, speed: 0.008, color: '#FF5733' },
    { name: 'Jupiter', distance: 450, radius: 35, angle: Math.random() * Math.PI * 2, speed: 0.005, color: '#D4A373' }
];

// Main Graphics Loop
function gameLoop() {
    // 1. ==============================================================
    // APPLICATION STAGE
    // ==============================================================
    // This stage handles the high-level logic, user input, and 
    // updating the state of objects (like updating planetary angles).
    
    // Update planetary angles based on speed and click interaction
    planets.forEach(planet => {
        if (reverseOrbit) {
            planet.angle -= planet.speed;
        } else {
            planet.angle += planet.speed;
        }
    });

    // Clear screen for the next frame
    ctx.clearRect(0, 0, width, height);

    // Center of the screen
    const centerX = width / 2;
    const centerY = height / 2;

    // Process each planet through the pipeline
    planets.forEach(planet => {
        // 2. ==============================================================
        // GEOMETRY STAGE
        // ==============================================================
        // This stage uses trigonometry to calculate the exact X and Y 
        // coordinates of each planet based on its orbit angle and distance.
        
        // Convert polar coordinates (distance, angle) to Cartesian (x, y)
        const x = centerX + Math.cos(planet.angle) * planet.distance;
        const y = centerY + Math.sin(planet.angle) * planet.distance;

        // 3. ==============================================================
        // RASTERIZATION STAGE
        // ==============================================================
        // This stage takes the calculated coordinates and converts them 
        // into actual pixels on the screen using Canvas API drawing commands.

        // --- Draw the Orbit Path (Line) ---
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.arc(centerX, centerY, planet.distance, 0, Math.PI * 2);
        ctx.stroke(); // Rasterize the orbital ring

        // --- Draw the Planet (Filled Circle) ---
        ctx.beginPath();
        ctx.fillStyle = planet.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = planet.color;
        ctx.arc(x, y, planet.radius, 0, Math.PI * 2);
        ctx.fill(); // Rasterize the planet
        
        // Reset shadow for the path
        ctx.shadowBlur = 0;
    });

    // --- Draw the Sun ---
    // (We draw it last so it's on top of the orbital rings)
    // Geometry Stage: Sun is fixed at centerX, centerY
    // Rasterization Stage: Draw the Sun
    ctx.beginPath();
    ctx.fillStyle = sun.color;
    ctx.shadowBlur = 40;
    ctx.shadowColor = sun.glow;
    ctx.arc(centerX, centerY, sun.radius, 0, Math.PI * 2);
    ctx.fill(); // Rasterize the sun

    // Request the next frame to keep the loop going
    requestAnimationFrame(gameLoop);
}

// Start the pipeline loop
gameLoop();
