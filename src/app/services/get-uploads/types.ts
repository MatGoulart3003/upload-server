import z from 'zod'

export enum SortBy {
  CREATED_AT = 'createdAt',
}

export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc',
}

const DEFAULT_PAGE = 1
const DEFAULT_PAGE_SIZE_LIMIT = 10

export const getUploadsInput = z.object({
  searchQuery: z.string().optional(),
  sortBy: z.enum([SortBy.CREATED_AT]).optional(),
  sortOrder: z.enum([SortDirection.ASC, SortDirection.DESC]).optional(),
  page: z.number().optional().default(DEFAULT_PAGE),
  pageSize: z.number().optional().default(DEFAULT_PAGE_SIZE_LIMIT),
})

export type GetUploadsInput = z.input<typeof getUploadsInput>

export interface Upload {
  id: string
  name: string
  remoteUrl: string
  createdAt: Date
}

export interface GetUploadsOutput {
  uploads: Upload[]
  totalCount: number
}
