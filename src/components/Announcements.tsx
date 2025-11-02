import React, { useState, useEffect } from "react";
import Marquee from "react-fast-marquee";
import { TauriService } from "../services/tauriService";
import { openUrl } from "@tauri-apps/plugin-opener";
import packageJson from "../../package.json";

const Announcements: React.FC = () => {
  const staticAnnouncements = [
    "🔒 Your data stays local - no cloud sync, no tracking, complete privacy",
  ];

  const [announcements, setAnnouncements] =
    useState<string[]>(staticAnnouncements);
  const [isLoading, setIsLoading] = useState(true);
  const [speed, setSpeed] = useState(50);

  // Function to parse simple markdown links and bold text
  const parseMarkdown = (text: string) => {
    const parts: (string | JSX.Element)[] = [];
    let elementKey = 0;

    // First pass: handle links
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const linkParts: (string | { type: 'link'; url: string; text: string; key: number })[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = linkRegex.exec(text)) !== null) {
      // Add text before the link
      if (match.index > lastIndex) {
        linkParts.push(text.slice(lastIndex, match.index));
      }

      // Add the link placeholder
      linkParts.push({
        type: 'link',
        url: match[2],
        text: match[1], // This will contain the raw text including ** markers
        key: elementKey++
      });

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      linkParts.push(text.slice(lastIndex));
    }

    // If no links found, use original text
    if (linkParts.length === 0) {
      linkParts.push(text);
    }

    // Second pass: handle bold text in each part
    linkParts.forEach((part) => {
      if (typeof part === 'string') {
        // Parse bold text in string parts
        const boldRegex = /\*\*([^*]+)\*\*/g;
        const boldParts: (string | JSX.Element)[] = [];
        let lastBoldIndex = 0;
        let boldMatch: RegExpExecArray | null;

        while ((boldMatch = boldRegex.exec(part)) !== null) {
          // Add text before the bold
          if (boldMatch.index > lastBoldIndex) {
            boldParts.push(part.slice(lastBoldIndex, boldMatch.index));
          }

          // Add the bold text
          boldParts.push(
            <strong key={elementKey++} className="font-bold">
              {boldMatch[1]}
            </strong>
          );

          lastBoldIndex = boldMatch.index + boldMatch[0].length;
        }

        // Add remaining text
        if (lastBoldIndex < part.length) {
          boldParts.push(part.slice(lastBoldIndex));
        }

        // Add bold parts or original string if no bold found
        if (boldParts.length > 0) {
          parts.push(...boldParts);
        } else {
          parts.push(part);
        }
      } else {
        // Handle link objects - parse bold text within the link text
        const linkText = part.text;
        const boldRegex = /\*\*([^*]+)\*\*/g;
        const linkContent: (string | JSX.Element)[] = [];
        let lastBoldIndex = 0;
        let boldMatch: RegExpExecArray | null;

        while ((boldMatch = boldRegex.exec(linkText)) !== null) {
          // Add text before the bold
          if (boldMatch.index > lastBoldIndex) {
            linkContent.push(linkText.slice(lastBoldIndex, boldMatch.index));
          }

          // Add the bold text
          linkContent.push(
            <strong key={elementKey++} className="font-bold">
              {boldMatch[1]}
            </strong>
          );

          lastBoldIndex = boldMatch.index + boldMatch[0].length;
        }

        // Add remaining text
        if (lastBoldIndex < linkText.length) {
          linkContent.push(linkText.slice(lastBoldIndex));
        }

        // If no bold found, use original text
        const finalLinkContent = linkContent.length > 0 ? linkContent : [linkText];

        parts.push(
          <a
            key={part.key}
            href={part.url}
            className="underline hover:no-underline cursor-pointer"
            onClick={async (e) => {
              e.preventDefault();
              try {
                await openUrl(part.url);
              } catch (error) {
                console.error("Failed to open link:", error);
              }
            }}
          >
            {finalLinkContent}
          </a>
        );
      }
    });

    return parts.length > 0 ? parts : [text];
  };

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const response = await TauriService.fetchAnnouncements();
        const allAnnouncements = [];
        
        // Create welcome message with version info
        let welcomeMessage = `🎉 Welcome to Sat Tracker (v${packageJson.version}) - A free, open source, local-first Bitcoin portfolio tracker!`;
        
        // Check for version update and modify welcome message
        if (response.latest_version && response.latest_version !== packageJson.version) {
          welcomeMessage = `🎉 Welcome to Sat Tracker (v${packageJson.version}) - [**New version v${response.latest_version} available!**](https://dprogram.me/tools/sat-tracker) - A free, open source, local-first Bitcoin portfolio tracker!`;
        }
        
        allAnnouncements.push(welcomeMessage);
        allAnnouncements.push(...staticAnnouncements);
        
        // Add remote announcements
        if (response.announcements && response.announcements.length > 0) {
          allAnnouncements.push(...response.announcements);
        }
        
        setAnnouncements(allAnnouncements);
      } catch (error) {
        console.warn("Failed to fetch announcements, using fallback:", error);
        // Fallback welcome message with current version
        const fallbackWelcome = `🎉 Welcome to Sat Tracker (v${packageJson.version}) - A free, open source, local-first Bitcoin portfolio tracker!`;
        setAnnouncements([fallbackWelcome, ...staticAnnouncements]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnnouncements();
  }, []);

  return (
    <div className="bg-linear-to-r from-[#E16036] to-[#f7931a] text-white py-1 px-2 rounded overflow-hidden relative max-w-full">
      {isLoading ? (
        <div className="text-xs font-medium text-center py-1">
          Loading announcements...
        </div>
      ) : (
        <Marquee
          speed={speed}
          gradient={false}
          delay={2}
          pauseOnHover={true}
          onCycleComplete={() => {
            setSpeed(0);
            setTimeout(() => {
              setSpeed(50);
            }, 1000);
          }}
        >
          {announcements.map((announcement, index) => (
            <span key={index} className="mx-8 text-xs font-medium">
              {parseMarkdown(announcement)}
            </span>
          ))}
        </Marquee>
      )}
    </div>
  );
};

export default Announcements;
