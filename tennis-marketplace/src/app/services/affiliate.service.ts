import { Injectable } from '@angular/core';

declare let gtag: Function;

export interface AffiliateLink {
  id: string;
  name: string;
  url: string;
  category: string;
  description?: string;
  commissionRate?: number;
  isActive: boolean;
}

export interface AffiliateProgram {
  id: string;
  name: string;
  baseUrl: string;
  affiliateId: string;
  trackingParam: string;
  commissionRate: number;
  categories: string[];
  isActive: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AffiliateService {
  
  private affiliatePrograms: AffiliateProgram[] = [
    {
      id: 'toby-sports',
      name: 'Toby\'s Sports',
      baseUrl: 'https://www.tobysports.com',
      affiliateId: 'tennis-marketplace',
      trackingParam: 'ref',
      commissionRate: 5.0,
      categories: ['rackets', 'shoes', 'apparel', 'accessories'],
      isActive: true
    },
    {
      id: 'sports-central',
      name: 'Sports Central',
      baseUrl: 'https://www.sportscentral.com.ph',
      affiliateId: 'tennisph',
      trackingParam: 'affiliate',
      commissionRate: 4.5,
      categories: ['rackets', 'strings', 'bags', 'equipment'],
      isActive: true
    },
    {
      id: 'decathlon',
      name: 'Decathlon Philippines',
      baseUrl: 'https://www.decathlon.ph',
      affiliateId: 'tennismarket',
      trackingParam: 'aff',
      commissionRate: 3.0,
      categories: ['budget-equipment', 'beginner-gear', 'accessories'],
      isActive: true
    },
    {
      id: 'amazon',
      name: 'Amazon',
      baseUrl: 'https://www.amazon.com',
      affiliateId: 'tennismarket-20',
      trackingParam: 'tag',
      commissionRate: 8.0,
      categories: ['international-brands', 'premium-equipment', 'books'],
      isActive: true
    },
    {
      id: 'tennis-warehouse',
      name: 'Tennis Warehouse',
      baseUrl: 'https://www.tennis-warehouse.com',
      affiliateId: 'TWA-tennisph',
      trackingParam: 'from',
      commissionRate: 6.0,
      categories: ['professional-equipment', 'strings', 'premium-rackets'],
      isActive: true
    }
  ];

  private affiliateLinks: AffiliateLink[] = [
    // Racket Categories
    {
      id: 'wilson-clash-100',
      name: 'Wilson Clash 100 Racket',
      url: 'https://www.tobysports.com/wilson-clash-100',
      category: 'rackets',
      description: 'Popular intermediate racket with great feel',
      commissionRate: 5.0,
      isActive: true
    },
    {
      id: 'babolat-pure-drive',
      name: 'Babolat Pure Drive',
      url: 'https://www.sports-central.com.ph/babolat-pure-drive',
      category: 'rackets',
      description: 'Classic power racket for aggressive players',
      commissionRate: 4.5,
      isActive: true
    },
    {
      id: 'head-speed-mp',
      name: 'Head Speed MP',
      url: 'https://www.tennis-warehouse.com/head-speed-mp',
      category: 'rackets',
      description: 'Professional control racket',
      commissionRate: 6.0,
      isActive: true
    },
    
    // Tennis Shoes
    {
      id: 'nike-court-air-zoom',
      name: 'Nike Court Air Zoom',
      url: 'https://www.tobysports.com/nike-court-air-zoom',
      category: 'shoes',
      description: 'Comfortable tennis shoes for all courts',
      commissionRate: 5.0,
      isActive: true
    },
    {
      id: 'adidas-barricade',
      name: 'Adidas Barricade',
      url: 'https://www.decathlon.ph/adidas-barricade',
      category: 'shoes',
      description: 'Durable shoes for hard court play',
      commissionRate: 3.0,
      isActive: true
    },
    
    // Strings
    {
      id: 'yonex-poly-tour-pro',
      name: 'Yonex Poly Tour Pro String',
      url: 'https://www.tennis-warehouse.com/yonex-poly-tour-pro',
      category: 'strings',
      description: 'Professional polyester string for spin',
      commissionRate: 6.0,
      isActive: true
    },
    {
      id: 'babolat-rpm-blast',
      name: 'Babolat RPM Blast String',
      url: 'https://www.sports-central.com.ph/babolat-rpm-blast',
      category: 'strings',
      description: 'Popular spin string used by pros',
      commissionRate: 4.5,
      isActive: true
    },
    
    // Accessories
    {
      id: 'wilson-tennis-bag',
      name: 'Wilson Tennis Bag',
      url: 'https://www.tobysports.com/wilson-tennis-bag',
      category: 'accessories',
      description: 'Spacious bag for equipment storage',
      commissionRate: 5.0,
      isActive: true
    },
    {
      id: 'head-dampener',
      name: 'Head Dampener',
      url: 'https://www.decathlon.ph/head-dampener',
      category: 'accessories',
      description: 'Reduce string vibration',
      commissionRate: 3.0,
      isActive: true
    },
    
    // Training Equipment
    {
      id: 'tennis-ball-machine',
      name: 'Tennis Ball Machine',
      url: 'https://www.amazon.com/tennis-ball-machine',
      category: 'training',
      description: 'Professional ball machine for practice',
      commissionRate: 8.0,
      isActive: true
    },
    
    // Books and Learning
    {
      id: 'tennis-technique-book',
      name: 'Tennis Technique Guide',
      url: 'https://www.amazon.com/tennis-technique-guide',
      category: 'education',
      description: 'Comprehensive tennis instruction book',
      commissionRate: 8.0,
      isActive: true
    }
  ];

  constructor() { }

  // Get all affiliate programs
  getAffiliatePrograms(): AffiliateProgram[] {
    return this.affiliatePrograms.filter(program => program.isActive);
  }

  // Get affiliate program by ID
  getAffiliateProgramById(id: string): AffiliateProgram | undefined {
    return this.affiliatePrograms.find(program => program.id === id);
  }

  // Generate affiliate link
  generateAffiliateLink(programId: string, productUrl: string, customParams?: any): string {
    const program = this.getAffiliateProgramById(programId);
    if (!program) {
      return productUrl; // Return original URL if program not found
    }

    const url = new URL(productUrl);
    url.searchParams.set(program.trackingParam, program.affiliateId);
    
    // Add custom tracking parameters
    if (customParams) {
      Object.keys(customParams).forEach(key => {
        url.searchParams.set(key, customParams[key]);
      });
    }
    
    // Add campaign tracking
    url.searchParams.set('utm_source', 'tennis-marketplace');
    url.searchParams.set('utm_medium', 'affiliate');
    url.searchParams.set('utm_campaign', 'blog-content');
    
    return url.toString();
  }

  // Get affiliate links by category
  getAffiliateLinks(category?: string): AffiliateLink[] {
    let links = this.affiliateLinks.filter(link => link.isActive);
    
    if (category) {
      links = links.filter(link => link.category === category);
    }
    
    return links;
  }

  // Get specific affiliate link
  getAffiliateLinkById(id: string): AffiliateLink | undefined {
    return this.affiliateLinks.find(link => link.id === id && link.isActive);
  }

  // Track affiliate click (for analytics)
  trackAffiliateClick(linkId: string, context?: string): void {
    // In a real implementation, this would send data to analytics
    console.log('Affiliate click tracked:', {
      linkId,
      context,
      timestamp: new Date().toISOString(),
      source: 'tennis-marketplace'
    });
    
    // Could integrate with Google Analytics, custom tracking, etc.
    if (typeof gtag !== 'undefined') {
      gtag('event', 'affiliate_click', {
        'affiliate_link_id': linkId,
        'context': context,
        'value': 1
      });
    }
  }

  // Get affiliate link with tracking
  getTrackedAffiliateLink(linkId: string, context?: string): string {
    const link = this.getAffiliateLinkById(linkId);
    if (!link) {
      return '#';
    }

    // Track the click
    this.trackAffiliateClick(linkId, context);
    
    // Add additional tracking parameters
    const url = new URL(link.url);
    url.searchParams.set('utm_content', linkId);
    if (context) {
      url.searchParams.set('utm_term', context);
    }
    
    return url.toString();
  }

  // Generate product recommendation HTML
  generateProductRecommendation(category: string, limit: number = 3): string {
    const links = this.getAffiliateLinks(category).slice(0, limit);
    
    if (links.length === 0) {
      return '';
    }

    let html = '<div class="affiliate-recommendations">';
    html += '<h3>Recommended Products</h3>';
    html += '<div class="product-grid">';
    
    links.forEach(link => {
      const trackedUrl = this.getTrackedAffiliateLink(link.id, `recommendation-${category}`);
      html += `
        <div class="product-card">
          <h4>${link.name}</h4>
          <p>${link.description || ''}</p>
          <a href="${trackedUrl}" target="_blank" rel="noopener" class="affiliate-link">
            View Product →
          </a>
        </div>
      `;
    });
    
    html += '</div></div>';
    return html;
  }

  // Content replacement for blog posts
  replaceAffiliateLinks(content: string): string {
    // Replace [affiliate-link] placeholders with actual affiliate links
    let processedContent = content;
    
    // Pattern: [affiliate-link:product-id]
    const affiliateLinkPattern = /\[affiliate-link:([^\]]+)\]/g;
    processedContent = processedContent.replace(affiliateLinkPattern, (match, linkId) => {
      const trackedUrl = this.getTrackedAffiliateLink(linkId, 'blog-content');
      const link = this.getAffiliateLinkById(linkId);
      const linkText = link?.name || 'View Product';
      return `<a href="${trackedUrl}" target="_blank" rel="noopener" class="affiliate-link">${linkText}</a>`;
    });

    // Pattern: [affiliate-category:category-name]
    const categoryPattern = /\[affiliate-category:([^\]]+)\]/g;
    processedContent = processedContent.replace(categoryPattern, (match, category) => {
      return this.generateProductRecommendation(category, 3);
    });

    return processedContent;
  }

  // Analytics and reporting
  getAffiliateStats(): any {
    return {
      totalPrograms: this.affiliatePrograms.filter(p => p.isActive).length,
      totalLinks: this.affiliateLinks.filter(l => l.isActive).length,
      categoryCounts: this.getCategoryCounts(),
      averageCommissionRate: this.getAverageCommissionRate()
    };
  }

  private getCategoryCounts(): { [key: string]: number } {
    const counts: { [key: string]: number } = {};
    this.affiliateLinks.filter(l => l.isActive).forEach(link => {
      counts[link.category] = (counts[link.category] || 0) + 1;
    });
    return counts;
  }

  private getAverageCommissionRate(): number {
    const activeLinks = this.affiliateLinks.filter(l => l.isActive && l.commissionRate);
    if (activeLinks.length === 0) return 0;
    
    const total = activeLinks.reduce((sum, link) => sum + (link.commissionRate || 0), 0);
    return total / activeLinks.length;
  }

  // Compliance and disclosure
  getAffiliateDisclosure(): string {
    return `
      <div class="affiliate-disclosure">
        <p><strong>Affiliate Disclosure:</strong> Tennis Marketplace participates in affiliate programs with tennis retailers. 
        We may earn a commission when you purchase products through our links, at no additional cost to you. 
        This helps support our free content and allows us to continue providing valuable tennis resources.</p>
      </div>
    `;
  }
}