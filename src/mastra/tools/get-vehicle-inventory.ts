/**
 * @fileoverview Tool for getting vehicle inventory information
 * @module mastra/tools/get-vehicle-inventory
 */

import { createTool } from "@mastra/core/tools";
import { z } from "zod";

/**
 * Schema for vehicle inventory parameters
 */
const getVehicleInventorySchema = z.object({
  dealershipName: z.string().describe("Name of the dealership to check inventory for"),
  vehicleType: z.string().optional().describe("Type of vehicle (SUV, sedan, truck, etc.)"),
  brand: z.string().optional().describe("Vehicle brand (Honda, Toyota, Ford, etc.)"),
  maxPrice: z.number().optional().describe("Maximum price range"),
  minYear: z.number().optional().describe("Minimum vehicle year"),
  condition: z.enum(["new", "used", "certified", "any"]).default("any").describe("Vehicle condition preference"),
});

/**
 * Tool for checking vehicle inventory at dealerships
 * 
 * This tool provides mock inventory data since we don't have direct
 * API access to dealership inventory systems. In production, this would
 * integrate with actual inventory APIs.
 */
export const getVehicleInventory = createTool({
  id: "get-vehicle-inventory",
  description: "Check available vehicle inventory at a specific dealership",
  inputSchema: getVehicleInventorySchema,
  
  execute: async (context) => {
    const { dealershipName, vehicleType, brand, maxPrice, minYear, condition } = context.context;
    try {
      // Mock inventory data - in production this would call real APIs
      const mockInventory = [
        {
          make: "Honda",
          model: "Civic",
          year: 2024,
          type: "Sedan",
          condition: "new",
          price: 25000,
          mileage: 0,
          color: "Silver",
          features: ["Automatic", "Apple CarPlay", "Safety Sensing"],
          vin: "1HGBH41JXMN109186",
          stock: "H24001",
        },
        {
          make: "Honda",
          model: "CR-V",
          year: 2023,
          type: "SUV",
          condition: "certified",
          price: 28500,
          mileage: 15000,
          color: "Blue",
          features: ["AWD", "Heated Seats", "Navigation"],
          vin: "7FARW2H5XJE123456",
          stock: "H23015",
        },
        {
          make: "Toyota",
          model: "Camry",
          year: 2024,
          type: "Sedan",
          condition: "new",
          price: 27000,
          mileage: 0,
          color: "White",
          features: ["Hybrid", "Lane Assist", "Wireless Charging"],
          vin: "4T1G11AK8PU123789",
          stock: "T24003",
        },
        {
          make: "Ford",
          model: "F-150",
          year: 2022,
          type: "Truck",
          condition: "used",
          price: 32000,
          mileage: 25000,
          color: "Black",
          features: ["4WD", "Crew Cab", "Towing Package"],
          vin: "1FTFW1ET5NFA12345",
          stock: "F22010",
        },
      ];
      
      // Apply filters
      let filteredInventory = mockInventory;
      
      if (brand) {
        filteredInventory = filteredInventory.filter(vehicle => 
          vehicle.make.toLowerCase() === brand.toLowerCase()
        );
      }
      
      if (vehicleType) {
        filteredInventory = filteredInventory.filter(vehicle => 
          vehicle.type.toLowerCase() === vehicleType.toLowerCase()
        );
      }
      
      if (maxPrice) {
        filteredInventory = filteredInventory.filter(vehicle => 
          vehicle.price <= maxPrice
        );
      }
      
      if (minYear) {
        filteredInventory = filteredInventory.filter(vehicle => 
          vehicle.year >= minYear
        );
      }
      
      if (condition !== "any") {
        filteredInventory = filteredInventory.filter(vehicle => 
          vehicle.condition === condition
        );
      }
      
      // Generate inventory summary
      const summary = {
        totalVehicles: filteredInventory.length,
        priceRange: filteredInventory.length > 0 ? {
          min: Math.min(...filteredInventory.map(v => v.price)),
          max: Math.max(...filteredInventory.map(v => v.price)),
          average: Math.round(filteredInventory.reduce((sum, v) => sum + v.price, 0) / filteredInventory.length),
        } : null,
        brandBreakdown: filteredInventory.reduce((acc, vehicle) => {
          acc[vehicle.make] = (acc[vehicle.make] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        conditionBreakdown: filteredInventory.reduce((acc, vehicle) => {
          acc[vehicle.condition] = (acc[vehicle.condition] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      };
      
      return {
        success: true,
        dealership: dealershipName,
        searchCriteria: { vehicleType, brand, maxPrice, minYear, condition },
        summary,
        vehicles: filteredInventory,
        message: filteredInventory.length > 0 
          ? `Found ${filteredInventory.length} vehicles matching your criteria at ${dealershipName}`
          : `No vehicles found matching your criteria at ${dealershipName}. Try adjusting your search parameters.`,
      };
      
    } catch (error) {
      console.error('Inventory check error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown inventory error',
        dealership: dealershipName,
        vehicles: [],
      };
    }
  },
});