import React from "react";
import { useTranslation } from "react-i18next";
import BoxContent from "../../../public/box-pattern.svg";
import JourneyConnecting from "../../../public/journey-connecting.svg";
import { ImageBaseURL } from "../../config/BaseURL";
import "./PatientJourney.css";

function PatientJourney() {
  const { t } = useTranslation();
  return (
    <div className="patient-journey-container" id="technology">
      <section className="intro-text">
        <h2 data-aos="fade-up">
          {t('landing.patientJourney.title')}
        </h2>
      </section>

      <div className="data-collection-container">
        <div className="journey-box" data-aos="fade-up" data-aos-delay="250">
          <img src={BoxContent} alt="AvatarX Health" />
          <div className="header">
            <span className="step-number">1</span>
            <span className="title">{t('landing.patientJourney.physiologicalData')}</span>
          </div>
        </div>
        <div
          className="journey-connecting-img"
          data-aos="fade-up"
          data-aos-delay="250"
        >
          <img src={JourneyConnecting} alt="AvatarX Health" />
        </div>
        <div className="center-panel" data-aos="fade-up" data-aos-delay="250">
          <img
            src={`${ImageBaseURL}/eco-system.webp`}
            alt="Heart"
            className="heart-image"
            crossOrigin="anonymous"
          />
        </div>
      </div>
    </div>
  );
}

export default PatientJourney;
