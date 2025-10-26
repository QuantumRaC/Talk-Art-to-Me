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
  const [audioEnabled, setAudioEnabled] = useState(false);

  const imgRef = useRef<HTMLImageElement>(null);
  const [imagePath, setImagePath] = useState("sample-artworks/The_Empress-Cyberpunk_2077.jpg");

  // List of sample artworks
  const artworks = [
    "sample-artworks/The_Kiss-Gustav_Klimt.jpg",
    "sample-artworks/Tequila_Sunset-Disco_Elysium.png",
    "sample-artworks/The_Empress-Cyberpunk_2077.jpg",
    "sample-artworks/The_Saturday_Evening_Post-J.C.Leyendecker.jpg",
    "sample-artworks/The_Virgin-Gustav_Klimt.jpg",
  ];

  // Pick a random artwork
  function loadRandomArtwork() {
    const random = artworks[Math.floor(Math.random() * artworks.length)];
    setImagePath(random);
    setLoading(true);
    setOutput("Preparing image...");
  }

  const regionSize = 200;

  // 🗣️ Speak helper (works after user clicks once)
  function speak(text: string) {
    if (!text || !audioEnabled) return;
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 0.8;
      utterance.pitch = 1;
      speechSynthesis.cancel();
      speechSynthesis.speak(utterance);
    } catch (err) {
      console.error("TTS error:", err);
    }
  }

  function stopSpeaking() {
    speechSynthesis.cancel();
  }

  // Enable audio on first click (required by mobile browsers)
  useEffect(() => {
    const unlock = () => setAudioEnabled(true);
    window.addEventListener("click", unlock, { once: true });
    window.addEventListener("touchstart", unlock, { once: true });
    return () => {
      window.removeEventListener("click", unlock);
      window.removeEventListener("touchstart", unlock);
    };
  }, []);

  // Describe artwork when loaded
  useEffect(() => {
    async function describeArtwork() {
      try {
        console.log("🎨 Starting image processing...");
        const { imageBase64, regions, paddedWidth, paddedHeight } =
          (await processImageFromUrl(imagePath, regionSize, 1200)) as any;

        console.log("📦 Processed:", regions.length, "regions");
        setRegions(regions);
        setCanvasSize({ width: paddedWidth, height: paddedHeight });

        // Send to Gemini API
        console.log("🚀 Sending to API...");
        const response = await fetch("/api/describe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64, regions }),
        });

        const data = await response.json();
        console.log("✅ Gemini returned:", data);
        setOutput(JSON.stringify(data, null, 2));

        // 🗣️ Read full artwork description once finished
        if (data?.overall || data?.description) {
          const desc = data.overall || data.description;
          setTimeout(() => speak(desc), 800);
        }

        // Attach region captions
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
  }, [imagePath, audioEnabled]);

  // Scale updates
  useEffect(() => {
    const img = imgRef.current;
    if (!img || !canvasSize.width || !canvasSize.height) return;

    const updateScale = () => {
      setImgScale({
        x: img.clientWidth / canvasSize.width,
        y: img.clientHeight / canvasSize.height,
      });
    };

    updateScale();
    const observer = new ResizeObserver(() => updateScale());
    observer.observe(img);
    window.addEventListener("resize", updateScale);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateScale);
    };
  }, [canvasSize]);

  return (
    <main className="relative flex flex-col items-center w-screen h-[calc(100dvh-10px)] overflow-hidden text-center bg-background">
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />

      <h1 className="text-l font-semibold mt-2 text-primary drop-shadow">Talk Art to Me</h1>
      <p className="text-300 text-primary text-xs max-w-md mb-2">
        AI-generated accessibility description for art
      </p>

      {/* Buttons */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setShowGrid(!showGrid)}
          className="bg-black/40 text-white px-3 py-1 rounded-sm text-xs hover:bg-black/60 transition"
        >
          {showGrid ? "Hide Grid" : "Show Grid"}
        </button>
        <button
          onClick={loadRandomArtwork}
          className="bg-green-600/70 text-white px-3 py-1 rounded-sm text-xs hover:bg-green-700 transition"
        >
          Random Artwork
        </button>
        <button
          onClick={stopSpeaking}
          className="bg-red-600/70 text-white px-3 py-1 rounded-sm text-xs hover:bg-red-700 transition"
        >
          Stop
        </button>
      </div>

      {/* Image + Grid */}
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

          {/* Clickable grid regions */}
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
                  title={caption}
                />
              );
            })}
          </div>
        </div>
      </div>

      {loading && (
        <p className="text-blue-400 font-medium mt-2">Analyzing artwork...</p>
      )}
      {error && <p className="text-red-400 font-medium mt-2">Error: {error}</p>}
    </main>
  );
}
