import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const ACCOUNT_ID = 'fbc5fc2743d23df0880ef09d457227ab';
const ACCESS_KEY_ID = '0e8d644a490ac7f5d9ce7645615fdb6f';
const SECRET_ACCESS_KEY = '9b6760057fd7af76ef5b96dbc1f4482633301a5c6ca7e36f50954f086ee4c093';
const BUCKET_NAME = 'cep-dunyasi-media';
const PUBLIC_BASE_URL = 'https://pub-61300b39f2f74b558f60e467b6c2d588.r2.dev';

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
  },
});

const PUBLIC_DIR = '/Users/berksubasi/Desktop/cep-dunyasi/public/images';

const FILES = [
  { localName: 'image copy.png', r2Key: 'banner/image-copy.png', contentType: 'image/png' },
  { localName: 'image copy 2.png', r2Key: 'banner/image-copy-2.png', contentType: 'image/png' },
  { localName: 'image copy 3.png', r2Key: 'banner/image-copy-3.png', contentType: 'image/png' },
  { localName: 'image copy 4.png', r2Key: 'banner/image-copy-4.png', contentType: 'image/png' },
  { localName: 'AFİŞ1.mp4', r2Key: 'banner/afis1.mp4', contentType: 'video/mp4' },
];

async function upload(file) {
  const localPath = path.join(PUBLIC_DIR, file.localName);
  const body = fs.readFileSync(localPath);

  await client.send(new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: file.r2Key,
    Body: body,
    ContentType: file.contentType,
    CacheControl: 'public, max-age=31536000, immutable',
  }));

  const url = `${PUBLIC_BASE_URL}/${file.r2Key}`;
  console.log(`✅ ${file.localName} → ${url}`);
  return { localName: file.localName, r2Key: file.r2Key, url };
}

const results = [];
for (const file of FILES) {
  try {
    const result = await upload(file);
    results.push(result);
  } catch (err) {
    console.error(`❌ ${file.localName}: ${err.message}`);
  }
}

console.log('\n--- R2 URL Mapping ---');
for (const r of results) {
  console.log(`${r.localName}: ${r.url}`);
}
