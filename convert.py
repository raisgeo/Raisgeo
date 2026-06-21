import xml.etree.ElementTree as ET
import os, re
from datetime import datetime

xml_file = next(f for f in os.listdir('wordpress-xml') if f.endswith('.xml'))
tree = ET.parse(f'wordpress-xml/{xml_file}')
root = tree.getroot()

ns = {'content': 'http://purl.org/rss/1.0/modules/content/',
      'wp': 'http://wordpress.org/export/1.2/'}

os.makedirs('content/posts', exist_ok=True)

count = 0
for item in root.findall('.//item'):
    post_type = item.find('wp:post_type', ns)
    status = item.find('wp:status', ns)
    if post_type is None or post_type.text != 'post': continue
    if status is None or status.text != 'publish': continue

    title = item.findtext('title', '').strip()
    date_str = item.findtext('wp:post_date', '', ns)
    content = item.findtext('content:encoded', '', ns)
    slug = item.findtext('wp:post_name', '', ns)

    try:
        date = datetime.strptime(date_str, '%Y-%m-%d %H:%M:%S')
        date_fmt = date.strftime('%Y-%m-%dT%H:%M:%S+07:00')
    except:
        date_fmt = '2020-01-01T00:00:00+07:00'

    if not slug:
        slug = re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-')

    filename = f'content/posts/{slug}.md'
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(f'---\n')
        f.write(f'title: "{title.replace(chr(34), chr(39))}"\n')
        f.write(f'date: {date_fmt}\n')
        f.write(f'draft: false\n')
        f.write(f'---\n\n')
        f.write(content)
    count += 1
    print(f'OK: {title[:50]}')

print(f'\nSelesai! {count} artikel berhasil dikonversi.')
[markup]
  [markup.goldmark]
    [markup.goldmark.renderer]
      unsafe = true