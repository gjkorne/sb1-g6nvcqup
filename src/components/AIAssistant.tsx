import React, { useState, useRef, useEffect } from 'react';
import { Send, Minimize, Maximize, X, MessageSquare, BotIcon } from 'lucide-react';
import { useTaskStore } from '../store/taskStore';
import { useChatStore } from '../store/chatStore';
import { motion, AnimatePresence } from 'framer-motion';

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputValue, setInputValue] = useState('');
  
  const { messages, isProcessing, processMessage } = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const taskStore = useTaskStore();
  
  useEffect(() => {
    if (messagesEndRef.current && isOpen && !isMinimized) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized]);

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isProcessing) return;
    
    const message = inputValue;
    setInputValue('');
    
    await processMessage(message, {
      addTask: taskStore.addTask,
      getTasks: () => taskStore.tasks,
      completeTask: taskStore.completeTask,
      deleteTask: taskStore.deleteTask
    });
  };
  
  const formatMessageContent = (content: string) => {
    // Handle newlines and formatting
    return content.split('\n').map((line, i) => (
      <React.Fragment key={i}>
        {line}
        {i < content.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  return (
    <>
      {/* Chat bubble for closed state */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors z-50"
          onClick={() => setIsOpen(true)}
        >
          <MessageSquare className="w-6 h-6" />
        </motion.button>
      )}

      {/* Full chat interface */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed ${isMinimized ? 'bottom-6 right-6 w-auto' : 'bottom-6 right-6 w-96'} bg-white rounded-lg shadow-xl overflow-hidden border border-gray-200 transition-all duration-200 flex flex-col z-50`}
            style={{ maxHeight: isMinimized ? '48px' : '500px' }}
          >
            {/* Chat header */}
            <div className="bg-blue-600 text-white p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BotIcon className="w-5 h-5" />
                <span className="font-medium">Task Assistant</span>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1 hover:bg-blue-700 rounded"
                >
                  {isMinimized ? <Maximize className="w-4 h-4" /> : <Minimize className="w-4 h-4" />}
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-blue-700 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages container */}
            {!isMinimized && (
              <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                {messages.map((message) => (
                  <div 
                    key={message.id}
                    className={`mb-4 flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-3/4 p-3 rounded-lg ${
                        message.isUser 
                          ? 'bg-blue-600 text-white rounded-tr-none'
                          : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'
                      }`}
                    >
                      {formatMessageContent(message.content)}
                      <div className={`text-xs mt-1 ${message.isUser ? 'text-blue-200' : 'text-gray-500'}`}>
                        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}

            {/* Input area */}
            {!isMinimized && (
              <div className="border-t border-gray-200 p-3 bg-white">
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Ask me about your tasks..."
                    className="flex-1 py-2 px-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isProcessing}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isProcessing}
                    className={`p-2 rounded-full ${
                      !inputValue.trim() || isProcessing
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}