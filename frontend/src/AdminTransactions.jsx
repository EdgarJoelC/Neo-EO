import { useState, useEffect } from "react";
import axios from "axios";
import AdminLayout from "./AdminLayout";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Search,
  RefreshCw,
  CreditCard,
  TrendingUp,
  Activity,
} from "lucide-react";
import { Pagination } from "./components";
import "./Admin.css";

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const token = localStorage.getItem("token");

  const fetchTransactions = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await axios.get(
        "http://localhost:8080/admin/recent-transactions?limit=100",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const mapped = (res.data || []).map((t) => {
        const rawType = (t.type || "").toUpperCase();
        const displayType =
          rawType === "DEPOSIT"
            ? "Depósito"
            : rawType === "WITHDRAWAL"
            ? "Retiro"
            : rawType === "TRANSFER"
            ? "Transferencia"
            : t.type || "";
        return {
          id: t.id,
          rawType,
          type: displayType,
          numericAmount: Number(t.amount) || 0,
          amount: `$${Number(t.amount || 0).toLocaleString("es-ES", { minimumFractionDigits: 2 })}`,
          user: t.user
            ? `${t.user.firstName || ""} ${t.user.lastName || ""}`.trim() || t.user.email
            : "Usuario no especificado",
          email: t.user?.email || "",
          description: t.description || "Sin concepto declarado",
          date: t.timestamp
            ? new Date(t.timestamp).toLocaleString("es-ES")
            : "Fecha no disponible",
        };
      });

      setTransactions(mapped);
    } catch (err) {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [token]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTransactions();
  };

  const totalVolume = transactions.reduce((acc, t) => acc + t.numericAmount, 0);
  const depositsCount = transactions.filter((t) => t.rawType === "DEPOSIT").length;
  const withdrawalsCount = transactions.filter((t) => t.rawType === "WITHDRAWAL").length;
  const transfersCount = transactions.filter((t) => t.rawType === "TRANSFER").length;

  const filteredTransactions = transactions.filter((t) => {
    const matchesType = typeFilter === "ALL" ? true : t.rawType === typeFilter;
    const term = searchTerm.toLowerCase().trim();
    if (!term) return matchesType;

    const matchesSearch =
      t.user.toLowerCase().includes(term) ||
      t.email.toLowerCase().includes(term) ||
      t.description.toLowerCase().includes(term) ||
      String(t.id).includes(term) ||
      t.amount.includes(term);

    return matchesType && matchesSearch;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  useEffect(() => {
    setCurrentPage(1);
  }, [typeFilter, searchTerm]);

  const totalItems = filteredTransactions.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

  return (
    <AdminLayout>
      <div className="admin-header-row">
        <div>
          <h1>Monitoreo y Registro de Transacciones</h1>
          <p>
            Supervisión continua de operaciones bancarias, transferencias electrónicas y movimientos de capital.
          </p>
        </div>

        <div className="admin-header-actions">
          <button
            type="button"
            className="quick-link-btn"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw size={15} className={refreshing ? "spin" : ""} />
            <span>{refreshing ? "Sincronizando..." : "Actualizar"}</span>
          </button>
        </div>
      </div>

      <div className="admin-kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header">
            <span>Total Movimientos</span>
            <div className="kpi-icon-wrapper">
              <CreditCard size={17} />
            </div>
          </div>
          <div className="kpi-value">{transactions.length}</div>
          <div className="kpi-footer">
            <span className="kpi-badge neutral">Operaciones auditadas</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span>Volumen Financiero</span>
            <div className="kpi-icon-wrapper">
              <TrendingUp size={17} />
            </div>
          </div>
          <div className="kpi-value">
            ${totalVolume.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
          </div>
          <div className="kpi-footer">
            <span className="kpi-badge positive">Flujo total procesado</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span>Desglose por Tipo</span>
            <div className="kpi-icon-wrapper">
              <Activity size={17} />
            </div>
          </div>
          <div className="kpi-value">{depositsCount + withdrawalsCount + transfersCount}</div>
          <div className="kpi-footer">
            <span className="kpi-badge neutral">
              {depositsCount} dep. / {withdrawalsCount} ret. / {transfersCount} transf.
            </span>
          </div>
        </div>
      </div>

      <div className="admin-content-box">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "18px" }}>
          <div className="admin-filter-tabs">
            {[
              { id: "ALL", label: `Todas (${transactions.length})` },
              { id: "DEPOSIT", label: `Depósitos (${depositsCount})` },
              { id: "WITHDRAWAL", label: `Retiros (${withdrawalsCount})` },
              { id: "TRANSFER", label: `Transferencias (${transfersCount})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`filter-tab-btn ${typeFilter === tab.id ? "active" : ""}`}
                onClick={() => setTypeFilter(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ position: "relative", minWidth: 260 }}>
            <Search size={16} style={{ position: "absolute", left: 12, top: 11, color: "#71717a" }} />
            <input
              type="text"
              placeholder="Buscar por usuario, correo o motivo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="report-input"
              style={{ paddingLeft: "36px" }}
            />
          </div>
        </div>

        <div className="table-responsive">
          {loading ? (
            <div style={{ padding: "48px 20px", textAlign: "center", color: "#71717a" }}>
              Cargando movimientos financieros...
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div style={{ padding: "48px 20px", textAlign: "center", color: "#71717a" }}>
              No se encontraron transacciones para el filtro aplicado.
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 60 }}>ID</th>
                  <th>Titular</th>
                  <th>Tipo</th>
                  <th>Monto</th>
                  <th>Concepto</th>
                  <th>Fecha y Hora</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTransactions.map((t) => {
                  const isDeposit = t.rawType === "DEPOSIT";
                  const isWithdrawal = t.rawType === "WITHDRAWAL";
                  return (
                    <tr key={t.id}>
                      <td style={{ color: "#71717a", fontSize: "0.78rem" }}>#{t.id}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: "inherit" }}>{t.user}</div>
                        {t.email && <div className="table-subtext">{t.email}</div>}
                      </td>
                      <td>
                        <span
                          className={`status-pill ${
                            isDeposit ? "approved" : isWithdrawal ? "rejected" : "paid"
                          }`}
                        >
                          {isDeposit ? (
                            <ArrowDownLeft size={13} />
                          ) : isWithdrawal ? (
                            <ArrowUpRight size={13} />
                          ) : (
                            <ArrowLeftRight size={13} />
                          )}
                          {t.type}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            fontWeight: 700,
                            fontVariantNumeric: "tabular-nums",
                            color: isDeposit ? "#059669" : isWithdrawal ? "#dc2626" : "inherit",
                          }}
                        >
                          {isDeposit ? `+${t.amount}` : isWithdrawal ? `-${t.amount}` : t.amount}
                        </span>
                      </td>
                      <td style={{ color: "#52525b", fontSize: "0.8rem" }}>{t.description}</td>
                      <td style={{ color: "#71717a", fontSize: "0.78rem", whiteSpace: "nowrap" }}>
                        {t.date}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {totalItems > pageSize && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            startIndex={startIndex}
            endIndex={endIndex}
            onPageChange={setCurrentPage}
            itemLabel="transacciones"
          />
        )}
      </div>
    </AdminLayout>
  );
}