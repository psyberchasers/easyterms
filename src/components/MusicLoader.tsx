"use client";

import Lottie from "lottie-react";
import loadMusicAnimation from "@/../public/loadmusic.json";

export function MusicLoader({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-24 h-24",
    lg: "w-32 h-32",
  };

  return (
    <div className={sizeClasses[size]}>
      <Lottie animationData={loadMusicAnimation} loop={true} />
    </div>
  );
}




