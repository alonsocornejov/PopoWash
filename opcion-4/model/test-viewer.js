async page => {
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const nodeModulesRequests=[];page.on('request',r=>{if(r.url().includes('/node_modules/'))nodeModulesRequests.push(r.url());});
 const cdp=await page.context().newCDPSession(page);await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
 await page.setViewportSize({width:1440,height:960});await page.reload();await page.waitForFunction(()=>window.bidetViewer);
 await page.screenshot({path:'opcion-4/model/viewer-desktop.png'});
 const initial=await page.evaluate(()=>window.bidetViewer.getStats());
 const clickPoint=await page.evaluate(()=>{const v=window.bidetViewer,m=v.runtime.meshes.root,p=new m.position.constructor(0,-.2,.135);p.applyMatrix4(m.matrixWorld).project(v.camera);const r=v.renderer.domElement.getBoundingClientRect();return {x:r.left+(p.x+1)*r.width/2,y:r.top+(1-p.y)*r.height/2};});
 await page.mouse.click(clickPoint.x,clickPoint.y);
 if(await page.evaluate(()=>window.bidetViewer.getStats().selected)!=='root')throw Error('Canvas raycast selection failed');
 await page.getByRole('button',{name:'Separar piezas',exact:true}).click();
 const separated=await page.evaluate(()=>window.bidetViewer.getStats());
 if(!separated.exploded)throw Error('Explode control failed');
 await page.screenshot({path:'opcion-4/model/viewer-exploded.png'});
 await page.getByLabel('Seleccionar una pieza').selectOption('dial');
 if(await page.evaluate(()=>window.bidetViewer.getStats().selected)!=='dial')throw Error('Part selection failed');
 await page.getByRole('button',{name:'Restablecer vista',exact:true}).click();
 const reset=await page.evaluate(()=>window.bidetViewer.getStats());if(reset.exploded||reset.selected)throw Error('Reset failed');
 await page.getByRole('button',{name:'Reverso',exact:true}).click();await page.screenshot({path:'opcion-4/model/viewer-rear.png'});
 await page.getByRole('button',{name:'Frente',exact:true}).click();
 const canvas=page.locator('canvas');await canvas.focus();await page.keyboard.press('ArrowLeft');
 if(await page.evaluate(()=>window.bidetViewer.turntable.rotation.y)===0)throw Error('Keyboard rotation failed');
 await page.getByRole('button',{name:'Restablecer vista',exact:true}).click();
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'opcion-4/model/viewer-mobile.png',fullPage:true});
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);if(overflow)throw Error('Mobile horizontal overflow');
 if(errors.length)throw Error(errors.join('\n'));
 if(nodeModulesRequests.length)throw Error('Viewer still depends on node_modules');
 return {initial,separated,reset,mobileOverflow:overflow,pageErrors:errors,nodeModulesRequests,checks:['canvas-click','explode','select','reset','rear','keyboard','mobile','vendored-dependencies']};
}
