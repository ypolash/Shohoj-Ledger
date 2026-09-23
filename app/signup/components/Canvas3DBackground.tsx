"use client";

import React, { useEffect, useRef } from "react";

interface Canvas3DBackgroundProps {
  currentStep: number;
}

export function Canvas3DBackground({ currentStep }: Canvas3DBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    // Mouse tracking for 3D parallax
    let mouseX = width / 2;
    let mouseY = height / 2;
    let targetMouseX = width / 2;
    let targetMouseY = height / 2;

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = e.clientX;
      targetMouseY = e.clientY;
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Step color schemes
    const stepColors = [
      { r: 0, g: 242, b: 254 },   // Step 1: Cyan / Electric Blue
      { r: 16, g: 185, b: 129 },  // Step 2: Emerald Green
      { r: 244, g: 63, b: 94 },   // Step 3: Rose / Coral Pink
      { r: 99, g: 102, b: 241 },  // Step 4: Indigo / Violet
    ];

    // 3D Particles
    const particleCount = 120;
    const particles: Array<{
      x: number;
      y: number;
      z: number;
      size: number;
      vx: number;
      vy: number;
      vz: number;
    }> = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: (Math.random() - 0.5) * width * 1.5,
        y: (Math.random() - 0.5) * height * 1.5,
        z: Math.random() * 800 + 100,
        size: Math.random() * 2 + 1,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        vz: (Math.random() - 0.5) * 0.5,
      });
    }

    // 3D Rotating Polyhedron (Icosahedron / Torus nodes)
    let rotX = 0;
    let rotY = 0;
    let rotZ = 0;

    // Define 3D vertices for a central geometric structure
    const polyVertices: Array<[number, number, number]> = [
      [-1, 0, 1], [1, 0, 1], [1, 0, -1], [-1, 0, -1],
      [0, 1.4, 0], [0, -1.4, 0],
      [-0.7, 0.7, 0.7], [0.7, 0.7, 0.7], [0.7, 0.7, -0.7], [-0.7, 0.7, -0.7],
      [-0.7, -0.7, 0.7], [0.7, -0.7, 0.7], [0.7, -0.7, -0.7], [-0.7, -0.7, -0.7],
    ];

    const polyScale = 140;

    let time = 0;

    const render = () => {
      time += 0.015;
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      const currentColor = stepColors[Math.min(currentStep - 1, stepColors.length - 1)];

      // Clear with dark subtle fade
      ctx.fillStyle = "#070b14";
      ctx.fillRect(0, 0, width, height);

      // Radial glowing background gradient based on active step
      const gradX = width * 0.5 + (mouseX - width * 0.5) * 0.1;
      const gradY = height * 0.4 + (mouseY - height * 0.5) * 0.1;
      const bgGrad = ctx.createRadialGradient(gradX, gradY, 20, gradX, gradY, width * 0.75);
      bgGrad.addColorStop(0, `rgba(${currentColor.r}, ${currentColor.g}, ${currentColor.b}, 0.14)`);
      bgGrad.addColorStop(0.4, `rgba(${currentColor.r}, ${currentColor.g}, ${currentColor.b}, 0.04)`);
      bgGrad.addColorStop(1, "rgba(7, 11, 20, 0)");

      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Subtle 3D Grid Floor in perspective
      const fov = 400;
      const gridZStart = 100;
      const gridZEnd = 700;
      const gridStep = 80;

      ctx.save();
      ctx.strokeStyle = `rgba(${currentColor.r}, ${currentColor.g}, ${currentColor.b}, 0.06)`;
      ctx.lineWidth = 1;

      const floorY = height * 0.65;
      const parallaxX = (mouseX - width / 2) * 0.15;
      const parallaxY = (mouseY - height / 2) * 0.1;

      // Draw grid lines
      for (let z = gridZStart; z <= gridZEnd; z += gridStep) {
        const scale = fov / (fov + z);
        const y = floorY + z * 0.4 - parallaxY;
        const xLeft = (width / 2 - width * 0.8) * scale + width / 2 - parallaxX * scale;
        const xRight = (width / 2 + width * 0.8) * scale + width / 2 - parallaxX * scale;

        ctx.beginPath();
        ctx.moveTo(xLeft, y);
        ctx.lineTo(xRight, y);
        ctx.stroke();
      }

      for (let x = -width * 0.8; x <= width * 0.8; x += gridStep * 1.5) {
        const scaleNear = fov / (fov + gridZStart);
        const scaleFar = fov / (fov + gridZEnd);
        const x1 = width / 2 + x * scaleNear - parallaxX * scaleNear;
        const y1 = floorY + gridZStart * 0.4 - parallaxY;
        const x2 = width / 2 + x * scaleFar - parallaxX * scaleFar;
        const y2 = floorY + gridZEnd * 0.4 - parallaxY;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
      ctx.restore();

      // Render 3D Rotating Central Geometric Core (Orbiting behind glass card)
      rotX = time * 0.4 + (mouseY - height / 2) * 0.0008;
      rotY = time * 0.6 + (mouseX - width / 2) * 0.0008;
      rotZ = time * 0.2;

      const centerX = width * 0.82;
      const centerY = height * 0.35;

      const projectedPoly: Array<{ x: number; y: number; z: number }> = [];

      for (const v of polyVertices) {
        let x = v[0] * polyScale;
        let y = v[1] * polyScale;
        let z = v[2] * polyScale;

        // Rotate X
        let y1 = y * Math.cos(rotX) - z * Math.sin(rotX);
        let z1 = y * Math.sin(rotX) + z * Math.cos(rotX);

        // Rotate Y
        let x2 = x * Math.cos(rotY) + z1 * Math.sin(rotY);
        let z2 = -x * Math.sin(rotY) + z1 * Math.cos(rotY);

        // Rotate Z
        let x3 = x2 * Math.cos(rotZ) - y1 * Math.sin(rotZ);
        let y3 = x2 * Math.sin(rotZ) + y1 * Math.cos(rotZ);

        const pScale = 500 / (500 + z2 + 200);
        projectedPoly.push({
          x: centerX + x3 * pScale,
          y: centerY + y3 * pScale,
          z: z2,
        });
      }

      // Draw poly lines with holographic neon glow
      ctx.save();
      ctx.lineWidth = 1.2;
      for (let i = 0; i < projectedPoly.length; i++) {
        for (let j = i + 1; j < projectedPoly.length; j++) {
          const p1 = projectedPoly[i];
          const p2 = projectedPoly[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 120) {
            const alpha = (1 - dist / 120) * 0.35;
            ctx.strokeStyle = `rgba(${currentColor.r}, ${currentColor.g}, ${currentColor.b}, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      for (const p of projectedPoly) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${currentColor.r}, ${currentColor.g}, ${currentColor.b}, 0.8)`;
        ctx.shadowColor = `rgb(${currentColor.r}, ${currentColor.g}, ${currentColor.b})`;
        ctx.shadowBlur = 10;
        ctx.fill();
      }
      ctx.restore();

      // Render Floating 3D Starfield Particles
      ctx.save();
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;

        if (p.x < -width * 0.75) p.x = width * 0.75;
        if (p.x > width * 0.75) p.x = -width * 0.75;
        if (p.y < -height * 0.75) p.y = height * 0.75;
        if (p.y > height * 0.75) p.y = -height * 0.75;
        if (p.z < 50) p.z = 800;
        if (p.z > 800) p.z = 50;

        const scale = fov / (fov + p.z);
        const px = width / 2 + p.x * scale - (mouseX - width / 2) * scale * 0.2;
        const py = height / 2 + p.y * scale - (mouseY - height / 2) * scale * 0.2;
        const pAlpha = (1 - p.z / 800) * 0.7;

        ctx.beginPath();
        ctx.arc(px, py, p.size * scale * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${currentColor.r}, ${currentColor.g}, ${currentColor.b}, ${pAlpha})`;
        ctx.shadowColor = `rgba(${currentColor.r}, ${currentColor.g}, ${currentColor.b}, ${pAlpha})`;
        ctx.shadowBlur = 6;
        ctx.fill();
      }
      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [currentStep]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}
