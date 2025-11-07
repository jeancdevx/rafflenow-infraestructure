import { z } from "astro/zod"
import { passwordRegex } from "./constants"

export const signInSchema = z.object({
  email: z.string().email({ message: "Correo electrónico inválido" }),
  password: z.string()
    .min(8, { message: "La contraseña debe tener al menos 8 caracteres" })
    .regex(passwordRegex, { message: "La contraseña debe incluir mayúsculas, minúsculas, números y caracteres especiales" })
})

export const signUpSchema = z.object({
  firstName: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres" }),
  lastName: z.string().min(2, { message: "El apellido debe tener al menos 2 caracteres" }),
  email: z.string().email({ message: "Correo electrónico inválido" }),
  password: z.string()
    .min(8, { message: "La contraseña debe tener al menos 8 caracteres" })
    .regex(passwordRegex, { message: "La contraseña debe incluir mayúsculas, minúsculas, números y caracteres especiales" }),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
})

export const confirmSignUpSchema = z.object({
  email: z.string().email({ message: "Correo electrónico inválido" }),
  code: z.string().length(6, { message: "El código debe tener 6 dígitos" })
})
