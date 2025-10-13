import React, { useMemo, useState } from "react";
import { Table, Button, Alert, Space, Typography, Row, Col } from "antd";
import { PlusOutlined, MinusOutlined } from "@ant-design/icons";
import { Package } from "@/types/package";
import { ShippingMode } from "@/types/exchangeRate";
import {
  useUnassignedPackages,
} from "@/hooks/usePackingLists";
import { useShippingRates } from "@/hooks/useShippingRates";
import { Customer } from "@/types/customer";
import {
  getPackageWithCalculations,
  getPacklistTotals,
  PackageWithCalculations,
} from "@/utils/forms/getPacklistTotals";
import { PackingList, PackingListStatus } from "@/types/packingList";
import { useExchangeRate } from "@/hooks/useExchangeRate";

const { Text } = Typography;


interface PackageAssignmentProps {
  packingList?: PackingList;
  selectedPackageIds: string[];
  handleAddPackage: (id: string) => void;
  handleRemovePackage: (id: string) => void;
  isRemovingPackages: boolean;
}
const containerTypeMap = {
  CONTAINER: ShippingMode.SEA,
  BAG: ShippingMode.AIR,
};

export const PackageAssignmentPanel: React.FC<PackageAssignmentProps> = ({
  packingList,
  selectedPackageIds,
  handleAddPackage,
  handleRemovePackage,
  isRemovingPackages,
}) => {
  const [unassignedPage, setUnassignedPage] = useState(1);

  const { data: paginatedUnassignedPackages } = useUnassignedPackages({
    page: unassignedPage,
    shippingMode:
      containerTypeMap[packingList?.container?.containerType || "BAG"],
  });
  const { useCurrentActiveRates } = useShippingRates();
  const { activeRate } = useExchangeRate();

  const shippingMode =
    containerTypeMap[packingList?.container?.containerType || "BAG"];
  // Get current shipping rate for calculations
  const { data: currentShippingRates } = useCurrentActiveRates(shippingMode);

  const selectedPackages = useMemo(() => {
    const filteredPackages =
      paginatedUnassignedPackages?.filter((pkg) =>
        selectedPackageIds.includes(pkg.id)
      ) || [];

    // Add calculations for each package
    return filteredPackages.map((pkg) => {
      return getPackageWithCalculations(
        pkg,
        shippingMode,
        currentShippingRates || []
      );
    });
  }, [
    paginatedUnassignedPackages,
    selectedPackageIds,
    currentShippingRates,
    shippingMode,
  ]);

  // Calculate totals for selected packages
  const totals = getPacklistTotals(packingList, currentShippingRates, activeRate?.rate);

  // Assigned packages table columns
  const assignedPackageColumns = [
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
      render: (customer: Customer) =>
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
      render: (weight: number) => (weight ? weight.toFixed(2) : "0.00"),
    },
    {
      title: "CBM",
      dataIndex: "cbm",
      key: "cbm",
      width: 80,
      render: (cbm: number) => (cbm ? cbm.toFixed(3) : "0.000"),
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
          danger
          icon={<MinusOutlined />}
          loading={isRemovingPackages}
          onClick={() => handleRemovePackage(record.id)}
          disabled={packingList?.status === PackingListStatus.FINALIZED}
          size="small"
        >
          Remove
        </Button>
      ),
    },
  ];

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
      render: (weight: number) => (weight ? weight.toFixed(2) : "0.00"),
    },
    {
      title: "CBM",
      dataIndex: "cbm",
      key: "cbm",
      width: 80,
      render: (cbm: number) => (cbm ? cbm.toFixed(3) : "0.000"),
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
      width: 120,
    },
    {
      title: "Customer",
      dataIndex: "customer",
      key: "customer",
      render: (customer: Customer) =>
        customer ? `${customer.firstName} ${customer.lastName}` : "N/A",
      width: 150,
    },
    {
      title: "Weight (kg)",
      dataIndex: "weight",
      key: "weight",
      render: (weight: number) => (weight ? weight.toFixed(2) : "N/A"),
      width: 100,
    },
    {
      title: "CBM",
      dataIndex: "cbm",
      key: "cbm",
      render: (cbm: number) => (cbm ? cbm.toFixed(3) : "N/A"),
      width: 80,
    },
    {
      title: "Qty",
      dataIndex: "quantity",
      key: "quantity",
      width: 60,
    },
    {
      title: "Rate",
      dataIndex: "ratePerUnit",
      key: "ratePerUnit",
      width: 100,
      render: (rate: number, record: Package) =>
        rate ? `${rate.toFixed(2)}` : "No rate",
    },
    {
      title: "Amount",
      dataIndex: "calculatedAmount",
      key: "calculatedAmount",
      width: 100,
      render: (amount: number, record: Package) =>
        amount ? `${amount.toFixed(2)}` : "0.00",
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      render: (_: any, record: Package) => (
        <Button
          type="link"
          danger
          icon={<MinusOutlined />}
          onClick={() => handleRemovePackage(record.id)}
          size="small"
        >
          Remove
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {selectedPackages.length > 0 &&
        packingList?.status === PackingListStatus.DRAFT && (
          <Alert
            message="Selected Packages Summary"
            description={
              <Row gutter={16}>
                <Col span={4}>
                  <Text strong>Packages:</Text> {totals?.packageCount}
                </Col>
                <Col span={4}>
                  <Text strong>Total Weight:</Text>{" "}
                  {totals?.weightTotal.toFixed(2)} kg
                </Col>
                <Col span={4}>
                  <Text strong>Total CBM:</Text> {totals?.cbmTotal.toFixed(3)}
                </Col>
                <Col span={6}>
                  <Space>
                    {totals?.usdTotal ||
                      (0 > 0 && (
                        <Text strong>USD: ${totals?.usdTotal.toFixed(2)}</Text>
                      ))}
                    {totals?.ghsTotal || (0 > 0 && (
                        <Text strong>GHS: ₵{totals?.ghsTotal.toFixed(2)}</Text>
                      ))}
                  </Space>
                </Col>
              </Row>
            }
            type="info"
            showIcon
          />
        )}

      <div className="grid grid-cols-1 gap-6">
        {/* Assigned Packages */}
        <div>
          <Text strong className="text-lg mb-2 block">
            Assigned Packages ({packingList?.totalPackages})
          </Text>
          {packingList?.status === "FINALIZED" && (
            <Alert
              message="This packing list is finalized. You cannot modify assigned packages."
              type="warning"
              showIcon
              className="mb-2"
            />
          )}
          {packingList?.packages && packingList.packages.length > 0 ? (
            <Table
              columns={assignedPackageColumns}
              dataSource={packingList?.packages || []}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: false,
                showQuickJumper: false,
              }}
              scroll={{ y: 400 }}
              size="small"
            />
          ) : (
            <Text>No packages assigned to this packing list.</Text>
          )}
        </div>

        {/* Available Packages */}
        {packingList?.status === PackingListStatus.DRAFT && (
          <div>
            <Text strong className="text-lg mb-2 block">
              Available Packages ({paginatedUnassignedPackages?.length || 0})
            </Text>
            <Table
              columns={availablePackageColumns}
              dataSource={paginatedUnassignedPackages || []}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: false,
                showQuickJumper: false,
                onChange: (page) => {
                  setUnassignedPage(page);
                },
              }}
              scroll={{ y: 400 }}
              size="small"
            />
          </div>
        )}

        {/* Selected Packages */}
        {packingList?.status === PackingListStatus.DRAFT && (
          <div>
            <Text strong className="text-lg mb-2 block">
              Selected Packages ({selectedPackageIds.length})
            </Text>
            <Table
              columns={selectedPackageColumns}
              dataSource={selectedPackages}
              rowKey="id"
              pagination={false}
              scroll={{ y: 400 }}
              size="small"
              summary={() => (
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={2}>
                    <Text strong>Totals</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1}>
                    <Text strong>{totals?.weightTotal.toFixed(2)} kg</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2}>
                    <Text strong>{totals?.cbmTotal.toFixed(3)}</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3} colSpan={4}>
                    <Space>
                      {totals?.usdTotal ||
                        (0 > 0 && (
                          <Text strong>
                            USD: ${totals?.usdTotal.toFixed(2)}
                          </Text>
                        ))}
                      {totals?.ghsTotal ||
                        (0 > 0 && (
                          <Text strong>
                            GHS: ₵{totals?.ghsTotal.toFixed(2)}
                          </Text>
                        ))}
                    </Space>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              )}
            />
          </div>
        )}
      </div>

      {selectedPackages.some((p: PackageWithCalculations) => !p.ratePerUnit) && (
        <Alert
          message="Warning"
          description="Some packages don't have matching shipping rates. Please check shipping rates configuration."
          type="warning"
          showIcon
        />
      )}
    </div>
  );
};
