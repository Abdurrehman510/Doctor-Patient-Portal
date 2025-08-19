import os

# Set of file names to exclude
excluded_files = {"package-lock.json", "scraped_files.json", "a.py", "README.md","google_key.json",'file.txt'}
excluded_dirs = {"node_modules",'docs'}

def write_folder_contents(folder_path, output_file):
    with open(output_file, 'w', encoding='utf-8') as out:
        for root, dirs, files in os.walk(folder_path):
            # Exclude specific directories (in-place modification)
            dirs[:] = [d for d in dirs if d not in excluded_dirs]

            for file_name in files:
                if file_name in excluded_files:
                    continue

                file_path = os.path.join(root, file_name)
                out.write(f"'{file_path}'\n")
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    out.write(f"'{content}'\n\n\n\n")
                except Exception as e:
                    out.write(f"'[Error reading file: {e}]'\n\n")

# Example usage:
folder_to_scan = r"D:\Doctor-Patient-Portal"  # Replace with your folder path
output_file_path = r"D:\Doctor-Patient-Portal\file.txt"  # Replace with desired output file path

write_folder_contents(folder_to_scan, output_file_path)
