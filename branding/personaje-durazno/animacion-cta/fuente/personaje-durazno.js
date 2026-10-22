
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';

/* ---------- opciones de iteración ---------- */
const BASE = {teeth:false, mouthW:.36, blush:false, nose:1, eyes:'v1', gloves4:false, lids:.15, look:[0,.1]};
const PRESETS = {
  '1': {label:'1 · Impaciente', mouth:'frown', brow:[-.32,-.32], lids:.18, look:[.25,.15]},
  '2': {label:'2 · Pícaro', mouth:'grin', brow:[-.28,-.28], lids:.15, look:[.3,.1]},
  '4': {label:'4 · Media sonrisa', mouth:'smirk', brow:[-.35,.25], lids:.12, look:[.6,.05], nose:1.5},
};
let OPT = Object.assign({teeth:false, mouthW:.34, blush:false, nose:1, eyes:'v1', gloves4:false, mouth:'frown', brow:[-.32,-.32], lids:.0, look:[0,.1]}, (()=>{try{return JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get('o')||'{}'))}catch(e){return {}}})());
/* ---------- estilos ---------- */
const STYLES = {
  bn:      {label:'B/N 1930', bg:'#e6e0d0', floor:'#000', body:['#9c968a','#f4f0e4'], crease:'#4f4b44', leaf:'#8a867c', stem:'#16161a', glove:'#ffffff', shoe:'#151518', limb:'#151518', blush:'#bdb4a4', mouthIn:'#2a2626', tongue:'#8d8579', ink:'#111111', filter:'grayscale(1) contrast(1.18) brightness(1.03)', grain:.32, old:true, sw:['#f4f0e4','#151518']},
  sepia:   {label:'Sepia rayado', bg:'#dcc9a0', floor:'#2a1a08', body:['#a08a66','#f1e3c2'], crease:'#5a4428', leaf:'#8d7a58', stem:'#24180c', glove:'#fff6e2', shoe:'#24180c', limb:'#24180c', blush:'#c9a982', mouthIn:'#3a2614', tongue:'#a8805a', ink:'#1d1209', filter:'sepia(.9) contrast(1.12) brightness(1.02)', grain:.38, old:true, sw:['#dcc9a0','#24180c']},
  tecni:   {label:'Technicolor', bg:'#f0dcb2', floor:'#5a1a10', body:['#c8452f','#f7a868'], crease:'#7c2017', leaf:'#2f8a7c', stem:'#2a1610', glove:'#fff8ea', shoe:'#7d1d17', limb:'#1d1412', blush:'#e8705a', mouthIn:'#4a0f0c', tongue:'#e86a6a', ink:'#1d1412', filter:'saturate(.88) contrast(1.06)', grain:.14, old:false, sw:['#f7a868','#2f8a7c']},
  marca:   {water:'#3aa7ff', label:'Colores PopoWash', bg:'#14265c', floor:'#000', body:['#ee5440','#ffcf9e'], crease:'#a8302a', leaf:'#c8ff36', stem:'#111318', glove:'#ffffff', shoe:'#3155ff', limb:'#111318', blush:'#ff4f6d', mouthIn:'#3b0b14', tongue:'#ff6b81', ink:'#111318', filter:'none', grain:.06, old:false, sw:['#ffcf9e','#3155ff']},
  azul:    {label:'Azul eléctrico', bg:'#3155ff', floor:'#000', body:['#ee5440','#ffcf9e'], crease:'#a8302a', leaf:'#c8ff36', stem:'#111318', glove:'#ffffff', shoe:'#111318', limb:'#111318', blush:'#ff4f6d', mouthIn:'#3b0b14', tongue:'#ff6b81', ink:'#111318', filter:'none', grain:.05, old:false, sw:['#ee5440','#c8ff36']},
};
const POSES = {neutral:'Pose base', sentado:'Sentado', acostado:'Acostado', saltando:'Saltando', saludo:'Saludando', nadando:'Nadando', oloroso:'Oloroso', limpio:'Oliendo bien', baile:'Baile', aburrido:'Aburrido', impaciente:'Impaciente'};
const state = {style:'marca', pose:'neutral', char:'1', lashes:false, back:false, spin:false};

/* ---------- escena ---------- */
const canvas = document.getElementById('c');
const stageEl = document.getElementById('stage');
const renderer = new THREE.WebGLRenderer({canvas, antialias:true, preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, 2));
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(27, 1, .1, 100);
camera.position.set(0, 2.0, 9.4);
scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8a8a, 1.3));
const key = new THREE.DirectionalLight(0xffffff, 2.6); key.position.set(-3, 6, 7); scene.add(key);

const gm = new THREE.DataTexture(new Uint8Array([120,120,120,255, 255,255,255,255]), 2, 1, THREE.RGBAFormat);
gm.minFilter = gm.magFilter = THREE.NearestFilter; gm.needsUpdate = true;

const ss = (a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t);};
const V = (x,y,z)=>new THREE.Vector3(x,y,z);
const Z = V(0,0,1), Y = V(0,1,0);

/* ---------- cuerpo: durazno con hendidura trasera ---------- */
const BS = V(1.0, .94, .96);
function radiusAt(x,y,z){
  const th = Math.acos(Math.max(-1,Math.min(1,y)));
  const topDip = .17*Math.exp(-((th/.3)**2));
  const back = Math.max(ss(0.0, .35, -z), ss(.5,.85,y)*ss(.65,.25,z));
  const lower = ss(.05, -.4, y)*ss(0,.35,-z);                                   // solo mitad inferior de la espalda
  const cleft = (.03 + .2*lower) * Math.exp(-((x/(.05+.06*lower))**2)) * back;  // hendidura marcada abajo, suave arriba
  const cheeks = .09*Math.exp(-((((Math.abs(x)-.36)/.32)**2) + (((y+.28)/.42)**2))) * ss(.1,.6,-z);
  const fold = .02*Math.exp(-(((y+.84)/.1)**2)) * ss(.1,.5,-z);
  const bottom = .06*ss(-.75,-1,y);
  return 1 - topDip - cleft + cheeks - fold - bottom;
}
function surf(x,y,z,out=0){const d=V(x,y,z).normalize();const r=radiusAt(d.x,d.y,d.z)+out;return V(d.x*r*BS.x,d.y*r*BS.y,d.z*r*BS.z);}
function surfN(x,y,z){const d=V(x,y,z).normalize();return V(d.x/BS.x,d.y/BS.y,d.z/BS.z).normalize();}

function bodyGeometry(st){
  const g = new THREE.SphereGeometry(1, 220, 150);
  const p = g.attributes.position, cols = [];
  const deep = new THREE.Color(st.body[0]), light = new THREE.Color(st.body[1]), crease = new THREE.Color(st.crease);
  const d = V(0,0,0), c = new THREE.Color();
  for (let i=0;i<p.count;i++){
    d.set(p.getX(i),p.getY(i),p.getZ(i)).normalize();
    const r = radiusAt(d.x,d.y,d.z);
    p.setXYZ(i, d.x*r*BS.x, d.y*r*BS.y, d.z*r*BS.z);
    const t = Math.min(1,Math.max(0,.52 + .36*d.y + .34*d.z));
    c.copy(deep).lerp(light, t);
    const k = Math.exp(-((d.x/.06)**2))*Math.max(ss(0,.35,-d.z), ss(.5,.85,d.y)*ss(.65,.25,d.z))*.6;
    c.lerp(crease, k);
    cols.push(c.r,c.g,c.b);
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(cols,3));
  g.computeVertexNormals();
  return g;
}

/* ---------- helpers ---------- */
let INK = '#111';
const outlines = [];
function outlineMat(th){
  const m = new THREE.MeshBasicMaterial({color:INK, side:THREE.BackSide});
  m.userData.outline = true;
  m.onBeforeCompile = s => { s.vertexShader = s.vertexShader.replace('#include <begin_vertex>', `vec3 transformed = position + normal * ${th.toFixed(4)};`); };
  return m;
}
function withOutline(mesh, th=.022){
  const o = new THREE.Mesh(mesh.geometry, outlineMat(th)); o.userData.isOutline = true; mesh.add(o); return mesh;
}
const toon = (color, extra={}) => new THREE.MeshToonMaterial({color, gradientMap:gm, ...extra});
const basic = (color, extra={}) => new THREE.MeshBasicMaterial({color, ...extra});
const ell = (rx,ry,rz,ws=40,hs=28)=> new THREE.SphereGeometry(1,ws,hs).scale(rx,ry,rz);
const tube = (pts, r, seg=48, rad=12)=> new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), seg, r, rad, false);
function capTube(pts, r, mat){ // tubo con extremos redondeados
  const g = new THREE.Group();
  g.add(new THREE.Mesh(tube(pts,r), mat));
  for (const q of [pts[0], pts[pts.length-1]]){ const s=new THREE.Mesh(new THREE.SphereGeometry(r,16,12),mat); s.position.copy(q); g.add(s); }
  return g;
}

/* ---------- personaje ---------- */
const rig = new THREE.Group(); scene.add(rig);
let C = null; // referencias del personaje actual

function build(){
  OPT = Object.assign({}, BASE, PRESETS[state.char]);
  const st = STYLES[state.style];
  INK = st.ink;
  rig.clear();
  scene.background = new THREE.Color(st.bg);
  canvas.style.filter = st.filter;
  stageEl.classList.toggle('old', st.old);
  document.getElementById('card').textContent = 'Estilo ' + st.label;

  const M = {
    body: toon('#ffffff',{vertexColors:true}), white: toon('#ffffff'), ink: basic(st.limb), inkT: toon(st.limb),
    glove: toon(st.glove), shoe: toon(st.shoe), leaf: toon(st.leaf), stem: toon(st.stem), lid: toon(st.body[1]),
    blush: basic(st.blush,{transparent:true, opacity:.55, depthWrite:false}), mouthIn: basic(st.mouthIn), tongue: toon(st.tongue),
  };
  const actor = new THREE.Group(); rig.add(actor);
  const bodyG = new THREE.Group(); bodyG.position.set(0,1.62,0); actor.add(bodyG);
  const body = withOutline(new THREE.Mesh(bodyGeometry(st), M.body), .03); bodyG.add(body);

  // tallo y hoja
  const top = surf(0,1,0,-.02);
  const stemPts = [top, top.clone().add(V(.02,.16,0)), top.clone().add(V(.1,.3,-.03))];
  bodyG.add(capTube(stemPts,.045,M.stem));
  const sh = new THREE.Shape(); sh.moveTo(0,0); sh.quadraticCurveTo(.28,.26,.66,.03); sh.quadraticCurveTo(.3,-.17,0,0);
  const lg = new THREE.ExtrudeGeometry(sh,{depth:.025,bevelEnabled:true,bevelThickness:.012,bevelSize:.012,bevelSegments:2,curveSegments:28});
  const lp = lg.attributes.position; for(let i=0;i<lp.count;i++){const x=lp.getX(i);lp.setZ(i,lp.getZ(i)-.28*x*x);} lg.computeVertexNormals();
  const leaf = withOutline(new THREE.Mesh(lg, M.leaf), .016);
  leaf.position.copy(stemPts[2]).add(V(-.02,-.02,0)); leaf.rotation.set(-.35,.5,.42); bodyG.add(leaf);
  const vein = capTube([V(.04,0,.03),V(.3,.04,.0),V(.56,.03,-.08)], .008, M.stem); leaf.add(vein);

  // ojos
  const eyes = [];
  for (const side of [-1,1]){
    const g = new THREE.Group();
    const dir = OPT.eyes==='tall' ? V(side*.14,.18,.97) : V(side*.235,.13,.96);
    g.position.copy(surf(dir.x,dir.y,dir.z,-.028));
    g.quaternion.setFromUnitVectors(Z, surfN(dir.x,dir.y,dir.z));
    g.rotateZ(side*-.08);
    const scl = withOutline(new THREE.Mesh(OPT.eyes==='tall'? ell(.135,.255,.075) : ell(.175,.255,.08), M.white), .026); g.add(scl);
    const shut = capTube([V(-.15,-.02,.06),V(-.07,.06,.085),V(.07,.06,.085),V(.15,-.02,.06)], .022, M.ink); shut.visible=false; g.add(shut);
    const pg = new THREE.CircleGeometry(.085, 48, .95, Math.PI*2-.6);
    const pupil = new THREE.Mesh(pg, basic(st.limb,{side:THREE.DoubleSide})); pupil.scale.set(OPT.eyes==='tall'?.85:1, OPT.eyes==='tall'?1.75:1.5, 1); g.add(pupil);
    const shine = new THREE.Mesh(new THREE.CircleGeometry(.018,16), basic('#ffffff')); pupil.add(shine); shine.position.set(-.028,.03,.002);
    const lid = new THREE.Mesh(new THREE.BufferGeometry(), M.lid); g.add(lid);
    const lidLine = new THREE.Mesh(new THREE.BufferGeometry(), M.ink); lidLine.visible=false; g.add(lidLine);
    const brow = new THREE.Group(); brow.add(capTube([V(-.1,0,0),V(0,.035,0),V(.1,0,0)],.017,M.ink)); brow.position.set(0,.35,.0); g.add(brow);
    const lashes = new THREE.Group();
    for (const a of [.15,.55,.95]){ const aa = side>0 ? a : -a; const bx=.175*Math.sin(aa)*.98, by=.255*Math.cos(aa)*.98;
      const dx=Math.sin(aa), dy=Math.cos(aa);
      lashes.add(capTube([V(bx,by,.035),V(bx+dx*.06,by+dy*.06,.04),V(bx+dx*.1+side*.03,by+dy*.08+.03,.03)],.011,M.ink)); }
    g.add(lashes);
    bodyG.add(g);
    eyes.push({g,scl,shut,pupil,lid,lidLine,brow,lashes,side,close:-1});
  }
  // nariz, mejillas
  const nose = new THREE.Mesh(ell(.05*OPT.nose,.035*OPT.nose,.03*OPT.nose), M.inkT); nose.position.copy(surf(0,-.1+(OPT.nose>1?.03:0),1,.005)); bodyG.add(nose);
  for (const side of [-1,1]){
    if (!OPT.blush) continue;
    const b = new THREE.Mesh(new THREE.CircleGeometry(.12,32), M.blush); const d=V(side*.45,-.2,.87);
    b.position.copy(surf(d.x,d.y,d.z,.006)); b.quaternion.setFromUnitVectors(Z, surfN(d.x,d.y,d.z)); b.scale.set(1,.68,1); bodyG.add(b);
  }
  const mouth = new THREE.Group(); bodyG.add(mouth);

  // guantes
  function glove(side){
    if (OPT.gloves4){
      const g = new THREE.Group(); g.scale.setScalar(1.45);
      const palm = withOutline(new THREE.Mesh(ell(.12,.11,.07), M.glove), .014); palm.position.y=.11; g.add(palm);
      [-.55,-.18,.18,.55].forEach((a,i)=>{ const f = withOutline(new THREE.Mesh(new THREE.CapsuleGeometry(.036,.075+(i===1||i===2?.02:0),6,12), M.glove), .012);
        f.position.set(Math.sin(a)*.12, .19+Math.cos(a)*.05, 0); f.rotation.z = -a*.9; g.add(f); });
      const thumb = withOutline(new THREE.Mesh(new THREE.CapsuleGeometry(.036,.06,6,12), M.glove), .012); thumb.position.set(side*.13,.07,.03); thumb.rotation.z = side*-1.1; g.add(thumb);
      const cuff = withOutline(new THREE.Mesh(new THREE.CylinderGeometry(.1,.065,.09,28), M.glove), .014); cuff.position.y=-.01; g.add(cuff);
      const roll = withOutline(new THREE.Mesh(new THREE.TorusGeometry(.098,.022,10,28), M.glove), .01); roll.rotation.x=Math.PI/2; roll.position.y=-.055; g.add(roll);
      actor.add(g); return g;
    }
    const g = new THREE.Group(); g.scale.setScalar(1.35);
    const palm = withOutline(new THREE.Mesh(ell(.13,.14,.075), M.glove), .016); palm.position.y=.13; g.add(palm);
    const thumb = withOutline(new THREE.Mesh(ell(.045,.075,.042), M.glove), .014); thumb.position.set(side*.12,.1,.03); thumb.rotation.z = side*-.6; g.add(thumb);
    const cuff = withOutline(new THREE.Mesh(new THREE.CylinderGeometry(.095,.07,.08,28), M.glove), .014); cuff.position.y=.0; g.add(cuff);
    for (const x of [-.04,0,.04]) g.add(capTube([V(x,.12,.074),V(x,.2,.06)],.007,M.ink));
    actor.add(g); return g;
  }
  function shoe(){
    const g = new THREE.Group();
    const s = withOutline(new THREE.Mesh(ell(.21,.14,.31), M.shoe), .02); s.position.set(0,.0,.09); g.add(s);
    const hl = new THREE.Mesh(ell(.06,.03,.08), basic('#ffffff',{transparent:true,opacity:.8})); hl.position.set(-.06,.11,.2); hl.rotation.x=-.4; g.add(hl);
    actor.add(g); return g;
  }
  const watch = new THREE.Group();
  watch.add(new THREE.Mesh(new THREE.TorusGeometry(.085,.022,10,28), toon(st.leaf)));
  const face = withOutline(new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,.03,28), M.white),.012); face.rotation.x=Math.PI/2; face.position.z=.03; watch.add(face);
  const hand1 = new THREE.Mesh(new THREE.BoxGeometry(.008,.045,.006), M.ink); hand1.position.set(0,.02,.047); watch.add(hand1);
  const hand2 = new THREE.Mesh(new THREE.BoxGeometry(.035,.008,.006), M.ink); hand2.position.set(.016,0,.047); watch.add(hand2);
  actor.add(watch);

  const shadow = new THREE.Mesh(new THREE.CircleGeometry(1,48), basic(st.floor,{transparent:true,opacity:.22,depthWrite:false}));
  shadow.rotation.x = -Math.PI/2; shadow.position.y = .005; rig.add(shadow);

  const limbs = new THREE.Group(); actor.add(limbs);

  /* ---- accesorios y partículas por pose ---- */
  const rnd = i => { const x = Math.sin(i*12.9898+78.233)*43758.5453; return x - Math.floor(x); };
  // rollo de papel para sentarse
  const roll = new THREE.Group();
  const rc = withOutline(new THREE.Mesh(new THREE.CylinderGeometry(.62,.62,.92,48), toon('#ffffff')), .022); rc.position.y=.46; roll.add(rc);
  const hole = new THREE.Mesh(new THREE.CylinderGeometry(.2,.2,.01,24), basic('#a8957a')); hole.position.y=.926; roll.add(hole);
  const sheet = withOutline(new THREE.Mesh(new THREE.BoxGeometry(.42,.7,.012), toon('#ffffff')), .012); sheet.position.set(.32,.5,.6); sheet.rotation.y=.3; roll.add(sheet);
  for (const y of [.3,.6]) { const l=new THREE.Mesh(new THREE.BoxGeometry(.4,.008,.004), basic('#b9b4a8')); l.position.set(.32,y,.61); l.rotation.y=.3; roll.add(l); }
  rig.add(roll);
  // agua para nadar
  const water = new THREE.Group();
  const wbody = new THREE.Mesh(new THREE.CylinderGeometry(7,7,1.12,64,1,true), toon(STYLES[state.style].water||'#3aa7ff',{transparent:true,opacity:.92,side:THREE.DoubleSide}));
  wbody.position.y = .56; water.add(wbody);
  const wtop = new THREE.Mesh(new THREE.CircleGeometry(7,64), toon(STYLES[state.style].water||'#3aa7ff',{transparent:true,opacity:.7,depthWrite:false})); wtop.rotation.x=-Math.PI/2; wtop.position.y=1.12; water.add(wtop);
  const rings=[]; for(let i=0;i<3;i++){ const r=new THREE.Mesh(new THREE.TorusGeometry(1,.03,6,72), basic('#ffffff',{transparent:true,opacity:.8,depthWrite:false})); r.rotation.x=-Math.PI/2; r.position.y=1.13; water.add(r); rings.push(r); }
  const drops=[]; for(let i=0;i<10;i++){ const d=withOutline(new THREE.Mesh(new THREE.SphereGeometry(.05,10,8), toon('#bfe8ff')),.01); water.add(d); drops.push(d); }
  rig.add(water);
  // mal olor: nubes verdes, líneas onduladas y moscas
  const stink = new THREE.Group(); const puffs=[], flies=[], squig=[];
  for(let i=0;i<14;i++){ const m=new THREE.Mesh(new THREE.SphereGeometry(1,16,12), toon('#9ccc2e',{transparent:true,opacity:.75,depthWrite:false})); stink.add(m); puffs.push({m,ph:rnd(i),x:(i%2?1:-1)*(.7+rnd(i+20)*.8)}); }
  for(let i=0;i<3;i++){ const f=new THREE.Group(); f.scale.setScalar(1.4); f.add(new THREE.Mesh(new THREE.SphereGeometry(.065,12,8), basic(STYLES[state.style].limb)));
    const w1=new THREE.Mesh(ell(.07,.032,.01), basic('#ffffff',{transparent:true,opacity:.9})); const w2=w1.clone(); f.add(w1,w2); f.userData={w1,w2}; stink.add(f); flies.push(f); }
  const squigG = new THREE.Group(); stink.add(squigG);
  rig.add(stink);
  // limpio: destellos y burbujas
  const clean = new THREE.Group(); const stars=[], bubbles=[];
  const ss4 = new THREE.Shape(); for(let i=0;i<8;i++){ const r=i%2?.045:.17, a=i*Math.PI/4+Math.PI/2; const x=Math.cos(a)*r, y=Math.sin(a)*r; i?ss4.lineTo(x,y):ss4.moveTo(x,y);} ss4.closePath();
  const sgeo = new THREE.ShapeGeometry(ss4);
  const spots = [[-1.35,2.75,.4],[1.45,2.45,.3],[-1.7,1.45,.5],[1.75,1.2,.6],[.15,3.15,0],[-1.0,.55,.8],[1.1,.6,.9],[.55,1.15,-1.15],[-.5,1.35,-1.15]];
  spots.forEach((q,i)=>{ const g=new THREE.Group(); const back=new THREE.Mesh(sgeo, basic(STYLES[state.style].ink)); back.scale.setScalar(1.45); back.position.z=-.002;
    const front=new THREE.Mesh(sgeo, basic(i%3===0? STYLES[state.style].leaf : '#ffffff')); g.add(back,front); g.position.set(...q); clean.add(g); stars.push({g,ph:rnd(i+40)*6}); });
  for(let i=0;i<12;i++){ const r=.07+rnd(i+60)*.08; const bb=new THREE.Group();
    bb.add(new THREE.Mesh(new THREE.SphereGeometry(r,16,12), basic('#ffffff',{transparent:true,opacity:.28,depthWrite:false})));
    const rim=new THREE.Mesh(new THREE.TorusGeometry(r,.007,6,24), basic('#ffffff',{transparent:true,opacity:.9})); bb.add(rim); bb.userData.rim=rim;
    const hl=new THREE.Mesh(new THREE.CircleGeometry(r*.28,10), basic('#ffffff')); hl.position.set(-r*.35,r*.35,r*.9); bb.add(hl);
    clean.add(bb); bubbles.push({bb,ph:rnd(i+80),a:rnd(i+90)*Math.PI*2,rad:1.25+rnd(i+100)*.5}); }
  rig.add(clean);

  C = {st, M, actor, bodyG, nose, eyes, mouth, gloves:[glove(-1),glove(1)], shoes:[shoe(),shoe()], watch, shadow, limbs, mouthType:null,
       fx:{roll, water, rings, drops, stink, puffs, flies, squigG, clean, stars, bubbles}};
}

/* párpado como casquete de elipsoide, cerrado de arriba hacia abajo */
function setLid(e, close){
  close = Math.max(0, Math.min(1, close));
  const shut = close > .9; e.scl.visible = !shut; e.pupil.visible = !shut; e.shut.visible = shut; e.lid.visible = !shut; e.lidLine.visible = false;
  if (Math.abs(close - e.close) < .01) return; e.close = close;
  e.lid.geometry.dispose(); e.lidLine.geometry.dispose();
  if (close < .02){ e.lid.geometry = new THREE.BufferGeometry(); e.lidLine.geometry = new THREE.BufferGeometry(); return; }
  const a = Math.PI*close;
  e.lid.geometry = new THREE.SphereGeometry(1,40,20,0,Math.PI*2,0,a).scale(.183,.263,.087);
  const pts=[]; for(let i=0;i<=24;i++){const u=-Math.PI/2 + Math.PI*i/24; pts.push(V(.185*Math.sin(a)*Math.sin(u), .265*Math.cos(a), .089*Math.sin(a)*Math.cos(u)));}
  e.lidLine.geometry = tube(pts, .016, 40, 8);
}

function setMouth(type){
  if (C.mouthType === type) return; C.mouthType = type;
  const m = C.mouth; m.children.forEach(o=>o.traverse(x=>x.geometry&&x.geometry.dispose())); m.clear();
  const W = OPT.mouthW;
  const P = (u, y, out=.004)=> surf(u*W, y, .95, out);
  const dark = basic(C.st.mouthIn,{side:THREE.DoubleSide}), white = basic('#ffffff',{side:THREE.DoubleSide});
  function band(fT, fB, u0, u1, mat, out, N=30){
    const pos=[]; for(let i=0;i<N;i++){ const ua=u0+(u1-u0)*i/N, ub=u0+(u1-u0)*(i+1)/N;
      const a=P(ua,fT(ua),out), b=P(ub,fT(ub),out), c=P(ua,fB(ua),out), d=P(ub,fB(ub),out);
      pos.push(...a.toArray(),...c.toArray(),...b.toArray(),...b.toArray(),...c.toArray(),...d.toArray()); }
    const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); m.add(new THREE.Mesh(g,mat));
  }
  const line = (f,u0,u1,r=.022,out=.008)=>{ const pts=[]; for(let i=0;i<=24;i++){const u=u0+(u1-u0)*i/24; pts.push(P(u,f(u),out));} m.add(capTube(pts,r,C.M.ink)); };
  if (type==='grin' || type==='smirk'){
    const sk = type==='smirk' ? .06 : 0;
    const top = u => -.235 + .07*u**4 + sk*u;
    const bot = u => -.235 - .22*Math.pow(Math.max(0,1-u*u),.8) + .07*u**4 + sk*u;
    band(top, bot, -1, 1, dark, .003);
    if (OPT.teeth) band(top, u=>Math.max(bot(u), top(u)-.06), -.88, .88, white, .006);
    const tg = new THREE.Mesh(ell(.09,.04,.02), C.M.tongue); tg.position.copy(P(0,-.4,.0)); tg.quaternion.setFromUnitVectors(Z, surfN(0,-.4,.95)); m.add(tg);
    if (OPT.teeth) for (const u of [-.5,-.17,.17,.5]) m.add(capTube([P(u,top(u),.009),P(u,top(u)-.058,.009)],.007,C.M.ink));
    line(top,-1.02,1.02); line(bot,-1,1,.02);
    for (const s of [-1,1]){ const u0=s*1.03; m.add(capTube([P(u0,top(u0),.008),P(s*1.12,top(u0)+.04,.008),P(s*1.12,top(u0)+.09,.008)],.015,C.M.ink)); }
  } else if (type==='o'){
    const o = new THREE.Mesh(ell(.075,.095,.03), dark); o.position.copy(P(0,-.33,.004)); o.quaternion.setFromUnitVectors(Z, surfN(0,-.33,.95)); m.add(o);
    const ring=[]; for(let i=0;i<=24;i++){const a=i/24*Math.PI*2; ring.push(P(Math.cos(a)*.075/W*1.0, -.33+Math.sin(a)*.095, .01));} m.add(capTube(ring,.02,C.M.ink));
  } else if (type==='grit'){
    const top=u=>-.26+.025*u*u, bot=u=>-.38+.025*u*u;
    band(top,bot,-.8,.8,white,.005);
    line(top,-.82,.82); line(bot,-.82,.82); line(u=>(top(u)+bot(u))/2,-.8,.8,.009,.009);
    for (const s of [-1,1]) m.add(capTube([P(s*.82,top(s*.82),.008),P(s*.85,(top(.82)+bot(.82))/2,.008),P(s*.82,bot(s*.82),.008)],.022,C.M.ink));
    for (const u of [-.55,-.28,0,.28,.55]) m.add(capTube([P(u,top(u),.009),P(u,bot(u),.009)],.008,C.M.ink));
  } else {
    const f = {smile:u=>-.29+.08*u*u, flat:u=>-.3+.008*u*u, frown:u=>-.34-.075*u*u+.075}[type];
    const span = type==='flat' ? .6 : type==='frown' ? .85 : .9;
    line(u=>f(u/span), -span, span, type==='frown'?.028:.022);
    if (type==='frown') for (const s of [-1,1]) m.add(capTube([P(s*span*1.0,f(1)+.0),P(s*span*1.1,f(1)-.035)], .016, C.M.ink));
  }
}

/* ---------- animación ---------- */
const tmp = new THREE.Matrix4();
function onBody(x,y,z,out=0){ const p = surf(x,y,z,out); C.bodyG.updateMatrix(); return p.applyMatrix4(C.bodyG.matrix); }
function armPts(S, H, bow){ const a=S.clone().lerp(H,.33).add(bow), b=S.clone().lerp(H,.66).add(bow.clone().multiplyScalar(.8)); return [S,a,b,H]; }
function placeGlove(g, pts, roll=0){ const end=pts[pts.length-1], prev=pts[pts.length-2]; const dir=end.clone().sub(prev).normalize(); g.position.copy(end); g.quaternion.setFromUnitVectors(Y, dir); g.rotateY(roll); }

let turnT = 0, turnFrom = 0, turnTo = 0, hopT = 1;
