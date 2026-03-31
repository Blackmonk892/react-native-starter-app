import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  NativeModules,
  PermissionsAndroid,
  Alert,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RunAnywhere } from '@runanywhere/core';
import RNFS from 'react-native-fs';

import { RootStackParamList } from '../navigation/types';
import { AppColors } from '../theme';
import { useModelService } from '../services/ModelService';
import { ModelLoaderWidget } from '../components';
import { buildSystemPrompt } from '../services/PromptEngine';
import { useNotes } from '../context/NotesContext';

const { NativeAudioModule } = NativeModules;

type Props = StackScreenProps<RootStackParamList, 'Interaction'>;

export const InteractionScreen: React.FC<Props> = ({ route, navigation }) => {
  const { mode, scenario } = route.params;
  const modelService = useModelService();
  const { addNote } = useNotes();

  // Core State
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  // Voice State
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const currentAudioPathRef = useRef<string | null>(null);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (NativeAudioModule) {
        if (isRecording) NativeAudioModule.cancelRecording().catch(() => {});
        if (isPlayingTTS) NativeAudioModule.stopPlayback().catch(() => {});
      }
    };
  }, [isRecording, isPlayingTTS]);

  const getTitles = () => {
    switch (mode) {
      case 'ask':
        return {
          title: 'What should I say?',
          subtitle: `Preparing you for: ${scenario}`,
          placeholder: 'Type or speak your issue...',
        };
      case 'listen':
        return {
          title: 'What did they say?',
          subtitle: `Translating: ${scenario}`,
          placeholder: 'Type or speak what they said...',
        };
      case 'reply':
        return {
          title: 'How do I reply?',
          subtitle: `Responding at: ${scenario}`,
          placeholder: 'Type or speak the situation...',
        };
    }
  };

  const { title, subtitle, placeholder } = getTitles();

  // --- 1. LOCAL LLM GENERATION ---
  const handleGenerate = async () => {
    if (!inputText.trim() || isProcessing || isTranscribing) return;

    setIsProcessing(true);
    setResponse(null);
    setIsSaved(false); // Reset save state for new response

    try {
      const systemPrompt = buildSystemPrompt(mode, scenario);
      const fullPrompt = `${systemPrompt}\n\nUser: ${inputText}\nAssistant:`;

      const result = await RunAnywhere.generate(fullPrompt, {
        maxTokens: 250,
        temperature: 0.3,
      });

      setResponse(result.text.trim());
    } catch (error) {
      console.error('AI Generation Error:', error);
      setResponse('⚠️ Sorry, the local AI encountered an error. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // --- 2. SAVE NOTE LOGIC ---
  const handleSave = async () => {
    if (!response) return;
    await addNote({
      scenario,
      mode,
      query: inputText,
      response: response,
    });
    setIsSaved(true);
  };

  // --- 3. SPEECH TO TEXT (MIC) ---
  const toggleRecording = async () => {
    if (isRecording) {
      await stopRecordingAndTranscribe();
    } else {
      await startRecording();
    }
  };

  const startRecording = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission Denied', 'Microphone permission is required.');
          return;
        }
      }

      await NativeAudioModule.startRecording();
      setIsRecording(true);
      setInputText('');
    } catch (error) {
      console.error('[STT] Recording error:', error);
      Alert.alert('Error', 'Could not start microphone.');
    }
  };

  const stopRecordingAndTranscribe = async () => {
    try {
      const result = await NativeAudioModule.stopRecording();
      setIsRecording(false);
      setIsTranscribing(true);

      if (result.fileSize < 1000) {
        setIsTranscribing(false);
        return; // Too short
      }

      const transcribeResult = await RunAnywhere.transcribe(result.audioBase64, {
        sampleRate: 16000,
        language: 'en',
      });

      if (transcribeResult.text) {
        setInputText(transcribeResult.text);
      }
    } catch (error) {
      console.error('[STT] Transcription error:', error);
      Alert.alert('Error', 'Could not transcribe speech.');
    } finally {
      setIsTranscribing(false);
    }
  };

  // --- 4. TEXT TO SPEECH (READ ALOUD) ---
  const toggleTTS = async () => {
    if (isPlayingTTS) {
      await NativeAudioModule.stopPlayback();
      setIsPlayingTTS(false);
      return;
    }

    if (!response) return;

    setIsSynthesizing(true);
    try {
      const result = await RunAnywhere.synthesize(response, {
        voice: 'default',
        rate: 1.0,
      });

      const tempPath = await RunAnywhere.Audio.createWavFromPCMFloat32(
        result.audio,
        result.sampleRate || 22050
      );

      currentAudioPathRef.current = tempPath;
      setIsSynthesizing(false);
      setIsPlayingTTS(true);

      await NativeAudioModule.playAudio(tempPath);

      // Cleanup after playback length
      setTimeout(
        () => {
          setIsPlayingTTS(false);
          RNFS.unlink(tempPath).catch(() => {});
        },
        (result.duration + 0.5) * 1000
      );
    } catch (error) {
      console.error('[TTS] Error:', error);
      setIsSynthesizing(false);
      setIsPlayingTTS(false);
    }
  };

  // Require ALL models (LLM, STT, TTS) to be loaded for this unified screen
  if (!modelService.isVoiceAgentReady) {
    const avgProgress =
      (modelService.llmDownloadProgress +
        modelService.sttDownloadProgress +
        modelService.ttsDownloadProgress) /
      3;
    const isDownloading =
      modelService.isLLMDownloading ||
      modelService.isSTTDownloading ||
      modelService.isTTSDownloading;
    const isLoading =
      modelService.isLLMLoading || modelService.isSTTLoading || modelService.isTTSLoading;

    return (
      <ModelLoaderWidget
        title="Offline Models Required"
        subtitle="Download BolSaathi's offline intelligence (Text & Voice) once to use it forever."
        icon="🤖"
        accentColor="#3B82F6"
        isDownloading={isDownloading}
        isLoading={isLoading}
        progress={avgProgress}
        onLoad={modelService.downloadAndLoadAllModels}
      />
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        {/* Input Area */}
        <View style={styles.inputCard}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder={
                isRecording
                  ? 'Listening...'
                  : isTranscribing
                    ? 'Translating speech...'
                    : placeholder
              }
              placeholderTextColor={isRecording ? '#EF4444' : AppColors.textMuted}
              value={inputText}
              onChangeText={setInputText}
              multiline
              editable={!isProcessing && !isRecording && !isTranscribing}
            />

            {/* STT Mic Button */}
            <TouchableOpacity
              style={[styles.micButton, isRecording && styles.micButtonActive]}
              onPress={toggleRecording}
              disabled={isProcessing || isTranscribing}
            >
              <Text style={styles.micIcon}>{isRecording ? '⏹' : '🎤'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.actionButton,
              (!inputText.trim() || isProcessing || isTranscribing) && styles.actionButtonDisabled,
            ]}
            onPress={handleGenerate}
            disabled={!inputText.trim() || isProcessing || isTranscribing}
          >
            {isProcessing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.actionButtonText}>Get Advice ✨</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Output Area */}
        {response && (
          <View style={styles.outputCard}>
            <Text style={styles.outputTitle}>BolSaathi Advice</Text>
            <Text style={styles.outputText}>{response}</Text>

            <View style={styles.outputActions}>
              {/* TTS Read Aloud Button */}
              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.secondaryActionBtn, { flex: 1, marginRight: 8 }]}
                onPress={toggleTTS}
                disabled={isSynthesizing}
              >
                {isSynthesizing ? (
                  <ActivityIndicator color={AppColors.textPrimary} size="small" />
                ) : (
                  <>
                    <Text style={styles.actionBtnIcon}>{isPlayingTTS ? '⏹' : '🔊'}</Text>
                    <Text style={styles.actionBtnText}>{isPlayingTTS ? 'Stop' : 'Read Aloud'}</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Save Button */}
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.secondaryActionBtn,
                  { flex: 1, marginLeft: 8 },
                  isSaved && { borderColor: '#10B981' },
                ]}
                onPress={handleSave}
                disabled={isSaved}
              >
                <Text style={styles.actionBtnIcon}>{isSaved ? '✅' : '💾'}</Text>
                <Text style={[styles.actionBtnText, isSaved && { color: '#10B981' }]}>
                  {isSaved ? 'Saved' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.primaryDark },
  scrollContent: { padding: 24, paddingBottom: 60 },
  header: { marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '800', color: AppColors.textPrimary },
  subtitle: { fontSize: 16, color: '#3B82F6', marginTop: 6, fontWeight: '600' },

  inputCard: {
    backgroundColor: AppColors.surfaceCard,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: AppColors.textMuted + '33',
    marginBottom: 24,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: AppColors.textPrimary,
    minHeight: 100,
    textAlignVertical: 'top',
    lineHeight: 24,
    paddingRight: 12,
  },
  micButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: AppColors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: AppColors.textMuted + '33',
  },
  micButtonActive: {
    backgroundColor: '#EF4444' + '20',
    borderColor: '#EF4444',
  },
  micIcon: { fontSize: 22 },

  actionButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonDisabled: { opacity: 0.5, backgroundColor: AppColors.textMuted },
  actionButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },

  outputCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 24,
    borderLeftWidth: 6,
    borderLeftColor: '#10B981',
  },
  outputTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#10B981',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  outputText: { fontSize: 17, color: AppColors.textPrimary, lineHeight: 28, marginBottom: 24 },

  outputActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  secondaryActionBtn: {
    flexDirection: 'row',
    backgroundColor: AppColors.surfaceElevated,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: AppColors.textMuted + '33',
  },
  actionBtnIcon: { fontSize: 18, marginRight: 8 },
  actionBtnText: { color: AppColors.textPrimary, fontWeight: '700', fontSize: 15 },
});
