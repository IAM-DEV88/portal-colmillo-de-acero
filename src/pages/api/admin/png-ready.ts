import type { APIRoute } from 'astro';
import sharp from 'sharp';

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;
    const threshold = parseInt(formData.get('threshold') as string || '230');
    const feather = parseInt(formData.get('feather') as string || '0');
    const mode = formData.get('mode') as string || 'global';
    const clickX = formData.get('clickX') ? parseInt(formData.get('clickX') as string) : null;
    const clickY = formData.get('clickY') ? parseInt(formData.get('clickY') as string) : null;

    if (!file) {
      return new Response(JSON.stringify({ error: 'No se subió ninguna imagen' }), { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const image = sharp(buffer).ensureAlpha();
    const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
    const { width, height, channels } = info;
    const outputData = Buffer.from(data);

    if (clickX !== null && clickY !== null) {
      // MODO LIMPIEZA MÁGICA (Flood Fill desde punto de clic)
      const visited = new Uint8Array(width * height);
      const stack: [number, number][] = [[clickX, clickY]];
      
      // Obtener el color del punto de clic para comparar
      const startIdx = (clickY * width + clickX) * channels;
      const targetR = data[startIdx];
      const targetG = data[startIdx + 1];
      const targetB = data[startIdx + 2];

      while (stack.length > 0) {
        const [x, y] = stack.pop()!;
        const idx = y * width + x;
        if (visited[idx]) continue;
        visited[idx] = 1;

        const pixelIdx = idx * channels;
        const r = data[pixelIdx];
        const g = data[pixelIdx + 1];
        const b = data[pixelIdx + 2];

        // Comparar con el color objetivo usando el threshold como tolerancia
        const diff = Math.max(Math.abs(r - targetR), Math.abs(g - targetG), Math.abs(b - targetB));
        
        if (diff < (255 - threshold + 10)) { // Adaptar threshold para flood fill
          outputData[pixelIdx + 3] = 0;

          const neighbors = [[x+1, y], [x-1, y], [x, y+1], [x, y-1]];
          for (const [nx, ny] of neighbors) {
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              stack.push([nx, ny]);
            }
          }
        }
      }
    } else if (mode === 'exterior') {
      const visited = new Uint8Array(width * height);
      const stack: [number, number][] = [];

      for (let x = 0; x < width; x++) { checkAndAdd(x, 0); checkAndAdd(x, height - 1); }
      for (let y = 0; y < height; y++) { checkAndAdd(0, y); checkAndAdd(width - 1, y); }

      function checkAndAdd(x: number, y: number) {
        const idx = y * width + x;
        if (visited[idx]) return;
        const pIdx = idx * channels;
        if (data[pIdx] >= threshold && data[pIdx + 1] >= threshold && data[pIdx + 2] >= threshold) {
          visited[idx] = 1;
          stack.push([x, y]);
        }
      }

      while (stack.length > 0) {
        const [x, y] = stack.pop()!;
        const pIdx = (y * width + x) * channels;
        outputData[pIdx + 3] = 0;
        const neighbors = [[x+1, y], [x-1, y], [x, y+1], [x, y-1]];
        for (const [nx, ny] of neighbors) {
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) checkAndAdd(nx, ny);
        }
      }
    } else {
      for (let i = 0; i < data.length; i += channels) {
        if (data[i] >= threshold && data[i + 1] >= threshold && data[i + 2] >= threshold) {
          outputData[i + 3] = 0;
        }
      }
    }

    let finalSharp = sharp(outputData, { raw: { width, height, channels } });
    if (feather > 0) finalSharp = finalSharp.blur(feather * 0.4);

    const finalBuffer = await finalSharp
      .png({ quality: 100, compressionLevel: 9 })
      .toBuffer();

    return new Response(finalBuffer, {
      status: 200,
      headers: { 'Content-Type': 'image/png' }
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: 'Error' }), { status: 500 });
  }
};
