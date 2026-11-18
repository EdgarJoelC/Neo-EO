import { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Send,
  Search,
  AlertCircle,
  Wallet,
  SlidersHorizontal,
  MoreHorizontal,
} from "lucide-react";
import ClientLayout from "./ClientLayout";
import { MetricCard, SegmentedTabs, Modal, Pagination } from "./components";
import "./Dashboard.css";
import "./Transactions.css";
import "./LightMode.css";

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [type, setType] = useState("Deposit");
  const [depositTarget, setDepositTarget] = useState("self");
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState(null);
  const [recipientQuery, setRecipientQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [frequentContacts, setFrequentContacts] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [modalError, setModalError] = useState("");

  const searchTimeoutRef = useRef(null);
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) return;
    axios
      .get("http://localhost:8080/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setCurrentUser(res.data))
      .catch(() => {});
  }, [token]);

  const fetchTransactions = async () => {
    if (!user || !token) return;
    try {
      const res = await axios.get(
        `http://localhost:8080/api/transactions/user/${user.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const mappedTransactions = res.data
        .map((tx) => {
          const ts = new Date(tx.timestamp).getTime();
          return {
            ...tx,
            description: tx.description || "",
            date: new Date(ts).toLocaleString(),
            ts,
          };
        })
        .sort((a, b) => b.ts - a.ts);

      setTransactions(mappedTransactions);
    } catch (err) {
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [user?.id, token]);

  const fetchFrequentContacts = async () => {
    if (!token) return;
    try {
      const res = await axios.get("http://localhost:8080/api/users/contacts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFrequentContacts(res.data || []);
    } catch (err) {
      setFrequentContacts([]);
    }
  };

  const handleOpenModal = () => {
    setShowModal(true);
    setModalError("");
    setAmount("");
    setRecipient(null);
    setRecipientQuery("");
    setSearchResults([]);
    fetchFrequentContacts();
  };

  const handleSearchRecipient = (query) => {
    setRecipientQuery(query);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await axios.get(
          `http://localhost:8080/api/users/search?q=${encodeURIComponent(
            query.trim()
          )}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const filtered = (res.data || []).filter((u) => u.id !== user.id);
        setSearchResults(filtered);
      } catch (err) {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 250);
  };

  const handleSelectRecipient = (u) => {
    setRecipient(u);
    setRecipientQuery("");
    setSearchResults([]);
  };

  const handleTransaction = async () => {
    setModalError("");
    const parsedAmount = parseFloat(amount);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setModalError("Por favor ingresa un monto válido mayor a 0.");
      return;
    }

    const needsRecipient =
      type === "Transfer" || (type === "Deposit" && depositTarget === "other");

    if (needsRecipient && !recipient) {
      setModalError("Por favor selecciona un destinatario.");
      return;
    }

    try {
      const dto = {
        userId: user.id,
        amount: parsedAmount,
        type: type.toUpperCase(),
        description:
          type === "Deposit"
            ? depositTarget === "other"
              ? `Depósito para ${recipient.firstName} ${recipient.lastName}`
              : `Depósito en cuenta propia`
            : type === "Transfer"
            ? `Transferencia a ${recipient.firstName} ${recipient.lastName}`
            : `Retiro de fondos`,
        recipientId: needsRecipient && recipient ? recipient.id : null,
      };

      const res = await axios.post(
        "http://localhost:8080/api/transactions",
        dto,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const ts = new Date(res.data.timestamp).getTime();
      const newTx = {
        ...res.data,
        description: res.data.description || "",
        date: new Date(ts).toLocaleString(),
        ts,
      };

      setTransactions((prev) => [newTx, ...prev].sort((a, b) => b.ts - a.ts));
      setShowModal(false);
      setAmount("");
      setRecipient(null);
      setRecipientQuery("");
      setType("Deposit");
      setDepositTarget("self");
    } catch (err) {
      const errMsg =
        err.response?.data?.message ||
        (typeof err.response?.data === "string" ? err.response?.data : null) ||
        "Error al procesar la transacción. Verifica tus fondos o el estado de tu cuenta.";
      setModalError(errMsg);
    }
  };

  const isFrozen = currentUser?.status === "FROZEN";
  const accountBalance = currentUser?.balance ?? user?.balance ?? 0;

  const enrichedTransactions = useMemo(() => {
    if (!transactions.length) return [];
    const sortedDesc = [...transactions].sort((a, b) => b.ts - a.ts);
    let running = Number(accountBalance);

    return sortedDesc.map((tx) => {
      const balanceForThisTx = running;
      const amt = Number(tx.amount || 0);
      if (tx.type === "DEPOSIT") {
        running = running - amt;
      } else {
        running = running + amt;
      }
      return {
        ...tx,
        runningBalance: balanceForThisTx,
      };
    });
  }, [transactions, accountBalance]);

  const displayedTransactions = useMemo(() => {
    return enrichedTransactions
      .filter((tx) => {
        if (filter === "all") return true;
        return tx.type === filter.toUpperCase();
      })
      .filter((tx) => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return true;
        return (
          tx.type?.toLowerCase().includes(q) ||
          tx.description?.toLowerCase().includes(q) ||
          String(tx.amount)?.toLowerCase().includes(q) ||
          tx.date?.toLowerCase().includes(q) ||
          (tx.category && tx.category.toLowerCase().includes(q))
        );
      });
  }, [enrichedTransactions, filter, searchQuery]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchQuery]);

  const totalItems = displayedTransactions.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedTransactions = displayedTransactions.slice(startIndex, endIndex);

  const countAll = transactions.length;
  const countDeposits = transactions.filter((t) => t.type === "DEPOSIT").length;
  const countWithdrawals = transactions.filter((t) => t.type === "WITHDRAWAL").length;
  const countTransfers = transactions.filter((t) => t.type === "TRANSFER").length;

  const totalDeposits = transactions
    .filter((t) => t.type === "DEPOSIT")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const totalWithdrawals = transactions
    .filter((t) => t.type === "WITHDRAWAL")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const totalTransfers = transactions
    .filter((t) => t.type === "TRANSFER")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const filterTabs = [
    { id: "all", label: "Todas", count: countAll },
    { id: "deposit", label: "Depósitos", count: countDeposits, icon: ArrowDownLeft },
    { id: "withdrawal", label: "Retiros", count: countWithdrawals, icon: ArrowUpRight },
    { id: "transfer", label: "Transferencias", count: countTransfers, icon: Send },
  ];

  return (
    <ClientLayout
      active="transactions"
      title="Movimientos y Transferencias"
      subtitle="Historial detallado de depósitos, retiros y transferencias bancarias en tiempo real"
      className="transactions-page-container"
    >
      <div className="transactions-container">
        {isFrozen && (
          <div className="frozen-banner">
            <AlertCircle size={18} />
            <span>
              <strong>Cuenta Congelada:</strong> Tu cuenta bancaria ha sido restringida preventivamente. Las operaciones están suspendidas.
            </span>
          </div>
        )}

        <div className="transactions-kpi-grid">
          <MetricCard
            title="Saldo Disponible"
            value={`$${Number(accountBalance).toLocaleString("en-US", {
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
            title="Total Ingresos"
            value={`+$${totalDeposits.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`}
            badge={`${countDeposits} depósitos`}
            badgeType="success"
            icon={ArrowDownLeft}
            accent="emerald"
            subtitle="Dinero recibido en cuenta"
          />

          <MetricCard
            title="Total Retiros"
            value={`-$${totalWithdrawals.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`}
            badge={`${countWithdrawals} retiros`}
            badgeType="warning"
            icon={ArrowUpRight}
            accent="amber"
            subtitle="Salidas registradas"
          />

          <MetricCard
            title="Transferencias"
            value={`$${totalTransfers.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`}
            badge={`${countTransfers} enviadas`}
            badgeType="info"
            icon={Send}
            accent="cyan"
            subtitle="Envíos a terceros"
          />
        </div>

        <div className="transactions-toolbar">
          <div className="transactions-toolbar-left">
            <SegmentedTabs
              tabs={filterTabs}
              activeTab={filter}
              onChange={setFilter}
            />
          </div>

          <div className="transactions-toolbar-right">
            <div className="transactions-search-wrap">
              <Search className="search-icon" aria-hidden="true" />
              <input
                type="text"
                className="transactions-search transactions-search-input"
                placeholder="Buscar por monto, concepto o fecha..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Buscar transacciones"
              />
            </div>

            <button
              type="button"
              className="transactions-filter-btn"
              title="Filtros"
              aria-label="Filtros"
              onClick={() => {}}
            >
              <SlidersHorizontal size={18} />
            </button>

            <button
              type="button"
              className="transactions-new-btn new-tx-btn"
              onClick={handleOpenModal}
              disabled={isFrozen}
            >
              <span>+</span> Nueva Operación
            </button>

            <select
              className="transactions-filter"
              value={filter === "all" ? "All" : filter === "deposit" ? "Deposits" : filter === "withdrawal" ? "Withdrawals" : "Transfers"}
              onChange={(e) => {
                const val = e.target.value.toLowerCase();
                if (val.includes("deposit")) setFilter("deposit");
                else if (val.includes("withdraw")) setFilter("withdrawal");
                else if (val.includes("transfer")) setFilter("transfer");
                else setFilter("all");
              }}
              tabIndex={-1}
              aria-hidden="true"
              style={{ position: "absolute", width: "1px", height: "1px", opacity: 0, pointerEvents: "none" }}
            >
              <option value="All">All</option>
              <option value="Deposits">Deposits</option>
              <option value="Withdrawals">Withdrawals</option>
              <option value="Transfers">Transfers</option>
            </select>
          </div>
        </div>

        <div className="transactions-table-card transactions-list">
          {loading ? (
            <div className="transactions-loading-state">
              <p>Cargando transacciones...</p>
            </div>
          ) : displayedTransactions.length === 0 ? (
            <div className="transactions-empty-state">
              <p>No se encontraron transacciones registradas.</p>
            </div>
          ) : (
            <>
              <div className="transactions-table-wrap">
                <table className="transactions-table">
                  <thead>
                    <tr>
                      <th className="th-fecha">FECHA</th>
                      <th className="th-tipo">TIPO</th>
                      <th className="th-concepto">CONCEPTO</th>
                      <th className="th-monto">MONTO</th>
                      <th className="th-saldo">SALDO</th>
                      <th className="th-acciones"><span className="sr-only">ACCIONES</span>⋯</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedTransactions.map((tx, index) => {
                      const isDeposit = tx.type === "DEPOSIT";
                      const isWithdrawal = tx.type === "WITHDRAWAL";
                      const displayType = isDeposit
                        ? "Depósito"
                        : isWithdrawal
                        ? "Retiro"
                        : "Transferencia";

                      const txDateObj = new Date(tx.timestamp || tx.ts);
                      const isValidDate = !isNaN(txDateObj.getTime());
                      const formattedDate = isValidDate
                        ? txDateObj.toLocaleDateString("es-ES", {
                            day: "numeric",
                            month: "numeric",
                            year: "numeric",
                          })
                        : tx.date || "—";
                      const formattedTime = isValidDate
                        ? txDateObj.toLocaleTimeString("es-ES", {
                            hour: "numeric",
                            minute: "2-digit",
                            second: "2-digit",
                            hour12: true,
                          })
                        : "";

                      const amountVal = Number(tx.amount || 0);
                      const formattedAmount = `${isDeposit ? "+" : "-"}$${amountVal.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`;

                      const formattedSaldo = `$${Number(tx.runningBalance || 0).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`;

                      const conceptTitle =
                        tx.description ||
                        (isDeposit
                          ? "Depósito en cuenta"
                          : isWithdrawal
                          ? "Retiro de fondos"
                          : "Transferencia bancaria");
                      const conceptSubtitle = tx.category
                        ? tx.category
                        : tx.recipientEmail
                        ? `Para: ${tx.recipientEmail}`
                        : `ID: #${tx.id || index + 1}`;

                      return (
                        <tr key={tx.id || index} className="transaction-row" data-type={tx.type}>
                          <td className="td-fecha">
                            <div className="tx-fecha-cell">
                              <div className={`tx-icon-box ${isDeposit ? "deposit" : isWithdrawal ? "withdrawal" : "transfer"}`}>
                                {isDeposit ? (
                                  <ArrowDownLeft size={16} />
                                ) : isWithdrawal ? (
                                  <ArrowUpRight size={16} />
                                ) : (
                                  <Send size={15} />
                                )}
                              </div>
                              <div className="tx-date-wrap">
                                <span className="tx-date-main">{formattedDate}</span>
                                {formattedTime && <span className="tx-date-sub">{formattedTime}</span>}
                              </div>
                            </div>
                          </td>

                          <td className="td-tipo">
                            <span className={`tx-type-pill ${isDeposit ? "deposit" : isWithdrawal ? "withdrawal" : "transfer"}`}>
                              {isDeposit ? (
                                <ArrowDownLeft size={13} className="pill-icon" />
                              ) : isWithdrawal ? (
                                <ArrowUpRight size={13} className="pill-icon" />
                              ) : (
                                <Send size={12} className="pill-icon" />
                              )}
                              <span>{displayType}</span>
                              <span style={{ display: "none" }}>{tx.type}</span>
                            </span>
                          </td>

                          <td className="td-concepto">
                            <div className="tx-concept-wrap">
                              <span className="tx-concept-title">{conceptTitle}</span>
                              {conceptSubtitle && (
                                <span className="tx-concept-sub">{conceptSubtitle}</span>
                              )}
                            </div>
                          </td>

                          <td className="td-monto">
                            <span className={`tx-amount ${isDeposit ? "positive" : isWithdrawal ? "negative" : "neutral"}`}>
                              {formattedAmount}
                            </span>
                          </td>

                          <td className="td-saldo">
                            <span className="tx-saldo">{formattedSaldo}</span>
                          </td>

                          <td className="td-acciones">
                            <button
                              type="button"
                              className="tx-action-btn"
                              aria-label="Detalles"
                            >
                              <MoreHorizontal size={16} />
                            </button>
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
                itemLabel="movimientos"
              />
            </>
          )}
        </div>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Nueva Transacción"
        subtitle="Selecciona el tipo de operación, destinatario y monto"
        icon={Send}
        maxWidth="520px"
      >
        {modalError && (
          <div className="modal-error-box">
            <AlertCircle size={16} />
            <span>{modalError}</span>
          </div>
        )}

        <label className="modal-label">Tipo de Operación</label>
        <div className="tx-type-buttons">
          <button
            type="button"
            className={`type-btn ${type === "Deposit" ? "active deposit" : ""}`}
            onClick={() => {
              setType("Deposit");
              setModalError("");
            }}
          >
            <ArrowDownLeft size={16} /> Depósito
          </button>
          <button
            type="button"
            className={`type-btn ${type === "Withdrawal" ? "active withdrawal" : ""}`}
            onClick={() => {
              setType("Withdrawal");
              setModalError("");
            }}
          >
            <ArrowUpRight size={16} /> Retiro
          </button>
          <button
            type="button"
            className={`type-btn ${type === "Transfer" ? "active transfer" : ""}`}
            onClick={() => {
              setType("Transfer");
              setModalError("");
            }}
          >
            <Send size={16} /> Transferencia
          </button>
        </div>

        {type === "Deposit" && (
          <div>
            <label className="modal-label">Destino del Depósito</label>
            <div className="dest-toggle-group">
              <button
                type="button"
                className={`dest-toggle-btn ${depositTarget === "self" ? "active" : ""}`}
                onClick={() => {
                  setDepositTarget("self");
                  setRecipient(null);
                }}
              >
                A mi propia cuenta
              </button>
              <button
                type="button"
                className={`dest-toggle-btn ${depositTarget === "other" ? "active" : ""}`}
                onClick={() => setDepositTarget("other")}
              >
                A otro usuario
              </button>
            </div>
          </div>
        )}

        {(type === "Transfer" ||
          (type === "Deposit" && depositTarget === "other")) && (
          <div>
            <label className="modal-label">Destinatario</label>

            {recipient ? (
              <div className="selected-recipient-card">
                <div>
                  <div className="recipient-name">
                    {recipient.firstName} {recipient.lastName}
                  </div>
                  <div className="recipient-email">{recipient.email}</div>
                </div>
                <button
                  type="button"
                  className="change-recipient-btn"
                  onClick={() => setRecipient(null)}
                >
                  Cambiar
                </button>
              </div>
            ) : (
              <>
                {frequentContacts.length > 0 && (
                  <div className="frequent-contacts-wrap">
                    <div className="frequent-contacts-title">
                      Contactos Frecuentes
                    </div>
                    <div className="contacts-chips">
                      {frequentContacts.map((c) => (
                        <div
                          key={c.id}
                          className="contact-chip"
                          onClick={() => handleSelectRecipient(c)}
                          title={`${c.firstName} ${c.lastName} (${c.email})`}
                        >
                          <div className="contact-chip-avatar">
                            {(c.firstName || "U")[0]}
                          </div>
                          <span>{c.firstName}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="recipient-search-wrap">
                  <input
                    type="text"
                    className="modal-input"
                    placeholder="Buscar por nombre, apellido o correo..."
                    value={recipientQuery}
                    onChange={(e) => handleSearchRecipient(e.target.value)}
                  />

                  {searchResults.length > 0 && (
                    <div className="recipient-dropdown">
                      {searchResults.map((u) => (
                        <div
                          key={u.id}
                          className="recipient-dropdown-item"
                          onClick={() => handleSelectRecipient(u)}
                        >
                          <span className="recipient-name">
                            {u.firstName} {u.lastName}
                          </span>
                          <span className="recipient-email">{u.email}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {searching && (
                    <div className="searching-hint">Buscando usuarios...</div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        <div>
          <label className="modal-label">Monto ($ USD)</label>
          <input
            type="number"
            className="modal-input"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Ej. 100.00"
            min="0.01"
            step="0.01"
          />
        </div>

        <div className="modal-buttons">
          <button
            type="button"
            className="modal-btn cancel"
            onClick={() => setShowModal(false)}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="modal-btn confirm"
            onClick={handleTransaction}
          >
            Confirmar Operación
          </button>
        </div>
      </Modal>
    </ClientLayout>
  );
}