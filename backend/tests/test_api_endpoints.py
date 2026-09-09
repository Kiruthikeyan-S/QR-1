import io
import pytest
from fastapi.testclient import TestClient
from main import app
from generator import QRGenerator


client = TestClient(app)


def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "online"


def test_parse_api_url():
    payload = {"raw_data": "https://github.com/google/gemini"}
    response = client.post("/api/parse", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["data_type"] == "url"
    assert data["parsed_details"]["domain"] == "github.com"
    assert len(data["actions"]) >= 2


def test_parse_api_wifi():
    payload = {"raw_data": "WIFI:T:WPA;S:OfficeNet;P:SecureOffice2026;;"}
    response = client.post("/api/parse", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["data_type"] == "wifi"
    assert data["parsed_details"]["ssid"] == "OfficeNet"
    assert data["parsed_details"]["password"] == "SecureOffice2026"


def test_generate_and_scan_image():
    # 1. Generate a UPI QR code
    gen_payload = {
        "qr_type": "upi",
        "params": {
            "payee_vpa": "store@bank",
            "payee_name": "Tech Store",
            "amount": "1299.00",
            "currency": "INR",
            "note": "Wireless Keyboard"
        }
    }
    gen_res = client.post("/api/generate", json=gen_payload)
    assert gen_res.status_code == 200
    data_url = gen_res.json()["image_data_url"]
    
    # 2. Extract PNG bytes from data URL
    import base64
    b64_bytes = base64.b64decode(data_url.split(",")[1])

    # 3. Upload image to /api/scan/image
    files = {"file": ("test_upi.png", b64_bytes, "image/png")}
    scan_res = client.post("/api/scan/image", files=files)
    assert scan_res.status_code == 200
    scan_data = scan_res.json()
    assert scan_data["success"] is True
    assert scan_data["results_count"] == 1
    assert scan_data["results"][0]["data_type"] == "upi"
    assert scan_data["results"][0]["parsed_details"]["payee_vpa"] == "store@bank"
    assert scan_data["results"][0]["parsed_details"]["amount"] == "1299.00"


def test_samples_api():
    res = client.get("/api/sample-qrs")
    assert res.status_code == 200
    samples = res.json()["samples"]
    assert len(samples) >= 5
    assert any(s["type"] == "wifi" for s in samples)
    assert any(s["type"] == "upi" for s in samples)
    assert any(s["type"] == "contact" for s in samples)
