import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Receipt,
  Plus,
  Zap,
  Droplets,
  Wifi,
  Smartphone,
  Tv,
  Home,
  Briefcase,
  Play,
  Pause,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Calendar,
  RefreshCw,
  Wallet,
} from "lucide-react";
import ClientLayout from "./ClientLayout";
import MetricCard from "./MetricCard";
import Modal from "./Modal";
import { Pagination } from "./components";
import "./Dashboard.css";
import "./Bills.css";
import "./LightMode.css";

const SERVICE_PROVIDERS = [
  { id: "ELECTRICITY", name: "Electricidad (Luz del Sur / Enel)", icon: Zap, defaultRef: "Suministro N° 849201" },
  { id: "WATER", name: "Agua Potable (Sedapal)", icon: Droplets, defaultRef: "Suministro N° 1029348" },
  { id: "INTERNET", name: "Internet y Fibra (Win / Claro / Movistar)", icon: Wifi, defaultRef: "Código Cliente N° 993821" },
  { id: "PHONE", name: "Telefonía Móvil (Claro / Movistar / Entel)", icon: Smartphone, defaultRef: "+51 912 345 678" },
  { id: "STREAMING", name: "Streaming y Entretenimiento", icon: Tv, defaultRef: "cuenta@usuario.com" },
  { id: "RENT", name: "Alquiler / Mantenimiento", icon: Home, defaultRef: "Dpto 402 - Alquiler" },
];

export default function Bills() {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [serviceType, setServiceType] = useState("ELECTRICITY");
  const [accountReference, setAccountReference] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState("MONTHLY");
  const [nextExecutionDate, setNextExecutionDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [autoDebit, setAutoDebit] = useState(true);
  const [payNow, setPayNow] = useState(false);

  const [feedbackSuccess, setFeedbackSuccess] = useState("");
  const [feedbackError, setFeedbackError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const token = localStorage.getItem("token");

  const fetchData = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [billsRes, userRes] = await Promise.all([
        axios.get("/api/scheduled-payments", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setPayments(billsRes.data || []);
      setBalance(userRes.data?.balance ?? 0);
    } catch (err) {
      setFeedbackError("No se pudieron cargar los servicios programados.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchData();
  }, [token]);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;
  const totalItems = payments.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedPayments = payments.slice(startIndex, endIndex);

  const showSuccess = (msg) => {
    setFeedbackSuccess(msg);
    setTimeout(() => setFeedbackSuccess(""), 4000);
  };

  const showError = (msg) => {
    setFeedbackError(msg);
    setTimeout(() => setFeedbackError(""), 5000);
  };

  const handleSelectProvider = (provider) => {
    setTitle(provider.name);
    setServiceType(provider.id);
    setAccountReference(provider.defaultRef);
    setAmount("");
    setPayNow(false);
    setShowModal(true);
  };

  const handleSavePayment = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      showError("Por favor ingresa un monto válido.");
      return;
    }

    if (payNow && balance < parseFloat(amount)) {
      showError("Saldo insuficiente para realizar el pago inmediato de este servicio.");
      return;
    }

    setActionLoading(true);
    try {
      await axios.post(
        "/api/scheduled-payments",
        {
          title,
          serviceType,
          accountReference,
          amount: parseFloat(amount),
          frequency,
          nextExecutionDate,
          autoDebit,
          payNow,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowModal(false);
      showSuccess(
        payNow
          ? "Servicio pagado y programado para los próximos periodos."
          : "Servicio programado correctamente."
      );
      await fetchData();
    } catch (err) {
      showError(err.response?.data?.message || "Error al programar el servicio.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleExecuteNow = async (id, paymentAmount, paymentTitle) => {
    if (balance < paymentAmount) {
      showError("Saldo insuficiente en tu cuenta bancaria para pagar este servicio.");
      return;
    }

    if (!window.confirm(`¿Confirmas el pago inmediato de $${paymentAmount} para "${paymentTitle}"?`)) {
      return;
    }

    setActionLoading(true);
    try {
      await axios.post(
        `/api/scheduled-payments/${id}/execute`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showSuccess(`Pago de $${paymentAmount} procesado para "${paymentTitle}".`);
      await fetchData();
    } catch (err) {
      showError(err.response?.data?.message || "Error al ejecutar el pago.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleTogglePause = async (id) => {
    setActionLoading(true);
    try {
      const res = await axios.patch(
        `/api/scheduled-payments/${id}/toggle-pause`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showSuccess(
        res.data?.status === "PAUSED"
          ? "Pago automático pausado."
          : "Pago automático reanudado."
      );
      await fetchData();
    } catch (err) {
      showError("Error al cambiar estado del pago.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Seguro que deseas cancelar este servicio programado?")) return;
    setActionLoading(true);
    try {
      await axios.delete(`/api/scheduled-payments/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showSuccess("Servicio programado eliminado.");
      await fetchData();
    } catch (err) {
      showError("Error al eliminar el servicio.");
    } finally {
      setActionLoading(false);
    }
  };

  const getServiceIcon = (type) => {
    const provider = SERVICE_PROVIDERS.find((p) => p.id === type);
    if (provider) {
      const Icon = provider.icon;
      return <Icon size={18} />;
    }
    return <Briefcase size={18} />;
  };

  const getFrequencyLabel = (freq) => {
    switch (freq) {
      case "WEEKLY":
        return "Semanal";
      case "BIWEEKLY":
        return "Quincenal";
      case "MONTHLY":
        return "Mensual";
      case "ONE_TIME":
        return "Pago Único";
      default:
        return freq;
    }
  };

  const activePayments = payments.filter((p) => p.status === "ACTIVE");
  const totalMonthlyCommitment = activePayments.reduce(
    (sum, p) => sum + Number(p.amount || 0),
    0
  );
  const autoDebitCount = activePayments.filter((p) => p.autoDebit).length;

  return (
    <ClientLayout
      active="bills"
      title="Pago de Servicios y Pagos Recurrentes"
      subtitle="Paga tus facturas de servicios, configura débito automático y evita fechas de vencimiento"
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
          title="Compromiso Mensual"
          value={`$${totalMonthlyCommitment.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          badge={`${activePayments.length} servicios activos`}
          accent="amber"
        />
        <MetricCard
          title="Saldo en Cuenta"
          value={`$${Number(balance).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          badge="Disponible para pagos"
          accent="emerald"
        />
        <MetricCard
          title="Débitos Automáticos"
          value={`${autoDebitCount}`}
          badge="Cobros programados"
          accent="primary"
        />
        <MetricCard
          title="Servicios Totales"
          value={`${payments.length}`}
          badge="En tu agenda"
          accent="cyan"
        />
      </div>

      <div className="bills-topbar-actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setTitle("");
            setServiceType("ELECTRICITY");
            setAccountReference("");
            setAmount("");
            setPayNow(false);
            setShowModal(true);
          }}
          aria-label="Programar nuevo pago"
        >
          <Plus size={16} />
          <span>Programar Servicio</span>
        </button>
      </div>

      <section className="bills-catalog-section" aria-label="Catálogo de servicios populares">
        <div className="bills-section-head">
          <h3>Paga tus Servicios Frecuentes</h3>
          <span className="catalog-subtitle">Selecciona un servicio para pagar al instante o programar</span>
        </div>

        <div className="catalog-cards-grid">
          {SERVICE_PROVIDERS.map((provider) => {
            const Icon = provider.icon;
            return (
              <button
                key={provider.id}
                type="button"
                className="service-catalog-card"
                onClick={() => handleSelectProvider(provider)}
              >
                <div className="catalog-icon-wrap">
                  <Icon size={20} />
                </div>
                <div className="catalog-info">
                  <strong>{provider.name}</strong>
                  <span>Pago rápido con débito</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="scheduled-payments-section">
        <div className="bills-section-head">
          <div>
            <h3>Tus Pagos Programados y Facturas ({payments.length})</h3>
            <p className="subtitle">
              Pagos automáticos activos gestionados desde tu cuenta NeoBank.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="bills-loading">
            <RefreshCw className="spin" size={28} />
            <p>Cargando servicios programados...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="bills-empty-state">
            <Receipt size={36} className="empty-icon" />
            <h4>No tienes servicios ni facturas programadas</h4>
            <p>
              Selecciona uno de los servicios del catálogo superior o agrega tus facturas mensuales para pagar a tiempo.
            </p>
          </div>
        ) : (
          <div className="bills-table-card">
            <div className="bills-table-wrap">
              <table className="bills-table">
                <thead>
                  <tr>
                    <th>Servicio / Concepto</th>
                    <th>Referencia</th>
                    <th>Monto</th>
                    <th>Frecuencia</th>
                    <th>Próximo Pago</th>
                    <th>Modalidad</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPayments.map((p) => {
                    const isCompleted = p.status === "COMPLETED";
                    const isPaused = p.status === "PAUSED";

                    return (
                      <tr key={p.id}>
                        <td>
                          <div className="service-name-cell">
                            <div className="service-icon-box">
                              {getServiceIcon(p.serviceType)}
                            </div>
                            <div>
                              <strong>{p.title}</strong>
                              <span className="service-type-tag">{p.serviceType}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="ref-text">{p.accountReference || "—"}</span>
                        </td>
                        <td>
                          <strong className="amount-highlight">
                            ${Number(p.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} USD
                          </strong>
                        </td>
                        <td>{getFrequencyLabel(p.frequency)}</td>
                        <td>
                          <div className="date-cell">
                            <Calendar size={14} />
                            <span>{p.nextExecutionDate ? p.nextExecutionDate : "—"}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`mode-badge ${p.autoDebit ? "auto" : "manual"}`}>
                            {p.autoDebit ? "Débito Automático" : "Manual"}
                          </span>
                        </td>
                        <td>
                          <span className={`status-pill ${p.status.toLowerCase()}`}>
                            {p.status === "ACTIVE"
                              ? "Activo"
                              : p.status === "PAUSED"
                              ? "Pausado"
                              : "Completado"}
                          </span>
                        </td>
                        <td>
                          <div className="table-actions-row">
                            {!isCompleted && (
                              <>
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => handleExecuteNow(p.id, p.amount, p.title)}
                                  disabled={actionLoading}
                                >
                                  Pagar Ahora
                                </button>
                                <button
                                  type="button"
                                  className={`btn-icon-action ${isPaused ? "resume" : "pause"}`}
                                  onClick={() => handleTogglePause(p.id)}
                                  disabled={actionLoading}
                                  title={isPaused ? "Reanudar" : "Pausar"}
                                >
                                  {isPaused ? <Play size={15} /> : <Pause size={15} />}
                                </button>
                              </>
                            )}
                            <button
                              type="button"
                              className="btn-icon-action delete"
                              onClick={() => handleDelete(p.id)}
                              disabled={actionLoading}
                              title="Eliminar"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              startIndex={startIndex}
              endIndex={endIndex}
              onPageChange={setCurrentPage}
              itemLabel="servicios"
            />
          </div>
        )}
      </section>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Programar Pago de Servicio"
        subtitle="Ingresa los datos de tu factura o servicio para automatizar los pagos"
        icon={Receipt}
        maxWidth="520px"
      >
        <form onSubmit={handleSavePayment} className="bills-modal-form">
          <div className="form-group">
            <label className="form-label" htmlFor="serviceTitleInput">
              Nombre / Empresa del Servicio
            </label>
            <input
              id="serviceTitleInput"
              type="text"
              className="form-control"
              placeholder="Ej. Luz del Sur, Sedapal, Alquiler Dpto"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="bills-form-row-2">
            <div className="form-group">
              <label className="form-label" htmlFor="serviceTypeSelect">
                Tipo de Servicio
              </label>
              <select
                id="serviceTypeSelect"
                className="form-control"
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
              >
                <option value="ELECTRICITY">Electricidad</option>
                <option value="WATER">Agua Potable</option>
                <option value="INTERNET">Internet / Telecom</option>
                <option value="PHONE">Telefonía Móvil</option>
                <option value="STREAMING">Streaming</option>
                <option value="RENT">Alquiler / Expensas</option>
                <option value="OTHER">Otro Servicio</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="frequencySelect">
                Frecuencia de Pago
              </label>
              <select
                id="frequencySelect"
                className="form-control"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
              >
                <option value="MONTHLY">Mensual</option>
                <option value="BIWEEKLY">Quincenal</option>
                <option value="WEEKLY">Semanal</option>
                <option value="ONE_TIME">Pago Único</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="referenceInput">
              Referencia / Contrato / N° de Cuenta
            </label>
            <input
              id="referenceInput"
              type="text"
              className="form-control"
              placeholder="Ej. Suministro 1029348"
              value={accountReference}
              onChange={(e) => setAccountReference(e.target.value)}
              required
            />
          </div>

          <div className="bills-form-row-2">
            <div className="form-group">
              <label className="form-label" htmlFor="billAmountInput">
                Monto a Pagar ($ USD)
              </label>
              <input
                id="billAmountInput"
                type="number"
                min="1"
                step="0.01"
                className="form-control"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="nextDateInput">
                Fecha Próximo Pago
              </label>
              <input
                id="nextDateInput"
                type="date"
                className="form-control"
                value={nextExecutionDate}
                onChange={(e) => setNextExecutionDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="bills-checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={payNow}
                onChange={(e) => setPayNow(e.target.checked)}
              />
              <span>
                <strong>Pagar ahora mismo la primera cuota</strong> (se deducirá ${amount || "0.00"} USD inmediatamente de tu saldo)
              </span>
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={autoDebit}
                onChange={(e) => setAutoDebit(e.target.checked)}
              />
              <span>
                <strong>Habilitar Débito Automático</strong> (cobro desatendido en la fecha correspondiente)
              </span>
            </label>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowModal(false)}
            >
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={actionLoading}>
              {actionLoading ? "Guardando..." : payNow ? "Pagar y Programar" : "Guardar Servicio"}
            </button>
          </div>
        </form>
      </Modal>
    </ClientLayout>
  );
}