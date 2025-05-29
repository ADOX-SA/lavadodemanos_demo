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
}

export default function VideoPlayer({
  step,
  width = 480,
  height = 600,
}: VideoPlayerProps) {
  const basePath = "/Pasos/Paso";
  const videoSrcs = labels.map((_, i) => `${basePath}${i + 1}.mp4`);
  const videoCache = useRef<Map<string, VideoCacheEntry>>(new Map());
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const currentVideoRef = useRef<HTMLVideoElement | null>(null);

  // Precarga videos usando la caché del navegador
  const preloadVideos = async () => {
    const cachePromises = videoSrcs.map(async (src) => {
      if (videoCache.current.has(src)) return;

      try {
        const cache = await caches.open("videos-cache");
        const cachedResponse = await cache.match(src);
        
        if (cachedResponse) {
          const blob = await cachedResponse.blob();
          const blobUrl = URL.createObjectURL(blob);
          createVideoElement(src, blobUrl);
        } else {
          const response = await fetch(src);
          const responseClone = response.clone();
          cache.put(src, responseClone);
          createVideoElement(src, src);
        }
      } catch (error) {
        console.error("Error caching video:", error);
        createVideoElement(src, src);
      }
    });

    await Promise.all(cachePromises);
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