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
import { useTranslation } from 'react-i18next';

export default function CreateCustomer({
  isOpen,
  setIsOpen,
  user,
  afterSuccess,
}) {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = useForm();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [facilities, setFacilities] = useState(null);
  const isUpdate = Boolean(user);

  useEffect(() => {
    apiClient
      .get("/medical/facilities")
      .then((res) => {
        setFacilities(res.data);
      })
      .catch((err) => {
        toast.error(err?.response?.data?.message || "Failed to fetch facilities");
      });
  }, []);

  useEffect(() => {
    if (user) {
      setValue("first_name", user.first_name);
      setValue("last_name", user.last_name);
      setValue("email", user.email);
      setValue("facility_id", user.facility_id);
      setValue("phone_number", user.phone_number);
    }
  }, [user, setValue]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);

    const payload = {
      ...data,
      phone_number: `+1${data.phone_number}`,
      ...(isUpdate && { user_id: user.id }),
    };

    apiClient
      .post("/user/create_customer", payload)
      .then((res) => {
        toast.success(
          res.data.message ||
            `${isUpdate ? "Provider Updated" : "Provider Created"} successfully`
        );
        reset();
        setValue("facility_id", "");
        setIsSubmitting(false);
        afterSuccess?.();
      })
      .catch((err) => {
        toast.error(err?.response?.data?.message || "Something went wrong!");
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
    >
      <DialogContent className="bg-white border-none shadow-none">
        <DialogHeader>
          <DialogTitle>
            {isUpdate ? "Update Provider" : "Create Provider"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mb-6">
          <div>
            {facilities && facilities.length > 0 ? (
              <>
                <select
                  id="facility"
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  {...register("facility_id", {
                    required: t("Provider is required"),
                  })}
                >
                  <option value="" disabled>
                    {t("Select Provider")}
                  </option>
                  {facilities?.map((facility) => (
                    <option key={facility.id} value={facility.id}>
                      {facility.name}
                    </option>
                  ))}
                </select>
                {errors.facility_id && <ErrorMsg error={errors.facility_id.message} />}
              </>
            ) : (
              <div className="text-gray-500 text-center py-2">
                {t("No facilities available")}
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                id="first_name"
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t("First Name")}
                {...register("first_name", {
                  required: t("First name is required"),
                })}
              />
              {errors.first_name && (
                <ErrorMsg error={errors.first_name.message} />
              )}
            </div>

            <div className="flex-1">
              <input
                type="text"
                id="last_name"
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t("Last Name")}
                {...register("last_name", {
                  required: t("Last name is required"),
                })}
              />
              {errors.last_name && (
                <ErrorMsg error={errors.last_name.message} />
              )}
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <input
                type="email"
                id="email"
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t("Email Address")}
                {...register("email", {
                  required: t("Email is required"),
                  pattern: {
                    value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                    message: t("Please enter a valid email address"),
                  },
                })}
              />
              {errors.email && <ErrorMsg error={errors.email.message} />}
            </div>

            <div className="flex-1">
              <input
                type="tel"
                id="phone_number"
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t("Phone Number")}
                {...register("phone_number", {
                  required: t("Phone number is required"),
                  pattern: {
                    value: /^\d{10}$/,
                    message: t("Phone number must be exactly 10 digits"),
                  }
                })}
              />
              {errors.phone_number && <ErrorMsg error={errors.phone_number.message} />}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-black text-white py-2 rounded-md flex items-center justify-center hover:bg-gray-800 transition"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2Icon className="animate-spin" />
            ) : isUpdate ? (
              t("Update Provider")
            ) : (
              t("Create Provider")
            )}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
