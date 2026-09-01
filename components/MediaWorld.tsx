// @ts-nocheck
"use client";
import {useEffect,useMemo,useRef,useState} from "react";
import gsap from "gsap";
import {ScrollTrigger} from "gsap/ScrollTrigger";
import Lenis from "lenis";
import {useWorldStore} from "../lib/store";
gsap.registerPlugin(ScrollTrigger);

const MEDIA={
  fire:"https://www.pexels.com/download/video/29961570/",
  sky:"https://www.pexels.com/download/video/37083112/",
  fog:"https://www.pexels.com/download/video/13830670/"
};
const FALLBACK={
  fire:"https://images.pexels.com/videos/29961570/4k-forest-brush-burn-burning-29961570.jpeg?auto=compress&dpr=1&h=1200&w=2000",
  sky:"#02040b",
  fog:"#090b10"
};

export default function MediaWorld(){
  const fire=useRef(null),sky=useRef(null),fog=useRef(null);
  const [lowMotion,setLowMotion]=useState(false),[slowConnection,setSlowConnection]=useState(false);
  const setProgress=useWorldStore(s=>s.setProgress);

  useEffect(()=>{
    const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const connection=navigator.connection;
    const slow=["slow-2g","2g"].includes(connection?.effectiveType);
    setLowMotion(reduced);setSlowConnection(slow);useWorldStore.getState().setReduced(reduced||slow);
    const lenis=new Lenis({smoothWheel:!reduced&&!slow,lerp:.08});
    let frame=0;const raf=(time)=>{lenis.raf(time);frame=requestAnimationFrame(raf)};frame=requestAnimationFrame(raf);
    const update=()=>{const max=document.documentElement.scrollHeight-innerHeight;setProgress(max>0?scrollY/max:0)};
    addEventListener("scroll",update,{passive:true});update();
    return()=>{cancelAnimationFrame(frame);lenis.destroy();removeEventListener("scroll",update)};
  },[setProgress]);

  useEffect(()=>{
    if(lowMotion||slowConnection)return;
    const ctx=gsap.context(()=>{
      [fire.current,sky.current,fog.current].filter(Boolean).forEach(video=>{
        video.pause();
        ScrollTrigger.create({trigger:document.body,start:"top top",end:"bottom bottom",scrub:true,onUpdate:self=>{
          if(!Number.isFinite(video.duration)||video.duration<=0)return;
          try{video.currentTime=Math.min(video.duration-.04,self.progress*Math.min(video.duration,16))}catch{}
        }});
      });
      const fireLayer=document.querySelector("[data-media-fire]"),fogLayer=document.querySelector("[data-media-fog]"),skyLayer=document.querySelector("[data-media-sky]");
      if(fireLayer)gsap.to(fireLayer,{yPercent:12,scale:1.07,scrollTrigger:{trigger:document.body,start:"top top",end:"bottom bottom",scrub:true}});
      if(fogLayer)gsap.to(fogLayer,{yPercent:17,scale:1.08,scrollTrigger:{trigger:document.body,start:"top top",end:"bottom bottom",scrub:true}});
      if(skyLayer)gsap.to(skyLayer,{yPercent:7,scale:1.04,scrollTrigger:{trigger:document.body,start:"top top",end:"bottom bottom",scrub:true}});
    });
    return()=>ctx.revert();
  },[lowMotion,slowConnection]);

  const embers=useMemo(()=>Array.from({length:36},(_,i)=>({left:(i*19)%100,delay:(i%8)*.45,duration:4+(i%5)})),[]);
  const [fireFailed,setFireFailed]=useState(false),[skyFailed,setSkyFailed]=useState(false),[fogFailed,setFogFailed]=useState(false);
  return <div className="fixed inset-0 z-0 overflow-hidden bg-[#020204] media-world" aria-hidden="true">
    <div data-media-sky className="absolute inset-[-5%] media-layer media-sky" style={{background:FALLBACK.sky}}>{!skyFailed&&<video ref={sky} className="h-full w-full object-cover" src={MEDIA.sky} muted playsInline preload="metadata" onError={()=>setSkyFailed(true)}/>}</div>
    <div data-media-fog className="absolute inset-[-8%] media-layer media-fog" style={{background:FALLBACK.fog}}>{!fogFailed&&<video ref={fog} className="h-full w-full object-cover" src={MEDIA.fog} muted playsInline preload="none" onError={()=>setFogFailed(true)}/>}</div>
    <div data-media-fire className="absolute inset-x-[-4%] bottom-[-8%] h-[68%] media-layer media-fire" style={{backgroundImage:`url(${FALLBACK.fire})`,backgroundSize:"cover",backgroundPosition:"center bottom"}}>{!fireFailed&&<video ref={fire} className="h-full w-full object-cover object-bottom" src={MEDIA.fire} muted playsInline preload="none" onError={()=>setFireFailed(true)}/>}</div>
    <div className="absolute inset-x-[-5%] bottom-0 h-[70%] bg-gradient-to-t from-[#060100ee] via-[#2105009a] to-transparent"/>
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_25%,rgba(0,0,0,.38)_65%,rgba(0,0,0,.9)_100%)]"/>
    <div className="absolute inset-0 pointer-events-none overflow-hidden mix-blend-screen opacity-70">{embers.map((e,i)=><i key={i} className="ember" style={{left:`${e.left}%`,animationDelay:`${e.delay}s`,animationDuration:`${e.duration}s`}}/>)}</div>
    <div className="absolute inset-0 grain"/>
    <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/80"/>
  </div>;
}
