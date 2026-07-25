const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const getHealthStatus = asyncHandler(async (req, res) => {
  const healthData = {
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'Esports Platform Backend API',
    status: 'ONLINE',
    environment: process.env.NODE_ENV || 'development',
  };

  return res
    .status(200)
    .json(new ApiResponse(200, healthData, 'Backend service is healthy and operational'));
});

module.exports = { getHealthStatus };
