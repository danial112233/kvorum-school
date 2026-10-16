// A stand-in for the claude.ai artifact runtime (db, room, user, assets, sample), enough to run the page in a test browser.
(function(){
  var q = new URLSearchParams(location.search);
  try { if (!q.has("keep")) { localStorage.clear(); localStorage.setItem("chat.nick", q.get("nick")||"Сергей"); localStorage.setItem("chat.seen", String(Date.now()-3*60*1000)); if (q.get("look")) localStorage.setItem("chat.settings", JSON.stringify({look:q.get("look")})); } } catch(e){}
  var now = Date.now(), M = 60000, day = new Date(now).toISOString().slice(0,10);
  // an empty chat: tests/school-seed.js fills it
  var store = { msgs: {}, people: {}, brain: {}, channels: {}, voice: {}, voicetext: {}, jobs: {} };
  function fnv(str){ var x = 0x811c9dc5; for (var ch of str) { x ^= ch.codePointAt(0); x = Math.imul(x, 0x01000193) >>> 0; } return x >>> 0; }
  var subs = {};
  window.__writes = [];
  function snap(name){ var o = store[name]||{}; return {docs: Object.keys(o).map(function(id){ return {id:id, data:function(){return JSON.parse(JSON.stringify(o[id]));}}; })}; }
  function fire(name){ (subs[name]||[]).forEach(function(f){ setTimeout(function(){ f(snap(name)); },0); }); }
  function coll(name){ var c = { where:function(){return c;}, orderBy:function(){return c;}, limit:function(n){ if (!(n >= 1 && n <= 1000)) throw {code:"invalid_argument", message:"limit 1-1000"}; return c;},
      onSnapshot:function(ok){ (subs[name]=subs[name]||[]).push(ok); setTimeout(function(){ ok(snap(name)); },0); return function(){}; },
      get:function(){ return Promise.resolve(snap(name)); } }; return c; }
  var ro = q.get("ro") === "1";
  var deep = {}, deepSubs = {};
  window.__deep = deep;
  function deepDoc(p){ function fireD(){ (deepSubs[p]||[]).forEach(function(f){ setTimeout(function(){ f({id:p.split("/").pop(), exists: p in deep, data:function(){ return deep[p] ? JSON.parse(JSON.stringify(deep[p])) : undefined; }}); },0); }); }
    return { set:function(d){ if (ro) return Promise.reject({code:"invalid_argument"}); deep[p]=JSON.parse(JSON.stringify(d)); fireD(); return Promise.resolve(); },
      update:function(d){ deep[p]=Object.assign(deep[p]||{}, d); fireD(); return Promise.resolve(); },
      get:function(){ return Promise.resolve({exists: p in deep, data:function(){ return deep[p]; }}); },
      onSnapshot:function(ok){ (deepSubs[p]=deepSubs[p]||[]).push(ok); setTimeout(function(){ ok({id:p.split("/").pop(), exists: p in deep, data:function(){ return deep[p] ? JSON.parse(JSON.stringify(deep[p])) : undefined; }}); },0); return function(){}; } }; }
  function doc(p){ if (p.indexOf("data/") === 0) return deepDoc(p); var parts = p.split("/"), name = parts[0], id = parts[1];
    return { set:function(d){ if (ro) return Promise.reject({code:"invalid_argument"}); window.__writes.push([p,d]); store[name]=store[name]||{}; store[name][id]=JSON.parse(JSON.stringify(d)); fire(name); return Promise.resolve(); },
      update:function(d){ if (ro) return Promise.reject({code:"invalid_argument"}); store[name]=store[name]||{}; store[name][id]=Object.assign(store[name][id]||{}, d); fire(name); return Promise.resolve(); },
      delete:function(){ if (store[name]) delete store[name][id]; fire(name); return Promise.resolve(); },
      get:function(){ var d = store[name]&&store[name][id]; return Promise.resolve({exists:!!d,data:function(){return d;}}); },
      acquire:function(){ return Promise.resolve({acquired:true}); } }; }
  var db = { collection: coll, doc: doc };
  var peersCb = null, myPresence = {};
  var peers = [{kind:"viewer", sameTab:true, isMe:true, peer: q.get("peer")||"pself", by: q.get("by")||null, guest: q.get("guest")==="1", presence:myPresence, updatedAt: Date.now()}];
  var room = { onPeers:function(ok){ peersCb = ok; setTimeout(function(){ ok({peers:peers}); },0); return function(){}; },
    presence:function(p){ Object.assign(myPresence, p); window.__presence = myPresence; return Promise.resolve(); },
    canSendToClaudeSession:function(){return Promise.resolve("off");}, sendToClaudeSession:function(){return Promise.resolve();} };
  window.__stub = { store: store, fire: fire,
    addPeer: function(p){ peers.push(p); peersCb && peersCb({peers:peers}); },
    setPeers: function(ps){ peers = [peers[0]].concat(ps); peersCb && peersCb({peers:peers}); },
    putMsgs: function(id, items){ store.msgs[id] = {day: new Date().toISOString().slice(0,10), writer:"x", items: items}; fire("msgs"); } };
  var user = { can: function(){ return Promise.resolve(!ro); }, id: function(){ return Promise.resolve("u_testlogin0000000000000"); } };
  window.__prompts = [];
  var blobs = window.__blobs = new Map(), nAsset = 0;
  var assets = { upload: function(blob, o){ var id = ("a" + (++nAsset) + "00000000000000000000000000000000").slice(0, 32).replace(/[^0-9a-f]/g, "0"); blobs.set(id, blob); window.__uploads = (window.__uploads || []).concat([{ id: id, type: (o && o.type) || blob.type, size: blob.size }]); if (window.__failUpload) return Promise.reject({code:"rate_limited"}); return Promise.resolve({ id: id, url: "/_blob/" + id, sizeBytes: blob.size, contentType: (o && o.type) || blob.type }); } };
  var downloads = { save: function(o){ window.__saved = o; return Promise.resolve("saved"); } };
  var sample = function(input, opts){ window.__prompts.push(String(input)); var t = window.__sampleReply || "Готово."; return new Promise(function(res, rej){ var half = setTimeout(function(){ opts && opts.onText && opts.onText({text: t.slice(0, Math.ceil(t.length/2))}); }, 100); var done = setTimeout(function(){ opts && opts.onText && opts.onText({text: t}); res({text: t, truncated: false}); }, 300); if (opts && opts.signal) opts.signal.addEventListener("abort", function(){ clearTimeout(half); clearTimeout(done); rej({code:"cancelled", text: ""}); }); }); };
  window.claude = { use: function(n){ if(n==="db") return db; if(n==="room") return room; if (n==="user") return user; if (n==="sample") return sample; if (n==="assets") return assets; if (n==="downloads") return downloads; return null; } };
})();
