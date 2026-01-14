import React, { useState } from "react";
import Marquee from "react-fast-marquee";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useAnnouncements } from "../hooks/useAnnouncements";

const Announcements: React.FC = () => {
  const [isHidden, setIsHidden] = useState(false);
  const { announcements, isLoading } = useAnnouncements();

  if (isHidden) {
    return null;
  }

  // Function to parse simple markdown links and bold text
  const parseMarkdown = (text: string) => {
    const parts: (string | JSX.Element)[] = [];
    let elementKey = 0;

    // First pass: handle links
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const linkParts: (
      | string
      | { type: "link"; url: string; text: string; key: number }
    )[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = linkRegex.exec(text)) !== null) {
      // Add text before the link
      if (match.index > lastIndex) {
        linkParts.push(text.slice(lastIndex, match.index));
      }

      // Add the link placeholder
      linkParts.push({
        type: "link",
        url: match[2],
        text: match[1], // This will contain the raw text including ** markers
        key: elementKey++,
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
      if (typeof part === "string") {
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
        const finalLinkContent =
          linkContent.length > 0 ? linkContent : [linkText];

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

  return (
    <div className="bg-linear-to-r from-[#E16036] to-[#f7931a] text-white py-1 px-2 rounded overflow-hidden relative max-w-full">
      <button
        onClick={() => setIsHidden(true)}
        className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 hover:bg-black/20 rounded p-1 transition-colors"
        aria-label="Close announcements"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-white"
        >
          <path
            d="M9 3L3 9M3 3L9 9"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <div className="pr-8">
        {isLoading ? (
          <div className="text-xs font-medium text-center py-1">
            Loading announcements...
          </div>
        ) : (
          <Marquee speed={50} gradient={false} delay={2}>
            {announcements.map((announcement, index) => (
              <span key={index} className="mx-8 text-xs font-medium">
                {parseMarkdown(announcement)}
              </span>
            ))}
          </Marquee>
        )}
      </div>
    </div>
  );
};

export default Announcements;
