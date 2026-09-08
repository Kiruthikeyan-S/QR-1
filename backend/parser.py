"""
QR Reader Data Parser & Validation Engine
Parses raw QR strings into typed, validated, and structured JSON objects.
Supported formats: URL, WiFi, UPI, Contact (vCard/MeCard), Email, SMS, Tel, Geo, Crypto, JSON, Text.
"""

import re
import json
import urllib.parse
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
import vobject


class ActionButton(BaseModel):
    id: str
    label: str
    icon: str
    action_type: str  # "link", "copy", "download", "call", "sms", "email", "wifi_connect", "upi_pay"
    payload: str
    primary: bool = False


class StructuredQRResult(BaseModel):
    raw_data: str
    data_type: str  # "url", "wifi", "upi", "contact", "email", "sms", "tel", "geo", "crypto", "json", "text"
    title: str
    summary: str
    icon: str
    badge_color: str
    parsed_details: Dict[str, Any]
    actions: List[ActionButton] = Field(default_factory=list)
    validation_status: str = "valid"  # "valid", "warning", "info"
    validation_notes: Optional[str] = None


class QRDataParser:
    """Core parser for analyzing and structuring QR code string contents."""

    @classmethod
    def parse(cls, raw: str) -> StructuredQRResult:
        raw_str = (raw or "").strip()
        if not raw_str:
            return StructuredQRResult(
                raw_data="",
                data_type="text",
                title="Empty Data",
                summary="The QR code contained no data.",
                icon="AlertCircle",
                badge_color="gray",
                parsed_details={"text": ""},
                actions=[],
                validation_status="warning",
                validation_notes="Empty payload detected"
            )

        # Order of precedence for parsing:
        # 1. UPI Payment
        if raw_str.startswith("upi://pay"):
            return cls._parse_upi(raw_str)

        # 2. WiFi
        if raw_str.upper().startswith("WIFI:"):
            return cls._parse_wifi(raw_str)

        # 3. vCard / MeCard (Contact)
        if "BEGIN:VCARD" in raw_str.upper() or raw_str.upper().startswith("MECARD:"):
            return cls._parse_contact(raw_str)

        # 4. Email (mailto / MATMSG / SMTP)
        if raw_str.lower().startswith("mailto:") or raw_str.upper().startswith("MATMSG:") or raw_str.upper().startswith("SMTP:"):
            return cls._parse_email(raw_str)

        # 5. SMS
        if raw_str.lower().startswith("smsto:") or raw_str.lower().startswith("sms:"):
            return cls._parse_sms(raw_str)

        # 6. Phone / Tel
        if raw_str.lower().startswith("tel:") or cls._is_phone_number(raw_str):
            return cls._parse_tel(raw_str)

        # 7. Geo Location
        if raw_str.lower().startswith("geo:") or cls._is_geo_coords(raw_str):
            return cls._parse_geo(raw_str)

        # 8. Crypto (Bitcoin, Ethereum, Solana)
        if cls._is_crypto(raw_str):
            return cls._parse_crypto(raw_str)

        # 9. URL (HTTP / HTTPS / FTP)
        if cls._is_url(raw_str):
            return cls._parse_url(raw_str)

        # 10. JSON Object / Array
        json_parsed = cls._try_parse_json(raw_str)
        if json_parsed is not None:
            return cls._parse_json_result(raw_str, json_parsed)

        # 11. Fallback Plain Text
        return cls._parse_plain_text(raw_str)

    # ----------------- PARSERS ----------------- #

    @classmethod
    def _parse_upi(cls, raw: str) -> StructuredQRResult:
        """Parses UPI deep link upi://pay?pa=...&pn=...&am=..."""
        parsed_url = urllib.parse.urlparse(raw)
        query_params = urllib.parse.parse_qs(parsed_url.query)

        def get_param(key: str, default: str = "") -> str:
            vals = query_params.get(key, [])
            return vals[0].strip() if vals else default

        pa = get_param("pa")  # Payee VPA (e.g. user@bank)
        pn = get_param("pn")  # Payee Name
        am = get_param("am")  # Amount
        cu = get_param("cu", "INR")  # Currency
        tn = get_param("tn")  # Transaction Note
        mc = get_param("mc")  # Merchant Code
        tr = get_param("tr")  # Transaction Ref
        tid = get_param("tid")  # Transaction ID
        url = get_param("url")

        title = f"UPI Payment: {pn or pa or 'Merchant'}"
        summary = f"Pay ₹{am} to {pn or pa}" if am else f"Pay to {pn or pa} ({cu})"

        details = {
            "payee_vpa": pa,
            "payee_name": pn,
            "amount": am,
            "currency": cu,
            "note": tn,
            "merchant_code": mc,
            "transaction_ref": tr,
            "transaction_id": tid,
            "ref_url": url,
            "deep_link": raw
        }

        actions = [
            ActionButton(
                id="pay_upi",
                label=f"Pay ₹{am}" if am else "Pay with UPI App",
                icon="CreditCard",
                action_type="upi_pay",
                payload=raw,
                primary=True
            ),
            ActionButton(
                id="copy_vpa",
                label="Copy UPI ID",
                icon="Copy",
                action_type="copy",
                payload=pa
            )
        ]

        validation_status = "valid"
        validation_notes = None
        if not pa:
            validation_status = "warning"
            validation_notes = "Missing Payee UPI ID (pa parameter)"

        return StructuredQRResult(
            raw_data=raw,
            data_type="upi",
            title=title,
            summary=summary,
            icon="CreditCard",
            badge_color="emerald",
            parsed_details=details,
            actions=actions,
            validation_status=validation_status,
            validation_notes=validation_notes
        )

    @classmethod
    def _parse_wifi(cls, raw: str) -> StructuredQRResult:
        """Parses WIFI:T:WPA;S:MySSID;P:MyPassword;H:false;;"""
        content = raw[5:]  # Remove leading WIFI:
        tokens = re.split(r'(?<!\\);', content)

        details: Dict[str, Any] = {
            "ssid": "",
            "auth_type": "WPA",
            "password": "",
            "hidden": False,
            "eap_method": "",
            "phase2": "",
            "identity": ""
        }

        for token in tokens:
            if not token.strip():
                continue
            if ":" in token:
                key, val = token.split(":", 1)
                val = val.replace(r"\;", ";").replace(r"\:", ":").replace(r"\\", "\\")
                key_upper = key.strip().upper()
                if key_upper == "S":
                    details["ssid"] = val
                elif key_upper == "T":
                    details["auth_type"] = val if val else "nopass"
                elif key_upper == "P":
                    details["password"] = val
                elif key_upper == "H":
                    details["hidden"] = val.lower() in ("true", "1", "yes")
                elif key_upper == "E":
                    details["eap_method"] = val
                elif key_upper == "A":
                    details["phase2"] = val
                elif key_upper == "I":
                    details["identity"] = val

        ssid = details["ssid"] or "Unknown Network"
        auth = details["auth_type"] or "WPA"
        summary = f"SSID: {ssid} | Security: {auth}"
        if details["hidden"]:
            summary += " (Hidden)"

        actions = []
        if details["password"]:
            actions.append(
                ActionButton(
                    id="copy_pwd",
                    label="Copy Password",
                    icon="Key",
                    action_type="copy",
                    payload=details["password"],
                    primary=True
                )
            )
        actions.append(
            ActionButton(
                id="copy_ssid",
                label="Copy SSID",
                icon="Wifi",
                action_type="copy",
                payload=details["ssid"]
            )
        )

        return StructuredQRResult(
            raw_data=raw,
            data_type="wifi",
            title=f"WiFi Network: {ssid}",
            summary=summary,
            icon="Wifi",
            badge_color="blue",
            parsed_details=details,
            actions=actions,
            validation_status="valid" if details["ssid"] else "warning",
            validation_notes=None if details["ssid"] else "WiFi SSID was not found"
        )

    @classmethod
    def _parse_contact(cls, raw: str) -> StructuredQRResult:
        """Parses vCard or MeCard format."""
        details: Dict[str, Any] = {
            "name": "",
            "first_name": "",
            "last_name": "",
            "organization": "",
            "title": "",
            "phones": [],
            "emails": [],
            "urls": [],
            "addresses": [],
            "note": "",
            "vcf_data": raw
        }

        if raw.upper().startswith("MECARD:"):
            # MeCard parsing: MECARD:N:Doe,John;TEL:123;EMAIL:a@b.com;;
            content = raw[7:]
            tokens = re.split(r'(?<!\\);', content)
            for token in tokens:
                if ":" in token:
                    k, v = token.split(":", 1)
                    v = v.replace(r"\;", ";").replace(r"\:", ":").replace(r"\\", "\\").strip()
                    k_up = k.strip().upper()
                    if k_up == "N":
                        details["name"] = v.replace(",", " ")
                        parts = v.split(",")
                        details["last_name"] = parts[0] if len(parts) > 0 else ""
                        details["first_name"] = parts[1] if len(parts) > 1 else ""
                    elif k_up == "TEL":
                        details["phones"].append({"type": "Mobile", "number": v})
                    elif k_up == "EMAIL":
                        details["emails"].append({"type": "General", "email": v})
                    elif k_up == "ORG":
                        details["organization"] = v
                    elif k_up == "URL":
                        details["urls"].append(v)
                    elif k_up == "NOTE":
                        details["note"] = v
                    elif k_up == "ADR":
                        details["addresses"].append(v)

            # Generate vCard text for MeCard
            vcard_text = "BEGIN:VCARD\nVERSION:3.0\n"
            if details["name"]:
                vcard_text += f"FN:{details['name']}\n"
            if details["last_name"] or details["first_name"]:
                vcard_text += f"N:{details['last_name']};{details['first_name']};;;\n"
            if details["organization"]:
                vcard_text += f"ORG:{details['organization']}\n"
            for p in details["phones"]:
                vcard_text += f"TEL;TYPE=CELL:{p['number']}\n"
            for e in details["emails"]:
                vcard_text += f"EMAIL:{e['email']}\n"
            vcard_text += "END:VCARD\n"
            details["vcf_data"] = vcard_text

        else:
            # vCard parsing via vobject
            try:
                vc = vobject.readOne(raw)
                if hasattr(vc, "fn"):
                    details["name"] = str(vc.fn.value)
                if hasattr(vc, "n"):
                    details["first_name"] = str(vc.n.value.given) if hasattr(vc.n.value, "given") else ""
                    details["last_name"] = str(vc.n.value.family) if hasattr(vc.n.value, "family") else ""
                    if not details["name"]:
                        details["name"] = f"{details['first_name']} {details['last_name']}".strip()
                if hasattr(vc, "org") and vc.org.value:
                    details["organization"] = " - ".join(vc.org.value) if isinstance(vc.org.value, list) else str(vc.org.value)
                if hasattr(vc, "title"):
                    details["title"] = str(vc.title.value)
                if hasattr(vc, "tel_list"):
                    for tel in vc.tel_list:
                        ttype = "Phone"
                        if hasattr(tel, "type_param"):
                            ttype = tel.type_param if isinstance(tel.type_param, str) else ", ".join(tel.type_param)
                        details["phones"].append({"type": ttype, "number": str(tel.value)})
                if hasattr(vc, "email_list"):
                    for em in vc.email_list:
                        etype = "Email"
                        if hasattr(em, "type_param"):
                            etype = em.type_param if isinstance(em.type_param, str) else ", ".join(em.type_param)
                        details["emails"].append({"type": etype, "email": str(em.value)})
                if hasattr(vc, "url_list"):
                    for u in vc.url_list:
                        details["urls"].append(str(u.value))
                if hasattr(vc, "adr_list"):
                    for adr in vc.adr_list:
                        details["addresses"].append(str(adr.value))
                if hasattr(vc, "note"):
                    details["note"] = str(vc.note.value)
            except Exception:
                # Fallback manual regex parser if vobject throws
                fn_match = re.search(r'FN:(.*?)(?:\r?\n|$)', raw, re.IGNORECASE)
                if fn_match:
                    details["name"] = fn_match.group(1).strip()
                org_match = re.search(r'ORG:(.*?)(?:\r?\n|$)', raw, re.IGNORECASE)
                if org_match:
                    details["organization"] = org_match.group(1).strip()
                for tel_m in re.finditer(r'TEL[^:]*:(.*?)(?:\r?\n|$)', raw, re.IGNORECASE):
                    details["phones"].append({"type": "Phone", "number": tel_m.group(1).strip()})
                for em_m in re.finditer(r'EMAIL[^:]*:(.*?)(?:\r?\n|$)', raw, re.IGNORECASE):
                    details["emails"].append({"type": "Email", "email": em_m.group(1).strip()})

        display_name = details["name"] or "Contact Card"
        summary_items = []
        if details["organization"]:
            summary_items.append(details["organization"])
        if details["phones"]:
            summary_items.append(details["phones"][0]["number"])
        if details["emails"]:
            summary_items.append(details["emails"][0]["email"])
        summary = " • ".join(summary_items) if summary_items else "vCard Contact Card"

        actions = [
            ActionButton(
                id="download_vcf",
                label="Save Contact (.vcf)",
                icon="UserPlus",
                action_type="download",
                payload=details["vcf_data"],
                primary=True
            )
        ]

        if details["phones"]:
            actions.append(
                ActionButton(
                    id="call_contact",
                    label=f"Call {details['phones'][0]['number']}",
                    icon="Phone",
                    action_type="call",
                    payload=details["phones"][0]["number"]
                )
            )

        if details["emails"]:
            actions.append(
                ActionButton(
                    id="email_contact",
                    label=f"Email {details['emails'][0]['email']}",
                    icon="Mail",
                    action_type="email",
                    payload=details["emails"][0]["email"]
                )
            )

        return StructuredQRResult(
            raw_data=raw,
            data_type="contact",
            title=display_name,
            summary=summary,
            icon="User",
            badge_color="purple",
            parsed_details=details,
            actions=actions,
            validation_status="valid"
        )

    @classmethod
    def _parse_url(cls, raw: str) -> StructuredQRResult:
        """Parses URLs with domain extraction, params, and protocol validation."""
        target_url = raw if re.match(r'^[a-zA-Z]+://', raw) else f"https://{raw}"
        parsed = urllib.parse.urlparse(target_url)

        query_dict = urllib.parse.parse_qs(parsed.query)
        flat_query = {k: v[0] if len(v) == 1 else v for k, v in query_dict.items()}

        domain = parsed.netloc or parsed.path.split("/")[0]
        scheme = parsed.scheme.lower() or "https"
        is_secure = scheme == "https"

        details = {
            "url": target_url,
            "scheme": scheme,
            "domain": domain,
            "path": parsed.path or "/",
            "query_params": flat_query,
            "fragment": parsed.fragment,
            "is_secure": is_secure
        }

        validation_status = "valid"
        validation_notes = None
        if not is_secure and scheme == "http":
            validation_status = "info"
            validation_notes = "Standard HTTP link (not encrypted with HTTPS)"

        actions = [
            ActionButton(
                id="open_link",
                label="Open Link",
                icon="ExternalLink",
                action_type="link",
                payload=target_url,
                primary=True
            ),
            ActionButton(
                id="copy_url",
                label="Copy URL",
                icon="Copy",
                action_type="copy",
                payload=target_url
            )
        ]

        return StructuredQRResult(
            raw_data=raw,
            data_type="url",
            title=f"Web Link: {domain}",
            summary=target_url,
            icon="Globe",
            badge_color="sky",
            parsed_details=details,
            actions=actions,
            validation_status=validation_status,
            validation_notes=validation_notes
        )

    @classmethod
    def _parse_email(cls, raw: str) -> StructuredQRResult:
        """Parses mailto:, MATMSG:, or SMTP: email schemes."""
        to_email = ""
        subject = ""
        body = ""
        cc = ""

        if raw.lower().startswith("mailto:"):
            parsed = urllib.parse.urlparse(raw)
            to_email = parsed.path
            params = urllib.parse.parse_qs(parsed.query)
            subject = params.get("subject", [""])[0]
            body = params.get("body", [""])[0]
            cc = params.get("cc", [""])[0]

        elif raw.upper().startswith("MATMSG:"):
            content = raw[7:]
            tokens = re.split(r'(?<!\\);', content)
            for t in tokens:
                if ":" in t:
                    k, v = t.split(":", 1)
                    k_up = k.strip().upper()
                    v = v.strip()
                    if k_up == "TO":
                        to_email = v
                    elif k_up == "SUB":
                        subject = v
                    elif k_up == "BODY":
                        body = v

        elif raw.upper().startswith("SMTP:"):
            parts = raw[5:].split(":", 2)
            to_email = parts[0] if len(parts) > 0 else ""
            subject = parts[1] if len(parts) > 1 else ""
            body = parts[2] if len(parts) > 2 else ""

        details = {
            "to": to_email,
            "subject": subject,
            "body": body,
            "cc": cc,
            "mailto_url": f"mailto:{to_email}?subject={urllib.parse.quote(subject)}&body={urllib.parse.quote(body)}"
        }

        actions = [
            ActionButton(
                id="send_email",
                label=f"Send Email to {to_email}" if to_email else "Compose Email",
                icon="Mail",
                action_type="email",
                payload=details["mailto_url"],
                primary=True
            ),
            ActionButton(
                id="copy_email",
                label="Copy Address",
                icon="Copy",
                action_type="copy",
                payload=to_email
            )
        ]

        return StructuredQRResult(
            raw_data=raw,
            data_type="email",
            title=f"Email: {to_email or 'New Message'}",
            summary=f"Subject: {subject}" if subject else f"To: {to_email}",
            icon="Mail",
            badge_color="indigo",
            parsed_details=details,
            actions=actions,
            validation_status="valid" if to_email else "warning",
            validation_notes=None if to_email else "No recipient email address specified"
        )

    @classmethod
    def _parse_sms(cls, raw: str) -> StructuredQRResult:
        """Parses smsto:+12345:message or sms:+12345?body=message"""
        phone = ""
        message = ""

        if raw.lower().startswith("smsto:"):
            content = raw[6:]
            if ":" in content:
                phone, message = content.split(":", 1)
            else:
                phone = content
        elif raw.lower().startswith("sms:"):
            parsed = urllib.parse.urlparse(raw)
            phone = parsed.path
            params = urllib.parse.parse_qs(parsed.query)
            message = params.get("body", [""])[0]

        details = {
            "phone_number": phone,
            "message": message,
            "sms_url": f"sms:{phone}?body={urllib.parse.quote(message)}" if message else f"sms:{phone}"
        }

        actions = [
            ActionButton(
                id="send_sms",
                label=f"Send SMS to {phone}" if phone else "Send SMS",
                icon="MessageSquare",
                action_type="sms",
                payload=details["sms_url"],
                primary=True
            ),
            ActionButton(
                id="copy_sms_phone",
                label="Copy Number",
                icon="Copy",
                action_type="copy",
                payload=phone
            )
        ]

        return StructuredQRResult(
            raw_data=raw,
            data_type="sms",
            title=f"SMS Message to {phone or 'Recipient'}",
            summary=message[:60] + ("..." if len(message) > 60 else "") if message else f"To: {phone}",
            icon="MessageSquare",
            badge_color="teal",
            parsed_details=details,
            actions=actions,
            validation_status="valid" if phone else "warning"
        )

    @classmethod
    def _parse_tel(cls, raw: str) -> StructuredQRResult:
        """Parses phone numbers and tel: URLs."""
        phone = raw[4:] if raw.lower().startswith("tel:") else raw.strip()

        details = {
            "phone_number": phone,
            "tel_url": f"tel:{phone}"
        }

        actions = [
            ActionButton(
                id="call_tel",
                label=f"Call {phone}",
                icon="PhoneCall",
                action_type="call",
                payload=details["tel_url"],
                primary=True
            ),
            ActionButton(
                id="copy_tel",
                label="Copy Number",
                icon="Copy",
                action_type="copy",
                payload=phone
            )
        ]

        return StructuredQRResult(
            raw_data=raw,
            data_type="tel",
            title=f"Phone Call: {phone}",
            summary=f"Telephone number: {phone}",
            icon="Phone",
            badge_color="green",
            parsed_details=details,
            actions=actions,
            validation_status="valid"
        )

    @classmethod
    def _parse_geo(cls, raw: str) -> StructuredQRResult:
        """Parses geo:latitude,longitude?q=name or plain coords."""
        lat, lon, query = 0.0, 0.0, ""

        if raw.lower().startswith("geo:"):
            parsed = urllib.parse.urlparse(raw)
            coords_str = parsed.path
            params = urllib.parse.parse_qs(parsed.query)
            query = params.get("q", [""])[0]
            if "," in coords_str:
                parts = coords_str.split(",")
                try:
                    lat, lon = float(parts[0]), float(parts[1])
                except ValueError:
                    pass
        else:
            parts = raw.split(",")
            if len(parts) >= 2:
                try:
                    lat, lon = float(parts[0].strip()), float(parts[1].strip())
                except ValueError:
                    pass

        maps_url = f"https://www.google.com/maps/search/?api=1&query={lat},{lon}"
        osm_url = f"https://www.openstreetmap.org/?mlat={lat}&mlon={lon}#map=16/{lat}/{lon}"

        details = {
            "latitude": lat,
            "longitude": lon,
            "query": query,
            "google_maps_url": maps_url,
            "openstreetmap_url": osm_url
        }

        actions = [
            ActionButton(
                id="open_maps",
                label="Open in Google Maps",
                icon="MapPin",
                action_type="link",
                payload=maps_url,
                primary=True
            ),
            ActionButton(
                id="copy_coords",
                label="Copy Coordinates",
                icon="Copy",
                action_type="copy",
                payload=f"{lat}, {lon}"
            )
        ]

        return StructuredQRResult(
            raw_data=raw,
            data_type="geo",
            title="Location Coordinates",
            summary=f"Lat: {lat:.5f}, Lon: {lon:.5f}" + (f" ({query})" if query else ""),
            icon="MapPin",
            badge_color="rose",
            parsed_details=details,
            actions=actions,
            validation_status="valid"
        )

    @classmethod
    def _parse_crypto(cls, raw: str) -> StructuredQRResult:
        """Parses Bitcoin, Ethereum, or Solana crypto address formats."""
        crypto_type = "Crypto"
        address = raw
        amount = ""

        if raw.lower().startswith("bitcoin:"):
            crypto_type = "Bitcoin (BTC)"
            parsed = urllib.parse.urlparse(raw)
            address = parsed.path
            params = urllib.parse.parse_qs(parsed.query)
            amount = params.get("amount", [""])[0]
        elif raw.lower().startswith("ethereum:"):
            crypto_type = "Ethereum (ETH)"
            parsed = urllib.parse.urlparse(raw)
            address = parsed.path
            params = urllib.parse.parse_qs(parsed.query)
            amount = params.get("value", [""])[0]
        elif raw.startswith("0x") and len(raw) == 42:
            crypto_type = "Ethereum Address (ETH)"
            address = raw
        elif raw.startswith("1") or raw.startswith("3") or raw.startswith("bc1"):
            crypto_type = "Bitcoin Address (BTC)"
            address = raw

        details = {
            "crypto_network": crypto_type,
            "address": address,
            "amount": amount
        }

        actions = [
            ActionButton(
                id="copy_crypto_addr",
                label="Copy Wallet Address",
                icon="Copy",
                action_type="copy",
                payload=address,
                primary=True
            )
        ]

        return StructuredQRResult(
            raw_data=raw,
            data_type="crypto",
            title=f"{crypto_type} Wallet",
            summary=f"Address: {address[:12]}...{address[-8:] if len(address) > 20 else ''}",
            icon="Coins",
            badge_color="amber",
            parsed_details=details,
            actions=actions,
            validation_status="valid"
        )

    @classmethod
    def _parse_json_result(cls, raw: str, json_data: Any) -> StructuredQRResult:
        """Handles valid JSON payloads."""
        keys = list(json_data.keys()) if isinstance(json_data, dict) else [f"Items ({len(json_data)})"]
        summary = f"JSON with {len(keys)} key(s): {', '.join(keys[:4])}"

        details = {
            "json": json_data,
            "is_array": isinstance(json_data, list),
            "keys_count": len(keys)
        }

        actions = [
            ActionButton(
                id="copy_json",
                label="Copy Formatted JSON",
                icon="Copy",
                action_type="copy",
                payload=json.dumps(json_data, indent=2),
                primary=True
            )
        ]

        return StructuredQRResult(
            raw_data=raw,
            data_type="json",
            title="Structured JSON Document",
            summary=summary,
            icon="Code",
            badge_color="violet",
            parsed_details=details,
            actions=actions,
            validation_status="valid"
        )

    @classmethod
    def _parse_plain_text(cls, raw: str) -> StructuredQRResult:
        """Fallback for general plain text content."""
        words = len(raw.split())
        chars = len(raw)
        lines = len(raw.splitlines())

        details = {
            "text": raw,
            "word_count": words,
            "char_count": chars,
            "line_count": lines
        }

        actions = [
            ActionButton(
                id="copy_raw_text",
                label="Copy Text",
                icon="Copy",
                action_type="copy",
                payload=raw,
                primary=True
            )
        ]

        # Check if text contains embedded URLs
        found_urls = re.findall(r'https?://[^\s]+', raw)
        if found_urls:
            details["embedded_urls"] = found_urls
            actions.insert(0, ActionButton(
                id="open_first_url",
                label=f"Open {found_urls[0][:25]}...",
                icon="ExternalLink",
                action_type="link",
                payload=found_urls[0],
                primary=True
            ))

        summary = raw[:100] + ("..." if len(raw) > 100 else "")

        return StructuredQRResult(
            raw_data=raw,
            data_type="text",
            title="Plain Text Content",
            summary=summary,
            icon="FileText",
            badge_color="slate",
            parsed_details=details,
            actions=actions,
            validation_status="valid"
        )

    # ----------------- HELPER DETECTORS ----------------- #

    @staticmethod
    def _is_url(s: str) -> bool:
        if s.startswith(("http://", "https://", "ftp://")):
            return True
        # Domain-like patterns (e.g. www.google.com, github.com/user)
        domain_pattern = r'^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(?:/[^\s]*)?$'
        return bool(re.match(domain_pattern, s))

    @staticmethod
    def _is_phone_number(s: str) -> bool:
        phone_cleaned = re.sub(r'[\s\-\(\)\+]', '', s)
        return phone_cleaned.isdigit() and 7 <= len(phone_cleaned) <= 15

    @staticmethod
    def _is_geo_coords(s: str) -> bool:
        coords_match = re.match(r'^\s*[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?)\s*,\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)\s*$', s)
        return bool(coords_match)

    @staticmethod
    def _is_crypto(s: str) -> bool:
        if s.lower().startswith(("bitcoin:", "ethereum:", "solana:")):
            return True
        if s.startswith("0x") and len(s) == 42 and all(c in "0123456789abcdefABCDEF" for c in s[2:]):
            return True
        if (s.startswith("1") or s.startswith("3") or s.startswith("bc1")) and 26 <= len(s) <= 62:
            return True
        return False

    @staticmethod
    def _try_parse_json(s: str) -> Optional[Any]:
        if not (s.startswith("{") and s.endswith("}")) and not (s.startswith("[") and s.endswith("]")):
            return None
        try:
            return json.loads(s)
        except Exception:
            return None
