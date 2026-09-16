// Rasterizes the app's geometric ECG mark. No external runtime dependencies.
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
const background = [11, 18, 32];
const tile = [21, 55, 49];
const stroke = [94, 234, 212];
const points = [[.23,.50],[.37,.50],[.44,.30],[.56,.70],[.64,.50],[.77,.50]];
function segmentDistance(x, y, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const t = Math.max(0, Math.min(1, ((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)));
  return Math.hypot(x-a[0]-t*dx, y-a[1]-t*dy);
}
function color(x, y) {
  if (points.slice(1).some((end, i) => segmentDistance(x,y,points[i],end)<.022)) return stroke;
  const qx = Math.max(Math.abs(x-.5)-.29,0), qy = Math.max(Math.abs(y-.5)-.29,0);
  return Math.hypot(qx,qy)<.11 ? tile : background;
}
function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) { crc ^= byte; for(let k=0;k<8;k++) crc = (crc>>>1)^((crc&1)?0xedb88320:0); }
  return (crc^0xffffffff)>>>0;
}
function chunk(name, data) {
  const type = Buffer.from(name), length = Buffer.alloc(4), crc = Buffer.alloc(4);
  length.writeUInt32BE(data.length); crc.writeUInt32BE(crc32(Buffer.concat([type,data])));
  return Buffer.concat([length,type,data,crc]);
}
function png(size) {
  const rows = Buffer.alloc((size*3+1)*size);
  for(let y=0;y<size;y++) for(let x=0;x<size;x++) {
    const sum = [0,0,0];
    for(let sy=0;sy<4;sy++) for(let sx=0;sx<4;sx++) {
      const sample = color((x+(sx+.5)/4)/size,(y+(sy+.5)/4)/size);
      sample.forEach((c,i)=>sum[i]+=c);
    }
    sum.forEach((c,i)=>rows[y*(size*3+1)+1+x*3+i]=Math.round(c/16));
  }
  const header=Buffer.alloc(13); header.writeUInt32BE(size,0); header.writeUInt32BE(size,4); header[8]=8; header[9]=2;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(rows)),chunk('IEND',Buffer.alloc(0))]);
}
for(const [file,size] of [['pwa-192x192.png',192],['pwa-512x512.png',512],['apple-touch-icon.png',180]]) {
  writeFileSync(new URL(`../public/${file}`,import.meta.url),png(size));
  process.stdout.write(`${file}: ${size} × ${size}\n`);
}
