import { useState } from 'react';
import { DailyAudio, useParticipantIds, useLocalSessionId} from '@daily-co/daily-react';
import { Video } from '../Video';
import { useTranslation } from 'react-i18next';

export const Call = ({ timer, startTimer }) => {
  const { t } = useTranslation();
  const remoteParticipantIds = useParticipantIds({ filter: 'remote' });
  const localSessionId = useLocalSessionId();
  const [mode, setMode] = useState('full');

  const handleToggleMode = () => {
    setMode(prev => prev === 'full' ? 'minimal' : 'full');
  }

  const formatTime = (time) => {
    const hours = Math.floor(time / 3600)
    const minutes = Math.floor((time % 3600) / 60)
    const seconds = time % 60
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(seconds).padStart(2, "0")}`
  }

  return (
    <div className='flex flex-col justify-center items-center'>
      <div className={`flex items-center justify-center ${mode === 'minimal' ? 'fixed bottom-20 right-20' : ''}`}>
        <div className='relative'>
          {/* <Button variant='outline' onClick={handleToggleMode} className='absolute top-2 right-2 z-10 gap-2' size='sm'>
            {mode === 'full' ? 'Minimize' : 'Maximize'}
            {mode === 'full' ? <Minimize className='size-4' /> : <Maximize className='size-4' />}
          </Button> */}
          {
            remoteParticipantIds.length > 0 ?
            <Video
              id={remoteParticipantIds[0]}
              className={
                mode === 'full' ? 'max-h-[50vh] min-h-[20rem]' : 'max-h-[15rem]'
              }
            /> :
            <div className='relative flex items-center justify-center size-[50vh]'>
              <p className='text-2xl text-black'>{t('call.waitingForOthers')}</p>
            </div>
          }
          {localSessionId && (
            <Video
              id={localSessionId}
              className={
                mode === 'full' ? 'lg:max-h-32 max-h-20' : 'max-h-20'
              }
            />
          )}
        </div>
      </div>
      <DailyAudio />
      <p className='z-50 text-xl mt-1 justify-center items-center text-black'>{formatTime(timer)}</p>
    </div>
  );
}