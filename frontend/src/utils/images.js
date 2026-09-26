export function displayImageUrl(url, width = 900) {
  if (!url) return "";

  try {
    const parsed = new URL(url);
    if (parsed.hostname === "upload.wikimedia.org") {
      const fileName = parsed.pathname.split("/").filter(Boolean).pop();
      if (fileName) {
        return `https://commons.wikimedia.org/wiki/Special:Redirect/file/${fileName}?width=${width}`;
      }
    }
  } catch {
    return url;
  }

  return url;
}
