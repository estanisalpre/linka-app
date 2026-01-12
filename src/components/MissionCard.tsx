import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Button } from './Button';
import { colors, borderRadius, fontSize, fontWeight, spacing, shadows } from '../utils/theme';

interface MissionCardProps {
  mission: {
    id: string;
    type: string;
    title: string;
    description: string;
    content: any;
    category: string;
    points: number;
  };
  userHasResponded: boolean;
  otherHasResponded: boolean;
  userResponse?: any;
  otherResponse?: any;
  bothResponded: boolean;
  onSubmit: (response: any) => void;
  isSubmitting: boolean;
}

export const MissionCard: React.FC<MissionCardProps> = ({
  mission,
  userHasResponded,
  otherHasResponded,
  userResponse,
  otherResponse,
  bothResponded,
  onSubmit,
  isSubmitting,
}) => {
  const [selectedOptions, setSelectedOptions] = useState<any>({});
  const [textResponse, setTextResponse] = useState('');

  const getCategoryIcon = () => {
    switch (mission.category) {
      case 'values':
        return 'heart';
      case 'lifestyle':
        return 'sunny';
      case 'culture':
        return 'musical-notes';
      case 'dreams':
        return 'star';
      case 'emotions':
        return 'happy';
      case 'fun':
        return 'game-controller';
      case 'growth':
        return 'trending-up';
      default:
        return 'help-circle';
    }
  };

  const handleOptionSelect = (questionIndex: number, option: any) => {
    setSelectedOptions((prev: any) => ({
      ...prev,
      [questionIndex]: option,
    }));
  };

  const handleSubmit = () => {
    let response;
    switch (mission.type) {
      case 'QUESTION':
        response = { text: textResponse };
        break;
      case 'THIS_OR_THAT':
      case 'WOULD_YOU_RATHER':
        response = { choices: selectedOptions };
        break;
      case 'CHOICE':
        response = { selected: selectedOptions[0] };
        break;
      case 'RANKING':
        response = { ranking: selectedOptions.ranking || [] };
        break;
      default:
        response = selectedOptions;
    }
    onSubmit(response);
  };

  const renderMissionContent = () => {
    const { content, type } = mission;

    // If both responded, show comparison
    if (bothResponded) {
      return (
        <View style={styles.comparisonContainer}>
          <Text style={styles.comparisonTitle}>Resultados</Text>
          <View style={styles.responsesRow}>
            <View style={styles.responseColumn}>
              <Text style={styles.responseLabel}>Tu respuesta</Text>
              <Text style={styles.responseText}>
                {JSON.stringify(userResponse, null, 2)}
              </Text>
            </View>
            <View style={styles.responseColumn}>
              <Text style={styles.responseLabel}>Su respuesta</Text>
              <Text style={styles.responseText}>
                {JSON.stringify(otherResponse, null, 2)}
              </Text>
            </View>
          </View>
        </View>
      );
    }

    // If user already responded, show waiting state
    if (userHasResponded) {
      return (
        <View style={styles.waitingContainer}>
          <Ionicons name="hourglass" size={48} color={colors.primary} />
          <Text style={styles.waitingText}>Esperando su respuesta...</Text>
          <Text style={styles.waitingSubtext}>
            Te notificaremos cuando responda
          </Text>
        </View>
      );
    }

    // Render based on mission type
    switch (type) {
      case 'QUESTION':
        return (
          <View style={styles.questionContainer}>
            <Text style={styles.questionText}>{content.question}</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Escribe tu respuesta..."
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={content.maxLength || 500}
              value={textResponse}
              onChangeText={setTextResponse}
            />
            <Text style={styles.charCount}>
              {textResponse.length}/{content.maxLength || 500}
            </Text>
          </View>
        );

      case 'CHOICE':
        return (
          <View style={styles.choiceContainer}>
            <Text style={styles.questionText}>{content.question}</Text>
            {content.options.map((option: string, index: number) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionButton,
                  selectedOptions[0] === option && styles.optionSelected,
                ]}
                onPress={() => handleOptionSelect(0, option)}
              >
                <Text
                  style={[
                    styles.optionText,
                    selectedOptions[0] === option && styles.optionTextSelected,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case 'THIS_OR_THAT':
        return (
          <View style={styles.thisOrThatContainer}>
            {content.choices.map((choice: any, index: number) => (
              <View key={index} style={styles.choicePair}>
                <TouchableOpacity
                  style={[
                    styles.thisOrThatOption,
                    selectedOptions[index] === 'A' && styles.optionSelected,
                  ]}
                  onPress={() => handleOptionSelect(index, 'A')}
                >
                  <Text
                    style={[
                      styles.thisOrThatText,
                      selectedOptions[index] === 'A' && styles.optionTextSelected,
                    ]}
                  >
                    {choice.optionA}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.orText}>o</Text>
                <TouchableOpacity
                  style={[
                    styles.thisOrThatOption,
                    selectedOptions[index] === 'B' && styles.optionSelected,
                  ]}
                  onPress={() => handleOptionSelect(index, 'B')}
                >
                  <Text
                    style={[
                      styles.thisOrThatText,
                      selectedOptions[index] === 'B' && styles.optionTextSelected,
                    ]}
                  >
                    {choice.optionB}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        );

      case 'WOULD_YOU_RATHER':
        return (
          <View style={styles.wouldYouRatherContainer}>
            {content.scenarios.map((scenario: any, index: number) => (
              <View key={index} style={styles.scenarioContainer}>
                <Text style={styles.scenarioTitle}>Escenario {index + 1}</Text>
                <TouchableOpacity
                  style={[
                    styles.scenarioOption,
                    selectedOptions[index] === 'A' && styles.optionSelected,
                  ]}
                  onPress={() => handleOptionSelect(index, 'A')}
                >
                  <Text
                    style={[
                      styles.scenarioText,
                      selectedOptions[index] === 'A' && styles.optionTextSelected,
                    ]}
                  >
                    {scenario.optionA}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.vsText}>VS</Text>
                <TouchableOpacity
                  style={[
                    styles.scenarioOption,
                    selectedOptions[index] === 'B' && styles.optionSelected,
                  ]}
                  onPress={() => handleOptionSelect(index, 'B')}
                >
                  <Text
                    style={[
                      styles.scenarioText,
                      selectedOptions[index] === 'B' && styles.optionTextSelected,
                    ]}
                  >
                    {scenario.optionB}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        );

      default:
        return (
          <Text style={styles.unsupportedText}>
            Tipo de misión no soportado
          </Text>
        );
    }
  };

  const canSubmit = () => {
    if (userHasResponded) return false;

    switch (mission.type) {
      case 'QUESTION':
        return textResponse.trim().length > 0;
      case 'CHOICE':
        return selectedOptions[0] !== undefined;
      case 'THIS_OR_THAT':
        return Object.keys(selectedOptions).length === mission.content.choices.length;
      case 'WOULD_YOU_RATHER':
        return Object.keys(selectedOptions).length === mission.content.scenarios.length;
      default:
        return true;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[colors.primaryDark, colors.primary]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.categoryBadge}>
            <Ionicons name={getCategoryIcon()} size={16} color={colors.text} />
            <Text style={styles.categoryText}>{mission.category}</Text>
          </View>
          <View style={styles.pointsBadge}>
            <Ionicons name="star" size={14} color={colors.warning} />
            <Text style={styles.pointsText}>+{mission.points}</Text>
          </View>
        </View>
        <Text style={styles.title}>{mission.title}</Text>
        <Text style={styles.description}>{mission.description}</Text>
      </LinearGradient>

      {/* Status indicators */}
      {!bothResponded && (
        <View style={styles.statusRow}>
          <View style={styles.statusItem}>
            <Ionicons
              name={userHasResponded ? 'checkmark-circle' : 'ellipse-outline'}
              size={20}
              color={userHasResponded ? colors.success : colors.textMuted}
            />
            <Text style={styles.statusText}>Tú</Text>
          </View>
          <View style={styles.statusDivider} />
          <View style={styles.statusItem}>
            <Ionicons
              name={otherHasResponded ? 'checkmark-circle' : 'ellipse-outline'}
              size={20}
              color={otherHasResponded ? colors.success : colors.textMuted}
            />
            <Text style={styles.statusText}>Ellos</Text>
          </View>
        </View>
      )}

      {/* Content */}
      <View style={styles.content}>
        {renderMissionContent()}
      </View>

      {/* Submit button */}
      {!userHasResponded && !bothResponded && (
        <View style={styles.submitContainer}>
          <Button
            title="Enviar respuesta"
            onPress={handleSubmit}
            disabled={!canSubmit()}
            loading={isSubmitting}
            fullWidth
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.md,
  },
  header: {
    padding: spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  categoryText: {
    color: colors.text,
    fontSize: fontSize.xs,
    textTransform: 'capitalize',
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  pointsText: {
    color: colors.warning,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.xs,
  },
  description: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: fontSize.sm,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statusText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  statusDivider: {
    width: 40,
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  content: {
    padding: spacing.lg,
  },
  // Question styles
  questionContainer: {
    gap: spacing.md,
  },
  questionText: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
    textAlign: 'center',
  },
  textInput: {
    backgroundColor: colors.backgroundLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.text,
    fontSize: fontSize.md,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  charCount: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    textAlign: 'right',
  },
  // Choice styles
  choiceContainer: {
    gap: spacing.md,
  },
  optionButton: {
    backgroundColor: colors.backgroundLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  optionText: {
    color: colors.text,
    fontSize: fontSize.md,
    textAlign: 'center',
  },
  optionTextSelected: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  // This or That styles
  thisOrThatContainer: {
    gap: spacing.lg,
  },
  choicePair: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  thisOrThatOption: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thisOrThatText: {
    color: colors.text,
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
  orText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  // Would You Rather styles
  wouldYouRatherContainer: {
    gap: spacing.xl,
  },
  scenarioContainer: {
    gap: spacing.sm,
  },
  scenarioTitle: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    textAlign: 'center',
  },
  scenarioOption: {
    backgroundColor: colors.backgroundLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  scenarioText: {
    color: colors.text,
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
  vsText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    textAlign: 'center',
    fontWeight: fontWeight.bold,
  },
  // Waiting state
  waitingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  waitingText: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  waitingSubtext: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  // Comparison
  comparisonContainer: {
    gap: spacing.md,
  },
  comparisonTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    textAlign: 'center',
  },
  responsesRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  responseColumn: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  responseLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    marginBottom: spacing.xs,
  },
  responseText: {
    color: colors.text,
    fontSize: fontSize.sm,
  },
  unsupportedText: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    textAlign: 'center',
  },
  submitContainer: {
    padding: spacing.lg,
    paddingTop: 0,
  },
});
