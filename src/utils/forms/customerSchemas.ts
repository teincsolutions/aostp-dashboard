import * as Yup from "yup";

export const customerCreateSchema = Yup.object({
  firstName: Yup.string()
    .required("First name is required")
    .max(100, "First name must be shorter than or equal to 100 characters"),
  lastName: Yup.string()
    .max(100, "Last name must be shorter than or equal to 100 characters")
    .notRequired(),
  phoneNumber: Yup.string().required("Phone number is required"),
  address: Yup.string().notRequired(),
  email: Yup.string().email("Please enter a valid email"),
  alternatePhone: Yup.string(),
  warehouseId: Yup.string().uuid("Invalid warehouse ID").notRequired(),
  cityId: Yup.string().uuid("Invalid city ID").notRequired(),
  idNumber: Yup.string().notRequired(),
  preferredChannel: Yup.mixed()
    .oneOf(["SMS", "EMAIL", "WHATSAPP"], "Invalid preferred channel")
    .optional(),
});

export const customerUpdateSchema = Yup.object({
  firstName: Yup.string().max(
    100,
    "First name must be shorter than or equal to 100 characters"
  ),
  lastName: Yup.string().max(
    100,
    "Last name must be shorter than or equal to 100 characters"
  ),
  email: Yup.string().email("Please enter a valid email").notRequired(),
  phoneNumber: Yup.string(),
  alternatePhone: Yup.string().notRequired(),
  address: Yup.string().notRequired(),
  warehouseId: Yup.string().uuid("Invalid warehouse ID").notRequired(),
  cityId: Yup.string().uuid("Invalid city ID").notRequired(),
  idNumber: Yup.string().notRequired(),
  preferredChannel: Yup.mixed()
    .oneOf(["SMS", "EMAIL", "WHATSAPP"], "Invalid preferred channel")
    .optional(),
});
