import React, { useContext, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { AuthContext } from "../../Component/AuthProvider.jsx";
import { Loader2 } from "lucide-react";
import { sendInvite } from "../../api/invite.service.js";
import PhoneInput from "react-phone-input-2";
import 'react-phone-input-2/lib/style.css'
import PhoneInputField from "../../Component/PhoneInput.jsx";
import { useTranslation } from 'react-i18next';

export default function Invite() {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    reset,
    control
  } = useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const { authData } = useContext(AuthContext);

  const inviterEmail = authData?.user?.email;

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const response = await sendInvite({
        executive_name: data.doctor_last_name,
        user_name: data.user_name,
        user_mobile_number: data.user_mobile_number,
        inviter_email: inviterEmail,
      });

      setSuccessMessage(response.message);
      reset(); // Clear the form after successful submission
    } catch (error) {
      setErrorMessage(error.message || t('invite.errorSending'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-[calc(80vh-70px)] px-4 py-10 sm:py-20">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-center text-xl font-semibold mb-4">
          {t('invite.title')}
        </h2>

        {successMessage && (
          <div className="text-green-600 text-center">{successMessage}</div>
        )}
        {errorMessage && (
          <div className="text-red-600 text-center">{errorMessage}</div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <input
              type="text"
              id="doctor_last_name"
              className="w-full px-4 py-2 border rounded-md"
              placeholder={t('invite.doctorLastNamePlaceholder')}
              {...register("doctor_last_name", {
                required: t('invite.doctorLastNameRequired'),
                minLength: {
                  value: 2,
                  message: t('invite.nameMinLength'),
                },
                pattern: {
                  value: /^(?!\d+$)[a-zA-Z0-9]+$/,
                  message: t('invite.nameMustIncludeLetter'),
                },
              })}
            />
            {errors.doctor_last_name && (
              <p className="text-red-500 text-sm">
                {errors.doctor_last_name.message}
              </p>
            )}
          </div>

          <div>
            <input
              type="text"
              id="user_name"
              className="w-full px-4 py-2 border rounded-md"
              placeholder={t('invite.patientNamePlaceholder')}
              {...register("user_name", {
                required: t('invite.userNameRequired'),
                minLength: {
                  value: 2,
                  message: t('invite.userNameMinLength'),
                },
                pattern: {
                  value: /^(?!\d+$)[a-zA-Z0-9]+$/,
                  message: t('invite.userNameMustIncludeLetter'),
                },
              })}
            />
            {errors.user_name && (
              <p className="text-red-500 text-sm">{errors.user_name.message}</p>
            )}
          </div>

          <div>
            <PhoneInputField
              name="user_mobile_number"
              placeholder={t('invite.patientMobilePlaceholder')}
              control={control}
            />
            {errors.user_mobile_number && (
              <p className="text-red-500 text-sm">
                {errors.user_mobile_number.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-black text-white py-2 rounded-md flex items-center justify-center"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" />
            ) : (
              t('invite.sendInvite')
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
