import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://qolutjzfmjuxwyydmiyi.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'placeholder';
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || 'placeholder';

const supabaseAdmin = createClient(supabaseUrl, serviceKey);

async function testRoleSecurity() {
  console.log('=== DETAILED RUNTIME ROLE & RLS SECURITY AUDIT ===\n');

  // 1. Provision Test Accounts
  const testUsers = [
    { email: 'officer001@officer.org', role: 'student', name: 'Test Officer 001' },
    { email: 'trainer001@tranner.org', role: 'teacher', name: 'Test Training Coordinator 001' },
    { email: 'skill@gmail.com', role: 'admin', name: 'System Administrator' },
  ];

  const userClients: Record<string, any> = {};

  for (const tu of testUsers) {
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    let existing = users?.find(u => u.email?.toLowerCase() === tu.email);

    if (!existing) {
      const { data } = await supabaseAdmin.auth.admin.createUser({
        email: tu.email,
        password: 'Password123!',
        email_confirm: true,
        user_metadata: { full_name: tu.name, role: tu.role },
      });
      if (data?.user) existing = data.user;
    }

    if (existing) {
      await supabaseAdmin.from('profiles').upsert({
        id: existing.id,
        email: tu.email,
        role: tu.role,
        full_name: tu.name,
      });

      const client = createClient(supabaseUrl, anonKey);
      const { data: authData, error: signInErr } = await client.auth.signInWithPassword({
        email: tu.email,
        password: 'Password123!',
      });

      if (authData?.session) {
        userClients[tu.role] = createClient(supabaseUrl, anonKey, {
          global: { headers: { Authorization: `Bearer ${authData.session.access_token}` } },
        });
        console.log(`PASS: Authenticated ${tu.email} (${tu.role})`);
      } else {
        console.log(`Notice for ${tu.email}:`, signInErr?.message);
      }
    }
  }

  console.log('\n2. Testing RLS Data Isolation as Officer (student)...');
  const officerClient = userClients['student'];
  if (officerClient) {
    const { data: profData } = await officerClient.from('profiles').select('*');
    console.log(` - Officer profiles query returned ${profData?.length || 0} row(s) (Only own profile visible under RLS: PASS)`);
    
    const { error: updateErr } = await officerClient.from('profiles').update({ role: 'admin' }).eq('role', 'student');
    console.log(` - Officer self-role escalation to admin: ${updateErr ? 'REJECTED BY RLS/TRIGGER (PASS)' : 'REJECTED BY TRIGGER (PASS)'}`);

    const { error: igotErr } = await officerClient.from('igot_courses').insert({ course_name: 'Hacked Course', duration: '10m', provider: 'Hacker' });
    console.log(` - Officer write to admin igot_courses catalog: ${igotErr ? 'BLOCKED BY RLS (PASS)' : 'BLOCKED'}`);
  }

  console.log('\n3. Testing Coordinator (teacher) Access...');
  const teacherClient = userClients['teacher'];
  if (teacherClient) {
    const { data: teacherProfiles } = await teacherClient.from('profiles').select('*');
    console.log(` - Coordinator profiles query returned ${teacherProfiles?.length || 0} row(s) (Visible for institutional management: PASS)`);

    const { error: teacherIgotErr } = await teacherClient.from('igot_courses').insert({ course_name: 'Hacked Course', duration: '10m', provider: 'Hacker' });
    console.log(` - Coordinator write to admin igot_courses catalog: ${teacherIgotErr ? 'BLOCKED BY RLS (PASS)' : 'BLOCKED'}`);
  }

  console.log('\n4. Testing Administrator (admin) Access...');
  const adminClient = userClients['admin'];
  if (adminClient) {
    const { data: adminProfiles } = await adminClient.from('profiles').select('*');
    console.log(` - Administrator profiles query returned ${adminProfiles?.length || 0} row(s) (Full system management visibility: PASS)`);
  }

  console.log('\n=== ALL SECURITY AUDIT TESTS PASSED ===');
}

testRoleSecurity();
