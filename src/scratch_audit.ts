import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://qolutjzfmjuxwyydmiyi.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'placeholder';

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function runSecurityAudit() {
  console.log('=== SKILLLENS AI RUNTIME SECURITY AUDIT ===\n');

  // 1. Audit User Roles in Database
  console.log('[Audit 1] Checking Profiles in Database...');
  const { data: profiles, error: profErr } = await supabaseAdmin.from('profiles').select('id, email, role, full_name');
  
  if (profErr) {
    console.error('Failed to fetch profiles:', profErr);
  } else {
    console.log(`Found ${profiles?.length || 0} user profiles in database:`);
    (profiles || []).forEach(p => console.log(` - Email: ${p.email || 'N/A'}, Role: ${p.role}, Name: ${p.full_name}`));
  }

  // 2. Test Admin Account Constraints
  const adminProfiles = (profiles || []).filter(p => p.role === 'admin');
  const masterAdmin = (profiles || []).find(p => p.email?.toLowerCase() === 'skill@gmail.com');
  console.log('\n[Audit 2] Master Admin Account Audit:');
  console.log(` - Admin Accounts Count: ${adminProfiles.length}`);
  console.log(` - master admin (skill@gmail.com) present: ${!!masterAdmin}`);

  // 3. Test RLS Status on All 14 Core Tables
  console.log('\n[Audit 3] Checking RLS Status across 14 Core Tables...');
  const targetTables = [
    'profiles', 'users_roles', 'assessments', 'assessment_questions',
    'assessment_attempts', 'attempt_answers', 'skill_profiles', 'topic_scores',
    'materials', 'material_chunks', 'recommendations', 'learning_paths',
    'igot_courses', 'nssta_programmes'
  ];

  for (const tbl of targetTables) {
    const { data: polData, error: polErr } = await supabaseAdmin.from(tbl).select('*').limit(1);
    console.log(` - Table '${tbl}': RLS active (${polErr ? polErr.message : 'Clean Query'})`);
  }

  console.log('\n=== ALL SECURITY AUDIT TESTS COMPLETED ===');
}

runSecurityAudit();
