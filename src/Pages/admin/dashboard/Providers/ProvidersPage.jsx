import React, { useState, useEffect, useContext } from "react";
import { Search, Plus, User, Edit, Trash2, Filter } from "lucide-react";
import { Button } from "../../../../Component/UI/button";
import { Input } from "../../../../Component/UI/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../../Component/UI/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../Component/UI/select";
import { toast } from "react-toastify";
import apiClient from "../../../../config/APIConfig";
import { logCritical, logInfo } from "../../../../utils/logger";
import Loader from "../../../../Component/Loader";
import { useTranslation } from 'react-i18next';
import { TablePagination } from "@mui/material";
import CreateProvider from "./CreateProvider";
import { useLocation } from "react-router-dom";

const ProvidersPage = () => {
  const { t } = useTranslation();
  const [providers, setProviders] = useState([]);
  const [filteredProviders, setFilteredProviders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const {pathname} = useLocation();
  useEffect(() => {
    fetchProviders();
  }, []);

  useEffect(() => {
    const filtered = providers.filter((provider) => {
      const fullName = `${provider.first_name} ${provider.last_name}`.toLowerCase();
      const email = provider.email?.toLowerCase() || "";
      const phone = provider.phone_number?.toLowerCase() || "";
      const searchLower = searchQuery.toLowerCase();

      return (
        fullName.includes(searchLower) ||
        email.includes(searchLower) ||
        phone.includes(searchLower)
      );
    });
    setFilteredProviders(filtered);
  }, [searchQuery, providers]);

  const fetchProviders = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.post("/medical/customers", {
        slug: pathname.split("/")[2]
      });
      if (response?.status === 200) {
        setProviders(response.data.data || []);
        setTotalCount(response.data.data?.length || 0);
        logInfo("Providers fetched successfully");
      }
    } catch (error) {
      logCritical("Error fetching providers", error);
      toast.error(error?.response?.data?.message || "Failed to fetch providers!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProvider = async (providerId) => {
    if (!window.confirm("Are you sure you want to delete this provider?")) {
      return;
    }

    try {
      const response = await apiClient.delete(`/medical/customers/${providerId}`);
      toast.success(response.data.message || "Provider deleted successfully");
      fetchProviders();
    } catch (error) {
      logCritical("Error deleting provider", error);
      toast.error(error?.response?.data?.message || "Failed to delete provider");
    }
  };

  const handleSearch = (value) => {
    setSearchQuery(value);
  };

  const openCreateModal = () => {
    setSelectedProvider(null);
    setShowCreateModal(true);
  };

  const handleEditProvider = (provider) => {
    setSelectedProvider(provider);
    setShowCreateModal(true);
  };

  const handleCreateSuccess = async (data) => {
    setShowCreateModal(false);
    fetchProviders();

    // const payload = {
    //   ...data,
    //   phone_number: data.phone_number.startsWith('+1') ? data.phone_number : `+1${data.phone_number}`,
    // };
    // try {
    //   const res = await apiClient.post("/user/create_customer", payload);
    //   toast.success(
    //     res.data.message ||
    //       `Provider Created successfully`
    //   );
    //   setShowCreateModal(false);
    //   setSelectedProvider(null);
    //   fetchProviders();
    // } catch (err) {
    //   toast.error(err?.response?.data?.message || "Something went wrong!");
    // } finally {
    //   setIsSubmitting(false);
    // }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t('providers.title', 'Providers')}</h1>
        <Button
          onClick={openCreateModal}
          className="h-10 bg-black hover:bg-gray-700 text-white font-medium rounded-lg shadow-sm transition-all duration-200 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          <span>{t('providers.addProvider', 'Add Provider')}</span>
        </Button>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Input
            type="text"
            placeholder={t('providers.searchPlaceholder', 'Search providers...')}
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10 h-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <Select value="all" onValueChange={() => {}}>
            <SelectTrigger className="w-[180px] bg-white border-gray-300 hover:border-blue-400 transition-colors h-12">
              <SelectValue placeholder={t('providers.filterByStatus', 'Filter by Status')} />
            </SelectTrigger>
            <SelectContent className="bg-white border-[#e4ebf4] text-xs">
              <SelectItem value="all">{t('providers.allProviders', 'All Providers')}</SelectItem>
              <SelectItem value="active">{t('providers.active', 'Active')}</SelectItem>
              <SelectItem value="inactive">{t('providers.inactive', 'Inactive')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="max-h-100 table-container">
        <Table className="!border-0">
          <TableHeader>
            <TableRow>
              <TableHead className="!border-x-0 !border-t-0 !border-[#e5e7eb] !py-4 whitespace-nowrap overflow-hidden !px-[12px]">
                {t('providers.name', 'Name')}
              </TableHead>
              <TableHead className="!border-x-0 !border-t-0 !border-[#e5e7eb] !py-4 whitespace-nowrap overflow-hidden !px-[12px]">
                {t('providers.phoneNumber', 'Phone Number')}
              </TableHead>
              <TableHead className="!border-x-0 !border-t-0 !border-[#e5e7eb] !py-4 whitespace-nowrap overflow-hidden !px-[12px]">
                {t('providers.status', 'Status')}
              </TableHead>
              {/* <TableHead className="!border-x-0 !border-t-0 !border-[#e5e7eb] !py-4 whitespace-nowrap overflow-hidden !px-[12px]">
                {t('providers.action', 'Action')}
              </TableHead> */}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-16">
                  <Loader className="w-16 h-16" />
                </TableCell>
              </TableRow>
            )}
            {filteredProviders.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-16 !border-x-0 !border-t-0 !border-[#e5e7eb] !py-4"
                >
                  <div className="flex flex-col items-center justify-center">
                    <User className="w-16 h-16 text-gray-300 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">
                      {searchQuery ? t('providers.noResults', 'No providers found') : t('providers.noProviders', 'No providers yet')}
                    </h3>
                    <p className="text-gray-500 mb-4">
                      {searchQuery 
                        ? t('providers.noResultsDesc', 'Try adjusting your search terms')
                        : t('providers.noProvidersDesc', 'Get started by adding your first provider')
                      }
                    </p>
                    {!searchQuery && (
                      <Button onClick={openCreateModal} className="bg-black hover:bg-gray-700 text-white  ">
                        <Plus className="h-4 w-4 mr-2" />
                        {t('providers.addFirstProvider', 'Add First Provider')}
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredProviders.map((provider) => (
                <TableRow key={provider.id}>
                  <TableCell className="font-medium !border-x-0 !border-t-0 !border-[#e5e7eb] !py-4 whitespace-nowrap overflow-hidden !px-[12px]">
                    {/* <div className="flex items-center">
                      <span className="!text-blue-500 hover:!underline !transform hover:!translate-y-[-2px] !transition-transform !duration-200 cursor-pointer"> */}
                        {provider.first_name} {provider.last_name}
                        {/* </span>
                        </div> */}
                  </TableCell>
                  <TableCell className="text-left !border-x-0 !border-t-0 !border-[#e5e7eb] !py-4 whitespace-nowrap overflow-hidden !px-[12px]">
                    {provider.phone_number}
                  </TableCell>
                  <TableCell className="text-left !border-x-0 !border-t-0 !border-[#e5e7eb] !py-4 whitespace-nowrap overflow-hidden !px-[12px]">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  </TableCell>
                  {/* <TableCell className="text-left !border-x-0 !border-t-0 !border-[#e5e7eb] !py-4 whitespace-nowrap overflow-hidden !px-[12px]">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditProvider(provider)}
                        className="h-8 px-3"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteProvider(provider.id)}
                        className="h-8 px-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell> */}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </div>

      {/* Use CreateFacility component */}
      <CreateProvider
        isOpen={showCreateModal}
        setIsOpen={setShowCreateModal}
        user={selectedProvider}
        afterSuccess={handleCreateSuccess}
      />
    </div>
  );
};

export default ProvidersPage;
