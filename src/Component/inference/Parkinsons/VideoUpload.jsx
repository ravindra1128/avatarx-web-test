import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { v4 as uuidv4 } from 'uuid'
import { Upload, Loader2 } from 'lucide-react'

export default function VideoUpload({ onUpload }) {
  const [isUploading, setIsUploading] = useState(false)

  const onDrop = useCallback(
    async (acceptedFiles) => {
      for (const file of acceptedFiles) {
        if (file.size <= 10 * 1024 * 1024) {
          setIsUploading(true)
          try {
            const formData = new FormData()
            formData.append('file', file)

            const response = await fetch('/api/upload', {
              method: 'POST',
              body: formData,
            })

            if (!response.ok) {
              throw new Error('Upload failed')
            }

            const { url } = await response.json()

            const video = {
              id: uuidv4(),
              name: file.name,
              size: file.size,
              type: file.type,
              url: url,
            }
            onUpload(video)
          } catch (error) {
            console.error('Error uploading file:', error)
            alert('Failed to upload file. Please try again.')
          } finally {
            setIsUploading(false)
          }
        } else {
          alert('File size should be less than 10MB')
        }
      }
    },
    [onUpload]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.avi', '.mov'],
    },
    maxSize: 10 * 1024 * 1024,
    disabled: isUploading,
  })

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors ${
        isUploading ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      <input {...getInputProps()} />
      {isUploading ? (
        <Loader2 className="mx-auto h-12 w-12 text-gray-400 animate-spin" />
      ) : (
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
      )}
      {isDragActive ? (
        <p className="mt-2">Drop the video here ...</p>
      ) : (
        <p className="mt-2">
          {isUploading
            ? 'Uploading...'
            : "Drag 'n' drop a video here, or click to select a file"}
        </p>
      )}
      <p className="text-sm text-gray-500 mt-2">
        (Only .mp4, .avi, .mov files less than 10MB are accepted)
      </p>
    </div>
  )
}