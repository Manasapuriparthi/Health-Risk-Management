import urllib.request, re, json
try:
    html = urllib.request.urlopen('https://frontend-n6xysj9gt-aihealth.vercel.app/').read().decode('utf-8')
    match = re.search(r'assets/index-[a-zA-Z0-9_-]+\.js', html)
    if match:
        js_url = 'https://frontend-n6xysj9gt-aihealth.vercel.app/' + match.group(0)
        js = urllib.request.urlopen(js_url).read().decode('utf-8')
        print("localhost in js:", 'localhost' in js)
        print("onrender in js:", 'onrender' in js)
        
        # look for any URL
        urls = re.findall(r'"(https?://[^"]+)"', js)
        print("Found URLs:", json.dumps(list(set(urls))))
    else:
        print("No JS bundle found.")
except Exception as e:
    print("Error:", e)
