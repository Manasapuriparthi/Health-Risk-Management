import urllib.request, re, json

# Fetch the HTML of the deployed app
html = urllib.request.urlopen('https://frontend-nu-ivory-0w37cbce0a.vercel.app/').read().decode('utf-8')

# Find JS bundle files
js_files = re.findall(r'src="(/assets/[^"]+\.js)"', html)
print("JS files found:", js_files)

# Check each JS bundle for API URLs
for js_file in js_files:
    url = 'https://frontend-nu-ivory-0w37cbce0a.vercel.app' + js_file
    try:
        js = urllib.request.urlopen(url).read().decode('utf-8')
        if 'localhost' in js or 'onrender' in js or 'API_BASE' in js or '8000' in js:
            print(f"\n=== {js_file} ===")
            print("localhost found:", 'localhost' in js)
            print("onrender found:", 'onrender' in js)
            print("port 8000 found:", '8000' in js)
            # Find the actual API URL
            urls = re.findall(r'https?://[a-zA-Z0-9._:/-]+', js)
            api_urls = [u for u in set(urls) if any(x in u for x in ['render', 'localhost', '127.0.0.1', '8000'])]
            print("API URLs:", api_urls)
    except Exception as e:
        print(f"Error reading {js_file}: {e}")
