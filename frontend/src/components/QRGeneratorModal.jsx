import React, { useState } from 'react';
import {
  X,
  Download,
  Copy,
  Check,
  QrCode,
  Wifi,
  CreditCard,
  User,
  Globe,
  Mail,
  MessageSquare,
  FileText,
  ArrowRight
} from 'lucide-react';
import { generateQR } from '../services/api';

const TYPES = [
  { id: 'url', label: 'Website URL', icon: Globe },
  { id: 'wifi', label: 'WiFi Network', icon: Wifi },
  { id: 'upi', label: 'UPI Payment', icon: CreditCard },
  { id: 'contact', label: 'vCard Contact', icon: User },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'sms', label: 'SMS Text', icon: MessageSquare },
  { id: 'text', label: 'Plain Text', icon: FileText },
];

export const QRGeneratorModal = ({ isOpen, onClose, onTestGenerated }) => {
  const [selectedType, setSelectedType] = useState('url');
  const [params, setParams] = useState({
    url: 'https://',
    ssid: '',
    auth_type: 'WPA',
    password: '',
    hidden: false,
    payee_vpa: '',
    payee_name: '',
    amount: '',
    currency: 'INR',
    note: '',
    name: '',
    organization: '',
    phone: '',
    email: '',
    to: '',
    subject: '',
    body: '',
    message: '',
    text: '',
  });

  const [fillColor, setFillColor] = useState('#0f172a');
  const [backColor, setBackColor] = useState('#ffffff');
  const [qrResult, setQrResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleParamChange = (key, val) => {
    setParams((prev) => ({ ...prev, [key]: val }));
  };

  const handleGenerate = async (e) => {
    e?.preventDefault();
    setLoading(true);
    try {
      const res = await generateQR(selectedType, params, fillColor, backColor);
      setQrResult(res);
    } catch (err) {
      alert(err.message || 'Failed to generate QR code');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!qrResult) return;
    const link = document.createElement('a');
    link.href = qrResult.image_data_url;
    link.download = `qr_${selectedType}_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyRaw = () => {
    if (!qrResult) return;
    navigator.clipboard.writeText(qrResult.raw_data);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shadow-xs">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Create QR Code</h2>
              <p className="text-xs text-slate-500">Generate, customize, and export standard QR codes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Form & Types (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                Select QR Type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {TYPES.map((t) => {
                  const Icon = t.icon;
                  const isSelected = selectedType === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setSelectedType(t.id);
                        setQrResult(null);
                      }}
                      className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-bold shadow-xs'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Icon className={`w-4 h-4 mb-2 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`} />
                      <span className="text-xs">{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Input fields */}
            <form onSubmit={handleGenerate} className="space-y-4 pt-1">
              {selectedType === 'url' && (
                <div>
                  <label className="text-xs font-semibold text-slate-800 block mb-1.5">
                    Website URL
                  </label>
                  <input
                    type="text"
                    value={params.url}
                    onChange={(e) => handleParamChange('url', e.target.value)}
                    placeholder="https://example.com"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono transition"
                  />
                </div>
              )}

              {selectedType === 'wifi' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-800 block mb-1.5">
                      Network Name (SSID)
                    </label>
                    <input
                      type="text"
                      value={params.ssid}
                      onChange={(e) => handleParamChange('ssid', e.target.value)}
                      placeholder="MyHomeWiFi"
                      required
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-800 block mb-1.5">
                        Security Type
                      </label>
                      <select
                        value={params.auth_type}
                        onChange={(e) => handleParamChange('auth_type', e.target.value)}
                        className="w-full px-3.5 py-3 rounded-xl bg-slate-50 border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                      >
                        <option value="WPA">WPA / WPA2 / WPA3</option>
                        <option value="WEP">WEP</option>
                        <option value="nopass">None (Open)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-800 block mb-1.5">
                        Password
                      </label>
                      <input
                        type="text"
                        value={params.password}
                        onChange={(e) => handleParamChange('password', e.target.value)}
                        placeholder="Network password"
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono transition"
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedType === 'upi' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-800 block mb-1.5">
                        UPI ID (VPA)
                      </label>
                      <input
                        type="text"
                        value={params.payee_vpa}
                        onChange={(e) => handleParamChange('payee_vpa', e.target.value)}
                        placeholder="username@bank"
                        required
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono transition"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-800 block mb-1.5">
                        Payee Name
                      </label>
                      <input
                        type="text"
                        value={params.payee_name}
                        onChange={(e) => handleParamChange('payee_name', e.target.value)}
                        placeholder="Store or Person Name"
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-800 block mb-1.5">
                        Amount (₹ optional)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={params.amount}
                        onChange={(e) => handleParamChange('amount', e.target.value)}
                        placeholder="500.00"
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono transition"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-800 block mb-1.5">
                        Note / Memo
                      </label>
                      <input
                        type="text"
                        value={params.note}
                        onChange={(e) => handleParamChange('note', e.target.value)}
                        placeholder="Dinner Bill"
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedType === 'contact' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-800 block mb-1.5">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={params.name}
                        onChange={(e) => handleParamChange('name', e.target.value)}
                        placeholder="John Doe"
                        required
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-800 block mb-1.5">
                        Organization
                      </label>
                      <input
                        type="text"
                        value={params.organization}
                        onChange={(e) => handleParamChange('organization', e.target.value)}
                        placeholder="Acme Corp"
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-800 block mb-1.5">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={params.phone}
                        onChange={(e) => handleParamChange('phone', e.target.value)}
                        placeholder="+1 (555) 019-2834"
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono transition"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-800 block mb-1.5">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={params.email}
                        onChange={(e) => handleParamChange('email', e.target.value)}
                        placeholder="john@example.com"
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedType === 'email' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-800 block mb-1.5">
                      Recipient Email
                    </label>
                    <input
                      type="email"
                      value={params.to}
                      onChange={(e) => handleParamChange('to', e.target.value)}
                      placeholder="hello@example.com"
                      required
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-800 block mb-1.5">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={params.subject}
                      onChange={(e) => handleParamChange('subject', e.target.value)}
                      placeholder="Meeting Discussion"
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                    />
                  </div>
                </div>
              )}

              {selectedType === 'sms' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-800 block mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={params.phone}
                      onChange={(e) => handleParamChange('phone', e.target.value)}
                      placeholder="+1234567890"
                      required
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono transition"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-800 block mb-1.5">
                      Message Content
                    </label>
                    <textarea
                      rows={3}
                      value={params.message}
                      onChange={(e) => handleParamChange('message', e.target.value)}
                      placeholder="Type your SMS message..."
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none transition"
                    />
                  </div>
                </div>
              )}

              {selectedType === 'text' && (
                <div>
                  <label className="text-xs font-semibold text-slate-800 block mb-1.5">
                    Text Content
                  </label>
                  <textarea
                    rows={4}
                    value={params.text}
                    onChange={(e) => handleParamChange('text', e.target.value)}
                    placeholder="Enter any custom text, note, or code..."
                    required
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none font-mono transition"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition shadow-sm flex items-center justify-center gap-2"
              >
                <span>{loading ? 'Generating QR Code...' : 'Generate QR Code'}</span>
              </button>
            </form>
          </div>

          {/* Right Column: Large Clean Live Preview (No raw string clutter) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center min-h-[320px]">
            {qrResult ? (
              <div className="space-y-4 w-full flex flex-col items-center animate-in zoom-in-95 duration-150">
                <div className="p-4 bg-white rounded-2xl shadow-md border border-slate-200">
                  <img
                    src={qrResult.image_data_url}
                    alt="Generated QR Code"
                    className="w-56 h-56 sm:w-60 sm:h-60 object-contain rounded-lg"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5 w-full pt-1">
                  <button
                    onClick={handleDownload}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition flex items-center justify-center gap-2 shadow-xs"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download PNG</span>
                  </button>
                  <button
                    onClick={handleCopyRaw}
                    className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition flex items-center justify-center gap-2 border border-slate-200"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <button
                  onClick={() => {
                    onTestGenerated(qrResult.structured);
                    onClose();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs"
                >
                  <span>Test In Scanner</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-3 text-slate-400 flex flex-col items-center py-8">
                <div className="w-20 h-20 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-300 shadow-xs">
                  <QrCode className="w-10 h-10" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700">QR Code Preview</p>
                  <p className="text-xs text-slate-400 mt-0.5">Fill in details and click "Generate QR Code"</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
