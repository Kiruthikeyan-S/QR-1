import pytest
from parser import QRDataParser, StructuredQRResult
from decoder import QRImageDecoder
from generator import QRGenerator


def test_parse_url():
    raw = "https://example.com/search?q=qr+reader&page=1"
    res = QRDataParser.parse(raw)
    assert res.data_type == "url"
    assert res.parsed_details["domain"] == "example.com"
    assert res.parsed_details["query_params"]["q"] == "qr reader"
    assert res.parsed_details["is_secure"] is True
    assert len(res.actions) >= 2
    assert res.actions[0].action_type == "link"


def test_parse_wifi():
    raw = "WIFI:T:WPA;S:MyHomeWiFi;P:SuperSecret123;H:false;;"
    res = QRDataParser.parse(raw)
    assert res.data_type == "wifi"
    assert res.parsed_details["ssid"] == "MyHomeWiFi"
    assert res.parsed_details["auth_type"] == "WPA"
    assert res.parsed_details["password"] == "SuperSecret123"
    assert res.parsed_details["hidden"] is False
    assert any(a.action_type == "copy" and a.payload == "SuperSecret123" for a in res.actions)


def test_parse_upi():
    raw = "upi://pay?pa=merchant@icici&pn=Awesome%20Store&am=500.00&cu=INR&tn=Invoice%20101"
    res = QRDataParser.parse(raw)
    assert res.data_type == "upi"
    assert res.parsed_details["payee_vpa"] == "merchant@icici"
    assert res.parsed_details["payee_name"] == "Awesome Store"
    assert res.parsed_details["amount"] == "500.00"
    assert res.parsed_details["note"] == "Invoice 101"
    assert any(a.action_type == "upi_pay" for a in res.actions)


def test_parse_vcard():
    vcard_raw = """BEGIN:VCARD
VERSION:3.0
FN:Bruce Wayne
N:Wayne;Bruce;;;
ORG:Wayne Enterprises
TITLE:CEO
TEL;TYPE=CELL:+15551234567
EMAIL:bruce@waynecorp.com
END:VCARD"""
    res = QRDataParser.parse(vcard_raw)
    assert res.data_type == "contact"
    assert res.parsed_details["name"] == "Bruce Wayne"
    assert res.parsed_details["organization"] == "Wayne Enterprises"
    assert len(res.parsed_details["phones"]) > 0
    assert res.parsed_details["phones"][0]["number"] == "+15551234567"
    assert any(a.action_type == "download" for a in res.actions)


def test_parse_mecard():
    mecard_raw = "MECARD:N:Smith,Alice;TEL:+1987654321;EMAIL:alice@example.com;ORG:Acme Corp;;"
    res = QRDataParser.parse(mecard_raw)
    assert res.data_type == "contact"
    assert res.parsed_details["name"] == "Smith Alice"
    assert res.parsed_details["organization"] == "Acme Corp"
    assert res.parsed_details["phones"][0]["number"] == "+1987654321"


def test_parse_geo():
    raw = "geo:37.7749,-122.4194?q=Golden+Gate"
    res = QRDataParser.parse(raw)
    assert res.data_type == "geo"
    assert abs(res.parsed_details["latitude"] - 37.7749) < 0.001
    assert abs(res.parsed_details["longitude"] - (-122.4194)) < 0.001


def test_generator_and_decoder_end_to_end():
    # Test generation of QR and end-to-end decoding via OpenCV/ZXing pipeline
    wifi_raw = QRGenerator.build_raw_string("wifi", {
        "ssid": "TestLabNetwork",
        "auth_type": "WPA",
        "password": "CorrectHorseBatteryStaple",
        "hidden": False
    })
    
    # Generate QR PNG bytes
    data_url = QRGenerator.generate_qr_base64(wifi_raw)
    import base64
    b64_data = data_url.split(",")[1]
    img_bytes = base64.b64decode(b64_data)

    # Decode bytes
    results, meta = QRImageDecoder.decode_image_bytes(img_bytes)
    assert len(results) > 0
    assert results[0].raw_data == wifi_raw

    # Parse result
    parsed = QRDataParser.parse(results[0].raw_data)
    assert parsed.data_type == "wifi"
    assert parsed.parsed_details["ssid"] == "TestLabNetwork"
    assert parsed.parsed_details["password"] == "CorrectHorseBatteryStaple"
