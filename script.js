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
let selectedCountry = 'Global'; // Default country context
let selectedFilters = {
    category: [],
    context: []
};

// Profile and Patient History State (Session-only, not persisted)
// Age and sex are used only to tailor educational safety information
// This context is advisory and non-prescriptive
let profileData = {
    age: null, // Exact age (number)
    sex: '', // 'Male' or 'Female'
    country: 'Global'
};

let patientHistory = {
    allergies: [],
    chronicConditions: [],
    pregnancyStatus: false
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
 * Update country context for region-aware responses
 * @param {string} country - Selected country name
 */
function updateCountryContext(country) {
    selectedCountry = country;
    // Sync with profile country display if profile panel is open
    updateProfileCountryDisplay();
}

/**
 * Build structured query from user input and selected filters
 * This structured query will later be sent to the AI agent (e.g., IBM Watsonx Orchestrate)
 * @param {string} userMessage - User's message text
 * @returns {Object} Structured query object and query string
 */
function buildStructuredQuery(userMessage) {
    const medicineBrand = document.getElementById('medicineBrand').value.trim();
    
    // Add country context to user message internally (for AI agent processing)
    // This helps tailor responses to region-specific medical information
    let contextualMessage = userMessage;
    if (selectedCountry && selectedCountry !== 'Global') {
        contextualMessage = `Provide educational medical information based on medicines commonly used in ${selectedCountry}. ${userMessage}`;
    }
    
    // Add user profile context (age and sex) for educational safety guidance
    // This context is advisory and non-prescriptive - used only to tailor general safety language
    let profileContext = '';
    const hasProfileContext = (profileData.age !== null && profileData.age > 0) || profileData.sex;
    
    if (hasProfileContext) {
        const profileParts = [];
        if (profileData.age !== null && profileData.age > 0) {
            profileParts.push(`age: ${profileData.age}`);
        }
        if (profileData.sex) {
            profileParts.push(`sex: ${profileData.sex}`);
        }
        
        if (profileParts.length > 0) {
            // Use this context only to tailor educational safety information
            // Do NOT imply diagnosis, prescription, or guaranteed safety
            profileContext = `User has reported ${profileParts.join(', ')}. Use this only to tailor educational safety information. `;
            contextualMessage = profileContext + contextualMessage;
        }
    }
    
    // Add medical context from patient history (if available)
    // This context will be prepended to help AI avoid mentioning conflicting medicines
    let medicalContext = '';
    const hasMedicalContext = patientHistory.allergies.length > 0 || 
                              patientHistory.chronicConditions.length > 0 || 
                              patientHistory.pregnancyStatus;
    
    if (hasMedicalContext) {
        const contextParts = [];
        if (patientHistory.allergies.length > 0) {
            contextParts.push(`Known allergies: ${patientHistory.allergies.join(', ')}`);
        }
        if (patientHistory.chronicConditions.length > 0 && !patientHistory.chronicConditions.includes('None')) {
            contextParts.push(`Chronic conditions: ${patientHistory.chronicConditions.join(', ')}`);
        }
        if (patientHistory.pregnancyStatus) {
            contextParts.push('Pregnancy status: Yes');
        }
        
        if (contextParts.length > 0) {
            medicalContext = `The user has reported the following medical context: ${contextParts.join('; ')}. Provide educational information and avoid mentioning medicines that may conflict. `;
            contextualMessage = medicalContext + contextualMessage;
        }
    }
    
    // Build structured query object
    const structuredQuery = {
        userMessage: userMessage,
        contextualMessage: contextualMessage, // Internal message with country and medical context
        mode: currentMode,
        country: selectedCountry,
        profile: {
            age: profileData.age || null,
            sex: profileData.sex || null,
            country: profileData.country || selectedCountry
        },
        patientHistory: hasMedicalContext ? {
            allergies: patientHistory.allergies.length > 0 ? patientHistory.allergies : null,
            chronicConditions: patientHistory.chronicConditions.length > 0 && !patientHistory.chronicConditions.includes('None') ? patientHistory.chronicConditions : null,
            pregnancyStatus: patientHistory.pregnancyStatus || null
        } : null,
        filters: {
            medicineBrand: medicineBrand || null,
            drugCategory: selectedFilters.category.length > 0 ? selectedFilters.category : null,
            context: selectedFilters.context.length > 0 ? selectedFilters.context : null
        }
    };

    // Convert to query string format for future API integration
    // Example format: "userMessage=I have fever&mode=advanced&country=India&medicineBrand=Tylenol&category=Pain Relief&context=Adult"
    let queryString = `userMessage=${encodeURIComponent(userMessage)}&mode=${currentMode}&country=${encodeURIComponent(selectedCountry)}`;
    
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
    // The contextualMessage field contains the user message with country-specific context
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
    
    // Display user message (show filters and country in advanced mode if any are selected)
    let displayMessage = message;
    if (currentMode === 'advanced') {
        const filters = [];
        if (selectedCountry && selectedCountry !== 'Global') {
            filters.push(`Country: ${selectedCountry}`);
        }
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

// ============================================
// About Us Panel Functions
// Informational panel about MedAI's purpose and features
// ============================================

/**
 * Open the About Us panel
 */
function openAboutUs() {
    const panel = document.getElementById('aboutUsPanel');
    panel.classList.remove('is-hidden');
    panel.classList.add('is-visible');
    // Prevent body scroll when panel is open
    document.body.style.overflow = 'hidden';
}

/**
 * Close the About Us panel
 */
function closeAboutUs() {
    const panel = document.getElementById('aboutUsPanel');
    panel.classList.remove('is-visible');
    panel.classList.add('is-hidden');
    // Restore body scroll
    document.body.style.overflow = '';
}

// ============================================
// Medicine Equivalents Finder Functions
// Educational reference tool for cross-country medicine comparison
// ============================================

/**
 * Open the Medicine Equivalents panel
 */
function openMedicineEquivalents() {
    const panel = document.getElementById('equivalentsPanel');
    panel.classList.remove('is-hidden');
    panel.classList.add('is-visible');
    // Prevent body scroll when panel is open
    document.body.style.overflow = 'hidden';
}

/**
 * Close the Medicine Equivalents panel
 */
function closeMedicineEquivalents() {
    const panel = document.getElementById('equivalentsPanel');
    panel.classList.remove('is-visible');
    panel.classList.add('is-hidden');
    // Restore body scroll
    document.body.style.overflow = '';
}

/**
 * Find medicine equivalent based on selected countries and medicine name
 * Builds structured query for future IBM Watsonx Orchestrate integration
 */
function findMedicineEquivalent() {
    const fromCountry = document.getElementById('fromCountry').value;
    const toCountry = document.getElementById('toCountry').value;
    const medicineName = document.getElementById('medicineName').value.trim();
    const resultArea = document.getElementById('equivalentsResult');

    // Validate input
    if (!medicineName) {
        resultArea.innerHTML = '<p class="text-red-600 text-sm">Please enter a medicine name.</p>';
        resultArea.classList.add('has-content');
        return;
    }

    // Build structured query for AI agent
    // This will later be sent to IBM Watsonx Orchestrate
    const structuredQuery = {
        type: 'medicine_equivalent',
        fromCountry: fromCountry,
        toCountry: toCountry,
        medicineName: medicineName,
        query: `Provide educational information about medicines commonly used in ${toCountry} that have the same active ingredient or therapeutic purpose as ${medicineName} commonly used in ${fromCountry}.`
    };

    // Show loading state
    resultArea.innerHTML = '<p class="text-gray-500 text-sm">Searching for educational reference information...</p>';
    resultArea.classList.add('loading');
    resultArea.classList.remove('has-content');

    // Simulate API call delay
    setTimeout(() => {
        // TODO: Replace this with actual API integration
        // Example API integration:
        // const response = await fetch('/api/medicine-equivalent', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(structuredQuery)
        // });
        // const data = await response.json();
        // displayEquivalentResult(data.response);

        // Mock response for demonstration
        const mockResponse = generateMockEquivalentResponse(fromCountry, toCountry, medicineName);
        displayEquivalentResult(mockResponse);
    }, 1000 + Math.random() * 500);
}

/**
 * Display the equivalent result in the result area
 * @param {string} response - Response text to display
 */
function displayEquivalentResult(response) {
    const resultArea = document.getElementById('equivalentsResult');
    resultArea.innerHTML = `<div class="text-gray-800">${escapeHtml(response)}</div>`;
    resultArea.classList.remove('loading');
    resultArea.classList.add('has-content');
}

/**
 * Generate mock response for medicine equivalent
 * In production, this will come from IBM Watsonx Orchestrate
 * @param {string} fromCountry - Source country
 * @param {string} toCountry - Target country
 * @param {string} medicineName - Medicine name
 * @returns {string} Mock educational response
 */
function generateMockEquivalentResponse(fromCountry, toCountry, medicineName) {
    // This is a mock response for UI demonstration
    // In production, this will be replaced with actual AI agent response
    
    const responses = {
        'Paracetamol': `Educational Reference Information:

${medicineName} (commonly known as Paracetamol or Acetaminophen) is widely used in ${fromCountry} for pain relief and fever reduction.

In ${toCountry}, medicines with the same active ingredient (acetaminophen) are commonly available under various brand names. These medicines serve the same therapeutic purpose and contain the same active ingredient.

Common brand names in ${toCountry} may include formulations containing acetaminophen/paracetamol. The active ingredient works the same way regardless of the brand name.

Important Educational Note: This information is for educational reference only. Different countries may have varying formulations, strengths, and availability. Always consult with a licensed healthcare professional in your country for appropriate medical guidance.`,

        'Ibuprofen': `Educational Reference Information:

${medicineName} (Ibuprofen) is commonly used in ${fromCountry} as a nonsteroidal anti-inflammatory drug (NSAID) for pain, inflammation, and fever.

In ${toCountry}, medicines containing ibuprofen as the active ingredient are available under various brand names. These medicines have the same therapeutic purpose and active ingredient.

Common formulations in ${toCountry} may include ibuprofen tablets, capsules, or liquid forms. The active ingredient provides the same therapeutic effect regardless of the brand.

Important Educational Note: This information is for educational reference only. Formulations, dosages, and availability may vary by country. Consult a licensed healthcare professional for appropriate medical advice.`,

        'default': `Educational Reference Information:

${medicineName} is commonly used in ${fromCountry} for therapeutic purposes.

In ${toCountry}, medicines with the same active ingredient or therapeutic purpose as ${medicineName} may be available under different brand names. These medicines serve similar therapeutic functions.

The active ingredient or therapeutic mechanism remains the same, though brand names, formulations, and availability may differ between countries.

Important Educational Note: This information is for educational reference only. Medicine availability, formulations, and regulations vary by country. Always consult with a licensed healthcare professional in your country for appropriate medical guidance.`
    };

    // Check for specific medicine responses, otherwise use default
    const medicineLower = medicineName.toLowerCase();
    if (medicineLower.includes('paracetamol') || medicineLower.includes('acetaminophen')) {
        return responses['Paracetamol'];
    } else if (medicineLower.includes('ibuprofen')) {
        return responses['Ibuprofen'];
    } else {
        return responses['default'];
    }
}

// ============================================
// Profile Menu Functions
// Session-only profile and patient history management
// ============================================

/**
 * Toggle profile dropdown menu
 */
function toggleProfileMenu() {
    const dropdown = document.getElementById('profileDropdown');
    const isVisible = dropdown.classList.contains('is-visible');
    
    if (isVisible) {
        dropdown.classList.remove('is-visible');
        dropdown.classList.add('is-hidden');
        document.removeEventListener('click', closeProfileMenuOnOutsideClick);
    } else {
        dropdown.classList.remove('is-hidden');
        dropdown.classList.add('is-visible');
        // Close dropdown when clicking outside
        setTimeout(() => {
            document.addEventListener('click', closeProfileMenuOnOutsideClick);
        }, 0);
    }
}

/**
 * Close profile menu when clicking outside
 */
function closeProfileMenuOnOutsideClick(event) {
    const dropdown = document.getElementById('profileDropdown');
    const profileBtn = document.querySelector('.profile-icon-btn');
    
    if (!dropdown.contains(event.target) && !profileBtn.contains(event.target)) {
        dropdown.classList.remove('is-visible');
        dropdown.classList.add('is-hidden');
        document.removeEventListener('click', closeProfileMenuOnOutsideClick);
    }
}

/**
 * Open Your Profile panel
 */
function openYourProfile() {
    closeProfileMenu();
    const panel = document.getElementById('yourProfilePanel');
    panel.classList.remove('is-hidden');
    panel.classList.add('is-visible');
    document.body.style.overflow = 'hidden';
    
    // Sync country display with current selection
    updateProfileCountryDisplay();
    
    // Load saved profile data
    const ageInput = document.getElementById('userAge');
    if (ageInput) {
        ageInput.value = profileData.age || '';
    }
    
    // Load sex selection
    const sexRadios = document.querySelectorAll('input[name="userSex"]');
    if (sexRadios.length > 0) {
        sexRadios.forEach(radio => {
            radio.checked = (radio.value === profileData.sex);
        });
    }
}

/**
 * Close Your Profile panel
 */
function closeYourProfile() {
    const panel = document.getElementById('yourProfilePanel');
    panel.classList.remove('is-visible');
    panel.classList.add('is-hidden');
    document.body.style.overflow = '';
}

/**
 * Validate age input - must be a positive number
 * @param {HTMLInputElement} input - Age input element
 */
function validateAgeInput(input) {
    const value = input.value.trim();
    if (value === '') {
        // Clear age if input is empty
        profileData.age = null;
        return;
    }
    
    const age = parseInt(value, 10);
    if (isNaN(age) || age < 1 || age > 150) {
        // Reset to empty if invalid
        input.value = '';
        profileData.age = null;
    } else {
        // Update profile data with valid age
        profileData.age = age;
    }
}

/**
 * Update profile data when age or sex changes
 * Age and sex are stored session-only for educational safety guidance
 */
function updateProfileData() {
    const ageInput = document.getElementById('userAge');
    if (ageInput) {
        const ageValue = ageInput.value.trim();
        if (ageValue === '') {
            profileData.age = null;
        } else {
            const age = parseInt(ageValue, 10);
            if (!isNaN(age) && age > 0 && age <= 150) {
                profileData.age = age;
            } else {
                profileData.age = null;
            }
        }
    }
    
    // Get selected sex from radio buttons
    const sexRadio = document.querySelector('input[name="userSex"]:checked');
    if (sexRadio) {
        profileData.sex = sexRadio.value;
    } else {
        profileData.sex = '';
    }
    
    // Sync country with main country selector
    profileData.country = selectedCountry;
    updateProfileCountryDisplay();
}

/**
 * Update profile country display (read-only, synced with main selector)
 */
function updateProfileCountryDisplay() {
    const countryDisplay = document.getElementById('profileCountryDisplay');
    if (countryDisplay) {
        countryDisplay.textContent = selectedCountry || 'Global';
        profileData.country = selectedCountry;
    }
}

/**
 * Open Patient History panel
 */
function openPatientHistory() {
    closeProfileMenu();
    const panel = document.getElementById('patientHistoryPanel');
    panel.classList.remove('is-hidden');
    panel.classList.add('is-visible');
    document.body.style.overflow = 'hidden';
    
    // Load saved patient history
    loadPatientHistoryUI();
}

/**
 * Close Patient History panel
 */
function closePatientHistory() {
    const panel = document.getElementById('patientHistoryPanel');
    panel.classList.remove('is-visible');
    panel.classList.add('is-hidden');
    document.body.style.overflow = '';
}

/**
 * Load patient history data into UI
 */
function loadPatientHistoryUI() {
    // Load allergies
    const allergiesList = document.getElementById('allergiesList');
    if (allergiesList) {
        allergiesList.innerHTML = '';
        patientHistory.allergies.forEach(allergy => {
            addAllergyChip(allergy);
        });
    }
    
    // Load chronic conditions
    patientHistory.chronicConditions.forEach(condition => {
        const chip = document.querySelector(`[data-condition="${condition}"]`);
        if (chip) {
            chip.classList.add('selected');
        }
    });
    
    // Load pregnancy status
    const pregnancyCheckbox = document.getElementById('pregnancyStatus');
    if (pregnancyCheckbox) {
        pregnancyCheckbox.checked = patientHistory.pregnancyStatus;
    }
}

/**
 * Handle Enter key press in allergy input
 */
function handleAllergyKeyPress(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        addAllergy();
    }
}

/**
 * Add allergy from input field
 */
function addAllergy() {
    const allergyInput = document.getElementById('allergyInput');
    const allergy = allergyInput.value.trim();
    
    if (!allergy) return;
    
    // Check if allergy already exists
    if (patientHistory.allergies.includes(allergy)) {
        allergyInput.value = '';
        return;
    }
    
    // Add to state
    patientHistory.allergies.push(allergy);
    
    // Add chip to UI
    addAllergyChip(allergy);
    
    // Clear input
    allergyInput.value = '';
    
    // Update patient history
    updatePatientHistory();
}

/**
 * Add allergy chip to UI
 */
function addAllergyChip(allergy) {
    const allergiesList = document.getElementById('allergiesList');
    if (!allergiesList) return;
    
    const chip = document.createElement('div');
    chip.className = 'allergy-chip';
    chip.innerHTML = `
        <span>${escapeHtml(allergy)}</span>
        <button 
            onclick="removeAllergy('${escapeHtml(allergy)}')" 
            class="allergy-chip-remove"
            aria-label="Remove allergy"
        >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
        </button>
    `;
    allergiesList.appendChild(chip);
}

/**
 * Remove allergy from list
 */
function removeAllergy(allergy) {
    // Remove from state
    const index = patientHistory.allergies.indexOf(allergy);
    if (index > -1) {
        patientHistory.allergies.splice(index, 1);
    }
    
    // Reload UI
    loadPatientHistoryUI();
    
    // Update patient history
    updatePatientHistory();
}

/**
 * Toggle chronic condition selection
 */
function toggleChronicCondition(condition) {
    const chip = document.querySelector(`[data-condition="${condition}"]`);
    if (!chip) return;
    
    const isSelected = chip.classList.contains('selected');
    
    // If "None" is selected, clear all others
    if (condition === 'None') {
        if (!isSelected) {
            // Clear all selections
            document.querySelectorAll('.profile-condition-chip').forEach(c => {
                c.classList.remove('selected');
            });
            patientHistory.chronicConditions = ['None'];
            chip.classList.add('selected');
        } else {
            // Deselect "None"
            chip.classList.remove('selected');
            patientHistory.chronicConditions = [];
        }
    } else {
        // Remove "None" if it's selected
        const noneChip = document.querySelector('[data-condition="None"]');
        if (noneChip && noneChip.classList.contains('selected')) {
            noneChip.classList.remove('selected');
            patientHistory.chronicConditions = patientHistory.chronicConditions.filter(c => c !== 'None');
        }
        
        // Toggle condition
        if (isSelected) {
            chip.classList.remove('selected');
            patientHistory.chronicConditions = patientHistory.chronicConditions.filter(c => c !== condition);
        } else {
            chip.classList.add('selected');
            if (!patientHistory.chronicConditions.includes(condition)) {
                patientHistory.chronicConditions.push(condition);
            }
        }
    }
    
    // Update patient history
    updatePatientHistory();
}

/**
 * Update patient history data
 */
function updatePatientHistory() {
    const pregnancyCheckbox = document.getElementById('pregnancyStatus');
    if (pregnancyCheckbox) {
        patientHistory.pregnancyStatus = pregnancyCheckbox.checked;
    }
    
    // TODO: This patient history data will be included in queries sent to IBM Watsonx Orchestrate
    // The medical context is already integrated into buildStructuredQuery() function
    // Example API integration:
    // const query = buildStructuredQuery(userMessage);
    // // query.patientHistory contains the medical context
    // const response = await fetch('/api/chat', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(query)
    // });
}

/**
 * Close profile menu
 */
function closeProfileMenu() {
    const dropdown = document.getElementById('profileDropdown');
    dropdown.classList.remove('is-visible');
    dropdown.classList.add('is-hidden');
    document.removeEventListener('click', closeProfileMenuOnOutsideClick);
}
