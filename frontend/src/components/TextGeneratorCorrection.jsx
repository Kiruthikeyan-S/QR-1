import React, { useState } from 'react';
import {
  CheckCheck,
  Wand2,
  FileText,
  Copy,
  Check,
  Download,
  QrCode,
  Loader2,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { processText } from '../services/api';

const TONES = [
  { id: 'professional', label: 'Professional & Business' },
  { id: 'concise', label: 'Short & Direct' },
  { id: 'friendly', label: 'Warm & Friendly' },
  { id: 'marketing', label: 'Sales & Persuasive' },
];

export const TextGeneratorCorrection = ({ onGenerateQR }) => {
  const [activeMode, setActiveMode] = useState('grammar'); // 'grammar' | 'tone' | 'product_desc'
  const [inputText, setInputText] = useState('thier is alot of mistakes in teh invoice. please verify and send.');
  const [selectedTone, setSelectedTone] = useState('professional');

  // Product description mode fields
  const [prodName, setProdName] = useState('Ergonomic Mesh Chair');
  const [prodFeatures, setProdFeatures] = useState('Breathable mesh back\nAdjustable lumbar support\n360 smooth swivel casters\nHeavy-duty steel base');
  const [targetAudience, setTargetAudience] = useState('Remote Professionals & Office Teams');

  const [loading, setLoading] = useState(false);
  const [outputResult, setOutputResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleProcess = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setOutputResult(null);

    try {
      if (activeMode === 'grammar') {
        const res = await processText({
          operation: 'correct_grammar',
          text: inputText,
        });
        if (res.success) {
          setOutputResult(res.result.corrected);
        }
      } else if (activeMode === 'tone') {
        const res = await processText({
          operation: 'rewrite_tone',
          text: inputText,
          tone: selectedTone,
        });
        if (res.success) {
          setOutputResult(res.result.rewritten);
        }
      } else if (activeMode === 'product_desc') {
        const featuresArray = prodFeatures.split('\n').filter((f) => f.trim().length > 0);
        const res = await processText({
          operation: 'generate_description',
          product_name: prodName,
          features: featuresArray,
          target_audience: targetAudience,
        });
        if (res.success) {
          setOutputResult(res.result.full_copy);
        }
      }
    } catch (err) {
      alert(err.message || 'Failed to process text');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!outputResult) return;
    navigator.clipboard.writeText(outputResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!outputResult) return;
    const blob = new Blob([outputResult], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `text_output_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Text Studio & Grammar Fixer
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Fix grammar mistakes, adjust professional tone, or generate marketing copy.
        </p>
      </div>

      {/* Mode Selector Tabs */}
      <div className="flex items-center justify-center">
        <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200">
          <button
            onClick={() => {
              setActiveMode('grammar');
              setOutputResult(null);
            }}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center gap-1.5 ${
              activeMode === 'grammar'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCheck className="w-4 h-4" />
            <span>Grammar & Spelling</span>
          </button>
          <button
            onClick={() => {
              setActiveMode('tone');
              setOutputResult(null);
            }}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center gap-1.5 ${
              activeMode === 'tone'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wand2 className="w-4 h-4" />
            <span>Tone Rewriter</span>
          </button>
          <button
            onClick={() => {
              setActiveMode('product_desc');
              setOutputResult(null);
            }}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center gap-1.5 ${
              activeMode === 'product_desc'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Product Description</span>
          </button>
        </div>
      </div>

      {/* Main Form & Output Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form: 6 cols */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <form onSubmit={handleProcess} className="space-y-4">
            {activeMode === 'grammar' && (
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Input Text (Grammar & Spell Check)
                </label>
                <textarea
                  rows={6}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Paste or type text here to fix spelling, punctuation, and capitalization..."
                  required
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none transition"
                />
              </div>
            )}

            {activeMode === 'tone' && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                    Original Draft
                  </label>
                  <textarea
                    rows={4}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Enter sentence or message to rewrite..."
                    required
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none transition"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                    Target Tone
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {TONES.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSelectedTone(t.id)}
                        className={`p-2.5 rounded-xl text-xs text-left border transition ${
                          selectedTone === t.id
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-bold shadow-xs'
                            : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeMode === 'product_desc' && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                    Product Title
                  </label>
                  <input
                    type="text"
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    placeholder="e.g. Ergonomic Office Desk"
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                    Key Features (one per line)
                  </label>
                  <textarea
                    rows={4}
                    value={prodFeatures}
                    onChange={(e) => setProdFeatures(e.target.value)}
                    placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none font-mono transition"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                    Target Audience
                  </label>
                  <input
                    type="text"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    placeholder="e.g. Creators & Designers"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition shadow-xs flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing text...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {activeMode === 'grammar'
                      ? 'Fix Grammar & Spelling'
                      : activeMode === 'tone'
                      ? 'Rewrite in Target Tone'
                      : 'Generate Product Copy'}
                  </span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Output: 6 cols */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between min-h-[360px]">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Processed Output
              </span>
              {outputResult && (
                <span className="text-[11px] font-mono text-slate-500">
                  {outputResult.split(/\s+/).filter(Boolean).length} words
                </span>
              )}
            </div>

            {outputResult ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 font-sans text-sm text-slate-900 whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto">
                {outputResult}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400 space-y-2">
                <FileText className="w-10 h-10 opacity-30 stroke-[1.2]" />
                <p className="text-xs">Your polished text result will appear here</p>
              </div>
            )}
          </div>

          {outputResult && (
            <div className="pt-4 border-t border-slate-200 flex flex-wrap gap-2">
              <button
                onClick={handleCopy}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-xs"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied' : 'Copy Text'}</span>
              </button>
              <button
                onClick={handleDownload}
                className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition flex items-center justify-center gap-1.5 border border-slate-200"
              >
                <Download className="w-4 h-4" />
                <span>Save .txt</span>
              </button>
              {onGenerateQR && (
                <button
                  onClick={() => onGenerateQR(outputResult)}
                  className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-xs"
                  title="Generate QR code with this text"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Create QR</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
