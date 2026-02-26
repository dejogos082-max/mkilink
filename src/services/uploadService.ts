import axios from "axios";

export interface UploadResponse {
  publicUrl: string;
}

export async function uploadFile(file: File): Promise<string> {
  try {
    // 1. Get Presigned URL
    const { data } = await axios.post("/api/upload/presigned-url", {
      fileName: file.name,
      fileType: file.type,
    });

    const { uploadUrl, publicUrl } = data;

    // 2. Upload to R2 directly
    await axios.put(uploadUrl, file, {
      headers: {
        "Content-Type": file.type,
      },
    });

    return publicUrl;
  } catch (error) {
    console.error("Upload failed:", error);
    throw new Error("Failed to upload file");
  }
}
