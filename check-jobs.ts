import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { supabaseAdmin } from './lib/supabase-server';

async function checkJobs() {
  const { data: jobs, error } = await supabaseAdmin
    .from('jobs')
    .select('*')
    .eq('type', 'download')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Recent download jobs:');
  console.log(JSON.stringify(jobs, null, 2));

  const { data: videos, error: vidError } = await supabaseAdmin
    .from('videos')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(3);

  console.log('\nRecent videos:');
  console.log(JSON.stringify(videos, null, 2));
}

checkJobs().then(() => process.exit(0));
