
/* =====================================================================
   Animación CTA · el durazno apurado, el chorro y la salida limpia
   ===================================================================== */
const clamp = (x,a=0,b=1)=>Math.min(b,Math.max(a,x));
const seg = (t,a,b)=>clamp((t-a)/(b-a));
const ease = x=>x*x*(3-2*x);
const easeOut = x=>1-(1-x)*(1-x);
const easeIn = x=>x*x;
const lerp = (a,b,k)=>a+(b-a)*k;
const lerpV = (a,b,k)=>a.clone().lerp(b,k);
const DUR = 10;
const params = new URLSearchParams(location.search);
let FINAL = params.get('final') === '2' ? '2' : '4';

const TX = -1.55, SEAT_Y = 1.02;
const WORLD = new THREE.Group(); scene.add(WORLD);
const K = {};
const INKC = '#111318', LIME = '#c8ff36';

function buildScene(){
  WORLD.clear();
  const white = toon('#ffffff');
  // sombra del inodoro
  const sh = new THREE.Mesh(new THREE.CircleGeometry(1,40), basic('#000',{transparent:true,opacity:.22,depthWrite:false}));
  sh.rotation.x=-Math.PI/2; sh.position.set(TX-.3,.004,0); sh.scale.set(1.45,.55,1); WORLD.add(sh);
  // taza
  const prof = [[0,0],[.42,0],[.44,.06],[.34,.2],[.3,.38],[.36,.56],[.52,.72],[.62,.86],[.63,.95],[.55,.98],[0,.98]].map(([r,y])=>new THREE.Vector2(r,y));
  const bowlG = new THREE.LatheGeometry(prof, 48); bowlG.scale(1.42,1,1.02);
  const bowl = withOutline(new THREE.Mesh(bowlG, white), .03); bowl.position.set(TX,0,0); WORLD.add(bowl);
  // asiento y tapa levantada
  const seatG = new THREE.TorusGeometry(.5,.075,14,56); seatG.rotateX(Math.PI/2); seatG.scale(1.4,.75,1.12);
  const seat = withOutline(new THREE.Mesh(seatG, white), .022); seat.position.set(TX+.06, SEAT_Y, 0); WORLD.add(seat);
  const lidG = new THREE.CylinderGeometry(.62,.62,.07,44); lidG.rotateZ(Math.PI/2); lidG.scale(1,1.28,1.08);
  const lid = withOutline(new THREE.Mesh(lidG, white), .022); lid.position.set(TX-.66, SEAT_Y+.74, 0); lid.rotation.z=.1; WORLD.add(lid);
  // estanque
  const tank = withOutline(new THREE.Mesh(new RoundedBoxGeometry(.55,1.15,1.3,4,.12), white), .026); tank.position.set(TX-1.02, SEAT_Y+.55, 0); WORLD.add(tank);
  const tankLid = withOutline(new THREE.Mesh(new RoundedBoxGeometry(.66,.12,1.42,3,.05), white), .02); tankLid.position.set(TX-1.02, SEAT_Y+1.17, 0); WORLD.add(tankLid);
  const lever = new THREE.Mesh(new THREE.CapsuleGeometry(.035,.2,4,8), toon('#c9ccd2')); lever.rotation.x=Math.PI/2; lever.position.set(TX-.8, SEAT_Y+.95, .66); WORLD.add(lever);
  // PopoWash bajo el asiento + brazo hacia el lado visible + perilla
  const plate = withOutline(new THREE.Mesh(new RoundedBoxGeometry(.5,.05,.95,2,.02), white), .012); plate.position.set(TX-.38, SEAT_Y-.08, 0); WORLD.add(plate);
  const armPts=[V(TX-.3,SEAT_Y-.08,.44),V(TX-.08,SEAT_Y-.11,.68),V(TX+.2,SEAT_Y-.14,.78)];
  WORLD.add(withOutline(new THREE.Mesh(tube(armPts,.052,24,12), white), .014));
  const knob = new THREE.Group(); knob.position.set(TX+.26, SEAT_Y-.15, .84); WORLD.add(knob);
  const kb = withOutline(new THREE.Mesh(new THREE.CylinderGeometry(.15,.15,.14,36).rotateX(Math.PI/2), white), .016); knob.add(kb);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.15,.024,10,36), toon('#c9ccd2')); ring.position.z=-.02; knob.add(ring);
  const dial = new THREE.Group(); dial.position.z=.074; knob.add(dial);
  const pointer = new THREE.Mesh(new THREE.BoxGeometry(.035,.12,.01), basic(INKC)); pointer.position.y=.05; dial.add(pointer);
  const dot = new THREE.Mesh(new THREE.CircleGeometry(.028,14), basic(LIME)); dot.position.set(0,.1,.007); dial.add(dot);
  const tick = new THREE.Mesh(new THREE.CircleGeometry(.018,10), basic('#e2463a')); tick.position.set(-.115,.08,.0); knob.add(tick); tick.position.z=.075;
  const arcPts=[]; for(let i=0;i<=18;i++){ const a=Math.PI*.6 - i/18*Math.PI*.95; arcPts.push(V(Math.cos(a)*.36, Math.sin(a)*.36, .1)); }
  const arc = new THREE.Mesh(tube(arcPts,.022,36,6), basic(LIME,{transparent:true})); knob.add(arc);
  const head = new THREE.Mesh(new THREE.ConeGeometry(.06,.13,12), basic(LIME,{transparent:true})); head.position.copy(arcPts[18]); head.rotation.z = (Math.PI*.6 - Math.PI*.95) - Math.PI; knob.add(head);
  K.knob = knob; K.dial = dial; K.arc = [arc, head];
  // chorro
  const jet = new THREE.Group(); jet.position.set(TX+.12, SEAT_Y-.05, 0); WORLD.add(jet);
  const colG = new THREE.CylinderGeometry(.2,.34,1,24,1,true); colG.translate(0,.5,0);
  const col = withOutline(new THREE.Mesh(colG, toon('#5fc4ff',{side:THREE.DoubleSide})), .02); jet.add(col);
  const coreG = new THREE.CylinderGeometry(.08,.14,1,16,1,true); coreG.translate(0,.5,0);
  const core = new THREE.Mesh(coreG, basic('#e9f8ff',{side:THREE.DoubleSide})); core.position.z=.16; jet.add(core);
  const foam = new THREE.Group(); jet.add(foam);
  for (let i=0;i<7;i++){ const f = withOutline(new THREE.Mesh(new THREE.SphereGeometry(.16+.06*(i%3),14,10), toon(i%2?'#ffffff':'#bfe8ff')), .012); const a=i/7*Math.PI*2; f.position.set(Math.cos(a)*.32, 0, Math.sin(a)*.32); foam.add(f); }
  const drops=[]; for (let i=0;i<26;i++){ const d=withOutline(new THREE.Mesh(new THREE.SphereGeometry(.055+.03*((i*7)%3)/2,10,8), toon(i%3?'#bfe8ff':'#ffffff')), .01); WORLD.add(d); drops.push(d); }
  K.jet = jet; K.col = col; K.core = core; K.foam = foam; K.drops = drops;
  // líneas de velocidad y polvo al salir corriendo
  const lines=[]; for (let i=0;i<6;i++){ const g=new THREE.Group(); const len=.9+((i*37)%5)*.2; g.add(capTube([V(0,0,0),V(-len,0,0)], .03, basic(i%2?LIME:'#f8f7f2'))); WORLD.add(g); lines.push({g,y:.9+i*.3,len,o:(i*.23)%1}); }
  const dust=[]; for (let i=0;i<8;i++){ const d=new THREE.Mesh(new THREE.SphereGeometry(1,14,10), basic('#c9d3f2',{transparent:true,opacity:.7,depthWrite:false})); WORLD.add(d); dust.push(d); }
  const ghosts=[]; for (let i=0;i<3;i++){ const gh=new THREE.Mesh(new THREE.CircleGeometry(1,40), basic('#ffb98a',{transparent:true,opacity:.3,depthWrite:false})); WORLD.add(gh); ghosts.push(gh); }
  K.lines = lines; K.dust = dust; K.ghosts = ghosts;
}

/* ---------- partículas del personaje ---------- */
function stinkFx(t, al){
  const F = C.fx; F.stink.visible = al > .01;
  F.puffs.forEach((q,i)=>{ const u=((t*.35)+q.ph)%1; q.m.position.set(q.x*(1+.4*u) + .2*Math.sin(u*9+i), .8 + 2.4*u, -.7 + .5*u); q.m.scale.setScalar(.1 + .28*u); q.m.material.opacity = al*.8*(1-u)*Math.min(1,u*6); });
  F.flies.forEach((f,i)=>{ const a=t*(2.2+i*.4)+i*2.1; f.position.set(Math.cos(a)*(1.5+.2*Math.sin(a*3)), 1.9+.5*Math.sin(a*1.7+i), Math.sin(a)*(1.2+.2*Math.cos(a*2))); const fl=Math.sin(t*60+i)*.6; f.userData.w1.position.set(-.06,.05,0); f.userData.w2.position.set(.06,.05,0); f.userData.w1.rotation.z=.5+fl; f.userData.w2.rotation.z=-.5-fl; f.scale.setScalar(1.4*Math.min(1,al*1.5)); });
  const g = F.squigG; g.traverse(o=>{ if(o.geometry) o.geometry.dispose(); }); g.clear();
  if (al > .01) for (let i=0;i<3;i++){ const u=((t*.4)+i/3)%1; const x0=[-1.25,1.3,-.2][i]; const z0=[.1,.05,-.9][i]; const pts=[]; for(let k=0;k<=12;k++){ const v=k/12; pts.push(V(x0 + .12*Math.sin(v*10 + t*4 + i), .9 + 1.7*u + .8*v, z0)); }
    g.add(new THREE.Mesh(tube(pts,.034,40,6), basic('#6fa51c',{transparent:true,opacity:al*Math.min(1,u*5)*(1-u)}))); }
}
function cleanFx(t, al){
  const F = C.fx; F.clean.visible = al > .01;
  const q = rig.quaternion.clone().invert().multiply(camera.quaternion);
  F.stars.forEach((st,i)=>{ const k=Math.max(0,Math.sin(t*3.2+st.ph)); st.g.scale.setScalar((.25+1.0*k*k)*al); st.g.quaternion.copy(q); st.g.rotation.z += t*.6; });
  F.bubbles.forEach((bq,i)=>{ const u=((t*.28)+bq.ph)%1; const a=bq.a + u*1.5; bq.bb.position.set(Math.cos(a)*bq.rad, .2 + 3.0*u, Math.sin(a)*bq.rad*.8 + .2); const pop = u>.92 ? 1-(u-.92)/.08 : 1; bq.bb.scale.setScalar((.6+.4*u)*pop*al); bq.bb.quaternion.copy(q); });
}

/* ---------- dibujo del personaje según parámetros ---------- */
const FACE1 = {mouth:'frown', brow:[-.32,-.32], lids:[.18,.18], look:[0,.1], nose:1};
const FACES = { '4': {mouth:'smirk', brow:[-.35,.3], lids:[.1,.1], look:[0,.05], nose:1.5}, '2': {mouth:'grin', brow:[.12,.12], lids:[.12,.12], look:[0,.05], nose:1} };

function draw(o, t){
  const b = C.bodyG, A = C.actor;
  rig.position.set(o.x, o.y||0, 0); rig.rotation.order='YXZ'; rig.rotation.set(0, o.ry||0, 0);
  const pc = V(0, 1.62 + (o.bob||0), 0); A.rotation.set(o.flip||0, 0, 0); A.position.copy(pc.clone().sub(pc.clone().applyEuler(A.rotation)));
  const sy = o.sy ?? 1; b.position.set(0, 1.62 + (o.bob||0), 0); b.scale.set(1/Math.sqrt(sy), sy, 1/Math.sqrt(sy)); b.rotation.set(o.pitch||0, o.yaw||0, o.tilt||0);
  rig.updateMatrixWorld(true); b.updateMatrix();
  const invW = A.matrixWorld.clone().invert(); const W2L = v => v.clone().applyMatrix4(invW);
  // cara
  const f = o.face;
  C.nose.scale.setScalar(f.nose||1);
  C.eyes.forEach((e,i)=>{ setLid(e, f.lids[i]); e.pupil.position.set(f.look[0]*.065, f.look[1]*.08, .079); e.brow.rotation.z = e.side*f.brow[i]*-1; e.brow.position.y = .35+(f.brow[i]>0?f.brow[i]*.12:f.brow[i]*.08); e.lashes.visible=false; });
  setMouth(f.mouth);
  // brazos
  const Lg = C.limbs; Lg.traverse(x=>{ if(x.geometry) x.geometry.dispose(); }); Lg.clear();
  const Sl = onBody(-.96,-.08,.12), Sr = onBody(.96,-.08,.12);
  const h = o.hands(Sl, Sr, W2L);
  const al = armPts(Sl,h.Hl,h.bl), ar = armPts(Sr,h.Hr,h.br);
  Lg.add(new THREE.Mesh(tube(al,.052), C.M.ink), new THREE.Mesh(tube(ar,.052), C.M.ink));
  placeGlove(C.gloves[0], al, h.rollL||0); placeGlove(C.gloves[1], ar, h.rollR||0);
  C.watch.visible = !!o.watch;
  if (o.watch){ const end=ar[3], prev=ar[2]; const d=end.clone().sub(prev).normalize(); C.watch.position.copy(end.clone().addScaledVector(d,-.06)); C.watch.quaternion.setFromUnitVectors(Z, V(.3,.2,1).normalize()); }
  // piernas
  for (const [i,s] of [[0,-1],[1,1]]){
    const hip = onBody(s*.34,-.9,.05,-.04);
    const sh = C.shoes[i]; sh.position.copy(o.shoes[i][0]); sh.rotation.order='ZYX'; sh.rotation.set(...o.shoes[i][1]);
    const ankle = sh.position.clone().add(V(0,.1,-.06).applyEuler(sh.rotation));
    const lb = o.legBow || V(0,0,0);
    const mid1 = hip.clone().lerp(ankle,.35).add(V(s*.13,0,0)).add(lb), mid2 = hip.clone().lerp(ankle,.7).add(V(s*.1,0,0)).add(lb.clone().multiplyScalar(.6));
    Lg.add(new THREE.Mesh(tube([hip,mid1,mid2,ankle],.055), C.M.ink));
  }
  // sombra en el piso
  const hgt = (o.y||0); const ss_ = Math.max(.25, 1 - hgt*.22);
  C.shadow.position.set(0, .005 - hgt, 0); C.shadow.scale.set(1.15*ss_*(o.shadowK??1), .55*ss_*(o.shadowK??1), 1);
}

const stand = s => [V(s*.42,.14,.02), [0, s*.18, 0]];
function walkShoes(ph, amp=.3, lift=.16){ return [0,1].map(i=>{ const s=i?1:-1; const a = ph + i*Math.PI; return [V(s*.4, .14 + lift*Math.max(0,Math.sin(a)), .05 + amp*Math.cos(a)), [-.35*Math.max(0,Math.sin(a)), s*.12, 0]]; }); }
const hipHand = s => onBody(s*.97,-.42,.25).add(V(s*.06,0,.05));

/* ---------- línea de tiempo ---------- */
const XS = 1.75, XF = -.15, XL = 1.0;
const SIT_Y = .3;
function frame(t){
  const o = { x:XS, y:0, ry:0, flip:0, sy:1, bob:0, tilt:0, pitch:0, yaw:0, face:{...FACE1}, watch:false,
    shoes:[stand(-1), stand(1)], hands:(Sl,Sr)=>({Hl:Sl.clone().add(V(-.4,-.66,.2)), Hr:Sr.clone().add(V(.4,-.66,.2)), bl:V(-.2,-.05,0), br:V(.2,-.05,0)}) };
  let stinkA = 1, cleanA = 0, jetH = 0, knobA = 0, arcA = 0, shake = 0;
  const blink = (t % 2.7) > 2.58 ? 1 : 0;

  if (t < 3.0){
    // 1 · impaciente y apestoso: golpea el pie, mira el reloj y pregunta «¿y?»
    const tap = Math.max(0, Math.sin(t*15));
    o.shoes[1] = [V(.42, .14 + .05*tap, .04), [-.5*tap, .18, 0]]; o.bob = .03*tap; o.sy = .985 + .02*tap;
    const up = ease(seg(t,.85,1.1)) * (1 - ease(seg(t,1.8,2.05)));
    const why = ease(seg(t,2.15,2.4)) * (1 - ease(seg(t,2.85,3.0)));
    o.watch = up > .2;
    o.face.look = up > .5 ? [.85,.3] : [0,.1];
    o.face.lids = [Math.max(.18,blink),Math.max(.18,blink)];
    if (why > .3){ o.face.brow = [-.38,.15]; o.tilt = .08*why; }
    o.hands = (Sl,Sr)=>{
      const restR = Sr.clone().add(V(.4,-.66,.2)), watchR = onBody(.8,-.1,.6).add(V(.5,.12,.45));
      const whyL = Sl.clone().add(V(-.75,-.25,.4)), whyR = Sr.clone().add(V(.75,-.25,.4));
      let Hl = hipHand(-1), bl = V(-.55,.05,.1), rollL = Math.PI/2;
      let Hr = lerpV(restR, watchR, up), br = lerpV(V(.2,-.05,0), V(.4,-.45,.1), up), rollR = 0;
      if (why > 0){ Hl = lerpV(Hl, whyL, why); Hr = lerpV(Hr, whyR, why); bl = lerpV(bl, V(-.2,-.2,.1), why); br = lerpV(br, V(.2,-.2,.1), why); rollL = lerp(rollL, -.6, why); rollR = .6*why; }
      return {Hl,Hr,bl,br,rollL,rollR};
    };
  } else if (t < 4.5){
    // 2 · camina hacia el inodoro y se sienta
    const turn1 = ease(seg(t,3.0,3.2));
    const walkK = seg(t,3.2,3.95);
    const turn2 = ease(seg(t,3.95,4.15));
    const hop = seg(t,4.1,4.45);
    o.ry = lerp(0, -Math.PI/2, turn1);
    o.x = lerp(XS, XF, ease(walkK));
    if (t >= 3.95){ o.ry = lerp(-Math.PI/2, Math.PI/2, turn2); }
    const wph = (t-3.0)*Math.PI*2*2.6;
    if (t < 3.95){ o.shoes = walkShoes(wph); o.bob = .06*Math.abs(Math.sin(wph)); o.tilt = .05*Math.sin(wph); }
    o.hands = (Sl,Sr)=>({ Hl:Sl.clone().add(V(-.5,-.55+.12*Math.sin(wph),.35*Math.sin(wph))), Hr:Sr.clone().add(V(.5,-.55-.12*Math.sin(wph),-.35*Math.sin(wph))), bl:V(-.15,.1,0), br:V(.15,.1,0) });
    if (t >= 4.1){
      const k = easeOut(hop);
      o.x = lerp(XF, TX+.05, k); o.y = SIT_Y*k + .55*Math.sin(Math.PI*hop);
      o.shoes = [0,1].map(i=>{ const s=i?1:-1; return [lerpV(V(s*.42,.14,.02), V(s*.4,.12-SIT_Y+.2,.95), k), [lerp(0,-.35,k), s*.15, 0]]; });
      o.legBow = V(0,.02,.35*k);
      o.sy = 1 - .12*Math.exp(-(((hop-.95)/.08)**2));
    }
    o.face.lids = [Math.max(.18,blink),Math.max(.18,blink)];
  } else if (t < 5.5){
    // 3 · gira la perilla
    o.x = TX+.05; o.y = SIT_Y; o.ry = Math.PI/2;
    o.shoes = [0,1].map(i=>{ const s=i?1:-1; const k=Math.sin(t*5+i*Math.PI)*.05; return [V(s*.4,.32-SIT_Y+k,.95), [-.35, s*.15, 0]]; }); o.legBow = V(0,.02,.35);
    const reach = ease(seg(t,4.5,4.8));
    const turn = ease(seg(t,4.85,5.25));
    knobA = -2.4*turn; arcA = Math.sin(Math.PI*seg(t,4.85,5.45));
    o.face.look = [-.4,-.7]; o.face.lids=[.18,.18]; o.face.brow=[-.4,-.4];
    o.pitch = .1*reach;
    o.hands = (Sl,Sr,W2L)=>{
      const kp = K.knob.position.clone().add(V(.16,.2,.2));
      const knobL = W2L(kp);
      const rest = Sl.clone().add(V(-.35,-.66,.3));
      return { Hl: lerpV(rest, knobL, reach), bl: V(-.35,.15,.25), rollL: reach*(Math.PI/2) + knobA*.9, Hr: onBody(.6,-.75,.6).add(V(.1,-.1,.25)), br: V(.25,-.2,.2) };
    };
  } else if (t < 7.0){
    // 4 · el chorro lo eleva
    const rumble = seg(t,5.5,5.72);
    const launch = seg(t,5.72,6.25);
    const hover = seg(t,6.25,6.9);
    knobA = -2.4;
    shake = rumble > 0 && rumble < 1 ? 1 : 0;
    o.x = TX+.05 + (shake ? .03*Math.sin(t*90) : 0); o.ry = Math.PI/2;
    const rise = 2.2*easeOut(launch) + .08*Math.sin(hover*Math.PI*2);
    o.y = SIT_Y + rise;
    o.flip = -Math.PI*2*ease(seg(t,5.9,6.65));
    jetH = t < 5.72 ? 0 : rise + .35;
    stinkA = 1 - ease(seg(t,5.85,6.4));
    o.face = {mouth:'o', brow:[.32,.32], lids:[0,0], look:[0,.2], nose:1};
    o.sy = 1 + .08*Math.sin(Math.PI*launch);
    const fl = Math.sin(t*14);
    o.shoes = [0,1].map(i=>{ const s=i?1:-1; return [V(s*.45, .1 - .1*fl*s, .5 + .2*fl*s), [-.3 + .3*fl*s, s*.2, 0]]; }); o.legBow = V(0,.0,.2);
    o.hands = (Sl,Sr)=>({ Hl:Sl.clone().add(V(-.55,.75+.15*fl,.2)), Hr:Sr.clone().add(V(.55,.75-.15*fl,.2)), bl:V(-.25,-.1,0), br:V(.25,-.1,0) });
  } else if (t < 8.5){
    // 5 · aterriza limpio y sonríe
    const fall = seg(t,7.0,7.3);
    const land = Math.max(0, t-7.3);
    const turn = ease(seg(t,7.6,7.9));
    knobA = -2.4;
    const peakY = SIT_Y + 2.2;
    o.x = lerp(TX+.05, XL, ease(fall)); o.y = t < 7.3 ? peakY*(1-easeIn(fall)) + .5*Math.sin(Math.PI*fall) : 0;
    o.ry = lerp(Math.PI/2, 0, turn);
    jetH = t < 7.15 ? (peakY + .35)*(1-seg(t,7.0,7.15)) : 0;
    if (t >= 7.3){ o.sy = 1 - .24*Math.exp(-land*7)*Math.cos(land*22); }
    stinkA = 0; cleanA = ease(seg(t,7.3,7.65));
    const F = FACES[FINAL];
    o.face = {...F, lids:[...F.lids], brow:[...F.brow]};
    if (t < 7.3) o.face = {mouth:'o', brow:[.32,.32], lids:[0,0], look:[0,-.3], nose:1};
    if (FINAL === '4' && t > 8.0 && t < 8.25) o.face.lids = [F.lids[0], 1];
    o.hands = (Sl,Sr)=> t < 7.3 ? ({ Hl:Sl.clone().add(V(-.6,.5,.2)), Hr:Sr.clone().add(V(.6,.5,.2)), bl:V(-.2,-.1,0), br:V(.2,-.1,0) })
      : ({ Hl:hipHand(-1), Hr:hipHand(1), bl:V(-.55,.05,.1), br:V(.55,.05,.1), rollL:Math.PI/2, rollR:-Math.PI/2 });
    if (t < 7.3) o.shoes = [0,1].map(i=>{ const s=i?1:-1; return [V(s*.42,.1,.15), [-.3, s*.18, 0]]; });
  } else {
    // 6 · sale corriendo
    const turn = ease(seg(t,8.5,8.65));
    const wind = seg(t,8.55,8.78);
    const dash = seg(t,8.78,9.3);
    knobA = -2.4*(1 - ease(seg(t,9.4,9.8)));
    o.ry = lerp(0, Math.PI/2, turn);
    o.x = XL + lerp(-.25*Math.sin(Math.PI*wind), 0, 0) + 7.5*easeIn(dash);
    o.pitch = -.12*wind*(1-dash) + .22*dash;
    stinkA = 0; cleanA = 1;
    const F = FACES[FINAL]; o.face = {...F, lids:[...F.lids], brow:[...F.brow]};
    const ph = (t-8.5)*Math.PI*2*6;
    o.shoes = [0,1].map(i=>{ const s=i?1:-1; const a=ph+i*Math.PI; return [V(s*.36, .16 + .3*Math.max(0,Math.sin(a)), .1 + .55*Math.cos(a)), [-.6*Math.max(0,Math.sin(a)), s*.1, 0]]; });
    o.bob = .1*Math.abs(Math.sin(ph));
    o.hands = (Sl,Sr)=>({ Hl:Sl.clone().add(V(-.45,-.3+.3*Math.sin(ph),.55*Math.sin(ph))), Hr:Sr.clone().add(V(.45,-.3-.3*Math.sin(ph),-.55*Math.sin(ph))), bl:V(-.1,.15,0), br:V(.1,.15,0) });
    // estela y polvo
    K.lines.forEach((l,i)=>{ const vis = dash > 0 && dash < 1; l.g.visible = vis || (t>8.6 && t<8.78); l.g.position.set(o.x - .9 - l.o*.8, l.y, -.2 + (i%3)*.3); l.g.scale.set(1 + 1.6*dash, 1, 1); });
    K.dust.forEach((d,i)=>{ const u = seg(t,8.6 + i*.03, 9.6); d.visible = u > 0 && u < 1; const a=i*.8; d.position.set(XL - .3 - .6*u*Math.cos(a)*.6 - .2*i/8, .2 + .25*u + .06*(i%3), .4*Math.sin(a)); d.scale.setScalar(.12 + .35*u); d.material.opacity = .6*(1-u); });
    K.ghosts.forEach((gh,i)=>{ const vis = dash > .05 && dash < .95; gh.visible = vis; gh.position.set(o.x - (i+1)*.75, 1.62 + o.bob, -.3 - i*.05); gh.scale.setScalar(.95 - i*.12); gh.material.opacity = .28 - i*.07; });
  }
  if (t < 8.5){ K.lines.forEach(l=>l.g.visible=false); K.dust.forEach(d=>d.visible=false); K.ghosts.forEach(g=>g.visible=false); }

  // perilla, flecha y chorro
  K.dial.rotation.z = knobA;
  K.arc.forEach(m=>{ m.visible = arcA > .02; m.material.opacity = arcA; });
  K.knob.scale.setScalar(1 + .35*arcA);
  K.jet.visible = jetH > .02;
  if (jetH > .02){
    const w = 1 + .12*Math.sin(t*40);
    K.col.scale.set(w, jetH, w); K.core.scale.set(1, jetH, 1);
    K.foam.position.y = jetH; K.foam.rotation.y = t*6; K.foam.scale.setScalar(.9 + .15*Math.sin(t*30));
  }
  K.drops.forEach((d,i)=>{
    const on = jetH > .3;
    d.visible = on;
    if (!on) return;
    const u = ((t*1.4) + i/26) % .7; const a = i*2.4;
    const v0 = 2.2 + (i%4)*.4;
    const top = K.jet.position.clone().add(V(0, jetH, 0));
    d.position.set(top.x + Math.cos(a)*(.4 + 1.6*u), top.y + v0*u - 6*u*u, Math.sin(a)*(.3 + 1.2*u));
  });
  WORLD.position.x = shake ? .015*Math.sin(t*80) : 0;
  stinkFx(t, stinkA); cleanFx(t, cleanA);
  draw(o, t);

  // cámara
  const camKeys = [[0,V(.1,2.95,0),13.4],[10,V(.1,2.95,0),13.4]];
  let k0=camKeys[0], k1=camKeys[camKeys.length-1];
  for (let i=0;i<camKeys.length-1;i++){ if (t>=camKeys[i][0] && t<=camKeys[i+1][0]){ k0=camKeys[i]; k1=camKeys[i+1]; break; } }
  const ck = ease(seg(t,k0[0],k1[0]));
  const tgt = lerpV(k0[1],k1[1],ck), dist = lerp(k0[2],k1[2],ck);
  camera.position.copy(tgt).add(V(0, Math.sin(.1)*dist, Math.cos(.1)*dist));
  camera.lookAt(tgt);
}

/* ---------- reproducción ---------- */
const stageEl2 = document.getElementById('stage');
function resize(){ const w=stageEl2.clientWidth, h=stageEl2.clientHeight; renderer.setSize(w,h,false); camera.aspect=w/h; camera.updateProjectionMatrix(); }
new ResizeObserver(resize).observe(stageEl2);
build(); buildScene(); C.fx.roll.visible=false; C.fx.water.visible=false; resize();
let frozen = null, t0 = performance.now();
const PAUSE = 2.5;
function loop(){
  const el = (performance.now()-t0)/1000;
  const t = frozen ?? Math.min(DUR, el % (DUR + PAUSE));
  frame(t); renderer.render(scene, camera);
  requestAnimationFrame(loop);
}
window.anim = { freeze(t){ frozen = t; frame(t); renderer.render(scene,camera); }, play(){ frozen=null; t0=performance.now(); }, setFinal(k){ FINAL = k; C.mouthType = null; } };
loop();
