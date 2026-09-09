"""
Productivity Studio Tools Engine:
1. Studio Product Visualizer (renders high-quality product showcase visuals with category iconography and lighting)
2. AI-Powered Text Generation & Grammar Correction (powered by Groq AI and rule-based fallbacks)
"""

import os
import io
import base64
import math
import re
import httpx
from typing import Dict, Any, List, Optional
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance

def _load_groq_api_key() -> str:
    key = os.getenv("GROQ_API_KEY", "")
    if not key:
        env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
        if os.path.exists(env_path):
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    if line.startswith("GROQ_API_KEY="):
                        key = line.strip().split("=", 1)[1].strip("\"' ")
                        break
    return key

GROQ_API_KEY = _load_groq_api_key()
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODELS = ["openai/gpt-oss-120b", "qwen/qwen3.8-27b", "openai/gpt-oss-20b"]


class GroqAIService:
    """Helper to query Groq LLMs for grammar correction, rewriting, and copywriting."""

    @classmethod
    def generate(cls, system_prompt: str, user_prompt: str, api_key: Optional[str] = None) -> Optional[str]:
        key = api_key or GROQ_API_KEY
        if not key:
            return None

        headers = {
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json"
        }

        for model in GROQ_MODELS:
            try:
                with httpx.Client(verify=False, timeout=12.0) as client:
                    resp = client.post(
                        GROQ_API_URL,
                        headers=headers,
                        json={
                            "model": model,
                            "messages": [
                                {"role": "system", "content": system_prompt},
                                {"role": "user", "content": user_prompt}
                            ],
                            "temperature": 0.4,
                            "max_tokens": 1024
                        }
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        return data["choices"][0]["message"]["content"].strip()
            except Exception as e:
                continue

        return None


class ProductImageStudio:
    """Generates high-resolution studio showcase product images."""

    THEMES = {
        "studio_white": {
            "bg_top": (255, 255, 255),
            "bg_bottom": (238, 242, 246),
            "pedestal_top": (245, 248, 252),
            "pedestal_side": (210, 220, 230),
            "accent": (16, 185, 129),
            "text": (15, 23, 42),
            "subtext": (100, 116, 139)
        },
        "luxury_marble": {
            "bg_top": (30, 41, 59),
            "bg_bottom": (15, 23, 42),
            "pedestal_top": (51, 65, 85),
            "pedestal_side": (30, 41, 59),
            "accent": (245, 158, 11),
            "text": (255, 255, 255),
            "subtext": (148, 163, 184)
        },
        "minimalist_pastel": {
            "bg_top": (254, 242, 242),
            "bg_bottom": (240, 253, 250),
            "pedestal_top": (224, 242, 254),
            "pedestal_side": (186, 230, 253),
            "accent": (14, 165, 233),
            "text": (30, 41, 59),
            "subtext": (100, 116, 139)
        },
        "cyber_clean": {
            "bg_top": (15, 23, 42),
            "bg_bottom": (2, 6, 23),
            "pedestal_top": (30, 41, 59),
            "pedestal_side": (15, 23, 42),
            "accent": (6, 182, 212),
            "text": (248, 250, 252),
            "subtext": (148, 163, 184)
        },
        "warm_wood": {
            "bg_top": (255, 251, 235),
            "bg_bottom": (254, 243, 199),
            "pedestal_top": (245, 158, 11),
            "pedestal_side": (180, 83, 9),
            "accent": (217, 119, 6),
            "text": (69, 26, 3),
            "subtext": (146, 64, 14)
        }
    }

    CATEGORY_SYMBOLS = {
        "electronics": ("⚡", "ELECTRONICS & GADGETS", "HIGH PERFORMANCE • SMART CORE"),
        "footwear": ("👟", "FOOTWEAR & SNEAKERS", "PREMIUM CUSHION • DURABLE SOLE"),
        "fashion": ("✨", "APPAREL & FASHION", "LUXURY COTTON • MODERN FIT"),
        "watches": ("⌚", "LUXURY TIMEPIECE", "CHRONOGRAPH • SAPPHIRE GLASS"),
        "cosmetics": ("🌿", "BEAUTY & SKINCARE", "ORGANIC EXTRACT • DERMA TESTED"),
        "beverages": ("☕", "ARTISAN BEVERAGE", "SPECIALTY ROAST • PURE FLAVOR"),
        "furniture": ("🪑", "MODERN FURNITURE", "ERGONOMIC CRAFT • SOLID WOOD"),
        "general": ("📦", "PREMIUM PRODUCT", "VERIFIED AUTHENTIC • TOP TIER")
    }

    @classmethod
    def generate_product_image(
        cls,
        product_name: str,
        category: str = "electronics",
        tagline: str = "Premium Quality & Ergonomic Design",
        price: str = "$199.00",
        badge: str = "FEATURED PRODUCT",
        theme: str = "studio_white",
        width: int = 800,
        height: int = 800
    ) -> str:
        t = cls.THEMES.get(theme, cls.THEMES["studio_white"])
        img = Image.new("RGB", (width, height), t["bg_top"])
        draw = ImageDraw.Draw(img)

        # 1. Gradient Background
        for y in range(height):
            ratio = y / float(height)
            r = int(t["bg_top"][0] * (1 - ratio) + t["bg_bottom"][0] * ratio)
            g = int(t["bg_top"][1] * (1 - ratio) + t["bg_bottom"][1] * ratio)
            b = int(t["bg_top"][2] * (1 - ratio) + t["bg_bottom"][2] * ratio)
            draw.line([(0, y), (width, y)], fill=(r, g, b))

        # 2. Studio Spotlight Glow
        spotlight = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        sp_draw = ImageDraw.Draw(spotlight)
        center_x, center_y = width // 2, int(height * 0.44)
        for r in range(280, 0, -12):
            alpha = int(28 * (1 - r / 280.0))
            sp_draw.ellipse(
                (center_x - r, center_y - int(r * 0.65), center_x + r, center_y + int(r * 0.65)),
                fill=(255, 255, 255, alpha)
            )
        img = Image.alpha_composite(img.convert("RGBA"), spotlight).convert("RGB")
        draw = ImageDraw.Draw(img)

        # 3. 3D Floating Stage Pedestal
        ped_w, ped_h = int(width * 0.68), int(height * 0.16)
        ped_x1, ped_y1 = (width - ped_w) // 2, int(height * 0.56)
        ped_x2, ped_y2 = ped_x1 + ped_w, ped_y1 + ped_h

        # Ground Shadow
        draw.ellipse((ped_x1 - 25, ped_y1 + 15, ped_x2 + 25, ped_y2 + 35), fill=(0, 0, 0, 25) if theme != "studio_white" else (210, 220, 230))
        # Pedestal Sides
        draw.ellipse((ped_x1, ped_y1 + 10, ped_x2, ped_y2 + 10), fill=t["pedestal_side"])
        # Pedestal Top Platform
        draw.ellipse((ped_x1, ped_y1, ped_x2, ped_y2), fill=t["pedestal_top"])
        draw.ellipse((ped_x1 + 4, ped_y1 + 2, ped_x2 - 4, ped_y2 - 2), outline=t["accent"], width=2)

        # 4. Center Product Visual Hero Card
        box_w, box_h = int(width * 0.40), int(height * 0.38)
        bx1 = (width - box_w) // 2
        by1 = int(height * 0.22)
        bx2 = bx1 + box_w
        by2 = by1 + box_h

        # Hero product box with layered rounded borders
        draw.rounded_rectangle((bx1 - 4, by1 - 4, bx2 + 4, by2 + 4), radius=32, fill=(0, 0, 0, 15) if theme != "studio_white" else (225, 235, 245))
        draw.rounded_rectangle((bx1, by1, bx2, by2), radius=28, fill=t["pedestal_top"], outline=t["accent"], width=3)

        # Category iconography
        cat_key = category.lower()
        symbol, title_line, sub_line = cls.CATEGORY_SYMBOLS.get(cat_key, cls.CATEGORY_SYMBOLS["general"])

        draw.text((width // 2, by1 + int(box_h * 0.28)), symbol, fill=t["accent"], anchor="mm")
        draw.text((width // 2, by1 + int(box_h * 0.52)), title_line, fill=t["text"], anchor="mm")
        draw.text((width // 2, by1 + int(box_h * 0.70)), sub_line, fill=t["subtext"], anchor="mm")
        draw.text((width // 2, by1 + int(box_h * 0.86)), "★ ★ ★ ★ ★", fill=t["accent"], anchor="mm")

        # 5. Top Highlight Badge Pill
        if badge:
            badge_str = badge.upper().strip()
            bw = len(badge_str) * 9 + 32
            bh = 32
            draw.rounded_rectangle(((width - bw) // 2, int(height * 0.08), (width + bw) // 2, int(height * 0.08) + bh), radius=16, fill=t["accent"])
            draw.text((width // 2, int(height * 0.08) + bh // 2), badge_str, fill=(255, 255, 255), anchor="mm")

        # 6. Product Name & Tagline
        clean_name = product_name.strip() if product_name else "Studio Product"
        draw.text((width // 2, int(height * 0.76)), clean_name, fill=t["text"], anchor="mm")
        if tagline:
            draw.text((width // 2, int(height * 0.82)), tagline, fill=t["subtext"], anchor="mm")

        # 7. Price Badge
        if price:
            p_str = price.strip()
            pw = len(p_str) * 12 + 40
            ph = 38
            draw.rounded_rectangle(((width - pw) // 2, int(height * 0.88), (width + pw) // 2, int(height * 0.88) + ph), radius=19, fill=t["text"])
            draw.text((width // 2, int(height * 0.88) + ph // 2), p_str, fill=(255, 255, 255) if theme == "studio_white" else t["bg_top"], anchor="mm")

        buf = io.BytesIO()
        img.save(buf, format="PNG", quality=95)
        buf.seek(0)
        b64 = base64.b64encode(buf.read()).decode("utf-8")
        return f"data:image/png;base64,{b64}"


class TextCorrectionEngine:
    """Processes grammar correction, tone rewriting, and copy generation with Groq AI."""

    @classmethod
    def correct_grammar_and_spelling(cls, text: str, api_key: Optional[str] = None) -> Dict[str, Any]:
        original = text.strip()
        if not original:
            return {"original": "", "corrected": "", "changes_count": 0}

        # Try Groq AI first
        sys_prompt = "You are an expert grammar editor. Correct all spelling, grammar, punctuation, and capitalization errors in the user text. Return ONLY the final corrected text without explanations or extra conversational filler."
        ai_result = GroqAIService.generate(sys_prompt, original, api_key)
        
        if ai_result:
            return {
                "original": original,
                "corrected": ai_result,
                "ai_powered": True,
                "word_count": len(ai_result.split())
            }

        # Fallback heuristic fixer
        corrected = original
        common = {
            r"\b(teh|hte)\b": "the",
            r"\b(dont|doesnt|cant|wont|isnt|arent|didnt)\b": lambda m: m.group(0)[:-2] + "n't",
            r"\b(recieve|recieved)\b": lambda m: "receive" if "ve" in m.group(0) else "received",
            r"\b(seperate)\b": "separate",
            r"\b(alot)\b": "a lot",
            r"\s{2,}": " "
        }
        for pat, rep in common.items():
            corrected = re.sub(pat, rep, corrected, flags=re.IGNORECASE)

        if corrected and corrected[-1] not in ".!?":
            corrected += "."

        return {
            "original": original,
            "corrected": corrected[0].upper() + corrected[1:] if corrected else "",
            "ai_powered": False,
            "word_count": len(corrected.split())
        }

    @classmethod
    def rewrite_tone(cls, text: str, tone: str = "professional", api_key: Optional[str] = None) -> Dict[str, Any]:
        original = text.strip()
        
        # Try Groq AI
        sys_prompt = f"You are a professional copywriting editor. Rewrite the following text in a {tone} tone. Keep the core meaning clear, polished, and natural. Return ONLY the rewritten text without markdown fences or preamble."
        ai_result = GroqAIService.generate(sys_prompt, original, api_key)

        if ai_result:
            return {
                "original": original,
                "rewritten": ai_result,
                "tone": tone,
                "ai_powered": True,
                "word_count": len(ai_result.split())
            }

        # Fallback
        return {
            "original": original,
            "rewritten": f"In accordance with our standards: {original}",
            "tone": tone,
            "ai_powered": False,
            "word_count": len(original.split())
        }

    @classmethod
    def generate_product_description(cls, product_name: str, features: List[str], target_audience: str = "Consumers", api_key: Optional[str] = None) -> Dict[str, Any]:
        name = (product_name or "Premium Product").strip()
        feat_list = [f.strip() for f in features if f.strip()]
        features_text = ", ".join(feat_list) if feat_list else "High quality, durable, modern design"

        # Try Groq AI
        sys_prompt = "You are an award-winning e-commerce copywriter. Write a compelling, high-converting product title, short overview paragraph, bulleted key highlights, and a call-to-action for the product. Format cleanly."
        user_prompt = f"Product Name: {name}\nKey Features: {features_text}\nTarget Audience: {target_audience}"
        
        ai_result = GroqAIService.generate(sys_prompt, user_prompt, api_key)

        if ai_result:
            return {
                "headline": f"{name} - Official Overview",
                "full_copy": ai_result,
                "features": feat_list,
                "ai_powered": True,
                "word_count": len(ai_result.split())
            }

        # Fallback
        headline = f"Introducing {name}: Designed for Modern Living"
        overview = f"Experience the perfect fusion of innovation and reliability with {name}. Tailored for {target_audience.lower()}, it delivers uncompromising quality."
        bullets = [f"• {f}" for f in feat_list]
        full_copy = f"{headline}\n\n{overview}\n\nKey Highlights:\n" + "\n".join(bullets) + "\n\nOrder today to elevate your everyday workflow."

        return {
            "headline": headline,
            "full_copy": full_copy,
            "features": feat_list,
            "ai_powered": False,
            "word_count": len(full_copy.split())
        }
