import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/*
 * Data model, taken over 1-on-1 from the working prototype (prototype/next2care-planning.html).
 * Comments are in English; values shown to users stay Dutch.
 */

export const FUNCTIONS = ["Verpleegkundige", "Verzorgende IG", "Helpende", "Begeleider"] as const;
export const ROLES = ["admin", "planner", "zzp"] as const;
export const SHIFT_STATUS = ["open", "toegewezen", "geannuleerd"] as const;
export const SIGNUP_STATUS = ["in_behandeling", "goedgekeurd", "afgewezen", "ingetrokken"] as const;

/* ---------- User (login account) ---------- */
const UserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    role: { type: String, enum: ROLES, required: true },
    // planner → institution, zzp → zzp profile; admin has neither
    institution: { type: Schema.Types.ObjectId, ref: "Institution" },
    zzpProfile: { type: Schema.Types.ObjectId, ref: "ZzpProfile" },
    active: { type: Boolean, default: true },
    lastLoginAt: Date,
  },
  { timestamps: true },
);

/* ---------- Zorginstelling ---------- */
const InstitutionSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    city: { type: String, trim: true, maxlength: 60 },
    departments: { type: [String], default: [] },
    contactEmail: { type: String, lowercase: true, trim: true },
    billing: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

/* ---------- Zzp'er ---------- */
const ZzpProfileSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    functions: { type: [String], enum: FUNCTIONS, default: [] },
    kvkNumber: { type: String, trim: true },
    bigNumber: { type: String, trim: true },
    hourlyRate: { type: Number, min: 0 },
    unavailable: { type: [String], default: [] }, // ISO dates "YYYY-MM-DD"
  },
  { timestamps: true },
);

/* ---------- Dienst ---------- */
const SignupSchema = new Schema(
  {
    zzp: { type: Schema.Types.ObjectId, ref: "ZzpProfile", required: true },
    status: { type: String, enum: SIGNUP_STATUS, default: "in_behandeling" },
    at: { type: Date, default: Date.now },
  },
  { _id: false },
);
const HoursSchema = new Schema(
  {
    start: { type: String, required: true }, // "HH:MM"
    end: { type: String, required: true },
    breakMin: { type: Number, default: 0, min: 0 },
    confirmed: { type: Boolean, default: false },
    confirmedBy: { type: Schema.Types.ObjectId, ref: "User" },
    confirmedAt: Date,
  },
  { _id: false },
);
const ShiftSchema = new Schema(
  {
    institution: { type: Schema.Types.ObjectId, ref: "Institution", required: true, index: true },
    department: { type: String, required: true },
    date: { type: String, required: true, index: true }, // "YYYY-MM-DD"
    start: { type: String, required: true },
    end: { type: String, required: true },
    breakMin: { type: Number, default: 0, min: 0 },
    function: { type: String, enum: FUNCTIONS, required: true },
    notes: { type: String, maxlength: 200 }, // never client data
    status: { type: String, enum: SHIFT_STATUS, default: "open", index: true },
    assigned: { type: Schema.Types.ObjectId, ref: "ZzpProfile", default: null, index: true },
    signups: { type: [SignupSchema], default: [] },
    hours: { type: HoursSchema, default: null },
    cancelReason: String,
  },
  { timestamps: true },
);

/* ---------- Melding ---------- */
const NotificationSchema = new Schema(
  {
    to: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    text: { type: String, required: true },
    shift: { type: Schema.Types.ObjectId, ref: "Shift" },
    readAt: Date,
  },
  { timestamps: true },
);

/* ---------- Logboek (who changed what) ---------- */
const AuditLogSchema = new Schema(
  {
    actor: { type: Schema.Types.ObjectId, ref: "User" },
    action: { type: String, required: true },
    entity: { type: String, required: true },
    entityId: { type: Schema.Types.ObjectId },
    changes: Schema.Types.Mixed,
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

function model<T>(name: string, schema: Schema<T>) {
  return (mongoose.models[name] as Model<T>) || mongoose.model<T>(name, schema);
}

export const User = model("User", UserSchema);
export const Institution = model("Institution", InstitutionSchema);
export const ZzpProfile = model("ZzpProfile", ZzpProfileSchema);
export const Shift = model("Shift", ShiftSchema);
export const Notification = model("Notification", NotificationSchema);
export const AuditLog = model("AuditLog", AuditLogSchema);

export type UserDoc = InferSchemaType<typeof UserSchema>;
export type ShiftDoc = InferSchemaType<typeof ShiftSchema>;
