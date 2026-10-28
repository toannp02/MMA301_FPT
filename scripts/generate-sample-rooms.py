"""Original illustrated room assets; no user photographs or third-party interiors."""
from PIL import Image, ImageDraw
from pathlib import Path
root = Path(__file__).resolve().parents[1] / "assets" / "rooms"
for name, wall, floor, sofa in [("living", (216,208,193), (151,128,104), (92,105,97)), ("bedroom", (197,205,202), (144,126,108), (223,213,192)), ("gallery", (231,229,222), (172,166,153), (86,81,76))]:
    image=Image.new("RGB",(1280,960)); d=ImageDraw.Draw(image)
    for y in range(960):
        base=wall if y<770 else floor
        f=0.95+0.06*(1-y/960)
        d.line((0,y,1280,y),fill=tuple(int(v*f) for v in base))
    d.polygon([(0,0),(90,45),(90,770),(0,830)], fill=tuple(v-20 for v in wall))
    d.polygon([(1190,45),(1280,0),(1280,830),(1190,770)], fill=tuple(v-12 for v in wall))
    d.line((90,770,1190,770),fill=(244,239,229),width=12)
    if name=="living":
        d.ellipse((250,825,1040,950), fill=(132,114,95)); d.rounded_rectangle((260,670,1020,870), radius=40,fill=sofa)
        d.rounded_rectangle((280,650,620,790),radius=35,fill=(108,120,111)); d.rounded_rectangle((640,650,1000,790),radius=35,fill=(108,120,111))
        d.rounded_rectangle((240,720,305,885),radius=20,fill=sofa);d.rounded_rectangle((975,720,1040,885),radius=20,fill=sofa)
        d.polygon([(85,720),(185,720),(166,840),(105,840)],fill=(164,129,99));d.line((135,720,130,400),fill=(67,84,58),width=12)
        for box in [(70,430,137,540),(130,470,200,580),(75,540,140,650)]:d.ellipse(box,fill=(76,94,66))
    elif name=="bedroom":
        d.rounded_rectangle((280,610,1000,865),radius=20,fill=(127,118,106));d.polygon([(335,730),(945,730),(1090,960),(190,960)],fill=sofa)
        d.rounded_rectangle((350,680,620,785),radius=25,fill=(240,236,222));d.rounded_rectangle((660,680,930,785),radius=25,fill=(240,236,222))
        d.rectangle((80,795,220,820),fill=(110,88,68));d.line((150,795,150,620),fill=(85,79,67),width=7);d.polygon([(100,560),(200,560),(230,655),(70,655)],fill=(236,217,171))
    else:
        d.ellipse((365,855,930,910),fill=(152,147,136));d.rounded_rectangle((380,805,900,845),radius=8,fill=sofa)
        for x in [410,860]:d.rectangle((x,840,x+12,905),fill=(62,59,54))
    image.save(root/f"{name}.png",optimize=True)
