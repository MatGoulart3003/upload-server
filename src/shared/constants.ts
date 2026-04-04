export const ALLOWED_MIME_TYPES = [
  'image/jpg',
  'image/jpeg',
  'image/png',
  'image/webp',
] as const

export enum STORAGE_FOLDERS {
  IMAGES = 'images',
  DOWNLOADS = 'downloads',
}

export type StorageFolder =
  (typeof STORAGE_FOLDERS)[keyof typeof STORAGE_FOLDERS]

export const MAX_FILE_SIZE = 1024 * 1024 * 2 // 2MB

export const CSV_CONTENT_TYPE = 'text/csv'
