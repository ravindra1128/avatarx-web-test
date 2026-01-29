import React, { useState, useEffect } from "react";
import { Search, MessageCircle, Box } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../Component/UI/select";
import { Input } from "../../../Component/UI/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../../Component/UI/popover";
import moment from "moment";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from "@mui/material";
import { Link, useLocation } from "react-router-dom";
import { useUser } from "../../../Hooks/useUser";
import { useTranslation } from 'react-i18next';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../../Component/UI/tooltip";
import apiClient from "../../../config/APIConfig";
import { logCritical } from "../../../utils/logger";

const TableView = ({ patients }) => {
  const { t } = useTranslation();
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(sessionStorage.getItem('dashboard_rowsPerPage') || 10);
  const [vitalData, setVitalData] = useState({});
  const [loadingVitals, setLoadingVitals] = useState({});
  const { slug } = useUser();
  const {pathname} = useLocation();
  const facilitySlug = pathname.split("/")[2];

  // Function to fetch vital data from API
  const fetchVitalData = async (vitalId, sub) => {
    if (!vitalId || vitalData[vitalId]) return;
    
    setLoadingVitals(prev => ({ ...prev, [vitalId]: true }));
    
    try {
      const response = await apiClient.post('/user/get_user_health_vitals', {
        vital_id: vitalId
      });
      
      if (response?.status === 200) {
        const data = response.data.data;
        // For now, assuming the response is already decrypted
        setVitalData(prev => ({ ...prev, [vitalId]: data }));
      }
    } catch (error) {
      console.error('Error fetching vital data:', error);
      logCritical("Error fetching vital data:", error);
    } finally {
      setLoadingVitals(prev => ({ ...prev, [vitalId]: false }));
    }
  };


  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
    sessionStorage.setItem('dashboard_rowsPerPage', event.target.value);
  };

  const capitalizeFirstLetter = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  const column = [
    {
      id: "name",
      name: t('table.patientName'),
    },
    {
      id: "priority", 
      name: t('table.priority'),
    },
    {
      id: "vitals_created_at",
      name: t('table.lastReadingTime'),
    },
    {
      id: "notes",
      name: t('table.notes'),
    },
  ];

  return (
    <Paper sx={{ width: "100%", overflow: "hidden", borderRadius: 2 }}>
      <TableContainer >
        <Table stickyHeader sx={{ minWidth: 650 }} aria-label="sticky table">
          <TableHead>
            <TableRow>
              {column?.map((headCell) => (
                <TableCell key={headCell.id}>
                  {headCell.name}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {patients
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((patient, index) => (
                <TableRow
                  key={index}
                  sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                >
                  <TableCell component="th" scope="row">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link 
                            to={`/dashboard/${facilitySlug}/patients/${patient.slug}`} 
                            className="!text-blue-500 hover:!underline !transform hover:!translate-y-[-2px] !transition-transform !duration-200"
                            onMouseEnter={() => fetchVitalData(patient.vital_id, patient.sub)}
                          >
                            {patient.patient_first_name} {patient.patient_last_name}
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs p-4 bg-gray-800 border border-gray-700 shadow-xl rounded-lg">
                          <div className="space-y-3">
                            {/* Header with timestamp */}
                            <div className="text-sm font-medium text-white">
                              {patient.vitals_created_at ? moment(patient.vitals_created_at).format("MMM DD, hh:mm A") : "N/A"}
                            </div>
                            
                            {/* Loading state */}
                            {loadingVitals[patient.vital_id] && (
                              <div className="flex items-center gap-2 text-sm text-gray-300">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-300"></div>
                                Loading vital signs...
                              </div>
                            )}
                            
                            {/* Vital signs with colored squares */}
                            {!loadingVitals[patient.vital_id] && vitalData[patient.vital_id] && (
                              <div className="space-y-2">
                                {/* Blood Pressure - Systolic */}
                                {vitalData[patient.vital_id]?.systolic_blood_pressure_mmhg && (
                                  <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 bg-pink-400 rounded-sm"></div>
                                    <span className="text-sm text-white">
                                      Systolic BP (mmHg): {vitalData[patient.vital_id].systolic_blood_pressure_mmhg}
                                    </span>
                                  </div>
                                )}
                                
                                {/* Blood Pressure - Diastolic */}
                                {vitalData[patient.vital_id]?.diastolic_blood_pressure_mmhg && (
                                  <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 bg-blue-400 rounded-sm"></div>
                                    <span className="text-sm text-white">
                                      Diastolic BP (mmHg): {vitalData[patient.vital_id].diastolic_blood_pressure_mmhg}
                                    </span>
                                  </div>
                                )}
                                
                                {/* Heart Rate */}
                                {vitalData[patient.vital_id]?.heart_rate_bpm && (
                                  <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 bg-cyan-400 rounded-sm"></div>
                                    <span className="text-sm text-white">
                                      Heart Rate (BPM): {vitalData[patient.vital_id].heart_rate_bpm}
                                    </span>
                                  </div>
                                )}
                                
                                {/* Breathing Rate */}
                                {vitalData[patient.vital_id]?.breathing_rate_bpm && (
                                  <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 bg-purple-400 rounded-sm"></div>
                                    <span className="text-sm text-white">
                                      Breathing Rate (BPM): {vitalData[patient.vital_id].breathing_rate_bpm}
                                    </span>
                                  </div>
                                )}
                                
                                {/* HRV */}
                                {vitalData[patient.vital_id]?.hrv_sdnn_ms && (
                                  <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 bg-orange-400 rounded-sm"></div>
                                    <span className="text-sm text-white">
                                      HRV (ms): {vitalData[patient.vital_id].hrv_sdnn_ms}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {/* No data state */}
                            {!loadingVitals[patient.vital_id] && !vitalData[patient.vital_id] && (
                              <div className="text-sm text-gray-400">No vital data available</div>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell>
                    {" "}
                    <span
                      className={`px-4 py-1 rounded-full text-sm border-1 ${
                        patient.priority === "low"
                          ? "bg-blue-50 text-blue-700"
                          : patient.priority === "medium"
                          ? "bg-[#fff8e1] text-yellow-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {capitalizeFirstLetter(patient?.priority || "low")}
                    </span>
                  </TableCell>
                  <TableCell>
                    {patient.vitals_created_at
                      ? moment(patient.vitals_created_at).format(
                          "YYYY-MM-DD hh:mm A"
                        )
                      : ""}
                  </TableCell>
                  <TableCell>{patient?.alert_reason}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[10, 25, 50, 100]}
        component="div"
        count={patients?.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
};

export default TableView;
