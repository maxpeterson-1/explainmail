// Content script for ExplainMail Chrome Extension
// Integrates with Gmail DOM and manages popup UI

class ExplainMail {
  constructor() {
    this.popup = null;
    this.isProcessing = false;
    console.log('ExplainMail: Content script initialized');
    this.init();
  }

  init() {
    console.log('ExplainMail: Setting up message listeners');
    
    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      console.log('ExplainMail: Content script received message', { request, sender });
      
      if (request.action === "explainText") {
        console.log('ExplainMail: Processing explainText action', { textLength: request.text.length });
        this.processText(request.text);
      } else if (request.action === "getSelectedText") {
        console.log('ExplainMail: Processing getSelectedText action');
        this.handleKeyboardShortcut();
      } else if (request.action === "ping") {
        console.log('ExplainMail: Responding to ping');
        sendResponse({ status: "ok" });
      } else {
        console.log('ExplainMail: Unknown action in content script', request.action);
      }
    });

    // Add click listener to close popup when clicking outside
    document.addEventListener('click', (e) => {
      if (this.popup && !this.popup.contains(e.target)) {
        this.closePopup();
      }
    });
  }

  handleKeyboardShortcut() {
    const selectedText = window.getSelection().toString().trim();
    if (selectedText) {
      this.processText(selectedText);
    } else {
      // If no text selected, try to get the current email content
      const emailContent = this.getCurrentEmailContent();
      if (emailContent) {
        this.processText(emailContent);
      }
    }
  }

  getCurrentEmailContent() {
    // Try to find the current email content in Gmail
    const selectors = [
      '.adn .a3s', // Gmail message body
      '.ii.gt .a3s', // Alternative message body selector
      '[data-legacy-message-id] .a3s', // Message with ID
      '.h7 .a3s' // Another possible selector
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        return element.textContent.trim();
      }
    }
    return null;
  }

  getMessageId() {
    // Try to get the Gmail message ID
    const messageElement = document.querySelector('[data-legacy-message-id]');
    if (messageElement) {
      return messageElement.getAttribute('data-legacy-message-id');
    }

    // Fallback: generate a unique ID based on content and timestamp
    const content = this.getCurrentEmailContent() || '';
    return `msg_${Date.now()}_${content.substring(0, 20).replace(/\s+/g, '_')}`;
  }

  async processText(text) {
    console.log('ExplainMail: processText called', { textLength: text.length, textPreview: text.substring(0, 50) });
    
    if (this.isProcessing) {
      console.log('ExplainMail: Already processing, skipping');
      return;
    }

    const messageId = this.getMessageId();
    console.log('ExplainMail: Generated message ID', messageId);
    
    // Show loading popup
    this.showLoadingPopup();

    try {
      console.log('ExplainMail: Sending processWithAI message to background script');
      
      // Send request to background script for AI processing
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
          action: "processWithAI",
          text: text,
          messageId: messageId
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.error('ExplainMail: Runtime error in sendMessage', chrome.runtime.lastError);
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            console.log('ExplainMail: Received response from background script', response);
            resolve(response);
          }
        });
      });

      if (response.success) {
        this.showResultPopup(response.data, messageId);
      } else {
        this.showErrorPopup(response.error);
      }
    } catch (error) {
      console.error('ExplainMail error:', error);
      this.showErrorPopup('Failed to process text. Please try again.');
    }
  }

  showLoadingPopup() {
    this.closePopup();
    this.isProcessing = true;

    this.popup = document.createElement('div');
    this.popup.className = 'explainmail-popup explainmail-loading';
    this.popup.innerHTML = `
      <div class="explainmail-header">
        <div class="explainmail-title-section">
          <img src="${chrome.runtime.getURL('icons/icon32.png')}" alt="ExplainMail" class="explainmail-title-icon">
          <h3>ExplainMail Summary</h3>
        </div>
        <button class="explainmail-close">×</button>
      </div>
      <div class="explainmail-content">
        <div class="explainmail-spinner"></div>
        <p>Processing with AI...</p>
      </div>
    `;

    this.positionPopup();
    document.body.appendChild(this.popup);

    // Add close button listener
    this.popup.querySelector('.explainmail-close').addEventListener('click', () => {
      this.closePopup();
    });
  }

  showResultPopup(data, messageId) {
    this.closePopup();
    this.isProcessing = false;

    this.popup = document.createElement('div');
    this.popup.className = 'explainmail-popup';
    this.popup.innerHTML = `
      <div class="explainmail-header">
        <div class="explainmail-title-section">
          <img src="${chrome.runtime.getURL('icons/icon32.png')}" alt="ExplainMail" class="explainmail-title-icon">
          <h3>ExplainMail Summary</h3>
        </div>
        <button class="explainmail-close">×</button>
      </div>
      <div class="explainmail-content">
        <div class="explainmail-section">
          <h4>Essence:</h4>
          <p>${this.escapeHtml(data.essence)}</p>
        </div>
        <div class="explainmail-section">
          <h4>Task:</h4>
          <p>${this.escapeHtml(data.task)}</p>
        </div>
        <button class="explainmail-rephrase" data-message-id="${messageId}">
          Rephrase
        </button>
      </div>
    `;

    this.positionPopup();
    document.body.appendChild(this.popup);

    // Add event listeners
    this.popup.querySelector('.explainmail-close').addEventListener('click', () => {
      this.closePopup();
    });

    this.popup.querySelector('.explainmail-rephrase').addEventListener('click', (e) => {
      const msgId = e.target.getAttribute('data-message-id');
      this.rephraseMessage(msgId);
    });
  }

  showErrorPopup(error) {
    this.closePopup();
    this.isProcessing = false;

    this.popup = document.createElement('div');
    this.popup.className = 'explainmail-popup explainmail-error';
    this.popup.innerHTML = `
      <div class="explainmail-header">
        <div class="explainmail-title-section">
          <img src="${chrome.runtime.getURL('icons/icon32.png')}" alt="ExplainMail" class="explainmail-title-icon">
          <h3>ExplainMail Summary</h3>
        </div>
        <button class="explainmail-close">×</button>
      </div>
      <div class="explainmail-content">
        <p class="explainmail-error-message">Oops! Something went wrong.</p>
        <p>${this.escapeHtml(error)}</p>
        <p>Please try again later.</p>
      </div>
    `;

    this.positionPopup();
    document.body.appendChild(this.popup);

    // Add close button listener
    this.popup.querySelector('.explainmail-close').addEventListener('click', () => {
      this.closePopup();
    });
  }

  async rephraseMessage(messageId) {
    // Remove the stored result to force regeneration
    await chrome.storage.local.remove([messageId]);
    
    // Get the current email content and reprocess
    const emailContent = this.getCurrentEmailContent();
    if (emailContent) {
      this.processText(emailContent);
    }
  }

  positionPopup() {
    if (!this.popup) return;

    // Position popup at 2/3 from the top and centered horizontally
    const popupRect = this.popup.getBoundingClientRect();
    
    // Calculate position: centered horizontally, 2/3 from top
    let position = {
      x: (window.innerWidth - popupRect.width) / 2,
      y: (window.innerHeight * 2/3) - (popupRect.height / 2)
    };

    // Ensure popup stays within viewport with margins
    const margin = 20;
    const maxX = window.innerWidth - popupRect.width - margin;
    const maxY = window.innerHeight - popupRect.height - margin;

    position.x = Math.max(margin, Math.min(position.x, maxX));
    position.y = Math.max(margin, Math.min(position.y, maxY));

    this.popup.style.left = `${position.x}px`;
    this.popup.style.top = `${position.y}px`;
  }

  closePopup() {
    if (this.popup) {
      this.popup.remove();
      this.popup = null;
    }
    this.isProcessing = false;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize ExplainMail when DOM is ready
console.log('ExplainMail: Content script loaded, readyState:', document.readyState);

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('ExplainMail: DOM loaded, initializing');
    new ExplainMail();
  });
} else {
  console.log('ExplainMail: DOM already ready, initializing immediately');
  new ExplainMail();
} 