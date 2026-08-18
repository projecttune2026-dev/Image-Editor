import os
import sys
import base64
import threading
import webbrowser
import time
from flask import Flask, render_template, request, jsonify, Response
import image_engine

app = Flask(__name__, static_folder='static', template_folder='templates')
app.config['SECRET_KEY'] = 'pixelcompress_secret_key_2026'

# Disable Flask logging noise
import logging
log = logging.getLogger('werkzeug')
log.setLevel(logging.ERROR)



@app.route('/')
def index():
    return render_template('index.html')


# ─── Presets ───────────────────────────────────────────────────────────────────
import json
PRESETS_PATH = os.path.join(os.path.dirname(__file__), 'presets.json')


@app.route('/api/presets', methods=['GET'])
def api_get_presets():
    try:
        with open(PRESETS_PATH, 'r', encoding='utf-8') as f:
            presets = json.load(f)
        return jsonify(presets)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/presets/save', methods=['POST'])
def api_save_preset():
    try:
        data = request.json or {}
        name = data.get('name', '').strip()
        settings = data.get('settings', {})
        if not name:
            return jsonify({"error": "Preset name required"}), 400

        with open(PRESETS_PATH, 'r', encoding='utf-8') as f:
            presets = json.load(f)

        # Replace existing custom preset with same name, or append
        existing = next((i for i, p in enumerate(presets) if p.get('id') == f"custom_{name.lower().replace(' ','_')}"), None)
        new_preset = {
            "id": f"custom_{name.lower().replace(' ','_')}",
            "name": name,
            "icon": "fa-star",
            "builtin": False,
            "settings": settings
        }
        if existing is not None:
            presets[existing] = new_preset
        else:
            presets.append(new_preset)

        with open(PRESETS_PATH, 'w', encoding='utf-8') as f:
            json.dump(presets, f, indent=2)

        return jsonify({"success": True, "preset": new_preset})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/presets/delete', methods=['POST'])
def api_delete_preset():
    try:
        data = request.json or {}
        preset_id = data.get('id', '')
        with open(PRESETS_PATH, 'r', encoding='utf-8') as f:
            presets = json.load(f)
        presets = [p for p in presets if p.get('id') != preset_id or p.get('builtin')]
        with open(PRESETS_PATH, 'w', encoding='utf-8') as f:
            json.dump(presets, f, indent=2)
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/load_file', methods=['GET'])
def api_load_file():
    file_path = request.args.get('path')
    if not file_path or not os.path.exists(file_path):
        return jsonify({"error": "File path does not exist"}), 400

    try:
        file_size = os.path.getsize(file_path)
        with open(file_path, 'rb') as f:
            raw_data = f.read()
        
        b64_str = "data:image/jpeg;base64," + base64.b64encode(raw_data).decode('utf-8')
        filename = os.path.basename(file_path)
        
        return jsonify({
            "filename": filename,
            "size_bytes": file_size,
            "image_data": b64_str
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/process', methods=['POST'])
def api_process():
    try:
        data = request.json or {}
        img_source = data.get('image_data')
        if not img_source:
            return jsonify({"error": "No image data provided"}), 400

        crop_box = data.get('crop_box') # [left, top, right, bottom]
        rotate_angle = int(data.get('rotate_angle', 0))
        flip_h = bool(data.get('flip_h', False))
        flip_v = bool(data.get('flip_v', False))
        scale_percent = int(data.get('scale_percent', 100))
        max_w = int(data['max_w']) if data.get('max_w') else None
        max_h = int(data['max_h']) if data.get('max_h') else None
        exact_w = int(data['exact_w']) if data.get('exact_w') else None
        exact_h = int(data['exact_h']) if data.get('exact_h') else None
        format_name = str(data.get('format', 'JPEG')).upper()
        quality = int(data.get('quality', 85))
        target_kb = int(data['target_kb']) if data.get('target_kb') else None
        keep_exif = bool(data.get('keep_exif', False))

        # Tier 1 adjustments
        brightness = int(data.get('brightness', 100))
        contrast = int(data.get('contrast', 100))
        saturation = int(data.get('saturation', 100))
        sharpness = int(data.get('sharpness', 100))
        blur = int(data.get('blur', 0))
        temperature = int(data.get('temperature', 0))
        vignette = int(data.get('vignette', 0))
        filter_type = str(data.get('filter_type', 'none'))
        secondary_img = data.get('secondary_image_data')
        blend_config = data.get('blend_config')

        result = image_engine.process_image_full(
            img_source=img_source,
            crop_box=crop_box,
            rotate_angle=rotate_angle,
            flip_h=flip_h,
            flip_v=flip_v,
            scale_percent=scale_percent,
            max_w=max_w,
            max_h=max_h,
            exact_w=exact_w,
            exact_h=exact_h,
            format=format_name,
            quality=quality,
            target_kb=target_kb,
            keep_exif=keep_exif,
            brightness=brightness,
            contrast=contrast,
            saturation=saturation,
            sharpness=sharpness,
            blur=blur,
            temperature=temperature,
            vignette=vignette,
            filter_type=filter_type,
            secondary_img=secondary_img,
            blend_config=blend_config
        )
        return jsonify(result)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route('/api/batch_process', methods=['POST'])
def api_batch_process():
    import io
    import zipfile
    from concurrent.futures import ThreadPoolExecutor
    
    try:
        data = request.json or {}
        items = data.get('items', [])
        settings = data.get('settings', {})
        
        if not items:
            return jsonify({"error": "No items provided"}), 400
            
        format_name = str(settings.get('format', 'JPEG')).upper()
        quality = int(settings.get('quality', 85))
        target_kb = int(settings.get('target_kb')) if settings.get('target_kb') else None
        scale_percent = int(settings.get('scale_percent', 100))
        
        def process_single(item):
            name = item.get('name', 'image')
            img_src = item.get('src')
            if not img_src:
                return None
            
            res = image_engine.process_image_full(
                img_source=img_src,
                format=format_name,
                quality=quality,
                target_kb=target_kb,
                scale_percent=scale_percent
            )
            
            b64_data = res['image_data']
            header, encoded = b64_data.split(',', 1)
            raw_bytes = base64.b64decode(encoded)
            
            ext = format_name.lower()
            filename = f"{name}_optimized.{ext}"
            return filename, raw_bytes

        processed_files = []
        with ThreadPoolExecutor(max_workers=min(4, len(items))) as executor:
            results = executor.map(process_single, items)
            for r in results:
                if r:
                    processed_files.append(r)
                    
        zip_buf = io.BytesIO()
        with zipfile.ZipFile(zip_buf, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            for filename, raw_bytes in processed_files:
                zip_file.writestr(filename, raw_bytes)
                
        zip_buf.seek(0)
        
        return Response(
            zip_buf.getvalue(),
            mimetype='application/zip',
            headers={"Content-Disposition": "attachment; filename=Batch_Optimized_Images.zip"}
        )
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route('/api/remove_bg', methods=['POST'])
def api_remove_bg():
    import io
    try:
        data = request.json or {}
        img_source = data.get('image_data')
        if not img_source:
            return jsonify({"error": "No image data provided"}), 400

        # Load PIL image
        img = image_engine.load_image(img_source)
        # Process background removal
        result_img = image_engine.remove_background(img)
        
        # Save output to bytes in PNG format to preserve transparency
        buf = io.BytesIO()
        result_img.save(buf, format='PNG')
        out_bytes = buf.getvalue()
        
        b64_output = "data:image/png;base64," + base64.b64encode(out_bytes).decode('utf-8')
        
        return jsonify({
            "image_data": b64_output,
            "width": result_img.width,
            "height": result_img.height,
            "size_bytes": len(out_bytes)
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route('/api/upscale', methods=['POST'])
def api_upscale():
    import io
    try:
        data = request.json or {}
        img_source = data.get('image_data')
        if not img_source:
            return jsonify({"error": "No image data provided"}), 400

        img = image_engine.load_image(img_source)
        result_img = image_engine.upscale_image(img, scale=4)

        buf = io.BytesIO()
        result_img.save(buf, format='JPEG', quality=92)
        out_bytes = buf.getvalue()

        b64_output = "data:image/jpeg;base64," + base64.b64encode(out_bytes).decode('utf-8')

        return jsonify({
            "image_data": b64_output,
            "width": result_img.width,
            "height": result_img.height,
            "size_bytes": len(out_bytes)
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route('/api/download', methods=['POST'])
def api_download():
    try:
        data = request.get_json()
        b64_data = data.get('image_data')
        filename = data.get('filename', 'optimized_image.png')
        if not b64_data:
            return jsonify({"error": "No image data provided"}), 400
        
        header, encoded = b64_data.split(',', 1)
        mime = header.split(';')[0].split(':')[1] if ';' in header else 'image/png'
        raw_bytes = base64.b64decode(encoded)
        
        return Response(
            raw_bytes,
            mimetype=mime,
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def open_browser():
    # Wait briefly for Flask to spin up
    time.sleep(1.0)
    webbrowser.open('http://127.0.0.1:54321')


def main():
    # Start browser opener thread
    browser_thread = threading.Thread(target=open_browser)
    browser_thread.daemon = True
    browser_thread.start()

    # Start Flask server directly in main thread
    app.run(host='127.0.0.1', port=54321, debug=False, use_reloader=False)


if __name__ == '__main__':
    main()