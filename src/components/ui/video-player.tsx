"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface VideoPlayerProps {
  src: string
  className?: string
  controls?: boolean
  autoPlay?: boolean
  muted?: boolean
  loop?: boolean
  poster?: string
  width?: string | number
  height?: string | number
}

export function VideoPlayer({
  src,
  className,
  controls = true,
  autoPlay = false,
  muted = false,
  loop = false,
  poster,
  width = "100%",
  height = "auto",
  ...props
}: VideoPlayerProps & React.VideoHTMLAttributes<HTMLVideoElement>) {
  return (
    <div className={cn("w-full overflow-hidden rounded-xl", className)}>
      <video
        src={src}
        controls={controls}
        autoPlay={autoPlay}
        muted={muted}
        loop={loop}
        poster={poster}
        width={width}
        height={height}
        className="w-full h-full object-cover"
        {...props}
      />
    </div>
  )
} 