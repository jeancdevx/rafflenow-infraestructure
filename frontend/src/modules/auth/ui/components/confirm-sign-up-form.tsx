import { useState, useEffect } from "react";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { confirmSignUpSchema } from "@/modules/auth/schemas";
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
import type { ConfirmSignUpFormData } from "../../types";
import { confirmSignUp, resendSignUpCode } from "aws-amplify/auth";
import { OctagonAlertIcon } from "lucide-react";
import { toast } from "sonner";

export function ConfirmSignUpForm() {
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get("email");
    if (emailParam) {
      setEmail(emailParam);
      form.setValue("email", emailParam);
    }
  }, []);

  const form = useForm<ConfirmSignUpFormData>({
    resolver: zodResolver(confirmSignUpSchema),
    defaultValues: {
      email: "",
      code: "",
    },
  });

  const onSubmit = async (data: ConfirmSignUpFormData) => {
    setLoading(true);
    setError(null);

    try {
      const { isSignUpComplete } = await confirmSignUp({
        username: data.email,
        confirmationCode: data.code,
      });

      if (isSignUpComplete) {
        toast.success("¡Cuenta confirmada exitosamente!", {
          description: "Redirigiendo a inicio de sesión...",
        });
        setTimeout(() => {
          window.location.href = "/sign-in";
        }, 1500);
      }
    } catch (err: any) {
      console.error("Error confirming sign up:", err);
      const errorMsg = err.message || "Error al confirmar el registro";
      setError(errorMsg);
      toast.error("Error al confirmar", {
        description: errorMsg,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!email) {
      const errorMsg = "Por favor ingresa tu correo electrónico";
      setError(errorMsg);
      toast.error("Error", {
        description: errorMsg,
      });
      return;
    }

    setResending(true);
    setError(null);

    try {
      await resendSignUpCode({ username: email });
      setError(null);
      toast.success("Código reenviado", {
        description: "Revisa tu correo electrónico",
      });
    } catch (err: any) {
      console.error("Error resending code:", err);
      const errorMsg = err.message || "Error al reenviar el código";
      setError(errorMsg);
      toast.error("Error al reenviar código", {
        description: errorMsg,
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <Card className="w-full sm:max-w-md">
      <CardHeader>
        <CardTitle>Confirmar Registro</CardTitle>
        <CardDescription>
          Ingresa el código de 6 dígitos enviado a tu correo
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} id="confirm-form">
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
                    disabled={loading || !!email}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="code"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>Código de confirmación</FieldLabel>
                  <InputOTP
                    maxLength={6}
                    value={field.value}
                    onChange={field.onChange}
                    disabled={loading}
                    className="w-full"
                    autoFocus
                  >
                    <InputOTPGroup className="w-full gap-2">
                      <InputOTPSlot index={0} className="flex-1 h-12" />
                      <InputOTPSlot index={1} className="flex-1 h-12" />
                      <InputOTPSlot index={2} className="flex-1 h-12" />
                      <InputOTPSlot index={3} className="flex-1 h-12" />
                      <InputOTPSlot index={4} className="flex-1 h-12" />
                      <InputOTPSlot index={5} className="flex-1 h-12" />
                    </InputOTPGroup>
                  </InputOTP>
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
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col gap-y-4">
        <Button
          type="submit"
          form="confirm-form"
          className="w-full"
          disabled={loading}
        >
          {loading ? "Confirmando..." : "Confirmar Cuenta"}
        </Button>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleResendCode}
          disabled={resending || loading}
        >
          {resending ? "Reenviando..." : "Reenviar código"}
        </Button>

        <div className="text-center text-sm text-muted-foreground">
          <a
            href="/sign-in"
            className="text-primary hover:underline font-medium"
          >
            Volver a inicio de sesión
          </a>
        </div>
      </CardFooter>
    </Card>
  );
}
