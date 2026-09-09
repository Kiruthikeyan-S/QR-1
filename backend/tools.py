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


def _get_font(size: int, bold: bool = False) -> ImageFont.ImageFont:
    """Safely loads system TrueType fonts on Windows or falls back gracefully."""
    font_names = (
        ['arialbd.ttf', 'segoeuib.ttf', 'calibrib.ttf', 'tahomabd.ttf']
        if bold else
        ['arial.ttf', 'segoeui.ttf', 'calibri.ttf', 'tahoma.ttf']
    )
    for name in font_names:
        try:
            return ImageFont.truetype(name, size)
        except Exception:
            continue
    return ImageFont.load_default()


class ProductImageStudio:
    """Generates high-resolution studio showcase product images with category artwork."""

    THEMES = {
        "studio_white": {
            "bg_top": (255, 255, 255),
            "bg_bottom": (235, 240, 248),
            "pedestal_top": (245, 248, 252),
            "pedestal_side": (205, 215, 228),
            "accent": (16, 185, 129),
            "card_bg": (255, 255, 255),
            "card_border": (226, 232, 240),
            "text": (15, 23, 42),
            "subtext": (100, 116, 139)
        },
        "luxury_marble": {
            "bg_top": (30, 41, 59),
            "bg_bottom": (15, 23, 42),
            "pedestal_top": (51, 65, 85),
            "pedestal_side": (30, 41, 59),
            "accent": (245, 158, 11),
            "card_bg": (30, 41, 59),
            "card_border": (71, 85, 105),
            "text": (255, 255, 255),
            "subtext": (148, 163, 184)
        },
        "minimalist_pastel": {
            "bg_top": (254, 242, 242),
            "bg_bottom": (240, 253, 250),
            "pedestal_top": (255, 255, 255),
            "pedestal_side": (224, 231, 255),
            "accent": (14, 165, 233),
            "card_bg": (255, 255, 255),
            "card_border": (243, 232, 255),
            "text": (30, 41, 59),
            "subtext": (100, 116, 139)
        },
        "cyber_clean": {
            "bg_top": (15, 23, 42),
            "bg_bottom": (2, 6, 23),
            "pedestal_top": (30, 41, 59),
            "pedestal_side": (15, 23, 42),
            "accent": (6, 182, 212),
            "card_bg": (15, 23, 42),
            "card_border": (30, 58, 138),
            "text": (248, 250, 252),
            "subtext": (148, 163, 184)
        },
        "warm_wood": {
            "bg_top": (255, 251, 235),
            "bg_bottom": (254, 243, 199),
            "pedestal_top": (255, 255, 255),
            "pedestal_side": (217, 119, 6),
            "accent": (217, 119, 6),
            "card_bg": (255, 255, 255),
            "card_border": (253, 230, 138),
            "text": (69, 26, 3),
            "subtext": (146, 64, 14)
        }
    }

    @classmethod
    def _draw_product_artwork(cls, draw: ImageDraw.ImageDraw, category: str, cx: int, cy: int, accent: tuple, text_col: tuple):
        """Draws a clean, high-definition stylized product vector."""
        cat = category.lower()
        if cat == "electronics":
            # Over-ear Headphones
            # Headband arc
            draw.arc((cx - 90, cy - 95, cx + 90, cy + 30), start=180, end=360, fill=text_col, width=12)
            draw.arc((cx - 75, cy - 85, cx + 75, cy + 20), start=190, end=350, fill=accent, width=4)
            # Left & right ear cups
            draw.rounded_rectangle((cx - 105, cy - 25, cx - 65, cy + 55), radius=16, fill=text_col, outline=accent, width=3)
            draw.rounded_rectangle((cx + 65, cy - 25, cx + 105, cy + 55), radius=16, fill=text_col, outline=accent, width=3)
            # Inner speaker cushions
            draw.ellipse((cx - 95, cy - 10, cx - 75, cy + 40), fill=accent)
            draw.ellipse((cx + 75, cy - 10, cx + 95, cy + 40), fill=accent)
            # Sound waves
            draw.arc((cx - 130, cy - 15, cx - 110, cy + 45), start=110, end=250, fill=accent, width=3)
            draw.arc((cx + 110, cy - 15, cx + 130, cy + 45), start=290, end=70, fill=accent, width=3)

        elif cat == "watches":
            # Luxury Chronograph Watch
            # Watch Straps
            draw.rounded_rectangle((cx - 30, cy - 105, cx + 30, cy - 50), radius=6, fill=text_col)
            draw.rounded_rectangle((cx - 30, cy + 50, cx + 30, cy + 105), radius=6, fill=text_col)
            # Outer Bezel
            draw.ellipse((cx - 65, cy - 65, cx + 65, cy + 65), fill=accent, outline=text_col, width=4)
            # Dial Face
            draw.ellipse((cx - 52, cy - 52, cx + 52, cy + 52), fill=(255, 255, 255), outline=text_col, width=2)
            # Hour markers & Subdials
            draw.ellipse((cx - 18, cy - 25, cx + 18, cy + 5), fill=(240, 245, 250), outline=accent, width=1)
            # Watch Hands
            draw.line([(cx, cy), (cx, cy - 35)], fill=text_col, width=4)
            draw.line([(cx, cy), (cx + 26, cy + 12)], fill=accent, width=3)
            draw.ellipse((cx - 5, cy - 5, cx + 5, cy + 5), fill=accent)

        elif cat == "footwear":
            # Athletic Sneaker
            # Outsole
            draw.polygon([
                (cx - 90, cy + 45), (cx + 85, cy + 45), (cx + 95, cy + 30),
                (cx + 80, cy + 20), (cx + 40, cy + 20), (cx - 20, cy + 35),
                (cx - 75, cy + 35), (cx - 90, cy + 45)
            ], fill=accent, outline=text_col)
            # Sneaker Body Upper
            draw.polygon([
                (cx - 85, cy + 35), (cx - 80, cy - 5), (cx - 55, cy - 25),
                (cx - 20, cy - 15), (cx + 25, cy - 5), (cx + 70, cy + 10),
                (cx + 80, cy + 20), (cx - 20, cy + 35)
            ], fill=text_col)
            # Collar & Swoosh line
            draw.arc((cx - 65, cy - 30, cx - 15, cy + 5), start=180, end=360, fill=accent, width=4)
            draw.line([(cx - 40, cy + 15), (cx + 10, cy + 22), (cx + 55, cy + 12)], fill=accent, width=5)

        elif cat == "cosmetics":
            # Premium Skincare Bottle
            # Glass Bottle Body
            draw.rounded_rectangle((cx - 38, cy - 30, cx + 38, cy + 65), radius=16, fill=(245, 250, 255), outline=accent, width=3)
            # Liquid level
            draw.rounded_rectangle((cx - 32, cy + 5, cx + 32, cy + 58), radius=10, fill=accent)
            # Gold Collar & Dropper Cap
            draw.rounded_rectangle((cx - 22, cy - 55, cx + 22, cy - 30), radius=4, fill=text_col)
            draw.rounded_rectangle((cx - 12, cy - 80, cx + 12, cy - 55), radius=8, fill=accent)

        elif cat == "beverages":
            # Modern Artisan Cup / Tumbler
            draw.polygon([
                (cx - 45, cy - 45), (cx + 45, cy - 45),
                (cx + 34, cy + 60), (cx - 34, cy + 60)
            ], fill=(245, 250, 255), outline=text_col)
            # Cup Sleeve
            draw.polygon([
                (cx - 40, cy - 10), (cx + 40, cy - 10),
                (cx + 36, cy + 30), (cx - 36, cy + 30)
            ], fill=accent)
            # Steam curves
            draw.arc((cx - 25, cy - 85, cx - 5, cy - 50), start=240, end=60, fill=accent, width=3)
            draw.arc((cx + 5, cy - 85, cx + 25, cy - 50), start=240, end=60, fill=accent, width=3)

        elif cat == "fashion":
            # Luxury Apparel Coat / Blazer Silhouette
            draw.polygon([
                (cx, cy - 65), (cx - 75, cy - 35), (cx - 55, cy + 65),
                (cx - 25, cy + 65), (cx, cy - 10), (cx + 25, cy + 65),
                (cx + 55, cy + 65), (cx + 75, cy - 35)
            ], fill=text_col, outline=accent)
            # Lapel Collar
            draw.polygon([(cx, cy - 65), (cx - 25, cy - 10), (cx, cy + 15), (cx + 25, cy - 10)], fill=accent)

        elif cat == "furniture":
            # Modern Armchair
            # Seat Cushion & Backrest
            draw.rounded_rectangle((cx - 60, cy - 65, cx + 60, cy + 15), radius=18, fill=text_col)
            draw.rounded_rectangle((cx - 68, cy + 5, cx + 68, cy + 35), radius=12, fill=accent)
            # Wooden Legs
            draw.line([(cx - 45, cy + 35), (cx - 58, cy + 78)], fill=text_col, width=6)
            draw.line([(cx + 45, cy + 35), (cx + 58, cy + 78)], fill=text_col, width=6)

        else:
            # General Product Box
            draw.rounded_rectangle((cx - 55, cy - 55, cx + 55, cy + 55), radius=16, fill=accent, outline=text_col, width=3)
            draw.line([(cx - 55, cy), (cx + 55, cy)], fill=text_col, width=4)
            draw.line([(cx, cy - 55), (cx, cy + 55)], fill=text_col, width=4)

    @classmethod
    def generate_product_image(
        cls,
        product_name: str,
        category: str = "electronics",
        tagline: str = "Premium Quality & Ergonomic Design",
        price: str = "$199.00",
        badge: str = "BESTSELLER",
        theme: str = "studio_white",
        width: int = 800,
        height: int = 800
    ) -> str:
        t = cls.THEMES.get(theme, cls.THEMES["studio_white"])
        img = Image.new("RGB", (width, height), t["bg_top"])
        draw = ImageDraw.Draw(img)

        # 1. Gradient Studio Background
        for y in range(height):
            ratio = y / float(height)
            r = int(t["bg_top"][0] * (1 - ratio) + t["bg_bottom"][0] * ratio)
            g = int(t["bg_top"][1] * (1 - ratio) + t["bg_bottom"][1] * ratio)
            b = int(t["bg_top"][2] * (1 - ratio) + t["bg_bottom"][2] * ratio)
            draw.line([(0, y), (width, y)], fill=(r, g, b))

        # 2. Studio Spotlight Glow
        spotlight = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        sp_draw = ImageDraw.Draw(spotlight)
        center_x, center_y = width // 2, int(height * 0.40)
        for r in range(300, 0, -12):
            alpha = int(32 * (1 - r / 300.0))
            sp_draw.ellipse(
                (center_x - r, center_y - int(r * 0.65), center_x + r, center_y + int(r * 0.65)),
                fill=(255, 255, 255, alpha)
            )
        img = Image.alpha_composite(img.convert("RGBA"), spotlight).convert("RGB")
        draw = ImageDraw.Draw(img)

        # 3. 3D Floating Stage Pedestal
        ped_w, ped_h = int(width * 0.72), int(height * 0.16)
        ped_x1, ped_y1 = (width - ped_w) // 2, int(height * 0.54)
        ped_x2, ped_y2 = ped_x1 + ped_w, ped_y1 + ped_h

        # Ground Shadow
        draw.ellipse((ped_x1 - 30, ped_y1 + 18, ped_x2 + 30, ped_y2 + 38), fill=(0, 0, 0, 25) if theme != "studio_white" else (205, 215, 228))
        # Pedestal Sides
        draw.ellipse((ped_x1, ped_y1 + 12, ped_x2, ped_y2 + 12), fill=t["pedestal_side"])
        # Pedestal Top Platform
        draw.ellipse((ped_x1, ped_y1, ped_x2, ped_y2), fill=t["pedestal_top"])
        draw.ellipse((ped_x1 + 4, ped_y1 + 2, ped_x2 - 4, ped_y2 - 2), outline=t["accent"], width=2)

        # 4. Hero Product Card Container & Artwork
        hero_w, hero_h = int(width * 0.46), int(height * 0.38)
        hx1, hy1 = (width - hero_w) // 2, int(height * 0.17)
        hx2, hy2 = hx1 + hero_w, hy1 + hero_h

        # Soft shadow behind card
        draw.rounded_rectangle((hx1 - 4, hy1 + 4, hx2 + 4, hy2 + 12), radius=32, fill=(0, 0, 0, 20) if theme != "studio_white" else (218, 226, 236))
        # Main Hero Card
        draw.rounded_rectangle((hx1, hy1, hx2, hy2), radius=28, fill=t["card_bg"], outline=t["accent"], width=3)

        # Render Authentic Category Illustration
        art_cy = hy1 + int(hero_h * 0.50)
        cls._draw_product_artwork(draw, category, width // 2, art_cy, t["accent"], t["text"])

        # 5. Top Badge Pill (Large TrueType Font)
        if badge:
            badge_str = badge.upper().strip()
            font_badge = _get_font(18, bold=True)
            bw = len(badge_str) * 11 + 36
            bh = 36
            bx1, by1 = (width - bw) // 2, int(height * 0.05)
            draw.rounded_rectangle((bx1, by1, bx1 + bw, by1 + bh), radius=18, fill=t["accent"])
            draw.text((width // 2, by1 + bh // 2), badge_str, fill=(255, 255, 255), font=font_badge, anchor="mm")

        # 6. Product Name & Tagline (Large TrueType Typography)
        clean_name = product_name.strip() if product_name else "Studio Product"
        font_title = _get_font(30, bold=True)
        draw.text((width // 2, int(height * 0.74)), clean_name, fill=t["text"], font=font_title, anchor="mm")

        if tagline:
            font_tagline = _get_font(18, bold=False)
            draw.text((width // 2, int(height * 0.81)), tagline.strip(), fill=t["subtext"], font=font_tagline, anchor="mm")

        # 7. Price Badge (Large Bold Pill)
        if price:
            p_str = price.strip()
            font_price = _get_font(24, bold=True)
            pw = len(p_str) * 14 + 48
            ph = 44
            px1, py1 = (width - pw) // 2, int(height * 0.87)
            draw.rounded_rectangle((px1, py1, px1 + pw, py1 + ph), radius=22, fill=t["text"])
            draw.text((width // 2, py1 + ph // 2), p_str, fill=(255, 255, 255) if theme in ["studio_white", "minimalist_pastel", "warm_wood"] else t["bg_top"], font=font_price, anchor="mm")

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
