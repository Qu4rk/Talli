/**
 * Encode a Float32Array of PCM audio samples into a 16-bit WAV Blob.
 * Used to package VAD speech segments for the STT API endpoint.
 *
 * @param samples Raw Float32 PCM audio samples (range -1..1)
 * @param sampleRate Sample rate in Hz (defaults to 16000 Hz, standard for VAD & STT)
 * @returns 16-bit PCM WAV Blob
 */
export function float32ToWav(samples: Float32Array, sampleRate = 16000): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  // RIFF Chunk Descriptor
  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, "WAVE");

  // "fmt " Sub-chunk
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);          // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true);           // AudioFormat (1 for PCM)
  view.setUint16(22, 1, true);           // NumChannels (1 for mono)
  view.setUint32(24, sampleRate, true);   // SampleRate
  view.setUint32(28, sampleRate * 2, true); // ByteRate (SampleRate * NumChannels * BitsPerSample/8)
  view.setUint16(32, 2, true);           // BlockAlign (NumChannels * BitsPerSample/8)
  view.setUint16(34, 16, true);          // BitsPerSample (16 bits)

  // "data" Sub-chunk
  writeString(view, 36, "data");
  view.setUint32(40, samples.length * 2, true);

  // Write PCM samples converted to 16-bit signed integers
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return new Blob([buffer], { type: "audio/wav" });
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}
