import VideoInference from './VideoInference'
import { Button } from "../../../Component/Buttons/Button"
import { Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next';

const VideoList = ({ videos, onRemove, isAnalyzing }) => {
  const { t } = useTranslation();
  return (
    <div className="mt-6">
      <h2 className="text-xl font-semibold mb-2">{t('inference.audio.selectedAudio')}</h2>
      {
        videos.length > 0 && (
          <div className="w-full mb-4">
          <audio
            src={videos[0].url}
            controls
            crossOrigin="anonymous"
            className={`rounded-lg ${isAnalyzing ? "opacity-50" : ""}`}
            style={{ width: "100%" }}
          />
          </div>
        )
      }

      
      {videos.length === 0 ? (
        <p className="text-gray-500">{t('inference.audio.noAudiosSelected')}</p>
      ) : (
        <ul className="space-y-2">
          {videos.map((video) => (
            <li key={video.id} className="flex items-center justify-between bg-gray-100 p-2 rounded">
              <span className="truncate flex-1 mr-2 text-center">{video.name}</span>
              <Button
                onClick={() => onRemove(video.id)}
                variant="destructive"
                className='bg-red-700'
                size="icon"
                style={{ backgroundColor: 'rgb(220 38 38)', color: '#ffffff', outline: 'none' }}

              >
                <Trash2 className="h-4 w-4" color='white' />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default VideoList