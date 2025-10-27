const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://rfyqzuuuumgdoomyhqcu.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmeXF6dXV1dW1nZG9vbXlocWN1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDUyNTI5NSwiZXhwIjoyMDc2MTAxMjk1fQ.Ti7fAn4KsBD4WzyN-gPA5Cl_y7MO-aJvBChGHMLwb-A'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function setupDatabase() {
  console.log('🚀 Setting up Rimmarsa database...\n')

  // Create categories table
  const categoriesSQL = `
    CREATE TABLE IF NOT EXISTS categories (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      name_ar VARCHAR(255) NOT NULL,
      description TEXT,
      icon TEXT,
      "order" INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `

  const { error: categoriesError } = await supabase.rpc('exec', { sql: categoriesSQL })
  if (categoriesError) {
    console.log('⚠️  Categories table might already exist or need manual creation')
    console.log('Error:', categoriesError.message)
  } else {
    console.log('✅ Categories table created')
  }

  // Test connection
  const { data, error } = await supabase.from('categories').select('count').limit(1)
  if (error) {
    console.log('\n❌ Error connecting to database:', error.message)
    console.log('\n📋 Please execute the SQL manually in Supabase SQL Editor:')
    console.log('   https://supabase.com/dashboard/project/rfyqzuuuumgdoomyhqcu/editor/sql')
    console.log('\n📄 SQL file location: ./supabase_migration.sql')
  } else {
    console.log('\n✅ Successfully connected to Rimmarsa database!')
  }
}

setupDatabase().catch(console.error)
