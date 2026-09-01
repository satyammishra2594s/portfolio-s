// @ts-nocheck
"use client";
import {useEffect,useMemo,useRef,useState} from "react";
import gsap from "gsap";
import {ScrollTrigger} from "gsap/ScrollTrigger";
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

function Video({src,innerRef,className}){return <video ref={innerRef} className={className} src={src} muted loop playsInline preload="metadata"/>}

export default function MediaWorld(){
 const sky=useRef(null),fog=useRef(null),fireA=useRef(null),fireB=useRef(null);
 const [reduced,setReduced]=useState(false),[slow,setSlow]=useState(false);
 const setProgress=useWorldStore(s=>s.setProgress);
 const embers=useMemo(()=>Array.from({length:120},(_,i)=>({left:(i*13.7)%100,delay:(i%17)*.21,duration:3+(i%10)*.45,size:2+(i%8)*.75,depth:i%3})),[]);
 useEffect(()=>{
  const r=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const type=navigator.connection?.effectiveType;
  const s=["slow-2g","2g"].includes(type);
  setReduced(r);setSlow(s);useWorldStore.getState().setReduced(r||s);
  const update=()=>{const max=document.documentElement.scrollHeight-innerHeight;setProgress(max>0?scrollY/max:0)};
  addEventListener("scroll",update,{passive:true});update();
  return()=>removeEventListener("scroll",update);
 },[setProgress]);
 useEffect(()=>{
  if(reduced||slow)return;
  const videos=[sky.current,fog.current,fireA.current,fireB.current].filter(Boolean);
  videos.forEach(v=>{v.play().catch(()=>{});v.playbackRate=.8});
  const ctx=gsap.context(()=>{
   const all=ScrollTrigger.create({trigger:document.body,start:"top top",end:"bottom bottom",scrub:.6,onUpdate:self=>{
    useWorldStore.getState().setProgress(self.progress);
    const fireRate=.8+self.progress*1.2;
    if(fireA.current)fireA.current.playbackRate=fireRate;
    if(fireB.current)fireB.current.playbackRate=fireRate;
    const fireGlow=document.querySelector("[data-fire-glow]");
    if(fireGlow){fireGlow.style.opacity=String(.4+self.progress*.48);fireGlow.style.transform=`scale(${1+self.progress*.12})`}
   }});
   const cross=document.querySelector("[data-space]");
   if(cross)gsap.to(cross,{opacity:.9,scrollTrigger:{trigger:"[data-journey]",start:"top 70%",end:"bottom 30%",scrub:true}});
   const flare=document.querySelector("[data-gate-flare]");
   if(flare)gsap.to(flare,{opacity:.95,scale:1.28,scrollTrigger:{trigger:"[data-final]",start:"top 70%",end:"center center",scrub:true}});
   const open=document.querySelector("[data-gate-open]");
   if(open)gsap.to(open,{opacity:1,scrollTrigger:{trigger:"[data-ending]",start:"top 70%",end:"bottom 30%",scrub:true}});
  });
  return()=>ctx.revert();
 },[reduced,slow]);
 useEffect(()=>{
  if(reduced||slow)return;
  const layers=[
   [".ambient-sky-a",".ambient-sky-b",.7],
   [".ambient-fog-a",".ambient-fog-b",1.15],
   [".ambient-fire-a",".ambient-fire-b",1.8],
   [".ambient-gates-a",".ambient-gates-b",.42]
  ];
  const starts=layers.map(()=>performance.now()); let id=0,last=performance.now(); let accumulator=layers.map(()=>0); let lastScroll=scrollY;
  const tick=(now)=>{
   const dt=Math.min((now-last)/1000,.05);last=now;
   const scrollDelta=Math.abs(scrollY-lastScroll);lastScroll=scrollY;
   const boost=Math.min(scrollDelta*.008,1.2);
   layers.forEach(([a,b,speed],idx)=>{
    accumulator[idx]+=dt*(speed+boost);
    const cycle=200; const xA=(accumulator[idx]%cycle)-100; const xB=((accumulator[idx]+100)%cycle)-100;
    document.querySelectorAll(a).forEach(el=>el.style.transform=`translate3d(${xA}%,0,0) scale(1.14)`);
    document.querySelectorAll(b).forEach(el=>el.style.transform=`translate3d(${xB}%,0,0) scale(1.14)`);
   });
   id=requestAnimationFrame(tick);
  };
  id=requestAnimationFrame(tick);return()=>cancelAnimationFrame(id);
 },[reduced,slow]);
 return <div className="fixed inset-0 z-0 overflow-hidden media-world pointer-events-none">
  <div data-sky className="absolute inset-[-9%] media-layer"><Video innerRef={sky} src={MEDIA.sky} className="ambient-sky-a absolute inset-y-0 left-[-100%] h-full w-full object-cover"/><Video src={MEDIA.sky} className="ambient-sky-b absolute inset-y-0 left-0 h-full w-full object-cover"/></div>
  <div data-fog className="absolute inset-[-10%] media-layer opacity-50 mix-blend-screen"><Video innerRef={fog} src={MEDIA.fog} className="ambient-fog-a absolute inset-y-0 left-[-100%] h-full w-full object-cover"/><Video src={MEDIA.fog} className="ambient-fog-b absolute inset-y-0 left-0 h-full w-full object-cover"/></div>
  <div data-fire className="absolute inset-x-[-8%] bottom-[-7%] h-[58%] media-layer"><Video innerRef={fireA} src={MEDIA.fireA} className="ambient-fire-a absolute inset-y-0 left-[-100%] h-full w-full object-cover object-bottom mix-blend-screen"/><Video innerRef={fireB} src={MEDIA.fireB} className="ambient-fire-b absolute inset-y-0 left-0 h-full w-full object-cover object-bottom mix-blend-screen opacity-75"/><div data-fire-glow className="absolute inset-[-16%] bg-[radial-gradient(ellipse_at_center_bottom,rgba(255,65,7,.95),rgba(225,35,0,.45)_34%,transparent_76%)] blur-3xl opacity-45"/></div>
  <div className="absolute inset-x-0 bottom-[14%] h-[42%] bg-gradient-to-t from-[#ff2b00b8] via-[#9416003e] to-transparent mix-blend-screen"/>
  <div data-gates className="absolute inset-[-10%] media-layer"><img src={MEDIA.gateA} className="ambient-gates-a absolute inset-y-0 left-[-100%] h-full w-full object-cover"/><img src={MEDIA.gateB} className="ambient-gates-b absolute inset-y-0 left-0 h-full w-full object-cover opacity-45"/></div>
  <div data-space className="absolute inset-0 opacity-0 bg-[radial-gradient(circle_at_78%_24%,rgba(157,196,255,.48),transparent_15%),linear-gradient(to_bottom,rgba(0,10,45,.3),transparent_62%)]"/>
  <div data-gate-flare className="absolute inset-0 opacity-0 bg-[radial-gradient(circle_at_center,rgba(255,241,188,.95),rgba(255,129,29,.28)_24%,transparent_62%)] blur-2xl"/>
  <div data-gate-open className="absolute inset-0 opacity-0 bg-[linear-gradient(to_bottom,rgba(255,190,100,.08),rgba(255,255,255,.14),transparent)]"/>
  <div className="absolute inset-0 mix-blend-screen opacity-90">{embers.map((e,i)=><i key={i} className={`ember-particle ember-depth-${e.depth}`} style={{left:`${e.left}%`,animationDelay:`${e.delay}s`,animationDuration:`${e.duration}s`,width:e.size,height:e.size}}/>)}</div>
  <div className="absolute inset-0 grain-layer"/><div className="absolute inset-0 vignette-layer"/>
 </div>;
}
