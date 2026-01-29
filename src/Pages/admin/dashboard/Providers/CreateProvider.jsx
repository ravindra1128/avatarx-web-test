import { Loader2Icon } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import ErrorMsg from "../../../../Component/ErrorMsg";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../../../Component/UI/dialog";
import apiClient from "../../../../config/APIConfig";
import { useTranslation } from 'react-i18next';
import { logCritical } from "../../../../utils/logger";

export default function CreateProvider({
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
  const [branches, setBranches] = useState([]);
  const isUpdate = Boolean(user);

  useEffect(() => {
    // fetchBranches();
  }, []);

  useEffect(() => {
    if (user) {
      setValue("first_name", user.first_name);
      setValue("last_name", user.last_name);
      setValue("email", user.email);
      setValue("phone_number", user.phone_number?.replace('+1', '') || '');
      setValue("branch_id", user.branch_id);
    }
  }, [user, setValue]);

  const fetchBranches = async () => {
    try {
      const response = await apiClient.get("/user/get_all_branches");
      if (response?.status === 200) {
        setBranches(response.data.data || []);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to fetch branches");
      logCritical("Error fetching branches:", error);
      toast.error(error?.response?.data?.message || "Failed to fetch branches");
    }
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);

    const payload = {
      ...data,
      phone_number: data.phone_number.startsWith('+1') ? data.phone_number : `+1${data.phone_number}`
    };

    try {
      const res = await apiClient.post("/user/create_customer", payload);
      toast.success(
        res.data.message ||
          `${isUpdate ? "Provider Updated" : "Provider Created"} successfully`
      );
      reset();
      afterSuccess?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Something went wrong!");
      logCritical("Error creating provider:", err);
    } finally {
      setIsSubmitting(false);
    }
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
      <DialogContent className="bg-white border-none shadow-none max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isUpdate ? t('providers.editProvider', 'Edit Provider') : t('providers.createProvider', 'Create Provider')}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <input
                type="text"
                placeholder={t('providers.firstName', 'First Name')}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register("first_name", {
                  required: t('providers.firstNameRequired', 'First name is required'),
                })}
              />
              {errors.first_name && <ErrorMsg error={errors.first_name.message} />}
            </div>
            <div>
              <input
                type="text"
                placeholder={t('providers.lastName', 'Last Name')}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register("last_name", {
                  required: t('providers.lastNameRequired', 'Last name is required'),
                })}
              />
              {errors.last_name && <ErrorMsg error={errors.last_name.message} />}
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


          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-md hover:bg-gray-300 transition"
            >
              {t('providers.cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              className="flex-1 bg-black text-white py-2 rounded-md hover:bg-gray-800 transition flex items-center justify-center"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2Icon className="animate-spin h-4 w-4" />
              ) : (
                isUpdate ? t('providers.update', 'Update') : t('providers.create', 'Create')
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 