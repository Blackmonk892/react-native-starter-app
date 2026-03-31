import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  NativeModules,
  ActivityIndicator,
} from 'react-native';
import { RunAnywhere } from '@runanywhere/core';
import RNFS from 'react-native-fs';
import { AppColors } from '../theme';
import { useNotes, Note } from '../context/NotesContext';

const { NativeAudioModule } = NativeModules;

export const SavedNotesScreen: React.FC = () => {
  const { notes, deleteNote } = useNotes();
  const [playingNoteId, setPlayingNoteId] = useState<string | null>(null);
  const [isSynthesizing, setIsSynthesizing] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (NativeAudioModule && playingNoteId) {
        NativeAudioModule.stopPlayback().catch(() => {});
      }
    };
  }, [playingNoteId]);

  const toggleTTS = async (note: Note) => {
    if (playingNoteId === note.id) {
      await NativeAudioModule.stopPlayback();
      setPlayingNoteId(null);
      return;
    }

    // Stop any currently playing audio
    if (playingNoteId) {
      await NativeAudioModule.stopPlayback();
    }

    setIsSynthesizing(note.id);
    try {
      const result = await RunAnywhere.synthesize(note.response, {
        voice: 'default',
        rate: 1.0,
      });

      const tempPath = await RunAnywhere.Audio.createWavFromPCMFloat32(
        result.audio,
        result.sampleRate || 22050
      );

      setIsSynthesizing(null);
      setPlayingNoteId(note.id);

      await NativeAudioModule.playAudio(tempPath);

      setTimeout(
        () => {
          setPlayingNoteId((prev) => (prev === note.id ? null : prev));
          RNFS.unlink(tempPath).catch(() => {});
        },
        (result.duration + 0.5) * 1000
      );
    } catch (error) {
      console.error('[TTS] Error:', error);
      setIsSynthesizing(null);
      setPlayingNoteId(null);
    }
  };

  if (notes.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📝</Text>
        <Text style={styles.emptyTitle}>No saved notes yet</Text>
        <Text style={styles.emptySubtitle}>
          Save advice from the assistant to view it here later.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {notes.map((note) => (
          <View key={note.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{note.scenario}</Text>
              </View>
              <TouchableOpacity onPress={() => deleteNote(note.id)}>
                <Text style={styles.deleteIcon}>🗑️</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.queryText}>"{note.query}"</Text>

            <View style={styles.responseBox}>
              <Text style={styles.responseText}>{note.response}</Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.ttsButton, playingNoteId === note.id && styles.ttsButtonActive]}
              onPress={() => toggleTTS(note)}
              disabled={isSynthesizing === note.id}
            >
              {isSynthesizing === note.id ? (
                <ActivityIndicator color={AppColors.textPrimary} size="small" />
              ) : (
                <>
                  <Text style={styles.ttsIcon}>{playingNoteId === note.id ? '⏹' : '🔊'}</Text>
                  <Text style={styles.ttsText}>
                    {playingNoteId === note.id ? 'Stop Playing' : 'Read Aloud'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.primaryDark },
  emptyContainer: {
    flex: 1,
    backgroundColor: AppColors.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: AppColors.textPrimary, marginBottom: 8 },
  emptySubtitle: {
    fontSize: 14,
    color: AppColors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  scrollContent: { padding: 24, paddingBottom: 60 },
  card: {
    backgroundColor: AppColors.surfaceCard,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: AppColors.textMuted + '33',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  badge: {
    backgroundColor: '#3B82F6' + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeText: { color: '#3B82F6', fontWeight: '700', fontSize: 12, textTransform: 'uppercase' },
  deleteIcon: { fontSize: 18, opacity: 0.7 },

  queryText: { fontSize: 16, color: AppColors.textPrimary, fontStyle: 'italic', marginBottom: 16 },
  responseBox: {
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
    marginBottom: 16,
  },
  responseText: { fontSize: 15, color: AppColors.textPrimary, lineHeight: 24 },

  ttsButton: {
    flexDirection: 'row',
    backgroundColor: AppColors.surfaceElevated,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: AppColors.textMuted + '33',
  },
  ttsButtonActive: { borderColor: '#10B981', backgroundColor: '#10B981' + '10' },
  ttsIcon: { fontSize: 18, marginRight: 8 },
  ttsText: { color: AppColors.textPrimary, fontWeight: '700', fontSize: 15 },
});
