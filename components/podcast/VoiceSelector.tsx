"use client"

import { useEffect, useState } from "react"
import { Voice } from "@/types/podcast"
import { Loader2 } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface VoiceSelectorProps {
  selectedVoiceId: string | null
  onVoiceChange: (voiceId: string) => void
}

export const VoiceSelector = ({ selectedVoiceId, onVoiceChange }: VoiceSelectorProps) => {
  const [voices, setVoices] = useState<Voice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchVoices = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/voices')
        
        if (!response.ok) {
          throw new Error('Failed to fetch voices')
        }
        
        const data = await response.json()
        setVoices(data.voices || [])
        
        // Auto-select first voice if none selected
        if (!selectedVoiceId && data.voices && data.voices.length > 0) {
          onVoiceChange(data.voices[0].voice_id)
        }
      } catch (err) {
        console.error('Error fetching voices:', err)
        setError('Failed to load voices. Using default voice.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchVoices()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading voices...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-sm text-orange-400">
        {error}
      </div>
    )
  }

  if (voices.length === 0) {
    return (
      <div className="text-sm text-gray-400">
        No voices available
      </div>
    )
  }

  const selectedVoice = voices.find(v => v.voice_id === selectedVoiceId)

  return (
    <div className="space-y-2">
      <label className="text-sm text-gray-300">Voice:</label>
      <Select
        value={selectedVoiceId || undefined}
        onValueChange={onVoiceChange}
      >
        <SelectTrigger className="w-full bg-gray-800 text-white border-orange-500 hover:bg-gray-700">
          <SelectValue placeholder="Select a voice">
            {selectedVoice 
              ? `${selectedVoice.name}${selectedVoice.description ? ` - ${selectedVoice.description}` : ''}`
              : 'Select a voice'
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-gray-800 border-orange-500">
          {voices.map((voice) => (
            <SelectItem
              key={voice.voice_id}
              value={voice.voice_id}
              className="text-white focus:bg-gray-700 focus:text-white"
            >
              {voice.name}{voice.description ? ` - ${voice.description}` : ''}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

