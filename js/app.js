/* app.js - Ruleta mejorada v2 */

const canvas = document.getElementById('wheel');
const ctx = canvas.getContext('2d');
let DPR = Math.max(1, window.devicePixelRatio || 1);

let slots = [];
let rotation = 0;
let angularVel = 0;
let spinning = false;
let lastResult = null;
let logoImg = null;
let bgColor = localStorage.getItem('wheelBgColor') || '#1a1a1a'; // Fondo personalizable

// Cargar logo central
function loadLogo() {
  logoImg = new Image();
  logoImg.src = 'assets/logo.png';
  logoImg.onerror = () => logoImg = null; // Si no existe, no se dibuja
  logoImg.onload = () => draw();
}

function resizeCanvas(){
  const wrapper = document.querySelector('.wheel-wrap');
  const size = Math.min(wrapper.clientWidth, wrapper.clientHeight);
  canvas.style.width = size + 'px';
  canvas.style.height = size + 'px';
  canvas.width = Math.floor(size * DPR);
  canvas.height = Math.floor(size * DPR);
  ctx.setTransform(DPR,0,0,DPR,0,0);
  draw();
}

window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', resizeCanvas);
document.addEventListener('DOMContentLoaded', resizeCanvas);

function draw(){
  const w = canvas.width / DPR, h = canvas.height / DPR;
  const cx = w/2, cy = h/2;
  const r = Math.min(w,h)/2 - 8;
  ctx.clearRect(0,0,w,h);

  if(slots.length === 0){
    ctx.fillStyle = '#f5f5f5';
    ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fill(); 
    return;
  }

  const n = slots.length;
  const seg = 2*Math.PI / n;

  // Sombra exterior
  const grad = ctx.createRadialGradient(cx,cy,r*0.2,cx,cy,r);
  grad.addColorStop(0,'rgba(255,255,255,0.04)');
  grad.addColorStop(1,'rgba(0,0,0,0.06)');
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.arc(cx,cy,r+6,0,Math.PI*2); ctx.fill();

  // Dibujar casilleros e imágenes
  for(let i=0; i<n; i++){
    const a0 = rotation + i*seg;
    const a1 = a0 + seg;
    
    // Casillero
    ctx.beginPath(); 
    ctx.moveTo(cx,cy); 
    ctx.arc(cx,cy,r,a0,a1); 
    ctx.closePath();
    ctx.fillStyle = (i%2)? '#fff8e1' : '#ffffff';
    ctx.fill();
    
    // Borde del casillero
    ctx.strokeStyle = 'rgba(139,0,0,0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();

    const s = slots[i];
    
    // Dibujar imagen DENTRO del casillero (sin superposición)
    if(s && s.objectURL){
      if(!s._img){ 
        s._img = new Image(); 
        s._img.src = s.objectURL; 
      }
      
      if(s._img.complete){
        ctx.save();
        
        // Crear región de recorte para el casillero (excluyendo centro)
        const innerRadius = r * 0.30; // Radio del centro (logo)
        ctx.beginPath();
        ctx.arc(cx, cy, r, a0, a1);
        ctx.arc(cx, cy, innerRadius, a1, a0, true);
        ctx.closePath();
        ctx.clip();
        
        // Calcular posición de la imagen
        const mid = (a0+a1)/2;
        const imgDist = innerRadius + (r - innerRadius) * 0.55; // Centro del área disponible
        const imgX = cx + Math.cos(mid) * imgDist;
        const imgY = cy + Math.sin(mid) * imgDist;
        
        // Tamaño de imagen que cabe en el casillero
        const availableRadius = (r - innerRadius) * 0.75;
        const segmentWidth = 2 * r * Math.sin(seg / 2) * 0.7; // Ancho del casillero
        const imgSize = Math.min(availableRadius * 1.4, segmentWidth);
        
        ctx.translate(imgX, imgY);
        ctx.rotate(mid + Math.PI/2);
        
        // Dibujar imagen manteniendo proporción
        const aspect = s._img.naturalWidth / s._img.naturalHeight;
        let drawW = imgSize;
        let drawH = imgSize;
        
        if(aspect > 1) {
          drawH = imgSize / aspect;
        } else {
          drawW = imgSize * aspect;
        }
        
        ctx.drawImage(s._img, -drawW/2, -drawH/2, drawW, drawH);
        ctx.restore();
      }
    }
    
    // NO dibujamos el título en la ruleta (se mantiene en secreto)
  }

  // Logo central (círculo blanco de fondo)
  const centerRadius = r * 0.28;
  ctx.beginPath(); 
  ctx.arc(cx, cy, centerRadius, 0, Math.PI*2); 
  ctx.fillStyle = '#ffffff'; 
  ctx.fill();
  ctx.strokeStyle = 'rgba(139,0,0,0.5)';
  ctx.lineWidth = 3;
  ctx.stroke();
  
  // Dibujar logo en el centro
  if(logoImg && logoImg.complete){
    const logoSize = centerRadius * 1.6;
    ctx.drawImage(logoImg, cx - logoSize/2, cy - logoSize/2, logoSize, logoSize);
  } else {
    // Texto alternativo si no hay logo
    ctx.fillStyle = '#8B0000';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('COER', cx, cy - 8);
    ctx.font = '11px Arial';
    ctx.fillText('MOQUEGUA', cx, cy + 8);
  }

  // Indicador/flecha
  ctx.fillStyle = '#8B0000'; 
  ctx.beginPath();
  ctx.moveTo(cx + r*0.9, cy); 
  ctx.lineTo(cx + r*1.06, cy-26); 
  ctx.lineTo(cx + r*1.06, cy+26); 
  ctx.closePath(); 
  ctx.fill();
}

function tick(){
  if(Math.abs(angularVel) > 0.0005){
    rotation += angularVel;
    angularVel *= 0.992;
    draw();
    requestAnimationFrame(tick);
  } else if(spinning){
    spinning = false;
    const ang = (2*Math.PI - (rotation % (2*Math.PI))) % (2*Math.PI);
    const idx = Math.floor(ang / (2*Math.PI / Math.max(1, slots.length))) % slots.length;
    lastResult = slots[idx] || null;
    
    // Mostrar vista previa automática al detenerse
    if(lastResult) {
      showPreview();
    }
  }
}

function spin(power = 0.6){
  if(spinning || slots.length === 0) return;
  angularVel = 0.35 + Math.random()*0.6 + power;
  spinning = true;
  lastResult = null; // Reset resultado anterior
  tick();
}

// Vista previa automática (solo imagen, sin nombre)
function showPreview() {
  const preview = document.getElementById('previewOverlay');
  const previewImg = document.getElementById('previewImg');
  
  if(lastResult && lastResult.objectURL) {
    previewImg.src = lastResult.objectURL;
    preview.classList.remove('hidden');
  }
}

// Botón girar
document.getElementById('spinBtn').addEventListener('click', ()=> {
  // Cerrar cualquier overlay abierto
  document.getElementById('previewOverlay').classList.add('hidden');
  document.getElementById('revealOverlay').classList.add('hidden');
  spin(0.6);
});

// Cerrar vista previa
document.getElementById('closePreview').addEventListener('click', ()=> {
  document.getElementById('previewOverlay').classList.add('hidden');
});

// Mostrar resultado CON NOMBRE (desde vista previa)
document.getElementById('revealBtnPreview').addEventListener('click', ()=> {
  if(!lastResult){ 
    alert('Primero debes girar la ruleta y esperar a que se detenga'); 
    return; 
  }
  
  // Cerrar preview y abrir reveal
  document.getElementById('previewOverlay').classList.add('hidden');
  
  const overlay = document.getElementById('revealOverlay');
  const img = document.getElementById('revealImg');
  const title = document.getElementById('revealTitle');
  
  img.src = lastResult.objectURL || '';
  title.textContent = lastResult.title || 'Premio Ganador';
  
  overlay.classList.remove('hidden');
});

document.getElementById('closeReveal').addEventListener('click', ()=> {
  document.getElementById('revealOverlay').classList.add('hidden');
});

// Sistema mejorado de marcar ganador
document.getElementById('markWin').addEventListener('click', ()=> {
  const personName = prompt('Ingrese el nombre del ganador:');
  if(personName && personName.trim()){
    const winner = {
      name: personName.trim(),
      prize: lastResult.title || 'Premio',
      date: new Date().toLocaleString('es-PE')
    };
    
    // Guardar en localStorage
    let winners = JSON.parse(localStorage.getItem('winners') || '[]');
    winners.push(winner);
    localStorage.setItem('winners', JSON.stringify(winners));
    
    alert(`¡${personName} ganó: ${winner.prize}!`);
    document.getElementById('revealOverlay').classList.add('hidden');
  }
});

// Pantalla completa
document.getElementById('fullscreenBtn').addEventListener('click', async ()=>{
  try{
    if(document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  }catch(e){ console.warn(e); }
});

// Botón ver ganadores (mejorado con más info)
document.getElementById('viewWinners')?.addEventListener('click', ()=> {
  const winners = JSON.parse(localStorage.getItem('winners') || '[]');
  if(winners.length === 0){
    alert('No hay ganadores registrados aún');
    return;
  }
  
  let msg = `🏆 LISTA DE GANADORES (${winners.length})\n`;
  msg += '═'.repeat(40) + '\n\n';
  winners.forEach((w, i) => {
    msg += `${i+1}. ${w.name}\n`;
    msg += `   🎁 ${w.prize}\n`;
    msg += `   📅 ${w.date}\n\n`;
  });
  msg += '\n💡 Puedes exportar esta lista en Configuración';
  alert(msg);
});

// Gestos táctiles
let down=false, sx=0, sy=0, st=0;
canvas.addEventListener('pointerdown', e=>{ 
  down=true; sx=e.clientX; sy=e.clientY; st=performance.now(); 
  canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId); 
});

canvas.addEventListener('pointerup', e=>{ 
  if(!down) return; 
  down=false; 
  const dx=e.clientX-sx, dy=e.clientY-sy; 
  const dist=Math.sqrt(dx*dx+dy*dy); 
  const dt=performance.now()-st; 
  const speed = dist/Math.max(1,dt); 
  const power = Math.min(1.8, speed*0.02 + Math.random()*0.15); 
  if(dist<6) spin(0.45); 
  else spin(power); 
  canvas.releasePointerCapture && canvas.releasePointerCapture(e.pointerId); 
});

// Normalizar imagen a blob
async function fileToBlobNormalized(file, size=1024){
  return new Promise((resolve,reject)=>{
    const reader = new FileReader();
    reader.onload = async ()=>{
      const img = new Image();
      img.onload = ()=>{
        const canvasOff = document.createElement('canvas');
        canvasOff.width = size; canvasOff.height = size;
        const c = canvasOff.getContext('2d');
        c.fillStyle = '#ffffff'; 
        c.fillRect(0,0,size,size);
        const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
        const r = Math.min(size/iw, size/ih);
        const nw = iw * r, nh = ih * r;
        c.drawImage(img, (size-nw)/2, (size-nh)/2, nw, nh);
        canvasOff.toBlob(blob => resolve({ blob, preview: canvasOff.toDataURL('image/png') }), 'image/png', 0.92);
      };
      img.onerror = ()=> reject(new Error('Error al cargar imagen'));
      img.src = reader.result;
    };
    reader.onerror = ()=> reject(new Error('Error al leer archivo'));
    reader.readAsDataURL(file);
  });
}

// Modal de configuración
const configBtn = document.getElementById('configBtn');
const configModal = document.getElementById('configModal');
const closeConfig = document.getElementById('closeConfig');
const addSlotBtn = document.getElementById('addSlotBtn');
const clearBtn = document.getElementById('clearBtn');
const slotsGrid = document.getElementById('slotsGrid');
const saveConfig = document.getElementById('saveConfig');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const importFile = document.getElementById('importFile');

configBtn.addEventListener('click', async ()=>{ 
  configModal.classList.remove('hidden'); 
  await renderSlots();
  // Actualizar el valor del color picker al abrir el modal
  const picker = document.getElementById('bgColorPicker');
  if(picker) picker.value = bgColor;
});

closeConfig.addEventListener('click', ()=> configModal.classList.add('hidden'));
configModal.addEventListener('click', (e)=>{ 
  if(e.target===configModal) configModal.classList.add('hidden'); 
});

addSlotBtn.addEventListener('click', ()=> openFilePicker(null));

clearBtn.addEventListener('click', async ()=>{ 
  if(confirm('¿Borrar todos los casilleros?')){ 
    await window.ruletaStorage.clearAll(); 
    slots=[]; 
    renderSlots(); 
    draw(); 
  } 
});

saveConfig.addEventListener('click', ()=>{ configModal.classList.add('hidden'); });

// Cambiar color de fondo
document.getElementById('bgColorPicker')?.addEventListener('input', (e) => {
  bgColor = e.target.value;
  localStorage.setItem('wheelBgColor', bgColor);
  draw();
});

// Restaurar color predeterminado
document.getElementById('resetBgColor')?.addEventListener('click', () => {
  bgColor = '#1a1a1a';
  localStorage.setItem('wheelBgColor', bgColor);
  const picker = document.getElementById('bgColorPicker');
  if(picker) picker.value = bgColor;
  draw();
});

// Exportar lista de ganadores
document.getElementById('exportWinners')?.addEventListener('click', () => {
  const winners = JSON.parse(localStorage.getItem('winners') || '[]');
  if(winners.length === 0) {
    alert('No hay ganadores para exportar');
    return;
  }
  
  // Crear CSV
  let csv = 'Nombre,Premio,Fecha\n';
  winners.forEach(w => {
    csv += `"${w.name}","${w.prize}","${w.date}"\n`;
  });
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `ganadores_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  
  alert(`✅ Lista de ${winners.length} ganadores exportada`);
});

// Limpiar lista de ganadores
document.getElementById('clearWinners')?.addEventListener('click', () => {
  const winners = JSON.parse(localStorage.getItem('winners') || '[]');
  if(winners.length === 0) {
    alert('No hay ganadores para eliminar');
    return;
  }
  
  if(confirm(`¿Estás seguro de eliminar los ${winners.length} ganadores registrados?\n\n⚠️ Esta acción no se puede deshacer.`)) {
    localStorage.removeItem('winners');
    alert('✅ Lista de ganadores eliminada');
  }
});

exportBtn.addEventListener('click', async ()=>{
  const data = await window.ruletaStorage.getSlots();
  const exportData = data.map(s => ({
    id: s.id,
    title: s.title,
    imageDataURL: s.objectURL
  }));
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(exportData, null, 2)], {type:'application/json'}));
  a.download = 'ruleta_config.json';
  document.body.appendChild(a); 
  a.click(); 
  a.remove();
});

importBtn.addEventListener('click', ()=> importFile.click());

importFile.addEventListener('change', async (e)=>{
  const f = e.target.files[0]; 
  if(!f) return;
  const txt = await f.text(); 
  try{ 
    const arr = JSON.parse(txt); 
    if(Array.isArray(arr)){
      await window.ruletaStorage.clearAll();
      for(const it of arr){
        if(it.imageDataURL){ 
          const res = await fetch(it.imageDataURL); 
          const b = await res.blob(); 
          it.imageBlob = b; 
          delete it.imageDataURL; 
        }
        await window.ruletaStorage.putSlot(it);
      }
      slots = await window.ruletaStorage.getSlots();
      slots = slots.map(s=>{ 
        if(s.imageBlob) s.objectURL = URL.createObjectURL(s.imageBlob); 
        return s; 
      });
      renderSlots(); 
      draw(); 
      alert('Importado correctamente'); 
      configModal.classList.add('hidden');
    }
  }catch(ex){ 
    alert('Error al importar: ' + ex.message); 
  }
});

function openFilePicker(id){
  const inp = document.createElement('input'); 
  inp.type='file'; 
  inp.accept='image/*';
  inp.onchange = async (ev)=>{
    const f = ev.target.files[0]; 
    if(!f) return;
    
    const title = prompt('Ingrese el nombre del premio:', '');
    if(!title) return;
    
    const {blob, preview} = await fileToBlobNormalized(f, 1400);
    
    if(id){
      const dbSlots = await window.ruletaStorage.getSlots();
      const existing = dbSlots.find(s=>s.id==id);
      if(existing){ 
        existing.imageBlob = blob;
        existing.title = title;
        await window.ruletaStorage.putSlot(existing); 
      } else { 
        await window.ruletaStorage.putSlot({imageBlob:blob, title:title}); 
      }
    } else {
      await window.ruletaStorage.putSlot({imageBlob:blob, title:title});
    }
    
    slots = await window.ruletaStorage.getSlots();
    slots = slots.map(s=>{ 
      if(s.imageBlob) s.objectURL = URL.createObjectURL(s.imageBlob); 
      return s; 
    });
    await renderSlots(); 
    draw();
  };
  inp.click();
}

async function renderSlots(){
  slotsGrid.innerHTML = '';
  const dbSlots = await window.ruletaStorage.getSlots();
  slots = dbSlots.map(s=>{ 
    if(s.imageBlob) s.objectURL = URL.createObjectURL(s.imageBlob); 
    return s; 
  });
  
  if(slots.length === 0){
    for(let i=0;i<8;i++){ 
      await window.ruletaStorage.putSlot({title: `Premio ${i+1}`}); 
    }
    slots = await window.ruletaStorage.getSlots();
    slots = slots.map(s=>{ 
      if(s.imageBlob) s.objectURL = URL.createObjectURL(s.imageBlob); 
      return s; 
    });
  }
  
  for(const s of slots){
    const card = document.createElement('div'); 
    card.className='slot-card';
    
    const thumb = document.createElement('div'); 
    thumb.className='slot-thumb';
    const img = document.createElement('img'); 
    img.src = s.objectURL || '';
    thumb.appendChild(img);
    
    const titleDiv = document.createElement('div');
    titleDiv.className = 'slot-title';
    titleDiv.textContent = s.title || 'Sin nombre';
    
    const meta = document.createElement('div'); 
    meta.style.marginTop='8px'; 
    meta.style.display='flex'; 
    meta.style.justifyContent='space-between'; 
    meta.style.alignItems='center';
    
    const idspan = document.createElement('div'); 
    idspan.className='muted'; 
    idspan.textContent = 'ID: ' + (s.id||'-');
    
    const actions = document.createElement('div');
    const editBtn = document.createElement('button'); 
    editBtn.className='small'; 
    editBtn.textContent='Editar'; 
    editBtn.addEventListener('click', ()=> openFilePicker(s.id));
    
    const delBtn = document.createElement('button'); 
    delBtn.className='small ghost'; 
    delBtn.textContent='Eliminar'; 
    delBtn.addEventListener('click', async ()=>{ 
      if(confirm('¿Eliminar este casillero?')){ 
        await window.ruletaStorage.delSlot(s.id); 
        await renderSlots(); 
        slots = await window.ruletaStorage.getSlots(); 
        slots = slots.map(s=>{ 
          if(s.imageBlob) s.objectURL = URL.createObjectURL(s.imageBlob); 
          return s; 
        }); 
        draw(); 
      } 
    });
    
    actions.appendChild(editBtn); 
    actions.appendChild(delBtn);
    meta.appendChild(idspan); 
    meta.appendChild(actions);
    
    card.appendChild(thumb); 
    card.appendChild(titleDiv);
    card.appendChild(meta);
    slotsGrid.appendChild(card);
  }
}

// Inicialización
(async function init(){
  loadLogo();
  
  // Cargar color de fondo guardado
  const picker = document.getElementById('bgColorPicker');
  if(picker) picker.value = bgColor;
  
  slots = await window.ruletaStorage.getSlots().catch(()=>[]);
  if(!slots || slots.length===0){
    for(let i=0;i<8;i++){ 
      await window.ruletaStorage.putSlot({title: `Premio ${i+1}`}); 
    }
    slots = await window.ruletaStorage.getSlots();
  }
  slots = slots.map(s=>{ 
    if(s.imageBlob) s.objectURL = URL.createObjectURL(s.imageBlob); 
    return s; 
  });
  resizeCanvas();
  draw();
})();