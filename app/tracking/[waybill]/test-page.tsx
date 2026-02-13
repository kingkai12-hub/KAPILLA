'use client';

export default function TestTrackingPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Test Tracking Page</h1>
        <p className="text-gray-600">This is a minimal test to verify routing works.</p>
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-blue-800">✅ Dynamic route working</p>
          <p className="text-blue-800">✅ Component rendering</p>
          <p className="text-blue-800">✅ No compilation errors</p>
        </div>
      </div>
    </div>
  );
}
