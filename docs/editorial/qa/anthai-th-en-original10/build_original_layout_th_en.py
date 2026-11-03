import fitz, json, sys, os, io, html
import numpy as np
from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
ROOT=Path(r'D:\AgentWorkspaces\anthai-th-en-original-overlay-20261103')
sys.path.insert(0,str(ROOT/'_deps'))
import cv2
SOURCE=Path(r'D:\AgentWorkspaces\anthai-th-en-line-qa-20261103\assets\downloads\an-thai-engineering-brochure-cn-en.pdf')
specs=json.loads((ROOT/'thai_regions.json').read_text(encoding='utf-8'))
specs.update(json.loads((ROOT/'thai_more.json').read_text(encoding='utf-8')))
base=fitz.open(SOURCE)
doc=fitz.open()
archive=fitz.Archive(r'C:\Windows\Fonts')
css='@font-face{font-family:ThaiUI;src:url(LEELAWDB.TTF)} div{font-family:ThaiUI;line-height:1.07;margin:0;padding:0;font-weight:700}'
info=[]
for i,op in enumerate(base):
 pgnum=i+1
 if str(pgnum) not in specs: continue
 regs=specs[str(pgnum)]
 s=2.0
 pix=op.get_pixmap(matrix=fitz.Matrix(s,s),alpha=False)
 source=np.frombuffer(pix.samples,np.uint8).reshape(pix.height,pix.width,pix.n).copy()
 assert pix.n==3
 cleaned=source.copy()
 for x0,y0,x1,y1,txt,color,font in regs:
  a=max(0,int(x0/565*pix.width));b=max(0,int(y0/800*pix.height))
  c=min(pix.width,int(x1/565*pix.width));d=min(pix.height,int(y1/800*pix.height))
  roi=source[b:d,a:c]
  if not roi.size:continue
  lum=0.2126*roi[:,:,0]+0.7152*roi[:,:,1]+0.0722*roi[:,:,2]
  if color=='onblue':
   bg_pixels=roi[lum<139]
  else:
   bg_pixels=roi[lum>192]
  if len(bg_pixels)<100:
   edge=np.concatenate([source[max(0,b-8):b,a:c].reshape(-1,3),source[d:min(pix.height,d+8),a:c].reshape(-1,3)])
   bg_pixels=edge
  if len(bg_pixels)>0:
   bg_color=np.median(bg_pixels,axis=0).astype(np.uint8)
   cleaned[b:d,a:c]=bg_color
  else: print('NO_BACKGROUND',pgnum,(x0,y0,x1,y1))
 # Replaces obsolete (old personal mail/Chinese number/WeChat QR) on the
 # ORIGINAL ten-page contact panel. The office photo and English branding stay.
 if pgnum==10:
  sx=pix.width/565;sy=pix.height/800
  def field(x0,y0,x1,y1,col):
   cleaned[int(y0*sy):int(y1*sy),int(x0*sx):int(x1*sx)]=col
  field(276,588,398,708,[247,250,252])
  field(394,617,432,660,[15,128,72])
  field(394,660,435,677,[247,250,252])
 # Tight local color-matched rectangle retouch; original images are never redrawn.
 im=Image.fromarray(cleaned,'RGB')
 buf=io.BytesIO(); im.save(buf,format='JPEG',quality=86,subsampling=2,optimize=True)
 p=doc.new_page(width=op.rect.width,height=op.rect.height)
 p.insert_image(p.rect,stream=buf.getvalue())
 qa=Image.fromarray(source,'RGB').convert('RGBA')
 layer=Image.new('RGBA',qa.size,(0,0,0,0));dr=ImageDraw.Draw(layer)
 for x0,y0,x1,y1,txt,color,font in regs:
  scaleX=pix.width/565;scaleY=pix.height/800
  dr.rectangle((x0*scaleX,y0*scaleY,x1*scaleX,y1*scaleY),outline=(248,20,25,220),width=3)
 qa=Image.alpha_composite(qa,layer)
 qa.convert('RGB').resize((565,800)).save(ROOT/(f'mask_{pgnum:02d}.jpg'),quality=92)
 for x0,y0,x1,y1,txt,color,font in regs:
  r=fitz.Rect(x0/565*p.rect.width,y0/800*p.rect.height,x1/565*p.rect.width,y1/800*p.rect.height)
  r=fitz.Rect(r.x0+1,r.y0+0.2,r.x1-0.5,r.y1-0.3)
  ink='#ffffff' if color=='onblue' else '#153750'
  tag='<div style="font-size:'+str(font)+'pt;color:'+ink+';">'+html.escape(txt)+'</div>'
  blank,shrink=p.insert_htmlbox(r,tag,css=css,archive=archive,scale_low=.40,overlay=True)
  info.append(dict(page=pgnum,region=[x0,y0,x1,y1],text=txt,scale=round(float(shrink),2),blank=round(float(blank),2)))
  if blank<-.01:print('OVERFLOW',pgnum,x0,y0,txt,blank)
 if pgnum==10:
  # Text remains live/selectable in PDF. Printed brochure retains source layout.
  contact=[
   (593,613,'+66 90 292 1749',9.4),
   (620,642,'anthaicheng@gmail.com',8.2),
   (649,672,'LINE ID: rachada2018',8.6),
   (683,703,'Bangkok, Thailand',8.3)
  ]
  for y0,y1,value,size in contact:
   rr=fitz.Rect(279/565*p.rect.width,y0/800*p.rect.height,396/565*p.rect.width,y1/800*p.rect.height)
   p.insert_htmlbox(rr,'<div style="font-size:'+str(size)+'pt;color:#17384c;font-weight:bold">'+html.escape(value)+'</div>',css=css,archive=archive,scale_low=.55)
  linebox=fitz.Rect(394/565*p.rect.width,624/800*p.rect.height,432/565*p.rect.width,655/800*p.rect.height)
  p.insert_htmlbox(linebox,'<div style="font-size:12pt;color:#ffffff;text-align:center;font-weight:bold">LINE</div>',css=css,archive=archive,scale_low=.75)
  p.insert_link({'kind':fitz.LINK_URI,'from':fitz.Rect(274/565*p.rect.width,616/800*p.rect.height,394/565*p.rect.width,646/800*p.rect.height),'uri':'mailto:anthaicheng@gmail.com'})
  p.insert_link({'kind':fitz.LINK_URI,'from':fitz.Rect(274/565*p.rect.width,646/800*p.rect.height,435/565*p.rect.width,676/800*p.rect.height),'uri':'https://line.me/ti/p/~rachada2018'})
 p.get_pixmap(matrix=fitz.Matrix(565/p.rect.width,800/p.rect.height),alpha=False).save(ROOT/f'final_preview_{pgnum:02d}.png')
print('BUILT',len(doc),'REGIONS',len(info),'OUTPUT_BYTES_SO_FAR',sum(x['scale']<.7 for x in info),'LOW_SCALE')
(ROOT/'region_review.json').write_text(json.dumps(info,ensure_ascii=False,indent=2),encoding='utf-8')
doc.save(ROOT/'AN-THAI_Brochure_TH-EN_Original_10pages_QA.pdf',garbage=4,deflate=True)
