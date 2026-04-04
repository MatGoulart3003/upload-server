import z from 'zod'

export const exportUploadsInput = z.object({
  searchQuery: z.string().optional(),
})

export type ExportUploadsInput = z.input<typeof exportUploadsInput>

export interface ExportUploadsOutput {
  reportUrl: string
}
