import VideoInference from './VideoInference'
import { Button } from "../../../Component/Buttons/Button"
import { Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next';

const VideoList = ({ videos, onRemove, isAnalyzing }) => {
  const { t } = useTranslation();
  return (
    <div className="mt-6">
      {/* <h3 className="text-xl font-semibold mb-2">Selected Video</h3> */}
    {
      videos.length > 0 && (
        <div className="flex justify-center">
          <video 
            src={videos[0].url} 
            crossOrigin="anonymous" 
            controls={!isAnalyzing}
            className={`rounded-lg h-44 ${isAnalyzing ? 'opacity-50' : ''}`}
          />
        </div>
      )
    }

      
      {videos.length === 0 ? (
        <p className="text-gray-500">{t('inference.video.noVideosSelected')}</p>
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