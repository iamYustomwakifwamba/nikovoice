import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
} from "libphonenumber-js";
import { ChevronDown, Eye, EyeOff, Loader2, Search } from "lucide-react";

import Alert from "../ui/Alert";
import { register as registerRequest } from "../../auth/authService";

function GoogleLogo({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

/* ---------- Nchi ---------- */

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

const nameOf = (code) => {
  try {
    return regionNames.of(code) || code;
  } catch {
    return code;
  }
};

const COUNTRIES = getCountries()
  .map((code) => ({
    code,
    name: nameOf(code),
    dial: getCountryCallingCode(code),
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

const DEFAULT_COUNTRY = "TZ";

/* ---------- Makosa kutoka backend ---------- */

// DRF inarudisha { field: ["ujumbe", ...] } au { detail: "ujumbe" }
function readServerErrors(err) {
  const res = err?.response;

  if (!res) {
    return {
      form: "Can't reach the server. Check your connection and try again.",
    };
  }
  if (res.status === 429) {
    return { form: "Too many attempts. Please wait a while and try again." };
  }
  if (res.status >= 500) {
    return { form: "Server error. Please try again later." };
  }

  const data = res.data;
  const text = (v) =>
    Array.isArray(v) ? v.join(" ") : typeof v === "string" ? v : "";

  const fields = {};
  if (data && typeof data === "object") {
    if (data.email) fields.email = text(data.email);
    if (data.phone) fields.phone = text(data.phone);
    // Nchi haina sehemu yake kwenye fomu, kwa hiyo kosa lake linaonekana chini ya Phone
    if (data.country && !fields.phone) fields.phone = text(data.country);
    if (data.password) fields.password = text(data.password);
    if (data.repeat_password) fields.repeat = text(data.repeat_password);
  }

  if (Object.keys(fields).length) return { fields };

  return {
    form:
      (typeof data?.detail === "string" && data.detail) ||
      "Something went wrong. Please try again.",
  };
}

/* ---------- Vipande vidogo ---------- */

const inputClass = (hasError) =>
  `h-9 w-full rounded-md border bg-white px-2.5 text-[13px] text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-[#673de6] ${
    hasError ? "border-red-500" : "border-gray-300"
  }`;

function Field({ label, htmlFor, error, children }) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1 block text-[12px] font-medium text-gray-900"
      >
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-[11px] text-red-600">{error}</p>}
    </div>
  );
}

function PasswordInput({
  id,
  value,
  onChange,
  placeholder,
  invalid,
  show,
  onToggle,
}) {
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? "text" : "password"}
        autoComplete="new-password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-invalid={invalid}
        className={`${inputClass(invalid)} pr-9`}
      />
      <button
        type="button"
        onClick={onToggle}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute right-1 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded text-gray-500 hover:text-gray-900"
      >
        {show ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  );
}

function PhoneField({ id, country, onCountry, value, onChange, invalid }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef(null);
  const inputRef = useRef(null);
  const current = COUNTRIES.find((c) => c.code === country);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^\+/, "");
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase() === q ||
        c.dial.startsWith(q)
    );
  }, [query]);

  const choose = (code) => {
    onCountry(code);
    setOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={wrapRef} className="relative">
      <div
        className={`flex h-9 items-stretch rounded-md border bg-white transition-colors focus-within:border-[#673de6] ${
          invalid ? "border-red-500" : "border-gray-300"
        }`}
      >
        <button
          type="button"
          aria-label="Country calling code"
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => {
            setQuery("");
            setOpen((o) => !o);
          }}
          className="flex shrink-0 items-center gap-1 rounded-l-md border-r border-gray-300 px-2 text-[13px] hover:bg-gray-50"
        >
          <span className="font-medium text-gray-900">{current?.code}</span>
          <span className="text-gray-500">+{current?.dial}</span>
          <ChevronDown size={12} className="text-gray-500" />
        </button>
        <input
          id={id}
          ref={inputRef}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="712 345 678"
          aria-invalid={invalid}
          className="min-w-0 flex-1 bg-transparent px-2.5 text-[13px] text-gray-900 outline-none placeholder:text-gray-400"
        />
      </div>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-1 w-[260px] max-w-[calc(100vw-2rem)] rounded-md border border-gray-200 bg-white shadow-md">
          <div className="flex items-center gap-2 border-b border-gray-200 px-2.5">
            <Search size={14} className="shrink-0 text-gray-500" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search country"
              className="h-9 min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-gray-400"
            />
          </div>
          <ul role="listbox" className="max-h-56 overflow-y-auto p-1">
            {list.length === 0 && (
              <li className="px-2.5 py-3 text-center text-[12px] text-gray-500">
                No match
              </li>
            )}
            {list.map((c) => (
              <li key={c.code} role="option" aria-selected={c.code === country}>
                <button
                  type="button"
                  onClick={() => choose(c.code)}
                  className={`flex w-full items-center justify-between gap-2 rounded px-2.5 py-1.5 text-left text-[13px] hover:bg-gray-100 ${
                    c.code === country ? "bg-gray-100" : ""
                  }`}
                >
                  <span className="truncate text-gray-900">{c.name}</span>
                  <span className="shrink-0 text-gray-500">+{c.dial}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ---------- Fomu ---------- */

function SignUpSection({ onGoogle }) {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState(DEFAULT_COUNTRY);
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (loading) return;

    const cleanEmail = email.trim();
    const parsed = parsePhoneNumberFromString(phone, country);

    const next = {};
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      next.email = "Enter a valid email address";
    }
    if (!parsed || !parsed.isValid()) next.phone = "Enter a valid phone number";
    if (password.length < 8) next.password = "Use at least 8 characters";
    if (repeat !== password) next.repeat = "Passwords don't match";

    setErrors(next);
    setFormError("");
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      await registerRequest({
        email: cleanEmail,
        phone: parsed.number, // muundo wa kimataifa, mfano +255712345678
        country: parsed.country || country,
        password,
        repeat_password: repeat,
      });
      setSuccess(true); // hakuna redirect: tunaonyesha ujumbe tu
    } catch (err) {
      const { fields, form } = readServerErrors(err);
      if (fields) setErrors(fields);
      if (form) setFormError(form);
    } finally {
      setLoading(false);
    }
  };

  const toggle = () => setShowPassword((s) => !s);

  return (
    <div className="w-full max-w-[460px] rounded-md border border-gray-200 bg-white antialiased">
      <div className="px-6 pb-6 pt-7">
        <p className="select-none text-center text-[22px] font-bold lowercase leading-none tracking-tight text-gray-500">
          nikovoice
        </p>

        {success ? (
          <div className="mt-6">
            <Alert variant="success" title="Account created successfully">
              Your account is ready. You can now sign in with your email and
              password.
            </Alert>

            <Link
              to="/login"
              className="mt-4 flex h-9 w-full items-center justify-center rounded-md bg-[#673de6] text-[13px] font-semibold text-white transition-colors hover:bg-[#5b32d4]"
            >
              Go to sign in
            </Link>
          </div>
        ) : (
          <>
            <h1 className="mt-5 text-center text-[14px] font-semibold text-gray-950">
              Create your account
            </h1>
            <p className="mt-0.5 text-center text-[12px] text-gray-500">
              Welcome! Please fill in the details to get started
            </p>

            {/* Google (logo tu) */}
            <button
              type="button"
              onClick={onGoogle}
              aria-label="Continue with Google"
              title="Continue with Google"
              className="mt-5 flex h-9 w-full items-center justify-center rounded-md border border-gray-200 bg-gray-100 transition-colors hover:bg-gray-200/70"
            >
              <GoogleLogo />
            </button>

            <div className="my-4 flex items-center gap-3">
              <span className="h-px flex-1 bg-gray-200" />
              <span className="text-[12px] text-gray-500">or</span>
              <span className="h-px flex-1 bg-gray-200" />
            </div>

            <form
              onSubmit={submit}
              noValidate
              className="grid grid-cols-1 gap-x-3 gap-y-3 sm:grid-cols-2"
            >
              {/* Mstari 1 */}
              <Field
                label="Email address"
                htmlFor="su-email"
                error={errors.email}
              >
                <input
                  id="su-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  aria-invalid={Boolean(errors.email)}
                  className={inputClass(errors.email)}
                />
              </Field>

              <Field
                label="Phone number"
                htmlFor="su-phone"
                error={errors.phone}
              >
                <PhoneField
                  id="su-phone"
                  country={country}
                  onCountry={setCountry}
                  value={phone}
                  onChange={setPhone}
                  invalid={Boolean(errors.phone)}
                />
              </Field>

              {/* Mstari 2 */}
              <Field
                label="Password"
                htmlFor="su-password"
                error={errors.password}
              >
                <PasswordInput
                  id="su-password"
                  value={password}
                  onChange={setPassword}
                  placeholder="At least 8 characters"
                  invalid={Boolean(errors.password)}
                  show={showPassword}
                  onToggle={toggle}
                />
              </Field>

              <Field
                label="Repeat password"
                htmlFor="su-repeat"
                error={errors.repeat}
              >
                <PasswordInput
                  id="su-repeat"
                  value={repeat}
                  onChange={setRepeat}
                  placeholder="Repeat password"
                  invalid={Boolean(errors.repeat)}
                  show={showPassword}
                  onToggle={toggle}
                />
              </Field>

              {formError && (
                <Alert
                  variant="error"
                  onClose={() => setFormError("")}
                  className="sm:col-span-2"
                >
                  {formError}
                </Alert>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex h-9 w-full items-center justify-center gap-2 rounded-md bg-[#673de6] text-[13px] font-semibold text-white transition-colors hover:bg-[#5b32d4] disabled:cursor-not-allowed disabled:opacity-70 sm:col-span-2"
              >
                {loading && <Loader2 size={14} className="animate-spin" />}
                {loading ? "Creating account..." : "Create account"}
              </button>
            </form>
          </>
        )}
      </div>

      <div className="rounded-b-md border-t border-gray-200 bg-gray-50 px-6 py-3 text-center text-[12px] text-gray-600">
        Already have an account?{" "}
        <Link to="/login" className="text-[#673de6] hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  );
}

export default SignUpSection;