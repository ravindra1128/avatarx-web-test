import React from 'react'
import { Activity } from 'lucide-react'
import { Button } from '../../Component/UI/button'

const PatientDashboardButton = ({ btnClick, btnText, icon, className, ...rest }) => {
    return (
        <Button
            className={`bg-black hover:bg-gray-800 text-white text-sm font-medium rounded-lg shadow-sm transition-all duration-200 flex items-center gap-2 px-4 py-2 ${className || ''}`}
            onClick={btnClick}
            {...rest}
        >
            {icon ? icon : <Activity className="w-4 h-4" />}
            {btnText}
        </Button>
    )
}

export default PatientDashboardButton