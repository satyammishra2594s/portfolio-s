// @ts-nocheck
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { useWorldStore } from "../lib/store";

gsap.registerPlugin(ScrollTrigger);

const MEDIA = {
  fire: "https://www.pexels.com/download/video/29961570/",
  sky: "https://www.pexels.com/download/video/37083112/",
  fog: "https://www.pexels.com/download/video/13830670/",
};

export default function MediaWorld() {
  const fire = useRef<HTMLVideoElement>(null);
  const sky = useRef<HTMLVideoElement>(null);
  const fog = useRef<HTMLVideoElement>(null);
  const [lowMotion, setLowMotion] = useState(false);
  const [slowConnection, setSlowConnection] = useState(false);
  const setProgress = useWorldStore((s) => s.setProgress);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const connection = (navigator as any).connection;
    const slow = ["slow-2g", "2g"].includes(connection?.effectiveType);
    setLowMotion(reduced);
    setSlowConnection(slow);
    useWorldStore.getState().setReduced(reduced || slow);

    const lenis = new Lenis({ smoothWheel: !reduced && !slow, lerp: 0.08 });
    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    const id = requestAnimationFrame(raf);

    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? window.scrollY / max : 0);
    };
    window.addEventListener("scroll", update, { passive: true });
    update();

    const videos = [fire.current, sky.current, fog.current].filter(Boolean) as HTMLVideoElement[];
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const video = entry.target as HTMLVideoElement;
        if (!entry.isIntersecting) video.pause();
      });
    }, { threshold: 0.01 });
    videos.forEach((video) => io.observe(video));

    return () => {
      cancelAnimationFrame(id);
      lenis.destroy();
      io.disconnect();
      window.removeEventListener("scroll", update);
    };
  }, [setProgress]);

  useEffect(() => {
    if (lowMotion || slowConnection) return;
    const scope = gsap.context(() => {
      const videos = [fire.current, sky.current, fog.current].filter(Boolean) as HTMLVideoElement[];
      const maxDuration = 16;
      videos.forEach((video) => {
        video.pause();
        ScrollTrigger.create({
          trigger: document.body,
          start: "top top",
          end: "bottom bottom",
          scrub: true,
          onUpdate: (self) => {
            if (!Number.isFinite(video.duration) || video.duration <= 0) return;
            const target = Math.min(video.duration - 0.05, self.progress * Math.min(video.duration, maxDuration));
            try { video.currentTime = target; } catch {}
          },
        });
      });

      const fireLayer = document.querySelector("[data-media-fire]");
      const fogLayer = document.querySelector("[data-media-fog]");
      const skyLayer = document.querySelector("[data-media-sky]");
      if (fireLayer) gsap.to(fireLayer, { yPercent: 10, scale: 1.06, scrollTrigger: { trigger: document.body, start: "top top", end: "bottom bottom", scrub: true } });
      if (fogLayer) gsap.to(fogLayer, { yPercent: 18, scale: 1.1, scrollTrigger: { trigger: document.body, start: "top top", end: "bottom bottom", scrub: true } });
      if (skyLayer) gsap.to(skyLayer, { yPercent: 7, scale: 1.04, scrollTrigger: { trigger: document.body, start: "top top", end: "bottom bottom", scrub: true } });
    });
    return () => scope.revert();
  }, [lowMotion, slowConnection]);

  const embers = useMemo(() => Array.from({ length: 34 }, (_, i) => ({ left: (i * 17) % 100, delay: (i % 9) * 0.4, duration: 5 + (i % 5) })), []);

  return (
    <div className="fixed inset-0 -z-0 overflow-hidden bg-[#020204] media-world" aria-hidden="true">
      <div data-media-sky className="absolute inset-[-5%] media-layer media-sky">
        <video ref={sky} className="h-full w-full object-cover" src={MEDIA.sky} muted playsInline preload="metadata" poster="/media/sky-poster.jpg" />
      </div>
      <div data-media-fog className="absolute inset-[-8%] media-layer media-fog">
        <video ref={fog} className="h-full w-full object-cover" src={MEDIA.fog} muted playsInline preload="none" poster="/media/fog-poster.jpg" />
      </div>
      <div data-media-fire className="absolute inset-x-[-4%] bottom-[-8%] h-[64%] media-layer media-fire">
        <video ref={fire} className="h-full w-full object-cover object-bottom" src={MEDIA.fire} muted playsInline preload="none" poster="/media/fire-poster.jpg" />
      </div>
      <div className="absolute inset-x-[-5%] bottom-0 h-[68%] bg-gradient-to-t from-[#0b0200ee] via-[#1b060088] to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_28%,rgba(0,0,0,.35)_65%,rgba(0,0,0,.86)_100%)]" />
      <div className="absolute inset-0 pointer-events-none overflow-hidden mix-blend-screen opacity-55">
        {embers.map((e, i) => <i key={i} className="ember" style={{ left: `${e.left}%`, animationDelay: `${e.delay}s`, animationDuration: `${e.duration}s` }} />)}
      </div>
      <div className="absolute inset-0 grain" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/75" />
    </div>
  );
}
