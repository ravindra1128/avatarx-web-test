import CCMIMage from "../../../public/images/ccm-image.jpg";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ImageBaseURL } from '../../config/BaseURL';
import { useTranslation } from 'react-i18next';

const AccordionItem = ({ title, content }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={isOpen ? "mb-4 accordion-active" : "mb-4"}>
      <button
        className="w-full flex justify-between items-center p-4 text-lg font-semibold accordion-btn transition"
        onClick={() => setIsOpen(!isOpen)}
      >
        {title}
        <span className="text-xl flex-none">{isOpen ? "−" : "+"}</span>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? "max-h-50 p-4" : "max-h-0 p-0"
        }`}
      >
        <p className="text-gray-700">{content}</p>
      </div>
    </div>
  );
};

const RemotePatientMonitoring = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const accordionData = [
    {
      title: t('remotePatientMonitoring.accordion.q1'),
      content: t('remotePatientMonitoring.accordion.a1'),
    },
    {
      title: t('remotePatientMonitoring.accordion.q2'),
      content: t('remotePatientMonitoring.accordion.a2'),
    },
    {
      title: t('remotePatientMonitoring.accordion.q3'),
      content: t('remotePatientMonitoring.accordion.a3'),
    },
  ];
  return (
    <div>
      <section className="inner-hero-section">
        <div className="hero-gradient"></div>
        <div className="position-relative">
          <img src={CCMIMage} className="hero-banner" alt="Remote Patient Monitoring - AvatarX Health" />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 857 186"
            className="hero-pattern"
          >
            <path
              fill="#fff"
              d="M777 54c24.5 0 40 17.906 40 40v52c0 22.094 17.906 40 40 40H0V0v14c0 22.094 17.906 40 40 40z"
            ></path>
          </svg>
        </div>
        <div className="inner-hero-content">
          <h4 className="eyebrow-heading text-left">{t('remotePatientMonitoring.eyebrow')}</h4>
          <h2 className="heading text-left">{t('remotePatientMonitoring.heroTitle')}</h2>
        </div>
      </section>
      <section className="ccm-content">
        <div className="grid-content">
          <div className="lg:w-4/5">
            <h2
              className="section-heading"
              data-aos="fade-up"
              data-aos-duration="500"
            >
              {t('remotePatientMonitoring.section1Heading')}
            </h2>
          </div>
          <div
            className="lg:w-1/5 flex-none"
            data-aos="fade-down"
            data-aos-duration="500"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 131 157"
              className="ccm-svg w-[110px] lg:w-[131px]"
            >
              <path
                fill="url(#StroyDecorationTop_svg__a)"
                fillRule="evenodd"
                d="M15.272 113.45c.027-15.605 12.693-28.237 28.296-28.223 15.606.014 28.25 12.668 28.25 28.273s-12.644 28.259-28.25 28.273c-15.603.014-28.27-12.618-28.296-28.223z"
                clipRule="evenodd"
              ></path>
              <path
                stroke="#FC1754"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeOpacity="0.451"
                strokeWidth="0.986"
                d="M8.5 113.511c.027-19.32 15.703-34.964 35.023-34.951s34.977 15.679 34.977 35-15.654 34.986-34.975 35c-19.32.014-34.998-15.63-35.025-34.951z"
              ></path>
              <path
                stroke="#FC1754"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeOpacity="0.149"
                strokeWidth="0.988"
                d="M1 113.452c.027-23.464 19.063-42.465 42.525-42.45C66.988 71.015 86 90.04 86 113.502s-19.014 42.486-42.475 42.499S1.027 137.013 1 113.551z"
              ></path>
              <path
                fill="#fff"
                fillRule="evenodd"
                d="M52.324 109.55c0-4.645-4.18-8.401-8.824-8.401s-8.824 3.762-8.824 8.4c0 1.849.787 3.345 1.8 4.776h-.017c.65.895 1.275 1.056 1.879 2.087.877 1.503 1.078 2.427 1.115 3.321.024.509.441.91.953.912h.532a.24.24 0 0 0 .238-.238v-5.635a1.9 1.9 0 0 0-.203-.852l-1.252-2.504a.626.626 0 0 1 .558-.906.62.62 0 0 1 .559.351l1.51 3.065c.13.262.195.548.195.84v5.64a.24.24 0 0 0 .238.24h1.432a.24.24 0 0 0 .238-.24v-5.64c0-.292.065-.578.197-.84l1.514-3.077a.599.599 0 0 1 1.05-.075c.12.184.128.419.024.612l-1.27 2.54c-.13.268-.202.56-.202.852v5.629a.24.24 0 0 0 .238.238h.596a.953.953 0 0 0 .953-.894c.054-.918.28-1.926 1.097-3.339.602-1.031 1.229-1.192 1.88-2.087h-.006c1.013-1.43 1.8-2.927 1.8-4.775zm-9.896 16.402h2.146a.837.837 0 0 0 .836-.835.84.84 0 0 0-.836-.835h-2.146a.837.837 0 0 0-.836.835c0 .459.377.835.836.835m-1.194-2.624h4.532a.836.836 0 0 0 .836-.834.84.84 0 0 0-.836-.835h-4.53a.84.84 0 0 0-.836.835c0 .459.377.834.836.834z"
                clipRule="evenodd"
              ></path>
              <path
                fill="url(#StroyDecorationTop_svg__b)"
                fillRule="evenodd"
                d="M72.473 35.54c.023-12.343 10.042-22.334 22.386-22.322 12.342.011 22.343 10.02 22.343 22.364.001 12.343-9.999 22.353-22.343 22.365s-22.363-9.98-22.386-22.323z"
                clipRule="evenodd"
              ></path>
              <path
                stroke="#1279BA"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeOpacity="0.451"
                strokeWidth="0.5"
                d="M66.624 35.458c.023-15.596 12.679-28.223 28.274-28.211 15.596.011 28.232 12.658 28.232 28.253s-12.637 28.241-28.233 28.253c-15.594.01-28.25-12.617-28.273-28.212z"
              ></path>
              <path
                stroke="#1279BA"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeOpacity="0.149"
                strokeWidth="0.5"
                d="M59.877 35.458C59.9 16.136 75.577.488 94.898.5s34.979 15.678 34.979 35-15.657 34.988-34.979 35c-19.321.011-34.998-15.636-35.021-34.958z"
              ></path>
              <path
                fill="#fff"
                fillRule="evenodd"
                d="M99.107 23.91h-8.458a3.17 3.17 0 0 0-3.173 3.174v16.918c0 .841.335 1.648.93 2.243a3.17 3.17 0 0 0 2.243.929h8.46a3.168 3.168 0 0 0 3.172-3.172V27.084a3.17 3.17 0 0 0-3.172-3.173zm-2.115 21.15h-4.23v-1.058h4.23zm3.436-3.174H89.326V27.085h11.102z"
                clipRule="evenodd"
              ></path>
              <defs>
                <linearGradient
                  id="StroyDecorationTop_svg__a"
                  x1="21.831"
                  x2="62.035"
                  y1="95.236"
                  y2="134.818"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#FFADE9"></stop>
                  <stop offset="0.522" stopColor="#FC668E"></stop>
                  <stop offset="1" stopColor="#FC1754"></stop>
                </linearGradient>
                <linearGradient
                  id="StroyDecorationTop_svg__b"
                  x1="112.013"
                  x2="80.211"
                  y1="21.135"
                  y2="52.445"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#95D6FF"></stop>
                  <stop offset="0.522" stopColor="#2592D6"></stop>
                  <stop offset="1" stopColor="#005388"></stop>
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
        <div className="grid-content justify-content-end mt-10">
          <div className="lg:w-1/3 flex-none">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              data-aos="fade-down"
              data-aos-duration="500"
              fill="none"
              viewBox="0 0 77 77"
              className="ccm-svg2 w-[60px] h-auto lg:w-[76px] ml-auto mr-25"
            >
              <g clipPath="url(#StroyDecorationBottom_svg__a)">
                <path
                  fill="url(#StroyDecorationBottom_svg__b)"
                  fillRule="evenodd"
                  d="M13.15 38.243c.028-13.899 11.31-25.147 25.209-25.133s25.158 11.285 25.157 25.184c0 13.898-11.26 25.169-25.158 25.182-13.898.014-25.18-11.234-25.208-25.133z"
                  clipRule="evenodd"
                ></path>
                <path
                  stroke="#FC1754"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeOpacity="0.451"
                  strokeWidth="0.984"
                  d="M7.173 38.296C7.201 21.12 21.141 7.212 38.318 7.226c17.178.013 31.095 13.942 31.095 31.12 0 17.177-13.918 31.106-31.095 31.12S7.201 55.571 7.173 38.394z"
                ></path>
                <path
                  stroke="#FC1754"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeOpacity="0.149"
                  strokeWidth="0.987"
                  d="M.494 38.244C.52 17.378 17.45.48 38.318.494c20.867.013 37.776 16.933 37.776 37.8s-16.91 37.786-37.776 37.8S.521 59.208.494 38.341z"
                ></path>
                <path
                  fill="#fff"
                  fillRule="evenodd"
                  d="M48.94 48.025h-1.934v-.97h-.97v.97h-1.93v-.97h-.97v.97H41.2v-.97h-.97v.97h-1.933v-.97h-.97v.97h-1.934v-.97h-.97v.97h-4.26l5.1-3.065 2.526-7.378 3.75 6.59 7.265-12.106-1.66-.998-5.561 9.27-4.236-7.444-3.686 10.77-5.048 3.034v-19.97H26.68v23.23h23.23v-2.903h-.97zm0-21.296h.97v.97h-.97zm-2.904 0h.97v.97h-.97zm-2.9 0h.97v.97h-.97zm-2.904 0h.97v.97h-.97zm-2.904 0h.97v.97h-.97zm-2.904 0h.97v.97h-.97zm-2.904 0h.97v.97h-.97zm-2.903 0h.97v.97h-.97zm20.323 2.904h.97v.97h-.97zm-2.904 0h.97v.97h-.97zm-2.9 0h.97v.97h-.97zm-2.904 0h.97v.97h-.97zm-2.904 0h.97v.97h-.97zm-2.904 0h.97v.97h-.97zm-2.904 0h.97v.97h-.97zm-2.903 0h.97v.97h-.97zm20.323 2.9h.97v.97h-.97zm-5.805 0h.97v.97h-.97zm-2.903 0h.97v.97h-.97zm-5.808 0h.97v.97h-.97zm-2.904 0h.97v.97h-.97zm-2.903 0h.97v.97h-.97zm20.323 2.905h.97v.97h-.97zm-8.708 0h.97v.97h-.97zm-5.808 0h.97v.97h-.97zm-2.904 0h.97v.97h-.97zm-2.903 0h.97v.97h-.97zm20.323 2.905h.97v.97h-.97zm-2.904 0h.97v.97h-.97zm-14.516 0h.97v.97h-.97zm-2.903 0h.97v.97h-.97zm20.323 2.904h.97v.97h-.97zm-2.904 0h.97v.97h-.97zm-8.708 0h.97v.97h-.97zm-5.808 0h.97v.97h-.97zm-2.903 0h.97v.97h-.97zm20.323 2.9h.97v.97h-.97zm-2.904 0h.97v.97h-.97zm-2.9 0h.97v.97h-.97zm-5.808 0h.97v.97h-.97zm-8.711 0h.97v.97h-.97z"
                  clipRule="evenodd"
                ></path>
              </g>
              <defs>
                <linearGradient
                  id="StroyDecorationBottom_svg__b"
                  x1="18.993"
                  x2="54.803"
                  y1="22.025"
                  y2="57.281"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#FFADE9"></stop>
                  <stop offset="0.522" stopColor="#FC668E"></stop>
                  <stop offset="1" stopColor="#FC1754"></stop>
                </linearGradient>
                <clipPath id="StroyDecorationBottom_svg__a">
                  <path fill="#fff" d="M0 0h76.587v76.587H0z"></path>
                </clipPath>
              </defs>
            </svg>
          </div>
          <div className="lg:w-2/3 text-left">
            <p
              className="section-text"
              data-aos="fade-up"
              data-aos-duration="500"
            >
              {t('remotePatientMonitoring.section1Text')}
            </p>
            <button
              className="cta-button"
              onClick={() =>
                (window.location.href =
                  "https://calendly.com/phanig/30-minute?month=2025-02")
              }
              data-aos="fade-up"
              data-aos-duration="500"
            >
              {t('remotePatientMonitoring.section1Button')}
            </button>
          </div>
        </div>
      </section>
      <section className="section-card counter-section relative z-1">
        <h2
          className="section-heading relative z-1"
          data-aos="fade-up"
          data-aos-duration="500"
        >
          {t('remotePatientMonitoring.section2Heading')}
        </h2>
        <ul className="flex flex-wrap">
          <li
            className="text-left p-5 w-full xs:w-1/2 lg:w-1/4"
            data-aos="fade-up"
            data-aos-duration="500"
            data-aos-delay="0"
          >
            <div className="relative inline-block">
              <p className="counter-number">{t('remotePatientMonitoring.counter1.number')}</p>
            </div>
            <div className="mt-5 mb-5 md:mr-35 xl:mr-70 border-b bg-[#c9cdcf]"></div>
            <div>
              <p className="counter-text">
                {t('remotePatientMonitoring.counter1.text')}
              </p>
            </div>
          </li>
          <li
            className="text-left p-5 w-full xs:w-1/2 lg:w-1/4"
            data-aos="fade-up"
            data-aos-duration="500"
            data-aos-delay="250"
          >
            <div className="relative inline-block">
              <p className="counter-number">{t('remotePatientMonitoring.counter2.number')}</p>
            </div>
            <div className="mt-5 mb-5 md:mr-35 xl:mr-70 border-b bg-[#c9cdcf]"></div>
            <div>
              <p className="counter-text">{t('remotePatientMonitoring.counter2.text')}</p>
            </div>
          </li>
          <li
            className="text-left p-5 w-full xs:w-1/2 lg:w-1/4"
            data-aos="fade-up"
            data-aos-duration="500"
            data-aos-delay="500"
          >
            <div className="relative inline-block">
              <p className="counter-number">{t('remotePatientMonitoring.counter3.number')}</p>
            </div>
            <div className="mt-5 mb-5 md:mr-35 xl:mr-70 border-b bg-[#c9cdcf]"></div>
            <div>
              <p className="counter-text">{t('remotePatientMonitoring.counter3.text')}</p>
            </div>
          </li>
          <li
            className="text-left p-5 w-full xs:w-1/2 lg:w-1/4"
            data-aos="fade-up"
            data-aos-duration="500"
            data-aos-delay="750"
          >
            <div className="relative inline-block">
              <p className="counter-number">{t('remotePatientMonitoring.counter4.number')}</p>
            </div>
            <div className="mt-5 mb-5 md:mr-35 xl:mr-70 border-b bg-[#c9cdcf]"></div>
            <div>
              <p className="counter-text">{t('remotePatientMonitoring.counter4.text')}</p>
            </div>
          </li>
        </ul>
        <div className="bg-pattern absolute w-[100%] inset-y-0 -inset-x-280 -z-1 flex">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 1204 1203"
            className="m-auto w-full h-full"
          >
            <path
              fill="url(#OutcomesBackground_svg__a)"
              d="M601.6 1a611 611 0 0 0-61.409 3.1 603 603 0 0 0-59.634 9.092A598 598 0 0 0 423 27.975a599 599 0 0 0-55.18 20.176 601 601 0 0 0-52.5 25.266 603 603 0 0 0-49.519 30.054 605 605 0 0 0-46.236 34.541 606 606 0 0 0-42.651 38.726 607 607 0 0 0-38.764 42.609 605 605 0 0 0-34.575 46.191 603 603 0 0 0-30.084 49.471A599 599 0 0 0 48.2 367.458 599 599 0 0 0 28 422.583a598 598 0 0 0-14.8 57.5 601 601 0 0 0-9.1 59.575 608.5 608.5 0 0 0 0 122.7 601 601 0 0 0 9.1 59.575 597 597 0 0 0 14.8 57.5 598 598 0 0 0 20.2 55.125A599 599 0 0 0 73.488 887a602 602 0 0 0 30.084 49.47 605 605 0 0 0 34.575 46.191 607 607 0 0 0 38.764 42.609 606 606 0 0 0 42.65 38.73 606 606 0 0 0 46.236 34.54 603 603 0 0 0 49.519 30.05 601 601 0 0 0 52.5 25.27 599 599 0 0 0 55.18 20.18 599 599 0 0 0 57.557 14.78 600 600 0 0 0 59.634 9.09 610.3 610.3 0 0 0 122.817 0 600 600 0 0 0 59.633-9.09 599 599 0 0 0 57.557-14.78 599 599 0 0 0 55.18-20.18 600 600 0 0 0 52.5-25.27c16.9-9.17 33.56-19.28 49.519-30.05a606 606 0 0 0 46.236-34.54 604.072 604.072 0 0 0 81.411-81.335 603 603 0 0 0 34.58-46.191 603 603 0 0 0 30.08-49.47 596.3 596.3 0 0 0 45.49-107.574 598 598 0 0 0 14.8-57.5 599 599 0 0 0 9.1-59.575 607.6 607.6 0 0 0 0-122.7 599 599 0 0 0-9.1-59.575 592 592 0 0 0-14.8-57.5 596.739 596.739 0 0 0-45.49-107.574 603 603 0 0 0-30.08-49.471 603 603 0 0 0-34.58-46.191 605 605 0 0 0-38.76-42.609 607 607 0 0 0-42.651-38.726 606 606 0 0 0-46.236-34.541 603 603 0 0 0-49.519-30.054 601 601 0 0 0-52.5-25.266 598 598 0 0 0-55.18-20.176 599 599 0 0 0-57.557-14.785A603 603 0 0 0 663 4.1 611 611 0 0 0 601.6 1m0-1c332.252 0 601.6 269.08 601.6 601.006S933.857 1202.01 601.6 1202.01 0 932.932 0 601.006 269.343 0 601.6 0"
            ></path>
            <path
              fill="url(#OutcomesBackground_svg__b)"
              d="M601.004 189.736a417 417 0 0 0-41.93 2.117 411 411 0 0 0-40.718 6.214 407 407 0 0 0-39.3 10.105 410 410 0 0 0-37.677 13.79 411.3 411.3 0 0 0-218.238 218.239 409 409 0 0 0-13.79 37.677c-4 12.866-7.4 26.089-10.105 39.3a411 411 0 0 0-6.215 40.718 416.3 416.3 0 0 0 0 83.861 411 411 0 0 0 6.214 40.718c2.7 13.212 6.1 26.434 10.105 39.3 3.957 12.722 8.6 25.4 13.79 37.677A411.3 411.3 0 0 0 441.379 977.69a409 409 0 0 0 37.677 13.79c12.866 4 26.089 7.4 39.3 10.1 13.46 2.76 27.05 4.83 40.718 6.22a416.7 416.7 0 0 0 83.861 0 408 408 0 0 0 40.718-6.22 405 405 0 0 0 39.3-10.1c12.722-3.957 25.4-8.6 37.677-13.79a411.3 411.3 0 0 0 218.238-218.238 409 409 0 0 0 13.79-37.677 408 408 0 0 0 10.102-39.3c2.75-13.46 4.83-27.05 6.22-40.718a416.7 416.7 0 0 0 0-83.861 411 411 0 0 0-6.22-40.718 407 407 0 0 0-10.102-39.3 410 410 0 0 0-13.79-37.677 411.29 411.29 0 0 0-218.239-218.238 409 409 0 0 0-37.677-13.79c-12.866-4-26.089-7.4-39.3-10.105a411 411 0 0 0-40.718-6.214 417 417 0 0 0-41.93-2.118m0-1c227.039 0 411.086 184.051 411.086 411.09S828.043 1010.92 601.004 1010.92s-411.09-184.055-411.09-411.094 184.051-411.09 411.09-411.09"
            ></path>
            <defs>
              <linearGradient
                id="OutcomesBackground_svg__a"
                x1="173.261"
                x2="1064.19"
                y1="399.068"
                y2="1071.84"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#FF9AFB"></stop>
                <stop offset="0.346" stopColor="#F7F7F7"></stop>
                <stop offset="0.52" stopColor="#EEE"></stop>
                <stop offset="1" stopColor="#24B5F4"></stop>
              </linearGradient>
              <linearGradient
                id="OutcomesBackground_svg__b"
                x1="308.308"
                x2="917.543"
                y1="461.7"
                y2="921.298"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#FF9AFB"></stop>
                <stop offset="0.346" stopColor="#F7F7F7"></stop>
                <stop offset="0.52" stopColor="#EEE"></stop>
                <stop offset="1" stopColor="#24B5F4"></stop>
              </linearGradient>
            </defs>
          </svg>
        </div>
      </section>
      <div className="main-grid-container">
        <section
          className="grid-section !mt-10"
          data-aos="fade-up"
          data-aos-duration="500"
        >
          <div className="absolute -z-1 inset-0 bg-grid"></div>
          <div className="inner-grid">
            <div
              data-aos="fade-right"
              data-aos-duration="500"
              data-aos-delay="250"
            >
              <h3 className="grid-heading">{t('remotePatientMonitoring.section3Card1Heading')}</h3>
              <p className="grid-text">
                {t('remotePatientMonitoring.section3Card1Text')}
              </p>
            </div>
            <div
              data-aos="fade-left"
              data-aos-duration="500"
              data-aos-delay="250"
            >
              <img src={`${ImageBaseURL}/patient-outcomes.jpg`} alt={""}  crossOrigin="anonymous"/>
            </div>
          </div>
        </section>
        <section
          className="grid-section"
          data-aos="fade-up"
          data-aos-duration="500"
        >
          <div className="absolute -z-1 inset-0 bg-grid"></div>
          <div className="inner-grid">
            <div
              data-aos="fade-right"
              data-aos-duration="500"
              data-aos-delay="250"
            >
              <img src={`${ImageBaseURL}/patient-experience.jpg`} alt={""}  crossOrigin="anonymous"/>
            </div>
            <div
              data-aos="fade-left"
              data-aos-duration="500"
              data-aos-delay="250"
            >
              <h3 className="grid-heading">
                {t('remotePatientMonitoring.section3Card2Heading')}
              </h3>
              <p className="grid-text">
                {t('remotePatientMonitoring.section3Card2Text')}
              </p>
            </div>
          </div>
        </section>
        <section
          className="grid-section"
          data-aos="fade-up"
          data-aos-duration="500"
        >
          <div className="absolute -z-1 inset-0 bg-grid"></div>
          <div className="inner-grid">
            <div
              data-aos="fade-right"
              data-aos-duration="500"
              data-aos-delay="250"
            >
              <h3 className="grid-heading">
                {t('remotePatientMonitoring.section3Card3Heading')}
              </h3>
              <p className="grid-text">
                {t('remotePatientMonitoring.section3Card3Text')}
              </p>
            </div>
            <div
              data-aos="fade-left"
              data-aos-duration="500"
              data-aos-delay="250"
            >
              <img src={`${ImageBaseURL}/patient-engagement.jpg`} alt={""}  crossOrigin="anonymous"/>
            </div>
          </div>
        </section>
        <section
          className="grid-section"
          data-aos="fade-up"
          data-aos-duration="500"
        >
          <div className="absolute -z-1 inset-0 bg-grid"></div>
          <div className="inner-grid">
            <div
              data-aos="fade-right"
              data-aos-duration="500"
              data-aos-delay="250"
            >
              <img src={`${ImageBaseURL}/decrease-workload.jpg`} alt={""}  crossOrigin="anonymous"/>
            </div>
            <div
              data-aos="fade-left"
              data-aos-duration="500"
              data-aos-delay="250"
            >
              <h3 className="grid-heading">
                {t('remotePatientMonitoring.section3Card4Heading')}
              </h3>
              <p className="grid-text">
                {t('remotePatientMonitoring.section3Card4Text')}
              </p>
            </div>
          </div>
        </section>
        <section
          className="grid-section"
          data-aos="fade-up"
          data-aos-duration="500"
        >
          <div className="absolute -z-1 inset-0 bg-grid"></div>
          <div className="inner-grid">
            <div
              data-aos="fade-right"
              data-aos-duration="500"
              data-aos-delay="250"
            >
              <h3 className="grid-heading">
                {t('remotePatientMonitoring.section3Card5Heading')}
              </h3>
              <p className="grid-text">
                {t('remotePatientMonitoring.section3Card5Text')}
              </p>
            </div>
            <div
              data-aos="fade-left"
              data-aos-duration="500"
              data-aos-delay="250"
            >
              <img src={`${ImageBaseURL}/rpm-program.jpg`} alt={""}  crossOrigin="anonymous"/>
            </div>
          </div>
        </section>
      </div>
      <section className="faq-section">
        <h2 className="section-heading">
          {t('remotePatientMonitoring.faqTitle')}
        </h2>
        <div>
          {accordionData.map((item, index) => (
            <AccordionItem
              key={index}
              title={item.title}
              content={item.content}
            />
          ))}
        </div>
      </section>
    </div>
  );
};

export default RemotePatientMonitoring;