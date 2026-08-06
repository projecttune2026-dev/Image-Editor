import os
import sys
from PIL import Image, ImageDraw
import image_engine

def test_engine():
    print("[1/5] Creating synthetic test image...")
    img = Image.new('RGB', (1200, 800), color=(30, 144, 255))
    draw = ImageDraw.Draw(img)
    draw.rectangle([100, 100, 500, 500], fill=(255, 99, 71))
    draw.ellipse([600, 200, 1100, 700], fill=(50, 205, 50))
    
    test_path = "test_input.png"
    img.save(test_path)
    print(f"Created test image at {test_path} ({os.path.getsize(test_path)} bytes)")
    
    print("\n[2/5] Testing Crop & Transform...")
    result = image_engine.process_image_full(
        img_source=test_path,
        crop_box=(100, 100, 500, 500),
        rotate_angle=90,
        flip_h=True,
        format='JPEG',
        quality=80
    )
    print(f"Crop & Transform OK: Output size {result['processed_width']}x{result['processed_height']}, {result['processed_size_bytes']} bytes, Savings: {result['savings_percent']}%")
    assert result['processed_width'] == 400
    assert result['processed_height'] == 400
    
    print("\n[3/5] Testing Target File Size Compression (Target: 50 KB)...")
    res_target = image_engine.process_image_full(
        img_source=test_path,
        format='JPEG',
        target_kb=50
    )
    target_bytes = 50 * 1024
    print(f"Target 50 KB OK: Achieved {res_target['processed_size_bytes'] / 1024:.2f} KB (Target max 50 KB), Quality: {res_target['quality']}, Scale: {res_target['scale']}%")
    assert res_target['processed_size_bytes'] <= target_bytes + 2048 # small buffer allowance
    
    print("\n[4/5] Testing WebP Conversion...")
    res_webp = image_engine.process_image_full(
        img_source=test_path,
        format='WEBP',
        quality=75
    )
    print(f"WebP OK: Size {res_webp['processed_size_bytes']} bytes, format {res_webp['format']}")
    assert res_webp['format'] == 'WEBP'
    
    print("\n[5/7] Testing Exact Target Dimensions (1920x1080)...")
    res_dim = image_engine.process_image_full(
        img_source=test_path,
        exact_w=1920,
        exact_h=1080,
        format='JPEG'
    )
    print(f"Exact Dimensions OK: Output size {res_dim['processed_width']}x{res_dim['processed_height']} px")
    assert res_dim['processed_width'] == 1920
    assert res_dim['processed_height'] == 1080

    print("\n[6/8] Testing Temperature, Vignette, and Doc Scan Filters...")
    res_filters = image_engine.process_image_full(
        img_source=test_path,
        temperature=30,
        vignette=40,
        filter_type='doc_scan',
        format='JPEG'
    )
    print(f"Advanced Filters OK: Size {res_filters['processed_size_bytes']} bytes")
    assert res_filters['processed_size_bytes'] > 0

    print("\n[7/8] Testing Dual Image Blender & Joiner (Overlay, Fade, Join)...")
    sec_img = Image.new('RGB', (400, 400), color=(255, 215, 0))
    sec_path = "test_secondary.png"
    sec_img.save(sec_path)

    # Test PIP Overlay
    res_overlay = image_engine.process_image_full(
        img_source=test_path,
        secondary_img=sec_path,
        blend_config={'mode': 'overlay', 'scale': 30, 'opacity': 80, 'position': 'bottom-right'}
    )
    assert res_overlay['processed_size_bytes'] > 0

    # Test Fade Blend
    res_fade = image_engine.process_image_full(
        img_source=test_path,
        secondary_img=sec_path,
        blend_config={'mode': 'fade', 'fade_ratio': 40, 'blend_mode': 'multiply'}
    )
    assert res_fade['processed_size_bytes'] > 0

    # Test Side-by-Side Join
    res_join = image_engine.process_image_full(
        img_source=test_path,
        secondary_img=sec_path,
        blend_config={'mode': 'join', 'direction': 'horizontal', 'gap': 10}
    )
    print(f"Dual Image Blender OK: Overlay size {res_overlay['processed_width']}x{res_overlay['processed_height']}, Joined size {res_join['processed_width']}x{res_join['processed_height']} px")
    assert res_join['processed_width'] == 1200 + 10 + 800 # 1200 + gap + scaled sec (400x800/400)
    assert res_join['processed_height'] == 800

    print("\n[Cleanup] Removing temporary test artifacts...")
    if os.path.exists(test_path):
        os.remove(test_path)
    if os.path.exists(sec_path):
        os.remove(sec_path)
        
    print("\nALL VERIFICATION TESTS PASSED SUCCESSFULLY! [OK]")

if __name__ == "__main__":
    test_engine()
