import React, { useEffect, useState } from "react";
import { MicVAD } from "@ricky0123/vad-web";
import { useMicVAD } from '@ricky0123/vad-react'

const SERVER_URL = "ws://localhost:5005"; // Change if needed

export default function MicVADRecorder({
  onListening,
  onVoiceProcessingBegin,
  onVoiceProcessingEnd,
  onSpeakingEnd
                                       }) {
  const [ws, setWs] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  useEffect(() => {
    startWebSocket();
  }, [])
  const vad = useMicVAD({
    onSpeechStart: () => {
      console.log("Speech started...");
      onListening()
    },
    onSpeechEnd: (audio) => {
      console.log("Speech ended, sending data...");
      onVoiceProcessingBegin()
      sendAudioToServer(audio);
    },
  });


  const startWebSocket = () => {
    if (ws) return; // Prevent multiple WebSockets
    const socket = new WebSocket(SERVER_URL);
    socket.binaryType = "arraybuffer";
    socket.onopen = () => console.log("WebSocket opened!");
    socket.onclose = () => console.log("WebSocket closed!");
    socket.onmessage = async (event) => {
      if (typeof event.data === "string") {
        // Handle JSON metadata
        const metadata = JSON.parse(event.data);
        console.log("Received metadata:", metadata);
      } else if (event.data instanceof ArrayBuffer) {
        // Handle binary audio
        console.log("Received audio data!");

        // Convert the buffer to a Blob and create an Object URL
        const audioBlob = new Blob([event.data], { type: "audio/mp3" });
        const audioUrl = URL.createObjectURL(audioBlob);

        // Play the audio
        const audio = new Audio(audioUrl);
        audio.addEventListener("ended", () => {
          console.log("Audio finished playing!");
          onSpeakingEnd()
        });

        onVoiceProcessingEnd()
        audio.play();
      }
    }
    setWs(socket);
    setIsRecording(true);
  };

  const sendAudioToServer = async (audio) => {
    if (!ws) return;
    const wavBuffer = encodeWAV(audio, 16000);
    ws.send(wavBuffer);
    ws.send("END"); // Indicate end of transmission
    setIsRecording(false);
  };

  return null
  // return (
  //   <div>
  //     <button onClick={() => vad?.start()} disabled={isRecording}>
  //       🎤 Start Recording
  //     </button>
  //     <button onClick={() => vad?.pause()} disabled={!isRecording}>
  //       🛑 Stop
  //     </button>
  //   </div>
  // );
}

/**
 * Convert Float32Array to WAV format (PCM 16-bit, 16kHz)
 */
function encodeWAV(audioData, sampleRate) {
  const numChannels = 1;
  const sampleBits = 16;
  const bytesPerSample = sampleBits / 8;
  const dataLength = audioData.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);

  function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataLength, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * bytesPerSample, true);
  view.setUint16(32, numChannels * bytesPerSample, true);
  view.setUint16(34, sampleBits, true);
  writeString(view, 36, "data");
  view.setUint32(40, dataLength, true);

  let offset = 44;
  for (let i = 0; i < audioData.length; i++) {
    const sample = Math.max(-1, Math.min(1, audioData[i]));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
    offset += 2;
  }

  return buffer;
}
