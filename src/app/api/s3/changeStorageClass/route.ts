import { NextRequest, NextResponse } from "next/server";
import { s3Client } from "@/lib/s3Client";
import { CopyObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";

export async function POST(request: NextRequest) {
  try {
    const { folderPrefix, storageClass } = await request.json();

    if (!folderPrefix || !storageClass) {
      return NextResponse.json({ error: "folderPrefix and storageClass are required" }, { status: 400 });
    }

    const bucketName = process.env.AWS_S3_BUCKET_NAME;
    if (!bucketName) {
      return NextResponse.json({ error: "S3 bucket name not configured" }, { status: 500 });
    }

    // List all objects under the folder prefix
    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: folderPrefix,
    });

    const listData = await s3Client.send(listCommand);

    const objects = listData.Contents || [];

    // For each object, copy it to the same key with new storage class
    for (const obj of objects) {
      if (!obj.Key) continue;

      const copyCommand = new CopyObjectCommand({
        Bucket: bucketName,
        CopySource: `${bucketName}/${obj.Key}`,
        Key: obj.Key,
        StorageClass: storageClass,
        MetadataDirective: "COPY",
      });

      await s3Client.send(copyCommand);
    }

    return NextResponse.json({ message: "Storage class updated successfully" });
  } catch (error) {
    console.error("Change storage class error:", error);
    return NextResponse.json({ error: "Failed to change storage class" }, { status: 500 });
  }
}
