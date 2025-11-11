import { useState } from "react";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signInSchema } from "@/modules/auth/schemas";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { SignInFormData } from "../../types";
import { signIn } from "aws-amplify/auth";
import { toast } from "sonner";
import { OctagonAlertIcon, EyeIcon, EyeOffIcon } from "lucide-react";

export function SignInForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: SignInFormData) => {
    setLoading(true);
    setError(null);

    try {
      const { isSignedIn } = await signIn({
        username: data.email,
        password: data.password,
      });

      if (isSignedIn) {
        toast.success("¡Bienvenido!", {
          description: "Inicio de sesión exitoso",
        });

        // Obtener redirect de URL params
        const urlParams = new URLSearchParams(window.location.search);
        const redirect = urlParams.get("redirect") || "/sorteos";

        setTimeout(() => {
          window.location.href = redirect;
        }, 500);
      }
    } catch (err: any) {
      console.error("Error signing in:", err);
      const errorMsg = err.message || "Error al iniciar sesión";
      setError(errorMsg);
      toast.error("Error al iniciar sesión", {
        description: errorMsg,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full sm:max-w-md">
      <CardHeader>
        <CardTitle>Iniciar Sesión</CardTitle>
        <CardDescription>
          Ingresa tu correo y contraseña para acceder
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} id="sign-in-form">
          <FieldGroup>
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>Correo electrónico</FieldLabel>
                  <Input
                    type="email"
                    placeholder="tu@email.com"
                    {...field}
                    autoComplete="email"
                    disabled={loading}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>Contraseña</FieldLabel>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      {...field}
                      autoComplete="current-password"
                      disabled={loading}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      disabled={loading}
                    >
                      {showPassword ? (
                        <EyeOffIcon className="h-4 w-4" />
                      ) : (
                        <EyeIcon className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            {error && (
              <Alert
                variant="destructive"
                className="bg-destructive/10 flex items-center gap-x-4 border-none text-sm"
              >
                <div className="flex">
                  <OctagonAlertIcon className="size-4" />
                </div>
                <AlertDescription className="font-medium">
                  {error}
                </AlertDescription>
              </Alert>
            )}
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col gap-y-4">
        <Button
          type="submit"
          form="sign-in-form"
          className="w-full"
          disabled={loading}
        >
          {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
        </Button>

        <div className="text-center text-sm text-muted-foreground">
          ¿No tienes cuenta?{" "}
          <a
            href="/sign-up"
            className="text-primary hover:underline font-medium"
          >
            Regístrate aquí
          </a>
        </div>
      </CardFooter>
    </Card>
  );
}
