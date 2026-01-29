import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useTranslation } from "react-i18next";
import apiClient from "../../config/APIConfig";
import { logCritical } from "../../utils/logger";
import { ImageBaseURL } from "../../config/BaseURL";
import contactPattern from "../../../public/contact-pattern.svg";
import doctorImage from "../../../public/images/doctor.jpg";

export default function Contact() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const response = await apiClient.post("/user/contact_us", data);

      if (response.status !== 200 && response.status !== 201) {
        toast.error(response.data.message || t('contactUs.errors.sendFailed'));
        logCritical("Failed to send email", response.data.message);
        throw new Error("Failed to send email");
      }

      setShowModal(true);
      reset();
    } catch (error) {
      toast.error(error.response.data.message || t('contactUs.errors.sendFailed'));
      logCritical("Failed to send email", error.response.data.message);
    } finally {
      setLoading(false);
    }
  };

  // Add Modal Component
  const SuccessModal = () => (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[99999] flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
        <h3 className="text-2xl font-semibold mb-4 text-center">{t('contactUs.success.title')}</h3>
        <p className="text-gray-600 text-center mb-6">
          {t('contactUs.success.message')}
        </p>
        <div className="text-center">
          <button
            onClick={() => setShowModal(false)}
            className="submit-btn"
          >
            {t('contactUs.success.close')}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <section className="inner-hero-section">
        <div className="hero-gradient"></div>
        <div className="position-relative">
          <img
            src={`${ImageBaseURL}/side-view-banner.webp`}
            className="hero-banner"
            alt="AvatarX Health"
            crossOrigin="anonymous"
          />
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
          <h4 className="eyebrow-heading text-left">{t('contactUs.hero.eyebrow')}</h4>
          <h2 className="heading text-left">{t('contactUs.hero.title')}</h2>
        </div>
      </section>
      <section className="contact-form">
        <div className="inner-container overflow-x-hidden">
          <h2
            className="contact-heading"
            data-aos="fade-up"
            data-aos-duration="500"
          >
            {t('contactUs.main.title')}{" "}
            <span className="highlight-text">{t('contactUs.main.highlight')}</span>{" "}
            {t('contactUs.main.subtitle')}
          </h2>
          <div className="contact-grid">
            <div className="contact-imgbx">
              <img
                src={doctorImage}
                className="contact-grid-image"
                alt="AvatarX Health"
                height={800}
                data-aos="fade-right"
                data-aos-duration="500"
              />
              <img
                src={contactPattern}
                className="contact-grid-pattern"
                data-aos="fade-down"
                data-aos-duration="500"
                alt="AvatarX Health"
              />
            </div>
            <div
              className="contact-form-wrapper"
              data-aos="fade-left"
              data-aos-duration="500"
            >
              <h2 className="form-heading text-center">{t('contactUs.form.title')}</h2>
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="form-wrapper">
                  <input
                    type="text"
                    className="contact-field"
                    placeholder={t('contactUs.form.name.placeholder')}
                    {...register("name", { required: t('contactUs.form.name.required') })}
                  />
                  {errors.name && (
                    <p className="form-error">{errors.name.message}</p>
                  )}
                </div>
                <div className="form-wrapper">
                  <input
                    type="email"
                    className="contact-field"
                    placeholder={t('contactUs.form.email.placeholder')}
                    {...register("email", {
                      required: t('contactUs.form.email.required'),
                      pattern: {
                        value: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                        message: t('contactUs.form.email.invalid'),
                      },
                    })}
                  />
                  {errors.email && (
                    <p className="form-error">{errors.email.message}</p>
                  )}
                </div>
                <div className="form-wrapper">
                  <input
                    type="text"
                    className="contact-field"
                    placeholder={t('contactUs.form.subject.placeholder')}
                    {...register("subject", {
                      required: t('contactUs.form.subject.required'),
                    })}
                  />
                  {errors.subject && (
                    <p className="form-error">{errors.subject.message}</p>
                  )}
                </div>
                <div className="form-wrapper">
                  <textarea
                    rows={4}
                    className="contact-field"
                    placeholder={t('contactUs.form.message.placeholder')}
                    {...register("message", {
                      required: t('contactUs.form.message.required'),
                    })}
                  ></textarea>
                  {errors.message && (
                    <p className="form-error">{errors.message.message}</p>
                  )}
                </div>
                <div className="text-center">
                  <button
                    type="submit"
                    className="submit-btn"
                    disabled={loading}
                  >
                    {loading ? t('contactUs.form.submit.sending') : t('contactUs.form.submit.send')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Add Modal */}
      {showModal && <SuccessModal />}
      
      {/* Toast Container */}
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar />
    </div>
  );
}
