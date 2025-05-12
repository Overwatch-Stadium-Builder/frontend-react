import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Tab } from "@headlessui/react";
import { Item, Power, ItemCategory, ItemRarity, Hero } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, X, Pencil, Plus, Trash } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import ItemService from "@/services/ItemService";
import PowerService from "@/services/PowerService";
import { useAuth } from "@/contexts/AuthContext";

const AdminItemPowers = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [items, setItems] = useState<Item[]>([]);
  const [powers, setPowers] = useState<Power[]>([]);
  const [heroes, setHeroes] = useState<Hero[]>([]);
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [editPower, setEditPower] = useState<Power | null>(null);
  const [newItem, setNewItem] = useState<Partial<Item>>({ 
    name: "", 
    category: "Weapon", 
    description: "", 
    cost: 0, 
    rarity: "common",
    heroId: null 
  });
  const [newPower, setNewPower] = useState<Partial<Power>>({ 
    name: "", 
    description: "",
    heroId: null
  });
  const [loading, setLoading] = useState(true);
  const { isAdmin, token } = useAuth();
  const itemService = new ItemService();
  const powerService = new PowerService();

  const [itemFilters, setItemFilters] = useState({ heroId: "all", category: "all" });
  const [powerFilters, setPowerFilters] = useState({ heroId: "all" });

  useEffect(() => {
    if (!isAdmin) {
      toast({
        title: "Access Denied",
        description: "You must be logged in as an admin to view this page.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    const loadData = async () => {
      try {
        // Load heroes first
        const heroesResponse = await fetch("https://owapi.luciousdev.nl/api/heroes");
        if (!heroesResponse.ok) {
          throw new Error("Failed to fetch heroes");
        }
        const heroesData = await heroesResponse.json();
        setHeroes(heroesData);
        
        // After items n powers
        const [itemsData, powersData] = await Promise.all([
          itemService.getAllItems(),
          powerService.getAllPowers()
        ]);
        
        setItems(itemsData);
        setPowers(powersData);
        setLoading(false);
      } catch (error) {
        console.error("Error loading data:", error);
        toast({
          title: "Error",
          description: "Failed to load items and powers. Please try again.",
          variant: "destructive",
        });
      }
    };

    loadData();
  }, [navigate, toast]);

  const handleAddItem = async () => {
    if (!newItem.name || !newItem.description || newItem.cost === undefined) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const itemToAdd = {
        name: newItem.name,
        category: newItem.category as ItemCategory,
        description: newItem.description,
        rarity: newItem.rarity || "common",
        cost: Number(newItem.cost),
        heroId: newItem.heroId || null
      };

      const id = await itemService.addItem(itemToAdd);
      
      // Only if hero was selected
      let heroName;
      if (newItem.heroId) {
        const hero = heroes.find(h => h.id === newItem.heroId);
        heroName = hero?.name;
      }
      
      const addedItem = {
        ...itemToAdd,
        id,
        heroName
      } as Item;
      
      setItems([...items, addedItem]);
      setNewItem({ name: "", category: "Weapon", description: "", cost: 0, rarity: "common", heroId: null });
      
      toast({
        title: "Item Added",
        description: `${addedItem.name} has been added successfully.`,
      });
    } catch (error) {
      console.error("Error adding item:", error);
      toast({
        title: "Error",
        description: "Failed to add item. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddPower = async () => {
    if (!newPower.name || !newPower.description) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const powerToAdd = {
        name: newPower.name,
        description: newPower.description,
        heroId: newPower.heroId || null
      };

      const id = await powerService.addPower(powerToAdd);
      
      // Only if hero was selected
      let heroName;
      if (newPower.heroId) {
        const hero = heroes.find(h => h.id === newPower.heroId);
        heroName = hero?.name;
      }
      
      const addedPower = {
        ...powerToAdd,
        id,
        heroName
      } as Power;
      
      setPowers([...powers, addedPower]);
      setNewPower({ name: "", description: "", heroId: null });
      
      toast({
        title: "Power Added",
        description: `${addedPower.name} has been added successfully.`,
      });
    } catch (error) {
      console.error("Error adding power:", error);
      toast({
        title: "Error",
        description: "Failed to add power. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateItem = async () => {
    if (!editItem) return;
    
    try {
      await itemService.updateItem(editItem);
      
      setItems(items.map(item => 
        item.id === editItem.id ? editItem : item
      ));
      setEditItem(null);
      
      toast({
        title: "Item Updated",
        description: `${editItem.name} has been updated successfully.`,
      });
    } catch (error) {
      console.error("Error updating item:", error);
      toast({
        title: "Error",
        description: "Failed to update item. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdatePower = async () => {
    if (!editPower) return;
    
    try {
      await powerService.updatePower(editPower);
      
      setPowers(powers.map(power => 
        power.id === editPower.id ? editPower : power
      ));
      setEditPower(null);
      
      toast({
        title: "Power Updated",
        description: `${editPower.name} has been updated successfully.`,
      });
    } catch (error) {
      console.error("Error updating power:", error);
      toast({
        title: "Error",
        description: "Failed to update power. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteItem = async (id: number) => {
    try {
      await itemService.deleteItem(id);
      
      setItems(items.filter(item => item.id !== id));
      
      toast({
        title: "Item Deleted",
        description: "Item has been deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting item:", error);
      toast({
        title: "Error",
        description: "Failed to delete item. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeletePower = async (id: number) => {
    try {
      await powerService.deletePower(id);
      
      setPowers(powers.filter(power => power.id !== id));
      
      toast({
        title: "Power Deleted",
        description: "Power has been deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting power:", error);
      toast({
        title: "Error",
        description: "Failed to delete power. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getHeroNameById = (heroId: number | null | undefined) => {
    if (!heroId) return null;
    const hero = heroes.find(h => h.id === heroId);
    return hero?.name || null;
  };

  const filteredItems = items.filter((item) => {
    const matchesHero = itemFilters.heroId === "all" || item.heroId?.toString() === itemFilters.heroId;
    const matchesCategory = itemFilters.category === "all" || item.category === itemFilters.category;
    return matchesHero && matchesCategory;
  });

  const filteredPowers = powers.filter((power) => {
    return powerFilters.heroId === "all" || power.heroId?.toString() === powerFilters.heroId;
  });

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Manage Items & Powers</h1>
          <p className="text-muted-foreground">Add, edit, and delete items and powers</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/admin")}>
            Back to Admin
          </Button>
          <Button variant="outline" onClick={() => navigate("/admin/builds")}>
            Manage Builds
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-lg shadow overflow-hidden">
        <Tab.Group>
          <Tab.List className="flex bg-muted">
            <Tab
              className={({ selected }) =>
                `flex-1 py-4 text-center font-medium transition-colors ${
                  selected
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`
              }
            >
              Items
            </Tab>
            <Tab
              className={({ selected }) =>
                `flex-1 py-4 text-center font-medium transition-colors ${
                  selected
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`
              }
            >
              Powers
            </Tab>
          </Tab.List>
          <Tab.Panels className="p-6">
            <Tab.Panel>
              {loading ? (
                <div className="animate-pulse text-center py-8">Loading items...</div>
              ) : (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Add New Item</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="item-name">Item Name</Label>
                          <Input
                            id="item-name"
                            value={newItem.name}
                            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                            placeholder="Enter item name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="item-category">Category</Label>
                          <Select
                            value={newItem.category}
                            onValueChange={(value) => setNewItem({ ...newItem, category: value as ItemCategory })}
                          >
                            <SelectTrigger id="item-category">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Weapon">Weapon</SelectItem>
                              <SelectItem value="Ability">Ability</SelectItem>
                              <SelectItem value="Survival">Survival</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="item-cost">Cost</Label>
                          <Input
                            id="item-cost"
                            type="number"
                            min="0"
                            value={newItem.cost}
                            onChange={(e) => setNewItem({ ...newItem, cost: parseInt(e.target.value) || 0 })}
                            placeholder="Enter item cost"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="item-rarity">Rarity</Label>
                          <Select
                            value={newItem.rarity}
                            onValueChange={(value) => setNewItem({ ...newItem, rarity: value as ItemRarity })}
                          >
                            <SelectTrigger id="item-rarity">
                              <SelectValue placeholder="Select item rarity" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="common">Common</SelectItem>
                              <SelectItem value="rare">Rare</SelectItem>
                              <SelectItem value="epic">Epic</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="item-hero">Hero (Optional)</Label>
                          <Select
                            value={newItem.heroId?.toString() || "null"}
                            onValueChange={(value) => setNewItem({ 
                              ...newItem, 
                              heroId: value === "null" ? null : parseInt(value) 
                            })}
                          >
                            <SelectTrigger id="item-hero">
                              <SelectValue placeholder="All heroes (general)" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="null">All heroes (general)</SelectItem>
                              {heroes.map((hero) => (
                                <SelectItem key={hero.id} value={hero.id.toString()}>
                                  {hero.name} ({hero.role})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="item-description">Description</Label>
                          <Textarea
                            id="item-description"
                            value={newItem.description}
                            onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                            placeholder="Enter item description"
                            rows={3}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Button onClick={handleAddItem}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Item
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold">Existing Items</h3>
                    <div className="flex flex-wrap gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="filter-item-hero">Filter by Hero</Label>
                      <Select
                        value={itemFilters.heroId}
                        onValueChange={(value) => setItemFilters({ ...itemFilters, heroId: value })}
                      >
                        <SelectTrigger id="filter-item-hero">
                          <SelectValue placeholder="All heroes" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All heroes</SelectItem>
                          {heroes.map((hero) => (
                            <SelectItem key={hero.id} value={hero.id.toString()}>
                              {hero.name} ({hero.role})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="filter-item-category">Filter by Category</Label>
                      <Select
                        value={itemFilters.category}
                        onValueChange={(value) => setItemFilters({ ...itemFilters, category: value })}
                      >
                        <SelectTrigger id="filter-item-category">
                          <SelectValue placeholder="All categories" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All categories</SelectItem>
                          <SelectItem value="Weapon">Weapon</SelectItem>
                          <SelectItem value="Ability">Ability</SelectItem>
                          <SelectItem value="Survival">Survival</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Total Items</Label>
                      <p className="text-sm">{filteredItems.length}</p>
                    </div>
                  </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {filteredItems.map((item) => (
                        <Card key={item.id}>
                          <CardContent className="p-4">
                            {editItem && editItem.id === item.id ? (
                              <div className="space-y-3">
                                <div className="space-y-1">
                                  <Label htmlFor={`edit-item-name-${item.id}`}>Name</Label>
                                  <Input
                                    id={`edit-item-name-${item.id}`}
                                    value={editItem.name}
                                    onChange={(e) => setEditItem({ ...editItem, name: e.target.value })}
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label htmlFor={`edit-item-category-${item.id}`}>Category</Label>
                                  <Select
                                    value={editItem.category}
                                    onValueChange={(value) => setEditItem({ ...editItem, category: value as ItemCategory })}
                                  >
                                    <SelectTrigger id={`edit-item-category-${item.id}`}>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Weapon">Weapon</SelectItem>
                                      <SelectItem value="Ability">Ability</SelectItem>
                                      <SelectItem value="Survival">Survival</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-1">
                                  <Label htmlFor={`edit-item-rarity-${item.id}`}>Rarity</Label>
                                  <Select
                                    value={editItem.rarity}
                                    onValueChange={(value) => setEditItem({ ...editItem, rarity: value as ItemRarity })}
                                  >
                                    <SelectTrigger id={`edit-item-rarity-${item.id}`}>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="common">Common</SelectItem>
                                      <SelectItem value="rare">Rare</SelectItem>
                                      <SelectItem value="epic">Epic</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-1">
                                  <Label htmlFor={`edit-item-cost-${item.id}`}>Cost</Label>
                                  <Input
                                    id={`edit-item-cost-${item.id}`}
                                    type="number"
                                    min="0"
                                    value={editItem.cost}
                                    onChange={(e) => setEditItem({ ...editItem, cost: parseInt(e.target.value) || 0 })}
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label htmlFor={`edit-item-hero-${item.id}`}>Hero</Label>
                                  <Select
                                    value={editItem.heroId?.toString() || "null"}
                                    onValueChange={(value) => {
                                      const heroId = value === "null" ? null : parseInt(value);
                                      const heroName = getHeroNameById(heroId);
                                      setEditItem({ 
                                        ...editItem, 
                                        heroId,
                                        heroName: heroName || undefined
                                      });
                                    }}
                                  >
                                    <SelectTrigger id={`edit-item-hero-${item.id}`}>
                                      <SelectValue placeholder="All heroes (general)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="null">All heroes (general)</SelectItem>
                                      {heroes.map((hero) => (
                                        <SelectItem key={hero.id} value={hero.id.toString()}>
                                          {hero.name} ({hero.role})
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-1">
                                  <Label htmlFor={`edit-item-description-${item.id}`}>Description</Label>
                                  <Textarea
                                    id={`edit-item-description-${item.id}`}
                                    value={editItem.description}
                                    onChange={(e) => setEditItem({ ...editItem, description: e.target.value })}
                                    rows={3}
                                  />
                                </div>
                                <div className="flex justify-end gap-2 mt-3">
                                  <Button variant="ghost" size="sm" onClick={() => setEditItem(null)}>
                                    <X className="h-4 w-4 mr-1" />
                                    Cancel
                                  </Button>
                                  <Button size="sm" onClick={handleUpdateItem}>
                                    <Check className="h-4 w-4 mr-1" />
                                    Save
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <div>
                                    <h4 className="font-semibold">{item.name}</h4>
                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                      <span className="text-xs bg-secondary/20 px-2 py-1 rounded-full">
                                        {item.category}
                                      </span>
                                      <span className="text-xs bg-amber-500/20 text-amber-700 px-2 py-1 rounded-full">
                                        Cost: {item.cost}
                                      </span>
                                      {item.heroId && (
                                        <span className="text-xs bg-blue-500/20 text-blue-700 px-2 py-1 rounded-full">
                                          {item.heroName || getHeroNameById(item.heroId)}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" onClick={() => setEditItem(item)}>
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(item.id)}>
                                      <Trash className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                                <p className="text-sm text-muted-foreground">{item.description}</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </Tab.Panel>
            <Tab.Panel>
              {loading ? (
                <div className="animate-pulse text-center py-8">Loading powers...</div>
              ) : (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Add New Power</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="power-name">Power Name</Label>
                          <Input
                            id="power-name"
                            value={newPower.name}
                            onChange={(e) => setNewPower({ ...newPower, name: e.target.value })}
                            placeholder="Enter power name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="power-hero">Hero (Optional)</Label>
                          <Select
                            value={newPower.heroId?.toString() || "null"}
                            onValueChange={(value) => setNewPower({ 
                              ...newPower, 
                              heroId: value === "null" ? null : parseInt(value) 
                            })}
                          >
                            <SelectTrigger id="power-hero">
                              <SelectValue placeholder="All heroes (general)" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="null">All heroes (general)</SelectItem>
                              {heroes.map((hero) => (
                                <SelectItem key={hero.id} value={hero.id.toString()}>
                                  {hero.name} ({hero.role})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="power-description">Description</Label>
                          <Textarea
                            id="power-description"
                            value={newPower.description}
                            onChange={(e) => setNewPower({ ...newPower, description: e.target.value })}
                            placeholder="Enter power description"
                            rows={3}
                          />
                        </div>
                        <div>
                          <Button onClick={handleAddPower}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Power
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold">Existing Powers</h3>
                    <div className="space-y-2">
                    <Label htmlFor="filter-power-hero">Filter by Hero</Label>
                    <Select
                      value={powerFilters.heroId}
                      onValueChange={(value) => setPowerFilters({ ...powerFilters, heroId: value })}
                    >
                      <SelectTrigger id="filter-power-hero">
                        <SelectValue placeholder="All heroes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All heroes</SelectItem>
                        {heroes.map((hero) => (
                          <SelectItem key={hero.id} value={hero.id.toString()}>
                            {hero.name} ({hero.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Total Powers</Label>
                    <p className="text-sm">{filteredPowers.length}</p>
                  </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {filteredPowers.map((power) => (
                        <Card key={power.id}>
                          <CardContent className="p-4">
                            {editPower && editPower.id === power.id ? (
                              <div className="space-y-3">
                                <div className="space-y-1">
                                  <Label htmlFor={`edit-power-name-${power.id}`}>Name</Label>
                                  <Input
                                    id={`edit-power-name-${power.id}`}
                                    value={editPower.name}
                                    onChange={(e) => setEditPower({ ...editPower, name: e.target.value })}
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label htmlFor={`edit-power-hero-${power.id}`}>Hero</Label>
                                  <Select
                                    value={editPower.heroId?.toString() || "null"}
                                    onValueChange={(value) => {
                                      const heroId = value === "null" ? null : parseInt(value);
                                      const heroName = getHeroNameById(heroId);
                                      setEditPower({ 
                                        ...editPower, 
                                        heroId,
                                        heroName: heroName || undefined
                                      });
                                    }}
                                  >
                                    <SelectTrigger id={`edit-power-hero-${power.id}`}>
                                      <SelectValue placeholder="All heroes (general)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="null">All heroes (general)</SelectItem>
                                      {heroes.map((hero) => (
                                        <SelectItem key={hero.id} value={hero.id.toString()}>
                                          {hero.name} ({hero.role})
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-1">
                                  <Label htmlFor={`edit-power-description-${power.id}`}>Description</Label>
                                  <Textarea
                                    id={`edit-power-description-${power.id}`}
                                    value={editPower.description}
                                    onChange={(e) => setEditPower({ ...editPower, description: e.target.value })}
                                    rows={3}
                                  />
                                </div>
                                <div className="flex justify-end gap-2 mt-3">
                                  <Button variant="ghost" size="sm" onClick={() => setEditPower(null)}>
                                    <X className="h-4 w-4 mr-1" />
                                    Cancel
                                  </Button>
                                  <Button size="sm" onClick={handleUpdatePower}>
                                    <Check className="h-4 w-4 mr-1" />
                                    Save
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <div>
                                    <h4 className="font-semibold">{power.name}</h4>
                                    {power.heroId && (
                                      <span className="text-xs bg-blue-500/20 text-blue-700 px-2 py-1 rounded-full mt-1 inline-block">
                                        {power.heroName || getHeroNameById(power.heroId)}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" onClick={() => setEditPower(power)}>
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDeletePower(power.id)}>
                                      <Trash className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                                <p className="text-sm text-muted-foreground">{power.description}</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
};

export default AdminItemPowers;
