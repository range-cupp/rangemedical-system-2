// scripts/seed-employees.js
// Seed initial employee records + Supabase Auth accounts
// Run: node scripts/seed-employees.js

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://teivfptpozltpqwahgdl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlaXZmcHRwb3psdHBxd2FoZ2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDcxMzE0OSwiZXhwIjoyMDgwMjg5MTQ5fQ.7P_jrgUmF34lPEJOYgmAogDLwEKplEOtyOazIaXmqHA'
);

const EMPLOYEES = [
  {
    email: 'cupp@range-medical.com',
    name: 'Chris Cupp',
    title: 'Partner/Owner',
    is_admin: true,
    calcom_user_id: 2189658,
    permissions: {},
  },
  {
    email: 'burgess@range-medical.com',
    name: 'Damien Burgess',
    title: 'Provider',
    is_admin: false,
    calcom_user_id: 2197563,
    permissions: {
      can_manage_patients: true,
      can_manage_protocols: true,
      can_manage_schedules: true,
      can_log_services: true,
    },
  },
  {
    email: 'lily@range-medical.com',
    name: 'Lily Diaz',
    title: 'RN',
    is_admin: false,
    calcom_user_id: 2197567,
    permissions: {
      can_manage_patients: true,
      can_log_services: true,
    },
  },
  {
    email: 'evan@range-medical.com',
    name: 'Evan Riederich',
    title: 'Staff',
    is_admin: false,
    calcom_user_id: 2197566,
    permissions: {
      can_manage_patients: true,
      can_log_services: true,
    },
  },
  {
    email: 'damon@range-medical.com',
    name: 'Damon Durante',
    title: 'Staff',
    is_admin: false,
    calcom_user_id: 2197565,
    permissions: {
      can_manage_patients: true,
      can_log_services: true,
    },
  },
  {
    email: 'tara@range-medical.com',
    name: 'Tara Ventimiglia',
    title: 'Staff',
    is_admin: false,
    calcom_user_id: null,
    permissions: {
      can_manage_patients: true,
      can_log_services: true,
    },
  },
];

// Default password for all accounts (should be changed on first login)
const DEFAULT_PASSWORD = 'Range2026!';

async function seed() {
  console.log('=== Seeding Employee Accounts ===\n');

  for (const emp of EMPLOYEES) {
    console.log(`Processing: ${emp.name} (${emp.email})`);

    // 1. Create Supabase Auth user
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: emp.email,
      password: DEFAULT_PASSWORD,
      email_confirm: true,
    });

    if (authError) {
      if (authError.message?.includes('already been registered')) {
        console.log(`  Auth: Already exists`);
      } else {
        console.error(`  Auth ERROR: ${authError.message}`);
        continue;
      }
    } else {
      console.log(`  Auth: Created (${authUser.user.id})`);
    }

    // 2. Upsert employee record
    const { data: employee, error: empError } = await supabase
      .from('employees')
      .upsert(
        {
          email: emp.email,
          name: emp.name,
          title: emp.title,
          is_admin: emp.is_admin,
          calcom_user_id: emp.calcom_user_id,
          permissions: emp.permissions,
          is_active: true,
        },
        { onConflict: 'email' }
      )
      .select()
      .single();

    if (empError) {
      console.error(`  Employee ERROR: ${empError.message}`);
    } else {
      console.log(`  Employee: ${employee.id} (${emp.title}${emp.is_admin ? ' · ADMIN' : ''})`);
    }

    console.log('');
  }

  console.log('=== Seed Complete ===');
  console.log(`\nDefault password for all accounts: ${DEFAULT_PASSWORD}`);
  console.log('Employees should change their password after first login.');
}

seed().catch(console.error);
