/**
 * Memory monitoring utility for the eBay scraper system
 * Tracks memory usage and provides optimization recommendations
 */

class MemoryMonitor {
  constructor() {
    this.memoryStats = [];
    this.maxStatsHistory = 100; // Keep last 100 memory snapshots
    this.warningThreshold = 100 * 1024 * 1024; // 100MB warning threshold
    this.criticalThreshold = 250 * 1024 * 1024; // 250MB critical threshold
    this.monitoringInterval = null;
  }

  /**
   * Get current memory usage statistics
   */
  getMemoryUsage() {
    const usage = process.memoryUsage();
    return {
      timestamp: new Date().toISOString(),
      rss: usage.rss, // Resident Set Size
      heapTotal: usage.heapTotal, // Total heap size
      heapUsed: usage.heapUsed, // Used heap size
      external: usage.external, // External memory
      arrayBuffers: usage.arrayBuffers // ArrayBuffer memory
    };
  }

  /**
   * Format memory size in human-readable format
   */
  formatMemorySize(bytes) {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  /**
   * Record memory usage snapshot
   */
  recordMemorySnapshot() {
    const snapshot = this.getMemoryUsage();
    this.memoryStats.push(snapshot);
    
    // Keep only last N snapshots
    if (this.memoryStats.length > this.maxStatsHistory) {
      this.memoryStats = this.memoryStats.slice(-this.maxStatsHistory);
    }
    
    // Check for memory warnings
    this.checkMemoryThresholds(snapshot);
    
    return snapshot;
  }

  /**
   * Check memory thresholds and log warnings
   */
  checkMemoryThresholds(snapshot) {
    const { heapUsed, rss } = snapshot;
    
    if (heapUsed > this.criticalThreshold) {
      console.warn(`🚨 CRITICAL: Heap usage is ${this.formatMemorySize(heapUsed)} (threshold: ${this.formatMemorySize(this.criticalThreshold)})`);
    } else if (heapUsed > this.warningThreshold) {
      console.warn(`⚠️  WARNING: Heap usage is ${this.formatMemorySize(heapUsed)} (threshold: ${this.formatMemorySize(this.warningThreshold)})`);
    }
    
    if (rss > this.criticalThreshold * 2) {
      console.warn(`🚨 CRITICAL: RSS usage is ${this.formatMemorySize(rss)}`);
    }
  }

  /**
   * Start periodic memory monitoring
   */
  startMonitoring(intervalMs = 60000) {
    if (this.monitoringInterval) {
      this.stopMonitoring();
    }
    
    console.log(`📊 Starting memory monitoring (interval: ${intervalMs}ms)`);
    this.monitoringInterval = setInterval(() => {
      this.recordMemorySnapshot();
    }, intervalMs);
  }

  /**
   * Stop memory monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('📊 Memory monitoring stopped');
    }
  }

  /**
   * Get memory statistics summary
   */
  getMemoryStatsSummary() {
    if (this.memoryStats.length === 0) {
      return null;
    }
    
    const latest = this.memoryStats[this.memoryStats.length - 1];
    const oldest = this.memoryStats[0];
    
    const heapUsedValues = this.memoryStats.map(s => s.heapUsed);
    const rssValues = this.memoryStats.map(s => s.rss);
    
    return {
      latest: {
        timestamp: latest.timestamp,
        heapUsed: this.formatMemorySize(latest.heapUsed),
        heapTotal: this.formatMemorySize(latest.heapTotal),
        rss: this.formatMemorySize(latest.rss),
        external: this.formatMemorySize(latest.external)
      },
      trends: {
        heapUsedMin: this.formatMemorySize(Math.min(...heapUsedValues)),
        heapUsedMax: this.formatMemorySize(Math.max(...heapUsedValues)),
        heapUsedAvg: this.formatMemorySize(heapUsedValues.reduce((a, b) => a + b, 0) / heapUsedValues.length),
        rssMin: this.formatMemorySize(Math.min(...rssValues)),
        rssMax: this.formatMemorySize(Math.max(...rssValues)),
        rssAvg: this.formatMemorySize(rssValues.reduce((a, b) => a + b, 0) / rssValues.length)
      },
      samplesCount: this.memoryStats.length,
      monitoringDuration: oldest ? `${Math.round((new Date(latest.timestamp) - new Date(oldest.timestamp)) / 1000)} seconds` : '0 seconds'
    };
  }

  /**
   * Force garbage collection if available
   */
  forceGarbageCollection() {
    if (global.gc) {
      const beforeGC = this.getMemoryUsage();
      global.gc();
      const afterGC = this.getMemoryUsage();
      
      const heapReduction = beforeGC.heapUsed - afterGC.heapUsed;
      console.log(`🗑️  Garbage collection completed. Heap reduced by ${this.formatMemorySize(heapReduction)}`);
      
      return {
        before: beforeGC,
        after: afterGC,
        heapReduction: heapReduction
      };
    } else {
      console.warn('⚠️  Garbage collection not available. Start Node.js with --expose-gc flag to enable.');
      return null;
    }
  }

  /**
   * Get memory optimization recommendations
   */
  getOptimizationRecommendations() {
    const summary = this.getMemoryStatsSummary();
    const recommendations = [];
    
    if (!summary) {
      return ['Start memory monitoring to get recommendations'];
    }
    
    const latestHeapMB = this.memoryStats[this.memoryStats.length - 1].heapUsed / (1024 * 1024);
    const latestRSSMB = this.memoryStats[this.memoryStats.length - 1].rss / (1024 * 1024);
    
    if (latestHeapMB > 100) {
      recommendations.push('Consider implementing more aggressive log rotation');
      recommendations.push('Review bot log retention policies');
    }
    
    if (latestRSSMB > 200) {
      recommendations.push('Consider reducing the number of concurrent bots');
      recommendations.push('Implement periodic memory cleanup');
    }
    
    if (this.memoryStats.length > 10) {
      const recentStats = this.memoryStats.slice(-10);
      const isIncreasing = recentStats.every((stat, i) => 
        i === 0 || stat.heapUsed >= recentStats[i - 1].heapUsed
      );
      
      if (isIncreasing) {
        recommendations.push('Memory usage is consistently increasing - investigate potential memory leaks');
        recommendations.push('Consider restarting long-running bots periodically');
      }
    }
    
    if (global.gc) {
      recommendations.push('Garbage collection is available - consider using it during low-activity periods');
    } else {
      recommendations.push('Consider starting Node.js with --expose-gc flag for manual garbage collection');
    }
    
    return recommendations.length > 0 ? recommendations : ['Memory usage appears to be within normal limits'];
  }
}

// Create and export singleton instance
export const memoryMonitor = new MemoryMonitor();
export default MemoryMonitor;
