"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
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
  Descriptions,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { Formik, Form, Field } from "formik";
import { AppLayout } from "@/components/AppLayout";
import { AuthGuard } from "@/components/AuthGuard";
import {
  useUsers,
  useResetUserPassword,
  useUpdateUser,
  useToggleUserStatus,
} from "@/hooks/useUsers";
import { useWarehouses } from "@/hooks/useWarehouse";
import { getUserColumns } from "./columns";
import { Role, UserStatus, User } from "@/types/user";
import { userUpdateSchema } from "@/utils/forms/userSchemas";
import { getServerValidationErrors } from "@/utils/forms/errorUtils";
import type { TablePaginationConfig } from "antd/es/table";
import type { FilterValue } from "antd/es/table/interface";
import { toast } from "sonner";

const roleOptions = [
  { label: "Super Admin", value: Role.SUPER_ADMIN },
  { label: "Finance Manager", value: Role.FINANCE_MANAGER },
  { label: "Operations Clerk", value: Role.OPERATIONS_CLERK },
  { label: "Payment Clerk", value: Role.PAYMENT_CLERK },
];

const statusOptions = [
  { label: "Active", value: UserStatus.ACTIVE },
  { label: "Inactive", value: UserStatus.INACTIVE },
];

export default function UsersPage() {
  const router = useRouter();
  const [search, setSearch] = useState<string>("");
  const [role, setRole] = useState<Role | undefined>();
  const [status, setStatus] = useState<UserStatus | undefined>();
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [editModal, setEditModal] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [viewModal, setViewModal] = useState<boolean>(false);
  const [viewingUser, setViewingUser] = useState<User | null>(null);

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

  const { data: warehousesData } = useWarehouses();

  const resetPasswordMutation = useResetUserPassword();
  const updateUserMutation = useUpdateUser();
  const toggleUserStatusMutation = useToggleUserStatus();

  const handleViewUser = (user: User) => {
    setViewingUser(user);
    setViewModal(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditModal(true);
  };

  const handleToggleUserStatus = async (id: string, isActive: boolean) => {
    try {
      await toggleUserStatusMutation.mutateAsync({ id, isActive });
      toast.success(
        `User ${isActive ? "activated" : "deactivated"} successfully`
      );
      refetch();
    } catch (error: any) {
      console.error("Toggle status error:", error);
      toast.error(
        error?.response?.data?.message || "Failed to update user status"
      );
    }
  };

  const handleResetUserPassword = (user: User) => {
    Modal.confirm({
      title: "Reset Password",
      content: `Are you sure you want to reset the password for ${user.firstName} ${user.lastName}? This will send a password reset email to the user.`,
      onOk: async () => {
        try {
          await resetPasswordMutation.mutateAsync({ id: user.id });
          toast.success("Password reset email sent successfully");
        } catch (error) {
          toast.error("Failed to send password reset email");
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
    onView: handleViewUser,
    onEdit: handleEditUser,
    onToggleStatus: handleToggleUserStatus,
    onResetPassword: handleResetUserPassword,
  };

  // Get all warehouses for the edit form
  const availableWarehouses = warehousesData?.data || [];

  const columns = getUserColumns(actions);

  return (
    <AuthGuard requiredRoles={[Role.SUPER_ADMIN]}>
      <AppLayout>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">User Management</h1>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => router.push("/users/create")}
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
                role: editingUser?.role || Role.OPERATIONS_CLERK,
                warehouseId: editingUser?.warehouse?.id || undefined,
              }}
              validationSchema={userUpdateSchema}
              onSubmit={async (values, { setSubmitting, setErrors }) => {
                try {
                  await updateUserMutation.mutateAsync({
                    id: editingUser!.id,
                    payload: {
                      firstName: values.firstName,
                      lastName: values.lastName,
                      email: values.email,
                      role: values.role,
                      warehouseId: values.warehouseId || undefined,
                    },
                  });
                  toast.success("User updated");
                  setEditModal(false);
                  setEditingUser(null);
                  refetch();
                } catch (err: unknown) {
                  const serverErrors = getServerValidationErrors(err);
                  if (serverErrors) {
                    setErrors(serverErrors);
                  } else {
                    toast.error((err as Error)?.message || "Update failed");
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
                      <div className="text-red-500 text-xs">
                        {errors.firstName}
                      </div>
                    )}
                  </div>
                  <div className="mb-4">
                    <label>Last Name</label>
                    <Field name="lastName" as={Input} />
                    {errors.lastName && touched.lastName && (
                      <div className="text-red-500 text-xs">
                        {errors.lastName}
                      </div>
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
                  <div className="mb-4">
                    <label>Warehouse</label>
                    <Select
                      value={values.warehouseId}
                      onChange={(v) =>
                        handleChange({
                          target: { name: "warehouseId", value: v },
                        })
                      }
                      style={{ width: "100%" }}
                      allowClear
                    >
                      {availableWarehouses.map((warehouse) => (
                        <Select.Option key={warehouse.id} value={warehouse.id}>
                          {warehouse.name}
                        </Select.Option>
                      ))}
                    </Select>
                    {errors.warehouseId && touched.warehouseId && (
                      <div className="text-red-500 text-xs">
                        {errors.warehouseId}
                      </div>
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

          <Modal
            title="View User Details"
            open={viewModal}
            onCancel={() => {
              setViewModal(false);
              setViewingUser(null);
            }}
            footer={[
              <Button
                key="edit"
                type="primary"
                onClick={() => {
                  if (viewingUser) {
                    handleEditUser(viewingUser);
                  }
                }}
              >
                Edit
              </Button>,
              <Button
                key="toggle"
                danger={viewingUser?.isActive}
                onClick={() => {
                  if (viewingUser) {
                    Modal.confirm({
                      title: viewingUser.isActive
                        ? "Deactivate user?"
                        : "Activate user?",
                      content: `Are you sure you want to ${
                        viewingUser.isActive ? "deactivate" : "activate"
                      } ${viewingUser.firstName} ${viewingUser.lastName}?`,
                      okText: viewingUser.isActive ? "Deactivate" : "Activate",
                      okButtonProps: { danger: viewingUser.isActive },
                      onOk: async () => {
                        await handleToggleUserStatus(
                          viewingUser.id,
                          !viewingUser.isActive
                        );
                        setViewModal(false);
                        setViewingUser(null);
                      },
                    });
                  }
                }}
              >
                {viewingUser?.isActive ? "Deactivate" : "Activate"}
              </Button>,
              <Button
                key="reset"
                onClick={() => {
                  if (viewingUser) {
                    handleResetUserPassword(viewingUser);
                  }
                }}
              >
                Reset Password
              </Button>,
            ]}
            destroyOnHidden
          >
            {viewingUser && (
              <Descriptions title="User Information" bordered column={1}>
                <Descriptions.Item label="First Name">
                  {viewingUser.firstName}
                </Descriptions.Item>
                <Descriptions.Item label="Last Name">
                  {viewingUser.lastName}
                </Descriptions.Item>
                <Descriptions.Item label="Email">
                  {viewingUser.email}
                </Descriptions.Item>
                <Descriptions.Item label="Role">
                  {viewingUser.role}
                </Descriptions.Item>
                <Descriptions.Item label="Warehouse">
                  {viewingUser.warehouse?.name || "N/A"}
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  <span
                    className={
                      viewingUser.isActive ? "text-green-600" : "text-red-600"
                    }
                  >
                    {viewingUser.isActive ? "Active" : "Inactive"}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="Two-Factor Authentication">
                  {viewingUser.twoFactorEnabled ? "Enabled" : "Disabled"}
                </Descriptions.Item>
                <Descriptions.Item label="Created At">
                  {new Date(viewingUser.createdAt).toLocaleString()}
                </Descriptions.Item>
                <Descriptions.Item label="Last Login">
                  {viewingUser.lastLogin
                    ? new Date(viewingUser.lastLogin).toLocaleString()
                    : "Never"}
                </Descriptions.Item>
              </Descriptions>
            )}
          </Modal>
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
