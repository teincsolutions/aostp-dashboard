"use client";

import React, { useState } from "react";
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  Form,
  message,
  Card,
  Row,
  Col,
  Statistic,
} from "antd";
import { CustomerModal } from "@/components/CustomerModal";
import { CustomerDetailsModal } from "@/components/CustomerDetailsModal";
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
  const [idTypeFilter, setIdTypeFilter] = useState<string>("");
  const [channelFilter, setChannelFilter] = useState<string>("");
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [exportLoading, setExportLoading] = useState(false);

  // Formik handles forms internally

  // React Query hooks
  const { data: customers, isLoading } = useCustomers({
    page: currentPage,
    limit: pageSize,
    search: searchText,
    isActive: statusFilter ? statusFilter === "active" : undefined,
    idType: idTypeFilter || undefined,
    preferredChannel: channelFilter || undefined,
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

  const { data: customerStats } = useCustomerStats(selectedCustomer?.id || "");

  // Handlers
  const handleSearch = (value: string) => {
    setSearchText(value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleIdTypeFilter = (value: string) => {
    setIdTypeFilter(value);
    setCurrentPage(1);
  };

  const handleChannelFilter = (value: string) => {
    setChannelFilter(value);
    setCurrentPage(1);
  };

  const handleCreateCustomer = async (values: any) => {
    const payload = values as CustomerCreatePayload;
    await createCustomer(payload);
    message.success("Customer created successfully");
    setIsCreateModalVisible(false);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsEditModalVisible(true);
  };

  const handleUpdateCustomer = async (values: any) => {
    if (!editingCustomer) return;
    const payload = values as CustomerUpdatePayload;
    await updateCustomer({ id: editingCustomer.id, payload });
    message.success("Customer updated successfully");
    setIsEditModalVisible(false);
    setEditingCustomer(null);
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

  const handleViewCustomerDetails = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDetailsModalVisible(true);
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
    onViewStats: handleViewCustomerDetails,
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
        <div className="px-4 md:px-6 lg:px-8 py-4 w-full mx-auto space-y-4">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <Input
                placeholder="Search customers..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => handleSearch(e.target.value)}
                allowClear
              />
              <Select
                placeholder="Filter by status"
                value={statusFilter}
                onChange={handleStatusFilter}
                allowClear
              >
                <Option value="active">Active</Option>
                <Option value="inactive">Inactive</Option>
              </Select>
              <Select
                placeholder="Filter by ID Type"
                value={idTypeFilter}
                onChange={handleIdTypeFilter}
                allowClear
              >
                {idTypeOptions.map(opt => (
                  <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                ))}
              </Select>
              <Select
                placeholder="Filter by Channel"
                value={channelFilter}
                onChange={handleChannelFilter}
                allowClear
              >
                {preferredChannelOptions.map(opt => (
                  <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                ))}
              </Select>
            </div>
          </Card>

          {/* Customers Table */}
          <Card className="flex-1">
            <Table
              columns={columns}
              dataSource={customers?.data || []}
              loading={isLoading}
              rowKey="id"
              rowSelection={rowSelection}
              scroll={{ x: true }}
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
          <CustomerModal
            visible={isCreateModalVisible}
            onCancel={() => setIsCreateModalVisible(false)}
            onSubmit={handleCreateCustomer}
            loading={isCreating}
            mode="create"
          />

          {/* Edit Customer Modal */}
          <CustomerModal
            visible={isEditModalVisible}
            onCancel={() => {
              setIsEditModalVisible(false);
              setEditingCustomer(null);
            }}
            onSubmit={handleUpdateCustomer}
            loading={isUpdating}
            mode="edit"
            initialValues={editingCustomer || undefined}
          />

          {/* Customer Details Modal */}
          <CustomerDetailsModal
            visible={isDetailsModalVisible}
            onCancel={() => {
              setIsDetailsModalVisible(false);
              setSelectedCustomer(null);
            }}
            customer={selectedCustomer}
          />
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
