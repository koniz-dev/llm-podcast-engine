"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { AlertCircle, KeyRound, Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Voice } from "@/types/podcast"

interface VoiceSelectorProps {
  selectedVoiceId: string | null
  onVoiceChange: (voiceId: string) => void
}

export const VoiceSelector = ({ selectedVoiceId, onVoiceChange }: VoiceSelectorProps) => {
  const [voices, setVoices] = useState<Voice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [needsApiKey, setNeedsApiKey] = useState(false)
  const selectedVoiceIdRef = useRef(selectedVoiceId)
  selectedVoiceIdRef.current = selectedVoiceId

  const fetchVoices = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    setNeedsApiKey(false)
    try {
      const statusResponse = await fetch('/api/status', { cache: 'no-store' })
      const status = await statusResponse.json().catch(() => null) as { missingVariables?: string[] } | null
      if (status?.missingVariables?.includes('ELEVENLABS_API_KEY')) {
        setNeedsApiKey(true)
        return
      }

      const response = await fetch('/api/voices', { cache: 'no-store' })
      const data = await response.json().catch(() => null) as { voices?: Voice[]; error?: string } | null
      if (!response.ok) throw new Error(data?.error || 'Failed to fetch voices')

      const nextVoices = data?.voices || []
      setVoices(nextVoices)
      const selectionStillExists = nextVoices.some((voice) => voice.voice_id === selectedVoiceIdRef.current)
      if (!selectionStillExists && nextVoices[0]) onVoiceChange(nextVoices[0].voice_id)
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to load voices')
    } finally {
      setIsLoading(false)
    }
  }, [onVoiceChange])

  useEffect(() => {
    fetchVoices()
  }, [fetchVoices])

  if (isLoading && voices.length === 0) {
    return (
      <div className="flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin text-orange-400" /> Loading ElevenLabs voices…
      </div>
    )
  }

  if (needsApiKey) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-slate-500">
        <span className="flex items-center gap-2"><KeyRound className="h-4 w-4 text-amber-400/70" /> Add ELEVENLABS_API_KEY to choose a voice</span>
        <Button type="button" variant="ghost" size="sm" onClick={fetchVoices} className="h-8 shrink-0 text-slate-500 hover:bg-white/5 hover:text-white">
          <RefreshCw className="h-3.5 w-3.5" /><span className="sr-only">Retry</span>
        </Button>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2.5 text-sm text-red-200">
        <span className="flex min-w-0 items-center gap-2"><AlertCircle className="h-4 w-4 shrink-0" /><span className="truncate">{error}</span></span>
        <Button type="button" variant="ghost" size="sm" onClick={fetchVoices} className="h-8 shrink-0 text-red-200 hover:bg-red-500/10 hover:text-white">
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Retry
        </Button>
      </div>
    )
  }

  const selectedVoice = voices.find((voice) => voice.voice_id === selectedVoiceId)

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="text-sm font-medium text-slate-300">Narrator voice</label>
        <span className="text-xs text-slate-600">{voices.length} available</span>
      </div>
      <Select value={selectedVoiceId || undefined} onValueChange={onVoiceChange} disabled={voices.length === 0 || isLoading}>
        <SelectTrigger className="h-11 w-full border-white/10 bg-black/25 text-white hover:bg-white/5 focus:ring-orange-400/20">
          <SelectValue placeholder="Select a voice">
            {selectedVoice ? selectedVoice.name : 'Select a voice'}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-w-[min(32rem,calc(100vw-2rem))] border-white/10 bg-[#151922] text-white">
          {voices.map((voice) => (
            <SelectItem key={voice.voice_id} value={voice.voice_id} className="focus:bg-white/10 focus:text-white">
              <span className="font-medium">{voice.name}</span>
              {voice.description ? <span className="ml-2 text-xs text-slate-500">{voice.description}</span> : null}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
