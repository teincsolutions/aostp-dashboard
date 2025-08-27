"use client";

import React, { useState } from "react";
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  Modal,
  Form,
  message,
  Card,
  Row,
  Col,
  Statistic,
  Drawer,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  UserOutlined,
  CheckOutlined,
  StopOutlined,
  BarChartOutlined,
  ExportOutlined,
} from "@ant-design/icons";
import { AppLayout } from "@/components/AppLayout";
import { AuthGuard } from "@/components/AuthGuard";
import { useCustomers, useCustomerMutations, useCustomerStats, useExportCustomers } from "@/hooks/useCustomers";
import { CustomerCreatePayload, CustomerUpdatePayload, IdType, PreferredChannel, Customer } from "@/types/customer";
import { getCustomerColumns } from "@/app/customers/columns";

const { Option } = Select;

export default function CustomersPage() {
  // State for UI
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isStatsDrawerVisible, setIsStatsDrawerVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [statsCustomer, setStatsCustomer] = useState<Customer | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [exportLoading, setExportLoading] = useState(false);

  // Forms
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();

  // React Query hooks
  const { data: customers, isLoading } = useCustomers({
    page: currentPage,
    limit: pageSize,
    search: searchText,
    isActive: statusFilter ? statusFilter === "active" : undefined,
  });

  // Export mutation hook
  const exportCustomersMutation = useExportCustomers();

  const {
    createCustomer,
    updateCustomer,
    deleteCustomer,
    toggleCustomerStatus,
    isCreating,
    isUpdating,
    isDeleting,
    isTogglingStatus,
  } = useCustomerMutations();

  const { data: customerStats } = useCustomerStats(statsCustomer?.id || "");

  // Handlers
  const handleSearch = (value: string) => {
    setSearchText(value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleCreateCustomer = async (values: CustomerCreatePayload) => {
    try {
      await createCustomer(values);
      message.success("Customer created successfully");
      setIsCreateModalVisible(false);
      createForm.resetFields();
    } catch (error) {
      message.error("Failed to create customer");
    }
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    editForm.setFieldsValue({
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phoneNumber: customer.phoneNumber,
      alternatePhone: customer.alternatePhone,
      address: customer.address,
      city: customer.city,
      country: customer.country,
      idType: customer.idType,
      idNumber: customer.idNumber,
      preferredChannel: customer.preferredChannel,
    });
    setIsEditModalVisible(true);
  };

  const handleUpdateCustomer = async (values: CustomerUpdatePayload) => {
    if (!editingCustomer) return;

    try {
      await updateCustomer({ id: editingCustomer.id, payload: values });
      message.success("Customer updated successfully");
      setIsEditModalVisible(false);
      setEditingCustomer(null);
      editForm.resetFields();
    } catch (error) {
      message.error("Failed to update customer");
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    try {
      await deleteCustomer(id);
      message.success("Customer deleted successfully");
    } catch (error) {
      message.error("Failed to delete customer");
    }
  };

  const handleToggleCustomerStatus = async (id: string, isActive?: boolean) => {
    const customer = customers?.data?.find((c: Customer) => c.id === id);
    if (!customer) return;

    const newStatus =
      typeof isActive === "boolean"
        ? isActive
        : !customer.isActive;

    try {
      await toggleCustomerStatus({ id, isActive: newStatus });
      message.success(
        `Customer ${customer.isActive ? "deactivated" : "activated"} successfully`
      );
    } catch (error) {
      message.error(
        `Failed to ${customer.isActive ? "deactivate" : "activate"} customer`
      );
    }
  };

  const handleViewStats = (customer: Customer) => {
    setStatsCustomer(customer);
    setIsStatsDrawerVisible(true);
  };

  // Export handler for selected customers
  const handleExportSelected = async (format: "pdf" | "excel") => {
    setExportLoading(true);
    try {
      await exportCustomersMutation.mutateAsync({
        params: {
          ids: selectedRowKeys,
          page: currentPage,
          limit: pageSize,
          search: searchText,
          isActive: statusFilter ? statusFilter === "active" : undefined,
        },
        format,
      });
      message.success(`Exported selected customers as ${format.toUpperCase()}`);
    } catch (error) {
      message.error("Failed to export selected customers");
    } finally {
      setExportLoading(false);
    }
  };

  // Table columns
  const columns = getCustomerColumns({
    onEdit: handleEditCustomer,
    onToggleStatus: (id: string, isActive: boolean) => handleToggleCustomerStatus(id, isActive),
    onViewStats: handleViewStats,
    onExport: async (id: string) => {
      setExportLoading(true);
      try {
        await exportCustomersMutation.mutateAsync({
          params: { ids: [id] },
          format: "pdf",
        });
        message.success("Customer exported successfully");
      } catch {
        message.error("Failed to export customer");
      } finally {
        setExportLoading(false);
      }
    },
    loading: {
      toggling: isTogglingStatus,
      exporting: exportLoading,
    },
  });

  // Filter options
  const idTypeOptions = [
    { label: "National ID", value: IdType.NATIONAL_ID },
    { label: "Passport", value: IdType.PASSPORT },
    { label: "Driver License", value: IdType.DRIVERS_LICENSE },
    { label: "Voter ID", value: IdType.VOTER_ID },
  ];

  const preferredChannelOptions = [
    { label: "SMS", value: PreferredChannel.SMS },
    { label: "Email", value: PreferredChannel.EMAIL },
    { label: "WhatsApp", value: PreferredChannel.WHATSAPP },
  ];

  // Statistics
  const totalCustomers = customers?.total || 0;
  const activeCustomers = customers?.data?.filter((c: Customer) => c.isActive).length || 0;
  const inactiveCustomers = customers?.data?.filter((c: Customer) => !c.isActive).length || 0;

  // Row selection config
  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => setSelectedRowKeys(newSelectedRowKeys),
  };

  return (
    <AuthGuard>
      <AppLayout>
        <div className="px-4 md:px-6 lg:px-8 py-4 mx-auto space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <h1 className="text-2xl font-bold">Customer Management</h1>
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setIsCreateModalVisible(true)}
              >
                Add Customer
              </Button>
              <Button
                icon={<ExportOutlined />}
                loading={exportLoading}
                disabled={selectedRowKeys.length === 0}
                onClick={() => handleExportSelected("pdf")}
              >
                Export Selected (PDF)
              </Button>
              <Button
                icon={<ExportOutlined />}
                loading={exportLoading}
                disabled={selectedRowKeys.length === 0}
                onClick={() => handleExportSelected("excel")}
              >
                Export Selected (Excel)
              </Button>
            </Space>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <Card>
              <Statistic
                title="Total Customers"
                value={totalCustomers}
                prefix={<UserOutlined />}
              />
            </Card>
            <Card>
              <Statistic
                title="Active Customers"
                value={activeCustomers}
                prefix={<CheckOutlined />}
                valueStyle={{ color: "#3f8600" }}
              />
            </Card>
            <Card>
              <Statistic
                title="Inactive Customers"
                value={inactiveCustomers}
                prefix={<StopOutlined />}
                valueStyle={{ color: "#cf1322" }}
              />
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <div className="flex gap-4 mb-4">
              <Input
                placeholder="Search customers..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-2/5"
                allowClear
              />
              <Select
                placeholder="Filter by status"
                value={statusFilter}
                onChange={handleStatusFilter}
                className="w-1/5"
                allowClear
              >
                <Option value="active">Active</Option>
                <Option value="inactive">Inactive</Option>
              </Select>
            </div>
          </Card>

          {/* Customers Table */}
          <Card>
            <Table
              columns={columns}
              dataSource={customers?.data || []}
              loading={isLoading}
              rowKey="id"
              rowSelection={rowSelection}
              pagination={{
                current: currentPage,
                pageSize,
                total: customers?.total || 0,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} customers`,
                onChange: (page, size) => {
                  setCurrentPage(page);
                  setPageSize(size);
                },
              }}
            />
          </Card>

          {/* Create Customer Modal */}
          <Modal
            title="Create New Customer"
            open={isCreateModalVisible}
            onCancel={() => {
              setIsCreateModalVisible(false);
              createForm.resetFields();
            }}
            footer={null}
            width={700}
          >
            <Form
              form={createForm}
              layout="vertical"
              onFinish={handleCreateCustomer}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="firstName"
                    label="First Name"
                    rules={[
                      { required: true, message: "Please enter first name" },
                    ]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="lastName"
                    label="Last Name"
                    rules={[
                      { required: true, message: "Please enter last name" },
                    ]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="email"
                    label="Email"
                    rules={[
                      { required: true, message: "Please enter email" },
                      { type: "email", message: "Please enter a valid email" },
                    ]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="phoneNumber"
                    label="Phone Number"
                    rules={[
                      { required: true, message: "Please enter phone number" },
                    ]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="alternatePhone" label="Alternate Phone">
                <Input />
              </Form.Item>

              <Form.Item name="address" label="Address">
                <Input />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="city" label="City">
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="country" label="Country">
                    <Input />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="idType" label="ID Type">
                    <Select allowClear>
                      {idTypeOptions.map((option) => (
                        <Option key={option.value} value={option.value}>
                          {option.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="idNumber" label="ID Number">
                    <Input />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="preferredChannel" label="Preferred Channel">
                <Select allowClear>
                  {preferredChannelOptions.map((option) => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit" loading={isCreating}>
                    Create Customer
                  </Button>
                  <Button
                    onClick={() => {
                      setIsCreateModalVisible(false);
                      createForm.resetFields();
                    }}
                  >
                    Cancel
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Modal>

          {/* Edit Customer Modal */}
          <Modal
            title="Edit Customer"
            open={isEditModalVisible}
            onCancel={() => {
              setIsEditModalVisible(false);
              setEditingCustomer(null);
              editForm.resetFields();
            }}
            footer={null}
            width={700}
          >
            <Form form={editForm} layout="vertical" onFinish={handleUpdateCustomer}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="firstName" label="First Name">
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="lastName" label="Last Name">
                    <Input />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="email"
                    label="Email"
                    rules={[
                      { type: "email", message: "Please enter a valid email" },
                    ]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="phoneNumber" label="Phone Number">
                    <Input />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="alternatePhone" label="Alternate Phone">
                <Input />
              </Form.Item>

              <Form.Item name="address" label="Address">
                <Input />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="city" label="City">
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="country" label="Country">
                    <Input />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="idType" label="ID Type">
                    <Select allowClear>
                      {idTypeOptions.map((option) => (
                        <Option key={option.value} value={option.value}>
                          {option.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="idNumber" label="ID Number">
                    <Input />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="preferredChannel" label="Preferred Channel">
                <Select allowClear>
                  {preferredChannelOptions.map((option) => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit" loading={isUpdating}>
                    Update Customer
                  </Button>
                  <Button
                    onClick={() => {
                      setIsEditModalVisible(false);
                      setEditingCustomer(null);
                      editForm.resetFields();
                    }}
                  >
                    Cancel
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Modal>

          {/* Customer Stats Drawer */}
          <Drawer
            title={`Customer Statistics - ${statsCustomer?.firstName} ${statsCustomer?.lastName}`}
            open={isStatsDrawerVisible}
            onClose={() => {
              setIsStatsDrawerVisible(false);
              setStatsCustomer(null);
            }}
            width={500}
          >
            {customerStats ? (
              <div>
                <Row gutter={16} className="mb-6">
                  <Col span={12}>
                    <Card>
                      <Statistic
                        title="Total Packages"
                        value={customerStats.totalPackages}
                        prefix={<BarChartOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card>
                      <Statistic
                        title="Total Invoices"
                        value={customerStats.totalInvoices}
                      />
                    </Card>
                  </Col>
                </Row>
                <Row gutter={16} className="mb-6">
                  <Col span={12}>
                    <Card>
                      <Statistic
                        title="Total Payments"
                        value={customerStats.totalPayments}
                      />
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card>
                      {/* Pending Invoices not available in API spec */}
                    </Card>
                  </Col>
                </Row>
                <Card>
                  {/* Overdue Invoices not available in API spec */}
                </Card>
              </div>
            ) : (
              <div className="text-center">Loading statistics...</div>
            )}
          </Drawer>
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
