export function shouldExposeTool(manifest, serviceName, toolName, definitionName) {
  const config = manifest || {}
  if (config.excludeTools?.includes(toolName)) return false
  if (config.excludeTools?.includes(definitionName)) return false

  if (config.includeTools?.length) {
    return config.includeTools.includes(toolName)
      || config.includeTools.includes(definitionName)
      || config.includeTools.includes(serviceName + '_' + definitionName)
  }

  if (config.includeServices?.length) {
    return config.includeServices.includes(serviceName)
  }

  return false
}
