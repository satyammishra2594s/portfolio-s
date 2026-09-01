// @ts-nocheck
"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette, Noise } from "@react-three/postprocessing";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import * as THREE from "three";
import { useEffect, useMemo, useRef, useState } from "react";
import { useWorldStore } from "../lib/store";

gsap.registerPlugin(ScrollTrigger);

function Terrain(){
  const geo=useMemo(()=>{
    const g=new THREE.PlaneGeometry(100,220,100,220),p=g.attributes.position;
    for(let i=0;i<p.count;i++){
      const x=p.getX(i),y=p.getY(i), road=Math.exp(-Math.pow(x/7,8));
      const bumps=(1-road)*(Math.sin(x*.55+y*.08)*.65+Math.sin(y*.19)*.4+Math.sin((x-y)*.11)*.3);
      p.setZ(i,bumps);
    }
    g.computeVertexNormals(); return g;
  },[]);
  return <mesh geometry={geo} rotation-x={-Math.PI/2} position={[0,-1,-70]} receiveShadow>
    <meshStandardMaterial color="#24100b" roughness={1} metalness={0}/>
  </mesh>;
}

function Road(){
  const blocks=useMemo(()=>Array.from({length:30},(_,i)=>({z:8-i*7.2,w:7.4+Math.sin(i)*.35})),[]);
  return <group position={[0,-.72,-65]}>
    <mesh rotation-x={-Math.PI/2}><planeGeometry args={[13,220]}/><meshStandardMaterial color="#11100e" roughness={.95}/></mesh>
    <mesh rotation-x={-Math.PI/2} position={[-6.15,.02,0]}><planeGeometry args={[.22,220]}/><meshStandardMaterial color="#ff5a16" emissive="#ff2800" emissiveIntensity={3}/></mesh>
    <mesh rotation-x={-Math.PI/2} position={[6.15,.02,0]}><planeGeometry args={[.22,220]}/><meshStandardMaterial color="#ff5a16" emissive="#ff2800" emissiveIntensity={3}/></mesh>
    {blocks.map((b,i)=><group key={i} position={[0,.04,b.z]}>
      <mesh rotation-x={-Math.PI/2}><planeGeometry args={[b.w,4.6]}/><meshStandardMaterial color={i%2?"#24201b":"#181614"} roughness={1}/></mesh>
      <mesh position={[-b.w/2+.35,.04,0]} rotation-x={-Math.PI/2}><planeGeometry args={[.14,4.2]}/><meshBasicMaterial color="#7d4528"/></mesh>
      <mesh position={[b.w/2-.35,.04,0]} rotation-x={-Math.PI/2}><planeGeometry args={[.14,4.2]}/><meshBasicMaterial color="#7d4528"/></mesh>
    </group>)}
    {Array.from({length:45},(_,i)=><mesh key={"rock"+i} position={[(Math.random()-.5)*17,-.15,10-i*4.8]} rotation={[Math.random(),Math.random(),Math.random()]}>
      <icosahedronGeometry args={[.18+Math.random()*.35,0]}/><meshStandardMaterial color="#30201a" roughness={1}/>
    </mesh>)}
  </group>;
}

function Gate({z,scale=1}){
  const left=useRef(null),right=useRef(null);
  useEffect(()=>{
    const trigger=ScrollTrigger.create({trigger:document.body,start:"top top",end:"bottom bottom",scrub:1,onUpdate:s=>{
      const start=THREE.MathUtils.clamp(Math.abs(z)/170-.04,0,.85),o=THREE.MathUtils.clamp((s.progress-start)/.1,0,1);
      if(left.current)left.current.rotation.y=-.75*o;
      if(right.current)right.current.rotation.y=.75*o;
    }});
    return()=>trigger.kill();
  },[z]);
  return <group position={[0,0,z]} scale={scale}>
    <mesh position={[-5,5,0]} castShadow><cylinderGeometry args={[.7,.95,10,12]}/><meshStandardMaterial color="#721b0b" roughness={.65}/></mesh>
    <mesh position={[5,5,0]} castShadow><cylinderGeometry args={[.7,.95,10,12]}/><meshStandardMaterial color="#721b0b" roughness={.65}/></mesh>
    <mesh position={[0,9.2,0]} castShadow><cylinderGeometry args={[.7,.85,12,12]}/><meshStandardMaterial color="#8b230d" roughness={.6}/></mesh>
    <mesh position={[0,9.8,0]} rotation-z={Math.PI/2}><torusGeometry args={[4.8,.42,10,32,Math.PI]}/><meshStandardMaterial color="#a83213" roughness={.5} emissive="#2c0802" emissiveIntensity={1}/></mesh>
    <group ref={left} position={[-2.45,4.5,.15]}><mesh><boxGeometry args={[4.7,7.3,.32]}/><meshStandardMaterial color="#260b07" roughness={.8}/></mesh><mesh position={[0,0,.2]}><boxGeometry args={[.12,6.8,.08]}/><meshStandardMaterial color="#7b2511" emissive="#2c0804" emissiveIntensity={1}/></mesh></group>
    <group ref={right} position={[2.45,4.5,.15]}><mesh><boxGeometry args={[4.7,7.3,.32]}/><meshStandardMaterial color="#260b07" roughness={.8}/></mesh><mesh position={[0,0,.2]}><boxGeometry args={[.12,6.8,.08]}/><meshStandardMaterial color="#7b2511" emissive="#2c0804" emissiveIntensity={1}/></mesh></group>
  </group>;
}

function Mountains(){
  return <group position={[0,0,-100]}>
    {Array.from({length:22},(_,i)=><mesh key={i} position={[(i-11)*7,5+(i%5)*2,-(i%4)*6]} scale={[1.4,1+(i%3)*.3,1]}>
      <coneGeometry args={[7,18+(i%5)*4,7]}/><meshStandardMaterial color="#050608" roughness={1}/>
    </mesh>)}
  </group>;
}

function Fire(){
  const light=useRef(null),flames=useRef([]);
  const items=useMemo(()=>Array.from({length:42},(_,i)=>({x:(Math.random()-.5)*24,y:.4+Math.random()*3,z:(Math.random()-.5)*13,s:.5+Math.random()*1.5,p:Math.random()*6.28})),[]);
  useFrame(({clock})=>{
    const t=clock.elapsedTime;
    if(light.current)light.current.intensity=12+Math.sin(t*9)*2+Math.sin(t*21);
    flames.current.forEach((m,i)=>{if(m){const d=items[i];m.scale.y=d.s*(1+.22*Math.sin(t*5+d.p));m.position.x=d.x+Math.sin(t*2+d.p)*.12;m.rotation.z=Math.sin(t*3+d.p)*.12;}});
  });
  return <group position={[0,-.3,-46]}>
    <pointLight ref={light} color="#ff3b0a" distance={70} intensity={12} castShadow shadow-mapSize-width={512} shadow-mapSize-height={512}/>
    {items.map((f,i)=><mesh ref={m=>flames.current[i]=m} key={i} position={[f.x,f.y,f.z]} scale={[f.s*.55,f.s*1.7,f.s*.55]}>
      <sphereGeometry args={[1,12,8]}/><meshStandardMaterial color="#ff4b0b" emissive="#ff2100" emissiveIntensity={6} roughness={.25}/>
    </mesh>)}
    {Array.from({length:20},(_,i)=><mesh key={"smoke"+i} position={[(i-10)*1.2,4+(i%5)*1.4,-(i%4)]} scale={[1.5+(i%3)*.4,1.8+(i%4)*.4,1.5]}>
      <sphereGeometry args={[1,8,6]}/><meshStandardMaterial color="#171311" transparent opacity={.2} roughness={1}/>
    </mesh>)}
  </group>;
}

function Embers(){
  const ref=useRef(null),dummy=useMemo(()=>new THREE.Object3D(),[]),count=420;
  const data=useMemo(()=>Array.from({length:count},()=>({x:(Math.random()-.5)*50,y:Math.random()*20,z:-Math.random()*175,s:.025+Math.random()*.07})),[]);
  useFrame(({clock})=>{if(!ref.current||useWorldStore.getState().reduced)return;data.forEach((v,i)=>{v.y+=.03;if(v.y>20)v.y=-1;v.x+=Math.sin(clock.elapsedTime+i)*.002;dummy.position.set(v.x,v.y,v.z);dummy.scale.setScalar(v.s);dummy.updateMatrix();ref.current.setMatrixAt(i,dummy.matrix)});ref.current.instanceMatrix.needsUpdate=true;});
  return <instancedMesh ref={ref} args={[undefined,undefined,count]}><sphereGeometry args={[1,5,5]}/><meshBasicMaterial color="#ff6b32"/></instancedMesh>;
}

function Samurai(){
  return <group position={[4,-.8,-42]} rotation-y={-.25}>
    <mesh position={[0,2.5,0]} castShadow><sphereGeometry args={[.65,12,8]}/><meshStandardMaterial color="#101217" metalness={.65} roughness={.35}/></mesh>
    <mesh position={[0,1.35,0]} castShadow><cylinderGeometry args={[.8,.95,2,10]}/><meshStandardMaterial color="#161922" metalness={.5}/></mesh>
    <mesh position={[-.55,.25,0]} rotation-z={-.12}><capsuleGeometry args={[.17,1.6,6,10]}/><meshStandardMaterial color="#20242c" metalness={.4}/></mesh>
    <mesh position={[.55,.25,0]} rotation-z={.12}><capsuleGeometry args={[.17,1.6,6,10]}/><meshStandardMaterial color="#20242c" metalness={.4}/></mesh>
    <mesh position={[1.2,1.1,0]} rotation-z={-.9}><boxGeometry args={[.1,3,.1]}/><meshStandardMaterial color="#e1e5eb" metalness={1} roughness={.15}/></mesh>
  </group>;
}

function CameraRig(){
  const {camera}=useThree(),reduced=useWorldStore(s=>s.reduced);
  useEffect(()=>{if(reduced)return;const state={p:0};const tween=gsap.to(state,{p:1,ease:"none",scrollTrigger:{trigger:document.body,start:"top top",end:"bottom bottom",scrub:1,onUpdate:s=>useWorldStore.getState().setProgress(s.progress)},onUpdate:()=>{camera.position.z=5-state.p*165;camera.position.y=2.4+Math.sin(state.p*Math.PI)*.45;camera.rotation.x=-.015}});return()=>{tween.kill();tween.scrollTrigger?.kill();};},[camera,reduced]);
  useFrame(()=>{if(!reduced)camera.position.x=THREE.MathUtils.lerp(camera.position.x,0,.035);});
  return null;
}

function Scene(){
  return <>
    <color attach="background" args={["#030304"]}/>
    <fogExp2 attach="fog" args={["#090709",.028]}/>
    <ambientLight intensity={.12}/>
    <directionalLight position={[-12,18,10]} intensity={.55} color="#8ba1c7" castShadow/>
    <Stars radius={150} depth={110} count={2200} factor={1.4} fade speed={.08}/>
    <mesh position={[20,23,-75]}><sphereGeometry args={[2.8,32,20]}/><meshBasicMaterial color="#e8edff"/></mesh>
    <Terrain/><Road/><Mountains/><Fire/><Embers/><Samurai/>
    <Gate z={-8} scale={1.15}/><Gate z={-55} scale={1.1}/><Gate z={-108} scale={1.12}/><Gate z={-150} scale={1.25}/>
    <CameraRig/>
    <EffectComposer><Bloom intensity={1.55} luminanceThreshold={.35} mipmapBlur/><Vignette darkness={.8}/><Noise opacity={.055}/></EffectComposer>
  </>;
}

export default function World(){
  const[ready,setReady]=useState(false);
  useEffect(()=>{useWorldStore.getState().setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);setReady(true);},[]);
  if(!ready)return <div className="fixed inset-0 z-50 grid place-items-center bg-black text-orange-300">FORGING THE WORLD…</div>;
  return <div className="fixed inset-0 z-0"><Canvas shadows dpr={[1,1.5]} camera={{position:[0,2.4,5],fov:58}} gl={{antialias:true,toneMapping:THREE.ACESFilmicToneMapping,toneMappingExposure:1.05}}><Scene/></Canvas></div>;
}