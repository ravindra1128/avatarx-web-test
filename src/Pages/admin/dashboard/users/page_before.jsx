
import { useState, useEffect, useContext } from "react";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../../components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../../../components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Checkbox } from "../../../../components/ui/checkbox";
import { Avatar, AvatarFallback } from "../../../../components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Pill, Eye } from "lucide-react";
import {
  addMedication,
  checkToken,
  createUser,
  deleteMedication,
  deleteUser,
  getUsers,
} from "@/src/api/api";

const userSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().regex(/^\+\d{9,15}$/, "Invalid phone number format"),
});

const medicationSchema = z.object({
  name: z.string().min(1, "Medication name is required"),
  time: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
});

export default function UsersPage() {
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isAddMedicationOpen, setIsAddMedicationOpen] = useState(false);
  const [isShowMedicationsOpen, setIsShowMedicationsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [medications, setMedications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const [users, setUsers] = useState([]);

  const userForm = useForm({
    resolver: zodResolver(userSchema),
  });

  const medicationForm = useForm({
    resolver: zodResolver(medicationSchema),
  });

  const fetchUsers = async () => {
    setIsLoading(true);
    const res = await getUsers();
    setUsers(res.data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const onAddUser = async (data) => {
    setIsLoading(true);
    try {
      await createUser({
        first_name: data.firstName,
        last_name: data.lastName,
        phone_number: data.phone,
      });
      setIsAddUserOpen(false);
      fetchUsers();
      userForm.reset();
    } catch (error) {
      console.error("Error adding user: ", error);
    } finally {
      setIsLoading(false);
    }
  };

  const onAddMedication = async (data) => {
    setIsLoading(true);
    try {
      await addMedication({
        user_id: selectedUser,
        medication_name: data.name,
        reminder_time: data.time,
      });
      setIsAddMedicationOpen(false);
      fetchUsers();
    } catch (error) {
      console.error("Error adding medication: ", error);
    } finally {
      setIsLoading(false);
    }
  };

  const onDeleteMedication = async (id) => {
    setIsLoading(true);
    try {
      await deleteMedication({
        id: id,
      });
      fetchUsers();
    } catch (error) {
      console.error("Error deleting medication: ", error);
    } finally {
      setIsLoading(false);
    }
  };

  const onDeleteUser = async (id) => {
    setIsLoading(true);
    try {
      await deleteUser({ id });
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user: ", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Users</h1>
        <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
            </DialogHeader>
            <Form {...userForm}>
              <form
                onSubmit={userForm.handleSubmit(onAddUser)}
                className="space-y-4"
              >
                <FormField
                  control={userForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="w-full text-left">
                        First Name
                      </FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={userForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={userForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="+1234567890" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isLoading}>
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Add User
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Phone Number</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center">
                <Loader2 className="mt-6 h-16 w-16 animate-spin mx-auto" />
              </TableCell>
            </TableRow>
          ) : users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-gray-500">
                No users
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center">
                    <Avatar className="h-8 w-8 mr-2">
                      <AvatarFallback>
                        {user.first_name[0]}
                        {user.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    {user.first_name} {user.last_name}
                  </div>
                </TableCell>
                <TableCell className="text-left">{user.phone_number}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Dialog
                      open={isAddMedicationOpen}
                      onOpenChange={setIsAddMedicationOpen}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedUser(user.id)}
                          disabled={isLoading}
                        >
                          {isLoading && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          <Pill className="mr-2 h-4 w-4" /> Add Medication
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-white">
                        <DialogHeader>
                          <DialogTitle>Add Medication</DialogTitle>
                        </DialogHeader>
                        <Form {...medicationForm}>
                          <form
                            onSubmit={medicationForm.handleSubmit(
                              onAddMedication
                            )}
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
                          onClick={() => setSelectedUser(user.id)}
                        >
                          <Eye className="mr-2 h-4 w-4" /> Show Medications
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-white">
                        <DialogHeader>
                          <DialogTitle>
                            Medications for{" "}
                            {
                              users.find((u) => u.id === selectedUser)
                                ?.first_name
                            }{" "}
                            {
                              users.find((u) => u.id === selectedUser)
                                ?.last_name
                            }
                          </DialogTitle>
                        </DialogHeader>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Medication Name</TableHead>
                              <TableHead>Reminder Time</TableHead>
                              <TableHead>Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {isLoading ? (
                              <TableRow>
                                <TableCell colSpan={3} className="text-center">
                                  <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                                </TableCell>
                              </TableRow>
                            ) : users.find((u) => u.id === selectedUser)
                                ?.medications.length === 0 ? (
                              <TableRow>
                                <TableCell
                                  colSpan={3}
                                  className="text-center text-gray-500"
                                >
                                  No medications
                                </TableCell>
                              </TableRow>
                            ) : (
                              users
                                .find((u) => u.id === selectedUser)
                                ?.medications.map((medication) => (
                                  <TableRow key={medication.id}>
                                    <TableCell className="text-left">
                                      {medication.medication_name}
                                    </TableCell>
                                    <TableCell className="text-left">
                                      {medication.reminder_time.slice(0, -3)}{" "}
                                      PST
                                    </TableCell>
                                    <TableCell>
                                      <Button
                                        variant="destructive"
                                        className="bg-red-600 text-white"
                                        size="sm"
                                        onClick={() =>
                                          onDeleteMedication(medication.id)
                                        }
                                        disabled={isLoading}
                                      >
                                        {isLoading ? (
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                          "Delete"
                                        )}
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))
                            )}
                          </TableBody>
                        </Table>
                      </DialogContent>
                    </Dialog>
                    <Button
                      className="bg-red-600 text-white h-[31px]"
                      variant="destructive"
                      onClick={() => onDeleteUser(user.id)}
                      disabled={isLoading}
                    >
                      {isLoading && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
