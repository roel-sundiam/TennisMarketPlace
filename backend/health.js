// Health check endpoint for Render deployment
export const healthCheck = (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'tennis-marketplace-api'
  });
};