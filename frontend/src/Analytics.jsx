import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  TrendingUp,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  Utensils,
  Car,
  Zap,
  Film,
  ShoppingBag,
  Activity,
  Briefcase,
  HelpCircle,
  GraduationCap,
} from "lucide-react";
import MetricCard from "./components/MetricCard";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import ClientLayout from "./ClientLayout";
import "./Dashboard.css";
import "./Analytics.css";
import "./LightMode.css";

const CATEGORY_META = {
  FOOD: { label: "Alimentación", icon: Utensils, color: "#09090b" },
  TRANSPORT: { label: "Transporte", icon: Car, color: "#52525b" },
  UTILITIES: { label: "Servicios Básicos", icon: Zap, color: "#71717a" },
  SERVICES: { label: "Servicios y Facturas", icon: Briefcase, color: "#a1a1aa" },
  ENTERTAINMENT: { label: "Entretenimiento", icon: Film, color: "#059669" },
  SHOPPING: { label: "Compras", icon: ShoppingBag, color: "#27272a" },
  HEALTH: { label: "Salud", icon: Activity, color: "#dc2626" },
  EDUCATION: { label: "Educación", icon: GraduationCap, color: "#3f3f46" },
  OTHER: { label: "Otros", icon: HelpCircle, color: "#d4d4d8" },
};

export default function Analytics() {
  const navigate = useNavigate();
  const [spendingCategories, setSpendingCategories] = useState([]);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const selectedYear = currentDate.getFullYear();

  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetCategory, setBudgetCategory] = useState("FOOD");
  const [budgetLimit, setBudgetLimit] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const [feedbackSuccess, setFeedbackSuccess] = useState("");
  const [feedbackError, setFeedbackError] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    const checkTheme = () => {
      const saved = localStorage.getItem("theme");
      setDarkMode(saved === "dark");
    };
    checkTheme();
  }, []);

  const fetchData = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [catRes, trendRes, budgetRes] = await Promise.all([
        axios.get("/api/analytics/spending-by-category", {
          params: { month: selectedMonth, year: selectedYear },
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("/api/analytics/monthly-trend", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("/api/budgets", {
          params: { month: selectedMonth, year: selectedYear },
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setSpendingCategories(catRes.data || []);
      setMonthlyTrend(trendRes.data || []);
      setBudgets(budgetRes.data || []);
    } catch (err) {
      setFeedbackError("No se pudieron cargar los datos de analítica.");
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
  }, [token, selectedMonth, selectedYear]);

  const showSuccess = (msg) => {
    setFeedbackSuccess(msg);
    setTimeout(() => setFeedbackSuccess(""), 4000);
  };

  const showError = (msg) => {
    setFeedbackError(msg);
    setTimeout(() => setFeedbackError(""), 5000);
  };

  const handleSaveBudget = async (e) => {
    e.preventDefault();
    if (!budgetLimit || parseFloat(budgetLimit) <= 0) {
      showError("Por favor ingresa un límite válido mayor a 0.");
      return;
    }

    setActionLoading(true);
    try {
      await axios.post(
        "/api/budgets",
        {
          category: budgetCategory,
          monthlyLimit: parseFloat(budgetLimit),
          month: selectedMonth,
          year: selectedYear,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowBudgetModal(false);
      setBudgetLimit("");
      showSuccess("Presupuesto guardado.");
      await fetchData();
    } catch (err) {
      showError(err.response?.data?.message || "Error al guardar el presupuesto.");
    } finally {
      setActionLoading(false);
    }
  };

  const totalSpent = spendingCategories.reduce(
    (acc, curr) => acc + (Number(curr.totalSpent) || 0),
    0
  );

  const totalBudget = budgets.reduce(
    (acc, curr) => acc + (Number(curr.monthlyLimit) || 0),
    0
  );

  const globalPercentage =
    totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : null;

  const pieData = spendingCategories
    .filter((c) => Number(c.totalSpent) > 0)
    .map((c) => ({
      name: CATEGORY_META[c.category]?.label || c.category,
      value: Number(c.totalSpent),
      color: CATEGORY_META[c.category]?.color || "#71717a",
      categoryKey: c.category,
    }));

  const topCategory = spendingCategories.reduce((prev, curr) => {
    return Number(curr.totalSpent) > Number(prev.totalSpent || 0) ? curr : prev;
  }, {});

  const monthsList = [
    { num: 1, name: "Enero" },
    { num: 2, name: "Febrero" },
    { num: 3, name: "Marzo" },
    { num: 4, name: "Abril" },
    { num: 5, name: "Mayo" },
    { num: 6, name: "Junio" },
    { num: 7, name: "Julio" },
    { num: 8, name: "Agosto" },
    { num: 9, name: "Septiembre" },
    { num: 10, name: "Octubre" },
    { num: 11, name: "Noviembre" },
    { num: 12, name: "Diciembre" },
  ];

  return (
    <ClientLayout
      active="analytics"
      title="Analíticas y Presupuestos"
      subtitle="Monitorea tus gastos mensuales, optimiza tu consumo y define presupuestos por categoría"
    >
      <div className="view-header">
        <div>
          <h2>Analíticas y Presupuestos</h2>
          <p className="subtitle">
            Controla tus gastos mensuales y define límites por categoría.
          </p>
        </div>

        <div className="header-actions">
          <div className="analytics-month-picker">
            <select
              className="select-custom"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              aria-label="Seleccionar mes"
            >
              {monthsList.map((m) => (
                <option key={m.num} value={m.num}>
                  {m.name} {selectedYear}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setBudgetLimit("");
              setShowBudgetModal(true);
            }}
            aria-label="Fijar presupuesto"
          >
            <Plus size={16} />
            <span>Fijar Presupuesto</span>
          </button>
        </div>
      </div>

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

      {loading ? (
        <div className="analytics-loading">
          <RefreshCw className="spin" size={28} />
          <p>Cargando información financiera...</p>
        </div>
      ) : (
        <>
          <section className="account-metrics-grid" aria-label="Métricas clave de gastos">
            <MetricCard
              title="Gasto Total del Mes"
              value={`$${totalSpent.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`}
              badge="Mensual"
              badgeType="warning"
              accent="amber"
              subtitle="Consumo acumulado"
            />

            <MetricCard
              title="Presupuesto Asignado"
              value={
                totalBudget > 0
                  ? `$${totalBudget.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`
                  : "Sin definir"
              }
              badge="Límite"
              badgeType="info"
              accent="primary"
              subtitle="Presupuesto global"
            />

            <MetricCard
              title="% Presupuesto Consumido"
              value={globalPercentage !== null ? `${globalPercentage}%` : "0%"}
              badge={globalPercentage && globalPercentage > 90 ? "Alerta" : "Normal"}
              badgeType={globalPercentage && globalPercentage > 90 ? "warning" : "success"}
              accent={globalPercentage && globalPercentage > 90 ? "amber" : "emerald"}
              subtitle="Capacidad utilizada"
            />

            <MetricCard
              title="Mayor Categoría"
              value={
                topCategory?.category
                  ? CATEGORY_META[topCategory.category]?.label || topCategory.category
                  : "Sin gastos"
              }
              badge="Top Gasto"
              badgeType="warning"
              accent="amber"
              subtitle="Rubro con más consumo"
            />
          </section>

          <section className="analytics-charts-grid">
            <div className="analytics-chart-card">
              <div className="chart-header">
                <h3>Distribución de Gastos</h3>
                <span className="chart-subtitle">Mes seleccionado por categoría</span>
              </div>

              <div className="chart-content">
                {pieData.length === 0 ? (
                  <div className="chart-empty">
                    <p>No se registraron gastos en este periodo.</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={62}
                        outerRadius={92}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieData.map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val) =>
                          `$${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                        }
                        contentStyle={{
                          backgroundColor: darkMode ? "#18181b" : "#ffffff",
                          borderColor: darkMode ? "#27272a" : "#e4e4e7",
                          borderRadius: "8px",
                          color: darkMode ? "#fafafa" : "#09090b",
                        }}
                      />
                      <Legend iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="analytics-chart-card">
              <div className="chart-header">
                <h3>Tendencia Semestral</h3>
                <span className="chart-subtitle">Comparativa de Ingresos y Gastos</span>
              </div>

              <div className="chart-content">
                {monthlyTrend.length === 0 ? (
                  <div className="chart-empty">
                    <p>Aún no hay suficiente historial transaccional.</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#27272a" : "#f4f4f5"} />
                      <XAxis dataKey="month" stroke="#71717a" fontSize={12} />
                      <YAxis stroke="#71717a" fontSize={12} />
                      <Tooltip
                        formatter={(val) =>
                          `$${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                        }
                        contentStyle={{
                          backgroundColor: darkMode ? "#18181b" : "#ffffff",
                          borderColor: darkMode ? "#27272a" : "#e4e4e7",
                          borderRadius: "8px",
                          color: darkMode ? "#fafafa" : "#09090b",
                        }}
                      />
                      <Legend />
                      <Bar dataKey="income" name="Ingresos" fill="#059669" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expense" name="Gastos" fill="#09090b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </section>

          <section className="category-budgets-section">
            <div className="section-header-row">
              <div>
                <h3>Presupuestos por Categoría</h3>
                <p className="subtitle">
                  Controla tus topes de consumo para cada rubro y evita sobregiros antes de fin de mes.
                </p>
              </div>
            </div>

            <div className="category-budget-list">
              {spendingCategories.map((item) => {
                const meta = CATEGORY_META[item.category] || CATEGORY_META.OTHER;
                const Icon = meta.icon;
                const spent = Number(item.totalSpent) || 0;
                const limit = Number(item.budgetLimit) || 0;
                const pct = limit > 0 ? Math.min(Math.round((spent / limit) * 100), 100) : 0;
                const isOverBudget = limit > 0 && spent > limit;
                const isNearBudget = limit > 0 && pct >= 80 && !isOverBudget;

                return (
                  <div key={item.category} className="budget-row-card">
                    <div className="category-meta-col">
                      <div className="category-icon-circle">
                        <Icon size={18} />
                      </div>
                      <div>
                        <strong className="category-name">{meta.label}</strong>
                        <span className="category-tx-count">{item.transactionCount || 0} movimientos</span>
                      </div>
                    </div>

                    <div className="budget-progress-col">
                      <div className="budget-numbers-row">
                        <span>
                          Gastado:{" "}
                          <strong>${spent.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                        </span>
                        <span>
                          Límite:{" "}
                          <strong>
                            {limit > 0
                              ? `$${limit.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                              : "No asignado"}
                          </strong>
                        </span>
                      </div>

                      <div className="budget-progress-track">
                        <div
                          className={`budget-progress-bar ${
                            isOverBudget ? "danger" : isNearBudget ? "warning" : "normal"
                          }`}
                          style={{
                            width: limit > 0 ? `${pct}%` : "0%",
                          }}
                        />
                      </div>

                      {isOverBudget && (
                        <span className="budget-alert-tag danger">
                          <AlertCircle size={13} /> Presupuesto superado por $
                          {(spent - limit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      )}
                      {isNearBudget && (
                        <span className="budget-alert-tag warning">
                          <AlertTriangle size={13} /> Has consumido el {pct}% de este presupuesto.
                        </span>
                      )}
                    </div>

                    <div className="budget-action-col">
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setBudgetCategory(item.category);
                          setBudgetLimit(limit > 0 ? String(limit) : "");
                          setShowBudgetModal(true);
                        }}
                      >
                        {limit > 0 ? "Ajustar" : "Asignar"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}

      {showBudgetModal && (
        <div className="modal-overlay" onClick={() => setShowBudgetModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Asignar Presupuesto Mensual</h2>
            <p className="modal-desc">
              Establece el monto máximo que deseas gastar en esta categoría para el periodo seleccionado.
            </p>

            <form onSubmit={handleSaveBudget} className="modal-form-stack">
              <div className="form-group">
                <label className="form-label" htmlFor="selectBudgetCat">Categoría</label>
                <select
                  id="selectBudgetCat"
                  className="form-control"
                  value={budgetCategory}
                  onChange={(e) => setBudgetCategory(e.target.value)}
                >
                  {Object.keys(CATEGORY_META).map((key) => (
                    <option key={key} value={key}>
                      {CATEGORY_META[key].label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="budgetLimitInput">Límite Mensual ($ USD)</label>
                <input
                  id="budgetLimitInput"
                  type="number"
                  min="10"
                  step="10"
                  className="form-control"
                  placeholder="Ej. 300.00"
                  value={budgetLimit}
                  onChange={(e) => setBudgetLimit(e.target.value)}
                  required
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowBudgetModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? "Guardando..." : "Guardar Presupuesto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ClientLayout>
  );
}