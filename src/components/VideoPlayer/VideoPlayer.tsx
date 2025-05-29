"use client";
import React, { useEffect, useRef, useState } from "react";
import labels from "../../utils/labels.json"; 
import styles from "./spinner.module.css"; 

interface VideoPlayerProps {
  step: number;           // paso activo (1-based)
  width?: number;
  height?: number;
}

export default function VideoPlayer({
  step,
  width = 480,
  height = 600,
}: VideoPlayerProps) {
  const basePath = "/Pasos/Paso";
  const count = labels.length; // Total de pasos (videos)

  const [loading, setLoading] = useState(true);
  const videosRef = useRef<HTMLVideoElement[]>([]);
  const visibleVideoRef = useRef<HTMLVideoElement>(null);

  // Precargar videos sólo 1 vez
  useEffect(() => {
    // Limpio videos anteriores (por si acaso)
    videosRef.current.forEach((video) => {
      video.pause();
      video.src = "";
    });
    videosRef.current = [];

    setLoading(true);
    let loadedCount = 0;

    const onVideoLoaded = () => {
      loadedCount++;
      if (loadedCount === count) {
        setLoading(false);
      }
    };

    for (let i = 0; i < count; i++) {
      const video = document.createElement("video");
      video.src = `${basePath}${i + 1}.mp4`;
      video.preload = "auto";
      video.muted = true;
      video.load();
      video.addEventListener("loadeddata", onVideoLoaded);
      videosRef.current.push(video);
    }

    return () => {
      videosRef.current.forEach((video) =>
        video.removeEventListener("loadeddata", onVideoLoaded)
      );
      videosRef.current = [];
    };
  }, []);  // SOLO una vez al montar

  useEffect(() => {
    if (loading) return;

    const visibleVideo = visibleVideoRef.current;
    if (!visibleVideo) return;

    visibleVideo.src = `${basePath}${step}.mp4`;
    visibleVideo.load();
    visibleVideo.play().catch(() => {
    });
  }, [step, loading]);

  return (
    <div>
      {loading && <div className={styles.spinner}></div>}

      <video
        ref={visibleVideoRef}
        width={width}
        height={height}
        autoPlay
        muted
        loop
        playsInline
        style={{ display: loading ? "none" : "block" }}
      />
    </div>
  );
}
