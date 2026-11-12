"""Local bilingual text repairs on the original ten-page brochure.

Original scanned pages and photographs are retained without JPEG recompression.
Text masks and text boxes are separate. All coordinates use the original
565x800 editorial grid. No font files are distributed.
Run: python build.py --output-dir /tmp/anthai-release
"""
import argparse, html, json, tempfile, hashlib, ctypes, re
from pathlib import Path
import fitz

HERE=Path(__file__).resolve().parent
REPO=HERE.parents[4]
ap=argparse.ArgumentParser();ap.add_argument('--output-dir',type=Path,required=True);args=ap.parse_args()
OUT=args.output_dir;OUT.mkdir(parents=True,exist_ok=True)
SOURCE=REPO/'assets/downloads/an-thai-engineering-brochure-cn-en.pdf'
OLD=REPO/'assets/downloads/an-thai-engineering-brochure-th-en-original10-REVIEW.pdf'
src=fitz.open(SOURCE);doc=fitz.open();doc.insert_pdf(src)
temp=tempfile.TemporaryDirectory();fontpath=Path(temp.name)/'thai.ttf'
with fitz.open(OLD) as old:fontpath.write_bytes(old.extract_font(old[0].get_fonts(full=True)[0][0])[3])
archive=fitz.Archive(temp.name)
CSS='@font-face{font-family:Thai;src:url(thai.ttf)} *{margin:0;padding:0} body{font-family:Thai;line-height:1.18} .en{font-family:sans-serif;line-height:1.14} .th{font-family:Thai;line-height:1.2}'
WHITE=(.974,.986,.992);BLUE=(.035,.26,.47);INK='#153750'
# libthai dictionary segmentation supplies legal line-break opportunities.
thai_lib=ctypes.CDLL('libthai.so.0')
thai_lib.th_brk.argtypes=[ctypes.c_char_p,ctypes.POINTER(ctypes.c_int),ctypes.c_size_t]
thai_lib.th_brk.restype=ctypes.c_int
def thai_breaks(value):
 def segment(match):
  word=match.group(0);raw=word.encode('tis-620');positions=(ctypes.c_int*(len(raw)+1))()
  count=thai_lib.th_brk(raw,positions,len(raw)+1);cuts=set(positions[:count])
  return ''.join(('\u200b' if i in cuts else '')+c for i,c in enumerate(word))
 return re.sub(r'[\u0e00-\u0e7f]+',segment,value)
records=[]
def rect(v,p):return fitz.Rect(v[0]/565*p.rect.width,v[1]/800*p.rect.height,v[2]/565*p.rect.width,v[3]/800*p.rect.height)
def mask(n,b,color=WHITE):
 p=doc[n-1];p.draw_rect(rect(b,p),color=None,fill=color,overlay=True)
def text(n,b,th='',en='',size=8,fg=INK,align='left',name=''):
 p=doc[n-1];body=f'<div style="font-size:{size}pt;color:{fg};text-align:{align}">'
 if en:body+='<div class="en">'+html.escape(en).replace('\n','<br>')+'</div>'
 if th:body+='<div class="th">'+html.escape(thai_breaks(th)).replace('\n','<br>')+'</div>'
 body+='</div>'
 spare,scale=p.insert_htmlbox(rect(b,p),body,css=CSS,archive=archive,scale_low=1)
 records.append(dict(page=n,box=b,thai=th,english=en,size=size,spare=spare,scale=scale,name=name))
 if spare<0:print('OVERFLOW',n,b,th,en)
def label(n,b,th,en='',size=7,color=WHITE,fg=INK,align='left'):
 mask(n,b,color);text(n,[b[0]+1,b[1]+.5,b[2]-1,b[3]-.3],th,en,size,fg,align)
def title(n,b,th,size=15):label(n,b,th,size=size,color=BLUE,fg='white')
def rows(n,x,y,w,items,step=25,size=7.4):
 for k,(en,th) in enumerate(items):text(n,[x,y+k*step,x+w,y+(k+1)*step-1],th,en,size)
def head(n,b):label(n,b,'งานทดสอบและตรวจสอบทางวิศวกรรม',size=8)
def footer(n,b,th='ทดสอบเสาเข็ม · สำรวจธรณีเทคนิค · ทดสอบวัสดุ · ตรวจสอบโครงสร้าง'):
 label(n,b,th,size=7,align='center')

# 1 - cover. All photographs and English remain untouched.
head(1,[150,131,379,154]);footer(1,[159,754,397,775])

# 2 - About; preserve the original upper English paragraph and restore Thai.
head(2,[112,94,295,113]);title(2,[30,175,158,207],'เกี่ยวกับ AN-THAI',16)
label(2,[29,316,280,376],
 'AN-THAI เป็นบริษัททดสอบและตรวจสอบทางวิศวกรรมในประเทศไทย โดยผสานความเชี่ยวชาญด้านเสาเข็มของไทย ประสบการณ์งานทดสอบจากจีน และบุคลากรวิชาชีพในท้องถิ่น ให้บริการทางเทคนิคตั้งแต่งานฐานรากถึงโครงสร้าง',size=8.5)
label(2,[30,414,171,435],'ความสามารถหลักของเรา',size=10)
# Each capability occupies its existing text area beside the retained icon.
for b,en,th,detail,td in [
 ([78,443,212,516],'Thailand-based delivery','ให้บริการในประเทศไทย','Local teams, local knowledge,\nresponsive service.','ทีมงานในพื้นที่ เข้าใจท้องถิ่น\nและตอบสนองรวดเร็ว'),
 ([272,443,406,516],'Foundation to structure','ตั้งแต่ฐานรากถึงโครงสร้าง','Comprehensive testing and inspection\nacross the entire construction cycle.','งานทดสอบและตรวจสอบครอบคลุม\nตลอดวงจรการก่อสร้าง'),
 ([78,529,213,601],'Partner laboratory network','เครือข่ายห้องปฏิบัติการพันธมิตร','Collaborate with reputable local\nuniversities and laboratories.','ร่วมมือกับมหาวิทยาลัยและ\nห้องปฏิบัติการในท้องถิ่น'),
 ([272,529,420,601],'Bilingual technical coordination','ประสานงานเทคนิคสองภาษา','Clear communication bridging\ninternational and local stakeholders.','สื่อสารระหว่างผู้เกี่ยวข้อง\nในประเทศและต่างประเทศ')]:
 mask(2,b);text(2,[b[0],b[1],b[2],b[1]+28],th,en,8);text(2,[b[0],b[1]+30,b[2],b[3]],td,detail,7.2)
mask(2,[79,619,357,681]);text(2,[80,620,355,649],en='An-Thai works closely with local universities, accredited laboratories and experienced engineering specialists to continuously enhance our technical capability and deliver reliable, high-quality results for our clients.',size=8)
text(2,[80,650,355,685],th='AN-THAI ร่วมมือกับมหาวิทยาลัย ห้องปฏิบัติการที่ได้รับการรับรอง และผู้เชี่ยวชาญด้านวิศวกรรม เพื่อพัฒนาความสามารถทางเทคนิคและส่งมอบผลการทดสอบที่เชื่อถือได้และมีคุณภาพ',size=7.5)
head(2,[210,770,390,788])

# 3 - existing schematic: localized bilingual labels, no new illustration.
head(3,[115,87,295,105]);title(3,[35,152,210,177],'จากฐานรากสู่โครงสร้าง',16)
title(3,[35,202,294,220],'งานทดสอบทางวิศวกรรมครบวงจรตลอดโครงการ',9)
for b,en,th in [
 ([51,247,112,282],'Geotechnical\nInvestigation','สำรวจธรณีเทคนิค'),
 ([174,271,244,297],'Plate Load Test','ทดสอบแผ่นรับน้ำหนัก'),
 ([345,237,415,267],'Material Testing','ทดสอบวัสดุ'),
 ([473,244,559,276],'Structural Inspection','ตรวจสอบโครงสร้าง')]:label(3,b,th,en,6.9)
for b,en,th in [
 ([10,361,65,383],'GROUND LEVEL','ระดับผิวดิน'),([10,391,63,413],'FILL','ดินถม'),
 ([10,423,64,449],'SOFT SOIL','ดินอ่อน'),([10,456,63,480],'SAND','ทราย'),
 ([10,495,66,520],'STIFF CLAY','ดินเหนียวแข็ง'),([10,544,71,577],'WEATHERED ROCK','หินผุ'),
 ([10,611,67,638],'BEDROCK','ชั้นหิน')]:label(3,b,th,en,6.8,color=(.16,.20,.23),fg='white')
for b,en,th in [
 ([150,436,228,465],'Static Load Test','ทดสอบรับน้ำหนักสถิต'),
 ([151,497,231,530],'High-Strain Dynamic Test','ทดสอบพลศาสตร์'),
 ([151,562,238,595],'Low-Strain Integrity Test','ตรวจความสมบูรณ์เสาเข็ม'),
 ([355,529,414,559],'CSL','ทดสอบคลื่นเสียง CSL'),
 ([317,350,354,376],'Column','เสา'),([335,391,385,416],'Pile Cap','ฐานหัวเสาเข็ม'),
 ([343,472,422,500],'Pile Foundation','ฐานรากเสาเข็ม')]:label(3,b,th,en,6.8)
label(3,[439,362,563,394],'ขั้นตอนบริการ','Core Service Logic',9)
for y,en,th,ed,td in [
 (403,'Investigate','สำรวจ','Understand ground conditions','เข้าใจสภาพชั้นดิน'),
 (461,'Test','ทดสอบ','Apply professional testing methods','ใช้วิธีทดสอบที่เหมาะสม'),
 (519,'Evaluate','ประเมิน','Analyze results for engineering safety','วิเคราะห์เพื่อความปลอดภัย'),
 (577,'Report','รายงาน','Deliver clear and reliable conclusions','สรุปผลอย่างชัดเจนและเชื่อถือได้')]:
 mask(3,[486,y,560,y+56]);text(3,[488,y+1,559,y+25],th,en,7.5);text(3,[488,y+26,559,y+58],td,ed,6.5)
footer(3,[108,761,366,781])

# 4 - static load, original three-column layout.
head(4,[35,56,178,76]);title(4,[20,204,181,234],'ทดสอบรับน้ำหนักสถิต',15)
label(4,[23,455,145,470],'แม่แรงไฮดรอลิกและไดอัลเกจ',size=7,color=BLUE,fg='white')
label(4,[414,455,556,472],'ระบบรับแรงปฏิกิริยา',size=7,color=BLUE,fg='white')
for b,en,th in [([61,485,170,508],'PURPOSE','วัตถุประสงค์'),([238,485,378,508],'TYPICAL WORKFLOW','ขั้นตอนทดสอบ'),([432,485,558,508],'OUTPUTS','ผลการทดสอบ')]:label(4,b,th,en,8)
mask(4,[36,518,190,624]);rows(4,38,520,150,[('Determine pile bearing capacity and verify design performance','ประเมินกำลังรับน้ำหนักเสาเข็มและตรวจสอบสมรรถนะตามการออกแบบ'),('Evaluate load-settlement performance','ประเมินความสัมพันธ์ระหว่างน้ำหนักบรรทุกกับการทรุดตัว')],51,7.5)
mask(4,[245,516,382,623]);rows(4,247,518,133,[('Reaction system setup','ติดตั้งระบบรับแรงปฏิกิริยา'),('Apply staged loading','เพิ่มน้ำหนักบรรทุกเป็นขั้น'),('Measure settlement','วัดการทรุดตัว'),('Interpret results','วิเคราะห์และแปลผล')],26,7.5)
mask(4,[433,519,558,624]);rows(4,435,520,121,[('Load-settlement curve','กราฟน้ำหนักบรรทุกกับการทรุดตัว'),('Allowable capacity recommendation','ข้อเสนอแนะกำลังรับน้ำหนักที่ยอมให้'),('Comprehensive test report','รายงานผลการทดสอบฉบับสมบูรณ์')],34,7.6)
label(4,[79,651,493,671],'เหมาะสำหรับแรงกด แรงดึง หรือแรงด้านข้าง ตามข้อกำหนดของโครงการ',size=8)

# 5 - high-strain. Four outputs restored, stress distinguished from integrity.
head(5,[120,84,290,104]);title(5,[300,143,480,168],'ทดสอบพลศาสตร์ (High-Strain)',13)
label(5,[165,272,260,286],'ตุ้มน้ำหนักกระแทกหัวเสาเข็ม',size=6.6,color=BLUE,fg='white')
label(5,[352,235,438,260],'ระบบทดสอบเคลื่อนย้ายได้\nและยืดหยุ่น',size=7,color=(.31,.53,.67),fg='white')
label(5,[500,262,562,284],'เหมาะกับสภาพ\nพื้นที่หลากหลาย',size=6.8,color=(.35,.45,.51),fg='white')
label(5,[178,444,282,460],'ติดตั้งเครื่องวัดแรงและความเร็ว',size=7)
label(5,[475,445,557,468],'อุปกรณ์ที่เชื่อถือได้\nผลทดสอบที่เชื่อถือได้',size=7,color=(.44,.48,.51),fg='white')
label(5,[201,483,304,501],'ขั้นตอนทดสอบ 5 ขั้นตอน',size=8)
for b,en,th in [
 ([31,543,120,572],'IMPACT LOADING','กระแทกหัวเสาเข็ม'),
 ([133,543,225,574],'FORCE & VELOCITY\nMEASUREMENT','วัดแรงและความเร็ว'),
 ([240,543,330,571],'SIGNAL ACQUISITION','เก็บข้อมูลสัญญาณ'),
 ([346,543,435,572],'WAVE EQUATION\nANALYSIS','วิเคราะห์ด้วยสมการคลื่น'),
 ([446,543,555,572],'CAPACITY & INTEGRITY\nASSESSMENT','ประเมินกำลังและความสมบูรณ์')]:label(5,b,th,en,6.9,align='center')
for b,en,th in [([67,627,182,647],'PURPOSE','วัตถุประสงค์'),([233,627,382,647],'TYPICAL OUTPUTS','ผลการทดสอบ'),([441,627,557,647],'ADVANTAGES','ข้อดี')]:label(5,b,th,en,8)
mask(5,[73,648,187,728]);rows(5,74,648,112,[('Evaluate pile capacity','ประเมินกำลังรับน้ำหนัก'),('Assess driving stress','ประเมินความเค้นขณะตอก'),('Verify pile integrity','ตรวจความสมบูรณ์เสาเข็ม')],26,7.1)
mask(5,[246,648,380,732]);rows(5,247,648,131,[('Force-velocity traces','กราฟแรงและความเร็ว'),('Dynamic analysis results','ผลวิเคราะห์พลศาสตร์'),('Integrity assessment','ประเมินความสมบูรณ์'),('Professional report','รายงานผลการทดสอบ')],20.5,7.1)
mask(5,[432,648,555,727]);rows(5,433,648,120,[('Rapid testing','ทดสอบได้รวดเร็ว'),('Immediate results','ผลทดสอบทันเวลา'),('Efficient quality control','ควบคุมคุณภาพอย่างมีประสิทธิภาพ')],26,7.1)
footer(5,[270,770,539,788],'สำรวจธรณีเทคนิค · ทดสอบวัสดุ · ตรวจสอบโครงสร้าง')

# 6 - low-strain schematic and original lower three columns.
head(6,[95,72,246,89]);title(6,[33,141,273,173],'ตรวจความสมบูรณ์เสาเข็ม (Low-Strain)',13)
label(6,[271,377,347,394],'หลักการทดสอบ',size=8)
label(6,[270,395,350,418],'เคาะด้วยค้อนขนาดเล็ก','Small Hammer Impact',6.8)
label(6,[385,393,469,407],'เซนเซอร์วัดความเร่ง',size=7)
label(6,[481,445,555,459],'เก็บข้อมูลสัญญาณ',size=7)
label(6,[286,479,355,500],'คลื่นความเค้นลงสู่ปลาย',size=6.7)
label(6,[411,479,547,498],'คลื่นสะท้อนจากปลายเสาเข็มหรือข้อบกพร่อง',size=6.7)
for b,en,th in [([80,539,185,570],'PURPOSE','วัตถุประสงค์'),([245,539,374,570],'TYPICAL WORKFLOW','ขั้นตอนทดสอบ'),([435,539,559,570],'TYPICAL OUTPUTS','ผลการทดสอบ')]:label(6,b,th,en,8.5)
mask(6,[39,580,191,681]);text(6,[40,581,190,681],th='ตรวจคัดกรองความสมบูรณ์ของเสาเข็มและค้นหาข้อบกพร่องขนาดใหญ่ เช่น โพรง การคอดของหน้าตัด หรือความไม่ต่อเนื่องของวัสดุ',en='Rapid screening of pile integrity and detection of major defects (e.g. obvious voids, necking, material discontinuity).',size=7.5)
mask(6,[248,581,374,699]);rows(6,249,582,123,[('Pile head preparation','เตรียมหัวเสาเข็ม'),('Light hammer impact','เคาะด้วยค้อนเบา ๆ'),('Signal collection','เก็บข้อมูลสัญญาณ'),('Interpretation of results','วิเคราะห์และแปลผล')],25,7.5)
mask(6,[427,580,555,699]);rows(6,428,582,125,[('Reflected wave traces','กราฟคลื่นสะท้อน'),('Anomaly indication','ระบุตำแหน่งผิดปกติ'),('Integrity evaluation','ประเมินความสมบูรณ์'),('Test report','รายงานผลการทดสอบ')],25,7.5)
label(6,[71,741,249,759],'ไม่ทำลายเสาเข็ม มีประสิทธิภาพ และเหมาะกับการควบคุมคุณภาพ',size=7)

# 7 - CSL. Preserve four numbered steps and four outputs.
head(7,[137,94,344,115]);title(7,[34,168,189,194],'ทดสอบคลื่นเสียง CSL',14)
for b,en,th in [
 ([24,211,103,241],'CSL DATA LOGGER','เครื่องบันทึกข้อมูล'),
 ([33,299,112,347],'ACCESS TUBE\n(Pre-installed)','ท่อทดสอบที่ติดตั้งไว้ก่อน'),
 ([43,413,113,438],'TRANSMITTER','หัวส่งสัญญาณ'),
 ([239,413,295,438],'RECEIVER','หัวรับสัญญาณ'),
 ([234,482,296,517],'CONCRETE\nBORED PILE','คอนกรีตเสาเข็มเจาะ'),
 ([132,550,223,576],'WATER-FILLED TUBES','ท่อทดสอบที่เติมน้ำ')]:label(7,b,th,en,7)
label(7,[27,585,197,603],'ตัวอย่างผลการทดสอบ CSL','TYPICAL CSL RESULT',7)
label(7,[133,634,207,663],'บริเวณที่อาจมีข้อบกพร่อง','Anomaly Zone',6.8)
label(7,[188,672,274,702],'ภาพแสดงผลแปลความหมาย','Interpreted Profile',6.5)
for b,en,th in [([337,276,546,301],'PURPOSE','วัตถุประสงค์'),([336,372,550,394],'TYPICAL WORKFLOW','ขั้นตอนทดสอบ'),([336,514,552,537],'TYPICAL OUTPUTS','ผลการทดสอบ')]:label(7,b,th,en,8)
mask(7,[348,302,550,354]);text(7,[350,303,548,354],th='ประเมินคุณภาพภายในเสาเข็มเจาะและตรวจหาข้อบกพร่อง เช่น โพรง หน้าตัดคอด สิ่งแทรก หรือความไม่ต่อเนื่อง',en='Evaluate the internal quality of bored piles and detect major defects such as voids, necking, inclusions or discontinuities.',size=8)
mask(7,[363,394,553,502]);rows(7,364,395,187,[('Pre-installed access tubes in bored piles.','ติดตั้งท่อทดสอบในเสาเข็มก่อนเทคอนกรีต'),('Lower transmitter and receiver probes in water-filled tubes.','หย่อนหัวส่งและหัวรับลงในท่อที่เติมน้ำ'),('Transmit ultrasonic signals across the pile.','ส่งคลื่นอัลตราโซนิกผ่านคอนกรีตระหว่างท่อ'),('Interpret data to evaluate pile integrity.','วิเคราะห์ข้อมูลเพื่อประเมินความสมบูรณ์')],26.5,7.2)
mask(7,[347,538,554,629]);rows(7,348,539,203,[('Profile curves (travel time, signal strength)','กราฟเวลาเดินทางและความแรงสัญญาณตามความลึก'),('Identification of anomaly zones','ระบุบริเวณสัญญาณผิดปกติ'),('Integrity assessment','ประเมินความสมบูรณ์ของเสาเข็ม'),('Technical report with interpretation and conclusions','รายงานทางเทคนิคพร้อมการแปลผลและข้อสรุป')],22,7.2)
label(7,[337,659,549,677],'เหมาะกับเสาเข็มเจาะหล่อในที่ซึ่งติดตั้งท่อทดสอบ',size=7.5)
footer(7,[161,769,431,789])

# 8 - plate load / geotechnical field testing, original lower two-column layout.
head(8,[97,62,233,79]);title(8,[20,201,219,249],'ทดสอบแผ่นรับน้ำหนัก\nและงานธรณีเทคนิคภาคสนาม',13)
label(8,[24,420,179,434],'แม่แรงและไดอัลเกจวัดการทรุดตัว',size=7,color=BLUE,fg='white')
label(8,[243,420,367,434],'การทดสอบภาคสนาม',size=7,color=BLUE,fg='white')
label(8,[416,420,555,434],'ปั๊มไฮดรอลิกและเกจวัด',size=7,color=BLUE,fg='white')
label(8,[27,458,202,470],'แผนผังการทดสอบแผ่นรับน้ำหนัก',size=7,color=BLUE,fg='white')
label(8,[131,476,236,510],'ระบบรับแรงปฏิกิริยา\n(บล็อกคอนกรีต/คานเหล็ก)','Reaction system\n(Concrete blocks / Steel beam)',6.6)
label(8,[17,589,82,624],'ไดอัลเกจวัดการทรุดตัว','Settlement gauge\n(Dial gauge)',6.5)
label(8,[179,573,237,598],'แม่แรงไฮดรอลิก','Hydraulic jack',6.7)
label(8,[84,641,155,668],'แผ่นรับน้ำหนักทดสอบ','Loading plate\n(Steel plate)',6.6)
label(8,[185,649,263,678],'ดินฐานราก/ชั้นดินรองรับ','Ground / Subgrade',6.5)
for b,en,th in [([319,439,550,460],'PURPOSE','วัตถุประสงค์'),([319,490,553,512],'TYPICAL WORKFLOW','ขั้นตอนทดสอบ'),([319,601,554,620],'TYPICAL OUTPUTS','ผลการทดสอบ')]:label(8,b,th,en,7.6)
mask(8,[322,456,555,486]);text(8,[323,457,554,486],th='ประเมินพฤติกรรมการรับน้ำหนักและการเสียรูปของดินเมื่อรับแรง',en='Evaluate subgrade or ground bearing behavior and deformation under applied load.',size=7.2)
mask(8,[346,510,555,590]);rows(8,347,511,206,[('Setup reaction system, loading plate and instrumentation.','ติดตั้งระบบรับแรง แผ่นรับน้ำหนัก และเครื่องมือวัด'),('Apply load in stages.','เพิ่มน้ำหนักบรรทุกเป็นขั้น'),('Record settlement at each load stage.','บันทึกการทรุดตัวในแต่ละขั้น'),('Interpret results and evaluate ground performance.','แปลผลและประเมินพฤติกรรมของดิน')],19.5,6.7)
mask(8,[326,620,557,677]);rows(8,327,621,229,[('Load-settlement curve','กราฟน้ำหนักบรรทุกกับการทรุดตัว'),('Modulus of subgrade reaction or bearing capacity indication.','ค่าสัมประสิทธิ์ปฏิกิริยาของดินหรือค่าบ่งชี้กำลังรับน้ำหนัก'),('Field test report with analysis and recommendations.','รายงานภาคสนามพร้อมการวิเคราะห์และข้อเสนอแนะ')],18.5,6.6)
label(8,[87,711,470,728],'ข้อมูลทดสอบในพื้นที่ช่วยออกแบบฐานราก ควบคุมงานก่อสร้าง และเพิ่มความปลอดภัยและความทนทาน',size=7.5)

# 9 - four laboratory columns: every original capability is retained.
head(9,[107,81,307,105]);title(9,[32,153,277,181],'เครือข่ายห้องปฏิบัติการพันธมิตร',15)
label(9,[352,178,557,191],'สนับสนุนงานทดสอบดิน วัสดุ และโครงสร้าง',size=7.5,color=BLUE,fg='white')
for b,th in [([8,364,148,377],'ทดสอบแรงดันและการซึมผ่าน'),([173,364,330,377],'เครื่องมือทดสอบดิน'),([354,364,531,377],'เครื่องมือทดสอบวัสดุ'),([8,491,141,504],'เครื่องทดสอบแรงเฉือน'),([149,492,338,505],'เตรียมตัวอย่างและจำลองสภาพภาคสนาม'),([358,491,542,505],'ประสานงานและประชุมกับห้องปฏิบัติการ')]:label(9,b,th,size=7,color=BLUE,fg='white')
cols=[
 (17,142,'SOIL TESTING','ทดสอบดิน',[
 ('Soil classification & index tests','จำแนกดินและทดสอบสมบัติดัชนี'),('Compaction & CBR tests','ทดสอบการบดอัดและ CBR'),('Permeability & consolidation','การซึมน้ำและการอัดตัวคายน้ำ'),('Shear strength testing (UU, CU, CD)','ทดสอบกำลังเฉือน (UU, CU, CD)')]),
 (153,279,'CONCRETE &\nMATERIAL TESTING','ทดสอบคอนกรีตและวัสดุ',[
 ('Concrete compressive strength','กำลังอัดคอนกรีต'),('Cement, aggregate and admixtures','ซีเมนต์ มวลรวม สารผสมเพิ่ม'),('Steel and structural materials','เหล็กและวัสดุโครงสร้าง'),('Material quality and compliance','คุณภาพและความสอดคล้องตามข้อกำหนด')]),
 (289,418,'STRUCTURAL /\nSPECIALIZED TESTING','ทดสอบโครงสร้าง/เฉพาะทาง',[
 ('Structural component testing','ทดสอบชิ้นส่วนโครงสร้าง'),('Load, deformation and durability','น้ำหนักบรรทุก การเสียรูป ความทนทาน'),('Non-destructive testing (NDT)','การทดสอบแบบไม่ทำลาย (NDT)'),('Specialized testing as required','ทดสอบเฉพาะทางตามความต้องการ')]),
 (431,560,'TECHNICAL\nCOORDINATION','ประสานงานทางเทคนิค',[
 ('Qualified local laboratory / university network','เครือข่ายห้องปฏิบัติการ/มหาวิทยาลัย'),('Test planning and method selection','วางแผนทดสอบและเลือกวิธี'),('Result review and technical consultation','ทบทวนผลและให้คำปรึกษา'),('Support for project-specific requirements','สนับสนุนตามข้อกำหนดโครงการ')])]
for x,x1,en,th,items in cols:
 # Keep each circular icon, replace the adjacent bilingual heading.
 hx={17:56,153:190,289:326,431:464}[x]
 mask(9,[hx,515,x1,552]);text(9,[hx+1,516,x1-1,551],th,en,6.8)
 mask(9,[x,554,x1,650])
 if x==431:
  text(9,[x+1,555,x1-1,584],items[0][1],items[0][0],6.7)
  rows(9,x+1,584,x1-x-2,items[1:],21.5,6.7)
 else:rows(9,x+1,555,x1-x-2,items,22.4,6.7)
mask(9,[75,653,420,711]);text(9,[76,654,419,676],th='ร่วมมือเพื่อมาตรฐานที่สูงขึ้น',en='COLLABORATION FOR HIGHER STANDARDS',size=8)
text(9,[76,677,419,705],en='AN-THAI collaborates with qualified local laboratories and leading universities to provide reliable and comprehensive testing services. Through our established partner network, we ensure high technical standards, accurate results, and timely support for every project.',size=7.1)
mask(9,[76,706,420,736])
# Reapply Thai paragraph after clearing remaining source Chinese.
text(9,[76,706,419,735],th='AN-THAI ร่วมมือกับห้องปฏิบัติการและมหาวิทยาลัยในท้องถิ่น ผ่านเครือข่ายพันธมิตร เพื่อบริการทดสอบที่ครอบคลุม เชื่อถือได้ มีมาตรฐานทางเทคนิค และสนับสนุนโครงการอย่างทันท่วงที',size=7.4)

# 10 - experience and service headings, original photographs and English lists.
head(10,[130,94,301,118]);label(10,[29,157,225,180],'ประสบการณ์โครงการที่คัดสรร',size=12)
for b,th in [([52,267,135,282],'โรงงานอุตสาหกรรม'),([170,266,264,281],'คลังสินค้าและโลจิสติกส์'),([319,274,418,284],'สะพานและโครงสร้างพื้นฐาน'),([450,266,555,281],'โครงการพัฒนาโรงงาน'),([52,418,153,433],'ศูนย์ข้อมูลและอาคารพาณิชย์'),([178,412,277,428],'งานทดสอบฐานราก'),([306,414,417,429],'สนับสนุนงานธรณีเทคนิค'),([450,419,559,434],'ทดสอบวัสดุและโครงสร้าง')]:label(10,b,th,size=6.9)
label(10,[155,490,224,508],'ขอบเขตบริการ',size=8.8,color=BLUE,fg='white')
for b,th in [([69,543,159,558],'ทดสอบเสาเข็ม'),([69,583,186,599],'สำรวจธรณีเทคนิค'),([69,618,180,638],'ทดสอบแผ่นรับน้ำหนัก'),([69,654,169,678],'ทดสอบวัสดุ'),([69,697,188,714],'ตรวจสอบโครงสร้าง')]:label(10,b,th,size=7.5,color=BLUE,fg='white')
# Complete contact text/old QR patch; no identity claim or invented QR code.
mask(10,[252,516,436,703]);text(10,[254,518,400,543],th='ติดต่อเรา',en='CONTACT',size=9)
text(10,[254,544,412,562],th='คุณ James Cheng',size=12)
text(10,[254,562,412,584],en='Managing Director',th='กรรมการผู้จัดการ',size=7.5)
contacts=[('Tel. / โทร.','+66 90 292 1749'),('Email / อีเมล','anthaicheng@gmail.com'),('LINE ID','rachada2018'),('Location / ที่ตั้ง','Bangkok, Thailand')]
for k,(tag,value) in enumerate(contacts):
 y=586+k*27;text(10,[254,y,428,y+12],th=tag,size=7.2);text(10,[254,y+12,428,y+27],th=value,size=9)
p=doc[9]
for box,uri in [([254,598,428,613],'tel:+66902921749'),([254,625,428,640],'mailto:anthaicheng@gmail.com'),([254,652,428,667],'https://line.me/ti/p/~rachada2018')]:p.insert_link({'kind':fitz.LINK_URI,'from':rect(box,p),'uri':uri})

bad=[r for r in records if r['spare']<0]
(OUT/'text-fit.json').write_text(json.dumps({'records':records,'overflow':bad},ensure_ascii=False,indent=2))
if bad:raise SystemExit(f'{len(bad)} text boxes overflow; no PDF released')
doc.set_metadata({'title':'AN-THAI Engineering | Thai-English Company Brochure','author':'AN-THAI Engineering Company Limited','subject':'Original ten-page company brochure, Thai-English edition'})
doc.save(OUT/'an-thai-engineering-brochure-th-en.pdf',garbage=4,deflate=True)
for i,p in enumerate(doc):p.get_pixmap(matrix=fitz.Matrix(1.5,1.5)).save(OUT/f'page-{i+1:02}.png')
print('BUILT',len(doc),'pages;',len(records),'text boxes; zero overflow')
print('Original SHA256',hashlib.sha256(SOURCE.read_bytes()).hexdigest())
