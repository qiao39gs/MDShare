'use client'

import type { BytemdPlugin } from 'bytemd'
import { uploadToCOS } from './upload'

interface UploadPluginOptions {
  maxSize?: number // 最大文件大小（字节），默认 10MB
  allowedTypes?: string[] // 允许的文件类型
  onUploadStart?: () => void
  onUploadEnd?: () => void
  onError?: (error: Error) => void
}

const defaultOptions: UploadPluginOptions = {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
}

export function cosUploadPlugin(options: UploadPluginOptions = {}): BytemdPlugin {
  const opts = { ...defaultOptions, ...options }

  return {
    actions: [
      {
        title: '上传图片',
        icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
        handler: {
          type: 'action',
          click: async (ctx) => {
            const input = document.createElement('input')
            input.type = 'file'
            input.accept = opts.allowedTypes?.join(',') || 'image/*'
            input.multiple = true

            input.onchange = async () => {
              const files = Array.from(input.files || [])
              if (files.length === 0) return

              // 验证文件
              for (const file of files) {
                if (opts.maxSize && file.size > opts.maxSize) {
                  const maxSizeMB = Math.round(opts.maxSize / 1024 / 1024)
                  opts.onError?.(new Error(`文件 ${file.name} 超过 ${maxSizeMB}MB 限制`))
                  return
                }

                if (opts.allowedTypes && !opts.allowedTypes.includes(file.type)) {
                  opts.onError?.(new Error(`不支持的文件类型: ${file.type}`))
                  return
                }
              }

              opts.onUploadStart?.()

              try {
                const results = []
                for (const file of files) {
                  const result = await uploadToCOS(file)
                  results.push(result)
                }

                // 插入图片 Markdown
                const markdown = results
                  .map((r) => `![${r.originalName}](${r.url})`)
                  .join('\n')

                ctx.appendBlock(markdown)
              } catch (error) {
                opts.onError?.(error instanceof Error ? error : new Error('上传失败'))
              } finally {
                opts.onUploadEnd?.()
              }
            }

            input.click()
          },
        },
      },
    ],
    editorEffect: (ctx) => {
      // 处理粘贴图片
      const handlePaste = async (e: ClipboardEvent) => {
        const items = e.clipboardData?.items
        if (!items) return

        const imageFiles: File[] = []
        for (const item of items) {
          if (item.type.startsWith('image/')) {
            const file = item.getAsFile()
            if (file) {
              imageFiles.push(file)
            }
          }
        }

        if (imageFiles.length === 0) return

        e.preventDefault()
        opts.onUploadStart?.()

        try {
          const results = []
          for (const file of imageFiles) {
            // 验证文件大小
            if (opts.maxSize && file.size > opts.maxSize) {
              const maxSizeMB = Math.round(opts.maxSize / 1024 / 1024)
              throw new Error(`粘贴的图片超过 ${maxSizeMB}MB 限制`)
            }

            const result = await uploadToCOS(file)
            results.push(result)
          }

          const markdown = results
            .map((r) => `![${r.originalName}](${r.url})`)
            .join('\n')

          ctx.appendBlock(markdown)
        } catch (error) {
          opts.onError?.(error instanceof Error ? error : new Error('上传失败'))
        } finally {
          opts.onUploadEnd?.()
        }
      }

      // 处理拖拽上传
      const handleDrop = async (e: DragEvent) => {
        const files = e.dataTransfer?.files
        if (!files || files.length === 0) return

        const imageFiles = Array.from(files).filter((f) =>
          opts.allowedTypes?.includes(f.type) || f.type.startsWith('image/')
        )

        if (imageFiles.length === 0) return

        e.preventDefault()
        opts.onUploadStart?.()

        try {
          const results = []
          for (const file of imageFiles) {
            // 验证文件大小
            if (opts.maxSize && file.size > opts.maxSize) {
              const maxSizeMB = Math.round(opts.maxSize / 1024 / 1024)
              throw new Error(`文件 ${file.name} 超过 ${maxSizeMB}MB 限制`)
            }

            const result = await uploadToCOS(file)
            results.push(result)
          }

          const markdown = results
            .map((r) => `![${r.originalName}](${r.url})`)
            .join('\n')

          ctx.appendBlock(markdown)
        } catch (error) {
          opts.onError?.(error instanceof Error ? error : new Error('上传失败'))
        } finally {
          opts.onUploadEnd?.()
        }
      }

      const handleDragOver = (e: Event) => {
        e.preventDefault()
      }

      // 使用 root 元素绑定事件
      const editorEl = ctx.root

      const pasteHandler = (e: Event) => handlePaste(e as ClipboardEvent)
      const dropHandler = (e: Event) => handleDrop(e as DragEvent)

      editorEl.addEventListener('paste', pasteHandler)
      editorEl.addEventListener('drop', dropHandler)
      editorEl.addEventListener('dragover', handleDragOver)

      return () => {
        editorEl.removeEventListener('paste', pasteHandler)
        editorEl.removeEventListener('drop', dropHandler)
        editorEl.removeEventListener('dragover', handleDragOver)
      }
    },
  }
}
