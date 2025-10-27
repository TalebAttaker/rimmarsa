/**
 * POST /api/admin/vendors/approve
 *
 * REFACTORED VERSION - Using service layer pattern
 *
 * This demonstrates how the route is simplified by extracting business logic
 * to the service layer. Compare this to the original 295-line version.
 *
 * BEFORE: 295 lines with complex logic mixed with HTTP concerns
 * AFTER: ~50 lines focused purely on HTTP request/response handling
 */

import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin-middleware'
import { vendorApprovalService } from '@/lib/services/vendor-approval.service'
import { withErrorHandler } from '@/lib/api/error-handler'
import { createSuccessResponse, createErrorResponse } from '@/lib/api/utils'

export const POST = withErrorHandler(async (request: NextRequest) => {
  // 1. Require admin authentication
  const authResult = await requireAdmin(request)
  if (!authResult.success) {
    return authResult.response!
  }

  const admin = authResult.admin!

  // 2. Parse request body
  const { request_id, action, rejection_reason } = await request.json()

  if (!request_id) {
    return createErrorResponse('Vendor request ID is required', 400)
  }

  // 3. Handle approval or rejection
  if (action === 'reject') {
    if (!rejection_reason) {
      return createErrorResponse('Rejection reason is required', 400)
    }

    await vendorApprovalService.rejectRequest(request_id, admin.id, rejection_reason)

    return createSuccessResponse(
      { request_id, status: 'rejected' },
      'Vendor request rejected successfully'
    )
  }

  // 4. Approve request (all complex logic is in the service)
  const result = await vendorApprovalService.approveRequest(request_id, admin.id)

  return createSuccessResponse(result, 'Vendor approved successfully')
})

/**
 * COMPARISON NOTES:
 *
 * Original route.ts: 295 lines
 * - Mixed HTTP handling with business logic
 * - Hard to test without HTTP mocking
 * - Difficult to reuse logic elsewhere
 * - Complex error handling scattered throughout
 *
 * Refactored route: ~50 lines
 * - Pure HTTP request/response handling
 * - Business logic in testable service layer
 * - Consistent error handling via middleware
 * - Service can be reused in other contexts
 *
 * Benefits:
 * 1. Easier to test (service logic isolated)
 * 2. Better separation of concerns
 * 3. More maintainable
 * 4. Easier to add features (just update service)
 * 5. Consistent error handling
 *
 * Lines of code saved: ~245 lines per route
 * With similar pattern applied to 15 routes: ~3,675 lines total reduction
 */
