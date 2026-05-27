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
    mouseX = e.clientX;
    mouseY = e.clientY;
});

// --- DATA DEFINITION ---
// Properties of our Robotic Arm
const arm = {
    x: 0,           // Base X (will be set in loop)
    y: 0,           // Base Y (will be set in loop)
    length1: 200,   // Length of upper arm
    length2: 200,   // Length of lower arm
    angle1: 0,      // Shoulder angle
    angle2: 0,      // Elbow angle
    colorBase: '#FF0055',    // Neon Pink
    colorJoint: '#00FFFF',   // Neon Cyan
    colorArm: '#FFFFFF'      // White
};

// Main Graphics Loop
function gameLoop() {
    // 1. ==============================================================
    // APPLICATION STAGE
    // ==============================================================
    // This stage handles the high-level logic, user input, and physics.
    // We calculate Inverse Kinematics (IK) to make the arm follow the mouse.
    
    arm.x = width / 2;
    arm.y = height / 2;

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
    // Use the Law of Cosines to calculate the joint angles (Inverse Kinematics).
    
    // Calculate elbow angle (Angle2)
    // Formula: c^2 = a^2 + b^2 - 2ab * cos(C)
    let cosAngle2 = (distanceSq - arm.length1 * arm.length1 - arm.length2 * arm.length2) / (2 * arm.length1 * arm.length2);
    // Clamp to prevent NaN due to floating point inaccuracies
    cosAngle2 = Math.max(-1, Math.min(1, cosAngle2));
    arm.angle2 = Math.acos(cosAngle2);

    // Calculate shoulder angle (Angle1)
    const angleToTarget = Math.atan2(targetY, targetX);
    const angleOffset = Math.atan2(arm.length2 * Math.sin(arm.angle2), arm.length1 + arm.length2 * Math.cos(arm.angle2));
    arm.angle1 = angleToTarget - angleOffset;

    // Forward Kinematics to find the exact global (x, y) coordinates of the joints
    const jointX = arm.x + Math.cos(arm.angle1) * arm.length1;
    const jointY = arm.y + Math.sin(arm.angle1) * arm.length1;
    
    const endX = jointX + Math.cos(arm.angle1 + arm.angle2) * arm.length2;
    const endY = jointY + Math.sin(arm.angle1 + arm.angle2) * arm.length2;

    // Clear screen for the next frame
    ctx.clearRect(0, 0, width, height);

    // 3. ==============================================================
    // RASTERIZATION STAGE
    // ==============================================================
    // Convert the calculated geometric points into pixels on the canvas.

    // Style properties
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowBlur = 20;

    // --- Draw the Arms (Lines) ---
    ctx.beginPath();
    ctx.moveTo(arm.x, arm.y);
    ctx.lineTo(jointX, jointY);
    ctx.lineTo(endX, endY);
    
    ctx.strokeStyle = arm.colorArm;
    ctx.shadowColor = arm.colorArm;
    ctx.stroke(); // Rasterize the arm segments

    // --- Draw the Base (Filled Circle) ---
    ctx.beginPath();
    ctx.arc(arm.x, arm.y, 25, 0, Math.PI * 2);
    ctx.fillStyle = arm.colorBase;
    ctx.shadowColor = arm.colorBase;
    ctx.fill(); // Rasterize the base

    // --- Draw the Elbow Joint (Filled Circle) ---
    ctx.beginPath();
    ctx.arc(jointX, jointY, 15, 0, Math.PI * 2);
    ctx.fillStyle = arm.colorJoint;
    ctx.shadowColor = arm.colorJoint;
    ctx.fill(); // Rasterize the elbow

    // --- Draw the End Effector / "Hand" (Filled Circle) ---
    ctx.beginPath();
    ctx.arc(endX, endY, 15, 0, Math.PI * 2);
    ctx.fillStyle = arm.colorJoint;
    ctx.shadowColor = arm.colorJoint;
    ctx.fill(); // Rasterize the hand

    // Request the next frame to keep the loop going
    requestAnimationFrame(gameLoop);
}

// Start the pipeline loop
gameLoop();
