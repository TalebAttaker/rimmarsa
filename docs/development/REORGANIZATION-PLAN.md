# Rimmarsa Marketplace - Reorganization & Migration Plan

**Document Version:** 1.0.0
**Date:** 2025-10-27
**Estimated Duration:** 18-28 days
**Risk Level:** Medium

---

## Executive Summary

This document provides a step-by-step migration plan to transform the Rimmarsa marketplace from its current disorganized state to a production-ready, maintainable codebase. The plan is designed to minimize disruption to the live production system while systematically addressing technical debt, security issues, and organizational chaos.

**Critical Success Factors:**
- No production downtime during migration
- All changes tested in staging before production
- Incremental rollout with rollback capability
- Continuous validation of production system
- Team coordination and clear communication

---

## Migration Principles

1. **Safety First** - No changes that risk production stability
2. **Incremental Progress** - Small, testable changes over big bang migrations
3. **Continuous Testing** - Test after every change
4. **Documentation as We Go** - Document immediately, not later
5. **Rollback Ready** - Every change must be reversible
6. **Production Monitoring** - Watch metrics closely during changes

---

## Pre-Migration Checklist

### Before Starting ANY Work

- [ ] **Backup Production Database**
  ```bash
  # Use Supabase dashboard or CLI
  supabase db dump > backup-$(date +%Y%m%d).sql
  ```

- [ ] **Document Current Production State**
  - Record current version numbers (web, mobile)
  - Capture current metrics (users, vendors, products)
  - Take screenshots of admin dashboard
  - Export database schema

- [ ] **Create Emergency Rollback Plan**
  - Document how to revert each change
  - Test rollback procedures
  - Assign rollback responsibility

- [ ] **Set Up Communication Channels**
  - Daily standup times
  - Emergency contact list
  - Status update schedule
  - Stakeholder notification plan

- [ ] **Prepare Development Environment**
  - Clone repository
  - Install dependencies
  - Verify local builds
  - Test database connection

- [ ] **Create Git Branch Strategy**
  ```
  main (production)
    └── develop (integration branch)
        ├── feature/documentation-cleanup
        ├── feature/mobile-refactor
        ├── feature/security-hardening
        └── feature/testing-implementation
  ```

---

## Phase 1: Foundation & Safety (Days 1-3)

**Goal:** Establish safe working environment and organize documentation
**Risk:** LOW
**Can Deploy to Production:** YES (documentation only)

### Step 1.1: Create Staging Environment (Day 1)

**Prerequisites:** None
**Estimated Time:** 4-6 hours

1. **Create staging database on Supabase**
   ```bash
   # Via Supabase dashboard
   # Create new project: rimmarsa-staging
   # Or create branch database (if using Supabase branching)
   ```

2. **Configure staging Vercel deployment**
   ```bash
   # Link staging environment
   vercel link --project rimmarsa-staging

   # Set environment variables
   vercel env add NEXT_PUBLIC_SUPABASE_URL staging
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY staging
   vercel env add SUPABASE_SERVICE_ROLE_KEY staging
   ```

3. **Seed staging database**
   ```bash
   # Run migrations
   cd supabase
   supabase db push --db-url $STAGING_DB_URL

   # Seed test data
   psql $STAGING_DB_URL < seed-data.sql
   ```

4. **Test staging deployment**
   - Deploy to staging
   - Verify all pages load
   - Test critical user flows
   - Verify database connections

**Rollback:** Delete staging environment if issues arise

### Step 1.2: Set Up Git Workflow (Day 1)

**Prerequisites:** None
**Estimated Time:** 1-2 hours

1. **Create branch protection rules**
   ```
   GitHub Repository Settings > Branches

   main branch:
   - Require pull request reviews (1 reviewer)
   - Require status checks to pass
   - Require conversation resolution
   - Include administrators
   ```

2. **Create develop branch**
   ```bash
   git checkout -b develop
   git push origin develop
   ```

3. **Create PR template**
   ```bash
   # Create .github/pull_request_template.md
   ```

**Verification:**
- Try to push directly to main (should fail)
- Create test PR
- Verify checks run

### Step 1.3: Documentation Reorganization (Days 1-2)

**Prerequisites:** Step 1.2 complete
**Estimated Time:** 8-12 hours
**Related Tasks:** TASK-001 through TASK-007

1. **Create documentation structure**
   ```bash
   cd /home/taleb/rimmarsa
   mkdir -p docs/{getting-started,architecture,api,deployment,development,security,operations,release-notes}

   # Create README in each directory
   for dir in docs/*/; do
     echo "# $(basename $dir)" > "$dir/README.md"
   done
   ```

2. **Consolidate deployment documentation**
   ```bash
   # Create consolidated deployment guide
   cat > docs/deployment/web-deployment.md <<EOF
   # Web Marketplace Deployment Guide

   ## Overview
   ... (consolidate from 8+ deployment files)
   EOF

   cat > docs/deployment/mobile-deployment.md <<EOF
   # Mobile App Deployment Guide

   ## Overview
   ... (consolidate from mobile deployment docs)
   EOF
   ```

3. **Move and consolidate files systematically**

   **Security Documentation:**
   ```bash
   # Extract unique content from each file
   cat SECURITY-UPGRADE-V1.6.0.md \
       SECURITY_ASSESSMENT_VENDOR_MOBILE_APP.md \
       SECURITY_IMPLEMENTATION_GUIDE.md > \
       docs/security/security-overview.md

   # Create specific guides
   mv MOBILE_APP_SECURITY_CHECKLIST.md docs/security/mobile-security-checklist.md
   ```

   **API Documentation:**
   ```bash
   # Create API docs from code inspection
   # See TASK-007 for detailed API documentation
   ```

   **Architecture:**
   ```bash
   # Move architecture content
   cp SPECIFICATION.md docs/architecture/system-specification.md
   ```

4. **Archive old documentation**
   ```bash
   mkdir docs/archive/session-summaries
   mv SESSION-*.md docs/archive/session-summaries/

   mkdir docs/archive/deployment-logs
   mv DEPLOYMENT-*.md docs/archive/deployment-logs/
   ```

5. **Update root README**
   ```bash
   cat > README.md <<EOF
   # Rimmarsa - Multi-Vendor Marketplace Platform

   Production marketplace serving Mauritania.

   ## Documentation

   All documentation is in \`/docs/\`:
   - [Getting Started](docs/getting-started/)
   - [Architecture](docs/architecture/)
   - [API Documentation](docs/api/)
   - [Deployment](docs/deployment/)
   - [Security](docs/security/)

   ## Quick Links

   - Production: https://www.rimmarsa.com
   - Staging: https://staging.rimmarsa.com
   - Supabase: https://supabase.com/dashboard/project/[project-id]

   ## Local Development

   See [Development Guide](docs/development/local-setup.md)
   EOF
   ```

6. **Commit and create PR**
   ```bash
   git checkout -b feature/documentation-cleanup
   git add docs/
   git add README.md
   git commit -m "docs: reorganize documentation into structured hierarchy

   - Create /docs/ directory structure
   - Consolidate 50+ markdown files
   - Archive session summaries
   - Update root README

   Related tasks: TASK-001 through TASK-006"

   git push origin feature/documentation-cleanup

   # Create PR on GitHub
   # Get approval
   # Merge to develop
   ```

**Verification:**
- All documentation is accessible
- No broken links
- Root directory has < 5 markdown files
- Documentation reads coherently

**Rollback:** Revert commit if issues found

**Production Impact:** NONE (documentation only)

### Step 1.4: Clean Up Old Files (Day 2)

**Prerequisites:** Step 1.3 complete
**Estimated Time:** 2-3 hours
**Related Tasks:** TASK-006, TASK-701

1. **Identify files to remove**
   ```bash
   # Find old/backup files
   find . -name "*_old.*" -o -name "*.backup" | grep -v node_modules

   # Find old build artifacts
   find . -name "*.pack.old" | grep -v node_modules
   ```

2. **Verify files aren't referenced**
   ```bash
   # For each file found
   FILE="marketplace/src/app/vendors/page_old.tsx"

   # Search for imports/references
   rg "page_old" --type ts --type tsx

   # If no references, safe to delete
   ```

3. **Remove old files**
   ```bash
   git checkout -b feature/cleanup-old-files

   # Remove backup files
   git rm marketplace/src/app/vendors/page_old.tsx

   # Remove build artifacts (don't commit, just clean)
   find .next -name "*.pack.old" -delete

   git commit -m "chore: remove old and backup files

   - Remove page_old.tsx (replaced by page.tsx)
   - Clean build artifacts

   Related: TASK-701"

   git push origin feature/cleanup-old-files
   ```

4. **Update .gitignore**
   ```bash
   # Add patterns to prevent future backup files
   echo "*.old" >> .gitignore
   echo "*.backup" >> .gitignore

   git add .gitignore
   git commit -m "chore: prevent backup files in git"
   ```

**Verification:**
- Build succeeds
- All pages load correctly
- No broken imports

**Rollback:** `git revert` if issues arise

**Production Impact:** NONE

---

## Phase 2: Mobile App Refactoring (Days 4-10)

**Goal:** Break down monolithic App.js into maintainable modules
**Risk:** MEDIUM-HIGH
**Can Deploy to Production:** YES (with thorough testing)

### WARNING: This is the Most Critical Phase

Mobile app refactoring carries risk. Follow these safety measures:

1. **ALWAYS test on physical device** before publishing
2. **Keep old version available** for rollback
3. **Version bump appropriately** (1.7.0 → 1.8.0)
4. **Gradual rollout** - don't force update immediately
5. **Monitor crash reports** closely after release

### Step 2.1: Set Up Mobile Development Environment (Day 4)

**Prerequisites:** Phase 1 complete
**Estimated Time:** 2-3 hours

1. **Create feature branch**
   ```bash
   git checkout develop
   git pull
   git checkout -b feature/mobile-refactor
   ```

2. **Install dependencies and verify build**
   ```bash
   cd mobile-app
   npm install

   # Test current build
   npm start
   # Verify app runs on emulator/device
   ```

3. **Create TypeScript configuration**
   ```bash
   # Initialize TypeScript
   npx tsc --init

   # Configure for React Native
   cat > tsconfig.json <<EOF
   {
     "extends": "expo/tsconfig.base",
     "compilerOptions": {
       "strict": true,
       "esModuleInterop": true,
       "skipLibCheck": true
     }
   }
   EOF
   ```

4. **Install TypeScript dependencies**
   ```bash
   npm install --save-dev typescript @types/react @types/react-native
   ```

**Verification:**
- TypeScript compiles without errors
- App still runs correctly

### Step 2.2: Create Feature Directory Structure (Day 4)

**Prerequisites:** Step 2.1 complete
**Estimated Time:** 1-2 hours
**Related Tasks:** TASK-101

1. **Create new directory structure**
   ```bash
   cd src
   mkdir -p features/{auth,registration,products,dashboard,analytics}/{screens,components,hooks,services}
   mkdir -p shared/{components,hooks,services,utils}
   mkdir -p config
   ```

2. **Create index files for exports**
   ```bash
   # Create barrel exports
   touch features/auth/index.ts
   touch features/registration/index.ts
   # ... etc for each feature
   ```

3. **Commit structure**
   ```bash
   git add src/features src/shared src/config
   git commit -m "feat: create feature-based directory structure for mobile app

   - Add features/ directory for feature modules
   - Add shared/ directory for common code
   - Add config/ directory for configuration

   Related: TASK-101"
   ```

### Step 2.3: Extract Configuration (Day 4)

**Prerequisites:** Step 2.2 complete
**Estimated Time:** 2-3 hours
**Related Tasks:** TASK-107, TASK-201

1. **Create environment configuration**
   ```bash
   cd mobile-app

   # Create .env.example
   cat > .env.example <<EOF
   SUPABASE_URL=
   SUPABASE_ANON_KEY=
   API_URL=
   APP_VERSION=
   EOF

   # Create .env (don't commit)
   cat > .env <<EOF
   SUPABASE_URL=https://rfyqzuuuumgdoomyhqcu.supabase.co
   SUPABASE_ANON_KEY=eyJ...
   API_URL=https://www.rimmarsa.com
   APP_VERSION=1.8.0
   EOF

   # Update .gitignore
   echo ".env" >> .gitignore
   ```

2. **Create config files**
   ```typescript
   // src/config/env.ts
   export const ENV = {
     SUPABASE_URL: process.env.SUPABASE_URL || '',
     SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
     API_URL: process.env.API_URL || 'https://www.rimmarsa.com',
     APP_VERSION: process.env.APP_VERSION || '1.8.0',
   }

   // Validate required env vars
   const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY']
   required.forEach(key => {
     if (!ENV[key]) {
       throw new Error(`Missing required environment variable: ${key}`)
     }
   })
   ```

   ```typescript
   // src/config/constants.ts
   export const VERSION_CHECK_URL = `${ENV.API_URL}/api/app-version`

   export const PRICING_PLANS = [
     {
       id: '1_month',
       name: 'خطة شهر واحد',
       price: 1250,
       duration: '30 يوم',
       features: [
         'وصول كامل للمنصة',
         'منتجات غير محدودة',
         'دعم العملاء',
         'لوحة التحليلات'
       ]
     },
     {
       id: '2_months',
       name: 'خطة شهرين',
       price: 1600,
       duration: '60 يوم',
       savings: 'وفر 350 أوقية',
       features: [
         'وصول كامل للمنصة',
         'منتجات غير محدودة',
         'دعم العملاء ذو الأولوية',
         'لوحة التحليلات',
         'شارة البائع المميز'
       ]
     }
   ]
   ```

3. **Update imports throughout codebase**
   ```typescript
   // Before (in App.js)
   const CURRENT_VERSION = '1.5.1'
   const VERSION_CHECK_URL = 'https://www.rimmarsa.com/api/app-version'

   // After
   import { ENV } from './config/env'
   import { VERSION_CHECK_URL, PRICING_PLANS } from './config/constants'
   ```

4. **Test configuration**
   ```bash
   # Verify app starts with new config
   npm start

   # Test with missing env var
   mv .env .env.backup
   npm start  # Should throw error about missing env vars
   mv .env.backup .env
   ```

5. **Commit changes**
   ```bash
   git add src/config/
   git add .env.example
   git add .gitignore
   git commit -m "feat: implement environment-based configuration

   - Remove hardcoded credentials
   - Create env.ts for environment variables
   - Create constants.ts for app constants
   - Add .env.example for documentation

   Related: TASK-107, TASK-201

   BREAKING CHANGE: Requires .env file for local development"
   ```

### Step 2.4: Extract Authentication Feature (Days 5-6)

**Prerequisites:** Step 2.3 complete
**Estimated Time:** 8-10 hours
**Related Tasks:** TASK-102

1. **Create auth service**
   ```typescript
   // src/features/auth/services/authService.ts
   import { createClient } from '@supabase/supabase-js'
   import { ENV } from '../../../config/env'

   const supabase = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY)

   export const authService = {
     async login(phone: string, password: string) {
       const response = await fetch(`${ENV.API_URL}/api/vendor/login`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ phone, password })
       })
       return response.json()
     },

     async logout() {
       // Clear session logic
     },

     async checkSession() {
       // Session validation logic
     }
   }
   ```

2. **Create auth hook**
   ```typescript
   // src/features/auth/hooks/useAuth.ts
   import { useState } from 'react'
   import { authService } from '../services/authService'
   import { storeToken, getToken, clearToken } from '../../../shared/services/storage'

   export const useAuth = () => {
     const [loading, setLoading] = useState(false)
     const [error, setError] = useState<string | null>(null)
     const [isAuthenticated, setIsAuthenticated] = useState(false)

     const login = async (phone: string, password: string) => {
       setLoading(true)
       setError(null)
       try {
         const result = await authService.login(phone, password)
         if (result.success) {
           await storeToken(result.token)
           setIsAuthenticated(true)
           return result.vendor
         } else {
           setError(result.error)
           return null
         }
       } catch (err) {
         setError('فشل تسجيل الدخول')
         return null
       } finally {
         setLoading(false)
       }
     }

     const logout = async () => {
       await clearToken()
       setIsAuthenticated(false)
     }

     return { login, logout, loading, error, isAuthenticated }
   }
   ```

3. **Create login screen**
   ```typescript
   // src/features/auth/screens/LoginScreen.tsx
   import React, { useState } from 'react'
   import { View, Text, StyleSheet } from 'react-native'
   import { useAuth } from '../hooks/useAuth'
   import { Button, Input } from '../../../shared/components'

   export const LoginScreen = ({ navigation }) => {
     const [phone, setPhone] = useState('')
     const [password, setPassword] = useState('')
     const { login, loading, error } = useAuth()

     const handleLogin = async () => {
       const vendor = await login(phone, password)
       if (vendor) {
         navigation.navigate('Dashboard')
       }
     }

     return (
       <View style={styles.container}>
         <Text style={styles.title}>تسجيل الدخول</Text>
         <Input
           value={phone}
           onChangeText={setPhone}
           placeholder="رقم الهاتف"
           keyboardType="phone-pad"
         />
         <Input
           value={password}
           onChangeText={setPassword}
           placeholder="كلمة المرور"
           secureTextEntry
         />
         {error && <Text style={styles.error}>{error}</Text>}
         <Button
           title="دخول"
           onPress={handleLogin}
           loading={loading}
         />
       </View>
     )
   }

   const styles = StyleSheet.create({
     container: { flex: 1, padding: 20 },
     title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
     error: { color: 'red', marginVertical: 10 }
   })
   ```

4. **Update App.js to use new login screen**
   ```typescript
   // App.js (temporary dual implementation for testing)
   import { LoginScreen } from './src/features/auth/screens/LoginScreen'

   // Replace inline login screen with:
   {screen === 'login' && <LoginScreen navigation={{...}} />}
   ```

5. **Test authentication flow**
   - Test login with valid credentials
   - Test login with invalid credentials
   - Test error handling
   - Test navigation after login

6. **Commit auth feature**
   ```bash
   git add src/features/auth/
   git add App.js
   git commit -m "feat: extract authentication to separate feature module

   - Create auth service with API integration
   - Create useAuth hook for state management
   - Create LoginScreen component
   - Remove ~200 lines from App.js

   Related: TASK-102"
   ```

### Step 2.5: Extract Registration Feature (Days 6-7)

**Prerequisites:** Step 2.4 complete
**Estimated Time:** 10-12 hours
**Related Tasks:** TASK-103

**Note:** This is the largest extraction. Break into sub-tasks:

1. **Create registration service** (2 hours)
2. **Create step components** (4 hours)
3. **Create registration screen** (3 hours)
4. **Integrate upload functionality** (2 hours)
5. **Test complete flow** (1 hour)

Follow similar pattern to authentication extraction. See tasks.json TASK-103 for detailed file list.

### Step 2.6: Extract Products Feature (Day 8)

**Prerequisites:** Step 2.5 complete
**Estimated Time:** 8-10 hours
**Related Tasks:** TASK-104

Follow similar pattern. Extract:
- Product listing
- Add product
- Edit product
- Product API service

### Step 2.7: Extract Dashboard & Analytics (Day 9)

**Prerequisites:** Step 2.6 complete
**Estimated Time:** 6-8 hours
**Related Tasks:** TASK-105

### Step 2.8: Create Shared Components (Day 9)

**Prerequisites:** None (can run in parallel)
**Estimated Time:** 4-6 hours
**Related Tasks:** TASK-106

### Step 2.9: Final App.js Refactor (Day 10)

**Prerequisites:** All extractions complete (2.4-2.8)
**Estimated Time:** 4-6 hours
**Related Tasks:** TASK-108

**Goal:** Reduce App.js to < 200 lines

1. **Create main App component**
   ```typescript
   // src/app/App.tsx
   import React, { useState, useEffect } from 'react'
   import { NavigationContainer } from '@react-navigation/native'
   import { createNativeStackNavigator } from '@react-navigation/native-stack'
   import { checkForUpdates } from './services/updateService'

   // Import screens from features
   import { LoginScreen } from '../features/auth'
   import { RegistrationScreen } from '../features/registration'
   import { DashboardScreen } from '../features/dashboard'
   import { ProductsScreen } from '../features/products'

   const Stack = createNativeStackNavigator()

   export default function App() {
     const [updateInfo, setUpdateInfo] = useState(null)

     useEffect(() => {
       checkForUpdates().then(setUpdateInfo)
     }, [])

     return (
       <>
         <NavigationContainer>
           <Stack.Navigator initialRouteName="Login">
             <Stack.Screen name="Login" component={LoginScreen} />
             <Stack.Screen name="Registration" component={RegistrationScreen} />
             <Stack.Screen name="Dashboard" component={DashboardScreen} />
             <Stack.Screen name="Products" component={ProductsScreen} />
           </Stack.Navigator>
         </NavigationContainer>

         {updateInfo?.hasUpdate && (
           <UpdateModal info={updateInfo} />
         )}
       </>
     )
   }
   ```

2. **Move old App.js**
   ```bash
   mv App.js App.old.js  # Keep as reference during migration
   mv src/app/App.tsx App.js  # React Native looks for App.js
   ```

3. **Test complete app**
   ```bash
   # Clean and rebuild
   cd android && ./gradlew clean && cd ..
   npm start --reset-cache

   # Test all flows:
   # - Registration
   # - Login
   # - Product management
   # - Dashboard
   # - Analytics
   ```

4. **Compare file sizes**
   ```bash
   wc -l App.old.js  # Should be ~1737 lines
   wc -l App.js      # Should be < 200 lines
   ```

5. **Commit final refactor**
   ```bash
   git add App.js src/
   git commit -m "feat: complete mobile app refactoring

   - Reduce App.js from 1737 to <200 lines
   - Implement feature-based architecture
   - Separate business logic from UI
   - Improve code maintainability

   Related: TASK-108

   BREAKING CHANGE: Major architectural refactor"
   ```

### Step 2.10: Mobile App Testing & Release (Day 10)

**Prerequisites:** Step 2.9 complete
**Estimated Time:** 4-6 hours

1. **Thorough testing on physical device**
   - Test all user flows end-to-end
   - Test on different Android versions (if possible)
   - Test offline scenarios
   - Test error scenarios

2. **Update version**
   ```typescript
   // src/config/env.ts
   APP_VERSION: '1.8.0'

   // app.config.js
   version: '1.8.0'
   versionCode: 8
   ```

3. **Build APK**
   ```bash
   # Use consolidated build script
   cd mobile-app
   npm run build:production

   # Or manual
   cd android
   ./gradlew assembleRelease
   cd ..
   ```

4. **Test APK on clean device**
   - Uninstall old version
   - Install new APK
   - Test complete registration flow
   - Test login and product management

5. **Upload to R2**
   ```bash
   # Use upload script
   ./scripts/upload-apk.sh mobile-app/android/app/build/outputs/apk/release/app-release.apk 1.8.0
   ```

6. **Update database**
   ```sql
   INSERT INTO app_versions (
     app_name,
     version,
     build_number,
     minimum_version,
     download_url,
     release_notes_ar,
     release_notes_en,
     force_update,
     is_active
   ) VALUES (
     'vendor',
     '1.8.0',
     8,
     '1.7.0',
     'https://pub-xxx.r2.dev/rimmarsa-vendor-app-v1.8.0.apk',
     ARRAY[
       'إعادة هيكلة التطبيق بالكامل',
       'تحسين الأداء والاستقرار',
       'إصلاح الأخطاء',
       'تحسين الأمان'
     ],
     ARRAY[
       'Complete app restructuring',
       'Performance and stability improvements',
       'Bug fixes',
       'Security enhancements'
     ],
     false,  -- Don't force update initially
     true
   );
   ```

7. **Gradual rollout**
   - Don't set force_update immediately
   - Monitor for 24-48 hours
   - Watch for crash reports
   - If stable, then consider force_update

8. **Merge to develop**
   ```bash
   git push origin feature/mobile-refactor

   # Create PR
   # Get thorough review
   # Merge to develop
   # Deploy to staging
   # Test on staging
   # Merge to main
   ```

**Verification Checklist:**
- [ ] All existing functionality works
- [ ] No crashes or errors
- [ ] Performance is same or better
- [ ] APK size is same or smaller
- [ ] Security is maintained or improved
- [ ] Code is more maintainable

**Rollback Plan:**
If issues arise:
1. Set previous version (1.7.0) as active in database
2. Set force_update=false for new version
3. Communicate issue to users
4. Fix issues and re-release

---

## Phase 3: Security Hardening (Days 11-13)

**Goal:** Address security gaps identified in analysis
**Risk:** MEDIUM
**Can Deploy to Production:** YES (incrementally)

### Step 3.1: Enable ESLint (Day 11)

**Prerequisites:** Phase 2 complete (or can run in parallel)
**Estimated Time:** 4-6 hours
**Related Tasks:** TASK-202

1. **Fix existing lint errors**
   ```bash
   cd marketplace

   # Run linter to see errors
   npx eslint . --ext .ts,.tsx

   # Fix auto-fixable errors
   npx eslint . --ext .ts,.tsx --fix

   # Manually fix remaining errors
   ```

2. **Enable strict linting**
   ```javascript
   // eslint.config.mjs
   export default [
     {
       rules: {
         'no-console': ['warn', { allow: ['error', 'warn'] }],
         '@typescript-eslint/no-explicit-any': 'error',
         '@typescript-eslint/no-unused-vars': 'error',
         'max-lines': ['error', { max: 300, skipComments: true }],
         'complexity': ['error', 10]
       }
     }
   ]
   ```

3. **Remove ignoreDuringBuilds**
   ```javascript
   // next.config.js
   const nextConfig = {
     // Remove or comment out:
     // eslint: {
     //   ignoreDuringBuilds: true,
     // },
   }
   ```

4. **Verify build**
   ```bash
   npm run build
   # Should succeed with no errors
   ```

5. **Commit**
   ```bash
   git checkout -b feature/enable-eslint
   git add .
   git commit -m "fix: enable ESLint in production builds

   - Fix all existing lint errors
   - Enable strict TypeScript rules
   - Remove ignoreDuringBuilds flag

   Related: TASK-202"
   ```

### Step 3.2: Implement Input Validation (Days 11-12)

**Prerequisites:** None
**Estimated Time:** 8-10 hours
**Related Tasks:** TASK-203

**Strategy:** Implement validation route by route

1. **Install Zod if not already installed**
   ```bash
   cd marketplace
   npm install zod
   ```

2. **Create validation schemas**
   ```typescript
   // src/lib/validation/api-schemas.ts
   import { z } from 'zod'

   export const vendorLoginSchema = z.object({
     phone: z.string()
       .regex(/^[0-9]{8}$/, 'رقم الهاتف يجب أن يكون 8 أرقام'),
     password: z.string()
       .min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل')
   })

   export const createProductSchema = z.object({
     name: z.string().min(1, 'اسم المنتج مطلوب'),
     price: z.number().positive('السعر يجب أن يكون أكبر من صفر'),
     category_id: z.string().uuid('معرف الفئة غير صحيح'),
     // ... etc
   })

   // Add schemas for all endpoints
   ```

3. **Create validation middleware**
   ```typescript
   // src/lib/validation/validate.ts
   import { NextRequest, NextResponse } from 'next/server'
   import { z } from 'zod'

   export async function validateRequest<T>(
     request: NextRequest,
     schema: z.Schema<T>
   ): Promise<{ success: true; data: T } | { success: false; response: NextResponse }> {
     try {
       const body = await request.json()
       const data = schema.parse(body)
       return { success: true, data }
     } catch (error) {
       if (error instanceof z.ZodError) {
         return {
           success: false,
           response: NextResponse.json(
             {
               error: 'بيانات غير صحيحة',
               details: error.errors
             },
             { status: 400 }
           )
         }
       }
       return {
         success: false,
         response: NextResponse.json(
           { error: 'خطأ في معالجة الطلب' },
           { status: 400 }
         )
       }
     }
   }
   ```

4. **Apply validation to API routes**
   ```typescript
   // src/app/api/vendor/login/route.ts
   import { validateRequest } from '@/lib/validation/validate'
   import { vendorLoginSchema } from '@/lib/validation/api-schemas'

   export async function POST(request: NextRequest) {
     // Validate input
     const validation = await validateRequest(request, vendorLoginSchema)
     if (!validation.success) {
       return validation.response
     }

     const { phone, password } = validation.data

     // Proceed with login logic...
   }
   ```

5. **Test validation**
   - Test with valid data
   - Test with invalid data
   - Test with missing fields
   - Test with wrong types

6. **Repeat for all API endpoints**

7. **Commit incrementally**
   ```bash
   git add src/lib/validation/
   git commit -m "feat: add Zod validation infrastructure"

   git add src/app/api/vendor/login/
   git commit -m "feat: add input validation to vendor login endpoint"

   # Continue for each endpoint
   ```

### Step 3.3: Rename Admin Route (Day 12)

**Prerequisites:** None
**Estimated Time:** 2-3 hours
**Related Tasks:** TASK-204

1. **Rename directory**
   ```bash
   cd marketplace/src/app
   git mv fassalapremierprojectbsk admin
   ```

2. **Update imports and links**
   ```bash
   # Find all references
   rg "fassalapremierprojectbsk" --type ts --type tsx

   # Update each file
   # Change imports: from '/fassalapremierprojectbsk' to '/admin'
   ```

3. **Add redirect from old URL**
   ```typescript
   // src/app/fassalapremierprojectbsk/page.tsx
   import { redirect } from 'next/navigation'

   export default function OldAdminRoute() {
     redirect('/admin')
   }
   ```

4. **Test admin access**
   - Navigate to /admin
   - Verify all admin pages work
   - Verify old URL redirects

5. **Commit**
   ```bash
   git add .
   git commit -m "refactor: rename admin route from obscure name to /admin

   - Rename fassalapremierprojectbsk to admin
   - Add redirect from old URL
   - Update all references

   Related: TASK-204"
   ```

### Step 3.4: Implement Additional Security Measures (Day 13)

**Prerequisites:** None
**Estimated Time:** 6-8 hours
**Related Tasks:** TASK-205, TASK-206, TASK-208

Follow tasks.json for detailed steps on:
- CSRF protection
- API request signing
- Audit logging

---

## Phase 4: Testing Implementation (Days 14-18)

**Goal:** Establish comprehensive testing suite
**Risk:** LOW
**Can Deploy to Production:** YES (tests don't affect production)

### Step 4.1: Set Up Testing Infrastructure (Day 14)

**Prerequisites:** None
**Estimated Time:** 4-6 hours
**Related Tasks:** TASK-301

1. **Install testing dependencies**
   ```bash
   cd marketplace
   npm install --save-dev \
     @testing-library/react \
     @testing-library/jest-dom \
     @testing-library/user-event \
     jest \
     jest-environment-jsdom \
     @playwright/test
   ```

2. **Configure Jest**
   ```javascript
   // jest.config.js
   module.exports = {
     testEnvironment: 'jsdom',
     setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
     moduleNameMapper: {
       '^@/(.*)$': '<rootDir>/src/$1',
     },
     collectCoverageFrom: [
       'src/**/*.{ts,tsx}',
       '!src/**/*.d.ts',
       '!src/**/*.stories.tsx',
     ],
     coverageThresholds: {
       global: {
         branches: 80,
         functions: 80,
         lines: 80,
         statements: 80
       }
     }
   }
   ```

3. **Configure Playwright**
   ```typescript
   // playwright.config.ts
   import { defineConfig } from '@playwright/test'

   export default defineConfig({
     testDir: './tests/e2e',
     use: {
       baseURL: 'http://localhost:3000',
     },
   })
   ```

4. **Add test scripts**
   ```json
   // package.json
   {
     "scripts": {
       "test": "jest",
       "test:watch": "jest --watch",
       "test:coverage": "jest --coverage",
       "test:e2e": "playwright test"
     }
   }
   ```

### Step 4.2: Write Unit Tests (Days 14-15)

**Prerequisites:** Step 4.1 complete
**Estimated Time:** 12-16 hours
**Related Tasks:** TASK-302

Start with utility functions, then components. See tasks.json for details.

### Step 4.3: Write Integration Tests (Days 16-17)

**Prerequisites:** Step 4.1 complete
**Estimated Time:** 16-20 hours
**Related Tasks:** TASK-304

Test all API endpoints. See tasks.json for details.

### Step 4.4: Write E2E Tests (Day 18)

**Prerequisites:** Step 4.1 complete
**Estimated Time:** 8-10 hours
**Related Tasks:** TASK-305

Test critical user flows. See tasks.json for details.

---

## Phase 5: CI/CD & Infrastructure (Days 19-21)

**Goal:** Automate deployments and testing
**Risk:** LOW
**Can Deploy to Production:** YES

### Step 5.1: Create GitHub Actions Workflows (Day 19-20)

**Prerequisites:** Testing infrastructure complete
**Estimated Time:** 10-12 hours
**Related Tasks:** TASK-401, TASK-402

See tasks.json for detailed workflow configurations.

### Step 5.2: Set Up Monitoring (Day 21)

**Prerequisites:** None
**Estimated Time:** 6-8 hours
**Related Tasks:** TASK-501, TASK-502, TASK-503

See tasks.json for monitoring setup.

---

## Phase 6: Performance & Polish (Days 22-25)

**Goal:** Optimize performance and clean up code
**Risk:** LOW
**Can Deploy to Production:** YES (incrementally)

See tasks.json Phase 7 for detailed tasks.

---

## Post-Migration Checklist

After ALL phases complete:

### Production Verification

- [ ] All tests passing in CI/CD
- [ ] Manual testing of critical flows
- [ ] Performance metrics stable or improved
- [ ] No increase in error rates
- [ ] Security scan passed
- [ ] Backup verified and tested

### Documentation

- [ ] All documentation updated
- [ ] API documentation complete
- [ ] Architecture diagrams current
- [ ] Runbooks created
- [ ] Release notes published

### Team Handoff

- [ ] Team trained on new structure
- [ ] Development workflows documented
- [ ] Deployment procedures updated
- [ ] Emergency contacts updated
- [ ] Knowledge transfer complete

### Monitoring

- [ ] Monitoring dashboards active
- [ ] Alerts configured
- [ ] Error tracking enabled
- [ ] Performance tracking enabled
- [ ] Business metrics tracking enabled

---

## Rollback Procedures

### Emergency Rollback

If CRITICAL issues arise in production:

1. **Immediate Actions:**
   ```bash
   # Revert to last known good deployment
   vercel rollback

   # Or deploy specific deployment
   vercel promote <deployment-url>
   ```

2. **Mobile App Rollback:**
   ```sql
   -- Set previous version as active
   UPDATE app_versions
   SET is_active = false
   WHERE version = '1.8.0';

   UPDATE app_versions
   SET is_active = true
   WHERE version = '1.7.0';
   ```

3. **Database Rollback:**
   ```bash
   # Restore from backup
   psql $DATABASE_URL < backup-YYYYMMDD.sql
   ```

4. **Communicate:**
   - Notify team
   - Update status page
   - Inform stakeholders

### Partial Rollback

If specific features have issues:

1. **Feature Flags:**
   - Disable problematic features
   - Keep rest of system running

2. **Code Revert:**
   ```bash
   git revert <commit-hash>
   git push origin main
   # Vercel auto-deploys
   ```

---

## Risk Mitigation

### High-Risk Activities

| Activity | Risk | Mitigation |
|----------|------|------------|
| Mobile app refactor | Breaking changes | Thorough testing, gradual rollout, keep old version available |
| Admin route rename | Broken links | Redirects, comprehensive testing |
| ESLint enablement | Build failures | Fix all errors first, incremental enablement |
| Database migrations | Data loss | Backups before each migration, test on staging |

### Continuous Risk Management

- Monitor error rates daily
- Review deployment metrics
- Regular security scans
- Performance monitoring
- User feedback channels

---

## Success Metrics

### Code Quality Metrics

- [ ] Codebase reduced by > 20% (line count)
- [ ] No files > 300 lines
- [ ] Test coverage > 80%
- [ ] TypeScript strict mode enabled
- [ ] Zero ESLint errors

### Performance Metrics

- [ ] Build time < 2 minutes
- [ ] Page load time < 2 seconds
- [ ] Mobile app size < 20MB
- [ ] API response time < 500ms (p95)

### Operational Metrics

- [ ] Deployment time < 5 minutes
- [ ] Mean time to recovery < 30 minutes
- [ ] Zero production incidents during migration
- [ ] 99.9% uptime maintained

### Developer Experience

- [ ] Onboarding time < 1 day
- [ ] Documentation completeness > 90%
- [ ] Developer satisfaction improved
- [ ] Contribution velocity increased

---

## Timeline Summary

| Phase | Duration | Status |
|-------|----------|--------|
| Phase 1: Foundation | Days 1-3 | Not Started |
| Phase 2: Mobile Refactor | Days 4-10 | Not Started |
| Phase 3: Security | Days 11-13 | Not Started |
| Phase 4: Testing | Days 14-18 | Not Started |
| Phase 5: CI/CD | Days 19-21 | Not Started |
| Phase 6: Performance | Days 22-25 | Not Started |
| **Total** | **25 days** | **0% Complete** |

---

## Next Steps

1. **Review this plan with team**
2. **Get stakeholder approval**
3. **Schedule start date**
4. **Assign team members to phases**
5. **Set up communication channels**
6. **Begin Phase 1**

---

**Document End**

For detailed task breakdown, see **tasks.json**
For technical details, see **SPECIFICATION.md**
