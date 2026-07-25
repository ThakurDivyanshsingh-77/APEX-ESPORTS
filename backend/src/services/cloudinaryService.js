const cloudinary = require('../config/cloudinary');
const fs = require('fs');

const uploadToCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    // Skip if Cloudinary keys are unconfigured
    if (!process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME === 'your_cloud_name') {
      console.log('[Upload Info] Cloudinary unconfigured. Preserving local upload file:', localFilePath);
      return null;
    }

    // Upload file to Cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      folder: 'esports_platform/payments',
      resource_type: 'auto',
    });

    // Remove local file after successful Cloudinary upload
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }

    return response;
  } catch (error) {
    console.warn('[Cloudinary Warning] Cloudinary upload failed/offline. Keeping local file:', localFilePath);
    return null;
  }
};

module.exports = { uploadToCloudinary };

