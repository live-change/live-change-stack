import type { Page } from 'playwright'

export function e2eStep(scope: string, step: string, detail?: Record<string, unknown>): void {
  const ts = new Date().toISOString()
  const extra = detail && Object.keys(detail).length > 0 ? ` ${JSON.stringify(detail)}` : ''
  console.error(`[e2e:${scope}] ${ts} ${step}${extra}`)
}

export async function logInputSnapshot(
  page: Page,
  scope: string,
  label: string,
  selector: string
): Promise<void> {
  let count = 0
  try {
    count = await page.locator(selector).count()
  } catch (e) {
    e2eStep(scope, 'logInputSnapshot:locator-count-failed', {
      label,
      selector,
      error: e instanceof Error ? e.message : String(e),
      pageUrl: page.url()
    })
    return
  }

  const base: Record<string, unknown> = {
    label,
    selector,
    count,
    pageUrl: page.url(),
    pageTitle: await page.title().catch(() => '')
  }

  if(count === 0) {
    e2eStep(scope, 'input-state', base)
    return
  }

  const loc = page.locator(selector).first()
  const inputInfo: Record<string, unknown> = {
    ...base,
    visible: await loc.isVisible().catch(() => false),
    enabled: await loc.isEnabled().catch(() => false),
    editable: await loc.evaluate((el: HTMLInputElement) => !(el.disabled || el.readOnly)).catch(() => false),
    valueLength: (await loc.inputValue().catch(() => '')).length,
    placeholder: await loc.getAttribute('placeholder').catch(() => null)
  }

  e2eStep(scope, 'input-state', inputInfo)
}
