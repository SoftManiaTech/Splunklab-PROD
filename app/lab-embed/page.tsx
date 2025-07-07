'use client';

import dynamic from 'next/dynamic';

// Dynamically import your React App component (disable SSR)
const LabApp = dynamic(() => import('@/components/LabManagerApp-embed/App'), {
  ssr: false,
});

export default function LabPage() {
  return (
    <div style={{ height: '100vh' }}>
      <LabApp />
    </div>
  );
}
