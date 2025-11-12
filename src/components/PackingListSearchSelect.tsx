import React, { useState, useEffect } from "react";
import { Select } from "antd";
import { usePackingLists } from "@/hooks/usePackingLists";

interface PackingListSearchSelectProps {
  value?: string;
  onChange?: (value: string) => void;
  onSelect?: (value: string) => void;
  placeholder?: string;
  showAddNew?: boolean;
  onAddNew?: () => void;
}

export const PackingListSearchSelect: React.FC<
  PackingListSearchSelectProps
> = ({
  value,
  onChange,
  onSelect,
  placeholder = "Select packing list",
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

  // Fetch packing lists with server-side filtering
  const { data: packingLists, isLoading } = usePackingLists({
    search: debouncedSearch,
    limit: 50, // Limit to avoid loading too many at once
  });

  // Prepare options
  const options = [
    ...(packingLists?.data || []).map((packingList) => ({
      value: packingList.id,
      label: `${packingList.name} (${packingList.totalPackages} packages)`,
    })),
  ];

  if (showAddNew) {
    options.push({ value: "__add_new__", label: "+ Create New Packing List" });
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
