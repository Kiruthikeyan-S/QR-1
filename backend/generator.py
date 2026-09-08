"""
QR Code Generator Service
Generates styled QR codes for various standardized types (WiFi, UPI, vCard, URL, Text)
and outputs base64 data URIs / PNG bytes.
"""

import io
import base64
import qrcode
from qrcode.constants import ERROR_CORRECT_H, ERROR_CORRECT_M
from typing import Dict, Any


class QRGenerator:
    """Helper to construct standard raw strings and render QR PNGs."""

    @staticmethod
    def build_raw_string(qr_type: str, params: Dict[str, Any]) -> str:
        t = qr_type.lower()
        if t == "url":
            url = params.get("url", "").strip()
            if not url.startswith(("http://", "https://", "ftp://")):
                url = "https://" + url
            return url

        elif t == "wifi":
            ssid = params.get("ssid", "").replace(";", r"\;").replace(":", r"\:").replace("\\", r"\\")
            password = params.get("password", "").replace(";", r"\;").replace(":", r"\:").replace("\\", r"\\")
            auth = params.get("auth_type", "WPA")
            hidden = "true" if params.get("hidden", False) else "false"
            return f"WIFI:T:{auth};S:{ssid};P:{password};H:{hidden};;"

        elif t == "upi":
            pa = params.get("payee_vpa", "").strip()
            pn = params.get("payee_name", "").strip()
            am = params.get("amount", "").strip()
            cu = params.get("currency", "INR").strip()
            tn = params.get("note", "").strip()
            query_parts = [f"pa={pa}"]
            if pn:
                query_parts.append(f"pn={pn}")
            if am:
                query_parts.append(f"am={am}")
            if cu:
                query_parts.append(f"cu={cu}")
            if tn:
                query_parts.append(f"tn={tn}")
            return f"upi://pay?{'&'.join(query_parts)}"

        elif t == "contact":
            fn = params.get("name", "").strip()
            first = params.get("first_name", "")
            last = params.get("last_name", "")
            org = params.get("organization", "").strip()
            title = params.get("title", "").strip()
            phone = params.get("phone", "").strip()
            email = params.get("email", "").strip()
            url = params.get("url", "").strip()
            note = params.get("note", "").strip()

            vcard = ["BEGIN:VCARD", "VERSION:3.0"]
            if fn:
                vcard.append(f"FN:{fn}")
            if first or last:
                vcard.append(f"N:{last};{first};;;")
            elif fn:
                vcard.append(f"N:{fn};;;;")
            if org:
                vcard.append(f"ORG:{org}")
            if title:
                vcard.append(f"TITLE:{title}")
            if phone:
                vcard.append(f"TEL;TYPE=CELL:{phone}")
            if email:
                vcard.append(f"EMAIL:{email}")
            if url:
                vcard.append(f"URL:{url}")
            if note:
                vcard.append(f"NOTE:{note}")
            vcard.append("END:VCARD\n")
            return "\n".join(vcard)

        elif t == "email":
            to = params.get("to", "").strip()
            sub = params.get("subject", "").strip()
            body = params.get("body", "").strip()
            return f"MATMSG:TO:{to};SUB:{sub};BODY:{body};;"

        elif t == "sms":
            phone = params.get("phone", "").strip()
            msg = params.get("message", "").strip()
            return f"SMSTO:{phone}:{msg}"

        elif t == "tel":
            phone = params.get("phone", "").strip()
            return f"tel:{phone}"

        elif t == "geo":
            lat = params.get("latitude", "0")
            lon = params.get("longitude", "0")
            query = params.get("query", "")
            if query:
                return f"geo:{lat},{lon}?q={query}"
            return f"geo:{lat},{lon}"

        else:
            return params.get("text", "")

    @classmethod
    def generate_qr_base64(cls, raw_data: str, fill_color: str = "black", back_color: str = "white", box_size: int = 10, border: int = 4) -> str:
        """Generates QR code and returns as data URI image/png;base64,..."""
        qr = qrcode.QRCode(
            version=None,
            error_correction=ERROR_CORRECT_M,
            box_size=box_size,
            border=border
        )
        qr.add_data(raw_data)
        qr.make(fit=True)

        img = qr.make_image(fill_color=fill_color, back_color=back_color)
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        buf.seek(0)
        b64 = base64.b64encode(buf.read()).decode("utf-8")
        return f"data:image/png;base64,{b64}"
