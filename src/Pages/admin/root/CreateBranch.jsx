import { Loader2Icon } from "lucide-react";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import ErrorMsg from "../../../Component/ErrorMsg";
import apiClient from "../../../config/APIConfig";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "../../../Component/UI/dialog";
import { useTranslation } from 'react-i18next';

export default function CreateBranch({ isAddBranchOpen, setIsAddBranchOpen, afterSuccess }) {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (data) => {
    setIsSubmitting(true);

    const payload = {
      ...data,
    };

    apiClient.post("/medical/branches", payload)
      .then((res) => {
        toast.success(res.data.message || t("Branch Created successfully"));
        reset();
        setIsSubmitting(false);
        afterSuccess?.();
      })
      .catch((err) => {
        toast.error(err?.response?.data?.message || t("Something went wrong!"));
        setIsSubmitting(false);
      });
  };

  return (
    <Dialog
      open={isAddBranchOpen}
      onOpenChange={(isOpen) => {
        setIsAddBranchOpen(isOpen);
      }}
    >
      <DialogContent className="bg-white border-none shadow-none">
        <DialogHeader>
          <DialogTitle>{t("Create Branch")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mb-6">
          <div>
            <input
              type="text"
              id="location"
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t("Enter Branch Location")}
              {...register("location", {
                required: t("Location is required"),
              })}
            />
            {errors.location && (
              <ErrorMsg error={errors.location.message} />
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-black text-white py-2 rounded-md flex items-center justify-center hover:bg-gray-800 transition"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2Icon className="animate-spin" />
            ) : (
              t("Create Branch")
            )}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
} 