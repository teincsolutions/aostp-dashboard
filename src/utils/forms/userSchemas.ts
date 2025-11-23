import * as Yup from "yup";
import { Role } from "@/types/user";

// Schema for creating a new user
export const userCreateSchema = Yup.object().shape({
  firstName: Yup.string()
    .required("First name is required")
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must be no more than 50 characters"),
  lastName: Yup.string()
    .required("Last name is required")
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name must be no more than 50 characters"),
  username: Yup.string()
    .required("Username is required")
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must be no more than 50 characters"),
  email: Yup.string()
    .email("Invalid email format")
    .required("Email is required"),
  password: Yup.string()
    .optional()
    .min(6, "Password must be at least 6 characters")
    .max(128, "Password must be no more than 128 characters"),
  role: Yup.mixed<Role>()
    .oneOf(Object.values(Role), "Invalid role selected")
    .required("Role is required"),
  warehouseId: Yup.string().optional(),
  isActive: Yup.boolean().required(),
});

// Schema for updating an existing user (all fields optional)
export const userUpdateSchema = Yup.object().shape({
  firstName: Yup.string()
    .optional()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must be no more than 50 characters"),
  lastName: Yup.string()
    .optional()
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name must be no more than 50 characters"),
  email: Yup.string().optional().email("Invalid email format"),
  role: Yup.mixed<Role>()
    .optional()
    .oneOf(Object.values(Role), "Invalid role selected"),
  warehouseId: Yup.string().optional(),
});

// Schema for user password reset (if needed later)
export const userPasswordResetSchema = Yup.object().shape({
  newPassword: Yup.string()
    .required("New password is required")
    .min(6, "Password must be at least 6 characters")
    .max(128, "Password must be no more than 128 characters"),
  confirmPassword: Yup.string()
    .required("Password confirmation is required")
    .oneOf([Yup.ref("newPassword")], "Passwords must match"),
});
