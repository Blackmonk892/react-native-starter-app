import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { AppColors } from '../theme';

type HomeScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'Home'>;
};

// The core scenarios the user might find themselves in
const SCENARIOS = ['🏦 Bank', '🏥 Hospital', '🏛️ Govt Office', '🎓 College', '🏠 Daily Life'];

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [selectedScenario, setSelectedScenario] = useState(SCENARIOS[0]);

  const navigateToInteraction = (mode: 'ask' | 'listen' | 'reply') => {
    navigation.navigate('Interaction', { mode, scenario: selectedScenario });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={AppColors.primaryDark} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.title}>BolSaathi</Text>
          <Text style={styles.subtitle}>Your real-world communication assistant</Text>
        </View>

        {/* Scenario Selector */}
        <View style={styles.scenarioSection}>
          <Text style={styles.sectionLabel}>Where are you right now?</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipScroll}
            contentContainerStyle={styles.chipScrollContent}
          >
            {SCENARIOS.map((scenario) => (
              <TouchableOpacity
                key={scenario}
                activeOpacity={0.7}
                style={[styles.chip, selectedScenario === scenario && styles.chipActive]}
                onPress={() => setSelectedScenario(scenario)}
              >
                <Text
                  style={[styles.chipText, selectedScenario === scenario && styles.chipTextActive]}
                >
                  {scenario}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Main Action Cards */}
        <View style={styles.actionGrid}>
          {/* Ask Mode */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.actionCard, { borderLeftColor: '#3B82F6' }]}
            onPress={() => navigateToInteraction('ask')}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#3B82F6' + '20' }]}>
              <Text style={styles.cardIcon}>🗣️</Text>
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitle}>What should I say?</Text>
              <Text style={styles.cardSubtitle}>Get help explaining your issue clearly</Text>
            </View>
          </TouchableOpacity>

          {/* Listen Mode */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.actionCard, { borderLeftColor: '#10B981' }]}
            onPress={() => navigateToInteraction('listen')}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#10B981' + '20' }]}>
              <Text style={styles.cardIcon}>👂</Text>
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitle}>What did they say?</Text>
              <Text style={styles.cardSubtitle}>Listen and explain in simple words</Text>
            </View>
          </TouchableOpacity>

          {/* Reply Mode */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.actionCard, { borderLeftColor: '#8B5CF6' }]}
            onPress={() => navigateToInteraction('reply')}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#8B5CF6' + '20' }]}>
              <Text style={styles.cardIcon}>💬</Text>
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitle}>How do I reply?</Text>
              <Text style={styles.cardSubtitle}>Generate a polite, confident response</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Secondary Actions */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('SavedNotes')}
        >
          <Text style={styles.secondaryButtonIcon}>📝</Text>
          <Text style={styles.secondaryButtonText}>View Saved Notes</Text>
        </TouchableOpacity>
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
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: AppColors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: AppColors.textSecondary,
    marginTop: 8,
    lineHeight: 24,
  },
  scenarioSection: {
    marginBottom: 32,
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.textPrimary,
    marginBottom: 16,
  },
  chipScroll: {
    marginHorizontal: -24, // Break out of container padding for full-width scroll
  },
  chipScrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: AppColors.surfaceCard,
    borderRadius: 24,
    marginRight: 12,
    borderWidth: 1,
    borderColor: AppColors.textMuted + '33',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chipActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  chipText: {
    color: AppColors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  actionGrid: {
    gap: 16,
    marginBottom: 32,
  },
  actionCard: {
    backgroundColor: AppColors.surfaceCard,
    padding: 20,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 6,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardIcon: {
    fontSize: 28,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: AppColors.textPrimary,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: AppColors.textSecondary,
    lineHeight: 20,
  },
  secondaryButton: {
    flexDirection: 'row',
    padding: 18,
    backgroundColor: AppColors.surfaceElevated,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: AppColors.textMuted + '20',
  },
  secondaryButtonIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  secondaryButtonText: {
    fontSize: 18,
    color: AppColors.textPrimary,
    fontWeight: '700',
  },
});
