// Script to apply database migration
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { supabaseAdmin } from '@/lib/supabase-server';

async function applyMigration() {
  try {
    console.log('📦 Applying migration: 002_add_youtube_support.sql');

    const migrationPath = path.join(
      process.cwd(),
      'supabase',
      'migrations',
      '002_add_youtube_support.sql'
    );

    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    // Execute the migration
    const { error } = await supabaseAdmin.rpc('exec_sql', {
      sql: migrationSQL,
    });

    if (error) {
      console.error('❌ Migration failed:', error);

      // If RPC doesn't exist, provide manual instructions
      if (error.message.includes('exec_sql')) {
        console.log('\n⚠️  The exec_sql RPC function is not available.');
        console.log('Please apply the migration manually via Supabase Dashboard:');
        console.log('\n1. Go to https://supabase.com/dashboard');
        console.log('2. Select your project');
        console.log('3. Navigate to SQL Editor');
        console.log('4. Copy and paste the contents of:');
        console.log(`   ${migrationPath}`);
        console.log('5. Click "Run"\n');
        process.exit(1);
      }

      process.exit(1);
    }

    console.log('✅ Migration applied successfully!');
  } catch (error) {
    console.error('❌ Error applying migration:', error);

    console.log('\n⚠️  Automated migration failed.');
    console.log('Please apply the migration manually via Supabase Dashboard:');
    console.log('\n1. Go to https://supabase.com/dashboard');
    console.log('2. Select your project');
    console.log('3. Navigate to SQL Editor');
    console.log('4. Copy and paste the contents of:');
    console.log(`   supabase/migrations/002_add_youtube_support.sql`);
    console.log('5. Click "Run"\n');

    process.exit(1);
  }
}

applyMigration();
