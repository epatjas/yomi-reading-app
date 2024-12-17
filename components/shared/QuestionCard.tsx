import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, fonts, layout } from '../../app/styles/globalStyles';
import { X, Check } from 'lucide-react-native';

interface QuestionCardProps {
  question: string;
  answers: string[];
  selectedAnswer: string | null;
  onSelectAnswer: (answer: string) => void;
  isChecked: boolean;
  isCorrect: boolean;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  answers,
  selectedAnswer,
  onSelectAnswer,
  isChecked,
  isCorrect,
}) => {
  return (
    <View style={styles.card}>
      <Text style={styles.question}>{question}</Text>
      <View style={styles.answersContainer}>
        {answers.map((answer, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.answerButton,
              selectedAnswer === answer && styles.selectedAnswer,
              isChecked && selectedAnswer === answer && (isCorrect ? styles.correctAnswer : styles.incorrectAnswer),
            ]}
            onPress={() => onSelectAnswer(answer)}
            disabled={isChecked}
          >
            <Text style={[
              styles.answerText,
              selectedAnswer === answer && styles.selectedAnswerText,
            ]}>
              {answer}
            </Text>
            {isChecked && selectedAnswer === answer && (
              <View style={styles.iconContainer}>
                {isCorrect ? (
                  <Check size={16} color={colors.correct} />
                ) : (
                  <X size={16} color={colors.incorrect} />
                )}
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background,
  },
  question: {
    fontSize: 20,
    fontFamily: fonts.regular,
    color: colors.text,
    marginBottom: layout.spacing * 2,
  },
  answersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  answerButton: {
    width: '48%',
    backgroundColor: colors.background02,
    borderRadius: 16,
    padding: layout.spacing,
    marginBottom: layout.spacing,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 160,
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.stroke,
  },
  selectedAnswer: {
    borderColor: colors.primary,
  },
  correctAnswer: {
    borderColor: colors.correct,
    borderWidth: 2,
  },
  incorrectAnswer: {
    borderColor: colors.incorrect,
    borderWidth: 2,
  },
  answerText: {
    fontSize: 18,
    fontFamily: fonts.regular,
    color: colors.text,
    textAlign: 'center',
  },
  selectedAnswerText: {
    fontFamily: fonts.medium,
  },
  iconContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
});

export default QuestionCard;
