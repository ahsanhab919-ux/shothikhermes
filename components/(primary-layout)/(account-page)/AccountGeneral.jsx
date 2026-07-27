import { countries } from "@/_mock/countries";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { cn } from "@/lib/utils";
import {
  useUpdateProfileMutation,
  useUploadImageMutation,
} from "@/redux/api/auth/authApi";
import { getUser, setUser } from "@/redux/slices/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Camera,
  CheckCircle,
  Edit,
  Info,
  Loader2,
  Mail,
  MapPin,
  Save,
  User,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
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
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const UpdateUserSchema = z.object({
    name: z
      .string()
      .trim()
      .min(3, "Name must be at least 3 characters")
      .max(50, "Name must not exceed 50 characters")
      .regex(
        /^[a-zA-Z\s'-]+$/,
        "Name can only contain alphabetic characters, spaces, hyphens, and apostrophes.",
      ),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Email must be a valid email address"),
    country: z.string().optional(),
    address: z.string().optional(),
    state: z.string().optional(),
    city: z.string().optional(),
    zipCode: z
      .string()
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
      setPreviewImage(null);
    }
  }, [user, reset]);

  const onSubmit = async (data) => {
    try {
      const res = await updateProfile(data);
      if (res?.data?.message === "Profile updated") {
        toast.success("Your profile has been updated successfully!");
        dispatch(setUser(res.data.data));
        setIsEditing(false);
        setPreviewImage(null);
      }
    } catch (error) {
      toast.error(error.message || "Failed to update your profile.");
    }
  };

  const handleImageUpload = async (file) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const response = await uploadImage(formData).unwrap();

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
    setPreviewImage(null);
    const errorMessage = error?.message || "Failed to upload image";
    toast.error(errorMessage);
  };

  const handleFileSelect = (event) => {
    const files = event.target.files;
    if (files && files[0]) {
      handleImageUpload(files[0]);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setPreviewImage(null);
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
  };

  const getCountryName = (code) => {
    const country = countries.find((c) => c.code === code);
    return country ? country.label : code;
  };

  const currentImage = previewImage || user?.image || null;

  return (
    <div className="space-y-6">
      {/* Profile Information Card */}
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Profile Information</h2>
            {!isEditing && (
              <Button
                onClick={() => setIsEditing(true)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit Profile
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {!isEditing ? (
            // View Mode
            <div className="space-y-6">
              {/* Profile Picture and Basic Info */}
              <div className="flex items-start gap-6">
                <div className="relative">
                  <Avatar
                    className={cn(
                      "border-4",
                      isMobile ? "h-24 w-24" : "h-28 w-28",
                    )}
                  >
                    <AvatarImage src={user?.image} />
                    <AvatarFallback className="text-2xl">
                      {user?.name?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  {user?.is_verified && (
                    <div className="bg-primary text-primary-foreground absolute -right-1 -bottom-1 rounded-full p-1">
                      <CheckCircle className="h-4 w-4" />
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="text-2xl font-bold">
                      {user?.name || "N/A"}
                    </h3>
                    <p className="text-muted-foreground mt-1 flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {user?.email || "N/A"}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {user?.is_verified && (
                      <StatusBadge
                        variant="default"
                        icon={CheckCircle}
                        className="bg-primary text-primary-foreground"
                      >
                        Verified
                      </StatusBadge>
                    )}
                    {!user?.is_verified && (
                      <StatusBadge variant="destructive" icon={XCircle}>
                        Unverified
                      </StatusBadge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Edit Mode
            <Form {...form}>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Image Upload */}
                <div className="flex items-start gap-6">
                  <div className="relative">
                    {loading ? (
                      <Skeleton
                        className={cn(
                          "rounded-full border-4",
                          isMobile ? "h-24 w-24" : "h-28 w-28",
                        )}
                      />
                    ) : (
                      <Avatar
                        className={cn(
                          "border-4",
                          isMobile ? "h-24 w-24" : "h-28 w-28",
                        )}
                      >
                        <AvatarImage src={currentImage} />
                        <AvatarFallback className="text-2xl">
                          {user?.name?.charAt(0)?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <label className="bg-primary text-primary-foreground hover:bg-primary/90 absolute right-0 bottom-0 cursor-pointer rounded-full p-2 transition-colors">
                      <Camera className="h-4 w-4" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <div className="text-muted-foreground text-sm">
                    <p>Click the camera icon to change your profile picture.</p>
                    <p>Recommended: Square image, at least 200x200 pixels.</p>
                    <p className="mt-1 text-xs">
                      Allowed *.jpeg, *.jpg, *.png, *.gif
                    </p>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your name" {...field} />
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
                            <Input
                              {...field}
                              readOnly
                              className="pr-32"
                              placeholder="your.email@example.com"
                            />
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

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </Button>
                  <Button type="button" variant="outline" onClick={cancelEdit}>
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>

      {/* Address Information Card */}
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Address Information</h2>
            {!isEditing && (
              <Button
                onClick={() => setIsEditing(true)}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {!isEditing ? (
            // View Mode
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {user?.address && (
                  <div className="bg-muted rounded-lg p-4">
                    <div className="text-muted-foreground mb-1 flex items-center gap-2 text-sm font-medium">
                      <MapPin className="h-4 w-4" />
                      Address
                    </div>
                    <div className="text-sm">{user.address}</div>
                  </div>
                )}

                {user?.country && user.country !== "unknown" && (
                  <div className="bg-muted rounded-lg p-4">
                    <div className="text-muted-foreground mb-1 flex items-center gap-2 text-sm font-medium">
                      <MapPin className="h-4 w-4" />
                      Country
                    </div>
                    <div className="text-sm">
                      {getCountryName(user.country)}
                    </div>
                  </div>
                )}

                {user?.state && (
                  <div className="bg-muted rounded-lg p-4">
                    <div className="text-muted-foreground mb-1 flex items-center gap-2 text-sm font-medium">
                      <MapPin className="h-4 w-4" />
                      State/Region
                    </div>
                    <div className="text-sm">{user.state}</div>
                  </div>
                )}

                {user?.city && (
                  <div className="bg-muted rounded-lg p-4">
                    <div className="text-muted-foreground mb-1 flex items-center gap-2 text-sm font-medium">
                      <MapPin className="h-4 w-4" />
                      City
                    </div>
                    <div className="text-sm">{user.city}</div>
                  </div>
                )}

                {user?.zipCode && (
                  <div className="bg-muted rounded-lg p-4">
                    <div className="text-muted-foreground mb-1 flex items-center gap-2 text-sm font-medium">
                      <MapPin className="h-4 w-4" />
                      Zip Code
                    </div>
                    <div className="text-sm">{user.zipCode}</div>
                  </div>
                )}
              </div>

              {!user?.address &&
                !user?.state &&
                !user?.city &&
                !user?.zipCode &&
                (!user?.country || user.country === "unknown") && (
                  <div className="text-muted-foreground py-8 text-center">
                    <User className="mx-auto mb-2 h-12 w-12 opacity-50" />
                    <p>No address information available.</p>
                    <p className="mt-1 text-sm">
                      Click "Edit" to add your address details.
                    </p>
                  </div>
                )}
            </div>
          ) : (
            // Edit Mode
            <Form {...form}>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                          placeholder="Enter your address"
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
                            placeholder="Enter your state or region"
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
                          <Input placeholder="Enter your city" {...field} />
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
                            placeholder="Enter your zip code"
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

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </Button>
                  <Button type="button" variant="outline" onClick={cancelEdit}>
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
