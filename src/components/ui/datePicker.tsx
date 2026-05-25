import { ErrorMessage } from "@hookform/error-message";
import { DatePicker } from "antd";
import { Controller } from "react-hook-form";

type CarDatePickerRulesProps = {
  required?: boolean | string;
};
type CarDatePickerProps = {
  label?: string;
  atribute: string;
  className?: string;
  control: any;
  type?: any;
  disabled?: boolean;
  rules?: CarDatePickerRulesProps;
  errors?: any;
  pickerType?: "date" | "week" | "month" | "quarter" | "year";
  placeholder?: string;
};
const CarDatePicker = ({
  control,
  label,
  type,
  atribute,
  className = "",
  disabled = false,
  errors = {},
  rules = {},
  pickerType = "date",
  placeholder,
}: CarDatePickerProps) => {
  return (
    <div className="flex flex-col">
      {label && <label className=" text-gray-600  ">{label}</label>}
      <Controller
        name={atribute}
        control={control}
        disabled={disabled}
        rules={rules}
        render={({ field }) => (
          <>
            <span className={`${className}`}>
              <DatePicker
                id={field.name}
                picker={pickerType}
                placeholder={placeholder}
                className={"w-full"}
                {...field}
              />
            </span>
            <ErrorMessage
              errors={errors}
              name={atribute}
              render={({ message }) => (
                <p className="text-red-500">{message}</p>
              )}
            />
          </>
        )}
      />
    </div>
  );
};

export default CarDatePicker;
