export const OTP_EXPIRY_MINUTES = parseInt(
  process.env.OTP_EXPIRY_MINUTES ?? "10",
  10
);
export const OTP_LENGTH = parseInt(process.env.OTP_LENGTH ?? "6", 10);
export const OTP_MAX_ATTEMPTS = 5;
export const RATE_LIMIT_WINDOW_MINUTES = 15;
export const RATE_LIMIT_MAX_REQUESTS = 3;
export const OTP_COLLECTION = "otp_requests";
