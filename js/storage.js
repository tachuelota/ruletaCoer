(function(window){
  const DB_NAME = 'ruleta_final_db';
  const STORE = 'slots';
  function openDB(){ return new Promise((res,rej)=>{ const r = indexedDB.open(DB_NAME,1); r.onupgradeneeded = e => { const db = e.target.result; if(!db.objectStoreNames.contains(STORE)){ db.createObjectStore(STORE,{ keyPath:'id', autoIncrement:true }); } }; r.onsuccess=()=>res(r.result); r.onerror=()=>rej(r.error); }); }
  async function getSlots(){ const db = await openDB(); return new Promise((res,rej)=>{ const tx = db.transaction(STORE,'readonly'); const req = tx.objectStore(STORE).getAll(); req.onsuccess=()=>{ const arr = req.result||[]; const mapped = arr.map(s=>{ const o = Object.assign({}, s); if(o.imageBlob) o.objectURL = URL.createObjectURL(o.imageBlob); return o; }); res(mapped); }; req.onerror=()=>rej(req.error); }); }
  async function putSlot(obj){ const db = await openDB(); return new Promise((res,rej)=>{ const tx = db.transaction(STORE,'readwrite'); const store = tx.objectStore(STORE); const req = obj.id? store.put(obj): store.add(obj); req.onsuccess=()=>res(req.result); req.onerror=()=>rej(req.error); }); }
  async function delSlot(id){ const db = await openDB(); return new Promise((res,rej)=>{ const tx = db.transaction(STORE,'readwrite'); tx.objectStore(STORE).delete(id).onsuccess=()=>res(); tx.onerror=()=>rej(tx.error); }); }
  async function clearAll(){ const db = await openDB(); return new Promise((res,rej)=>{ const tx = db.transaction(STORE,'readwrite'); tx.objectStore(STORE).clear().onsuccess=()=>res(); tx.onerror=()=>rej(tx.error); }); }
  window.ruletaStorage = { getSlots, putSlot, delSlot, clearAll };
})(window);
