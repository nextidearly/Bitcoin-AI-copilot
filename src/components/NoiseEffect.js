// components/NoiseEffect.js
'use client'; // Mark as client component

import { useEffect } from 'react';

export default function NoiseEffect() {
  useEffect(() => {
    // Your noise script adapted for React
    let canvas, ctx;
    let wWidth, wHeight;
    let noiseData = [];
    let frame = 0;
    let loopTimeout;
    let animationFrameId;

    const createNoise = () => {
      const idata = ctx.createImageData(wWidth, wHeight);
      const buffer32 = new Uint32Array(idata.data.buffer);
      const len = buffer32.length;

      for (let i = 0; i < len; i++) {
        if (Math.random() < 0.5) {
          buffer32[i] = 0xff000000;
        }
      }
      noiseData.push(idata);
    };

    const paintNoise = () => {
      if (frame === 9) frame = 0;
      else frame++;
      ctx.putImageData(noiseData[frame], 0, 0);
    };

    const loop = () => {
      paintNoise();
      loopTimeout = window.setTimeout(() => {
        animationFrameId = window.requestAnimationFrame(loop);
      }, 1000 / 25);
    };

    const setup = () => {
      wWidth = window.innerWidth;
      wHeight = window.innerHeight;
      canvas.width = wWidth;
      canvas.height = wHeight;
      noiseData = [];
      
      for (let i = 0; i < 10; i++) createNoise();
      loop();
    };

    // Initialize
    canvas = document.getElementById('noise');
    ctx = canvas.getContext('2d');
    setup();

    // Handle resize
    let resizeThrottle;
    const handleResize = () => {
      clearTimeout(resizeThrottle);
      resizeThrottle = setTimeout(() => {
        clearTimeout(loopTimeout);
        cancelAnimationFrame(animationFrameId);
        setup();
      }, 200);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(loopTimeout);
      cancelAnimationFrame(animationFrameId);
      clearTimeout(resizeThrottle);
    };
  }, []);

  return (
    <canvas
      id="noise"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 9999,
        opacity: 0.05
      }}
    />
  );
}