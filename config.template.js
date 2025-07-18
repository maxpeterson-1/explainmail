// Configuration template for ExplainMail extension
// Copy this file to config.js and add your actual API key

const config = {
  // OpenAI API Configuration
  openai: {
    apiKey: "YOUR_API_KEY_HERE", // Replace with your actual OpenAI API key
    model: "gpt-3.5-turbo",
    maxTokens: 300,
    temperature: 0.7,
    apiUrl: "https://api.openai.com/v1/chat/completions"
  }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = config;
} else {
  // For browser environment
  window.ExplainMailConfig = config;
} 