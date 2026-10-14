export const photoSize = 480;

export async function resizePhoto(file: File) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, photoSize / Math.min(bitmap.width, bitmap.height));
  const side = Math.round(Math.min(bitmap.width, bitmap.height) * scale);
  const canvas = document.createElement("canvas");
  canvas.width = side;
  canvas.height = side;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("canvas");
  const crop = Math.min(bitmap.width, bitmap.height);
  context.drawImage(
    bitmap,
    (bitmap.width - crop) / 2,
    (bitmap.height - crop) / 2,
    crop,
    crop,
    0,
    0,
    side,
    side,
  );
  bitmap.close();
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("blob"))),
      "image/jpeg",
      0.85,
    ),
  );
}
