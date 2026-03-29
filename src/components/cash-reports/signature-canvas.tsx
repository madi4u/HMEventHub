'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Eraser } from 'lucide-react'

interface SignatureCanvasProps {
  onSignature: (dataUrl: string | null) => void
  readOnly?: boolean
  existingSignature?: string | null
}

export function SignatureCanvas({ onSignature, readOnly = false, existingSignature }: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [isEmpty, setIsEmpty] = useState(true)
  const lastPos = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.strokeStyle = '#e2e8f0'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    if (existingSignature) {
      const img = new Image()
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        setIsEmpty(false)
      }
      img.src = existingSignature
    }
  }, [existingSignature])

  function getPos(e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    if ('touches' in e) {
      const touch = e.touches[0]
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      }
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      }
    }
  }

  function startDrawing(e: React.MouseEvent | React.TouchEvent) {
    if (readOnly) return
    const canvas = canvasRef.current
    if (!canvas) return

    e.preventDefault()
    setIsDrawing(true)
    lastPos.current = getPos(e, canvas)
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    if (!isDrawing || readOnly) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    e.preventDefault()
    const pos = getPos(e, canvas)

    ctx.beginPath()
    ctx.moveTo(lastPos.current!.x, lastPos.current!.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()

    lastPos.current = pos
    setIsEmpty(false)
  }

  function stopDrawing() {
    if (!isDrawing) return
    setIsDrawing(false)
    lastPos.current = null

    const canvas = canvasRef.current
    if (canvas && !isEmpty) {
      onSignature(canvas.toDataURL('image/png'))
    }
  }

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setIsEmpty(true)
    onSignature(null)
  }, [onSignature])

  return (
    <div className="space-y-2">
      <div className="relative border border-border rounded-md overflow-hidden bg-secondary/20">
        <canvas
          ref={canvasRef}
          width={600}
          height={150}
          className="w-full touch-none cursor-crosshair"
          style={{ height: '150px' }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {isEmpty && !readOnly && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-sm text-muted-foreground">Hier unterschreiben</p>
          </div>
        )}
      </div>
      {!readOnly && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={clearCanvas}
          disabled={isEmpty}
        >
          <Eraser className="h-4 w-4 mr-1" />
          Unterschrift löschen
        </Button>
      )}
    </div>
  )
}
