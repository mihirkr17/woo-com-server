export interface IShippingAddress {
  id: string;
  name: string;
  division: string;
  city: string;
  area: string;
  areaType: string;
  landmark: string;
  phoneNumber: string;
  postalCode: string;
  active?: boolean;
}


export interface IBuyerProfileUpdate {
   fullName: string;
   dob: string;
   gender: string;
}