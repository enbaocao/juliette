/**
 * Upload Pre-rendered Animations to Supabase Storage
 *
 * Prerequisites:
 * 1. Run pre-render-library.sh first
 * 2. Create 'animations' bucket in Supabase (public-read)
 * 3. Set SUPABASE_SERVICE_ROLE_KEY in .env.local
 *
 * Usage:
 *   npx ts-node scripts/upload-animations.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { supabaseAdmin } from '@/lib/supabase-server';

const PRE_RENDERED_DIR = path.join(__dirname, '../manim-sandbox/pre-rendered');
const BUCKET_NAME = 'animations';

async function ensureBucketExists(): Promise<void> {
  console.log('Checking if animations bucket exists...');

  const { data: buckets } = await supabaseAdmin.storage.listBuckets();
  const bucketExists = buckets?.some((b) => b.name === BUCKET_NAME);

  if (!bucketExists) {
    console.log('Creating animations bucket...');
    const { data, error } = await supabaseAdmin.storage.createBucket(BUCKET_NAME, {
      public: true,  // Public-read for easy access
      fileSizeLimit: 52428800,  // 50MB limit
    });

    if (error) {
      throw new Error(`Failed to create bucket: ${error.message}`);
    }

    console.log('✓ Bucket created successfully');
  } else {
    console.log('✓ Bucket already exists');
  }
}

async function uploadFile(filename: string): Promise<void> {
  const filePath = path.join(PRE_RENDERED_DIR, filename);

  if (!fs.existsSync(filePath)) {
    console.log(`  ✗ File not found: ${filename}`);
    return;
  }

  const fileBuffer = fs.readFileSync(filePath);
  const fileSizeMB = (fileBuffer.length / 1024 / 1024).toFixed(2);

  console.log(`  Uploading ${filename} (${fileSizeMB} MB)...`);

  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .upload(filename, fileBuffer, {
      contentType: 'video/mp4',
      upsert: true,  // Overwrite if exists
    });

  if (error) {
    console.log(`  ✗ Failed: ${error.message}`);
  } else {
    console.log(`  ✓ Uploaded successfully`);
  }
}

async function main() {
  console.log('🎬 Animation Upload Script');
  console.log('');

  // Check pre-rendered directory exists
  if (!fs.existsSync(PRE_RENDERED_DIR)) {
    console.error('Error: pre-rendered directory not found!');
    console.error('Run ./scripts/pre-render-library.sh first');
    process.exit(1);
  }

  // Get list of MP4 files
  const files = fs
    .readdirSync(PRE_RENDERED_DIR)
    .filter((f) => f.endsWith('.mp4'))
    .sort();

  if (files.length === 0) {
    console.error('Error: No MP4 files found in pre-rendered directory!');
    console.error('Run ./scripts/pre-render-library.sh first');
    process.exit(1);
  }

  console.log(`Found ${files.length} animations to upload`);
  console.log('');

  // Ensure bucket exists
  await ensureBucketExists();
  console.log('');

  // Upload each file
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    console.log(`[${i + 1}/${files.length}] ${file}`);

    try {
      await uploadFile(file);
      successCount++;
    } catch (error) {
      console.log(`  ✗ Error: ${error}`);
      failCount++;
    }
  }

  console.log('');
  console.log('📊 Upload Summary');
  console.log(`  Success: ${successCount}`);
  console.log(`  Failed: ${failCount}`);
  console.log('');

  if (successCount > 0) {
    console.log('✅ Animations uploaded successfully!');
    console.log('');
    console.log('🔗 Access animations at:');
    console.log(`   ${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/[filename].mp4`);
    console.log('');
    console.log('Next steps:');
    console.log('1. Test with: findClosestAnimation("linear regression")');
    console.log('2. Update utils/prompts.ts to use pre-rendered library');
    console.log('3. Verify animations load in browser');
  }
}

// Run the script
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
