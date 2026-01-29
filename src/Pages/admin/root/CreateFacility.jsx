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

export default function CreateFacility({
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
    apiClient
      .get("/user/get_all_branches")
      .then((res) => {
        setBranches(res.data.data);
      })
      .catch((err) => {
        toast.error(err?.response?.data?.message || "Failed to fetch branches");
      });
  }, []);

  useEffect(() => {
    if (user) {
      setValue("first_name", user.first_name);
      setValue("last_name", user.last_name);
      setValue("email", user.email);
      setValue("branch_id", user.branch_id);
    }
  }, [user, setValue]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);

    const payload = {
      ...data,
      ...(isUpdate && { user_id: user.id }), // Include user_id only for update
    };

    try {
      const res = await apiClient.post("/user/create_facility", payload);
      toast.success(
        res.data.message ||
          `${isUpdate ? "Provider Updated" : "Provider Created"} successfully`
      );
      reset();
      setValue("branch_id", "");
      afterSuccess?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Something went wrong!");
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
      <DialogContent className="bg-white border-none shadow-none">
        <DialogHeader>
          <DialogTitle>
            {isUpdate ? t('updateProvider') : t('createProvider')}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mb-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                id="name"
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t("Enter Name")}
                {...register("name", {
                  required: "Name is required",
                })}
              />
              {errors.name && <ErrorMsg error={errors.name.message} />}
            </div>

            <div className="flex-1">
              <select
                id="branch"
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register("branch_id", {
                  required: "Branch is required",
                })}
              >
                <option value="" disabled>
                  {t("Select Branch")}
                </option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.location}
                  </option>
                ))}
              </select>
              {errors.branch_id && (
                <ErrorMsg error={errors.branch_id.message} />
              )}
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
              t("updateProvider")
            ) : (
              t("createProvider")
            )}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
