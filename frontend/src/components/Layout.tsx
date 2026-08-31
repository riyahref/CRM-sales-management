import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { CommandPalette } from "./CommandPalette";

interface LayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, pageTitle }) => {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  return (
    <div className="app-layout-grid">
      <Sidebar />
      <div className="app-main-area">
        <TopBar pageTitle={pageTitle} onOpenCommandPalette={() => setIsCommandPaletteOpen(true)} />
        <main className="main-content">{children}</main>
      </div>
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />
    </div>
  );
};
