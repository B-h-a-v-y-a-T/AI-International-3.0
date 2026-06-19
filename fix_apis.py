import os

directory = r'c:\Users\vedan\Downloads\itsahack2.0-integration1 (1)\OptiML_integration2'
files_to_check = []

for root, _, files in os.walk(directory):
    if 'node_modules' in root or '.git' in root:
        continue
    for file in files:
        if file.endswith('.html') or file.endswith('.js'):
            files_to_check.append(os.path.join(root, file))

for filepath in files_to_check:
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    if "fetch('/api/" in content or 'fetch("/api/' in content:
        new_content = content.replace("fetch('/api/", "fetch('http://localhost:5050/api/")
        new_content = new_content.replace('fetch("/api/', 'fetch("http://localhost:5050/api/')
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f'Updated {os.path.basename(filepath)}')

print('Done!')
