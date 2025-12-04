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
import {
  useCustomers,
  useCustomerMutations,
  useCustomerStats,
  useExportCustomers,
} from "@/hooks/useCustomers";
import {
  CustomerCreatePayload,
  CustomerUpdatePayload,
  Customer,
} from "@/types/customer";
import { getCustomerColumns } from "@/app/customers/columns";
import { toast } from "sonner";
import { handleError } from "@/utils/forms/errorUtils";

const { Option } = Select;

export default function CustomersPage() {
  // State for UI
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<string>("desc");
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [exportLoading, setExportLoading] = useState(false);

  // Formik handles forms internally

  // React Query hooks
  const { data: customers, isLoading } = useCustomers({
    page: currentPage,
    limit: pageSize,
    search: searchText || undefined,
    isActive: statusFilter ? statusFilter === "active" : undefined,
    sortBy: sortBy || undefined,
    sortOrder: sortOrder || undefined,
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

  const handleSortChange = (value: string) => {
    setSortBy(value);
    setCurrentPage(1);
  };

  const handleSortOrderChange = (value: string) => {
    setSortOrder(value);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearchText("");
    setStatusFilter("");
    setSortBy("createdAt");
    setSortOrder("desc");
    setCurrentPage(1);
  };

  const handleCreateCustomer = async (values: any) => {
    try {
      const payload = values as CustomerCreatePayload;
      await createCustomer(payload);
      toast.success("Customer created successfully");
      setIsCreateModalVisible(false);
    } catch (err) {
      handleError(err);
    }
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsEditModalVisible(true);
  };

  const handleUpdateCustomer = async (values: Customer) => {
    if (!editingCustomer) return;
    try {
      const {
        id,
        createdAt,
        updatedAt,
        customerCode,
        _count,
        cityRef,
        warehouse,
        ...payload
      } = values;
      await updateCustomer({ id: editingCustomer.id, payload });
      toast.success("Customer updated successfully");
      setIsEditModalVisible(false);
      setEditingCustomer(null);
    } catch (error) {
      handleError(error);
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    try {
      await deleteCustomer(id);
      toast.success("Customer deleted successfully");
    } catch (error) {
      handleError(error);
    }
  };

  const handleToggleCustomerStatus = async (id: string, isActive?: boolean) => {
    const customer = customers?.data?.find((c: Customer) => c.id === id);
    if (!customer) return;

    const newStatus =
      typeof isActive === "boolean" ? isActive : !customer.isActive;

    try {
      await toggleCustomerStatus({ id, isActive: newStatus });
      toast.success(
        `Customer ${
          customer.isActive ? "deactivated" : "activated"
        } successfully`
      );
    } catch (error) {
      toast.error(
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
      toast.success(`Exported selected customers as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error("Failed to export selected customers");
    } finally {
      setExportLoading(false);
    }
  };

  // Table columns
  const columns = getCustomerColumns({
    onEdit: handleEditCustomer,
    onToggleStatus: (id: string, isActive: boolean) =>
      handleToggleCustomerStatus(id, isActive),
    onViewStats: handleViewCustomerDetails,
    onExport: async (id: string) => {
      setExportLoading(true);
      try {
        await exportCustomersMutation.mutateAsync({
          params: { ids: [id] },
          format: "pdf",
        });
        toast.success("Customer exported successfully");
      } catch {
        toast.error("Failed to export customer");
      } finally {
        setExportLoading(false);
      }
    },
    loading: {
      toggling: isTogglingStatus,
      exporting: exportLoading,
    },
  });

  // Statistics
  const totalCustomers = customers?.meta.total || 0;
  const activeCustomers =
    customers?.data?.filter((c: Customer) => c.isActive).length || 0;
  const inactiveCustomers =
    customers?.data?.filter((c: Customer) => !c.isActive).length || 0;

  // Row selection config
  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) =>
      setSelectedRowKeys(newSelectedRowKeys),
  };

  return (
    <AuthGuard>
      <AppLayout>
        <div className="px-4 md:px-6 lg:px-8 py-4 w-full mx-auto space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <h1 className="text-2xl font-bold">Customer Management</h1>
            <Space wrap>
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
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                <Input
                  placeholder="Search by name, email, phone, customer code..."
                  prefix={<SearchOutlined />}
                  value={searchText}
                  onChange={(e) => handleSearch(e.target.value)}
                  allowClear
                />
                <Select
                  placeholder="Filter by status"
                  value={statusFilter || undefined}
                  onChange={handleStatusFilter}
                  allowClear
                  style={{ width: "100%" }}
                >
                  <Option value="active">Active</Option>
                  <Option value="inactive">Inactive</Option>
                </Select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Select
                  placeholder="Sort by"
                  value={sortBy}
                  onChange={handleSortChange}
                  style={{ width: "100%" }}
                >
                  <Option value="createdAt">Created Date</Option>
                  <Option value="firstName">First Name</Option>
                  <Option value="lastName">Last Name</Option>
                  <Option value="customerCode">Customer Code</Option>
                </Select>
                <Select
                  placeholder="Sort order"
                  value={sortOrder}
                  onChange={handleSortOrderChange}
                  style={{ width: "100%" }}
                >
                  <Option value="desc">Descending</Option>
                  <Option value="asc">Ascending</Option>
                </Select>
                <Button
                  onClick={handleClearFilters}
                  disabled={
                    !searchText &&
                    !statusFilter &&
                    sortBy === "createdAt" &&
                    sortOrder === "desc"
                  }
                  style={{ width: "100%" }}
                >
                  Clear Filters
                </Button>
              </div>
            </Space>
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
                total: customers?.meta.total || 0,
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
