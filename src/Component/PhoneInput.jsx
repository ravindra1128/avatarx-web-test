import { Controller } from "react-hook-form";
import PhoneInput from "react-phone-input-2";
import { useTranslation } from 'react-i18next';

const PhoneInputField = ({ name, placeholder, control, disableCountryCode, disableDropdown, disableSearch, countryCodeEditable, disabled }) => {
  const { t } = useTranslation();
  return (
    <Controller
      name={name}
      control={control}
      containerClass="w-full rounded-lg"
      rules={{
        required: "Mobile number is required",
        validate: (value) => {
          const isValid = /^\d{10,15}$/.test(value);
          return isValid || "Enter a valid mobile number";
        },
      }}
      render={({ field }) => (
        <PhoneInput
          country={"us"}
          {...field}
          value={field.value}
          searchPlaceholder={"Search Country"}
          enableSearch={true}
          disableCountryCode={disableCountryCode}
          disableDropdown={disableDropdown}
          disableSearch={disableSearch}
          countryCodeEditable={countryCodeEditable}
          onChange={(value) => field.onChange(value)}
          inputClass="!w-full !py-5 !border !border-black !rounded-md !h-[42px]"
          placeholder={placeholder || t('invite.patientMobilePlaceholder')}
          buttonClass="!py-1 !border !border-black"
          disabled={disabled}
        />
      )}
    />
  );
};

export default PhoneInputField;
