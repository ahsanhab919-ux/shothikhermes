import { countries } from "@/_mock/countries";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import useResponsive from "@/hooks/ui/useResponsive";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";
import {
  useUpdateProfileMutation,
  useUploadImageMutation,
} from "@/redux/api/auth/authApi";
import { getUser, setUser } from "@/redux/slices/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle, Info, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { z } from "zod";

const StatusBadge = ({
  children,
  variant = "default",
  icon: Icon,
  className,
}) => {
  return (
    <Badge variant={variant} className={cn("gap-1", className)}>
      {Icon && <Icon className="h-3 w-3" />}
      {children}
    </Badge>
  );
};

export default function AccountGeneral({ user }) {
  const [updateProfile] = useUpdateProfileMutation();
  const [uploadImage] = useUploadImageMutation();
  const isMobile = useResponsive("down", "sm");
  const dispatch = useDispatch();

  const UpdateUserSchema = z.object({
    name: z.string()
      .trim()
      .min(3, "Name must be at least 2 characters")
      .max(50, "Name must not exceed 50 characters")
      .regex(
        /^[a-zA-Z\s'-]+$/,
        "Name can only contain alphabetic characters, spaces, hyphens, and apostrophes."
      ),
    email: z.string()
      .min(1, "Email is required")
      .email("Email must be a valid email address"),
    country: z.string().optional(),
    address: z.string().optional(),
    state: z.string().optional(),
    city: z.string().optional(),
    zipCode: z.string()
      .trim()
      .regex(/^\d*$/, "Zip code must be numerical")
      .optional()
      .nullable(),
  });

  const defaultValues = {
    name: user?.name || "",
    email: user?.email || "",
    image: user?.image || null,
    country: user?.country !== "unknown" ? user?.country : "BD",
    address: user?.address || "",
    state: user?.state || "",
    city: user?.city || "",
    zipCode: user?.zipCode != null ? String(user.zipCode) : "",
  };

  const [loading, setLoading] = useState(false);

  const form = useForm({
    resolver: zodResolver(UpdateUserSchema),
    defaultValues,
  });

  const {
    setValue,
    handleSubmit,
    formState: { isSubmitting },
    reset,
  } = form;

  useEffect(() => {
    if (user) {
      reset({
        name: user?.name || "",
        email: user?.email || "",
        image: user?.image || null,
        country: user?.country !== "unknown" ? user?.country : "BD",
        address: user?.address || "",
        state: user?.state || "",
        city: user?.city || "",
        zipCode: user?.zipCode != null ? String(user.zipCode) : "",
      });
    }
  }, [user, reset]);

  const onSubmit = async (data) => {
    try {
      const res = await updateProfile(data);
      if (res?.data?.message === "Profile updated") {
        toast.success("Your profile has been updated successfully!");
        dispatch(setUser(res.data.data));
      }
    } catch (error) {
      toast.error(error.message || "Failed to update your profile.");
    }
  };

  const handleDrop = async (acceptedFiles) => {
    setLoading(true);
    try {
      setValue("image", null);
      const file = acceptedFiles;

      const formData = new FormData();
      formData.append("image", file);
      const response = await uploadImage(formData).unwrap();

      await updateProfile({ ...defaultValues, image: response?.image });
      if (response?.image) {
        dispatch(getUser({ ...user, image: response?.image }));
        setValue("image", response.image, { shouldValidate: true });
        toast.success("Your profile picture has been updated successfully!");
      } else {
        handleImageUploadError();
      }
    } catch (error) {
      handleImageUploadError(error);
    }
    setLoading(false);
  };

  const handleImageUploadError = (error) => {
    setValue("image", user?.image, { shouldValidate: true });
    const errorMessage = error?.message || "Failed to upload image";
    toast.error(errorMessage);
  };

  const handleFileSelect = (event) => {
    const files = event.target.files;
    if (files && files[0]) {
      handleDrop(files[0]);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          <div className="md:col-span-4">
            <Card className="p-8 text-center">
              {loading ? (
                <div className="flex h-48 flex-col items-center">
                  <Skeleton
                    className={cn(
                      "rounded-full",
                      isMobile ? "h-32 w-32" : "h-36 w-36",
                    )}
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <Avatar
                    className={cn(
                      "mx-auto",
                      isMobile ? "h-32 w-32" : "h-36 w-36",
                    )}
                  >
                    <AvatarImage src={form.watch("image")} />
                    <AvatarFallback className="text-2xl">
                      {user?.name?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <Input
                    type="file"
                    accept=".jpeg,.jpg,.png,.gif"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="avatar-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      document.getElementById("avatar-upload").click()
                    }
                  >
                    Change Avatar
                  </Button>
                  <p className="text-muted-foreground mt-2 text-xs">
                    Allowed *.jpeg, *.jpg, *.png, *.gif
                  </p>
                </div>
              )}
            </Card>
          </div>

          <div className="md:col-span-8">
            <Card className="p-6">
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input {...field} readOnly className="pr-32" />
                            <div className="absolute top-1/2 right-2 -translate-y-1/2 transform">
                              {user?.is_verified ? (
                                <StatusBadge
                                  variant="default"
                                  icon={CheckCircle}
                                  className="bg-primary text-primary-foreground"
                                >
                                  Verified
                                </StatusBadge>
                              ) : (
                                <StatusBadge
                                  variant="destructive"
                                  icon={XCircle}
                                >
                                  Unverified
                                </StatusBadge>
                              )}
                            </div>
                          </div>
                        </FormControl>
                        <div className="text-muted-foreground mt-1 flex items-center gap-2 text-xs">
                          <Info className="h-3 w-3" />
                          Email can not be changed after sign up.
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <textarea
                          {...field}
                          rows={2}
                          className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a country" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {countries.map(({ code, label }) => (
                              <SelectItem key={code} value={code}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State/Region</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Please enter your state or region"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Please enter your city"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="zipCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Zip Code</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Please enter your zip code"
                            {...field}
                            inputMode="numeric"
                            pattern="[0-9]*"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </form>
    </Form>
  );
}
