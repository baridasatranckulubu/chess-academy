/* Barida Pet Academy: original procedural 3D companions, room and motion. */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
const palette={
 lion:['#f5a947','#a75323','#f7cf85'],rabbit:['#f2dfd8','#b9909a','#fff5ed'],
 squirrel:['#d77d43','#8d4427','#f8d8b5'],tiger:['#efad55','#4d3027','#fff0cb'],
 turtle:['#8ec66b','#477b4b','#c5df9c'],panda:['#f6f4ed','#292a32','#fefaf3'],
 fox:['#e78443','#a74727','#fff1d9'],wolf:['#b8c2d1','#68748c','#e4e9ed'],
 deer:['#c98c58','#885534','#f5d7b0'],dragon:['#65bc8a','#317f79','#a5e8b8']
};
const mats=(a)=>new THREE.MeshStandardMaterial({color:a,roughness:.73,metalness:.02});
function ball(g,x,y,z,sx,sy,sz,color){const mesh=new THREE.Mesh(new THREE.SphereGeometry(1,24,16),mats(color));mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);g.add(mesh);return mesh}
function cone(g,x,y,z,r,h,color,rot=0){const mesh=new THREE.Mesh(new THREE.ConeGeometry(r,h,9),mats(color));mesh.position.set(x,y,z);mesh.rotation.z=rot;g.add(mesh);return mesh}
function tube(g,points,r,color){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,24,r,9,false),mats(color));g.add(mesh);return mesh}
function makeAnimal(type,stage=0,armor=0){
 const colors=palette[type]||palette.lion,[main,dark,cream]=colors;
 const root=new THREE.Group(),body=new THREE.Group(),head=new THREE.Group();root.add(body);body.add(head);
 ball(body,0,1.03,0,.66,.72,.51,main);ball(body,0,.96,.48,.4,.47,.12,cream);
 const paw=[];for(const x of [-.43,.43])for(const z of [-.34,.42]){const p=ball(body,x,.44,z,.25,.37,.29,main);paw.push(p)}
 head.position.set(0,1.93,.22);
 if(type==='lion'){for(let i=0;i<17;i++){let t=i*Math.PI*2/17;ball(head,Math.cos(t)*.67,Math.sin(t)*.67,0,.31,.37,.32,dark)}}
 if(type==='panda'){ball(head,-.35,.18,.64,.27,.32,.08,dark);ball(head,.35,.18,.64,.27,.32,.08,dark)}
 ball(head,0,0,0,.76,.68,.65,main);
 if(type==='tiger'){for(let i=-1;i<=1;i++)cone(head,i*.28,.48,.48,.11,.32,dark,Math.PI)}
 if(type==='rabbit'){for(const x of [-.44,.44]){ball(head,x,.86,-.05,.23,.74,.18,main);ball(head,x,.88,.12,.13,.54,.06,'#efb2b6')}}
 else if(type==='deer'){for(const x of [-.5,.5]){ball(head,x,.59,0,.25,.3,.18,main);tube(head,[[x,.64,0],[x*1.3,1.15,0],[x*1.8,1.55,0]],.065,dark);tube(head,[[x*1.3,1.15,0],[x*.8,1.5,0]],.045,dark)}}
 else if(type==='dragon'){for(const x of [-.43,.43])cone(head,x,.66,0,.19,.65,'#efdc9e',x*.3)}
 else for(const x of [-.58,.58]){ball(head,x,.52,0,.27,.32,.22,type==='panda'?dark:main);ball(head,x,.54,.17,.14,.18,.055,'#d99a9e')}
 if(type==='fox'||type==='wolf')for(const x of [-.54,.54])cone(head,x,.72,0,.28,.59,main,x*.24);
 for(const x of [-.3,.3]){
  ball(head,x,.06,.58,.24,.3,.13,'#fff9ed');
  ball(head,x,.06,.7,.145,.2,.085,type==='deer'?'#69432b':'#7d5334');
  ball(head,x-.055,.13,.775,.055,.072,.025,'#fff');
 }
 ball(head,0,-.28,.54,.48,.3,.25,cream);ball(head,0,-.17,.79,.15,.105,.11,dark);
 tube(head,[[-.25,-.35,.76],[0,-.42,.81],[.25,-.35,.76]],.027,'#784f46');
 if(type==='squirrel'){ball(body,.72,1.45,-.55,.36,.72,.32,dark);ball(body,.86,1.92,-.52,.4,.48,.29,main)}
 else if(type==='turtle'){ball(body,0,1.2,-.37,.81,.65,.4,dark);ball(body,0,1.27,-.69,.6,.47,.11,'#8eaa5b')}
 else if(type==='dragon'){for(let i=0;i<5;i++)cone(body,0,1.8-i*.27,-.48,.17,.3,'#e5c879');for(const x of [-1,1]){let wing=new THREE.Mesh(new THREE.ConeGeometry(.65,1.4,3),mats('#4c9b91'));wing.position.set(x*.9,1.45,-.38);wing.rotation.z=x*.7;body.add(wing)}}
 else tube(body,[[.44,.91,-.42],[.82,1.3,-.76],[.87,1.72,-.9]],type==='lion'?.15:.18,type==='panda'?dark:main);
 if(type==='tiger')for(let i=0;i<4;i++){ball(body,Math.sin(i*2)*.52,1.45-i*.24,.34,.09,.2,.055,dark)}
 if(armor>0){const steel=armor>2?'#51ba85':armor>1?'#d5a54a':'#b8c5d5';ball(body,0,1.15,.49,.5,.35,.19,steel);ball(body,0,1.2,.7,.16,.16,.06,'#e6d385');for(const x of [-.61,.61])ball(body,x,1.35,.08,.24,.21,.27,steel)}
 const scale=[1,1.2,1.45,1.75][Math.max(0,Math.min(3,stage))];root.scale.setScalar(scale);return {root,body,head,paw};
}
function room(scene,variant){
 const themes=[['#392e4c','#77543b'],['#2d594a','#78583c'],['#222a59','#49537c'],['#604634','#806148'],['#1f4563','#6b503d'],['#59364b','#765139'],['#324768','#786348'],['#435e70','#9d836d'],['#425e47','#79623d'],['#62516a','#986c4a']];
 const [wall,floor]=themes[variant%themes.length];scene.background=new THREE.Color(wall);
 const ground=new THREE.Mesh(new THREE.PlaneGeometry(30,30),mats(floor));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
 const back=new THREE.Mesh(new THREE.PlaneGeometry(30,12),mats(wall));back.position.set(0,5,-4);scene.add(back);
 const rug=new THREE.Mesh(new THREE.CylinderGeometry(2.4,2.4,.035,64),mats('#b89c71'));rug.position.set(0,.04,.3);scene.add(rug);
 const furniture=new THREE.Group();scene.add(furniture);
 // Chest, chess pieces and wall decoration are actual geometry in the scene.
 for(let x of [-3.5,3.5]){const stand=ball(furniture,x,.7,-2.6,.7,.7,.7,'#80522f');stand.scale.y=.6;cone(furniture,x,1.7,-2.6,.4,1.15,'#dfbc6b')}
 const bed=ball(furniture,-2.4,.5,-2.6,1.35,.38,.85,'#293e7a');ball(furniture,-2.6,.89,-2.5,.55,.18,.5,'#f5dcb1');
 const windowFrame=ball(furniture,2.3,2.8,-3.75,1.1,1.3,.12,'#b68d57');ball(furniture,2.3,2.8,-3.59,.87,1.05,.06,'#86c6e1');
 for(let i=0;i<4;i++){const x=-3.8+i*.55;cone(furniture,x,.55,-1.8,.16,.45,i%2?'#eee0a6':'#2d3d5b')}
}
export function mount(container,{animal='lion',stage=0,armor=0,roomIndex=0}={}){
 const scene=new THREE.Scene();room(scene,roomIndex);
 const camera=new THREE.PerspectiveCamera(36,1,.1,100);camera.position.set(0,2.55,9.8);camera.lookAt(0,1.4,0);
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));renderer.shadowMap.enabled=true;renderer.outputColorSpace=THREE.SRGBColorSpace;container.append(renderer.domElement);
 scene.add(new THREE.HemisphereLight('#fff3d8','#514361',2.2));const key=new THREE.DirectionalLight('#ffe2a2',3);key.position.set(-4,7,5);key.castShadow=true;scene.add(key);const fill=new THREE.PointLight('#90bafc',25,12);fill.position.set(4,4,2);scene.add(fill);
 const pet=makeAnimal(animal,stage,armor);scene.add(pet.root);
 let mixer=null,activeClip=null,realAsset=false,previousFrame=performance.now();
 const loader=new GLTFLoader();
 const assetUrl=animal==='fox'?'assets/pets/third-party/quaternius-fox.glb?v=20261020':('assets/pets/3d/'+encodeURIComponent(animal)+'.gltf?v=20261020-models1');
 loader.load(assetUrl,gltf=>{
  if(disposed)return;
  scene.remove(pet.root);
  const model=gltf.scene;
  if(animal==='fox'){
   realAsset=true;
   model.updateMatrixWorld(true);
   const bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3());
   const maxDim=Math.max(size.x,size.y,size.z,0.01),factor=2.8/maxDim;
   model.scale.setScalar(factor);
   model.updateMatrixWorld(true);
   const centered=new THREE.Box3().setFromObject(model);
   model.position.x-=(centered.min.x+centered.max.x)/2;
   model.position.z-=(centered.min.z+centered.max.z)/2;
   model.position.y-=centered.min.y;
   mixer=new THREE.AnimationMixer(model);
   const idle=gltf.animations.find(x=>/idle/i.test(x.name))||gltf.animations[0];
   if(idle){activeClip=mixer.clipAction(idle);activeClip.play()}
  }else model.scale.setScalar([1,1.2,1.45,1.75][Math.max(0,Math.min(3,stage))]);
  pet.root=model;pet.body=model.getObjectByName('Body')||model;pet.head=model.getObjectByName('Head')||pet.body;pet.paw=[];
  model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});
  scene.add(model);
 },undefined,e=>console.warn('Barida GLTF asset fallback',e));
 let motion='idle',motionAt=performance.now(),last=performance.now(),disposed=false;
 const resize=()=>{const w=container.clientWidth||600,h=container.clientHeight||400;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false)};const observer=new ResizeObserver(resize);observer.observe(container);resize();
 const motions=['idle','hop','turn','look','roll','sleep','stretch','wave','walk','dance','bow','shake','sit','peek','happy','sniff','spin','wiggle','rest','play','nod','bounce','pounce','yawn','scratch'];
 function tick(now){if(disposed)return;requestAnimationFrame(tick);if(!container.isConnected){dispose();return}if(document.hidden)return;const delta=Math.min((now-previousFrame)/1000,.1);previousFrame=now;if(mixer)mixer.update(delta);const t=now/1000,u=(now-motionAt)/1000;
 if(now-last>240000){motion=motions[Math.floor(Math.random()*motions.length)];motionAt=now;last=now}
 pet.root.position.set(0,0,0);pet.root.rotation.set(0,0,0);pet.body.rotation.set(0,0,0);pet.head.rotation.set(0,0,0);
 if(realAsset){renderer.render(scene,camera);return}pet.body.position.y=Math.sin(t*2)*.045;pet.head.rotation.z=Math.sin(t*1.4)*.06;
 if(['hop','bounce','pounce','dance','happy'].includes(motion))pet.root.position.y=Math.abs(Math.sin(t*4))*.42;
 if(['turn','spin','peek'].includes(motion))pet.root.rotation.y=Math.sin(t*.8)*1.2;
 if(['look','nod','shake'].includes(motion))pet.head.rotation.y=Math.sin(t*2)*.4;
 if(['roll','play'].includes(motion))pet.root.rotation.z=Math.sin(t*.9)*.65;
 if(['sleep','rest','sit'].includes(motion))pet.body.rotation.z=-.12;
 if(['walk','wiggle'].includes(motion)){pet.root.position.x=Math.sin(t*.9)*.55;pet.paw.forEach((p,i)=>p.position.y=.44+Math.sin(t*5+i*Math.PI)*.11)}
 if(['wave','scratch'].includes(motion))pet.paw[0].rotation.x=Math.sin(t*4)*.7;
 if(motion==='stretch'||motion==='yawn')pet.body.scale.y=1+Math.abs(Math.sin(t))*.15;else pet.body.scale.y=1;
 renderer.render(scene,camera);
 }requestAnimationFrame(tick);
 function dispose(){if(disposed)return;disposed=true;observer.disconnect();renderer.dispose();renderer.domElement.remove();scene.traverse(o=>{o.geometry?.dispose();if(o.material){const ms=Array.isArray(o.material)?o.material:[o.material];ms.forEach(m=>m.dispose())}})}return {play(name){motion=motions.includes(name)?name:'happy';motionAt=performance.now();last=motionAt;if(mixer){const clips=mixer._actions||[];const candidate=clips.find(a=>a._clip?.name?.toLowerCase().includes(name.toLowerCase()))||clips.find(a=>/idle/i.test(a._clip?.name||''));if(candidate&&candidate!==activeClip){activeClip?.fadeOut(.3);candidate.reset().fadeIn(.3).play();activeClip=candidate}}},dispose};
}
window.BaridaPet3D={mount};
