export interface Governorate {
  governorateId: number;
  nameAr?: string;
  nameEn?: string;
  name?: string;
}

export interface Area {
  areaId: number;
  cityId: number;
  governorateId?: number;
  nameAr?: string;
  nameEn?: string;
  name?: string;
}

export interface LocationSelection {
  governorateId: number | "";
  cityId: number | "";
  areaId: number | "";
  governorateName?: string;
  cityName?: string;
  areaName?: string;
}
