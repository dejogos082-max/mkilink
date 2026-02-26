import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const onRequestPost = async (context: any) => {
  try {
    const { request, env } = context;
    const body = await request.json();
    const { filename, contentType } = body;

    if (!filename || !contentType) {
      return new Response(JSON.stringify({ error: "Filename and contentType are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const R2 = new S3Client({
      region: "auto",
      endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      },
    });

    const key = `uploads/${Date.now()}-${filename}`;
    const command = new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    const url = await getSignedUrl(R2, command, { expiresIn: 3600 });
    const publicUrl = `${env.R2_PUBLIC_URL}/${key}`;

    return new Response(JSON.stringify({ uploadUrl: url, publicUrl }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("R2 Presigned URL Error:", error);
    return new Response(JSON.stringify({ error: "Failed to generate upload URL" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
