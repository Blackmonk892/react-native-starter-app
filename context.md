```src\theme\index.ts
export * from './colors';

```

```src\theme\colors.ts
/**
 * App color palette - Inspired by modern AI/tech aesthetics
 * Matching the Flutter app's beautiful theme
 */
export const AppColors = {
  // Primary gradient colors - Deep space with electric accents
  primaryDark: '#0A0E1A',
  primaryMid: '#141B2D',
  surfaceCard: '#1C2438',
  surfaceElevated: '#242F4A',

  // Accent colors - Electric cyan, violet, and more
  accentCyan: '#00D9FF',
  accentViolet: '#8B5CF6',
  accentPink: '#EC4899',
  accentGreen: '#10B981',
  accentOrange: '#F59E0B',

  // Text colors
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',

  // Status colors
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
} as const;

export type AppColorsType = typeof AppColors;

```

```src\services\ModelService.tsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import { RunAnywhere, ModelCategory } from '@runanywhere/core';
import { LlamaCPP } from '@runanywhere/llamacpp';
import { ONNX, ModelArtifactType } from '@runanywhere/onnx';

// Model IDs - matching sample app model registry
// See: /Users/shubhammalhotra/Desktop/test-fresh/runanywhere-sdks/examples/react-native/RunAnywhereAI/App.tsx
const MODEL_IDS = {
  llm: 'lfm2-350m-q8_0', // LiquidAI LFM2 - fast and efficient
  stt: 'sherpa-onnx-whisper-tiny.en',
  tts: 'vits-piper-en_US-lessac-medium',
} as const;

interface ModelServiceState {
  // Download state
  isLLMDownloading: boolean;
  isSTTDownloading: boolean;
  isTTSDownloading: boolean;

  llmDownloadProgress: number;
  sttDownloadProgress: number;
  ttsDownloadProgress: number;

  // Load state
  isLLMLoading: boolean;
  isSTTLoading: boolean;
  isTTSLoading: boolean;

  // Loaded state
  isLLMLoaded: boolean;
  isSTTLoaded: boolean;
  isTTSLoaded: boolean;

  isVoiceAgentReady: boolean;

  // Actions
  downloadAndLoadLLM: () => Promise<void>;
  downloadAndLoadSTT: () => Promise<void>;
  downloadAndLoadTTS: () => Promise<void>;
  downloadAndLoadAllModels: () => Promise<void>;
  unloadAllModels: () => Promise<void>;
}

const ModelServiceContext = createContext<ModelServiceState | null>(null);

export const useModelService = () => {
  const context = useContext(ModelServiceContext);
  if (!context) {
    throw new Error('useModelService must be used within ModelServiceProvider');
  }
  return context;
};

interface ModelServiceProviderProps {
  children: React.ReactNode;
}

export const ModelServiceProvider: React.FC<ModelServiceProviderProps> = ({ children }) => {
  // Download state
  const [isLLMDownloading, setIsLLMDownloading] = useState(false);
  const [isSTTDownloading, setIsSTTDownloading] = useState(false);
  const [isTTSDownloading, setIsTTSDownloading] = useState(false);

  const [llmDownloadProgress, setLLMDownloadProgress] = useState(0);
  const [sttDownloadProgress, setSTTDownloadProgress] = useState(0);
  const [ttsDownloadProgress, setTTSDownloadProgress] = useState(0);

  // Load state
  const [isLLMLoading, setIsLLMLoading] = useState(false);
  const [isSTTLoading, setIsSTTLoading] = useState(false);
  const [isTTSLoading, setIsTTSLoading] = useState(false);

  // Loaded state
  const [isLLMLoaded, setIsLLMLoaded] = useState(false);
  const [isSTTLoaded, setIsSTTLoaded] = useState(false);
  const [isTTSLoaded, setIsTTSLoaded] = useState(false);

  const isVoiceAgentReady = isLLMLoaded && isSTTLoaded && isTTSLoaded;

  // Check if model is downloaded (per docs: use getModelInfo and check localPath)
  const checkModelDownloaded = useCallback(async (modelId: string): Promise<boolean> => {
    try {
      const modelInfo = await RunAnywhere.getModelInfo(modelId);
      return !!modelInfo?.localPath;
    } catch {
      return false;
    }
  }, []);

  // Download and load LLM
  const downloadAndLoadLLM = useCallback(async () => {
    if (isLLMDownloading || isLLMLoading) return;

    try {
      const isDownloaded = await checkModelDownloaded(MODEL_IDS.llm);

      if (!isDownloaded) {
        setIsLLMDownloading(true);
        setLLMDownloadProgress(0);

        // Download with progress (per docs: progress.progress is 0-1)
        await RunAnywhere.downloadModel(MODEL_IDS.llm, (progress) => {
          setLLMDownloadProgress(progress.progress * 100);
        });

        setIsLLMDownloading(false);
      }

      // Load the model (per docs: get localPath first, then load)
      setIsLLMLoading(true);
      const modelInfo = await RunAnywhere.getModelInfo(MODEL_IDS.llm);
      if (modelInfo?.localPath) {
        await RunAnywhere.loadModel(modelInfo.localPath);
        setIsLLMLoaded(true);
      }
      setIsLLMLoading(false);
    } catch (error) {
      console.error('LLM download/load error:', error);
      setIsLLMDownloading(false);
      setIsLLMLoading(false);
    }
  }, [isLLMDownloading, isLLMLoading, checkModelDownloaded]);

  // Download and load STT
  const downloadAndLoadSTT = useCallback(async () => {
    if (isSTTDownloading || isSTTLoading) return;

    try {
      const isDownloaded = await checkModelDownloaded(MODEL_IDS.stt);

      if (!isDownloaded) {
        setIsSTTDownloading(true);
        setSTTDownloadProgress(0);

        await RunAnywhere.downloadModel(MODEL_IDS.stt, (progress) => {
          setSTTDownloadProgress(progress.progress * 100);
        });

        setIsSTTDownloading(false);
      }

      // Load the STT model (per docs: loadSTTModel(localPath, 'whisper'))
      setIsSTTLoading(true);
      const modelInfo = await RunAnywhere.getModelInfo(MODEL_IDS.stt);
      if (modelInfo?.localPath) {
        await RunAnywhere.loadSTTModel(modelInfo.localPath, 'whisper');
        setIsSTTLoaded(true);
      }
      setIsSTTLoading(false);
    } catch (error) {
      console.error('STT download/load error:', error);
      setIsSTTDownloading(false);
      setIsSTTLoading(false);
    }
  }, [isSTTDownloading, isSTTLoading, checkModelDownloaded]);

  // Download and load TTS
  const downloadAndLoadTTS = useCallback(async () => {
    if (isTTSDownloading || isTTSLoading) return;

    try {
      const isDownloaded = await checkModelDownloaded(MODEL_IDS.tts);

      if (!isDownloaded) {
        setIsTTSDownloading(true);
        setTTSDownloadProgress(0);

        await RunAnywhere.downloadModel(MODEL_IDS.tts, (progress) => {
          setTTSDownloadProgress(progress.progress * 100);
        });

        setIsTTSDownloading(false);
      }

      // Load the TTS model (per docs: loadTTSModel(localPath, 'piper'))
      setIsTTSLoading(true);
      const modelInfo = await RunAnywhere.getModelInfo(MODEL_IDS.tts);
      if (modelInfo?.localPath) {
        await RunAnywhere.loadTTSModel(modelInfo.localPath, 'piper');
        setIsTTSLoaded(true);
      }
      setIsTTSLoading(false);
    } catch (error) {
      console.error('TTS download/load error:', error);
      setIsTTSDownloading(false);
      setIsTTSLoading(false);
    }
  }, [isTTSDownloading, isTTSLoading, checkModelDownloaded]);

  // Download and load all models
  const downloadAndLoadAllModels = useCallback(async () => {
    await Promise.all([
      downloadAndLoadLLM(),
      downloadAndLoadSTT(),
      downloadAndLoadTTS(),
    ]);
  }, [downloadAndLoadLLM, downloadAndLoadSTT, downloadAndLoadTTS]);

  // Unload all models
  const unloadAllModels = useCallback(async () => {
    try {
      await RunAnywhere.unloadModel();
      await RunAnywhere.unloadSTTModel();
      await RunAnywhere.unloadTTSModel();
      setIsLLMLoaded(false);
      setIsSTTLoaded(false);
      setIsTTSLoaded(false);
    } catch (error) {
      console.error('Error unloading models:', error);
    }
  }, []);

  const value: ModelServiceState = {
    isLLMDownloading,
    isSTTDownloading,
    isTTSDownloading,
    llmDownloadProgress,
    sttDownloadProgress,
    ttsDownloadProgress,
    isLLMLoading,
    isSTTLoading,
    isTTSLoading,
    isLLMLoaded,
    isSTTLoaded,
    isTTSLoaded,
    isVoiceAgentReady,
    downloadAndLoadLLM,
    downloadAndLoadSTT,
    downloadAndLoadTTS,
    downloadAndLoadAllModels,
    unloadAllModels,
  };

  return (
    <ModelServiceContext.Provider value={value}>
      {children}
    </ModelServiceContext.Provider>
  );
};

/**
 * Register default models with the SDK
 * Models match the sample app: /Users/shubhammalhotra/Desktop/test-fresh/runanywhere-sdks/examples/react-native/RunAnywhereAI/App.tsx
 */
export const registerDefaultModels = async () => {
  // LLM Model - LiquidAI LFM2 350M (fast, efficient, great for mobile)
  await LlamaCPP.addModel({
    id: MODEL_IDS.llm,
    name: 'LiquidAI LFM2 350M Q8_0',
    url: 'https://huggingface.co/LiquidAI/LFM2-350M-GGUF/resolve/main/LFM2-350M-Q8_0.gguf',
    memoryRequirement: 400_000_000,
  });

  // Also add SmolLM2 as alternative smaller model
  await LlamaCPP.addModel({
    id: 'smollm2-360m-q8_0',
    name: 'SmolLM2 360M Q8_0',
    url: 'https://huggingface.co/prithivMLmods/SmolLM2-360M-GGUF/resolve/main/SmolLM2-360M.Q8_0.gguf',
    memoryRequirement: 500_000_000,
  });

  // STT Model - Sherpa Whisper Tiny English
  // Using tar.gz from RunanywhereAI/sherpa-onnx for fast native extraction
  await ONNX.addModel({
    id: MODEL_IDS.stt,
    name: 'Sherpa Whisper Tiny (ONNX)',
    url: 'https://github.com/RunanywhereAI/sherpa-onnx/releases/download/runanywhere-models-v1/sherpa-onnx-whisper-tiny.en.tar.gz',
    modality: ModelCategory.SpeechRecognition,
    artifactType: ModelArtifactType.TarGzArchive,
    memoryRequirement: 75_000_000,
  });

  // TTS Model - Piper TTS (US English - Medium quality)
  await ONNX.addModel({
    id: MODEL_IDS.tts,
    name: 'Piper TTS (US English - Medium)',
    url: 'https://github.com/RunanywhereAI/sherpa-onnx/releases/download/runanywhere-models-v1/vits-piper-en_US-lessac-medium.tar.gz',
    modality: ModelCategory.SpeechSynthesis,
    artifactType: ModelArtifactType.TarGzArchive,
    memoryRequirement: 65_000_000,
  });
};

```

```src\screens\VoicePipelineScreen.tsx
import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  NativeModules,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import RNFS from 'react-native-fs';
import { RunAnywhere, VoiceSessionEvent, VoiceSessionHandle } from '@runanywhere/core';
import { AppColors } from '../theme';
import { useModelService } from '../services/ModelService';
import { ModelLoaderWidget, AudioVisualizer } from '../components';

// Conditionally import Sound - disabled on iOS via react-native.config.js
let Sound: any = null;
if (Platform.OS === 'android') {
  try {
    Sound = require('react-native-sound').default;
  } catch (e) {
    console.log('react-native-sound not available');
  }
}

// iOS uses NativeAudioModule
const { NativeAudioModule } = NativeModules;

interface ConversationMessage {
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

// Model IDs - must match those registered in ModelService
const MODEL_IDS = {
  llm: 'lfm2-350m-q8_0',
  stt: 'sherpa-onnx-whisper-tiny.en',
  tts: 'vits-piper-en_US-lessac-medium',
};

export const VoicePipelineScreen: React.FC = () => {
  const modelService = useModelService();
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState<string>('Ready');
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [audioLevel, setAudioLevel] = useState(0);

  // Refs for session and audio
  const sessionRef = useRef<VoiceSessionHandle | null>(null);
  const currentSoundRef = useRef<any>(null);
  const isPlayingRef = useRef<boolean>(false);

  // Handle voice session events per docs:
  // https://docs.runanywhere.ai/react-native/voice-agent#voicesessionevent
  const handleVoiceEvent = useCallback((event: VoiceSessionEvent) => {
    switch (event.type) {
      case 'sessionStarted':
        setStatus('Listening...');
        setAudioLevel(0.2);
        break;

      case 'listeningStarted':
        setStatus('Listening...');
        setAudioLevel(0.3);
        break;

      case 'speechDetected':
        setStatus('Hearing you...');
        setAudioLevel(0.7);
        break;

      case 'speechEnded':
        setAudioLevel(0.1);
        break;

      case 'transcribing':
        setStatus('Processing speech...');
        setAudioLevel(0.4);
        break;

      case 'transcriptionComplete':
        if (event.data?.transcript) {
          const userMessage: ConversationMessage = {
            role: 'user',
            text: event.data.transcript,
            timestamp: new Date(),
          };
          setConversation(prev => [...prev, userMessage]);
        }
        setStatus('Thinking...');
        setAudioLevel(0.5);
        break;

      case 'generating':
        setStatus('Generating response...');
        setAudioLevel(0.5);
        break;

      case 'generationComplete':
        if (event.data?.response) {
          const assistantMessage: ConversationMessage = {
            role: 'assistant',
            text: event.data.response,
            timestamp: new Date(),
          };
          setConversation(prev => [...prev, assistantMessage]);
        }
        setStatus('Synthesizing...');
        setAudioLevel(0.6);
        break;

      case 'synthesizing':
        setStatus('Preparing voice...');
        break;

      case 'synthesisComplete':
        setStatus('Speaking...');
        // Play audio if provided
        if (event.data?.audio) {
          playResponseAudio(event.data.audio);
        }
        break;

      case 'speaking':
        setStatus('Speaking...');
        setAudioLevel(0.8);
        break;

      case 'turnComplete':
        setStatus('Listening...');
        setAudioLevel(0.3);
        break;

      case 'error':
        setStatus(`Error: ${event.data?.error || 'Unknown error'}`);
        setAudioLevel(0);
        console.error('Voice session error:', event.data?.error);
        break;
    }
  }, []);

  // Play synthesized audio response - platform-specific
  const playResponseAudio = async (base64Audio: string) => {
    try {
      if (Platform.OS === 'ios' && NativeAudioModule) {
        // iOS: Use NativeAudioModule
        isPlayingRef.current = true;
        setAudioLevel(0.8);
        await NativeAudioModule.playAudioBase64(base64Audio, 22050);
        isPlayingRef.current = false;
        setAudioLevel(0.3);
      } else if (Platform.OS === 'android' && Sound) {
        // Android: Use react-native-sound
        const wavData = createWavFromBase64Float32(base64Audio, 22050);
        const tempPath = `${RNFS.TemporaryDirectoryPath}/voice_response_${Date.now()}.wav`;
        await RNFS.writeFile(tempPath, wavData, 'base64');

        const sound = new Sound(tempPath, '', (error: any) => {
          if (error) {
            console.error('Failed to load sound:', error);
            return;
          }

          currentSoundRef.current = sound;
          setAudioLevel(0.8);

          sound.play((success: boolean) => {
            sound.release();
            currentSoundRef.current = null;
            setAudioLevel(0.3);
          });
        });
      } else {
        console.warn('No audio playback module available');
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      isPlayingRef.current = false;
      setAudioLevel(0.3);
    }
  };

  // Convert base64 float32 PCM to WAV format
  const createWavFromBase64Float32 = (base64Audio: string, sampleRate: number): string => {
    const binaryStr = atob(base64Audio);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    const float32Samples = new Float32Array(bytes.buffer);
    const numSamples = float32Samples.length;

    const wavBuffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(wavBuffer);

    // WAV header
    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + numSamples * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, numSamples * 2, true);

    let offset = 44;
    for (let i = 0; i < float32Samples.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Samples[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      offset += 2;
    }

    const uint8Array = new Uint8Array(wavBuffer);
    let result = '';
    for (let i = 0; i < uint8Array.length; i++) {
      result += String.fromCharCode(uint8Array[i]);
    }
    return btoa(result);
  };

  // Start voice session per docs:
  // https://docs.runanywhere.ai/react-native/voice-agent#startvoicesession
  const startVoiceAgent = async () => {
    setIsActive(true);
    setStatus('Starting...');

    try {
      // Per docs: Use startVoiceSession with VoiceSessionConfig and callback
      sessionRef.current = await RunAnywhere.startVoiceSession(
        {
          agentConfig: {
            llmModelId: MODEL_IDS.llm,
            sttModelId: MODEL_IDS.stt,
            ttsModelId: MODEL_IDS.tts,
            systemPrompt: 'You are a helpful, friendly voice assistant. Keep your responses brief and conversational.',
            generationOptions: {
              maxTokens: 150,
              temperature: 0.7,
            },
          },
          enableVAD: true,
          vadSensitivity: 0.5,
          speechTimeout: 3000, // 3 seconds timeout for speech
        },
        handleVoiceEvent
      );
    } catch (error) {
      console.error('Voice agent error:', error);
      setStatus(`Error: ${error}`);
      setIsActive(false);
    }
  };

  const stopVoiceAgent = async () => {
    try {
      // Stop any playing audio - platform-specific
      if (Platform.OS === 'ios' && isPlayingRef.current && NativeAudioModule) {
        await NativeAudioModule.stopPlayback();
        isPlayingRef.current = false;
      } else if (currentSoundRef.current) {
        currentSoundRef.current.stop(() => {
          currentSoundRef.current?.release();
          currentSoundRef.current = null;
        });
      }

      // Stop the voice session
      if (sessionRef.current) {
        await sessionRef.current.stop();
        sessionRef.current = null;
      }

      setIsActive(false);
      setStatus('Ready');
      setAudioLevel(0);
    } catch (error) {
      console.error('Stop voice agent error:', error);
    }
  };

  const clearConversation = () => {
    setConversation([]);
  };

  if (!modelService.isVoiceAgentReady) {
    return (
      <ModelLoaderWidget
        title="Voice Agent Setup Required"
        subtitle="Download and load all models (LLM, STT, TTS) to use the voice agent"
        icon="pipeline"
        accentColor={AppColors.accentGreen}
        isDownloading={
          modelService.isLLMDownloading ||
          modelService.isSTTDownloading ||
          modelService.isTTSDownloading
        }
        isLoading={
          modelService.isLLMLoading ||
          modelService.isSTTLoading ||
          modelService.isTTSLoading
        }
        progress={
          (modelService.llmDownloadProgress +
            modelService.sttDownloadProgress +
            modelService.ttsDownloadProgress) /
          3
        }
        onLoad={modelService.downloadAndLoadAllModels}
      />
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Status Area */}
        <View style={[styles.statusArea, isActive && styles.statusActive]}>
          {isActive ? (
            <>
              <AudioVisualizer level={audioLevel} />
              <Text style={[styles.statusText, { color: AppColors.accentGreen }]}>
                {status}
              </Text>
              <Text style={styles.statusSubtitle}>
                Voice agent is running
              </Text>
            </>
          ) : (
            <>
              <View style={styles.agentIconContainer}>
                <Text style={styles.agentIcon}>✨</Text>
              </View>
              <Text style={styles.statusText}>Voice Agent</Text>
              <Text style={styles.statusSubtitle}>
                Full speech-to-speech AI conversation
              </Text>
            </>
          )}
        </View>

        {/* Conversation */}
        {conversation.length > 0 && (
          <View style={styles.conversationSection}>
            <View style={styles.conversationHeader}>
              <Text style={styles.conversationTitle}>Conversation</Text>
              <TouchableOpacity onPress={clearConversation}>
                <Text style={styles.clearButton}>Clear</Text>
              </TouchableOpacity>
            </View>
            {conversation.map((message, index) => (
              <View
                key={index}
                style={[
                  styles.messageCard,
                  message.role === 'user'
                    ? styles.userMessage
                    : styles.assistantMessage,
                ]}
              >
                <View style={styles.messageHeader}>
                  <Text style={styles.roleIcon}>
                    {message.role === 'user' ? '👤' : '🤖'}
                  </Text>
                  <Text style={styles.roleText}>
                    {message.role === 'user' ? 'You' : 'Assistant'}
                  </Text>
                </View>
                <Text style={styles.messageText}>{message.text}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Pipeline Info */}
        {!isActive && conversation.length === 0 && (
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>How it works:</Text>
            <View style={styles.infoStep}>
              <Text style={styles.stepNumber}>1️⃣</Text>
              <Text style={styles.stepText}>Voice Activity Detection (VAD) listens for speech</Text>
            </View>
            <View style={styles.infoStep}>
              <Text style={styles.stepNumber}>2️⃣</Text>
              <Text style={styles.stepText}>Speech is transcribed (STT with Whisper)</Text>
            </View>
            <View style={styles.infoStep}>
              <Text style={styles.stepNumber}>3️⃣</Text>
              <Text style={styles.stepText}>AI generates response (LLM with SmolLM2)</Text>
            </View>
            <View style={styles.infoStep}>
              <Text style={styles.stepNumber}>4️⃣</Text>
              <Text style={styles.stepText}>Response is spoken (TTS with Piper)</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Control Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          onPress={isActive ? stopVoiceAgent : startVoiceAgent}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={
              isActive
                ? [AppColors.error, '#DC2626']
                : [AppColors.accentGreen, '#059669']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.controlButton}
          >
            <Text style={styles.controlIcon}>
              {isActive ? '⏹' : '✨'}
            </Text>
            <Text style={styles.controlButtonText}>
              {isActive ? 'Stop Agent' : 'Start Voice Agent'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.primaryDark,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  statusArea: {
    padding: 32,
    backgroundColor: AppColors.surfaceCard,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: AppColors.textMuted + '1A',
    alignItems: 'center',
    marginBottom: 24,
  },
  statusActive: {
    borderColor: AppColors.accentGreen + '80',
    borderWidth: 2,
    shadowColor: AppColors.accentGreen,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  agentIconContainer: {
    width: 100,
    height: 100,
    backgroundColor: AppColors.accentGreen + '20',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  agentIcon: {
    fontSize: 48,
  },
  statusText: {
    fontSize: 20,
    fontWeight: '700',
    color: AppColors.textPrimary,
    marginBottom: 8,
  },
  statusSubtitle: {
    fontSize: 14,
    color: AppColors.textSecondary,
  },
  conversationSection: {
    marginBottom: 24,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  conversationTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.textPrimary,
  },
  clearButton: {
    fontSize: 14,
    color: AppColors.accentGreen,
    fontWeight: '600',
  },
  messageCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  userMessage: {
    backgroundColor: AppColors.accentCyan + '20',
    borderColor: AppColors.accentCyan + '40',
    alignSelf: 'flex-end',
    maxWidth: '85%',
  },
  assistantMessage: {
    backgroundColor: AppColors.surfaceCard,
    borderColor: AppColors.textMuted + '20',
    alignSelf: 'flex-start',
    maxWidth: '85%',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  roleIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.textSecondary,
    textTransform: 'uppercase',
  },
  messageText: {
    fontSize: 14,
    color: AppColors.textPrimary,
    lineHeight: 20,
  },
  infoCard: {
    padding: 20,
    backgroundColor: AppColors.surfaceCard + '80',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AppColors.textMuted + '1A',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.textPrimary,
    marginBottom: 16,
  },
  infoStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepNumber: {
    fontSize: 20,
    marginRight: 12,
  },
  stepText: {
    fontSize: 14,
    color: AppColors.textSecondary,
    flex: 1,
  },
  buttonContainer: {
    padding: 24,
    backgroundColor: AppColors.surfaceCard + 'CC',
    borderTopWidth: 1,
    borderTopColor: AppColors.textMuted + '1A',
  },
  controlButton: {
    flexDirection: 'row',
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    elevation: 8,
    shadowColor: AppColors.accentGreen,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
  },
  controlIcon: {
    fontSize: 28,
  },
  controlButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

```

```src\screens\ToolCallingScreen.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  RunAnywhere,
  ToolDefinition,
  ToolCall,
  ToolResult,
  ToolCallingResult,
} from '@runanywhere/core';
import { AppColors } from '../theme';
import { useModelService } from '../services/ModelService';
import { ModelLoaderWidget } from '../components';

// ─── Tool Definitions ────────────────────────────────────────────

const DEMO_TOOLS: ToolDefinition[] = [
  {
    name: 'get_weather',
    description: 'Get the current weather for a given city',
    parameters: [
      {
        name: 'city',
        type: 'string',
        description: 'The city name, e.g. "San Francisco"',
        required: true,
      },
      {
        name: 'unit',
        type: 'string',
        description: 'Temperature unit: "celsius" or "fahrenheit"',
        required: false,
        defaultValue: 'celsius',
        enum: ['celsius', 'fahrenheit'],
      },
    ],
  },
  {
    name: 'calculate',
    description: 'Perform a mathematical calculation',
    parameters: [
      {
        name: 'expression',
        type: 'string',
        description: 'A math expression to evaluate, e.g. "2 + 2"',
        required: true,
      },
    ],
  },
  {
    name: 'get_time',
    description: 'Get the current date and time for a timezone',
    parameters: [
      {
        name: 'timezone',
        type: 'string',
        description: 'IANA timezone, e.g. "America/New_York"',
        required: false,
        defaultValue: 'UTC',
      },
    ],
  },
];

// ─── Mock Tool Executors ─────────────────────────────────────────

const mockWeather = async (args: Record<string, unknown>) => {
  const city = (args.city as string) || 'Unknown';
  const unit = (args.unit as string) || 'celsius';
  const temp = Math.floor(Math.random() * 30) + 5;
  return {
    city,
    temperature: unit === 'fahrenheit' ? Math.round(temp * 1.8 + 32) : temp,
    unit,
    condition: ['Sunny', 'Cloudy', 'Rainy', 'Partly Cloudy'][Math.floor(Math.random() * 4)],
    humidity: Math.floor(Math.random() * 60) + 30,
  };
};

const mockCalculate = async (args: Record<string, unknown>) => {
  const expr = (args.expression as string) || '0';
  try {
    // Simple safe eval for basic math
    const sanitized = expr.replace(/[^0-9+\-*/().% ]/g, '');
    const result = Function(`"use strict"; return (${sanitized})`)();
    return { expression: expr, result: Number(result) };
  } catch {
    return { expression: expr, error: 'Could not evaluate expression' };
  }
};

const mockGetTime = async (args: Record<string, unknown>) => {
  const tz = (args.timezone as string) || 'UTC';
  try {
    const now = new Date().toLocaleString('en-US', { timeZone: tz });
    return { timezone: tz, datetime: now };
  } catch {
    return { timezone: tz, datetime: new Date().toISOString() };
  }
};

// ─── Log Entry Types ─────────────────────────────────────────────

type LogType = 'info' | 'prompt' | 'tool_call' | 'tool_result' | 'response' | 'error';

interface LogEntry {
  id: number;
  type: LogType;
  title: string;
  detail?: string;
  timestamp: Date;
}

// ─── Screen Component ────────────────────────────────────────────

export const ToolCallingScreen: React.FC = () => {
  const modelService = useModelService();
  const [inputText, setInputText] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [toolsRegistered, setToolsRegistered] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const logIdRef = useRef(0);

  // Auto-scroll on new logs
  useEffect(() => {
    if (logs.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [logs]);

  const addLog = (type: LogType, title: string, detail?: string) => {
    const id = Date.now() * 1000 + Math.floor(Math.random() * 1000);
    setLogs(prev => [
      ...prev,
      { id, type, title, detail, timestamp: new Date() },
    ]);
  };

  // ─── Register tools ──────────────────────────────────────────

  const handleRegisterTools = () => {
    try {
      RunAnywhere.clearTools();

      RunAnywhere.registerTool(DEMO_TOOLS[0], mockWeather);
      RunAnywhere.registerTool(DEMO_TOOLS[1], mockCalculate);
      RunAnywhere.registerTool(DEMO_TOOLS[2], mockGetTime);

      setToolsRegistered(true);
      addLog('info', 'Tools Registered', `Registered ${DEMO_TOOLS.length} tools: ${DEMO_TOOLS.map(t => t.name).join(', ')}`);
    } catch (error) {
      addLog('error', 'Registration Failed', String(error));
    }
  };

  // ─── Run tool calling generation ─────────────────────────────

  const handleGenerate = async () => {
    const prompt = inputText.trim();
    if (!prompt || isRunning) return;

    setInputText('');
    setIsRunning(true);
    addLog('prompt', 'User Prompt', prompt);

    try {
      const result: ToolCallingResult = await RunAnywhere.generateWithTools(prompt, {
        tools: DEMO_TOOLS,
        maxToolCalls: 3,
        autoExecute: true,
        temperature: 0.7,
        maxTokens: 512,
      });

      // Log tool calls
      if (result.toolCalls.length > 0) {
        for (let i = 0; i < result.toolCalls.length; i++) {
          const tc = result.toolCalls[i];
          addLog(
            'tool_call',
            `Tool Call: ${tc.toolName}`,
            JSON.stringify(tc.arguments, null, 2),
          );
          if (result.toolResults[i]) {
            const tr = result.toolResults[i];
            addLog(
              'tool_result',
              `Result: ${tr.toolName} (${tr.success ? 'success' : 'failed'})`,
              tr.success ? JSON.stringify(tr.result, null, 2) : tr.error,
            );
          }
        }
      } else {
        addLog('info', 'No Tool Calls', 'The model responded without calling any tools');
      }

      // Log final response
      addLog('response', 'Model Response', result.text || '(empty)');
    } catch (error) {
      addLog('error', 'Generation Failed', String(error));
    } finally {
      setIsRunning(false);
    }
  };

  // ─── Manual parse test ───────────────────────────────────────

  const handleParseSample = async () => {
    addLog('info', 'Parse Test', 'Testing parseToolCall with sample output...');

    const sampleOutput = `I'll check the weather for you.\n<tool_call>{"name": "get_weather", "arguments": {"city": "San Francisco"}}</tool_call>`;

    try {
      const parsed = await RunAnywhere.parseToolCall(sampleOutput);
      addLog(
        'tool_call',
        'Parsed Tool Call',
        parsed.toolCall
          ? `Tool: ${parsed.toolCall.toolName}\nArgs: ${JSON.stringify(parsed.toolCall.arguments, null, 2)}\nClean text: "${parsed.text}"`
          : `No tool call detected. Text: "${parsed.text}"`,
      );
    } catch (error) {
      addLog('error', 'Parse Failed', String(error));
    }
  };

  // ─── Render ──────────────────────────────────────────────────

  if (!modelService.isLLMLoaded) {
    return (
      <ModelLoaderWidget
        title="LLM Model Required"
        subtitle="Download and load a language model to test tool calling"
        icon="tools"
        accentColor={AppColors.accentOrange}
        isDownloading={modelService.isLLMDownloading}
        isLoading={modelService.isLLMLoading}
        progress={modelService.llmDownloadProgress}
        onLoad={modelService.downloadAndLoadLLM}
      />
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Action Buttons */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={[styles.actionBtn, toolsRegistered && styles.actionBtnActive]}
          onPress={handleRegisterTools}
        >
          <Text style={styles.actionBtnText}>
            {toolsRegistered ? 'Tools Ready' : 'Register Tools'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={handleParseSample}>
          <Text style={styles.actionBtnText}>Parse Test</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtnClear}
          onPress={() => setLogs([])}
        >
          <Text style={styles.actionBtnClearText}>Clear</Text>
        </TouchableOpacity>
      </View>

      {/* Tool chips */}
      <View style={styles.toolChips}>
        {DEMO_TOOLS.map(tool => (
          <View key={tool.name} style={styles.toolChip}>
            <Text style={styles.toolChipText}>{tool.name}</Text>
          </View>
        ))}
      </View>

      {/* Log output */}
      <ScrollView
        ref={scrollRef}
        style={styles.logArea}
        contentContainerStyle={styles.logContent}
      >
        {logs.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🛠</Text>
            <Text style={styles.emptyTitle}>Tool Calling Test</Text>
            <Text style={styles.emptySubtitle}>
              Register tools, then ask the model to use them.{'\n'}
              Try: "What's the weather in Tokyo?" or "Calculate 42 * 17"
            </Text>
          </View>
        ) : (
          logs.map(log => (
            <View key={log.id} style={[styles.logEntry, styles[`log_${log.type}`]]}>
              <View style={styles.logHeader}>
                <Text style={styles.logIcon}>{LOG_ICONS[log.type]}</Text>
                <Text style={styles.logTitle}>{log.title}</Text>
                <Text style={styles.logTime}>
                  {log.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </Text>
              </View>
              {log.detail ? (
                <Text style={styles.logDetail}>{log.detail}</Text>
              ) : null}
            </View>
          ))
        )}
        {isRunning && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={AppColors.accentOrange} />
            <Text style={styles.loadingText}>Generating...</Text>
          </View>
        )}
      </ScrollView>

      {/* Suggestion chips */}
      <View style={styles.suggestions}>
        {['What\'s the weather in Tokyo?', 'Calculate 123 * 456', 'What time is it in New York?'].map(s => (
          <TouchableOpacity
            key={s}
            style={styles.suggestionChip}
            onPress={() => setInputText(s)}
          >
            <Text style={styles.suggestionText} numberOfLines={1}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Input */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Ask something that needs a tool..."
            placeholderTextColor={AppColors.textMuted}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleGenerate}
            editable={!isRunning}
            multiline
          />
          <TouchableOpacity onPress={handleGenerate} disabled={!inputText.trim() || isRunning}>
            <LinearGradient
              colors={[AppColors.accentOrange, '#E67E22']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.sendButton, (!inputText.trim() || isRunning) && styles.sendButtonDisabled]}
            >
              <Text style={styles.sendIcon}>▶</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

// ─── Constants ─────────────────────────────────────────────────

const LOG_ICONS: Record<LogType, string> = {
  info: 'ℹ️',
  prompt: '💬',
  tool_call: '🔧',
  tool_result: '📦',
  response: '🤖',
  error: '❌',
};

// ─── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.primaryDark,
  },

  // Action bar
  actionBar: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: AppColors.surfaceCard,
    borderWidth: 1,
    borderColor: AppColors.accentOrange + '40',
    alignItems: 'center',
  },
  actionBtnActive: {
    backgroundColor: AppColors.accentOrange + '20',
    borderColor: AppColors.accentOrange,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.accentOrange,
  },
  actionBtnClear: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: AppColors.surfaceCard,
    borderWidth: 1,
    borderColor: AppColors.textMuted + '40',
    alignItems: 'center',
  },
  actionBtnClearText: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.textMuted,
  },

  // Tool chips
  toolChips: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 6,
  },
  toolChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: AppColors.surfaceElevated,
    borderRadius: 8,
  },
  toolChipText: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: AppColors.textSecondary,
  },

  // Log area
  logArea: {
    flex: 1,
  },
  logContent: {
    padding: 12,
    paddingBottom: 8,
  },

  // Empty state
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: AppColors.textPrimary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: AppColors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 32,
  },

  // Log entries
  logEntry: {
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logIcon: {
    fontSize: 14,
  },
  logTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.textPrimary,
  },
  logTime: {
    fontSize: 10,
    color: AppColors.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  logDetail: {
    marginTop: 6,
    fontSize: 12,
    color: AppColors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 18,
  },

  // Log type-specific colors
  log_info: {
    backgroundColor: AppColors.info + '10',
    borderColor: AppColors.info + '30',
  },
  log_prompt: {
    backgroundColor: AppColors.accentCyan + '10',
    borderColor: AppColors.accentCyan + '30',
  },
  log_tool_call: {
    backgroundColor: AppColors.accentOrange + '10',
    borderColor: AppColors.accentOrange + '30',
  },
  log_tool_result: {
    backgroundColor: AppColors.accentGreen + '10',
    borderColor: AppColors.accentGreen + '30',
  },
  log_response: {
    backgroundColor: AppColors.accentViolet + '10',
    borderColor: AppColors.accentViolet + '30',
  },
  log_error: {
    backgroundColor: AppColors.error + '10',
    borderColor: AppColors.error + '30',
  },

  // Loading
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 13,
    color: AppColors.accentOrange,
  },

  // Suggestions
  suggestions: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 6,
  },
  suggestionChip: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: AppColors.surfaceCard,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AppColors.accentOrange + '30',
  },
  suggestionText: {
    fontSize: 10,
    color: AppColors.textSecondary,
    textAlign: 'center',
  },

  // Input
  inputContainer: {
    padding: 12,
    backgroundColor: AppColors.surfaceCard + 'CC',
    borderTopWidth: 1,
    borderTopColor: AppColors.textMuted + '1A',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: AppColors.primaryMid,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: AppColors.textPrimary,
    maxHeight: 80,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  sendIcon: {
    fontSize: 18,
    color: '#FFFFFF',
  },
});

```

```src\screens\TextToSpeechScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  NativeModules,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import RNFS from 'react-native-fs';
import { RunAnywhere } from '@runanywhere/core';
import { AppColors } from '../theme';
import { useModelService } from '../services/ModelService';
import { ModelLoaderWidget } from '../components';

// Native Audio Module for better audio session management
const { NativeAudioModule } = NativeModules;

const SAMPLE_TEXTS = [
  'Hello! Welcome to RunAnywhere. Experience the power of on-device AI.',
  'The quick brown fox jumps over the lazy dog.',
  'Technology is best when it brings people together.',
  'Privacy is not something that I am merely entitled to, it is an absolute prerequisite.',
];

export const TextToSpeechScreen: React.FC = () => {
  const modelService = useModelService();
  const [text, setText] = useState('');
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [currentAudioPath, setCurrentAudioPath] = useState<string | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (NativeAudioModule && isPlaying) {
        NativeAudioModule.stopPlayback().catch(() => {});
      }
    };
  }, [isPlaying]);

  const synthesizeAndPlay = async () => {
    if (!text.trim()) {
      return;
    }

    setIsSynthesizing(true);

    try {
      // Per docs: https://docs.runanywhere.ai/react-native/tts/synthesize
      // result.audio contains base64-encoded float32 PCM
      // Using same config as sample app for consistent voice output
      const result = await RunAnywhere.synthesize(text, {
        voice: 'default',
        rate: speechRate,
        pitch: 1.0,
        volume: 1.0,
      });

      console.log(`[TTS] Synthesized: duration=${result.duration}s, sampleRate=${result.sampleRate}Hz, numSamples=${result.numSamples}`);

      // Use SDK's built-in WAV converter (same as sample app)
      const tempPath = await RunAnywhere.Audio.createWavFromPCMFloat32(
        result.audio,
        result.sampleRate || 22050
      );

      console.log(`[TTS] WAV file created: ${tempPath}`);

      setCurrentAudioPath(tempPath);
      setIsSynthesizing(false);
      setIsPlaying(true);

      // Play using native audio module
      if (NativeAudioModule) {
        try {
          const playResult = await NativeAudioModule.playAudio(tempPath);
          console.log(`[TTS] Playback started, duration: ${playResult.duration}s`);

          // Wait for playback to complete (approximate based on duration)
          setTimeout(() => {
            setIsPlaying(false);
            setCurrentAudioPath(null);
            // Clean up file
            RNFS.unlink(tempPath).catch(() => {});
          }, (result.duration + 0.5) * 1000);
        } catch (playError) {
          console.error('[TTS] Native playback error:', playError);
          setIsPlaying(false);
        }
      } else {
        console.error('[TTS] NativeAudioModule not available');
        setIsPlaying(false);
      }
    } catch (error) {
      console.error('[TTS] Error:', error);
      setIsSynthesizing(false);
      setIsPlaying(false);
    }
  };

  const stopPlayback = async () => {
    if (NativeAudioModule) {
      try {
        await NativeAudioModule.stopPlayback();
      } catch (e) {
        // Ignore
      }
    }
    setIsPlaying(false);

    // Clean up file
    if (currentAudioPath) {
      RNFS.unlink(currentAudioPath).catch(() => {});
      setCurrentAudioPath(null);
    }
  };

  if (!modelService.isTTSLoaded) {
    return (
      <ModelLoaderWidget
        title="TTS Voice Required"
        subtitle="Download and load the voice synthesis model"
        icon="volume"
        accentColor={AppColors.accentPink}
        isDownloading={modelService.isTTSDownloading}
        isLoading={modelService.isTTSLoading}
        progress={modelService.ttsDownloadProgress}
        onLoad={modelService.downloadAndLoadTTS}
      />
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Input Section */}
        <View style={styles.inputCard}>
          <TextInput
            style={styles.input}
            placeholder="Enter text to synthesize..."
            placeholderTextColor={AppColors.textMuted}
            value={text}
            onChangeText={setText}
            multiline
            numberOfLines={5}
          />
          <View style={styles.inputFooter}>
            <Text style={styles.characterCount}>
              📝 {text.length} characters
            </Text>
            {text.length > 0 && (
              <TouchableOpacity onPress={() => setText('')}>
                <Text style={styles.clearText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controlsCard}>
          <Text style={styles.controlLabel}>Speech Rate</Text>
          <View style={styles.sliderContainer}>
            <Text style={styles.sliderIcon}>🐌</Text>
            <Text style={styles.sliderValue}>{speechRate.toFixed(1)}x</Text>
            <Text style={styles.sliderIcon}>🚀</Text>
          </View>
          <View style={styles.rateButtons}>
            {[0.5, 0.75, 1.0, 1.5, 2.0].map((rate) => (
              <TouchableOpacity
                key={rate}
                onPress={() => setSpeechRate(rate)}
                style={[
                  styles.rateButton,
                  speechRate === rate && styles.rateButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.rateButtonText,
                    speechRate === rate && styles.rateButtonTextActive,
                  ]}
                >
                  {rate}x
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Playback Area */}
        <View style={[styles.playbackArea, isPlaying && styles.playbackActive]}>
          {isPlaying ? (
            <>
              <View style={styles.waveform}>
                {[...Array(7)].map((_, i) => (
                  <View key={i} style={styles.waveBar} />
                ))}
              </View>
              <Text style={styles.playbackStatus}>Playing...</Text>
            </>
          ) : isSynthesizing ? (
            <>
              <Text style={styles.loadingIcon}>⏳</Text>
              <Text style={styles.playbackStatus}>Synthesizing...</Text>
            </>
          ) : (
            <>
              <Text style={styles.playbackIcon}>🔊</Text>
              <Text style={styles.playbackStatus}>Tap to synthesize</Text>
            </>
          )}

          {/* Play Button */}
          <TouchableOpacity
            onPress={isPlaying ? stopPlayback : synthesizeAndPlay}
            disabled={isSynthesizing || !text.trim()}
            activeOpacity={0.8}
            style={styles.playButtonWrapper}
          >
            <LinearGradient
              colors={[AppColors.accentPink, '#DB2777']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.playButton}
            >
              <Text style={styles.playButtonIcon}>
                {isSynthesizing ? '⏳' : isPlaying ? '⏹' : '▶️'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Sample Texts */}
        <View style={styles.samplesSection}>
          <Text style={styles.samplesTitle}>Sample Texts</Text>
          {SAMPLE_TEXTS.map((sample, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => setText(sample)}
              style={styles.sampleItem}
            >
              <Text style={styles.sampleText} numberOfLines={2}>
                {sample}
              </Text>
              <Text style={styles.sampleIcon}>➕</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.primaryDark,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  inputCard: {
    backgroundColor: AppColors.surfaceCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: AppColors.accentPink + '33',
    marginBottom: 24,
    overflow: 'hidden',
  },
  input: {
    padding: 20,
    fontSize: 15,
    color: AppColors.textPrimary,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 16,
    backgroundColor: AppColors.primaryMid,
  },
  characterCount: {
    fontSize: 12,
    color: AppColors.textMuted,
  },
  clearText: {
    fontSize: 14,
    color: AppColors.accentPink,
    fontWeight: '600',
  },
  controlsCard: {
    padding: 20,
    backgroundColor: AppColors.surfaceCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AppColors.textMuted + '1A',
    marginBottom: 24,
  },
  controlLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.textPrimary,
    marginBottom: 16,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sliderIcon: {
    fontSize: 20,
  },
  sliderValue: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.accentPink,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: AppColors.accentPink + '20',
    borderRadius: 12,
  },
  rateButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  rateButton: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: AppColors.surfaceElevated,
    borderRadius: 8,
    alignItems: 'center',
  },
  rateButtonActive: {
    backgroundColor: AppColors.accentPink + '40',
  },
  rateButtonText: {
    fontSize: 14,
    color: AppColors.textSecondary,
    fontWeight: '600',
  },
  rateButtonTextActive: {
    color: AppColors.accentPink,
  },
  playbackArea: {
    padding: 24,
    backgroundColor: AppColors.surfaceCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: AppColors.textMuted + '1A',
    alignItems: 'center',
    marginBottom: 32,
  },
  playbackActive: {
    borderColor: AppColors.accentPink + '80',
    borderWidth: 2,
    shadowColor: AppColors.accentPink,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  waveform: {
    flexDirection: 'row',
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 24,
  },
  waveBar: {
    width: 6,
    height: 40,
    backgroundColor: AppColors.accentPink,
    borderRadius: 3,
  },
  playbackIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  loadingIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  playbackStatus: {
    fontSize: 14,
    color: AppColors.textSecondary,
    marginBottom: 24,
  },
  playButtonWrapper: {
    marginTop: 8,
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: AppColors.accentPink,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
  },
  playButtonIcon: {
    fontSize: 32,
  },
  samplesSection: {
    marginBottom: 24,
  },
  samplesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.textMuted,
    marginBottom: 12,
  },
  sampleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: AppColors.surfaceCard + '80',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.textMuted + '1A',
    marginBottom: 12,
  },
  sampleText: {
    flex: 1,
    fontSize: 12,
    color: AppColors.textSecondary,
    lineHeight: 18,
  },
  sampleIcon: {
    fontSize: 20,
    color: AppColors.accentPink + '99',
    marginLeft: 8,
  },
});

```

```src\screens\SpeechToTextScreen.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  NativeModules,
  Alert,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { RunAnywhere } from '@runanywhere/core';
import { AppColors } from '../theme';
import { useModelService } from '../services/ModelService';
import { ModelLoaderWidget, AudioVisualizer } from '../components';

// Native Audio Module - records in WAV format (16kHz mono) optimal for Whisper STT
const { NativeAudioModule } = NativeModules;

export const SpeechToTextScreen: React.FC = () => {
  const modelService = useModelService();
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [transcriptionHistory, setTranscriptionHistory] = useState<string[]>([]);
  const [audioLevel, setAudioLevel] = useState(0);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingPathRef = useRef<string | null>(null);
  const audioLevelIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingStartRef = useRef<number>(0);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioLevelIntervalRef.current) {
        clearInterval(audioLevelIntervalRef.current);
      }
      if (isRecording && NativeAudioModule) {
        NativeAudioModule.cancelRecording().catch(() => {});
      }
    };
  }, [isRecording]);

  const startRecording = async () => {
    try {
      // Check if native module is available
      if (!NativeAudioModule) {
        console.error('[STT] NativeAudioModule not available');
        Alert.alert('Error', 'Native audio module not available. Please rebuild the app.');
        return;
      }

      // Request microphone permission on Android
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'This app needs access to your microphone for speech recognition.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission Denied', 'Microphone permission is required for speech recognition.');
          return;
        }
      }

      console.warn('[STT] Starting native recording...');
      const result = await NativeAudioModule.startRecording();

      recordingPathRef.current = result.path;
      recordingStartRef.current = Date.now();
      setIsRecording(true);
      setTranscription('');
      setRecordingDuration(0);

      // Poll for audio levels
      audioLevelIntervalRef.current = setInterval(async () => {
        try {
          const levelResult = await NativeAudioModule.getAudioLevel();
          setAudioLevel(levelResult.level || 0);
          setRecordingDuration(Date.now() - recordingStartRef.current);
        } catch (e) {
          // Ignore errors during polling
        }
      }, 100);

      console.warn('[STT] Recording started at:', result.path);
    } catch (error) {
      console.error('[STT] Recording error:', error);
      Alert.alert('Recording Error', `Failed to start recording: ${error}`);
    }
  };

  const stopRecordingAndTranscribe = async () => {
    try {
      // Clear audio level polling
      if (audioLevelIntervalRef.current) {
        clearInterval(audioLevelIntervalRef.current);
        audioLevelIntervalRef.current = null;
      }

      if (!NativeAudioModule) {
        throw new Error('NativeAudioModule not available');
      }

      console.warn('[STT] Stopping recording...');
      const result = await NativeAudioModule.stopRecording();
      setIsRecording(false);
      setAudioLevel(0);
      setIsTranscribing(true);

      // Get the base64 audio data directly from native module (bypasses RNFS sandbox issues)
      const audioBase64 = result.audioBase64;
      if (!audioBase64) {
        throw new Error('No audio data received from recording');
      }

      console.warn('[STT] Recording stopped, audio base64 length:', audioBase64.length, 'file size:', result.fileSize);

      if (result.fileSize < 1000) {
        throw new Error('Recording too short - please speak longer');
      }

      // Check if STT model is loaded
      const isModelLoaded = await RunAnywhere.isSTTModelLoaded();
      if (!isModelLoaded) {
        throw new Error('STT model not loaded. Please download and load the model first.');
      }

      // Transcribe using base64 audio data directly from native module
      console.warn('[STT] Starting transcription...');
      const transcribeResult = await RunAnywhere.transcribe(audioBase64, {
        sampleRate: 16000,
        language: 'en',
      });

      console.warn('[STT] Transcription result:', transcribeResult);

      if (transcribeResult.text) {
        setTranscription(transcribeResult.text);
        setTranscriptionHistory(prev => [transcribeResult.text, ...prev]);
      } else {
        setTranscription('(No speech detected)');
      }

      recordingPathRef.current = null;
      setIsTranscribing(false);
    } catch (error) {
      console.error('[STT] Transcription error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setTranscription(`Error: ${errorMessage}`);
      Alert.alert('Transcription Error', errorMessage);
      setIsTranscribing(false);
    }
  };

  const handleClearHistory = () => {
    setTranscriptionHistory([]);
    setTranscription('');
  };

  const formatDuration = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!modelService.isSTTLoaded) {
    return (
      <ModelLoaderWidget
        title="STT Model Required"
        subtitle="Download and load the speech recognition model"
        icon="mic"
        accentColor={AppColors.accentViolet}
        isDownloading={modelService.isSTTDownloading}
        isLoading={modelService.isSTTLoading}
        progress={modelService.sttDownloadProgress}
        onLoad={modelService.downloadAndLoadSTT}
      />
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Recording Area */}
        <View style={[styles.recordingArea, isRecording && styles.recordingActive]}>
          {isRecording ? (
            <>
              <AudioVisualizer level={audioLevel} />
              <Text style={[styles.statusTitle, { color: AppColors.accentViolet }]}>
                Listening...
              </Text>
              <Text style={styles.statusSubtitle}>
                {formatDuration(recordingDuration)}
              </Text>
            </>
          ) : isTranscribing ? (
            <>
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingIcon}>⏳</Text>
              </View>
              <Text style={styles.statusTitle}>Transcribing...</Text>
            </>
          ) : (
            <>
              <View style={styles.micContainer}>
                <Text style={styles.micIcon}>🎤</Text>
              </View>
              <Text style={styles.statusTitle}>Tap to Record</Text>
              <Text style={styles.statusSubtitle}>On-device speech recognition (WAV 16kHz)</Text>
            </>
          )}
        </View>

        {/* Current Transcription */}
        {(transcription || isTranscribing) && (
          <View style={styles.transcriptionCard}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>LATEST</Text>
            </View>
            <Text style={styles.transcriptionText}>
              {isTranscribing ? 'Processing...' : transcription}
            </Text>
          </View>
        )}

        {/* History */}
        {transcriptionHistory.length > 0 && (
          <View style={styles.historySection}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>History</Text>
              <TouchableOpacity onPress={handleClearHistory}>
                <Text style={styles.clearButton}>Clear</Text>
              </TouchableOpacity>
            </View>
            {transcriptionHistory.map((item, index) => (
              <View key={index} style={styles.historyItem}>
                <Text style={styles.historyText}>{item}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Record Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          onPress={isRecording ? stopRecordingAndTranscribe : startRecording}
          disabled={isTranscribing}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={isRecording ? [AppColors.error, '#DC2626'] : [AppColors.accentViolet, '#7C3AED']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.recordButton}
          >
            <Text style={styles.recordIcon}>{isRecording ? '⏹' : '🎤'}</Text>
            <Text style={styles.recordButtonText}>
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.primaryDark,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  recordingArea: {
    padding: 32,
    backgroundColor: AppColors.surfaceCard,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: AppColors.textMuted + '1A',
    alignItems: 'center',
    marginBottom: 24,
  },
  recordingActive: {
    borderColor: AppColors.accentViolet + '80',
    borderWidth: 2,
    shadowColor: AppColors.accentViolet,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  micContainer: {
    width: 100,
    height: 100,
    backgroundColor: AppColors.accentViolet + '20',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  micIcon: {
    fontSize: 48,
  },
  loadingContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  loadingIcon: {
    fontSize: 48,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: AppColors.textPrimary,
    marginBottom: 8,
  },
  statusSubtitle: {
    fontSize: 14,
    color: AppColors.textSecondary,
  },
  transcriptionCard: {
    padding: 20,
    backgroundColor: AppColors.surfaceCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AppColors.accentViolet + '40',
    marginBottom: 24,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: AppColors.accentViolet + '33',
    borderRadius: 8,
    marginBottom: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: AppColors.accentViolet,
  },
  transcriptionText: {
    fontSize: 15,
    color: AppColors.textPrimary,
    lineHeight: 22,
  },
  historySection: {
    marginBottom: 24,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.textMuted,
  },
  clearButton: {
    fontSize: 14,
    color: AppColors.accentViolet,
  },
  historyItem: {
    padding: 16,
    backgroundColor: AppColors.surfaceCard + '80',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.textMuted + '1A',
    marginBottom: 12,
  },
  historyText: {
    fontSize: 14,
    color: AppColors.textSecondary,
    lineHeight: 20,
  },
  buttonContainer: {
    padding: 24,
    backgroundColor: AppColors.surfaceCard + 'CC',
    borderTopWidth: 1,
    borderTopColor: AppColors.textMuted + '1A',
  },
  recordButton: {
    flexDirection: 'row',
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    elevation: 8,
    shadowColor: AppColors.accentViolet,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
  },
  recordIcon: {
    fontSize: 28,
  },
  recordButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

```

```src\screens\index.ts
export * from './HomeScreen';
export * from './ChatScreen';
export * from './ToolCallingScreen';
export * from './SpeechToTextScreen';
export * from './TextToSpeechScreen';
export * from './VoicePipelineScreen';

```

```src\screens\HomeScreen.tsx
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { StackNavigationProp } from '@react-navigation/stack';
import { AppColors } from '../theme';
import { FeatureCard } from '../components';
import { RootStackParamList } from '../navigation/types';

type HomeScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'Home'>;
};

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={[AppColors.primaryDark, '#0F1629', AppColors.primaryMid]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={[AppColors.accentCyan, AppColors.accentViolet]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logoGradient}
              >
                <Text style={styles.logoIcon}>⚡</Text>
              </LinearGradient>
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>RunAnywhere</Text>
              <Text style={styles.subtitle}>React Native SDK Starter</Text>
            </View>
          </View>

          {/* Privacy Banner */}
          <View style={styles.privacyBanner}>
            <Text style={styles.privacyIcon}>🔒</Text>
            <View style={styles.privacyText}>
              <Text style={styles.privacyTitle}>Privacy-First On-Device AI</Text>
              <Text style={styles.privacySubtitle}>
                All AI processing happens locally on your device. No data ever leaves your phone.
              </Text>
            </View>
          </View>

          {/* Feature Cards Grid */}
          <View style={styles.gridContainer}>
            <View style={styles.row}>
              <FeatureCard
                title="Chat"
                subtitle="LLM Text Generation"
                icon="chat"
                gradientColors={[AppColors.accentCyan, '#0EA5E9']}
                onPress={() => navigation.navigate('Chat')}
              />
              <FeatureCard
                title="Tools"
                subtitle="Tool Calling"
                icon="tools"
                gradientColors={[AppColors.accentOrange, '#E67E22']}
                onPress={() => navigation.navigate('ToolCalling')}
              />
            </View>
            <View style={styles.row}>
              <FeatureCard
                title="Speech"
                subtitle="Speech to Text"
                icon="mic"
                gradientColors={[AppColors.accentViolet, '#7C3AED']}
                onPress={() => navigation.navigate('SpeechToText')}
              />
              <FeatureCard
                title="Voice"
                subtitle="Text to Speech"
                icon="volume"
                gradientColors={[AppColors.accentPink, '#DB2777']}
                onPress={() => navigation.navigate('TextToSpeech')}
              />
            </View>
            <View style={styles.row}>
              <FeatureCard
                title="Pipeline"
                subtitle="Voice Agent"
                icon="pipeline"
                gradientColors={[AppColors.accentGreen, '#059669']}
                onPress={() => navigation.navigate('VoicePipeline')}
              />
              <View style={{ flex: 1, margin: 8 }} />
            </View>
          </View>

          {/* Model Info Section */}
          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>🤖</Text>
              <Text style={styles.infoLabel}>LLM</Text>
              <View style={{ flex: 1 }} />
              <Text style={styles.infoValue}>SmolLM2 360M</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>🎤</Text>
              <Text style={styles.infoLabel}>STT</Text>
              <View style={{ flex: 1 }} />
              <Text style={styles.infoValue}>Whisper Tiny</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>🔊</Text>
              <Text style={styles.infoLabel}>TTS</Text>
              <View style={{ flex: 1 }} />
              <Text style={styles.infoValue}>Piper TTS</Text>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.primaryDark,
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    marginRight: 16,
  },
  logoGradient: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: AppColors.accentCyan,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  logoIcon: {
    fontSize: 32,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: AppColors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: AppColors.accentCyan,
    marginTop: 2,
  },
  privacyBanner: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: AppColors.surfaceCard + 'CC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AppColors.accentCyan + '33',
    marginBottom: 32,
  },
  privacyIcon: {
    fontSize: 28,
    marginRight: 16,
  },
  privacyText: {
    flex: 1,
  },
  privacyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.textPrimary,
    marginBottom: 4,
  },
  privacySubtitle: {
    fontSize: 12,
    color: AppColors.textSecondary,
    lineHeight: 18,
  },
  gridContainer: {
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 0,
  },
  infoSection: {
    padding: 20,
    backgroundColor: AppColors.surfaceCard + '80',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AppColors.textMuted + '1A',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: AppColors.textSecondary,
  },
  infoValue: {
    fontSize: 12,
    color: AppColors.accentCyan,
    fontWeight: '500',
  },
});

```

```src\screens\ChatScreen.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { RunAnywhere } from '@runanywhere/core';
import { AppColors } from '../theme';
import { useModelService } from '../services/ModelService';
import { ChatMessageBubble, ChatMessage, ModelLoaderWidget } from '../components';

export const ChatScreen: React.FC = () => {
  const modelService = useModelService();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const streamCancelRef = useRef<(() => void) | null>(null);
  const responseRef = useRef(''); // Track response for closure

  useEffect(() => {
    // Scroll to bottom when messages change
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, currentResponse]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || isGenerating) return;

    // Add user message
    const userMessage: ChatMessage = {
      text,
      isUser: true,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsGenerating(true);
    setCurrentResponse('');

    try {
      // Per docs: https://docs.runanywhere.ai/react-native/quick-start#6-stream-responses
      const streamResult = await RunAnywhere.generateStream(text, {
        maxTokens: 256,
        temperature: 0.8,
      });

      streamCancelRef.current = streamResult.cancel;
      responseRef.current = '';

      // Stream tokens as they arrive
      for await (const token of streamResult.stream) {
        responseRef.current += token;
        setCurrentResponse(responseRef.current);
      }

      // Get final metrics
      const finalResult = await streamResult.result;

      // Add assistant message (use ref to get final text due to closure)
      const assistantMessage: ChatMessage = {
        text: responseRef.current,
        isUser: false,
        timestamp: new Date(),
        tokensPerSecond: finalResult.performanceMetrics?.tokensPerSecond,
        totalTokens: finalResult.performanceMetrics?.totalTokens,
      };
      setMessages(prev => [...prev, assistantMessage]);
      setCurrentResponse('');
      responseRef.current = '';
      setIsGenerating(false);
    } catch (error) {
      const errorMessage: ChatMessage = {
        text: `Error: ${error}`,
        isUser: false,
        timestamp: new Date(),
        isError: true,
      };
      setMessages(prev => [...prev, errorMessage]);
      setCurrentResponse('');
      setIsGenerating(false);
    }
  };

  const handleStop = () => {
    if (streamCancelRef.current) {
      streamCancelRef.current();
      if (responseRef.current) {
        const message: ChatMessage = {
          text: responseRef.current,
          isUser: false,
          timestamp: new Date(),
          wasCancelled: true,
        };
        setMessages(prev => [...prev, message]);
      }
      setCurrentResponse('');
      responseRef.current = '';
      setIsGenerating(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  const renderSuggestionChip = (text: string) => (
    <TouchableOpacity
      key={text}
      style={styles.suggestionChip}
      onPress={() => {
        setInputText(text);
        handleSend();
      }}
    >
      <Text style={styles.suggestionText}>{text}</Text>
    </TouchableOpacity>
  );

  if (!modelService.isLLMLoaded) {
    return (
      <ModelLoaderWidget
        title="LLM Model Required"
        subtitle="Download and load the language model to start chatting"
        icon="chat"
        accentColor={AppColors.accentCyan}
        isDownloading={modelService.isLLMDownloading}
        isLoading={modelService.isLLMLoading}
        progress={modelService.llmDownloadProgress}
        onLoad={modelService.downloadAndLoadLLM}
      />
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {messages.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Text style={styles.emptyIcon}>💬</Text>
          </View>
          <Text style={styles.emptyTitle}>Start a Conversation</Text>
          <Text style={styles.emptySubtitle}>
            Ask anything! The AI runs entirely on your device.
          </Text>
          <View style={styles.suggestionsContainer}>
            {renderSuggestionChip('Tell me a joke')}
            {renderSuggestionChip('What is AI?')}
            {renderSuggestionChip('Write a haiku')}
          </View>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={[...messages, ...(isGenerating ? [{ text: currentResponse || '...', isUser: false, timestamp: new Date() }] : [])]}
          renderItem={({ item, index }) => (
            <ChatMessageBubble
              message={item as ChatMessage}
              isStreaming={isGenerating && index === messages.length}
            />
          )}
          keyExtractor={(_, index) => index.toString()}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor={AppColors.textMuted}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleSend}
            editable={!isGenerating}
            multiline
          />
          {isGenerating ? (
            <TouchableOpacity onPress={handleStop} style={styles.stopButton}>
              <View style={styles.stopIcon}>
                <Text style={styles.stopIconText}>⏹</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={handleSend} disabled={!inputText.trim()}>
              <LinearGradient
                colors={[AppColors.accentCyan, AppColors.accentViolet]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.sendButton}
              >
                <Text style={styles.sendIcon}>📤</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.primaryDark,
  },
  messageList: {
    padding: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    backgroundColor: AppColors.accentCyan + '20',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: AppColors.textPrimary,
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    color: AppColors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  suggestionChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: AppColors.surfaceCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: AppColors.accentCyan + '40',
  },
  suggestionText: {
    fontSize: 12,
    color: AppColors.textPrimary,
  },
  inputContainer: {
    padding: 16,
    backgroundColor: AppColors.surfaceCard + 'CC',
    borderTopWidth: 1,
    borderTopColor: AppColors.textMuted + '1A',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: AppColors.primaryMid,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 15,
    color: AppColors.textPrimary,
    maxHeight: 100,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: AppColors.accentCyan,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  sendIcon: {
    fontSize: 20,
  },
  stopButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: AppColors.error + '33',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopIcon: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopIconText: {
    fontSize: 20,
    color: AppColors.error,
  },
});

```

```src\react-native-screens-mock.js
/**
 * Mock implementation of react-native-screens for iOS with New Architecture
 *
 * This replaces all native screen components with regular React Native Views
 * to avoid crashes with react-native-screens on RN 0.83's mandatory New Architecture.
 */
import React from 'react';
import { View, Animated } from 'react-native';

// Simple View wrapper that accepts all props
const ScreenView = React.forwardRef((props, ref) => {
  const { children, style, enabled, activityState, ...rest } = props;
  return (
    <View ref={ref} style={[{ flex: 1 }, style]} {...rest}>
      {children}
    </View>
  );
});
ScreenView.displayName = 'Screen';

const AnimatedScreenView = Animated.createAnimatedComponent(ScreenView);

// Screen components
export const Screen = ScreenView;
export const ScreenContainer = ScreenView;
export const ScreenStack = ScreenView;
export const NativeScreen = ScreenView;
export const NativeScreenContainer = ScreenView;
export const NativeScreenNavigationContainer = ScreenView;
export const ScreenStackHeaderConfig = () => null;
export const ScreenStackHeaderSubview = View;
export const ScreenStackHeaderBackButtonImage = () => null;
export const ScreenStackHeaderCenterView = View;
export const ScreenStackHeaderLeftView = View;
export const ScreenStackHeaderRightView = View;
export const ScreenStackHeaderSearchBarView = View;
export const SearchBar = () => null;
export const FullWindowOverlay = ScreenView;
export const ScreenContext = React.createContext(null);

// Functions
export const enableScreens = (val) => {};
export const enableFreeze = (val) => {};
export const screensEnabled = () => false;
export const shouldUseActivityState = false;

// Transition progress hook
export const useTransitionProgress = () => ({
  progress: { value: 1 },
  closing: { value: 0 },
  goingForward: { value: 1 },
});

// Freeze component
export const Freeze = ({ freeze, children }) => <>{children}</>;

// For native-stack compatibility
export const NativeScreensModule = null;
export const NativeScreenContainerComponent = ScreenView;
export const NativeScreenComponent = ScreenView;

// GH Pages
export const GHContext = React.createContext(null);
export const useGHContext = () => null;

// Reanimated compatibility
export const InnerScreen = ScreenView;
export const ScreensNativeModules = {};

// Default export with everything
const RNScreens = {
  Screen,
  ScreenContainer,
  ScreenStack,
  NativeScreen,
  NativeScreenContainer,
  NativeScreenNavigationContainer,
  ScreenStackHeaderConfig,
  ScreenStackHeaderSubview,
  ScreenStackHeaderBackButtonImage,
  ScreenStackHeaderCenterView,
  ScreenStackHeaderLeftView,
  ScreenStackHeaderRightView,
  ScreenStackHeaderSearchBarView,
  SearchBar,
  FullWindowOverlay,
  ScreenContext,
  enableScreens,
  enableFreeze,
  screensEnabled,
  shouldUseActivityState,
  useTransitionProgress,
  Freeze,
  NativeScreensModule,
  NativeScreenContainerComponent,
  NativeScreenComponent,
  GHContext,
  useGHContext,
  InnerScreen,
  ScreensNativeModules,
};

export default RNScreens;

```

```src\navigation\types.ts
export type RootStackParamList = {
  Home: undefined;
  Chat: undefined;
  ToolCalling: undefined;
  SpeechToText: undefined;
  TextToSpeech: undefined;
  VoicePipeline: undefined;
};

```

```src\components\ModelLoaderWidget.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { AppColors } from '../theme';

interface ModelLoaderWidgetProps {
  title: string;
  subtitle: string;
  icon: string;
  accentColor: string;
  isDownloading: boolean;
  isLoading: boolean;
  progress: number;
  onLoad: () => void;
}

export const ModelLoaderWidget: React.FC<ModelLoaderWidgetProps> = ({
  title,
  subtitle,
  accentColor,
  isDownloading,
  isLoading,
  progress,
  onLoad,
}) => {
  const getIconEmoji = () => {
    if (title.includes('LLM')) return '🤖';
    if (title.includes('STT')) return '🎤';
    if (title.includes('TTS')) return '🔊';
    if (title.includes('Voice')) return '✨';
    return '📦';
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: accentColor + '20' }]}>
          <Text style={styles.iconEmoji}>{getIconEmoji()}</Text>
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        {(isDownloading || isLoading) && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={accentColor} />
            <Text style={styles.loadingText}>
              {isDownloading
                ? `Downloading... ${Math.round(progress)}%`
                : 'Loading model...'}
            </Text>
            {isDownloading && (
              <View style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBar,
                    {
                      width: `${progress}%`,
                      backgroundColor: accentColor,
                    },
                  ]}
                />
              </View>
            )}
          </View>
        )}

        {!isDownloading && !isLoading && (
          <TouchableOpacity
            onPress={onLoad}
            activeOpacity={0.8}
            style={[styles.button, { backgroundColor: accentColor }]}
          >
            <Text style={styles.buttonText}>Download & Load Model</Text>
          </TouchableOpacity>
        )}

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            🔒 All processing happens on your device. Your data never leaves your phone.
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    maxWidth: 400,
    alignItems: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconEmoji: {
    fontSize: 56,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: AppColors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: AppColors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: AppColors.textSecondary,
  },
  progressBarContainer: {
    width: 200,
    height: 6,
    backgroundColor: AppColors.surfaceCard,
    borderRadius: 3,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  button: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    minWidth: 220,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  infoBox: {
    marginTop: 32,
    padding: 16,
    backgroundColor: AppColors.surfaceCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.textMuted + '20',
  },
  infoText: {
    fontSize: 12,
    color: AppColors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});

```

```src\components\index.ts
export * from './FeatureCard';
export * from './ModelLoaderWidget';
export * from './ChatMessageBubble';
export * from './AudioVisualizer';

```

```src\components\FeatureCard.tsx
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { AppColors } from '../theme';

interface FeatureCardProps {
  title: string;
  subtitle: string;
  icon: string;
  gradientColors: string[];
  onPress: () => void;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  subtitle,
  gradientColors,
  onPress,
}) => {
  return (
    <TouchableOpacity onPress={onPress} style={styles.container} activeOpacity={0.8}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <Text style={styles.icon}>{getIconEmoji(title)}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

// Helper to get emoji icon based on title
const getIconEmoji = (title: string): string => {
  const iconMap: Record<string, string> = {
    Chat: '💬',
    Tools: '🛠',
    Speech: '🎤',
    Voice: '🔊',
    Pipeline: '✨',
  };
  return iconMap[title] || '⚡';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 8,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: AppColors.accentCyan,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  } as ViewStyle,
  gradient: {
    padding: 20,
    minHeight: 160,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  icon: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
  },
});

```

```src\components\ChatMessageBubble.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AppColors } from '../theme';

export interface ChatMessage {
  text: string;
  isUser: boolean;
  timestamp: Date;
  tokensPerSecond?: number;
  totalTokens?: number;
  isError?: boolean;
  wasCancelled?: boolean;
}

interface ChatMessageBubbleProps {
  message: ChatMessage;
  isStreaming?: boolean;
}

export const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({
  message,
  isStreaming = false,
}) => {
  const { text, isUser, tokensPerSecond, totalTokens, isError, wasCancelled } = message;

  return (
    <View
      style={[
        styles.container,
        isUser ? styles.userContainer : styles.assistantContainer,
      ]}
    >
      <View
        style={[
          styles.bubble,
          isUser ? styles.userBubble : styles.assistantBubble,
          isError && styles.errorBubble,
        ]}
      >
        <Text
          style={[
            styles.text,
            isUser ? styles.userText : styles.assistantText,
            isError && styles.errorText,
          ]}
        >
          {text}
        </Text>

        {!isUser && !isStreaming && (tokensPerSecond || totalTokens) && (
          <View style={styles.metricsContainer}>
            {tokensPerSecond && (
              <Text style={styles.metrics}>
                ⚡ {tokensPerSecond.toFixed(1)} tok/s
              </Text>
            )}
            {totalTokens && (
              <Text style={styles.metrics}>📊 {totalTokens} tokens</Text>
            )}
          </View>
        )}

        {wasCancelled && (
          <Text style={styles.cancelledText}>⚠️ Generation cancelled</Text>
        )}

        {isStreaming && <Text style={styles.streamingIndicator}>▊</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  assistantContainer: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '85%',
    padding: 12,
    borderRadius: 16,
    marginVertical: 2,
  },
  userBubble: {
    backgroundColor: AppColors.accentCyan,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: AppColors.surfaceCard,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: AppColors.textMuted + '20',
  },
  errorBubble: {
    backgroundColor: AppColors.error + '20',
    borderColor: AppColors.error + '40',
  },
  text: {
    fontSize: 15,
    lineHeight: 21,
  },
  userText: {
    color: '#FFFFFF',
  },
  assistantText: {
    color: AppColors.textPrimary,
  },
  errorText: {
    color: AppColors.error,
  },
  metricsContainer: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 12,
  },
  metrics: {
    fontSize: 11,
    color: AppColors.textMuted,
  },
  cancelledText: {
    fontSize: 11,
    color: AppColors.warning,
    marginTop: 4,
  },
  streamingIndicator: {
    fontSize: 16,
    color: AppColors.accentCyan,
    marginTop: 2,
  },
});

```

```src\components\AudioVisualizer.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppColors } from '../theme';

interface AudioVisualizerProps {
  level: number; // 0.0 to 1.0
  barCount?: number;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  level,
  barCount = 7,
}) => {
  const bars = Array.from({ length: barCount }, (_, i) => {
    // Create wave effect
    const waveEffect = Math.sin((i / barCount) * Math.PI);
    const height = Math.max(0.2, level * waveEffect);
    return height;
  });

  return (
    <View style={styles.container}>
      {bars.map((height, index) => (
        <View
          key={index}
          style={[
            styles.bar,
            {
              height: `${height * 100}%`,
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    gap: 6,
  },
  bar: {
    width: 6,
    backgroundColor: AppColors.accentViolet,
    borderRadius: 3,
    minHeight: 12,
  },
});

```

```src\App.tsx
import 'react-native-gesture-handler'; // Must be at the top!
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
// Note: react-native-screens is shimmed in index.js for iOS New Architecture compatibility
import { RunAnywhere, SDKEnvironment } from '@runanywhere/core';
import { ModelServiceProvider, registerDefaultModels } from './services/ModelService';
import { AppColors } from './theme';
import {
  HomeScreen,
  ChatScreen,
  ToolCallingScreen,
  SpeechToTextScreen,
  TextToSpeechScreen,
  VoicePipelineScreen,
} from './screens';
import { RootStackParamList } from './navigation/types';

// Using JS-based stack navigator instead of native-stack
// to avoid react-native-screens setColor crash with New Architecture
const Stack = createStackNavigator<RootStackParamList>();

const App: React.FC = () => {
  useEffect(() => {
    // Initialize SDK
    const initializeSDK = async () => {
      try {
        // Initialize RunAnywhere SDK (Development mode doesn't require API key)
        await RunAnywhere.initialize({
          environment: SDKEnvironment.Development,
        });

        // Register backends (per docs: https://docs.runanywhere.ai/react-native/quick-start)
        const { LlamaCPP } = await import('@runanywhere/llamacpp');
        const { ONNX } = await import('@runanywhere/onnx');

        LlamaCPP.register();
        ONNX.register();

        // Register default models
        await registerDefaultModels();

        console.log('RunAnywhere SDK initialized successfully');
      } catch (error) {
        console.error('Failed to initialize RunAnywhere SDK:', error);
      }
    };

    initializeSDK();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ModelServiceProvider>
        <StatusBar barStyle="light-content" backgroundColor={AppColors.primaryDark} />
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{
              headerStyle: {
                backgroundColor: AppColors.primaryDark,
                elevation: 0,
                shadowOpacity: 0,
              },
              headerTintColor: AppColors.textPrimary,
              headerTitleStyle: {
                fontWeight: '700',
                fontSize: 18,
              },
              cardStyle: {
                backgroundColor: AppColors.primaryDark,
              },
              // iOS-like animations
              ...TransitionPresets.SlideFromRightIOS,
            }}
          >
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Chat"
              component={ChatScreen}
              options={{ title: 'Chat' }}
            />
            <Stack.Screen
              name="ToolCalling"
              component={ToolCallingScreen}
              options={{ title: 'Tool Calling' }}
            />
            <Stack.Screen
              name="SpeechToText"
              component={SpeechToTextScreen}
              options={{ title: 'Speech to Text' }}
            />
            <Stack.Screen
              name="TextToSpeech"
              component={TextToSpeechScreen}
              options={{ title: 'Text to Speech' }}
            />
            <Stack.Screen
              name="VoicePipeline"
              component={VoicePipelineScreen}
              options={{ title: 'Voice Pipeline' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </ModelServiceProvider>
    </GestureHandlerRootView>
  );
};

export default App;

```

```metro.config.js
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const path = require('path');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  resolver: {
    // Replace react-native-screens with our mock on iOS
    // This fixes crashes with New Architecture in RN 0.83
    resolveRequest: (context, moduleName, platform) => {
      // Intercept all react-native-screens imports on iOS
      if (platform === 'ios' &&
          (moduleName === 'react-native-screens' ||
           moduleName.startsWith('react-native-screens/'))) {
        // For the main module and any subpaths, use our mock
        return {
          filePath: path.resolve(__dirname, 'src/react-native-screens-mock.js'),
          type: 'sourceFile',
        };
      }
      // Fall back to default resolution
      return context.resolveRequest(context, moduleName, platform);
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);

```

```package.json
{
  "name": "runanywhere-starter-app",
  "version": "1.0.0",
  "description": "A comprehensive starter app demonstrating RunAnywhere SDK capabilities - on-device AI for React Native",
  "main": "index.js",
  "scripts": {
    "android": "react-native run-android",
    "ios": "react-native run-ios",
    "start": "react-native start",
    "test": "jest",
    "lint": "eslint . --ext .js,.jsx,.ts,.tsx"
  },
  "dependencies": {
    "@react-navigation/native": "^7.1.24",
    "@react-navigation/stack": "^7.6.16",
    "@runanywhere/core": "^0.18.1",
    "@runanywhere/llamacpp": "^0.18.1",
    "@runanywhere/onnx": "^0.18.1",
    "react": "19.2.0",
    "react-native": "0.83.1",
    "react-native-fs": "^2.20.0",
    "react-native-gesture-handler": "^2.30.0",
    "react-native-linear-gradient": "^2.8.3",
    "react-native-live-audio-stream": "^1.1.1",
    "react-native-nitro-modules": "^0.31.10",
    "react-native-safe-area-context": "~5.6.2",
    "react-native-sound": "^0.13.0"
  },
  "devDependencies": {
    "@babel/core": "^7.25.2",
    "@babel/preset-env": "^7.25.0",
    "@babel/runtime": "^7.25.0",
    "@react-native-community/cli": "latest",
    "@react-native-community/cli-platform-android": "latest",
    "@react-native-community/cli-platform-ios": "latest",
    "@react-native/babel-preset": "0.83.1",
    "@react-native/eslint-config": "0.83.1",
    "@react-native/metro-config": "0.83.1",
    "@react-native/typescript-config": "0.83.1",
    "@types/react": "~19.1.0",
    "@types/react-test-renderer": "^18.3.0",
    "eslint": "^8.57.0",
    "prettier": "^3.4.2",
    "typescript": "~5.9.2"
  },
  "engines": {
    "node": ">=18"
  }
}

```

```react-native.config.js
/**
 * React Native configuration for RunAnywhere
 *
 * NOTE: automaticPodsInstallation is disabled because the @runanywhere packages
 * use "podspecPath" in their react-native.config.js, which is not allowed by
 * the RN 0.83 CLI. Pods must be installed manually: cd ios && pod install && cd ..
 */
module.exports = {
  project: {
    ios: {
      automaticPodsInstallation: false,
    },
  },
  dependencies: {
    // Disable packages with New Architecture compatibility issues on iOS
    'react-native-sound': {
      platforms: {
        ios: null,
      },
    },
    'react-native-audio-recorder-player': {
      platforms: {
        ios: null,
      },
    },
    // CRITICAL: react-native-screens crashes with New Architecture in RN 0.83
    // Error: -[RCTView setColor:] and -[RCTView setSheetExpandsWhenScrolledToEdge:]
    'react-native-screens': {
      platforms: {
        ios: null,
      },
    },
  },
};

```
