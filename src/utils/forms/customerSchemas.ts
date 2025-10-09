import * as Yup from 'yup';

export const customerCreateSchema = Yup.object({
  firstName: Yup.string()
    .required('First name is required')
    .max(100, 'First name must be shorter than or equal to 100 characters'),
  lastName: Yup.string()
    .required('Last name is required')
    .max(100, 'Last name must be shorter than or equal to 100 characters'),
  email: Yup.string()
    .email('Please enter a valid email')
    .required('Email is required'),
  phoneNumber: Yup.string()
    .required('Phone number is required'),
  alternatePhone: Yup.string(),
  address: Yup.string(),
  city: Yup.string()
    .required('City is required'),
  country: Yup.string()
    .required('Country is required'),
  idType: Yup.mixed()
    .oneOf(['NATIONAL_ID', 'PASSPORT', 'DRIVERS_LICENSE', 'VOTER_ID'], 'Invalid ID type')
    .required('ID type is required'),
  idNumber: Yup.string()
    .required('ID number is required'),
  preferredChannel: Yup.mixed()
    .oneOf(['SMS', 'EMAIL', 'WHATSAPP'], 'Invalid preferred channel')
    .optional(),
});

export const customerUpdateSchema = Yup.object({
  firstName: Yup.string()
    .max(100, 'First name must be shorter than or equal to 100 characters'),
  lastName: Yup.string()
    .max(100, 'Last name must be shorter than or equal to 100 characters'),
  email: Yup.string()
    .email('Please enter a valid email'),
  phoneNumber: Yup.string(),
  alternatePhone: Yup.string(),
  address: Yup.string(),
  city: Yup.string(),
  country: Yup.string(),
  idType: Yup.mixed()
    .oneOf(['NATIONAL_ID', 'PASSPORT', 'DRIVERS_LICENSE', 'VOTER_ID'], 'Invalid ID type'),
  idNumber: Yup.string(),
  preferredChannel: Yup.mixed()
    .oneOf(['SMS', 'EMAIL', 'WHATSAPP'], 'Invalid preferred channel')
    .optional(),
});
