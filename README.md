# YouTube Video Summarizer

A Chrome extension that uses AI to generate concise summaries of YouTube videos, including key points, important characters, and notable quotes.

## Features

- **Instant Summaries**: Get AI-powered summaries of any YouTube video with a single click
- **Rich Insights**: View key points, characters, quotes, and thematic elements
- **User-Friendly**: Seamlessly integrates with the YouTube player interface

## Recent Fixes and Improvements

The latest update includes several important fixes and enhancements:

### 1. Improved Transcript Extraction
- Added multiple methods to extract video transcripts
- Better handling when captions/transcripts are not available
- Automatic fallback to title/description if transcript cannot be found

### 2. Enhanced Button Placement
- Fixed issue where our button replaced existing YouTube controls
- Now adds button without affecting YouTube's interface
- Prevents duplicate buttons when navigating between videos

### 3. Better Error Handling
- Detailed error messages when API calls fail
- Proper handling of 500 errors from the server
- Fallback content when summary cannot be generated

### 4. Performance Improvements
- Added background service worker for better API communication
- Improved handling of YouTube's single-page application behavior
- Added usage statistics to track successful summaries

## How to Use

1. **Install the Extension**: Load the extension in Chrome
2. **Go to YouTube**: Navigate to any YouTube video
3. **Find the Button**: Look for the "📝 Summarize" button in the video player controls
4. **Get Your Summary**: Click the button to generate and view the AI summary

## Technical Details

The extension works by:
1. Extracting the video transcript using multiple methods
2. Sending the transcript, title, and metadata to our AI summarization service
3. Parsing and displaying the summary in a user-friendly modal

## Development

### Requirements
- Chrome browser
- Basic knowledge of HTML, CSS, and JavaScript

### Installation for Development
1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the extension directory

### Files
- `manifest.json`: Extension configuration
- `content.js`: Injected into YouTube to add summarization features
- `service-worker.js`: Background worker for API communication
- `popup.html/js`: Extension popup interface
- `styles.css`: Styling for the injected UI elements

## Feedback and Contributions

Feedback and contributions are welcome! Please feel free to submit issues or pull requests.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

If you encounter any issues or have suggestions, please open an issue in the GitHub repository.

## Credits

- Google for providing the Gemini API
- YouTube for the platform integration
- The open-source community for various tools and libraries

## Branding

- Name: YouTube Video Summarizer
- Mission: To help users save time and learn more efficiently by providing AI-powered video summaries
- Brand Colors: 
  - Primary: #1a73e8 (Google Blue)
  - Secondary: #137333 (Success Green)
  - Error: #c5221f (Error Red) 