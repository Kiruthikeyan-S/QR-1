import React, { useState } from 'react';
import { Sparkles, Download, QrCode, Image as ImageIcon, Loader2, RefreshCw, Check } from 'lucide-react';
import { generateProductImage } from '../services/api';

const CATEGORIES = [
  { id: 'electronics', label: 'Electronics', icon: '⚡' },
  { id: 'footwear', label: 'Footwear', icon: '👟' },
  { id: 'fashion', label: 'Fashion', icon: '✨' },
  { id: 'watches', label: 'Watches', icon: '⌚' },
  { id: 'cosmetics', label: 'Beauty & Care', icon: '🌿' },
  { id: 'beverages', label: 'Beverage', icon: '☕' },
  { id: 'furniture', label: 'Furniture', icon: '🪑' },
];

const THEMES = [
  { id: 'studio_white', label: 'Studio White', color: '#ffffff' },
  { id: 'luxury_marble', label: 'Luxury Dark', color: '#1a202c' },
  { id: 'minimalist_pastel', label: 'Pastel Light', color: '#fef2f2' },
  { id: 'cyber_clean', label: 'Cyber Clean', color: '#0f172a' },
  { id: 'warm_wood', label: 'Warm Amber', color: '#fffbeb' },
];

export const ProductImageGenerator = ({ onGenerateQR }) => {
  const [productName, setProductName] = useState('SonicPro Wireless Headphones');
  const [category, setCategory] = useState('electronics');
  const [tagline, setTagline] = useState('Active Noise Cancelling & Spatial Audio');
  const [price, setPrice] = useState('$199.00');
  const [badge, setBadge] = useState('BESTSELLER');
  const [theme, setTheme] = useState('studio_white');

  const [loading, setLoading] = useState(false);
  const [imageDataUrl, setImageDataUrl] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (e) => {
    e?.preventDefault();
    if (!productName.trim()) return;

    setLoading(true);
    try {
      const res = await generateProductImage({
        product_name: productName,
        category,
        tagline,
        price,
        badge,
        theme,
      });
      if (res.success && res.image_data_url) {
        setImageDataUrl(res.image_data_url);
      }
    } catch (err) {
      alert(err.message || 'Failed to generate product image');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!imageDataUrl) return;
    const link = document.createElement('a');
    link.href = imageDataUrl;
    link.download = `${productName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_product.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Product Image Studio
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Generate clean, studio-grade product showcase images.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form: 7 cols */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
          <form onSubmit={handleGenerate} className="space-y-4">
            {/* Product Name */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Product Title / Item Name
              </label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g. Ultra Slim Leather Wallet"
                required
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              />
            </div>

            {/* Category Selector */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Product Category
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border text-left flex items-center gap-1.5 transition ${
                      category === cat.id
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-bold shadow-xs'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span className="truncate">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tagline */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Subtitle / Marketing Tagline
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. Handcrafted from genuine Italian leather"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              />
            </div>

            {/* Price & Highlight Badge */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Price Badge
                </label>
                <input
                  type="text"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="$149.00"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono transition"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Top Label / Badge
                </label>
                <input
                  type="text"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  placeholder="NEW ARRIVAL"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase transition"
                />
              </div>
            </div>

            {/* Studio Lighting Theme */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Studio Lighting & Backdrop
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {THEMES.map((th) => (
                  <button
                    key={th.id}
                    type="button"
                    onClick={() => setTheme(th.id)}
                    className={`px-3 py-2 rounded-xl text-xs border text-left flex items-center gap-2 transition ${
                      theme === th.id
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-bold shadow-xs'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0"
                      style={{ backgroundColor: th.color }}
                    />
                    <span className="truncate">{th.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition shadow-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Rendering Product Visual...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Product Image</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Preview Column: 5 cols */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col items-center justify-center text-center min-h-[420px]">
          {imageDataUrl ? (
            <div className="space-y-4 w-full flex flex-col items-center animate-in zoom-in-95 duration-150">
              <div className="w-full p-2 bg-slate-100 rounded-2xl border border-slate-200 shadow-xs">
                <img
                  src={imageDataUrl}
                  alt={productName}
                  className="w-full h-auto aspect-square object-contain rounded-xl"
                />
              </div>

              <div className="flex gap-2 w-full pt-1">
                <button
                  onClick={handleDownload}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Image</span>
                </button>
                {onGenerateQR && (
                  <button
                    onClick={() => onGenerateQR(productName, price)}
                    className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-xs"
                    title="Generate QR code for this product"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Create QR</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-slate-400 flex flex-col items-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                <ImageIcon className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">Studio Preview Ready</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure details and click "Generate Product Image"
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
