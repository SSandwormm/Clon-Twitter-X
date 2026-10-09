import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth-context";
import countries from "../data/countries";

const errorMessages = {
  "auth/email-already-in-use": "Ya existe una cuenta con ese correo.",
  "auth/invalid-credential": "El correo o la contraseña no son correctos.",
  "auth/invalid-email": "Introduce un correo electrónico válido.",
  "auth/user-not-found": "No encontramos una cuenta con ese correo.",
  "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
  "auth/network-request-failed":
    "No se pudo conectar. Comprueba tu conexión e inténtalo de nuevo.",
  "auth/popup-closed-by-user":
    "Se cerró la ventana de Google antes de terminar.",
  "auth/popup-blocked":
    "El navegador bloqueó la ventana de Google. Permite las ventanas emergentes e inténtalo de nuevo.",
  "auth/invalid-phone-number": "Introduce un número de teléfono válido.",
  "auth/missing-phone-number": "Introduce tu número de teléfono.",
  "auth/invalid-verification-code":
    "El código no es correcto. Revísalo e inténtalo de nuevo.",
  "auth/code-expired": "El código venció. Solicita uno nuevo.",
  "auth/captcha-check-failed":
    "No se pudo verificar el dispositivo. Inténtalo de nuevo.",
  "auth/operation-not-allowed":
    "El acceso con teléfono no está habilitado en este proyecto.",
  "auth/quota-exceeded":
    "Se alcanzó el límite de mensajes SMS. Inténtalo más tarde.",
  "auth/too-many-requests":
    "Se hicieron demasiados intentos. Espera un momento e inténtalo de nuevo.",
};

function XLogo({ className = "" }) {
  return (
    <svg
      aria-label="X"
      className={className}
      role="img"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.657l-5.214-6.817-5.967 6.817H1.68l7.73-8.835L1.254 2.25h6.826l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function GoogleLogo() {
  return (
    <svg aria-hidden="true" className="size-5" viewBox="0 0 48 48">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.76 7.18l7.73 6C44.42 38.05 46.98 31.9 46.98 24.55Z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.89.93 7.59 2.56 10.78l7.97-6.19Z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.14 1.44-4.89 2.3-8.18 2.3-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"
      />
    </svg>
  );
}

function AppleLogo() {
  return (
    <svg
      aria-hidden="true"
      className="size-5"
      fill="currentColor"
      viewBox="0 0 384 512"
    >
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.8-84.7-44.7-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.8-76.4-19.8C63.3 141 0 186.7 0 279c0 27.3 5 55.5 15 84.6 13.4 36.7 61.7 126.7 112 125.2 24.7-.6 42.1-17.5 75-17.5 31.9 0 48 17.5 75.5 17.5 50.7-.7 94.4-82.5 107.1-119.3-68.1-32.1-65.9-98.9-65.9-100.8ZM262.5 104.6c27.3-32.4 24.8-62.1 24-72.6-24.1 1.4-52 16.4-67.9 34.6-17.5 19.6-27.8 43.8-25.6 71.1 26.1 2 50-11.4 69.5-33.1Z" />
    </svg>
  );
}

function getErrorMessage(error) {
  return (
    errorMessages[error.code] ||
    "No se pudo completar la operación. Inténtalo de nuevo."
  );
}

const inputClassName =
  "w-full rounded border border-zinc-300 bg-white px-3 py-4 text-base text-black outline-none transition placeholder:text-zinc-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500";
const outlineButtonClassName =
  "flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-zinc-300 bg-white px-4 py-2.5 text-sm font-bold text-zinc-900 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60";

export default function Login() {
  const {
    login,
    loginWithGoogle,
    requestPhoneCode,
    confirmPhoneCode,
    register,
  } = useAuth();
  const navigate = useNavigate();
  const recaptchaContainerRef = useRef(null);
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [phoneModalOpen, setPhoneModalOpen] = useState(false);
  const [phoneStep, setPhoneStep] = useState("number");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [smsCode, setSmsCode] = useState("");
  const [selectedCountry, setSelectedCountry] = useState(
    countries.find((country) => country.code === "US"),
  );
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);
  const [countryQuery, setCountryQuery] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [phoneError, setPhoneError] = useState("");
  const [notice, setNotice] = useState("");

  const filteredCountries = countries.filter((country) => {
    const query = countryQuery.trim().toLocaleLowerCase();
    return (
      country.name.toLocaleLowerCase().includes(query) ||
      country.code.toLowerCase().includes(query) ||
      country.dialCode.includes(query)
    );
  }).sort((countryA, countryB) => {
    if (countryA.code === "US") return -1;
    if (countryB.code === "US") return 1;
    return countryA.name.localeCompare(countryB.name, "en");
  });

  function openPhoneModal() {
    setPhoneStep("number");
    setPhoneNumber("");
    setSmsCode("");
    setConfirmationResult(null);
    setPhoneError("");
    setCountryPickerOpen(false);
    setCountryQuery("");
    setPhoneModalOpen(true);
  }

  function closePhoneModal() {
    if (submitting) return;
    setPhoneModalOpen(false);
    setPhoneError("");
    setCountryPickerOpen(false);
  }

  async function handleRequestPhoneCode(event) {
    event.preventDefault();
    setPhoneError("");
    setSubmitting(true);
    const fullPhoneNumber = `${selectedCountry.dialCode}${phoneNumber}`;

    try {
      const result = await requestPhoneCode(
        fullPhoneNumber,
        recaptchaContainerRef.current,
      );
      setConfirmationResult(result);
      setPhoneStep("code");
    } catch (phoneAuthError) {
      setPhoneError(getErrorMessage(phoneAuthError));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmPhoneCode(event) {
    event.preventDefault();
    setPhoneError("");
    setSubmitting(true);

    try {
      await confirmPhoneCode(confirmationResult, smsCode);
      setPhoneModalOpen(false);
      navigate("/", { replace: true });
    } catch (phoneAuthError) {
      setPhoneError(getErrorMessage(phoneAuthError));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogleLogin() {
    setError("");
    setSubmitting(true);
    try {
      await loginWithGoogle();
      navigate("/", { replace: true });
    } catch (authError) {
      setError(getErrorMessage(authError));
    } finally {
      setSubmitting(false);
    }
  }

  function continueWithEmail(event) {
    event.preventDefault();
    setError("");
    setStep("password");
  }

  async function handleLogin(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/", { replace: true });
    } catch (authError) {
      setError(getErrorMessage(authError));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRegister(event) {
    event.preventDefault();
    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setError("Introduce un nombre de usuario.");
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      await register(email, password, trimmedUsername);
      navigate("/", { replace: true });
    } catch (authError) {
      setError(getErrorMessage(authError));
    } finally {
      setSubmitting(false);
    }
  }

  function changeStep(nextStep) {
    setError("");
    setPassword("");
    setUsername("");
    setStep(nextStep);
  }

  return (
    <main className="flex min-h-screen bg-white font-sans text-black">
      <section className="flex min-h-screen w-full flex-col justify-center px-7 py-12 sm:px-12 lg:w-1/2 lg:px-16 xl:px-24">
        <h1 className="mb-10 max-w-2xl text-[2.65rem] leading-[1.05] font-normal tracking-[-0.03em] sm:text-6xl xl:text-7xl">
          Lo que está
          <br />
          pasando
          <br />
          ahora.
        </h1>

        <div className="w-full max-w-[380px]">
          {step === "email" && (
            <>
              <div className="space-y-3">
                <button
                  className="flex min-h-11 w-full items-center justify-center rounded-full bg-black px-4 py-2.5 text-sm font-bold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={submitting}
                  onClick={openPhoneModal}
                  type="button"
                >
                  Continuar con el teléfono
                </button>
                <button
                  className={outlineButtonClassName}
                  disabled={submitting}
                  onClick={handleGoogleLogin}
                  type="button"
                >
                  <GoogleLogo />
                  Continuar con Google
                </button>
                <button
                  className={outlineButtonClassName}
                  onClick={() => setNotice("No disponible en esta versión")}
                  type="button"
                >
                  <AppleLogo />
                  Continuar con Apple
                </button>
              </div>

              {notice && (
                <p
                  className="mt-3 text-center text-sm text-zinc-600"
                  role="status"
                >
                  {notice}
                </p>
              )}

              <div className="my-4 flex items-center gap-2 text-sm">
                <span className="h-px flex-1 bg-zinc-300" />
                <span>o</span>
                <span className="h-px flex-1 bg-zinc-300" />
              </div>

              <form className="space-y-3" onSubmit={continueWithEmail}>
                <label className="sr-only" htmlFor="email">
                  Correo electrónico
                </label>
                <input
                  autoComplete="email"
                  className={inputClassName}
                  id="email"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Correo electrónico"
                  required
                  type="email"
                  value={email}
                />
                <button
                  className="min-h-11 w-full rounded-full bg-zinc-300 px-4 py-2.5 text-sm font-bold text-zinc-500 transition enabled:bg-zinc-200 enabled:text-zinc-900 enabled:hover:bg-zinc-300 disabled:cursor-not-allowed"
                  disabled={!email.trim()}
                  type="submit"
                >
                  Continuar
                </button>
              </form>
            </>
          )}

          {step === "password" && (
            <>
              <button
                aria-label="Volver"
                className="mb-5 grid size-9 place-items-center rounded-full border border-zinc-300 text-xl hover:bg-zinc-100"
                onClick={() => changeStep("email")}
                type="button"
              >
                ←
              </button>
              <h2 className="mb-6 text-3xl font-extrabold tracking-tight">
                Inicia sesión
              </h2>
              <p className="mb-5 rounded border border-zinc-300 bg-zinc-50 px-3 py-4 text-sm text-zinc-700">
                {email}
              </p>
              <form className="space-y-3" onSubmit={handleLogin}>
                <label className="sr-only" htmlFor="password">
                  Contraseña
                </label>
                <input
                  autoComplete="current-password"
                  className={inputClassName}
                  id="password"
                  minLength={6}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Contraseña"
                  required
                  type="password"
                  value={password}
                />
                <button
                  className="min-h-11 w-full rounded-full bg-black px-4 py-2.5 text-sm font-bold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={submitting}
                  type="submit"
                >
                  {submitting ? "Un momento..." : "Iniciar sesión"}
                </button>
              </form>
              <p className="mt-6 text-center text-sm text-zinc-600">
                ¿No tienes cuenta?{" "}
                <button
                  className="font-semibold text-sky-600 hover:underline"
                  onClick={() => changeStep("register")}
                  type="button"
                >
                  Crear cuenta
                </button>
              </p>
            </>
          )}

          {step === "register" && (
            <>
              <button
                aria-label="Volver"
                className="mb-5 grid size-9 place-items-center rounded-full border border-zinc-300 text-xl hover:bg-zinc-100"
                onClick={() => changeStep("password")}
                type="button"
              >
                ←
              </button>
              <h2 className="mb-6 text-3xl font-extrabold tracking-tight">
                Crea tu cuenta
              </h2>
              <p className="mb-5 rounded border border-zinc-300 bg-zinc-50 px-3 py-4 text-sm text-zinc-700">
                {email}
              </p>
              <form className="space-y-3" onSubmit={handleRegister}>
                <label className="sr-only" htmlFor="username">
                  Nombre de usuario
                </label>
                <input
                  autoComplete="nickname"
                  className={inputClassName}
                  id="username"
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Nombre de usuario"
                  required
                  type="text"
                  value={username}
                />
                <label className="sr-only" htmlFor="register-password">
                  Contraseña
                </label>
                <input
                  autoComplete="new-password"
                  className={inputClassName}
                  id="register-password"
                  minLength={6}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Contraseña"
                  required
                  type="password"
                  value={password}
                />
                <button
                  className="min-h-11 w-full rounded-full bg-black px-4 py-2.5 text-sm font-bold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={submitting}
                  type="submit"
                >
                  {submitting ? "Un momento..." : "Crear cuenta"}
                </button>
              </form>
            </>
          )}

          {error && (
            <p
              className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
              role="alert"
            >
              {error}
            </p>
          )}

          <p className="mt-8 text-xs leading-relaxed text-zinc-500">
            Al registrarte, aceptas los{" "}
            <a className="text-sky-600 hover:underline" href="#terminos">
              Términos de servicio
            </a>{" "}
            y la{" "}
            <a className="text-sky-600 hover:underline" href="#privacidad">
              Política de privacidad
            </a>
            , incluida la política de uso de cookies.
          </p>
        </div>
      </section>

      <aside
        aria-label="X"
        className="hidden w-1/2 items-center justify-center lg:flex"
      >
        <XLogo className="size-[min(42vw,420px)] text-black" />
      </aside>

      {phoneModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(91,112,131,0.4)] px-4 py-4 backdrop-blur-sm">
          <section
            aria-labelledby="phone-modal-title"
            aria-modal="true"
            className="relative h-[min(665px,calc(100dvh-32px))] w-[min(700px,calc(100vw-32px))] overflow-hidden rounded-[24px] bg-white shadow-2xl"
            role="dialog"
          >
            <div className="absolute inset-x-0 top-4 z-20 flex h-[34px] items-center justify-center">
              <button
                aria-label="Cerrar"
                className="absolute left-4 grid size-[34px] place-items-center rounded-full text-2xl leading-none hover:bg-zinc-100 disabled:opacity-50"
                disabled={submitting}
                onClick={closePhoneModal}
                type="button"
              >
                ←
              </button>
              <XLogo className="size-8 text-black" />
            </div>

            {phoneStep === "number" ? (
              <div className="mx-auto flex h-full w-full max-w-[390px] flex-col px-4 pb-8 pt-[92px] sm:px-0">
                <h2
                  className="mb-6 text-[31px] leading-[1.15] font-bold tracking-[-0.02em] text-black"
                  id="phone-modal-title"
                >
                  Introduce tu número de teléfono
                </h2>

                <form
                  className="flex min-h-0 flex-1 flex-col"
                  onSubmit={handleRequestPhoneCode}
                >
                  <div className="relative flex h-14 shrink-0 rounded-[4px] border-2 border-[#1d9bf0]">
                    <button
                      aria-expanded={countryPickerOpen}
                      aria-haspopup="listbox"
                      className="flex shrink-0 items-center gap-1 pl-3 text-sm font-medium hover:bg-zinc-50"
                      onClick={() =>
                        setCountryPickerOpen((isOpen) => !isOpen)
                      }
                      type="button"
                    >
                      <span className="font-bold">{selectedCountry.code}</span>
                      <span>{selectedCountry.dialCode}</span>
                      <svg
                        aria-hidden="true"
                        className="size-4 text-zinc-500"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="m6 9 6 6 6-6"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                        />
                      </svg>
                    </button>
                    <label className="sr-only" htmlFor="phone-number">
                      Número de teléfono
                    </label>
                    <input
                      autoComplete="tel-national"
                      className="min-w-0 flex-1 bg-transparent px-3 text-lg outline-none placeholder:text-zinc-500"
                      id="phone-number"
                      inputMode="tel"
                      onChange={(event) =>
                        setPhoneNumber(event.target.value.replace(/\D/g, ""))
                      }
                      placeholder="Número de teléfono"
                      type="tel"
                      value={phoneNumber}
                    />

                    {countryPickerOpen && (
                      <div
                        className="absolute left-0 top-[calc(100%+4px)] z-10 flex h-[320px] w-full flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg"
                        role="listbox"
                      >
                        <div className="shrink-0 border-b border-zinc-200 p-2">
                          <div className="flex h-10 items-center gap-2 rounded-full border border-zinc-200 px-3">
                            <svg
                              aria-hidden="true"
                              className="size-4 shrink-0 text-zinc-500"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                cx="11"
                                cy="11"
                                r="7"
                                stroke="currentColor"
                                strokeWidth="2"
                              />
                              <path
                                d="m16 16 4 4"
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeWidth="2"
                              />
                            </svg>
                            <input
                              autoFocus
                              aria-label="Search"
                              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-500"
                              onChange={(event) =>
                                setCountryQuery(event.target.value)
                              }
                              placeholder="Search"
                              value={countryQuery}
                            />
                          </div>
                        </div>
                        <div className="min-h-0 flex-1 overflow-y-auto py-1">
                          {filteredCountries.length ? (
                            filteredCountries.map((country) => (
                              <button
                                aria-selected={
                                  selectedCountry.code === country.code
                                }
                                className="flex h-11 w-full items-center gap-3 px-4 text-left text-sm hover:bg-zinc-100"
                                key={country.code}
                                onClick={() => {
                                  setSelectedCountry(country);
                                  setCountryPickerOpen(false);
                                  setCountryQuery("");
                                }}
                                role="option"
                                type="button"
                              >
                                <span className="w-7 shrink-0 text-xs font-bold">
                                  {country.code}
                                </span>
                                <span className="min-w-0 flex-1 truncate">
                                  {country.name}
                                </span>
                                <span className="shrink-0 text-zinc-500">
                                  {country.dialCode}
                                </span>
                              </button>
                            ))
                          ) : (
                            <p className="px-4 py-3 text-sm text-zinc-500">
                              No se encontraron países.
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div ref={recaptchaContainerRef} />

                  {phoneError && (
                    <p
                      className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
                      role="alert"
                    >
                      {phoneError}
                    </p>
                  )}

                  <div className="mt-auto shrink-0 text-left">
                    <p className="text-[13px] leading-[18px] text-zinc-500">
                      Le enviaremos un código de verificación por SMS. Al
                      ingresar su número, acepta recibir mensajes
                      transaccionales sobre su cuenta. Otros podrán encontrarlo
                      por número de teléfono.
                    </p>
                    <details className="group mt-2 text-[13px] text-zinc-500">
                      <summary className="inline-flex w-fit cursor-pointer list-none items-center gap-1 outline-none select-none hover:text-zinc-700 focus:outline-none">
                        Opciones de privacidad
                        <svg
                          aria-hidden="true"
                          className="size-4 text-zinc-500 transition-transform duration-200 group-open:rotate-180"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <path
                            d="m6 9 6 6 6-6"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                          />
                        </svg>
                      </summary>
                      <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-200 group-open:grid-rows-[1fr]">
                        <div className="overflow-hidden">
                          <div className="mt-3 flex items-center gap-4 rounded-2xl bg-white p-4 shadow-md">
                            <div className="min-w-0 flex-1">
                              <p className="text-[15px] font-bold text-black">
                                Conéctate con amigos que conoces
                              </p>
                              <p className="mt-1 text-[15px] leading-5 text-zinc-500">
                                Permite que las personas encuentren tu cuenta
                                con tu número de teléfono o correo electrónico
                              </p>
                            </div>
                            <div
                              aria-label="Activado"
                              className="relative h-8 w-[52px] shrink-0 rounded-full bg-[#1d9bf0]"
                              role="img"
                            >
                              <span className="absolute top-1 right-1 size-6 rounded-full bg-white shadow-sm" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </details>
                    <button
                      className="mt-3 min-h-[52px] w-full rounded-full bg-[#d4d4d4] px-4 py-2.5 text-sm font-bold text-zinc-600 transition enabled:bg-black enabled:text-white enabled:hover:bg-zinc-800 disabled:cursor-not-allowed"
                      disabled={!phoneNumber || submitting}
                      type="submit"
                    >
                      {submitting ? "Enviando..." : "Continuar"}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <>
                <h2
                  className="mb-3 text-2xl font-extrabold tracking-tight"
                  id="phone-modal-title"
                >
                  Introduce el código
                </h2>
                <p className="mb-6 text-sm leading-5 text-zinc-500">
                  Enviamos un código de 6 dígitos a{" "}
                  <span className="font-medium text-zinc-700">
                    {selectedCountry.dialCode} {phoneNumber}
                  </span>
                  .
                </p>
                <form
                  className="space-y-4"
                  onSubmit={handleConfirmPhoneCode}
                >
                  <label className="sr-only" htmlFor="sms-code">
                    Código de 6 dígitos
                  </label>
                  <input
                    autoComplete="one-time-code"
                    autoFocus
                    className={inputClassName}
                    id="sms-code"
                    inputMode="numeric"
                    maxLength={6}
                    onChange={(event) =>
                      setSmsCode(event.target.value.replace(/\D/g, ""))
                    }
                    placeholder="Código de 6 dígitos"
                    required
                    type="text"
                    value={smsCode}
                  />
                  {phoneError && (
                    <p
                      className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
                      role="alert"
                    >
                      {phoneError}
                    </p>
                  )}
                  <button
                    className="min-h-11 w-full rounded-full bg-black px-4 py-2.5 text-sm font-bold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={smsCode.length !== 6 || submitting}
                    type="submit"
                  >
                    {submitting ? "Verificando..." : "Verificar"}
                  </button>
                  <button
                    className="w-full py-2 text-sm font-medium text-sky-600 hover:underline"
                    disabled={submitting}
                    onClick={() => {
                      setPhoneStep("number");
                      setPhoneError("");
                      setSmsCode("");
                    }}
                    type="button"
                  >
                    Cambiar número de teléfono
                  </button>
                </form>
              </>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
