import { randomUUID } from 'node:crypto'
import { describe, expect, it, vi } from 'vitest'
import * as upload from '@/infra/storage/upload-file-to-storage'
import { isSuccess, unwrapEither } from '@/shared/either'
import { makeUpload } from '@/test/factories/make-upload'
import { exportUploads } from './export-uploads'

describe('get uploads', async () => {
  const randomUUIDUrl = randomUUID()

  const uploadStub = vi
    .spyOn(upload, 'uploadFileToStorage')
    .mockImplementationOnce(async () => {
      return {
        key: `uploads/${randomUUID()}.csv`,
        url: `https://upload-server.test/uploads/${randomUUIDUrl}.csv`,
      }
    })

  it('should fetch uploads successfully', async () => {
    const fileName = randomUUID()

    const upload1 = await makeUpload({ name: fileName })
    const upload2 = await makeUpload({ name: fileName })
    const upload3 = await makeUpload({ name: fileName })
    const upload4 = await makeUpload({ name: fileName })
    const upload5 = await makeUpload({ name: fileName })

    const sut = await exportUploads({ searchQuery: fileName })

    const generatedCSVStream = uploadStub.mock.calls[0][0].contentStream
    const csvAsString = await new Promise<string>((resolve, reject) => {
      const chunks: Buffer[] = []

      generatedCSVStream.on('data', (chunk: Buffer) => {
        chunks.push(chunk)
      })

      generatedCSVStream.on('end', () => {
        const csvString = Buffer.concat(chunks).toString('utf-8')
        resolve(csvString)
      })
      generatedCSVStream.on('error', (err: Error) => {
        reject(err)
      })
    })

    const csvAsArray = csvAsString
      .trim()
      .split('\n')
      .map(line => line.split(','))

    expect(isSuccess(sut)).toBe(true)
    expect(unwrapEither(sut)).toEqual({
      reportUrl: `https://upload-server.test/uploads/${randomUUIDUrl}.csv`,
    })
    expect(csvAsArray[0]).toEqual(['ID', 'Name', 'Remote URL', 'Uploaded At'])
    expect(csvAsArray[1]).toEqual([
      upload1.id,
      upload1.name,
      upload1.remoteUrl,
      expect.any(String),
    ])
    expect(csvAsArray[2]).toEqual([
      upload2.id,
      upload2.name,
      upload2.remoteUrl,
      expect.any(String),
    ])
    expect(csvAsArray[3]).toEqual([
      upload3.id,
      upload3.name,
      upload3.remoteUrl,
      expect.any(String),
    ])
    expect(csvAsArray[4]).toEqual([
      upload4.id,
      upload4.name,
      upload4.remoteUrl,
      expect.any(String),
    ])
    expect(csvAsArray[5]).toEqual([
      upload5.id,
      upload5.name,
      upload5.remoteUrl,
      expect.any(String),
    ])
  })
})
