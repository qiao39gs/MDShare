'use client'

import COS from 'cos-js-sdk-v5'
import { nanoid } from 'nanoid'

interface COSCredentials {
  bucket: string
  region: string
  uploadPath: string
  credentials: {
    secretId: string
    secretKey: string
    expireTime: number
  }
}

interface UploadResult {
  url: string
  cosKey: string
  filename: string
  originalName: string
  fileSize: number
  mimeType: string
  width?: number
  height?: number
}

let cosInstance: COS | null = null
let cachedCredentials: COSCredentials | null = null
let credentialsExpireTime = 0

// 获取 COS 临时凭证
async function getCredentials(): Promise<COSCredentials> {
  const now = Date.now() / 1000

  // 如果凭证还有效（提前5分钟刷新）
  if (cachedCredentials && credentialsExpireTime > now + 300) {
    return cachedCredentials
  }

  const response = await fetch('/api/cos-token')
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '获取上传凭证失败')
  }

  cachedCredentials = await response.json()
  credentialsExpireTime = cachedCredentials!.credentials.expireTime
  return cachedCredentials!
}

// 获取 COS 实例
async function getCOSInstance(): Promise<{ cos: COS; credentials: COSCredentials }> {
  const credentials = await getCredentials()

  if (!cosInstance) {
    cosInstance = new COS({
      SecretId: credentials.credentials.secretId,
      SecretKey: credentials.credentials.secretKey,
    })
  }

  return { cos: cosInstance, credentials }
}

// 获取图片尺寸
function getImageDimensions(file: File): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      resolve(null)
      return
    }

    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: img.width, height: img.height })
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(null)
    }

    img.src = url
  })
}

// 生成文件名
function generateFilename(originalName: string): string {
  const ext = originalName.split('.').pop() || 'bin'
  return `${nanoid(12)}.${ext}`
}

// 上传文件到 COS
export async function uploadToCOS(
  file: File,
  onProgress?: (percent: number) => void
): Promise<UploadResult> {
  const { cos, credentials } = await getCOSInstance()

  const filename = generateFilename(file.name)
  const cosKey = `${credentials.uploadPath}${filename}`

  // 获取图片尺寸
  const dimensions = await getImageDimensions(file)

  return new Promise((resolve, reject) => {
    cos.uploadFile({
      Bucket: credentials.bucket,
      Region: credentials.region,
      Key: cosKey,
      Body: file,
      onProgress: (progressData) => {
        if (onProgress) {
          onProgress(Math.round(progressData.percent * 100))
        }
      },
    }, async (err, data) => {
      if (err) {
        reject(new Error(err.message || '上传失败'))
        return
      }

      const baseUrl = `https://${credentials.bucket}.cos.${credentials.region}.myqcloud.com`
      const url = `${baseUrl}${cosKey}`

      // 记录文件到数据库
      try {
        const recordResponse = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename,
            originalName: file.name,
            cosKey,
            fileSize: file.size,
            mimeType: file.type,
            width: dimensions?.width,
            height: dimensions?.height,
          }),
        })

        if (!recordResponse.ok) {
          const error = await recordResponse.json()
          reject(new Error(error.error || '记录文件信息失败'))
          return
        }
      } catch (e) {
        console.error('记录文件信息失败:', e)
        // 即使记录失败，文件已上传成功，仍返回结果
      }

      resolve({
        url,
        cosKey,
        filename,
        originalName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        width: dimensions?.width,
        height: dimensions?.height,
      })
    })
  })
}

// 批量上传
export async function uploadMultipleToCOS(
  files: File[],
  onProgress?: (index: number, percent: number) => void
): Promise<UploadResult[]> {
  const results: UploadResult[] = []

  for (let i = 0; i < files.length; i++) {
    const result = await uploadToCOS(files[i], (percent) => {
      if (onProgress) {
        onProgress(i, percent)
      }
    })
    results.push(result)
  }

  return results
}
