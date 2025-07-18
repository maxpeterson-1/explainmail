# 🧠 ExplainMail - AI Email Summary & Clarifier

A Chrome extension that simplifies and clarifies email content using AI. Get instant summaries and task breakdowns for Gmail messages.

## ✨ Features

- **AI-Powered Summaries**: Get concise "Essence" and "Task" breakdowns of email content
- **Multiple Activation Methods**: 
  - Right-click context menu on selected text
  - Keyboard shortcut (Alt+Shift+E)
  - Automatic email content detection
- **Smart Caching**: Results are stored locally to avoid repeated API calls
- **Dark Theme UI**: Modern, sleek popup interface
- **Rephrase Function**: Generate alternative summaries with one click
- **Gmail Integration**: Seamlessly works with Gmail web interface

## 🚀 Installation

### Prerequisites
- Google Chrome browser
- OpenAI API key

### Setup Steps

1. **Clone or Download** this repository to your local machine

2. **Get OpenAI API Key**:
   - Visit [OpenAI Platform](https://platform.openai.com/api-keys)
   - Create a new API key
   - Copy the key for the next step

3. **Configure API Key**:
   - Copy `config.template.js` to `config.js`
   - Open `config.js` and replace `"YOUR_API_KEY_HERE"` with your actual OpenAI API key
   - Save the file
   - **Important**: The `config.js` file is ignored by git to protect your API key

4. **Load Extension in Chrome**:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the ExplainMail folder

5. **Add Icons** (Optional):
   - Create icon files in the `icons/` folder:
     - `icon16.png` (16x16 pixels)
     - `icon32.png` (32x32 pixels)
     - `icon48.png` (48x48 pixels)
     - `icon128.png` (128x128 pixels)
   - Or use placeholder icons for now

## 📖 Usage

### Method 1: Context Menu
1. Open Gmail in Chrome
2. Select text in any email
3. Right-click and choose "🧠 Explain with AI"
4. Wait for the AI summary to appear

### Method 2: Keyboard Shortcut
1. Open Gmail in Chrome
2. Select text in an email (or leave unselected to process entire email)
3. Press `Alt+Shift+E`
4. View the AI summary popup

### Understanding the Results

The extension provides two key insights:

- **Essence**: A brief summary of what the email is about
- **Task**: What action needs to be taken or what the recipient should do

### Rephrasing
- Click the "↻ Rephrase" button to generate an alternative summary
- Useful for getting different perspectives on the same content

## 🛠️ Technical Details

### Architecture
- **Manifest V3**: Modern Chrome extension architecture
- **Content Script**: Integrates with Gmail DOM
- **Background Script**: Handles API calls and storage
- **Popup UI**: Dark-themed, responsive interface

### Storage
- Uses `chrome.storage.local` for caching results
- Results are stored by Gmail message ID
- Prevents duplicate API calls for the same content

### AI Integration
- Uses OpenAI GPT-3.5-turbo model
- Structured prompt for consistent "Essence" and "Task" output
- Error handling for API failures

## 🔧 Customization

### Changing Keyboard Shortcut
1. Go to `chrome://extensions/shortcuts`
2. Find "ExplainMail"
3. Set your preferred keyboard shortcut

### Modifying AI Prompt
Edit the prompt in `background.js` to change how the AI processes emails:

```javascript
const prompt = `Your custom prompt here...`;
```

### UI Customization
Modify `popup.css` to change colors, fonts, or layout.

## 🐛 Troubleshooting

### Extension Not Working
1. Check that you're on `https://mail.google.com/*`
2. Verify your OpenAI API key is correct
3. Check Chrome's developer console for errors
4. Ensure the extension is enabled

### API Errors
- Verify your OpenAI API key is valid
- Check your OpenAI account has sufficient credits
- Ensure you're not hitting rate limits

### Popup Not Appearing
- Check if text is selected
- Try refreshing the Gmail page
- Verify the extension has necessary permissions

## 📝 Development

### File Structure
```
ExplainMail/
├── manifest.json          # Extension configuration
├── background.js          # Service worker & API handling
├── content.js            # Gmail DOM integration
├── popup.css             # UI styles
├── icons/                # Extension icons
└── README.md             # This file
```

### Adding Features
- **New AI Models**: Modify the API call in `background.js`
- **Additional UI Elements**: Update `content.js` and `popup.css`
- **Storage Options**: Extend `chrome.storage` usage
- **Multi-language Support**: Add language detection and prompts

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly in Gmail
5. Submit a pull request

## 📄 License

This project is open source. Feel free to modify and distribute.

## ⚠️ Important Notes

- **API Costs**: Using OpenAI API incurs costs. Monitor your usage.
- **Privacy**: Email content is sent to OpenAI for processing. Review their privacy policy.
- **Gmail Changes**: Gmail's DOM structure may change, requiring updates to selectors.
- **Rate Limits**: Be mindful of OpenAI's rate limits for API calls.

## 🆘 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review Chrome's developer console for errors
3. Verify your OpenAI API key and account status
4. Test with a simple email first

---

**Happy email summarizing! 🧠📧** 