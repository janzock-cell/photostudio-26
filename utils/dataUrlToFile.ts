export const dataUrlToFile = async (
  dataUrl: string,
  filename: string,
  mimeType?: string
): Promise<File> => {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], filename, { type: mimeType || blob.type });
};