import urllib.request, re
try:
    html = urllib.request.urlopen('https://frontend-nu-ivory-0w37cbce0a.vercel.app/').read().decode('utf-8')
    match = re.search(r'assets/index-[a-zA-Z0-9_-]+\.js', html)
    if match:
        js_url = 'https://frontend-nu-ivory-0w37cbce0a.vercel.app/' + match.group(0)
        js = urllib.request.urlopen(js_url).read().decode('utf-8')
        print('Is onrender in JS?', 'onrender' in js)
        print('Is localhost in JS?', 'localhost' in js)
        urls = re.findall(r'"(http[^"]+)"', js)
        print("HTTP URLs found:")
        for u in set(urls):
            if len(u) < 100:
                print(f" - {u}")
    else:
        print("Could not find JS bundle")
except Exception as e:
    print(f"Error: {e}")
