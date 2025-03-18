import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { processTaskWithNLP } from '../utils/nlp';
import { Task } from '../types';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  action?: {
    type: 'ADD_TASK' | 'UPDATE_TASK' | 'DELETE_TASK' | 'COMPLETE_TASK' | 'VIEW_TASKS';
    data?: any;
  };
}

interface ChatState {
  messages: Message[];
  isProcessing: boolean;
  addMessage: (content: string, isUser: boolean, action?: Message['action']) => void;
  processMessage: (content: string, taskActions: {
    addTask: (task: Partial<Task>) => Promise<void>;
    getTasks: () => Task[];
    completeTask: (id: string) => Promise<void>;
    deleteTask: (id: string) => Promise<void>;
  }) => Promise<void>;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: [
        {
          id: '1',
          content: 'Hello! I can help you manage your tasks. What would you like to do today?',
          isUser: false,
          timestamp: new Date(),
        },
      ],
      isProcessing: false,

      addMessage: (content, isUser, action) => {
        const newMessage: Message = {
          id: Date.now().toString(),
          content,
          isUser,
          timestamp: new Date(),
          action,
        };
        
        set((state) => ({
          messages: [...state.messages, newMessage],
        }));
        
        return newMessage;
      },

      processMessage: async (content, taskActions) => {
        const { addMessage } = get();
        
        // Add the user message
        addMessage(content, true);
        
        // Set processing state
        set({ isProcessing: true });
        
        try {
          // Check for command patterns
          // Check for command patterns to list tasks
        if (
          (content.toLowerCase().includes('show') && content.toLowerCase().includes('task')) ||
          (content.toLowerCase().includes('list') && content.toLowerCase().includes('task')) ||
          (content.toLowerCase().includes('what') && content.toLowerCase().includes('task')) ||
          (content.toLowerCase().includes('get') && content.toLowerCase().includes('task')) ||
          (content.toLowerCase().match(/my tasks/i)) ||
          (content.toLowerCase().match(/open tasks/i)) ||
          (content.toLowerCase().match(/all tasks/i))
        ) {
          const tasks = taskActions.getTasks();
          handleTaskListDisplay(tasks, addMessage);
          return; // Add this to prevent it from continuing to task creation
        }
          else if (
            (content.toLowerCase().includes('delete') || content.toLowerCase().includes('remove')) && 
            content.toLowerCase().includes('task')
          ) {
            const taskTitle = extractTaskTitle(content);
            if (taskTitle) {
              await handleDeleteTask(taskTitle, taskActions, addMessage);
            } else {
              addMessage("Which task would you like to delete?", false);
            }
          } 
          else if (
            (content.toLowerCase().includes('complete') || content.toLowerCase().includes('finish')) && 
            content.toLowerCase().includes('task')
          ) {
            const taskTitle = extractTaskTitle(content);
            if (taskTitle) {
              await handleCompleteTask(taskTitle, taskActions, addMessage);
            } else {
              addMessage("Which task would you like to mark as complete?", false);
            }
          } 
          else {
            // Process with NLP for potential task creation
            const nlpResult = await processTaskWithNLP(content);
            
            if (nlpResult.error) {
              addMessage(nlpResult.error, false);
            } else {
              // Check if this looks like a task
              if (hasTaskIntentionMarkers(content, nlpResult)) {
                await handleTaskCreation(nlpResult, taskActions, addMessage);
              } else {
                // General conversation
                const response = await generateConversationalResponse(content);
                addMessage(response, false);
              }
            }
          }
        } catch (error) {
          console.error('Error processing message:', error);
          addMessage("I'm having trouble processing that right now. Please try again later.", false);
        } finally {
          set({ isProcessing: false });
        }
      },

      clearMessages: () => {
        set({
          messages: [
            {
              id: '1',
              content: 'Hello! I can help you manage your tasks. What would you like to do today?',
              isUser: false,
              timestamp: new Date(),
            },
          ],
        });
      },
    }),
    {
      name: 'task-assistant-chat',
      partialize: (state) => ({ messages: state.messages }),
    }
  )
);

// Helper functions

const hasTaskIntentionMarkers = (input: string, nlpResult: any) => {
  // Commands that should NOT be interpreted as task creation
  const nonTaskCommands = [
    'show', 'list', 'get', 'display', 'view', 'what', 
    'my tasks', 'all tasks', 'open tasks'
  ];
  
  // If the input contains any of the non-task commands, it's likely not a task creation
  for (const cmd of nonTaskCommands) {
    if (input.toLowerCase().includes(cmd)) {
      return false;
    }
  }
  
  // Task creation keywords
  const taskKeywords = [
    'create', 'add', 'make', 'set up', 'schedule', 'todo', 'to-do', 'to do',
    'task', 'reminder', 'work on', 'project', 'assignment'
  ];
  
  input = input.toLowerCase();
  return taskKeywords.some(keyword => input.includes(keyword)) || 
         nlpResult.category !== 'general' ||
         nlpResult.timeEstimate !== null ||
         (nlpResult.dueDate !== undefined && nlpResult.dueDate !== null) ||
         nlpResult.priority !== 'medium';
};

const handleTaskCreation = async (
  taskData: any, 
  taskActions: { addTask: (task: any) => Promise<void> },
  addMessage: (content: string, isUser: boolean, action?: any) => void
) => {
  await taskActions.addTask(taskData);
  
  addMessage(
    `I've added "${taskData.title}" to your tasks. ${taskData.subtasks.length > 0 ? `I've broken it down into ${taskData.subtasks.length} subtasks.` : ''}`,
    false,
    {
      type: 'ADD_TASK',
      data: taskData
    }
  );
};

const handleTaskListDisplay = (
  tasks: any[],
  addMessage: (content: string, isUser: boolean, action?: any) => void
) => {
  let responseContent = '';
  
  if (tasks.length === 0) {
    responseContent = "You don't have any tasks at the moment. Would you like to create one?";
  } else {
    responseContent = `Here are your current tasks:\n\n${tasks.map((task, index) => (
      `${index + 1}. ${task.title} ${task.status === 'completed' ? '(Completed)' : ''}`
    )).join('\n')}`;
  }
  
  addMessage(
    responseContent,
    false,
    {
      type: 'VIEW_TASKS'
    }
  );
};

const handleDeleteTask = async (
  taskTitle: string,
  taskActions: { getTasks: () => any[], deleteTask: (id: string) => Promise<void> },
  addMessage: (content: string, isUser: boolean, action?: any) => void
) => {
  const task = taskActions.getTasks().find(
    t => t.title.toLowerCase().includes(taskTitle.toLowerCase())
  );
  
  if (task) {
    await taskActions.deleteTask(task.id);
    
    addMessage(
      `I've deleted the task "${task.title}".`,
      false,
      {
        type: 'DELETE_TASK',
        data: task
      }
    );
  } else {
    addMessage(
      `I couldn't find a task matching "${taskTitle}". Could you be more specific?`,
      false
    );
  }
};

const handleCompleteTask = async (
  taskTitle: string,
  taskActions: { getTasks: () => any[], completeTask: (id: string) => Promise<void> },
  addMessage: (content: string, isUser: boolean, action?: any) => void
) => {
  const task = taskActions.getTasks().find(
    t => t.title.toLowerCase().includes(taskTitle.toLowerCase()) && t.status !== 'completed'
  );
  
  if (task) {
    await taskActions.completeTask(task.id);
    
    addMessage(
      `I've marked "${task.title}" as complete. Great job!`,
      false,
      {
        type: 'COMPLETE_TASK',
        data: task
      }
    );
  } else {
    addMessage(
      `I couldn't find an incomplete task matching "${taskTitle}". Could you be more specific?`,
      false
    );
  }
};

const extractTaskTitle = (input: string): string | null => {
  // Simple extraction looking for quoted text or words after keywords
  const quotedMatch = input.match(/"([^"]*)"|'([^']*)'|`([^`]*)`/);
  if (quotedMatch) {
    return quotedMatch[1] || quotedMatch[2] || quotedMatch[3];
  }
  
  const afterKeyword = input.match(/(?:delete|remove|complete|finish)\s+(?:the\s+)?task\s+(?:called\s+)?(.+?)(?:\s+please|\s+now|\s+today|\.|$)/i);
  return afterKeyword ? afterKeyword[1].trim() : null;
};

const generateConversationalResponse = async (input: string): Promise<string> => {
  // For now use pre-defined responses, later could use the OpenAI API
  const responses = [
    "I'm here to help you manage tasks. You can ask me to add, delete, or complete tasks.",
    "Would you like me to help you create a new task?",
    "I can show your task list, create new tasks, or help you manage existing ones.",
    "That's interesting. Is there anything task-related I can help you with?",
    "I'm primarily designed to help with task management. Try saying something like 'Add a task to write a report'.",
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
};