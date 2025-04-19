// Script to translate Finnish questions to English and add them to the database
// Run with: node scripts/translate-questions.js

const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: Missing Supabase credentials. Make sure you have EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to prompt user for input
const prompt = (question) => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
};

// Function to fetch all Finnish questions
async function fetchFinnishQuestions() {
  try {
    // First check if the language column exists
    const { data: tableInfo, error: tableError } = await supabase
      .from('questions')
      .select('language')
      .limit(1);

    // If language column doesn't exist, we need to alert the user
    if (tableError && tableError.message.includes('column "language" does not exist')) {
      console.error('\nError: The "language" column does not exist in your questions table.');
      console.log('\nYou need to add a language column to your questions table first. Run this SQL in your Supabase SQL editor:');
      console.log('\nALTER TABLE questions ADD COLUMN language TEXT DEFAULT \'fi\';');
      process.exit(1);
    }

    // Fetch all Finnish questions or questions without a language (assuming they're Finnish)
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .or('language.eq.fi,language.is.null');

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching Finnish questions:', error.message);
    process.exit(1);
  }
}

// Function to translate and insert a question
async function translateAndInsertQuestion(question) {
  console.log('\n---------------------------------------------------');
  console.log(`\nFinnish Question: ${question.question_text}`);
  console.log(`Correct Answer: ${question.correct_answer}`);
  console.log('Incorrect Answers:');
  question.incorrect_answers.forEach((answer, index) => {
    console.log(`  ${index + 1}. ${answer}`);
  });

  // Get English translations
  const englishQuestionText = await prompt('\nEnter English translation for the question: ');
  const englishCorrectAnswer = await prompt('Enter English translation for the correct answer: ');
  
  const englishIncorrectAnswers = [];
  for (let i = 0; i < question.incorrect_answers.length; i++) {
    const englishIncorrectAnswer = await prompt(`Enter English translation for incorrect answer #${i + 1}: `);
    englishIncorrectAnswers.push(englishIncorrectAnswer);
  }

  // Create a new question object for the English version
  const englishQuestion = {
    story_id: question.story_id,
    question_text: englishQuestionText,
    correct_answer: englishCorrectAnswer,
    incorrect_answers: englishIncorrectAnswers,
    language: 'en'
  };

  try {
    // Check if an English version already exists
    const { data: existingData, error: existingError } = await supabase
      .from('questions')
      .select('id')
      .eq('story_id', question.story_id)
      .eq('language', 'en')
      .eq('question_text', englishQuestionText);

    if (existingError) {
      throw existingError;
    }

    // If the question already exists, ask if the user wants to update it
    if (existingData && existingData.length > 0) {
      const updateResponse = await prompt('\nAn English version of this question already exists. Do you want to update it? (y/n): ');
      
      if (updateResponse.toLowerCase() === 'y') {
        const { error: updateError } = await supabase
          .from('questions')
          .update(englishQuestion)
          .eq('id', existingData[0].id);

        if (updateError) {
          throw updateError;
        }
        
        console.log('\n✅ English question updated successfully!');
      } else {
        console.log('\nSkipping this question.');
      }
    } else {
      // Insert new English question
      const { error: insertError } = await supabase
        .from('questions')
        .insert([englishQuestion]);

      if (insertError) {
        throw insertError;
      }

      console.log('\n✅ English question added successfully!');
    }
  } catch (error) {
    console.error('\n❌ Error saving English question:', error.message);
  }

  return;
}

// Main function
async function main() {
  try {
    console.log('\n======== Finnish Question Translator ========');
    console.log('This script will help you translate Finnish questions to English and add them to your database.\n');
    
    // Get all Finnish questions
    const finnishQuestions = await fetchFinnishQuestions();
    
    if (finnishQuestions.length === 0) {
      console.log('No Finnish questions found in the database.');
      process.exit(0);
    }
    
    console.log(`Found ${finnishQuestions.length} Finnish questions.\n`);
    
    const translateAll = await prompt('Do you want to translate all questions? (y/n): ');
    
    if (translateAll.toLowerCase() === 'y') {
      // Translate all questions
      for (let i = 0; i < finnishQuestions.length; i++) {
        console.log(`\nQuestion ${i + 1} of ${finnishQuestions.length}`);
        await translateAndInsertQuestion(finnishQuestions[i]);
      }
    } else {
      // Choose a story to translate
      const storyIds = [...new Set(finnishQuestions.map(q => q.story_id))];
      
      console.log('\nAvailable stories:');
      for (let i = 0; i < storyIds.length; i++) {
        const { data } = await supabase
          .from('stories')
          .select('title')
          .eq('id', storyIds[i])
          .single();
          
        console.log(`${i + 1}. ${data ? data.title : storyIds[i]}`);
      }
      
      const storyIndex = parseInt(await prompt('\nEnter the number of the story to translate: ')) - 1;
      
      if (storyIndex >= 0 && storyIndex < storyIds.length) {
        const storyId = storyIds[storyIndex];
        const storyQuestions = finnishQuestions.filter(q => q.story_id === storyId);
        
        console.log(`\nTranslating ${storyQuestions.length} questions for selected story.`);
        
        for (let i = 0; i < storyQuestions.length; i++) {
          console.log(`\nQuestion ${i + 1} of ${storyQuestions.length}`);
          await translateAndInsertQuestion(storyQuestions[i]);
        }
      } else {
        console.log('Invalid story number selected.');
      }
    }
    
    console.log('\n======== Translation Complete ========');
    console.log('All selected questions have been translated and saved to the database.');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    rl.close();
  }
}

// Run the main function
main(); 