import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../Component/Cards/card"
import { Button } from "../../Component/Buttons/Button"
import { Video, Mic, User, Lock } from 'lucide-react'
import Demos from '../Demos/Demos'
import { Link } from 'react-router-dom'

const InferenceModelsPage = () => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  const inferenceModels = [
    {
      id: 'depression-video',
      title: t('inference.models.depression.title'), 
      description: t('inference.models.depression.description'),
      type: 'video',
      icon: Video,
      url: "/demos/depression"
    },
    {
      id: 'parkinsons-voice',
      title: t('inference.models.parkinsons.title'),
      description: t('inference.models.parkinsons.description'),
      type: 'voice', 
      icon: Mic,
      url: "/demos/parkinsons"
    },
    // {
    //   id: 'avatar-demo',
    //   title: t('inference.models.avatar.title'), 
    //   description: t('inference.models.avatar.description'),
    //   type: 'video',
    //   icon: User,
    //   url: "/demos/avatar"
    // },
  ];

  const handleAvatarChange = async () => {
    setIsLoading(true);
    // Add logic to stop current video
    try {
      // Add logic to switch avatar
    } catch (error) {
      console.error("Error switching avatar:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Demos />
      <div className="container mx-auto px-4">
      <h1 className="text-3xl font-bold text-center">{t('inference.title')} <sup className='text-xs text-gray-500 underline'>{t('inference.beta')}</sup></h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {inferenceModels.map((model) => (
          <Card key={model.id} className='bg-white border-2 border-gray-200'>
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                {<model.icon className="mr-2 h-6 w-6" />}
                {model.title}
                <span className="ml-2 px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">{t('inference.beta')}</span>
              </CardTitle>
              <CardDescription className='text-md'>{model.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to={`${model.url}`}>
                <Button 
                  style={{ backgroundColor: '#000000', color: '#ffffff', outline: 'none', cursor: isLoading ? 'wait' : 'pointer' }} 
                  className="cursor-pointer flex items-center !bg-[#111827] !border-[#111827] hover:!border-[#111827e6] !transition-all !duration-300 transition-colors hover:!bg-[#111827e6] text-white justify-center px-6 rounded-lg text-base w-full h-12"
                  onClick={model.id === 'avatar-demo' ? handleAvatarChange : undefined}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    t('inference.loading')
                  ) : (
                    <>
                      {/* {<Lock className="mr-2 h-6 w-6" />} */}
                      {t('inference.tryDemo')}
                    </>
                  )}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
    </>
  )
}

export default InferenceModelsPage