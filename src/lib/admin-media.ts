export function uniqueMediaUrls(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map((value) => `${value ?? ""}`.trim()).filter(Boolean)));
}

export function diffRemovedMediaUrls(previousValues: Array<string | null | undefined>, nextValues: Array<string | null | undefined>) {
  const nextSet = new Set(uniqueMediaUrls(nextValues));
  return uniqueMediaUrls(previousValues).filter((value) => !nextSet.has(value));
}

export async function deleteMediaUrls(urls: Array<string | null | undefined>) {
  const targets = uniqueMediaUrls(urls);

  if (targets.length === 0) {
    return;
  }

  const response = await fetch("/api/upload", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ urls: targets }),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.error) {
    throw new Error(payload?.error?.message || "Medya silinemedi");
  }
}
