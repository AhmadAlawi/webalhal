import { UserRole } from "@/types";

export function canCreateAuction(roleId?: UserRole): boolean {
  return roleId === UserRole.Farmer || roleId === UserRole.Government;
}

export function canJoinAuction(roleId?: UserRole): boolean {
  return roleId === UserRole.Trader || roleId === UserRole.Government;
}

export function canCreateTender(roleId?: UserRole): boolean {
  return roleId === UserRole.Trader || roleId === UserRole.Government;
}

export function canJoinTender(roleId?: UserRole): boolean {
  return roleId === UserRole.Farmer || roleId === UserRole.Government;
}

export function canCreateDirectListing(roleId?: UserRole): boolean {
  return roleId !== UserRole.Trader && roleId !== UserRole.Transport;
}

export function showFab(roleId?: UserRole): boolean {
  return roleId !== UserRole.Transport;
}

export function showTransportTab(roleId?: UserRole): boolean {
  return roleId === UserRole.Transport;
}

export function roleLabel(roleId?: UserRole): string {
  switch (roleId) {
    case UserRole.Farmer:
      return "مزارع";
    case UserRole.Trader:
      return "تاجر";
    case UserRole.Transport:
      return "ناقل";
    case UserRole.Government:
      return "حكومي";
    default:
      return "زائر";
  }
}
