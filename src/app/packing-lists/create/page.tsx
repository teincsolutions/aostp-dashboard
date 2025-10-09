"use client";

import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  Card,
  Steps,
  message,
  Table,
  Space,
  Select,
  DatePicker,
  Modal,
  InputNumber,
  Row,
  Col,
  Typography,
  Alert,
  Spin,
  Popconfirm,
} from "antd";
import {
  LeftOutlined,
  RightOutlined,
  CheckOutlined,
  PlusOutlined,
  MinusOutlined,
} from "@ant-design/icons";
import { AppLayout } from "@/components/AppLayout";
import { AuthGuard } from "@/components/AuthGuard";
import {
  usePackingListMutations,
  usePackingList,
} from "@/hooks/usePackingLists";
import { useActiveContainers, useContainers } from "@/hooks/useContainers";
import { useUnassignedPackages } from "@/hooks/usePackingLists";
import { useShippingRates } from "@/hooks/useShippingRates";
import {
  PackingListCreatePayload,
  PackageAssignment,
} from "@/types/packingList";
import { PackageIntake, ShipmentType } from "@/types/package";
import { ContainerCreatePayload } from "@/types/container";
import { useRouter } from "next/navigation";
import { ShippingMode } from "@/types/exchangeRate";
import dayjs, { Dayjs } from "dayjs";
import { ContainerType } from "@/types/container";
import { Role } from "@/types/user";

const { Title, Text } = Typography;
const { Option } = Select;
const { Step } = Steps;

type PackageAssignmentWithCalc = PackageAssignment & {
  rate?: number;
  calculatedAmount?: number;
  currency?: string;
  unitType?: string; // 'CBM' or 'KG'
};

const PackingListCreatePage: React.FC = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [packingListData, setPackingListData] = useState<Partial<PackingListCreatePayload>>({});
  const [selectedPackageIds, setSelectedPackageIds] = useState<string[]>([]);
  const [packageAssignments, setPackageAssignments] = useState<PackageAssignmentWithCalc[]>([]);
  const [containerModalVisible, setContainerModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  // Forms
  const [basicInfoForm] = Form.useForm();
  const [containerForm] = Form.useForm();

  // React Query hooks
  const { data: activeContainers = [] } = useActiveContainers();

  // Determine container type based on selected packages shipping mode
  const selectedShippingModes = packageAssignments.map(pkg =>
    unassignedPackages?.data?.find(p => p.id === pkg.packageId)?.shippingMode
  ).filter(Boolean);

  const containerType = selectedShippingModes.length > 0
    ? (selectedShippingModes.every(mode => mode === "SEA") ? "CONTAINER"
       : selectedShippingModes.every(mode => mode === "AIR") ? "BAG"
       : undefined) // Mixed modes - show all containers
    : undefined; // No packages selected

  // Filter containers based on selected packages
  const filteredContainers = activeContainers.filter(container => {
    if (!containerType) return true; // Show all if no container type determined
    return container.containerType === containerType;
  });
  const { data: unassignedPackages, isLoading: packagesLoading } = useUnassignedPackages({
    search: "",
    page: 1,
    limit: 1000,
  });
  const { activeRates: shippingRates = [] } = useShippingRates();

  const {
    createPackingList,
    finalizePackingList,
    addPackagesToPackingList,
    isCreating,
    isFinalizing,
  } = usePackingListMutations();

  // Filter unassigned packages
  const availablePackages: PackageIntake[] = unassignedPackages?.data?.filter(pkg =>
    !selectedPackageIds.includes(pkg.id)
  ) || [];

  // Calculate package assignments with shipping rates
  useEffect(() => {
    if (selectedPackageIds.length > 0 && shippingRates.length > 0) {
      const assignments: PackageAssignmentWithCalc[] = selectedPackageIds.map(id => {
        const pkg = unassignedPackages?.data?.find(p => p.id === id);
        if (!pkg) return null;

        // Find appropriate rate based on shipping mode and type
        const rate = shippingRates.find(r => {
          if (pkg.shippingMode === r.shippingMode) {
            if (r.shippingMode === ShippingMode.AIR) {
              return r.airShippingType === pkg.airShippingType;
            }
            return true; // SEA mode matches all
          }
          return false;
        });

        let calculatedAmount = 0;
        let unitType = 'CBM';
        let rateValue = 0;

        if (rate) {
          rateValue = rate.rate;
          if (rate.shippingMode === ShippingMode.SEA) {
            // SEA: CBM × Rate
            calculatedAmount = pkg.cbm * rate.rate;
          } else {
            // AIR: Weight × Rate
            calculatedAmount = pkg.weight * rate.rate;
            unitType = 'KG';
          }
        }

        return {
          packageId: pkg.id,
          trackingCode: pkg.trackingCode,
          description: pkg.description || '',
          weight: pkg.weight,
          cbm: pkg.cbm,
          customerId: pkg.customerId,
          customerName: `${pkg.customer?.firstName} ${pkg.customer?.lastName}`,
          rate: rateValue,
          calculatedAmount,
          currency: rate?.currency || 'USD',
          unitType,
        };
      }).filter(Boolean) as PackageAssignmentWithCalc[];

      setPackageAssignments(assignments);
    } else {
      setPackageAssignments([]);
    }
  }, [selectedPackageIds, shippingRates, unassignedPackages?.data]);

  // Totals calculation
  const totals = packageAssignments.reduce(
    (acc, pkg) => ({
      usdTotal: acc.usdTotal + (pkg.currency === 'USD' ? pkg.calculatedAmount || 0 : 0),
      ghsTotal: acc.ghsTotal + (pkg.currency === 'GHS' ? pkg.calculatedAmount || 0 : 0),
      weightTotal: acc.weightTotal + pkg.weight,
      cbmTotal: acc.cbmTotal + pkg.cbm,
    }),
    { usdTotal: 0, ghsTotal: 0, weightTotal: 0, cbmTotal: 0 }
  );

  // Step handlers
  const handleNext = async () => {
    if (currentStep === 0) {
      // Validate basic info
      try {
        const values = await basicInfoForm.validateFields();
        setPackingListData(prev => ({ ...prev, ...values }));
        setCurrentStep(1);
      } catch (error) {
        return;
      }
    } else if (currentStep === 1) {
      // Validate package assignment
      if (selectedPackageIds.length === 0) {
        message.error("Please select at least one package");
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      // Container selection is optional, proceed to finalize
      setCurrentStep(3);
    }
  };

  const handlePrev = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleStepClick = (step: number) => {
    // Allow going back to previous steps
    if (step < currentStep) {
      setCurrentStep(step);
    }
  };

  // Package selection handlers
  const handleAddPackage = (packageId: string) => {
    if (!selectedPackageIds.includes(packageId)) {
      setSelectedPackageIds(prev => [...prev, packageId]);
    }
  };

  const handleRemovePackage = (packageId: string) => {
    setSelectedPackageIds(prev => prev.filter(id => id !== packageId));
  };

  // Container creation - TODO: Implement when container creation API is available
  const handleCreateContainer = async (values: ContainerCreatePayload) => {
    message.info("Container creation is not yet implemented");
    setContainerModalVisible(false);
    containerForm.resetFields();
  };

  // Finalize packing list creation
  const handleFinalize = async () => {
    try {
      setLoading(true);

      // Create the packing list first
      const createPayload: PackingListCreatePayload = {
        ...packingListData,
        loadingDate: dayjs(packingListData.loadingDate).format('YYYY-MM-DD'),
        eta: packingListData.eta ? dayjs(packingListData.eta).format('YYYY-MM-DD') : undefined,
        packageIds: selectedPackageIds,
      } as PackingListCreatePayload;

      const result = await createPackingList.mutateAsync(createPayload);
      const packingListId = result.data.id;

      // Finalize packing list (generates invoices without FX conversion per UC12)
      await finalizePackingList.mutateAsync(packingListId);

      message.success("Packing list created and invoices generated successfully");
      router.push('/packing-lists');

    } catch (error: any) {
      message.error(error.response?.data?.message || "Failed to finalize packing list");
    } finally {
      setLoading(false);
    }
  };

  // Package table columns for available packages
  const packageColumns = [
    {
      title: "Tracking Code",
      dataIndex: "trackingCode",
      key: "trackingCode",
    },
    {
      title: "Customer",
      dataIndex: "customer",
      key: "customer",
      render: (customer: any) => `${customer.firstName} ${customer.lastName}`,
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "Weight (kg)",
      dataIndex: "weight",
      key: "weight",
    },
    {
      title: "CBM",
      dataIndex: "cbm",
      key: "cbm",
    },
    {
      title: "Mode",
      dataIndex: "shippingMode",
      key: "shippingMode",
      render: (mode: string) => mode,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: PackageIntake) => (
        <Button
          type="link"
          icon={<PlusOutlined />}
          onClick={() => handleAddPackage(record.id)}
          disabled={selectedPackageIds.includes(record.id)}
        >
          Add
        </Button>
      ),
    },
  ];

  // Selected packages table columns
  const selectedPackageColumns = [
    {
      title: "Tracking Code",
      dataIndex: "trackingCode",
      key: "trackingCode",
    },
    {
      title: "Customer",
      dataIndex: "customerName",
      key: "customerName",
    },
    {
      title: "Weight (kg)",
      dataIndex: "weight",
      key: "weight",
      render: (weight: number) => weight.toFixed(2),
    },
    {
      title: "CBM",
      dataIndex: "cbm",
      key: "cbm",
      render: (cbm: number) => cbm.toFixed(3),
    },
    {
      title: "Unit Type",
      dataIndex: "unitType",
      key: "unitType",
    },
    {
      title: "Rate",
      dataIndex: "rate",
      key: "rate",
      render: (rate: number, record: PackageAssignmentWithCalc) =>
        `${record.currency} ${rate?.toFixed(2) || 0}`,
    },
    {
      title: "Amount",
      dataIndex: "calculatedAmount",
      key: "calculatedAmount",
      render: (amount: number, record: PackageAssignmentWithCalc) =>
        `${record.currency} ${amount?.toFixed(2) || 0}`,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: PackageAssignmentWithCalc) => (
        <Button
          type="link"
          danger
          icon={<MinusOutlined />}
          onClick={() => handleRemovePackage(record.packageId)}
        >
          Remove
        </Button>
      ),
    },
  ];

  const containerColumns = [
    {
      title: "Container Number",
      dataIndex: "containerNumber",
      key: "containerNumber",
    },
    {
      title: "Destination City",
      dataIndex: "destinationCity",
      key: "destinationCity",
    },
    {
      title: "Loading Date",
      dataIndex: "loadingDate",
      key: "loadingDate",
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
    },
  ];

  return (
    <AuthGuard requiredRoles={[Role.OPERATIONS_CLERK, Role.FINANCE_MANAGER, Role.SUPER_ADMIN]}>
      <AppLayout>
        <div className="p-6 max-w-6xl mx-auto">
          <div className="mb-6">
            <Title level={2}>Create New Packing List</Title>
            <Text type="secondary">Complete the steps below to create a new packing list</Text>
          </div>

          <Card className="mb-6">
            <Steps current={currentStep} onChange={handleStepClick}>
              <Step title="Basic Information" description="Packing list details" />
              <Step title="Package Assignment" description="Select and assign packages" />
              <Step title="Container Selection" description="Choose container (optional)" />
              <Step title="Finalize" description="Review and generate invoices" />
            </Steps>
          </Card>

          {/* Step Content */}
          <Card>
            {currentStep === 0 && (
              // Step 1: Basic Information
              <Form
                form={basicInfoForm}
                layout="vertical"
                initialValues={{
                  loadingDate: dayjs(),
                }}
              >
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="name"
                      label="Packing List Name"
                      rules={[{ required: true, message: "Please enter packing list name" }]}
                    >
                      <Input placeholder="e.g., PL-2025-001" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="loadingCity"
                      label="Loading City"
                      rules={[{ required: true, message: "Please enter loading city" }]}
                    >
                      <Input placeholder="e.g., Accra, Tema" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item
                      name="loadingDate"
                      label="Loading Date"
                      rules={[{ required: true, message: "Please select loading date" }]}
                    >
                      <DatePicker className="w-full" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="eta" label="Estimated Time of Arrival">
                      <DatePicker className="w-full" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="notes" label="Notes">
                      <Input.TextArea rows={1} />
                    </Form.Item>
                  </Col>
                </Row>
              </Form>
            )}

            {currentStep === 1 && (
              // Step 2: Package Assignment
              <div className="space-y-4">
                {/* Package Selection with Search/Filter */}
                <div>
                  <Title level={4}>Available Packages</Title>
                  <Table
                    columns={packageColumns}
                    dataSource={availablePackages}
                    loading={packagesLoading}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                    size="small"
                  />
                </div>

                {/* Selected Packages */}
                <div>
                  <Title level={4}>Selected Packages ({packageAssignments.length})</Title>
                  <Table
                    columns={selectedPackageColumns}
                    dataSource={packageAssignments}
                    rowKey="packageId"
                    pagination={false}
                    size="small"
                    summary={() => (
                      <Table.Summary.Row>
                        <Table.Summary.Cell index={0} colSpan={3}>
                          <Text strong>Totals</Text>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={1}>
                          <Text strong>{totals.weightTotal.toFixed(2)} kg</Text>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={2}>
                          <Text strong>{totals.cbmTotal.toFixed(3)}</Text>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={3} colSpan={4}>
                          <Space>
                            <Text strong>USD: ${totals.usdTotal.toFixed(2)}</Text>
                            <Text strong>GHS: ₵{totals.ghsTotal.toFixed(2)}</Text>
                          </Space>
                        </Table.Summary.Cell>
                      </Table.Summary.Row>
                    )}
                  />
                </div>

                {packageAssignments.some(p => !p.rate) && (
                  <Alert
                    message="Warning"
                    description="Some packages don't have matching shipping rates. Please check shipping rates configuration."
                    type="warning"
                    showIcon
                  />
                )}
              </div>
            )}

            {currentStep === 2 && (
              // Step 3: Container Selection
              <div className="space-y-4">
                <Title level={4}>Container Selection</Title>

                {containerType && (
                  <Alert
                    message={`Showing ${containerType === 'CONTAINER' ? 'Sea freight containers' : 'Air freight bags'} only`}
                    description={`Based on selected packages (${selectedShippingModes.length} ${selectedShippingModes.length === 1 ? 'package uses' : 'packages use'} ${containerType === 'CONTAINER' ? 'sea freight' : 'air freight'})`}
                    type="info"
                    showIcon
                    className="mb-4"
                  />
                )}

                {!containerType && selectedPackageIds.length > 0 && (
                  <Alert
                    message="Mixed shipping modes detected"
                    description="Packages with different shipping modes selected. All containers are shown."
                    type="warning"
                    showIcon
                    className="mb-4"
                  />
                )}

                <Form
                  layout="vertical"
                  onFinish={(values) => {
                    setPackingListData(prev => ({ ...prev, containerId: values.containerId }));
                    message.success("Container selected");
                  }}
                >
                  <Row gutter={16}>
                    <Col span={18}>
                      <Form.Item name="containerId" label={`Select Container ${filteredContainers.length === 0 ? '(No containers available)' : `(${filteredContainers.length} available)`}`}>
                        <Select
                          placeholder="Choose a container"
                          allowClear
                          showSearch
                          disabled={filteredContainers.length === 0}
                          filterOption={(input, option) =>
                            (option?.children?.toString() ?? "").toLowerCase().includes(input.toLowerCase())
                          }
                        >
                          {filteredContainers.map((container) => (
                            <Option key={container.id} value={container.id}>
                              {container.containerNumber} - {container.destinationCity} ({container.containerType})
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Button
                        type="default"
                        icon={<PlusOutlined />}
                        onClick={() => setContainerModalVisible(true)}
                        className="mt-8"
                      >
                        Create New
                      </Button>
                    </Col>
                  </Row>
                  <Button type="primary" htmlType="submit">
                    Save Container Selection
                  </Button>
                </Form>

                <Text type="secondary" className="block mt-4">
                  Note: Container selection is optional. You can proceed without selecting a container.
                </Text>
              </div>
            )}

            {currentStep === 3 && (
              // Step 4: Finalize
              <div className="space-y-4">
                <Title level={4}>Review & Finalize</Title>

                <Card size="small" title="Basic Information">
                  <Row gutter={16}>
                    <Col span={12}>
                      <Text strong>Name:</Text> {packingListData.name}
                    </Col>
                    <Col span={12}>
                      <Text strong>Loading City:</Text> {packingListData.loadingCity}
                    </Col>
                  </Row>
                  <Row gutter={16} className="mt-2">
                    <Col span={12}>
                      <Text strong>Loading Date:</Text>{" "}
                      {packingListData.loadingDate
                        ? dayjs(packingListData.loadingDate).format("DD/MM/YYYY")
                        : "N/A"}
                    </Col>
                    <Col span={12}>
                      <Text strong>ETA:</Text>{" "}
                      {packingListData.eta
                        ? dayjs(packingListData.eta).format("DD/MM/YYYY")
                        : "N/A"}
                    </Col>
                  </Row>
                </Card>

                <Card size="small" title="Summary">
                  <Row gutter={16}>
                    <Col span={6}>
                      <Text strong>Packages:</Text> {packageAssignments.length}
                    </Col>
                    <Col span={6}>
                      <Text strong>Total Weight:</Text> {totals.weightTotal.toFixed(2)} kg
                    </Col>
                    <Col span={6}>
                      <Text strong>Total CBM:</Text> {totals.cbmTotal.toFixed(3)}
                    </Col>
                    <Col span={6}>
                      <Text strong>Total Value:</Text> ${totals.usdTotal.toFixed(2)}
                    </Col>
                  </Row>
                </Card>

                <Alert
                  message="Important"
                  description="Finalizing will create the packing list and generate invoices for all selected packages without currency conversion (per UC12)."
                  type="info"
                  showIcon
                />

                <div className="border-t pt-4 mt-6">
                  <Space>
                    <Popconfirm
                      title="Are you sure you want to finalize this packing list?"
                      description="This will create the packing list and generate invoices."
                      onConfirm={handleFinalize}
                      okText="Yes, Finalize"
                      cancelText="Cancel"
                    >
                      <Button
                        type="primary"
                        size="large"
                        loading={loading}
                        disabled={selectedPackageIds.length === 0}
                      >
                        Finalize Packing List
                      </Button>
                    </Popconfirm>
                  </Space>
                </div>
              </div>
            )}
          </Card>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-6">
            <Button
              disabled={currentStep === 0}
              onClick={handlePrev}
              icon={<LeftOutlined />}
            >
              Previous
            </Button>

            {currentStep < 3 ? (
              <Button
                type="primary"
                onClick={handleNext}
                disabled={
                  currentStep === 1 && selectedPackageIds.length === 0
                }
                icon={<RightOutlined />}
                iconPosition="end"
              >
                Next
              </Button>
            ) : null}
          </div>

          {/* Container Creation Modal */}
          <Modal
            title="Create New Container"
            open={containerModalVisible}
            onCancel={() => setContainerModalVisible(false)}
            footer={null}
            width={600}
          >
            <Form
              form={containerForm}
              layout="vertical"
              onFinish={handleCreateContainer}
              initialValues={{
                containerType: containerType || ContainerType.CONTAINER,
                status: 'PLANNED',
              }}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="containerNumber"
                    label="Container Number"
                    rules={[{ required: true }]}
                  >
                    <Input placeholder="e.g., MSCU123456" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="containerType"
                    label="Container Type"
                    rules={[{ required: true }]}
                  >
                    <Select>
                      <Option value={ContainerType.CONTAINER}>Container (Sea Freight)</Option>
                      <Option value={ContainerType.BAG}>Bag (Air Freight)</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="departureCity"
                    label="Departure City"
                    rules={[{ required: true }]}
                  >
                    <Input placeholder="e.g., Accra" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="destinationCity"
                    label="Destination City"
                    rules={[{ required: true }]}
                  >
                    <Input placeholder="e.g., London" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="loadingDate"
                    label="Loading Date"
                    rules={[{ required: true }]}
                  >
                    <DatePicker className="w-full" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="eta"
                    label="Estimated Time of Arrival"
                    rules={[{ required: true }]}
                  >
                    <DatePicker className="w-full" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="vesselFlight" label="Vessel/Flight Number">
                    <Input placeholder="e.g., MSC ALTA or EK 787" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="status" label="Status">
                    <Select>
                      <Option value="PLANNED">Planned</Option>
                      <Option value="LOADED">Loaded</Option>
                      <Option value="SHIPPED">Shipped</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="notes" label="Notes">
                <Input.TextArea rows={2} />
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit" loading={isCreating}>
                    Create Container
                  </Button>
                  <Button onClick={() => setContainerModalVisible(false)}>
                    Cancel
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Modal>
        </div>
      </AppLayout>
    </AuthGuard>
  );
};

export default PackingListCreatePage;
