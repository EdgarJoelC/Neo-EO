import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Palette,
  Shield,
  Bell,
  Lock,
  Sun,
  Moon,
  Check,
  Globe,
  Coins,
  Download,
  LogOut,
  KeyRound,
  CheckCircle2,
} from "lucide-react";
import ClientLayout from "./ClientLayout";
import Modal from "./Modal";
import { getTheme, setTheme, THEMES } from "./themeManager";
import "./Settings.css";

export default function Settings() {
  const navigate = useNavigate();
  const [currentTheme, setCurrentTheme] = useState(getTheme());
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState({ type: "", text: "" });

  const [notifEmail, setNotifEmail] = useState(true);
  const [notifPush, setNotifPush] = useState(true);
  const [notifSms, setNotifSms] = useState(false);
  const [twoFactor, setTwoFactor] = useState(true);

  const [language, setLanguage] = useState(
    () => localStorage.getItem("preferredLanguage") || "es-PE"
  );
  const [currency, setCurrency] = useState(
    () => localStorage.getItem("preferredCurrency") || "PEN"
  );
  const [showToast, setShowToast] = useState(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const handleThemeChange = (e) => {
      if (e?.detail?.theme) {
        setCurrentTheme(e.detail.theme);
      } else {
        setCurrentTheme(getTheme());
      }
    };

    window.addEventListener("themechange", handleThemeChange);
    return () => window.removeEventListener("themechange", handleThemeChange);
  }, []);

  const triggerToast = (msg) => {
    setShowToast(msg);
    setTimeout(() => setShowToast(null), 2500);
  };

  const handleSelectTheme = (targetTheme) => {
    setTheme(targetTheme);
    setCurrentTheme(targetTheme);
    triggerToast(`Tema ${targetTheme === THEMES.LIGHT ? "Claro" : "Oscuro"} activado`);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "Las nuevas contraseñas no coinciden" });
      return;
    }

    try {
      await axios.patch(
        "/api/auth/change-password",
        { oldPassword, newPassword },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      setPasswordMsg({ type: "success", text: "Contraseña actualizada exitosamente" });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        setIsPasswordModalOpen(false);
        setPasswordMsg({ type: "", text: "" });
        triggerToast("Contraseña actualizada");
      }, 1500);
    } catch (err) {
      setPasswordMsg({
        type: "error",
        text: "Error al cambiar contraseña. Verifica tu contraseña actual.",
      });
    }
  };

  const handleExportData = () => {
    const user = localStorage.getItem("user");
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(user || "{}");
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "neobank_perfil_datos.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    triggerToast("Archivo de datos exportado");
  };

  return (
    <ClientLayout
      active="settings"
      title="Configuración"
      subtitle="Personaliza tus preferencias visuales, parámetros de seguridad y notificaciones"
    >
      <div className="settings-page-wrapper">
        {showToast && (
          <div className="copy-toast">
            <CheckCircle2 size={16} />
            <span>{showToast}</span>
          </div>
        )}

        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-header-icon-wrap">
              <Palette size={19} />
            </div>
            <div>
              <h3 className="settings-card-title">Apariencia & Visualización</h3>
              <p className="settings-card-desc">
                Elige el tema visual que mejor se adapte a tu entorno y luminosidad
              </p>
            </div>
          </div>

          <div className="theme-cards-grid">
            <div
              className={`theme-card-option ${currentTheme === THEMES.DARK ? "selected" : ""}`}
              onClick={() => handleSelectTheme(THEMES.DARK)}
              role="button"
              tabIndex={0}
            >
              <div className="theme-mockup-preview dark-mock">
                <div className="mock-sidebar">
                  <div className="mock-line accent" />
                  <div className="mock-line" />
                  <div className="mock-line" />
                </div>
                <div className="mock-body">
                  <div className="mock-card" />
                  <div className="mock-line" />
                </div>
              </div>

              <div className="theme-card-content">
                <div className="theme-card-info">
                  <span className="theme-card-title">
                    <Moon size={15} /> Modo Oscuro
                  </span>
                  <span className="theme-card-desc">
                    Recomendado para uso nocturno y menor fatiga visual
                  </span>
                </div>
                <div className="theme-check-dot">
                  {currentTheme === THEMES.DARK && <Check size={12} />}
                </div>
              </div>
            </div>

            <div
              className={`theme-card-option ${currentTheme === THEMES.LIGHT ? "selected" : ""}`}
              onClick={() => handleSelectTheme(THEMES.LIGHT)}
              role="button"
              tabIndex={0}
            >
              <div className="theme-mockup-preview light-mock">
                <div className="mock-sidebar">
                  <div className="mock-line accent" />
                  <div className="mock-line" />
                  <div className="mock-line" />
                </div>
                <div className="mock-body">
                  <div className="mock-card" />
                  <div className="mock-line" />
                </div>
              </div>

              <div className="theme-card-content">
                <div className="theme-card-info">
                  <span className="theme-card-title">
                    <Sun size={15} /> Modo Claro
                  </span>
                  <span className="theme-card-desc">
                    Máxima legibilidad y contraste en entornos iluminados
                  </span>
                </div>
                <div className="theme-check-dot">
                  {currentTheme === THEMES.LIGHT && <Check size={12} />}
                </div>
              </div>
            </div>
          </div>

          <div className="settings-rows-list">
            <div className="settings-item-row">
              <div className="settings-item-info">
                <span className="settings-item-title">
                  <Globe size={15} /> Idioma de la Plataforma
                </span>
                <span className="settings-item-desc">
                  Selecciona el idioma para mensajes, recibos y reportes
                </span>
              </div>
              <select
                className="settings-select"
                value={language}
                onChange={(e) => {
                  setLanguage(e.target.value);
                  localStorage.setItem("preferredLanguage", e.target.value);
                  triggerToast("Preferencia de idioma guardada");
                }}
              >
                <option value="es-PE">Español (Perú)</option>
                <option value="es">Español (Latinoamérica)</option>
                <option value="en">English (US)</option>
              </select>
            </div>

            <div className="settings-item-row">
              <div className="settings-item-info">
                <span className="settings-item-title">
                  <Coins size={15} /> Moneda Predeterminada
                </span>
                <span className="settings-item-desc">
                  Moneda base para balances consolidados e informes
                </span>
              </div>
              <select
                className="settings-select"
                value={currency}
                onChange={(e) => {
                  setCurrency(e.target.value);
                  localStorage.setItem("preferredCurrency", e.target.value);
                  window.dispatchEvent(
                    new CustomEvent("currencychange", { detail: { currency: e.target.value } })
                  );
                  triggerToast("Moneda base actualizada a " + e.target.value);
                }}
              >
                <option value="PEN">PEN (S/.) Sol Peruano</option>
                <option value="USD">USD ($) Dólar Estadounidense</option>
                <option value="EUR">EUR (€) Euro</option>
                <option value="MXN">MXN ($) Peso Mexicano</option>
              </select>
            </div>
          </div>
        </div>

        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-header-icon-wrap">
              <Shield size={19} />
            </div>
            <div>
              <h3 className="settings-card-title">Seguridad & Credenciales</h3>
              <p className="settings-card-desc">
                Gestiona tus métodos de acceso y protección contra accesos no autorizados
              </p>
            </div>
          </div>

          <div className="settings-rows-list">
            <div className="settings-item-row">
              <div className="settings-item-info">
                <span className="settings-item-title">Contraseña de Acceso</span>
                <span className="settings-item-desc">
                  Actualiza tu clave periódicamente para mantener tu cuenta protegida
                </span>
              </div>
              <button
                type="button"
                className="btn-hero-secondary btn-settings-sm"
                onClick={() => setIsPasswordModalOpen(true)}
              >
                <KeyRound size={15} /> Cambiar Contraseña
              </button>
            </div>

            <div className="settings-item-row">
              <div className="settings-item-info">
                <span className="settings-item-title">Autenticación en Dos Pasos (2FA)</span>
                <span className="settings-item-desc">
                  Solicita verificación adicional al realizar transferencias de alto valor
                </span>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={twoFactor}
                  onChange={() => {
                    setTwoFactor(!twoFactor);
                    triggerToast(!twoFactor ? "2FA Activado" : "2FA Desactivado");
                  }}
                />
                <span className="slider" />
              </label>
            </div>
          </div>
        </div>

        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-header-icon-wrap">
              <Bell size={19} />
            </div>
            <div>
              <h3 className="settings-card-title">Notificaciones & Alertas</h3>
              <p className="settings-card-desc">
                Configura los canales para recibir avisos de movimientos y seguridad
              </p>
            </div>
          </div>

          <div className="settings-rows-list">
            <div className="settings-item-row">
              <div className="settings-item-info">
                <span className="settings-item-title">Alertas por Correo Electrónico</span>
                <span className="settings-item-desc">
                  Recibe resúmenes de transferencias, depósitos y cambios de perfil
                </span>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={notifEmail}
                  onChange={() => setNotifEmail(!notifEmail)}
                />
                <span className="slider" />
              </label>
            </div>

            <div className="settings-item-row">
              <div className="settings-item-info">
                <span className="settings-item-title">Notificaciones Push en Navegador</span>
                <span className="settings-item-desc">
                  Avisos inmediatos al recibir fondos o ejecuciones programadas
                </span>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={notifPush}
                  onChange={() => setNotifPush(!notifPush)}
                />
                <span className="slider" />
              </label>
            </div>

            <div className="settings-item-row">
              <div className="settings-item-info">
                <span className="settings-item-title">Notificaciones SMS de Seguridad</span>
                <span className="settings-item-desc">
                  Códigos de autorización instantáneos a tu línea telefónica
                </span>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={notifSms}
                  onChange={() => setNotifSms(!notifSms)}
                />
                <span className="slider" />
              </label>
            </div>
          </div>
        </div>

        <div className="settings-card danger-zone">
          <div className="settings-card-header">
            <div className="settings-header-icon-wrap danger">
              <Lock size={19} />
            </div>
            <div>
              <h3 className="settings-card-title">Privacidad & Control de Sesión</h3>
              <p className="settings-card-desc">
                Exporta tus registros o desconecta tus credenciales del dispositivo
              </p>
            </div>
          </div>

          <div className="settings-rows-list">
            <div className="settings-item-row">
              <div className="settings-item-info">
                <span className="settings-item-title">Exportar Registro de Datos Personales</span>
                <span className="settings-item-desc">
                  Descarga un archivo con tu historial registrado en formato JSON
                </span>
              </div>
              <button
                type="button"
                className="btn-hero-secondary btn-settings-sm"
                onClick={handleExportData}
              >
                <Download size={15} /> Exportar Mis Datos
              </button>
            </div>

            <div className="settings-item-row">
              <div className="settings-item-info">
                <span className="settings-item-title danger-text">Cerrar Sesión Activa</span>
                <span className="settings-item-desc">
                  Finaliza la sesión actual y elimina los tokens de autenticación de este navegador
                </span>
              </div>
              <button
                type="button"
                className="btn btn-danger btn-settings-sm"
                onClick={handleLogout}
              >
                <LogOut size={15} /> Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="Cambiar Contraseña"
        subtitle="Ingresa tu clave actual y define tu nueva contraseña segura"
        icon={KeyRound}
        maxWidth="460px"
        footer={
          <>
            <button
              type="button"
              className="btn-hero-secondary"
              onClick={() => setIsPasswordModalOpen(false)}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn-hero-primary"
              onClick={handlePasswordChange}
            >
              Actualizar Contraseña
            </button>
          </>
        }
      >
        <form onSubmit={handlePasswordChange} className="password-modal-form">
          <div className="modal-form-group">
            <label>Contraseña Actual</label>
            <input
              type="password"
              className="modal-form-input"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
            />
          </div>

          <div className="modal-form-group">
            <label>Nueva Contraseña</label>
            <input
              type="password"
              className="modal-form-input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <div className="modal-form-group">
            <label>Confirmar Nueva Contraseña</label>
            <input
              type="password"
              className="modal-form-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {passwordMsg.text && (
            <div className={`password-msg-box ${passwordMsg.type}`}>
              {passwordMsg.text}
            </div>
          )}
        </form>
      </Modal>
    </ClientLayout>
  );
}