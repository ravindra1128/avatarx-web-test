"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { VoiceProvider, useVoice } from "@humeai/voice-react";
import { HUME_PRESET_CHARACTERS, VoiceHumePresetCharacter } from "@/components/hume/hume-configs";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

const Chat = dynamic(() => import("@/components/hume/components/Chat"), {
  ssr: false,
});

export default function VoiceCallPage() {
  const { id } = useParams();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const timeout = useRef<number | null>(null);
  const [avatar, setAvatar] = useState<any>(null);

  const fetchToken = async () => {
    try {
      const response = await fetch("/api/hume", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch access token");
      }

      const data = await response.json();

      setAccessToken(data.accessToken);
    } catch (error) {
      console.error("Error fetching access token:", error);
    }
  };

  useEffect(() => {
    fetchToken();
    const avatar = HUME_PRESET_CHARACTERS.find(
      (character): character is VoiceHumePresetCharacter => character.id === Number(id)
    );

    setAvatar(avatar);
  }, [id]);

  if (!accessToken) {
    return (
      <div className={"grow flex flex-col justify-center items-center"}>
        Loading...
      </div>
    );
  }

  return (
    <VoiceProvider
      auth={{ type: "accessToken", value: accessToken }}
      configId={avatar?.hume_config_id}
      onMessage={() => {
        if (timeout.current) {
          window.clearTimeout(timeout.current);
        }
      }}
    >
      <div className={"grow flex flex-col"}>
        <div className="flex flex-row justify-start h-30 w-full pl-5 lg:pl-[125px] py-3">
          <div className="flex justify-center items-center">
            <ChevronLeft size={20} />
            <Link href="/avatars" className="z-50">
              <Button variant="link" className="hover:underline z-50 pl-0">
                Back
              </Button>
            </Link>
          </div>
        </div>
        <Chat accessToken={accessToken} id={Number(id)} />{" "}
      </div>
    </VoiceProvider>
  );
}
