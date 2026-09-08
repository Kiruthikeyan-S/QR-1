# QR Reader & Intelligence System

A full-stack, real-time QR Code scanning, decoding, parsing, and intelligence platform built according to the system specification:

```
                          QR READER SYSTEM
                               USER
                                │
                 ┌──────────────┴──────────────┐
                 ▼                             ▼
            Upload Image                  Live Camera
                 │                             │
                 ▼                             ▼
           React File UI                  html5-qrcode
                 │                             │
                 ▼                             │
            FastAPI API                        │
                 │                             │
                 ▼                             │
              OpenCV                           │
                 │                             │
                 ▼                             │
            ZXing Decoder                      │
                 │                             │
                 └──────────────┬──────────────┘
                                ▼
                          QR Raw Data
                                │
                                ▼
                          Data Parser
                                │
            ┌─────────┬─────────┼────────┬─────────┐
            ▼         ▼         ▼        ▼         ▼
           URL       WiFi      UPI     Contact    Text
            │         │         │        │         │
            └─────────┴─────────┼────────┴─────────┘
                                ▼
                            Validation
                                │
                                ▼
                         Structured JSON
                                │
                                ▼
                          React Result UI
                                │
                         ┌──────┴──────┐
                         ▼             ▼
                   Show Details    Scan Again
```

---

## Key Features

1. **Dual Scanning Modalities**:
   - **Upload Image Mode**: Drag & drop, clipboard paste (`Ctrl+V`), or file browser. Sent to FastAPI backend for multi-pass OpenCV image preprocessing and ZXing-cpp decoding.
   - **Live Camera Mode**: Real-time webcam viewfinder powered by `html5-qrcode` with laser animation overlay, camera switcher, and flash toggle.

2. **Multi-Pass OpenCV Image Pipeline**:
   - CLAHE (Contrast Limited Adaptive Histogram Equalization)
   - Otsu & Adaptive Gaussian thresholding for dark/uneven lighting
   - Inverted contrast handling (dark mode QR codes)
   - Kernel sharpening for blurry images
   - Multi-scale image pyramid scaling

3. **Intelligent Data Parser & Validator**:
   - **UPI**: Extracts Payee VPA, Payee Name, Amount, Currency, Note. Provides 1-click "Pay with UPI" deep link action.
   - **WiFi**: Decodes SSID, WPA/WEP security, and Password. Includes show/hide toggle and copy password action.
   - **Contact (vCard / MeCard)**: Extracts Full Name, Org, Title, Phone numbers, Emails. Includes 1-click `.vcf` contact file generator and downloader, plus direct dialer and email links.
   - **URL**: Validates scheme, domain, path, query parameters, and HTTPS encryption status.
   - **Email, SMS, Phone & Geo Coordinates**: Extracts coordinates with direct Google Maps & OpenStreetMap links.
   - **Crypto, JSON & Plain Text**: Syntax highlighting, copy actions, and word/character counts.

4. **Interactive Result UI**:
   - Tailored cards per data type with specialized primary action buttons.
   - Raw payload vs. structured JSON inspector tab.
   - "Scan Again" instant reset.
   - Local scan history drawer with export to JSON.
   - Built-in QR Generator modal for custom QR creation.
   - Pre-loaded sample QR codes for immediate 1-click testing.

---

## Quick Start

### 1. Launch Everything with 1 Command:
```bash
python start_system.py
```

### 2. Or Run Separately:

#### Backend (FastAPI):
```bash
cd backend
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation (Swagger UI): `http://127.0.0.1:8000/docs`

#### Frontend (Vite + React + Tailwind):
```bash
cd frontend
npm install
npm run dev
```
Frontend App: `http://localhost:5173`

---

## Running Automated Tests
```bash
$env:PYTHONPATH="backend"; python -m pytest backend/tests/
```
Tests cover URL validation, WiFi parsing, UPI payload extraction, vCard v2.1/v3.0 formatting, Geo coordinates, end-to-end QR image generation & decoding, and FastAPI endpoints.
