import json,base64,re,os,io,subprocess,shutil,hashlib
def H(b):return hashlib.md5(b).hexdigest()[:8]
PRE=[]
from fontTools import subset
from fontTools.ttLib import TTFont
import pathlib
HERE=pathlib.Path(__file__).resolve().parent
os.chdir(HERE)
D='src/'; OUT='../'
body=open(D+'body.html',encoding='utf-8').read()
css=open(D+'style.css',encoding='utf-8').read()
app=open(D+'app.js',encoding='utf-8').read()
book=open(D+'booking.html',encoding='utf-8').read()
cities=open(D+'cities.js',encoding='utf-8').read()
bins=json.load(open(D+'bins.json'))
SPK='<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 104 67" aria-hidden="true"><path d="M50 0C58 31 97 28 100 31.5C97 35 58 32 50 63C42 32 3 35 0 31.5C3 28 42 31 50 0Z" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>'
body=body.replace('__BOOKING__',book).replace('__ABOUT__',open(D+'about.html',encoding='utf-8').read()).replace('__PRIVACY__',open(D+'privacy.html',encoding='utf-8').read()).replace('__SPK__',SPK)
app=app.replace('__CITIES__',cities)
# ---- fonts
text=body+app+css
chars=set(text)|set('0123456789０１２３４５６７８９：／，。、！？「」『』（）・—…％＋－＝')
zh=''.join(sorted(c for c in chars if ord(c)>=0x20))
FD='../../網站設計稿/2_拆分物件/字體/'
faces=[]
def sub(src,txt,unicodes=None):
    opt=subset.Options(); opt.flavor='woff2'; opt.layout_features=['*']; opt.name_IDs=['*']; opt.notdef_outline=True
    f=TTFont(src); s=subset.Subsetter(opt)
    if unicodes: s.populate(unicodes=unicodes)
    else: s.populate(text=txt)
    s.subset(f); b=io.BytesIO(); f.flavor='woff2'; f.save(b); return b.getvalue()
sizes={}
for w,n in [(400,'R'),(500,'M'),(700,'B'),(900,'H')]:
    data=sub(FD+f'GenSenRounded2TW-{n}.otf',zh); sizes['GenSen'+n]=len(data)
    fn=f'font-zh-{w}.woff2';open(OUT+fn,'wb').write(data);u=f'{fn}?v={H(data)}'
    if w in (400,700):PRE.append(f'<link rel="preload" href="{u}" as="font" type="font/woff2" crossorigin>')
    faces.append(f'@font-face{{font-family:"GenSen";font-weight:{w};font-display:block;src:url({u}) format("woff2")}}')
NB='fonts/'
def bfn(w,data):
    fn=f'font-baloo-{w}.woff2';open(OUT+fn,'wb').write(data);return f'{fn}?v={H(data)}'
for w in (500,600,700,800):
    data=open(NB+f'baloo-bhaijaan-2-latin-{w}-normal.woff2','rb').read(); sizes[f'Baloo{w}']=len(data)
    faces.append(f'@font-face{{font-family:"Baloo";font-weight:{w};font-display:swap;ascent-override:88%;descent-override:12%;line-gap-override:0%;src:url({bfn(w,data)}) format("woff2");unicode-range:U+0000-00FF,U+2013,U+2018-201E}}')
glyphs='☽☿♀♂♃♄♅♆♇♈♉♊♋♌♍♎♏♐♑♒♓'
d1=sub(NB+'noto-sans-symbols-symbols-400-normal.woff2',None,[ord(c) for c in glyphs])
d2=sub(NB+'noto-sans-symbols-2-symbols-400-normal.woff2',None,[0x2609])
sizes['sym']=len(d1)+len(d2)
faces.append(f'@font-face{{font-family:"AstroSym";src:url(data:font/woff2;base64,{base64.b64encode(d1).decode()}) format("woff2");unicode-range:U+263D-2653}}')
faces.append(f'@font-face{{font-family:"AstroSym";src:url(data:font/woff2;base64,{base64.b64encode(d2).decode()}) format("woff2");unicode-range:U+2609}}')
spkurl='url("data:image/svg+xml;utf8,'+SPK.replace('currentColor','black').replace(' aria-hidden="true"','').replace('"',"'").replace('<','%3C').replace('>','%3E')+'")'
css='\n'.join(faces)+'\n:root{--spk:'+spkurl+'}\n'+css
swe=open(D+'lib_swe.js',encoding='utf-8').read(); tz=open(D+'lib_tz.js',encoding='utf-8').read()
b0=base64.b64decode(bins[0]);b1=base64.b64decode(bins[1])
open(OUT+'swisseph.wasm','wb').write(b0);open(OUT+'swisseph.data','wb').write(b1)
V=H(b0+b1);app=app.replace('__V__',V)
open(OUT+'swe-local.js','w').write('window.__SWEB=["'+bins[0]+'","'+bins[1]+'"];')
PRE.append(f'<link rel="preload" href="swisseph.data?v={V}" as="fetch" crossorigin>')
PRE.append(f'<link rel="preload" href="swisseph.wasm?v={V}" as="fetch" crossorigin>')
fbjs=open(D+'fb.js','rb').read();open(OUT+'fb.js','wb').write(fbjs);app=app.replace('__FBV__',H(fbjs))
lib=swe+'\n;\n'+tz;LV=H(lib.encode());open(OUT+'lib.js','w',encoding='utf-8').write(lib)
for x in (swe,tz,app): assert '</script' not in x
html=f'''<!doctype html>
<html lang="zh-Hant"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,viewport-fit=cover">
<meta name="format-detection" content="telephone=no,date=no,address=no">
<title>翠脆的心｜星盤查詢與占星卡牌</title>
<meta name="description" content="免費線上星盤查詢：輸入出生資料，看行星落入的星座、宮位、相位與古典尊貴，並對照翠脆的心占星卡牌。">
<link rel="icon" type="image/png" sizes="32x32" href="favicon-32.png">
<link rel="icon" type="image/png" sizes="48x48" href="favicon-48.png">
<link rel="apple-touch-icon" sizes="180x180" href="apple-touch-icon.png">
<link rel="manifest" href="manifest.webmanifest">
<meta name="apple-mobile-web-app-title" content="翠脆的心">
<meta name="application-name" content="翠脆的心">
<meta name="theme-color" content="#337099">
{chr(10).join(PRE)}
<style>
{css}
</style></head><body data-view="chart">
{body}
<script src="lib.js?v={LV}"></script>
<script>{app}</script>
</body></html>'''
open(OUT+'index.html','w',encoding='utf-8').write(html)
json.dump({"name":"翠脆的心・星盤查詢與占星卡牌","short_name":"翠脆的心","start_url":"./","display":"standalone","background_color":"#fefbf4","theme_color":"#337099","icons":[{"src":"icon-192.png","sizes":"192x192","type":"image/png"},{"src":"icon-512.png","sizes":"512x512","type":"image/png"}]},open(OUT+'manifest.webmanifest','w',encoding='utf-8'),ensure_ascii=False,indent=1)
print(sizes); print('html',os.path.getsize(OUT+'index.html'),'chars',len(zh))
