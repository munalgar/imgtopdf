import { useMemo } from 'react'
import type { ImageFileInfo, ConversionOptions } from '@common/types'
import './PDFPreview.css'

interface PDFPreviewProps {
  files: ImageFileInfo[]
  options: ConversionOptions
}

interface PageDimensions {
  width: number
  height: number
  aspectRatio: number
}

interface LayoutConfig {
  columns: number
  rows: number
  imagesPerPage: number
}

interface CalculatedPage {
  pageNumber: number
  images: ImageFileInfo[]
  layout: {
    columns: number
    rows: number
  }
}

const PAGE_SIZES: Record<string, PageDimensions> = {
  A4: { width: 210, height: 297, aspectRatio: 210 / 297 },
  A3: { width: 297, height: 420, aspectRatio: 297 / 420 },
  Letter: { width: 216, height: 279, aspectRatio: 216 / 279 },
  Legal: { width: 216, height: 356, aspectRatio: 216 / 356 },
  Original: { width: 210, height: 297, aspectRatio: 210 / 297 } // Fallback
}

function getLayoutConfig(layout: string = 'one'): LayoutConfig {
  switch (layout) {
    case 'two':
      return { columns: 2, rows: 1, imagesPerPage: 2 }
    case 'four':
      return { columns: 2, rows: 2, imagesPerPage: 4 }
    default:
      return { columns: 1, rows: 1, imagesPerPage: 1 }
  }
}

function calculatePages(files: ImageFileInfo[], options: ConversionOptions): CalculatedPage[] {
  const supportedFiles = files.filter((file) => file.supported && !file.error)

  if (!supportedFiles.length) {
    return []
  }

  const layout = getLayoutConfig(options.pageLayout)
  const pages: CalculatedPage[] = []

  for (let i = 0; i < supportedFiles.length; i += layout.imagesPerPage) {
    const pageImages = supportedFiles.slice(i, i + layout.imagesPerPage)
    pages.push({
      pageNumber: Math.floor(i / layout.imagesPerPage) + 1,
      images: pageImages,
      layout: {
        columns: layout.columns,
        rows: layout.rows
      }
    })
  }

  return pages
}

function PDFPreview({ files, options }: PDFPreviewProps): React.JSX.Element | null {
  const pages = useMemo(() => calculatePages(files, options), [files, options])

  if (!pages.length) {
    return null
  }

  const pageSize = options.pageSize || 'A4'
  const pageDimensions = PAGE_SIZES[pageSize] || PAGE_SIZES.A4
  const margin = options.margin || 0.25

  return (
    <div className="pdf-preview">
      <div className="pdf-preview__header">
        <div className="pdf-preview__header-left">
          <h3>PDF Preview</h3>
          <span>
            {pages.length} page{pages.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="pdf-preview__settings-summary">
          <span className="pdf-preview__setting">{pageSize}</span>
          <span className="pdf-preview__setting">
            {options.pageLayout === 'one'
              ? '1 per page'
              : options.pageLayout === 'two'
                ? '2 per page'
                : '4 per page'}
          </span>
          {margin > 0 && <span className="pdf-preview__setting">{margin}&quot; margin</span>}
        </div>
      </div>

      <div className="pdf-preview__pages">
        {pages.map((page) => (
          <div
            key={page.pageNumber}
            className="pdf-preview__page"
            style={{
              aspectRatio: pageDimensions.aspectRatio
            }}
          >
            <div className="pdf-preview__page-number">{page.pageNumber}</div>

            <div
              className="pdf-preview__page-content"
              style={{
                margin: `${(margin / 25.4) * 100}%`, // Convert inches to percentage
                display: 'grid',
                gridTemplateColumns: `repeat(${page.layout.columns}, 1fr)`,
                gridTemplateRows: `repeat(${page.layout.rows}, 1fr)`,
                gap: '4px'
              }}
            >
              {page.images.map((image) => (
                <div key={image.path} className="pdf-preview__image-slot">
                  {image.preview && (
                    <img
                      src={image.preview}
                      alt={image.name}
                      className="pdf-preview__image"
                      style={{
                        objectFit:
                          options.scaling === 'original'
                            ? 'none'
                            : options.scaling === 'fit-width'
                              ? 'cover'
                              : 'contain'
                      }}
                    />
                  )}
                  <div className="pdf-preview__image-name">{image.name}</div>
                </div>
              ))}

              {/* Fill empty slots for partial pages */}
              {Array.from({
                length: page.layout.columns * page.layout.rows - page.images.length
              }).map((_, index) => (
                <div
                  key={`empty-${index}`}
                  className="pdf-preview__image-slot pdf-preview__image-slot--empty"
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="pdf-preview__summary">
        <div className="pdf-preview__summary-item">
          <span className="pdf-preview__summary-label">Total Images:</span>
          <span className="pdf-preview__summary-value">
            {files.filter((f) => f.supported && !f.error).length}
          </span>
        </div>
        <div className="pdf-preview__summary-item">
          <span className="pdf-preview__summary-label">Quality:</span>
          <span className="pdf-preview__summary-value">{options.quality || 85}%</span>
        </div>
        <div className="pdf-preview__summary-item">
          <span className="pdf-preview__summary-label">Scaling:</span>
          <span className="pdf-preview__summary-value">
            {options.scaling === 'fit-page'
              ? 'Fit Page'
              : options.scaling === 'fit-width'
                ? 'Fit Width'
                : 'Original Size'}
          </span>
        </div>
      </div>
    </div>
  )
}

export default PDFPreview
