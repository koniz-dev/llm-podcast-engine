export interface StreamMessage {
  type: 'update' | 'content' | 'complete' | 'error'
  message?: string
  content?: string
  audioFileName?: string
}

export interface PodcastState {
  isLoading: boolean
  newsScript: string
  currentStatus: string
  showAudio: boolean
  audioSrc: string
  isExpanded: boolean
}

export interface RequestBody {
  urls: string[]
  voiceId?: string
}

export type UrlMode = 'single' | 'multiple'

export interface Voice {
  voice_id: string
  name: string
  category?: string
  description?: string
}

