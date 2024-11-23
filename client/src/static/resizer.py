import os
from PIL import Image

def resize_image(input_path, output_path, size):
    with Image.open(input_path) as img:
        resized_img = img.resize(size, Image.LANCZOS)
        resized_img.save(output_path)

def process_directory(directory_path, size=(64, 64)):
    for root, dirs, files in os.walk(directory_path):
        for file in files:
            if "_64x64" not in file:
                file_path = os.path.join(root, file)
                filename, file_extension = os.path.splitext(file)

                if file_extension.lower() in ['.jpg', '.jpeg', '.png', '.gif']:
                    print(filename)
                    new_filename = f"{filename}_64x64{file_extension}"
                    output_path = os.path.join(root, new_filename)

                    resize_image(file_path, output_path, size)
                    print(f"Resized {file} to {new_filename}")
                    resize_image(file_path, file_path, (256,256))
                    print(f"Shrunk {file} to 256x256")

if __name__ == "__main__":
    process_directory('img')
