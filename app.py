import os
import sys
import base64
import threading
import webview
from flask import Flask, render_template, request, jsonify, Response
import image_engine

app = Flask(__name__, static_folder='static', template_folder='templates')
app.config['SECRET_KEY'] = 'pixelcompress_secret_key_2026'

# Disable Flask logging noise
import logging
log = logging.getLogger('werkzeug')
log.setLevel(logging.ERROR)


class DesktopAPI:
    """
    Exposes native Windows desktop dialogues and operations to PyWebView JS context.
    """
    def select_files(self):
        window = webview.windows[0] if webview.windows else None
        files = window.create_file_dialog(
            webview.OPEN_DIALOG,
            allow_multiple=True,
            file_types=('Image Files (*.jpg;*.jpeg;*.png;*.webp;*.bmp;*.tiff)', 'All Files (*.*)')
        )
        return files

    def save_file(self, b64_data, filename_default="optimized_image.jpg"):
        window = webview.windows[0] if webview.windows else None
        save_path = window.create_file_dialog(
            webview.SAVE_DIALOG,
            save_filename=filename_default,
            file_types=('Image Files (*.jpg;*.jpeg;*.png;*.webp;*.bmp;*.tiff)', 'All Files (*.*)')
        )
        if save_path:
            if isinstance(save_path, (list, tuple)):
                save_path = save_path[0]
            
            header, encoded = b64_data.split(',', 1)
            raw_bytes = base64.b64decode(encoded)
            with open(save_path, 'wb') as f:
                f.write(raw_bytes)
            return {"success": True, "path": save_path}
        return {"success": False}


@app.route('/')
def index():
    return render_template('index.html')


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


def run_flask():
    app.run(host='127.0.0.1', port=54321, debug=False, use_reloader=False)


def main():
    # 1. Start Flask web server thread
    server_thread = threading.Thread(target=run_flask)
    server_thread.daemon = True
    server_thread.start()

    # 2. Launch PyWebView Desktop Window
    api = DesktopAPI()
    icon_path = os.path.join(os.path.dirname(__file__), 'app_icon.ico')
    webview.create_window(
        title='PixelCompress PRO - Image Compressor & Cropper',
        url='http://127.0.0.1:54321',
        width=1340,
        height=880,
        min_size=(1024, 700),
        js_api=api
    )
    webview.start()


if __name__ == '__main__':
    main()