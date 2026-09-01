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
    const g = new THREE.PlaneGeometry(70, 190, 60, 140);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      const y = p.getY(i);
      p.setZ(i, Math.sin(x * 0.25) * 0.7 + Math.sin(y * 0.11) * 0.6 + Math.sin((x + y) * 0.05) * 0.7);
    }
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <mesh geometry={geometry} rotation-x={-Math.PI / 2} position={[0, -1, -55]} receiveShadow>
      <meshStandardMaterial color="#160d0a" roughness={1} />
    </mesh>
  );
}

function Mountains() {
  const mountains = Array.from({ length: 14 }, (_, i) => i);
  return (
    <group position={[0, 2, -85]}>
      {mountains.map((i) => (
        <mesh key={i} position={[(i - 7) * 9, 6 + (i % 4) * 2, -(i % 3) * 3]}>
          <coneGeometry args={[8, 12 + (i % 4) * 3, 6]} />
          <meshStandardMaterial color="#05070a" roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

function Fire() {
  const light = useRef(null);
  useFrame(({ clock }) => {
    if (light.current) light.current.intensity = 7 + Math.sin(clock.elapsedTime * 9) * 1.5;
  });
  return (
    <group position={[0, 0, -32]}>
      <pointLight ref={light} color="#ff4b18" distance={45} intensity={8} />
      <mesh position={[0, 3, 0]} scale={[6, 8, 2]}>
        <coneGeometry args={[0.8, 2, 12]} />
        <meshBasicMaterial color="#ff4b18" transparent opacity={0.9} />
      </mesh>
      <mesh position={[0, 1, 0]}>
        <sphereGeometry args={[2.4, 20, 12]} />
        <meshStandardMaterial color="#ff5b17" emissive="#ff2600" emissiveIntensity={5} />
      </mesh>
      <mesh position={[-1.5, 2, 0]} scale={[0.7, 1.8, 0.7]}>
        <coneGeometry args={[0.8, 2, 10]} />
        <meshBasicMaterial color="#ff9b32" />
      </mesh>
      <mesh position={[1.3, 2.2, 0]} scale={[0.6, 2.2, 0.6]}>
        <coneGeometry args={[0.8, 2, 10]} />
        <meshBasicMaterial color="#ffcc66" />
      </mesh>
    </group>
  );
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
      <Terrain />
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
