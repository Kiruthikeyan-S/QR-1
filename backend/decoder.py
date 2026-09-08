"""
QR Image Decoder Pipeline
Leverages OpenCV preprocessing algorithms and ZXing-cpp / OpenCV QRCodeDetector
for robust detection and decoding across uneven lighting, blur, tilt, and contrast.
"""

import io
import cv2
import numpy as np
from PIL import Image
from typing import List, Optional, Tuple, Dict, Any

try:
    import zxingcpp
    HAS_ZXING = True
except ImportError:
    HAS_ZXING = False


class DecodedQRObject:
    def __init__(self, raw_data: str, format_name: str = "QR_CODE", points: Optional[List[List[float]]] = None, confidence: float = 1.0):
        self.raw_data = raw_data
        self.format_name = format_name
        self.points = points or []
        self.confidence = confidence

    def to_dict(self) -> Dict[str, Any]:
        return {
            "raw_data": self.raw_data,
            "format": self.format_name,
            "points": self.points,
            "confidence": self.confidence
        }


class QRImageDecoder:
    """Multi-pass QR decoding pipeline using OpenCV and ZXing-cpp."""

    @classmethod
    def decode_image_bytes(cls, image_bytes: bytes) -> Tuple[List[DecodedQRObject], Dict[str, Any]]:
        """
        Decodes QR codes from raw image file bytes.
        Returns a tuple of (list of DecodedQRObject, image_metadata).
        """
        # Read image with OpenCV
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            # Fallback to PIL
            try:
                pil_img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
                img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
            except Exception as e:
                raise ValueError(f"Failed to decode image data: {str(e)}")

        height, width = img.shape[:2]
        metadata = {
            "width": width,
            "height": height,
            "channels": img.shape[2] if len(img.shape) > 2 else 1,
            "total_pixels": width * height
        }

        results = cls._run_multi_pass_detection(img)
        return results, metadata

    @classmethod
    def _run_multi_pass_detection(cls, img: np.ndarray) -> List[DecodedQRObject]:
        """Runs progressive preprocessing passes until QR code is detected."""
        results: List[DecodedQRObject] = []

        # Strategy 1: Direct decode with zxingcpp on original image
        if HAS_ZXING:
            res = cls._decode_zxing(img)
            if res:
                return res

        # Strategy 2: Grayscale + CLAHE (Contrast Limited Adaptive Histogram Equalization)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) if len(img.shape) == 3 else img
        if HAS_ZXING:
            res = cls._decode_zxing(gray)
            if res:
                return res

        clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
        enhanced_gray = clahe.apply(gray)
        if HAS_ZXING:
            res = cls._decode_zxing(enhanced_gray)
            if res:
                return res

        # Strategy 3: Otsu Thresholding
        _, otsu_thresh = cv2.threshold(enhanced_gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        if HAS_ZXING:
            res = cls._decode_zxing(otsu_thresh)
            if res:
                return res

        # Strategy 4: Inverted image (for dark-mode / light-on-dark QR codes)
        inverted = cv2.bitwise_not(enhanced_gray)
        if HAS_ZXING:
            res = cls._decode_zxing(inverted)
            if res:
                return res

        # Strategy 5: Sharpening kernel for blurry images
        kernel = np.array([[-1, -1, -1], [-1, 9, -1], [-1, -1, -1]])
        sharpened = cv2.filter2D(gray, -1, kernel)
        if HAS_ZXING:
            res = cls._decode_zxing(sharpened)
            if res:
                return res

        # Strategy 6: Resizing if image is extremely high resolution or low resolution
        h, w = gray.shape[:2]
        if w > 2000 or h > 2000:
            scale = 1600.0 / max(w, h)
            resized = cv2.resize(enhanced_gray, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
            if HAS_ZXING:
                res = cls._decode_zxing(resized)
                if res:
                    return res
        elif w < 400 or h < 400:
            scale = 2.0
            upscaled = cv2.resize(enhanced_gray, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_CUBIC)
            if HAS_ZXING:
                res = cls._decode_zxing(upscaled)
                if res:
                    return res

        # Strategy 7: OpenCV QRCodeDetector Fallback
        res_cv = cls._decode_opencv(img, enhanced_gray, otsu_thresh)
        if res_cv:
            return res_cv

        return []

    @classmethod
    def _decode_zxing(cls, img: np.ndarray) -> List[DecodedQRObject]:
        if not HAS_ZXING:
            return []
        try:
            detected_items = zxingcpp.read_barcodes(img)
            results = []
            for item in detected_items:
                if item.text:
                    pts = []
                    if hasattr(item, "position"):
                        try:
                            # Extract polygon points
                            pos = item.position
                            pts = [
                                [float(pos.top_left.x), float(pos.top_left.y)],
                                [float(pos.top_right.x), float(pos.top_right.y)],
                                [float(pos.bottom_right.x), float(pos.bottom_right.y)],
                                [float(pos.bottom_left.x), float(pos.bottom_left.y)]
                            ]
                        except Exception:
                            pass
                    results.append(DecodedQRObject(
                        raw_data=item.text,
                        format_name=str(item.format).split(".")[-1] if hasattr(item, "format") else "QR_CODE",
                        points=pts,
                        confidence=0.98
                    ))
            return results
        except Exception:
            return []

    @classmethod
    def _decode_opencv(cls, color_img: np.ndarray, gray: np.ndarray, thresh: np.ndarray) -> List[DecodedQRObject]:
        detector = cv2.QRCodeDetector()
        
        for candidate in [color_img, gray, thresh]:
            try:
                data, bbox, _ = detector.detectAndDecode(candidate)
                if data:
                    pts = []
                    if bbox is not None and len(bbox) > 0:
                        pts = [[float(p[0]), float(p[1])] for p in bbox[0]]
                    return [DecodedQRObject(raw_data=data, format_name="QR_CODE", points=pts, confidence=0.90)]
            except Exception:
                continue

        # Try multi-detection if single detector fails
        try:
            retval, decoded_info, bbox, _ = detector.detectAndDecodeMulti(gray)
            if retval and decoded_info:
                results = []
                for idx, text in enumerate(decoded_info):
                    if text:
                        pts = []
                        if bbox is not None and len(bbox) > idx:
                            pts = [[float(p[0]), float(p[1])] for p in bbox[idx]]
                        results.append(DecodedQRObject(raw_data=text, format_name="QR_CODE", points=pts, confidence=0.88))
                if results:
                    return results
        except Exception:
            pass

        return []
