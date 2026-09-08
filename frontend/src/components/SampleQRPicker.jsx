import React, { useEffect, useState } from 'react';
import { Wifi, CreditCard, User, Globe, MapPin, Mail, FileText, Loader2 } from 'lucide-react';
import { getSampleQRs } from '../services/api';

const SAMPLE_ICONS = {
  wifi: Wifi,
  upi: CreditCard,
  contact: User,
  url: Globe,
  geo: MapPin,
  email: Mail,
};

export const SampleQRPicker = ({ onSelectSample }) => {
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSampleQRs()
      .then((data) => {
        setSamples(data.samples || []);
      })
      .catch((err) => {
        console.warn('Failed to load sample QRs:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="w-full max-w-xl mx-auto flex items-center justify-center p-4 text-slate-500 text-xs">
        <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
        <span>Loading samples...</span>
      </div>
    );
  }

  if (samples.length === 0) return null;

  return (
    <div className="w-full max-w-xl mx-auto mt-6">
      <div className="mb-2">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Sample Codes
        </h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {samples.slice(0, 6).map((sample) => {
          const Icon = SAMPLE_ICONS[sample.type] || FileText;

          return (
            <button
              key={sample.id}
              onClick={() => onSelectSample(sample)}
              className="p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition text-left flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-1">
                <div className="p-1.5 rounded-lg bg-slate-800 text-slate-300">
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                  {sample.type}
                </span>
              </div>

              <div className="mt-2">
                <p className="text-xs font-medium text-slate-200 truncate">{sample.name}</p>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">{sample.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
