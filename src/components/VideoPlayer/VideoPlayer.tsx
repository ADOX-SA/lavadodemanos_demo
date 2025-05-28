"use client";
import { useRef, useEffect, useState } from "react";
import styles from "./spinner.module.css"; // si usás un spinner visual

interface VideoPlayerProps {
  step: number;
  width?: number;
  height?: number;
  preloadNext?: number; // paso siguiente para precargar
}

export default function VideoPlayer({
  step,
  width = 480,
  height = 600,
  preloadNext,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const videoEl = videoRef.current;
  if (!videoEl) return;

  const handleLoadedData = () => {
    console.log("✅ Video listo");
    setLoading(false);
  };

  const handleLoadStart = () => {
    console.log("🔄 Iniciando carga del video");
    setLoading(true);
  };

  videoEl.addEventListener("loadeddata", handleLoadedData);
  videoEl.addEventListener("loadstart", handleLoadStart);

  // Si el video ya está cargado antes de que se monten los eventos
  if (videoEl.readyState >= 2) {
    console.log("⚠️ Video ya estaba cargado");
    setLoading(false);
  }

  return () => {
    videoEl.removeEventListener("loadeddata", handleLoadedData);
    videoEl.removeEventListener("loadstart", handleLoadStart);
  };
}, [step]);


  useEffect(() => {
    console.log(`Precargando video del paso ${preloadNext}`);
    if (preloadNext === undefined) return;
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "video";
    link.href = `/Pasos/Paso${preloadNext}.mp4`;
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, [preloadNext]);

  return (
    <div>
      {loading && <div className={styles.spinner}></div>}

      <video
        ref={videoRef}
        key={step}
        width={width}
        height={height}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        style={{ display: loading ? "none" : "block" }}
      >
        <source src={`/Pasos/Paso${step}.mp4`} type="video/mp4" />
        Tu navegador no soporta el elemento de video.
      </video>
    </div>
  );
}
