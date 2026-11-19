import { useState, useEffect } from "react";
import axios from "axios";
import AdminLayout from "./AdminLayout";
import {
  Database,
  Terminal,
  Search,
  Download,
  Play,
  Copy,
  Check,
  X,
  RefreshCw,
  Eye,
  AlertTriangle,
  FileCode,
  Table as TableIcon
} from "lucide-react";
import "./Admin.css";

export default function AdminDatabase() {
  const token = localStorage.getItem("token");

  const [activeTab, setActiveTab] = useState("explorer");

  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState("");
  const [tableData, setTableData] = useState({
    columns: [],
    rows: [],
    page: 0,
    size: 20,
    totalElements: 0,
    totalPages: 0,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [loadingTables, setLoadingTables] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  const [sqlQuery, setSqlQuery] = useState("SELECT * FROM users LIMIT 10;");
  const [queryResult, setQueryResult] = useState(null);
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryError, setQueryError] = useState(null);

  const [inspectingRow, setInspectingRow] = useState(null);
  const [copied, setCopied] = useState(false);

  const getHeaders = () => ({
    Authorization: `Bearer ${token}`,
  });

  const fetchOverview = async () => {
    if (!token) return;
    setLoadingTables(true);
    try {
      const res = await axios.get("/api/admin/database/overview", {
        headers: getHeaders(),
      });
      const tableList = res.data?.tables || (Array.isArray(res.data) ? res.data : []);
      setTables(tableList);
      if (tableList.length > 0 && !selectedTable) {
        setSelectedTable(tableList[0].tableName || tableList[0].name);
      }
    } catch (err) {
    } finally {
      setLoadingTables(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [token]);

  const fetchTableData = async (tableName, page = 0, search = "") => {
    if (!token || !tableName) return;
    setLoadingData(true);
    try {
      const res = await axios.get(
        `/api/admin/database/tables/${tableName}`,
        {
          headers: getHeaders(),
          params: { page, size: 20, search },
        }
      );
      setTableData(res.data);
    } catch (err) {
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (selectedTable) {
      fetchTableData(selectedTable, 0, searchTerm);
    }
  }, [selectedTable]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (selectedTable) {
      fetchTableData(selectedTable, 0, searchTerm);
    }
  };

  const handlePageChange = (newPage) => {
    if (selectedTable && newPage >= 0 && newPage < tableData.totalPages) {
      fetchTableData(selectedTable, newPage, searchTerm);
    }
  };

  const executeQuery = async (queryToRun) => {
    const q = queryToRun || sqlQuery;
    if (!token || !q.trim()) return;
    setQueryLoading(true);
    setQueryError(null);
    setQueryResult(null);

    try {
      const res = await axios.post(
        "/api/admin/database/query",
        { query: q },
        { headers: getHeaders() }
      );
      setQueryResult(res.data);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || "Error al ejecutar la consulta";
      setQueryError(msg);
    } finally {
      setQueryLoading(false);
    }
  };

  const snippets = [
    { label: "Top 10 Usuarios", sql: "SELECT id, first_name, last_name, email, balance, status FROM users LIMIT 10;" },
    { label: "Transacciones Recientes", sql: "SELECT id, user_id, amount, type, description, timestamp FROM transactions ORDER BY timestamp DESC LIMIT 10;" },
    { label: "Alertas de Seguridad", sql: "SELECT id, event_type, severity, target_user_email, resolved, created_at FROM security_incidents ORDER BY created_at DESC LIMIT 10;" },
    { label: "Préstamos Activos", sql: "SELECT id, user_id, amount, status, term_months, remaining_balance FROM loans LIMIT 10;" },
    { label: "Bóvedas de Ahorro", sql: "SELECT id, user_id, name, target_amount, current_amount, deleted FROM vaults LIMIT 10;" },
  ];

  const applySnippet = (sql) => {
    setSqlQuery(sql);
    executeQuery(sql);
  };

  const exportToCsv = (columns, rows, filename = "export.csv") => {
    if (!rows || rows.length === 0) return;
    const header = columns.join(",");
    const csvContent = rows
      .map((row) =>
        columns
          .map((col) => {
            const val = row[col];
            if (val === null || val === undefined) return '""';
            const escaped = String(val).replace(/"/g, '""');
            return `"${escaped}"`;
          })
          .join(",")
      )
      .join("\n");

    const blob = new Blob([`${header}\n${csvContent}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToJson = (rows, filename = "export.json") => {
    if (!rows || rows.length === 0) return;
    const blob = new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyJsonToClipboard = () => {
    if (!inspectingRow) return;
    navigator.clipboard.writeText(JSON.stringify(inspectingRow, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AdminLayout>
      <div className="db-explorer">
        <div className="admin-header-row">
          <div>
            <h1>Explorador de Base de Datos</h1>
            <p>Inspección en tiempo real de entidades relacionales, registros y ejecución de consultas analíticas.</p>
          </div>

          <div className="admin-header-actions">
            <button
              type="button"
              className="quick-link-btn"
              onClick={() => {
                fetchOverview();
                if (selectedTable) fetchTableData(selectedTable, tableData.page, searchTerm);
              }}
              title="Actualizar datos"
            >
              <RefreshCw size={15} />
              <span>Actualizar</span>
            </button>
          </div>
        </div>

        <div className="db-tabs">
          <button
            type="button"
            className={`db-tab-btn ${activeTab === "explorer" ? "active" : ""}`}
            onClick={() => setActiveTab("explorer")}
          >
            <TableIcon size={16} />
            <span>Tablas y Registros</span>
          </button>
          <button
            type="button"
            className={`db-tab-btn ${activeTab === "sql" ? "active" : ""}`}
            onClick={() => setActiveTab("sql")}
          >
            <Terminal size={16} />
            <span>Consola SQL (Lectura)</span>
          </button>
        </div>

        {activeTab === "explorer" && (
          <div className="db-workspace">
            <aside className="db-sidebar-panel">
              <span className="db-sidebar-title">Tablas ({tables.length})</span>
              {loadingTables ? (
                <p className="db-hint-text">Cargando catálogo...</p>
              ) : (
                <ul className="db-table-list">
                  {tables.map((t) => (
                    <li
                      key={t.tableName}
                      className={`db-table-item ${selectedTable === t.tableName ? "active" : ""}`}
                      onClick={() => {
                        setSelectedTable(t.tableName);
                        setSearchTerm("");
                      }}
                    >
                      <span>{t.tableName}</span>
                      <span className="db-table-badge">{t.rowCount.toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              )}
            </aside>

            <section className="db-data-panel">
              <div className="db-data-toolbar">
                <form className="db-search-box" onSubmit={handleSearchSubmit}>
                  <Search size={16} className="search-icon" />
                  <input
                    type="text"
                    className="db-search-input"
                    placeholder={`Filtrar en ${selectedTable || "tabla"}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </form>

                <div className="db-export-group">
                  <button
                    type="button"
                    className="quick-link-btn"
                    onClick={() =>
                      exportToCsv(
                        tableData.columns,
                        tableData.rows,
                        `${selectedTable.toLowerCase()}_page_${tableData.page + 1}.csv`
                      )
                    }
                    disabled={tableData.rows.length === 0}
                  >
                    <Download size={14} />
                    <span>CSV</span>
                  </button>
                  <button
                    type="button"
                    className="quick-link-btn"
                    onClick={() =>
                      exportToJson(
                        tableData.rows,
                        `${selectedTable.toLowerCase()}_page_${tableData.page + 1}.json`
                      )
                    }
                    disabled={tableData.rows.length === 0}
                  >
                    <FileCode size={14} />
                    <span>JSON</span>
                  </button>
                </div>
              </div>

              <div className="db-table-wrapper">
                {loadingData ? (
                  <div className="db-center-msg">Cargando registros de {selectedTable}...</div>
                ) : tableData.rows.length === 0 ? (
                  <div className="db-center-msg">
                    No se encontraron registros en <strong>{selectedTable}</strong> con el filtro aplicado.
                  </div>
                ) : (
                  <table className="db-grid-table">
                    <thead>
                      <tr>
                        <th style={{ width: 40, textAlign: "center" }}>#</th>
                        {tableData.columns.map((col) => (
                          <th key={col}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tableData.rows.map((row, idx) => (
                        <tr
                          key={idx}
                          onClick={() => setInspectingRow(row)}
                          title="Haz clic para inspeccionar registro en JSON"
                        >
                          <td style={{ color: "var(--text-muted)", textAlign: "center" }}>
                            {tableData.page * tableData.size + idx + 1}
                          </td>
                          {tableData.columns.map((col) => (
                            <td key={col}>
                              {row[col] === null || row[col] === undefined
                                ? "NULL"
                                : typeof row[col] === "boolean"
                                ? row[col]
                                  ? "true"
                                  : "false"
                                : String(row[col])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="db-pagination">
                <span>
                  Mostrando {tableData.rows.length} de {tableData.totalElements} registros (Pág.{" "}
                  {tableData.totalPages > 0 ? tableData.page + 1 : 0} de {tableData.totalPages})
                </span>
                <div className="db-page-controls">
                  <button
                    type="button"
                    className="db-page-btn"
                    disabled={tableData.page <= 0}
                    onClick={() => handlePageChange(tableData.page - 1)}
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    className="db-page-btn"
                    disabled={tableData.page >= tableData.totalPages - 1}
                    onClick={() => handlePageChange(tableData.page + 1)}
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === "sql" && (
          <div className="db-console-panel">
            <div className="db-snippets-bar">
              <span className="db-snippets-label">Consultas Rápidas:</span>
              {snippets.map((snip, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="db-snippet-chip"
                  onClick={() => applySnippet(snip.sql)}
                >
                  {snip.label}
                </button>
              ))}
            </div>

            <div className="db-editor-wrapper">
              <textarea
                className="db-sql-textarea"
                value={sqlQuery}
                onChange={(e) => setSqlQuery(e.target.value)}
                placeholder="Escribe una sentencia SQL SELECT..."
                rows={4}
              />
            </div>

            <div className="db-console-footer">
              <div className="db-query-status">
                {queryResult && (
                  <span className="db-query-status success">
                    <Check size={14} /> Consulta ejecutada en {queryResult.executionTimeMs} ms ({queryResult.rowCount} filas)
                  </span>
                )}
                {queryError && (
                  <span className="db-query-status error">
                    <AlertTriangle size={14} /> {queryError}
                  </span>
                )}
              </div>

              <button
                type="button"
                className="btn btn-primary"
                onClick={() => executeQuery()}
                disabled={queryLoading}
              >
                <Play size={15} />
                <span>{queryLoading ? "Ejecutando..." : "Ejecutar Consulta"}</span>
              </button>
            </div>

            {queryResult && (
              <div className="db-data-panel" style={{ marginTop: "16px" }}>
                <div className="db-data-toolbar">
                  <span className="db-result-title">
                    Resultados ({queryResult.rowCount} registros)
                  </span>
                  <div className="db-export-group">
                    <button
                      type="button"
                      className="quick-link-btn"
                      onClick={() =>
                        exportToCsv(queryResult.columns, queryResult.rows, "query_results.csv")
                      }
                    >
                      <Download size={14} /> CSV
                    </button>
                    <button
                      type="button"
                      className="quick-link-btn"
                      onClick={() => exportToJson(queryResult.rows, "query_results.json")}
                    >
                      <FileCode size={14} /> JSON
                    </button>
                  </div>
                </div>

                <div className="db-table-wrapper">
                  <table className="db-grid-table">
                    <thead>
                      <tr>
                        {queryResult.columns.map((col) => (
                          <th key={col}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {queryResult.rows.map((row, idx) => (
                        <tr key={idx} onClick={() => setInspectingRow(row)}>
                          {queryResult.columns.map((col) => (
                            <td key={col}>
                              {row[col] === null || row[col] === undefined
                                ? "NULL"
                                : String(row[col])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {inspectingRow && (
          <div className="db-modal-overlay" onClick={() => setInspectingRow(null)}>
            <div className="db-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="db-modal-header">
                <h3>
                  <Eye size={17} /> Inspector de Registro
                </h3>
                <button
                  type="button"
                  className="db-modal-close"
                  onClick={() => setInspectingRow(null)}
                  title="Cerrar"
                >
                  <X size={17} />
                </button>
              </div>

              <div className="db-modal-body">
                <pre>{JSON.stringify(inspectingRow, null, 2)}</pre>
              </div>

              <div className="db-modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={copyJsonToClipboard}
                >
                  {copied ? (
                    <>
                      <Check size={14} /> ¡Copiado!
                    </>
                  ) : (
                    <>
                      <Copy size={14} /> Copiar JSON
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setInspectingRow(null)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}