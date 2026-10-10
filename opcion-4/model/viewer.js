import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {createPopoWashMechanicalBidetModel,createPopoWashMechanicalBidetEnvironment} from './createBidet.js?v=20261009';

const studio=document.querySelector('#studio'),status=document.querySelector('#status'),select=document.querySelector('#parts'),info=document.querySelector('#part-info');
const names={root:'Placa de montaje','curved-arm':'Brazo lateral','disc-a':'Disco de montaje izquierdo','disc-b':'Disco de montaje derecho',dial:'Mando de regulación','nozzle-housing':'Carcasa de las boquillas','chrome-collar':'Collar cromado','nozzle-a':'Boquilla A','nozzle-b':'Boquilla B'};
const descriptions={root:'Placa delgada con dos ranuras para el montaje.', 'curved-arm':'Brazo lateral continuo, situado a la izquierda del producto.',dial:'Mando recto de regulación. Las marcas impresas están recreadas de forma aproximada.','nozzle-housing':'Carcasa central con dos boquillas en su parte inferior.','chrome-collar':'Anillo metálico que rodea la unión del mando.'};
try{
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.8;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 const scene=new THREE.Scene();scene.environment=createPopoWashMechanicalBidetEnvironment(renderer);scene.environmentIntensity=.8;
 const camera=new THREE.PerspectiveCamera(37,1,.05,40);camera.up.set(0,1,0);
 const model=createPopoWashMechanicalBidetModel({textureSize:1024}),runtime=model.userData.sculptRuntime;
 model.position.sub(new THREE.Box3().setFromObject(model).getCenter(new THREE.Vector3()));const turntable=new THREE.Group();turntable.rotation.z=.06;turntable.add(model);scene.add(turntable);
 scene.add(new THREE.HemisphereLight(0xffffff,0x737782,.45));
 const key=new THREE.DirectionalLight(0xffffff,2);key.position.set(-3,5,6);key.castShadow=true;key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-4,right:4,top:4,bottom:-4,near:.5,far:30});key.shadow.normalBias=.01;key.shadow.radius=5;scene.add(key);
 const fill=new THREE.DirectionalLight(0xe8eeff,.35);fill.position.set(4,1,3);scene.add(fill);const rim=new THREE.DirectionalLight(0xffffff,.7);rim.position.set(0,2,-4);scene.add(rim);
 // A neutral studio backdrop behind the model; the shadow is actual WebGL geometry.
 const ground=new THREE.Mesh(new THREE.PlaneGeometry(30,30),new THREE.MeshStandardMaterial({color:'#e3e5e4',roughness:.95}));ground.position.z=-1.05;ground.receiveShadow=true;scene.add(ground);
 const originals=new Map(),materials=new Map();Object.entries(runtime.meshes).forEach(([id,m])=>{originals.set(id,m.position.clone());materials.set(id,m.material);select.add(new Option(names[id]||id,id));});
 model.traverse(o=>{if(o.isMesh){o.castShadow=!o.material.transparent;o.receiveShadow=true;}});
 studio.querySelector('.fallback').remove();studio.prepend(renderer.domElement);renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('aria-label','Modelo 3D. Arrastra para girar; flechas del teclado para cambiar el ángulo.');status.textContent='';
 const controls=new OrbitControls(camera,renderer.domElement);controls.enablePan=false;controls.minDistance=3;controls.maxDistance=13;controls.enableDamping=false;
 let exploded=false,selected='',selectionMaterial=null;
 function render(){renderer.render(scene,camera);}
 function size(){const w=studio.clientWidth,h=studio.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();render();}
 function clearSelection(){if(selected)runtime.meshes[selected].material=materials.get(selected);selectionMaterial?.dispose();selectionMaterial=null;selected='';}
 function choose(id){clearSelection();if(id&&runtime.meshes[id]){selected=id;selectionMaterial=materials.get(id).clone();selectionMaterial.emissive.set('#176484');selectionMaterial.emissiveIntensity=.18;runtime.meshes[id].material=selectionMaterial;info.textContent=names[id]+'. '+(descriptions[id]||'Pieza reconstruida a partir de las fotografías del producto.');}else info.textContent='Arrastra para girar. Usa la rueda o dos dedos para acercarte.';select.value=id;render();}
 function view(id){turntable.rotation.y=0;turntable.rotation.z=.06;controls.target.set(0,0,0);camera.position.set(...({front:[-.5,-2,8.4],left:[-5,-1.7,6.5],rear:[.5,-1.6,-8.4],detail:[-2.2,-1.2,3.4]}[id]||[-.5,-2,8.4]));if(id==='detail'){controls.target.set(-1.1,-.7,0);camera.position.set(-1.3,-1.2,3.6);}controls.update();ground.visible=id==='front'&&!exploded;document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===id)));render();}
 const offsets={root:[0,0,0],'curved-arm':[-.55,-.15,.4],'disc-a':[-.12,.3,.9],'disc-b':[.12,.3,.9],dial:[-.8,-.8,.5],'chrome-collar':[-.55,-.4,.45],'nozzle-housing':[.1,-.35,-.5],'nozzle-a':[-.12,-.55,-.8],'nozzle-b':[.22,-.55,-.8]};
 function explode(value){exploded=value;Object.entries(runtime.meshes).forEach(([id,m])=>m.position.copy(originals.get(id)).addScaledVector(new THREE.Vector3(...offsets[id]),value?1:0));ground.visible=!value;document.querySelector('#explode').textContent=value?'Unir piezas':'Separar piezas';document.querySelector('#explode').setAttribute('aria-pressed',String(value));render();}
 controls.addEventListener('change',()=>{ground.visible=false;render();});
 document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>view(b.dataset.view)));document.querySelector('#explode').addEventListener('click',()=>explode(!exploded));document.querySelector('#reset').addEventListener('click',()=>{choose('');explode(false);view('front');});select.addEventListener('change',()=>choose(select.value));
 const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();let down=null;
 renderer.domElement.addEventListener('pointerdown',e=>down=[e.clientX,e.clientY]);renderer.domElement.addEventListener('pointerup',e=>{if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>5)return;const rect=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(pointer,camera);const hit=ray.intersectObject(model,true).find(h=>!h.object.material.transparent);let obj=hit?.object;while(obj&&!Object.values(runtime.meshes).includes(obj))obj=obj.parent;choose(obj?Object.entries(runtime.meshes).find(([,m])=>m===obj)[0]:'');});
 renderer.domElement.addEventListener('keydown',e=>{const delta={ArrowLeft:-.12,ArrowRight:.12,ArrowUp:-.12,ArrowDown:.12}[e.key];if(delta===undefined)return;e.preventDefault();if(e.key==='ArrowLeft'||e.key==='ArrowRight')turntable.rotation.y+=delta;else turntable.rotation.x+=delta;ground.visible=false;render();});
 new ResizeObserver(size).observe(studio);size();view('front');
 window.bidetViewer={renderer,scene,camera,model,runtime,controls,turntable,render,view,choose,explode,getStats:()=>({triangles:renderer.info.render.triangles,calls:renderer.info.render.calls,parts:Object.keys(runtime.meshes).length,exploded,selected})};
}catch(error){status.textContent='No se pudo iniciar la vista 3D. Puedes ver la fotografía del producto.';console.error(error);}
