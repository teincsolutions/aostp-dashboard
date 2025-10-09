'use client';

import { useState } from "react";
import { Table, Empty, Result, notification, Button, DatePicker, Select, Input, Space, Card, Modal, Form, message, Tabs, Popconfirm, Row, Col, Statistic } from "antd";
import type {
  TablePaginationConfig,
  FilterValue,
  SorterResult,
  TableCurrentDataSource,
} from "antd/es/table/interface";
import { columns } from "@/app/warehouse/columns";
import { useWarehousePackages, useWarehouses, useWarehouseMutations, useWarehouseAgingSummary } from "@/hooks/useWarehouse";
import { AppLayout } from "@/components/AppLayout";
import { AuthGuard } from "@/components/AuthGuard";
import { useAuthStore } from "@/store/authStore";
import { WarehousePackage, WarehouseCreatePayload, WarehouseUpdatePayload, Warehouse } from "@/types/warehouse";
import { PlusOutlined, ReloadOutlined, WarningOutlined, CheckCircleOutlined } from '@ant-design/icons';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { TabPane } = Tabs;

const allowedRoles = ["OPERATIONS_CLERK", "SUPER_ADMIN"];

export default function WarehousePage() {
  const user = useAuthStore((s) => s.user);
  const [activeTab, setActiveTab] = useState("1");

  // Warehouse packages filters
  const [packageFilters, setPackageFilters] = useState<{
    warehouseLocation?: string;
    status?: string;
    daysInWarehouseFrom?: number;
    daysInWarehouseTo?: number;
    dateFrom?: string;
    dateTo?: string;
    search: string;
    page: number;
    limit: number;
    sortBy: string;
    sortOrder: "desc" | "asc" | undefined;
  }>({
    warehouseLocation: undefined,
    status: undefined,
    daysInWarehouseFrom: undefined,
    daysInWarehouseTo: undefined,
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
  const { data: agingSummary } = useWarehouseAgingSummary();

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
      message.success("Warehouse created successfully");
      setIsCreateModalVisible(false);
      createForm.resetFields();
    } catch (error) {
      message.error("Failed to create warehouse");
    }
  };

  const handleEditWarehouse = (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse);
    editForm.setFieldsValue({
      name: warehouse.name,
      location: warehouse.location,
      contactPerson: warehouse.contactPerson,
      contactEmail: warehouse.contactEmail,
      contactPhone: warehouse.contactPhone,
      capacity: warehouse.capacity,
    });
    setIsEditModalVisible(true);
  };

  const handleUpdateWarehouse = async (values: WarehouseUpdatePayload) => {
    if (!editingWarehouse) return;
    try {
      await updateWarehouse({ id: editingWarehouse.id, data: values });
      message.success("Warehouse updated successfully");
      setIsEditModalVisible(false);
      setEditingWarehouse(null);
      editForm.resetFields();
    } catch (error) {
      message.error("Failed to update warehouse");
    }
  };

  const handleToggleWarehouseStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await updateWarehouseStatus({ id, status: newStatus });
      message.success(`Warehouse ${newStatus.toLowerCase()} successfully`);
    } catch (error) {
      message.error("Failed to update warehouse status");
    }
  };

  const handleDeleteWarehouse = async (id: string) => {
    try {
      await deleteWarehouse(id);
      message.success("Warehouse deleted successfully");
    } catch (error) {
      message.error("Failed to delete warehouse");
    }
  };

  const handleUpdateWarehouseDays = async () => {
    try {
      await updateWarehouseDays();
      message.success("Warehouse days updated successfully");
    } catch (error) {
      message.error("Failed to update warehouse days");
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
      title: 'Contact',
      key: 'contact',
      render: (_: any, record: Warehouse) => (
        <div>
          {record.contactPerson && <div>{record.contactPerson}</div>}
          {record.contactEmail && <div style={{ fontSize: '12px', color: '#666' }}>{record.contactEmail}</div>}
          {record.contactPhone && <div style={{ fontSize: '12px', color: '#666' }}>{record.contactPhone}</div>}
        </div>
      ),
    },
    {
      title: 'Capacity',
      dataIndex: 'capacity',
      key: 'capacity',
      render: (capacity: number) => capacity ? `${capacity} units` : 'N/A',
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
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Warehouse Management</h1>
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setIsCreateModalVisible(true)}
              >
                Add Warehouse
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleUpdateWarehouseDays}
                loading={isUpdatingDays}
              >
                Update Days
              </Button>
            </Space>
          </div>

          {/* Aging Summary */}
          {agingSummary?.data && (
            <Card className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Aging Summary</h3>
              <Row gutter={16}>
                {agingSummary.data.map((summary) => (
                  <Col key={summary.location} span={6}>
                    <Card size="small">
                      <Statistic
                        title={`Location ${summary.location}`}
                        value={summary.totalPackages}
                        prefix={<WarningOutlined />}
                      />
                      <div className="mt-2 space-y-1">
                        <div className="text-xs">0-7 days: {summary.agingBuckets['0-7']}</div>
                        <div className="text-xs">8-14 days: {summary.agingBuckets['8-14']}</div>
                        <div className="text-xs">15-30 days: {summary.agingBuckets['15-30']}</div>
                        <div className="text-xs">31+ days: {summary.agingBuckets['31+']}</div>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card>
          )}

          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            <TabPane tab="Packages in Warehouse" key="1">
              <Space wrap className="mb-4">
                <Input.Search
                  placeholder="Search Tracking # / Customer"
                  allowClear
                  onSearch={(v) => setPackageFilters(prev => ({ ...prev, search: v, page: 1 }))}
                  style={{ width: 220 }}
                />
                <Select
                  placeholder="Location"
                  allowClear
                  style={{ width: 140 }}
                  onChange={(v) => setPackageFilters(prev => ({ ...prev, warehouseLocation: v, page: 1 }))}
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

            <TabPane tab="Warehouse Locations" key="2">
              <Table
                columns={warehouseColumns}
                dataSource={warehousesData?.data || []}
                rowKey="id"
                loading={warehousesLoading}
                pagination={{
                  current: warehousesPage,
                  pageSize: warehousesLimit,
                  total: warehousesData?.meta?.totalItems || 0,
                  showSizeChanger: true,
                  onChange: (page, size) => {
                    setWarehousesPage(page);
                  },
                }}
                locale={{ emptyText: <Empty description="No warehouses found" /> }}
                scroll={{ x: true }}
              />
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

              <Form.Item name="contactPerson" label="Contact Person">
                <Input placeholder="e.g., John Doe" />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="contactEmail" label="Contact Email">
                    <Input type="email" placeholder="john.doe@example.com" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="contactPhone" label="Contact Phone">
                    <Input placeholder="+233 XXX XXX XXX" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="capacity" label="Capacity (optional)">
                <Input type="number" placeholder="1000" />
              </Form.Item>

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

              <Form.Item name="contactPerson" label="Contact Person">
                <Input placeholder="e.g., John Doe" />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="contactEmail" label="Contact Email">
                    <Input type="email" placeholder="john.doe@example.com" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="contactPhone" label="Contact Phone">
                    <Input placeholder="+233 XXX XXX XXX" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="capacity" label="Capacity (optional)">
                <Input type="number" placeholder="1000" />
              </Form.Item>

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
