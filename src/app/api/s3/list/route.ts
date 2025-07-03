import { NextResponse } from "next/server";
import { s3Client } from "@/lib/s3Client";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";

export async function GET() {
  try {
    const bucketName = process.env.AWS_S3_BUCKET_NAME;
    if (!bucketName) {
      return NextResponse.json({ error: "S3 bucket name not configured" }, { status: 500 });
    }

    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: "photos/",
      Delimiter: "/",
    });

    const data = await s3Client.send(command);

    const folders = data.CommonPrefixes?.map((prefix) => prefix.Prefix) || [];
    const files = data.Contents?.map((content) => content.Key) || [];

    return NextResponse.json({ folders, files });
  } catch (error) {
    console.error("List error:", error);
    return NextResponse.json({ error: "Failed to list photos" }, { status: 500 });
  }
}
