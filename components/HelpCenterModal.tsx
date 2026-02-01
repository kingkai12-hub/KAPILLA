import React from 'react';
import { X, Mail, Phone, MapPin, MessageCircle } from 'lucide-react';

interface HelpCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpCenterModal({ isOpen, onClose }: HelpCenterModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Help Center</h2>
            <p className="text-sm text-slate-500 mt-1">We're here to help you</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 rounded-xl bg-blue-50 border border-blue-100">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Email Support</h3>
                <p className="text-sm text-slate-600 mb-2">For general inquiries and support</p>
                <a href="mailto:express@kapillagroup.co.tz" className="text-blue-600 font-medium hover:underline text-sm break-all">
                  express@kapillagroup.co.tz
                </a>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-green-50 border border-green-100">
              <div className="bg-green-100 p-2 rounded-lg">
                <Phone className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Phone Support</h3>
                <p className="text-sm text-slate-600 mb-2">Call us directly</p>
                <div className="space-y-1">
                  <a href="tel:+255756656218" className="block text-green-700 font-medium hover:underline text-sm">
                    +255 756 656 218
                  </a>
                  <a href="tel:+255766724062" className="block text-green-700 font-medium hover:underline text-sm">
                    +255 766 724 062
                  </a>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="bg-slate-200 p-2 rounded-lg">
                <MapPin className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Visit Us</h3>
                <p className="text-sm text-slate-600">
                  P.O. BOX 71729<br/>
                  DAR ES SALAAM, TANZANIA
                </p>
              </div>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-full py-3 px-4 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
