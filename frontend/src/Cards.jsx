import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  CreditCard,
  Plus,
  Shield,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  RefreshCw,
  Sliders,
  Key,
  Globe,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Zap,
} from "lucide-react";
import ClientLayout from "./ClientLayout";
import MetricCard from "./MetricCard";
import "./Dashboard.css";
import "./Cards.css";
import "./LightMode.css";

export default function Cards() {
  const navigate = useNavigate();
  const [cards, setCards] = useState([]);
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNumbers, setShowNumbers] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLimitsModal, setShowLimitsModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [newCardType, setNewCardType] = useState("VIRTUAL");
  const [newCardColor, setNewCardColor] = useState("obsidian");
  const [newCardDaily, setNewCardDaily] = useState("500");
  const [newCardMonthly, setNewCardMonthly] = useState("2000");
  const [newCardPin, setNewCardPin] = useState("1234");
  const [newCardHolder, setNewCardHolder] = useState("");

  const [editDailyLimit, setEditDailyLimit] = useState("");
  const [editMonthlyLimit, setEditMonthlyLimit] = useState("");
  const [editPin, setEditPin] = useState("");
  const [editPinConfirm, setEditPinConfirm] = useState("");

  const [feedbackSuccess, setFeedbackSuccess] = useState("");
  const [feedbackError, setFeedbackError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const token = localStorage.getItem("token");

  const fetchCards = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await axios.get("/api/cards", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = Array.isArray(res.data) ? res.data : [];
      setCards(data);
      if (data.length > 0) {
        setSelectedCardId((prev) => {
          const exists = data.some((c) => c.id === prev);
          return exists ? prev : data[0].id;
        });
      } else {
        setSelectedCardId(null);
      }
    } catch (err) {
      setFeedbackError("No se pudieron cargar las tarjetas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchCards();
  }, [token]);

  const selectedCard = cards.find((c) => c.id === selectedCardId) || cards[0];

  const showSuccess = (msg) => {
    setFeedbackSuccess(msg);
    setTimeout(() => setFeedbackSuccess(""), 4000);
  };

  const showError = (msg) => {
    setFeedbackError(msg);
    setTimeout(() => setFeedbackError(""), 5000);
  };

  const handleCreateCard = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setFeedbackError("");
    try {
      const res = await axios.post(
        "/api/cards",
        {
          cardType: newCardType,
          color: newCardColor,
          dailyLimit: parseFloat(newCardDaily) || 500,
          monthlyLimit: parseFloat(newCardMonthly) || 2000,
          pin: newCardPin || "1234",
          cardHolder: newCardHolder || undefined,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowCreateModal(false);
      showSuccess("Tarjeta emitida exitosamente.");
      await fetchCards();
      if (res.data?.id) setSelectedCardId(res.data.id);
    } catch (err) {
      showError(err.response?.data?.message || "Error al crear la tarjeta.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleFreeze = async () => {
    if (!selectedCard) return;
    setActionLoading(true);
    try {
      const isFrozen = selectedCard.status === "FROZEN";
      const endpoint = isFrozen
        ? `/api/cards/${selectedCard.id}/unfreeze`
        : `/api/cards/${selectedCard.id}/freeze`;
      await axios.patch(endpoint, {}, { headers: { Authorization: `Bearer ${token}` } });
      showSuccess(isFrozen ? "Tarjeta desbloqueada y lista para usar." : "Tarjeta congelada temporalmente.");
      await fetchCards();
    } catch (err) {
      showError("No se pudo cambiar el estado de la tarjeta.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleOnline = async () => {
    if (!selectedCard) return;
    setActionLoading(true);
    try {
      await axios.patch(
        `/api/cards/${selectedCard.id}/toggle-online`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showSuccess("Preferencia de compras por internet actualizada.");
      await fetchCards();
    } catch (err) {
      showError("Error al actualizar la configuración de pagos online.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRegenerate = async () => {
    if (!selectedCard) return;
    if (!window.confirm("¿Deseas generar nuevos números y CVV para esta tarjeta? Los números anteriores dejarán de funcionar.")) return;
    setActionLoading(true);
    try {
      await axios.post(
        `/api/cards/${selectedCard.id}/regenerate`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showSuccess("Datos de tarjeta regenerados.");
      await fetchCards();
    } catch (err) {
      showError("Error al regenerar la tarjeta.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveLimits = async (e) => {
    e.preventDefault();
    if (!selectedCard) return;
    setActionLoading(true);
    try {
      await axios.patch(
        `/api/cards/${selectedCard.id}/limits`,
        {
          dailyLimit: parseFloat(editDailyLimit) || selectedCard.dailyLimit,
          monthlyLimit: parseFloat(editMonthlyLimit) || selectedCard.monthlyLimit,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowLimitsModal(false);
      showSuccess("Límites de gasto actualizados.");
      await fetchCards();
    } catch (err) {
      showError("Error al actualizar los límites.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSavePin = async (e) => {
    e.preventDefault();
    if (!selectedCard) return;
    if (!/^\d{4}$/.test(editPin)) {
      showError("El PIN debe tener exactamente 4 dígitos numéricos.");
      return;
    }
    if (editPin !== editPinConfirm) {
      showError("Los PINs ingresados no coinciden.");
      return;
    }
    setActionLoading(true);
    try {
      await axios.patch(
        `/api/cards/${selectedCard.id}/pin`,
        { pin: editPin },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowPinModal(false);
      setEditPin("");
      setEditPinConfirm("");
      showSuccess("PIN actualizado exitosamente.");
      await fetchCards();
    } catch (err) {
      showError("Error al actualizar el PIN.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCard = async () => {
    if (!selectedCard) return;
    setActionLoading(true);
    try {
      await axios.delete(`/api/cards/${selectedCard.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowDeleteModal(false);
      showSuccess("Tarjeta eliminada permanentemente.");
      await fetchCards();
    } catch (err) {
      showError("No se pudo eliminar la tarjeta.");
    } finally {
      setActionLoading(false);
    }
  };

  const formatCardNum = (num, reveal) => {
    if (!num) return "•••• •••• •••• ••••";
    const cleaned = num.replace(/\s+/g, "");
    if (reveal) {
      return cleaned.replace(/(.{4})/g, "$1 ").trim();
    }
    const last4 = cleaned.slice(-4);
    return `•••• •••• •••• ${last4}`;
  };

  const formatExpiry = (expiryDate) => {
    if (!expiryDate) return "12/28";
    const parts = expiryDate.split("-");
    if (parts.length >= 2) {
      return `${parts[1]}/${parts[0].slice(-2)}`;
    }
    return expiryDate;
  };

  return (
    <ClientLayout
      active="cards"
      title="Tarjetas y Medios de Pago"
      subtitle="Gestiona tus tarjetas físicas, virtuales y desechables para compras seguras"
    >
      {feedbackSuccess && (
        <div className="alert-banner success" role="alert">
          <CheckCircle2 size={18} />
          <span>{feedbackSuccess}</span>
        </div>
      )}
      {feedbackError && (
        <div className="alert-banner error" role="alert">
          <AlertCircle size={18} />
          <span>{feedbackError}</span>
        </div>
      )}

      <div className="account-metrics-grid">
        <MetricCard
          title="Tarjetas Emitidas"
          value={`${cards.length}`}
          badge={`${cards.filter((c) => c.status === "ACTIVE").length} activas`}
          accent="primary"
        />
        <MetricCard
          title="Tarjetas Virtuales"
          value={`${
            cards.filter(
              (c) =>
                c.cardType === "VIRTUAL" ||
                c.cardType === "DISPOSABLE" ||
                c.type === "VIRTUAL" ||
                c.type === "DISPOSABLE"
            ).length
          }`}
          badge="Compras online"
          accent="emerald"
        />
        <MetricCard
          title="Tarjetas Físicas"
          value={`${
            cards.filter((c) => c.cardType === "PHYSICAL" || c.type === "PHYSICAL")
              .length
          }`}
          badge="Pagos presenciales"
          accent="cyan"
        />
        <MetricCard
          title="Tarjetas Bloqueadas"
          value={`${cards.filter((c) => c.status === "FROZEN" || c.status === "BLOCKED").length}`}
          badge="Control preventivo"
          accent="amber"
        />
      </div>

      <div className="cards-topbar-actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
          aria-label="Solicitar nueva tarjeta"
        >
          <Plus size={16} />
          <span>Nueva Tarjeta</span>
        </button>
      </div>

      {loading ? (
        <div className="cards-loading">
          <RefreshCw className="spin" size={28} />
          <p>Cargando tus tarjetas...</p>
        </div>
      ) : cards.length === 0 ? (
        <section className="cards-empty-state">
          <h2>Aún no tienes tarjetas activas</h2>
          <p>
            Genera tu primera tarjeta virtual al instante para realizar compras por internet con total protección y control de límites.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={16} /> Crear primera tarjeta virtual
          </button>
        </section>
      ) : (
        <div className="cards-layout-grid">
          <div className="card-preview-column">
            <div
              className={`realistic-card ${selectedCard?.color || "obsidian"} ${
                selectedCard?.status === "FROZEN" ? "card-frozen" : ""
              }`}
            >
              <div className="card-top-row">
                <div className="card-chip-container">
                  <div className="card-chip" />
                  <svg className="contactless-icon" viewBox="0 0 24 24" width="20" height="20">
                    <path
                      fill="currentColor"
                      d="M14.5 9.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5.67-1.5 1.5-1.5zm-3 0c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5.67-1.5 1.5-1.5z"
                    />
                  </svg>
                </div>
                <div className="card-type-badge">
                  {selectedCard?.cardType === "DISPOSABLE" ? (
                    <span className="badge-disposable">
                      <Zap size={12} /> DESECHABLE
                    </span>
                  ) : selectedCard?.cardType === "PHYSICAL" ? (
                    <span className="badge-physical">FÍSICA</span>
                  ) : (
                    <span className="badge-virtual">VIRTUAL</span>
                  )}
                </div>
              </div>

              <div className="card-number-row">
                <span className="card-number-text">
                  {formatCardNum(selectedCard?.cardNumber, showNumbers)}
                </span>
                <button
                  type="button"
                  className="btn-reveal-num"
                  onClick={() => setShowNumbers(!showNumbers)}
                  aria-label={showNumbers ? "Ocultar número" : "Ver número completo"}
                >
                  {showNumbers ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              <div className="card-bottom-row">
                <div className="card-holder-info">
                  <span className="card-info-label">TITULAR</span>
                  <span className="card-info-val">
                    {selectedCard?.cardHolder || "NEO CARDHOLDER"}
                  </span>
                </div>
                <div className="card-expiry-info">
                  <span className="card-info-label">EXPIRA</span>
                  <span className="card-info-val">
                    {formatExpiry(selectedCard?.expiryDate)}
                  </span>
                </div>
                <div className="card-cvv-info">
                  <span className="card-info-label">CVV</span>
                  <span className="card-info-val">
                    {showNumbers ? selectedCard?.cvv || "•••" : "•••"}
                  </span>
                </div>
              </div>

              {selectedCard?.status === "FROZEN" && (
                <div className="card-frozen-overlay">
                  <Lock size={28} />
                  <span>Tarjeta Bloqueada</span>
                </div>
              )}
            </div>

            <div className="card-quick-actions">
              <button
                type="button"
                className={`card-ctrl-btn ${selectedCard?.status === "FROZEN" ? "btn-unfreeze" : "btn-freeze"}`}
                onClick={handleToggleFreeze}
                disabled={actionLoading}
              >
                {selectedCard?.status === "FROZEN" ? (
                  <>
                    <Unlock size={17} />
                    <span>Descongelar</span>
                  </>
                ) : (
                  <>
                    <Lock size={17} />
                    <span>Congelar</span>
                  </>
                )}
              </button>

              <button
                type="button"
                className="card-ctrl-btn"
                onClick={() => {
                  setEditDailyLimit(selectedCard?.dailyLimit || "500");
                  setEditMonthlyLimit(selectedCard?.monthlyLimit || "2000");
                  setShowLimitsModal(true);
                }}
                disabled={actionLoading}
              >
                <Sliders size={17} />
                <span>Límites</span>
              </button>

              <button
                type="button"
                className="card-ctrl-btn"
                onClick={() => {
                  setEditPin("");
                  setEditPinConfirm("");
                  setShowPinModal(true);
                }}
                disabled={actionLoading}
              >
                <Key size={17} />
                <span>PIN</span>
              </button>

              {selectedCard?.cardType === "DISPOSABLE" && (
                <button
                  type="button"
                  className="card-ctrl-btn"
                  onClick={handleRegenerate}
                  disabled={actionLoading}
                >
                  <RefreshCw size={17} />
                  <span>Renovar</span>
                </button>
              )}

              <button
                type="button"
                className="card-ctrl-btn btn-delete"
                onClick={() => setShowDeleteModal(true)}
                disabled={actionLoading}
              >
                <Trash2 size={17} />
                <span>Eliminar</span>
              </button>
            </div>

            <div className="card-security-toggles">
              <div className="security-toggle-item">
                <div className="toggle-info">
                  <Globe size={18} className="toggle-icon" />
                  <div>
                    <strong>Compras por Internet</strong>
                    <p>Habilita o restringe transacciones en comercios online y pasarelas de pago.</p>
                  </div>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={Boolean(selectedCard?.onlinePaymentsEnabled)}
                    onChange={handleToggleOnline}
                    disabled={actionLoading}
                  />
                  <span className="slider round" />
                </label>
              </div>
            </div>
          </div>

          <div className="card-details-column">
            <div className="card-list-header">
              <h3>Tus Tarjetas ({cards.length})</h3>
              <span className="card-count-hint">Selecciona una tarjeta para administrarla</span>
            </div>

            <div className="cards-thumbnails-list">
              {(Array.isArray(cards) ? cards : []).map((c) => {
                const isSelected = c.id === selectedCard?.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    className={`card-thumbnail-item ${isSelected ? "selected" : ""}`}
                    onClick={() => setSelectedCardId(c.id)}
                  >
                    <div className="thumbnail-top">
                      <span className="thumbnail-type">
                        {c.cardType === "DISPOSABLE"
                          ? "Desechable"
                          : c.cardType === "PHYSICAL"
                          ? "Física"
                          : "Virtual"}
                      </span>
                      <span className={`thumbnail-status ${c.status.toLowerCase()}`}>
                        {c.status === "ACTIVE" ? "Activa" : "Congelada"}
                      </span>
                    </div>
                    <div className="thumbnail-number">
                      •••• •••• •••• {c.cardNumber ? c.cardNumber.slice(-4) : "••••"}
                    </div>
                    <div className="thumbnail-bottom">
                      <span>Límite diario: ${Number(c.dailyLimit || 0).toLocaleString()}</span>
                      <span>Expira: {formatExpiry(c.expiryDate)}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedCard && (
              <div className="card-limits-card">
                <h4>Límites y Parámetros Activos</h4>
                <div className="limits-metric-row">
                  <div className="limit-box">
                    <span className="limit-label">Límite Diario</span>
                    <strong className="limit-val">
                      ${Number(selectedCard.dailyLimit || 0).toLocaleString()} USD
                    </strong>
                  </div>
                  <div className="limit-box">
                    <span className="limit-label">Límite Mensual</span>
                    <strong className="limit-val">
                      ${Number(selectedCard.monthlyLimit || 0).toLocaleString()} USD
                    </strong>
                  </div>
                  <div className="limit-box">
                    <span className="limit-label">Compras Online</span>
                    <strong className="limit-val">
                      {selectedCard.onlinePaymentsEnabled ? "Permitidas" : "Bloqueadas"}
                    </strong>
                  </div>
                </div>

                <div className="security-notice-box">
                  <Shield size={18} className="shield-icon" />
                  <div>
                    <strong>Protección Antifraude</strong>
                    <p>
                      Tus operaciones están protegidas con validación de límites en tiempo real y control de bloqueo inmediato.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Emitir Nueva Tarjeta</h2>
            <p className="modal-desc">
              Elige el formato de tarjeta que mejor se adapte a tus hábitos de compra.
            </p>

            <form onSubmit={handleCreateCard} className="modal-form-stack">
              <div className="form-group">
                <label className="form-label">Tipo de Tarjeta</label>
                <div className="card-type-picker">
                  <button
                    type="button"
                    className={`type-option ${newCardType === "VIRTUAL" ? "active" : ""}`}
                    onClick={() => setNewCardType("VIRTUAL")}
                  >
                    <strong>Virtual</strong>
                    <span>Uso continuo para compras online</span>
                  </button>

                  <button
                    type="button"
                    className={`type-option ${newCardType === "DISPOSABLE" ? "active" : ""}`}
                    onClick={() => setNewCardType("DISPOSABLE")}
                  >
                    <strong>Desechable</strong>
                    <span>Renovable tras una compra</span>
                  </button>

                  <button
                    type="button"
                    className={`type-option ${newCardType === "PHYSICAL" ? "active" : ""}`}
                    onClick={() => setNewCardType("PHYSICAL")}
                  >
                    <strong>Física</strong>
                    <span>Para pagos presenciales y cajeros</span>
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Acabado de Tarjeta</label>
                <div className="color-palette-picker">
                  {[
                    { id: "obsidian", name: "Obsidiana", bg: "#09090b" },
                    { id: "emerald", name: "Esmeralda", bg: "#065f46" },
                    { id: "cyan", name: "Cian", bg: "#0369a1" },
                    { id: "ocean", name: "Marino", bg: "#1e3a8a" },
                  ].map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className={`color-chip ${newCardColor === c.id ? "active" : ""}`}
                      style={{ backgroundColor: c.bg }}
                      onClick={() => setNewCardColor(c.id)}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="cardHolderInput">
                  Nombre del Titular (Opcional)
                </label>
                <input
                  id="cardHolderInput"
                  type="text"
                  className="form-control"
                  placeholder="Ej. CARLOS GÓMEZ"
                  value={newCardHolder}
                  onChange={(e) => setNewCardHolder(e.target.value)}
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="dailyLimitInput">
                    Límite Diario ($ USD)
                  </label>
                  <input
                    id="dailyLimitInput"
                    type="number"
                    min="10"
                    max="100000"
                    className="form-control"
                    value={newCardDaily}
                    onChange={(e) => setNewCardDaily(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="monthlyLimitInput">
                    Límite Mensual ($ USD)
                  </label>
                  <input
                    id="monthlyLimitInput"
                    type="number"
                    min="50"
                    max="500000"
                    className="form-control"
                    value={newCardMonthly}
                    onChange={(e) => setNewCardMonthly(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="pinInput">
                  PIN de Seguridad (4 dígitos)
                </label>
                <input
                  id="pinInput"
                  type="password"
                  maxLength={4}
                  pattern="\d{4}"
                  className="form-control"
                  value={newCardPin}
                  onChange={(e) => setNewCardPin(e.target.value)}
                  required
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? "Emitiendo..." : "Confirmar Emisión"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showLimitsModal && (
        <div className="modal-overlay" onClick={() => setShowLimitsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Configurar Límites de Gasto</h2>
            <p className="modal-desc">
              Ajusta los topes autorizados para la tarjeta terminada en *{selectedCard?.cardNumber?.slice(-4)}.
            </p>

            <form onSubmit={handleSaveLimits} className="modal-form-stack">
              <div className="form-group">
                <label className="form-label" htmlFor="editDaily">Límite Diario ($ USD)</label>
                <input
                  id="editDaily"
                  type="number"
                  min="10"
                  step="10"
                  className="form-control"
                  value={editDailyLimit}
                  onChange={(e) => setEditDailyLimit(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="editMonthly">Límite Mensual ($ USD)</label>
                <input
                  id="editMonthly"
                  type="number"
                  min="50"
                  step="50"
                  className="form-control"
                  value={editMonthlyLimit}
                  onChange={(e) => setEditMonthlyLimit(e.target.value)}
                  required
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowLimitsModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? "Guardando..." : "Guardar Límites"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPinModal && (
        <div className="modal-overlay" onClick={() => setShowPinModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Cambiar PIN de Tarjeta</h2>
            <p className="modal-desc">
              Define un nuevo código PIN de 4 dígitos para retiros y autorizaciones.
            </p>

            <form onSubmit={handleSavePin} className="modal-form-stack">
              <div className="form-group">
                <label className="form-label" htmlFor="newPinInput">Nuevo PIN (4 dígitos)</label>
                <input
                  id="newPinInput"
                  type="password"
                  maxLength={4}
                  pattern="\d{4}"
                  className="form-control"
                  placeholder="••••"
                  value={editPin}
                  onChange={(e) => setEditPin(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="confirmPinInput">Confirmar Nuevo PIN</label>
                <input
                  id="confirmPinInput"
                  type="password"
                  maxLength={4}
                  pattern="\d{4}"
                  className="form-control"
                  placeholder="••••"
                  value={editPinConfirm}
                  onChange={(e) => setEditPinConfirm(e.target.value)}
                  required
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowPinModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? "Actualizando..." : "Confirmar PIN"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>¿Eliminar Tarjeta?</h2>
            <p className="modal-desc">
              Esta acción cancelará permanentemente la tarjeta terminada en *{selectedCard?.cardNumber?.slice(-4)}.
            </p>

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowDeleteModal(false)}
              >
                Volver
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDeleteCard}
                disabled={actionLoading}
              >
                {actionLoading ? "Eliminando..." : "Sí, Eliminar Tarjeta"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ClientLayout>
  );
}