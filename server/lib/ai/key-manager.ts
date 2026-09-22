// server/lib/ai/key-manager.ts

interface KeyStatus {
  key: string;
  unavailableUntil: number;
}

export class GeminiKeyManager {
  private keys: KeyStatus[] = [];
  private currentIndex = 0;
  private readonly COOLDOWN_MS = 60000; // 60 seconds

  constructor() {
    this.loadKeys();
  }

  private loadKeys() {
    for (let i = 1; i <= 5; i++) {
      const key = process.env[`GEMINI_API_KEY_${i}`];
      if (key && key.trim().length > 0) {
        this.keys.push({ key, unavailableUntil: 0 });
      }
    }
    
    // Fallback to legacy single key if no pooled keys found
    if (this.keys.length === 0) {
      const singleKey = process.env.GEMINI_API_KEY;
      if (singleKey && singleKey.trim().length > 0) {
        this.keys.push({ key: singleKey, unavailableUntil: 0 });
      }
    }
  }

  /**
   * Returns the next available key. Throws if no keys are available.
   */
  public getKey(): string {
    if (this.keys.length === 0) {
      this.loadKeys();
    }
    if (this.keys.length === 0) {
      throw new Error('No Gemini API keys configured in environment.');
    }

    const now = Date.now();
    let attempts = 0;

    // Try to find an available key, starting from the next index (round-robin)
    while (attempts < this.keys.length) {
      this.currentIndex = (this.currentIndex + 1) % this.keys.length;
      const keyStatus = this.keys[this.currentIndex];

      if (now >= keyStatus.unavailableUntil) {
        return keyStatus.key;
      }
      attempts++;
    }

    throw new Error('AI_RATE_LIMITED');
  }

  /**
   * Marks a key as temporarily unavailable due to rate limits or quota errors.
   */
  public markKeyUnavailable(keyToMark: string) {
    const keyStatus = this.keys.find(k => k.key === keyToMark);
    if (keyStatus) {
      const now = Date.now();
      keyStatus.unavailableUntil = now + this.COOLDOWN_MS;
      console.warn(`Gemini key starting with ${keyToMark.substring(0, 8)}... marked unavailable until ${new Date(keyStatus.unavailableUntil).toISOString()}`);
    }
  }
  
  public getAvailableKeyCount(): number {
    if (this.keys.length === 0) {
      this.loadKeys();
    }
    const now = Date.now();
    return this.keys.filter(k => now >= k.unavailableUntil).length;
  }
  
  public getTotalKeyCount(): number {
    return this.keys.length;
  }
}

// Export singleton instance
export const keyManager = new GeminiKeyManager();
