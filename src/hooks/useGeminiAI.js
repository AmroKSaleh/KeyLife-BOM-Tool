/**
 * @file useGeminiAI.js
 * @description Enhanced hook for Gemini API integration with better error handling and retry logic
 */

import { useState, useCallback } from 'react';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY; // Add your API key here
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent";

export const useGeminiAI = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState('');
    const [isLoadingAi, setIsLoadingAi] = useState(false);
    const [selectedComponent, setSelectedComponent] = useState(null);

    /**
     * Fetch with exponential backoff retry logic
     */
    const fetchWithRetry = async (url, options, maxRetries = 3) => {
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const response = await fetch(url, options);
                
                if (response.ok) {
                    return response;
                }

                // Handle rate limiting
                if (response.status === 429) {
                    const retryAfter = response.headers.get('Retry-After');
                    const delay = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, attempt) * 1000;
                    
                    if (attempt < maxRetries - 1) {
                        await new Promise(resolve => setTimeout(resolve, delay));
                        continue;
                    }
                }

                // Handle other errors
                const errorData = await response.json().catch(() => ({}));
                throw new Error(
                    errorData.error?.message || 
                    `API error: ${response.status} ${response.statusText}`
                );
            } catch (error) {
                if (attempt === maxRetries - 1) {
                    throw error;
                }
                
                // Exponential backoff for network errors
                const delay = Math.pow(2, attempt) * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    };

    /**
     * Format markdown-like text to HTML
     */
    const formatTextToHtml = (text) => {
        return text
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\n\n/g, '<br /><br />')
            .replace(/\n/g, '<br />')
            .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/`(.+?)`/g, '<code class="px-1 py-0.5 bg-gray-700 rounded text-sm">$1</code>')
            .replace(/^- (.+)$/gm, '<li class="ml-4">$1</li>')
            .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4" style="list-style-type: decimal;">$2</li>');
    };

    /**
     * Build the prompt for component alternatives
     */
    const buildPrompt = (component) => {
        const componentDetails = Object.entries(component)
            .filter(([key]) => key !== 'id' && key !== 'ProjectName')
            .map(([key, value]) => `- ${key}: ${value || 'N/A'}`)
            .join('\n');

        return {
            system: `You are an expert electronics engineer and supply chain specialist with deep knowledge of:
- Electronic component specifications and equivalences
- Package compatibility and footprint matching
- Manufacturer cross-references and second sources
- Supply chain availability and lifecycle status

When suggesting alternatives:
1. Prioritize functional equivalence (same electrical specs)
2. Consider package compatibility (footprint, pinout)
3. Mention trusted manufacturers
4. Note any important differences
5. Be concise but informative`,
            
            user: `Please suggest 3-4 alternative components for this part:

${componentDetails}

For each alternative, provide:
- Manufacturer and part number
- Key specifications
- Why it's a good alternative
- Any important notes or differences

Format your response clearly with each alternative numbered.`
        };
    };

    /**
     * Find component alternatives using Gemini AI
     */
    const findAlternatives = useCallback(async (component) => {
        if (!API_KEY) {
            setModalContent(
                '<div class="text-red-400">API key not configured. Please add your Gemini API key to useGeminiAI.js</div>'
            );
            setIsModalOpen(true);
            return;
        }

        setSelectedComponent(component);
        setIsModalOpen(true);
        setIsLoadingAi(true);
        setModalContent('');

        try {
            const { system, user } = buildPrompt(component);

            const payload = {
                contents: [{ parts: [{ text: user }] }],
                tools: [{ "google_search": {} }],
                systemInstruction: {
                    parts: [{ text: system }]
                },
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 2048,
                }
            };

            const response = await fetchWithRetry(
                `${API_URL}?key=${API_KEY}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                },
                3
            );

            const result = await response.json();
            const candidate = result.candidates?.[0];

            if (!candidate || !candidate.content?.parts?.[0]?.text) {
                throw new Error('No suggestions generated. The AI response was empty.');
            }

            const formattedContent = formatTextToHtml(candidate.content.parts[0].text);
            
            // Add component context at the top
            const contextHtml = `
                <div class="bg-gray-900/50 p-4 rounded-lg mb-4 border border-gray-700">
                    <h4 class="font-semibold text-keylife-accent mb-2">Original Component:</h4>
                    <div class="grid grid-cols-2 gap-2 text-sm">
                        ${Object.entries(component)
                            .filter(([key]) => key !== 'id' && key !== 'ProjectName')
                            .slice(0, 4)
                            .map(([key, value]) => `
                                <div><span class="text-gray-400">${key}:</span> <span class="text-white">${value || 'N/A'}</span></div>
                            `).join('')}
                    </div>
                </div>
            `;

            setModalContent(contextHtml + formattedContent);
        } catch (error) {
            console.error('Gemini API error:', error);
            
            let errorMessage = 'An error occurred while fetching alternatives.';
            
            if (error.message.includes('429')) {
                errorMessage = 'Rate limit exceeded. Please wait a moment and try again.';
            } else if (error.message.includes('API key')) {
                errorMessage = 'Invalid API key. Please check your configuration.';
            } else if (error.message.includes('network') || error.message.includes('fetch')) {
                errorMessage = 'Network error. Please check your internet connection.';
            } else {
                errorMessage = error.message || errorMessage;
            }

            setModalContent(`
                <div class="text-center py-8">
                    <svg class="w-16 h-16 mx-auto text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p class="text-red-400 font-medium mb-2">Request Failed</p>
                    <p class="text-gray-400 text-sm">${errorMessage}</p>
                </div>
            `);
        } finally {
            setIsLoadingAi(false);
        }
    }, []);

    return { 
        isModalOpen, 
        setIsModalOpen, 
        modalContent, 
        isLoadingAi, 
        findAlternatives,
        selectedComponent
    };
};