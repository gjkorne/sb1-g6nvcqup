import OpenAI from 'openai';
import { NLPTaskResult } from '../types';
import { parseISO } from 'date-fns';

const API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

// Check if API key is properly configured
const isValidApiKey = API_KEY && API_KEY !== 'your_api_key_here';

const openai = isValidApiKey 
  ? new OpenAI({
      apiKey: API_KEY,
      dangerouslyAllowBrowser: true
    }) 
  : null;

export async function processTaskWithNLP(input: string): Promise<NLPTaskResult & { error?: string }> {
  // If OpenAI is not configured, return basic task structure
  if (!isValidApiKey || !openai) {
    return {
      title: input,
      category: 'general',
      aiResponse: "I've added this as a basic task since I couldn't process it with AI at the moment.",
      tags: [],
      subtasks: [],
      description: null,
      error: 'OpenAI API key not configured',
      timeEstimate: null
    };
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a sophisticated task management AI assistant that helps users create comprehensive, well-structured tasks with time estimates.
          
          When a user inputs a task, you will:
          1. Analyze the task to understand its complexity, scope, and nature
          2. Break complex tasks into logical subtasks with their own time estimates
          3. Ask specific clarifying questions when information is missing
          4. Assign realistic time estimates based on task complexity
          5. Suggest relevant tags and categorization
          6. Identify potential dependencies between subtasks
          7. Determine appropriate priority levels
          
          Your response must be ONLY valid JSON with this structure:
          
          {
            "title": "clear, concise task title",
            "category": "work/personal/shopping/etc",
            "dueDate": "ISO date string or null",
            "tags": ["tag1", "tag2"],
            "priority": "low/medium/high",
            "description": "detailed description or null",
            "timeEstimate": {
              "value": number of minutes/hours,
              "unit": "minutes" or "hours"
            },
            "aiResponse": "A friendly response that: 1) Acknowledges the task positively, 2) Explains any suggested improvements or breakdowns, 3) Asks relevant clarifying questions. Keep it conversational and encouraging.",
            "subtasks": [
              {
                "title": "subtask 1",
                "description": "subtask description",
                "timeEstimate": {
                  "value": number,
                  "unit": "minutes" or "hours"
                }
              }
            "clarifyingQuestions": [
              "Question about missing but important information?"
            ],
            "aiResponse": "A friendly response that: 1) Acknowledges the task, 2) Explains your time estimates and breakdown, 3) Asks any clarifying questions."
          }`
        },
        {
          role: "user",
          content: `Task: ${input.trim()}
          
          Please analyze this task and:
          1. Create a structured breakdown with time estimates
          2. Add relevant tags automatically
          3. Suggest a due date if appropriate
          4. Ask me any questions you need to make better estimates
          5. Set a realistic priority level
          
          I need accurate time estimates for both the overall task and any subtasks you identify.`
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
      result.priority = result.priority || 'medium';
      result.timeEstimate = result.timeEstimate || null;
      result.aiResponse = result.aiResponse || "I've added this task to your list. Let me know if you'd like to break it down further!";
      
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      return {
        title: input,
        category: 'general',
        aiResponse: "I'll add this as a basic task since I had trouble processing the AI response.",
        tags: [],
        subtasks: [],
        timeEstimate: null,
        description: null,
        error: 'Error parsing AI response'
      };
    }
    
    // Convert time estimates to minutes for consistency in the database
    let standardizedTimeEstimate = null;
    if (result.timeEstimate) {
      standardizedTimeEstimate = {
        value: result.timeEstimate.unit === 'hours' 
          ? result.timeEstimate.value * 60 
          : result.timeEstimate.value,
        unit: 'minutes'
      };
    }
    
    // Also standardize subtask time estimates
    const standardizedSubtasks = result.subtasks.map(subtask => {
      if (subtask.timeEstimate) {
        return {
          ...subtask,
          timeEstimate: {
            value: subtask.timeEstimate.unit === 'hours' 
              ? subtask.timeEstimate.value * 60 
              : subtask.timeEstimate.value,
            unit: 'minutes'
          }
        };
      }
      return subtask;
    });
    
    return {
      ...result,
      dueDate: result.dueDate ? parseISO(result.dueDate) : undefined,
      timeEstimate: standardizedTimeEstimate,
      subtasks: standardizedSubtasks
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
        timeEstimate: null,
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
      timeEstimate: null,
      description: null,
      error: 'Error processing with AI. Using basic task creation.'
    };
  }
}