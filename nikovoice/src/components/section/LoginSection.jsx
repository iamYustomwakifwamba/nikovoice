import { useState } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";

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

const inputClass = (hasError) =>
  `h-9 w-full rounded-md border bg-white px-2.5 text-[13px] text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-[#673de6] ${
    hasError ? "border-red-500" : "border-gray-300"
  }`;

function LoginSection({ onLogin, onGoogle }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (loading) return;

    const next = {};
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      next.email = "Enter a valid email address";
    }
    if (!password) next.password = "Enter your password";
    setErrors(next);
    setFormError("");
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      await onLogin({ email: email.trim(), password });
    } catch (err) {
      setFormError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[320px] overflow-hidden rounded-md border border-gray-200 bg-white antialiased">
      <div className="px-6 pb-6 pt-7">
        {/* Brand: kijivu kabisa */}
        <p className="select-none text-center text-[22px] font-bold lowercase leading-none tracking-tight text-gray-500">
          nikovoice
        </p>

        <h1 className="mt-5 text-center text-[14px] font-semibold text-gray-950">
          Sign in to nikovoice
        </h1>
        <p className="mt-0.5 text-center text-[12px] text-gray-500">
          Welcome back! Please sign in to continue
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

        {/* Divider */}
        <div className="my-4 flex items-center gap-3">
          <span className="h-px flex-1 bg-gray-200" />
          <span className="text-[12px] text-gray-500">or</span>
          <span className="h-px flex-1 bg-gray-200" />
        </div>

        {/* Form */}
        <form onSubmit={submit} noValidate>
          <label
            htmlFor="login-email"
            className="mb-1 block text-[12px] font-medium text-gray-900"
          >
            Email address
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            aria-invalid={Boolean(errors.email)}
            className={inputClass(errors.email)}
          />
          {errors.email && (
            <p className="mt-1 text-[11px] text-red-600">{errors.email}</p>
          )}

          <div className="mb-1 mt-3 flex items-center justify-between">
            <label
              htmlFor="login-password"
              className="text-[12px] font-medium text-gray-900"
            >
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-[11px] text-[#673de6] hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              aria-invalid={Boolean(errors.password)}
              className={`${inputClass(errors.password)} pr-9`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-1 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded text-gray-500 hover:text-gray-900"
            >
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-[11px] text-red-600">{errors.password}</p>
          )}

          {formError && (
            <p
              role="alert"
              className="mt-3 rounded-md bg-red-50 px-2.5 py-1.5 text-[12px] text-red-700"
            >
              {formError}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-5 flex h-9 w-full items-center justify-center gap-2 rounded-md bg-[#673de6] text-[13px] font-semibold text-white transition-colors hover:bg-[#5b32d4] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {loading ? "Signing in..." : "Continue"}
          </button>
        </form>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 bg-gray-50 px-6 py-3 text-center text-[12px] text-gray-600">
        Don&rsquo;t have an account?{" "}
        <Link to="/signup" className="text-[#673de6] hover:underline">
          Sign up
        </Link>
      </div>
    </div>
  );
}

export default LoginSection;