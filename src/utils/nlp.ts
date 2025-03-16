import OpenAI from 'openai';
import { NLPTaskResult } from '../types';
import { parseISO } from 'date-fns';

const API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

// Check if API key is properly configured
const isValidApiKey = API_KEY && API_KEY !== 'your_api_key_here';

const openai = isValidApiKey ? new OpenAI({
  apiKey: API_KEY,
  dangerouslyAllowBrowser: true
}) : null;

export async function processTaskWithNLP(input: string): Promise<NLPTaskResult & { error?: string }> {
  // If OpenAI is not configured, return basic task structure
  if (!isValidApiKey || !openai) {
    return {
      title: input,
      category: 'general',
      aiResponse: "I've added this as a basic task since I couldn't process it with AI at the moment.",
      tags: [],
      description: null,
      error: 'OpenAI API key not configured'
    };
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a friendly and helpful task management AI assistant that helps users create clear, actionable tasks.
          
          When a user inputs a task:
          1. If it's vague, suggest a more specific SMART goal version
          2. For complex tasks, break them down into subtasks
          3. Ask clarifying questions when needed
          4. Suggest relevant tags and categorization
          5. Keep responses conversational and encouraging
          
          Your response must be ONLY valid JSON with this structure:
          
          {
            "title": "task title",
            "category": "work/personal/shopping/etc",
            "dueDate": "ISO date string or null",
            "tags": ["tag1", "tag2"],
            "description": "detailed description or null",
            "aiResponse": "A friendly response that: 1) Acknowledges the task positively, 2) Explains any suggested improvements or breakdowns, 3) Asks relevant clarifying questions. Keep it conversational and encouraging.",
            "subtasks": [
              {
                "title": "subtask 1",
                "description": "subtask description"
              }
            ]
          }`
        },
        {
          role: "user",
          content: `Task: ${input.trim()}
          
          Please analyze this task and:
          1. Acknowledge the task positively
          2. For household tasks, break them down into clear, manageable steps
          3. For work tasks, suggest professional subtasks and deadlines
          4. For personal tasks, offer motivational suggestions
          5. Add relevant tags (e.g., "cleaning", "work", "health", etc.)
          6. Keep the tone friendly and encouraging
          
          Examples of good responses:
          - For "Clean bedroom": Break down into specific cleaning tasks, add encouraging message
          - For "Write report": Suggest outline steps, ask about deadline
          - For "Exercise": Ask about preferences, suggest specific workout components`
        }
      ]
    });

    let result;
    try {
      const content = completion.choices[0].message.content?.trim() || '{}';
      result = JSON.parse(content);

      // Ensure required fields exist
      result.title = result.title || input;
      result.category = result.category || 'general';
      result.tags = result.tags || [];
      result.subtasks = result.subtasks || [];
      result.aiResponse = result.aiResponse || "I've added this task to your list. Let me know if you'd like to break it down further!";
      
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      return {
        title: input,
        category: 'general',
        aiResponse: "I'll add this as a basic task since I had trouble processing the AI response.",
        tags: [],
        subtasks: [],
        description: null,
        error: 'Error parsing AI response'
      };
    }
    
    return {
      ...result,
      dueDate: result.dueDate ? parseISO(result.dueDate) : undefined,
      tags: result.tags || []
    };
  } catch (error: any) {
    console.error('Error processing task with NLP:', error);
    
    // Handle rate limit error specifically
    if (error?.status === 429) {
      return {
        title: input,
        category: 'general',
        tags: [],
        subtasks: [],
        description: null,
        error: 'AI processing unavailable (quota exceeded). Using basic task creation.'
      };
    }
    
    // Return basic task structure on other errors
    return {
      title: input,
      category: 'general',
      aiResponse: "I've added this as a basic task. I'll be more helpful once AI processing is available again.",
      tags: [],
      subtasks: [],
      description: null,
      error: 'Error processing with AI. Using basic task creation.'
    };
  }
}