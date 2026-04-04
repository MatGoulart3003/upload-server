import { randomUUID } from 'node:crypto'
import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'
import { isSuccess, unwrapEither } from '@/shared/either'
import { makeUpload } from '@/test/factories/make-upload'
import { getUploads } from './get-uploads'
import { SortBy, SortDirection } from './types'

describe('get uploads', async () => {
  it('should fetch uploads successfully', async () => {
    const fileName = randomUUID()

    const upload1 = await makeUpload({ name: fileName })
    const upload2 = await makeUpload({ name: fileName })
    const upload3 = await makeUpload({ name: fileName })
    const upload4 = await makeUpload({ name: fileName })
    const upload5 = await makeUpload({ name: fileName })

    const sut = await getUploads({ searchQuery: fileName })

    expect(isSuccess(sut)).toBe(true)
    expect(unwrapEither(sut).totalCount).toEqual(5)
    expect(unwrapEither(sut).uploads).toEqual([
      expect.objectContaining({ id: upload5.id }),
      expect.objectContaining({ id: upload4.id }),
      expect.objectContaining({ id: upload3.id }),
      expect.objectContaining({ id: upload2.id }),
      expect.objectContaining({ id: upload1.id }),
    ])
  })

  it('should fetch paginated uploads successfully', async () => {
    const fileName = randomUUID()

    const upload1 = await makeUpload({ name: fileName })
    const upload2 = await makeUpload({ name: fileName })
    const upload3 = await makeUpload({ name: fileName })
    const upload4 = await makeUpload({ name: fileName })
    const upload5 = await makeUpload({ name: fileName })

    let sut = await getUploads({
      searchQuery: fileName,
      page: 1,
      pageSize: 3,
    })

    expect(isSuccess(sut)).toBe(true)
    expect(unwrapEither(sut).totalCount).toEqual(5)
    expect(unwrapEither(sut).uploads).toEqual([
      expect.objectContaining({ id: upload5.id }),
      expect.objectContaining({ id: upload4.id }),
      expect.objectContaining({ id: upload3.id }),
    ])

    sut = await getUploads({
      searchQuery: fileName,
      page: 2,
      pageSize: 3,
    })

    expect(unwrapEither(sut).uploads).toEqual([
      expect.objectContaining({ id: upload2.id }),
      expect.objectContaining({ id: upload1.id }),
    ])
  })

  it('should fetch sorted uploads successfully', async () => {
    const fileName = randomUUID()

    const upload1 = await makeUpload({ name: fileName, createdAt: new Date() })
    const upload2 = await makeUpload({
      name: fileName,
      createdAt: dayjs().subtract(1, 'day').toDate(),
    })
    const upload3 = await makeUpload({
      name: fileName,
      createdAt: dayjs().subtract(2, 'day').toDate(),
    })
    const upload4 = await makeUpload({
      name: fileName,
      createdAt: dayjs().subtract(3, 'day').toDate(),
    })
    const upload5 = await makeUpload({
      name: fileName,
      createdAt: dayjs().subtract(4, 'day').toDate(),
    })

    let sut = await getUploads({
      searchQuery: fileName,
      sortBy: SortBy.CREATED_AT,
      sortOrder: SortDirection.DESC,
    })

    expect(isSuccess(sut)).toBe(true)
    expect(unwrapEither(sut).totalCount).toEqual(5)
    expect(unwrapEither(sut).uploads).toEqual([
      expect.objectContaining({ id: upload1.id }),
      expect.objectContaining({ id: upload2.id }),
      expect.objectContaining({ id: upload3.id }),
      expect.objectContaining({ id: upload4.id }),
      expect.objectContaining({ id: upload5.id }),
    ])
    sut = await getUploads({
      searchQuery: fileName,
      sortBy: SortBy.CREATED_AT,
      sortOrder: SortDirection.ASC,
    })

    expect(isSuccess(sut)).toBe(true)
    expect(unwrapEither(sut).totalCount).toEqual(5)
    expect(unwrapEither(sut).uploads).toEqual([
      expect.objectContaining({ id: upload5.id }),
      expect.objectContaining({ id: upload4.id }),
      expect.objectContaining({ id: upload3.id }),
      expect.objectContaining({ id: upload2.id }),
      expect.objectContaining({ id: upload1.id }),
    ])
  })
})
