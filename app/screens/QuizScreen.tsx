import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator, Animated, Dimensions, Image, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors, fonts, layout } from '../styles/globalStyles';
import { createClient } from '@supabase/supabase-js';
import QuestionCard from '../../components/shared/QuestionCard';
import ProgressCircle from '../../components/shared/ProgressCircle';
import { Audio } from 'expo-av';
import { useTranslation } from 'react-i18next';

// supabase
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key is missing');
}

const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

interface Question {
  id: string;
  question_text: string;
  correct_answer: string;
  incorrect_answers: string[];
  story_id: string;
  language: string;
}

interface Story {
  id: string;
  title: string;
}

// Shuffle array utility
const shuffle = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

// Custom header component without back button
const CustomHeader = ({ title, rightElement }: { title: string, rightElement?: React.ReactNode }) => {
  return (
    <View style={styles.header}>
      <View style={styles.headerButtonPlaceholder} />
      <Text style={styles.headerTitle}>{title}</Text>
      {rightElement && (
        <View style={styles.rightElement}>
          {rightElement}
        </View>
      )}
    </View>
  );
};

const QuizScreen = () => {
  console.log('QuizScreen rendered');
  const { t, i18n } = useTranslation();
  
  const router = useRouter();
  const params = useLocalSearchParams<{ 
    readingSessionId: string, 
    storyId: string,
    readingTime: string,
    readingPoints: string,
    energy: string,
    audioUri: string,
    userId: string
  }>();

  console.log('Received params:', params);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [shuffledAnswers, setShuffledAnswers] = useState<string[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const feedbackAnimation = useRef(new Animated.Value(0)).current;
  const [showMessage, setShowMessage] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [storyTitle, setStoryTitle] = useState<string>('');
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  useEffect(() => {
    console.log('QuizScreen mounted with params:', params);
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, []);

  useEffect(() => {
    if (questions.length > 0) {
      setShuffledAnswers(getShuffledAnswers(questions[0]));
    }
  }, [questions]);

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  useEffect(() => {
    fetchStoryTitle();
  }, [params.storyId]);

  const fetchQuestions = async () => {
    try {
      console.log('Fetching questions for storyId:', params.storyId);
      if (!params.storyId) {
        console.error('storyId is undefined');
        setError(t('quizScreen.errors.missingStoryId'));
        return;
      }

      const currentLanguage = i18n.language;
      console.log('Current language:', currentLanguage);

      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('story_id', params.storyId)
        .eq('language', currentLanguage);

      console.log('Supabase response:', JSON.stringify(data, null, 2));

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      if (data && Array.isArray(data)) {
        console.log('Total questions fetched:', data.length);
        if (data.length > 0) {
          console.log('Sample question:', JSON.stringify(data[0], null, 2));
          const validQuestions = data.filter(question => 
            question.id && 
            question.question_text && 
            question.correct_answer && 
            Array.isArray(question.incorrect_answers) &&
            question.incorrect_answers.length > 0
          );

          console.log('Valid questions:', validQuestions.length);

          if (validQuestions.length > 0) {
            setQuestions(validQuestions);
            console.log('Questions set in state');
          } else {
            console.log('No valid questions found for this story');
            setError(t('quizScreen.errors.noValidQuestions'));
          }
        } else {
          console.log('No questions found for this story');
          setError(t('quizScreen.errors.noQuestions'));
        }
      } else {
        console.error('Unexpected data structure:', data);
        setError(t('quizScreen.errors.unexpectedData'));
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      setError(
        error instanceof Error
          ? t('quizScreen.errors.fetchFailed', { message: error.message })
          : t('quizScreen.errors.unknown')
      );
    }
  };

  const fetchStoryTitle = async () => {
    if (!params.storyId) return;

    try {
      const { data, error } = await supabase
        .from('stories')
        .select('title')
        .eq('id', params.storyId)
        .single();

      if (error) {
        console.error('Error fetching story title:', error);
        return;
      }

      if (data) {
        setStoryTitle(data.title);
      }
    } catch (error) {
      console.error('Error in fetchStoryTitle:', error);
    }
  };

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const playCorrectSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/sounds/twinkle.mp3'),
        { 
          volume: 1.0,
          shouldPlay: false
        }
      );
      setSound(sound);
      
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: false,
      });
      
      await sound.playAsync();
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  };

  const handleCheckAnswer = async () => {
    if (!selectedAnswer) {
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 3000);
      return;
    }

    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion.correct_answer;
    setIsCorrect(isCorrect);
    setIsAnswerChecked(true);
    setShowFeedback(true);
    setAttempts(attempts + 1);

    if (isCorrect) {
      setCorrectAnswers(prev => prev + 1);
      await playCorrectSound();
    }

    Animated.timing(feedbackAnimation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    const { error } = await supabase
      .from('questions_answered')
      .insert({
        user_id: params.userId,
        question_id: currentQuestion.id,
        reading_session_id: params.readingSessionId,
        user_answer: selectedAnswer,
        is_correct: isCorrect,
      });

    if (error) {
      console.error('Error saving answer:', error);
    }
  };

  const handleGotIt = () => {
    Animated.timing(feedbackAnimation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowFeedback(false);
      if (isCorrect) {
        handleNextQuestion();
      } else {
        setIsAnswerChecked(false);
        setSelectedAnswer(null);
      }
    });
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      setShuffledAnswers(getShuffledAnswers(questions[nextIndex]));
      setSelectedAnswer(null);
      setIsAnswerChecked(false);
      setIsCorrect(false);
      setAttempts(0);
      setShowFeedback(false);
    } else {
      router.push({
        pathname: '/screens/ReadingResultsScreen',
        params: { 
          readingSessionId: params.readingSessionId,
          readingTime: params.readingTime,
          readingPoints: params.readingPoints,
          energy: params.energy,
          audioUri: params.audioUri,
          correctAnswers: correctAnswers.toString(),
          totalQuestions: questions.length.toString(),
          userId: params.userId,
          storyId: params.storyId
        }
      });
    }
  };

  const handleSkipQuestion = () => {
    handleNextQuestion();
  };

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <CustomHeader title={t('common.error')} />
        <View style={styles.container}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push({
              pathname: '/(tabs)/reading',
              params: { userId: params.userId }
            })}
          >
            <Text style={styles.buttonText}>{t('quizScreen.goBack')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (questions.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <CustomHeader title={t('quizScreen.loading')} />
        <View style={styles.container}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{t('quizScreen.loadingQuestions')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  if (!currentQuestion) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <CustomHeader title={t('common.error')} />
        <View style={styles.container}>
          <Text style={styles.errorText}>{t('quizScreen.errors.noQuestionData')}</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push({
              pathname: '/(tabs)/reading',
              params: { userId: params.userId }
            })}
          >
            <Text style={styles.buttonText}>{t('quizScreen.goBack')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const getShuffledAnswers = (question: Question) => {
    if (!question.correct_answer || !Array.isArray(question.incorrect_answers)) {
      console.error('Invalid question structure:', question);
      return [];
    }
    return shuffle([question.correct_answer, ...question.incorrect_answers]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <CustomHeader 
        title={storyTitle || t('quizScreen.quiz')}
        rightElement={
          <ProgressCircle 
            progress={(currentQuestionIndex + 1) / questions.length} 
            size={32} 
            strokeWidth={3} 
          />
        }
      />
      <View style={styles.container}>
        <QuestionCard
          question={currentQuestion.question_text}
          answers={shuffledAnswers}
          selectedAnswer={selectedAnswer}
          onSelectAnswer={handleAnswerSelect}
          isChecked={isAnswerChecked}
          isCorrect={isCorrect}
        />
        
        {showMessage && (
          <Text style={styles.messageText}>{t('quizScreen.selectAnswer')}</Text>
        )}
      </View>
      
      {!isAnswerChecked && (
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={styles.checkButton}
            onPress={handleCheckAnswer}
          >
            <Text style={styles.buttonText}>{t('quizScreen.check')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {showFeedback && (
        <Animated.View 
          style={[
            styles.feedbackContainer,
            {
              transform: [
                {
                  translateY: feedbackAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [300, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.feedbackContent}>
            <Text style={styles.feedbackText}>
              {isCorrect ? t('quizScreen.feedback.correct') : t('quizScreen.feedback.incorrect')}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.gotItButton, isCorrect ? styles.correctButton : styles.incorrectButton]}
            onPress={handleGotIt}
          >
            <Text style={[styles.gotItButtonText, isCorrect ? styles.correctButtonText : styles.incorrectButtonText]}>
              {isCorrect ? t('quizScreen.continue') : t('quizScreen.ok')}
            </Text>
          </TouchableOpacity>
          {!isCorrect && (
            <TouchableOpacity onPress={handleSkipQuestion}>
              <Text style={styles.skipQuestionText}>{t('quizScreen.skipQuestion')}</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    padding: layout.padding,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 64,
  },
  headerButtonPlaceholder: {
    width: 40,
    height: 40,
  },
  headerTitle: {
    fontFamily: fonts.medium,
    fontSize: 18,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  rightElement: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: layout.spacing * 2,
  },
  buttonText: {
    fontSize: 18,
    fontFamily: fonts.medium,
    color: colors.buttonTextDark,
  },
  errorText: {
    fontSize: 18,
    fontFamily: fonts.medium,
    color: colors.error,
    textAlign: 'center',
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 18,
    fontFamily: fonts.medium,
    color: colors.text,
    textAlign: 'center',
    marginTop: 20,
  },
  buttonContinue: {
    backgroundColor: colors.correct,
  },
  feedbackContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background02,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: layout.spacing,
    paddingBottom: 32,
  },
  feedbackContent: {
    marginVertical: layout.spacing,
  },
  feedbackText: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.text,
    textAlign: 'center',
  },
  gotItButton: {
    borderRadius: 30,
    padding: 16,
    alignItems: 'center',
    marginTop: layout.spacing,
  },
  correctButton: {
    backgroundColor: colors.correct,
  },
  incorrectButton: {
    backgroundColor: colors.incorrect,
  },
  gotItButtonText: {
    fontSize: 18,
    fontFamily: fonts.medium,
  },
  correctButtonText: {
    color: colors.buttonTextDark,
  },
  incorrectButtonText: {
    color: colors.buttonTextDark,
  },
  tryAgainText: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
    textAlign: 'center',
    marginTop: 16,
  },
  bottomContainer: {
    padding: layout.padding,
    paddingBottom: 34,
    backgroundColor: colors.background,
  },
  checkButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  messageText: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.incorrect,
    textAlign: 'center',
    marginTop: layout.spacing,
  },
  skipQuestionText: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
    textAlign: 'center',
    marginTop: 16,
  },
});

export default QuizScreen;
