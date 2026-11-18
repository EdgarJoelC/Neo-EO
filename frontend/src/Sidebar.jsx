import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  CreditCard,
  User,
  Settings as SettingsIcon,
  Coins,
  PiggyBank,
  ArrowLeftRight,
  BarChart3,
  Landmark,
  Receipt,
  ShieldCheck,
  LogOut,
  ChevronRight,
  ChevronLeft,
  Menu,
  X,
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { getUserTier } from "./tierUtils";

export default function Sidebar({ active, isCollapsed, onToggleCollapse }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const userTier = getUserTier(currentUser);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("user");
      if (saved) {
        setCurrentUser(JSON.parse(saved));
      }
    } catch (e) {}
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const currentPath = location.pathname;
  const currentActive =
    active ||
    (currentPath.includes("cards")
      ? "cards"
      : currentPath.includes("analytics")
      ? "analytics"
      : currentPath.includes("loans")
      ? "loans"
      : currentPath.includes("bills")
      ? "bills"
      : currentPath.includes("transactions")
      ? "transactions"
      : currentPath.includes("vaults")
      ? "vaults"
      : currentPath.includes("account") || currentPath.includes("edit-profile")
      ? "account"
      : currentPath.includes("crypto")
      ? "crypto"
      : currentPath.includes("settings")
      ? "settings"
      : "dashboard");

  const navSections = [
    {
      title: "Banca & Cuentas",
      items: [
        { id: "dashboard", label: "Inicio", path: "/dashboard", icon: LayoutDashboard },
        { id: "transactions", label: "Movimientos", path: "/transactions", icon: ArrowLeftRight },
        { id: "cards", label: "Tarjetas", path: "/cards", icon: CreditCard },
        { id: "vaults", label: "Bóvedas", path: "/vaults", icon: PiggyBank },
      ],
    },
    {
      title: "Operaciones & Créditos",
      items: [
        { id: "loans", label: "Préstamos", path: "/loans", icon: Landmark },
        { id: "bills", label: "Servicios & Facturas", path: "/bills", icon: Receipt },
        { id: "crypto", label: "Criptomonedas", path: "/crypto", icon: Coins },
      ],
    },
    {
      title: "Mi Espacio",
      items: [
        { id: "analytics", label: "Analíticas", path: "/analytics", icon: BarChart3 },
        { id: "account", label: "Mi Cuenta", path: "/account", icon: User },
        { id: "settings", label: "Configuración", path: "/settings", icon: SettingsIcon },
      ],
    },
  ];

  const getInitials = () => {
    if (!currentUser) return "NB";
    const f = currentUser.firstName ? currentUser.firstName[0] : "";
    const l = currentUser.lastName ? currentUser.lastName[0] : "";
    return (f + l).toUpperCase() || "NB";
  };

  const isAdmin = currentUser?.role === "ADMIN";

  return (
    <>
      {isCollapsed && (
        <button
          type="button"
          onClick={onToggleCollapse}
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

      <div className="client-mobile-bar">
        <div className="client-brand-compact">
          <img
            src="/logo_trimmed.png"
            alt="NeoBank"
            style={{ height: "28px", width: "auto", background: "transparent" }}
          />
          <span className="client-brand-text">NEOBANK</span>
          <span className="client-pill-tag">PERSONAL</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <ThemeToggle variant="icon" />
          <button
            type="button"
            className="client-mobile-toggle"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div
          className="client-sidebar-overlay"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside className={`client-sidebar ${mobileOpen ? "open" : ""}`}>
        <div className="client-sidebar-header">
          <div className="client-brand-top-row">
            <Link
              to="/dashboard"
              className="client-brand-link"
              onClick={() => setMobileOpen(false)}
            >
              <div className="client-brand-visual">
                <img
                  src="/logo_trimmed.png"
                  alt="NeoBank"
                  style={{ height: "32px", width: "auto", background: "transparent", display: "block" }}
                />
                <div className="client-brand-info">
                  <span className="client-brand-title">NEOBANK</span>
                  <span className="client-brand-tagline">BANCA PERSONAL</span>
                </div>
              </div>
            </Link>

            <button
              type="button"
              className="sidebar-collapse-btn"
              aria-label="Colapsar menú lateral"
              onClick={onToggleCollapse}
            >
              <ChevronLeft size={16} />
            </button>
          </div>

          <div className="client-system-status">
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
              <span>Cuenta Activa</span>
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
              {userTier?.shortName || "GOLD"}
            </span>
          </div>
        </div>

        <nav className="client-nav" aria-label="Navegación principal">
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="client-nav-section">
              <span className="client-section-heading">{section.title}</span>
              <ul className="client-menu-list">
                {section.items.map((item) => {
                  const isActive = currentActive === item.id;
                  const Icon = item.icon;
                  return (
                    <li
                      key={item.id}
                      className={`client-menu-item ${isActive ? "active" : ""}`}
                    >
                      <Link
                        to={item.path}
                        onClick={() => setMobileOpen(false)}
                        className="client-menu-link"
                        aria-current={isActive ? "page" : undefined}
                      >
                        <div className="client-menu-icon-wrap">
                          <Icon size={18} className="client-nav-icon" />
                        </div>
                        <span className="client-menu-label">{item.label}</span>
                        {isActive && (
                          <ChevronRight size={14} className="client-active-arrow" />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          {isAdmin && (
            <div className="client-nav-section">
              <span className="client-section-heading">Administración</span>
              <ul className="client-menu-list">
                <li className="client-menu-item">
                  <Link
                    to="/admin"
                    onClick={() => setMobileOpen(false)}
                    className="client-menu-link admin-switch-link"
                  >
                    <div className="client-menu-icon-wrap">
                      <ShieldCheck size={18} className="client-nav-icon" />
                    </div>
                    <span className="client-menu-label" style={{ fontWeight: 600 }}>
                      Panel Administrador
                    </span>
                    <span className="admin-shortcut-tag">ADMIN</span>
                  </Link>
                </li>
              </ul>
            </div>
          )}
        </nav>

        <div className="client-sidebar-footer">
          <div className="client-user-card">
            <Link to="/account" className="client-user-info-link" title="Ver mi cuenta">
              <div className="client-user-avatar">{getInitials()}</div>
              <div className="client-user-details">
                <span className="client-user-name">
                  {currentUser?.firstName
                    ? `${currentUser.firstName} ${currentUser.lastName || ""}`
                    : "Usuario"}
                </span>
                <span className="client-user-balance">
                  {typeof currentUser?.balance === "number"
                    ? `$${currentUser.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })} USD`
                    : "Cuenta Activa"}
                </span>
              </div>
            </Link>

            <div className="client-footer-actions">
              <ThemeToggle variant="icon" className="sidebar-theme-toggle" />
              <button
                type="button"
                className="client-logout-btn"
                onClick={handleLogout}
                title="Cerrar Sesión"
                aria-label="Cerrar Sesión"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}