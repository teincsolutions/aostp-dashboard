"use client";

import React, { useState } from "react";
import {
  Button,
  Card,
  Input,
  Select,
  Table,
  Modal,
  notification,
  Empty,
  Row,
  Col,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { Formik, Form, Field } from "formik";
import { AppLayout } from "@/components/AppLayout";
import { AuthGuard } from "@/components/AuthGuard";
import { useUsers, useCreateUser, useResetUserPassword } from "@/hooks/useUsers";
import { getUserColumns } from "./columns";
import { Role, UserStatus, UserCreatePayload, User } from "@/types/user";
import { userCreateSchema, userUpdateSchema } from "@/utils/forms/userSchemas";
import { getServerValidationErrors } from "@/utils/forms/errorUtils";
import type { TablePaginationConfig } from "antd/es/table";
import type { FilterValue } from "antd/es/table/interface";

const roleOptions = [
  { label: "Super Admin", value: Role.SUPER_ADMIN },
  { label: "Finance Manager", value: Role.FINANCE_MANAGER },
  { label: "Operations Clerk", value: Role.OPERATIONS_CLERK },
  { label: "Payment Clerk", value: Role.PAYMENT_CLERK },
  { label: "Customer", value: Role.CUSTOMER },
];

const statusOptions = [
  { label: "Active", value: UserStatus.ACTIVE },
  { label: "Inactive", value: UserStatus.INACTIVE },
];



export default function UsersPage() {
  const [search, setSearch] = useState<string>("");
  const [role, setRole] = useState<Role | undefined>();
  const [status, setStatus] = useState<UserStatus | undefined>();
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [createModal, setCreateModal] = useState<boolean>(false);
  const [editModal, setEditModal] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const { data, isLoading, refetch } = useUsers({
    page,
    limit,
    search,
    role,
    isActive:
      status === UserStatus.ACTIVE
        ? true
        : status === UserStatus.INACTIVE
        ? false
        : undefined,
  });

  const createUser = useCreateUser();
  const resetPasswordMutation = useResetUserPassword();

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditModal(true);
  };

  const handleToggleUserStatus = async (id: string, isActive: boolean) => {
    // TODO: implement toggle API
    console.log('Toggle user status', id, isActive);
    notification.success({ message: "User status updated" });
    refetch();
  };

  const handleResetUserPassword = (user: User) => {
    Modal.confirm({
      title: "Reset Password",
      content: `Are you sure you want to reset the password for ${user.firstName} ${user.lastName}? This will send a password reset email to the user.`,
      onOk: async () => {
        try {
          await resetPasswordMutation.mutateAsync({ id: user.id });
          notification.success({ message: "Password reset email sent successfully" });
        } catch (error) {
          notification.error({ message: "Failed to send password reset email" });
        }
      },
    });
  };

  const handleTableChange = (
    pagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>
  ) => {
    setPage(pagination.current ?? 1);
    setLimit(pagination.pageSize ?? 10);
    if (filters.role && Array.isArray(filters.role) && filters.role.length)
      setRole(filters.role[0] as Role);
    if (
      filters.status &&
      Array.isArray(filters.status) &&
      filters.status.length
    )
      setStatus(filters.status[0] as UserStatus);
  };

  const actions = {
    onEdit: handleEditUser,
    onToggleStatus: handleToggleUserStatus,
    onResetPassword: handleResetUserPassword,
  };

  return (
    <AuthGuard requiredRoles={[Role.SUPER_ADMIN]}>
      <AppLayout>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">User Management</h1>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateModal(true)}
            >
              Add User
            </Button>
          </div>
          <Card className="mb-6">
            <Row gutter={16}>
              <Col>
                <Input.Search
                  placeholder="Search name/email"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onSearch={(v) => setSearch(v)}
                  allowClear
                  style={{ width: 220 }}
                />
              </Col>
              <Col>
                <Select
                  placeholder="Role"
                  value={role}
                  onChange={(v) => setRole(v)}
                  allowClear
                  style={{ width: 160 }}
                >
                  {roleOptions.map((opt) => (
                    <Select.Option key={opt.value} value={opt.value}>
                      {opt.label}
                    </Select.Option>
                  ))}
                </Select>
              </Col>
              <Col>
                <Select
                  placeholder="Status"
                  value={status}
                  onChange={(v) => setStatus(v)}
                  allowClear
                  style={{ width: 140 }}
                >
                  {statusOptions.map((opt) => (
                    <Select.Option key={opt.value} value={opt.value}>
                      {opt.label}
                    </Select.Option>
                  ))}
                </Select>
              </Col>
            </Row>
          </Card>
          <Card>
            <Table
              columns={getUserColumns(actions)}
              dataSource={data?.data ?? []}
              loading={isLoading}
              rowKey="id"
              pagination={{
                current: page,
                pageSize: limit,
                total: data?.total || 0,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} users`,
              }}
              locale={{ emptyText: <Empty /> }}
              scroll={{ x: true }}
              size="middle"
              onChange={handleTableChange}
            />
          </Card>
          <Modal
            title="Create User"
            open={createModal}
            onCancel={() => setCreateModal(false)}
            footer={null}
            destroyOnHidden
          >
            <Formik<UserCreatePayload>
              initialValues={{
                email: "",
                name: "",
                password: "",
                role: Role.CUSTOMER,
              }}
              validationSchema={userCreateSchema}
              onSubmit={async (
                values: UserCreatePayload,
                { setSubmitting, resetForm, setErrors }
              ) => {
                try {
                  await createUser.mutateAsync(values);
                  notification.success({ message: "User created" });
                  setCreateModal(false);
                  resetForm();
                  refetch();
                } catch (err: unknown) {
                  const serverErrors = getServerValidationErrors(err);
                  if (serverErrors) {
                    setErrors(serverErrors);
                  } else {
                    notification.error({
                      message: (err as Error)?.message || "Create failed",
                    });
                  }
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              {({ errors, touched, isSubmitting, handleChange, values }) => (
                <Form>
                  <div className="mb-4">
                    <label>Email</label>
                    <Field name="email" as={Input} />
                    {errors.email && touched.email && (
                      <div className="text-red-500 text-xs">{errors.email}</div>
                    )}
                  </div>
                  <div className="mb-4">
                    <label>Name</label>
                    <Field name="name" as={Input} />
                    {errors.name && touched.name && (
                      <div className="text-red-500 text-xs">{errors.name}</div>
                    )}
                  </div>
                  <div className="mb-4">
                    <label>Password</label>
                    <Field name="password" as={Input.Password} />
                    {errors.password && touched.password && (
                      <div className="text-red-500 text-xs">
                        {errors.password}
                      </div>
                    )}
                  </div>
                  <div className="mb-4">
                    <label>Role</label>
                    <Select
                      value={values.role}
                      onChange={(v) =>
                        handleChange({ target: { name: "role", value: v } })
                      }
                      style={{ width: "100%" }}
                    >
                      {roleOptions.map((opt) => (
                        <Select.Option key={opt.value} value={opt.value}>
                          {opt.label}
                        </Select.Option>
                      ))}
                    </Select>
                    {errors.role && touched.role && (
                      <div className="text-red-500 text-xs">{errors.role}</div>
                    )}
                  </div>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={isSubmitting}
                    block
                  >
                    Create
                  </Button>
                </Form>
              )}
            </Formik>
          </Modal>
          <Modal
            title="Edit User"
            open={editModal}
            onCancel={() => {
              setEditModal(false);
              setEditingUser(null);
            }}
            footer={null}
            destroyOnHidden
          >
            <Formik
              initialValues={{
                firstName: editingUser?.firstName || "",
                lastName: editingUser?.lastName || "",
                email: editingUser?.email || "",
                role: editingUser?.role || Role.CUSTOMER,
              }}
              validationSchema={userUpdateSchema}
              onSubmit={async (
                values,
                { setSubmitting, setErrors }
              ) => {
                try {
                  // TODO: implement update API
                  console.log('Update user', editingUser?.id, values);
                  notification.success({ message: "User updated" });
                  setEditModal(false);
                  setEditingUser(null);
                  refetch();
                } catch (err: unknown) {
                  const serverErrors = getServerValidationErrors(err);
                  if (serverErrors) {
                    setErrors(serverErrors);
                  } else {
                    notification.error({
                      message: (err as Error)?.message || "Update failed",
                    });
                  }
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              {({ errors, touched, isSubmitting, handleChange, values }) => (
                <Form>
                  <div className="mb-4">
                    <label>First Name</label>
                    <Field name="firstName" as={Input} />
                    {errors.firstName && touched.firstName && (
                      <div className="text-red-500 text-xs">{errors.firstName}</div>
                    )}
                  </div>
                  <div className="mb-4">
                    <label>Last Name</label>
                    <Field name="lastName" as={Input} />
                    {errors.lastName && touched.lastName && (
                      <div className="text-red-500 text-xs">{errors.lastName}</div>
                    )}
                  </div>
                  <div className="mb-4">
                    <label>Email</label>
                    <Field name="email" as={Input} />
                    {errors.email && touched.email && (
                      <div className="text-red-500 text-xs">{errors.email}</div>
                    )}
                  </div>
                  <div className="mb-4">
                    <label>Role</label>
                    <Select
                      value={values.role}
                      onChange={(v) =>
                        handleChange({ target: { name: "role", value: v } })
                      }
                      style={{ width: "100%" }}
                    >
                      {roleOptions.map((opt) => (
                        <Select.Option key={opt.value} value={opt.value}>
                          {opt.label}
                        </Select.Option>
                      ))}
                    </Select>
                    {errors.role && touched.role && (
                      <div className="text-red-500 text-xs">{errors.role}</div>
                    )}
                  </div>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={isSubmitting}
                    block
                  >
                    Update
                  </Button>
                </Form>
              )}
            </Formik>
          </Modal>
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
