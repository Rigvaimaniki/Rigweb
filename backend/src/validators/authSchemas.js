const { z } = require("zod");

const signupSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8),
  name: z.string().trim().min(2).max(60).optional()
});

const loginSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase()),
  password: z.string().min(1)
});

const googleRegisterSchema = z
  .object({
    name: z.string().trim().min(2).max(60).optional(),
    mobileCountry: z.enum(["IN", "INTL"]).default("IN"),
    mobile: z.string().trim().min(4).max(32).optional()
  })
  .superRefine((data, ctx) => {
    if (!data.mobile) return;
    const digits = String(data.mobile || "").replace(/\D/g, "");

  if (data.mobileCountry === "IN") {
    let local = digits;
    if (local.length === 12 && local.startsWith("91")) local = local.slice(2);
    if (local.length === 11 && local.startsWith("0")) local = local.slice(1);

    if (!/^\d{10}$/.test(local)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["mobile"],
        message: "India mobile must be 10 digits"
      });
    }
  } else {
    const normalized = String(data.mobile || "").replace(/\s+/g, "");
    if (!/^\+[1-9]\d{6,14}$/.test(normalized)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["mobile"],
        message: "Mobile must be in E.164 format (e.g. +14155552671)"
      });
    }
  }
  });

module.exports = { signupSchema, loginSchema, googleRegisterSchema };
