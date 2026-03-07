import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  ShieldCheck, 
  Lock, 
  ArrowLeft,
  Paperclip,
  Smile
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { getChatResponse } from "../services/geminiService";

interface Message {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: number;
}

const initialMessages: Message[] = [
  {
    id: "welcome",
    role: "model",
    text: "Olá! Sou a MKI AI, sua assistente virtual. Como posso ajudar você hoje?",
    timestamp: Date.now()
  }
];

export default function SupportChat() {
  const { sessionId } = useParams();
  const { currentUser } = useAuth()!;
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !currentUser) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      text: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Prepare history for Gemini
    const history = messages.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.text }]
    }));

    try {
      // 1. Call backend for KB search
      const response = await fetch("/api/support/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: currentUser.uid,
          message: userMsg.text,
          history: history
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get chat response from server");
      }

      const data = await response.json();
      let finalResponseText = "";

      if (data.need_gemini) {
        // 2. Escalate to Gemini in frontend
        finalResponseText = await getChatResponse(userMsg.text, history);
      } else {
        // Use KB response
        finalResponseText = data.text;
      }

      // Remove asterisks from response
      finalResponseText = finalResponseText.replace(/\*/g, "");

      // Check for trigger JSON
      const triggerMatch = finalResponseText.match(/\{"trigger_support_request":.*?\}/);
      if (triggerMatch) {
        try {
          const triggerData = JSON.parse(triggerMatch[0]);
          if (triggerData.trigger_support_request) {
            // Call backend to notify admins
            await fetch("/api/support/notify-admins", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                userEmail: triggerData.user_email,
                problemDescription: triggerData.problem_description,
                userId: currentUser.uid
              }),
            });
          }
          // Remove the JSON from the displayed text
          finalResponseText = finalResponseText.replace(triggerMatch[0], "").trim();
        } catch (e) {
          console.error("Failed to parse trigger JSON", e);
        }
      }
      
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "model",
        text: finalResponseText,
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "model",
        text: "Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-gray-50">
      {/* Chat Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/support')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div className="relative">
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
              <Bot className="w-6 h-6 text-indigo-600" />
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
          </div>
          <div>
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              MKI AI Support
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-xs rounded-full border border-indigo-100">Beta</span>
            </h2>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Sessão Criptografada: {sessionId?.slice(0, 8)}...
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400">
          <ShieldCheck className="w-4 h-4 text-green-500" />
          <span>Conexão Segura</span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
        <div className="text-center text-xs text-gray-400 my-4">
          <span>Início da conversa segura • {new Date().toLocaleDateString()}</span>
        </div>
        
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] sm:max-w-[70%] rounded-2xl p-4 shadow-sm ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-br-none' 
                : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
            }`}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
              <p className={`text-[10px] mt-2 text-right ${
                msg.role === 'user' ? 'text-indigo-200' : 'text-gray-400'
              }`}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </motion.div>
        ))}

        {isTyping && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-none p-4 shadow-sm flex items-center gap-2">
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 p-4 sm:p-6">
        <div className="max-w-4xl mx-auto relative flex items-center gap-2">
          <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100">
            <Paperclip className="w-5 h-5" />
          </button>
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Digite sua mensagem para MKI AI..."
              className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              disabled={isTyping}
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <Smile className="w-5 h-5" />
            </button>
          </div>
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className={`p-3 rounded-xl transition-all shadow-md ${
              !input.trim() || isTyping 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg hover:scale-105'
            }`}
          >
            {isTyping ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
        <p className="text-center text-xs text-gray-400 mt-3">
          MKI AI pode cometer erros. Verifique informações importantes.
        </p>
      </div>
    </div>
  );
}
