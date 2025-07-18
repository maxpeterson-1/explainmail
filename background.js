// Background script for ExplainMail Chrome Extension
// Handles context menus and keyboard shortcuts

console.log('ExplainMail: Background script loaded');

// Create context menu on extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('ExplainMail: Extension installed, creating context menu');
  
  // Remove existing context menu if it exists
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "explainMail",
      title: "Explain with AI",
      contexts: ["selection"],
      documentUrlPatterns: ["https://mail.google.com/*"]
    }, () => {
      if (chrome.runtime.lastError) {
        console.error('ExplainMail: Context menu creation failed:', chrome.runtime.lastError);
      } else {
        console.log('ExplainMail: Context menu created successfully');
      }
    });
  });
  
  // Test content script injection on existing Gmail tabs
  chrome.tabs.query({ url: "https://mail.google.com/*" }, (tabs) => {
    console.log('ExplainMail: Found Gmail tabs:', tabs.length);
    tabs.forEach(tab => {
      console.log('ExplainMail: Testing content script on tab:', tab.id, tab.url);
      chrome.tabs.sendMessage(tab.id, { action: "ping" }, (response) => {
        if (chrome.runtime.lastError) {
          console.log('ExplainMail: Content script not responding on tab', tab.id);
        } else {
          console.log('ExplainMail: Content script responding on tab', tab.id);
        }
      });
    });
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  console.log('ExplainMail: Context menu clicked', { info, tab });
  
  if (info.menuItemId === "explainMail" && info.selectionText) {
    console.log('ExplainMail: Sending message to content script', { 
      tabId: tab.id, 
      textLength: info.selectionText.length,
      textPreview: info.selectionText.substring(0, 50) + '...'
    });
    
    // Send message to content script to process the selected text
    chrome.tabs.sendMessage(tab.id, {
      action: "explainText",
      text: info.selectionText
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('ExplainMail: Failed to send message to content script:', chrome.runtime.lastError);
        console.error('ExplainMail: Error details:', {
          error: chrome.runtime.lastError.message,
          tabId: tab.id,
          tabUrl: tab.url,
          tabActive: tab.active
        });
        
        // Try to inject the content script manually if the message fails
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        }).then(() => {
          console.log('ExplainMail: Content script injected manually, retrying message');
          // Retry sending the message after injection
          setTimeout(() => {
            chrome.tabs.sendMessage(tab.id, {
              action: "explainText",
              text: info.selectionText
            }, (retryResponse) => {
              if (chrome.runtime.lastError) {
                console.error('ExplainMail: Retry also failed:', chrome.runtime.lastError);
              } else {
                console.log('ExplainMail: Retry successful');
              }
            });
          }, 100);
        }).catch((injectError) => {
          console.error('ExplainMail: Failed to inject content script:', injectError);
        });
      } else {
        console.log('ExplainMail: Message sent successfully to content script');
      }
    });
  } else {
    console.log('ExplainMail: Context menu clicked but conditions not met', {
      menuItemId: info.menuItemId,
      hasSelectionText: !!info.selectionText
    });
  }
});

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener((command, tab) => {
  if (command === "_execute_action") {
    // Send message to content script to get selected text and process it
    chrome.tabs.sendMessage(tab.id, {
      action: "getSelectedText"
    });
  }
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('ExplainMail: Received message from content script', { request, sender });
  
  if (request.action === "processWithAI") {
    console.log('ExplainMail: Processing with AI', { 
      textLength: request.text.length,
      messageId: request.messageId 
    });
    
    processWithAI(request.text, request.messageId)
      .then(result => {
        console.log('ExplainMail: AI processing successful', result);
        sendResponse({ success: true, data: result });
      })
      .catch(error => {
        console.error('ExplainMail: AI processing failed', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep the message channel open for async response
  }
  
  console.log('ExplainMail: Unknown action received', request.action);
});

// AI processing function
async function processWithAI(text, messageId) {
  try {
    // Check if we already have a summary for this message
    const storage = await chrome.storage.local.get([messageId]);
    if (storage[messageId]) {
      return storage[messageId];
    }

    // Get configuration - replace with your actual API key
    const config = {
      apiKey: "YOUR_API_KEY", // Replace with your actual OpenAI API key from config.js
      model: "gpt-3.5-turbo",
      maxTokens: 300,
      temperature: 0.7,
      apiUrl: "https://api.openai.com/v1/chat/completions"
    };

    // Check if API key is configured
    if (config.apiKey === "YOUR_API_KEY") {
      throw new Error("Please configure your OpenAI API key in config.js");
    }

    const prompt = `Summarize the following email message in simple English. Split your response into exactly 2 parts:

1. Essence: A brief summary of what the message is about
2. Task: What action needs to be taken or what the recipient should do

Email content:
${text}

Please respond in this exact format:
Essence: [your essence here]
Task: [your task here]`;

    const response = await fetch(config.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: config.maxTokens,
        temperature: config.temperature
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Parse the AI response to extract essence and task
    const essenceMatch = aiResponse.match(/Essence:\s*(.+?)(?=\n|$)/i);
    const taskMatch = aiResponse.match(/Task:\s*(.+?)(?=\n|$)/i);

    const result = {
      date: Date.now(),
      essence: essenceMatch ? essenceMatch[1].trim() : "Unable to extract essence",
      task: taskMatch ? taskMatch[1].trim() : "Unable to extract task"
    };

    // Store the result
    await chrome.storage.local.set({ [messageId]: result });

    return result;
  } catch (error) {
    console.error("AI processing error:", error);
    throw new Error("Failed to process with AI. Please check your API key and try again.");
  }
} 