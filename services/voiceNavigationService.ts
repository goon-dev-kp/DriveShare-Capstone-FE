import * as Speech from 'expo-speech'
import type { RouteInstruction } from '@/services/vietmapService'

interface VoiceGuidanceOptions {
  locale?: string
  pitch?: number
  rate?: number
  enabled?: boolean
}

class VoiceNavigationService {
  private enabled: boolean = true
  private locale: string = 'vi-VN'
  private pitch: number = 1.0
  private rate: number = 0.9
  private lastSpokenStep: number = -1
  private speaking: boolean = false

  /**
   * Configure voice navigation
   */
  configure(options: VoiceGuidanceOptions) {
    if (options.locale) this.locale = options.locale
    if (options.pitch !== undefined) this.pitch = options.pitch
    if (options.rate !== undefined) this.rate = options.rate
    if (options.enabled !== undefined) this.enabled = options.enabled
  }

  /**
   * Enable/disable voice guidance
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled
    if (!enabled) {
      this.stop()
    }
  }

  /**
   * Check if voice is enabled
   */
  isEnabled(): boolean {
    return this.enabled
  }

  /**
   * Announce upcoming turn instruction
   */
  async announceInstruction(instruction: RouteInstruction, distanceMeters: number) {
    if (!this.enabled || this.speaking) return

    try {
      const message = this.formatInstruction(instruction, distanceMeters)
      await this.speak(message)
    } catch (error) {
      console.error('Voice announcement failed:', error)
    }
  }

  /**
   * Announce distance to next turn
   */
  async announceDistance(distanceMeters: number) {
    if (!this.enabled || this.speaking) return

    try {
      const message = this.formatDistance(distanceMeters)
      await this.speak(message)
    } catch (error) {
      console.error('Distance announcement failed:', error)
    }
  }

  /**
   * Announce arrival at destination
   */
  async announceArrival(location: 'pickup' | 'delivery') {
    if (!this.enabled) return

    try {
      const messages = {
        pickup: 'Bạn đã đến điểm lấy hàng',
        delivery: 'Bạn đã đến điểm giao hàng'
      }
      await this.speak(messages[location])
    } catch (error) {
      console.error('Arrival announcement failed:', error)
    }
  }

  /**
   * Announce rerouting
   */
  async announceReroute(timeSaved: number) {
    if (!this.enabled) return

    try {
      const minutes = Math.round(timeSaved / 60)
      const message = `Tìm thấy đường nhanh hơn, tiết kiệm ${minutes} phút. Đang tính lại đường đi.`
      await this.speak(message)
    } catch (error) {
      console.error('Reroute announcement failed:', error)
    }
  }

  /**
   * Announce off-route
   */
  async announceOffRoute() {
    if (!this.enabled) return

    try {
      await this.speak('Bạn đã đi lệch đường. Đang tính lại tuyến đường.')
    } catch (error) {
      console.error('Off-route announcement failed:', error)
    }
  }

  /**
   * Stop current speech
   */
  stop() {
    Speech.stop()
    this.speaking = false
  }

  /**
   * Format instruction for speech
   */
  private formatInstruction(instruction: RouteInstruction, distanceMeters: number): string {
    const distance = this.formatDistance(distanceMeters)
    const action = this.getTurnAction(instruction.sign)
    const street = instruction.street_name || ''

    if (street) {
      return `${distance}, ${action} vào ${street}`
    }

    return `${distance}, ${action}`
  }

  /**
   * Format distance for speech
   */
  private formatDistance(meters: number): string {
    if (meters < 50) {
      return 'Ngay bây giờ'
    } else if (meters < 100) {
      return 'Sau 50 mét'
    } else if (meters < 200) {
      return 'Sau 100 mét'
    } else if (meters < 500) {
      return `Sau ${Math.round(meters / 50) * 50} mét`
    } else if (meters < 1000) {
      return 'Sau 500 mét'
    } else {
      const km = (meters / 1000).toFixed(1)
      return `Sau ${km} ki-lô-mét`
    }
  }

  /**
   * Get turn action in Vietnamese
   */
  private getTurnAction(sign: number): string {
    const actions: Record<number, string> = {
      0: 'đi thẳng',
      '-3': 'rẽ trái gấp',
      '-2': 'rẽ trái',
      '-1': 'nghiêng trái',
      1: 'nghiêng phải',
      2: 'rẽ phải',
      3: 'rẽ phải gấp',
      '-7': 'quay đầu trái',
      7: 'quay đầu phải',
      4: 'bạn đã đến đích',
      5: 'đi qua điểm dừng',
      6: 'vào vòng xuyến'
    }
    return actions[sign] || 'tiếp tục'
  }

  /**
   * Speak text with configured settings
   */
  private async speak(text: string): Promise<void> {
    this.speaking = true

    return new Promise((resolve) => {
      Speech.speak(text, {
        language: this.locale,
        pitch: this.pitch,
        rate: this.rate,
        onDone: () => {
          this.speaking = false
          resolve()
        },
        onError: () => {
          this.speaking = false
          resolve()
        }
      })
    })
  }

  /**
   * Check if should announce based on distance thresholds
   */
  shouldAnnounce(distanceMeters: number, stepIndex: number): boolean {
    // Announce at: 500m, 200m, 100m, 50m
    const thresholds = [500, 200, 100, 50]
    
    // Don't repeat same step
    if (stepIndex === this.lastSpokenStep) {
      return false
    }

    // Check if distance matches any threshold (±10m tolerance)
    const shouldSpeak = thresholds.some(threshold => 
      Math.abs(distanceMeters - threshold) < 10
    )

    if (shouldSpeak) {
      this.lastSpokenStep = stepIndex
      return true
    }

    return false
  }

  /**
   * Reset last spoken step
   */
  resetLastSpokenStep() {
    this.lastSpokenStep = -1
  }
}

// Lazy singleton - only instantiate when first accessed
let instance: VoiceNavigationService | null = null

export function getVoiceNavigationService(): VoiceNavigationService {
  if (!instance) {
    instance = new VoiceNavigationService()
  }
  return instance
}

export default getVoiceNavigationService
export type { VoiceGuidanceOptions }
