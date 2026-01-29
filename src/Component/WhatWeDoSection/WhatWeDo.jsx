import "aos/dist/aos.css";
import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ImageBaseURL } from "../../config/BaseURL";
import rpmImage from "../../../public/images/image1.jpg";
import rpmHoverImage from "../../../public/images/continuous-health-monitoring-hover.webp";
import rpmPreventativeProgramsHoverImage from "../../../public/images/preventative-programs-hover.webp";
import "./WhatWeDo.css";
function WhatWeDo() {
  const { t } = useTranslation();
  const services = [
    {
      title: t('landing.whatWeDo.chronicCare.title'),
      image: `${ImageBaseURL}/preventive_programs.jpg`,
      backfaceimage: rpmPreventativeProgramsHoverImage,
      backfacecontent: t('landing.whatWeDo.chronicCare.description'),
      link: "/chronic-care-management",
    },
    {
      title: t('landing.whatWeDo.remoteMonitoring.title'),
      image: rpmImage,
      backfaceimage: rpmHoverImage,
      backfacecontent: t('landing.whatWeDo.remoteMonitoring.description'),
      link: "/remote-patient-monitoring",
    },
  ];

  const navigate = useNavigate();
  return (
    <section className="what-we-do overflow-x-hidden" id="what-we-do">
      <div className="inner-we-do">
        <div className="header">
          <h2 id="what-we-do" className="test-cls2" data-aos="fade-up">
            {t('landing.whatWeDo.title')}
          </h2>
          <p data-aos="fade-up">
            {t('landing.whatWeDo.subtitle')}
          </p>
        </div>
        <ul className="services-container">
          {services.map((service, index) => (
            <li key={index} data-aos="fade-up" data-aos-delay="0">
              <div className="relative h-full flip-card">
                <div className="flip-card-inner">
                  <div className="service-item flip-card-front">
                    <img
                      src={service.image}
                      alt={service.title}
                      width={1000}
                      height={600}
                      crossOrigin="anonymous"
                    />
                    <div className="service-info">
                      <p>{service.title}</p>
                      <span
                        className="arrow"
                        onClick={() => navigate(service.link)}
                      >
                        →
                      </span>
                    </div>
                  </div>
                  <a
                    aria-label="Learn more about Ongoing Care"
                    className="absolute inset-0 bg-white rounded-[30px] md:rounded-[40px] overflow-hidden flip-card-back"
                    href={service.link}
                  >
                    <div className="p-[16px] pl-[16px] pr-[10px] fg-secondary-500">
                      <h4 className="text-[16px] lg:text-[21px] text-left lh-1.2 -ls-0.4 max-w-[200px] text-black font-normal">
                        {service.title}
                      </h4>
                      <p className="text-[14px] lg:text-[16px] text-left mt-[10px] lh-1.25 -ls-0.8 fw-400 text-black font-normal">
                        {service.backfacecontent}
                      </p>
                    </div>
                    <img
                      src={service.backfaceimage}
                      alt=""
                      width={1000}
                      height={800}
                    />
                    <div className="absolute bottom-0 right-0 mr-[15px] mb-[20px] w-[26px] md:w-[35px] flex h-[26px] md:h-[35px] rounded-[100px] bg-black hover:bg-secondary-500">
                      <svg
                        stroke="#fff"
                        fill="#fff"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-20 md:w-28 m-auto"
                        height="1em"
                        width="1em"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                      </svg>
                    </div>
                  </a>
                  <div className="absolute -z-1 inset-0 rounded-[30px] md:rounded-[40px] bg-black flip-card-background"></div>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <div className="platform-info mt-10">
          <div className="platform-content">
            <p data-aos="fade-right">
              {t('landing.whatWeDo.platformInfo', { ns: undefined })}
            </p>
          </div>
          <div className="platform-imagebx">
            <img
              src={`${ImageBaseURL}/avatarAxAi.png`}
              alt="Platform Overview"
              className="platform-image"
              width={1000}
              height={600}
              crossOrigin="anonymous"
              data-aos="fade-left"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default WhatWeDo;
