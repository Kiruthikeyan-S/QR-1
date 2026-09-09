import pytest
from tools import ProductImageStudio, TextCorrectionEngine
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_product_image_generation():
    img_b64 = ProductImageStudio.generate_product_image(
        product_name="Pro Wireless Headphones",
        category="electronics",
        tagline="Active Noise Cancelling & Spatial Audio",
        price="$199.00",
        theme="studio_white"
    )
    assert img_b64.startswith("data:image/png;base64,")

def test_text_grammar_correction():
    raw_text = "thier is alot of mistakes in teh documnt"
    res = TextCorrectionEngine.correct_grammar_and_spelling(raw_text)
    assert "corrected" in res
    assert len(res["corrected"]) > 5
    assert "mistake" in res["corrected"].lower()

def test_text_tone_rewriter():
    raw_text = "Here is the proposal."
    res = TextCorrectionEngine.rewrite_tone(raw_text, "professional")
    assert "rewritten" in res
    assert len(res["rewritten"]) > 0

def test_product_description_generator():
    res = TextCorrectionEngine.generate_product_description(
        product_name="Eco Water Bottle",
        features=["Double-wall insulation", "Stainless steel", "Leak-proof lid"]
    )
    assert "Eco Water Bottle" in res["headline"]
    assert len(res["features"]) == 3

def test_api_tools_endpoints():
    # Test product image API
    r1 = client.post("/api/tools/generate-product-image", json={
        "product_name": "Smart Watch Ultra",
        "category": "watches",
        "price": "$299"
    })
    assert r1.status_code == 200
    assert r1.json()["success"] is True

    # Test text process API
    r2 = client.post("/api/tools/process-text", json={
        "operation": "correct_grammar",
        "text": "dont forget to send teh email"
    })
    assert r2.status_code == 200
    assert r2.json()["success"] is True
