#!/usr/bin/env node

/**
 * Story Translation Utility
 * 
 * This script helps translate existing stories from Finnish to English.
 * It fetches all stories from the database and allows you to add English translations.
 * 
 * Usage:
 * node translate_stories.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

// Initialize Supabase client
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Check for missing environment variables
if (!supabaseUrl || !supabaseKey || supabaseKey === 'your_anon_key_here') {
  console.error(`${RED}Error: Missing or invalid Supabase credentials${RESET}`);
  console.error('\nPlease update your .env file with your Supabase URL and anon key:');
  console.error(`
${YELLOW}# Supabase credentials
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key${RESET}
  `);
  console.error('You can find these values in your Supabase project settings > API');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to ask a question and get user input
async function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Helper function to display a story
function displayStory(story, withTranslation = false) {
  console.log('\n=== Story ===');
  console.log(`ID: ${story.id}`);
  console.log(`Title (FI): ${story.title}`);
  if (withTranslation && story.title_en) {
    console.log(`Title (EN): ${story.title_en}`);
  }
  console.log(`Word Count: ${story['word-count']}`);
  console.log(`Difficulty: ${story['difficulty-level']}`);
  console.log('Content (FI):');
  console.log('------------');
  console.log(story.content);
  console.log('------------');
  
  if (withTranslation && story.content_en) {
    console.log('Content (EN):');
    console.log('------------');
    console.log(story.content_en);
    console.log('------------');
  }
}

// Test database connection
async function testDatabaseConnection() {
  console.log(`${BLUE}Testing connection to Supabase...${RESET}`);
  try {
    const { data, error } = await supabase.from('stories').select('id').limit(1);
    
    if (error) {
      throw new Error(error.message);
    }
    
    console.log(`${GREEN}Connection successful!${RESET}`);
    return true;
  } catch (error) {
    console.error(`${RED}Error connecting to Supabase: ${error.message}${RESET}`);
    console.error('\nPossible solutions:');
    console.error('1. Check that your Supabase URL and anon key are correct in the .env file');
    console.error('2. Ensure your Supabase project is active and accessible');
    console.error('3. Check that the "stories" table exists in your database');
    return false;
  }
}

// Add this helper function to count words in text
function countWords(text) {
  if (!text) return 0;
  // Split by whitespace and filter out empty strings
  return text.split(/\s+/).filter(word => word.length > 0).length;
}

// Main function
async function main() {
  try {
    console.log(`${BLUE}Story Translation Utility${RESET}`);
    console.log('----------------------------');
    
    // Test database connection before proceeding
    const isConnected = await testDatabaseConnection();
    if (!isConnected) {
      rl.close();
      return;
    }
    
    console.log(`\n${BLUE}Fetching stories from the database...${RESET}`);
    
    // Fetch all stories
    const { data: stories, error } = await supabase
      .from('stories')
      .select('*');
    
    if (error) {
      throw error;
    }
    
    console.log(`${GREEN}Found ${stories.length} stories.${RESET}`);
    
    // Stories with translations
    const storiesWithTranslations = stories.filter(story => story.title_en && story.content_en);
    const storiesWithoutTranslations = stories.filter(story => !story.title_en || !story.content_en);
    
    console.log(`${BLUE}${storiesWithTranslations.length} stories already have English translations.${RESET}`);
    console.log(`${YELLOW}${storiesWithoutTranslations.length} stories need English translations.${RESET}`);
    
    // Ask what the user wants to do
    const action = await askQuestion(
      `\n${GREEN}What would you like to do?${RESET}\n` +
      '1. Translate stories without translations\n' +
      '2. View stories with translations\n' +
      '3. Edit an existing translation\n' +
      '4. Exit\n\n' +
      'Enter your choice (1-4): '
    );
    
    switch (action) {
      case '1':
        await translateStories(storiesWithoutTranslations);
        break;
      case '2':
        await viewTranslatedStories(storiesWithTranslations);
        break;
      case '3':
        await editTranslation(stories);
        break;
      case '4':
        console.log('Exiting...');
        break;
      default:
        console.log('Invalid choice. Exiting...');
    }
    
  } catch (error) {
    console.error(`${RED}Error: ${error.message}${RESET}`);
  } finally {
    rl.close();
  }
}

// Function to translate stories
async function translateStories(stories) {
  if (stories.length === 0) {
    console.log('No stories need translation.');
    return;
  }
  
  for (const story of stories) {
    displayStory(story);
    
    const translate = await askQuestion('\nWould you like to translate this story? (y/n): ');
    
    if (translate.toLowerCase() === 'y') {
      const titleEn = await askQuestion('Enter English title: ');
      console.log('\nEnter English content (type END on a new line when finished):');
      
      let contentEn = '';
      let line;
      
      while (true) {
        line = await askQuestion('');
        if (line === 'END') break;
        contentEn += line + '\n';
      }
      
      // Update the story with translations
      const wordCountEn = countWords(contentEn.trim());
      const { error } = await supabase
        .from('stories')
        .update({
          title_en: titleEn,
          content_en: contentEn.trim(),
          "word-count-en": wordCountEn
        })
        .eq('id', story.id);
      
      if (error) {
        console.error(`${RED}Error updating story: ${error.message}${RESET}`);
      } else {
        console.log(`\n${GREEN}Translation saved successfully!${RESET}`);
      }
    }
    
    const continueTranslating = await askQuestion('\nContinue to the next story? (y/n): ');
    if (continueTranslating.toLowerCase() !== 'y') {
      break;
    }
  }
}

// Function to view translated stories
async function viewTranslatedStories(stories) {
  if (stories.length === 0) {
    console.log('No stories have translations yet.');
    return;
  }
  
  let index = 0;
  
  while (index < stories.length) {
    const story = stories[index];
    displayStory(story, true);
    
    const action = await askQuestion(
      '\nOptions:\n' +
      'n - Next story\n' +
      'p - Previous story\n' +
      'q - Quit viewing\n\n' +
      'Enter your choice: '
    );
    
    switch (action.toLowerCase()) {
      case 'n':
        index = Math.min(index + 1, stories.length - 1);
        break;
      case 'p':
        index = Math.max(index - 1, 0);
        break;
      case 'q':
        return;
      default:
        console.log('Invalid choice.');
    }
  }
}

// Function to edit a translation
async function editTranslation(stories) {
  const storyId = await askQuestion('\nEnter the ID of the story to edit: ');
  
  const story = stories.find(s => s.id === storyId);
  
  if (!story) {
    console.log('Story not found.');
    return;
  }
  
  displayStory(story, true);
  
  const editTitle = await askQuestion('\nEdit the English title? (y/n): ');
  let titleEn = story.title_en || '';
  
  if (editTitle.toLowerCase() === 'y') {
    titleEn = await askQuestion(`Enter new English title [${titleEn}]: `);
    if (!titleEn) titleEn = story.title_en || '';
  }
  
  const editContent = await askQuestion('Edit the English content? (y/n): ');
  let contentEn = story.content_en || '';
  
  if (editContent.toLowerCase() === 'y') {
    console.log('\nEnter new English content (type END on a new line when finished):');
    console.log('Current content:');
    console.log('------------');
    console.log(contentEn);
    console.log('------------');
    
    contentEn = '';
    let line;
    
    while (true) {
      line = await askQuestion('');
      if (line === 'END') break;
      contentEn += line + '\n';
    }
    
    contentEn = contentEn.trim();
  }
  
  // Confirm the changes
  const confirm = await askQuestion('\nSave changes? (y/n): ');
  
  if (confirm.toLowerCase() === 'y') {
    const wordCountEn = countWords(contentEn);
    const { error } = await supabase
      .from('stories')
      .update({
        title_en: titleEn,
        content_en: contentEn,
        "word-count-en": wordCountEn
      })
      .eq('id', story.id);
    
    if (error) {
      console.error(`${RED}Error updating story: ${error.message}${RESET}`);
    } else {
      console.log(`\n${GREEN}Changes saved successfully!${RESET}`);
    }
  } else {
    console.log('Changes discarded.');
  }
}

// Run the main function
main().catch(error => {
  console.error(`${RED}Unhandled error: ${error.message}${RESET}`);
  process.exit(1);
}); 