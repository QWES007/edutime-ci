import { z } from "zod";

export const teacherSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  subjects: z
    .array(z.string())
    .min(1, "Sélectionnez au moins une matière"),
  max_hours_per_week: z
    .number()
    .min(1)
    .max(30)
    .default(18),
});

export const roomSchema = z.object({
  name: z.string().min(1, "Le nom de la salle est requis"),
  capacity: z.number().min(1).max(200).default(40),
  type: z.enum(["standard", "lab", "sports"]).default("standard"),
});

export const classGroupSchema = z.object({
  level: z.enum([
    "6eme",
    "5eme",
    "4eme",
    "3eme",
    "2nde_a",
    "2nde_c",
    "1ere_a",
    "1ere_c",
    "1ere_d",
    "tle_a",
    "tle_c",
    "tle_d",
  ]),
  name: z.string().min(1, "Le nom de la classe est requis"),
  student_count: z.number().min(0).default(0),
});

export const signupSchema = z.object({
  full_name: z.string().min(2),
  school_name: z.string().min(2),
  email: z.string().email("Adresse e-mail invalide"),
  password: z.string().min(8, "Le mot de passe doit contenir 8 caractères minimum"),
});

export type TeacherFormValues = z.infer<typeof teacherSchema>;
export type RoomFormValues = z.infer<typeof roomSchema>;
export type ClassGroupFormValues = z.infer<typeof classGroupSchema>;
export type SignupFormValues = z.infer<typeof signupSchema>;
