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

    // Fetch config from Firebase via REST API for Cloudflare compatibility
    const firebaseDbUrl = env.VITE_FIREBASE_DATABASE_URL || "https://mkienterprise-default-rtdb.firebaseio.com";
    const configRes = await fetch(`${firebaseDbUrl}/settings/r2.json`);
    let config = await configRes.json();

    // Fallback if Firebase doesn't have data
    if (!config) {
      config = {
        accountId: env.R2_ACCOUNT_ID || "7b6b27d12265ebd16b19f2cf1577f778",
        accessKeyId: env.R2_ACCESS_KEY_ID || "ae5477fee595912616a3848650c63367",
        secretAccessKey: env.R2_SECRET_ACCESS_KEY || "c51ff85d500d69a6bf123243400e26f8b03d2a7f400cc8b507a2448f5dbdcc1c",
        bucketName: env.R2_BUCKET_NAME || "mkibucket",
        publicUrl: "https://cloud.ironvalecraft.shop"
      };
    }

    const R2 = new S3Client({
      region: "auto",
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });

    const key = `uploads/${Date.now()}-${filename}`;
    const command = new PutObjectCommand({
      Bucket: config.bucketName,
      Key: key,
      ContentType: contentType,
    });

    const url = await getSignedUrl(R2, command, { expiresIn: 3600 });
    const publicUrl = `${config.publicUrl}/${key}`;

    return new Response(JSON.stringify({ uploadUrl: url, publicUrl }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("R2 Presigned URL Error:", error);
    return new Response(JSON.stringify({ error: `Failed to generate upload URL: ${error.message}` }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
