"use client";

import Image from "next/image";
import styles from "./page.module.css";
import VoiceRecorder from '@/components/VoiceRecorder'
import { useState } from 'react'
import Hearing from '@material-ui/icons/Hearing'
import PlayCircleFilled from '@material-ui/icons/PlayCircleFilled'
import VolumeUp from '@material-ui/icons/VolumeUp'
import Hourglass from '@material-ui/icons/HourglassFullTwoTone'

export default function Home() {
  const [voiceStatus, setVoiceStatus] = useState('start')
  return (
    <div className={styles.page} style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      { voiceStatus === 'start' && <PlayCircleFilled style={{fontSize: 180}}/> }
      { voiceStatus === 'listening' && <Hearing style={{fontSize: 180}}/> }
      { voiceStatus === 'speaking' && <VolumeUp style={{fontSize: 180}}/> }
      { voiceStatus === 'processing' && <Hourglass style={{fontSize: 180}}/> }
        <VoiceRecorder
          onListening={() => {
            setVoiceStatus('listening')
          }}
          onVoiceProcessingBegin={() => {
            setVoiceStatus('processing')
          }}
          onVoiceProcessingEnd={() => {
            setVoiceStatus('speaking')
          }}
          onSpeakingEnd={() => {
            setVoiceStatus('start')
          }}
        />
    </div>
  );
}
