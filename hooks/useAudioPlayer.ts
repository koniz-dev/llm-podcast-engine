"use client"

import { useRef, useState } from "react"

export const useAudioPlayer = () => {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isAudioLoading, setIsAudioLoading] = useState(true)

  return { audioRef, isAudioLoading, setIsAudioLoading }
}

