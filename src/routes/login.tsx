import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { login, HttpError } from "@/lib/api";
import { requireGuest } from "@/lib/auth/guards";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

export const Route = createFileRoute("/login")({
  beforeLoad: requireGuest,
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setError,
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
    reValidateMode: "onBlur",
  });

  const loginMutation = useMutation({
    mutationFn: (data: LoginForm) => login(data),
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
            : err.message || "Invalid email or password"
          : "Something went wrong. Try again.";
      setError("root", { message: msg });
    },
  });

  const onSubmit = (data: LoginForm) => {
    loginMutation.mutate(data);
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
          <h2 className="text-display-md text-ink">Sign in</h2>
          <p className="mt-2 text-body text-ink-muted-48">
            Welcome back to Manbaa
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
            {errors.root && (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-caption text-destructive">
                {errors.root.message}
              </div>
            )}

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
                  autoComplete="current-password"
                  {...register("password")}
                  className="flex h-11 w-full rounded-pill border border-hairline bg-canvas px-4 text-body text-ink placeholder:text-ink-muted-48 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
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
              {errors.password && (
                <p className="text-caption text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending || !isValid}
              className="flex w-full items-center justify-center rounded-pill bg-primary px-5 py-3 text-body-strong text-primary-foreground transition-all active:scale-95 hover:bg-primary/90 disabled:opacity-50"
            >
              {loginMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </span>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-body text-ink-muted-48">
            Don&apos;t have an account?{" "}
            <Link
              to="/register"
              className="text-primary transition-colors hover:text-primary-focus"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
