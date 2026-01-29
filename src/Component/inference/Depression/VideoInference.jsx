
import { useState } from 'react'
import { useTranslation } from 'react-i18next';
import VideoUpload from './VideoUpload'
import SampleVideoModal from './SampleVideoModal'
import VideoList from './VideoList'
import InferenceProcess from './InferenceProcess'
import { Button } from "../../../Component/Buttons/Button"
import { FileVideo, Play } from 'lucide-react'

const MAX_VIDEOS = 1 // Maximum number of videos that can be selected

export default function VideoInference() {
  const { t } = useTranslation();
  const [selectedVideos, setSelectedVideos] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isPredicting, setIsPredicting] = useState(false)

  const addVideo = (video) => {
    if (selectedVideos.length < MAX_VIDEOS) {
      setSelectedVideos((prev) => [...prev, video])
    } else {
      alert(t('inference.video.maxVideos', { count: MAX_VIDEOS }))
    }
  }

  const removeVideo = (id) => {
    setSelectedVideos((prev) => prev.filter((v) => v.id !== id))
    // Reset analysis state when a video is removed
    setIsAnalyzing(false)
    setIsPredicting(false)
  }

  const handleSampleVideoSelect = (video) => {
    addVideo(video)
  }

  const startAnalysis = () => {
    if (selectedVideos.length > 0) {
      setIsAnalyzing(true)
      setIsPredicting(true)
    } else {
      alert(t('inference.video.selectBeforeAnalysis'))
    }
  }

  const resetAll = () => {
    setSelectedVideos([])
    setIsAnalyzing(false)
    setIsPredicting(false)
  }

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
      {/* <VideoUpload onUpload={addVideo} /> */}
      <Button
        onClick={() => setIsModalOpen(true)}
        className="mt-4 w-full"
        variant="outline"
        disabled={selectedVideos.length >= MAX_VIDEOS}
      >
        <FileVideo className="mr-2 h-4 w-4" />
        {t('inference.video.selectSampleVideo')}
      </Button>
      <SampleVideoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleSampleVideoSelect}
      />
      <VideoList videos={selectedVideos} onRemove={removeVideo} isAnalyzing={isAnalyzing} />
      {selectedVideos.length > 0 && !isAnalyzing && (
        <Button
          onClick={startAnalysis}
          className="mt-4 w-full"
          variant="default"
          style={{ backgroundColor: '#000000', color: '#ffffff', outline: 'none' }}
        >
          <Play className="mr-2 h-4 w-4" />
          {t('inference.video.analyse')}
        </Button>
      )}

      {isAnalyzing && selectedVideos.length > 0 && (
        <InferenceProcess video={selectedVideos[0]} setIsPredicting={setIsPredicting} />
      )}
      {selectedVideos.length > 0 && (
        <Button
          onClick={resetAll}
          className="mt-4 w-full bg-red-600 text-white"
          variant="destructive"
          disabled={isPredicting}
          style={{ backgroundColor: 'rgb(220 38 38)', color: '#ffffff', outline: 'none' }}
        >
          {t('inference.video.resetAll')}
        </Button>
      )}
    </div>
  )
}

// PropTypes for Video objects
const Video = {
  id: '',
  name: '',
  size: 0,
  type: '',
  url: ''
}