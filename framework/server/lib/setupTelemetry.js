import { NodeSDK } from '@opentelemetry/sdk-node'

import {
  getNodeAutoInstrumentations,
} from '@opentelemetry/auto-instrumentations-node'

import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node'
import {
  PeriodicExportingMetricReader,
  ConsoleMetricExporter,
} from '@opentelemetry/sdk-metrics'

import {
  OTLPTraceExporter,
} from '@opentelemetry/exporter-trace-otlp-proto'
import {
  OTLPMetricExporter,
} from '@opentelemetry/exporter-metrics-otlp-proto'

import { defaultResource, resourceFromAttributes } from '@opentelemetry/resources'

import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions';

import { logs } from '@opentelemetry/api-logs'
import {
  LoggerProvider,
  SimpleLogRecordProcessor,
  ConsoleLogRecordExporter,
  BatchLogRecordProcessor,
} from '@opentelemetry/sdk-logs'

import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http'

export default async function setupTelemetry(settings, appConfig = {}) {

  const { otelUrl, otelHeaders, otelServiceName } = settings

  if(!otelUrl) {
    console.log("no telemetry DSN provided - skipping telemetry setup")
    return;
  }

  const resource = defaultResource().merge(resourceFromAttributes({
    [ATTR_SERVICE_NAME]: otelServiceName || appConfig.clientConfig.name,
    [ATTR_SERVICE_VERSION]: appConfig.clientConfig.version,
  }))
  
  if(otelUrl === 'console') {
    const sdk = new NodeSDK({
      resource,
      traceExporter: new ConsoleSpanExporter(),
      metricReader: new PeriodicExportingMetricReader({
        exporter: new ConsoleMetricExporter(),
      }),
      instrumentations: [getNodeAutoInstrumentations()],
    })
    const loggerProvider = new LoggerProvider({
      resource,
      processors: [
        new SimpleLogRecordProcessor(new ConsoleLogRecordExporter())
      ]
    })
    logs.setGlobalLoggerProvider(loggerProvider)
    await sdk.start()

    console.log('OpenTelemetry console setup complete')
    return
  }

  
  const address = otelUrl
  const headers = Object.fromEntries(otelHeaders.split(';').map(item => [
    item.slice(0, item.indexOf('=')),
    item.slice(item.indexOf('=') + 1)
  ])) // parse headers

  console.log("OpenTelemetry setup with URL", address, 'and headers', headers)

  const sdk = new NodeSDK({
    resource,
    traceExporter: new OTLPTraceExporter({
      url: address + '/v1/traces',
      headers,
    }),
    metricReader: new PeriodicExportingMetricReader({
      exporter: new OTLPMetricExporter({
        url: address + '/v1/metrics',
        headers,
        concurrencyLimit: 1
      }),
    }),
  
    instrumentations: [getNodeAutoInstrumentations()],
  })    
  const loggerProvider = new LoggerProvider({
    resource,
    processors: [
      new BatchLogRecordProcessor(new OTLPLogExporter({
        url: address + '/v1/logs',
        headers, // an optional object containing custom headers to be sent with each request
        concurrencyLimit: 1, // an optional limit on pending requests
      }))
    ]
  })
  logs.setGlobalLoggerProvider(loggerProvider)
  await sdk.start()

  console.log("OpenTelemetry setup complete")
}