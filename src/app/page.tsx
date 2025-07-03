"use client";

import React, { useState, useEffect, useRef, ChangeEvent, FormEvent } from "react";

const GOOGLE_FONT_LINK = "https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap";

export default function HomePage() {
  const [files, setFiles] = useState<string[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>("");
  const [storageClass, setStorageClass] = useState<string>("STANDARD");
  const [uploading, setUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetchList();
  }, []);

  async function fetchList() {
    const res = await fetch("/api/s3/list");
    const data = await res.json();
    setFolders(data.folders || []);
    setFiles(data.files || []);
  }

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!fileInputRef.current || !fileInputRef.current.files || fileInputRef.current.files.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", fileInputRef.current.files[0]);

    const res = await fetch("/api/s3/upload", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      await fetchList();
      if (fileInputRef.current) fileInputRef.current.value = "";
    } else {
      alert("Upload failed");
    }
    setUploading(false);
  }

  async function handleChangeStorageClass() {
    if (!selectedFolder) {
      alert("Select a folder first");
      return;
    }

    const res = await fetch("/api/s3/changeStorageClass", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folderPrefix: selectedFolder, storageClass }),
    });

    if (res.ok) {
      alert("Storage class updated successfully");
    } else {
      alert("Failed to update storage class");
    }
  }

  return (
    <>
      <head>
        <link href={GOOGLE_FONT_LINK} rel="stylesheet" />
      </head>
      <main className="min-h-screen bg-white text-black font-sans p-6" style={{ fontFamily: "'Inter', sans-serif" }}>
        <h1 className="text-3xl font-semibold mb-6">Photo Album App</h1>

        <section className="mb-6">
          <form onSubmit={handleUpload} className="flex items-center space-x-4">
            <input type="file" ref={fileInputRef} accept="image/*" className="border p-2 rounded" />
            <button type="submit" disabled={uploading} className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800">
              {uploading ? "Uploading..." : "Upload Photo"}
            </button>
          </form>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Albums</h2>
          <select
            value={selectedFolder}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedFolder(e.target.value)}
            className="border p-2 rounded w-full max-w-xs"
          >
            <option value="">Select an album</option>
            {folders.map((folder) => (
              <option key={folder} value={folder}>
                {folder.replace("photos/", "").replace("/", "")}
              </option>
            ))}
          </select>
        </section>

        <section className="mb-6">
          <label htmlFor="storageClass" className="block mb-2 font-semibold">
            Change Storage Class
          </label>
          <select
            id="storageClass"
            value={storageClass}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => setStorageClass(e.target.value)}
            className="border p-2 rounded w-full max-w-xs"
          >
            <option value="STANDARD">STANDARD</option>
            <option value="STANDARD_IA">STANDARD_IA</option>
            <option value="ONEZONE_IA">ONEZONE_IA</option>
            <option value="INTELLIGENT_TIERING">INTELLIGENT_TIERING</option>
            <option value="GLACIER">GLACIER</option>
            <option value="DEEP_ARCHIVE">DEEP_ARCHIVE</option>
          </select>
          <button
            onClick={handleChangeStorageClass}
            className="mt-3 bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
          >
            Update Storage Class
          </button>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">Photos</h2>
          <div className="grid grid-cols-3 gap-4">
            {files
              .filter((file) => (selectedFolder ? file.startsWith(selectedFolder) : true))
              .map((file) => (
                <img
                  key={file}
                  src={`https://${process.env.NEXT_PUBLIC_S3_BUCKET}.s3.amazonaws.com/${file}`}
                  alt={file}
                  className="w-full h-48 object-cover rounded"
                />
              ))}
          </div>
        </section>
      </main>
    </>
  );
}
