import os
import urllib.request
import sys

def download_model():
    models_dir = os.path.join(os.path.dirname(__file__), "models")
    os.makedirs(models_dir, exist_ok=True)
    
    model_path = os.path.join(models_dir, "lama.onnx")
    
    url = "https://huggingface.co/Carve/LaMa-ONNX/resolve/main/lama_fp32.onnx"
    
    if os.path.exists(model_path):
        print(f"Model already exists at {model_path}")
        return
        
    print(f"Downloading LaMa ONNX model to {model_path}...")
    print("This may take a few minutes as it is ~200MB.")
        
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response, open(model_path, 'wb') as out_file:
            total_size = int(response.info().get('Content-Length', -1))
            block_size = 8192
            count = 0
            while True:
                buffer = response.read(block_size)
                if not buffer:
                    break
                out_file.write(buffer)
                count += 1
                if total_size > 0:
                    percent = int(count * block_size * 100 / total_size)
                    sys.stdout.write(f"\rDownloading: {percent}%")
                    sys.stdout.flush()
        print("\nDownload complete!")
    except Exception as e:
        print(f"\nError downloading model: {e}")

if __name__ == "__main__":
    download_model()
