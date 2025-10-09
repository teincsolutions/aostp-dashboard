"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  Input,
  Select,
  Switch,
  Form,
  message,
  notification,
} from "antd";
import { AppLayout } from "@/components/AppLayout";
import { AuthGuard } from "@/components/AuthGuard";
import { useCreateUser } from "@/hooks/useUsers";
import { useWarehouses } from "@/hooks/useWarehouse";
import { Role } from "@/types/user";
import { userCreateSchema } from "@/utils/forms/userSchemas";
import { getServerValidationErrors } from "@/utils/forms/errorUtils";
import { Formik } from "formik";

const roleOptions = [
  { label: "Super Admin", value: Role.SUPER_ADMIN },
  { label: "Finance Manager", value: Role.FINANCE_MANAGER },
  { label: "Operations Clerk", value: Role.OPERATIONS_CLERK },
  { label: "Payment Clerk", value: Role.PAYMENT_CLERK },
];

export default function CreateUserPage() {
  const router = useRouter();
  const createUserMutation = useCreateUser();
  const { data: warehouses, isLoading: warehousesLoading } = useWarehouses();

  const handleSubmit = async (values: any, { setSubmitting, setErrors }: any) => {
    try {
      await createUserMutation.mutateAsync(values);
      notification.success({ message: "User created successfully" });
      router.push("/users");
    } catch (error: unknown) {
      const serverErrors = getServerValidationErrors(error);
      if (serverErrors) {
        setErrors(serverErrors);
      } else {
        notification.error({
          message: (error as Error)?.message || "Create failed",
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthGuard requiredRoles={[Role.SUPER_ADMIN]}>
      <AppLayout>
        <div className="p-6 max-w-2xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Create New User</h1>
            <p className="text-gray-600">Add a new user to the system</p>
          </div>

          <Card>
            <Formik
              initialValues={{
                fullName: "",
                username: "",
                email: "",
                phone: "",
                password: "",
                role: Role.OPERATIONS_CLERK,
                warehouseId: "",
                isActive: true,
                force2FA: false,
              }}
              validationSchema={userCreateSchema}
              onSubmit={handleSubmit}
            >
              {({
                values,
                errors,
                touched,
                isSubmitting,
                handleChange,
                setFieldValue,
                submitForm,
              }) => (
                <Form layout="vertical" onFinish={submitForm}>
                  <Form.Item
                    label="Full Name"
                    required
                    validateStatus={errors.fullName && touched.fullName ? "error" : ""}
                    help={errors.fullName && touched.fullName ? errors.fullName : ""}
                  >
                    <Input
                      name="fullName"
                      value={values.fullName}
                      onChange={handleChange}
                      placeholder="Enter full name"
                    />
                  </Form.Item>

                  <Form.Item
                    label="Username"
                    required
                    validateStatus={errors.username && touched.username ? "error" : ""}
                    help={errors.username && touched.username ? errors.username : ""}
                  >
                    <Input
                      name="username"
                      value={values.username}
                      onChange={handleChange}
                      placeholder="Enter username"
                    />
                  </Form.Item>

                  <Form.Item
                    label="Email"
                    required
                    validateStatus={errors.email && touched.email ? "error" : ""}
                    help={errors.email && touched.email ? errors.email : ""}
                  >
                    <Input
                      name="email"
                      value={values.email}
                      onChange={handleChange}
                      placeholder="Enter email address"
                      type="email"
                    />
                  </Form.Item>

                  <Form.Item
                    label="Phone"
                    validateStatus={errors.phone && touched.phone ? "error" : ""}
                    help={errors.phone && touched.phone ? errors.phone : ""}
                  >
                    <Input
                      name="phone"
                      value={values.phone}
                      onChange={handleChange}
                      placeholder="Enter phone number"
                    />
                  </Form.Item>

                  <Form.Item
                    label="Password"
                    validateStatus={errors.password && touched.password ? "error" : ""}
                    help={errors.password && touched.password ? errors.password : ""}
                  >
                    <Input.Password
                      name="password"
                      value={values.password}
                      onChange={handleChange}
                      placeholder="Enter password (optional for API)"
                    />
                  </Form.Item>

                  <Form.Item
                    label="Role"
                    required
                    validateStatus={errors.role && touched.role ? "error" : ""}
                    help={errors.role && touched.role ? errors.role : ""}
                  >
                    <Select
                      value={values.role}
                      onChange={(value) => setFieldValue("role", value)}
                      placeholder="Select role"
                    >
                      {roleOptions.map((option) => (
                        <Select.Option key={option.value} value={option.value}>
                          {option.label}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>

                  <Form.Item
                    label="Warehouse"
                    validateStatus={errors.warehouseId && touched.warehouseId ? "error" : ""}
                    help={errors.warehouseId && touched.warehouseId ? errors.warehouseId : ""}
                  >
                    <Select
                      loading={warehousesLoading}
                      value={values.warehouseId || undefined}
                      onChange={(value) => setFieldValue("warehouseId", value)}
                      placeholder="Select warehouse"
                      showSearch
                      filterOption={(input, option) =>
                        (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                      }
                    >
                      {warehouses?.data?.map((warehouse) => (
                        <Select.Option key={warehouse.id} value={warehouse.id}>
                          {warehouse.warehouseId} - {warehouse.name}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>

                  <Form.Item label="Active">
                    <Switch
                      checked={values.isActive}
                      onChange={(checked) => setFieldValue("isActive", checked)}
                    />
                  </Form.Item>

                  <Form.Item label="Force 2FA">
                    <Switch
                      checked={values.force2FA}
                      onChange={(checked) => setFieldValue("force2FA", checked)}
                    />
                  </Form.Item>

                  <Form.Item>
                    <div className="flex justify-end gap-2">
                      <Button onClick={() => router.push("/users")}>
                        Cancel
                      </Button>
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={isSubmitting}
                      >
                        Create User
                      </Button>
                    </div>
                  </Form.Item>
                </Form>
              )}
            </Formik>
          </Card>
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
