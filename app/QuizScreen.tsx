import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator, Animated, Dimensions, Image, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors, fonts, layout } from './styles/globalStyles';
import { createClient } from '@supabase/supabase-js';
import QuestionCard from '../components/QuestionCard';
import ProgressCircle from '../components/ProgressCircle';
import Header from '../components/Header';
import { Volume2, AlertCircle, CheckCircle2 } from 'lucide-react-native';
import { shuffle } from 'lodash';

// Add these lines to create the Supabase client
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
}

const QuizScreen = () => {
  console.log('QuizScreen rendered');

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

  const fetchQuestions = async () => {
    try {
      console.log('Fetching questions for storyId:', params.storyId);
      if (!params.storyId) {
        console.error('storyId is undefined');
        setError('Story ID is missing. Cannot fetch questions.');
        return;
      }

      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('story_id', params.storyId);

      console.log('Supabase response:', JSON.stringify(data, null, 2));

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      if (data && Array.isArray(data)) {
        console.log('Total questions fetched:', data.length);
        if (data.length > 0) {
          console.log('Sample question:', JSON.stringify(data[0], null, 2));
          // Ensure each question has the required properties
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
            setError('No valid questions found for this story. Please try again later.');
          }
        } else {
          console.log('No questions found for this story');
          setError('No questions found for this story. Please try again later.');
        }
      } else {
        console.error('Unexpected data structure:', data);
        setError('Unexpected data structure received. Please try again later.');
      }
    } catch (error) {
      console.error('Error in fetchQuestions:', error);
      if (error instanceof Error) {
        setError(`Failed to fetch questions: ${error.message}`);
      } else {
        setError('An unknown error occurred while fetching questions.');
      }
    }
  };

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
    setIsAnswerChecked(false);
  };

  const handleCheckAnswer = async () => {
    if (!selectedAnswer) {
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 3000); // Hide message after 3 seconds
      return;
    }

    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion.correct_answer;
    setIsCorrect(isCorrect);
    setIsAnswerChecked(true);
    setShowFeedback(true);
    setAttempts(attempts + 1);

    // Animate feedback container
    Animated.timing(feedbackAnimation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Save answer to database
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
    } else {
      // Quiz finished, navigate to results screen
      router.push({
        pathname: '/ReadingResultsScreen',
        params: { 
          readingSessionId: params.readingSessionId,
          readingTime: params.readingTime,
          readingPoints: params.readingPoints,
          energy: params.energy,
          audioUri: params.audioUri
        }
      });
    }
  };

  const handleBackPress = () => {
    router.back();
  };

  const handleMorePress = () => {
    // Implement more options functionality
  };

  const handleListenPress = () => {
    // Implement text-to-speech functionality
  };

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header 
          title="Error" 
          onBackPress={handleBackPress}
          onMorePress={() => {}}
        />
        <View style={styles.container}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.back()}
          >
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (questions.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header 
          title="Loading" 
          onBackPress={handleBackPress}
          onMorePress={() => {}}
        />
        <View style={styles.container}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading questions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  if (!currentQuestion) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header 
          title="Error" 
          onBackPress={handleBackPress}
          onMorePress={() => {}}
        />
        <View style={styles.container}>
          <Text style={styles.errorText}>Error: No question data available</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.back()}
          >
            <Text style={styles.buttonText}>Go Back</Text>
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
      <Header 
        title="Veera ja taikasiemen" 
        onBackPress={handleBackPress}
        onMorePress={handleMorePress}
      />
      <View style={styles.container}>
        <View style={styles.topRow}>
          <TouchableOpacity onPress={handleListenPress} style={styles.listenButton}>
            <Volume2 size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          <ProgressCircle 
            progress={(currentQuestionIndex + 1) / questions.length} 
            size={24} // Adjusted from 40 to 32
            strokeWidth={3} // Adjusted from 4 to 3 for better proportion
          />
        </View>
        
        <QuestionCard
          question={currentQuestion.question_text}
          answers={shuffledAnswers}
          selectedAnswer={selectedAnswer}
          onSelectAnswer={handleAnswerSelect}
          isChecked={isAnswerChecked}
          isCorrect={isCorrect}
        />
        
        {showMessage && (
          <Text style={styles.messageText}>Please select an answer before checking.</Text>
        )}
      </View>
      
      {!isAnswerChecked && (
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={styles.checkButton}
            onPress={handleCheckAnswer}
          >
            <Text style={styles.buttonText}>Check</Text>
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
            <View style={styles.yomiImageContainer}>
              <Image 
                source={isCorrect ? require('../assets/images/yomi-correct.png') : require('../assets/images/yomi.png')} 
                style={styles.yomiImage}
              />
            </View>
            <Text style={styles.feedbackText}>
              {isCorrect ? 'Hienoa, oikein meni! Hyvin luettu.' : 'Oho, väärin meni. Kokeile uudelleen!'}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.gotItButton, isCorrect ? styles.correctButton : styles.incorrectButton]}
            onPress={handleGotIt}
          >
            <Text style={[styles.gotItButtonText, isCorrect ? styles.correctButtonText : styles.incorrectButtonText]}>
              {isCorrect ? 'Jatka' : 'Selvä'}
            </Text>
          </TouchableOpacity>
          {!isCorrect && <Text style={styles.tryAgainText}>Hyppää seuraavaan</Text>}
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
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: layout.spacing * 2,
  },
  listenButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background02,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.stroke,
  },
  button: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: layout.spacing * 2,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 18,
    fontFamily: fonts.medium,
    color: colors.text,
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
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: layout.spacing,
    paddingBottom: 34,
  },
  feedbackContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: layout.spacing,
  },
  yomiImageContainer: {
    width: 60,
    height: 68,
    borderRadius: 30,
    overflow: 'hidden',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  yomiImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  feedbackText: {
    flex: 1,
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.text,
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
    paddingBottom: 34, // Extra padding for devices with home indicator
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
});

export default QuizScreen;
