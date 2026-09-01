"use client";
import dynamic from "next/dynamic";

const MediaWorld = dynamic(() => import("../components/MediaWorld"), { ssr: false });
const Overlay = dynamic(() => import("../components/Overlay"), { ssr: false });

export default function Page() {
  return <div className="relative min-h-screen"><MediaWorld /><Overlay /></div>;
}
