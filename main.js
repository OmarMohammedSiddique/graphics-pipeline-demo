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
let mouseX = width / 2;
let mouseY = height / 2;
let isGrabbing = false;

window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

window.addEventListener('mousedown', () => {
    isGrabbing = true;
});

window.addEventListener('mouseup', () => {
    isGrabbing = false;
});

// --- DATA DEFINITION ---
// Properties of our 4 Robotic Arms
const arms = [
    { baseXOffset: 0, baseYOffset: 0, colorBase: '#FF0055', colorJoint: '#00FFFF', colorArm: '#FFFFFF' }, // Top Left
    { baseXOffset: 1, baseYOffset: 0, colorBase: '#00FFFF', colorJoint: '#FF0055', colorArm: '#FFFFFF' }, // Top Right
    { baseXOffset: 0, baseYOffset: 1, colorBase: '#FFD700', colorJoint: '#FF00FF', colorArm: '#FFFFFF' }, // Bottom Left
    { baseXOffset: 1, baseYOffset: 1, colorBase: '#00FF00', colorJoint: '#FF8700', colorArm: '#FFFFFF' }  // Bottom Right
].map(config => ({
    ...config,
    length1: 300,
    length2: 250,
    angle1: 0,
    angle2: 0,
    x: 0, y: 0
}));

// Main Graphics Loop
function gameLoop() {
    // Clear screen for the next frame
    ctx.clearRect(0, 0, width, height);

    // Style properties
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowBlur = 15;

    // Process each arm
    arms.forEach(arm => {
        // 1. ==============================================================
        // APPLICATION STAGE
        // ==============================================================
        // Update arm base positions to stick to the corners (even on resize)
        arm.x = arm.baseXOffset * width;
        arm.y = arm.baseYOffset * height;

        // Calculate distance from base to mouse target
        let targetX = mouseX - arm.x;
        let targetY = mouseY - arm.y;
        let distanceSq = targetX * targetX + targetY * targetY;
        let distance = Math.sqrt(distanceSq);

        // Constrain the target to the maximum reach of the arm
        const maxReach = arm.length1 + arm.length2;
        if (distance > maxReach) {
            targetX = (targetX / distance) * maxReach;
            targetY = (targetY / distance) * maxReach;
            distanceSq = targetX * targetX + targetY * targetY;
            distance = maxReach;
        }

        // 2. ==============================================================
        // GEOMETRY STAGE
        // ==============================================================
        // Inverse Kinematics calculation
        
        let cosAngle2 = (distanceSq - arm.length1 * arm.length1 - arm.length2 * arm.length2) / (2 * arm.length1 * arm.length2);
        cosAngle2 = Math.max(-1, Math.min(1, cosAngle2));
        arm.angle2 = Math.acos(cosAngle2);

        // Some arms should bend the other way so they don't look identical
        // We flip the bend direction for the right-side arms
        if (arm.baseXOffset === 1) {
            arm.angle2 = -arm.angle2;
        }

        const angleToTarget = Math.atan2(targetY, targetX);
        const angleOffset = Math.atan2(arm.length2 * Math.sin(arm.angle2), arm.length1 + arm.length2 * Math.cos(arm.angle2));
        arm.angle1 = angleToTarget - angleOffset;

        // Forward Kinematics to find the exact coordinates
        const jointX = arm.x + Math.cos(arm.angle1) * arm.length1;
        const jointY = arm.y + Math.sin(arm.angle1) * arm.length1;
        
        const globalAngle2 = arm.angle1 + arm.angle2;
        const endX = jointX + Math.cos(globalAngle2) * arm.length2;
        const endY = jointY + Math.sin(globalAngle2) * arm.length2;

        // Calculate Claw geometry
        const clawAngleOffset = isGrabbing ? 0.1 : 0.6; // Close claw when grabbing
        const clawLength = 40;
        
        // Left prong
        const clawLeftX = endX + Math.cos(globalAngle2 - clawAngleOffset) * clawLength;
        const clawLeftY = endY + Math.sin(globalAngle2 - clawAngleOffset) * clawLength;
        
        // Right prong
        const clawRightX = endX + Math.cos(globalAngle2 + clawAngleOffset) * clawLength;
        const clawRightY = endY + Math.sin(globalAngle2 + clawAngleOffset) * clawLength;

        // 3. ==============================================================
        // RASTERIZATION STAGE
        // ==============================================================

        // --- Draw the Arms (Lines) ---
        ctx.beginPath();
        ctx.moveTo(arm.x, arm.y);
        ctx.lineTo(jointX, jointY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = arm.colorArm;
        ctx.shadowColor = arm.colorArm;
        ctx.stroke(); 

        // --- Draw the Claw ---
        ctx.beginPath();
        ctx.moveTo(clawLeftX, clawLeftY);
        ctx.lineTo(endX, endY);
        ctx.lineTo(clawRightX, clawRightY);
        ctx.strokeStyle = arm.colorJoint; // Use joint color for claw
        ctx.stroke();

        // --- Draw the Base ---
        ctx.beginPath();
        ctx.arc(arm.x, arm.y, 40, 0, Math.PI * 2);
        ctx.fillStyle = arm.colorBase;
        ctx.shadowColor = arm.colorBase;
        ctx.fill(); 

        // --- Draw the Elbow Joint ---
        ctx.beginPath();
        ctx.arc(jointX, jointY, 18, 0, Math.PI * 2);
        ctx.fillStyle = arm.colorJoint;
        ctx.shadowColor = arm.colorJoint;
        ctx.fill(); 

        // --- Draw the Wrist Joint ---
        ctx.beginPath();
        ctx.arc(endX, endY, 12, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill(); 
    });

    // Request the next frame to keep the loop going
    requestAnimationFrame(gameLoop);
}

// Start the pipeline loop
gameLoop();
