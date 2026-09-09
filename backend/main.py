"""
FastAPI Server for QR Reader System & Productivity Studio Tools
Provides endpoints for:
1. Decoding uploaded QR images & parsing raw QR payloads
2. Product Image Generation (clean studio product visualizer)
3. Text Generation, Grammar Correction & Product Copywriting
"""

import time
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, File, UploadFile, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from parser import QRDataParser, StructuredQRResult
from decoder import QRImageDecoder
from generator import QRGenerator
from tools import ProductImageStudio, TextCorrectionEngine

app = FastAPI(
    title="QR Reader & Productivity Studio API",
    description="High-performance QR decoder & intelligent visual/text studio engine",
    version="1.1.0"
)

# Enable CORS for frontend development and production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ParseRequest(BaseModel):
    raw_data: str = Field(..., description="Raw decoded QR text payload")


class GenerateRequest(BaseModel):
    qr_type: str = Field(..., description="Type: url, wifi, upi, contact, email, sms, tel, geo, text")
    params: Dict[str, Any] = Field(default_factory=dict, description="Parameters for the QR format")
    fill_color: str = Field(default="#0f172a", description="Hex or name of foreground color")
    back_color: str = Field(default="#ffffff", description="Hex or name of background color")


class ProductImageRequest(BaseModel):
    product_name: str = Field(..., description="Name of the product to render")
    category: str = Field(default="electronics", description="Category: electronics, footwear, fashion, watches, cosmetics, beverages, furniture, general")
    tagline: str = Field(default="Premium Quality & Ergonomic Design", description="Short marketing tagline")
    price: str = Field(default="$99.00", description="Product price string")
    badge: str = Field(default="FEATURED PRODUCT", description="Product highlight badge")
    theme: str = Field(default="studio_white", description="Theme: studio_white, luxury_marble, minimalist_pastel, cyber_clean, warm_wood")


class TextProcessRequest(BaseModel):
    operation: str = Field(..., description="Operation: 'correct_grammar', 'rewrite_tone', 'generate_description'")
    text: str = Field(default="", description="Input text to analyze or rewrite")
    tone: Optional[str] = Field(default="professional", description="Tone: professional, concise, friendly, marketing")
    product_name: Optional[str] = Field(default="", description="Product name for description generation")
    features: Optional[List[str]] = Field(default_factory=list, description="Bullet point features")
    target_audience: Optional[str] = Field(default="Consumers", description="Target audience")


class ScanResponse(BaseModel):
    success: bool
    processing_time_ms: float
    results_count: int
    results: List[StructuredQRResult]
    image_metadata: Optional[Dict[str, Any]] = None
    message: Optional[str] = None


@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "service": "QR Reader System API",
        "timestamp": time.time()
    }


@app.post("/api/scan/image", response_model=ScanResponse)
async def scan_image(file: UploadFile = File(...)):
    """
    Accepts an uploaded image file (PNG, JPG, WEBP, etc.), runs the multi-pass OpenCV
    preprocessing pipeline, detects QR codes, and returns parsed structured JSON.
    """
    start_time = time.perf_counter()

    if not file.content_type or not file.content_type.startswith("image/"):
        ext = (file.filename or "").lower().split(".")[-1]
        if ext not in ["png", "jpg", "jpeg", "webp", "bmp", "tiff", "gif", "svg"]:
            raise HTTPException(status_code=400, detail="Uploaded file must be a valid image format.")

    try:
        image_bytes = await file.read()
        if len(image_bytes) == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        decoded_items, metadata = QRImageDecoder.decode_image_bytes(image_bytes)
        
        parsed_results: List[StructuredQRResult] = []
        for item in decoded_items:
            res = QRDataParser.parse(item.raw_data)
            res.parsed_details["_detection"] = {
                "format": item.format_name,
                "confidence": item.confidence,
                "points": item.points
            }
            parsed_results.append(res)

        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)

        if not parsed_results:
            return ScanResponse(
                success=False,
                processing_time_ms=elapsed_ms,
                results_count=0,
                results=[],
                image_metadata=metadata,
                message="No QR code found in the image. Try adjusting lighting or uploading a higher contrast photo."
            )

        return ScanResponse(
            success=True,
            processing_time_ms=elapsed_ms,
            results_count=len(parsed_results),
            results=parsed_results,
            image_metadata=metadata,
            message="QR code decoded and structured successfully."
        )

    except HTTPException:
        raise
    except Exception as e:
        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
        raise HTTPException(
            status_code=500,
            detail=f"Error processing image: {str(e)}"
        )


@app.post("/api/parse", response_model=StructuredQRResult)
def parse_raw_data(payload: ParseRequest):
    """
    Parses a raw QR string (e.g. from the client-side html5-qrcode camera scanner)
    and returns the structured JSON model with validated fields and actions.
    """
    return QRDataParser.parse(payload.raw_data)


@app.post("/api/generate")
def generate_qr(req: GenerateRequest):
    """
    Builds standard QR raw data and returns both the structured data and base64 PNG image.
    """
    raw_data = QRGenerator.build_raw_string(req.qr_type, req.params)
    base64_image = QRGenerator.generate_qr_base64(
        raw_data,
        fill_color=req.fill_color,
        back_color=req.back_color
    )
    parsed = QRDataParser.parse(raw_data)

    return {
        "raw_data": raw_data,
        "image_data_url": base64_image,
        "structured": parsed
    }


# ------------------- PRODUCT STUDIO & TEXT TOOLS ------------------- #

@app.post("/api/tools/generate-product-image")
def generate_product_image(req: ProductImageRequest):
    """
    Renders a high-resolution, clean studio showcase product image.
    """
    try:
        data_url = ProductImageStudio.generate_product_image(
            product_name=req.product_name,
            category=req.category,
            tagline=req.tagline,
            price=req.price,
            badge=req.badge,
            theme=req.theme
        )
        return {
            "success": True,
            "product_name": req.product_name,
            "category": req.category,
            "image_data_url": data_url
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to render product image: {str(e)}")


@app.post("/api/tools/process-text")
def process_text(req: TextProcessRequest):
    """
    Processes text for grammar correction, tone rewriting, or structured product copy generation.
    """
    op = req.operation.lower()
    
    if op == "correct_grammar":
        res = TextCorrectionEngine.correct_grammar_and_spelling(req.text)
        return {"success": True, "operation": op, "result": res}
    
    elif op == "rewrite_tone":
        res = TextCorrectionEngine.rewrite_tone(req.text, req.tone or "professional")
        return {"success": True, "operation": op, "result": res}
    
    elif op == "generate_description":
        res = TextCorrectionEngine.generate_product_description(
            product_name=req.product_name or req.text,
            features=req.features or [],
            target_audience=req.target_audience or "Consumers"
        )
        return {"success": True, "operation": op, "result": res}
    
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported text operation: {req.operation}")


@app.get("/api/sample-qrs")
def get_sample_qrs():
    """
    Provides pre-generated sample QR codes across all supported categories.
    """
    samples = [
        {
            "id": "wifi_home",
            "name": "Home WiFi (WPA2)",
            "type": "wifi",
            "description": "WiFi network with WPA2 security and password",
            "params": {"ssid": "FiberOptic_5G_Guest", "auth_type": "WPA", "password": "SecretPassword2026", "hidden": False}
        },
        {
            "id": "upi_store",
            "name": "UPI Payment (₹450)",
            "type": "upi",
            "description": "Instant Indian UPI merchant payment link",
            "params": {"payee_vpa": "coffeeshop@icici", "payee_name": "Artisan Coffee House", "amount": "450.00", "currency": "INR", "note": "Order #4821 Latte & Croissant"}
        },
        {
            "id": "vcard_alex",
            "name": "Executive vCard",
            "type": "contact",
            "description": "Full contact card with phone, email, org, and title",
            "params": {
                "name": "Sarah Connor",
                "first_name": "Sarah",
                "last_name": "Connor",
                "organization": "Cyberdyne Systems",
                "title": "Lead Security Architect",
                "phone": "+1 (555) 019-2834",
                "email": "sarah.connor@cyberdyne.tech",
                "url": "https://cyberdyne.tech",
                "note": "Met at Tech Innovators Summit 2026"
            }
        },
        {
            "id": "url_docs",
            "name": "Secure Web Link",
            "type": "url",
            "description": "HTTPS URL with UTM parameters and tracking",
            "params": {"url": "https://github.com/google/gemini?source=qr_reader&campaign=demo2026"}
        },
        {
            "id": "geo_monument",
            "name": "Taj Mahal Coordinates",
            "type": "geo",
            "description": "GPS Location coordinates with query pin",
            "params": {"latitude": "27.1751", "longitude": "78.0421", "query": "Taj Mahal, Agra"}
        }
    ]

    for sample in samples:
        raw = QRGenerator.build_raw_string(sample["type"], sample["params"])
        sample["raw_data"] = raw
        sample["image_data_url"] = QRGenerator.generate_qr_base64(raw)
        sample["parsed"] = QRDataParser.parse(raw)

    return {"samples": samples}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
