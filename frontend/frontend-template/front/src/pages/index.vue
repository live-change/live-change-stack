<route>
  { name: 'index', meta: { pageType: 'wide' } }
</route>

<template>
  <div class="min-h-screen bg-surface-0 dark:bg-surface-900">
    <!-- Hero Section -->
    <section class="py-20 px-4 bg-surface-50 dark:bg-surface-800">
      <div class="max-w-4xl mx-auto text-center">
        <!-- Logo -->
        <div class="mb-6 flex justify-center">
          <img 
            src="/images/logo.svg" 
            alt="Live Change Logo" 
            class="w-32 h-32 md:w-40 md:h-40 text-primary-500 transition-transform duration-300 hover:scale-110"
          />
        </div>
        
        <!-- Title and Description -->
        <div class="mb-12">
          <h1 class="text-3xl md:text-5xl font-bold text-surface-900 dark:text-surface-100 mb-6 text-center">
            Live Change
          </h1>
          <p class="text-lg md:text-xl text-surface-600 dark:text-surface-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            The real-time web framework that revolutionizes how you build modern applications with seamless synchronization and live data
          </p>
          
          <!-- Live Demo Indicator -->
          <div class="inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 rounded-full mb-8">
            <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span class="text-sm font-medium text-green-700 dark:text-green-300">Live & Real-time</span>
          </div>
        </div>
        
        <!-- CTA Buttons -->
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            label="Get Started" 
            icon="pi pi-arrow-right" 
            class="p-button-lg transition-all duration-300 transform hover:scale-105"
            iconPos="right"
          />
          <Button 
            label="View Documentation" 
            icon="pi pi-book" 
            class="p-button-lg transition-all duration-300"
            outlined
            severity="secondary"
          />
        </div>
      </div>
    </section>

    <!-- Features Grid -->
    <section class="py-20 px-4">
      <div class="max-w-7xl mx-auto">
        <div class="text-center mb-16 max-w-4xl mx-auto">
          <h2 class="text-3xl md:text-4xl font-bold text-surface-900 dark:text-surface-100 mb-4 text-center">
            Built for the Modern Web
          </h2>
          <p class="text-lg md:text-xl text-surface-600 dark:text-surface-300 max-w-2xl mx-auto">
            Experience the next generation of web development with our comprehensive real-time framework
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <!-- Real-time Sync -->
          <Card class="!border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <template #content>
              <div class="text-center p-6">
                <div class="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i class="pi pi-sync text-2xl text-blue-600 dark:text-blue-400"></i>
                </div>
                <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-100 mb-3">Real-time Synchronization</h3>
                <p class="text-surface-600 dark:text-surface-300">
                  Advanced protocol ensuring instant data synchronization across all connected clients with zero latency
                </p>
              </div>
            </template>
          </Card>

          <!-- SSR Support -->
          <Card class="!border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <template #content>
              <div class="text-center p-6">
                <div class="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i class="pi pi-server text-2xl text-green-600 dark:text-green-400"></i>
                </div>
                <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-100 mb-3">Server-Side Rendering</h3>
                <p class="text-surface-600 dark:text-surface-300">
                  Built-in SSR support for better SEO, faster initial loads, and improved user experience
                </p>
              </div>
            </template>
          </Card>

          <!-- Live Database -->
          <Card class="!border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <template #content>
              <div class="text-center p-6">
                <div class="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i class="pi pi-database text-2xl text-purple-600 dark:text-purple-400"></i>
                </div>
                <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-100 mb-3">Live Query Database</h3>
                <p class="text-surface-600 dark:text-surface-300">
                  Object-oriented real-time database with live queries that update automatically as data changes
                </p>
              </div>
            </template>
          </Card>

          <!-- CRUD Generator -->
          <Card class="!border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <template #content>
              <div class="text-center p-6">
                <div class="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i class="pi pi-cog text-2xl text-orange-600 dark:text-orange-400"></i>
                </div>
                <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-100 mb-3">CRUD Generator</h3>
                <p class="text-surface-600 dark:text-surface-300">
                  Automatic generation of Create, Read, Update, Delete operations with validation and type safety
                </p>
              </div>
            </template>
          </Card>

          <!-- Access Control -->
          <Card class="!border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <template #content>
              <div class="text-center p-6">
                <div class="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i class="pi pi-shield text-2xl text-red-600 dark:text-red-400"></i>
                </div>
                <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-100 mb-3">Access Control System</h3>
                <p class="text-surface-600 dark:text-surface-300">
                  Comprehensive security with user roles, permissions, and object-level access control
                </p>
              </div>
            </template>
          </Card>

          <!-- Relationship Modeling -->
          <Card class="!border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <template #content>
              <div class="text-center p-6">
                <div class="w-16 h-16 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i class="pi pi-sitemap text-2xl text-teal-600 dark:text-teal-400"></i>
                </div>
                <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-100 mb-3">Relationship Modeling</h3>
                <p class="text-surface-600 dark:text-surface-300">
                  Intuitive system for modeling complex relationships between objects with automatic resolution
                </p>
              </div>
            </template>
          </Card>
        </div>
      </div>
    </section>

    <!-- Technical Overview -->
    <section class="py-20 px-4 bg-surface-50 dark:bg-surface-800">
      <div class="max-w-7xl mx-auto">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 class="text-4xl font-bold text-surface-900 dark:text-surface-100 mb-6">
              Architecture That Scales
            </h2>
            <p class="text-lg text-surface-600 dark:text-surface-300 mb-8">
              Live Change is built on a foundation of cutting-edge technologies and patterns designed for 
              modern web applications that need to handle real-time data at scale.
            </p>
            
            <div class="space-y-6">
              <div class="flex items-start gap-4">
                <div class="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                  <i class="pi pi-bolt text-blue-600 dark:text-blue-400"></i>
                </div>
                <div>
                  <h4 class="font-semibold text-surface-900 dark:text-surface-100 mb-2">Event-Driven Architecture</h4>
                  <p class="text-surface-600 dark:text-surface-300">
                    Reactive system that responds instantly to data changes and user interactions
                  </p>
                </div>
              </div>
              
              <div class="flex items-start gap-4">
                <div class="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                  <i class="pi pi-globe text-green-600 dark:text-green-400"></i>
                </div>
                <div>
                  <h4 class="font-semibold text-surface-900 dark:text-surface-100 mb-2">WebSocket Protocol</h4>
                  <p class="text-surface-600 dark:text-surface-300">
                    Persistent connections enabling true real-time communication between client and server
                  </p>
                </div>
              </div>
              
              <div class="flex items-start gap-4">
                <div class="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                  <i class="pi pi-code text-purple-600 dark:text-purple-400"></i>
                </div>
                <div>
                  <h4 class="font-semibold text-surface-900 dark:text-surface-100 mb-2">Type-Safe APIs</h4>
                  <p class="text-surface-600 dark:text-surface-300">
                    Full TypeScript support with automatic type generation for enhanced developer experience
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div class="relative">
            <div class="absolute inset-0 bg-gradient-to-r from-primary-400 to-primary-500 rounded-lg transform rotate-6"></div>
            <div class="relative bg-surface-0 dark:bg-surface-900 rounded-lg p-8 shadow-xl">
              <pre class="text-sm overflow-x-auto"><code class="text-surface-800 dark:text-surface-200">// Live queries update automatically
const [ users ] = await Promise.all([
  live(path.user.users({ status: 'online' }))
])

// Real-time data binding
watch(users, (newUsers) => {
  console.log('Users updated:', newUsers)
})

// Automatic CRUD operations
await api.create('user', {
  name: 'John Doe',
  email: 'john@example.com'
})</code></pre>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Getting Started -->
    <section class="py-20 px-4">
      <div class="max-w-4xl mx-auto text-center">
        <h2 class="text-4xl font-bold text-surface-900 dark:text-surface-100 mb-6">
          Ready to Get Started?
        </h2>
        <p class="text-xl text-surface-600 dark:text-surface-300 mb-12">
          Join thousands of developers building the next generation of real-time applications
        </p>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div class="text-center">
            <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <span class="text-blue-600 dark:text-blue-400 font-bold text-lg">1</span>
            </div>
            <h4 class="font-semibold text-surface-900 dark:text-surface-100 mb-2">Install Framework</h4>
            <p class="text-surface-600 dark:text-surface-300 text-sm">
              npm install @live-change/framework
            </p>
          </div>
          
          <div class="text-center">
            <div class="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <span class="text-green-600 dark:text-green-400 font-bold text-lg">2</span>
            </div>
            <h4 class="font-semibold text-surface-900 dark:text-surface-100 mb-2">Create Project</h4>
            <p class="text-surface-600 dark:text-surface-300 text-sm">
              lc create my-awesome-app
            </p>
          </div>
          
          <div class="text-center">
            <div class="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <span class="text-purple-600 dark:text-purple-400 font-bold text-lg">3</span>
            </div>
            <h4 class="font-semibold text-surface-900 dark:text-surface-100 mb-2">Start Building</h4>
            <p class="text-surface-600 dark:text-surface-300 text-sm">
              Real-time apps in minutes
            </p>
          </div>
        </div>
        
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            label="Start Your Project" 
            icon="pi pi-play" 
            class="p-button-lg transition-all duration-300"
          />
          <Button 
            label="Join Community" 
            icon="pi pi-users" 
            class="p-button-lg transition-all duration-300"
            outlined
            severity="secondary"
          />
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="py-12 px-4 bg-surface-900 text-surface-0">
      <div class="max-w-4xl mx-auto text-center">
        <div class="mb-8">
          <h3 class="text-2xl font-bold mb-4">Live Change Framework</h3>
          <p class="text-surface-400 max-w-xl mx-auto text-center">
            Building the future of real-time web applications with innovative synchronization technology
          </p>
        </div>
        
        <div class="flex justify-center items-center space-x-8 mb-8">
          <a href="#" class="text-surface-400 hover:text-surface-0 transition-colors p-2">
            <i class="pi pi-github text-2xl"></i>
          </a>
          <a href="#" class="text-surface-400 hover:text-surface-0 transition-colors p-2">
            <i class="pi pi-twitter text-2xl"></i>
          </a>
          <a href="#" class="text-surface-400 hover:text-surface-0 transition-colors p-2">
            <i class="pi pi-discord text-2xl"></i>
          </a>
        </div>
        
        <div class="text-surface-400 text-sm text-center">
          © 2024 Live Change Framework. Built with 💙 for the developer community.
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import Button from 'primevue/button'
import Card from 'primevue/card'

// SEO Meta
import { useHead } from '@vueuse/head'

useHead({
  title: 'Live Change - Real-time Web Framework',
  meta: [
    {
      name: 'description',
      content: 'Live Change is a revolutionary real-time web framework with seamless synchronization, SSR support, and comprehensive tooling for modern applications.'
    },
    {
      name: 'keywords',
      content: 'real-time, web framework, SSR, live data, synchronization, Vue.js, TypeScript'
    },
    {
      property: 'og:title',
      content: 'Live Change - Real-time Web Framework'
    },
    {
      property: 'og:description',
      content: 'Build modern real-time applications with Live Change framework. Advanced synchronization, live queries, and comprehensive tooling.'
    },
    {
      property: 'og:type',
      content: 'website'
    }
  ]
})
</script>

<style scoped>
/* Custom animations */
@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-20px);
  }
}

.animate-float {
  animation: float 6s ease-in-out infinite;
}

/* Custom gradients */
.gradient-text {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Smooth scroll behavior */
html {
  scroll-behavior: smooth;
}

/* Card hover effects */
.card-hover {
  transition: all 0.3s ease;
}

.card-hover:hover {
  transform: translateY(-8px);
}
</style>
