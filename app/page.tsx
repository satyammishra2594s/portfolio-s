"use client";
import dynamic from "next/dynamic";
const World=dynamic(()=>import("../components/World"),{ssr:false});
const Overlay=dynamic(()=>import("../components/Overlay"),{ssr:false});
export default function Page(){return <><World/><Overlay/></>}