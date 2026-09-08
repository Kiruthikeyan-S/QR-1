import React, { useState } from 'react';
import {
  Globe,
  Wifi,
  CreditCard,
  User,
  Mail,
  MessageSquare,
  Phone,
  MapPin,
  Coins,
  Code,
  FileText,
  Copy,
  Check,
  ExternalLink,
  Download,
  Key,
  Eye,
  EyeOff,
  RotateCcw,
  AlertCircle,
  FileJson
} from 'lucide-react';

const ICON_MAP = {
  Globe,
  Wifi,
  CreditCard,
  User,
  Mail,
  MessageSquare,
  Phone,
  MapPin,
  Coins,
  Code,
  FileText,
  Copy,
  ExternalLink,
  Download,
  Key,
  AlertCircle,
};

export const ResultCard = ({ result, scanSource, onReset }) => {
  const [copiedKey, setCopiedKey] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('structured');

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleAction = (action) => {
    switch (action.action_type) {
      case 'link':
      case 'upi_pay':
        window.open(action.payload, '_blank', 'noopener,noreferrer');
        break;
      case 'call':
        window.location.href = `tel:${action.payload}`;
        break;
      case 'sms':
        window.location.href = action.payload;
        break;
      case 'email':
        window.location.href = action.payload;
        break;
      case 'copy':
        copyToClipboard(action.payload, action.id);
        break;
      case 'download':
        downloadVCF(action.payload, result.parsed_details?.name || 'contact');
        break;
      default:
        copyToClipboard(action.payload, action.id);
    }
  };

  const downloadVCF = (vcfData, filename) => {
    const blob = new Blob([vcfData], { type: 'text/vcard;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filename.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.vcf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportJSON = () => {
    const jsonStr = JSON.stringify(result, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `qr_result_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const IconComponent = ICON_MAP[result.icon] || FileText;

  return (
    <div className="w-full max-w-xl mx-auto rounded-2xl bg-white border border-slate-200 shadow-md overflow-hidden">
      {/* Result Header */}
      <div className="p-5 border-b border-slate-200 flex items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
            <IconComponent className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 truncate">{result.title}</h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                {result.data_type}
              </span>
            </div>
            <p className="text-xs text-slate-500 truncate">{result.summary}</p>
          </div>
        </div>

        <button
          onClick={onReset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition shrink-0 shadow-xs"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Scan Again</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center px-5 border-b border-slate-200 bg-slate-50 text-xs font-medium">
        <button
          onClick={() => setActiveTab('structured')}
          className={`py-2.5 px-3 border-b-2 transition ${
            activeTab === 'structured'
              ? 'border-emerald-600 text-emerald-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Details
        </button>
        <button
          onClick={() => setActiveTab('raw')}
          className={`py-2.5 px-3 border-b-2 transition ${
            activeTab === 'raw'
              ? 'border-emerald-600 text-emerald-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Raw Data
        </button>
      </div>

      {/* Body */}
      <div className="p-5">
        {activeTab === 'structured' && (
          <div className="space-y-4">
            {result.data_type === 'url' && <URLBody details={result.parsed_details} />}
            {result.data_type === 'wifi' && (
              <WiFiBody
                details={result.parsed_details}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
                copyToClipboard={copyToClipboard}
                copiedKey={copiedKey}
              />
            )}
            {result.data_type === 'upi' && <UPIBody details={result.parsed_details} />}
            {result.data_type === 'contact' && <ContactBody details={result.parsed_details} />}
            {result.data_type === 'email' && <EmailBody details={result.parsed_details} />}
            {result.data_type === 'sms' && <SMSBody details={result.parsed_details} />}
            {result.data_type === 'tel' && <TelBody details={result.parsed_details} />}
            {result.data_type === 'geo' && <GeoBody details={result.parsed_details} />}
            {result.data_type === 'crypto' && <CryptoBody details={result.parsed_details} />}
            {result.data_type === 'json' && <JSONBody details={result.parsed_details} />}
            {result.data_type === 'text' && <TextBody details={result.parsed_details} />}

            {result.validation_notes && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
                <span>{result.validation_notes}</span>
              </div>
            )}

            {/* Action buttons */}
            <div className="pt-2 flex flex-wrap gap-2">
              {result.actions.map((act) => {
                const ActIcon = ICON_MAP[act.icon] || ExternalLink;
                const isCopied = copiedKey === act.id;

                return (
                  <button
                    key={act.id}
                    onClick={() => handleAction(act)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
                      act.primary
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'
                    }`}
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <ActIcon className="w-3.5 h-3.5" />}
                    <span>{isCopied ? 'Copied' : act.label}</span>
                  </button>
                );
              })}

              <button
                onClick={exportJSON}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 ml-auto transition"
                title="Export JSON"
              >
                <FileJson className="w-3.5 h-3.5" />
                <span>Export</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'raw' && (
          <div className="space-y-3">
            <div className="relative">
              <pre className="p-4 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-800 whitespace-pre-wrap break-all max-h-64 overflow-y-auto">
                {result.raw_data}
              </pre>
              <button
                onClick={() => copyToClipboard(result.raw_data, 'raw_full')}
                className="absolute top-2.5 right-2.5 p-1.5 rounded-md bg-white hover:bg-slate-100 text-slate-700 text-xs transition flex items-center gap-1 border border-slate-200 shadow-xs"
              >
                {copiedKey === 'raw_full' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'raw_full' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* --- TYPE SPECIFIC DETAIL BODIES --- */

const URLBody = ({ details }) => (
  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
    <div className="flex items-center justify-between">
      <span className="text-xs text-slate-500 font-medium">Link Address</span>
      <span className={`text-[11px] font-mono font-semibold ${details.is_secure ? 'text-emerald-600' : 'text-amber-600'}`}>
        {details.is_secure ? 'HTTPS' : 'HTTP'}
      </span>
    </div>
    <a
      href={details.url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-sm font-mono text-sky-600 hover:underline break-all block font-medium"
    >
      {details.url}
    </a>
  </div>
);

const WiFiBody = ({ details, showPassword, setShowPassword, copyToClipboard, copiedKey }) => (
  <div className="space-y-2">
    <div className="grid grid-cols-2 gap-2">
      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
        <span className="text-xs text-slate-500 block">Network (SSID)</span>
        <p className="text-sm font-bold text-slate-900 font-mono">{details.ssid || 'Hidden'}</p>
      </div>
      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
        <span className="text-xs text-slate-500 block">Security</span>
        <p className="text-sm font-bold text-slate-700 font-mono">{details.auth_type || 'WPA'}</p>
      </div>
    </div>

    {details.password && (
      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
        <div>
          <span className="text-xs text-slate-500 block">Password</span>
          <p className="text-sm font-mono text-slate-900 font-semibold">
            {showPassword ? details.password : '••••••••••••••••'}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowPassword(!showPassword)}
            className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition"
          >
            {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => copyToClipboard(details.password, 'wifi_pwd')}
            className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition"
          >
            {copiedKey === 'wifi_pwd' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    )}
  </div>
);

const UPIBody = ({ details }) => (
  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
    <div className="flex items-center justify-between">
      <span className="text-xs font-semibold text-emerald-700">UPI Payment Request</span>
      <span className="text-xs font-mono text-slate-500">{details.currency || 'INR'}</span>
    </div>

    {details.amount && (
      <div>
        <span className="text-2xl font-bold text-slate-900 font-mono">₹{details.amount}</span>
      </div>
    )}

    <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-200">
      <div>
        <span className="text-slate-500 block">Payee</span>
        <span className="text-slate-900 font-semibold">{details.payee_name || 'Merchant'}</span>
      </div>
      <div>
        <span className="text-slate-500 block">UPI ID</span>
        <span className="font-mono text-emerald-700 font-semibold">{details.payee_vpa}</span>
      </div>
      {details.note && (
        <div className="col-span-2">
          <span className="text-slate-500 block">Note</span>
          <span className="text-slate-700">{details.note}</span>
        </div>
      )}
    </div>
  </div>
);

const ContactBody = ({ details }) => (
  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold">
        {details.name ? details.name.slice(0, 2).toUpperCase() : <User className="w-5 h-5" />}
      </div>
      <div>
        <h3 className="text-sm font-bold text-slate-900">{details.name || 'Contact'}</h3>
        {details.organization && <p className="text-xs text-slate-500">{details.organization}</p>}
      </div>
    </div>

    <div className="space-y-1.5 pt-2 border-t border-slate-200 text-xs">
      {details.phones?.map((p, idx) => (
        <div key={idx} className="flex items-center justify-between">
          <span className="text-slate-500">{p.type || 'Phone'}:</span>
          <span className="font-mono text-slate-900 font-semibold">{p.number}</span>
        </div>
      ))}
      {details.emails?.map((e, idx) => (
        <div key={idx} className="flex items-center justify-between">
          <span className="text-slate-500">{e.type || 'Email'}:</span>
          <span className="font-mono text-slate-900 font-medium">{e.email}</span>
        </div>
      ))}
    </div>
  </div>
);

const EmailBody = ({ details }) => (
  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
    <div>
      <span className="text-slate-500">To:</span>
      <p className="font-mono text-slate-900 font-semibold">{details.to}</p>
    </div>
    {details.subject && (
      <div>
        <span className="text-slate-500">Subject:</span>
        <p className="text-slate-800">{details.subject}</p>
      </div>
    )}
  </div>
);

const SMSBody = ({ details }) => (
  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
    <div>
      <span className="text-slate-500">Recipient:</span>
      <p className="font-mono text-slate-900 font-semibold">{details.phone_number}</p>
    </div>
    {details.message && (
      <div>
        <span className="text-slate-500">Message:</span>
        <p className="text-slate-800 mt-1">{details.message}</p>
      </div>
    )}
  </div>
);

const TelBody = ({ details }) => (
  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
    <span className="text-xs text-slate-500">Phone Number</span>
    <p className="text-lg font-bold font-mono text-emerald-700 mt-0.5">{details.phone_number}</p>
  </div>
);

const GeoBody = ({ details }) => (
  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
    <div className="grid grid-cols-2 gap-2">
      <div>
        <span className="text-slate-500">Latitude</span>
        <p className="font-mono text-slate-900 font-semibold">{details.latitude}</p>
      </div>
      <div>
        <span className="text-slate-500">Longitude</span>
        <p className="font-mono text-slate-900 font-semibold">{details.longitude}</p>
      </div>
    </div>
  </div>
);

const CryptoBody = ({ details }) => (
  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
    <span className="text-slate-500">{details.crypto_network} Address:</span>
    <p className="font-mono text-slate-900 break-all">{details.address}</p>
  </div>
);

const JSONBody = ({ details }) => (
  <pre className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-800 whitespace-pre-wrap max-h-52 overflow-y-auto">
    {JSON.stringify(details.json, null, 2)}
  </pre>
);

const TextBody = ({ details }) => (
  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
    <p className="text-xs text-slate-800 whitespace-pre-wrap">{details.text}</p>
  </div>
);
