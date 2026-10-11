import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Uploads a base64-encoded image string to Cloudinary and returns the secure URL.
 * Used for payment verification screenshots.
 */
export async function uploadBase64Image(base64Image: string, folder: string): Promise<string> {
  const result = await cloudinary.uploader.upload(base64Image, {
    folder,
    resource_type: "image",
  });
  return result.secure_url;
}
