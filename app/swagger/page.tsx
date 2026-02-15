'use client';

import dynamic from 'next/dynamic';
import 'swagger-ui-react/swagger-ui.css';

const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false }) as any;

export default function ApiDocs() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6 text-slate-900 dark:text-white">
          Kapilla Logistics API Documentation
        </h1>
        <SwaggerUI url="/api/docs" />
      </div>
    </div>
  );
}
