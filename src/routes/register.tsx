import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { register as registerApi, HttpError } from "@/lib/api";
import { requireGuest } from "@/lib/auth/guards";

const registerSchema = z
  .object({
    name: z.string().min(1, "Full name is required"),
    email: z.string().email("Enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    terms: z.literal(true, {
      errorMap: () => ({ message: "You must accept the terms" }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export const Route = createFileRoute("/register")({
  beforeLoad: requireGuest,
  component: RegisterPage,
});

function passwordStrength(pw: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { score, label: "Weak", color: "bg-destructive" };
  if (score <= 3) return { score, label: "Medium", color: "bg-warning" };
  return { score, label: "Strong", color: "bg-success" };
}

function RegisterPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
    setError,
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    mode: "onBlur",
    reValidateMode: "onBlur",
  });

  const passwordValue = watch("password") || "";
  const strength = useMemo(
    () => passwordStrength(passwordValue),
    [passwordValue],
  );

  const registerMutation = useMutation({
    mutationFn: (data: RegisterForm) =>
      registerApi({
        name: data.name,
        email: data.email,
        password: data.password,
      }),
    onSuccess: () => {
      navigate({ to: "/" });
    },
    onError: (err) => {
      const msg =
        err instanceof HttpError
          ? err.data &&
            typeof err.data === "object" &&
            "message" in (err.data as object)
            ? (err.data as { message: string }).message
            : err.message || "Registration failed"
          : "Something went wrong. Try again.";
      setError("root", { message: msg });
    },
  });

  const onSubmit = (data: RegisterForm) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background md:flex-row">
      <div className="flex items-center justify-center bg-surface-tile-1 px-6 py-12 md:w-1/2">
        <div className="text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary text-[26px] font-bold text-primary-foreground">
            M
          </div>
          <h1 className="mt-5 text-hero-display text-body-on-dark">Manbaa</h1>
          <p className="mt-3 text-tagline text-body-on-dark/80">
            AI-powered brand identity generation
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center bg-canvas px-6 py-12 md:w-1/2">
        <div className="w-full max-w-sm">
          <h2 className="text-display-md text-ink">Create your account</h2>
          <p className="mt-2 text-body text-ink-muted-48">
            Start building with AI-powered brand identity
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
            {errors.root && (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-caption text-destructive">
                {errors.root.message}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="name" className="text-caption-strong text-ink">
                Full name
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                {...register("name")}
                className="flex h-11 w-full rounded-pill border border-hairline bg-canvas px-4 text-body text-ink placeholder:text-ink-muted-48 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Jane Doe"
              />
              {errors.name && (
                <p className="text-caption text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-caption-strong text-ink">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                {...register("email")}
                className="flex h-11 w-full rounded-pill border border-hairline bg-canvas px-4 text-body text-ink placeholder:text-ink-muted-48 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="you@example.com"
              />
              {errors.email && (
                <p className="text-caption text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-caption-strong text-ink"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  {...register("password")}
                  className="flex h-11 w-full rounded-pill border border-hairline bg-canvas pl-4 pr-11 text-body text-ink placeholder:text-ink-muted-48 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted-48 transition-colors active:scale-95 hover:text-ink"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {passwordValue && (
                <div className="mt-2 space-y-1">
                  <div className="flex h-1.5 w-full gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`h-full flex-1 rounded-full transition-colors ${
                          i <= strength.score
                            ? strength.color
                            : "bg-divider-soft"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-fine-print text-ink-muted-48">
                    {strength.label}
                  </p>
                </div>
              )}
              {errors.password && (
                <p className="text-caption text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="confirmPassword"
                className="text-caption-strong text-ink"
              >
                Confirm password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  {...register("confirmPassword")}
                  className="flex h-11 w-full rounded-pill border border-hairline bg-canvas pl-4 pr-11 text-body text-ink placeholder:text-ink-muted-48 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted-48 transition-colors active:scale-95 hover:text-ink"
                >
                  {showConfirm ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-caption text-destructive">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                {...register("terms")}
                className="mt-0.5 h-4 w-4 rounded border-hairline text-primary focus:ring-primary"
              />
              <span className="text-caption text-ink-muted-80">
                I agree to the{" "}
                <a
                  href="#"
                  className="text-primary underline transition-colors hover:text-primary-focus"
                >
                  Terms of Service
                </a>{" "}
                and{" "}
                <a
                  href="#"
                  className="text-primary underline transition-colors hover:text-primary-focus"
                >
                  Privacy Policy
                </a>
              </span>
            </label>
            {errors.terms && (
              <p className="text-caption text-destructive">
                {errors.terms.message}
              </p>
            )}

            <button
              type="submit"
              disabled={registerMutation.isPending || !isValid}
              className="flex w-full items-center justify-center rounded-pill bg-primary px-5 py-3 text-body-strong text-primary-foreground transition-all active:scale-95 hover:bg-primary/90 disabled:opacity-50"
            >
              {registerMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating account...
                </span>
              ) : (
                "Create account"
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-body text-ink-muted-48">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-primary transition-colors hover:text-primary-focus"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
