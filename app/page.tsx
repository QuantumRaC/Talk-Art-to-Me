"use client";

import { useEffect, useRef, useState } from "react";
import { processImageFromUrl } from "@/lib/imageProcessing";

export default function Home() {
  const [output, setOutput] = useState<string>("Preparing image...");
  const [showGrid, setShowGrid] = useState(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [regions, setRegions] = useState<{ coords: [number, number]; caption?: string }[]>([]);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [imgScale, setImgScale] = useState({ x: 1, y: 1 });

  const imgRef = useRef<HTMLImageElement>(null);
  //const IMAGE_PATH = "sample-artworks/The_Kiss-Gustav_Klimt.jpg"; // in /public
  //const IMAGE_PATH = "sample-artworks/Tequila_Sunset-Disco_Elysium.png";

  const [imagePath, setImagePath] = useState("sample-artworks/The_Empress-Cyberpunk_2077.jpg");

  // List of sample artworks
  const artworks = [
    "sample-artworks/The_Kiss-Gustav_Klimt.jpg",
    "sample-artworks/Tequila_Sunset-Disco_Elysium.png",
    "sample-artworks/The_Empress-Cyberpunk_2077.jpg",
    "sample-artworks/The_Saturday_Evening_Post-J.C.Leyendecker.jpg",
    "sample-artworks/The_Virgin-Gustav_Klimt.jpg",
  ];

  // Function to pick a random artwork
  function loadRandomArtwork() {
    const random = artworks[Math.floor(Math.random() * artworks.length)];
    setImagePath(random);
    setLoading(true);
    setOutput("Preparing image...");
  }

  const regionSize = 200; // must match your imageProcessing.ts

  // 🗣️ TTS: helper to speak text aloud
  function speak(text: string) {
    if (!text) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 1;
    utterance.pitch = 1;
    speechSynthesis.cancel(); // stop current speech before speaking new
    speechSynthesis.speak(utterance);
  }

  // 🗣️ Optional: stop speech if needed
  function stopSpeaking() {
    speechSynthesis.cancel();
  }

  // Load and describe the artwork
  useEffect(() => {
    async function describeArtwork() {
      try {
        
        console.log("🎨 Starting image processing...");
        const { imageBase64, regions, paddedWidth, paddedHeight } =
          (await processImageFromUrl(imagePath, regionSize, 1200)) as any;

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

        // 🗣️ Attach captions to regions if available
        if (data?.regions?.length) {
          const merged = regions.map((r: any, i: number) => ({
            ...r,
            caption: data.regions[i]?.caption || "",
          }));
          setRegions(merged);
        }
      } catch (err: any) {
        console.error("🔥 Error:", err);
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    describeArtwork();
  }, []);

  // Automatically update imgScale when the image resizes
  useEffect(() => {
    const img = imgRef.current;
    if (!img || !canvasSize.width || !canvasSize.height) return;

    const updateScale = () => {
      setImgScale({
        x: img.clientWidth / canvasSize.width,
        y: img.clientHeight / canvasSize.height,
      });
    };

    // Initial calculation
    updateScale();

    // Observe image resize
    const observer = new ResizeObserver(() => updateScale());
    observer.observe(img);

    // Also listen to window resizes (orientation, etc.)
    window.addEventListener("resize", updateScale);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateScale);
    };
  }, [canvasSize]);

  return (
    <main className="relative flex flex-col items-center w-screen h-[calc(100dvh-10px)] overflow-hidden text-center bg-background">
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <h1 className="text-l font-semibold mt-2 text-primary drop-shadow">
        Talk Art to Me
      </h1>
      <p className="text-300 text-primary text-xs max-w-md mb-2">
        AI-generated accessibility description for art
      </p>

      {/* Image container (centered vertically + horizontally) */}
      <div className="flex flex-1 items-center justify-center w-full h-full relative overflow-hidden">
        <div className="relative flex items-center justify-center">
          <img
            ref={imgRef}
            src={imagePath}
            onLoad={() => {
              const img = imgRef.current;
              if (!img || !canvasSize.width || !canvasSize.height) return;
              setImgScale({
                x: img.clientWidth / canvasSize.width,
                y: img.clientHeight / canvasSize.height,
              });
            }}
            className="object-contain max-w-[100vw] max-h-[calc(100dvh-120px)] rounded-md"
          />

          {/* Reactive + clickable grid overlay (clickable even when hidden) */}
          <div className="absolute top-0 left-0 w-full h-full z-10">
            {regions.map(({ coords: [x, y], caption }, i) => {
              const left = x * imgScale.x;
              const top = y * imgScale.y;
              const width = regionSize * imgScale.x;
              const height = regionSize * imgScale.y;
              return (
                <div
                  key={i}
                  onClick={() => speak(caption || `Region ${i + 1}`)}
                  style={{
                    position: "absolute",
                    left,
                    top,
                    width,
                    height,
                    border: showGrid ? "1px solid rgba(255,255,255,0.4)" : "none",
                    backgroundColor: showGrid
                      ? "rgba(255,255,255,0.05)"
                      : "transparent",
                    transition: "all 0.15s ease-out",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    if (showGrid)
                      e.currentTarget.style.backgroundColor =
                        "rgba(255,255,255,0.15)";
                  }}
                  onMouseLeave={(e) => {
                    if (showGrid)
                      e.currentTarget.style.backgroundColor =
                        "rgba(255,255,255,0.05)";
                  }}
                  title={caption}
                />
              );
            })}
          </div>
        </div>
      </div>


      {/* Toggle grid + Stop speech */}
      <div className="absolute top-4 right-4 flex gap-2">
        <button
          onClick={() => setShowGrid(!showGrid)}
          className="bg-black/40 text-white px-3 py-1 rounded-md text-sm hover:bg-black/60 transition"
        >
          {showGrid ? "Hide Grid" : "Show Grid"}
        </button>
        <button
          onClick={stopSpeaking}
          className="bg-red-600/70 text-white px-3 py-1 rounded-md text-sm hover:bg-red-700 transition"
        >
          Stop
        </button>
        <button
          onClick={loadRandomArtwork}
          className="bg-green-600/70 text-white px-3 py-1 rounded-md text-sm hover:bg-green-700 transition"
        >
          Random Artwork
        </button>
      </div>

      {/* Status + Output */}
      {loading && (
        <p className="text-blue-400 font-medium mt-2">Analyzing artwork...</p>
      )}
      {error && <p className="text-red-400 font-medium mt-2">Error: {error}</p>}

      {/* {!loading && !error && (
        <pre className="bg-gray-100 p-4 rounded-md w-full max-w-3xl overflow-auto text-left text-sm mt-3">
          {output}
        </pre>
      )} */}
    </main>
  );
}