import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * ParticleMorph
 * ---------------------------------------------------------------------------
 * A field of GPU-friendly points that continuously morphs between three
 * weather silhouettes — a puffy cloud, falling rain, and a spiralling
 * tornado — looping forever. Built with plain three.js so it can be dropped
 * into any React app (Next.js, Vite, CRA...) with a single dependency:
 *
 *     npm install three
 *
 * Usage:
 *     <ParticleMorph className="w-full h-[600px]" />
 *
 * Hovering the pointer over the field gently repels nearby particles away
 * from the cursor (via a raycast onto the z=0 plane), easing back to rest
 * when the pointer leaves. Tune it with `cursorRadius` (reach of the repel
 * field) and `cursorStrength` (how far particles get pushed).
 *
 * All behaviour is controlled by the props/constants at the top of the
 * component, so you can tune particle count/size, colors, timing, shapes,
 * and cursor feel without touching the animation logic below.
 */
export default function ParticleMorph({
  className = "",
  style = {},
  particleCount = 9000,
  backgroundColor = "transparent", // modified slightly from #050505 to fit the glassmorphic theme nicely
  particleColor = "#dbe6f0", // pale blue-white, reads well for cloud/rain/dust
  particleSize = 0.05, // size of each particle point
  holdDuration = 1100, // ms each shape is held before morphing
  morphDuration = 1600, // ms a morph transition takes
  cursorRadius = 1.35, // world-space radius of the cursor's repel field
  cursorStrength = 0.5, // how far particles get pushed away from the cursor
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // ---------------------------------------------------------------------
    // Renderer / scene / camera
    // ---------------------------------------------------------------------
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 6.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.appendChild(renderer.domElement);

    // ---------------------------------------------------------------------
    // Shape generators — each returns a Float32Array of length N*3.
    // Every shape uses the SAME particle count so positions line up 1:1
    // and can be linearly (well, bezier-)interpolated between each other.
    // Shapes cycle: cloud -> rain -> tornado -> cloud -> ...
    // ---------------------------------------------------------------------
    const N = particleCount;

    function makeCloud(spread = 1.35) {
      // A puffy cumulus cloud made of several overlapping rounded "lumps",
      // each filled with a solid (not just surface) scatter of points so it
      // reads as a dense, soft mass rather than a wireframe outline.
      const lumps = [
        { x: -1.3 * spread, y: -0.1, z: 0, r: 0.55 },
        { x: -0.75 * spread, y: 0.28, z: 0.1, r: 0.68 },
        { x: 0, y: 0.42, z: -0.05, r: 0.78 },
        { x: 0.75 * spread, y: 0.25, z: 0.12, r: 0.66 },
        { x: 1.3 * spread, y: -0.08, z: 0, r: 0.55 },
        { x: -0.35 * spread, y: -0.35, z: 0.18, r: 0.62 },
        { x: 0.45 * spread, y: -0.32, z: -0.15, r: 0.58 },
      ];
      const pos = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) {
        const lump = lumps[Math.floor(Math.random() * lumps.length)];
        // uniform-in-volume point inside a sphere: random direction * r * cbrt(u)
        const u = Math.random();
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const rr = lump.r * Math.cbrt(u);
        const dx = rr * Math.sin(phi) * Math.cos(theta);
        const dy = rr * Math.sin(phi) * Math.sin(theta);
        const dz = rr * Math.cos(phi) * 0.75; // flatten depth a touch
        pos[i * 3] = lump.x + dx;
        pos[i * 3 + 1] = lump.y + dy * 0.85;
        pos[i * 3 + 2] = lump.z + dz;
      }
      return pos;
    }

    function makeTornado(height = 3.2, rTop = 1.7, rBottom = 0.12, turns = 3.1) {
      // A spiralling funnel: narrow at the base, widening toward the top,
      // with points weighted so the wider (top) rings stay just as dense
      // as the narrow base instead of thinning out.
      const pos = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) {
        const t = Math.pow(Math.random(), 0.55); // 0 = base, 1 = top
        const y = -height / 2 + t * height;
        const radius =
          (rBottom + (rTop - rBottom) * Math.pow(t, 0.8)) *
          (0.86 + Math.random() * 0.28); // ring thickness
        const angle = t * turns * Math.PI * 2 + Math.random() * 0.9;
        pos[i * 3] = radius * Math.cos(angle);
        pos[i * 3 + 1] = y;
        pos[i * 3 + 2] = radius * Math.sin(angle);
      }
      return pos;
    }

    function makeRain(width = 3.4, height = 3.1, depth = 1.6, dropCount = 240) {
      // A field of short, wind-slanted streaks standing in for rain drops.
      // Each "drop" gets its own base position + streak length; particles
      // are distributed along that streak so it reads as falling rain
      // rather than a uniform haze of points.
      const slant = -0.32;
      const drops = [];
      for (let d = 0; d < dropCount; d++) {
        const length = 0.35 + Math.random() * 0.95;
        drops.push({
          x0: (Math.random() * 2 - 1) * (width / 2),
          z0: (Math.random() * 2 - 1) * (depth / 2),
          startY: -height / 2 + Math.random() * (height - length),
          length,
        });
      }
      const pos = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) {
        const drop = drops[i % drops.length];
        const t = Math.random();
        pos[i * 3] =
          drop.x0 + slant * (t * drop.length) + (Math.random() - 0.5) * 0.025;
        pos[i * 3 + 1] = drop.startY + t * drop.length;
        pos[i * 3 + 2] = drop.z0 + (Math.random() - 0.5) * 0.025;
      }
      return pos;
    }

    const shapes = [makeCloud(), makeRain(), makeTornado()];

    // Per-particle random values used to stagger + curve each transition so
    // the morph reads as an organic "disintegrate and reform" wave instead
    // of a mechanical straight-line interpolation.
    const delays = new Float32Array(N);
    const durationsJitter = new Float32Array(N);
    const curveOffsets = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      delays[i] = Math.random() * 0.55; // fraction of morph spent waiting
      durationsJitter[i] = 0.75 + Math.random() * 0.5;
      curveOffsets[i * 3] = (Math.random() - 0.5) * 2.4;
      curveOffsets[i * 3 + 1] = (Math.random() - 0.5) * 2.4;
      curveOffsets[i * 3 + 2] = (Math.random() - 0.5) * 2.4;
    }

    // ---------------------------------------------------------------------
    // Geometry / material
    // ---------------------------------------------------------------------
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(shapes[0]);
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const colors = new Float32Array(N * 3);
    const baseColor = new THREE.Color(particleColor);
    for (let i = 0; i < N; i++) {
      // subtle per-particle RGB fringing, echoing the chromatic-noise look
      const fringe = 0.12;
      colors[i * 3] = Math.min(1, baseColor.r + (Math.random() - 0.5) * fringe);
      colors[i * 3 + 1] = Math.min(1, baseColor.g + (Math.random() - 0.5) * fringe);
      colors[i * 3 + 2] = Math.min(1, baseColor.b + (Math.random() - 0.5) * fringe);
    }
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    // small soft-circle sprite so points read as particles, not squares
    const spriteCanvas = document.createElement("canvas");
    spriteCanvas.width = 32;
    spriteCanvas.height = 32;
    const ctx = spriteCanvas.getContext("2d");
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(0.4, "rgba(255,255,255,0.6)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);
    const spriteTexture = new THREE.CanvasTexture(spriteCanvas);

    const material = new THREE.PointsMaterial({
      size: particleSize,
      map: spriteTexture,
      transparent: true,
      depthWrite: false,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });

    const points = new THREE.Points(geometry, material);
    const group = new THREE.Group();
    group.add(points);
    scene.add(group);

    // ---------------------------------------------------------------------
    // Resize handling
    // ---------------------------------------------------------------------
    function resize() {
      const { clientWidth, clientHeight } = container;
      if (clientWidth === 0 || clientHeight === 0) return;
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(clientWidth, clientHeight);
    }
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    // ---------------------------------------------------------------------
    // Pointer parallax + cursor repel field
    // ---------------------------------------------------------------------
    const pointer = { x: 0, y: 0 };
    const pointerNDC = new THREE.Vector2(0, 0);
    const raycaster = new THREE.Raycaster();
    const cursorPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const cursorWorld = new THREE.Vector3();
    const cursorLocal = new THREE.Vector3();
    let cursorActive = 0; // eased 0→1 presence so the repel fades in/out
    let cursorTarget = 0;

    function onPointerMove(e) {
      const rect = container.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      pointerNDC.set(pointer.x, -pointer.y);
      cursorTarget = 1;
    }
    function onPointerLeave() {
      cursorTarget = 0;
    }
    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerleave", onPointerLeave);

    // ---------------------------------------------------------------------
    // Animation loop: hold -> morph -> hold -> morph ... looping through
    // shapes[0] cloud -> shapes[1] rain -> shapes[2] tornado -> cloud -> ...
    // ---------------------------------------------------------------------
    let shapeIndex = 0;
    let mode = "hold"; // "hold" | "morph"
    let modeStart = performance.now();
    let raf;

    // basePositions holds the "settled" morph position for every particle,
    // undisturbed by the cursor. The repel effect is applied on top of this
    // every frame (whether holding or mid-morph).
    const basePositions = new Float32Array(shapes[0]);

    function easeInOutCubic(t) {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function tick(now) {
      raf = requestAnimationFrame(tick);

      const elapsed = now - modeStart;

      if (mode === "hold") {
        if (elapsed >= holdDuration) {
          mode = "morph";
          modeStart = now;
        }
      } else {
        const from = shapes[shapeIndex];
        const nextIndex = (shapeIndex + 1) % shapes.length;
        const to = shapes[nextIndex];
        const globalT = Math.min(elapsed / morphDuration, 1);

        for (let i = 0; i < N; i++) {
          const localT = THREE.MathUtils.clamp(
            (globalT - delays[i] * (1 - 1 / durationsJitter[i])) *
              durationsJitter[i],
            0,
            1
          );
          const t = easeInOutCubic(localT);
          const it = i * 3;

          // quadratic bezier through an outward-bulging control point so the
          // particle swells outward mid-transition rather than cutting
          // straight through the center.
          const cx =
            (from[it] + to[it]) / 2 + curveOffsets[it] * Math.sin(Math.PI * t);
          const cy =
            (from[it + 1] + to[it + 1]) / 2 +
            curveOffsets[it + 1] * Math.sin(Math.PI * t);
          const cz =
            (from[it + 2] + to[it + 2]) / 2 +
            curveOffsets[it + 2] * Math.sin(Math.PI * t);

          const omt = 1 - t;
          basePositions[it] =
            omt * omt * from[it] + 2 * omt * t * cx + t * t * to[it];
          basePositions[it + 1] =
            omt * omt * from[it + 1] + 2 * omt * t * cy + t * t * to[it + 1];
          basePositions[it + 2] =
            omt * omt * from[it + 2] + 2 * omt * t * cz + t * t * to[it + 2];
        }

        if (globalT >= 1) {
          shapeIndex = nextIndex;
          mode = "hold";
          modeStart = now;
          basePositions.set(shapes[shapeIndex]);
        }
      }

      // ---- cursor repel field --------------------------------------------
      // ease the on/off presence so the effect fades in/out smoothly
      cursorActive += (cursorTarget - cursorActive) * 0.08;

      raycaster.setFromCamera(pointerNDC, camera);
      const hit = raycaster.ray.intersectPlane(cursorPlane, cursorWorld);
      if (hit) {
        cursorLocal.copy(cursorWorld);
        group.worldToLocal(cursorLocal);
      }

      const posAttr = geometry.attributes.position;
      const arr = posAttr.array;
      const r2 = cursorRadius * cursorRadius;

      for (let i = 0; i < N; i++) {
        const it = i * 3;
        let x = basePositions[it];
        let y = basePositions[it + 1];
        let z = basePositions[it + 2];

        if (hit && cursorActive > 0.001) {
          const dx = x - cursorLocal.x;
          const dy = y - cursorLocal.y;
          const dz = z - cursorLocal.z;
          const d2 = dx * dx + dy * dy + dz * dz;
          if (d2 < r2) {
            const d = Math.sqrt(d2) || 0.0001;
            const falloff = 1 - d / cursorRadius; // 1 at center, 0 at edge
            const push = falloff * falloff * cursorStrength * cursorActive;
            x += (dx / d) * push;
            y += (dy / d) * push;
            z += (dz / d) * push;
          }
        }

        arr[it] = x;
        arr[it + 1] = y;
        arr[it + 2] = z;
      }
      posAttr.needsUpdate = true;

      // slow auto-rotation + subtle pointer parallax
      group.rotation.y += 0.0022;
      group.rotation.x += (pointer.y * 0.25 - group.rotation.x) * 0.04;
      group.rotation.y += (pointer.x * 0.15) * 0.001;

      renderer.render(scene, camera);
    }
    raf = requestAnimationFrame(tick);

    // ---------------------------------------------------------------------
    // Cleanup
    // ---------------------------------------------------------------------
    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerleave", onPointerLeave);
      geometry.dispose();
      material.dispose();
      spriteTexture.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    particleCount,
    particleColor,
    particleSize,
    holdDuration,
    morphDuration,
    cursorRadius,
    cursorStrength,
  ]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width: "100%",
        height: "100%",
        minHeight: 80,
        background: backgroundColor,
        overflow: "hidden",
        cursor: "default",
        ...style,
      }}
    />
  );
}
