"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import {
  API_ENDPOINT,
  AUDIO_READY_MESSAGE,
  CONNECTION_FAILED_MESSAGE,
  TOAST_DURATION,
} from "@/constants/podcast"
import { createStreamParser } from "@/lib/podcast"
import type { PodcastState, StreamMessage } from "@/types/podcast"

const initialState: PodcastState = {
  isLoading: false,
  newsScript: '',
  currentStatus: '',
  showAudio: false,
  audioSrc: '',
  isExpanded: false,
}

export const usePodcastGeneration = (urls: string[], voiceId: string | null) => {
  const [state, setState] = useState<PodcastState>(initialState)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => () => abortControllerRef.current?.abort(), [])

  const resetState = useCallback(() => {
    setState({
      ...initialState,
      isLoading: true,
      isExpanded: true,
      currentStatus: 'Starting podcast generation...',
    })
  }, [])

  const handleStreamMessage = useCallback((data: StreamMessage) => {
    switch (data.type) {
      case 'update':
        setState((previous) => ({ ...previous, currentStatus: data.message || '' }))
        break
      case 'content':
        setState((previous) => ({ ...previous, newsScript: previous.newsScript + (data.content || '') }))
        break
      case 'complete':
        setState((previous) => ({
          ...previous,
          audioSrc: data.audioUrl || '',
          showAudio: Boolean(data.audioUrl),
          isLoading: false,
          currentStatus: AUDIO_READY_MESSAGE,
        }))
        break
      case 'error':
        toast.error('Generation failed', { description: data.message, duration: TOAST_DURATION })
        setState((previous) => ({
          ...previous,
          isLoading: false,
          currentStatus: `Error: ${data.message || 'Unknown error'}`,
        }))
        break
    }
  }, [])

  const cancelPodcast = useCallback(() => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    setState((previous) => ({
      ...previous,
      isLoading: false,
      currentStatus: 'Generation cancelled.',
    }))
  }, [])

  const generatePodcast = useCallback(async () => {
    if (!voiceId) {
      toast.error('Select a voice before generating a podcast')
      return
    }

    abortControllerRef.current?.abort()
    const abortController = new AbortController()
    abortControllerRef.current = abortController
    resetState()

    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls, voiceId }),
        signal: abortController.signal,
      })

      if (!response.ok) {
        const body = await response.json().catch(() => null) as { error?: string } | null
        throw new Error(body?.error || `Request failed with status ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('Response body is not readable')

      const decoder = new TextDecoder()
      const parser = createStreamParser(handleStreamMessage)
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        parser.push(decoder.decode(value, { stream: true }))
      }
      parser.push(decoder.decode())
      parser.finish()
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      const errorMessage = error instanceof Error ? error.message : CONNECTION_FAILED_MESSAGE
      toast.error('Connection failed', { description: errorMessage, duration: TOAST_DURATION })
      setState((previous) => ({
        ...previous,
        isLoading: false,
        currentStatus: `Error: ${errorMessage}`,
      }))
    } finally {
      if (abortControllerRef.current === abortController) abortControllerRef.current = null
    }
  }, [urls, voiceId, resetState, handleStreamMessage])

  return { ...state, generatePodcast, cancelPodcast }
}

