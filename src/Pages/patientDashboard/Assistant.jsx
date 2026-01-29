import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { 
  Activity, 
  Utensils, 
  Clock, 
  Home, 
  MessageCircle, 
  Send,
  Heart,
  Camera,
  BarChart3,
  ArrowRight
} from "lucide-react";
import { Button } from "../../Component/UI/button";
import { Input } from "../../Component/UI/input";
import MobileNavigation from "../../Component/MobileNavigation";
import PatientCardHeading from "./PatientCardHeadin";

const Assistant = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [message, setMessage] = useState("");
    const [chatMessages, setChatMessages] = useState([
        {
            id: 1,
            text: "Hello! I'm your health assistant. How can I help you today?",
            isBot: true,
            timestamp: new Date()
        }
    ]);

    const quickActions = [
        {
            id: 1,
            title: t("Health Vitals"),
            description: t("Check your vitals"),
            icon: Activity,
            color: "bg-black",
            path: "/patient/check-vitals"
        },
        {
            id: 2,
            title: t("Food Nutrition"),
            description: t("Scan your food"),
            icon: Utensils,
            color: "bg-black",
            path: "/patient/check-calories"
        },
        {
            id: 3,
            title: t("Health Records"),
            description: t("View your history"),
            icon: Clock,
            color: "bg-black",
            path: "/profile"
        },
        {
            id: 4,
            title: t("Health Overview"),
            description: t("See your dashboard"),
            icon: Home,
            color: "bg-black",
            path: "/patient/dashboard"
        }
    ];

    const handleQuickAction = (path) => {
        navigate(path);
    };

    const handleSendMessage = () => {
        if (message.trim()) {
            const newMessage = {
                id: chatMessages.length + 1,
                text: message,
                isBot: false,
                timestamp: new Date()
            };
            setChatMessages([...chatMessages, newMessage]);
            setMessage("");

            // Simulate bot response
            setTimeout(() => {
                const botResponse = {
                    id: chatMessages.length + 2,
                    text: "I understand you're asking about that. Let me help you find the right information. You can use the quick actions above to access specific features.",
                    isBot: true,
                    timestamp: new Date()
                };
                setChatMessages(prev => [...prev, botResponse]);
            }, 1000);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter") {
            handleSendMessage();
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20  pt-[15px] lg:pt-[20px]">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-gray-200 pt-16 pb-4 px-4">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-full">
                            <MessageCircle className="w-6 h-6 text-gray-600" />
                        </div>
                        <div>
                            <PatientCardHeading title={`${t("assistant.title", "Health Assistant")}`} className="!mb-0" />
                            <p className="text-gray-600 text-sm">
                                {t("assistant.subtitle", "Your personal health companion")}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-6">
                {/* Quick Actions Section */}
                <div className="mb-6">
                    <PatientCardHeading title={`${t("assistant.quickActions", "Quick Actions")}`} />
                    <div className="grid grid-cols-1 gap-4">
                        {quickActions.map((action) => {
                            const IconComponent = action.icon;
                            return (
                                <div 
                                    key={action.id} 
                                    className="cursor-pointer"
                                    onClick={() => handleQuickAction(action.path)}
                                >
                                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 hover:shadow-md transition-all duration-200">
                                        <div className="flex items-center gap-4">
                                            {/* Icon */}
                                            <div className="flex-shrink-0">
                                                <div className="p-2 rounded-full bg-gray-100">
                                                    <IconComponent className="w-5 h-5 text-gray-600" />
                                                </div>
                                            </div>
                                            
                                            {/* Text Content */}
                                            <div className="flex-1 text-left">
                                                <h3 className="font-bold text-gray-900 text-base mb-1">
                                                    {action.title}
                                                </h3>
                                                <p className="text-gray-600 text-sm">
                                                    {action.description}
                                                </p>
                                            </div>
                                            
                                            {/* Button */}
                                            <div className="flex-shrink-0">
                                                <Button
                                                    className="bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-lg shadow-sm transition-all duration-200 flex items-center justify-center gap-2 px-4 py-2 w-32"
                                                    onClick={() => navigate(action.path)}
                                                >
                                                    {action.id === 1 ? "Scan Vitals" : 
                                                     action.id === 2 ? "Scan Food" : 
                                                     action.id === 3 ? "Records" : 
                                                     "Dashboard"}
                                                    <ArrowRight className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>


                {/* Chat Interface */}
                {/* <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                        {t("assistant.chatTitle", "Chat with Assistant")}
                    </h2>
                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm h-80 flex flex-col"> */}
                        {/* <div className="flex-1 p-6 overflow-y-auto">
                            <div className="space-y-4">
                                {chatMessages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}
                                    >
                                        <div
                                            className={`max-w-xs px-4 py-3 rounded-xl text-sm ${
                                                msg.isBot
                                                    ? 'bg-gray-100 text-gray-900'
                                                    : 'bg-gray-900 text-white'
                                            }`}
                                        >
                                            <p className="text-sm">{msg.text}</p>
                                            <p className={`text-xs mt-2 ${
                                                msg.isBot ? 'text-gray-500' : 'text-gray-300'
                                            }`}>
                                                {msg.timestamp.toLocaleTimeString([], { 
                                                    hour: '2-digit', 
                                                    minute: '2-digit' 
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div> */}
                        
                        {/* Chat Input */}
                        {/* <div className="p-6 border-t border-gray-200">
                            <div className="flex gap-3">
                                <Input
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder={t("assistant.chatPlaceholder", "Type your message...")}
                                    className="flex-1 h-10 text-sm border-gray-200 focus:ring-1 focus:ring-gray-500 focus:border-gray-500 rounded-md"
                                />
                                <Button
                                    onClick={handleSendMessage}
                                    disabled={!message.trim()}
                                    size="icon"
                                    className="h-10 w-10 bg-gray-900 hover:bg-gray-800 rounded-md transition-all duration-200"
                                >
                                    <Send className="w-4 h-4" />
                                </Button>
                            </div>
                        </div> */}
                    {/* </div>
                </div> */}
            </div>

            {/* Mobile Navigation */}
            <MobileNavigation />
        </div>
    );
};

export default Assistant;