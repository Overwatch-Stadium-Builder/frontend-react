import { useState, useEffect } from "react";
import { Round, Item, Power, ItemCategory, ItemRarity } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface RoundEditorProps {
  round: Round;
  onUpdate: (round: Round) => void;
  allItems?: Item[];
  allPowers?: Power[];
  selectedHeroId?: number;
}

const RoundEditor = ({ round, onUpdate, allItems = [], allPowers = [], selectedHeroId }: RoundEditorProps) => {
  const { toast } = useToast();
  const [explanation, setExplanation] = useState(round.explanation);
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory>("Weapon");
  const [selectedPowerId, setSelectedPowerId] = useState<string>("");

  // Filter powers by hero (hero-specific or general powers)
  const filteredPowers = allPowers.filter(power => !power.heroId || power.heroId === selectedHeroId);
  
  // Items already selected in this round
  const selectedItemIds = round.items?.map(item => item.id) || [];
  const selectedPowerIds = round.powers?.map(power => power.id) || [];
  
  // Maximum counts
  const MAX_TOTAL_ITEMS = 6;
  
  // Dynamic power limits based on round number
  const getMaxPowersForRound = (roundNumber: number): number => {
    if (roundNumber <= 2) return 1;
    if (roundNumber <= 4) return 2;
    if (roundNumber <= 6) return 3;
    return 4; // Round 7
  };
  
  const MAX_POWERS = getMaxPowersForRound(round.roundNumber);

  const handleExplanationChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setExplanation(e.target.value);
  };

  const handleBlur = () => {
    onUpdate({ ...round, explanation });
  };

  const addItem = (item: Item) => {    
    // Check if item is already selected
    if (selectedItemIds.includes(item.id)) {
      toast({
        title: "Item Already Selected",
        description: "This item is already part of your build for this round.",
        variant: "destructive",
      });
      return;
    }
    
    // Check total items limit
    if ((round.items?.length || 0) >= MAX_TOTAL_ITEMS) {
      toast({
        title: "Item Limit Reached",
        description: `You can only select up to ${MAX_TOTAL_ITEMS} items total.`,
        variant: "destructive",
      });
      return;
    }
    
    // Add the item
    const updatedItems = [...(round.items || []), item];
    onUpdate({ ...round, items: updatedItems });
    
    toast({
      title: "Item Added",
      description: `${item.name} has been added to your build.`,
    });
  };

  const addPower = () => {
    if (!selectedPowerId) return;
    
    const powerId = parseInt(selectedPowerId);
    
    // Check if power is already selected
    if (selectedPowerIds.includes(powerId)) {
      toast({
        title: "Power Already Selected",
        description: "This power is already part of your build for this round.",
        variant: "destructive",
      });
      return;
    }
    
    // Check powers limit based on round number
    if ((round.powers?.length || 0) >= MAX_POWERS) {
      toast({
        title: "Power Limit Reached",
        description: `You can only select up to ${MAX_POWERS} powers in round ${round.roundNumber}.`,
        variant: "destructive",
      });
      return;
    }
    
    // Add the power
    const selectedPower = allPowers.find(power => power.id === powerId);
    if (!selectedPower) return;
    
    const updatedPowers = [...(round.powers || []), selectedPower];
    onUpdate({ ...round, powers: updatedPowers });
    setSelectedPowerId("");
    
    toast({
      title: "Power Added",
      description: `${selectedPower.name} has been added to your build.`,
    });
  };

  const removeItem = (itemId: number) => {
    const updatedItems = round.items?.filter(item => item.id !== itemId) || [];
    onUpdate({ ...round, items: updatedItems });
    
    toast({
      title: "Item Removed",
      description: "Item has been removed from your build.",
    });
  };

  const removePower = (powerId: number) => {
    const updatedPowers = round.powers?.filter(power => power.id !== powerId) || [];
    onUpdate({ ...round, powers: updatedPowers });
    
    toast({
      title: "Power Removed",
      description: "Power has been removed from your build.",
    });
  };

  // Get items by category
  const getItemsByCategory = (category: ItemCategory) => {
    return allItems
      .filter(item => {
        const categoryMatch = item.category === category;
        const heroMatch = !item.heroId || item.heroId === selectedHeroId;
        return categoryMatch && heroMatch;
      })
      .sort((a, b) => {
        // Sort by rarity: common -> rare -> epic
        const rarityOrder: Record<string, number> = {
          common: 1,
          rare: 2,
          epic: 3
        };
        return rarityOrder[a.rarity.toLowerCase()] - rarityOrder[b.rarity.toLowerCase()];
      });
  };

  // Get items for each category
  const weaponItems = getItemsByCategory("Weapon");
  const abilityItems = getItemsByCategory("Ability");
  const survivalItems = getItemsByCategory("Survival");

  // Get rarity color
  const getRarityColor = (rarity: string): string => {
    switch (rarity.toLowerCase()) {
      case 'common':
        return 'bg-gray-100 text-gray-700';
      case 'rare':
        return 'bg-blue-100 text-blue-700';
      case 'epic':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor={`round-${round.roundNumber}-explanation`}>
                Round {round.roundNumber} Explanation
              </Label>
              <Textarea
                id={`round-${round.roundNumber}-explanation`}
                placeholder="Explain your strategy for this round..."
                value={explanation}
                onChange={handleExplanationChange}
                onBlur={handleBlur}
                className="min-h-[100px] mt-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold mb-4">Items ({(round.items?.length || 0)}/{MAX_TOTAL_ITEMS})</h4>
            
            <div className="space-y-4">
              <Tabs defaultValue="Weapon" className="w-full">
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger value="Weapon">Weapons</TabsTrigger>
                  <TabsTrigger value="Ability">Abilities</TabsTrigger>
                  <TabsTrigger value="Survival">Survival</TabsTrigger>
                </TabsList>

                <TabsContent value="Weapon" className="space-y-4">
                  <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto p-1">
                    {weaponItems.map(item => (
                      <div 
                        key={item.id} 
                        onClick={() => addItem(item)}
                        className={`flex flex-col border rounded-md p-2 cursor-pointer transition-all hover:border-primary ${
                          selectedItemIds.includes(item.id) ? 'border-primary bg-primary/10' : 'border-border'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <h5 className="font-medium">{item.name}</h5>
                          <Badge className={`${getRarityColor(item.rarity)} ml-1`}>
                            {item.rarity}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                        <div className="flex items-center justify-between mt-2">
                          <Badge variant="outline">{item.cost} cash</Badge>
                          {item.heroId && (
                            <Badge variant="secondary" className="text-xs">
                              {item.heroName || "Hero specific"}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                    {weaponItems.length === 0 && (
                      <p className="text-sm text-muted-foreground italic">No weapon items available</p>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="Ability" className="space-y-4">
                  <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto p-1">
                    {abilityItems.map(item => (
                      <div 
                        key={item.id} 
                        onClick={() => addItem(item)}
                        className={`flex flex-col border rounded-md p-2 cursor-pointer transition-all hover:border-primary ${
                          selectedItemIds.includes(item.id) ? 'border-primary bg-primary/10' : 'border-border'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <h5 className="font-medium">{item.name}</h5>
                          <Badge className={`${getRarityColor(item.rarity)} ml-1`}>
                            {item.rarity}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                        <div className="flex items-center justify-between mt-2">
                          <Badge variant="outline">{item.cost} cash</Badge>
                          {item.heroId && (
                            <Badge variant="secondary" className="text-xs">
                              {item.heroName || "Hero specific"}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                    {abilityItems.length === 0 && (
                      <p className="text-sm text-muted-foreground italic">No ability items available</p>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="Survival" className="space-y-4">
                  <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto p-1">
                    {survivalItems.map(item => (
                      <div 
                        key={item.id} 
                        onClick={() => addItem(item)}
                        className={`flex flex-col border rounded-md p-2 cursor-pointer transition-all hover:border-primary ${
                          selectedItemIds.includes(item.id) ? 'border-primary bg-primary/10' : 'border-border'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <h5 className="font-medium">{item.name}</h5>
                          <Badge className={`${getRarityColor(item.rarity)} ml-1`}>
                            {item.rarity}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                        <div className="flex items-center justify-between mt-2">
                          <Badge variant="outline">{item.cost} cash</Badge>
                          {item.heroId && (
                            <Badge variant="secondary" className="text-xs">
                              {item.heroName || "Hero specific"}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                    {survivalItems.length === 0 && (
                      <p className="text-sm text-muted-foreground italic">No survival items available</p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              <div className="space-y-2">
                <Label>Selected Items</Label>
                {round.items && round.items.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {round.items.map(item => (
                      <div 
                        key={item.id} 
                        className="flex justify-between items-center bg-secondary/10 rounded-md p-2"
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-1">
                            <h5 className="font-medium text-sm">{item.name}</h5>
                            <Badge variant="outline" className="ml-1 text-xs">
                              {item.category}
                            </Badge>
                            {item.heroId && (
                              <Badge variant="secondary" className="ml-1 text-xs">
                                {item.heroName || "Hero specific"}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6" 
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No items selected</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold mb-4">Powers ({(round.powers?.length || 0)}/{MAX_POWERS})</h4>
            
            <div className="space-y-4">
              <div className="flex gap-2">
                <Select 
                  value={selectedPowerId}
                  onValueChange={setSelectedPowerId}
                  disabled={(round.powers?.length || 0) >= MAX_POWERS}
                >
                  <SelectTrigger id="power-select" className="flex-1">
                    <SelectValue placeholder="Select power" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredPowers.map(power => (
                      <SelectItem 
                        key={power.id} 
                        value={power.id.toString()}
                        disabled={selectedPowerIds.includes(power.id)}
                      >
                        {power.name}
                        {power.heroId && ` (${power.heroName || "Hero specific"})`}
                      </SelectItem>
                    ))}
                    {filteredPowers.length === 0 && (
                      <SelectItem value="none" disabled>
                        No powers available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                
                <Button 
                  onClick={addPower} 
                  disabled={!selectedPowerId || (round.powers?.length || 0) >= MAX_POWERS}
                  className="shrink-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Selected Powers</Label>
                {round.powers && round.powers.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2">
                    {round.powers.map(power => (
                      <div 
                        key={power.id} 
                        className="flex justify-between items-center bg-secondary/10 rounded-md p-2"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <h5 className="font-medium text-sm">{power.name}</h5>
                            {power.heroId && (
                              <Badge variant="secondary" className="ml-1 text-xs">
                                {power.heroName || "Hero specific"}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{power.description}</p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6" 
                          onClick={() => removePower(power.id)}
                        >
                          <Trash className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No powers selected</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RoundEditor;
