const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabaseUrl = 'https://rfyqzuuuumgdoomyhqcu.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmeXF6dXV1dW1nZG9vbXlocWN1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDUyNTI5NSwiZXhwIjoyMDc2MTAxMjk1fQ.Ti7fAn4KsBD4WzyN-gPA5Cl_y7MO-aJvBChGHMLwb-A'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Simple promo code generator
function generatePromoCode(businessName, existingCodes) {
  let baseCode = businessName
    .replace(/[^A-Za-z0-9]/g, '')
    .toUpperCase()
    .substring(0, 6)

  if (baseCode.length < 3) {
    baseCode = baseCode + Math.random().toString(36).substring(2, 8 - baseCode.length).toUpperCase()
  }

  let promoCode
  let attempts = 0

  do {
    const suffix = Math.random().toString(36).substring(2, 6).toUpperCase()
    promoCode = (baseCode + suffix).substring(0, 10)
    attempts++
    if (attempts > 100) {
      promoCode = 'RM' + Math.random().toString(36).substring(2, 10).toUpperCase()
      break
    }
  } while (existingCodes.has(promoCode))

  existingCodes.add(promoCode)
  return promoCode
}

async function main() {
  console.log('🚀 Starting promo code generation...\n')

  try {
    // Step 1: Fetch all vendors
    console.log('📊 Fetching all vendors...')
    const { data: vendors, error: fetchError } = await supabase
      .from('vendors')
      .select('id, business_name, owner_name, promo_code')
      .order('created_at', { ascending: true })

    if (fetchError) throw new Error(`Failed to fetch vendors: ${fetchError.message}`)

    console.log(`✅ Found ${vendors.length} total vendors\n`)

    // Step 2: Collect existing codes
    const existingCodes = new Set()
    vendors.forEach(v => {
      if (v.promo_code && v.promo_code.trim()) {
        existingCodes.add(v.promo_code)
      }
    })

    console.log(`📝 ${existingCodes.size} vendors already have promo codes`)

    // Step 3: Find vendors without codes
    const vendorsWithoutCodes = vendors.filter(v => !v.promo_code || !v.promo_code.trim())

    console.log(`⚠️  ${vendorsWithoutCodes.length} vendors NEED promo codes\n`)

    if (vendorsWithoutCodes.length === 0) {
      console.log('🎉 All vendors already have promo codes!')
      return
    }

    // Step 4: Generate and update
    console.log('🔧 Generating promo codes...\n')

    let successCount = 0
    let errorCount = 0

    for (const vendor of vendorsWithoutCodes) {
      const businessName = vendor.business_name || vendor.owner_name || `VENDOR${vendor.id}`
      const promoCode = generatePromoCode(businessName, existingCodes)

      console.log(`  Processing: ${businessName}`)
      console.log(`    → Generated: ${promoCode}`)

      const { error: updateError } = await supabase
        .from('vendors')
        .update({ promo_code: promoCode })
        .eq('id', vendor.id)

      if (updateError) {
        console.log(`    ❌ Error: ${updateError.message}\n`)
        errorCount++
      } else {
        console.log(`    ✅ Updated!\n`)
        successCount++
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log(`✅ Successfully updated: ${successCount} vendors`)
    if (errorCount > 0) {
      console.log(`❌ Errors: ${errorCount} vendors`)
    }
    console.log('='.repeat(60) + '\n')

    // Step 5: Verify
    console.log('🔍 Verifying results...\n')

    const { data: verifyVendors, error: verifyError } = await supabase
      .from('vendors')
      .select('business_name, promo_code')
      .order('created_at', { ascending: false })
      .limit(15)

    if (!verifyError && verifyVendors) {
      console.log('📋 Latest 15 vendors:')
      verifyVendors.forEach((v, i) => {
        const status = v.promo_code ? '✅' : '❌'
        console.log(`  ${i + 1}. ${status} ${v.business_name}: ${v.promo_code || 'NO CODE'}`)
      })
    }

    // Final check
    const { data: stillMissing, error: missingError } = await supabase
      .from('vendors')
      .select('id')
      .or('promo_code.is.null,promo_code.eq.')

    if (!missingError) {
      if (stillMissing && stillMissing.length > 0) {
        console.log(`\n⚠️  WARNING: ${stillMissing.length} vendors still without codes`)
      } else {
        console.log('\n🎉 SUCCESS: All vendors now have promo codes!')
      }
    }

  } catch (error) {
    console.error('\n💥 Fatal error:', error.message)
    process.exit(1)
  }
}

main()
