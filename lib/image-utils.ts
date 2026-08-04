'use client'

const MAX_INPUT_BYTES = 10 * 1024 * 1024
const MAX_DATA_URL_LENGTH = 700_000

function loadImage(file: File): Promise<{ image: HTMLImageElement; objectUrl: string }> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => resolve({ image, objectUrl })
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('사진 파일을 읽지 못했습니다.'))
    }
    image.src = objectUrl
  })
}

function renderJpeg(image: HTMLImageElement, maxSide: number, quality: number): string {
  const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight))
  const width = Math.max(1, Math.round(image.naturalWidth * scale))
  const height = Math.max(1, Math.round(image.naturalHeight * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('사진을 처리하지 못했습니다.')
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, width, height)
  context.drawImage(image, 0, 0, width, height)
  return canvas.toDataURL('image/jpeg', quality)
}

export async function compressScheduleImage(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('이미지 파일만 첨부할 수 있습니다.')
  if (file.size > MAX_INPUT_BYTES) throw new Error('사진은 10MB 이하만 첨부할 수 있습니다.')

  const { image, objectUrl } = await loadImage(file)
  try {
    for (const [maxSide, quality] of [[1280, 0.78], [960, 0.68], [720, 0.58]] as const) {
      const dataUrl = renderJpeg(image, maxSide, quality)
      if (dataUrl.length <= MAX_DATA_URL_LENGTH) return dataUrl
    }
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
  throw new Error('사진 용량을 줄이지 못했습니다. 다른 사진을 선택해 주세요.')
}
