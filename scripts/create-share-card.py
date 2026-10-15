"""Generate a person-free 1200x630 brand card. Requires Pillow only for regeneration."""
from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
W,H,S=1200,630,2
im=Image.new('RGB',(W*S,H*S),'#f8f7f1');d=ImageDraw.Draw(im)
def font(n,bold=False):return ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial'+(' Bold' if bold else '')+'.ttf',n*S)
def text(pos,t,n,fill='#173f35',bold=False):d.text((pos[0]*S,pos[1]*S),t,font=font(n,bold),fill=fill)
def line(pts,fill='#173f35',width=2):d.line([(x*S,y*S) for x,y in pts],fill=fill,width=width*S,joint='curve')
d.rectangle([0,0,24*S,H*S],fill='#173f35')
d.rounded_rectangle([70*S,68*S,165*S,163*S],radius=22*S,fill='#173f35')
# Existing open-book and leaf brand motif, drawn as vector strokes.
line([(87,105),(99,105),(118,115),(136,105),(149,105),(149,144),(135,144),(118,154),(100,144),(87,144),(87,105)],'#f8f7f1',3)
line([(118,115),(118,154)],'#f8f7f1',3)
line([(118,105),(108,101),(102,92),(102,84),(112,88),(118,96),(118,105),(128,99),(135,89),(136,82),(125,88),(119,97)],'#f8f7f1',3)
text((188,72),'PyinNyar',58,bold=True);text((191,139),'S T U D Y  A B R O A D',17)
text((72,248),'Your next chapter',66,bold=True)
text((72,333),'starts here.',66,fill='#c47f52',bold=True)
line([(75,425),(612,425)],'#c47f52',3)
text((74,468),'Guidance for Myanmar students',27)
text((74,523),'Burmese  /  Chinese  /  English',20,fill='#68736b')
# A quiet globe using the established brand geometry; no student imagery or invented outcomes.
for box in [(835,205,1135,505),(925,205,1045,505),(835,280,1135,430)]:d.ellipse(tuple(v*S for v in box),outline='#ced6c8',width=2*S)
line([(835,355),(1135,355)],'#ced6c8',2)
line([(985,205),(985,505)],'#ced6c8',2)
im.resize((W,H),Image.Resampling.LANCZOS).save('dist/assets/share-card.png',optimize=True)
print('Share card:',Image.open('dist/assets/share-card.png').size)
