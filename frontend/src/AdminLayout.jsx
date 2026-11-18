import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Landmark,
  ArrowLeftRight,
  FileSpreadsheet,
  Database,
  ExternalLink,
  Terminal,
  LogOut,
  ShieldCheck,
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import "./Admin.css";
import ThemeToggle from "./ThemeToggle";

export default function AdminLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const isActive = (path) => {
    if (path === "/admin") {
      return location.pathname === "/admin";
    }
    return location.pathname.startsWith(path);
  };

  const navSections = [
    {
      title: "Gestión Bancaria",
      items: [
        { path: "/admin", label: "Panel Principal", icon: LayoutDashboard },
        { path: "/admin/users", label: "Usuarios", icon: Users },
        { path: "/admin/loans", label: "Préstamos", icon: Landmark },
        { path: "/admin/transactions", label: "Transacciones", icon: ArrowLeftRight },
      ],
    },
    {
      title: "Control & Auditoría",
      items: [
        { path: "/admin/reports", label: "Reportes", icon: FileSpreadsheet },
        { path: "/admin/database", label: "Base de Datos", icon: Database },
      ],
    },
    {
      title: "Accesos Externos",
      items: [
        { path: "/dashboard", label: "Portal Cliente", icon: ExternalLink, external: true },
        { path: "http://localhost:8080/h2-console", label: "Consola H2", icon: Terminal, external: true, rawHref: true },
      ],
    },
  ];

  return (
    <div className={`admin-dashboard ${isSidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      {isSidebarCollapsed && (
        <button
          type="button"
          onClick={() => setIsSidebarCollapsed(false)}
          style={{
            position: "fixed",
            top: "16px",
            left: "16px",
            zIndex: 1000,
            background: "var(--bg-card, #ffffff)",
            border: "1px solid var(--border-subtle, #e4e4e7)",
            color: "var(--text-primary, #09090b)",
            width: "36px",
            height: "36px",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
          }}
          aria-label="Mostrar menú"
        >
          <ChevronRight size={18} />
        </button>
      )}

      <div className="admin-mobile-bar client-mobile-bar">
        <div className="admin-brand-compact client-brand-compact">
          <img
            src="/logo_trimmed.png"
            alt="NeoBank"
            style={{ height: "28px", width: "auto", background: "transparent" }}
          />
          <span className="admin-brand-text client-brand-text">NEOBANK</span>
          <span className="admin-pill-tag client-pill-tag">ADMIN</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <ThemeToggle variant="icon" />
          <button
            type="button"
            className="admin-mobile-toggle client-mobile-toggle"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div
          className="admin-sidebar-overlay client-sidebar-overlay"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside className={`admin-sidebar client-sidebar ${mobileOpen ? "open" : ""}`}>
        <div className="admin-sidebar-header client-sidebar-header">
          <div className="client-brand-top-row">
            <Link
              to="/admin"
              className="admin-brand-link client-brand-link"
              onClick={() => setMobileOpen(false)}
            >
              <div className="admin-brand-visual client-brand-visual">
                <img
                  src="/logo_trimmed.png"
                  alt="NeoBank"
                  style={{ height: "32px", width: "auto", background: "transparent", display: "block" }}
                />
                <div className="admin-brand-info client-brand-info">
                  <span className="admin-brand-title client-brand-title">NEOBANK</span>
                  <span className="admin-brand-tagline client-brand-tagline">CONSOLA ADMIN</span>
                </div>
              </div>
            </Link>

            <button
              type="button"
              className="sidebar-collapse-btn"
              aria-label="Colapsar menú lateral"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            >
              <ChevronLeft size={16} />
            </button>
          </div>

          <div className="admin-system-status client-system-status">
            <div className="status-indicator-left">
              <span
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  backgroundColor: "#10b981",
                  display: "inline-block",
                }}
              />
              <span>Sistema Operativo</span>
            </div>
            <span
              style={{
                fontSize: "10px",
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: "9999px",
                backgroundColor: "#f4f4f5",
                color: "#09090b",
                border: "1px solid #e4e4e7",
              }}
            >
              PROD
            </span>
          </div>
        </div>

        <nav className="admin-nav client-nav" aria-label="Navegación de administración">
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="admin-nav-section client-nav-section">
              <span className="admin-section-heading client-section-heading">{section.title}</span>
              <ul className="admin-menu-list client-menu-list">
                {section.items.map((item) => {
                  const active = isActive(item.path);
                  const Icon = item.icon;
                  return (
                    <li
                      key={item.path}
                      className={`admin-menu-item client-menu-item ${active ? "active" : ""}`}
                    >
                      {item.rawHref ? (
                        <a
                          href={item.path}
                          target="_blank"
                          rel="noreferrer"
                          className="admin-menu-link client-menu-link"
                          onClick={() => setMobileOpen(false)}
                        >
                          <div className="admin-menu-icon-wrap client-menu-icon-wrap">
                            <Icon size={18} className="admin-nav-icon client-nav-icon" />
                          </div>
                          <span className="admin-menu-label client-menu-label">{item.label}</span>
                        </a>
                      ) : (
                        <Link
                          to={item.path}
                          target={item.external ? "_blank" : undefined}
                          rel={item.external ? "noreferrer" : undefined}
                          onClick={() => setMobileOpen(false)}
                          className="admin-menu-link client-menu-link"
                          aria-current={active ? "page" : undefined}
                        >
                          <div className="admin-menu-icon-wrap client-menu-icon-wrap">
                            <Icon size={18} className="admin-nav-icon client-nav-icon" />
                          </div>
                          <span className="admin-menu-label client-menu-label">{item.label}</span>
                          {active && !item.external && (
                            <ChevronRight size={14} className="admin-active-arrow client-active-arrow" />
                          )}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="admin-sidebar-footer client-sidebar-footer">
          <div className="admin-user-card client-user-card">
            <div className="client-user-info-link" style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: 0 }}>
              <div className="admin-avatar client-user-avatar">AD</div>
              <div className="admin-user-details client-user-details">
                <span className="admin-user-name client-user-name">Administrador</span>
                <span className="admin-user-role client-user-balance">
                  <ShieldCheck size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: "3px" }} /> Superuser
                </span>
              </div>
            </div>

            <div className="client-footer-actions">
              <ThemeToggle variant="icon" className="sidebar-theme-toggle" />
              <button
                type="button"
                className="admin-logout-icon-btn client-logout-btn"
                onClick={handleLogout}
                title="Cerrar sesión"
                aria-label="Cerrar sesión"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      <main className="admin-main">{children}</main>
    </div>
  );
}