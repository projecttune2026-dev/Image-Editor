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