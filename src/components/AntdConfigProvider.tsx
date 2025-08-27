'use client';

import { ConfigProvider } from 'antd';
import { ReactNode } from 'react';

interface AntdConfigProviderProps {
  children: ReactNode;
}

export function AntdConfigProvider({ children }: AntdConfigProviderProps) {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
}
