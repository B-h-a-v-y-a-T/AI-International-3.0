import os
import re

directory = r"c:\Users\Kushal\OneDrive\Desktop\edtech\AI-International-3.0"

for filename in os.listdir(directory):
    if filename.endswith(".html"):
        filepath = os.path.join(directory, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # Check if the file contains MHT CET option
        if "<option>MHT CET</option>" in content:
            # If it already contains SAT option exactly after MHT CET, skip
            if "<option>SAT</option>" in content or '<option value="sat">SAT</option>' in content:
                # wait, let me just replace if it already has <option value="sat">SAT</option> to normalize
                content = content.replace('<option value="sat">SAT</option>', '')
                content = content.replace('<option>SAT</option>', '')

            # Now insert <option>SAT</option> below <option>MHT CET</option>
            content = content.replace("<option>MHT CET</option>", "<option>MHT CET</option>\n                    <option>SAT</option>")

            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Updated {filename}")
