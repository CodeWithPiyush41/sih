import { AIProvider, AIInput, AIResponse, StructuredAIResponse } from '../types';
import { AI_CONFIG } from './config';

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timeoutId: NodeJS.Timeout;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('AI_TIMEOUT')), ms);
  });

  return Promise.race([
    promise,
    timeoutPromise
  ]).finally(() => clearTimeout(timeoutId));
}

export async function executeWithFallback<T>(
  operation: (provider: AIProvider) => Promise<T>,
  primaryProvider: AIProvider,
  fallbackProvider: AIProvider,
  maxRetries = AI_CONFIG.maxRetries
): Promise<T> {
  let attempt = 0;
  let lastError: any = null;
  
  // Try Primary
  while (attempt < maxRetries) {
    try {
      return await withTimeout(operation(primaryProvider), AI_CONFIG.timeoutMs);
    } catch (error: any) {
      lastError = error;
      const errorMessage = error?.message || '';
      console.warn(`Primary provider failed (attempt ${attempt + 1}/${maxRetries}):`, errorMessage);
      
      // If it's a normalized error like AI_RATE_LIMITED bubbled up, we can still retry fallback
      // If invalid response, we might just want to fail fast or retry
      if (errorMessage === 'AI_INVALID_RESPONSE') {
        attempt++; // Maybe structured schema failure, let's retry
        continue;
      }
      
      attempt++;
    }
  }

  // Primary exhausted, try Fallback
  const fallbackAvailable = await fallbackProvider.isAvailable().catch(() => false);
  if (!fallbackAvailable) {
    console.warn('Fallback provider is unavailable. Skipping fallback retries.');
    throw lastError || new Error('AI_SERVICE_UNAVAILABLE');
  }

  console.log('Switching to fallback provider...');
  attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      return await withTimeout(operation(fallbackProvider), AI_CONFIG.timeoutMs);
    } catch (error: any) {
      lastError = error;
      console.warn(`Fallback provider failed (attempt ${attempt + 1}/${maxRetries}):`, error?.message);
      attempt++;
    }
  }

  // Both exhausted. Normalize the error.
  if (lastError?.message === 'AI_TIMEOUT') {
    throw new Error('AI_TIMEOUT');
  } else if (lastError?.message === 'AI_RATE_LIMITED') {
    throw new Error('AI_RATE_LIMITED');
  } else if (lastError?.message === 'AI_INVALID_RESPONSE') {
    throw new Error('AI_INVALID_RESPONSE');
  }

  throw new Error('AI_SERVICE_UNAVAILABLE');
}
