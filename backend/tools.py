"""
Specialized Productivity Tools Service:
1. Product Image Generation Engine (clean studio product visualizer with customizable styles and badges)
2. Text Generation & Grammar Correction Engine (grammar fix, tone adjustment, and product description builder)
"""

import io
import base64
import math
import re
from typing import Dict, Any, List, Optional
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance


class ProductImageStudio:
    """Generates styled, high-res studio product showcase images."""

    THEMES = {
        "studio_white": {
            "bg_top": (255, 255, 255),
            "bg_bottom": (240, 244, 248),
            "pedestal": (225, 232, 240),
            "accent": (16, 185, 129),
            "text": (15, 23, 42),
            "subtext": (100, 116, 139)
        },
        "luxury_marble": {
            "bg_top": (26, 32, 44),
            "bg_bottom": (15, 23, 42),
            "pedestal": (45, 55, 72),
            "accent": (245, 158, 11),
            "text": (255, 255, 255),
            "subtext": (148, 163, 184)
        },
        "minimalist_pastel": {
            "bg_top": (254, 242, 242),
            "bg_bottom": (240, 253, 250),
            "pedestal": (224, 242, 254),
            "accent": (14, 165, 233),
            "text": (30, 41, 59),
            "subtext": (100, 116, 139)
        },
        "cyber_clean": {
            "bg_top": (10, 15, 30),
            "bg_bottom": (15, 23, 42),
            "pedestal": (30, 41, 59),
            "accent": (6, 182, 212),
            "text": (248, 250, 252),
            "subtext": (148, 163, 184)
        },
        "warm_wood": {
            "bg_top": (255, 251, 235),
            "bg_bottom": (254, 243, 199),
            "pedestal": (217, 119, 6),
            "accent": (180, 83, 9),
            "text": (69, 26, 3),
            "subtext": (146, 64, 14)
        }
    }

    CATEGORY_ICONS = {
        "electronics": "⚡ ELECTRONICS • HIGH PERFORMANCE",
        "footwear": "👟 FOOTWEAR • PREMIUM COMFORT",
        "fashion": "✨ APPAREL • NEW COLLECTION",
        "watches": "⌚ TIMEPIECE • LUXURY CRAFT",
        "cosmetics": "🌿 BEAUTY • ORGANIC CARE",
        "beverages": "☕ BEVERAGE • ARTISAN BLEND",
        "furniture": "🪑 FURNITURE • MODERN LIVING",
        "general": "📦 PRODUCT • VERIFIED QUALITY"
    }

    @classmethod
    def generate_product_image(
        cls,
        product_name: str,
        category: str = "electronics",
        tagline: str = "Premium Quality & Ergonomic Design",
        price: str = "$99.00",
        badge: str = "FEATURED PRODUCT",
        theme: str = "studio_white",
        width: int = 800,
        height: int = 800
    ) -> str:
        t = cls.THEMES.get(theme, cls.THEMES["studio_white"])
        img = Image.new("RGB", (width, height), t["bg_top"])
        draw = ImageDraw.Draw(img)

        # 1. Gradient studio backdrop
        for y in range(height):
            ratio = y / float(height)
            r = int(t["bg_top"][0] * (1 - ratio) + t["bg_bottom"][0] * ratio)
            g = int(t["bg_top"][1] * (1 - ratio) + t["bg_bottom"][1] * ratio)
            b = int(t["bg_top"][2] * (1 - ratio) + t["bg_bottom"][2] * ratio)
            draw.line([(0, y), (width, y)], fill=(r, g, b))

        # 2. Studio soft spotlight
        spotlight = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        sp_draw = ImageDraw.Draw(spotlight)
        center_x, center_y = width // 2, int(height * 0.45)
        for r in range(260, 0, -10):
            alpha = int(25 * (1 - r / 260.0))
            sp_draw.ellipse(
                (center_x - r, center_y - int(r * 0.7), center_x + r, center_y + int(r * 0.7)),
                fill=(255, 255, 255, alpha)
            )
        img = Image.alpha_composite(img.convert("RGBA"), spotlight).convert("RGB")
        draw = ImageDraw.Draw(img)

        # 3. Floating 3D Pedestal Stage
        ped_w, ped_h = int(width * 0.65), int(height * 0.14)
        ped_x1, ped_y1 = (width - ped_w) // 2, int(height * 0.58)
        ped_x2, ped_y2 = ped_x1 + ped_w, ped_y1 + ped_h

        # Pedestal shadow
        shadow_box = (ped_x1 - 20, ped_y1 + 10, ped_x2 + 20, ped_y2 + 30)
        draw.ellipse(shadow_box, fill=(0, 0, 0, 30) if theme != "studio_white" else (200, 210, 220))
        # Pedestal base
        draw.ellipse((ped_x1, ped_y1 + 8, ped_x2, ped_y2 + 8), fill=(int(t["pedestal"][0]*0.85), int(t["pedestal"][1]*0.85), int(t["pedestal"][2]*0.85)))
        draw.ellipse((ped_x1, ped_y1, ped_x2, ped_y2), fill=t["pedestal"])
        draw.ellipse((ped_x1 + 6, ped_y1 + 3, ped_x2 - 6, ped_y2 - 3), outline=t["accent"], width=2)

        # 4. Product Visual Representation Box / Silhouette
        prod_box_w, prod_box_h = int(width * 0.36), int(height * 0.36)
        p_x1 = (width - prod_box_w) // 2
        p_y1 = int(height * 0.26)
        p_x2 = p_x1 + prod_box_w
        p_y2 = p_y1 + prod_box_h

        # Product container box
        draw.rounded_rectangle((p_x1, p_y1, p_x2, p_y2), radius=28, fill=t["pedestal"], outline=t["accent"], width=2)
        
        # Product Category Banner text inside box
        cat_key = category.lower()
        cat_label = cls.CATEGORY_ICONS.get(cat_key, cls.CATEGORY_ICONS["general"])
        draw.text((width // 2, p_y1 + int(prod_box_h * 0.45)), cat_label, fill=t["accent"], anchor="mm")
        draw.text((width // 2, p_y1 + int(prod_box_h * 0.65)), f"★ ★ ★ ★ ★", fill=t["accent"], anchor="mm")

        # 5. Top Category / Badge Pill
        if badge:
            badge_text = badge.upper()
            b_w = len(badge_text) * 8 + 30
            b_h = 30
            b_x = (width - b_w) // 2
            b_y = int(height * 0.08)
            draw.rounded_rectangle((b_x, b_y, b_x + b_w, b_y + b_h), radius=15, fill=t["accent"])
            draw.text((width // 2, b_y + b_h // 2), badge_text, fill=(255, 255, 255), anchor="mm")

        # 6. Product Name and Tagline
        clean_name = product_name.strip() if product_name else "Studio Product"
        draw.text((width // 2, int(height * 0.77)), clean_name, fill=t["text"], anchor="mm")
        
        if tagline:
            draw.text((width // 2, int(height * 0.83)), tagline, fill=t["subtext"], anchor="mm")

        # 7. Price Badge
        if price:
            p_text = price.strip()
            p_w = len(p_text) * 11 + 36
            p_h = 36
            px1 = (width - p_w) // 2
            py1 = int(height * 0.88)
            draw.rounded_rectangle((px1, py1, px1 + p_w, py1 + p_h), radius=18, fill=t["text"])
            draw.text((width // 2, py1 + p_h // 2), p_text, fill=(255, 255, 255) if theme == "studio_white" else t["bg_top"], anchor="mm")

        # Convert to Base64 Data URL
        buf = io.BytesIO()
        img.save(buf, format="PNG", quality=95)
        buf.seek(0)
        b64 = base64.b64encode(buf.read()).decode("utf-8")
        return f"data:image/png;base64,{b64}"


class TextCorrectionEngine:
    """Processes grammar correction, tone adjustment, and product description generation."""

    COMMON_FIXES = {
        r"\b(teh|hte)\b": "the",
        r"\b(dont|doesnt|cant|wont|isnt|arent|didnt)\b": lambda m: m.group(0)[:-2] + "n't" if "nt" in m.group(0) else m.group(0),
        r"\b(recieve|recieved)\b": lambda m: "receive" if "ve" in m.group(0) else "received",
        r"\b(seperate|seperated)\b": lambda m: "separate" if "te" in m.group(0) else "separated",
        r"\b(untill)\b": "until",
        r"\b(definately)\b": "definitely",
        r"\b(thier)\b": "their",
        r"\b(occured)\b": "occurred",
        r"\b(alot)\b": "a lot",
        r"\b(i)\b": "I",
        r"\s{2,}": " ",
        r"\s+([,\.\?!;:])": r"\1",
    }

    @classmethod
    def correct_grammar_and_spelling(cls, text: str) -> Dict[str, Any]:
        original = text.strip()
        if not original:
            return {"original": "", "corrected": "", "changes_count": 0, "changes": []}

        corrected = original
        changes: List[str] = []

        # Fix capitalization of first letters of sentences
        def cap_sentence(t: str) -> str:
            sentences = re.split(r'([.!?]\s*)', t)
            result = []
            for s in sentences:
                if s and not re.match(r'^[.!?]\s*$', s):
                    s = s[0].upper() + s[1:] if len(s) > 0 else s
                result.append(s)
            return "".join(result)

        # Apply regex common fixes
        for pattern, replacement in cls.COMMON_FIXES.items():
            if re.search(pattern, corrected, re.IGNORECASE):
                corrected = re.sub(pattern, replacement, corrected, flags=re.IGNORECASE)
                changes.append(f"Standardized spelling/spacing in {pattern}")

        corrected = cap_sentence(corrected)

        # Add period if missing at end
        if corrected and corrected[-1] not in ".!?":
            corrected += "."

        return {
            "original": original,
            "corrected": corrected,
            "changes_count": len(changes),
            "word_count": len(corrected.split()),
            "character_count": len(corrected)
        }

    @classmethod
    def rewrite_tone(cls, text: str, tone: str = "professional") -> Dict[str, Any]:
        corrected_dict = cls.correct_grammar_and_spelling(text)
        base = corrected_dict["corrected"]

        t = tone.lower()
        if t == "professional":
            rewritten = f"We are pleased to present the following: {base} Please let us know if you require further assistance."
        elif t == "concise":
            # Strip fluff
            rewritten = re.sub(r'\b(very|really|actually|basically|in order to|just)\b\s*', '', base, flags=re.IGNORECASE)
        elif t == "friendly":
            rewritten = f"Hi there! 😊 {base} Hope you have a wonderful day ahead!"
        elif t == "marketing":
            rewritten = f"✨ Elevate your experience: {base} Discover the difference today with unmatched quality and performance."
        else:
            rewritten = base

        return {
            "original": text,
            "rewritten": rewritten.strip(),
            "tone": tone,
            "word_count": len(rewritten.split())
        }

    @classmethod
    def generate_product_description(cls, product_name: str, features: List[str], target_audience: str = "Consumers") -> Dict[str, Any]:
        name = (product_name or "Premium Product").strip()
        feat_list = [f.strip() for f in features if f.strip()]
        if not feat_list:
            feat_list = ["Superior build quality", "Ergonomic & modern design", "Long-lasting durability"]

        headline = f"Introducing {name}: Designed for Modern Living"
        overview = f"Experience the perfect fusion of innovation and reliability with {name}. Tailored specifically for {target_audience.lower()}, it delivers uncompromising quality and seamless everyday utility."

        bullets = [f"• {f}" for f in feat_list]

        full_copy = f"{headline}\n\n{overview}\n\nKey Highlights:\n" + "\n".join(bullets) + "\n\nOrder today to elevate your everyday workflow."

        return {
            "headline": headline,
            "overview": overview,
            "features": feat_list,
            "full_copy": full_copy,
            "word_count": len(full_copy.split())
        }
