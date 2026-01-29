import React from 'react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import PatientCardHeading from '../Pages/patientDashboard/PatientCardHeadin';
import { useTranslation } from 'react-i18next';
import { SteakIcon, FatIcon, CarbsIcon, CaloriesIcon } from './SvgIcons';
import { Leaf, Candy, Droplets } from 'lucide-react';

const CircularStat = ({ label, value, unit = '', target = 100, color = '#4686f6', total = 0 }) => {
  const size = 64;
  const stroke = 4;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  // `value` here represents the amount LEFT. We want the ring to show the
  // percentage CONSUMED, so progress = (target - left) / target.
  const left = Number(value || 0);
  const safeTarget = Number(target || 0);
  const consumed = Math.max(0, safeTarget - left);
  const progress = Math.min(1, Math.max(0, safeTarget ? consumed / safeTarget : 0));
  const isDepleted = left < 1 || !safeTarget;
  const isOver = total > safeTarget;
  const showOver = isOver;
  const dashOffset = circumference * (1 - progress);
  const overConsumed = total - safeTarget;
  const { t } = useTranslation();
  
  // Change color to red if user exceeds their target
  const circleColor = isOver ? '#ef4444' : color;
  return (
    <svg width={size} height={size} className="flex-shrink-0">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={circleColor}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
            <text
              x={size / 2}
              y={size / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="14"
              fontWeight="600"
              fill="#111827"
            >
              {showOver ? `${Math.round(overConsumed)}${unit}` : !isDepleted ? `${Math.round(left)}${unit}` : `${Math.round(consumed)}${unit}`}
            </text>
            <text
              x={size / 2}
              y={size / 2 + 12}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="9"
              fill="#6b7280"
            >
              {showOver ? t('nutritionResults.over') : !isDepleted ? t('nutritionResults.left') : ''}
            </text>
      </svg> 
  );
};

// Large calories ring used for the hero calories view
const BigCaloriesRing = ({ totalCalories = 0, targetCalories = 0 }) => {
  const size = 160; // smaller ring to fit in constrained height
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const consumed = Math.max(0, Number(totalCalories) || 0);
  const safeTarget = Math.max(0, Number(targetCalories) || 0);
  const progress = Math.min(1, safeTarget ? consumed / safeTarget : 0);
  const dashOffset = circumference * (1 - progress);
  const remaining = safeTarget - consumed;
  const isOverTarget = consumed > safeTarget;
  
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="block">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e9eaf6"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#111827"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-3xl font-extrabold text-black leading-none">
          {isOverTarget ? `-${Math.round(Math.abs(remaining))}` : Math.round(remaining)}
        </div>
        <div className="text-gray-600 text-sm mt-1">
          {isOverTarget ? "Calories Over" : "Calories Remaining"}
        </div>
      </div>
    </div>
  );
};

// Semi-circular progress bar for macro cards
const SemiCircularProgress = ({ current = 0, target = 0, color = '#4686f6', icon, label }) => {
  const size = 90;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = Math.PI * radius; // Half circle
  const progress = Math.min(1, target ? current / target : 0);
  const dashOffset = circumference * (1 - progress);
  
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size / 2 + 20 }}>
      <svg width={size} height={size / 2 + 20} className="block">
        {/* Background semi-circle - more circular */}
        <path
          d={`M ${stroke/2} ${size/2 + 10} A ${radius} ${radius} 0 0 1 ${size - stroke/2} ${size/2 + 10}`}
          stroke="#e5e7eb"
          strokeWidth={stroke}
          fill="none"
        />
        {/* Progress semi-circle - more circular */}
        <path
          d={`M ${stroke/2} ${size/2 + 10} A ${radius} ${radius} 0 0 1 ${size - stroke/2} ${size/2 + 10}`}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>
      {/* Icon centered in the semi-circle (further nudged down to avoid touching arc) */}
      <div className="absolute" style={{ top: '72%', left: '50%', transform: 'translate(-50%, -50%)' }}>
        <div className="w-6 h-6 flex items-center justify-center">
          {icon}
        </div>
      </div>
    </div>
  );
};

const TodayCaloriesSummary = ({
  totalCalories = 0,
  totalProtein = 0,
  totalCarbs = 0,
  totalFat = 0,
  totalFiber = 0,
  totalSugar = 0,
  totalSodium = 0,
  periodLabel = 'Today',
  targets = {
    calories: 2000,
    protein: 75,
    carbs: 300,
    fat: 70,
    fiber: 35,
    sugar: 75,
    sodium: 2300,
  },
  healthScore = 0,
  healthScoreReason = '',
}) => {
  const caloriesRemaining = (targets?.calories || 0) - (Number(totalCalories) || 0);
  const caloriesLeft = Math.max(0, caloriesRemaining);
  const proteinLeft = Math.max(0, (targets?.protein || 0) - (Number(String(totalProtein).toString().replace('g','')) || 0));
  const carbsLeft = Math.max(0, (targets?.carbs || 0) - (Number(String(totalCarbs).toString().replace('g','')) || 0));
  const fatLeft = Math.max(0, (targets?.fat || 0) - (Number(String(totalFat).toString().replace('g','')) || 0));
  const { t } = useTranslation();
  // Current macro values (numbers) and over-target flags
  const currentProtein = Number(String(totalProtein).toString().replace('g','')) || 0;
  const currentCarbs = Number(String(totalCarbs).toString().replace('g','')) || 0;
  const currentFat = Number(String(totalFat).toString().replace('g','')) || 0;
  const isCaloriesOver = caloriesRemaining < 0;
  const isProteinOver = currentProtein > (targets?.protein || 0);
  const isCarbsOver = currentCarbs > (targets?.carbs || 0);
  const isFatOver = currentFat > (targets?.fat || 0);
  const currentFiber = Number(String(totalFiber).toString().replace('g','')) || 0;
  const currentSugar = Number(String(totalSugar).toString().replace('g','')) || 0;
  const currentSodium = Number(String(totalSodium).toString().replace('mg','')) || 0;
  const isFiberOver = currentFiber > (targets?.fiber || 0);
  const isSugarOver = currentSugar > (targets?.sugar || 0);
  const isSodiumOver = currentSodium > (targets?.sodium || 0);
  const isHealthScoreOver = healthScore > (targets?.healthScore || 0);
  const sliderSettings = {
    dots: true,
    arrows: false,
    infinite: false,
    speed: 400,
    slidesToShow: 1,
    slidesToScroll: 1,
    swipe: true,
    swipeToSlide: true,
    draggable: true,
    touchMove: true,
    touchThreshold: 10,
    edgeFriction: 0.2,
    accessibility: true,
    adaptiveHeight: true,
    dotsClass: 'slick-dots !relative !bottom-0 !mt-1',
    appendDots: (dots) => (
      <div className="mt-1">
        <ul className="!m-0 flex items-center justify-center gap-[-1px] [&_li]:!m-0">{dots}</ul>
      </div>
    ),
    customPaging: () => (
      <button type="button" className="w-5 h-5 rounded-full bg-gray-300"></button>
    ),
  };
  return (
    <>
    {/* Slider wrapper using react-slick */}
    <div className="-mx-4 px-4">
      <Slider {...sliderSettings}>
        <div>
    <div className="space-y-4">
      {/* Calories hero view */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4" style={{ height: '130px' }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 flex items-center justify-center">
              <CaloriesIcon />
            </div>
            <PatientCardHeading title={t("calories")} className="!mb-0 !text-lg" />
          </div>
        </div>
        <div className="flex items-center justify-between h-full" style={{ height: 'calc(100% - 40px)' }}>
          {/* Left side - Large calorie number */}
          <div className="flex flex-col justify-center">
            <div className={`text-3xl font-bold leading-none mb-1 text-black`}>
              {caloriesRemaining < 0 ? `-${Math.round(Math.abs(caloriesRemaining))}` : Math.round(caloriesRemaining)}
            </div>
            <div className={`text-sm font-medium text-black`}>
              {caloriesRemaining < 0 ? t("nutritionResults.caloriesOver") : t("nutritionResults.caloriesRemaining")}
            </div>
          </div>
          
          {/* Right side - Small circular progress */}
          <div className="flex items-center justify-center -mt-3">
            <div className="relative flex items-center justify-center" style={{ width: 90, height: 90 }}>
              <svg width={90} height={90} className="block">
                <circle
                  cx={45}
                  cy={45}
                  r={40}
                  stroke="#e5e7eb"
                  strokeWidth={10}
                  fill="none"
                />
                <circle
                  cx={45}
                  cy={45}
                  r={40}
                  stroke={isCaloriesOver ? '#ef4444' : '#111827'}
                  strokeWidth={10}
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={251.2}
                  strokeDashoffset={251.2 * (1 - Math.min(1, (targets?.calories || 0) ? (Number(totalCalories) || 0) / (targets?.calories || 0) : 0))}
                  transform="rotate(-90 45 45)"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-6 h-6 flex items-center justify-center">
                  <CaloriesIcon />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Macros - simplified cards like dashboard */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center min-h-[120px] flex flex-col justify-center">
          <PatientCardHeading title={t("nutritionResults.protein")} className={'!mb-2 !text-center'} />
          <div className={`text-sm mb-2 text-gray-600`}>
            {Math.round(currentProtein)}/{Math.round(targets?.protein || 0)}g
          </div>
          <div className="flex items-center justify-center">
            <SemiCircularProgress 
              current={currentProtein} 
              target={targets?.protein || 0} 
              color={isProteinOver ? '#ef4444' : '#4686f6'} 
              icon={<SteakIcon />}
            />
          </div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center min-h-[120px] flex flex-col justify-center">
          <PatientCardHeading title={t("nutritionResults.carbs")} className={'!mb-2 !text-center'} />
          <div className={`text-sm mb-2 text-gray-600`}>
            {Math.round(currentCarbs)}/{Math.round(targets?.carbs || 0)}g
          </div>
          <div className="flex items-center justify-center">
            <SemiCircularProgress 
              current={currentCarbs} 
              target={targets?.carbs || 0} 
              color={isCarbsOver ? '#ef4444' : '#22C55E'} 
              icon={<CarbsIcon />}
            />
          </div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center min-h-[120px] flex flex-col justify-center">
          <PatientCardHeading title={t("fat")} className={'!mb-2 !text-center'} />
          <div className={`text-sm mb-2 text-gray-600`}>
            {Math.round(currentFat)}/{Math.round(targets?.fat || 0)}g
          </div>
          <div className="flex items-center justify-center">
            <SemiCircularProgress 
              current={currentFat} 
              target={targets?.fat || 0} 
              color={isFatOver ? '#ef4444' : '#eab308'} 
              icon={<FatIcon />}
            />
          </div>
        </div>
      </div>
    </div>
        </div>
        <div>
    <div className="space-y-4">

      {/* Row 2: Macros - simplified cards like dashboard */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center min-h-[155px] flex flex-col justify-center">
          <PatientCardHeading title={t("nutritionResults.fiber")} className={'!mb-2 !text-center'} />
          <div className={`text-sm mb-2 text-gray-600`}>
            {Math.round(currentFiber)}/{Math.round(targets?.fiber || 0)}g
          </div>
          <div className="flex items-center justify-center">
            <SemiCircularProgress 
              current={currentFiber} 
              target={targets?.fiber || 0} 
              color={isFiberOver ? '#ef4444' : '#4686f6'} 
              icon={<Leaf className="text-[#4686f6]" />}
            />
          </div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center min-h-[155px] flex flex-col justify-center">
          <PatientCardHeading title={t("nutritionResults.sugar")} className={'!mb-2 !text-center'} />
          <div className={`text-sm mb-2 text-gray-600`}>
            {Math.round(currentSugar)}/{Math.round(targets?.sugar || 0)}g
          </div>
          <div className="flex items-center justify-center">
            <SemiCircularProgress 
              current={currentSugar} 
              target={targets?.sugar || 0} 
              color={isSugarOver ? '#ef4444' : '#22C55E'} 
              icon={<Candy className="text-[#22C55E]" />}
            />
          </div>
        </div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center min-h-[155px] flex flex-col justify-center">
          <PatientCardHeading title={t("nutritionResults.sodium")} className={'!mb-2 !text-center'} />
          <div className={`text-sm mb-2 text-gray-600`}>
            {Math.round(currentSodium)}/{Math.round(targets?.sodium || 0)}g
          </div>
          <div className="flex items-center justify-center">
            <SemiCircularProgress 
              current={currentSodium} 
              target={targets?.sodium || 0} 
              color={isSodiumOver ? '#ef4444' : '#eab308'} 
              icon={<Droplets className="text-[#eab308]" />}
            />
          </div>
        </div>
      </div>
       {/* Health Score */}
       <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200 min-h-[110px] flex flex-col justify-center">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                  <div className={`w-3 h-3 bg-green-500 rounded-full ${healthScore <= 5 ? 'bg-red-500' : healthScore > 5 && healthScore < 8 ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {t("nutritionResults.healthScore", "Health Score")}
                </span>
              </div>
              <span className="text-lg font-bold text-gray-900">
                {Math.round(healthScore)}/10
              </span>
            </div>
            <div className="w-full bg-white rounded-full h-2 shadow-inner">
              <div
                className={`bg-green-500 h-3 rounded-full transition-all duration-300 ${healthScore <= 5 ? 'bg-red-500' : healthScore > 5 && healthScore < 8 ? 'bg-yellow-500' : 'bg-green-500'}`}
                style={{ width: `${(healthScore / 10) * 100}%` }}
              />
            </div>
            {healthScoreReason ? (
              <div className="mt-2 text-sm text-gray-700">
                {healthScoreReason}
              </div>
            ) : null}
          </div>
    </div>
        </div>
      </Slider>
    </div>
    </>
  );
};

export default TodayCaloriesSummary;


