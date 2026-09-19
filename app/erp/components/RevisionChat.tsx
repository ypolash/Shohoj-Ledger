"use client";

import React, { useState, useRef, useEffect } from 'react';
import styles from './RevisionChat.module.css';

export interface ChatMessage {
  id: string;
  sender: 'CLIENT' | 'STUDIO' | 'EDITOR';
  senderName: string;
  type: 'TEXT' | 'IMAGE' | 'VOICE';
  text?: string;
  imageUrl?: string;
  audioUrl?: string;
  audioDuration?: number;
  timecode?: string;
  createdAt: string;
}

interface RevisionChatProps {
  projectId: string;
  currentUserRole: 'STUDIO' | 'CLIENT' | 'EDITOR';
  currentUserName: string;
  messages: ChatMessage[];
  demoFiles?: Array<{ id: string; name: string; url: string; date: string; note?: string; uploadedBy?: string }>;
  onRefresh?: () => void;
}

export default function RevisionChat({
  projectId,
  currentUserRole,
  currentUserName,
  messages = [],
  demoFiles = [],
  onRefresh
}: RevisionChatProps) {
  const [text, setText] = useState('');
  const [timecode, setTimecode] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedAudio, setRecordedAudio] = useState<{ url: string; duration: number } | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const scrollBottomRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    scrollBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, selectedImage, recordedAudio]);

  // Image Selection Handler (Strictly Image, No Video)
  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Only image attachments are allowed (no video files).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Start Voice Recording
  const startVoiceRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Microphone access is not supported in this browser.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      let mimeType = 'audio/webm';
      if (typeof MediaRecorder.isTypeSupported === 'function') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
          mimeType = 'audio/ogg';
        }
      }

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const reader = new FileReader();
        reader.onload = () => {
          setRecordedAudio({
            url: reader.result as string,
            duration: recordingSeconds
          });
        };
        reader.readAsDataURL(audioBlob);

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start(100);
      setIsRecording(true);
      setRecordingSeconds(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Could not access microphone. Please grant permission in your browser.');
    }
  };

  // Stop Voice Recording
  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
  };

  // Cancel Voice Recording
  const cancelVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
      setIsRecording(false);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      setRecordedAudio(null);
      setRecordingSeconds(0);
    }
  };

  // Send Message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim() && !selectedImage && !recordedAudio) return;

    setIsSubmitting(true);
    try {
      const payload: any = {
        action: 'SEND_CHAT_MESSAGE',
        sender: currentUserRole,
        senderName: currentUserName,
        text: text.trim(),
        timecode: timecode.trim(),
        imageUrl: selectedImage || '',
        audioUrl: recordedAudio?.url || '',
        audioDuration: recordedAudio?.duration || 0,
        type: recordedAudio ? 'VOICE' : selectedImage ? 'IMAGE' : 'TEXT'
      };

      const res = await fetch(`/api/portal/project/${projectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setText('');
        setTimecode('');
        setSelectedImage(null);
        setRecordedAudio(null);
        if (onRefresh) onRefresh();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to send message');
      }
    } catch (err) {
      console.error('Failed to send revision message:', err);
      alert('Network error sending message');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Find latest editor-shared cut
  const latestCut = demoFiles && demoFiles.length > 0 ? demoFiles[demoFiles.length - 1] : null;

  const formatSecs = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className={styles.chatContainer}>
      {/* Chat Top Header */}
      <div className={styles.chatHeader}>
        <div className={styles.chatHeaderLeft}>
          <span className="material-symbols-outlined" style={{ color: '#fbbf24', fontSize: '20px' }}>
            forum
          </span>
          <h4 className={styles.chatHeaderTitle}>
            Live Revision & Feedback Chat
          </h4>
        </div>
        <div className={styles.liveBadge}>
          <span className={styles.liveDot}></span>
          Client • Studio • Editor
        </div>
      </div>

      {/* Editor Delivered Cut Top Banner */}
      {latestCut && (
        <div className={styles.editorCutBanner}>
          <div className={styles.editorCutInfo}>
            <span className="material-symbols-outlined" style={{ color: '#38bdf8', fontSize: '18px' }}>
              play_circle
            </span>
            <span>
              <strong>Latest Demo Cut:</strong> {latestCut.name}{' '}
              {latestCut.uploadedBy ? `(${latestCut.uploadedBy})` : ''}
            </span>
          </div>
          <a
            href={latestCut.url}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.watchCutBtn}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>open_in_new</span>
            Watch Demo Cut ↗
          </a>
        </div>
      )}

      {/* Message Thread Scroll Area */}
      <div className={styles.messagesScrollArea}>
        {messages.length === 0 ? (
          <div className={styles.emptyState}>
            <span className="material-symbols-outlined" style={{ fontSize: '40px', color: '#64748b', display: 'block', marginBottom: '8px' }}>
              chat_bubble_outline
            </span>
            <strong>No revision messages yet</strong>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>
              Send a text message, screenshot / image, or voice note to discuss revision requests.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isSelf = msg.sender === currentUserRole;
            const isClient = msg.sender === 'CLIENT';
            const isEditor = msg.sender === 'EDITOR';

            return (
              <div
                key={msg.id}
                className={`${styles.msgRow} ${isSelf ? styles.msgRowSelf : styles.msgRowOther}`}
              >
                {/* Avatar */}
                <div
                  className={styles.msgAvatar}
                  style={{
                    background: isClient
                      ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                      : isEditor
                      ? 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)'
                      : 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)'
                  }}
                  title={`${msg.senderName} (${msg.sender})`}
                >
                  {isClient ? '👤' : isEditor ? '🎬' : '🏢'}
                </div>

                {/* Content Block */}
                <div className={styles.msgContentBlock}>
                  <div className={styles.msgMetaHeader} style={{ justifyContent: isSelf ? 'flex-end' : 'flex-start' }}>
                    <strong style={{ color: isClient ? '#34d399' : isEditor ? '#38bdf8' : '#c084fc' }}>
                      {msg.senderName || msg.sender}
                    </strong>
                    <span>•</span>
                    <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`${styles.msgBubble} ${
                      isClient ? styles.bubbleClient : isEditor ? styles.bubbleEditor : styles.bubbleStudio
                    }`}
                  >
                    {/* Timecode Pill */}
                    {msg.timecode && (
                      <div className={styles.timecodePill}>
                        <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>timer</span>
                        {msg.timecode}
                      </div>
                    )}

                    {/* Image Attachment */}
                    {msg.imageUrl && (
                      <img
                        src={msg.imageUrl}
                        alt="Revision Attachment"
                        className={styles.chatImageAttachment}
                        onClick={() => setExpandedImage(msg.imageUrl || null)}
                      />
                    )}

                    {/* Audio / Voice Note */}
                    {msg.audioUrl && (
                      <div className={styles.audioPlayerWidget}>
                        <span className="material-symbols-outlined" style={{ color: '#fbbf24', fontSize: '18px' }}>
                          mic
                        </span>
                        <audio controls src={msg.audioUrl} preload="auto" />
                        {msg.audioDuration ? (
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                            {formatSecs(msg.audioDuration)}
                          </span>
                        ) : null}
                      </div>
                    )}

                    {/* Text Message */}
                    {msg.text && (
                      <p style={{ margin: 0, whiteSpace: 'pre-line' }}>{msg.text}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={scrollBottomRef} />
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSendMessage} className={styles.chatInputArea}>
        {/* Image Attachment Preview */}
        {selectedImage && (
          <div className={styles.previewBar}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img src={selectedImage} alt="Preview" className={styles.previewThumb} />
              <span style={{ color: '#cbd5e1' }}>Image attached (Ready to send)</span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedImage(null)}
              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
            </button>
          </div>
        )}

        {/* Recorded Audio Preview */}
        {recordedAudio && (
          <div className={styles.previewBar}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-symbols-outlined" style={{ color: '#fbbf24' }}>mic</span>
              <audio controls src={recordedAudio.url} style={{ height: '28px' }} />
              <span style={{ color: '#cbd5e1' }}>({formatSecs(recordedAudio.duration)})</span>
            </div>
            <button
              type="button"
              onClick={() => setRecordedAudio(null)}
              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
            </button>
          </div>
        )}

        {/* Active Audio Recording Bar */}
        {isRecording && (
          <div className={styles.recordingBar}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className={styles.recDot}></span>
              <span>Recording Voice Note... {formatSecs(recordingSeconds)}</span>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={cancelVoiceRecording}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '12px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={stopVoiceRecording}
                style={{ padding: '4px 10px', borderRadius: '6px', background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '11px' }}
              >
                Done ✓
              </button>
            </div>
          </div>
        )}

        {/* Controls Row */}
        {!isRecording && (
          <div className={styles.inputControlsRow}>
            {/* Hidden image input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImagePick}
            />

            {/* Attach Image Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={styles.actionIconBtn}
              title="Attach Screenshot / Image Reference"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>image</span>
            </button>

            {/* Record Voice Note Button */}
            <button
              type="button"
              onClick={startVoiceRecording}
              className={styles.actionIconBtn}
              title="Record Voice Note"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>mic</span>
            </button>

            {/* Optional Timecode Input */}
            <input
              type="text"
              placeholder="00:15 - 00:22"
              value={timecode}
              onChange={(e) => setTimecode(e.target.value)}
              className={styles.timecodeInput}
              title="Optional Timecode"
            />

            {/* Message Text Input */}
            <input
              type="text"
              placeholder="Type revision notes..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className={styles.textInput}
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={isSubmitting || (!text.trim() && !selectedImage && !recordedAudio)}
              className={styles.sendBtn}
              title="Send Revision Message"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>send</span>
            </button>
          </div>
        )}
      </form>

      {/* Expanded Image Modal */}
      {expandedImage && (
        <div className={styles.imageModalOverlay} onClick={() => setExpandedImage(null)}>
          <img src={expandedImage} alt="Expanded Attachment" className={styles.modalImg} />
        </div>
      )}
    </div>
  );
}
