import { Injectable } from '@angular/core';
import FingerprintJS from '@fingerprintjs/fingerprintjs';

@Injectable({
  providedIn: 'root'
})
export class FingerprintService {
  private fp: any = null;

  constructor() {
    this.initializeFingerprint();
  }

  private async initializeFingerprint() {
    try {
      this.fp = await FingerprintJS.load();
    } catch (error) {
      console.error('Failed to initialize fingerprint:', error);
    }
  }

  async getFingerprint(): Promise<string> {
    if (!this.fp) {
      await this.initializeFingerprint();
    }

    if (!this.fp) {
      throw new Error('Fingerprint service not available');
    }

    try {
      const result = await this.fp.get();
      return result.visitorId;
    } catch (error) {
      console.error('Failed to get fingerprint:', error);
      throw error;
    }
  }

  async getDetailedFingerprint(): Promise<any> {
    if (!this.fp) {
      await this.initializeFingerprint();
    }

    if (!this.fp) {
      throw new Error('Fingerprint service not available');
    }

    try {
      const result = await this.fp.get();
      return {
        visitorId: result.visitorId,
        confidence: result.confidence,
        components: {
          screen: result.components.screen?.value,
          canvas: result.components.canvas?.value,
          timezone: result.components.timezone?.value,
          language: result.components.languages?.value,
          platform: result.components.platform?.value,
          cookieEnabled: result.components.cookieEnabled?.value,
          localStorage: result.components.localStorage?.value,
          sessionStorage: result.components.sessionStorage?.value
        }
      };
    } catch (error) {
      console.error('Failed to get detailed fingerprint:', error);
      throw error;
    }
  }

  generateFallbackFingerprint(): string {
    const userAgent = navigator.userAgent;
    const screenInfo = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const language = navigator.language;
    const platform = navigator.platform;
    
    const fallbackString = `${userAgent}|${screenInfo}|${timezone}|${language}|${platform}`;
    
    return this.simpleHash(fallbackString);
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }
}