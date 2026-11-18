import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import ClientHeader from "./ClientHeader";
import { getTheme, applyThemeToDOM } from "./themeManager";
import "./Dashboard.css";
import "./LightMode.css";

export default function ClientLayout({
  children,
  active,
  title,
  subtitle,
  actions,
  className = "",
  contentBox = true,
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    applyThemeToDOM(getTheme());
  }, []);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className={`client-layout-root ${isSidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      <Sidebar active={active} isCollapsed={isSidebarCollapsed} onToggleCollapse={toggleSidebar} />
      <div className="client-layout-main">
        <ClientHeader title={title} subtitle={subtitle} actions={actions} />
        <main className="client-layout-scroll-area">
          <div className={contentBox ? `client-content-box ${className}` : className}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}