"""
Image-Editor - Image Processing Engine
Copyright © 2026 projecttune2026-dev
Author: projecttune2026-dev
Repository: https://github.com/projecttune2026-dev/Image-Editor

This software is provided under the MIT License.
See LICENSE file for details.
"""

import io
import os
import base64
from PIL import Image, ImageOps, ImageEnhance, ImageFilter, ImageChops

def load_image(source):
    """
    Loads PIL Image from file path, bytes, or base64 string.
    """
    if isinstance(source, Image.Image):
        return source.copy()
    
    if isinstance(source, bytes):
        return Image.open(io.BytesIO(source))
    
    if isinstance(source, str):
        if source.startswith('data:image'):
            # Base64 data URL
            header, encoded = source.split(',', 1)
            image_data = base64.b64decode(encoded)
            return Image.open(io.BytesIO(image_data))
        elif os.path.exists(source):
            return Image.open(source)
            
    raise ValueError("Invalid image source provided.")


def blend_overlay_images(primary_img, secondary_img, blend_config=None):
    """
    Blends or joins primary and secondary PIL images based on blend_config parameters:
    mode: 'overlay' (picture-in-picture), 'fade' (blend/crossfade), or 'join' (horizontal/vertical stitch)
    """
    if not secondary_img or not blend_config:
        return primary_img

    if not isinstance(secondary_img, Image.Image):
        secondary_img = load_image(secondary_img)

    mode = str(blend_config.get('mode', 'overlay')).lower()

    if mode == 'overlay':
        # Picture-in-Picture Overlay
        scale_pct = float(blend_config.get('scale', 30)) / 100.0
        opacity = float(blend_config.get('opacity', 100)) / 100.0
        position = str(blend_config.get('position', 'bottom-right')).lower()
        margin = int(blend_config.get('margin', 20))

        base = primary_img.convert('RGBA')
        sec = secondary_img.convert('RGBA')

        sec_w = max(1, int(base.width * scale_pct))
        sec_h = max(1, int(sec.height * (sec_w / float(sec.width))))
        sec = sec.resize((sec_w, sec_h), Image.Resampling.LANCZOS)

        if opacity < 1.0:
            r, g, b, a = sec.split()
            a = a.point(lambda i: int(i * opacity))
            sec = Image.merge('RGBA', (r, g, b, a))

        if position == 'top-left':
            x, y = margin, margin
        elif position == 'top-right':
            x, y = base.width - sec_w - margin, margin
        elif position == 'bottom-left':
            x, y = margin, base.height - sec_h - margin
        elif position == 'center':
            x, y = (base.width - sec_w) // 2, (base.height - sec_h) // 2
        else: # bottom-right
            x, y = base.width - sec_w - margin, base.height - sec_h - margin

        x = max(0, min(x, base.width - 1))
        y = max(0, min(y, base.height - 1))

        overlay_layer = Image.new('RGBA', base.size, (0, 0, 0, 0))
        overlay_layer.paste(sec, (x, y))
        res_img = Image.alpha_composite(base, overlay_layer)
        return res_img if primary_img.mode != 'RGB' else res_img.convert('RGB')

    elif mode == 'fade':
        # Crossfade / Alpha Blend
        blend_ratio = float(blend_config.get('fade_ratio', 50)) / 100.0
        blend_mode = str(blend_config.get('blend_mode', 'normal')).lower()

        base = primary_img.convert('RGBA')
        sec = secondary_img.convert('RGBA')
        sec = sec.resize(base.size, Image.Resampling.LANCZOS)

        if blend_mode == 'multiply':
            res_img = ImageChops.multiply(base.convert('RGB'), sec.convert('RGB'))
            res_img = Image.blend(base.convert('RGB'), res_img, blend_ratio)
        elif blend_mode == 'screen':
            res_img = ImageChops.screen(base.convert('RGB'), sec.convert('RGB'))
            res_img = Image.blend(base.convert('RGB'), res_img, blend_ratio)
        elif blend_mode == 'overlay':
            res_img = ImageChops.overlay(base.convert('RGB'), sec.convert('RGB'))
            res_img = Image.blend(base.convert('RGB'), res_img, blend_ratio)
        else: # normal crossfade
            res_img = Image.blend(base.convert('RGB'), sec.convert('RGB'), blend_ratio)

        return res_img if primary_img.mode != 'RGBA' else res_img.convert('RGBA')

    elif mode == 'join':
        # Side-by-Side or Stacked Joining
        direction = str(blend_config.get('direction', 'horizontal')).lower()
        gap = int(blend_config.get('gap', 0))

        base = primary_img.convert('RGBA')
        sec = secondary_img.convert('RGBA')

        if direction == 'vertical': # Stacked top-bottom
            sec_w = base.width
            sec_h = max(1, int(sec.height * (sec_w / float(sec.width))))
            sec = sec.resize((sec_w, sec_h), Image.Resampling.LANCZOS)

            total_w = base.width
            total_h = base.height + gap + sec_h

            joined = Image.new('RGBA', (total_w, total_h), (0, 0, 0, 0))
            joined.paste(base, (0, 0))
            joined.paste(sec, (0, base.height + gap))
        else: # Horizontal side-by-side
            sec_h = base.height
            sec_w = max(1, int(sec.width * (sec_h / float(sec.height))))
            sec = sec.resize((sec_w, sec_h), Image.Resampling.LANCZOS)

            total_w = base.width + gap + sec_w
            total_h = base.height

            joined = Image.new('RGBA', (total_w, total_h), (0, 0, 0, 0))
            joined.paste(base, (0, 0))
            joined.paste(sec, (base.width + gap, 0))

        return joined if primary_img.mode != 'RGB' else joined.convert('RGB')

    return primary_img


def get_image_info(img_source):
    """
    Returns image metadata: width, height, format, mode, file_size_bytes.
    """
    if isinstance(img_source, str) and os.path.exists(img_source):
        file_size = os.path.getsize(img_source)
        img = Image.open(img_source)
        return {
            "width": img.width,
            "height": img.height,
            "format": img.format or "PNG",
            "mode": img.mode,
            "size_bytes": file_size
        }
    else:
        img = load_image(img_source)
        buf = io.BytesIO()
        fmt = img.format if img.format in ['JPEG', 'PNG', 'WEBP', 'BMP', 'TIFF'] else 'PNG'
        img.save(buf, format=fmt)
        return {
            "width": img.width,
            "height": img.height,
            "format": fmt,
            "mode": img.mode,
            "size_bytes": buf.tell()
        }


def transform_image(img, crop_box=None, rotate_angle=0, flip_h=False, flip_v=False, scale_percent=100, max_w=None, max_h=None, exact_w=None, exact_h=None):
    """
    Applies crop, rotation, flip, and resizing to PIL image.
    crop_box: tuple (left, top, right, bottom) in absolute pixels
    """
    if not isinstance(img, Image.Image):
        img = load_image(img)
    
    # Ensure correct mode for transparency handling
    if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
        res_img = img.convert('RGBA')
    else:
        res_img = img.convert('RGB')
    
    # 1. Rotate
    if rotate_angle != 0:
        res_img = res_img.rotate(-rotate_angle, expand=True)
        
    # 2. Flip
    if flip_h:
        res_img = ImageOps.mirror(res_img)
    if flip_v:
        res_img = ImageOps.flip(res_img)
        
    # 3. Crop
    if crop_box:
        l, t, r, b = crop_box
        l = max(0, min(l, res_img.width - 1))
        t = max(0, min(t, res_img.height - 1))
        r = max(l + 1, min(r, res_img.width))
        b = max(t + 1, min(b, res_img.height))
        res_img = res_img.crop((l, t, r, b))
        
    # 4. Scale / Resize
    curr_w, curr_h = res_img.size
    target_w, target_h = curr_w, curr_h
    
    if exact_w and exact_h:
        target_w = int(exact_w)
        target_h = int(exact_h)
    elif exact_w and not exact_h:
        target_w = int(exact_w)
        target_h = int(curr_h * (target_w / float(curr_w)))
    elif exact_h and not exact_w:
        target_h = int(exact_h)
        target_w = int(curr_w * (target_h / float(curr_h)))
    elif scale_percent != 100 and scale_percent > 0:
        target_w = int(curr_w * (scale_percent / 100.0))
        target_h = int(curr_h * (scale_percent / 100.0))
    elif max_w or max_h:
        ratio = 1.0
        if max_w and curr_w > max_w:
            ratio = min(ratio, max_w / float(curr_w))
        if max_h and curr_h > max_h:
            ratio = min(ratio, max_h / float(curr_h))
        target_w = int(curr_w * ratio)
        target_h = int(curr_h * ratio)
        
    target_w = max(1, target_w)
    target_h = max(1, target_h)
    
    if (target_w, target_h) != (curr_w, curr_h):
        res_img = res_img.resize((target_w, target_h), Image.Resampling.LANCZOS)
        
    return res_img


def apply_temperature(img, temp_val):
    """
    Adjusts color temperature (-100 cool blue to +100 golden warm).
    """
    if temp_val == 0:
        return img
    
    was_rgba = img.mode == 'RGBA'
    alpha = img.split()[-1] if was_rgba else None
    base = img.convert('RGB')
    
    # Calculate RGB channel multipliers based on temperature value
    factor = temp_val / 100.0
    if factor > 0:
        # Warm shift: boost Red, slightly boost Green, reduce Blue
        r_gain = 1.0 + (0.2 * factor)
        g_gain = 1.0 + (0.05 * factor)
        b_gain = 1.0 - (0.2 * factor)
    else:
        # Cool shift: reduce Red, boost Blue
        factor = abs(factor)
        r_gain = 1.0 - (0.2 * factor)
        g_gain = 1.0
        b_gain = 1.0 + (0.25 * factor)
        
    r, g, b = base.split()
    r = r.point(lambda i: max(0, min(255, int(i * r_gain))))
    g = g.point(lambda i: max(0, min(255, int(i * g_gain))))
    b = b.point(lambda i: max(0, min(255, int(i * b_gain))))
    
    res_img = Image.merge('RGB', (r, g, b))
    if was_rgba:
        res_img.putalpha(alpha)
        res_img = res_img.convert('RGBA')
    return res_img


def apply_vignette(img, intensity):
    """
    Applies radial vignette corner darkening (intensity 0 to 100).
    """
    if intensity <= 0:
        return img
    
    was_rgba = img.mode == 'RGBA'
    alpha = img.split()[-1] if was_rgba else None
    base = img.convert('RGB')
    
    w, h = base.size
    # Create radial gradient mask
    import math
    max_radius = math.hypot(w / 2.0, h / 2.0)
    factor = (intensity / 100.0) * 1.5
    
    # Generate mask image efficiently
    mask = Image.new('L', (w, h))
    pixels = mask.load()
    cx, cy = w / 2.0, h / 2.0
    
    for y in range(h):
        dy = y - cy
        for x in range(w):
            dx = x - cx
            dist = math.hypot(dx, dy) / max_radius
            v = max(0.0, min(1.0, 1.0 - (dist * factor)))
            pixels[x, y] = int(v * 255)
            
    # Multiply image RGB channels by mask
    r, g, b = base.split()
    r = Image.composite(r, Image.new('L', (w, h), 0), mask)
    g = Image.composite(g, Image.new('L', (w, h), 0), mask)
    b = Image.composite(b, Image.new('L', (w, h), 0), mask)
    
    res_img = Image.merge('RGB', (r, g, b))
    if was_rgba:
        res_img.putalpha(alpha)
        res_img = res_img.convert('RGBA')
    return res_img


def apply_adjustments(img, brightness=100, contrast=100, saturation=100, sharpness=100, blur=0, temperature=0, vignette=0, filter_type='none'):
    """
    Applies tonal/color adjustments, temperature, vignette, and stylistic filters to a PIL image.
    """
    res_img = img

    # 1. Brightness / Contrast / Saturation / Sharpness
    if brightness != 100:
        res_img = ImageEnhance.Brightness(res_img).enhance(brightness / 100.0)
    if contrast != 100:
        res_img = ImageEnhance.Contrast(res_img).enhance(contrast / 100.0)
    if saturation != 100:
        res_img = ImageEnhance.Color(res_img).enhance(saturation / 100.0)
    if sharpness != 100:
        res_img = ImageEnhance.Sharpness(res_img).enhance(sharpness / 100.0)

    # 2. Temperature (Warmth / Coolness)
    if temperature and temperature != 0:
        res_img = apply_temperature(res_img, temperature)

    # 3. Vignette
    if vignette and vignette > 0:
        res_img = apply_vignette(res_img, vignette)

    # 4. Blur
    if blur and blur > 0:
        res_img = res_img.filter(ImageFilter.GaussianBlur(radius=blur))

    # 5. Stylistic filters (grayscale / sepia / invert / doc_scan)
    filter_type = (filter_type or 'none').lower()
    if filter_type == 'grayscale':
        was_rgba = res_img.mode == 'RGBA'
        alpha = res_img.split()[-1] if was_rgba else None
        gray = ImageOps.grayscale(res_img.convert('RGB'))
        res_img = gray.convert('RGB')
        if was_rgba:
            res_img.putalpha(alpha)
            res_img = res_img.convert('RGBA')
    elif filter_type == 'sepia':
        was_rgba = res_img.mode == 'RGBA'
        alpha = res_img.split()[-1] if was_rgba else None
        gray = ImageOps.grayscale(res_img.convert('RGB'))
        sepia_img = ImageOps.colorize(gray, black=(40, 26, 13), white=(255, 240, 192))
        res_img = sepia_img.convert('RGB')
        if was_rgba:
            res_img.putalpha(alpha)
            res_img = res_img.convert('RGBA')
    elif filter_type == 'invert':
        was_rgba = res_img.mode == 'RGBA'
        alpha = res_img.split()[-1] if was_rgba else None
        base = res_img.convert('RGB')
        res_img = ImageOps.invert(base)
        if was_rgba:
            res_img.putalpha(alpha)
            res_img = res_img.convert('RGBA')
    elif filter_type in ('doc_scan', 'document'):
        was_rgba = res_img.mode == 'RGBA'
        alpha = res_img.split()[-1] if was_rgba else None
        gray = ImageOps.grayscale(res_img.convert('RGB'))
        # High contrast document scanner enhancement
        enhanced = ImageEnhance.Contrast(gray).enhance(2.8)
        enhanced = ImageEnhance.Sharpness(enhanced).enhance(2.0)
        res_img = enhanced.convert('RGB')
        if was_rgba:
            res_img.putalpha(alpha)
            res_img = res_img.convert('RGBA')

    return res_img


def encode_image(img, format='JPEG', quality=85, keep_exif=False, original_img=None):
    """
    Encodes image to byte buffer in specified format (JPEG, PNG, WEBP, BMP, TIFF).
    """
    format = format.upper()
    if format not in ['JPEG', 'PNG', 'WEBP', 'BMP', 'TIFF']:
        format = 'JPEG'
        
    buf = io.BytesIO()
    save_kwargs = {}
    
    # Handle transparency when converting to JPEG/BMP/TIFF
    if format in ['JPEG', 'BMP'] and img.mode in ('RGBA', 'LA'):
        background = Image.new('RGB', img.size, (255, 255, 255))
        background.paste(img, mask=img.split()[-1])
        save_img = background
    else:
        save_img = img
        
    if format in ['JPEG', 'WEBP']:
        save_kwargs['quality'] = int(quality)
        save_kwargs['optimize'] = True
    elif format == 'PNG':
        # PNG compress level 0-9 derived from quality slider
        compress_level = max(0, min(9, int((100 - quality) / 10)))
        save_kwargs['compress_level'] = compress_level
        save_kwargs['optimize'] = True

    if keep_exif and original_img and 'exif' in original_img.info:
        save_kwargs['exif'] = original_img.info['exif']

    save_img.save(buf, format=format, **save_kwargs)
    return buf.getvalue()


def compress_to_target_size(img, target_kb, format='JPEG', keep_exif=False):
    """
    Iterative / binary search algorithm to compress image to stay under target_kb file size.
    """
    target_bytes = target_kb * 1024
    format = format.upper()
    
    # 1. Initial attempt at 95% quality
    data = encode_image(img, format=format, quality=95, keep_exif=keep_exif)
    if len(data) <= target_bytes:
        return data, 95, 100 # data, quality, scale
    
    # 2. Binary search quality between 5% and 95%
    low_q, high_q = 5, 95
    best_data = data
    best_q = 5
    
    while low_q <= high_q:
        mid_q = (low_q + high_q) // 2
        test_data = encode_image(img, format=format, quality=mid_q, keep_exif=keep_exif)
        if len(test_data) <= target_bytes:
            best_data = test_data
            best_q = mid_q
            low_q = mid_q + 1 # try higher quality
        else:
            high_q = mid_q - 1 # lower quality needed
            
    if len(best_data) <= target_bytes:
        return best_data, best_q, 100
        
    # 3. If quality alone isn't enough, iteratively scale dimensions down
    scaled_img = img.copy()
    scale = 90
    while scale >= 10:
        w = max(1, int(img.width * (scale / 100.0)))
        h = max(1, int(img.height * (scale / 100.0)))
        test_scaled = img.resize((w, h), Image.Resampling.LANCZOS)
        
        # Binary search quality for scaled image
        low_q, high_q = 10, 85
        sub_best = None
        sub_q = 10
        while low_q <= high_q:
            mid_q = (low_q + high_q) // 2
            test_data = encode_image(test_scaled, format=format, quality=mid_q, keep_exif=keep_exif)
            if len(test_data) <= target_bytes:
                sub_best = test_data
                sub_q = mid_q
                low_q = mid_q + 1
            else:
                high_q = mid_q - 1
                
        if sub_best is not None:
            return sub_best, sub_q, scale
            
        scale -= 10
        
    # Fallback to lowest possible quality and 10% scale if extremely small target requested
    final_scaled = img.resize((max(1, int(img.width * 0.1)), max(1, int(img.height * 0.1))), Image.Resampling.LANCZOS)
    return encode_image(final_scaled, format=format, quality=5, keep_exif=keep_exif), 5, 10


def remove_background(img):
    """
    Removes background from PIL Image using rembg.
    If the image is excessively large, resizes it to a reasonable resolution
    for running the model, then scales the mask back to keep the original quality.
    """
    from rembg import remove
    
    max_side = 2048
    orig_w, orig_h = img.size
    resized = False
    
    if orig_w > max_side or orig_h > max_side:
        if orig_w > orig_h:
            new_w = max_side
            new_h = int(orig_h * (max_side / orig_w))
        else:
            new_h = max_side
            new_w = int(orig_w * (max_side / orig_h))
        img_input = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
        resized = True
    else:
        img_input = img

    # Run background removal
    res_img = remove(img_input)
    
    if resized:
        # Resize alpha mask back to original resolution and apply to original image
        alpha_mask = res_img.split()[-1]
        alpha_mask_orig = alpha_mask.resize((orig_w, orig_h), Image.Resampling.LANCZOS)
        res_img = img.convert('RGBA')
        res_img.putalpha(alpha_mask_orig)
        
    return res_img


# ─── AI Upscaling Model Cache ─────────────────────────────────────────────────
_sr_model = None
_MODELS_DIR = os.path.join(os.path.dirname(__file__), 'models')

# EDSR x4 model — downloaded from the official OpenCV model zoo on first use
_EDSR_URL = (
    "https://raw.githubusercontent.com/Saafke/EDSR_Tensorflow/"
    "master/models/EDSR_x4.pb"
)
_EDSR_PATH = os.path.join(_MODELS_DIR, 'EDSR_x4.pb')


def _get_sr_model():
    """Download (once) and return the cached OpenCV DNN SuperRes EDSR x4 model."""
    global _sr_model
    if _sr_model is not None:
        return _sr_model

    import cv2
    os.makedirs(_MODELS_DIR, exist_ok=True)

    if not os.path.exists(_EDSR_PATH):
        import requests
        resp = requests.get(_EDSR_URL, timeout=60, stream=True)
        resp.raise_for_status()
        with open(_EDSR_PATH, 'wb') as f:
            for chunk in resp.iter_content(chunk_size=8192):
                f.write(chunk)

    sr = cv2.dnn_superres.DnnSuperResImpl_create()
    sr.readModel(_EDSR_PATH)
    sr.setModel('edsr', 4)
    _sr_model = sr
    return _sr_model


def upscale_image(img, scale=4):
    """
    AI-powered 4x upscaling using EDSR deep super-resolution via OpenCV DNN.
    Tiles large images to stay within memory limits on CPU.
    Input/output are PIL Images.
    """
    import cv2, numpy as np

    # Cap input resolution — processing a 1024px image → 4096px output
    max_input_side = 1024
    orig_w, orig_h = img.size

    if orig_w > max_input_side or orig_h > max_input_side:
        if orig_w >= orig_h:
            new_w = max_input_side
            new_h = max(1, int(orig_h * (max_input_side / orig_w)))
        else:
            new_h = max_input_side
            new_w = max(1, int(orig_w * (max_input_side / orig_h)))
        img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)

    sr = _get_sr_model()

    # Convert PIL → BGR numpy
    arr = np.array(img.convert('RGB'))
    bgr = cv2.cvtColor(arr, cv2.COLOR_RGB2BGR)

    # Tile-based inference to handle larger images on CPU
    tile = 256
    pad = 4
    h, w = bgr.shape[:2]
    out_h, out_w = h * scale, w * scale
    result = np.zeros((out_h, out_w, 3), dtype=np.uint8)

    for y in range(0, h, tile):
        for x in range(0, w, tile):
            x1 = max(0, x - pad)
            y1 = max(0, y - pad)
            x2 = min(w, x + tile + pad)
            y2 = min(h, y + tile + pad)

            patch = bgr[y1:y2, x1:x2]
            upscaled = sr.upsample(patch)

            # Crop out the padding from the output tile
            ox1 = (x - x1) * scale
            oy1 = (y - y1) * scale
            ox2 = ox1 + (min(x + tile, w) - x) * scale
            oy2 = oy1 + (min(y + tile, h) - y) * scale

            # Destination coordinates
            dx1, dy1 = x * scale, y * scale
            dx2 = dx1 + (min(x + tile, w) - x) * scale
            dy2 = dy1 + (min(y + tile, h) - y) * scale

            result[dy1:dy2, dx1:dx2] = upscaled[oy1:oy2, ox1:ox2]

    rgb_result = cv2.cvtColor(result, cv2.COLOR_BGR2RGB)
    return Image.fromarray(rgb_result)


def process_image_full(img_source, crop_box=None, rotate_angle=0, flip_h=False, flip_v=False, scale_percent=100, max_w=None, max_h=None, exact_w=None, exact_h=None, format='JPEG', quality=85, target_kb=None, keep_exif=False, brightness=100, contrast=100, saturation=100, sharpness=100, blur=0, temperature=0, vignette=0, filter_type='none', secondary_img=None, blend_config=None):
    """
    Complete pipeline: load -> transform -> adjust/filter -> blend/stitch -> compress/target_size -> metrics & base64 output.
    """
    orig_img = load_image(img_source)
    orig_buf = io.BytesIO()
    orig_fmt = orig_img.format if orig_img.format in ['JPEG', 'PNG', 'WEBP', 'BMP', 'TIFF'] else 'PNG'
    orig_img.save(orig_buf, format=orig_fmt)
    orig_bytes = orig_buf.tell()
    
    transformed = transform_image(orig_img, crop_box, rotate_angle, flip_h, flip_v, scale_percent, max_w, max_h, exact_w, exact_h)
    transformed = apply_adjustments(transformed, brightness, contrast, saturation, sharpness, blur, temperature, vignette, filter_type)
    
    if secondary_img and blend_config:
        transformed = blend_overlay_images(transformed, secondary_img, blend_config)
    
    achieved_quality = quality
    achieved_scale = scale_percent
    
    if target_kb and target_kb > 0:
        out_bytes, achieved_quality, achieved_scale = compress_to_target_size(transformed, target_kb, format=format, keep_exif=keep_exif)
    else:
        out_bytes = encode_image(transformed, format=format, quality=quality, keep_exif=keep_exif, original_img=orig_img)
        
    compressed_size = len(out_bytes)
    savings_pct = round(((orig_bytes - compressed_size) / float(orig_bytes)) * 100, 1) if orig_bytes > 0 else 0
    
    b64_output = "data:image/" + format.lower() + ";base64," + base64.b64encode(out_bytes).decode('utf-8')
    
    return {
        "image_data": b64_output,
        "original_width": orig_img.width,
        "original_height": orig_img.height,
        "original_size_bytes": orig_bytes,
        "processed_width": transformed.width,
        "processed_height": transformed.height,
        "processed_size_bytes": compressed_size,
        "savings_percent": savings_pct,
        "format": format.upper(),
        "quality": achieved_quality,
        "scale": achieved_scale
    }


def generate_picture_background(target_w, target_h, key="studio"):
    """
    Generates rich, photographic/artistic picture backgrounds:
    Presets: 'beach', 'studio', 'cyberpunk', 'nature', 'mountains', 'bokeh'
    """
    from PIL import ImageDraw, ImageFilter, ImageOps
    import math, random

    key_lower = str(key).lower()
    bg = Image.new('RGBA', (target_w, target_h))
    draw = ImageDraw.Draw(bg)

    if any(w in key_lower for w in ['beach', 'sunset', 'sun', 'ocean']):
        # Sunset Beach picture: Gradient sky + Sun disk + Ocean waves
        for y in range(target_h):
            factor = y / float(target_h)
            if factor < 0.6:  # Sky
                sf = factor / 0.6
                r = int(255 - sf * 40)
                g = int(100 + sf * 50 - sf * 90)
                b = int(120 - sf * 100)
            else:  # Ocean water
                of = (factor - 0.6) / 0.4
                r = int(20 + of * 10)
                g = int(30 + of * 40)
                b = int(70 + of * 60)
            draw.line([(0, y), (target_w, y)], fill=(r, g, b, 255))
        
        # Sun disk & horizon glow
        sun_cx, sun_cy = int(target_w * 0.5), int(target_h * 0.52)
        sun_r = int(min(target_w, target_h) * 0.14)
        for r_i in range(sun_r, 0, -2):
            draw.ellipse([sun_cx - r_i, sun_cy - r_i, sun_cx + r_i, sun_cy + r_i], fill=(255, 220, 150, 255))
        # Horizon line light highlight
        draw.line([(0, int(target_h * 0.6)), (target_w, int(target_h * 0.6))], fill=(255, 200, 140, 200), width=3)

    elif any(w in key_lower for w in ['cyber', 'neon', 'city', 'tech']):
        # Cyberpunk Neon Night picture: Dark tech canvas with glowing neon pink & cyan light orbs
        for y in range(target_h):
            factor = y / float(target_h)
            r = int(12 + factor * 10)
            g = int(10 + factor * 15)
            b = int(28 + factor * 40)
            draw.line([(0, y), (target_w, y)], fill=(r, g, b, 255))
        
        # Neon glowing light orbs
        for (cx_pct, cy_pct, rad_pct, col) in [
            (0.2, 0.3, 0.35, (0, 242, 254)),   # Neon Cyan
            (0.8, 0.7, 0.4, (255, 0, 128)),    # Neon Magenta
            (0.5, 0.2, 0.25, (138, 43, 226))   # Neon Purple
        ]:
            cx, cy = int(target_w * cx_pct), int(target_h * cy_pct)
            rad = int(max(target_w, target_h) * rad_pct)
            overlay = Image.new('RGBA', (target_w, target_h), (0, 0, 0, 0))
            odraw = ImageDraw.Draw(overlay)
            odraw.ellipse([cx - rad, cy - rad, cx + rad, cy + rad], fill=(col[0], col[1], col[2], 90))
            overlay = overlay.filter(ImageFilter.GaussianBlur(max(1, rad // 2)))
            bg = Image.alpha_composite(bg, overlay)
            draw = ImageDraw.Draw(bg)

    elif any(w in key_lower for w in ['nature', 'forest', 'green', 'park', 'tree']):
        # Forest Nature Depth picture: Multi-tone forest foliage & warm sunbeam rays
        for y in range(target_h):
            factor = y / float(target_h)
            r = int(15 + factor * 25)
            g = int(45 + factor * 60)
            b = int(25 + factor * 20)
            draw.line([(0, y), (target_w, y)], fill=(r, g, b, 255))
        
        # Sunbeams & soft forest bokeh
        overlay = Image.new('RGBA', (target_w, target_h), (0, 0, 0, 0))
        odraw = ImageDraw.Draw(overlay)
        for i in range(12):
            bx = int(target_w * ((i * 0.08 + 0.1) % 1.0))
            by = int(target_h * ((i * 0.12 + 0.15) % 0.8))
            brad = int(min(target_w, target_h) * (0.06 + (i % 4) * 0.03))
            odraw.ellipse([bx - brad, by - brad, bx + brad, by + brad], fill=(240, 255, 180, 70))
        overlay = overlay.filter(ImageFilter.GaussianBlur(max(1, min(target_w, target_h) // 25)))
        bg = Image.alpha_composite(bg, overlay)

    elif any(w in key_lower for w in ['bokeh', 'abstract', 'lights']):
        # Bokeh Lights picture: Deep velvet canvas with soft blurred glowing circles
        for y in range(target_h):
            factor = y / float(target_h)
            r = int(20 + factor * 15)
            g = int(15 + factor * 10)
            b = int(35 + factor * 25)
            draw.line([(0, y), (target_w, y)], fill=(r, g, b, 255))

        overlay = Image.new('RGBA', (target_w, target_h), (0, 0, 0, 0))
        odraw = ImageDraw.Draw(overlay)
        colors = [(255, 180, 80), (230, 100, 200), (100, 200, 255), (255, 220, 130)]
        for i in range(15):
            cx = int(target_w * ((i * 0.13 + 0.05) % 1.0))
            cy = int(target_h * ((i * 0.17 + 0.1) % 1.0))
            rad = int(min(target_w, target_h) * (0.08 + (i % 5) * 0.04))
            col = colors[i % len(colors)]
            odraw.ellipse([cx - rad, cy - rad, cx + rad, cy + rad], fill=(col[0], col[1], col[2], 110))
        overlay = overlay.filter(ImageFilter.GaussianBlur(max(1, min(target_w, target_h) // 20)))
        bg = Image.alpha_composite(bg, overlay)

    elif any(w in key_lower for w in ['mountain', 'mountains', 'lake']):
        # Mountain Lake Twilight picture: Sky gradient + Mountain silhouettes + Lake
        for y in range(target_h):
            factor = y / float(target_h)
            if factor < 0.55:  # Sky
                r = int(45 + factor * 100)
                g = int(35 + factor * 60)
                b = int(80 + factor * 40)
            else:  # Lake
                of = (factor - 0.55) / 0.45
                r = int(25 + of * 20)
                g = int(30 + of * 30)
                b = int(60 + of * 40)
            draw.line([(0, y), (target_w, y)], fill=(r, g, b, 255))
        
        # Mountain silhouette peaks
        peak_y = int(target_h * 0.55)
        points = [(0, target_h)]
        for x in range(0, target_w + 10, max(1, int(target_w / 10))):
            h_var = int(target_h * 0.2 * math.sin(x * 0.02 + 1.2))
            points.append((x, peak_y - abs(h_var)))
        points.append((target_w, target_h))
        draw.polygon(points, fill=(18, 20, 38, 255))

    else:  # 'studio' or default
        # Professional Studio Photography Backdrop: Vignette spotlight + backdrop floor edge
        cx, cy = target_w // 2, int(target_h * 0.4)
        max_dist = math.hypot(target_w, target_h) * 0.65
        for y in range(target_h):
            for x in range(0, target_w, 4):  # Step x by 4 for performance
                dist = math.hypot(x - cx, y - cy)
                factor = min(1.0, dist / max_dist)
                # Soft studio lighting (warm white center to deep slate edge)
                r = int(235 - factor * 135)
                g = int(238 - factor * 130)
                b = int(245 - factor * 120)
                draw.rectangle([x, y, x + 3, y], fill=(r, g, b, 255))
        # Subtle studio floor shadow line
        floor_y = int(target_h * 0.82)
        draw.line([(0, floor_y), (target_w, floor_y)], fill=(160, 165, 175, 120), width=2)

    return bg


def replace_background_ai(img, prompt="cyberpunk city background", bg_preset=None, bg_image=None):
    """
    AI & Photo Background Replacement:
    1. Extracts subject foreground using rembg.
    2. If custom `bg_image` is provided, resizes/fits it as background.
    3. If `bg_preset` or custom key is provided (or Gemini API key unavailable), uses realistic photo background generator.
    4. Validates API key and attempts Gemini AI background generation if requested.
    5. Composites foreground over new background seamlessly.
    """
    from PIL import ImageOps

    # 1. Remove background to get RGBA subject
    fg = remove_background(img)  # PIL RGBA
    if fg.mode != 'RGBA':
        fg = fg.convert('RGBA')

    target_w, target_h = fg.size
    bg = None

    # Option A: Custom User Uploaded Background Image
    if bg_image is not None:
        try:
            if isinstance(bg_image, str):
                bg_pil = load_image(bg_image)
            else:
                bg_pil = bg_image
            # Fit background image to match target dimensions cleanly
            bg = ImageOps.fit(bg_pil.convert('RGBA'), (target_w, target_h), method=Image.Resampling.LANCZOS)
        except Exception as e:
            print(f"[Custom BG Image] Failed to load background picture: {e}")

    # Option B: Gemini AI Generation (if valid API key available & no custom picture provided)
    if bg is None and bg_preset is None:
        api_key = (os.environ.get('GEMINI_API_KEY') or '').strip()
        if api_key and api_key.startswith('AIza'):
            try:
                from google import genai
                from google.genai import types

                client = genai.Client(api_key=api_key)
                result = client.models.generate_images(
                    model='imagen-3.0-generate-002',
                    prompt=f"High resolution photo background: {prompt}, professional studio lighting",
                    config=types.GenerateImagesConfig(
                        number_of_images=1,
                        aspect_ratio="1:1",
                        output_mime_type="image/jpeg"
                    )
                )
                if result.generated_images:
                    img_bytes = result.generated_images[0].image.image_bytes
                    bg = Image.open(io.BytesIO(img_bytes)).convert('RGBA')
            except Exception as ex:
                print(f"[Gemini Imagen] Note: {ex}")

    # Option C: High Resolution Photographic / Artistic Background Presets
    if bg is None:
        preset_key = bg_preset if bg_preset else prompt
        bg = generate_picture_background(target_w, target_h, preset_key)

    # Resize background to match foreground if needed
    if bg.size != (target_w, target_h):
        bg = bg.resize((target_w, target_h), Image.Resampling.LANCZOS).convert('RGBA')
    elif bg.mode != 'RGBA':
        bg = bg.convert('RGBA')

    # Composite foreground on top of background using alpha mask
    bg.paste(fg, (0, 0), mask=fg.split()[3])
    return bg.convert('RGB')


