import { useState, useEffect } from "react";
import axios from "axios";
import {
  Download,
  Search,
  UserCheck,
  Landmark,
  Users,
  ShieldCheck,
  RefreshCw,
  Clock,
  FileSpreadsheet,
} from "lucide-react";
import AdminLayout from "./AdminLayout";
import { Pagination } from "./components";
import "./Admin.css";

export default function AdminReports() {
  const [userId, setUserId] = useState("");
  const [report, setReport] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exportingFull, setExportingFull] = useState(false);
  const [exportingUser, setExportingUser] = useState(false);

  const token = localStorage.getItem("adminToken") || localStorage.getItem("token");

  const getHeaders = () => ({
    Authorization: `Bearer ${token}`,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reportRes, logsRes] = await Promise.all([
        axios.get("http://localhost:8080/api/admin/reports", { headers: getHeaders() }),
        axios.get("http://localhost:8080/api/audit-logs", { headers: getHeaders() }),
      ]);
      setReport(reportRes.data);
      setAuditLogs(logsRes.data || []);
    } catch (err) {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const exportFullReport = async () => {
    setExportingFull(true);
    try {
      const res = await axios.get("http://localhost:8080/api/admin/reports/export", {
        headers: getHeaders(),
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "reporte_institucional_neobank.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert("Error al generar el reporte CSV institucional.");
    } finally {
      setExportingFull(false);
    }
  };

  const exportUserReport = async () => {
    if (!userId.trim()) {
      alert("Por favor ingresa un ID numérico de usuario (ej. 1)");
      return;
    }
    setExportingUser(true);
    try {
      const res = await axios.get(
        `http://localhost:8080/api/admin/reports/user/${userId.trim()}/export`,
        {
          headers: getHeaders(),
          responseType: "blob",
        }
      );
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `extracto_usuario_${userId.trim()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert("No se encontró al usuario con ID " + userId);
    } finally {
      setExportingUser(false);
    }
  };

  const filteredLogs = auditLogs.filter((log) => {
    const matchesAction = actionFilter === "ALL" ? true : (log.action && log.action.includes(actionFilter));
    const term = searchTerm.toLowerCase().trim();
    if (!term) return matchesAction;

    const matchesSearch =
      (log.action && log.action.toLowerCase().includes(term)) ||
      (log.performedBy && log.performedBy.toLowerCase().includes(term)) ||
      (log.description && log.description.toLowerCase().includes(term));

    return matchesAction && matchesSearch;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  useEffect(() => {
    setCurrentPage(1);
  }, [actionFilter, searchTerm]);

  const totalItems = filteredLogs.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

  return (
    <AdminLayout>
      <div className="admin-header-row">
        <div>
          <h1>Centro de Reportes y Auditoría</h1>
          <p>
            Generación de extractos ejecutivos, balances institucionales y trazabilidad del sistema en tiempo real.
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
            <span>Titulares de Cuenta</span>
            <div className="kpi-icon-wrapper">
              <Users size={17} />
            </div>
          </div>
          <div className="kpi-value">{report?.totalUsers ?? 0}</div>
          <div className="kpi-footer">
            <span className="kpi-badge neutral">Base de clientes auditada</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span>Balance Global en Custodia</span>
            <div className="kpi-icon-wrapper">
              <Landmark size={17} />
            </div>
          </div>
          <div className="kpi-value">
            ${Number(report?.totalBalance || 0).toLocaleString("es-ES", { minimumFractionDigits: 2 })}
          </div>
          <div className="kpi-footer">
            <span className="kpi-badge positive">Saldo consolidado</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span>Eventos Auditados</span>
            <div className="kpi-icon-wrapper">
              <ShieldCheck size={17} />
            </div>
          </div>
          <div className="kpi-value">{auditLogs.length}</div>
          <div className="kpi-footer">
            <span className="kpi-badge neutral">Registros de trazabilidad</span>
          </div>
        </div>
      </div>

      <div className="report-export-grid">
        <div className="report-card">
          <div className="report-card-top">
            <div className="report-card-header">
              <div className="report-icon-box">
                <FileSpreadsheet size={18} />
              </div>
              <span className="report-card-title">Extracto Institucional Global</span>
            </div>
            <p className="report-card-desc">
              Descarga un archivo CSV estructurado con las métricas consolidadas del banco, balances globales y volumetría agregada por tipo de transacción.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={exportFullReport}
            disabled={exportingFull}
            style={{ width: "100%", marginTop: "12px" }}
          >
            <Download size={16} />
            <span>{exportingFull ? "Generando CSV..." : "Descargar Reporte CSV"}</span>
          </button>
        </div>

        <div className="report-card">
          <div className="report-card-top">
            <div className="report-card-header">
              <div className="report-icon-box">
                <UserCheck size={18} />
              </div>
              <span className="report-card-title">Extracto Individual por Cliente</span>
            </div>
            <p className="report-card-desc">
              Genera el extracto contable específico de un cliente, incluyendo su estado de cuenta, saldo actual y el histórico completo de movimientos.
            </p>
          </div>

          <div className="report-input-group">
            <input
              type="number"
              className="report-input"
              placeholder="Ingresar ID de Usuario (ej. 1)..."
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") exportUserReport();
              }}
            />
            <button
              type="button"
              className="btn btn-secondary"
              onClick={exportUserReport}
              disabled={exportingUser}
              style={{ flexShrink: 0 }}
            >
              <Download size={16} />
              <span>{exportingUser ? "Descargando..." : "Exportar"}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="admin-content-box">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
          <div>
            <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: "inherit", margin: 0 }}>
              Registro de Auditoría del Sistema (Audit Trail)
            </h2>
            <span style={{ fontSize: "0.8rem", color: "#71717a" }}>
              Trazabilidad inmutable de ajustes de balance, autorizaciones y eventos del sistema
            </span>
          </div>

          <div style={{ position: "relative", minWidth: 260 }}>
            <Search size={16} style={{ position: "absolute", left: 12, top: 11, color: "#71717a" }} />
            <input
              type="text"
              placeholder="Filtrar por acción, email o motivo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="report-input"
              style={{ paddingLeft: "36px" }}
            />
          </div>
        </div>

        <div className="admin-filter-tabs" style={{ marginBottom: "18px" }}>
          {[
            { id: "ALL", label: `Todos (${auditLogs.length})` },
            { id: "ADJUSTMENT", label: "Ajustes de Balance" },
            { id: "SECURITY", label: "Seguridad" },
            { id: "SYSTEM", label: "Sistema" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`filter-tab-btn ${actionFilter === tab.id ? "active" : ""}`}
              onClick={() => setActionFilter(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="table-responsive">
          {loading ? (
            <div style={{ padding: "48px 20px", textAlign: "center", color: "#71717a" }}>
              Cargando eventos de auditoría...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div style={{ padding: "48px 20px", textAlign: "center", color: "#71717a" }}>
              <Clock size={32} style={{ margin: "0 auto 8px", display: "block", opacity: 0.5 }} />
              No se encontraron registros de auditoría para la búsqueda.
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 180 }}>Fecha / Hora</th>
                  <th style={{ width: 160 }}>Acción</th>
                  <th style={{ width: 220 }}>Responsable</th>
                  <th>Descripción / Justificación</th>
                </tr>
              </thead>
              <tbody>
                {paginatedLogs.map((log, index) => (
                  <tr key={log.id || index}>
                    <td style={{ whiteSpace: "nowrap", color: "#71717a", fontSize: "0.78rem" }}>
                      {log.timeStamp || log.timestamp
                        ? new Date(log.timeStamp || log.timestamp).toLocaleString("es-ES")
                        : "—"}
                    </td>
                    <td>
                      <span className="status-badge admin" style={{ textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        {log.action}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: "inherit", fontSize: "0.8rem" }}>
                        {log.performedBy}
                      </span>
                    </td>
                    <td style={{ color: "#52525b", fontSize: "0.8rem" }}>
                      {log.description}
                    </td>
                  </tr>
                ))}
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
            itemLabel="eventos de auditoría"
          />
        )}
      </div>
    </AdminLayout>
  );
}