"use client";

import { useCallback, useEffect, useState } from "react";

type RitualCue = "transition" | "enter" | "shuffle" | "pick" | "flip" | "place" | "archive";

const SOUND_KEY = "lumen-tarot-sound";
let audioContext: AudioContext | null = null;
let masterGain: GainNode | null = null;
let ritualBus: GainNode | null = null;

function createReverbImpulse(context: AudioContext, duration = 1.65) {
  const frameCount = Math.floor(context.sampleRate * duration);
  const impulse = context.createBuffer(2, frameCount, context.sampleRate);
  for (let channelIndex = 0; channelIndex < impulse.numberOfChannels; channelIndex += 1) {
    const channel = impulse.getChannelData(channelIndex);
    let softened = 0;
    for (let index = 0; index < frameCount; index += 1) {
      const progress = index / frameCount;
      softened = softened * .72 + (Math.random() * 2 - 1) * .28;
      channel[index] = softened * Math.pow(1 - progress, 3.2);
    }
  }
  return impulse;
}

function getAudioEngine() {
  if (typeof window === "undefined") return null;
  if (!audioContext || audioContext.state === "closed") {
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return null;
    audioContext = new AudioContextClass();
    masterGain = audioContext.createGain();
    ritualBus = audioContext.createGain();
    const dry = audioContext.createGain();
    const wet = audioContext.createGain();
    const reverb = audioContext.createConvolver();
    const compressor = audioContext.createDynamicsCompressor();
    masterGain.gain.value = .23;
    dry.gain.value = .88;
    wet.gain.value = .2;
    reverb.buffer = createReverbImpulse(audioContext);
    compressor.threshold.value = -20;
    compressor.knee.value = 16;
    compressor.ratio.value = 4;
    compressor.attack.value = .012;
    compressor.release.value = .28;
    ritualBus.connect(dry).connect(compressor);
    ritualBus.connect(reverb).connect(wet).connect(compressor);
    compressor.connect(masterGain).connect(audioContext.destination);
  }
  return { context: audioContext, destination: ritualBus! };
}

function createTexturedNoise(context: AudioContext, duration: number, softness: number) {
  const frameCount = Math.max(1, Math.floor(context.sampleRate * duration));
  const buffer = context.createBuffer(1, frameCount, context.sampleRate);
  const channel = buffer.getChannelData(0);
  let previous = 0;
  for (let index = 0; index < frameCount; index += 1) {
    const white = Math.random() * 2 - 1;
    previous = previous * softness + white * (1 - softness);
    channel[index] = previous + white * .16;
  }
  return buffer;
}

function addBowl(context: AudioContext, destination: AudioNode, frequency: number, start: number, duration: number, volume: number) {
  [1, 2.01, 2.96, 4.13].forEach((partial, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = index === 0 ? "sine" : "triangle";
    oscillator.frequency.setValueAtTime(frequency * partial, start);
    oscillator.detune.value = index % 2 ? -4 : 3;
    gain.gain.setValueAtTime(.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume / Math.pow(index + 1, 1.45), start + .09 + index * .018);
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration * (1 - index * .08));
    oscillator.connect(gain).connect(destination);
    oscillator.start(start);
    oscillator.stop(start + duration + .04);
  });
}

function addAir(context: AudioContext, destination: AudioNode, start: number, duration: number, volume: number) {
  const source = context.createBufferSource();
  const highpass = context.createBiquadFilter();
  const lowpass = context.createBiquadFilter();
  const gain = context.createGain();
  source.buffer = createTexturedNoise(context, duration, .965);
  highpass.type = "highpass";
  highpass.frequency.value = 105;
  lowpass.type = "lowpass";
  lowpass.Q.value = .55;
  lowpass.frequency.setValueAtTime(360, start);
  lowpass.frequency.linearRampToValueAtTime(760, start + duration * .46);
  lowpass.frequency.exponentialRampToValueAtTime(270, start + duration);
  gain.gain.setValueAtTime(.0001, start);
  gain.gain.linearRampToValueAtTime(volume, start + duration * .28);
  gain.gain.linearRampToValueAtTime(volume * .72, start + duration * .62);
  gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
  source.connect(highpass).connect(lowpass).connect(gain).connect(destination);
  source.start(start);
}

function addPaperSlide(context: AudioContext, destination: AudioNode, start: number, duration: number, volume: number, direction: "draw" | "flip" | "shuffle") {
  const source = context.createBufferSource();
  const highpass = context.createBiquadFilter();
  const body = context.createBiquadFilter();
  const gain = context.createGain();
  source.buffer = createTexturedNoise(context, duration, direction === "shuffle" ? .38 : .52);
  highpass.type = "highpass";
  highpass.frequency.value = direction === "flip" ? 620 : 420;
  body.type = "bandpass";
  body.Q.value = direction === "flip" ? .48 : .65;
  body.frequency.setValueAtTime(direction === "flip" ? 3100 : 2050, start);
  body.frequency.exponentialRampToValueAtTime(direction === "flip" ? 900 : 720, start + duration);
  gain.gain.setValueAtTime(.0001, start);
  gain.gain.linearRampToValueAtTime(volume * .78, start + duration * .12);
  gain.gain.linearRampToValueAtTime(volume, start + duration * .48);
  gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
  source.connect(highpass).connect(body).connect(gain).connect(destination);
  source.start(start);
}

function addTableTouch(context: AudioContext, destination: AudioNode, start: number, volume: number) {
  const source = context.createBufferSource();
  const lowpass = context.createBiquadFilter();
  const gain = context.createGain();
  source.buffer = createTexturedNoise(context, .12, .83);
  lowpass.type = "lowpass";
  lowpass.frequency.setValueAtTime(340, start);
  lowpass.frequency.exponentialRampToValueAtTime(110, start + .12);
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(.0001, start + .12);
  source.connect(lowpass).connect(gain).connect(destination);
  source.start(start);

  const body = context.createOscillator();
  const bodyGain = context.createGain();
  body.type = "sine";
  body.frequency.setValueAtTime(92, start);
  body.frequency.exponentialRampToValueAtTime(64, start + .1);
  bodyGain.gain.setValueAtTime(volume * .3, start);
  bodyGain.gain.exponentialRampToValueAtTime(.0001, start + .11);
  body.connect(bodyGain).connect(destination);
  body.start(start);
  body.stop(start + .13);
}

function addWaterDrop(context: AudioContext, destination: AudioNode, start: number, volume: number) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(720, start);
  oscillator.frequency.exponentialRampToValueAtTime(410, start + .16);
  gain.gain.setValueAtTime(.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + .012);
  gain.gain.exponentialRampToValueAtTime(.0001, start + .28);
  oscillator.connect(gain).connect(destination);
  oscillator.start(start);
  oscillator.stop(start + .3);
}

function addShuffle(context: AudioContext, destination: AudioNode, start: number) {
  const movements = [
    [0, .2, .11], [.12, .18, .1], [.26, .21, .115], [.43, .18, .105],
    [.58, .22, .115], [.76, .18, .1], [.9, .2, .11],
  ] as const;
  movements.forEach(([offset, duration, volume]) => {
    addPaperSlide(context, destination, start + offset, duration, volume, "shuffle");
  });
  addTableTouch(context, destination, start + .03, .065);
  addTableTouch(context, destination, start + 1.08, .075);
}

function scheduleCue(cue: RitualCue, context: AudioContext, destination: AudioNode) {
  const now = context.currentTime + .015;
  if (cue === "transition") {
    addAir(context, destination, now, .96, .105);
    addBowl(context, destination, 146.83, now + .03, 1.02, .068);
    addWaterDrop(context, destination, now + .28, .023);
    return;
  }
  if (cue === "enter") {
    addAir(context, destination, now, .9, .098);
    addBowl(context, destination, 130.81, now + .03, .98, .064);
    return;
  }
  if (cue === "shuffle") {
    addAir(context, destination, now, 1.12, .034);
    addShuffle(context, destination, now);
    return;
  }
  if (cue === "pick") {
    addPaperSlide(context, destination, now, .3, .14, "draw");
    addTableTouch(context, destination, now + .23, .07);
    return;
  }
  if (cue === "flip") {
    addPaperSlide(context, destination, now, .2, .175, "flip");
    addTableTouch(context, destination, now + .15, .115);
    return;
  }
  if (cue === "place") {
    addAir(context, destination, now, .72, .05);
    addBowl(context, destination, 174.61, now + .03, .82, .058);
    addTableTouch(context, destination, now + .08, .055);
    return;
  }
  addPaperSlide(context, destination, now, .18, .07, "draw");
  addBowl(context, destination, 196, now + .02, .5, .027);
}

function playCue(cue: RitualCue) {
  const engine = getAudioEngine();
  if (!engine) return;
  const run = () => scheduleCue(cue, engine.context, engine.destination);
  if (engine.context.state === "suspended") engine.context.resume().then(run).catch(() => undefined);
  else run();
}

export function useRitualSound() {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    setEnabled(localStorage.getItem(SOUND_KEY) !== "off");
  }, []);

  const play = useCallback((cue: RitualCue) => {
    if (enabled) playCue(cue);
  }, [enabled]);

  const toggle = useCallback(() => {
    setEnabled((current) => {
      const next = !current;
      localStorage.setItem(SOUND_KEY, next ? "on" : "off");
      if (next) playCue("enter");
      return next;
    });
  }, []);

  return { enabled, play, toggle };
}

export function SoundToggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button className={`sound-toggle ${enabled ? "" : "is-muted"}`} onClick={onToggle} aria-pressed={enabled} aria-label={enabled ? "关闭仪式声音" : "开启仪式声音"} title={enabled ? "关闭仪式声音" : "开启仪式声音"}>
      <span aria-hidden="true">♪</span><small>SOUND</small>
    </button>
  );
}
