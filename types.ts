export type Step = 
  | 'P1_ROOMS'
  | 'P1_NEEDS'
  | 'P1_UNIT_TYPE'
  | 'P1_SURFACE'
  | 'P1_PRODUCT'
  | 'P2_LOCATION'
  | 'P2_GENERATOR'
  | 'P2_BOILER_TYPE' // Conditional
  | 'P2_FUEL_TYPE'
  | 'P2_KNOW_CONSUMPTION'
  | 'P2_CONSUMPTION_AMOUNT'
  | 'P2_ENERGY_COST'
  | 'FINAL_FORM';

export type ProductType = 'wall' | 'console' | 'ducted' | 'air-water';

export interface Product {
  id: string;
  name: string;
  series: string; // Brand
  image: string;
  type: ProductType;
  priceStart: number;
  energyLabel: string;
  stars: number;
  features: string[];
  minSurface: number;
  maxSurface: number;
  dimensions?: string;
}

export interface FormData {
  // Phase 1
  rooms: '1' | 'multiple' | null;
  need: 'heating' | 'cooling' | 'both' | null;
  unitType: 'wall' | 'console' | 'ducted' | 'air-water' | null;
  surfaceRoom: number;
  surfaceHouse: number;
  selectedProduct: Product | null;

  // Phase 2
  zipCode: string;
  generatorType: 'boiler' | 'electric' | 'other' | null;
  boilerType: 'condensing' | 'non-condensing' | 'unknown' | null;
  fuelType: 'gas' | 'oil' | 'pellet' | 'other' | null;
  knowsConsumption: boolean | null;
  consumptionAmount: string;
  consumptionUnit: 'm3' | 'kWh' | 'liters' | 'euros';
  energyCost: string; // stored as string input

  // Final
  contact: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    message: string;
  };
}