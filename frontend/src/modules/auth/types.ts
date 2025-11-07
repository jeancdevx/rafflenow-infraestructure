import type { z } from "astro/zod";
import type { signInSchema, signUpSchema, confirmSignUpSchema } from "./schemas";

export type SignInFormData = z.infer<typeof signInSchema>
export type SignUpFormData = z.infer<typeof signUpSchema>
export type ConfirmSignUpFormData = z.infer<typeof confirmSignUpSchema>
 