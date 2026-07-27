import api from "./api";

// ImageKit configuration for frontend (public key only)
const IMAGEKIT_PUBLIC_KEY = "public_ntco51hqhkHKr0akMTpGf2YIKBY=";

const IMAGEKIT_URL_ENDPOINT = "https://ik.imagekit.io/80cblfdmy";

// Note: Private key should NEVER be exposed to frontend for security reasons

// Helper function to get authentication parameters for client-side uploads
export const getImageKitAuth = async () => {
  try {
    const { data } = await api.get(
      `${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}imagekit/auth`,
    );
    return data;
  } catch (error) {
    console.error("Error getting ImageKit auth:", error);
    throw error;
  }
};

// Helper function to upload file to ImageKit
export const uploadToImageKit = async (
  file: File,
  folder: string = "media",
): Promise<string> => {
  try {
    // Get authentication parameters from backend
    const authResponse = await getImageKitAuth();

    if (!authResponse.success) {
      throw new Error(authResponse.error || "Failed to get authentication");
    }

    const auth = authResponse.data;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("fileName", file.name);
    formData.append("folder", folder);
    formData.append("token", auth.token);
    formData.append("signature", auth.signature);
    formData.append("expire", auth.expire.toString());
    formData.append("publicKey", IMAGEKIT_PUBLIC_KEY);

    const response = await fetch(
      `https://upload.imagekit.io${process.env.NEXT_PUBLIC_MARKETING_REDIRECT_PREFIX}v1/files/upload`,
      {
        method: "POST",
        body: formData,
      },
    );


    if (!response.ok) {
      let errorMessage = `Upload failed with status ${response.status}`;
      try {
        const errorData = await response.json();
        console.error("Upload error response:", errorData);
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (parseError) {
        console.error("Could not parse error response:", parseError);
        const errorText = await response.text();
        console.error("Raw error response:", errorText);
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    return result.url;
  } catch (error) {
    console.error("Error uploading to ImageKit:", error);
    throw error;
  }
};
