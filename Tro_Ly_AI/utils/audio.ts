// utils/audio.ts

/**
 * Encodes a Uint8Array into a base64 string.
 * This is necessary for sending audio data to the Gemini API.
 */
export function encode(bytes: ArrayBuffer): string {
  let binary = '';
  const uint8Bytes = new Uint8Array(bytes);
  const len = uint8Bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(uint8Bytes[i]);
  }
  return btoa(binary);
}

/**
 * Decodes a base64 string into a Uint8Array.
 * This is used to process the raw audio data received from the Gemini API.
 */
export function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Decodes raw PCM audio data into an AudioBuffer that can be played by the browser.
 * The browser's native `decodeAudioData` is for file formats like MP3/WAV, not raw streams,
 * so we must construct the buffer manually.
 * @param data The raw Int16 PCM audio data.
 * @param ctx The AudioContext to use for creating the buffer.
 * @param sampleRate The sample rate of the audio (e.g., 24000 for Gemini output).
 * @param numChannels The number of audio channels (typically 1 for mono).
 * @returns A promise that resolves to an AudioBuffer.
 */
export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
