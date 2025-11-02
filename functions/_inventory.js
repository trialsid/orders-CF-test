export const INVENTORY = [
  {
    id: "sona-masoori-rice",
    name: "Sona Masoori Rice",
    description: "Polished medium-grain rice sourced from Warangal mills.",
    unit: "10 kg",
    price: 640,
    category: "Rice & Staples"
  },
  {
    id: "idly-dosa-batter",
    name: "Idly & Dosa Batter",
    description: "Stone-ground batter delivered fresh every morning.",
    unit: "1 kg",
    price: 80,
    category: "Breakfast & Dairy"
  },
  {
    id: "toor-dal",
    name: "Toor Dal",
    description: "Premium kandi pappu for daily sambar and pappu.",
    unit: "1 kg",
    price: 165,
    category: "Pulses & Lentils"
  },
  {
    id: "moong-dal",
    name: "Yellow Moong Dal",
    description: "Split pesara pappu ideal for pesarattu and dal fry.",
    unit: "500 g",
    price: 95,
    category: "Pulses & Lentils"
  },
  {
    id: "red-chilli-powder",
    name: "Guntur Red Chilli Powder",
    description: "Sun-dried teja mirchi, stone blended for fiery flavor.",
    unit: "250 g",
    price: 120,
    category: "Spices & Masalas"
  },
  {
    id: "kandi-podi",
    name: "Homemade Kandi Podi",
    description: "Telangana-style podi with roasted dal and garlic.",
    unit: "200 g",
    price: 85,
    category: "Spices & Masalas"
  },
  {
    id: "groundnut-oil",
    name: "Cold-Pressed Groundnut Oil",
    description: "Locally extracted oil ideal for deep frying and curries.",
    unit: "1 L",
    price: 220,
    category: "Oils & Ghee"
  },
  {
    id: "buffalo-milk",
    name: "Buffalo Milk (A2)",
    description: "Morning collection from village dairy cooperative.",
    unit: "1 L",
    price: 58,
    category: "Breakfast & Dairy"
  },
  {
    id: "gongura",
    name: "Fresh Gongura Leaves",
    description: "Tart gongura plucked at dawn for pachadi or dal.",
    unit: "1 bunch",
    price: 22,
    category: "Fresh Produce"
  },
  {
    id: "drumstick",
    name: "Drumstick",
    description: "Tender munaga kaya ideal for sambar and curries.",
    unit: "4 pieces",
    price: 30,
    category: "Fresh Produce"
  },
  {
    id: "nethi-khaja",
    name: "Nethi Khaja",
    description: "Buttery khaja from local sweet shop, perfect for evenings.",
    unit: "250 g",
    price: 110,
    category: "Snacks & Sweets"
  },
  {
    id: "ragi-janthikalu",
    name: "Ragi Janthikalu",
    description: "Crispy millet murukku made with cold-pressed oil.",
    unit: "200 g",
    price: 70,
    category: "Snacks & Sweets"
  },
  {
    id: "bath-soap",
    name: "Herbal Bath Soap",
    description: "Neem and turmeric bar gentle on sensitive skin.",
    unit: "3 x 100 g",
    price: 95,
    category: "Home & Personal"
  },
  {
    id: "washing-powder",
    name: "Ujala Washing Powder",
    description: "Budget-friendly detergent formulated for borewell water.",
    unit: "1 kg",
    price: 82,
    category: "Home & Personal"
  }
];

export const INVENTORY_MAP = new Map(INVENTORY.map((item) => [item.id, item]));
