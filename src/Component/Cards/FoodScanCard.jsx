import React from 'react';
import moment from 'moment';
import { Utensils } from 'lucide-react';
import { CaloriesIcon, SteakIcon, CarbsIcon, FatIcon } from '../SvgIcons';
import { useNavigate } from 'react-router-dom';

const FoodScanCard = ({
  type = 'item',
  // pending props
  previewUrl,
  progress = 0,
  phase,
  // error props
  imageUrl,
  onRetake,
  // item props
  scan,
  onClick,
}) => {
  const navigate = useNavigate();
  if (type === 'pending') {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex h-36 sm:h-40">
          <div className="w-36 sm:w-40 h-full bg-gray-100 relative flex-shrink-0">
            {previewUrl ? (
              <img src={previewUrl} alt="preview" className="w-full h-full object-cover opacity-70 block" crossOrigin="anonymous" />
            ) : (
              <div className="w-full h-full bg-gray-200" />
            )}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                  <path className="text-white/30" stroke="currentColor" strokeWidth="3" fill="none" d="M18 2a16 16 0 1 1 0 32 16 16 0 1 1 0-32" />
                  <path className="text-white" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeDasharray={`${progress}, 100`} d="M18 2a16 16 0 1 1 0 32 16 16 0 1 1 0-32" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white text-xs font-semibold">{Math.min(99, Math.max(1, Math.round(progress)))}%</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1 p-4">
            <div className="flex items-start justify-between">
              <div className="text-base font-semibold text-gray-900 pr-3">{phase || 'Analysing food ...'}</div>
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm text-gray-800">
              <span className="inline-flex items-center gap-1"><span className="w-4 h-4 flex items-center justify-center"><CaloriesIcon /></span> — calories</span>
            </div>
            <div className="mt-2 flex items-center gap-5 text-sm">
              <span className="inline-flex items-center gap-1 opacity-60"><span className="w-4 h-4 flex items-center justify-center"><SteakIcon /></span> —</span>
              <span className="inline-flex items-center gap-1 opacity-60"><span className="w-4 h-4 flex items-center justify-center"><CarbsIcon /></span> —</span>
              <span className="inline-flex items-center gap-1 opacity-60"><span className="w-4 h-4 flex items-center justify-center"><FatIcon /></span> —</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'error') {
    return (
      <div className="bg-white border border-red-200 rounded-2xl shadow-sm overflow-hidden mb-4">
        <div className="flex h-36 sm:h-40">
          <div className="w-36 sm:w-40 h-full bg-red-50 flex-shrink-0 relative">
            {imageUrl ? (
              <>
                <img src={imageUrl} alt="preview" className="w-full h-full object-cover block opacity-50" crossOrigin="anonymous" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-red-500 text-white rounded-full p-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                </div>
              </>
            ) : (
              <div className="w-full h-full bg-red-100 flex items-center justify-center">
                <div className="bg-red-500 text-white rounded-full p-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
            )}
          </div>
          <div className="flex-1 p-4">
            <div className="flex items-start justify-between">
              <div className="text-base font-semibold text-red-500 pr-3">Scan Failed</div>
            </div>
            <div className="mt-2 text-sm text-gray-600">Food could not be analyzed</div>
            <div className="mt-3">
              <button
                onClick={() => navigate('/patient/check-calories')}
                className="px-3 py-2 rounded-full border border-red-300 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
              >
                Tap to retake
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // item
  const nutritionData = (() => {
    try { return JSON.parse(scan?.nutrition_data || scan?.nutrition_data_json || '{}'); } catch { return {}; }
  })();
  const createdAt = scan?.created_at
    ? moment(scan.created_at).format('hh:mm A')
    : (scan?.created_at_local ? moment(scan.created_at_local, 'YYYY-MM-DD HH:mm:ss').format('hh:mm A') : '');

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden mb-4 cursor-pointer hover:shadow-md transition" onClick={onClick}>
      <div className="flex h-36 sm:h-40">
        <div className="w-36 sm:w-40 h-full bg-gray-100 flex-shrink-0 relative">
          {scan?.image_url ? (
            <>
              <img 
                src={scan.image_url} 
                alt={scan?.detected_food || 'Food item'} 
                className="w-full h-full object-cover block absolute inset-0" 
                onError={(e) => {
                  console.log('Image failed to load:', scan.image_url);
                  e.target.style.display = 'none';
                }}
                onLoad={() => {
                  console.log('Image loaded successfully:', scan.image_url);
                }}
                crossOrigin="anonymous"
              />
              <div 
                className="w-full h-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center absolute inset-0"
                style={{ display: 'none' }}
              >
                <Utensils className="w-10 h-10 text-orange-500" />
              </div>
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
              <Utensils className="w-10 h-10 text-orange-500" />
            </div>
          )}
        </div>
        <div className="flex-1 p-4">
          <div className="flex items-start justify-between">
            <div className="text-lg font-bold text-gray-900 mb-2 text-left !mb-2 !text-center">{scan?.detected_food || 'Food'}</div>
            <div className="text-sm font-medium text-gray-700 bg-white px-3 py-1 rounded-full shadow-sm">{createdAt}</div>
          </div>
          <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
            <span className="inline-flex items-center gap-1">
              <span className="w-4 h-4 flex items-center justify-center"><CaloriesIcon /></span>
              <span className="font-semibold text-gray-900">{scan?.calories || 0}</span> calories
            </span>
          </div>
          <div className="mt-2 flex items-center gap-5 text-sm text-gray-600">
            <span className="inline-flex items-center gap-1">
              <span className="w-4 h-4 flex items-center justify-center"><SteakIcon /></span>
              <span className="font-semibold text-gray-900">{nutritionData?.protein || '0g'}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-4 h-4 flex items-center justify-center"><CarbsIcon /></span>
              <span className="font-semibold text-gray-900">{nutritionData?.carbs || '0g'}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-4 h-4 flex items-center justify-center"><FatIcon /></span>
              <span className="font-semibold text-gray-900">{nutritionData?.fat || '0g'}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FoodScanCard;

