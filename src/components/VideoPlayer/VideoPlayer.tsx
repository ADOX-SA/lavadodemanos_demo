"use client";
import React, { useEffect, useRef, useState } from "react";
import labels from "../../utils/labels.json";
import styles from "./spinner.module.css";

interface VideoCacheEntry {
  status: "loading" | "loaded" | "error";
  videoEl: HTMLVideoElement;
}

interface VideoPlayerProps {
  step: number;
  width?: number;
  height?: number;
  onProgress?: (percent: number) => void;
}

export default function VideoPlayer({
  step,
  width = 480,
  height = 600,
  onProgress
}: VideoPlayerProps) {
  const basePath = "/Pasos/Paso";
  const videoSrcs = labels.map((_, i) => `${basePath}${i + 1}.mp4`);
  const videoCache = useRef<Map<string, VideoCacheEntry>>(new Map());
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const currentVideoRef = useRef<HTMLVideoElement | null>(null);
  const [ , setCachedCount] = useState(0);
  const totalVideos = videoSrcs.length;

  // Precarga videos usando la caché del navegador
const preloadVideos = async () => {
  const cache = await caches.open("videos-cache");

  // 1️⃣ PRIMERA FASE: guardar en caché solo si NO está ya guardado y marcar progreso
  await Promise.all(
  videoSrcs.map(async (src) => {
    const alreadyInCache = await cache.match(src);
    if (!alreadyInCache) {
      try {
        const response = await fetch(src);
        await cache.put(src, response.clone());
        console.log(`✅ Guardado en caché: ${src}`);
      } catch (error) {
        console.error(`❌ Error guardando ${src}:`, error);
      }
    } else {
      console.log(`ℹ️ Ya estaba en caché: ${src}`);
    }

    // Aumentar el contador y emitir el progreso
    setCachedCount((prev) => {
      const next = prev + 1;
      const percent = (next / totalVideos) * 100;
      setTimeout(() => {
        onProgress?.(percent);
      }, 0);
      
    return next;
    });
  })
);

  // 2️⃣ SEGUNDA FASE: leer desde la caché y crear los elementos de video
  await Promise.all(
    videoSrcs.map(async (src) => {
      if (videoCache.current.has(src)) return;

      try {
        const cachedResponse = await cache.match(src);
        if (cachedResponse) {
          const blob = await cachedResponse.blob();
          const blobUrl = URL.createObjectURL(blob);
          createVideoElement(src, blobUrl);
        }
      } catch (error) {
        console.error(`❌ Error cargando ${src} desde caché:`, error);
        createVideoElement(src, src); // fallback
      }
    })
  );
};



  const createVideoElement = (src: string, url: string) => {
    const video = document.createElement("video");
    video.src = url;
    video.preload = "auto";
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.autoplay = false; // Cambiado a false
    video.width = width;
    video.height = height;

    video.addEventListener("canplaythrough", () => {
      const entry = videoCache.current.get(src);
      if (entry) entry.status = "loaded";
      checkAllLoaded();
    });

    video.addEventListener("error", () => {
      const entry = videoCache.current.get(src);
      if (entry) entry.status = "error";
      checkAllLoaded();
    });

    videoCache.current.set(src, {
      status: "loading",
      videoEl: video,
    });

    video.load();
  };

  const checkAllLoaded = () => {
    const allLoaded = [...videoCache.current.values()].every(
      (entry) => entry.status === "loaded"
    );
    setLoading(!allLoaded);
  };

  useEffect(() => {
    preloadVideos();
    
    return () => {
      videoCache.current.forEach((entry) => {
        if (entry.videoEl.src.startsWith("blob:")) {
          URL.revokeObjectURL(entry.videoEl.src);
        }
      });
    };
  }, []);

  // Efecto para manejar la reproducción cuando cambia el paso
  useEffect(() => {
    if (loading) return;
    
    const src = videoSrcs[step - 1];
    const entry = videoCache.current.get(src);
    
    if (!entry || entry.status !== "loaded") return;

    const video = entry.videoEl;
    
    // Solo cambiar si es un video nuevo
    if (currentVideoRef.current !== video) {
      if (containerRef.current) {
        // Limpiar contenedor antes de agregar nuevo video
        containerRef.current.innerHTML = '';
        containerRef.current.appendChild(video);
        currentVideoRef.current = video;
      }
    }
    
    // Forzar reproducción
    video.play().catch(e => console.error("Error al reproducir:", e));
    
  }, [step, loading]);

  return (
    <div>
      {loading && <div className={styles.spinner}></div>}
      <div ref={containerRef} />
    </div>
  );
}