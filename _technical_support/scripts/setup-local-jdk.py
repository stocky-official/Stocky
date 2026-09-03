import os
import sys
import zipfile
import urllib.request

DEST_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'tools', 'jdk-17'))
ZIP_URL = 'https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.20.1%2B1/OpenJDK17U-jdk_x64_windows_hotspot_17.0.20.1_1.zip'
ZIP_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'tools', 'jdk17.zip'))

def main():
    tools_dir = os.path.dirname(ZIP_PATH)
    os.makedirs(tools_dir, exist_ok=True)

    java_exe = os.path.join(DEST_DIR, 'bin', 'java.exe')
    if os.path.exists(java_exe):
        print(f"JDK 17 already installed at: {DEST_DIR}")
        return

    print(f"Downloading portable OpenJDK 17 (~180MB)...")
    def report_progress(block_num, block_size, total_size):
        downloaded = block_num * block_size
        percent = (downloaded / total_size) * 100
        if block_num % 1000 == 0:
            print(f" -> Downloaded {downloaded // (1024*1024)}MB / {total_size // (1024*1024)}MB ({percent:.1f}%)")

    opener = urllib.request.build_opener()
    opener.addheaders = [('User-Agent', 'Mozilla/5.0')]
    urllib.request.install_opener(opener)

    urllib.request.urlretrieve(ZIP_URL, ZIP_PATH, reporthook=report_progress)
    print("Download complete. Extracting zip archive...")

    with zipfile.ZipFile(ZIP_PATH, 'r') as z:
        # Extract into a temp folder then rename
        extract_root = os.path.join(tools_dir, 'jdk_temp')
        z.extractall(extract_root)
        extracted_dirs = os.listdir(extract_root)
        if extracted_dirs:
            inner_jdk = os.path.join(extract_root, extracted_dirs[0])
            if os.path.exists(DEST_DIR):
                import shutil
                shutil.rmtree(DEST_DIR)
            os.rename(inner_jdk, DEST_DIR)
            os.rmdir(extract_root)

    if os.path.exists(ZIP_PATH):
        os.remove(ZIP_PATH)

    print(f"Portable JDK 17 successfully installed at: {DEST_DIR}")

if __name__ == '__main__':
    main()
