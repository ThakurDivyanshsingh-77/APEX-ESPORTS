const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

// In-memory platform settings store
let platformSettings = {
  maintenanceMode: false,
  platformFeePercentage: 10,
  defaultUPI: 'esports@upi',
  socketStreamEnabled: true,
  autoApproveFreeTournaments: true,
};

/**
 * @desc    Get system platform settings
 * @route   GET /api/v1/admin/settings
 * @access  Private (Admin)
 */
const getPlatformSettings = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, platformSettings, 'Platform settings retrieved successfully'));
});

/**
 * @desc    Update system platform settings
 * @route   PATCH /api/v1/admin/settings
 * @access  Private (Admin)
 */
const updatePlatformSettings = asyncHandler(async (req, res) => {
  Object.assign(platformSettings, req.body);
  return res
    .status(200)
    .json(new ApiResponse(200, platformSettings, 'Platform settings updated successfully'));
});

module.exports = { getPlatformSettings, updatePlatformSettings };
