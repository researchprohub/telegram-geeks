'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

function makeSprite(color: string, size: number) {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d')!;
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, color);
  grad.addColorStop(0.3, color);
  grad.addColorStop(1, 'transparent');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(32, 32, 32, 0, Math.PI * 2);
  ctx.fill();
  return new THREE.CanvasTexture(c);
}

export function FooterAnimation() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const w = el.clientWidth;
    const h = el.clientHeight;
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    el.appendChild(renderer.domElement);

    const count = 30;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const velocities: number[] = [];
    const drifts: number[] = [];

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 2;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 2;
      positions[i * 3 + 2] = 0;
      sizes[i] = 0.02 + Math.random() * 0.06;
      velocities.push(0.002 + Math.random() * 0.005);
      drifts.push((Math.random() - 0.5) * 0.003);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const mat = new THREE.PointsMaterial({
      map: makeSprite('hsl(167, 97%, 59%)', 64),
      size: 0.08,
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    const points = new THREE.Points(geo, mat);
    scene.add(points);

    let visible = true;
    const observer = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    observer.observe(el);

    let anim: number;
    const frame = () => {
      anim = requestAnimationFrame(frame);
      if (!visible) return;
      const p = points.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < count; i++) {
        p[i * 3 + 1] += velocities[i];
        p[i * 3] += drifts[i];
        if (p[i * 3 + 1] > 1) {
          p[i * 3 + 1] = -1;
          p[i * 3] = (Math.random() - 0.5) * 2;
        }
        if (Math.abs(p[i * 3]) > 1) drifts[i] *= -1;
      }
      points.geometry.attributes.position.needsUpdate = true;
      renderer.render(scene, camera);
    };
    frame();

    const resize = () => {
      const rw = el.clientWidth;
      const rh = el.clientHeight;
      renderer.setSize(rw, rh);
    };
    window.addEventListener('resize', resize);

    // ponytail: single scene, no resize debounce, add if janky

    return () => {
      cancelAnimationFrame(anim);
      observer.disconnect();
      window.removeEventListener('resize', resize);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={ref} className="absolute inset-0 pointer-events-none" />;
}