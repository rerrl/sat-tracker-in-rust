import React, { useState, useEffect } from "react";
import Marquee from "react-fast-marquee";
import { TauriService } from "../services/tauriService";

const Announcements: React.FC = () => {
  const staticAnnouncements = [
    "🎉 Welcome to Sat Tracker - A free, open source, local-first Bitcoin portfolio tracker!",
    "🔒 Your data stays local - no cloud sync, no tracking, complete privacy",
    "📧 Bug reports or feature requests? Email andrew@dprogram.me",
  ];

  const [announcements, setAnnouncements] =
    useState<string[]>(staticAnnouncements);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const response = await TauriService.fetchAnnouncements();
        if (response.announcements && response.announcements.length > 0) {
          setAnnouncements([...staticAnnouncements, ...response.announcements]);
        }
      } catch (error) {
        console.warn("Failed to fetch announcements, using fallback:", error);
        // Keep the static announcements that are already set
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnnouncements();
  }, []);

  return (
    <div className="bg-linear-to-r from-[#E16036] to-[#f7931a] text-white py-1 px-3 rounded overflow-hidden relative max-w-full">
      <Marquee speed={50} gradient={false} delay={2} pauseOnHover={true}>
        {announcements.map((announcement, index) => (
          <span key={index} className="mx-8 text-xs font-medium">
            {announcement}
          </span>
        ))}
      </Marquee>
    </div>
  );
};

export default Announcements;
