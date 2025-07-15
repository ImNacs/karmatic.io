/**
 * @fileoverview Agency filtering service with configurable parameters
 * @module mastra/services/agency-filter
 */

import { z } from "zod";
import { calculateReviewsPerMonth } from "../tools/google-maps-scraper";

/**
 * Filter configuration schema
 */
export const FilterConfigSchema = z.object({
  minRating: z.number().default(parseFloat(process.env.AGENCY_MIN_RATING || "4.0")),
  minReviewsPerMonth: z.number().default(parseInt(process.env.AGENCY_MIN_REVIEWS_PER_MONTH || "15")),
  monthsToAnalyze: z.number().default(parseInt(process.env.AGENCY_ANALYSIS_MONTHS || "6")),
  businessTypes: z.array(z.string()).default(
    JSON.parse(process.env.AGENCY_BUSINESS_TYPES || '["car dealer","auto sales","automotive dealer","agencia de autos"]')
  ),
});

export type FilterConfig = z.infer<typeof FilterConfigSchema>;

/**
 * Agency data schema
 */
export const AgencyDataSchema = z.object({
  placeId: z.string(),
  name: z.string(),
  rating: z.number(),
  reviewCount: z.number(),
  businessType: z.string(),
  recentReviews: z.array(z.object({
    date: z.string(),
    rating: z.number(),
  })).optional(),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  // Additional fields for enriched data
  metadata: z.object({
    scrapedAt: z.string(),
    dataSource: z.string(),
  }).optional(),
});

export type AgencyData = z.infer<typeof AgencyDataSchema>;

/**
 * Filter result with reason for acceptance/rejection
 */
export interface FilterResult {
  passed: boolean;
  agency: AgencyData;
  reasons: string[];
  score: number; // 0-100 quality score
  metrics: {
    ratingScore: number;
    reviewVelocity: number;
    businessTypeMatch: number;
  };
}

/**
 * Agency filter service
 */
export class AgencyFilterService {
  private config: FilterConfig;

  constructor(config?: Partial<FilterConfig>) {
    this.config = FilterConfigSchema.parse(config || {});
    console.log("🔧 Agency filter initialized with config:", this.config);
  }

  /**
   * Filter a single agency based on configured criteria
   */
  filterAgency(agency: AgencyData): FilterResult {
    const reasons: string[] = [];
    const metrics = {
      ratingScore: 0,
      reviewVelocity: 0,
      businessTypeMatch: 0,
    };

    // 1. Rating check
    const ratingPassed = agency.rating >= this.config.minRating;
    if (!ratingPassed) {
      reasons.push(`Rating ${agency.rating} is below minimum ${this.config.minRating}`);
    } else {
      metrics.ratingScore = ((agency.rating - this.config.minRating) / (5 - this.config.minRating)) * 100;
    }

    // 2. Business type check
    const businessTypeMatch = this.config.businessTypes.some(type =>
      agency.businessType.toLowerCase().includes(type.toLowerCase())
    );
    if (!businessTypeMatch) {
      reasons.push(`Business type "${agency.businessType}" doesn't match allowed types`);
    } else {
      metrics.businessTypeMatch = 100;
    }

    // 3. Review velocity check
    let reviewsPerMonth = 0;
    if (agency.recentReviews && agency.recentReviews.length > 0) {
      // Get oldest review date from recent reviews
      const oldestReview = agency.recentReviews
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
      
      reviewsPerMonth = calculateReviewsPerMonth(
        agency.reviewCount,
        oldestReview.date,
        this.config.monthsToAnalyze
      );
    } else {
      // Estimate based on total reviews (conservative)
      reviewsPerMonth = agency.reviewCount / (this.config.monthsToAnalyze * 2);
    }

    const reviewVelocityPassed = reviewsPerMonth >= this.config.minReviewsPerMonth;
    if (!reviewVelocityPassed) {
      reasons.push(
        `Review velocity ${reviewsPerMonth.toFixed(1)}/month is below minimum ${this.config.minReviewsPerMonth}`
      );
    } else {
      metrics.reviewVelocity = Math.min(
        (reviewsPerMonth / this.config.minReviewsPerMonth) * 100,
        100
      );
    }

    // Calculate overall score
    const score = (
      metrics.ratingScore * 0.3 +
      metrics.reviewVelocity * 0.5 +
      metrics.businessTypeMatch * 0.2
    );

    const passed = ratingPassed && businessTypeMatch && reviewVelocityPassed;

    return {
      passed,
      agency,
      reasons: passed ? ["All criteria met"] : reasons,
      score: Math.round(score),
      metrics,
    };
  }

  /**
   * Filter multiple agencies
   */
  filterAgencies(agencies: AgencyData[]): {
    accepted: FilterResult[];
    rejected: FilterResult[];
    stats: {
      totalProcessed: number;
      acceptedCount: number;
      rejectedCount: number;
      averageScore: number;
      rejectionReasons: Record<string, number>;
    };
  } {
    const results = agencies.map(agency => this.filterAgency(agency));
    const accepted = results.filter(r => r.passed);
    const rejected = results.filter(r => !r.passed);

    // Compile rejection reasons
    const rejectionReasons: Record<string, number> = {};
    rejected.forEach(r => {
      r.reasons.forEach(reason => {
        const key = reason.includes("Rating") ? "Low Rating" :
                   reason.includes("Business type") ? "Wrong Business Type" :
                   reason.includes("Review velocity") ? "Low Review Activity" :
                   "Other";
        rejectionReasons[key] = (rejectionReasons[key] || 0) + 1;
      });
    });

    const averageScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;

    console.log(`📊 Filter results: ${accepted.length}/${agencies.length} accepted`);
    console.log(`📈 Average quality score: ${averageScore.toFixed(1)}/100`);

    return {
      accepted,
      rejected,
      stats: {
        totalProcessed: agencies.length,
        acceptedCount: accepted.length,
        rejectedCount: rejected.length,
        averageScore: Math.round(averageScore),
        rejectionReasons,
      },
    };
  }

  /**
   * Update filter configuration
   */
  updateConfig(newConfig: Partial<FilterConfig>) {
    this.config = FilterConfigSchema.parse({ ...this.config, ...newConfig });
    console.log("🔧 Filter config updated:", this.config);
  }

  /**
   * Get current configuration
   */
  getConfig(): FilterConfig {
    return this.config;
  }
}