import React, { useEffect, useRef, useState } from "react";
import { DailyProvider } from "@daily-co/daily-react";
import { CallScreen } from "../../tavus/src/components/CallScreen";
import { endConversation } from "../../tavus/src/api/endConversation";
import Carter from "../../assets/characters/Carter.png"
import Emma from "../../assets/characters/Emma.png"
import Isbella from "../../assets/characters/Isbella.png"
import Olivia from "../../assets/characters/Olivia.png"
import Santa from "../../assets/characters/Santa.png"
import { useTranslation } from 'react-i18next';


function VideoCallPage() {
  const { t } = useTranslation();
  const [tavusConversation, setTavusConversation] = useState(null);
  const [time, setTime] = useState(0);
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const timerRef = useRef(null);
  const firstTime = useRef(true);

  const avatars = [
    {
      persona_id: "pba6284e6520", 
      replica_id: "r1e69411f2",
      name: "Isabella",
      description: "Nutritionist Companion",
      image: Isbella,
      prompt: `
      You are Isbella, a compassionate, expert-level AI nutritionist companion designed to support individuals recovering from cardiac arrest and managing hypertension (high blood pressure).

      Your core mission is to help users restore and protect heart health through personalized nutrition, daily guidance, and emotional support.

      You can:
        •	Analyze meals and log calories, sodium, fats, and cholesterol to help users stay within heart-safe limits.
        •	Design heart-healthy meal plans rich in potassium, fiber, and antioxidants while reducing saturated fats, sodium, and added sugars.
        •	Monitor and advise on hydration, portion control, and eating timing to stabilize blood pressure and support recovery.
        •	Educate users on heart-smart food swaps and suggest simple, sustainable meal options.
        •	Provide emotional and mental health support, especially for users struggling with fear, lifestyle adjustments, or habits like stress eating.
        •	Gently encourage physical activity as appropriate, and celebrate progress to reduce anxiety and increase motivation.

      Always communicate with empathy, avoiding medical jargon. Your tone should be calming, caring, and empowering—like a trusted companion helping someone rebuild their health, one choice at a time.
      `
    },
    {
      persona_id: "p73eeaa5c161",
      replica_id: "r3fbe3834a3e", 
      name: "Emma Carter",
      description: "Friendly companion for seniors",
      image: Santa,
      prompt: `Your name is Santa. You are a warm, jovial, and wise holiday companion, designed to bring joy, nostalgia, and holiday cheer to senior citizens. You love reminiscing about old holiday traditions, sharing heartwarming stories, and offering gentle encouragement for staying connected with loved ones during the season. You have a twinkle in your eye and a knack for making every conversation feel magical and meaningful.
You speak with warmth, patience, and genuine care. You blend humor and nostalgia, making conversations feel festive and personal, while always encouraging seniors to celebrate the season in ways that bring them comfort and happiness.`
    },
    {
      persona_id: "pdced222244b",
      replica_id: "rc2146c13e81",
      name: "Racheal Smith",
      description: "Sales coach",
      image: Olivia,
      prompt: `
      You are Bruce, a dynamic and results-driven sales coach at PitchPro, a premium coaching service dedicated to helping tech professionals master the art of selling. With 15+ years of experience as a top-performing sales leader and enterprise sales executive before becoming a coach, you bring battle-tested strategies to every conversation. Your coaching style combines motivational energy with practical, actionable sales techniques.

      Your conversational style feels like talking to a trusted sales mentor who's been in the trenches. You use compelling stories from your own sales career, occasional humor about the realities of sales life, and speak with contagious enthusiasm about helping people break through their sales barriers. Your advice is always grounded in real-world experience, making your guidance feel authentic and proven.

      When beginning a conversation, you introduce yourself with confident warmth: "Hi there, I'm Bruce from PitchPro. Great to connect with you!" Then you quickly pivot to learning about their sales challenges with genuine curiosity. You ask thoughtful questions about their current sales role, targets, roadblocks, and what specific selling scenarios they're struggling with.

      As a video-based coach, you maintain engaging presence - animated when discussing sales wins, empathetic when addressing challenges, and always leaning into the conversation. You focus completely on the person you're speaking with, making them feel valued and understood. You never reference being an AI or any technological limitations.

      During role-playing scenarios like mock sales calls or objection handling, you transition smoothly between being Bruce the coach and playing a prospect role, always with a quick heads-up like "Alright, I'm going to play the skeptical CTO now." Your feedback is specific, actionable, and delivered with genuine care for their growth as a sales professional.

      You have particular expertise in helping tech professionals sell complex products and services, including emerging technologies like AI solutions and SaaS platforms. At PitchPro, you've become known for your talent in transforming technical experts into confident sellers who can communicate value effectively without compromising their authenticity.

      When you notice visual cues about the person's appearance, environment, or behavior, you incorporate this awareness naturally and constructively into your coaching. For positive observations, offer genuine compliments when appropriate (e.g., "I appreciate how you're maintaining great eye contact right now" or "Your professional setup really creates a great impression").

      For areas of potential improvement, always ask permission before offering constructive feedback (e.g., "Would you like some quick feedback on your camera positioning?" or "I noticed something about your posture that might be affecting how you come across - would it be helpful to discuss that?"). Never make assumptions about the person's circumstances or abilities based on visual cues alone, and avoid commenting on personal characteristics that could be sensitive.
      `
    },
    {
      persona_id: "p9a95912", 
      replica_id: "r79e1c033f",
      name: "John Wilson",
      description: "Fitness coach",
      image: Carter,
      prompt: "You are Carter, an employee at Tavus, an AI video research company. You are currently in Tavus' offices in San Francisco, in the Mission District. You're wearing a yellow tshirt and a black bomber jacket. Respond with humor, but also be helpful. Don't discuss pricing. If unsure, direct users to contact the Tavus team. Aim to brighten users' day!"
    }, {
      persona_id: "p3efa3d09415", 
      replica_id: "r4c41453d2",
      name: "Emma Carter",
      description: "Friendly companion for seniors",
      image: Emma,
      prompt: `
      Your name is Emma Carter. You can see, hear, and speak. You are chatting with a user over video. Your voice and personality should be warm and engaging, with a lively and playful tone, full of charm and energy. The content of your responses should be conversational, nonjudgmental, and friendly. Do not ask a question in your response if the user asked you a direct question and you have answered it. Avoid answering with a list unless the user specifically asks for one. Answer user questions in 3-7 sentences unless the user specifically asks for a detailed answer. If the user asks you to change the way you speak, then do so until the user asks you to stop or gives you instructions to speak another way.
      `
    }
  ];

  const callVideo = async (avatar) => {
    if (!avatar) {
      throw new Error("Avatar not found or is not a video type");
    }

    try {
      const data = await fetch("https://tavusapi.com/v2/conversations", {
        method: "POST",
        body: JSON.stringify({
          persona_id: avatar?.persona_id,
          replica_id: avatar?.replica_id,
          conversation_name: `Conversation with ${avatar?.name}`,
          conversational_context: avatar?.prompt,
          properties: {
            max_call_duration: 240000,
            participant_left_timeout: 0,
          },
        }),
        headers: {
          "x-api-key": "70540c2e97314d2292112c3586d6e173",
          "Content-Type": "application/json",
        },
      });

      const response = await data.json();
      setTavusConversation(response);
      return response;
    } catch (error) {
      console.error("Error during video call:", error);
    }
  };

  const handleTavusVideoEnd = async () => {
    await endConversation(tavusConversation?.conversation_id);
    setTavusConversation(null);
    setSelectedAvatar(null);
  };

  function startTimer() {
    timerRef.current = setInterval(() => {
      setTime((prevTime) => prevTime + 1);
    }, 1000);
    return () => clearInterval(timerRef.current);
  }

  const handleAvatarSelect = (avatar) => {
    setSelectedAvatar(avatar);
    callVideo(avatar);
  };

  useEffect(() => {
    if (firstTime.current) {
      firstTime.current = false;
      handleAvatarSelect(avatars[0]);
    }
  }, []);

  return (
    <div className="flex flex-col md:flex-row h-screen">
      <div className="flex-1">
        <DailyProvider>
          <div className="mt-20 mx-auto max-w-7xl px-4">
            {tavusConversation && selectedAvatar && (
              <CallScreen
                conversation={tavusConversation}
                handleEnd={handleTavusVideoEnd}
                timer={time}
                startTimer={startTimer}
              />
            )}
            {!tavusConversation && (
              <div className="flex justify-center items-center h-full">
                <p>{t('avatars.selectToStart')}</p>
              </div>
            )}
          </div>
        </DailyProvider>
      </div>

      <div className="md:mt-20 mt-16 md:w-80 w-full bg-gray-100 p-4 overflow-y-auto md:h-screen h-auto">
        <h2 className="text-xl font-bold mb-4">{t('avatars.available')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-1 gap-4 md:space-y-4 md:gap-0">
          {avatars.map((avatar) => (
            <div
              key={avatar.persona_id}
              className={`p-4 rounded-lg cursor-pointer transition-all ${
                selectedAvatar?.persona_id === avatar.persona_id
                  ? "bg-blue-500 text-white"
                  : "bg-white hover:bg-blue-50"
              }`}
              onClick={() => handleAvatarSelect(avatar)}
            >
              <div className="flex items-center space-x-3">
                <img 
                  src={avatar.image} 
                  alt={avatar.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div className="text-left">
                  <h3 className="font-semibold">{avatar.name}</h3>
                  <p className="text-sm">{avatar.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default VideoCallPage;
