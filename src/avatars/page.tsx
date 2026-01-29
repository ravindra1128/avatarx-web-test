"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Phone, Video } from "lucide-react";
import Link from "next/link";
import { HUME_PRESET_CHARACTERS } from "@/components/hume/hume-configs";
import Image from "next/image";
import { withAuth } from "@/components/withAuth";


function VoiceAvatarsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Avatars</h1>
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAvatars.map((avatar) => (
          <Card key={avatar.id} className="flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-center">
                <CardTitle>{avatar.name}</CardTitle>
              </div>
              {/* <CardDescription>{avatar.language}</CardDescription> */}
            </CardHeader>
            <CardContent className="flex flex-col h-full justify-between items-center">
              <div className="flex flex-col">
                <div className="flex justify-center items-center">
                  <Image
                    src={avatar.imageUrl}
                    alt={avatar.name}
                    className="rounded-full mb-5"
                    width={150}
                    height={150}
                    priority
                  />
                </div>
                <p className="mb-4">{avatar.description}</p>
              </div>
              <div className="flex w-full">
                <Link href={`/avatars/${avatar.type}/${avatar.id}`} className="w-full">
                  <Button className="w-full">
                    {avatar.type == "voice" ? (
                      <Phone className="mr-2 h-4 w-4" />
                    ) : (
                      <Video className="mr-2 h-4 w-4" color="white" />
                    )}{" "}
                    {avatar.type == "voice" ? "Voice" : "Video"} Call
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default withAuth(VoiceAvatarsPage, ["user", "admin"]);
