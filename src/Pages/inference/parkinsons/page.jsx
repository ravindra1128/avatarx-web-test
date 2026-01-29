import React from 'react';
import VideoInference from "../../../Component/inference/Parkinsons/VideoInference";
import { Button } from "../../../Component/Buttons/Button";
import { ChevronLeft } from "lucide-react";
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next';
const InferencePage = () => {
  const { t } = useTranslation();
  return (
    <div className="container mx-auto pb-10 mt-16">
      <div className="flex flex-row justify-start h-30 w-full py-3">
        <div className="flex justify-center items-center">
          <ChevronLeft size={20} />
          <Link to="/demos">
            <Button variant="link" className="hover:underline z-50 pl-0">
            {t('common.back')}
            </Button>
          </Link>
        </div>
      </div>
      <h1 className="text-2xl font-bold mb-7 mt-16 text-center">
        {t('inference.models.parkinsons.title')}
      </h1>
      <VideoInference />
    </div>
  );
}

export default InferencePage;
