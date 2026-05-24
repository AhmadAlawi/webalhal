export interface Farm {
  farmId: number;
  name?: string;
  nameAr?: string;
  governorateName?: string;
  cityName?: string;
  cityId?: number;
  governorateId?: number;
  areaId?: number;
  area?: string;
  location?: string;
  village?: string;
}

export interface Crop {
  cropId: number;
  farmId?: number;
  name?: string;
  nameAr?: string;
  cropName?: string;
  unit?: string;
  quantity?: number;
  categoryId?: number;
}

export interface Product {
  productId: number;
  name?: string;
  nameAr?: string;
  categoryId?: number;
  unit?: string;
}
