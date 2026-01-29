import { Loader2Icon } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import ErrorMsg from "../../../Component/ErrorMsg";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../../Component/UI/dialog";
import apiClient from "../../../config/APIConfig";
import { useTranslation } from "react-i18next";
import { logCritical } from "../../../utils/logger";
import { useLocation } from "react-router-dom";

export default function CreateUser({ isOpen, setIsOpen, user, afterSuccess, facilityList, customerDashboard }) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = useForm();

  const [isSubmitting, setIsSubmitting] = useState(false);
  // const [facilities, setFacilities] = useState([]);
  const [isLoadingFacilities, setIsLoadingFacilities] = useState(false);
  const isUpdate = Boolean(user);
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const facilitySlug = pathname.split("/")[2];
  useEffect(() => {
    if (user) {
      setValue("first_name", user.first_name);
      setValue("last_name", user.last_name);
      setValue("phone_number", user.phone_number);
      setValue("facility_id", user.facility_id);
    }
  }, [user, setValue]);

  // useEffect(() => {
  //   fetchFacilities();
  // }, []);

  // const fetchFacilities = async () => {
  //   try {
  //     setIsLoadingFacilities(true);
  //     const response = await apiClient.get("/facility/list");
  //     setFacilities(response.data.data || []);
  //   } catch (error) {
  //     toast.error("Failed to fetch facilities");
  //     console.error("Error fetching facilities:", error);
  //   } finally {
  //     setIsLoadingFacilities(false);
  //   }
  // };

  const onSubmit = async (data) => {
    setIsSubmitting(true);

    const payload = {
      facility_slug: facilitySlug,
      ...data,
      ...(isUpdate && { user_id: user.id }), // Include user_id only for update
      ...(data.phone_number && { phone_number: `+1${data.phone_number}` })
    };

    apiClient.post("/user/add_patient", payload)
      .then((res) => {
        toast.success(res.data.message || `User Created successfully`);
        reset();
        setIsSubmitting(false);
        afterSuccess?.();
      })
      .catch((err) => {
        toast.error(err?.response?.data?.error || "Something went wrong!");
        logCritical("Error creating/updating user health vitals", err);
        setIsSubmitting(false);
      });
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(isOpen) => {
        setIsOpen(isOpen);
        if (!isOpen) {
          reset();
        }
      }}
      className="!bg-white border-none shadow-none"
    >
      <DialogContent className="bg-white border-none shadow-none">
        <DialogHeader>
          <DialogTitle>{isUpdate ? t('users.updatePatient') : t('users.createPatient')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mb-6">
          <div className="flex gap-4">
            <div>
              <input
                type="text"
                id="first_name"
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t('users.enterFirstName')}
                {...register("first_name", {
                  required: t('users.firstNameRequired'),
                })}
              />
              {errors.first_name && (
                <ErrorMsg className="text-left" error={errors.first_name.message} />
              )}
            </div>
            <div>
              <input
                type="text"
                id="last_name"
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t('users.enterLastName')}
                {...register("last_name", {
                  required: t('users.lastNameRequired'),
                })}
              />
              {errors.last_name && (
                <ErrorMsg className="text-left" error={errors.last_name.message} />
              )}
            </div>
          </div>

          <div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <span className="text-gray-500">+1</span>
              </div>
              <input
                type="tel"
                id="phone_number"
                className="w-full px-4 py-2 pl-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                placeholder="(555) 555-5555"
                maxLength={10}
                onKeyPress={(e) => {
                  if (!/[0-9]/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
                {...register("phone_number", {
                  required: t('users.phoneNumberRequired'),
                  validate: (value) => {
                    // Remove any non-digit characters
                    const cleanNumber = value.replace(/\D/g, '');
                    
                    // Check length
                    if (cleanNumber.length !== 10) {
                      return t('users.phoneNumberInvalid');
                    }

                    return true;
                  }
                })}
              />
            </div>
            {errors.phone_number && <ErrorMsg className="text-left" error={errors.phone_number.message} />}
          </div>

          {/* <div>
            <select
              id="facility_id"
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              {...(customerDashboard ? {disabled: true} : register("facility_id", {
                required: "Facility is required",
              }))}
            >
              <option value="">Select Facility</option>
              {isLoadingFacilities ? (
                <option value="" disabled>Loading facilities...</option>
              ) : (
                facilityList.map((facility) => (
                  <option selected={customerDashboard} key={facility.id} value={facility.id}>
                    {facility.name}
                  </option>
                ))
              )}
            </select>
            {errors.facility_id && (
              <ErrorMsg className="text-left" error={errors.facility_id.message} />
            )}
          </div> */}

          <button
            type="submit"
            className="w-full bg-black text-white py-2 rounded-md flex items-center justify-center hover:bg-gray-800 transition"
            disabled={isSubmitting || isLoadingFacilities}
          >
            {isSubmitting ? (
              <Loader2Icon className="animate-spin" />
            ) : (
              isUpdate ? t('users.updatePatient') : t('users.createPatient')
            )}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
