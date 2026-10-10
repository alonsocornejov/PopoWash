import * as THREE from 'three';

// Object coordinates: mounting footprint in XY, upper face +Z.
// Staged reconstruction refinements; decisions are persisted in bidet-spec.json.
export function refineGeometry(runtime,stage='blockout') {
  const {meshes, nodes}=runtime;
  const params=meshes.root?.userData.sculptComponent.geometryDescriptor.reconstructionRefinement;
  const replace=(id, geometry)=>{const m=meshes[id];if(!m)return;m.geometry.dispose();m.geometry=geometry;};
  const slot=(cx,cy)=>{
    const p=new THREE.Path(),r=.05,l=.20;
    p.moveTo(cx-r,cy-l);p.lineTo(cx-r,cy+l);
    p.absarc(cx,cy+l,r,Math.PI,0,true);p.lineTo(cx+r,cy-l);
    p.absarc(cx,cy-l,r,0,-Math.PI,true);return p;
  };
  const plate=meshes.root;
  if(plate){
    const profile=plate.userData.sculptComponent.geometryDescriptor.profile2D;
    const s=new THREE.Shape();
    // Continuous lobe joins; interpolating independently expanded points introduced notches.
    if(params){
      s.moveTo(-1.48,-.37);s.lineTo(1.39,-.37);s.quadraticCurveTo(1.52,-.37,1.52,-.22);
      s.lineTo(1.47,.31);s.bezierCurveTo(1.45,.58,1.27,.80,.97,.80);
      s.bezierCurveTo(.69,.80,.49,.59,.48,.32);s.quadraticCurveTo(.46,.14,.31,.14);
      s.lineTo(-.35,.14);s.quadraticCurveTo(-.47,.14,-.49,.32);
      s.bezierCurveTo(-.50,.61,-.70,.80,-.98,.80);s.bezierCurveTo(-1.27,.80,-1.48,.58,-1.48,.30);s.closePath();
    }else{s.setFromPoints(profile.points.map(p=>new THREE.Vector2(...p)));}
    s.holes.push(slot(-.98,.27),slot(.97,.27));
    replace('root',new THREE.ExtrudeGeometry(s,{depth:.12,steps:1,bevelEnabled:true,bevelSize:.012,bevelThickness:.012,bevelSegments:3,curveSegments:48}));
  }
  for(const id of ['disc-a','disc-b']){
    const shape=new THREE.Shape();shape.absarc(0,0,params?.discRadius??.345,0,Math.PI*2,false);shape.holes.push(slot(0,0));
    replace(id,new THREE.ExtrudeGeometry(shape,{depth:.03,bevelEnabled:true,bevelSize:.008,bevelThickness:.008,bevelSegments:3,curveSegments:64}));
  }
  if(meshes['curved-arm']){
    const points=params?.armSpine??[[-1.30,-.28,.12],[-1.96,-.31,.12],[-1.86,-.86,.12],[-1.83,-1.475,.12]];
    const spine=new THREE.CubicBezierCurve3(...points.map(p=>new THREE.Vector3(...p)));
    const positions=[],normals=[],indices=[],rings=64,sides=32;
    // Superellipse sections give a molded rectangular shoulder becoming an oval barrel.
    for(let i=0;i<=rings;i++){
      const t=i/rings,c=spine.getPoint(t),d=spine.getTangent(t),side=new THREE.Vector3(-d.y,d.x,0).normalize();c.z-=.075*(1-THREE.MathUtils.smoothstep(t,0,.45));
      const width=.275,depth=.065+.205*THREE.MathUtils.smoothstep(t,.10,.93),power=2/(4-2*THREE.MathUtils.smoothstep(t,.25,.95));
      for(let j=0;j<=sides;j++){
        const a=j/sides*Math.PI*2,co=Math.cos(a),si=Math.sin(a);
        const u=Math.sign(co)*Math.pow(Math.abs(co),power)*width,v=Math.sign(si)*Math.pow(Math.abs(si),power)*depth;
        positions.push(c.x+side.x*u,c.y+side.y*u,c.z+v);
        if(i<rings&&j<sides){const k=i*(sides+1)+j;indices.push(k,k+1,k+sides+1,k+1,k+sides+2,k+sides+1);}
      }
    }
    // Close both sections; the distal section meets the chrome collar on the same axis.
    for(const [ring,reverse] of [[0,true],[rings,false]]){
      const center=spine.getPoint(ring/rings),ci=positions.length/3;positions.push(center.x,center.y,center.z);
      for(let j=0;j<sides;j++){const k=ring*(sides+1)+j;if(reverse)indices.push(ci,k+1,k);else indices.push(ci,k,k+1);}
    }
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();replace('curved-arm',g);
    nodes['curved-arm'].position.set(0,0,0);
  }
  // A true oval solid of revolution, with a straight Y axis shared by control and collar.
  if(meshes.dial){
    const pts=[[0,-.53],[.21,-.53],[.26,-.515],[.275,-.48],[.278,-.32],[.280,.32],[.274,.46],[.265,.485],[0,.485]].map(p=>new THREE.Vector2(...p));
    const g=new THREE.LatheGeometry(pts,64);g.scale(1,1,.83);replace('dial',g);
    if(params?.controlAxisAngle){nodes.dial.rotation.set(0,0,params.controlAxisAngle);nodes.dial.position.set(-2.08+Math.sin(.12)*.475,-1.475-Math.cos(.12)*.475,.12);}
  }
  if(meshes['chrome-collar']&&params){
    replace('chrome-collar',new THREE.CylinderGeometry(.276,.276,.055,64,1));
    nodes['chrome-collar'].position.set(-2.08,-1.475,.12);nodes['chrome-collar'].rotation.set(0,0,params.controlAxisAngle??0);
    meshes['chrome-collar'].position.set(0,0,0);meshes['chrome-collar'].quaternion.identity();
  }
  if(['form-refinement','material-pass','surface-pass','lighting-pass','interaction-pass','optimization-pass'].includes(stage)){
    const s=new THREE.Shape(),x=.225,y=.16,r=.035;
    s.moveTo(-x,-y+r);s.lineTo(-x,y-r);s.quadraticCurveTo(-x,y,-x+r,y);s.lineTo(x-r,y);s.quadraticCurveTo(x,y,x,y-r);
    s.lineTo(x,-y+r);s.quadraticCurveTo(x,-y,x-r,-y);s.lineTo(-x+r,-y);s.quadraticCurveTo(-x,-y,-x,-y+r);
    const g=new THREE.ExtrudeGeometry(s,{depth:.39,bevelEnabled:true,bevelSize:.025,bevelThickness:.025,bevelSegments:5,curveSegments:12});g.translate(0,0,-.195);replace('nozzle-housing',g);
    const addLine=(id,parent,points,radius)=>{
      if(!parent)return;
      const line=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),64,radius,6,false),new THREE.MeshStandardMaterial({color:0xaaaaaa,roughness:.5}));
      line.name=id;line.userData.explodeWithParent=true;line.userData.partId=parent.name;parent.add(line);
    };
    addLine('housing-panel-seam',meshes.root,[[-.45,-.11,.146],[-.1,-.10,.146],[.32,-.10,.146],[.40,-.13,.146],[.44,-.34,.146]],.002);
    const end=[];for(let i=0;i<=64;i++){const a=i/64*Math.PI*2;end.push([.215*Math.cos(a),-.532,.171*Math.sin(a)]);}
    addLine('dial-end-inset',meshes.dial,end,.0025);
  }
  if(['material-pass','surface-pass','lighting-pass','interaction-pass','optimization-pass'].includes(stage)){
    const size=1024,rough=new Uint8Array(size*size*4),normal=new Uint8Array(size*size*4);
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){
      const k=(y*size+x)*4;
      // Separate smooth finish signals; no photographed lighting in albedo.
      const r=250+Math.round(4*Math.sin(x*.087+y*.053)*Math.cos(y*.031));
      rough.set([r,r,r,255],k);
      normal.set([128+Math.round(Math.sin(x*.16)*Math.cos(y*.11)),128+Math.round(Math.sin(y*.17)*Math.cos(x*.09)),255,255],k);
    }
    const roughMap=new THREE.DataTexture(rough,size,size),normalMap=new THREE.DataTexture(normal,size,size);
    for(const map of [roughMap,normalMap]){map.colorSpace=THREE.NoColorSpace;map.wrapS=map.wrapT=THREE.RepeatWrapping;map.needsUpdate=true;}
    for(const [id,mesh] of Object.entries(meshes)){
      const mat=mesh.material;
      if(id==='chrome-collar'){mat.color.set('#c6c9cf');mat.metalness=1;mat.roughness=.13;mat.envMapIntensity=1.35;}
      else {mat.color.set('#f2f2f2');mat.metalness=0;mat.roughness=.24;mat.roughnessMap=roughMap;mat.normalMap=normalMap;mat.normalScale.setScalar(.015);mat.clearcoat=.25;mat.clearcoatRoughness=.18;}
      if(!mesh.geometry.attributes.uv){const p=mesh.geometry.attributes.position;const uv=[];for(let i=0;i<p.count;i++)uv.push(p.getX(i),p.getY(i));mesh.geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));}
      mat.needsUpdate=true;
    }
  }
  if(['surface-pass','lighting-pass','interaction-pass','optimization-pass'].includes(stage)){
    // Approximate printed artwork, explicitly distinguished from scanned source pixels.
    const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=1024;const ctx=canvas.getContext('2d');
    ctx.fillStyle='#47474b';ctx.textAlign='center';ctx.font='500 165px Arial';ctx.fillText('POPO',512,355);
    ctx.font='500 108px Arial';ctx.fillText('WASH',512,460);
    ctx.strokeStyle='#786c9e';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(305,490);ctx.quadraticCurveTo(535,540,718,462);ctx.stroke();
    ctx.font='45px Arial';ctx.fillStyle='#df292e';ctx.fillText('OFF',512,756);
    for(let i=0;i<9;i++){ctx.fillStyle=i===4?'#df292e':'#55555a';ctx.beginPath();ctx.arc(110+i*100,835, i===4?18:12,0,Math.PI*2);ctx.fill();}
    const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=8;
    const material=new THREE.MeshStandardMaterial({map:tex,transparent:true,roughness:.5,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});
    const spine=new THREE.CubicBezierCurve3(...params.armSpine.map(p=>new THREE.Vector3(...p))),pos=[],uv=[],ind=[],rows=32,cols=20;
    for(let i=0;i<=rows;i++)for(let j=0;j<=cols;j++){
      const t=.61+i/rows*.38,a=.9+j/cols*1.34,c=spine.getPoint(t),d=spine.getTangent(t),side=new THREE.Vector3(-d.y,d.x,0).normalize();
      const power=2/(4-2*THREE.MathUtils.smoothstep(t,.25,.95));
      const co=Math.cos(a),si=Math.sin(a),u=Math.sign(co)*Math.pow(Math.abs(co),power)*.275,v=Math.sign(si)*Math.pow(Math.abs(si),power)*(.065+.205*THREE.MathUtils.smoothstep(t,.10,.93));
      pos.push(c.x+side.x*u,c.y+side.y*u,c.z+v+.0015);uv.push(1-j/cols,1-i/rows);
      if(i<rows&&j<cols){const k=i*(cols+1)+j;ind.push(k,k+1,k+cols+1,k+1,k+cols+2,k+cols+1);}
    }
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(ind);g.computeVertexNormals();
    const decal=new THREE.Mesh(g,material);decal.name='control-print';decal.userData.explodeWithParent=true;decal.userData.partId='curved-arm';meshes['curved-arm'].add(decal);
    const notch=new THREE.Mesh(new THREE.BoxGeometry(.012,.08,.003),new THREE.MeshStandardMaterial({color:'#737378',roughness:.45}));notch.position.set(0,.39,.232);notch.name='dial-position-mark';notch.userData.explodeWithParent=true;notch.userData.partId='dial';meshes.dial.add(notch);
  }
}
