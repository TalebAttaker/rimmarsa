const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://rfyqzuuuumgdoomyhqcu.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmeXF6dXV1dW1nZG9vbXlocWN1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzU2Nzg2MiwiZXhwIjoyMDUzMTQzODYyfQ.Y7wgES_zTv_iK5_PJ6fv3NNBQw5o5rrVE80PiQGBa6k'

const supabase = createClient(supabaseUrl, supabaseKey)

// Generate unique promo code from business name
function generatePromoCode(businessName, existingCodes) {
  // Clean and extract letters/numbers only
  let baseCode = businessName
    .replace(/[^A-Za-z0-9]/g, '')
    .toUpperCase()
    .substring(0, 6)

  // If too short, pad with random
  if (baseCode.length < 3) {
    baseCode = baseCode + Math.random().toString(36).substring(2, 8 - baseCode.length).toUpperCase()
  }

  // Add random 4-character suffix
  let attempts = 0
  let promoCode

  do {
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase()
    promoCode = baseCode + randomSuffix

    // Ensure it's 10 characters max
    if (promoCode.length > 10) {
      promoCode = promoCode.substring(0, 10)
    }

    attempts++
    if (attempts > 100) {
      // Fallback to completely random
      promoCode = 'RM' + Math.random().toString(36).substring(2, 10).toUpperCase()
      break
    }
  } while (existingCodes.has(promoCode))

  existingCodes.add(promoCode)
  return promoCode
}

async function fixPromoCodes() {
  try {
    console.log('🔍 Fetching all vendors...')

    // Get all vendors
    const { data: allVendors, error: fetchError } = await supabase
      .from('vendors')
      .select('id, business_name, owner_name, promo_code')
      .order('created_at', { ascending: true })

    if (fetchError) {
      throw new Error(`Failed to fetch vendors: ${fetchError.message}`)
    }

    console.log(`📊 Total vendors: ${allVendors.length}`)

    // Collect existing promo codes
    const existingCodes = new Set()
    allVendors.forEach(v => {
      if (v.promo_code && v.promo_code.trim() !== '') {
        existingCodes.add(v.promo_code)
      }
    })

    console.log(`✅ Found ${existingCodes.size} existing promo codes`)

    // Find vendors without promo codes
    const vendorsWithoutCodes = allVendors.filter(v => !v.promo_code || v.promo_code.trim() === '')

    console.log(`⚠️  Found ${vendorsWithoutCodes.length} vendors WITHOUT promo codes`)

    if (vendorsWithoutCodes.length === 0) {
      console.log('🎉 All vendors already have promo codes!')
      return
    }

    console.log('\n🔧 Generating and updating promo codes...\n')

    // Update each vendor without a promo code
    for (const vendor of vendorsWithoutCodes) {
      const businessName = vendor.business_name || vendor.owner_name || `VENDOR${vendor.id}`
      const promoCode = generatePromoCode(businessName, existingCodes)

      console.log(`  Updating ${businessName}`)
      console.log(`    Generated code: ${promoCode}`)

      const { error: updateError } = await supabase
        .from('vendors')
        .update({ promo_code: promoCode })
        .eq('id', vendor.id)

      if (updateError) {
        console.error(`    ❌ Failed: ${updateError.message}`)
      } else {
        console.log(`    ✅ Updated successfully`)
      }
    }

    console.log('\n✅ All promo codes generated!')

    // Verify
    console.log('\n📋 Verification - Sample of vendors with codes:')
    const { data: verifyVendors } = await supabase
      .from('vendors')
      .select('business_name, promo_code')
      .not('promo_code', 'is', null)
      .not('promo_code', 'eq', '')
      .limit(15)

    verifyVendors?.forEach(v => {
      console.log(`  ✓ ${v.business_name}: ${v.promo_code}`)
    })

    // Check if any still missing
    const { data: stillMissing } = await supabase
      .from('vendors')
      .select('id, business_name')
      .or('promo_code.is.null,promo_code.eq.')

    if (stillMissing && stillMissing.length > 0) {
      console.log(`\n⚠️  WARNING: ${stillMissing.length} vendors still without codes:`)
      stillMissing.forEach(v => console.log(`  - ${v.business_name}`))
    } else {
      console.log('\n🎉 SUCCESS: All vendors now have unique promo codes!')
    }

  } catch (error) {
    console.error('💥 Fatal error:', error.message)
    process.exit(1)
  }
}

fixPromoCodes()
