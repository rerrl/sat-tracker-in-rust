import React from "react";
import Marquee from "react-fast-marquee";

// TODO: get announcements from api call
const Announcements: React.FC = () => {
  const announcements = [
    "🎉 Welcome to Sat Tracker (Beta) - A free, open source, local-first Bitcoin portfolio tracker!",
    "🔒 Your data stays local - no cloud sync, no tracking, complete privacy",
    "🛠️ Pro tip: Use the 'Add Undocumented Lumpsum' tool to quickly backfill your DCA history",
    "📧 Bug reports or feature requests? Email andrew@dprogram.me",
    "🔧 Pro tip: You can completely disable announcements and premium pitches in settings (coming soon)",
    "💡 Pro tip: Use Escape key to cancel any edit operation quickly",
    "🚀 New Feature: CSV Import for Coinbase and River coming soon!",
    "💎 Coming soon: Premium features with advanced portfolio analytics",
  ];

  return (
    <div className="bg-linear-to-r from-[#E16036] to-[#f7931a] text-white py-1 px-3 rounded overflow-hidden relative max-w-full">
      <Marquee speed={50} gradient={false} delay={2}>
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
