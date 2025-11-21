"use client"

import { useCallback, useEffect, useRef, useState } from "react"

export const useAudioPlayer = () => {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isAudioLoading, setIsAudioLoading] = useState(false)

  const togglePlayPause = useCallback(() => {
    if (!audioRef.current) return
    
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }, [isPlaying])

  const handleLoadedData = useCallback(() => {
    setIsAudioLoading(false)
  }, [])

  const handleEnded = useCallback(() => {
    setIsPlaying(false)
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    audio.addEventListener('loadeddata', handleLoadedData)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('loadeddata', handleLoadedData)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [handleLoadedData, handleEnded])

  return {
    audioRef,
    isPlaying,
    isAudioLoading,
    setIsAudioLoading,
    togglePlayPause,
  }
}

