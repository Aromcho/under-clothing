import { Injectable } from '@nestjs/common';
import sharp from 'sharp';
import { randomUUID } from 'node:crypto';
import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { UPLOADS_DIR } from '../db/db';

export const IMAGE_WIDTHS = [320, 640, 960, 1440];

export type ProcessedImage = { path: string; width: number; height: number; widths: number[]; blur: string; color: string };

/** Convierte cualquier imagen a WebP en varios tamaños + placeholder borroso. */
export async function processImage(input: Buffer | string, uploadsDir = UPLOADS_DIR): Promise<ProcessedImage> {
  const id = randomUUID().slice(0, 13);
  const dir = path.join(uploadsDir, id);
  await mkdir(dir, { recursive: true });
  const base = sharp(input, { failOn: 'none' }).rotate();
  const meta = await base.metadata();
  const w = meta.width ?? 1080;
  const h = meta.height ?? 1350;
  const widths = IMAGE_WIDTHS.filter((x) => x <= w);
  if (!widths.length || (w > widths[widths.length - 1] && w < 1440)) widths.push(w);
  for (const x of widths) {
    await base.clone().resize({ width: x, withoutEnlargement: true }).webp({ quality: x <= 640 ? 74 : 80, effort: 3 }).toFile(path.join(dir, `${x}.webp`));
  }
  const blurBuf = await base.clone().resize({ width: 20 }).blur(1.2).webp({ quality: 40 }).toBuffer();
  const { dominant } = await base.clone().resize({ width: 40 }).stats();
  const hex = '#' + [dominant.r, dominant.g, dominant.b].map((v) => v.toString(16).padStart(2, '0')).join('');
  return { path: `/uploads/${id}`, width: w, height: h, widths, blur: `data:image/webp;base64,${blurBuf.toString('base64')}`, color: hex };
}

@Injectable()
export class ImageService {
  process(input: Buffer) { return processImage(input); }
  async remove(mediaPath: string) {
    const dir = path.join(UPLOADS_DIR, path.basename(mediaPath));
    if (dir.startsWith(UPLOADS_DIR)) await rm(dir, { recursive: true, force: true });
  }
}
