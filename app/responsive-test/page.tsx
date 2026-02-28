'use client';

import { useState } from 'react';
import { Monitor, Tablet, Smartphone } from 'lucide-react';

export default function ResponsiveTestPage() {
  const [device, setDevice] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  const deviceSizes = {
    mobile: 'max-w-[375px]',
    tablet: 'max-w-[768px]',
    desktop: 'max-w-full',
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4">
      {/* Device Selector */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Responsive Design Test</h1>
          <p className="text-slate-600 mb-6">
            Test how the system adapts to different device sizes
          </p>

          <div className="flex gap-4">
            <button
              onClick={() => setDevice('mobile')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                device === 'mobile'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              <Smartphone className="w-5 h-5" />
              Mobile (375px)
            </button>
            <button
              onClick={() => setDevice('tablet')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                device === 'tablet'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              <Tablet className="w-5 h-5" />
              Tablet (768px)
            </button>
            <button
              onClick={() => setDevice('desktop')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                device === 'desktop'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              <Monitor className="w-5 h-5" />
              Desktop (Full)
            </button>
          </div>
        </div>
      </div>

      {/* Preview Frame */}
      <div className="max-w-7xl mx-auto">
        <div className="bg-slate-800 rounded-xl shadow-2xl p-8">
          <div
            className={`mx-auto bg-white rounded-lg shadow-xl overflow-hidden transition-all duration-300 ${deviceSizes[device]}`}
          >
            <iframe src="/" className="w-full h-[800px] border-0" title="Responsive Preview" />
          </div>
        </div>
      </div>

      {/* Responsive Features List */}
      <div className="max-w-7xl mx-auto mt-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">✅ Responsive Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="font-bold text-green-900 mb-2">📱 Mobile (375px-640px)</h3>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Single column layouts</li>
                <li>• Compact spacing (p-2, mb-2)</li>
                <li>• Abbreviated button text</li>
                <li>• Hidden non-essential elements</li>
                <li>• Horizontal scroll for tables</li>
                <li>• Full-width modals</li>
              </ul>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-bold text-blue-900 mb-2">📱 Tablet (640px-1024px)</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• 2-column grids</li>
                <li>• Medium spacing (p-4, mb-4)</li>
                <li>• Full button text</li>
                <li>• More visible elements</li>
                <li>• Wider tables</li>
                <li>• Centered modals</li>
              </ul>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h3 className="font-bold text-purple-900 mb-2">🖥️ Desktop (1024px+)</h3>
              <ul className="text-sm text-purple-800 space-y-1">
                <li>• Multi-column layouts (3-4 cols)</li>
                <li>• Generous spacing (p-8, mb-8)</li>
                <li>• All features visible</li>
                <li>• Sidebar navigation</li>
                <li>• Full-width tables</li>
                <li>• Hover effects</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h3 className="font-bold text-slate-900 mb-2">🎯 Key Responsive Patterns</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-700">
              <div>
                <strong>Spacing:</strong>{' '}
                <code className="bg-slate-200 px-2 py-1 rounded">p-2 sm:p-4 lg:p-8</code>
              </div>
              <div>
                <strong>Text Size:</strong>{' '}
                <code className="bg-slate-200 px-2 py-1 rounded">
                  text-xs sm:text-sm lg:text-base
                </code>
              </div>
              <div>
                <strong>Grid:</strong>{' '}
                <code className="bg-slate-200 px-2 py-1 rounded">
                  grid-cols-1 md:grid-cols-2 lg:grid-cols-4
                </code>
              </div>
              <div>
                <strong>Visibility:</strong>{' '}
                <code className="bg-slate-200 px-2 py-1 rounded">hidden sm:block</code>
              </div>
              <div>
                <strong>Flex Direction:</strong>{' '}
                <code className="bg-slate-200 px-2 py-1 rounded">flex-col sm:flex-row</code>
              </div>
              <div>
                <strong>Width:</strong>{' '}
                <code className="bg-slate-200 px-2 py-1 rounded">w-full sm:w-auto</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
