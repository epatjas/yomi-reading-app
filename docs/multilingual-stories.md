# Multilingual Stories in Yomi

This document explains how the multilingual story support works in Yomi, allowing stories to be presented in both Finnish and English based on the user's language preference.

## Overview

Yomi now supports stories in multiple languages. The implementation includes:

1. **Database Schema**: The stories table now has additional fields for English content and word count
2. **Language Selection**: Users can change their language in the profile settings
3. **Content Loading**: Stories are automatically loaded in the user's selected language
4. **Word Count**: Each language has its own word count, displayed appropriately
5. **Translation Tool**: A script is provided to help translate stories from Finnish to English

## Database Schema

The `stories` table has been extended with the following columns:

- `title_en`: The English title of the story
- `content_en`: The English content of the story
- `word-count-en`: The word count of the English content

The original `title`, `content`, and `word-count` fields now specifically store Finnish content.

## How It Works

1. The app stores the user's language preference with React i18next
2. When stories are loaded, the app checks the current language setting
3. If the language is 'en' (English), it uses English content and word count if available
4. If English content is not available or the language is 'fi' (Finnish), it falls back to Finnish content and word count

## Translation Process

We've included a command-line tool to help translate stories:

```bash
# Run the translation helper
node scripts/translate_stories.js
```

The tool allows you to:
- View stories that need translation
- Add English translations for each story
- Edit existing translations
- View already translated stories

When you add or edit an English translation, the tool automatically calculates and stores the word count for the English content.

## Implementation Details

### Services

- `storyService.ts`: Handles fetching stories in the appropriate language and word count
- `storyAdminService.ts`: Provides functions for updating multilingual content and calculating word counts

### Components

- `LanguageSwitcher`: A reusable component for switching between languages, located in the profile settings

## Adding New Stories

When adding new stories to the database, you can:
1. Add Finnish content to the standard `title` and `content` fields
2. Add English translations to `title_en` and `content_en` fields
3. Word counts will be automatically calculated for both languages

## Future Improvements

Potential future improvements could include:
- Support for additional languages beyond Finnish and English
- A web-based translation interface
- Automatic difficulty level adjustment based on word count
- Spellcheck and validation for translations

## Troubleshooting

If stories are not appearing in the correct language:
1. Check that the user's language is correctly set in profile settings
2. Verify that the story has content in the selected language
3. Check the database to ensure translations are properly saved

If word counts seem incorrect:
1. The word counting algorithm splits text by whitespace
2. You can manually update word counts in the database if needed 