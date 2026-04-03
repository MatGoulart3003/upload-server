import { uploadImage } from '@/app/services/upload-image'
import { isSuccess, unwrapEither } from '@/shared/either'

import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'

export const uploadImageRoute: FastifyPluginAsyncZod = async server => {
  server.post(
    '/uploads',
    {
      schema: {
        summary: 'Upload an image',
        consumes: ['multipart/form-data'],
        response: {
          201: z.object({
            uploadId: z.string(),
            fileName: z.string(),
            fileUrl: z.string().url(),
          }),
          400: z.object({ message: z.string() }),
          409: z
            .object({ message: z.string() })
            .describe('Upload already exists.'),
        },
      },
    },
    async (request, reply) => {
      const uploadedFile = await request.file({
        limits: {
          fileSize: 1024 * 1024 * 2,
        },
      })

      if (!uploadedFile) {
        return reply.status(400).send({ message: 'File is required' })
      }

      const result = await uploadImage({
        fileName: uploadedFile?.filename,
        contentType: uploadedFile?.mimetype,
        contentStream: uploadedFile.file,
      })

      if (uploadedFile.file.truncated) {
        return reply.status(400).send({ message: 'File is too large' })
      }

      if (isSuccess(result)) {
        console.log(unwrapEither(result))

        return reply.status(201).send({
          uploadId: result.success.fileId,
          fileName: result.success.fileName,
          fileUrl: result.success.fileUrl,
        })
      }

      const error = unwrapEither(result)

      switch (error.constructor.name) {
        case 'InvalidFileFormat':
          return reply.status(400).send({ message: error.message })
      }
    },
  )
}
