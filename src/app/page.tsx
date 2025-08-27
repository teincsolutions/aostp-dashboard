'use client';

import { Spin } from 'antd';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {

  useEffect(() => {
    redirect('/dashboard');
  }, []);

  return (
    <div className="flex justify-center items-center min-h-screen">
      <Spin size="large" />
    </div>
  );
}
