import urllib.request, re, json
try:
    html = urllib.request.urlopen('https://frontend-rf0lem9nd-aihealth.vercel.app/').read().decode('utf-8')
    match = re.search(r'assets/index-[a-zA-Z0-9_-]+\.js', html)
    if match:
        js_url = 'https://frontend-rf0lem9nd-aihealth.vercel.app/' + match.group(0)
        js = urllib.request.urlopen(js_url).read().decode('utf-8')
        urls = [s for s in js.split('"') if 'http' in s or 'api' in s]
        print('Found interesting strings in JS:')
        for u in set(urls):
            if len(u) < 100:  # ignore long chunks
                print(f" - {u}")
    else:
        print("Could not find JS bundle")
except Exception as e:
    print(f"Error: {e}")
