/**
 * Play a high-tech esports notification chime sound using Web Audio API
 */
export const playNotificationSound = () => {
  if (typeof window === 'undefined') return;

  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();

    // Primary Tone Oscillator (Neon Yellow Pitch 880Hz -> 1760Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.15);

    gain1.gain.setValueAtTime(0.2, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    // Secondary Harmonic Accent Oscillator (587Hz -> 1174Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(587.33, ctx.currentTime + 0.05);
    osc2.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.2);

    gain2.gain.setValueAtTime(0.12, ctx.currentTime + 0.05);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.35);

    osc2.start(ctx.currentTime + 0.05);
    osc2.stop(ctx.currentTime + 0.4);
  } catch (err) {
    console.warn('[Notification Audio] Playback skipped:', err);
  }
};
