import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./LandingPage.css";

const NAV_ITEMS = [
  { label: "Servicios", href: "#modules" },
  { label: "Simulador de Crédito", href: "#loan-simulator" },
  { label: "Seguridad", href: "#security" },
];

const BANK_METRICS = [
  { metric: "$0.00", title: "Costo de Apertura", detail: "Sin comisiones ocultas de mantenimiento" },
  { metric: "< 3 seg", title: "Transferencias Inmediatas", detail: "Envíos directos entre cuentas sin demoras" },
  { metric: "100%", title: "Control Digital", detail: "Gestión completa de tarjetas y límites" },
  { metric: "24/7", title: "Disponibilidad Continua", detail: "Acceso ininterrumpido desde cualquier dispositivo" },
];

const PLATFORM_MODULES = [
  {
    code: "01",
    title: "Tarjetas Físicas, Virtuales y Desechables",
    description: "Emisión instantánea de tarjetas con control de límites diarios y mensuales, configuración de PIN de 4 dígitos y bloqueo inmediato ante cualquier actividad inusual.",
    specs: ["Tarjetas Desechables", "Límites configurables", "Congelación en 1 clic"],
    wide: true,
  },
  {
    code: "02",
    title: "Bóvedas de Ahorro por Objetivos",
    description: "Separa tu liquidez del saldo operativo creando metas financieras personalizadas con transferencias internas instantáneas.",
    specs: ["Metas personalizadas", "Liquidez 24/7"],
    wide: false,
  },
  {
    code: "03",
    title: "Mercado de Criptoactivos",
    description: "Compra y venta en tiempo real con cotizaciones en USD y custodia integrada directamente en tu balance consolidado.",
    specs: ["Cotización en vivo", "Órdenes instantáneas"],
    wide: false,
  },
  {
    code: "04",
    title: "Analítica, Presupuestos y Pagos Programados",
    description: "Clasificación automática por categorías de gasto, alertas de límites presupuestarios mensuales y automatización de pagos recurrentes de servicios.",
    specs: ["Categorización inteligente", "Pagos automáticos", "Control de presupuesto"],
    wide: true,
  },
];

const SECURITY_PILLARS = [
  {
    title: "Protección de Sesión Avanzada",
    description: "Autenticación cifrada de extremo a extremo y validación estricta de identidad para garantizar que solo tú accedas a tus fondos.",
  },
  {
    title: "Respaldo en Cada Operación",
    description: "Verificación automática de saldos y estado de cuenta antes de procesar cualquier depósito, retiro o transferencia entre usuarios.",
  },
  {
    title: "Historial y Auditoría Permanente",
    description: "Registro detallado de todos tus movimientos y notificaciones en tiempo real para mantener el control total de tu patrimonio.",
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);

  const [loanAmount, setLoanAmount] = useState(5000);
  const [termMonths, setTermMonths] = useState(12);
  const annualRate = 0.085;

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 15);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const calculateAmortization = () => {
    const monthlyRate = annualRate / 12;
    const factor = Math.pow(1 + monthlyRate, termMonths);
    const monthlyPayment = (loanAmount * monthlyRate * factor) / (factor - 1);
    const totalPayment = monthlyPayment * termMonths;
    const totalInterest = totalPayment - loanAmount;

    return {
      monthly: monthlyPayment.toFixed(2),
      total: totalPayment.toFixed(2),
      interest: totalInterest.toFixed(2),
    };
  };

  const loanSummary = calculateAmortization();

  return (
    <div className="nb-wrapper">
      <header className={`nb-header ${isScrolled ? "nb-header-scrolled" : ""}`}>
        <div className="nb-container nb-nav-row">
          <Link to="/" className="nb-brand">
            <img src="/logo_trimmed.png" alt="NeoBank" className="nb-logo-slot-large" />
          </Link>

          <nav className="nb-nav-links">
            {NAV_ITEMS.map((item) => (
              <a key={item.label} href={item.href} className="nb-nav-link">
                {item.label}
              </a>
            ))}
          </nav>

          <div className="nb-nav-actions">
            <button type="button" className="nb-btn-ghost" onClick={() => navigate("/login")}>
              Iniciar Sesión
            </button>
            <button type="button" className="nb-btn-solid" onClick={() => navigate("/register")}>
              Abrir Cuenta
            </button>
          </div>
        </div>
      </header>

      <section className="nb-hero">
        <div className="nb-container nb-hero-grid">
          <div className="nb-hero-copy">
            <div className="nb-pill">
              <span className="nb-pill-dot"></span>
              <span>Banca Digital de Nueva Generación</span>
            </div>

            <h1 className="nb-hero-title">
              Gestión financiera integral con precisión institucional.
            </h1>

            <p className="nb-hero-desc">
              Administra tu capital sin fricciones, emite tarjetas virtuales y desechables al instante, organiza tus metas en bóvedas de ahorro, solicita créditos con amortización transparente y opera en mercados digitales desde una sola cuenta.
            </p>

            <div className="nb-hero-cta">
              <button type="button" className="nb-btn-primary-lg" onClick={() => navigate("/register")}>
                Crear cuenta personal
              </button>
              <button type="button" className="nb-btn-secondary-lg" onClick={() => navigate("/login")}>
                Acceder a banca web
              </button>
            </div>
          </div>

          <div className="nb-hero-image-wrapper">
            <img src="/land.png" alt="NeoBank Interface" className="nb-hero-image" />
          </div>
        </div>
      </section>

      <section className="nb-metrics-strip">
        <div className="nb-container nb-metrics-grid">
          {BANK_METRICS.map((item) => (
            <div key={item.title} className="nb-metric-box">
              <div className="nb-metric-num">{item.metric}</div>
              <div className="nb-metric-title">{item.title}</div>
              <div className="nb-metric-detail">{item.detail}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="modules" className="nb-section">
        <div className="nb-container">
          <div className="nb-section-head">
            <span className="nb-eyebrow">PRODUCTOS Y SERVICIOS</span>
            <h2 className="nb-section-title">Servicios financieros diseñados para el control total</h2>
            <p className="nb-section-sub">
              Todas tus herramientas bancarias integradas en una misma plataforma para gestionar tus finanzas diarias en tiempo real.
            </p>
          </div>

          <div className="nb-bento">
            {PLATFORM_MODULES.map((mod) => (
              <div key={mod.code} className={`nb-bento-item ${mod.wide ? "nb-bento-wide" : ""}`}>
                <div className="nb-bento-code">{mod.code}</div>
                <h3 className="nb-bento-title">{mod.title}</h3>
                <p className="nb-bento-desc">{mod.description}</p>
                <div className="nb-bento-tags">
                  {mod.specs.map((spec) => (
                    <span key={spec} className="nb-tag">{spec}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="loan-simulator" className="nb-section nb-bg-subtle">
        <div className="nb-container">
          <div className="nb-section-head">
            <span className="nb-eyebrow">CRÉDITO DIRECTO</span>
            <h2 className="nb-section-title">Simulador de préstamos y amortización</h2>
            <p className="nb-section-sub">
              Calcula tu cuota mensual antes de enviar tu solicitud. Desembolso directo a tu cuenta tras aprobación.
            </p>
          </div>

          <div className="nb-sim-panel">
            <div className="nb-sim-inputs">
              <div className="nb-control">
                <div className="nb-control-head">
                  <label htmlFor="loan-range">Monto del préstamo</label>
                  <span className="nb-control-val">${loanAmount.toLocaleString()}</span>
                </div>
                <input
                  id="loan-range"
                  type="range"
                  min="500"
                  max="50000"
                  step="500"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(Number(e.target.value))}
                  className="nb-range"
                />
                <div className="nb-range-bounds">
                  <span>$500</span>
                  <span>$25,000</span>
                  <span>$50,000</span>
                </div>
              </div>

              <div className="nb-control">
                Markup del plazo de pago (meses)
                <div className="nb-term-grid">
                  {[6, 12, 24, 36, 48].map((m) => (
                    <button
                      key={m}
                      type="button"
                      className={`nb-term-btn ${termMonths === m ? "active" : ""}`}
                      onClick={() => setTermMonths(m)}
                    >
                      {m} meses
                    </button>
                  ))}
                </div>
              </div>

              <div className="nb-sim-note">
                Tasa Efectiva Anual referencial del 8.50%. El cronograma de cuotas se genera automáticamente al solicitar tu crédito.
              </div>
            </div>

            <div className="nb-sim-output">
              <span className="nb-out-eyebrow">CUOTA MENSUAL ESTIMADA</span>
              <div className="nb-out-amount">${Number(loanSummary.monthly).toLocaleString()}</div>

              <div className="nb-out-breakdown">
                <div className="nb-out-row">
                  <span>Capital solicitado</span>
                  <strong>${loanAmount.toLocaleString()}</strong>
                </div>
                <div className="nb-out-row">
                  <span>Interés total estimado</span>
                  <strong>${Number(loanSummary.interest).toLocaleString()}</strong>
                </div>
                <div className="nb-out-row nb-out-total">
                  <span>Monto total a pagar</span>
                  <strong>${Number(loanSummary.total).toLocaleString()}</strong>
                </div>
              </div>

              <button type="button" className="nb-btn-primary-full" onClick={() => navigate("/register")}>
                Solicitar este préstamo
              </button>
            </div>
          </div>
        </div>
      </section>

      <section id="security" className="nb-section">
        <div className="nb-container">
          <div className="nb-section-head">
            <span className="nb-eyebrow">SEGURIDAD Y CONFIANZA</span>
            <h2 className="nb-section-title">Protección en cada movimiento</h2>
          </div>

          <div className="nb-sec-grid">
            {SECURITY_PILLARS.map((pillar) => (
              <div key={pillar.title} className="nb-sec-card">
                <h3>{pillar.title}</h3>
                <p>{pillar.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="nb-footer">
        <div className="nb-container nb-footer-top">
          <div className="nb-footer-brand">
            <div className="nb-brand">
              <img src="/logo_trimmed.png" alt="NeoBank" className="nb-logo-slot" />
              <span className="nb-brand-title">NEOBANK</span>
            </div>
            <p>
              Plataforma Bancaria Digital. Gestión de cuentas, tarjetas virtuales, bóvedas de ahorro, préstamos y activos digitales.
            </p>
          </div>

          <div className="nb-footer-col">
            <h4>Plataforma</h4>
            <Link to="/register">Crear Cuenta</Link>
            <Link to="/login">Acceso Clientes</Link>
          </div>

          <div className="nb-footer-col">
            <h4>Servicios</h4>
            <a href="#modules">Tarjetas Virtuales</a>
            <a href="#modules">Bóvedas de Ahorro</a>
            <a href="#loan-simulator">Simulador de Crédito</a>
            <a href="#modules">Criptoactivos</a>
          </div>
        </div>

        <div className="nb-container nb-footer-bottom">
          <span>© {new Date().getFullYear()} NeoBank. Todos los derechos reservados.</span>
          <span>Banca Digital · Servicios en Línea</span>
        </div>
      </footer>
    </div>
  );
}