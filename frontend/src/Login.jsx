import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "./auth.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await axios.post("/api/auth/login", {
        email,
        password,
      });

      localStorage.setItem("token", res.data.jwtToken);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      if (res.data.user.role === "ADMIN" || res.data.user.email === "admin@bank.com") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      setError("Correo electrónico o contraseña incorrectos. Verifica tus credenciales.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="nb-auth-page">
      <header className="nb-auth-topbar">
        <Link to="/" className="nb-auth-brand">
          <img src="/logo_trimmed.png" alt="NeoBank" className="nb-auth-logo-slot" />
          <span>NEOBANK</span>
        </Link>
        <Link to="/" className="nb-auth-back">
          Volver al inicio
        </Link>
      </header>

      <main className="nb-auth-main">
        <div className="nb-auth-card">
          <div className="nb-auth-head">
            <h1>Iniciar Sesión</h1>
            <p>Ingresa tus credenciales para acceder a tu banca digital</p>
          </div>

          <form onSubmit={handleLogin} className="nb-auth-form" noValidate>
            {error && (
              <div className="nb-auth-alert" role="alert">
                {error}
              </div>
            )}

            <div className="nb-auth-group">
              <label htmlFor="auth-email">Correo Electrónico</label>
              <input
                id="auth-email"
                type="email"
                name="email"
                autoComplete="email"
                placeholder="nombre@dominio.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="nb-auth-group">
              <div className="nb-auth-label-row">
                <label htmlFor="auth-password">Contraseña</label>
                <button
                  type="button"
                  className="nb-auth-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "Ocultar" : "Mostrar"}
                </button>
              </div>
              <input
                id="auth-password"
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="current-password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              className="nb-auth-submit"
              disabled={isLoading}
            >
              {isLoading ? "Verificando acceso..." : "Acceder a mi cuenta"}
            </button>
          </form>

          <div className="nb-auth-foot">
            <span>¿Aún no tienes una cuenta?</span>
            <Link to="/register">Abrir cuenta personal</Link>
          </div>
        </div>
      </main>
    </div>
  );
}