"""
Jarvis Voice Loop - Phase 1

Wake word -> record command -> transcribe -> speak back (echo test).
No LLM yet. This phase only proves the audio pipeline works end-to-end
with acceptable latency and low idle CPU. Phase 2 wires the transcribed
text into the LLM tool-call contract from Phase 0.
"""

import time
import subprocess

import numpy as np
import sounddevice as sd
import soundfile as sf
from openwakeword.model import Model as WakeWordModel
from faster_whisper import WhisperModel

from llm_client import process as llm_process, dispatch_stub

# ---- Config ----
SAMPLE_RATE = 16000
FRAME_LENGTH = 1280              # ~80ms frames at 16kHz, what openWakeWord expects
WAKE_WORD_MODEL = "hey_jarvis"   # swap for your trained/downloaded model name
WHISPER_MODEL_SIZE = "small"     # "base" = lower latency, "small" = better accuracy
WAKE_THRESHOLD = 0.5

SILENCE_RMS_THRESHOLD = 500      # tune against your mic's noise floor
SILENCE_DURATION_SEC = 1.2       # trailing silence that ends a command
MAX_COMMAND_SECONDS = 8

PIPER_MODEL_PATH = "voices/en_US-lessac-medium.onnx"  # download separately, see README

# ---- Init models (do this once, at startup, not per-loop) ----
print("[init] loading wake word model...")
oww_model = WakeWordModel(wakeword_models=[WAKE_WORD_MODEL])
    
print("[init] loading whisper model...")
stt_model = WhisperModel(WHISPER_MODEL_SIZE, device="cpu", compute_type="int8")

print("[init] ready. listening for wake word...")


def speak(text: str) -> None:
    """Phase 1: pipe text to Piper TTS and play the result.
    Replace with a richer voice pipeline once the loop is proven."""
    subprocess.run(
        ["piper", "--model", PIPER_MODEL_PATH, "--output_file", "reply.wav"],
        input=text.encode(),
        check=True,
    )
    data, fs = sf.read("reply.wav", dtype="float32")
    sd.play(data, fs)
    sd.wait()


def record_command() -> np.ndarray:
    """Records audio after the wake word fires, until trailing silence
    or MAX_COMMAND_SECONDS, whichever comes first."""
    print("[listen] recording command...")
    frames = []
    silence_start = None
    start_time = time.time()

    with sd.InputStream(samplerate=SAMPLE_RATE, channels=1, dtype="int16") as stream:
        while True:
            block, _ = stream.read(FRAME_LENGTH)
            frames.append(block)

            rms = np.sqrt(np.mean(block.astype(np.float32) ** 2))
            if rms < SILENCE_RMS_THRESHOLD:
                if silence_start is None:
                    silence_start = time.time()
                elif time.time() - silence_start > SILENCE_DURATION_SEC:
                    break
            else:
                silence_start = None

            if time.time() - start_time > MAX_COMMAND_SECONDS:
                break

    audio = np.concatenate(frames, axis=0).flatten().astype(np.float32) / 32768.0
    return audio


def transcribe(audio: np.ndarray) -> str:
    segments, _ = stt_model.transcribe(audio, language="en")
    return " ".join(seg.text for seg in segments).strip()


def main_loop() -> None:
    with sd.InputStream(
        samplerate=SAMPLE_RATE, channels=1, dtype="int16", blocksize=FRAME_LENGTH
    ) as stream:
        while True:
            block, _ = stream.read(FRAME_LENGTH)
            prediction = oww_model.predict(block.flatten())

            if prediction[WAKE_WORD_MODEL] > WAKE_THRESHOLD:
                print("[wake] wake word detected")
                speak("Yes?")

                audio = record_command()
                text = transcribe(audio)
                print(f"[stt] heard: {text}")

                if text:
                    result = llm_process(text)
                    speak(result["reply_text"])

                    if result["valid"] and result["action"] is not None:
                        dispatch_stub(result)
                    elif result["action"] is None and not result["valid"]:
                        # LLM proposed something invalid/low-confidence — logged, not spoken,
                        # so the user isn't confused by internal validation chatter.
                        print(f"[llm] rejected: {result['reason']}")
                else:
                    speak("Sorry, I didn't catch that.")


if __name__ == "__main__":
    main_loop()