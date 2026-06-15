"use server";

import yt from "youtube-sr";

export type YouTubeSearchResult = {
  id: string;
  title: string;
  channelName: string;
  durationFormatted: string;
  thumbnail: string;
};

export async function searchYouTube(query: string): Promise<YouTubeSearchResult[]> {
  if (!query || !query.trim()) return [];
  
  try {
    const results = await yt.search(query, { limit: 5, type: "video" });
    
    return results.map(video => ({
      id: video.id!,
      title: video.title || "Unknown Title",
      channelName: video.channel?.name || "Unknown Channel",
      durationFormatted: video.durationFormatted || "--:--",
      thumbnail: video.thumbnail?.url || "",
    }));
  } catch (err) {
    console.error("YouTube search error:", err);
    return [];
  }
}
