"use client";

import { useEffect, useRef, useState } from "react";
import { processImageFromUrl } from "@/lib/imageProcessing";

export default function Home() {
  const [output, setOutput] = useState<string>("Preparing image...");
  const [showGrid, setShowGrid] = useState(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [regions, setRegions] = useState<{ coords: [number, number] }[]>([]);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const imgRef = useRef<HTMLImageElement>(null);

  const IMAGE_PATH = "/The_Kiss-Gustav_Klimt.jpg"; // in /public
  const regionSize = 200; // must match imageProcessing.ts region size

  useEffect(() => {
    async function describeArtwork() {
      try {
        console.log("🎨 [Client] Starting image processing...");
        const { imageBase64, regions, paddedWidth, paddedHeight } =
          (await processImageFromUrl(
            IMAGE_PATH,
            regionSize,
            1200
          )) as any;

        console.log("📦 Processed:", regions.length, "regions");
        setRegions(regions);
        setCanvasSize({ width: paddedWidth, height: paddedHeight });

        // Send to Gemini
        console.log("🚀 Sending to API...");
        const response = await fetch("/api/describe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64, regions }),
        });

        const data = await response.json();
        console.log("✅ Gemini returned:", data);
        setOutput(JSON.stringify(data, null, 2));
      } catch (err: any) {
        console.error("🔥 [Client] Error:", err);
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    describeArtwork();
  }, []);

  // Compute scaling factor between the padded canvas and displayed image
  const getScale = () => {
    const img = imgRef.current;
    if (!img) return { x: 1, y: 1 };
    return {
      x: img.clientWidth / canvasSize.width,
      y: img.clientHeight / canvasSize.height,
    };
  };

  const scale = getScale();

  return (
    <main className="relative flex flex-col items-center w-screen h-[calc(100dvh-10px)] overflow-hidden text-center">
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <h1 className="text-l font-semibold mt-2 drop-shadow">
        Talk Art to Me
      </h1>
      <p className="text-300 text-xs max-w-md mb-2">
        AI-generated accessibility description for art
      </p>

      {/* Image container */}
      <div className="relative max-w-full max-h-full flex justify-center items-center">
        <img
          ref={imgRef}
          src={IMAGE_PATH}
          //alt="The Kiss – Gustav Klimt"
          className="max-w-screen max-h-[calc(100dvh-80px)] object-contain border border-gray-700 rounded-md"
        />

        {/* Precise grid overlay */}
        {showGrid && (
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
            {regions.map(({ coords: [x, y] }, i) => {
              const left = x * scale.x;
              const top = y * scale.y;
              const width = regionSize * scale.x;
              const height = regionSize * scale.y;
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left,
                    top,
                    width,
                    height,
                    border: "1px solid rgba(255,255,255,0.4)",
                    boxSizing: "border-box",
                  }}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Toggle button */}
      <button
        onClick={() => setShowGrid(!showGrid)}
        className="absolute top-4 right-4 bg-black/40 text-white px-3 py-1 rounded-md text-sm hover:bg-black/60 transition"
      >
        {showGrid ? "Hide Grid" : "Show Grid"}
      </button>

      {/* Status + Output */}
      {loading && (
        <p className="text-blue-400 font-medium mt-2">Analyzing artwork...</p>
      )}
      {error && <p className="text-red-400 font-medium mt-2">Error: {error}</p>}

      {!loading && !error && (
        <pre className="bg-gray-100 p-4 rounded-md w-full max-w-3xl overflow-auto text-left text-sm mt-3">
          {output}
        </pre>
      )}
    </main>
  );
}
