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

function Terrain() {
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(80, 210, 80, 180);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i);
      const road = Math.exp(-Math.pow(x / 5.8, 8));
      const edge = (1 - road) * (Math.sin(x * .65 + y * .08) * .45 + Math.sin(y * .16) * .35);
      p.setZ(i, edge + Math.sin(x * .17) * .25);
    }
    g.computeVertexNormals();
    return g;
  }, []);
  return <mesh geometry={geometry} rotation-x={-Math.PI/2} position={[0,-1,-55]} receiveShadow>
    <meshStandardMaterial color="#24130d" roughness={1}/>
  </mesh>;
}

function Road() {
  return <group position={[0,-.82,-62]}>
    <mesh rotation-x={-Math.PI/2} position={[0,0,0]}>
      <planeGeometry args={[11,205,1,1]}/>
      <meshStandardMaterial color="#0b0908" roughness={.98}/>
    </mesh>
    <mesh rotation-x={-Math.PI/2} position={[-5.35,.03,0]}>
      <planeGeometry args={[.16,205]}/>
      <meshBasicMaterial color="#d96b22" emissive="#ff3b0a" emissiveIntensity={2}/>
    </mesh>
    <mesh rotation-x={-Math.PI/2} position={[5.35,.03,0]}>
      <planeGeometry args={[.16,205]}/>
      <meshBasicMaterial color="#d96b22" emissive="#ff3b0a" emissiveIntensity={2}/>
    </mesh>
    {Array.from({length:22},(_,i)=><mesh key={i} rotation-x={-Math.PI/2} position={[0,.04,5-i*9]}>
      <planeGeometry args={[.45,3.8]}/>
      <meshBasicMaterial color="#8d5a35"/>
    </mesh>)}
  </group>;
}

function Mountains() {
  return <group position={[0,2,-92]}>
    {Array.from({length:18},(_,i)=><mesh key={i} position={[(i-9)*8,6+(i%5)*2,-(i%4)*5]}>
      <coneGeometry args={[9,14+(i%5)*3,6]}/>
      <meshStandardMaterial color="#070709" roughness={1}/>
    </mesh>)}
  </group>;
}

function Fire() {
  const group = useRef(null), light = useRef(null);
  const flames = useMemo(() => Array.from({length:34},(_,i)=>({
    x:(Math.random()-.5)*18, z:(Math.random()-.5)*10, s:.7+Math.random()*1.8, phase:Math.random()*6.28
  })),[]);
  useFrame(({clock}) => {
    const t=clock.elapsedTime;
    if(light.current) light.current.intensity=10+Math.sin(t*8)*2+Math.sin(t*19)*.7;
    if(group.current) group.current.children.forEach((m,i)=>{
      if(m.isMesh && i>0){ const d=flames[i-1]; m.scale.y=d.s*(1+.14*Math.sin(t*5+d.phase)); m.rotation.z=Math.sin(t*3+d.phase)*.08; }
    });
  });
  return <group ref={group} position={[0,-.3,-48]}>
    <pointLight ref={light} color="#ff3b0a" distance={60} intensity={11}/>
    {flames.map((f,i)=><mesh key={i} position={[f.x,.8+Math.random()*2,f.z]} scale={[f.s*.55,f.s*1.8,f.s*.55]}>
      <sphereGeometry args={[1,10,8]}/>
      <meshStandardMaterial color="#ff4b12" emissive="#ff2500" emissiveIntensity={4}/>
    </mesh>)}
    {Array.from({length:18},(_,i)=><mesh key={"smoke"+i} position={[(i-9)*1.3,5+(i%4)*1.7,-(i%5)]}>
      <sphereGeometry args={[1.4+(i%3)*.5,8,6]}/>
      <meshBasicMaterial color="#17100e" transparent opacity={.22}/>
    </mesh>)}
  </group>;
}

function Embers() {
  const ref = useRef(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const count = 350;
  const data = useMemo(
    () => Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * 45,
      y: Math.random() * 18,
      z: -Math.random() * 155,
      s: 0.03 + Math.random() * 0.08
    })),
    []
  );
  useFrame(({ clock }) => {
    if (!ref.current || useWorldStore.getState().reduced) return;
    data.forEach((v, i) => {
      v.y += 0.025;
      if (v.y > 19) v.y = -1;
      v.x += Math.sin(clock.elapsedTime + i) * 0.001;
      dummy.position.set(v.x, v.y, v.z);
      dummy.scale.setScalar(v.s);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 5, 5]} />
      <meshBasicMaterial color="#ff6330" />
    </instancedMesh>
  );
}

function Gate({ z }) {
  const left = useRef(null);
  const right = useRef(null);
  useEffect(() => {
    const trigger = ScrollTrigger.create({
      trigger: document.body,
      start: "top top",
      end: "bottom bottom",
      scrub: 1,
      onUpdate: (self) => {
        const start = Math.max(Math.min(Math.abs(z) / 180 - 0.06, 0.8), 0);
        const open = THREE.MathUtils.clamp((self.progress - start) / 0.1, 0, 1);
        if (left.current) left.current.rotation.y = 0.8 * open;
        if (right.current) right.current.rotation.y = -0.8 * open;
      }
    });
    return () => trigger.kill();
  }, [z]);
  return (
    <group position={[0, 3, z]}>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 5, 0, 0]} castShadow>
          <cylinderGeometry args={[0.7, 0.9, 12, 10]} />
          <meshStandardMaterial color="#4a140a" emissive="#300b05" emissiveIntensity={1} />
        </mesh>
      ))}
      <mesh position={[0, 8, 0]}>
        <boxGeometry args={[14, 1, 1]} />
        <meshStandardMaterial color="#741c0b" emissive="#3c0d05" emissiveIntensity={1} />
      </mesh>
      <group ref={left} position={[-3.2, 4.5, 0]}>
        <mesh><boxGeometry args={[4.6, 7, 0.4]} /><meshStandardMaterial color="#45120a" /></mesh>
      </group>
      <group ref={right} position={[3.2, 4.5, 0]}>
        <mesh><boxGeometry args={[4.6, 7, 0.4]} /><meshStandardMaterial color="#45120a" /></mesh>
      </group>
    </group>
  );
}

function Samurai() {
  return (
    <group position={[4, -0.8, -42]}>
      <mesh position={[0, 2.3, 0]} castShadow><sphereGeometry args={[0.65, 8, 6]} /><meshStandardMaterial color="#15171b" metalness={0.5} /></mesh>
      <mesh position={[0, 1.2, 0]} castShadow><cylinderGeometry args={[0.75, 0.9, 1.8, 8]} /><meshStandardMaterial color="#17191f" metalness={0.4} /></mesh>
      <mesh position={[-0.55, 0.2, 0]} rotation-z={-0.12}><capsuleGeometry args={[0.16, 1.5, 5, 8]} /><meshStandardMaterial color="#24262b" /></mesh>
      <mesh position={[0.55, 0.2, 0]} rotation-z={0.12}><capsuleGeometry args={[0.16, 1.5, 5, 8]} /><meshStandardMaterial color="#24262b" /></mesh>
      <mesh position={[1.15, 1.1, 0]} rotation-z={-0.9}><boxGeometry args={[0.12, 2.7, 0.12]} /><meshStandardMaterial color="#d7d9dd" metalness={0.9} /></mesh>
    </group>
  );
}

function CameraRig() {
  const { camera } = useThree();
  const reduced = useWorldStore((s) => s.reduced);
  useEffect(() => {
    if (reduced) return;
    const state = { p: 0 };
    const tween = gsap.to(state, {
      p: 1,
      ease: "none",
      scrollTrigger: {
        trigger: document.body,
        start: "top top",
        end: "bottom bottom",
        scrub: 1,
        onUpdate: (self) => useWorldStore.getState().setProgress(self.progress)
      },
      onUpdate: () => {
        camera.position.z = 5 - state.p * 145;
      }
    });
    return () => {
      tween.kill();
      tween.scrollTrigger?.kill();
    };
  }, [camera, reduced]);
  useFrame(() => {
    if (!reduced) {
      camera.position.x = THREE.MathUtils.lerp(camera.position.x, 0, 0.04);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, 2.2, 0.04);
    }
  });
  return null;
}

function Scene() {
  return (
    <>
      <color attach="background" args={["#020306"]} />
      <fogExp2 attach="fog" args={["#09070a", 0.034]} />
      <ambientLight intensity={0.18} />
      <directionalLight position={[-8, 15, 8]} intensity={0.5} color="#9aaed0" />
      <Stars radius={120} depth={90} count={1800} factor={1.5} fade speed={0.12} />
      <mesh position={[18, 22, -65]}>
        <sphereGeometry args={[2.4, 24, 16]} />
        <meshBasicMaterial color="#dbe4ff" />
      </mesh>
      <Terrain />\n      <Road />
      <Mountains />
      <Fire />
      <Embers />
      <Samurai />
      <Gate z={-8} />
      <Gate z={-55} />
      <Gate z={-105} />
      <Gate z={-142} />
      <CameraRig />
      <EffectComposer>
        <Bloom intensity={1.2} luminanceThreshold={0.5} mipmapBlur />
        <Vignette darkness={0.72} />
        <Noise opacity={0.07} />
      </EffectComposer>
    </>
  );
}

export default function World() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    useWorldStore.getState().setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    setReady(true);
  }, []);
  if (!ready) return <div className="fixed inset-0 z-50 grid place-items-center bg-black text-orange-300">FORGING THE WORLD…</div>;
  return (
    <div className="fixed inset-0 z-0">
      <Canvas shadows dpr={[1, 1.5]} camera={{ position: [0, 2.2, 5], fov: 55 }} gl={{ antialias: true }}>
        <Scene />
      </Canvas>
    </div>
  );
}
