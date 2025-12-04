import { nanoid } from 'nanoid'

/**
 * 生成短链码
 * @param length 短链码长度，默认 6
 * @returns 短链码
 */
export function generateShortCode(length: number = 6): string {
  return nanoid(length)
}

/**
 * 验证短链码格式
 * @param code 短链码
 * @returns 是否有效
 */
export function isValidShortCode(code: string): boolean {
  return /^[a-zA-Z0-9_-]{4,12}$/.test(code)
}
