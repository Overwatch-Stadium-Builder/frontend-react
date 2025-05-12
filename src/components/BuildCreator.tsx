import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import RoundEditor from "./RoundEditor";
import { useToast } from "@/components/ui/use-toast";
import { Build, Round, Item, Power } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";

const formSchema = z.object({
  title: z.string().min(1, { message: "Title is required." }),
  heroId: z.string().min(1, { message: "Hero selection is required." }),
});

interface BuildCreatorProps {
  editingBuild?: Build;
}

const BuildCreator = ({ editingBuild }: BuildCreatorProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { userId, token } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeRound, setActiveRound] = useState("1");
  const [currentRoundCost, setCurrentRoundCost] = useState(0);
  const [selectedHeroId, setSelectedHeroId] = useState<number | undefined>(
    editingBuild?.heroId || undefined
  );
  
  // Get hero ID from query parameter if available
  const queryParams = new URLSearchParams(location.search);
  const preselectedHeroId = queryParams.get('hero');
  
  const [rounds, setRounds] = useState<Round[]>(
    editingBuild?.rounds || 
    Array.from({ length: 7 }, (_, i) => ({
      roundNumber: i + 1,
      explanation: "",
      items: [],
      powers: []
    }))
  );

  // Fetch items from the backend
  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['items'],
    queryFn: async () => {
      const response = await fetch("https://owapi.luciousdev.nl/api/items");
      if (!response.ok) {
        throw new Error("Failed to fetch items");
      }
      return response.json();
    }
  });

  // Fetch powers from the backend
  const { data: powers = [], isLoading: powersLoading } = useQuery({
    queryKey: ['powers'],
    queryFn: async () => {
      const response = await fetch("https://owapi.luciousdev.nl/api/powers");
      if (!response.ok) {
        throw new Error("Failed to fetch powers");
      }
      return response.json();
    }
  });

  // Fetch heroes from the backend
  const { data: heroes = [], isLoading: heroesLoading } = useQuery({
    queryKey: ['heroes'],
    queryFn: async () => {
      const response = await fetch("https://owapi.luciousdev.nl/api/heroes");
      if (!response.ok) {
        throw new Error("Failed to fetch heroes");
      }
      return response.json();
    }
  });

  useEffect(() => {
    // Calculate cost for the current active round
    const activeRoundNumber = parseInt(activeRound);
    const currentRound = rounds.find(r => r.roundNumber === activeRoundNumber);
    
    if (currentRound) {
      let cost = 0;
      currentRound.items.forEach(item => {
        cost += item.cost || 0;
      });
      setCurrentRoundCost(cost);
    } else {
      setCurrentRoundCost(0);
    }
  }, [rounds, activeRound]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: editingBuild?.title || "",
      heroId: editingBuild?.heroId.toString() || preselectedHeroId || "",
    },
  });

  // Watch for heroId changes to update selectedHeroId
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'heroId' && value.heroId) {
        setSelectedHeroId(parseInt(value.heroId));
      }
    });
    return () => subscription.unsubscribe();
  }, [form.watch]);

  const updateRound = (updatedRound: Round) => {
    setRounds((prevRounds) =>
      prevRounds.map((round) =>
        round.roundNumber === updatedRound.roundNumber ? updatedRound : round
      )
    );
  };

  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);

    // Check if at least one round has an explanation
    const hasExplanation = rounds.some((round) => round.explanation.trim() !== "");
    
    if (!hasExplanation) {
      toast({
        title: "Validation Error",
        description: "Please provide an explanation for at least one round.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    if (!userId) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to create a build.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      navigate("/login");
      return;
    }

    // Ensure empty rounds in between filled rounds are preserved with a dash
    const processedRounds = [...rounds];
    
    // First identify all rounds that have content
    const filledRoundNumbers = rounds
      .filter(round => 
        round.explanation.trim() !== "" || 
        round.items.length > 0 || 
        round.powers.length > 0
      )
      .map(round => round.roundNumber);
    
    if (filledRoundNumbers.length > 0) {
      // Find min and max round numbers with content
      const minRound = Math.min(...filledRoundNumbers);
      const maxRound = Math.max(...filledRoundNumbers);
      
      // Add dash explanations to empty rounds between min and max
      for (let i = minRound; i <= maxRound; i++) {
        const roundIndex = processedRounds.findIndex(r => r.roundNumber === i);
        if (roundIndex !== -1) {
          const round = processedRounds[roundIndex];
          if (round.explanation.trim() === "" && 
              round.items.length === 0 && 
              round.powers.length === 0) {
            processedRounds[roundIndex] = {
              ...round,
              explanation: "-"
            };
          }
        }
      }
    }
    
    // Create the build object with all processed rounds
    const buildData = {
      id: editingBuild?.id,
      userId: userId,
      heroId: parseInt(values.heroId),
      title: values.title,
      rounds: processedRounds,
    };

    // Try to submit to backend
    const apiUrl = editingBuild 
      ? `https://owapi.luciousdev.nl/api/builds/${editingBuild.id}` 
      : "https://owapi.luciousdev.nl/api/builds";
    
    const method = editingBuild ? "PUT" : "POST";

    fetch(apiUrl, {
      method,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(buildData)
    })
      .then(response => {
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Unauthorized. Please log in again.");
          }
          throw new Error("Failed to save build");
        }
        return response.json();
      })
      .then(data => {
        toast({
          title: `Build ${editingBuild ? "updated" : "created"}`,
          description: `Your build was successfully ${
            editingBuild ? "updated" : "created"
          } and is awaiting verification.`,
        });
        navigate(`/build/${data.id || editingBuild?.id}`);
      })
      .catch(error => {
        console.error("Error saving build:", error);
        toast({
          title: "Error",
          description: error.message || `Failed to ${editingBuild ? "update" : "create"} build. Please try again later.`,
          variant: "destructive",
        });
        
        if (error.message === "Unauthorized. Please log in again.") {
          navigate("/login");
        }
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  }

  const loading = itemsLoading || powersLoading || heroesLoading;

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Build Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter a title for your build" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="heroId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hero</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      setSelectedHeroId(parseInt(value));
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a hero" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {heroes.map((hero) => (
                        <SelectItem key={hero.id} value={hero.id.toString()}>
                          {hero.name} ({hero.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="bg-muted p-3 rounded-md">
            <p className="text-sm font-medium">Round {activeRound} Cost: {currentRoundCost} cash</p>
          </div>

          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Round Explanations</h3>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">Loading items and powers...</span>
                </div>
              ) : (
                <Tabs
                  value={activeRound}
                  onValueChange={setActiveRound}
                  className="w-full"
                >
                  <TabsList className="grid grid-cols-7 w-full mb-4">
                    {Array.from({ length: 7 }, (_, i) => (
                      <TabsTrigger
                        key={i + 1}
                        value={(i + 1).toString()}
                        className="text-center"
                      >
                        {i + 1}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {Array.from({ length: 7 }, (_, i) => (
                    <TabsContent key={i + 1} value={(i + 1).toString()}>
                      <RoundEditor
                        round={rounds[i]}
                        onUpdate={updateRound}
                        allItems={items}
                        allPowers={powers}
                        selectedHeroId={selectedHeroId}
                      />
                    </TabsContent>
                  ))}
                </Tabs>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || loading}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {editingBuild ? "Updating..." : "Creating..."}
                </>
              ) : (
                `${editingBuild ? "Update" : "Create"} Build`
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default BuildCreator;
