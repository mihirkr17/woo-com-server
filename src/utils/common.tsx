module.exports.calculateShippingCost = (volWeight: number, areaType: string = "") => {
   let charge: any;

   volWeight = Math.ceil(volWeight);

   if (volWeight <= 1) {
      charge = areaType === "local" ? 10 : areaType === "zonal" ? 15 : 15;
   } else if (volWeight > 1 && volWeight <= 5) {
      charge = areaType === "local" ? 20 : areaType === "zonal" ? 25 : 25;
   } else if (volWeight > 5 && volWeight <= 10) {
      charge = areaType === "local" ? 30 : areaType === "zonal" ? 40 : 40;
   } else if (volWeight > 10) {
      charge = areaType === "local" ? 50 : areaType === "zonal" ? 60 : 60;
   }

   return charge;
}