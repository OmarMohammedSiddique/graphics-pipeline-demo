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
let mouseX = 0;
let mouseY = 0;
window.addEventListener('mousemove', (e) => {
    // Normalize mouse coordinates to range [-1, 1]
    mouseX = (e.clientX / width) * 2 - 1;
    mouseY = (e.clientY / height) * 2 - 1;
});

// --- DATA DEFINITION ---
// Defining the vertices and edges (faces) for our two objects.

// Object 1: 3D Cube
const cubeVertices = [
    [-1, -1, -1], [ 1, -1, -1], [ 1,  1, -1], [-1,  1, -1],
    [-1, -1,  1], [ 1, -1,  1], [ 1,  1,  1], [-1,  1,  1]
];
const cubeEdges = [
    [0, 1], [1, 2], [2, 3], [3, 0], // Back face
    [4, 5], [5, 6], [6, 7], [7, 4], // Front face
    [0, 4], [1, 5], [2, 6], [3, 7]  // Connecting edges
];

// Object 2: 3D Pyramid
const pyramidVertices = [
    [ 0,  1,  0], // Top apex
    [-1, -1, -1], [ 1, -1, -1], [ 1, -1,  1], [-1, -1,  1] // Base
];
const pyramidEdges = [
    [1, 2], [2, 3], [3, 4], [4, 1], // Base edges
    [0, 1], [0, 2], [0, 3], [0, 4]  // Side edges to apex
];

// Object instances to hold their unique transformations
const objects = [
    {
        name: 'Cube',
        vertices: cubeVertices,
        edges: cubeEdges,
        scale: 100,
        xOffset: -200, // Position on screen
        yOffset: 0,
        rotationX: 0,
        rotationY: 0,
        rotationZ: 0,
        color: '#ff0055', // Neon Pink
        shadowColor: '#ff0055'
    },
    {
        name: 'Pyramid',
        vertices: pyramidVertices,
        edges: pyramidEdges,
        scale: 120,
        xOffset: 200, // Position on screen
        yOffset: 0,
        rotationX: 0,
        rotationY: 0,
        rotationZ: 0,
        color: '#00ccff', // Neon Cyan
        shadowColor: '#00ccff'
    }
];

// Main Graphics Loop
function gameLoop() {
    // 1. ==============================================================
    // APPLICATION STAGE
    // ==============================================================
    // This stage handles the high-level logic, user input, physics, 
    // and updating the state of objects (like rotation angles).
    
    // Update object rotations based on a base speed + mouse position modifier
    objects.forEach(obj => {
        // Base rotation speed + interactivity
        obj.rotationX += 0.01 + (mouseY * 0.02);
        obj.rotationY += 0.01 + (mouseX * 0.02);
        obj.rotationZ += 0.005;
        
        // Add a slight floating effect (changing yOffset over time)
        obj.yOffset = Math.sin(Date.now() / 500 + obj.xOffset) * 20;
    });

    // Clear screen for the next frame
    ctx.clearRect(0, 0, width, height);

    // Process each object through the pipeline
    objects.forEach(obj => {
        // 2. ==============================================================
        // GEOMETRY STAGE
        // ==============================================================
        // This stage takes the 3D vertices, applies transformation matrices
        // (rotation and scaling), and projects the 3D coordinates onto the 
        // 2D plane (the screen).
        
        const projectedVertices = obj.vertices.map(v => {
            let x = v[0];
            let y = v[1];
            let z = v[2];

            // Rotation around X axis
            let tempY = y * Math.cos(obj.rotationX) - z * Math.sin(obj.rotationX);
            let tempZ = y * Math.sin(obj.rotationX) + z * Math.cos(obj.rotationX);
            y = tempY;
            z = tempZ;

            // Rotation around Y axis
            let tempX = x * Math.cos(obj.rotationY) + z * Math.sin(obj.rotationY);
            tempZ = -x * Math.sin(obj.rotationY) + z * Math.cos(obj.rotationY);
            x = tempX;
            z = tempZ;

            // Rotation around Z axis
            let finalX = x * Math.cos(obj.rotationZ) - y * Math.sin(obj.rotationZ);
            let finalY = x * Math.sin(obj.rotationZ) + y * Math.cos(obj.rotationZ);
            x = finalX;
            y = finalY;

            // Simple Orthographic Projection to 2D
            // (Adding depth perspective effect)
            const perspective = 3 / (3 + z); // z-distance modification
            
            // Apply scale and offsets to bring to screen coordinates
            const screenX = (x * obj.scale * perspective) + (width / 2) + obj.xOffset;
            const screenY = (y * obj.scale * perspective) + (height / 2) + obj.yOffset;

            return { x: screenX, y: screenY };
        });

        // 3. ==============================================================
        // RASTERIZATION STAGE
        // ==============================================================
        // This stage takes the 2D projected geometry (vertices/edges) and
        // converts them into actual pixels on the screen using Canvas API 
        // drawing commands (stroke, fill, styling).

        // Setup styles for rendering
        ctx.strokeStyle = obj.color;
        ctx.lineWidth = 3;
        ctx.lineJoin = 'round';
        
        // Add neon glow effect
        ctx.shadowBlur = 20;
        ctx.shadowColor = obj.shadowColor;

        // Draw the edges
        ctx.beginPath();
        obj.edges.forEach(edge => {
            const startPoint = projectedVertices[edge[0]];
            const endPoint = projectedVertices[edge[1]];

            ctx.moveTo(startPoint.x, startPoint.y);
            ctx.lineTo(endPoint.x, endPoint.y);
        });
        
        // Rasterize the lines onto the canvas
        ctx.stroke();

        // Rasterize the vertices as small glowing dots
        ctx.fillStyle = '#ffffff';
        projectedVertices.forEach(point => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
            ctx.fill(); // Rasterize dot
        });
    });

    // Request the next frame to keep the loop going
    requestAnimationFrame(gameLoop);
}

// Start the pipeline loop
gameLoop();
