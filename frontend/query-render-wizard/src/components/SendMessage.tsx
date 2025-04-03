  import React, { useState } from "react";
  import { auth, db } from "@/lib/firebase";
  import { addDoc, collection, serverTimestamp } from "firebase/firestore";
  import { Send, Plus, Globe, MoreVertical } from 'lucide-react';
  import { useEffect } from "react";

  interface SendMessageProps {
    scroll: React.RefObject<HTMLDivElement>;
    setMessages: React.Dispatch<React.SetStateAction<any[]>>;
  }

  useEffect(() => {
    console.log("🟢 SendMessage.tsx Mounted");
  }, []);

  type ResponseFormat = "text" | "table" | "line_chart" | "bar_chart" | "pie_chart";

  const SendMessage: React.FC<SendMessageProps> = ({ scroll, setMessages }) => {
    const [message, setMessage] = useState<string>("");
    const [responseFormat, setResponseFormat] = useState<ResponseFormat>("text");
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const sendMessage = async (event: React.FormEvent) => {
      event.preventDefault();
      console.log('🚀 Starting sendMessage with format:', responseFormat);
      console.log('📝 Message content:', message);
      
      if (message.trim() === "") {
        alert("Enter a valid message");
        return;
      }

      const { uid, displayName, photoURL } = auth.currentUser || {};
      
      if (!uid) {
        alert("You must be signed in to send messages.");
        return;
      }

      try {
        setIsLoading(true);

        // Log user message data
        const userMessage = {
          text: message,
          name: displayName || "User",
          avatar: photoURL || "/user-avatar.png",
          createdAt: serverTimestamp(),
          uid,
          format: responseFormat
        };
        console.log('📤 Sending user message:', userMessage);

        // Add user message to local state
        setMessages(prev => [...prev, userMessage]);

        // Store user message in Firebase
        await addDoc(collection(db, "chats", uid, "messages"), userMessage);
        console.log('✅ User message saved to Firebase');

        // Sending message to AI backend
        console.log('🌐 Sending request to AI backend...');
        const response = await fetch("http://127.0.0.1:8000/query/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: message,
            format: responseFormat
          })
        });

        // Check if the response is successful
        if (!response.ok) {
          throw new Error(`AI response error: ${response.status}`);
        }

        const data = await response.json();
        console.log('📥 Received AI response:', data);

        // Log chart data specifically if it's a chart format
        if (responseFormat.includes('chart')) {
          console.log('📊 Chart data:', {
            format: responseFormat,
            chartData: data.chart
          });
        }

        // Create AI response message
        const aiMessage = {
          text: data.message || data.result || "No response generated",
          name: "AI Assistant",
          avatar: "https://kissflow.com/hubfs/Logo-Verticle-Light.svg",
          createdAt: serverTimestamp(),
          uid,
          format: responseFormat,
          query: data.query || null,
          chart: data.chart || null
        };
        console.log('🤖 Creating AI message:', aiMessage);

        // Add AI response message to local state
        setMessages(prev => [...prev, aiMessage]);

        // Store AI response message in Firebase
        await addDoc(collection(db, "chats", uid, " "), aiMessage);
        console.log('✅ AI message saved to Firebase');

      } catch (error) {
        console.error("🚨 Error in sendMessage:", error);

        const errorMessage = {
          text: "Failed to get AI response. Please try again.",
          name: "System",
          avatar: "/error-icon.png",
          createdAt: serverTimestamp(),
          uid
        };

        // Add error message to local state
        setMessages(prev => [...prev, errorMessage]);

        // Store error message in Firebase
        await addDoc(collection(db, "chats", uid, "messages"), errorMessage);
        console.log('❌ Error message saved to Firebase');

      } finally {
        setIsLoading(false);
        setMessage("");
        console.log('✅ Message handling completed');
        scroll.current?.scrollIntoView({ behavior: "smooth" });
      }
    };

    return (
      <div className="app-container">
        <div className="message-area">
          <div className="message-container">
            <form onSubmit={sendMessage} className="message-form">
              <div className="input-container">
                <button type="button" className="action-button left-button">
                  <Plus className="icon" />
                </button>

                <input
                  type="text"
                  value={message}
                  onChange={(e) => {
                    console.log("✍️ User typing:", e.target.value);
                    setMessage(e.target.value);
                  }}
                  placeholder="Ask a question about your data..."
                  className="message-input"
                  disabled={isLoading}
                />

                <div className="right-buttons">
                  <select
                    value={responseFormat}
                    onChange={(e) => {
                      console.log("🔄 Response format changed to:", e.target.value);
                      setResponseFormat(e.target.value as ResponseFormat);
                    }}
                    disabled={isLoading}
                    className="format-select"
                  >
                    <option value="text">Text</option>
                    <option value="table">Table</option>
                    <option value="line_chart">Line Chart</option>
                    <option value="bar_chart">Bar Chart</option>
                    <option value="pie_chart">Pie Chart</option>
                  </select>

                  <button type="button" className="action-button">
                    <Globe className="icon" />
                  </button>
                  <button type="button" className="action-button">
                    <MoreVertical className="icon" />
                  </button>
                  <button
                    type="submit"
                    className={`action-button send-button ${!message.trim() || isLoading ? 'disabled' : ''}`}
                    disabled={!message.trim() || isLoading}
                  >
                    {isLoading ? "..." : <Send className="icon" />}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  export default SendMessage;
