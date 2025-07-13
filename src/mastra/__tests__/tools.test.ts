/**
 * @fileoverview Tests for Karmatic custom tools
 * @module mastra/__tests__/tools
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { 
  searchDealerships, 
  analyzeDealership,
  getVehicleInventory,
  getMarketInsights,
  compareVehicles,
  saveUserPreference,
  getSearchHistory,
  generateRecommendations
} from '../tools';

// Mock fetch globally
global.fetch = jest.fn();

describe('Karmatic Custom Tools', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('searchDealerships', () => {
    test('should search for dealerships successfully', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          agencies: [
            {
              name: 'Honda San Jose',
              vicinity: '123 Main St, San Jose, CA',
              rating: 4.5,
              place_id: 'place123',
              types: ['car_dealer'],
              user_ratings_total: 200
            }
          ]
        })
      };

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await searchDealerships.execute({
        location: 'San Jose, CA',
        brand: 'Honda',
        radius: 25
      });

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(1);
      expect(result.results[0].name).toBe('Honda San Jose');
      expect(result.location).toBe('San Jose, CA');
    });

    test('should handle search failure', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await searchDealerships.execute({
        location: 'Invalid Location'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });

    test('should filter by minimum rating', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          agencies: [
            { name: 'Good Dealer', rating: 4.5 },
            { name: 'Bad Dealer', rating: 2.5 }
          ]
        })
      };

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await searchDealerships.execute({
        location: 'Test City',
        minRating: 4.0
      });

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(1);
      expect(result.results[0].name).toBe('Good Dealer');
    });
  });

  describe('getVehicleInventory', () => {
    test('should return filtered inventory', async () => {
      const result = await getVehicleInventory.execute({
        dealershipName: 'Honda San Jose',
        brand: 'Honda',
        vehicleType: 'Sedan',
        maxPrice: 30000
      });

      expect(result.success).toBe(true);
      expect(result.dealership).toBe('Honda San Jose');
      expect(result.vehicles.length).toBeGreaterThan(0);
      
      // Check that all vehicles match filters
      result.vehicles.forEach(vehicle => {
        expect(vehicle.make).toBe('Honda');
        expect(vehicle.type).toBe('Sedan');
        expect(vehicle.price).toBeLessThanOrEqual(30000);
      });
    });

    test('should return empty inventory when no matches', async () => {
      const result = await getVehicleInventory.execute({
        dealershipName: 'Test Dealer',
        brand: 'NonExistentBrand',
        maxPrice: 1000
      });

      expect(result.success).toBe(true);
      expect(result.vehicles).toHaveLength(0);
      expect(result.message).toContain('No vehicles found');
    });
  });

  describe('compareVehicles', () => {
    test('should compare vehicles successfully', async () => {
      const result = await compareVehicles.execute({
        vehicles: [
          { make: 'Honda', model: 'Civic', year: 2024 },
          { make: 'Toyota', model: 'Camry', year: 2024 }
        ],
        comparisonCriteria: ['price', 'fuel_efficiency', 'safety_rating']
      });

      expect(result.success).toBe(true);
      expect(result.comparison.vehicles).toHaveLength(2);
      expect(result.comparison.criteria).toEqual(['price', 'fuel_efficiency', 'safety_rating']);
      expect(result.comparison.analysis.winners).toBeDefined();
    });

    test('should handle unavailable vehicle data', async () => {
      const result = await compareVehicles.execute({
        vehicles: [
          { make: 'Unknown', model: 'Model', year: 2024 }
        ],
        comparisonCriteria: ['price']
      });

      expect(result.success).toBe(true);
      expect(result.comparison.vehicles[0].available).toBe(false);
    });
  });

  describe('getMarketInsights', () => {
    test('should provide market insights', async () => {
      const result = await getMarketInsights.execute({
        location: 'San Francisco',
        vehicleType: 'SUV',
        timeframe: 'current'
      });

      expect(result.success).toBe(true);
      expect(result.location).toBe('San Francisco');
      expect(result.insights.location).toBe('San Francisco');
      expect(result.insights.marketOverview).toBeDefined();
      expect(result.insights.pricing).toBeDefined();
      expect(result.insights.inventory).toBeDefined();
      expect(result.insights.recommendations).toBeDefined();
    });

    test('should include vehicle-specific insights', async () => {
      const result = await getMarketInsights.execute({
        location: 'Los Angeles',
        vehicleType: 'SUV',
        brand: 'Honda'
      });

      expect(result.success).toBe(true);
      expect(result.insights.vehicleSpecific).toBeDefined();
      expect(result.insights.vehicleSpecific.segment).toBe('SUV');
      expect(result.insights.vehicleSpecific.brand).toBe('Honda');
    });
  });

  describe('saveUserPreference', () => {
    test('should save user preference successfully', async () => {
      const result = await saveUserPreference.execute({
        category: 'vehicle_type',
        preference: 'SUV',
        priority: 'high',
        notes: 'Needs cargo space'
      });

      expect(result.success).toBe(true);
      expect(result.preference.category).toBe('vehicle_type');
      expect(result.preference.value).toBe('SUV');
      expect(result.preference.priority).toBe('high');
      expect(result.message).toContain('SUV');
    });

    test('should provide usage guidance', async () => {
      const result = await saveUserPreference.execute({
        category: 'budget_range',
        preference: '$25,000-$35,000',
        priority: 'medium'
      });

      expect(result.success).toBe(true);
      expect(result.guidance).toContain('budget');
    });
  });

  describe('getSearchHistory', () => {
    test('should fetch search history successfully', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          searches: [
            {
              label: 'Today',
              searches: [
                {
                  id: 'search1',
                  location: 'San Jose',
                  query: 'Honda',
                  createdAt: new Date().toISOString()
                }
              ]
            }
          ]
        })
      };

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await getSearchHistory.execute({
        limit: 10,
        includeDetails: false
      });

      expect(result.success).toBe(true);
      expect(result.searchHistory.searches).toHaveLength(1);
      expect(result.searchHistory.insights).toBeDefined();
    });

    test('should apply filters correctly', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          searches: [
            {
              label: 'Today',
              searches: [
                {
                  id: 'search1',
                  location: 'San Jose',
                  query: 'Honda',
                  createdAt: new Date().toISOString()
                },
                {
                  id: 'search2',
                  location: 'Los Angeles',
                  query: 'Toyota',
                  createdAt: new Date().toISOString()
                }
              ]
            }
          ]
        })
      };

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await getSearchHistory.execute({
        limit: 10,
        filterBy: {
          location: 'San Jose',
          brand: 'Honda'
        }
      });

      expect(result.success).toBe(true);
      expect(result.searchHistory.searches).toHaveLength(1);
      expect(result.searchHistory.searches[0].location).toBe('San Jose');
    });
  });

  describe('generateRecommendations', () => {
    test('should generate comprehensive recommendations', async () => {
      const result = await generateRecommendations.execute({
        context: {
          location: 'San Francisco',
          budget: 30000,
          vehicleType: 'SUV'
        },
        recommendationType: 'comprehensive',
        priority: 'budget'
      });

      expect(result.success).toBe(true);
      expect(result.recommendations.type).toBe('comprehensive');
      expect(result.recommendations.recommendations.length).toBeGreaterThan(0);
      expect(result.actionItems).toBeDefined();
    });

    test('should generate dealership-specific recommendations', async () => {
      const result = await generateRecommendations.execute({
        context: {
          location: 'Los Angeles',
          brand: 'Toyota'
        },
        recommendationType: 'dealerships',
        priority: 'quality'
      });

      expect(result.success).toBe(true);
      expect(result.recommendations.type).toBe('dealerships');
      expect(result.recommendations.recommendations.every(r => 
        r.title && r.description && r.reasoning
      )).toBe(true);
    });
  });
});