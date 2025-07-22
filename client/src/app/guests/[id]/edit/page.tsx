"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Guest,
  getGuestById,
  updateGuest,
  UpdateGuestDto,
} from "@/utils/guestService";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { AlertCircle, ChevronLeft, Save, CheckCircle2 } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { getAllProfessions, Profession } from "@/utils/professionService";
import { getAllCities, getCitiesByCountry, City } from "@/utils/cityService";
import { getAllCountries, Country } from "@/utils/countryService";

// Define the form schema
const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  lastName: z.string().min(1, "Last name is required"),
  cid: z.string().min(1, "ID is required"),
  birthday: z.string().min(1, "Birthday is required"),
  email: z.string().email("Invalid email format"),
  phone: z.string().min(1, "Phone number is required"),
  address: z.string().min(1, "Address is required"),
  professionId: z.string().nullable().optional(),
  cityId: z.string().min(1, "City is required"),
  countryId: z.string().min(1, "Country is required"),
});

export default function EditGuestPage() {
  const params = useParams();
  const router = useRouter();
  const [guest, setGuest] = useState<Guest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [professions, setProfessions] = useState<Profession[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);

  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      lastName: "",
      cid: "",
      birthday: "",
      email: "",
      phone: "",
      address: "",
      professionId: null,
      cityId: "",
      countryId: "",
    },
  });

  useEffect(() => {
    const fetchGuest = async () => {
      if (!id) {
        setError("Guest ID not found");
        setLoading(false);
        return;
      }

      try {
        // Fetch guest data
        const data = await getGuestById(id);
        setGuest(data);

        // Format the date to YYYY-MM-DD for input
        const formattedDate = new Date(data.birthday)
          .toISOString()
          .split("T")[0];

        // Set form values
        form.reset({
          name: data.name,
          lastName: data.lastName,
          cid: data.cid,
          birthday: formattedDate,
          email: data.email,
          phone: data.phone,
          address: data.address,
          professionId: data.professionId || null,
          cityId: data.cityId,
          countryId: data.countryId,
        });
      } catch (err) {
        setError("Failed to load guest details");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchGuest();
  }, [id, form]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all data in parallel for better performance
        const [professionsData, citiesData, countriesData] = await Promise.all([
          getAllProfessions(),
          getAllCities(),
          getAllCountries(),
        ]);

        setProfessions(professionsData);
        setCities(citiesData);
        setCountries(countriesData);

        console.log("Fetched data:", {
          professions: professionsData.length,
          cities: citiesData.length,
          countries: countriesData.length,
        });

        // If guest data is already loaded, load cities for the guest's country
        const formCountryId = form.getValues("countryId");
        if (formCountryId) {
          try {
            const citiesForCountry = await getCitiesByCountry(formCountryId);
            if (citiesForCountry && citiesForCountry.length > 0) {
              setCities(citiesForCountry);
            }
          } catch (err) {
            console.error("Error loading cities for guest's country:", err);
          }
        }
      } catch (error) {
        console.error("Error fetching form data:", error);
      }
    };

    fetchData();
  }, [form]);

  const [notification, setNotification] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!id) return;

    setSubmitting(true);

    try {
      await updateGuest(id, values as UpdateGuestDto);
      setNotification({
        type: "success",
        message: "Guest updated successfully",
      });
      // Redirect after a short delay to allow user to see the notification
      setTimeout(() => {
        router.push(`/guests/${id}`);
      }, 1500);
    } catch (error) {
      setNotification({
        type: "error",
        message: "Failed to update guest",
      });
      console.error(error);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !guest) {
    return (
      <div className="flex items-center justify-center min-h-screen flex-col gap-4">
        <AlertCircle className="h-16 w-16 text-destructive" />
        <h2 className="text-2xl font-bold text-destructive">Error</h2>
        <p>{error || "Guest not found"}</p>
        <Button asChild>
          <Link href="/guests">Back to Guests</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {notification.type && (
        <div
          className={`mb-4 p-4 rounded-md flex items-center ${
            notification.type === "success"
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 mr-2" />
          ) : (
            <AlertCircle className="h-5 w-5 mr-2" />
          )}
          <p>{notification.message}</p>
        </div>
      )}

      <div className="flex items-center mb-6">
        <Button variant="ghost" asChild className="mr-2">
          <Link href={`/guests/${id}`}>
            <ChevronLeft className="h-5 w-5 mr-2" />
            Back to Guest Details
          </Link>
        </Button>
      </div>

      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Edit Guest</CardTitle>
          <CardDescription>
            Update information for {guest.name} {guest.lastName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="First name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Last name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cid"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ID Number</FormLabel>
                        <FormControl>
                          <Input placeholder="ID number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="birthday"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Birthday</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="professionId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Profession</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select profession" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {professions.map((profession) => (
                              <SelectItem
                                key={profession.id}
                                value={profession.id}
                              >
                                {profession.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="Email address"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="Phone number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input placeholder="Address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cityId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select city" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {cities.map((city) => (
                              <SelectItem key={city.id} value={city.id}>
                                {city.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="countryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            // Update cities when country changes
                            const loadCitiesForCountry = async () => {
                              try {
                                const citiesForCountry =
                                  await getCitiesByCountry(value);
                                if (citiesForCountry.length > 0) {
                                  setCities(citiesForCountry);
                                }
                                // Reset the selected city if needed
                                if (form.getValues("cityId")) {
                                  form.setValue("cityId", "");
                                }
                              } catch (error) {
                                console.error(
                                  "Error loading cities for country:",
                                  error
                                );
                              }
                            };
                            loadCitiesForCountry();
                          }}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {countries.map((country) => (
                              <SelectItem key={country.id} value={country.id}>
                                {country.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
