const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabaseUrl = 'https://rfyqzuuuumgdoomyhqcu.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmeXF6dXV1dW1nZG9vbXlocWN1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzU2Nzg2MiwiZXhwIjoyMDUzMTQzODYyfQ.Y7wgES_zTv_iK5_PJ6fv3NNBQw5o5rrVE80PiQGBa6k'

const supabase = createClient(supabaseUrl, supabaseKey)

async function executeSQLFile() {
  try {
    console.log('Reading SQL file...')
    const sqlFile = fs.readFileSync(path.join(__dirname, '../sql/generate_promo_codes.sql'), 'utf8')

    // Split into individual statements and execute
    const statements = sqlFile
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    console.log(`Executing ${statements.length} SQL statements...`)

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'
      console.log(`\nExecuting statement ${i + 1}/${statements.length}...`)
      console.log(statement.substring(0, 100) + '...')

      const { data, error } = await supabase.rpc('exec_sql', { sql_query: statement })

      if (error) {
        console.error(`Error in statement ${i + 1}:`, error.message)
        // Continue with other statements
      } else {
        console.log(`✓ Statement ${i + 1} executed successfully`)
        if (data) {
          console.log('Result:', JSON.stringify(data).substring(0, 200))
        }
      }
    }

    console.log('\n=== Checking vendors without promo codes ===')
    const { data: vendors, error: vendorsError } = await supabase
      .from('vendors')
      .select('id, business_name, promo_code')
      .or('promo_code.is.null,promo_code.eq.')
      .limit(10)

    if (vendorsError) {
      console.error('Error fetching vendors:', vendorsError.message)
    } else {
      console.log(`Found ${vendors.length} vendors without promo codes`)
      vendors.forEach(v => {
        console.log(`- ${v.business_name}: ${v.promo_code || 'NO CODE'}`)
      })
    }

    console.log('\n=== Sample of vendors with promo codes ===')
    const { data: vendorsWithCodes, error: codesError } = await supabase
      .from('vendors')
      .select('id, business_name, promo_code')
      .not('promo_code', 'is', null)
      .not('promo_code', 'eq', '')
      .limit(10)

    if (codesError) {
      console.error('Error fetching vendors with codes:', codesError.message)
    } else {
      console.log(`Found ${vendorsWithCodes.length} vendors with promo codes`)
      vendorsWithCodes.forEach(v => {
        console.log(`✓ ${v.business_name}: ${v.promo_code}`)
      })
    }

  } catch (error) {
    console.error('Fatal error:', error.message)
    process.exit(1)
  }
}

executeSQLFile()
