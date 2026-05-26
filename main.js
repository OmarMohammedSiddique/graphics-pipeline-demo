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

// Object 1: 3D Icosahedron (Crystal Shape)
const phi = (1 + Math.sqrt(5)) / 2;
const icosahedronVertices = [
    [-1,  phi, 0], [ 1,  phi, 0], [-1, -phi, 0], [ 1, -phi, 0],
    [0, -1,  phi], [0,  1,  phi], [0, -1, -phi], [0,  1, -phi],
    [ phi, 0, -1], [ phi, 0,  1], [-phi, 0, -1], [-phi, 0,  1]
];
// Calculate edges based on distance (distance between neighboring vertices is exactly 2)
const icosahedronEdges = [];
for (let i = 0; i < icosahedronVertices.length; i++) {
    for (let j = i + 1; j < icosahedronVertices.length; j++) {
        const dx = icosahedronVertices[i][0] - icosahedronVertices[j][0];
        const dy = icosahedronVertices[i][1] - icosahedronVertices[j][1];
        const dz = icosahedronVertices[i][2] - icosahedronVertices[j][2];
        const distSq = dx*dx + dy*dy + dz*dz;
        // 2 squared is 4
        if (Math.abs(distSq - 4) < 0.1) {
            icosahedronEdges.push([i, j]);
        }
    }
}

// Object 2: 3D Torus (Wireframe Donut)
function createTorus(R, r, radialSegments, tubularSegments) {
    const vertices = [];
    const edges = [];
    
    // Generate vertices
    for (let i = 0; i <= radialSegments; i++) {
        for (let j = 0; j <= tubularSegments; j++) {
            const u = (i / radialSegments) * Math.PI * 2;
            const v = (j / tubularSegments) * Math.PI * 2;
            
            const x = (R + r * Math.cos(v)) * Math.cos(u);
            const y = (R + r * Math.cos(v)) * Math.sin(u);
            const z = r * Math.sin(v);
            
            vertices.push([x, y, z]);
        }
    }
    
    // Generate edges to form the wireframe grid
    for (let i = 0; i < radialSegments; i++) {
        for (let j = 0; j < tubularSegments; j++) {
            const current = i * (tubularSegments + 1) + j;
            const next = current + 1;
            const bottom = current + (tubularSegments + 1);
            
            edges.push([current, next]); // Horizontal ring
            edges.push([current, bottom]); // Vertical loop
        }
    }
    
    return { vertices, edges };
}
const torusData = createTorus(1.5, 0.6, 20, 12);

// Object instances to hold their unique transformations
const objects = [
    {
        name: 'Icosahedron',
        vertices: icosahedronVertices,
        edges: icosahedronEdges,
        scale: 60,
        xOffset: -250, // Position on screen
        yOffset: 0,
        rotationX: 0,
        rotationY: 0,
        rotationZ: 0,
        color: '#ff0055', // Neon Pink
        shadowColor: '#ff0055'
    },
    {
        name: 'Torus',
        vertices: torusData.vertices,
        edges: torusData.edges,
        scale: 65,
        xOffset: 250, // Position on screen
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
