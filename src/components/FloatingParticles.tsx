import { useEffect, useRef } from "react";

export default function FloatingParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    interface Star {
      x: number;
      y: number;
      size: number;
      baseOpacity: number;
      twinkleSpeed: number;
      twinkleOffset: number;
    }

    let stars: Star[] = [];

    const createStars = () => {
      const count = Math.floor((canvas.width * canvas.height) / 6000);
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 1.4 + 0.3,
        baseOpacity: Math.random() * 0.6 + 0.2,
        twinkleSpeed: Math.random() * 0.002 + 0.001,
        twinkleOffset: Math.random() * Math.PI * 2,
      }));
    };

    const drawNebula = () => {
      // Teal nebula - top right
      const g1 = ctx.createRadialGradient(
        canvas.width * 0.8, canvas.height * 0.2, 0,
        canvas.width * 0.8, canvas.height * 0.2, canvas.width * 0.5
      );
      g1.addColorStop(0, "hsla(160, 60%, 30%, 0.15)");
      g1.addColorStop(0.4, "hsla(160, 50%, 20%, 0.06)");
      g1.addColorStop(1, "transparent");
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Blue nebula - bottom left
      const g2 = ctx.createRadialGradient(
        canvas.width * 0.15, canvas.height * 0.8, 0,
        canvas.width * 0.15, canvas.height * 0.8, canvas.width * 0.45
      );
      g2.addColorStop(0, "hsla(200, 70%, 35%, 0.12)");
      g2.addColorStop(0.4, "hsla(200, 60%, 25%, 0.05)");
      g2.addColorStop(1, "transparent");
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Subtle center glow
      const g3 = ctx.createRadialGradient(
        canvas.width * 0.5, canvas.height * 0.5, 0,
        canvas.width * 0.5, canvas.height * 0.5, canvas.width * 0.4
      );
      g3.addColorStop(0, "hsla(180, 40%, 25%, 0.06)");
      g3.addColorStop(1, "transparent");
      ctx.fillStyle = g3;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    let time = 0;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawNebula();

      time += 1;
      stars.forEach((s) => {
        const twinkle = Math.sin(time * s.twinkleSpeed + s.twinkleOffset) * 0.3 + 0.7;
        const opacity = s.baseOpacity * twinkle;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(0, 0%, 100%, ${opacity})`;
        ctx.fill();
      });

      animationId = requestAnimationFrame(animate);
    };

    resize();
    createStars();
    animate();

    const onResize = () => { resize(); createStars(); };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
    />
  );
}
