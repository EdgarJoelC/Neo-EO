import { Link } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Send,
  AlertCircle,
  X,
  RotateCcw,
  Copy,
  Check,
  Eye,
  EyeOff,
  ExternalLink,
  ShieldCheck,
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Zap,
  CreditCard,
} from "lucide-react";
import ClientLayout from "./ClientLayout";
import MetricCard from "./components/MetricCard";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import "./Dashboard.css";
import "./LightMode.css";

export default function Dashboard() {
  const [transactions, setTransactions] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [balance, setBalance] = useState(0);
  const [cards, setCards] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCardBack, setShowCardBack] = useState(false);
  const [selectedCardIndex, setSelectedCardIndex] = useState(null);
  const [cvc, setCvc] = useState("");
  const [isCardFlipped, setIsCardFlipped] = useState(true);
  const [showFullCardNumber, setShowFullCardNumber] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const [vaults, setVaults] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  const token = localStorage.getItem("token");
  // JSON.parse devuelve un objeto distinto en cada render. Como este objeto es
  // dependencia del useEffect de abajo, React lo veia siempre como cambiado y
  // reejecutaba las peticiones sin parar. Se parsea una sola vez por montaje.
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  }, []);

  const copyToClipboard = (text, field) => {
    if (!text) return;
    navigator.clipboard.writeText(String(text));
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  useEffect(() => {
    if (!user || !token) return;

    fetch(`/api/transactions/user/${user.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) return [];
        return res.json();
      })
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        const sorted = list
          .map((tx) => ({
            ...tx,
            date: tx.timestamp
              ? new Date(tx.timestamp).toLocaleString()
              : "Sin fecha",
            timestampValue: tx.timestamp ? new Date(tx.timestamp).getTime() : 0,
          }))
          .sort((a, b) => b.timestampValue - a.timestampValue);

        setTransactions(sorted.slice(0, 4));

        const today = new Date().toISOString().split("T")[0];
        const todaysSpending = sorted.filter((tx) => {
          const txDate = tx.timestamp
            ? new Date(tx.timestamp).toISOString().split("T")[0]
            : "";
          return (
            txDate === today &&
            (tx.type?.toUpperCase() === "WITHDRAWAL" ||
              tx.type?.toUpperCase() === "TRANSFER")
          );
        });

        let chartPoints = todaysSpending.map((tx) => ({
          time: new Date(tx.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          amount: Number(tx.amount),
        }));

        if (chartPoints.length === 1) {
          chartPoints.push({
            ...chartPoints[0],
            time: chartPoints[0].time + " ",
          });
        }

        setChartData(chartPoints);
      })
      .catch(() => setTransactions([]));

    fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        if (data) {
          setCurrentUser(data);
          if (typeof data.balance === "number") {
            setBalance(data.balance);
          }
        }
      })
      .catch(() => {});

    fetch("/api/vaults", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) return [];
        return res.json();
      })
      .then((data) => setVaults(Array.isArray(data) ? data : []))
      .catch(() => setVaults([]));

    fetch("/api/cards", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) return [];
        return res.json();
      })
      .then((data) => setCards(Array.isArray(data) ? data : []))
      .catch(() => setCards([]));
  }, [token, user]);

  const confirmNewCard = () => {
    fetch("/api/cards", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Status " + res.status);
        return res.json();
      })
      .then((newCard) => {
        setCards((prev) => [...(Array.isArray(prev) ? prev : []), newCard]);
        setShowAddModal(false);
      })
      .catch(() => {});
  };

  const cardColors = [
    "linear-gradient(135deg, #09090b 0%, #27272a 100%)",
    "linear-gradient(135deg, #18181b 0%, #3f3f46 100%)",
    "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
  ];

  const cardList = Array.isArray(cards) ? cards : [];
  const selectedCard =
    selectedCardIndex !== null && cardList[selectedCardIndex]
      ? cardList[selectedCardIndex]
      : null;

  const recentDeposits = (Array.isArray(transactions) ? transactions : []).filter(
    (t) => t.type?.toLowerCase() === "deposit"
  );
  const recentWithdrawals = (Array.isArray(transactions) ? transactions : []).filter(
    (t) =>
      t.type?.toLowerCase() === "withdrawal" ||
      t.type?.toLowerCase() === "transfer"
  );

  return (
    <ClientLayout
      active="dashboard"
      title="Panel Principal"
      subtitle="Resumen de tu actividad financiera y movimientos en tiempo real"
    >
      {currentUser?.status === "FROZEN" && (
        <div className="frozen-account-banner" role="alert">
          <AlertCircle size={18} />
          <span>
            <strong>Cuenta Congelada:</strong> Tu cuenta bancaria ha sido restringida por administración. Operaciones suspendidas.
          </span>
        </div>
      )}

      <div className="account-metrics-grid">
        <MetricCard
          title="Saldo Disponible"
          value={`$${(typeof balance === "number" ? balance : 0).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          badge="Cuenta Principal"
          badgeType="info"
          icon={Wallet}
          accent="primary"
          subtitle="Liquidez inmediata"
        />

        <MetricCard
          title="Ingresos Recientes"
          value={`+$${recentDeposits
            .reduce((sum, t) => sum + Number(t.amount || 0), 0)
            .toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          badge={`${recentDeposits.length} depósitos`}
          badgeType="success"
          icon={TrendingUp}
          accent="emerald"
          subtitle="Entradas registradas"
        />

        <MetricCard
          title="Gastos & Retiros"
          value={`-$${recentWithdrawals
            .reduce((sum, t) => sum + Number(t.amount || 0), 0)
            .toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          badge={`${recentWithdrawals.length} salidas`}
          badgeType="warning"
          icon={TrendingDown}
          accent="amber"
          subtitle="Salidas y transferencias"
        />

        <MetricCard
          title="Ahorro en Bóvedas"
          value={`$${(Array.isArray(vaults) ? vaults : [])
            .reduce((sum, v) => sum + Number(v.currentAmount || 0), 0)
            .toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          badge={`${(Array.isArray(vaults) ? vaults : []).length} metas`}
          badgeType="info"
          icon={PiggyBank}
          accent="cyan"
          subtitle="Fondos reservados"
        />
      </div>

      <div className="dashboard-layout">
        <div className="left-side">
          <div className="transactions">
            <h2>
              <span>Transacciones Recientes</span>
              <Link to="/transactions" className="dashboard-section-link">
                Ver todas
              </Link>
            </h2>
            <div className="transactions-list">
              {(Array.isArray(transactions) ? transactions : []).length === 0 ? (
                <div className="tx-empty-state">
                  <Wallet size={28} className="tx-empty-icon" />
                  <p className="tx-empty-title">Sin movimientos recientes</p>
                  <span className="tx-empty-subtitle">
                    Tus operaciones de depósito o transferencias se reflejarán aquí
                  </span>
                </div>
              ) : (
                (Array.isArray(transactions) ? transactions : []).map((tx, index) => (
                  <div key={index} className="transaction-row">
                    <div className="tx-left">
                      {tx.type?.toLowerCase() === "deposit" && (
                        <ArrowDownLeft className="tx-icon deposit" />
                      )}
                      {tx.type?.toLowerCase() === "withdrawal" && (
                        <ArrowUpRight className="tx-icon withdrawal" />
                      )}
                      {tx.type?.toLowerCase() === "transfer" && (
                        <Send className="tx-icon transfer" />
                      )}
                      <div className="tx-details">
                        <h4>
                          {tx.description ||
                            (tx.type === "DEPOSIT"
                              ? "Depósito recibido"
                              : tx.type === "WITHDRAWAL"
                              ? "Retiro de fondos"
                              : "Transferencia")}
                        </h4>
                        <span className="tx-date">{tx.date}</span>
                      </div>
                    </div>
                    <div className="tx-right">
                      <span
                        className={`tx-amount ${
                          tx.type?.toLowerCase() === "deposit"
                            ? "positive"
                            : "negative"
                        }`}
                      >
                        {tx.type?.toLowerCase() === "deposit" ? "+" : "-"}$
                        {Number(tx.amount).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="virtualCards">
            <div className="virtual-cards-header">
              <h2 className="vcH2">Tarjetas Virtuales</h2>
              <Link to="/cards" className="dashboard-section-link">
                Administrar
              </Link>
            </div>
            <div className="cards-carousel">
              {cardList.map((card, index) => (
                <div
                  key={card.id || index}
                  className="virtual-card"
                  style={{
                    background: cardColors[index % cardColors.length],
                  }}
                  onClick={() => {
                    setCvc(card.cvv);
                    setSelectedCardIndex(index);
                    setIsCardFlipped(true);
                    setShowFullCardNumber(false);
                    setShowCardBack(true);
                  }}
                >
                  <img
                    src="/tx.png"
                    alt="Chip"
                    className="card-chip-img"
                  />
                  <div className="card-number">
                    {card.cardNumber.match(/.{1,4}/g).join(" ")}
                  </div>
                  <div className="card-info">
                    <div>
                      <span className="label">TITULAR</span>
                      <h4>{user?.firstName + " " + user?.lastName}</h4>
                      <span>
                        Vence:{" "}
                        {new Date(card.expiryDate).toLocaleDateString("es-ES", {
                          month: "2-digit",
                          year: "2-digit",
                        })}
                      </span>
                    </div>
                    <img
                      src="/mc.png"
                      alt="Mastercard"
                      className="card-logo-img"
                    />
                  </div>
                </div>
              ))}

              <div
                className="virtual-card add-card"
                onClick={() => setShowAddModal(true)}
              >
                <div className="plus-sign">+</div>
                <p>Emitir Tarjeta</p>
              </div>
            </div>
          </div>
        </div>

        <div className="right-side">
          <div className="chart-box">
            <h2>
              <span>Actividad Diaria</span>
              <span className="chart-sub-label">Retiros y envíos</span>
            </h2>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                  <XAxis dataKey="time" stroke="#71717a" fontSize={11} />
                  <YAxis stroke="#71717a" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#09090b",
                      border: "1px solid #27272a",
                      borderRadius: "8px",
                      color: "#ffffff",
                      fontSize: "12px",
                    }}
                    formatter={(value) => [`$${Number(value).toFixed(2)} USD`, "Monto"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#09090b"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "#09090b" }}
                    activeDot={{ r: 5, fill: "#09090b" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-placeholder">
                <TrendingUp size={24} className="chart-placeholder-icon" />
                <p>Sin salidas registradas hoy</p>
                <span>Tus consumos diarios generarán la curva de actividad</span>
              </div>
            )}
          </div>

          <div className="available-cards">
            <h2>
              <span>Bóvedas de Ahorro</span>
              <Link to="/vaults" className="dashboard-section-link">
                Ver todas
              </Link>
            </h2>
            {vaults.length === 0 ? (
              <p className="vaults-empty-text">
                No tienes bóvedas activas.{" "}
                <Link to="/vaults" className="vaults-create-link">
                  Crear una meta
                </Link>
              </p>
            ) : (
              <div className="dashboard-vaults-list">
                {(Array.isArray(vaults) ? vaults : []).slice(0, 2).map((v) => {
                  const cur = Number(v.currentAmount || 0);
                  const tar = Number(v.targetAmount || 1);
                  const pct = Math.min(
                    100,
                    Math.round(v.progressPercentage ?? (cur / tar) * 100)
                  );
                  return (
                    <div key={v.id} className="dashboard-vault-item">
                      <div className="dashboard-vault-top">
                        <span className="dashboard-vault-name">{v.name}</span>
                        <span className="dashboard-vault-amounts">
                          ${cur.toFixed(2)} / ${tar.toFixed(2)}
                        </span>
                      </div>
                      <div className="dashboard-vault-track">
                        <div
                          className="dashboard-vault-fill"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="quick-actions-card">
            <h2>Operaciones Rápidas</h2>
            <div className="quick-actions-grid">
              <Link to="/transactions" className="quick-action-btn">
                <div className="quick-action-icon send">
                  <Send size={16} />
                </div>
                <div className="quick-action-labels">
                  <strong>Transferir</strong>
                  <span>Envío inmediato</span>
                </div>
              </Link>

              <Link to="/bills" className="quick-action-btn">
                <div className="quick-action-icon pay">
                  <Zap size={16} />
                </div>
                <div className="quick-action-labels">
                  <strong>Pagar Servicios</strong>
                  <span>Facturas y débitos</span>
                </div>
              </Link>

              <Link to="/loans" className="quick-action-btn">
                <div className="quick-action-icon credit">
                  <CreditCard size={16} />
                </div>
                <div className="quick-action-labels">
                  <strong>Solicitar Crédito</strong>
                  <span>Simulador y cuotas</span>
                </div>
              </Link>

              <Link to="/vaults" className="quick-action-btn">
                <div className="quick-action-icon vault">
                  <PiggyBank size={16} />
                </div>
                <div className="quick-action-labels">
                  <strong>Nueva Bóveda</strong>
                  <span>Ahorro por objetivos</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Emitir nueva tarjeta virtual</h2>
            <p className="modal-desc">
              Se generará una nueva tarjeta virtual activa para compras en línea con control de límites.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowAddModal(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={confirmNewCard}
              >
                Generar Tarjeta
              </button>
            </div>
          </div>
        </div>
      )}

      {showCardBack && selectedCard && (
        <div className="modal-overlay" onClick={() => setShowCardBack(false)}>
          <div
            className="modal-content card-detail-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="card-detail-header">
              <div>
                <h2>Detalles de Tarjeta</h2>
                <p className="modal-desc">
                  Credenciales para compras en línea
                </p>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowCardBack(false)}
                aria-label="Cerrar"
              >
                <X size={20} />
              </button>
            </div>

            <div className="card-preview-container">
              <div
                className={`card-3d-flipper ${isCardFlipped ? "flipped" : ""}`}
                onClick={() => setIsCardFlipped(!isCardFlipped)}
              >
                <div
                  className="card-face front"
                  style={{
                    background: cardColors[selectedCardIndex % cardColors.length],
                  }}
                >
                  <div className="card-face-top">
                    <img
                      src="/tx.png"
                      alt="Chip"
                      className="card-chip-img"
                    />
                    <span className="card-type-tag">
                      {selectedCard.cardType === "DISPOSABLE"
                        ? "DESECHABLE"
                        : selectedCard.cardType === "PHYSICAL"
                        ? "FÍSICA"
                        : "VIRTUAL"}
                    </span>
                  </div>

                  <div className="card-face-number">
                    {showFullCardNumber
                      ? selectedCard.cardNumber?.match(/.{1,4}/g)?.join(" ")
                      : `•••• •••• •••• ${selectedCard.cardNumber?.slice(-4)}`}
                  </div>

                  <div className="card-face-bottom">
                    <div>
                      <span className="label">TITULAR</span>
                      <h4>{user?.firstName + " " + user?.lastName}</h4>
                      <span className="card-exp">
                        VENCE:{" "}
                        {new Date(selectedCard.expiryDate).toLocaleDateString(
                          "es-ES",
                          { month: "2-digit", year: "2-digit" }
                        )}
                      </span>
                    </div>
                    <img
                      src="/mc.png"
                      alt="Mastercard"
                      className="card-logo-img"
                    />
                  </div>
                </div>

                <div
                  className="card-face back"
                  style={{
                    background: cardColors[selectedCardIndex % cardColors.length],
                  }}
                >
                  <div className="card-back-magnetic-strip" />

                  <div className="card-back-body">
                    <div className="card-back-signature-row">
                      <div className="card-signature-panel">
                        <span className="signature-watermark">FIRMA AUTORIZADA</span>
                      </div>
                      <div className="card-cvc-box">
                        <span className="cvc-small-label">CVC</span>
                        <span className="cvc-number">{selectedCard.cvv || cvc}</span>
                      </div>
                    </div>

                    <p className="card-back-disclaimer">
                      Tarjeta digital emitida por NeoBank. Para uso exclusivo del titular autorizado.
                    </p>

                    <div className="card-back-footer">
                      <div className="card-security-badge">
                        <ShieldCheck size={14} /> Protección Activa
                      </div>
                      <img
                        src="/mc.png"
                        alt="Mastercard"
                        className="card-logo-img-mini"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="card-flip-btn"
                onClick={() => setIsCardFlipped(!isCardFlipped)}
              >
                <RotateCcw size={15} />
                <span>{isCardFlipped ? "Ver Frente" : "Ver Reverso (CVC)"}</span>
              </button>
            </div>

            <div className="card-info-grid">
              <div className="card-info-row full-width">
                <span className="info-label">Número de Tarjeta</span>
                <div className="info-val-wrap">
                  <span className="info-mono">
                    {showFullCardNumber
                      ? selectedCard.cardNumber?.match(/.{1,4}/g)?.join(" ")
                      : `•••• •••• •••• ${selectedCard.cardNumber?.slice(-4)}`}
                  </span>
                  <div className="info-actions">
                    <button
                      type="button"
                      className="copy-mini-btn"
                      onClick={() => setShowFullCardNumber(!showFullCardNumber)}
                    >
                      {showFullCardNumber ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button
                      type="button"
                      className={`copy-mini-btn ${copiedField === "number" ? "copied" : ""}`}
                      onClick={() => copyToClipboard(selectedCard.cardNumber, "number")}
                    >
                      {copiedField === "number" ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="card-info-row">
                <span className="info-label">Vencimiento</span>
                <div className="info-val-wrap">
                  <span className="info-mono">
                    {new Date(selectedCard.expiryDate).toLocaleDateString(
                      "es-ES",
                      { month: "2-digit", year: "2-digit" }
                    )}
                  </span>
                </div>
              </div>

              <div className="card-info-row">
                <span className="info-label">Código CVC</span>
                <div className="info-val-wrap">
                  <span className="info-mono cvc-highlight">{selectedCard.cvv || cvc}</span>
                  <button
                    type="button"
                    className={`copy-mini-btn ${copiedField === "cvc" ? "copied" : ""}`}
                    onClick={() => copyToClipboard(selectedCard.cvv || cvc, "cvc")}
                  >
                    {copiedField === "cvc" ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="card-modal-footer">
              <Link
                to="/cards"
                className="btn btn-secondary"
                onClick={() => setShowCardBack(false)}
              >
                <ExternalLink size={16} /> Gestionar Tarjetas
              </Link>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setShowCardBack(false)}
              >
                Listo
              </button>
            </div>
          </div>
        </div>
      )}
    </ClientLayout>
  );
}