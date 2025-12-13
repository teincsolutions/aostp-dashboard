import React, { useState, useEffect } from "react";
import { Select } from "antd";
import { useCustomers } from "@/hooks/useCustomers";

interface CustomerSearchSelectProps {
  value?: string;
  onChange?: (value: string) => void;
  onSelect?: (value: string) => void;
  placeholder?: string;
  showAddNew?: boolean;
  onAddNew?: () => void;
}

export const CustomerSearchSelect: React.FC<CustomerSearchSelectProps> = ({
  value,
  onChange,
  onSelect,
  placeholder = "Select customer",
  showAddNew = false,
  onAddNew,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search term for API calls (300ms delay)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch customers with server-side filtering
  const { data: customers, isLoading } = useCustomers({
    search: debouncedSearch,
    limit: 50, // Limit to avoid loading too many at once
  });

  // Prepare options
  const options = [
    ...(customers?.data || []).map((customer) => ({
      value: customer.id,
      label: `${customer.customerCode} - ${customer.firstName} ${
        customer.lastName || "" || ""
      }`,
    })),
  ];

  if (showAddNew) {
    options.push({ value: "__add_new__", label: "+ Add New Customer" });
  }

  return (
    <Select
      showSearch
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onSelect={onSelect}
      loading={isLoading}
      options={options}
      filterOption={false} // Disable client-side filtering, use server-side
      onSearch={(input) => setSearchTerm(input)}
      className="w-full"
    />
  );
};
