import {clamp} from './scoring.js';
import {gameEvents} from './content.js';

const ages = [8,12,16,20,30,45,60,80];

export class LifeGame {
  constructor(canvas, initialScores, onUpdate, onFinish) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.metrics = {...initialScores,knowledge:50};
    this.onUpdate = onUpdate;
    this.onFinish = onFinish;
    this.eventIndex = 0;
    this.history = [];
    this.selected = null;
    this.feedback = '';
    this.running = true;
    this.draw = this.draw.bind(this);
    this.frame = requestAnimationFrame(this.draw);
    this.publish();
  }
  publish() {
    const event = this.eventIndex < 8 ? this.currentEvent() : null;
    this.onUpdate({metrics:{...this.metrics},eventIndex:this.eventIndex,event,selected:this.selected,feedback:this.feedback,history:[...this.history]});
  }
  currentEvent() { return gameEvents[this.eventIndex]; }
  choose(choiceIndex) {
    if (this.selected !== null) return;
    const choice = this.currentEvent().choices[choiceIndex];
    if (!choice) return;
    Object.entries(choice.delta).forEach(([key, amount]) => this.metrics[key] = clamp((this.metrics[key] ?? 50) + amount));
    this.history.push({age:ages[this.eventIndex],key:choice.key,label:choice.label,feedback:choice.feedback});
    this.feedback = choice.feedback;
    this.selected = choiceIndex;
    this.publish();
  }
  continue() {
    if (this.selected === null) return;
    if (this.eventIndex === 7) {
      this.onFinish({metrics:{...this.metrics},history:[...this.history]});
      return;
    }
    this.eventIndex += 1;
    this.selected = null;
    this.feedback = '';
    this.publish();
  }
  destroy() { this.running = false; cancelAnimationFrame(this.frame); }
  draw(now) {
    if (!this.running) return;
    this.paint(now);
    this.frame = requestAnimationFrame(this.draw);
  }
  paint(now) {
    const ctx = this.ctx, w = this.canvas.width, h = this.canvas.height;
    const phase = this.eventIndex / 7;
    const skies = ['#dcebdc','#dcebdc','#e8e5d2','#f0d8b7','#dfc3ab','#b8b8a6','#a9b6ad','#202f32'];
    const groundColors = ['#a6c48a','#94b47d','#819d70','#a07c62','#72856d','#899084','#788478','#566568'];
    ctx.clearRect(0,0,w,h); ctx.fillStyle = skies[Math.min(7,this.eventIndex)]; ctx.fillRect(0,0,w,h);
    const night = this.eventIndex === 7;
    if (night) {
      for (let i=0;i<42;i++) { const x=(i*173+33)%w, y=(i*67+18)%142; ctx.fillStyle=i%3?'#d8e7b8':'#f2d78f';ctx.fillRect(x,y,2,2); }
      ctx.fillStyle='#d7ddc5';ctx.fillRect(690,38,32,32);ctx.fillStyle=skies[7];ctx.fillRect(701,31,28,28);
    } else {
      ctx.fillStyle=this.eventIndex<3?'#e7bd6d':'#e7a879';ctx.fillRect(690,44,36,36);
      for (let i=0;i<6;i++) {const x=((i*191-(now/48)%191)+w)%w;ctx.fillStyle='#f7f6e8';ctx.fillRect(x,55+(i%3)*13,42,5);ctx.fillRect(x+8,49+(i%3)*13,23,5);}
    }
    // Distant hills and small silhouettes shift to make the walk feel continuous.
    ctx.fillStyle=night?'#42575a':'#b6cda9';
    for(let i=0;i<8;i++){const x=(i*145-(now/80)%145+w)%w;ctx.fillRect(x,160,62,40);ctx.fillRect(x+12,145,38,25);ctx.fillRect(x+22,134,18,14);}
    ctx.fillStyle=night?'#34474b':'#c7d5b6';ctx.fillRect(0,198,w,27);
    for(let i=0;i<10;i++){const x=(i*112-(now/30)%112+w)%w;ctx.fillStyle=night?'#293d40':'#8aa879';ctx.fillRect(x,174,12,42);ctx.fillRect(x-7,160,26,18);ctx.fillRect(x-3,149,18,16);}
    ctx.fillStyle=groundColors[Math.min(7,this.eventIndex)];ctx.fillRect(0,224,w,76);ctx.fillStyle=night?'#3c4d50':'#79946c';ctx.fillRect(0,224,w,7);
    for(let i=0;i<36;i++){const x=(i*31-(now/12)%31+w)%w;ctx.fillStyle=i%2?'#d1d89a':'#697f62';ctx.fillRect(x,245+(i%4)*11,5,3);}
    // A few pixel houses appear further along the path.
    const houseX=520-((now/15)%170);ctx.fillStyle=night?'#485a54':'#dd8d68';ctx.fillRect(houseX,179,43,45);ctx.fillRect(houseX-6,169,55,13);ctx.fillStyle=night?'#f2d98d':'#f5edc7';ctx.fillRect(houseX+8,190,8,10);ctx.fillRect(houseX+27,190,8,10);ctx.fillStyle=night?'#5e5951':'#765a48';ctx.fillRect(houseX+18,203,10,21);
    this.drawWalker(180 + this.eventIndex*70 + Math.sin(now/130)*3, 224, now);
  }
  drawWalker(x, ground, now) {
    const c=this.ctx, age=ages[Math.min(7,this.eventIndex)], scale=age<16?1:age<45?1.05:1.08, head=age<16?20:22;
    const y=ground-72*scale, old=age>58, step=Math.sin(now/100)>0?2:0;
    // backpack and body
    if(age<20){c.fillStyle='#e98962';c.fillRect(x-12,y+28,10,22);}
    c.fillStyle=age<20?'#e9a25e':age<45?'#607d75':'#596d71';c.fillRect(x-7,y+27,18,27);
    c.fillStyle='#e9b990';c.fillRect(x-5,y,head,head);
    c.fillStyle=old?'#d4d7cb':'#34453a';c.fillRect(x-6,y-4,head+2,7);c.fillRect(x+head-4,y+1,6,8);
    if(old){c.fillStyle='#e8e6d9';c.fillRect(x-6,y-4,head+2,4);c.fillStyle='#997e6a';c.fillRect(x+7,y+11,2,2);}
    c.fillStyle='#273a34';c.fillRect(x+9,y+9,3,3);
    c.fillStyle='#ddb08c';c.fillRect(x-10,y+31,5,18);c.fillRect(x+11,y+31,5,18);
    c.fillStyle='#394741';c.fillRect(x-7,y+52,7,17+step);c.fillRect(x+5,y+52,7,17-step);
    c.fillStyle='#263832';c.fillRect(x-9,y+68+step,11,5);c.fillRect(x+4,y+68-step,12,5);
    if(old){c.fillStyle='#6f726a';c.fillRect(x+24,y+51,3,27);c.fillRect(x+21,y+50,9,3);}
  }
}
