"use client"

import { useCallback, useState } from "react"
import { toast } from "sonner"
import { 
  API_ENDPOINT, 
  AUDIO_READY_MESSAGE, 
  CONNECTION_FAILED_MESSAGE, 
  TOAST_DURATION 
} from "@/constants/podcast"
import { parseStreamMessage } from "@/lib/podcast"
import { PodcastState, StreamMessage } from "@/types/podcast"

export const usePodcastGeneration = (urls: string[], voiceId: string | null) => {
  const [state, setState] = useState<PodcastState>({
    isLoading: false,
    newsScript: '',
    currentStatus: '',
    showAudio: false,
    audioSrc: '',
    isExpanded: false,
  })

  const resetState = useCallback(() => {
    setState({
      isLoading: true,
      newsScript: '',
      currentStatus: '',
      showAudio: false,
      audioSrc: '',
      isExpanded: true,
    })
  }, [])

  const handleStreamMessage = useCallback((data: StreamMessage) => {
    switch (data.type) {
      case 'update':
        setState(prev => ({ ...prev, currentStatus: data.message || '' }))
        break
      case 'content':
        setState(prev => ({ ...prev, newsScript: prev.newsScript + (data.content || '') }))
        break
      case 'complete':
        setState(prev => ({
          ...prev,
          audioSrc: `/${data.audioFileName || ''}`,
          showAudio: true,
          isLoading: false,
          currentStatus: AUDIO_READY_MESSAGE,
        }))
        break
      case 'error':
        console.error('Error:', data.message)
        toast.error('Error', {
          description: data.message,
          duration: TOAST_DURATION,
        })
        setState(prev => ({
          ...prev,
          isLoading: false,
          currentStatus: `Error: ${data.message || ''}`,
        }))
        break
    }
  }, [])

  const generatePodcast = useCallback(async () => {
    resetState()

    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ urls, voiceId }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('Response body is not readable')
      }

      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n\n')

        for (const line of lines) {
          const data = parseStreamMessage(line)
          if (data) {
            handleStreamMessage(data)
          }
        }
      }
    } catch (error) {
      console.error('Fetch failed:', error)
      const errorMessage = error instanceof Error 
        ? error.message 
        : CONNECTION_FAILED_MESSAGE
      
      toast.error('Connection Failed', {
        description: errorMessage,
        duration: TOAST_DURATION,
      })
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        currentStatus: CONNECTION_FAILED_MESSAGE,
      }))
    }
  }, [urls, voiceId, resetState, handleStreamMessage])

  return {
    ...state,
    generatePodcast,
  }
}

