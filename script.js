/* ============================================
   MedAI Healthcare Chatbot - JavaScript
   ============================================ */

// ============================================
// DOM Element References
// ============================================
const chatArea = document.getElementById('chatArea');
const userInput = document.getElementById('userInput');
let typingIndicator = null;

// ============================================
// State Management
// ============================================
let currentMode = 'simple'; // 'simple' or 'advanced'
let selectedFilters = {
    category: [],
    context: []
};

// ============================================
// Mock Bot Responses
// TODO: Replace this with actual API integration
// ============================================
const mockResponses = {
    'Cold & Cough': 'I understand you\'re experiencing cold and cough symptoms. Common causes include viral infections, allergies, or environmental irritants. Rest, stay hydrated, and consider over-the-counter remedies. If symptoms persist or worsen, please consult a healthcare provider.',
    'Fever': 'Fever is your body\'s natural response to infection. Monitor your temperature and stay hydrated. If your fever is above 103°F (39.4°C) or persists for more than 3 days, seek medical attention. Rest and over-the-counter fever reducers may help.',
    'Headache': 'Headaches can have various causes including stress, dehydration, or underlying conditions. Ensure you\'re well-hydrated and getting adequate rest. If headaches are severe, frequent, or accompanied by other symptoms, consult a healthcare professional.',
    'Body Pain': 'Body pain can result from overexertion, inflammation, or underlying medical conditions. Rest, gentle stretching, and over-the-counter pain relievers may help. If pain is severe or persistent, please see a healthcare provider.',
    'Stomach Pain': 'Stomach pain can be caused by various factors including indigestion, food sensitivities, or gastrointestinal issues. Monitor your symptoms and consider dietary changes. If pain is severe, persistent, or accompanied by other symptoms, seek medical care.',
    'Sore Throat': 'A sore throat is often caused by viral infections, allergies, or irritants. Gargling with warm salt water, staying hydrated, and using throat lozenges may provide relief. If symptoms persist or worsen, consult a healthcare provider.',
    'Fatigue': 'Fatigue can be caused by various factors including lack of sleep, stress, or underlying health conditions. Ensure adequate rest, maintain a balanced diet, and stay hydrated. If fatigue is persistent or severe, consult a healthcare professional.',
    'Nausea': 'Nausea can result from various causes including digestive issues, medications, or underlying conditions. Stay hydrated, eat small, bland meals, and avoid triggers. If nausea is severe or persistent, seek medical attention.',
    'Allergy': 'Allergies can cause various symptoms including sneezing, itching, or respiratory issues. Identify and avoid triggers when possible. Over-the-counter antihistamines may help. If symptoms are severe or persistent, consult an allergist or healthcare provider.',
    'Dizziness': 'Dizziness can be caused by dehydration, low blood pressure, inner ear issues, or other conditions. Ensure adequate hydration and avoid sudden movements. If dizziness is severe, persistent, or accompanied by other symptoms, seek medical care.',
    'I have symptoms': 'I\'m here to help. Please describe your symptoms in detail, including when they started, their severity, and any other relevant information. This will help me provide better guidance.',
    'About a medicine': 'I can provide general information about medications. Please share the name of the medicine you\'d like to know about, and I\'ll provide educational information. Remember, I cannot replace professional medical advice.',
    'Is this safe for me?': 'To assess safety, I\'d need to know about your medical history, current medications, and any allergies. Please share this information, and I can provide general guidance. However, always consult with a healthcare provider for personalized advice.'
};

// ============================================
// Utility Functions
// ============================================

/**
 * Escape HTML to prevent XSS attacks
 * @param {string} text - Text to escape
 * @returns {string} Escaped HTML string
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Smoothly scroll chat area to bottom
 */
function scrollToBottom() {
    setTimeout(() => {
        chatArea.scrollTo({
            top: chatArea.scrollHeight,
            behavior: 'smooth'
        });
    }, 100);
}

// ============================================
// Typing Indicator Functions
// ============================================

/**
 * Show animated typing indicator when bot is "thinking"
 */
function showTypingIndicator() {
    // Remove existing typing indicator if present
    if (typingIndicator) {
        typingIndicator.remove();
    }

    const typingDiv = document.createElement('div');
    typingDiv.className = 'mb-4 flex items-start gap-3 message-enter-left';
    typingDiv.id = 'typing-indicator';
    typingDiv.innerHTML = `
        <div class="w-8 h-8 bg-medai-primary rounded-full flex items-center justify-center flex-shrink-0">
            <span class="text-white font-bold text-sm">M</span>
        </div>
        <div class="flex-1">
            <div class="bg-gray-100 rounded-lg p-4 inline-block">
                <div class="flex items-center gap-1">
                    <span class="typing-dot"></span>
                    <span class="typing-dot"></span>
                    <span class="typing-dot"></span>
                </div>
            </div>
        </div>
    `;
    chatArea.appendChild(typingDiv);
    typingIndicator = typingDiv;
    scrollToBottom();
}

/**
 * Remove typing indicator with smooth fade-out
 */
function removeTypingIndicator() {
    if (typingIndicator) {
        typingIndicator.style.opacity = '0';
        typingIndicator.style.transition = 'opacity 0.2s ease-out';
        setTimeout(() => {
            if (typingIndicator && typingIndicator.parentNode) {
                typingIndicator.remove();
            }
            typingIndicator = null;
        }, 200);
    }
}

// ============================================
// Message Display Functions
// ============================================

/**
 * Add user message to chat with entrance animation
 * @param {string} message - User message text
 */
function addUserMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'mb-4 flex justify-end message-enter-right';
    messageDiv.innerHTML = `
        <div class="max-w-2xl">
            <div class="bg-medai-primary text-white rounded-lg p-4 inline-block">
                <p class="leading-relaxed">${escapeHtml(message)}</p>
            </div>
        </div>
    `;
    chatArea.appendChild(messageDiv);
    scrollToBottom();
}

/**
 * Add bot message with typewriter effect
 * @param {string} message - Bot message text
 */
function addBotMessage(message) {
    // Remove typing indicator first
    removeTypingIndicator();

    // Create message container
    const messageDiv = document.createElement('div');
    messageDiv.className = 'mb-4 flex items-start gap-4 message-enter-left';
    messageDiv.innerHTML = `
        <div class="w-8 h-8 bg-medai-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
            <span class="text-white font-bold text-sm">M</span>
        </div>
        <div class="flex-1">
            <div class="bg-gray-100 rounded-lg p-4 inline-block max-w-2xl">
                <p class="text-gray-800 leading-relaxed" id="bot-message-text"></p>
            </div>
        </div>
    `;
    chatArea.appendChild(messageDiv);
    scrollToBottom();

    // Typewriter effect - natural reading speed
    const textElement = messageDiv.querySelector('#bot-message-text');
    const fullText = escapeHtml(message);
    let currentIndex = 0;
    const typingSpeed = 15; // milliseconds per character (adjustable for natural feel)

    function typeNextCharacter() {
        if (currentIndex < fullText.length) {
            textElement.textContent = fullText.substring(0, currentIndex + 1);
            currentIndex++;
            scrollToBottom();
            setTimeout(typeNextCharacter, typingSpeed);
        }
    }

    // Start typing effect
    typeNextCharacter();
}

// ============================================
// Mode Toggle Functions
// ============================================

/**
 * Switch between Simple and Advanced Mode
 * @param {string} mode - 'simple' or 'advanced'
 */
function switchMode(mode) {
    currentMode = mode;
    const simpleBtn = document.getElementById('simpleModeBtn');
    const advancedBtn = document.getElementById('advancedModeBtn');
    const filtersSection = document.getElementById('advancedFilters');

    if (mode === 'simple') {
        simpleBtn.classList.add('active');
        advancedBtn.classList.remove('active');
        filtersSection.classList.remove('visible');
    } else {
        simpleBtn.classList.remove('active');
        advancedBtn.classList.add('active');
        filtersSection.classList.add('visible');
    }
}

// ============================================
// Filter Management Functions
// ============================================

/**
 * Toggle filter chip selection
 * @param {string} filterType - 'category' or 'context'
 * @param {string} value - Filter value to toggle
 */
function toggleFilter(filterType, value) {
    const button = event.target;
    const isSelected = button.classList.contains('selected');

    if (isSelected) {
        // Remove filter
        button.classList.remove('selected');
        const index = selectedFilters[filterType].indexOf(value);
        if (index > -1) {
            selectedFilters[filterType].splice(index, 1);
        }
    } else {
        // Add filter
        button.classList.add('selected');
        if (!selectedFilters[filterType].includes(value)) {
            selectedFilters[filterType].push(value);
        }
    }
}

/**
 * Build structured query from user input and selected filters
 * This structured query will later be sent to the AI agent (e.g., IBM Watsonx Orchestrate)
 * @param {string} userMessage - User's message text
 * @returns {Object} Structured query object and query string
 */
function buildStructuredQuery(userMessage) {
    const medicineBrand = document.getElementById('medicineBrand').value.trim();
    
    // Build structured query object
    const structuredQuery = {
        userMessage: userMessage,
        mode: currentMode,
        filters: {
            medicineBrand: medicineBrand || null,
            drugCategory: selectedFilters.category.length > 0 ? selectedFilters.category : null,
            context: selectedFilters.context.length > 0 ? selectedFilters.context : null
        }
    };

    // Convert to query string format for future API integration
    // Example format: "userMessage=I have fever&mode=advanced&medicineBrand=Tylenol&category=Pain Relief&context=Adult"
    let queryString = `userMessage=${encodeURIComponent(userMessage)}&mode=${currentMode}`;
    
    if (medicineBrand) {
        queryString += `&medicineBrand=${encodeURIComponent(medicineBrand)}`;
    }
    
    if (selectedFilters.category.length > 0) {
        queryString += `&category=${encodeURIComponent(selectedFilters.category.join(','))}`;
    }
    
    if (selectedFilters.context.length > 0) {
        queryString += `&context=${encodeURIComponent(selectedFilters.context.join(','))}`;
    }

    // TODO: This structured query will be sent to the AI agent backend
    // Example API integration:
    // const response = await fetch('/api/chat', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(structuredQuery)
    // });

    return {
        structured: structuredQuery,
        queryString: queryString
    };
}

// ============================================
// Bot Response Functions
// ============================================

/**
 * Get bot response based on user message
 * TODO: Replace with actual API call to IBM Watsonx Orchestrate
 * @param {string} userMessage - User's message
 * @param {Object} structuredQuery - Optional structured query object
 * @returns {string} Bot response text
 */
function getBotResponse(userMessage, structuredQuery = null) {
    // Check for exact matches first
    if (mockResponses[userMessage]) {
        return mockResponses[userMessage];
    }

    // Check for partial matches
    const lowerMessage = userMessage.toLowerCase();
    for (const [key, value] of Object.entries(mockResponses)) {
        if (lowerMessage.includes(key.toLowerCase())) {
            return value;
        }
    }

    // Default response
    return 'Thank you for your message. I understand you\'re seeking medical information. For personalized advice, please consult with a licensed healthcare professional. I can provide general educational information about symptoms and medications.';
}

// ============================================
// Message Sending Functions
// ============================================

/**
 * Send user message and get bot response
 */
function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    // Build structured query from user input and filters
    const queryData = buildStructuredQuery(message);
    
    // Display user message (show filters in advanced mode if any are selected)
    let displayMessage = message;
    if (currentMode === 'advanced') {
        const filters = [];
        if (queryData.structured.filters.medicineBrand) {
            filters.push(`Brand: ${queryData.structured.filters.medicineBrand}`);
        }
        if (queryData.structured.filters.drugCategory) {
            filters.push(`Category: ${queryData.structured.filters.drugCategory.join(', ')}`);
        }
        if (queryData.structured.filters.context) {
            filters.push(`Context: ${queryData.structured.filters.context.join(', ')}`);
        }
        if (filters.length > 0) {
            displayMessage += ` [${filters.join(' | ')}]`;
        }
    }

    addUserMessage(displayMessage);
    userInput.value = '';

    // Show typing indicator immediately
    setTimeout(() => {
        showTypingIndicator();
    }, 300);

    // Simulate bot thinking delay, then show response
    setTimeout(() => {
        // TODO: Replace this with actual API integration
        // The structured query (queryData.structured) will be sent to IBM Watsonx Orchestrate
        // Example: 
        // const response = await fetch('/api/chat', { 
        //     method: 'POST', 
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(queryData.structured) 
        // });
        // const data = await response.json();
        // addBotMessage(data.response);
        
        // For now, use the original message for mock responses
        // In production, the backend will use the structured query
        const botResponse = getBotResponse(message, queryData.structured);
        addBotMessage(botResponse);
    }, 800 + Math.random() * 400); // Random delay between 800-1200ms for natural feel
}

/**
 * Handle problem button clicks from Common Problems panel
 * @param {string} problem - Problem name
 */
function sendProblemMessage(problem) {
    const message = `I'm experiencing ${problem.toLowerCase()}. Can you help?`;
    addUserMessage(message);
    
    setTimeout(() => {
        showTypingIndicator();
    }, 300);
    
    setTimeout(() => {
        const botResponse = getBotResponse(problem);
        addBotMessage(botResponse);
    }, 800 + Math.random() * 400);
}

/**
 * Handle quick query CTA chip clicks
 * @param {string} query - Quick query text
 */
function sendQuickQuery(query) {
    addUserMessage(query);
    
    setTimeout(() => {
        showTypingIndicator();
    }, 300);
    
    setTimeout(() => {
        const botResponse = getBotResponse(query);
        addBotMessage(botResponse);
    }, 800 + Math.random() * 400);
}

/**
 * Handle Enter key press in input field
 * @param {Event} event - Keyboard event
 */
function handleKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}
