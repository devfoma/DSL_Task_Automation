'use client';

import React, { useEffect, useRef } from 'react';

export default function BackgroundShader() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function syncSize() {
      if (!canvas) return;
      const w = canvas.clientWidth || 1280;
      const h = canvas.clientHeight || 720;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    }

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(syncSize);
      observer.observe(canvas);
    }
    syncSize();

    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (!gl) return;

    const vs = `
      attribute vec2 a_position;
      varying vec2 v_texCoord;
      void main() {
        v_texCoord = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    const fs = `
      precision highp float;
      varying vec2 v_texCoord;
      uniform float u_time;
      uniform vec2 u_resolution;

      float hash(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
      }

      void main() {
        vec2 uv = v_texCoord;
        
        vec3 color1 = vec3(0.043, 0.059, 0.098); // #0b0f19
        vec3 color2 = vec3(0.118, 0.106, 0.294); // #1e1b4b
        vec3 accent1 = vec3(0.0, 0.949, 0.996); // #00f2fe (Neon Cyan)
        vec3 accent2 = vec3(0.31, 0.675, 0.996); // #4facfe (Electric Purple)
        
        float n = noise(uv * 3.0 + u_time * 0.1);
        n += noise(uv * 6.0 - u_time * 0.05) * 0.5;
        
        vec3 baseColor = mix(color1, color2, uv.y + n * 0.3);
        
        float glow1 = smoothstep(0.8, 0.0, length(uv - vec2(0.2, 0.8) + vec2(sin(u_time*0.5)*0.1, cos(u_time*0.3)*0.1)));
        float glow2 = smoothstep(0.6, 0.0, length(uv - vec2(0.8, 0.2) + vec2(cos(u_time*0.4)*0.15, sin(u_time*0.6)*0.1)));
        
        vec3 finalColor = baseColor + accent1 * glow1 * 0.15 + accent2 * glow2 * 0.15;
        
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    const glCtx = gl;

    function cs(type: number, src: string) {
      const s = glCtx.createShader(type);
      if (!s) return null;
      glCtx.shaderSource(s, src);
      glCtx.compileShader(s);
      return s;
    }

    const vsShader = cs(glCtx.VERTEX_SHADER, vs);
    const fsShader = cs(glCtx.FRAGMENT_SHADER, fs);
    if (!vsShader || !fsShader) return;

    const prog = gl.createProgram();
    if (!prog) return;
    gl.attachShader(prog, vsShader);
    gl.attachShader(prog, fsShader);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    
    const pos = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uRes = gl.getUniformLocation(prog, 'u_resolution');

    let animId: number;

    function render(t: number) {
      if (!canvas || !gl) return;
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (uTime) gl.uniform1f(uTime, t * 0.001);
      if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animId = requestAnimationFrame(render);
    }
    
    render(0);

    return () => {
      cancelAnimationFrame(animId);
      if (observer) {
        observer.disconnect();
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full -z-20 pointer-events-none"
    />
  );
}
