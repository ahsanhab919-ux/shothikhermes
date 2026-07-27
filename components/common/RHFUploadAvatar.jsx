import { Controller, useFormContext } from "react-hook-form";
import UploadAvatar from "./UploadAvatar";

export function RHFUploadAvatar({ name, onDrop, helperText, loading }) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <div>
          <UploadAvatar
            error={!!error}
            file={field.value}
            onDrop={onDrop}
            helperText={helperText}
            loading={loading}
          />

          {!!error && (
            <p className="text-destructive px-4 text-center text-sm">
              {error.message}
            </p>
          )}
        </div>
      )}
    />
  );
}
