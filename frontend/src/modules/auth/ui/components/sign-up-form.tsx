import { useState } from "react";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signUpSchema } from "@/modules/auth/schemas";
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
import type { SignUpFormData } from "../../types";
import { signUp } from "aws-amplify/auth";
import { toast } from "sonner";
import { OctagonAlertIcon, EyeIcon, EyeOffIcon } from "lucide-react";

export function SignUpForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: SignUpFormData) => {
    setLoading(true);
    setError(null);

    try {
      const { isSignUpComplete, nextStep } = await signUp({
        username: data.email,
        password: data.password,
        options: {
          userAttributes: {
            email: data.email,
            given_name: data.firstName,
            family_name: data.lastName,
          },
        },
      });

      if (nextStep.signUpStep === "CONFIRM_SIGN_UP") {
        toast.success("¡Registro exitoso!", {
          description: "Revisa tu correo para confirmar tu cuenta",
        });
        setTimeout(() => {
          window.location.href = `/confirmar-registro?email=${encodeURIComponent(
            data.email
          )}`;
        }, 1500);
      }
    } catch (err: any) {
      console.error("Error signing up:", err);
      const errorMsg = err.message || "Error al registrarse";
      setError(errorMsg);
      toast.error("Error al registrarse", {
        description: errorMsg,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full sm:max-w-md">
      <CardHeader>
        <CardTitle>Crear Cuenta</CardTitle>
        <CardDescription>
          Regístrate para participar en sorteos increíbles
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} id="sign-up-form">
          <FieldGroup>
            <div className="grid grid-cols-2 gap-4">
              <Controller
                name="firstName"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel>Nombre</FieldLabel>
                    <Input
                      type="text"
                      placeholder="Juan"
                      {...field}
                      autoComplete="given-name"
                      disabled={loading}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="lastName"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel>Apellido</FieldLabel>
                    <Input
                      type="text"
                      placeholder="Pérez"
                      {...field}
                      autoComplete="family-name"
                      disabled={loading}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>

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
                      autoComplete="new-password"
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
                  <FieldDescription>
                    Debe tener al menos 8 caracteres, incluyendo mayúsculas,
                    minúsculas, números y caracteres especiales.
                  </FieldDescription>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="confirmPassword"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>Confirmar Contraseña</FieldLabel>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      {...field}
                      autoComplete="new-password"
                      disabled={loading}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      disabled={loading}
                    >
                      {showConfirmPassword ? (
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
          form="sign-up-form"
          className="w-full"
          disabled={loading}
        >
          {loading ? "Registrando..." : "Crear Cuenta"}
        </Button>

        <div className="text-center text-sm text-muted-foreground">
          ¿Ya tienes cuenta?{" "}
          <a
            href="/sign-in"
            className="text-primary hover:underline font-medium"
          >
            Inicia sesión aquí
          </a>
        </div>
      </CardFooter>
    </Card>
  );
}
