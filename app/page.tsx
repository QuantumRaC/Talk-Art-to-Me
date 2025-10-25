"use client";

import { useEffect, useState } from "react";
import { processImageFromUrl } from "@/lib/imageProcessing";

export default function Home() {
  const [output, setOutput] = useState<string>("Preparing image...");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const IMAGE_PATH = "/The_Kiss-Gustav_Klimt.jpg"; // located in /public

  useEffect(() => {
    async function describeArtwork() {
      try {
        console.log("🎨 [Client] Starting image processing...");
        const { imageBase64, regions } = (await processImageFromUrl(
          IMAGE_PATH,
          200,   // region size
          1200   // max size
        )) as {
          imageBase64: string;
          regions: { coords: [number, number] }[];
        };

        console.log("📦 [Client] Image processed successfully");
        console.log("  • Base64 length:", imageBase64.length);
        console.log("  • Region count:", regions.length);

        console.log("🚀 [Client] Sending request to /api/describe...");
        const response = await fetch("/api/describe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64, regions }),
        });

        console.log("📡 [Client] Response received with status:", response.status);
        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`);
        }

        const data = await response.json();
        console.log("✅ [Client] API returned:", data);
        setOutput(JSON.stringify(data, null, 2));
      } catch (err: any) {
        console.error("🔥 [Client] Error in describeArtwork:", err);
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    describeArtwork();
  }, []);

  return (
    <main className="flex flex-col items-center p-6 space-y-6 text-center">
      <h1 className="text-2xl font-semibold">Talk Art to Me</h1>
      <p className="text-gray-600 max-w-md">
        AI-generated accessibility description for Gustav Klimt’s <i>The Kiss</i>
      </p>

      <img
        src={IMAGE_PATH}
        alt="The Kiss – Gustav Klimt"
        className="max-w-full w-[600px] rounded shadow-md border"
      />

      {loading && (
        <p className="text-blue-500 font-medium">Analyzing artwork...</p>
      )}
      {error && (
        <p className="text-red-500 font-medium">Error: {error}</p>
      )}

      {!loading && !error && (
        <pre className="bg-gray-100 p-4 rounded-md w-full max-w-3xl overflow-auto text-left text-sm">
          {output}
        </pre>
      )}
    </main>
  );
}
