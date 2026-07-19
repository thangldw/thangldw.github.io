import {$,esc,fmt,stat,evidence,horizontalBars,tooltipify} from "/apps/public-signals/charts.js";
import {LAND, flatMapBase, projectFlat} from "/apps/public-signals/maps.js";

const COLORS={shallow:"#36c5f0",intermediate:"#7c8cff",deep:"#ff8a4c",danger:"#ef5b68"};
const prompts=["Where were the strongest earthquakes in the last 30 days?","How does depth differ by region?","Show earthquakes above magnitude 5 near Japan.","Which regions were most active this quarter?","Compare reviewed and automatic events."];
let rows=[],snapshotRows=[],meta={},mapController=null,lastLiveRefresh=0;
const groupBy=(items,keyFn)=>items.reduce((out,item)=>{const key=keyFn(item);(out[key]||(out[key]=[])).push(item);return out;},{});
const cutoff=days=>{const max=meta.earthquakes.date_max; return new Date(max+"T00:00:00Z").getTime()-(days-1)*86400000;};
const recent=days=>rows.filter(r=>new Date(r.time).getTime()>=cutoff(days));

function depthColor(d){return d>=300?COLORS.deep:d>=70?COLORS.intermediate:COLORS.shallow;}
function regionFor(latitude,longitude){if(latitude>=24&&latitude<=46&&longitude>=122&&longitude<=150)return "Japan";if(latitude>=21&&latitude<=26.5&&longitude>=119&&longitude<=123.5)return "Taiwan";if(latitude>=-12&&latitude<=25&&longitude>=95&&longitude<=135)return "Southeast Asia";if(latitude>=0&&latitude<=60&&longitude>135&&longitude<=180)return "Western Pacific";return "East Asia";}
function haversineKm(lat1,lon1,lat2,lon2){const rad=Math.PI/180,dLat=(lat2-lat1)*rad,dLon=(lon2-lon1)*rad,a=Math.sin(dLat/2)**2+Math.cos(lat1*rad)*Math.cos(lat2*rad)*Math.sin(dLon/2)**2;return 6371*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));}
function liveRow(feature){const properties=feature.properties||{},coordinates=feature.geometry?.coordinates||[];if(coordinates.length<3||properties.mag==null||properties.time==null)return null;const [longitude,latitude,depth]=coordinates,time=new Date(properties.time);return {id:feature.id,time:time.toISOString(),date:time.toISOString().slice(0,10),place:properties.place||"Unknown location",region:regionFor(latitude,longitude),magnitude:+properties.mag.toFixed(1),depth_km:+depth.toFixed(1),longitude:+longitude.toFixed(4),latitude:+latitude.toFixed(4),significance:properties.sig||0,felt:properties.felt||0,alert:properties.alert,status:properties.status||"unknown",tsunami:Boolean(properties.tsunami),distance_tokyo_km:Math.round(haversineKm(latitude,longitude,35.6762,139.6503)),live:true};}
function setLiveStatus(message,state="live"){$("#liveFreshness").className=`refresh-note live-refresh ${state==='loading'?'is-loading':state==='stale'?'is-stale':''}`;$("#liveFreshness").lastChild.textContent=message;}
function updateDatasetSummary(){const earthquake=meta.earthquakes,latest=rows.reduce((value,row)=>row.time>value?row.time:value,""),earliest=rows.reduce((value,row)=>!value||row.time<value?row.time:value,"");earthquake.date_min=earliest.slice(0,10)||earthquake.date_min;earthquake.date_max=latest.slice(0,10)||earthquake.date_max;earthquake.row_count=rows.length;earthquake.max_magnitude=Math.max(...rows.map(row=>row.magnitude));earthquake.reviewed_pct=100*rows.filter(row=>row.status==="reviewed").length/Math.max(1,rows.length);$("#freshness").textContent=`365-day baseline · ${earthquake.date_min} → ${earthquake.date_max} · ${rows.length.toLocaleString()} events`;$("#stats").innerHTML=[stat("Events",rows.length.toLocaleString(),"M3+ historical + live"),stat("Maximum",`M${fmt(earthquake.max_magnitude)}`,"within coverage region"),stat("Reviewed",`${fmt(earthquake.reviewed_pct)}%`,"current catalog status"),stat("Coverage","365 days",`${earthquake.date_min} → ${earthquake.date_max}`)].join('');}

function setupInteractiveMap(){
  const host=$("#seismicMap"),range=$("#worldRange"),count=$("#mapEventCount"),L=window.L;
  if(!L){host.innerHTML='<p class="data-note">Interactive map library could not be loaded. Check the network connection and reload.</p>';return;}
  const coverageBounds=L.latLngBounds([[-12,95],[60,180]]);
  const map=L.map(host,{preferCanvas:false,worldCopyJump:true,minZoom:2,zoomControl:true,attributionControl:true});
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'}).addTo(map);
  L.rectangle(coverageBounds,{color:'#4657d8',weight:1.5,dashArray:'7 6',fill:false,interactive:false}).addTo(map);
  const eventLayer=L.layerGroup().addTo(map);
  const focus=()=>map.setView([24,137],host.clientWidth<600?2:3,{animate:false});
  function renderEvents(days){
    const allEvents=recent(days),sampleStep=Math.max(1,Math.ceil(allEvents.length/5500));
    const events=sampleStep===1?allEvents:allEvents.filter((event,index)=>event.magnitude>=5||index%sampleStep===0);
    eventLayer.clearLayers();
    events.slice().sort((a,b)=>a.magnitude-b.magnitude).forEach(event=>{
      L.circleMarker([event.latitude,event.longitude],{radius:Math.max(2.2,(event.magnitude-2.4)*1.45),color:'#ffffff',weight:.55,fillColor:depthColor(event.depth_km),fillOpacity:.72}).bindTooltip(`<b>M${fmt(event.magnitude)} · ${esc(event.place)}</b>${event.date} · ${fmt(event.depth_km)} km deep`,{sticky:true,direction:'top'}).addTo(eventLayer);
    });
    count.textContent=sampleStep===1?`${events.length.toLocaleString()} events · ${days}-day window`:`${events.length.toLocaleString()} displayed of ${allEvents.length.toLocaleString()} events · ${days}-day window`;
  }
  range.onchange=event=>renderEvents(+event.target.value);$("#focusCoverage").onclick=focus;
  focus();renderEvents(+range.value);return {render:()=>renderEvents(+range.value)};
}

async function refreshLiveEarthquakes(){
  if(document.hidden||Date.now()-lastLiveRefresh<240000)return;
  setLiveStatus("Checking USGS live feed…","loading");
  const start=new Date(Date.now()-30*86400000).toISOString(),url=new URL("https://earthquake.usgs.gov/fdsnws/event/1/query");
  Object.entries({format:"geojson",starttime:start,minlatitude:-12,maxlatitude:60,minlongitude:95,maxlongitude:180,minmagnitude:3,orderby:"time-asc",limit:20000}).forEach(([key,value])=>url.searchParams.set(key,value));
  try{
    const response=await fetch(url,{cache:"no-store"});if(!response.ok)throw new Error(`USGS ${response.status}`);const payload=await response.json(),liveRows=(payload.features||[]).map(liveRow).filter(Boolean),merged=new Map(snapshotRows.map(row=>[row.id,row]));liveRows.forEach(row=>merged.set(row.id,row));
    const mergedRows=[...merged.values()],newest=Math.max(...mergedRows.map(row=>new Date(row.time).getTime())),oldest=newest-364*86400000;rows=mergedRows.filter(row=>new Date(row.time).getTime()>=oldest).sort((a,b)=>a.time.localeCompare(b.time));lastLiveRefresh=Date.now();updateDatasetSummary();mapController?.render();renderDepthComposition();renderRegions();renderTimeline();analyze($("#askInput").value||prompts[0]);
    const newestEvent=liveRows.at(-1);setLiveStatus(`Live · checked just now${newestEvent?` · latest event ${newestEvent.time.slice(11,16)} UTC`:''}`);
  }catch(error){setLiveStatus("Live feed unavailable · showing daily snapshot","stale");console.warn("Live earthquake refresh failed",error);}
}

function scheduleLiveRefresh(){setInterval(()=>{if(!document.hidden)refreshLiveEarthquakes();},300000);document.addEventListener("visibilitychange",()=>{if(!document.hidden)refreshLiveEarthquakes();});window.addEventListener("online",refreshLiveEarthquakes);refreshLiveEarthquakes();}

function renderWorldMap(days=90){
  const host=$("#worldMapChart"),data=recent(days),compact=matchMedia('(max-width: 620px)').matches;
  const W=compact?620:1000,H=compact?400:500,L=48,R=18,T=18,B=35;
  const bounds={lonMin:-180,lonMax:180,latMin:-60,latMax:85},frame={width:W,height:H,left:L,right:R,top:T,bottom:B};
  const point=(lon,lat)=>projectFlat(lon,lat,bounds,frame),northWest=point(95,60),southEast=point(180,-12);
  host.innerHTML=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Flat world map showing the East and Southeast Asia earthquake catalog coverage">
    ${flatMapBase({id:'world-earthquake-clip',bounds,frame,longitudeTicks:[-120,-60,0,60,120,180],latitudeTicks:[-40,0,40,80]})}
    <rect x="${northWest.x}" y="${northWest.y}" width="${southEast.x-northWest.x}" height="${southEast.y-northWest.y}" fill="none" stroke="var(--portfolio-accent)" stroke-width="1.5" stroke-dasharray="6 5"/>
    <text class="map-coverage-label" x="${northWest.x+7}" y="${northWest.y+16}">CATALOG COVERAGE</text>
    ${data.slice().sort((a,b)=>a.magnitude-b.magnitude).map(event=>{const p=point(event.longitude,event.latitude);return `<circle class="tooltip-target" data-tip="<b>M${fmt(event.magnitude)} · ${esc(event.place)}</b>${event.date} · ${fmt(event.depth_km)} km deep" cx="${p.x}" cy="${p.y}" r="${Math.max(1.5,(event.magnitude-2.4)*1.55)}" fill="${depthColor(event.depth_km)}" fill-opacity=".68" stroke="var(--portfolio-surface)" stroke-width=".5"/>`;}).join('')}
  </svg>`;tooltipify(host);
}

function setupGlobe(){
  const canvas=$("#globeCanvas"), host=$("#globeHost"), readout=$("#globeReadout"), motion=$("#globeMotion"), range=$("#globeRange");
  const ctx=canvas.getContext("2d"); let centerLon=135,centerLat=18,dragging=false,lastX=0,lastY=0,auto=!matchMedia('(prefers-reduced-motion: reduce)').matches,visible=true,lastFrame=performance.now(),points=[],canvasW=0,canvasH=0,canvasDpr=0;
  const css=()=>getComputedStyle(document.documentElement), rad=Math.PI/180;
  function size(){const box=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2),w=Math.round(box.width*dpr),h=Math.round(box.height*dpr);if(w!==canvasW||h!==canvasH||dpr!==canvasDpr){canvas.width=w;canvas.height=h;canvasW=w;canvasH=h;canvasDpr=dpr;ctx.setTransform(dpr,0,0,dpr,0,0);}return box;}
  function project(lon,lat,box){const lambda=(lon-centerLon)*rad,phi=lat*rad,phi0=centerLat*rad,cosPhi=Math.cos(phi),visibility=Math.sin(phi0)*Math.sin(phi)+Math.cos(phi0)*cosPhi*Math.cos(lambda),r=Math.min(box.width,box.height)*.43,cx=box.width/2,cy=box.height/2;return {x:cx+r*cosPhi*Math.sin(lambda),y:cy-r*(Math.cos(phi0)*Math.sin(phi)-Math.sin(phi0)*cosPhi*Math.cos(lambda)),visible:visibility>0,r,cx,cy};}
  function geoLine(coords,box){let drawing=false;ctx.beginPath();coords.forEach(([lon,lat])=>{const p=project(lon,lat,box);if(!p.visible){drawing=false;return;}if(!drawing){ctx.moveTo(p.x,p.y);drawing=true;}else ctx.lineTo(p.x,p.y);});ctx.stroke();}
  function draw(){
    const box=size(),p0=project(centerLon,centerLat,box),style=css();ctx.clearRect(0,0,box.width,box.height);
    ctx.beginPath();ctx.arc(p0.cx,p0.cy,p0.r,0,Math.PI*2);ctx.fillStyle=style.getPropertyValue('--portfolio-surface-2');ctx.fill();ctx.save();ctx.clip();
    ctx.strokeStyle=style.getPropertyValue('--portfolio-border');ctx.lineWidth=.7;
    for(let lat=-60;lat<=60;lat+=20){const line=[];for(let lon=-180;lon<=180;lon+=3)line.push([lon,lat]);geoLine(line,box);}
    for(let lon=-180;lon<180;lon+=20){const line=[];for(let lat=-90;lat<=90;lat+=3)line.push([lon,lat]);geoLine(line,box);}
    ctx.fillStyle=style.getPropertyValue('--portfolio-accent-soft');ctx.strokeStyle=style.getPropertyValue('--portfolio-border-strong');ctx.lineWidth=1;
    LAND.forEach(poly=>{ctx.beginPath();let drawing=false;poly.forEach(([lon,lat])=>{const p=project(lon,lat,box);if(!p.visible){drawing=false;return;}if(!drawing){ctx.moveTo(p.x,p.y);drawing=true;}else ctx.lineTo(p.x,p.y);});ctx.closePath();ctx.fill();ctx.stroke();});
    points=[];const data=recent(+range.value).slice().sort((a,b)=>a.magnitude-b.magnitude);data.forEach(event=>{const p=project(event.longitude,event.latitude,box);if(!p.visible)return;const radius=Math.max(1.8,(event.magnitude-2.4)*1.75);ctx.beginPath();ctx.arc(p.x,p.y,radius,0,Math.PI*2);ctx.fillStyle=depthColor(event.depth_km);ctx.globalAlpha=.72;ctx.fill();ctx.globalAlpha=1;ctx.strokeStyle=style.getPropertyValue('--portfolio-surface');ctx.lineWidth=.55;ctx.stroke();points.push({...p,radius,event});});ctx.restore();
    ctx.beginPath();ctx.arc(p0.cx,p0.cy,p0.r,0,Math.PI*2);ctx.strokeStyle=style.getPropertyValue('--portfolio-border-strong');ctx.lineWidth=1.25;ctx.stroke();
  }
  function frame(now){if(auto&&visible&&!dragging){centerLon=(centerLon+(now-lastFrame)*.0016+540)%360-180;draw();}lastFrame=now;requestAnimationFrame(frame);}
  function pointer(event){const box=canvas.getBoundingClientRect();return {x:event.clientX-box.left,y:event.clientY-box.top};}
  canvas.addEventListener('pointerdown',event=>{dragging=true;const p=pointer(event);lastX=p.x;lastY=p.y;canvas.setPointerCapture(event.pointerId);});
  canvas.addEventListener('pointermove',event=>{const p=pointer(event);if(dragging){centerLon-= (p.x-lastX)*.35;centerLat=Math.max(-60,Math.min(60,centerLat+(p.y-lastY)*.25));lastX=p.x;lastY=p.y;draw();return;}let nearest=null,distance=14;points.forEach(point=>{const d=Math.hypot(point.x-p.x,point.y-p.y);if(d<Math.max(distance,point.radius+5)){nearest=point;distance=d;}});if(nearest){readout.innerHTML=`<strong>M${fmt(nearest.event.magnitude)} · ${esc(nearest.event.place)}</strong><span>${nearest.event.date} · ${fmt(nearest.event.depth_km)} km deep</span>`;}else readout.innerHTML='<strong>Drag the globe</strong><span>Hover a point for event details</span>';});
  canvas.addEventListener('pointerup',()=>{dragging=false;});canvas.addEventListener('pointercancel',()=>{dragging=false;});
  canvas.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;event.preventDefault();if(event.key==='ArrowLeft')centerLon-=8;if(event.key==='ArrowRight')centerLon+=8;if(event.key==='ArrowUp')centerLat=Math.min(60,centerLat+6);if(event.key==='ArrowDown')centerLat=Math.max(-60,centerLat-6);draw();});
  motion.onclick=()=>{auto=!auto;motion.setAttribute('aria-pressed',String(auto));motion.textContent=auto?'Pause rotation':'Resume rotation';};range.onchange=draw;
  new ResizeObserver(draw).observe(host);new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting??true;},{threshold:.1}).observe(host);document.addEventListener('themechange',draw);draw();requestAnimationFrame(frame);
}
function renderMap(days=30){
  const host=$("#mapChart"), data=recent(days),compact=matchMedia('(max-width: 620px)').matches; const W=compact?620:820,H=compact?420:380,L=48,R=18,T=18,B=35;
  const bounds={lonMin:95,lonMax:180,latMin:-12,latMax:60},frame={width:W,height:H,left:L,right:R,top:T,bottom:B};
  const point=(lon,lat)=>projectFlat(lon,lat,bounds,frame);
  host.innerHTML=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Earthquake locations in East and Southeast Asia">
    ${flatMapBase({id:'earthquake-map-clip',bounds,frame,longitudeTicks:[100,120,140,160,180],latitudeTicks:[-10,10,30,50]})}
    ${data.slice().sort((a,b)=>a.magnitude-b.magnitude).map(r=>{const p=point(r.longitude,r.latitude);return `<circle class="tooltip-target" data-tip="<b>M${fmt(r.magnitude)} · ${esc(r.place)}</b>${esc(r.date)} · ${fmt(r.depth_km)} km deep" cx="${p.x}" cy="${p.y}" r="${Math.max(1.6,(r.magnitude-2.2)*2.1)}" fill="${depthColor(r.depth_km)}" fill-opacity=".66" stroke="var(--portfolio-surface)" stroke-width=".55"/>`;}).join('')}
  </svg>`; tooltipify(host);
}

function renderTimeline(){
  const host=$("#timelineChart"), end=new Date(meta.earthquakes.date_max+"T00:00:00Z"), buckets=[];
  for(let i=51;i>=0;i--){const start=new Date(end.getTime()-i*7*86400000), stop=new Date(start.getTime()+7*86400000);const events=rows.filter(r=>{const d=new Date(r.time);return d>=start&&d<stop});buckets.push({start,count:events.length,max:Math.max(0,...events.map(r=>r.magnitude))});}
  const W=1000,H=270,L=45,R=20,T=20,B=32,max=Math.max(...buckets.map(b=>b.count));const bw=(W-L-R)/buckets.length;
  host.innerHTML=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Weekly earthquake volume over one year">
    ${[0,.5,1].map(t=>`<line class="grid" x1="${L}" x2="${W-R}" y1="${T+t*(H-T-B)}" y2="${T+t*(H-T-B)}"/><text class="axis" x="4" y="${T+t*(H-T-B)+3}">${Math.round(max*(1-t))}</text>`).join('')}
    ${buckets.map((b,i)=>{const h=b.count/max*(H-T-B);return `<rect class="tooltip-target" data-tip="<b>Week of ${b.start.toISOString().slice(0,10)}</b>${b.count} events · maximum M${fmt(b.max)}" x="${L+i*bw+1}" y="${H-B-h}" width="${Math.max(1,bw-2)}" height="${h}" fill="${b.max>=6?COLORS.danger:COLORS.shallow}" opacity="${b.max>=6?.9:.58}"/>`;}).join('')}
    <text class="axis" x="${L}" y="${H-8}">${buckets[0].start.toISOString().slice(0,10)}</text><text class="axis" text-anchor="end" x="${W-R}" y="${H-8}">${meta.earthquakes.date_max}</text>
  </svg>`; tooltipify(host);
}

function renderRegions(){const grouped=groupBy(rows,r=>r.region);const data=Object.entries(grouped).map(([label,v])=>({label,value:v.length,max:Math.max(...v.map(r=>r.magnitude))})).sort((a,b)=>b.value-a.value);const max=data[0].value;$("#regionRanking").innerHTML=data.map((r,i)=>`<div class="rank-row"><span>${esc(r.label)}</span><span class="rank-track"><i class="rank-fill" style="width:${r.value/max*100}%;background:${i===0?COLORS.shallow:COLORS.intermediate}"></i></span><span class="rank-value">${r.value.toLocaleString()}<br>M${fmt(r.max)}</span></div>`).join('');}

function renderDepthComposition(){
  const host=$("#depthComposition"),grouped=groupBy(rows,row=>row.region),regions=Object.entries(grouped).map(([region,events])=>{
    const counts=[events.filter(row=>row.depth_km<70).length,events.filter(row=>row.depth_km>=70&&row.depth_km<300).length,events.filter(row=>row.depth_km>=300).length];
    return {region,total:events.length,shares:counts.map(count=>count/events.length*100)};
  }).sort((a,b)=>b.total-a.total);
  const W=780,H=330,L=135,R=24,T=18,B=30,rowH=57,plotW=W-L-R,colors=[COLORS.shallow,COLORS.intermediate,COLORS.deep];
  host.innerHTML=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Depth composition of earthquake events by region">
    ${regions.map((item,index)=>{let offset=0;const y=T+index*rowH;const segments=item.shares.map((share,i)=>{const x=L+offset/100*plotW,width=share/100*plotW;offset+=share;return `<rect x="${x}" y="${y}" width="${width}" height="24" fill="${colors[i]}" opacity="${.82-i*.08}"/>${share>=8?`<text class="depth-share" text-anchor="middle" x="${x+width/2}" y="${y+16}">${fmt(share,0)}%</text>`:''}`;}).join('');return `<text class="chart-label" x="0" y="${y+16}">${esc(item.region)}</text>${segments}<text class="axis" text-anchor="end" x="${W-R}" y="${y+40}">n=${item.total.toLocaleString()}</text>`;}).join('')}
    <text class="axis" x="${L}" y="${H-7}">0%</text><text class="axis" text-anchor="middle" x="${L+plotW/2}" y="${H-7}">50%</text><text class="axis" text-anchor="end" x="${W-R}" y="${H-7}">100%</text>
  </svg>`;
}

function analyze(question){
  const q=question.toLowerCase(); let data,title,summary,method,chartTitle,chartSub,rank;
  if(q.includes("depth")){data=rows;const groups=Object.entries(groupBy(data,r=>r.region)).map(([label,v])=>({label,value:v.reduce((s,r)=>s+r.depth_km,0)/v.length,count:v.length})).sort((a,b)=>b.value-a.value);title="Average depth differs materially by region";summary=`${groups[0].label} has the deepest mean hypocenter at ${fmt(groups[0].value)} km, compared with ${fmt(groups.at(-1).value)} km in ${groups.at(-1).label}.`;method="Method · arithmetic mean depth across all cataloged M3+ events in the 365-day window; region is assigned from event coordinates.";chartTitle="Mean depth by region";chartSub="Kilometers below the surface";rank=groups;
  } else if(q.includes("review")){data=rows;const groups=Object.entries(groupBy(data,r=>r.status)).map(([label,v])=>({label,value:v.reduce((s,r)=>s+r.magnitude,0)/v.length,count:v.length})).sort((a,b)=>b.value-a.value);title="Reviewed vs automatic catalog entries";summary=`Reviewed events average M${fmt(groups.find(g=>g.label==='reviewed')?.value)}, based on the current catalog status. Status reflects processing maturity—not event severity.`;method="Method · mean magnitude grouped by the current USGS review status across the full coverage window.";chartTitle="Mean magnitude by status";chartSub="Catalog status is not a severity category";rank=groups;
  } else {const days=q.includes("quarter")?90:q.includes("year")?365:30;data=recent(days);if(q.includes("japan")||q.includes("near"))data=data.filter(r=>r.distance_tokyo_km<=1500);if(q.match(/magnitude\s*5|above\s*5|m5/))data=data.filter(r=>r.magnitude>=5);if(q.includes("active")){const groups=Object.entries(groupBy(data,r=>r.region)).map(([label,v])=>({label,value:v.length,max:Math.max(...v.map(r=>r.magnitude))})).sort((a,b)=>b.value-a.value);title=`${groups[0]?.label||'No region'} was most active in the selected window`;summary=`${groups[0]?.label||'No region'} recorded ${groups[0]?.value||0} M3+ events, ${groups[1]?`${fmt(groups[0].value/groups[1].value,1)}× the next region`:"with no comparable runner-up"}.`;method=`Method · event count by coordinate-based region from ${new Date(cutoff(days)).toISOString().slice(0,10)} through ${meta.earthquakes.date_max}.`;chartTitle="Activity by region";chartSub="Recorded M3+ events";rank=groups;}else{const top=data.slice().sort((a,b)=>b.magnitude-a.magnitude).slice(0,7);title=data.length?`Strongest: M${fmt(top[0].magnitude)} near ${top[0].place}`:"No matching events";summary=data.length?`${data.length.toLocaleString()} events match the interpreted filters. The strongest occurred on ${top[0].date} at ${fmt(top[0].depth_km)} km depth.`:"Try a broader time window or lower magnitude threshold.";method=`Method · ranked by USGS magnitude; evidence window ends ${meta.earthquakes.date_max}${q.includes('japan')?' and is limited to 1,500 km from Tokyo':''}.`;chartTitle="Strongest matching events";chartSub="Magnitude ranking · exact locations from USGS";rank=top.map(r=>({label:r.place,value:r.magnitude}));}}
  $("#answerTitle").textContent=title;$("#answerSummary").textContent=summary;$("#answerMethod").textContent=method;$("#answerChartTitle").textContent=chartTitle;$("#answerChartSub").textContent=chartSub;
  $("#answerEvidence").innerHTML=evidence([[data.length.toLocaleString(),"events analyzed"],[data.length?`M${fmt(Math.max(...data.map(r=>r.magnitude)))}`:"—","maximum magnitude"],[data.length?`${fmt(data.reduce((s,r)=>s+r.depth_km,0)/data.length)} km`:"—","mean depth"],[meta.earthquakes.date_max,"data through"]]);
  horizontalBars($("#answerChart"),rank.slice(0,7),{valueLabel:v=>q.includes('depth')?`${fmt(v)} km`:q.includes('active')?fmt(v,0):`M${fmt(v)}`});
}

async function boot(){const [data,m]=await Promise.all([fetch("/apps/public-signals/data/earthquakes.json").then(r=>r.json()),fetch("/apps/public-signals/data/meta.json").then(r=>r.json())]);rows=data;snapshotRows=data;meta=m;updateDatasetSummary();$("#prompts").innerHTML=prompts.map(p=>`<button class="prompt-chip" type="button">${esc(p)}</button>`).join('');$("#prompts").onclick=e=>{if(e.target.matches('button')){$("#askInput").value=e.target.textContent;analyze(e.target.textContent)}};$("#askForm").onsubmit=e=>{e.preventDefault();analyze($("#askInput").value||prompts[0])};mapController=setupInteractiveMap();renderDepthComposition();renderRegions();renderTimeline();analyze(prompts[0]);scheduleLiveRefresh();}
boot().catch(e=>{$("#freshness").textContent="Data unavailable";console.error(e)});
