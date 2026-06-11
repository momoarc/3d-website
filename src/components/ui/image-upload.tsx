'use client'
import { useState, useRef } from 'react'
import { uploadImage } from '@/lib/supabase/queries'

interface ImageUploadProps {
  onUploadComplete: (url: string) => void
  currentImage?: string
  path?: string
}

export function ImageUpload({ onUploadComplete, currentImage, path = 'products' }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(currentImage || '')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setPreview(URL.createObjectURL(file))

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `${path}/${fileName}`

      const publicUrl = await uploadImage(file, filePath)
      onUploadComplete(publicUrl)
    } catch (error) {
      alert('Upload échoué: ' + (error as Error).message)
      setPreview(currentImage || '')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
      />
      <div
        onClick={() => fileRef.current?.click()}
        className="cursor-pointer border border-dashed border-gray-600 rounded-lg p-4 text-center hover:border-[#c9a84c] transition-colors"
      >
        {preview ? (
          <img src={preview} alt="Preview" className="max-h-32 mx-auto rounded" />
        ) : (
          <div className="text-gray-500 text-sm">
            Cliquez pour uploader une image
          </div>
        )}
        {uploading && <div className="text-[#c9a84c] text-sm mt-2">Upload en cours...</div>}
      </div>
    </div>
  )
}
