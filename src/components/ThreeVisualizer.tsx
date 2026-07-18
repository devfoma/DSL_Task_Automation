'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function ThreeVisualizer() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    // Central Core
    const coreGeom = new THREE.IcosahedronGeometry(1.5, 2);
    const coreMat = new THREE.MeshPhongMaterial({
      color: 0x00f2fe,
      emissive: 0x00f2fe,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.8,
      wireframe: true
    });
    const core = new THREE.Mesh(coreGeom, coreMat);
    group.add(core);

    // Inner Core Glow
    const innerCoreGeom = new THREE.SphereGeometry(0.8, 32, 32);
    const innerCoreMat = new THREE.MeshBasicMaterial({ color: 0x00f2fe });
    const innerCore = new THREE.Mesh(innerCoreGeom, innerCoreMat);
    group.add(innerCore);

    // Flow Nodes (representing DSL commands)
    const nodes: THREE.Mesh[] = [];
    const nodeCount = 12;
    const connections = new THREE.Group();
    group.add(connections);

    const lineMaterials: THREE.LineBasicMaterial[] = [];

    for (let i = 0; i < nodeCount; i++) {
      const nodeGeom = new THREE.BoxGeometry(0.3, 0.3, 0.3);
      const nodeMat = new THREE.MeshPhongMaterial({
        color: 0x4facfe,
        emissive: 0x4facfe,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.9
      });
      const node = new THREE.Mesh(nodeGeom, nodeMat);
      
      const angle = (i / nodeCount) * Math.PI * 2;
      const radius = 4 + Math.random() * 2;
      node.position.set(
        Math.cos(angle) * radius,
        (Math.random() - 0.5) * 4,
        Math.sin(angle) * radius
      );
      
      node.userData = {
        originalPos: node.position.clone(),
        speed: 0.001 + Math.random() * 0.002,
        offset: Math.random() * 100
      };
      
      group.add(node);
      nodes.push(node);
      
      // Connection line to core
      const points = [new THREE.Vector3(0, 0, 0), node.position];
      const lineGeom = new THREE.BufferGeometry().setFromPoints(points);
      const lineMat = new THREE.LineBasicMaterial({ color: 0x00f2fe, transparent: true, opacity: 0.2 });
      lineMaterials.push(lineMat);
      const line = new THREE.Line(lineGeom, lineMat);
      connections.add(line);
    }

    // Particles (Data Flow)
    const particlesCount = 100;
    const particlesGeom = new THREE.BufferGeometry();
    const particlesPos = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount * 3; i++) {
      particlesPos[i] = (Math.random() - 0.5) * 15;
    }
    particlesGeom.setAttribute('position', new THREE.BufferAttribute(particlesPos, 3));
    const particlesMat = new THREE.PointsMaterial({
      color: 0x05ffc5,
      size: 0.05,
      transparent: true,
      opacity: 0.6
    });
    const particles = new THREE.Points(particlesGeom, particlesMat);
    scene.add(particles);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0x00f2fe, 2, 20);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    camera.position.z = 10;

    let animId: number;

    // Animation Loop
    function animate(time: number) {
      animId = requestAnimationFrame(animate);
      
      const t = time * 0.001;
      
      // Rotate overall group
      group.rotation.y += 0.003;
      group.rotation.x = Math.sin(t * 0.2) * 0.1;
      
      // Pulse core
      const pulse = 1 + Math.sin(t * 2) * 0.1;
      core.scale.set(pulse, pulse, pulse);
      innerCore.scale.set(pulse, pulse, pulse);
      
      // Animate nodes
      nodes.forEach((node) => {
        node.position.y = node.userData.originalPos.y + Math.sin(t + node.userData.offset) * 0.5;
        node.rotation.x += 0.01;
        node.rotation.y += 0.01;
      });
      
      // Update connections
      connections.children.forEach((line, i) => {
        const l = line as THREE.Line;
        l.geometry.setFromPoints([new THREE.Vector3(0, 0, 0), nodes[i].position]);
        l.geometry.attributes.position.needsUpdate = true;
      });
      
      // Animate particles
      const positions = particles.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particlesCount; i++) {
        positions[i * 3 + 1] -= 0.02;
        if (positions[i * 3 + 1] < -7) {
          positions[i * 3 + 1] = 7;
        }
      }
      particles.geometry.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    }
    
    animate(0);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      if (container && renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      // dispose geometries/materials
      coreGeom.dispose();
      coreMat.dispose();
      innerCoreGeom.dispose();
      innerCoreMat.dispose();
      particlesGeom.dispose();
      particlesMat.dispose();
      lineMaterials.forEach(m => m.dispose());
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full -z-10 pointer-events-none bg-transparent"
    />
  );
}
