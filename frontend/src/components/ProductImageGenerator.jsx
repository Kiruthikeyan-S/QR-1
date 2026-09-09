import React, { useState } from 'react';
import { Sparkles, Download, Image as ImageIcon, Loader2, Wand2, Sliders, RefreshCw, Zap } from 'lucide-react';
import { generateProductImage } from '../services/api';

const PROMPT_SUGGESTIONS = [
  'Futuristic cybernetic sneakers with glowing cyan LED soles on wet dark asphalt, studio 8k',
  'Luxury gold chronograph wristwatch with diamond bezel resting on black velvet, commercial photorealistic',
  'SonicPro wireless noise-cancelling headphones on minimalist acrylic podium, soft studio lighting',
  'Artisan iced caramel latte in modern glass tumbler on rustic wooden cafe table with coffee beans',
  'Organic botanical face serum amber glass dropper bottle with fresh green leaves and water droplets',
  'Ergonomic sleek office executive chair with breathable mesh and polished steel base, 3D render',
];

const STYLES = [
  { id: 'photorealistic', label: '📸 Photorealistic Studio', suffix: 'commercial studio product photography, softbox lighting, 8k resolution, crisp focus, photorealistic' },
  { id: 'cyberpunk', label: '⚡ Cyber Neon', suffix: 'cyberpunk aesthetic, vibrant neon rim glow, futuristic reflective surface, cinematic lighting, 8k' },
  { id: 'luxury', label: '💎 Luxury Gold & Marble', suffix: 'luxury commercial advertisement, black marble pedestal, warm gold ambient lighting, elegant reflection, high end' },
  { id: 'minimalist', label: '🌿 Clean Minimalist', suffix: 'minimalist Scandinavian design, soft pastel aesthetic backdrop, natural sunlit shadows, clean modern' },
  { id: '3d_render', label: '🎨 3D Commercial Art', suffix: 'octane render, 3D commercial product model, vibrant materials, flawless reflections, 8k render' },
];

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

export const ProductImageGenerator = () => {
  const [activeTab, setActiveTab] = useState('prompt'); // 'prompt' | 'studio'
  
  // Prompt mode state
  const [promptText, setPromptText] = useState('SonicPro Wireless Headphones on minimalist podium with soft warm studio lighting, commercial photography, 8k');
  const [selectedStyle, setSelectedStyle] = useState('photorealistic');

  // Studio mode state
  const [productName, setProductName] = useState('SonicPro Wireless Headphones');
  const [category, setCategory] = useState('electronics');
  const [tagline, setTagline] = useState('Active Noise Cancelling & Spatial Audio');
  const [price, setPrice] = useState('$199.00');
  const [badge, setBadge] = useState('BESTSELLER');
  const [theme, setTheme] = useState('studio_white');

  const [loading, setLoading] = useState(false);
  const [imageDataUrl, setImageDataUrl] = useState(null);

  const handleGenerate = async (e) => {
    e?.preventDefault();
    setLoading(true);

    try {
      let payload = {};
      if (activeTab === 'prompt') {
        if (!promptText.trim()) return;
        const styleObj = STYLES.find((s) => s.id === selectedStyle);
        const fullPrompt = styleObj ? `${promptText.trim()}, ${styleObj.suffix}` : promptText.trim();
        payload = {
          prompt: fullPrompt,
          product_name: promptText.slice(0, 40),
        };
      } else {
        if (!productName.trim()) return;
        payload = {
          product_name: productName,
          category,
          tagline,
          price,
          badge,
          theme,
        };
      }

      const res = await generateProductImage(payload);
      if (res.success && res.image_data_url) {
        setImageDataUrl(res.image_data_url);
      }
    } catch (err) {
      alert(err.message || 'Failed to generate AI image');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!imageDataUrl) return;
    const link = document.createElement('a');
    link.href = imageDataUrl;
    const name = activeTab === 'prompt' ? 'ai_generated_image' : productName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    link.download = `${name}_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          AI Image Generator & Studio
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Type any custom prompt or customize product details to generate stunning AI images.
        </p>
      </div>

      {/* Mode Switcher */}
      <div className="flex items-center justify-center">
        <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('prompt')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'prompt'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wand2 className="w-4 h-4" />
            <span>AI Prompt to Image</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('studio')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'studio'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Product Showcase Studio</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form: 7 cols */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
          <form onSubmit={handleGenerate} className="space-y-4">
            {/* 1. TAB: AI PROMPT MODE */}
            {activeTab === 'prompt' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5 flex items-center justify-between">
                    <span>Describe the Image You Want</span>
                    <span className="text-[11px] text-emerald-600 font-normal">Real-Time AI Turbo Engine</span>
                  </label>
                  <textarea
                    rows={4}
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    placeholder="e.g. A futuristic cybernetic sneaker glowing neon on a wet dark street, 8k resolution, photorealistic..."
                    required
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none transition"
                  />
                </div>

                {/* Style Selector */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                    Visual Style Preset
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {STYLES.map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setSelectedStyle(st.id)}
                        className={`p-2.5 rounded-xl text-xs text-left border transition ${
                          selectedStyle === st.id
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-bold shadow-xs'
                            : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Prompt Inspiration Suggestions */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>Quick Prompt Ideas</span>
                  </label>
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                    {PROMPT_SUGGESTIONS.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setPromptText(item)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200 text-[11px] text-slate-600 text-left transition"
                      >
                        {item.length > 45 ? `${item.slice(0, 45)}...` : item}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 2. TAB: PRODUCT STUDIO MODE */}
            {activeTab === 'studio' && (
              <div className="space-y-4">
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
                      placeholder="BESTSELLER"
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
              </div>
            )}

            {/* Generate Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition shadow-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating AI Image...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {activeTab === 'prompt' ? 'Generate AI Image from Prompt' : 'Generate Product Showcase Image'}
                  </span>
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
                  alt="Generated AI Product Visual"
                  className="w-full h-auto aspect-square object-cover rounded-xl shadow-xs"
                />
              </div>

              <div className="w-full pt-1">
                <button
                  onClick={handleDownload}
                  className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition flex items-center justify-center gap-2 shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Image (PNG)</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-slate-400 flex flex-col items-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                <ImageIcon className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">AI Preview Canvas</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Enter your prompt or product details and click Generate
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductImageGenerator;

