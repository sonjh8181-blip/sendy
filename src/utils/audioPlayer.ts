/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Note pitch to MIDI & Frequency calculator
const NOTE_MAP: Record<string, number> = {
  C: 0, 'C#': 1, Db: 1,
  D: 2, 'D#': 3, Eb: 3,
  E: 4,
  F: 5, 'F#': 6, Gb: 6,
  G: 7, 'G#': 8, Ab: 8,
  A: 9, 'A#': 10, Bb: 10,
  B: 11
};

export function noteToMidi(noteStr: string): number | null {
  if (!noteStr || typeof noteStr !== 'string') return null;
  const clean = noteStr.trim().toUpperCase();
  if (clean === 'R' || clean === 'REST') return null;

  const match = clean.match(/^([A-G][#B]?)(-?\d+)$/i);
  if (!match) return null;

  let noteName = match[1];
  // normalize: e.g. EB -> Eb
  if (noteName.length > 1) {
    noteName = noteName[0] + (noteName[1] === '#' ? '#' : 'b');
  }
  const octave = parseInt(match[2], 10);
  const semitone = NOTE_MAP[noteName];
  if (semitone === undefined) return null;

  return (octave + 1) * 12 + semitone;
}

export function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function noteToFrequency(noteStr: string): number | null {
  const midi = noteToMidi(noteStr);
  if (midi === null) return null;
  return midiToFrequency(midi);
}

class PianoSynthEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private currentTimer: number | null = null;
  private isPlaying: boolean = false;
  private activeStep: number = 0;
  private stepCallback: ((step: number, currentRightNotes: string[], currentLeftNotes: string[]) => void) | null = null;
  private completeCallback: (() => void) | null = null;
  private speedFactor: number = 1.0;
  private metronomeEnabled: boolean = false;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public getContext(): AudioContext | null {
    this.initContext();
    return this.ctx;
  }

  // Synthesize a realistic piano timbre using additive harmonics + hammer impulse
  public playNote(noteStr: string, duration: number = 0.8, volume: number = 0.35) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const freq = noteToFrequency(noteStr);
    if (!freq) return;

    const now = this.ctx.currentTime;
    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(volume, now);
    masterGain.connect(this.ctx.destination);

    // Harmonics for rich piano tone: Fundamental (1x), 2nd (2x), 3rd (3x), 4th (4x)
    const harmonics = [
      { mult: 1, gain: 0.65, decay: duration * 1.2 },
      { mult: 2, gain: 0.35, decay: duration * 0.9 },
      { mult: 3, gain: 0.18, decay: duration * 0.7 },
      { mult: 4, gain: 0.08, decay: duration * 0.5 },
    ];

    harmonics.forEach(({ mult, gain: hGainRatio, decay }) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq * mult, now);

      // Fast percussive attack then exponential decay
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(hGainRatio, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + Math.max(0.1, decay));

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(now);
      osc.stop(now + decay + 0.05);
    });

    // Hammer click transient
    const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.02, this.ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseData.length; i++) {
      noiseData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.005));
    }
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(volume * 0.15, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.02);
    noiseSource.connect(noiseGain);
    noiseGain.connect(masterGain);
    noiseSource.start(now);
  }

  public playChord(notes: string[], duration: number = 1.0, volume: number = 0.3) {
    if (!notes || notes.length === 0) return;
    const chordVol = volume / Math.sqrt(notes.length);
    notes.forEach((n, idx) => {
      // slight natural humanization micro-delay
      setTimeout(() => {
        this.playNote(n, duration, chordVol);
      }, idx * 12);
    });
  }

  public playMetronomeTick(isAccent: boolean = false) {
    if (!this.metronomeEnabled || this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(isAccent ? 1200 : 800, now);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  public startPlayback(
    rightHandNotes: string[],
    leftHandChords: (string | string[])[],
    bpm: number,
    onStep: (step: number, rightNotes: string[], leftNotes: string[]) => void,
    onFinish: () => void,
    startStep: number = 0
  ) {
    this.stopPlayback();
    this.initContext();

    this.isPlaying = true;
    this.stepCallback = onStep;
    this.completeCallback = onFinish;
    this.activeStep = startStep;

    const totalSteps = Math.max(rightHandNotes.length, leftHandChords.length);
    if (totalSteps === 0) {
      this.isPlaying = false;
      onFinish();
      return;
    }

    // Step duration based on 8th notes or quarter notes
    // Quarter note at BPM = 60 / BPM seconds. 8th note = 30 / BPM seconds.
    const effectiveBpm = Math.max(40, Math.min(220, bpm || 80));
    const stepDurationMs = ((60 / effectiveBpm) * 1000 * 0.5) / this.speedFactor;

    const playNextStep = () => {
      if (!this.isPlaying) return;

      if (this.activeStep >= totalSteps) {
        this.stopPlayback();
        if (this.completeCallback) this.completeCallback();
        return;
      }

      const rRaw = rightHandNotes[this.activeStep];
      const lRaw = leftHandChords[this.activeStep];

      const rNotes: string[] = [];
      if (rRaw) {
        if (Array.isArray(rRaw)) rNotes.push(...rRaw);
        else if (typeof rRaw === 'string') rNotes.push(rRaw);
      }

      const lNotes: string[] = [];
      if (lRaw) {
        if (Array.isArray(lRaw)) lNotes.push(...lRaw);
        else if (typeof lRaw === 'string') {
          // Check if space separated or comma separated chord
          const parts = lRaw.split(/[,\s]+/).filter(Boolean);
          lNotes.push(...parts);
        }
      }

      // Metronome tick every 2 steps (quarter beat)
      if (this.activeStep % 2 === 0) {
        this.playMetronomeTick(this.activeStep % 8 === 0);
      }

      // Play audio
      if (rNotes.length > 0) {
        rNotes.forEach(note => this.playNote(note, 0.9, 0.4));
      }
      if (lNotes.length > 0) {
        this.playChord(lNotes, 1.2, 0.35);
      }

      if (this.stepCallback) {
        this.stepCallback(this.activeStep, rNotes, lNotes);
      }

      this.activeStep++;
      this.currentTimer = window.setTimeout(playNextStep, stepDurationMs);
    };

    playNextStep();
  }

  public pausePlayback() {
    this.isPlaying = false;
    if (this.currentTimer !== null) {
      clearTimeout(this.currentTimer);
      this.currentTimer = null;
    }
  }

  public stopPlayback() {
    this.isPlaying = false;
    if (this.currentTimer !== null) {
      clearTimeout(this.currentTimer);
      this.currentTimer = null;
    }
    this.activeStep = 0;
  }

  public setSpeed(speed: number) {
    this.speedFactor = speed;
  }

  public toggleMetronome(): boolean {
    this.metronomeEnabled = !this.metronomeEnabled;
    return this.metronomeEnabled;
  }

  public isMetronomeOn(): boolean {
    return this.metronomeEnabled;
  }

  public isCurrentPlaying(): boolean {
    return this.isPlaying;
  }

  public getCurrentStep(): number {
    return this.activeStep;
  }
}

export const pianoSynth = new PianoSynthEngine();
