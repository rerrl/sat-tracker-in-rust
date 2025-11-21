import { useQuery } from "@tanstack/react-query";
import { TauriService, AnnouncementsResponse } from "../services/tauriService";
import packageJson from "../../package.json";

export const useAnnouncements = () => {
  const staticAnnouncements = [
    "🎉 Welcome to Sat Tracker - A free, open source, local-first Bitcoin portfolio tracker",
    "🔒 Your data stays local - no cloud sync, no tracking, complete privacy",
    "📡 Only fetches Bitcoin price & app announcements",
  ];

  const query = useQuery<AnnouncementsResponse>({
    queryKey: ["announcements"],
    queryFn: async () => {
      try {
        const response = await TauriService.fetchAnnouncements();
        return response;
      } catch (error) {
        console.warn("Failed to fetch announcements:", error);
        return {
          latest_version: packageJson.version,
          announcements: [],
        };
      }
    },
    staleTime: 3600 * 1000 * 12, // 12 hours
    refetchInterval: 3600 * 1000 * 12, // 12 hours
    gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime)
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const isUpdateAvailable =
    query.data?.latest_version &&
    query.data.latest_version !== packageJson.version;

  const processedAnnouncements = (() => {
    if (!query.data) return [];

    const allAnnouncements = [];

    allAnnouncements.push(...staticAnnouncements);

    // Add remote announcements
    if (query.data.announcements && query.data.announcements.length > 0) {
      allAnnouncements.push(...query.data.announcements);
    }

    return allAnnouncements;
  })();

  return {
    announcements: processedAnnouncements,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isUpdateAvailable,
    latestVersion: query.data?.latest_version,
    currentVersion: packageJson.version,
  };
};
