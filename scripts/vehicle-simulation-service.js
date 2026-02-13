/**
 * Vehicle Simulation Service
 * 
 * This service runs independently to simulate vehicle movement
 * It can be run as a cron job or standalone process
 */

// Use global fetch (available in Node.js 18+)
const fetchFn = typeof fetch !== 'undefined' ? fetch : require('node-fetch');

class VehicleSimulationService {
  constructor() {
    this.isRunning = false;
    this.interval = null;
    this.updateFrequency = 3000; // Update every 3 seconds
  }

  async start() {
    if (this.isRunning) {
      console.log('[SIMULATION] Service is already running');
      return;
    }

    console.log('[SIMULATION] Starting vehicle simulation service...');
    this.isRunning = true;

    // Run immediately on start
    await this.runSimulation();

    // Set up recurring simulation
    this.interval = setInterval(async () => {
      try {
        await this.runSimulation();
      } catch (error) {
        console.error('[SIMULATION] Error in simulation cycle:', error);
      }
    }, this.updateFrequency);

    console.log(`[SIMULATION] Service started with ${this.updateFrequency}ms update frequency`);
  }

  async stop() {
    if (!this.isRunning) {
      console.log('[SIMULATION] Service is not running');
      return;
    }

    console.log('[SIMULATION] Stopping vehicle simulation service...');
    this.isRunning = false;

    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    console.log('[SIMULATION] Service stopped');
  }

  async runSimulation() {
    try {
      const startTime = Date.now();
      
      const response = await fetchFn(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/vehicle-simulation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      const duration = Date.now() - startTime;

      console.log(`[SIMULATION] Cycle completed in ${duration}ms - Updated ${result.updated} vehicles`);

      if (result.results && result.results.length > 0) {
        result.results.forEach(vehicle => {
          if (vehicle.isCompleted) {
            console.log(`[SIMULATION] 🎯 Vehicle ${vehicle.trackingId} completed journey!`);
          }
        });
      }

    } catch (error) {
      console.error('[SIMULATION] Simulation cycle failed:', error.message);
    }
  }

  async getStatus() {
    try {
      const response = await fetchFn(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/vehicle-simulation`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[SIMULATION] Failed to get status:', error.message);
      return null;
    }
  }
}

// Command line interface
if (require.main === module) {
  const service = new VehicleSimulationService();

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n[SIMULATION] Received SIGINT, shutting down gracefully...');
    await service.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n[SIMULATION] Received SIGTERM, shutting down gracefully...');
    await service.stop();
    process.exit(0);
  });

  // Start the service
  service.start().catch(error => {
    console.error('[SIMULATION] Failed to start service:', error);
    process.exit(1);
  });
}

module.exports = VehicleSimulationService;
