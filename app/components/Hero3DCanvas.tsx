"use client";

import React, { useEffect, useRef, useState } from "react";

export function Hero3DCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 850);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement?.clientHeight || 850;
    };

    window.addEventListener("resize", handleResize);

    // Mouse Tracking for Smooth 3D Parallax & Physics Tilt
    let mouseX = width / 2;
    let mouseY = height / 2;
    let targetMouseX = width / 2;
    let targetMouseY = height / 2;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      targetMouseX = e.clientX - rect.left;
      targetMouseY = e.clientY - rect.top;
    };

    window.addEventListener("mousemove", handleMouseMove);

    // 3D Particles in deep perspective space
    const particleCount = 140;
    const particles: Array<{
      x: number;
      y: number;
      z: number;
      size: number;
      color: string;
      vx: number;
      vy: number;
      vz: number;
      alpha: number;
      baseAlpha: number;
    }> = [];

    const palette = ["#00f2fe", "#4facfe", "#38bdf8", "#6366f1", "#818cf8", "#34d399"];

    for (let i = 0; i < particleCount; i++) {
      const alpha = Math.random() * 0.7 + 0.3;
      particles.push({
        x: (Math.random() - 0.5) * width * 1.8,
        y: (Math.random() - 0.5) * height * 1.8,
        z: Math.random() * 900 + 50,
        size: Math.random() * 2.2 + 0.8,
        color: palette[Math.floor(Math.random() * palette.length)],
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        vz: (Math.random() - 0.5) * 0.8,
        alpha,
        baseAlpha: alpha,
      });
    }

    // 3D Orbital Enterprise Nodes (Finance, HR, CRM, Security, Ledger, Cloud)
    const orbitalNodes = [
      { name: "Ledgers", angle: 0, radius: 240, speed: 0.008, color: "#00f2fe", yOffset: -20 },
      { name: "Payroll", angle: (Math.PI * 2) / 5, radius: 210, speed: 0.007, color: "#38bdf8", yOffset: 30 },
      { name: "Attendance", angle: (Math.PI * 4) / 5, radius: 250, speed: 0.009, color: "#34d399", yOffset: -35 },
      { name: "CRM Pipeline", angle: (Math.PI * 6) / 5, radius: 220, speed: 0.0065, color: "#818cf8", yOffset: 15 },
      { name: "AES-256 Vault", angle: (Math.PI * 8) / 5, radius: 230, speed: 0.0085, color: "#f43f5e", yOffset: -10 },
    ];

    // 3D Polyhedral Wireframe Core (Icosahedron-inspired Geometry)
    const phi = (1 + Math.sqrt(5)) / 2;
    const rawVertices: Array<[number, number, number]> = [
      [-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0],
      [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi],
      [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1]
    ];

    // Edges between vertices
    const edges: Array<[number, number]> = [];
    for (let i = 0; i < rawVertices.length; i++) {
      for (let j = i + 1; j < rawVertices.length; j++) {
        const dx = rawVertices[i][0] - rawVertices[j][0];
        const dy = rawVertices[i][1] - rawVertices[j][1];
        const dz = rawVertices[i][2] - rawVertices[j][2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (Math.abs(dist - 2) < 0.1) {
          edges.push([i, j]);
        }
      }
    }

    let rotX = 0;
    let rotY = 0;
    let rotZ = 0;
    let time = 0;

    const fov = 500;

    const project3D = (x: number, y: number, z: number, cx: number, cy: number) => {
      const scale = fov / (fov + z);
      return {
        x: cx + x * scale,
        y: cy + y * scale,
        scale,
        visible: z > -fov + 10,
      };
    };

    const render = () => {
      time += 0.012;

      // Smooth mouse easing with spring inertia
      mouseX += (targetMouseX - mouseX) * 0.04;
      mouseY += (targetMouseY - mouseY) * 0.04;

      const normMouseX = (mouseX / width - 0.5) * 2; // -1 to 1
      const normMouseY = (mouseY / height - 0.5) * 2; // -1 to 1

      // Core rotations influenced by time and mouse parallax
      rotX = time * 0.35 + normMouseY * 0.4;
      rotY = time * 0.5 + normMouseX * 0.6;
      rotZ = time * 0.2;

      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height * 0.38; // Centered behind the Hero title and stage

      // 1. Dynamic Center Glow Aura
      const auraGrad = ctx.createRadialGradient(
        centerX + normMouseX * 40,
        centerY + normMouseY * 30,
        20,
        centerX,
        centerY,
        width * 0.6
      );
      auraGrad.addColorStop(0, "rgba(0, 242, 254, 0.12)");
      auraGrad.addColorStop(0.3, "rgba(79, 172, 254, 0.06)");
      auraGrad.addColorStop(0.7, "rgba(99, 102, 241, 0.02)");
      auraGrad.addColorStop(1, "transparent");

      ctx.fillStyle = auraGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. 3D Perspective Particles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;

        if (p.z > 900) p.z = 50;
        if (p.z < 50) p.z = 900;
        if (p.x > width * 0.9) p.x = -width * 0.9;
        if (p.x < -width * 0.9) p.x = width * 0.9;
        if (p.y > height * 0.9) p.y = -height * 0.9;
        if (p.y < -height * 0.9) p.y = height * 0.9;

        // Apply mouse tilt offset
        const px = p.x + normMouseX * (1000 - p.z) * 0.08;
        const py = p.y + normMouseY * (1000 - p.z) * 0.08;

        const proj = project3D(px, py, p.z, centerX, centerY);
        if (proj.visible) {
          const depthAlpha = Math.max(0.1, (1 - p.z / 950) * p.alpha);
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, Math.max(0.5, p.size * proj.scale), 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = depthAlpha;
          ctx.shadowBlur = 10 * proj.scale;
          ctx.shadowColor = p.color;
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.globalAlpha = 1;
        }
      });

      // 3. Render 3D Rotating Polyhedral Core
      const coreScale = Math.min(width, height) * 0.16; // Adaptive scale

      // Rotate vertices in 3D
      const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
      const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
      const cosZ = Math.cos(rotZ), sinZ = Math.sin(rotZ);

      const transformedVertices = rawVertices.map(([vx, vy, vz]) => {
        // Scale
        let x = vx * coreScale;
        let y = vy * coreScale;
        let z = vz * coreScale;

        // Rotate Y
        let x1 = x * cosY + z * sinY;
        let z1 = -x * sinY + z * cosY;

        // Rotate X
        let y2 = y * cosX - z1 * sinX;
        let z2 = y * sinX + z1 * cosX;

        // Rotate Z
        let x3 = x1 * cosZ - y2 * sinZ;
        let y3 = x1 * sinZ + y2 * cosZ;

        return {
          origZ: z2,
          proj: project3D(x3, y3, z2, centerX, centerY),
        };
      });

      // Draw Edges with Glowing Holographic Gradient
      ctx.lineWidth = 1.6;
      edges.forEach(([i, j]) => {
        const v1 = transformedVertices[i];
        const v2 = transformedVertices[j];

        if (v1.proj.visible && v2.proj.visible) {
          const avgZ = (v1.origZ + v2.origZ) / 2;
          const edgeAlpha = Math.max(0.08, Math.min(0.65, (avgZ + coreScale * 2) / (coreScale * 4)));

          const edgeGrad = ctx.createLinearGradient(v1.proj.x, v1.proj.y, v2.proj.x, v2.proj.y);
          edgeGrad.addColorStop(0, `rgba(0, 242, 254, ${edgeAlpha * 0.9})`);
          edgeGrad.addColorStop(0.5, `rgba(79, 172, 254, ${edgeAlpha * 1.1})`);
          edgeGrad.addColorStop(1, `rgba(99, 102, 241, ${edgeAlpha * 0.8})`);

          ctx.beginPath();
          ctx.moveTo(v1.proj.x, v1.proj.y);
          ctx.lineTo(v2.proj.x, v2.proj.y);
          ctx.strokeStyle = edgeGrad;
          ctx.stroke();
        }
      });

      // Draw Vertex Nodes
      transformedVertices.forEach(({ origZ, proj }) => {
        if (proj.visible) {
          const nodeAlpha = Math.max(0.2, (origZ + coreScale * 2) / (coreScale * 3.5));
          const nodeSize = Math.max(2, 3.8 * proj.scale);

          ctx.beginPath();
          ctx.arc(proj.x, proj.y, nodeSize, 0, Math.PI * 2);
          ctx.fillStyle = "#ffffff";
          ctx.globalAlpha = Math.min(1, nodeAlpha);
          ctx.shadowBlur = 12;
          ctx.shadowColor = "#00f2fe";
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.globalAlpha = 1;
        }
      });

      // 4. Render 3D Orbital Enterprise Nodes & Beams
      orbitalNodes.forEach((node) => {
        node.angle += node.speed;

        // 3D elliptical orbit with tilt
        const orbitRadiusX = node.radius * (width < 768 ? 0.7 : 1);
        const orbitRadiusZ = node.radius * 0.65;

        const ox = Math.cos(node.angle) * orbitRadiusX;
        const oz = Math.sin(node.angle) * orbitRadiusZ;
        const oy = Math.sin(node.angle * 2) * 25 + node.yOffset;

        // Rotate orbit in sync with parallax tilt
        const tiltedX = ox * cosY + oz * sinY;
        const tiltedZ = -ox * sinY + oz * cosY;
        const tiltedY = oy * cosX - tiltedZ * sinX;

        const proj = project3D(tiltedX, tiltedY, tiltedZ, centerX, centerY);

        if (proj.visible) {
          const nodeAlpha = Math.max(0.25, Math.min(0.95, (tiltedZ + 300) / 600));

          // Connecting light stream beam to center core
          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.lineTo(proj.x, proj.y);
          ctx.strokeStyle = `rgba(0, 242, 254, ${nodeAlpha * 0.25})`;
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 6]);
          ctx.stroke();
          ctx.setLineDash([]);

          // Orbiting Sphere Body
          const radius = Math.max(3.5, 6.5 * proj.scale);
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, radius, 0, Math.PI * 2);
          ctx.fillStyle = node.color;
          ctx.globalAlpha = nodeAlpha;
          ctx.shadowBlur = 16;
          ctx.shadowColor = node.color;
          ctx.fill();
          ctx.shadowBlur = 0;

          // Glowing white core center
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, radius * 0.45, 0, Math.PI * 2);
          ctx.fillStyle = "#ffffff";
          ctx.fill();
          ctx.globalAlpha = 1;

          // Subtle floating text label for orbital node
          if (proj.scale > 0.85) {
            ctx.font = `600 ${Math.max(9, Math.round(11 * proj.scale))}px var(--font-inter), system-ui, sans-serif`;
            ctx.fillStyle = `rgba(226, 232, 240, ${nodeAlpha * 0.85})`;
            ctx.textAlign = "center";
            ctx.fillText(node.name, proj.x, proj.y + radius + 12);
          }
        }
      });

      // 5. Ambient 3D Rings / Orbit Paths
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, 230 * (width < 768 ? 0.7 : 1), 75, rotY * 0.1, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(0, 242, 254, 0.08)";
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(centerX, centerY, 270 * (width < 768 ? 0.7 : 1), 90, -rotY * 0.15, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(99, 102, 241, 0.06)";
      ctx.lineWidth = 1;
      ctx.stroke();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 1,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          filter: "contrast(1.05)",
        }}
      />
    </div>
  );
}
