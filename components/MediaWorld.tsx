// @ts-nocheck
"use client";

import {useEffect,useMemo,useRef,useState} from "react";
import gsap from "gsap";
import {ScrollTrigger} from "gsap/ScrollTrigger";
import Lenis from "lenis";
import {useWorldStore} from "../lib/store";

gsap.registerPlugin(ScrollTrigger);

const MEDIA={
  sky:"https://www.pexels.com/download/video/37083112/",
  fog:"https://www.pexels.com/download/video/13830670/",
  fireA:"https://www.pexels.com/download/video/7448357/",
  fireB:"https://www.pexels.com/download/video/33643167/",
  gateA:"https://images.pexels.com/photos/37190125/pexels-photo-37190125.jpeg?auto=compress&cs=tinysrgb&w=2400",
  gateB:"https://images.pexels.com/photos/35385243/pexels-photo-35385243.jpeg?auto=compress&cs=tinysrgb&w=2400"
};

function Video({src,className,videoRef}){return <video ref={videoRef} className={className} src={src} muted loop playsInline preload="metadata"/>}

export default function MediaWorld(){
  const sky=useRef(null),fog=useRef(null),fireA=useRef(null),fireB=useRef(null);
  const [reduced,setReduced]=useState(false),[slow,setSlow]=useState(false);
  const setProgress=useWorldStore(s=>s.setProgress);
  const embers=useMemo(()=>Array.from({length:110},(_,i)=>({left:(i*17.3)%100,delay:(i%19)*.16,duration:2.8+(i%11)*.38,size:1.5+(i%9)*1.25,drift:(i%13)-6,depth:i%3})),[]);

  useEffect(()=>{
    const r=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const type=navigator.connection?.effectiveType;
    const s=["slow-2g","2g"].includes(type);
    setReduced(r);setSlow(s);useWorldStore.getState().setReduced(r||s);
    const lenis=new Lenis({lerp:.085,smoothWheel:!(r||s),syncTouch:false});
    let rafId=0;const raf=(t)=>{lenis.raf(t);rafId=requestAnimationFrame(raf)};rafId=requestAnimationFrame(raf);
    const onScroll=()=>{const max=document.documentElement.scrollHeight-innerHeight;setProgress(max>0?scrollY/max:0)};
    addEventListener("scroll",onScroll,{passive:true});onScroll();
    return()=>{cancelAnimationFrame(rafId);lenis.destroy();removeEventListener("scroll",onScroll)};
  },[setProgress]);

  useEffect(()=>{
    if(reduced||slow)return;
    const videos=[sky.current,fog.current,fireA.current,fireB.current].filter(Boolean);
    videos.forEach(v=>v.play().catch(()=>{}));
    const ctx=gsap.context(()=>{
      videos.forEach(v=>ScrollTrigger.create({trigger:document.body,start:"top top",end:"bottom bottom",scrub:true,onUpdate:self=>{
        if(Number.isFinite(v.duration)&&v.duration>0){try{v.currentTime=(self.progress*v.duration*.92)%(v.duration-.04)}catch{}}
        v.playbackRate=(v===fireA.current||v===fireB.current)?(.8+self.progress*1.15):(.68+self.progress*.3);
      }}));
      gsap.to("[data-sky]",{scale:1.08,xPercent:5,scrollTrigger:{trigger:document.body,start:"top top",end:"bottom bottom",scrub:true}});
      gsap.to("[data-fog]",{scale:1.12,xPercent:9,scrollTrigger:{trigger:document.body,start:"top top",end:"bottom bottom",scrub:true}});
      gsap.to("[data-fire]",{scale:1.1,xPercent:16,scrollTrigger:{trigger:document.body,start:"top top",end:"bottom bottom",scrub:true}});
      gsap.to("[data-gates]",{yPercent:-10,scale:1.07,scrollTrigger:{trigger:document.body,start:"top top",end:"bottom bottom",scrub:true}});
      gsap.to("[data-fire-glow]",{opacity:1,scale:1.2,scrollTrigger:{trigger:document.body,start:"top top",end:"84% bottom",scrub:true}});
      gsap.to("[data-space]",{opacity:.92,scrollTrigger:{trigger:"[data-journey]",start:"top 80%",end:"bottom 25%",scrub:true}});
      gsap.to("[data-gate-flare]",{opacity:1,scale:1.3,scrollTrigger:{trigger:"[data-final]",start:"top 75%",end:"center center",scrub:true}});
      gsap.to("[data-gate-open]",{opacity:1,scrollTrigger:{trigger:"[data-ending]",start:"top 70%",end:"bottom 35%",scrub:true}});
    });
    return()=>ctx.revert();
  },[reduced,slow]);

  useEffect(()=>{
    if(reduced||slow)return;
    const groups=[[".ambient-sky-a",".ambient-sky-b",.12],[".ambient-fog-a",".ambient-fog-b",.22],[".ambient-fire-a",".ambient-fire-b",.43],[".ambient-gates-a",".ambient-gates-b",.065]];
    const t0=performance.now();let id=0,lastY=scrollY;
    const tick=(now)=>{
      const sec=(now-t0)/1000;const dy=Math.abs(scrollY-lastY);lastY=scrollY;const boost=Math.min(dy*.02,1.75);
      groups.forEach(([a,b,speed],idx)=>{
        document.querySelectorAll(a).forEach(el=>{const x=((sec*(speed+boost)+idx*100)%200)-100;el.style.transform=`translate3d(${x}%,0,0) scale(1.16)`});
        document.querySelectorAll(b).forEach(el=>{const x=((sec*(speed+boost)+100+idx*100)%200)-100;el.style.transform=`translate3d(${x}%,0,0) scale(1.16)`});
      });
      id=requestAnimationFrame(tick);
    };
    id=requestAnimationFrame(tick);return()=>cancelAnimationFrame(id);
  },[reduced,slow]);

  return <div className="fixed inset-0 z-0 overflow-hidden media-world pointer-events-none">
    <div data-sky className="absolute inset-[-9%] media-filter ambient-layer"><Video videoRef={sky} src={MEDIA.sky} className="ambient-sky-a absolute inset-y-0 left-[-100%] h-full w-full object-cover"/><Video src={MEDIA.sky} className="ambient-sky-b absolute inset-y-0 left-0 h-full w-full object-cover"/></div>
    <div data-fog className="absolute inset-[-11%] media-filter opacity-50 mix-blend-screen ambient-layer"><Video videoRef={fog} src={MEDIA.fog} className="ambient-fog-a absolute inset-y-0 left-[-100%] h-full w-full object-cover"/><Video src={MEDIA.fog} className="ambient-fog-b absolute inset-y-0 left-0 h-full w-full object-cover"/></div>
    <div data-fire className="absolute inset-x-[-8%] bottom-[-10%] h-[64%] media-filter ambient-layer" style={{WebkitMaskImage:"linear-gradient(to top,black 56%,rgba(0,0,0,.82) 76%,transparent 100%)",maskImage:"linear-gradient(to top,black 56%,rgba(0,0,0,.82) 76%,transparent 100%)"}}><Video videoRef={fireA} src={MEDIA.fireA} className="ambient-fire-a absolute inset-y-0 left-[-100%] h-full w-full object-cover object-bottom mix-blend-screen"/><Video videoRef={fireB} src={MEDIA.fireB} className="ambient-fire-b absolute inset-y-0 left-0 h-full w-full object-cover object-bottom mix-blend-screen opacity-80"/><div data-fire-glow className="absolute inset-[-12%] bg-[radial-gradient(ellipse_at_center_bottom,rgba(255,64,7,.96),rgba(221,30,0,.54)_32%,rgba(116,10,0,.16)_58%,transparent_78%)] blur-3xl opacity-65"/></div>
    <div className="absolute inset-x-0 bottom-[12%] h-[48%] bg-gradient-to-t from-[#ff2d00dc] via-[#9c17004d] to-transparent mix-blend-screen"/>
    <div data-gates className="absolute inset-[-10%] media-filter ambient-layer"><img src={MEDIA.gateA} className="ambient-gates-a absolute inset-y-0 left-[-100%] h-full w-full object-cover object-center opacity-38"/><img src={MEDIA.gateB} className="ambient-gates-b absolute inset-y-0 left-0 h-full w-full object-cover object-center opacity-32"/></div>
    <div data-space className="absolute inset-0 opacity-0 bg-[radial-gradient(circle_at_77%_23%,rgba(165,202,255,.58),transparent_14%),linear-gradient(to_bottom,rgba(0,9,40,.28),transparent_58%)]"/>
    <div data-gate-flare className="absolute inset-0 opacity-0 bg-[radial-gradient(circle_at_center,rgba(255,242,195,.98),rgba(255,132,33,.32)_24%,transparent_61%)] blur-2xl"/>
    <div data-gate-open className="absolute inset-0 opacity-0 bg-[linear-gradient(to_bottom,rgba(255,190,100,.08),rgba(255,255,255,.15),transparent)]"/>
    <div className="absolute inset-0 mix-blend-screen opacity-90">{embers.map((e,i)=><i key={i} className={`ember-particle ember-depth-${e.depth}`} style={{left:`${e.left}%`,animationDelay:`${e.delay}s`,animationDuration:`${e.duration}s`,width:e.size,height:e.size,marginLeft:e.drift}}/>)}</div>
    <div className="absolute inset-0 grain-layer"/><div className="absolute inset-0 vignette-layer"/>
  </div>;
}
