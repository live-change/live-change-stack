import vm from 'vm'

class RenderContext {
  constructor(settings, baseContext, script) {
    this.settings = settings
    this.root = this.settings.root || process.cwd()
    this.timeouts = new Set()
    this.intervals = new Set()
    this.running = false
    this.script = script
    this.useCount = 0
    this.maxUses = this.settings.contextMaxUses || 128
    
    // Create wrapped setTimeout and setInterval that track IDs
    const originalSetTimeout = setTimeout
    const originalSetInterval = setInterval
    const originalClearTimeout = clearTimeout
    const originalClearInterval = clearInterval
    const originalNextTick = process.nextTick
    
    const wrappedSetTimeout = (callback, delay, ...args) => {
      if(!this.running) return
      const id = originalSetTimeout(callback, delay, ...args)
      this.timeouts.add(id)
      return id
    }
    
    const wrappedSetInterval = (callback, delay, ...args) => {
      if(!this.running) return
      const id = originalSetInterval(callback, delay, ...args)
      this.intervals.add(id)
      return id
    }
    
    const wrappedClearTimeout = (id) => {
      if(!this.running) return
      this.timeouts.delete(id)
      return originalClearTimeout(id)
    }
    
    const wrappedClearInterval = (id) => {
      if(!this.running) return
      this.intervals.delete(id)
      return originalClearInterval(id)
    }
    
    const wrappedNextTick = (callback, ...args) => {
      if (!this.running) return
      return originalNextTick(callback, ...args)            
    }
    
    this.contextObject = {
      //...globalThis,
      ...baseContext,
      exports: {},
      setTimeout: wrappedSetTimeout,
      setInterval: wrappedSetInterval,
      clearTimeout: wrappedClearTimeout,
      clearInterval: wrappedClearInterval,
      //process: process,
      process: {
        env: {
          NODE_ENV: 'production'
        },
        stdout: process.stdout,
        stderr: process.stderr,       
        nextTick: wrappedNextTick
      } 
    }
    
    this.vmContext = vm.createContext(this.contextObject, {
      name: 'SSR '+(new Date().toISOString()),
      ///microtaskMode: 'afterEvaluate'        
    })
  }

  runScript(script) {
    // Execute script in the existing context
    // Note: this doesn't reset exports, so previous state is preserved
    script.runInContext(this.vmContext)
    return this.contextObject
  }

  // Increment use count and check if context should be replaced
  incrementUse() {
    this.useCount++
  }

  shouldReplace() {
    return this.useCount >= this.maxUses
  }

  getExports() {
    return this.contextObject.exports
  }

  // Start the context - allow nextTick operations
  async start() {
    await this.script.runInContext(this.vmContext)
    this.running = true
  }

  // Stop the context - prevent nextTick operations and clear timers
  stop() {
    this.running = false
    this.clearTimeouts()
  }

  isRunning() {
    return this.running
  }

  // Clear all active timeouts and intervals
  clearTimeouts() {
    // Clear all timeouts
    for (const timeoutId of this.timeouts) {
      clearTimeout(timeoutId)
    }
    this.timeouts.clear()
    
    // Clear all intervals
    for (const intervalId of this.intervals) {
      clearInterval(intervalId)
    }
    this.intervals.clear()
  }

  // Get stats about active timers (useful for debugging)
  getTimerStats() {
    return {
      running: this.running,
      timeouts: this.timeouts.size,
      intervals: this.intervals.size,
      useCount: this.useCount,
      maxUses: this.maxUses,
      usagePercentage: Math.round((this.useCount / this.maxUses) * 100)
    }
  }
}

export default RenderContext