import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "./auth.css";

export default function Register() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password !== repeatPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await axios.post("/api/auth/register", {
        firstName,
        lastName,
        email,
        password,
        phoneNumber,
      });

      localStorage.setItem("token", res.data.jwtToken);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      setSuccess("Registro exitoso. Redirigiendo a tu cuenta bancaria...");
      setError("");

      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Error en el registro. Verifica tus datos e intenta nuevamente."
      );
      setSuccess("");
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
        <div className="nb-auth-card nb-auth-card-wide">
          <div className="nb-auth-head">
            <h1>Crear Cuenta Personal</h1>
            <p>Completa tus datos para abrir tu cuenta bancaria digital</p>
          </div>

          <form onSubmit={handleRegister} className="nb-auth-form" noValidate>
            {error && (
              <div className="nb-auth-alert" role="alert">
                {error}
              </div>
            )}

            {success && (
              <div className="nb-auth-success" role="status">
                {success}
              </div>
            )}

            <div className="nb-auth-row">
              <div className="nb-auth-group">
                <label htmlFor="register-firstname">Nombre</label>
                <input
                  id="register-firstname"
                  type="text"
                  name="firstName"
                  autoComplete="given-name"
                  placeholder="Carlos"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="nb-auth-group">
                <label htmlFor="register-lastname">Apellido</label>
                <input
                  id="register-lastname"
                  type="text"
                  name="lastName"
                  autoComplete="family-name"
                  placeholder="Mendoza"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="nb-auth-group">
              <label htmlFor="register-email">Correo Electrónico</label>
              <input
                id="register-email"
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
              <label htmlFor="register-phone">Teléfono (opcional)</label>
              <input
                id="register-phone"
                type="tel"
                name="phone"
                autoComplete="tel"
                placeholder="+51 987 654 321"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="nb-auth-row">
              <div className="nb-auth-group">
                <div className="nb-auth-label-row">
                  <label htmlFor="register-password">Contraseña</label>
                  <button
                    type="button"
                    className="nb-auth-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
                <input
                  id="register-password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete="new-password"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="nb-auth-group">
                <div className="nb-auth-label-row">
                  <label htmlFor="register-repeat-password">Confirmar</label>
                  <button
                    type="button"
                    className="nb-auth-toggle"
                    onClick={() => setShowRepeatPassword(!showRepeatPassword)}
                  >
                    {showRepeatPassword ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
                <input
                  id="register-repeat-password"
                  type={showRepeatPassword ? "text" : "password"}
                  name="repeatPassword"
                  autoComplete="new-password"
                  placeholder="Repite tu contraseña"
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <button
              type="submit"
              className="nb-auth-submit"
              disabled={isLoading}
            >
              {isLoading ? "Creando cuenta..." : "Registrarme en NeoBank"}
            </button>
          </form>

          <div className="nb-auth-foot">
            <span>¿Ya tienes una cuenta activa?</span>
            <Link to="/login">Inicia sesión aquí</Link>
          </div>
        </div>
      </main>
    </div>
  );
}