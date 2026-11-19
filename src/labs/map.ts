import Map from 'ol/Map';
import View from 'ol/View';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import Polygon from 'ol/geom/Polygon';
import LineString from 'ol/geom/LineString';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Circle, Fill, Stroke, Style, Text } from 'ol/style';
import { fromLonLat, toLonLat, transformExtent } from 'ol/proj';
import { defaults as defaultControls } from 'ol/control';
import 'ol/ol.css';
import './hose-lab-controls.css';
import { settleHoseControls } from '../motion-controls';

type HoseInput = HTMLElement & { value: string };

const places = [
  { name: '断桥', type: 'scenery', coord: [120.1487, 30.2595], note: '在白堤的起点，看城市与湖水相遇。' },
  { name: '平湖秋月', type: 'scenery', coord: [120.1374, 30.2539], note: '沿湖慢走，换一个角度看风景。' },
  { name: '三潭印月', type: 'scenery', coord: [120.1357, 30.2342], note: '湖心小岛，是这张地图的安静角落。' },
  { name: '雷峰塔', type: 'culture', coord: [120.1495, 30.2304], note: '在湖的南侧，寻找熟悉的城市轮廓。' },
  { name: '浙江省博物馆（孤山馆区）', type: 'culture', coord: [120.1318, 30.2545], note: '坐标之外，城市也由故事构成。' },
  { name: '柳浪闻莺', type: 'scenery', coord: [120.157, 30.2382], note: '从城市走进绿意，让好奇心领路。' },
];

export function mount(root: HTMLElement): () => void {
  root.innerHTML = `<div class="map-search-tools"><div class="map-search-copy"><strong>在西湖，找一个想去的地方</strong><p>搜索地点名或故事关键词，地图标记和下方地点会一起筛选。</p><div><span id="map-search-count" role="status" aria-live="polite">找到 ${places.length} 个地点</span><button id="map-search-clear" type="button" hidden>清空搜索 ×</button></div></div><hose-input id="map-search" type="search" name="place" label="搜索西湖地点" placeholder="试试：断桥" maxlength="50"></hose-input></div><div class="lab-controls" role="group" aria-label="地图图层筛选"><button data-category="all" aria-pressed="true">全部地点</button><button data-category="scenery" aria-pressed="false">湖畔风景</button><button data-category="culture" aria-pressed="false">人文地标</button><button id="map-reset" class="control-spacer">回到西湖 ↺</button></div><div id="map-stage" class="lab-stage map-stage" tabindex="0" role="region" aria-label="西湖示意地图，使用方向键平移，加减键缩放"></div><div class="lab-description map-footer"><p id="map-detail" class="map-detail" role="status">选一个地点，开始今天的城市漫游。</p><span id="map-coordinates" class="map-coordinates">120.1450° E / 30.2460° N</span></div><div class="map-keyboard-list" aria-label="地图上的地点"></div><p class="map-search-empty" hidden>没有匹配的地点。换个关键词，或切回「全部地点」试试。</p><p class="lab-description">拖动 / 双指缩放地图，点击空白处拾取坐标。也可以用地点按钮探索。<br><strong>本地矢量示意数据 · 边界与坐标经简化，仅用于交互演示，不用于导航。</strong></p>`;
  const stage = root.querySelector<HTMLDivElement>('#map-stage')!;
  const baseFeatures: Feature[] = [];
  function polygon(points: number[][], fill: string, stroke = '#abb6a0') {
    const feature = new Feature(new Polygon([points.map(p => fromLonLat(p))]));
    feature.setStyle(new Style({ fill: new Fill({ color: fill }), stroke: new Stroke({ color: stroke, width: 1.5 }) }));
    baseFeatures.push(feature);
  }
  polygon([[120.10,30.22],[120.13,30.22],[120.135,30.25],[120.123,30.27],[120.10,30.27],[120.10,30.22]],'#c3cda7');
  polygon([[120.127,30.252],[120.132,30.258],[120.145,30.26],[120.153,30.253],[120.157,30.244],[120.153,30.233],[120.145,30.23],[120.131,30.232],[120.125,30.239],[120.127,30.252]],'#91bcb0','#638f83');
  polygon([[120.129,30.253],[120.132,30.256],[120.137,30.255],[120.136,30.252],[120.129,30.253]],'#bcc99f');
  polygon([[120.133,30.236],[120.136,30.237],[120.139,30.234],[120.136,30.232],[120.133,30.236]],'#c3cda7');
  const roads: { coords: number[][]; name?: string; width?: number }[] = [
    { coords:[[120.115,30.259],[120.133,30.26],[120.146,30.262],[120.16,30.26],[120.18,30.26]],name:'北山街' },
    { coords:[[120.161,30.27],[120.16,30.25],[120.16,30.238],[120.153,30.228],[120.142,30.226]],name:'南山路' },
    { coords:[[120.12,30.228],[120.123,30.239],[120.124,30.251],[120.127,30.26]],name:'杨公堤' },
    { coords:[[120.13,30.257],[120.132,30.245],[120.132,30.23]],name:'苏堤',width:5 },
    { coords:[[120.134,30.254],[120.1487,30.2595]],name:'白堤',width:5 },
  ];
  for(let i = 0; i < 6; i++) {
    const x=120.164+i*.005;
    roads.push({coords:[[x,30.223],[x,30.275]],width:8});
    const y=30.225+i*.008;
    roads.push({coords:[[120.161,y],[120.20,y]],width:8});
  }
  roads.forEach(road => {
    const feature = new Feature(new LineString(road.coords.map(p=>fromLonLat(p))));
    feature.setStyle([
      new Style({stroke:new Stroke({color:'#bbbca8',width:(road.width??12)+2})}),
      new Style({stroke:new Stroke({color:'#f9f5e8',width:road.width??12}),text:road.name?new Text({text:road.name,font:'13px KaiTi, "LXGW WenKai Lite", serif',placement:'line',fill:new Fill({color:'#626a55'}),stroke:new Stroke({color:'#f9f5e8',width:3})}):undefined}),
    ]);
    baseFeatures.push(feature);
  });
  const lakeLabel = new Feature(new Point(fromLonLat([120.143,30.245])));
  lakeLabel.setStyle(new Style({text:new Text({text:'西 湖\nWEST LAKE',font:'600 17px KaiTi, "LXGW WenKai Lite", serif',fill:new Fill({color:'#376c65'}),textAlign:'center'})}));
  baseFeatures.push(lakeLabel);
  const pointFeatures = places.map((place,index)=>new Feature({geometry:new Point(fromLonLat(place.coord)),place,index}));
  let category='all';
  let query='';
  let selected=-1;
  let disposed=false;
  const normalize=(value:string)=>value.normalize('NFKC').trim().toLocaleLowerCase('zh-CN');
  const matchesPlace=(place:typeof places[number])=>(category==='all'||place.type===category)&&(!query||normalize(`${place.name} ${place.note} ${place.type==='culture'?'人文地标':'湖畔风景'}`).includes(query));
  const pointsLayer = new VectorLayer({source:new VectorSource({features:pointFeatures}),style:feature=>{
    const place=feature.get('place') as typeof places[number];
    if(!matchesPlace(place)) return undefined;
    const active=selected===feature.get('index');
    return new Style({image:new Circle({radius:active?15:12,fill:new Fill({color:place.type==='culture'?'#536e64':'#d9432f'}),stroke:new Stroke({color:'#fff8e7',width:active?4:3})}),text:new Text({text:String(Number(feature.get('index'))+1),font:'bold 11px sans-serif',fill:new Fill({color:'#fff8e7'})}),zIndex:active?10:1});
  }});
  const initialCenter=fromLonLat([120.144,30.246]);
  const map=new Map({target:stage,layers:[new VectorLayer({source:new VectorSource({features:baseFeatures})}),pointsLayer],view:new View({center:initialCenter,zoom:14,minZoom:12,maxZoom:18}),controls:defaultControls({rotate:false,attribution:false,zoomOptions:{zoomInTipLabel:'放大地图',zoomOutTipLabel:'缩小地图'}})});
  stage.querySelector('.ol-zoom-in')?.setAttribute('aria-label','放大地图');
  stage.querySelector('.ol-zoom-out')?.setAttribute('aria-label','缩小地图');
  const fitLake=()=>map.getView().fit(transformExtent([120.119,30.224,120.17,30.266],'EPSG:4326','EPSG:3857'),{padding:[25,25,25,25],maxZoom:14});
  const coords=root.querySelector('#map-coordinates')!;
  const detail=root.querySelector('#map-detail')!;
  const list=root.querySelector('.map-keyboard-list')!;
  const search=root.querySelector<HoseInput>('#map-search')!;
  const searchCount=root.querySelector('#map-search-count')!;
  const clearSearch=root.querySelector<HTMLButtonElement>('#map-search-clear')!;
  const empty=root.querySelector<HTMLElement>('.map-search-empty')!;
  const animateTo=(center:number[],zoom?:number)=>{
    if(matchMedia('(prefers-reduced-motion: reduce)').matches||document.documentElement.classList.contains('motion-paused')) {map.getView().setCenter(center);if(zoom)map.getView().setZoom(zoom);}
    else map.getView().animate({center,zoom:zoom??map.getView().getZoom(),duration:400});
  };
  function selectPlace(index:number) {
    if(!matchesPlace(places[index]))return;
    selected=index;pointsLayer.changed();
    const place=places[index];
    detail.textContent=`${place.name} · ${place.note}`;
    coords.textContent=`${place.coord[0].toFixed(4)}° E / ${place.coord[1].toFixed(4)}° N`;
    list.querySelectorAll('button').forEach((b)=>b.setAttribute('aria-pressed',String(Number(b.dataset.index)===index)));
    animateTo(fromLonLat(place.coord));
  }
  places.forEach((place,index)=>{
    const button=document.createElement('button');button.type='button';button.textContent=`${index+1} ${place.name}`;button.dataset.index=String(index);button.setAttribute('aria-pressed','false');button.addEventListener('click',()=>selectPlace(index));list.append(button);
  });
  function updateFilter() {
    selected=-1;
    let count=0;
    list.querySelectorAll<HTMLButtonElement>('button').forEach(item=>{
      const visible=matchesPlace(places[Number(item.dataset.index)]);
      item.hidden=!visible;
      item.setAttribute('aria-pressed','false');
      if(visible)count++;
    });
    pointsLayer.changed();
    searchCount.textContent=`找到 ${count} 个地点`;
    clearSearch.hidden=!search.value;
    empty.hidden=count>0;
    detail.textContent=count?'点击地图标记或下方地点，看看这里的故事。':'暂时没有匹配的地点，试试其他关键词或分类。';
    settleHoseControls();
  }
  const onSearch=()=>{query=normalize(search.value);updateFilter();};
  search.addEventListener('input',onSearch);
  clearSearch.addEventListener('click',()=>{
    search.value='';query='';updateFilter();search.focus();
  });
  map.on('singleclick',event=>{
    const hit=map.forEachFeatureAtPixel(event.pixel,feature=>feature.get('place')?feature:undefined,{layerFilter:layer=>layer===pointsLayer,hitTolerance:7});
    if(hit)selectPlace(Number(hit.get('index')));
    else {const [lon,lat]=toLonLat(event.coordinate);coords.textContent=`${lon.toFixed(4)}° E / ${lat.toFixed(4)}° N`;detail.textContent='坐标已拾取。再点一个地点，看看这里的故事。';}
  });
  map.on('pointermove',event=>{if(!event.dragging)stage.style.cursor=map.hasFeatureAtPixel(event.pixel,{layerFilter:layer=>layer===pointsLayer})?'pointer':'grab';});
  root.querySelectorAll<HTMLButtonElement>('[data-category]').forEach(button=>button.addEventListener('click',()=>{
    category=button.dataset.category!;
    root.querySelectorAll('[data-category]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
    updateFilter();
  }));
  root.querySelector('#map-reset')!.addEventListener('click',fitLake);
  const observer=new ResizeObserver(()=>map.updateSize());observer.observe(stage);
  map.updateSize();
  fitLake();
  const onMotionChange=()=>settleHoseControls();
  window.addEventListener('motionchange',onMotionChange);
  const documentReady=document.readyState==='loading'?new Promise<void>(resolve=>document.addEventListener('DOMContentLoaded',()=>resolve(),{once:true})):Promise.resolve();
  void Promise.all([documentReady,customElements.whenDefined('hose-input')]).then(()=>{
    if(disposed)return;
    requestAnimationFrame(()=>{if(!disposed){map.updateSize();settleHoseControls();}});
  });
  return()=>{disposed=true;observer.disconnect();window.removeEventListener('motionchange',onMotionChange);map.setTarget(undefined);map.dispose();};
}
