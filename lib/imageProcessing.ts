export async function processImageFromUrl(
  imageUrl: string,
  regionSize = 200,
  maxSize = 1200
) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous"; // allow loading local/public image
    img.onload = () => {
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);

      const resizedWidth = Math.floor(img.width * scale);
      const resizedHeight = Math.floor(img.height * scale);

      const paddedWidth = Math.ceil(resizedWidth / regionSize) * regionSize;
      const paddedHeight = Math.ceil(resizedHeight / regionSize) * regionSize;

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      canvas.width = paddedWidth;
      canvas.height = paddedHeight;

      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, paddedWidth, paddedHeight);

      const offsetX = (paddedWidth - resizedWidth) / 2;
      const offsetY = (paddedHeight - resizedHeight) / 2;
      ctx.drawImage(img, offsetX, offsetY, resizedWidth, resizedHeight);

      const imageBase64 = canvas.toDataURL("image/jpeg", 0.8).split(",")[1];

      const regions = [];
      for (let y = 0; y < paddedHeight; y += regionSize) {
        for (let x = 0; x < paddedWidth; x += regionSize) {
          regions.push({ coords: [x, y] });
        }
      }

      resolve({ imageBase64, regions, paddedWidth, paddedHeight });
    };
    img.src = imageUrl;
  });
}
