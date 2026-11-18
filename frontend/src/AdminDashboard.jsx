import { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import {
  Users,
  Landmark,
  TrendingUp,
  Activity,
  CheckCircle,
  RefreshCw,
  Database,
  ExternalLink,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { MetricCard, Pagination } from "./components";
import "./Admin.css";

const PIE_COLORS = ["#0284c7", "#10b981", "#f59e0b"];

export default function AdminDashboard() {
  const token = localStorage.getItem("token");

  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [resolvingId, setResolvingId] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const checkTheme = () => {
      const saved = localStorage.getItem("theme");
      setDarkMode(saved === "dark" || !document.body.classList.contains("light-mode"));
    };
    checkTheme();
  }, []);

  const getHeaders = () => ({
    Authorization: `Bearer ${token}`,
  });

  const fetchOverviewData = async () => {
    if (!token) return;
    try {
      const res = await axios.get("http://localhost:8080/admin/overview", {
        headers: getHeaders(),
      });
      setOverview(res.data);
    } catch (err) {
      try {
        const [balRes, usersRes, txRes] = await Promise.all([
          axios.get("http://localhost:8080/admin/total-balance", { headers: getHeaders() }),
          axios.get("http://localhost:8080/api/users", { headers: getHeaders() }),
          axios.get("http://localhost:8080/admin/recent-transactions?limit=10", { headers: getHeaders() }),
        ]);
        setOverview({
          kpis: {
            totalUsers: usersRes.data?.length || 0,
            activeUsers: usersRes.data?.filter((u) => u.status === "ACTIVE").length || 0,
            frozenUsers: usersRes.data?.filter((u) => u.status === "FROZEN").length || 0,
            totalDeposits: balRes.data || 0,
            totalLoansVolume: 0,
            activeLoansCount: 0,
            totalVaultSavings: 0,
            vaultsCount: 0,
            transactions24h: txRes.data?.length || 0,
            volume24h: 0,
            unresolvedIncidents: 0,
            openTickets: 0,
          },
          cashflow7Days: [],
          assetDistribution: [
            { name: "Depósitos", value: Number(balRes.data) || 0 },
            { name: "Bóvedas", value: 0 },
            { name: "Préstamos", value: 0 },
          ],
          transactionTypeBreakdown: [],
          recentIncidents: [],
          recentAuditLogs: [],
          recentTransactions: txRes.data || [],
        });
      } catch (fallbackErr) {}
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOverviewData();
  }, [token]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOverviewData();
  };

  const handleResolveIncident = async (incidentId) => {
    if (!incidentId || resolvingId) return;
    setResolvingId(incidentId);
    try {
      await axios.patch(
        `http://localhost:8080/admin/security-incidents/${incidentId}/resolve`,
        { notes: "Resuelto mediante panel ejecutivo de supervisión" },
        { headers: getHeaders() }
      );
      setOverview((prev) => {
        if (!prev) return prev;
        const updatedIncidents = prev.recentIncidents.map((inc) =>
          inc.id === incidentId
            ? { ...inc, resolved: true, resolutionNotes: "Resuelto por administrador" }
            : inc
        );
        const updatedKpis = {
          ...prev.kpis,
          unresolvedIncidents: Math.max(0, (prev.kpis?.unresolvedIncidents || 1) - 1),
        };
        return { ...prev, recentIncidents: updatedIncidents, kpis: updatedKpis };
      });
    } catch (err) {
      alert("No se pudo resolver el incidente.");
    } finally {
      setResolvingId(null);
    }
  };

  const kpis = overview?.kpis || {};
  const cashflow = overview?.cashflow7Days || [];
  const assets = overview?.assetDistribution || [];
  const typeBreakdown = overview?.transactionTypeBreakdown || [];
  const incidents = overview?.recentIncidents || [];
  const auditLogs = overview?.recentAuditLogs || [];

  const [auditPage, setAuditPage] = useState(1);
  const auditPageSize = 5;
  const totalAudit = auditLogs.length;
  const totalAuditPages = Math.max(1, Math.ceil(totalAudit / auditPageSize));
  const startAuditIdx = (auditPage - 1) * auditPageSize;
  const endAuditIdx = Math.min(startAuditIdx + auditPageSize, totalAudit);
  const paginatedAuditLogs = auditLogs.slice(startAuditIdx, endAuditIdx);

  if (loading && !overview) {
    return (
      <AdminLayout>
        <div style={{ padding: "64px 20px", textAlign: "center", color: "#71717a" }}>
          <RefreshCw size={28} className="spin" style={{ margin: "0 auto 12px", display: "block" }} />
          Cargando panel de control ejecutivo...
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="admin-header-row">
        <div>
          <h1>Panel de Control Ejecutivo</h1>
          <p>Supervisión financiera integral, análisis de liquidez y monitoreo de seguridad en tiempo real.</p>
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
          <Link to="/admin/database" className="quick-link-btn">
            <Database size={15} />
            <span>Explorador BD</span>
          </Link>
          <a
            href="http://localhost:8080/h2-console"
            target="_blank"
            rel="noreferrer"
            className="quick-link-btn"
            title="Abrir Consola H2 nativa"
          >
            <ExternalLink size={15} />
            <span>Consola H2</span>
          </a>
        </div>
      </div>

      <div className="admin-kpi-grid">
        <MetricCard
          title="Usuarios Registrados"
          value={`${kpis.totalUsers ?? 0}`}
          badge={`${kpis.activeUsers ?? 0} activos`}
          badgeType="success"
          accent="primary"
          subtitle={Number(kpis.frozenUsers) > 0 ? `${kpis.frozenUsers} congelados` : "Base de clientes activa"}
        />

        <MetricCard
          title="Total Depósitos"
          value={`$${Number(kpis.totalDeposits || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
          badge="Fondos líquidos"
          badgeType="success"
          accent="emerald"
          subtitle="En custodia de cuentas"
        />

        <MetricCard
          title="Cartera de Préstamos"
          value={`$${Number(kpis.totalLoansVolume || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
          badge={`${kpis.activeLoansCount ?? 0} vigentes`}
          badgeType="warning"
          accent="amber"
          subtitle="Capital colocado"
        />

        <MetricCard
          title="Volumen 24 Horas"
          value={`$${Number(kpis.volume24h || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
          badge={`${kpis.transactions24h ?? 0} operaciones`}
          badgeType="info"
          accent="cyan"
          subtitle="Actividad del día"
        />
      </div>

      <div className="admin-charts-grid">
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <h2>Flujo Financiero Semanal</h2>
              <span>Depósitos vs Retiros vs Transferencias (Últimos 7 días)</span>
            </div>
          </div>
          <div className="chart-viewport">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashflow} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDeposits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorWithdrawals" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#dc2626" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#dc2626" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorTransfers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#09090b" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#09090b" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#27272a" : "#f4f4f5"} />
                <XAxis dataKey="date" stroke="#71717a" fontSize={11} />
                <YAxis stroke="#71717a" fontSize={11} tickFormatter={(val) => `$${val}`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: darkMode ? "#18181b" : "#ffffff",
                    borderColor: darkMode ? "#27272a" : "#e4e4e7",
                    borderRadius: "8px",
                    color: darkMode ? "#fafafa" : "#09090b",
                    fontSize: "12px",
                  }}
                  formatter={(val) => [`$${Number(val).toLocaleString()}`, ""]}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                <Area
                  type="monotone"
                  dataKey="deposits"
                  name="Depósitos"
                  stroke="#059669"
                  fillOpacity={1}
                  fill="url(#colorDeposits)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="withdrawals"
                  name="Retiros"
                  stroke="#dc2626"
                  fillOpacity={1}
                  fill="url(#colorWithdrawals)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="transfers"
                  name="Transferencias"
                  stroke="#09090b"
                  fillOpacity={1}
                  fill="url(#colorTransfers)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <div>
              <h2>Distribución del Capital</h2>
              <span>Participación de activos</span>
            </div>
          </div>
          <div className="chart-viewport">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={assets}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={88}
                  paddingAngle={4}
                >
                  {assets.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: darkMode ? "#18181b" : "#ffffff",
                    borderColor: darkMode ? "#27272a" : "#e4e4e7",
                    borderRadius: "8px",
                    color: darkMode ? "#fafafa" : "#09090b",
                    fontSize: "12px",
                  }}
                  formatter={(val) => [`$${Number(val).toLocaleString()}`, ""]}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "11px", paddingTop: "6px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="admin-charts-grid">
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <h2>Volumen Operativo por Tipo</h2>
              <span>Distribución cuantitativa de operaciones</span>
            </div>
          </div>
          <div className="chart-viewport">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={typeBreakdown} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#27272a" : "#f4f4f5"} />
                <XAxis dataKey="type" stroke="#71717a" fontSize={11} />
                <YAxis stroke="#71717a" fontSize={11} tickFormatter={(val) => `$${val}`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: darkMode ? "#18181b" : "#ffffff",
                    borderColor: darkMode ? "#27272a" : "#e4e4e7",
                    borderRadius: "8px",
                    color: darkMode ? "#fafafa" : "#09090b",
                    fontSize: "12px",
                  }}
                  formatter={(val, name) => [
                    name === "volume" ? `$${Number(val).toLocaleString()}` : val,
                    name === "volume" ? "Volumen Total" : "Cantidad",
                  ]}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "12px" }} />
                <Bar dataKey="volume" name="Volumen ($)" fill="#0284c7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <div>
              <h2>Alertas de Seguridad</h2>
              <span>Monitoreo de anomalías</span>
            </div>
            <Link to="/admin/database" className="admin-card-link">
              Ver todos
            </Link>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", overflowY: "auto", maxHeight: "260px" }}>
            {incidents.length === 0 ? (
              <div style={{ textAlign: "center", color: "#71717a", padding: "36px 16px" }}>
                <CheckCircle size={28} style={{ color: "#059669", margin: "0 auto 8px", display: "block" }} />
                No hay incidentes de seguridad registrados.
              </div>
            ) : (
              incidents.map((inc) => (
                <div
                  key={inc.id}
                  style={{
                    padding: "12px 14px",
                    backgroundColor: darkMode ? "#18181b" : "#fafafa",
                    borderRadius: "10px",
                    border: `1px solid ${darkMode ? "#27272a" : "#e4e4e7"}`,
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span
                      className={`incident-badge ${
                        inc.severity === "HIGH" ? "high" : inc.severity === "MEDIUM" ? "medium" : "low"
                      }`}
                    >
                      {inc.severity}
                    </span>
                    <span style={{ fontSize: "11px", color: "#71717a" }}>
                      {inc.createdAt ? new Date(inc.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.825rem", color: darkMode ? "#fafafa" : "#09090b", fontWeight: 600 }}>
                    {inc.description}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 2 }}>
                    <span style={{ fontSize: "11px", color: "#71717a" }}>
                      Objetivo: {inc.targetUserEmail || "Sistema"}
                    </span>
                    {inc.resolved ? (
                      <span style={{ fontSize: "11px", color: "#059669", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                        <CheckCircle size={12} /> Resuelto
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => handleResolveIncident(inc.id)}
                        disabled={resolvingId === inc.id}
                        style={{ height: 26, fontSize: "10px", padding: "0 8px" }}
                      >
                        {resolvingId === inc.id ? "Resolviendo..." : "Resolver"}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="admin-content-box">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: darkMode ? "#fafafa" : "#09090b", margin: 0 }}>
            Registro de Auditoría Reciente
          </h2>
          <span style={{ fontSize: "0.8rem", color: "#71717a" }}>
            Trazabilidad y operaciones de superusuario
          </span>
        </div>

        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Acción</th>
                <th>Ejecutado Por</th>
                <th>Descripción</th>
                <th>Fecha y Hora</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", color: "#71717a", padding: "32px 16px" }}>
                    No hay registros de auditoría disponibles.
                  </td>
                </tr>
              ) : (
                paginatedAuditLogs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ fontFamily: "monospace", fontWeight: 600, color: "#71717a" }}>#{log.id}</td>
                    <td>
                      <span className="status-badge admin">{log.action}</span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{log.performedBy}</td>
                    <td style={{ color: "#52525b" }}>{log.description}</td>
                    <td style={{ color: "#71717a", fontSize: "0.78rem", whiteSpace: "nowrap" }}>
                      {log.timeStamp ? new Date(log.timeStamp).toLocaleString() : "N/A"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalAudit > auditPageSize && (
          <Pagination
            currentPage={auditPage}
            totalPages={totalAuditPages}
            totalItems={totalAudit}
            startIndex={startAuditIdx}
            endIndex={endAuditIdx}
            onPageChange={setAuditPage}
            itemLabel="registros de auditoría"
          />
        )}
      </div>
    </AdminLayout>
  );
}