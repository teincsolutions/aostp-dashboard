'use client';

import { useState } from "react";
import { Table, Empty, Result, Button, DatePicker, Select, Input, Space, Modal, Form, message, Tabs, Popconfirm, Row, Col } from "antd";
import type {
  TablePaginationConfig,
  FilterValue,
  SorterResult,
  TableCurrentDataSource,
} from "antd/es/table/interface";
import { columns } from "@/app/warehouse/columns";
import { useWarehousePackages, useWarehouses, useWarehouseMutations } from "@/hooks/useWarehouse";
import { AppLayout } from "@/components/AppLayout";
import { AuthGuard } from "@/components/AuthGuard";
import { useAuthStore } from "@/store/authStore";
import { WarehousePackage, WarehouseCreatePayload, WarehouseUpdatePayload, Warehouse } from "@/types/warehouse";
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { toast } from "sonner";
import { GetWarehousePackagesParams } from "@/services/warehouseService";

const { RangePicker } = DatePicker;
const { Option } = Select;
const { TabPane } = Tabs;

const allowedRoles = ["OPERATIONS_CLERK", "SUPER_ADMIN"];

export default function WarehousePage() {
  const user = useAuthStore((s) => s.user);
  const [activeTab, setActiveTab] = useState("1");

  // Warehouse packages filters
  const [packageFilters, setPackageFilters] = useState<GetWarehousePackagesParams>({
    warehouseId: undefined,
    status: undefined,
    daysThreshold: 0,
    dateFrom: undefined,
    dateTo: undefined,
    search: "",
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  // Warehouse CRUD state
  const [warehousesPage, setWarehousesPage] = useState(1);
  const [warehousesLimit] = useState(10);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);

  // Forms
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();

  // React Query hooks
  const { data: packagesData, isLoading: packagesLoading, isError: packagesError, error: packagesErrorMsg } = useWarehousePackages(packageFilters);
  const { data: warehousesData, isLoading: warehousesLoading } = useWarehouses({ page: warehousesPage, limit: warehousesLimit });
 
  const {
    createWarehouse,
    updateWarehouse,
    updateWarehouseStatus,
    deleteWarehouse,
    updateWarehouseDays,
    isCreating,
    isUpdating,
    isDeleting,
    isUpdatingStatus,
    isUpdatingDays,
  } = useWarehouseMutations();

  if (!user || !allowedRoles.includes(user.role)) {
    return (
      <AppLayout>
        <AuthGuard>
          <Result
            status="403"
            title="Unauthorized"
            subTitle="You do not have access to this page."
          />
        </AuthGuard>
      </AppLayout>
    );
  }

  // Warehouse CRUD handlers
  const handleCreateWarehouse = async (values: WarehouseCreatePayload) => {
    try {
      await createWarehouse(values);
      toast.success("Warehouse created successfully");
      setIsCreateModalVisible(false);
      createForm.resetFields();
    } catch (error) {
      toast.error("Failed to create warehouse");
    }
  };

  const handleEditWarehouse = (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse);
    editForm.setFieldsValue({
      name: warehouse.name,
      location: warehouse.location,
    });
    setIsEditModalVisible(true);
  };

  const handleUpdateWarehouse = async (values: WarehouseUpdatePayload) => {
    if (!editingWarehouse) return;
    try {
      await updateWarehouse({ id: editingWarehouse.id, data: values });
      toast.success("Warehouse updated successfully");
      setIsEditModalVisible(false);
      setEditingWarehouse(null);
      editForm.resetFields();
    } catch (error) {
      toast.error("Failed to update warehouse");
    }
  };

  const handleToggleWarehouseStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await updateWarehouseStatus({ id, status: newStatus });
      toast.success(`Warehouse ${newStatus.toLowerCase()} successfully`);
    } catch (error) {
      toast.error("Failed to update warehouse status");
    }
  };

  const handleDeleteWarehouse = async (id: string) => {
    try {
      await deleteWarehouse(id);
      toast.success("Warehouse deleted successfully");
    } catch (error) {
      toast.error("Failed to delete warehouse");
    }
  };

  const handleUpdateWarehouseDays = async () => {
    try {
      await updateWarehouseDays();
      toast.success("Warehouse days updated successfully");
    } catch (error) {
      toast.error("Failed to update warehouse days");
    }
  };

  // Package table handlers
  const handleTableChange = (
    pagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
    sorter: SorterResult<WarehousePackage> | SorterResult<WarehousePackage>[],
    extra: TableCurrentDataSource<WarehousePackage>
  ) => {
    let status: string | undefined = undefined;
    if (Array.isArray(filters.status) && typeof filters.status[0] === "string") {
      status = filters.status[0] as string;
    }
    setPackageFilters((prev) => ({
      ...prev,
      page: pagination.current ?? 1,
      limit: pagination.pageSize ?? 10,
      sortBy: Array.isArray(sorter)
        ? typeof sorter[0]?.field === "string"
          ? sorter[0].field
          : "createdAt"
        : typeof sorter.field === "string"
        ? sorter.field
        : "createdAt",
      sortOrder: Array.isArray(sorter)
        ? sorter[0]?.order === "ascend"
          ? "asc"
          : "desc"
        : sorter.order === "ascend"
        ? "asc"
        : "desc",
      status,
    }));
  };

  // Warehouse table columns
  const warehouseColumns = [
    {
      title: 'Warehouse ID',
      dataIndex: 'warehouseId',
      key: 'warehouseId',
      render: (id: string) => <strong>{id}</strong>,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <span style={{ color: status === 'ACTIVE' ? '#52c41a' : '#ff4d4f' }}>
          {status}
        </span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Warehouse) => (
        <Space>
          <Button type="link" onClick={() => handleEditWarehouse(record)}>
            Edit
          </Button>
          <Button
            type="link"
            onClick={() => handleToggleWarehouseStatus(record.id, record.status)}
          >
            {record.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this warehouse?"
            onConfirm={() => handleDeleteWarehouse(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <AppLayout>
      <AuthGuard>
        <div className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center mb-6">
            <h1 className="text-2xl font-bold">Warehouse Management</h1>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setIsCreateModalVisible(true)}
                block
                className="sm:w-auto"
              >
                Add Warehouse
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleUpdateWarehouseDays}
                loading={isUpdatingDays}
                block
                className="sm:w-auto"
              >
                Update Days
              </Button>
            </div>
          </div>

          <Tabs activeKey={activeTab} onChange={setActiveTab}>
          
            <TabPane tab="Warehouse Locations" key="1">
              <Table
                columns={warehouseColumns}
                dataSource={warehousesData?.data || []}
                rowKey="id"
                loading={warehousesLoading}
                pagination={{
                  current: warehousesPage,
                  pageSize: warehousesLimit,
                  total: warehousesData?.meta?.total || 0,
                  showSizeChanger: true,
                  onChange: (page, size) => {
                    setWarehousesPage(page);
                  },
                }}
                locale={{ emptyText: <Empty description="No warehouses found" /> }}
                scroll={{ x: true }}
              />
            </TabPane>
              <TabPane tab="Packages in Warehouse" key="2">
              <Space wrap className="mb-4">
                <Input.Search
                  placeholder="Search Tracking # / Customer"
                  allowClear
                  onSearch={(v) => setPackageFilters(prev => ({ ...prev, search: v, page: 1 }))}
                  style={{ width: 220 }}
                />
                <Select
                  placeholder="Warehouse"
                  allowClear
                  style={{ width: 140 }}
                  onChange={(v) => setPackageFilters(prev => ({ ...prev, warehouseId: v, page: 1 }))}
                >
                  {warehousesData?.data?.map(w => (
                    <Option key={w.id} value={w.warehouseId}>{w.name} ({w.warehouseId})</Option>
                  ))}
                </Select>
                <Select
                  placeholder="Status"
                  allowClear
                  style={{ width: 140 }}
                  onChange={(v) => setPackageFilters(prev => ({ ...prev, status: v, page: 1 }))}
                >
                  <Option value="RECEIVED">Received</Option>
                  <Option value="ASSIGNED">Assigned</Option>
                  <Option value="SHIPPED">Shipped</Option>
                </Select>
                <Input
                  placeholder="Days Min"
                  type="number"
                  style={{ width: 100 }}
                  onChange={(e) => setPackageFilters(prev => ({
                    ...prev,
                    daysInWarehouseFrom: e.target.value ? Number(e.target.value) : undefined,
                    page: 1
                  }))}
                />
                <Input
                  placeholder="Days Max"
                  type="number"
                  style={{ width: 100 }}
                  onChange={(e) => setPackageFilters(prev => ({
                    ...prev,
                    daysInWarehouseTo: e.target.value ? Number(e.target.value) : undefined,
                    page: 1
                  }))}
                />
                <RangePicker onChange={(dates, dateStrings) => {
                  setPackageFilters(prev => ({
                    ...prev,
                    dateFrom: dateStrings[0] || undefined,
                    dateTo: dateStrings[1] || undefined,
                    page: 1
                  }));
                }} />
              </Space>
              <Table
                columns={columns}
                dataSource={packagesData?.data || []}
                rowKey="id"
                loading={packagesLoading}
                pagination={{
                  current: packageFilters.page,
                  pageSize: packageFilters.limit,
                  total: packagesData?.total || 0,
                  showSizeChanger: true,
                }}
                onChange={handleTableChange}
                locale={{ emptyText: <Empty /> }}
                scroll={{ x: true }}
                size="middle"
              />
              {packagesError && (
                <Result
                  status="error"
                  title="Failed to load warehouse packages"
                  subTitle={packagesErrorMsg?.message || "Unknown error"}
                />
              )}
            </TabPane>

          </Tabs>

          {/* Create Warehouse Modal */}
          <Modal
            title="Create New Warehouse"
            open={isCreateModalVisible}
            onCancel={() => {
              setIsCreateModalVisible(false);
              createForm.resetFields();
            }}
            footer={null}
            width={600}
          >
            <Form
              form={createForm}
              layout="vertical"
              onFinish={handleCreateWarehouse}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="name"
                    label="Warehouse Name"
                    rules={[{ required: true, message: "Please enter warehouse name" }]}
                  >
                    <Input placeholder="e.g., Main Warehouse" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="location"
                    label="Location"
                    rules={[{ required: true, message: "Please enter location" }]}
                  >
                    <Input placeholder="e.g., Accra, Tema" />
                  </Form.Item>
                </Col>
              </Row>



              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit" loading={isCreating}>
                    Create Warehouse
                  </Button>
                  <Button onClick={() => {
                    setIsCreateModalVisible(false);
                    createForm.resetFields();
                  }}>
                    Cancel
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Modal>

          {/* Edit Warehouse Modal */}
          <Modal
            title="Edit Warehouse"
            open={isEditModalVisible}
            onCancel={() => {
              setIsEditModalVisible(false);
              setEditingWarehouse(null);
              editForm.resetFields();
            }}
            footer={null}
            width={600}
          >
            <Form
              form={editForm}
              layout="vertical"
              onFinish={handleUpdateWarehouse}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="name" label="Warehouse Name">
                    <Input placeholder="e.g., Main Warehouse" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="location" label="Location">
                    <Input placeholder="e.g., Accra, Tema" />
                  </Form.Item>
                </Col>
              </Row>
        
              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit" loading={isUpdating}>
                    Update Warehouse
                  </Button>
                  <Button onClick={() => {
                    setIsEditModalVisible(false);
                    setEditingWarehouse(null);
                    editForm.resetFields();
                  }}>
                    Cancel
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Modal>
        </div>
      </AuthGuard>
    </AppLayout>
  );
}
