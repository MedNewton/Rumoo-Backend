import { z } from "zod/v4";

export const RequestOtpSchema = z.object({
  email: z.email(),
});

export const VerifyOtpSchema = z.object({
  email: z.email(),
  otp: z.string().length(6).regex(/^\d+$/),
});

export type RequestOtpInput = z.infer<typeof RequestOtpSchema>;
export type VerifyOtpInput = z.infer<typeof VerifyOtpSchema>;

export interface OtpDocument {
  email: string;
  otp: string;
  expiresAt: FirebaseFirestore.Timestamp;
  attempts: number;
  createdAt: FirebaseFirestore.Timestamp;
}
