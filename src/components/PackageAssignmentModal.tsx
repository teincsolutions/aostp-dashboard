import React, { useState, useEffect, useMemo } from "react";
import {
  Modal,
  Table,
  Button,
  Alert,
  Space,
  Typography,
  Row,
  Col,
} from "antd";
import { PlusOutlined, MinusOutlined } from "@ant-design/icons";
import { Package } from "@/types/package";
import { ShippingMode } from "@/types/exchangeRate";

const { Text } = Typography;

interface PackageAssignment {
  packageId: string;
  trackingCode: string;
  description: string;
  weight: number;
  cbm: number;
  customerId?: string;
  customerName: string;
  rate?: number;
  calculatedAmount?: number;
  currency?: string;
  unitType?: string;
}

interface PackageAssignmentModalProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: (selectedPackageIds: string[]) => void;
  title: string;
  initialSelectedPackageIds?: string[];
  loading?: boolean;
  confirmButtonText?: string;
  assignedPackageIds?: string[]; // Packages already assigned to the packing list
  unassignedPackages?: { data?: Package[] };
  shippingRates?: any[];
  packagesLoading?: boolean;
}

export const PackageAssignmentModal: React.FC<PackageAssignmentModalProps> = ({
  visible,
  onCancel,
  onConfirm,
  title,
  initialSelectedPackageIds = [],
  loading = false,
  confirmButtonText = "Add Selected Packages",
  assignedPackageIds = [],
  unassignedPackages = {},
  shippingRates = [],
  packagesLoading = false,
}) => {
  const [selectedPackageIds, setSelectedPackageIds] = useState<string[]>(
    initialSelectedPackageIds
  );
  const [packageAssignments, setPackageAssignments] = useState<
    PackageAssignment[]
  >([]);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setSelectedPackageIds(initialSelectedPackageIds);
    }
  }, [visible]);

  // Memoize available packages to prevent unnecessary recalculations
  const availablePackages = useMemo(() => {
    return unassignedPackages?.data?.filter(
      (pkg) =>
        !selectedPackageIds.includes(pkg.id) &&
        !assignedPackageIds.includes(pkg.id)
    ) || [];
  }, [unassignedPackages?.data, selectedPackageIds, assignedPackageIds]);

  // Selected packages (already assigned + newly selected)
  const selectedPackages = useMemo(() => {
    return [
      ...(unassignedPackages?.data?.filter((pkg) =>
        selectedPackageIds.includes(pkg.id)
      ) || []),
      // Add packages already assigned but filter out if they exist in unassigned
    ].filter(
      (pkg, index, self) => self.findIndex((p) => p.id === pkg.id) === index
    );
  }, [unassignedPackages?.data, selectedPackageIds]);

  // Calculate package assignments with shipping rates
  useEffect(() => {
    if (selectedPackageIds.length > 0 && unassignedPackages?.data) {
      const assignments: PackageAssignment[] = unassignedPackages.data
        .filter((pkg) => selectedPackageIds.includes(pkg.id))
        .map((pkg) => {
          // Find appropriate rate based on shipping mode and type
          const rate = shippingRates.find((r) => {
            if (pkg.shippingMode === r.shippingMode) {
              if (r.shippingMode === ShippingMode.AIR) {
                return r.airShippingType === pkg.airShippingType;
              }
              return true; // SEA mode matches all
            }
            return false;
          });

          let calculatedAmount = 0;
          let unitType = "CBM";
          let rateValue = 0;

          if (rate) {
            rateValue = rate.rate;
            if (rate.shippingMode === ShippingMode.SEA) {
              // SEA: CBM × Rate
              calculatedAmount = pkg.cbm * rate.rate;
            } else {
              // AIR: Weight × Rate
              calculatedAmount = pkg.weight * rate.rate;
              unitType = "KG";
            }
          }

          return {
            packageId: pkg.id,
            trackingCode: pkg.trackingCode,
            description: pkg.description || "",
            weight: pkg.weight,
            cbm: pkg.cbm,
            customerId: pkg.customerId,
            customerName: `${pkg.customer?.firstName} ${pkg.customer?.lastName}`,
            rate: rateValue,
            calculatedAmount,
            currency: rate?.currency || "USD",
            unitType,
          };
        });

      setPackageAssignments(assignments);
    } else {
      setPackageAssignments([]);
    }
  }, [unassignedPackages?.data, shippingRates, selectedPackageIds]);

  // Totals calculation
  const totals = packageAssignments.reduce(
    (acc, pkg) => ({
      usdTotal:
        acc.usdTotal + (pkg.currency === "USD" ? pkg.calculatedAmount || 0 : 0),
      ghsTotal:
        acc.ghsTotal + (pkg.currency === "GHS" ? pkg.calculatedAmount || 0 : 0),
      weightTotal: acc.weightTotal + pkg.weight,
      cbmTotal: acc.cbmTotal + pkg.cbm,
      packageCount: acc.packageCount + 1,
    }),
    { usdTotal: 0, ghsTotal: 0, weightTotal: 0, cbmTotal: 0, packageCount: 0 }
  );

  const handleAddPackage = (packageId: string) => {
    if (!selectedPackageIds.includes(packageId)) {
      setSelectedPackageIds((prev) => [...prev, packageId]);
    }
  };

  const handleRemovePackage = (packageId: string) => {
    setSelectedPackageIds((prev) => prev.filter((id) => id !== packageId));
  };

  const handleConfirm = () => {
    onConfirm(selectedPackageIds);
  };

  // Package table columns for available packages
  const availablePackageColumns = [
    {
      title: "Tracking Code",
      dataIndex: "trackingCode",
      key: "trackingCode",
      width: 120,
    },
    {
      title: "Customer",
      dataIndex: "customer",
      key: "customer",
      render: (customer: any) =>
        customer ? `${customer.firstName} ${customer.lastName}` : "N/A",
      width: 150,
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      width: 200,
    },
    {
      title: "Weight (kg)",
      dataIndex: "weight",
      key: "weight",
      width: 100,
      render: (weight: number) => weight ? weight.toFixed(2) : "0.00",
    },
    {
      title: "CBM",
      dataIndex: "cbm",
      key: "cbm",
      width: 80,
      render: (cbm: number) => cbm ? cbm.toFixed(3) : "0.000",
    },
    {
      title: "Mode",
      dataIndex: "shippingMode",
      key: "shippingMode",
      width: 80,
      render: (mode: string) => mode,
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      render: (_: any, record: Package) => (
        <Button
          type="link"
          icon={<PlusOutlined />}
          onClick={() => handleAddPackage(record.id)}
          size="small"
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
      width: 120,
    },
    {
      title: "Customer",
      dataIndex: "customerName",
      key: "customerName",
      width: 150,
    },
    {
      title: "Weight (kg)",
      dataIndex: "weight",
      key: "weight",
      render: (weight: number) => weight ? weight.toFixed(2) : "0.00",
      width: 100,
    },
    {
      title: "CBM",
      dataIndex: "cbm",
      key: "cbm",
      render: (cbm: number) => cbm ? cbm.toFixed(3) : "0.000",
      width: 80,
    },
    {
      title: "Unit",
      dataIndex: "unitType",
      key: "unitType",
      width: 60,
    },
    {
      title: "Rate",
      dataIndex: "rate",
      key: "rate",
      width: 100,
      render: (rate: number, record: PackageAssignment) =>
        rate ? `${record.currency} ${rate.toFixed(2)}` : "No rate",
    },
    {
      title: "Amount",
      dataIndex: "calculatedAmount",
      key: "calculatedAmount",
      width: 100,
      render: (amount: number, record: PackageAssignment) =>
        amount ? `${record.currency} ${amount.toFixed(2)}` : "0.00",
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      render: (_: any, record: PackageAssignment) => (
        <Button
          type="link"
          danger
          icon={<MinusOutlined />}
          onClick={() => handleRemovePackage(record.packageId)}
          size="small"
        >
          Remove
        </Button>
      ),
    },
  ];

  return (
    <Modal
      title={title}
      open={visible}
      onCancel={onCancel}
      width={1400}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button
          key="confirm"
          type="primary"
          onClick={handleConfirm}
          loading={loading}
          disabled={selectedPackageIds.length === 0}
        >
          {confirmButtonText} ({selectedPackageIds.length})
        </Button>,
      ]}
    >
      <div className="space-y-4">
        {selectedPackageIds.length > 0 && (
          <Alert
            message="Selected Packages Summary"
            description={
              <Row gutter={16}>
                <Col span={4}>
                  <Text strong>Packages:</Text> {totals.packageCount}
                </Col>
                <Col span={4}>
                  <Text strong>Total Weight:</Text> {totals.weightTotal.toFixed(2)} kg
                </Col>
                <Col span={4}>
                  <Text strong>Total CBM:</Text> {totals.cbmTotal.toFixed(3)}
                </Col>
                <Col span={6}>
                  <Space>
                    {totals.usdTotal > 0 && (
                      <Text strong>USD: ${totals.usdTotal.toFixed(2)}</Text>
                    )}
                    {totals.ghsTotal > 0 && (
                      <Text strong>GHS: ₵{totals.ghsTotal.toFixed(2)}</Text>
                    )}
                  </Space>
                </Col>
              </Row>
            }
            type="info"
            showIcon
          />
        )}

        <div className="grid grid-cols-1 gap-6">
          {/* Available Packages */}
          <div>
            <Text strong className="text-lg mb-2 block">
              Available Packages ({availablePackages.length})
            </Text>
            <Table
              columns={availablePackageColumns}
              dataSource={availablePackages}
              loading={packagesLoading}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: false,
                showQuickJumper: false,
              }}
              scroll={{ y: 400 }}
              size="small"
            />
          </div>

          {/* Selected Packages */}
          <div>
            <Text strong className="text-lg mb-2 block">
              Selected Packages ({packageAssignments.length})
            </Text>
            <Table
              columns={selectedPackageColumns}
              dataSource={packageAssignments}
              rowKey="packageId"
              pagination={false}
              scroll={{ y: 400 }}
              size="small"
              summary={() => (
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={2}>
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
                      {totals.usdTotal > 0 && (
                        <Text strong>USD: ${totals.usdTotal.toFixed(2)}</Text>
                      )}
                      {totals.ghsTotal > 0 && (
                        <Text strong>GHS: ₵{totals.ghsTotal.toFixed(2)}</Text>
                      )}
                    </Space>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              )}
            />
          </div>
        </div>

        {packageAssignments.some((p) => !p.rate) && (
          <Alert
            message="Warning"
            description="Some packages don't have matching shipping rates. Please check shipping rates configuration."
            type="warning"
            showIcon
          />
        )}
      </div>
    </Modal>
  );
};
