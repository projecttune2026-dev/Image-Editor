# 🖼️ Image-Editor

A powerful, full-featured image editing and optimization web application built with **Python/Flask** backend. Process, enhance, and compress images with professional-grade tools including AI upscaling, background removal, batch processing, and more.

## ✨ Features

### Core Editing
- **Crop & Transform**: Precise cropping, rotation, and flipping
- **Resizing**: Scale by percentage, max dimensions, or exact pixel dimensions
- **Format Conversion**: JPEG, PNG, WebP, BMP, TIFF support

### Image Enhancement
- **Brightness, Contrast, Saturation, Sharpness** controls
- **Color Temperature**: Warm/cool adjustments (-100 to +100)
- **Vignette Effect**: Professional corner darkening
- **Gaussian Blur**: Adjustable blur radius

### Advanced Features
- **AI Upscaling**: 4x upscaling using EDSR deep super-resolution via OpenCV
- **Background Removal**: Intelligent background extraction with `rembg`
- **Image Blending**: Overlay, fade/crossfade, and side-by-side joining
- **Stylistic Filters**: Grayscale, sepia, invert, document scan enhancement
- **Smart Compression**: Binary search algorithm to hit target file sizes

### Workflow Features
- **Batch Processing**: Process multiple images at once (threaded)
- **Preset System**: 6 built-in presets (Social Media, Web Optimized, Print Ready, Email, Thumbnail, Cinematic)
- **Custom Presets**: Save and manage your own editing presets
- **EXIF Preservation**: Option to keep metadata when exporting

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- pip

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/projecttune2026-dev/Image-Editor.git
   cd Image-Editor
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the application**
   ```bash
   python app.py
   ```
   
   Or on Windows:
   ```bash
   run.bat
   ```

4. **Access in browser**
   - The app automatically opens at `http://127.0.0.1:54321`

## 📋 Requirements

```
flask>=3.0.0
pillow>=10.0.0
rembg>=2.0.50
onnxruntime>=1.16.0
opencv-contrib-python>=4.10.0.84
```

## 🏗️ Project Structure

```
Image-Editor/
├── app.py                    # Flask server & API routes
├── image_engine.py           # Core image processing engine
├── test_engine.py            # Test suite for image processing
├── presets.json              # Built-in & custom edit presets
├── requirements.txt          # Python dependencies
├── templates/                # HTML templates (frontend)
├── static/                   # CSS, JS, assets
├── models/                   # AI models (auto-downloaded)
├── run.bat                   # Windows launcher
└── run.vbs                   # Windows silent launcher
```

## 🔧 API Endpoints

### Image Processing
- `POST /api/process` - Process single image with custom settings
- `POST /api/batch_process` - Batch process multiple images (returns ZIP)
- `POST /api/remove_bg` - Remove image background
- `POST /api/upscale` - AI upscale image 4x

### Presets
- `GET /api/presets` - List all presets
- `POST /api/presets/save` - Save custom preset
- `POST /api/presets/delete` - Delete custom preset

### Utilities
- `GET /api/load_file` - Load image from disk
- `POST /api/download` - Download processed image

## 📦 Built-in Presets

| Preset | Format | Quality | Use Case |
|--------|--------|---------|----------|
| **Social Media** | JPEG | 82 | Vibrant colors for Instagram, Facebook |
| **Web Optimized** | WebP | 75 | Fast loading for websites |
| **Print Ready** | PNG | 100 | High-quality print output |
| **Email** | JPEG | 62 | Lightweight for email attachments |
| **Thumbnail** | JPEG | 70 | Small preview images |
| **Cinematic** | JPEG | 88 | Cool tones, high contrast, vignette |

## 🧪 Testing

Run the built-in test suite:
```bash
python test_engine.py
```

Tests cover:
- ✅ Crop & transform operations
- ✅ Target file size compression
- ✅ Format conversion (JPEG, WebP, PNG)
- ✅ Exact dimension resizing
- ✅ Advanced filters (temperature, vignette, doc scan)
- ✅ Dual image blending (overlay, fade, join)

## 🎯 Usage Examples

### Single Image Processing
```python
import image_engine

result = image_engine.process_image_full(
    img_source='photo.jpg',
    brightness=110,
    contrast=120,
    saturation=115,
    format='JPEG',
    quality=85
)
# Returns: base64 encoded image + metadata
```

### Background Removal
```python
img = image_engine.load_image('photo.jpg')
result = image_engine.remove_background(img)
result.save('photo_no_bg.png')
```

### AI Upscaling
```python
img = image_engine.load_image('small.jpg')
upscaled = image_engine.upscale_image(img, scale=4)
```

### Smart Compression
```python
result = image_engine.process_image_full(
    img_source='large.jpg',
    target_kb=500,  # Compress to 500 KB max
    format='JPEG'
)
```

## ⚙️ Configuration

### Environment Variables
Create a `.env` file (optional):
```env
GEMINI_API_KEY=your_key_here
```

### Performance Tuning
- **Background Removal**: Max input side 2048px (auto-resizes for efficiency)
- **Upscaling**: Max input side 1024px (processes in 256px tiles)
- **Batch Processing**: Max 4 concurrent workers

## 🐛 Troubleshooting

**Port Already in Use**
- Change port in `app.py` line 344: `app.run(host='127.0.0.1', port=54321)`

**Model Download Issues**
- EDSR model auto-downloads on first upscale (~40MB)
- Manual download: Run `python download_models.py`

**Memory Issues with Large Images**
- Background removal caps at 2048px
- Upscaling caps at 1024px
- Adjust in `image_engine.py` if needed

## 📝 License

Open source - feel free to modify and use!

## 🤝 Contributing

Found a bug or have a feature request? Feel free to:
1. Fork the repo
2. Create a feature branch
3. Submit a pull request

## 📧 Support

For issues or questions, reach out or open an issue in the repository.

---

**Last Updated**: August 2026
