import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "../../../../Component/UI/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../../Component/UI/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../../../Component/UI/form";
import { Input } from "../../../../Component/UI/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../../Component/UI/table";
// import { zodResolver } from "@hookform/resolvers/zod";
import { Edit, Eye, Loader2, Plus } from "lucide-react";
import * as z from "zod";
// import {
//   addMedication,
//   deleteMedication,
//   getUsers,
//   updateMedication,
// } from "@/src/api/api";
// import { useUser } from "@/src/contexts/UserContext";
import { Link } from "react-router-dom";

// Mock data (this should be fetched from your API in a real application)
const mockUsers = [
  {
    id: 1,
    first_name: "John",
    last_name: "Doe",
    email: "john@example.com",
    phone_number: "+1234567890",
    medications: [
      { id: 1, medication_name: "Aspirin", reminder_time: "08:00:00" },
      { id: 2, medication_name: "Vitamin C", reminder_time: "20:00:00" },
    ],
  },
  {
    id: 2,
    first_name: "Jane",
    last_name: "Smith",
    email: "jane@example.com",
    phone_number: "+1987654321",
    medications: [
      { id: 3, medication_name: "Ibuprofen", reminder_time: "14:00:00" },
    ],
  },
];

const medicationSchema = z.object({
  name: z.string().min(1, "Medication name is required"),
  time: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
});

function RemindersPage() {
  const [users, setUsers] = useState(mockUsers);
  const [isAddMedicationOpen, setIsAddMedicationOpen] = useState(false);
  const [isEditMedicationOpen, setIsEditMedicationOpen] = useState(false);
  const [isShowMedicationsOpen, setIsShowMedicationsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedMedication, setSelectedMedication] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const medicationForm = useForm({});

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Reminders</h1>
      <Table className="!border-0 reminder-table">
        <TableHeader>
          <TableRow>
            <TableHead className="text-left !border-t-0 !p-4 !border-x-0 !border-[#e5e7eb]">
              Name
            </TableHead>
            <TableHead className="text-left !border-t-0 !p-4 !border-x-0 !border-[#e5e7eb]">
              Email
            </TableHead>
            <TableHead className="text-left !border-t-0 !p-4 !border-x-0 !border-[#e5e7eb]">
              Phone Number
            </TableHead>
            <TableHead className="text-left !border-t-0 !p-4 !border-x-0 !border-[#e5e7eb]">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="[&_tr:last-child]:!border-b-0">
          {isLoading && <Loader />}
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-gray-500 mt-7">
                <div className="flex flex-col space-y-5 justify-center items-center">
                  Please add users to start adding reminders. <br />
                  <Link
                    to={`/dashboard/${authData?.user?.first_name}/patients`}
                  >
                    <Button variant="default">Go to Patients</Button>
                  </Link>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="text-left !p-4 !border-x-0 !border-[#e5e7eb] font-medium">
                  <div className="flex items-center">
                    {/* <Avatar className="h-8 w-8 mr-2">
                      <AvatarFallback>
                        {user.first_name[0]}
                        {user.last_name[0]}
                      </AvatarFallback>
                    </Avatar> */}
                    {user.first_name} {user.last_name}
                  </div>
                </TableCell>
                <TableCell className="text-left !p-4 !border-x-0 !border-[#e5e7eb]">
                  {user.email}
                </TableCell>
                <TableCell className="text-left !p-4 !border-x-0 !border-[#e5e7eb]">
                  {user.phone_number}
                </TableCell>
                <TableCell className="text-left !p-4 !border-x-0 !border-[#e5e7eb]">
                  <div className="flex space-x-2">
                    <Dialog
                      open={isAddMedicationOpen}
                      onOpenChange={(isOpen) => {
                        setIsAddMedicationOpen(isOpen);
                        if (!isOpen) {
                          setSelectedUser(null);
                          medicationForm.reset();
                        }
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedUser(user)}
                        >
                          <Plus className="mr-2 h-4 w-4" /> Add Medication
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-white">
                        <DialogHeader>
                          <DialogTitle>
                            Add Medication for {user.first_name}{" "}
                            {user.last_name}
                          </DialogTitle>
                        </DialogHeader>
                        <Form {...medicationForm}>
                          <form
                            // onSubmit={medicationForm.handleSubmit(
                            //   onAddMedication
                            // )}
                            className="space-y-4"
                          >
                            <FormField
                              control={medicationForm.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Medication Name</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={medicationForm.control}
                              name="time"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Reminder Time</FormLabel>
                                  <FormControl>
                                    <Input {...field} type="time" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <Button type="submit" disabled={isLoading}>
                              {isLoading && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              )}
                              Add Medication
                            </Button>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                    <Dialog
                      open={isShowMedicationsOpen}
                      onOpenChange={setIsShowMedicationsOpen}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedUser(user)}
                        >
                          <Eye className="mr-2 h-4 w-4" /> Show Medications
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl bg-white">
                        <DialogHeader>
                          <DialogTitle>
                            Medications for {user.first_name} {user.last_name}
                          </DialogTitle>
                        </DialogHeader>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Medication Name</TableHead>
                              <TableHead>Reminder Time</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {user.medications.map((medication) => (
                              <TableRow key={medication.id}>
                                <TableCell>
                                  {medication.medication_name}
                                </TableCell>
                                <TableCell>
                                  {medication.reminder_time.slice(0, -3)} PST
                                </TableCell>
                                <TableCell>
                                  <div className="flex space-x-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedMedication(medication);
                                        medicationForm.reset({
                                          name: medication.medication_name,
                                          time: medication.reminder_time.slice(
                                            0,
                                            -3
                                          ),
                                        });
                                        setIsEditMedicationOpen(true);
                                      }}
                                    >
                                      <Edit className="mr-2 h-4 w-4" /> Edit
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      className="bg-red-700 text-white"
                                      onClick={() =>
                                        onDeleteMedication(
                                          user.id,
                                          medication.id
                                        )
                                      }
                                      disabled={isLoading}
                                    >
                                      {isLoading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        "Delete"
                                      )}
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </DialogContent>
                    </Dialog>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <Dialog
        open={isEditMedicationOpen}
        onOpenChange={setIsEditMedicationOpen}
      >
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Edit Medication</DialogTitle>
          </DialogHeader>
          <Form {...medicationForm}>
            <form
              // onSubmit={medicationForm.handleSubmit(onEditMedication)}
              className="space-y-4"
            >
              <FormField
                control={medicationForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Medication Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={medicationForm.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reminder Time</FormLabel>
                    <FormControl>
                      <Input {...field} type="time" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Medication
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default RemindersPage;
