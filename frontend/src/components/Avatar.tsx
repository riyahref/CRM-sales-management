import React from "react";

interface AvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const PALETTE = [
  "#475569", // Muted Slate
  "#0D9488", // Muted Teal
  "#0284C7", // Muted Ocean
  "#6366F1", // Muted Indigo
  "#8B5CF6", // Muted Violet
  "#D97706", // Muted Amber
  "#E11D48" // Muted Rose
];

function getInitials(name: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getColorForName(name: string): string {
  if (!name) return PALETTE[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PALETTE.length;
  return PALETTE[index];
}

export const Avatar: React.FC<AvatarProps> = ({ name, size = "md", className = "" }) => {
  const initials = getInitials(name);
  const bgColor = getColorForName(name);

  const sizePx = size === "sm" ? 24 : size === "lg" ? 40 : 32;
  const fontSizePx = size === "sm" ? 10 : size === "lg" ? 16 : 13;

  return (
    <div
      className={`avatar-circle avatar-${size} ${className}`}
      style={{
        width: `${sizePx}px`,
        height: `${sizePx}px`,
        borderRadius: "50%",
        backgroundColor: bgColor,
        color: "#FFFFFF",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: `${fontSizePx}px`,
        fontWeight: 600,
        letterSpacing: "0.02em",
        userSelect: "none",
        flexShrink: 0
      }}
      title={name}
    >
      {initials}
    </div>
  );
};
