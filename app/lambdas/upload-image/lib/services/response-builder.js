export function buildUploadResponse(uploadData) {
  const {
    presignedUrl,
    fileKey,
    cloudFrontUrl,
    originalUrl,
    expiresIn,
    sanitizedFileName,
    fileType
  } = uploadData

  return {
    message: 'Presigned URL generated successfully',
    upload: {
      url: presignedUrl,
      method: 'PUT',
      headers: {
        'Content-Type': fileType
      },
      expiresIn: expiresIn
    },
    file: {
      key: fileKey,
      cloudFrontUrl: cloudFrontUrl,
      originalUrl: originalUrl,
      fileName: sanitizedFileName
    },
    instructions: [
      '1. Use PUT method to upload the file to the presigned URL',
      '2. Set Content-Type header to match the file type',
      '3. Once uploaded, use the cloudFrontUrl (optimized) in your raffle',
      `4. The URL expires in ${expiresIn} seconds (${Math.floor(
        expiresIn / 60
      )} minutes)`,
      '5. Image will be automatically optimized to WebP format'
    ]
  }
}
