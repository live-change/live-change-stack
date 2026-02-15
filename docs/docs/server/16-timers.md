---
title: Timers
---

# Timers

The **timer service** (`@live-change/timer-service`) runs a callback at a given time (one-shot or repeating). You call **triggerService({ service: 'timer', type: 'createTimer' }, { timer: { ... } })** to schedule and **cancelTimer** / **cancelTimerIfExists** to cancel. No need to add timer to your service **use**; it is a standalone service you call via triggerService.

## createTimer

Invoke via trigger (e.g. from your trigger or action):

```javascript
await triggerService({ service: 'timer', type: 'createTimer' }, {
  timer: {
    id: optionalId,           // optional; generated if omitted
    timestamp: number,       // Unix ms (use this or time)
    time: Date,              // or Date object
    service: 'yourService',  // service that will receive the trigger
    trigger: {
      type: 'yourTriggerName',
      data: { event: eventId }
    },
    loops: 0,                // 0 = one-shot, >0 = repeat
    interval: 0,             // ms between repeats (required if loops > 0)
    maxRetries: 0,
    retryDelay: 5000
  }
})
```

The timer service stores the timer and, at the given time, runs **triggerService({ ...timer.trigger, service: timer.service }, timer.trigger.data)** (or **app.trigger** if no service). Returns **timerId**.

## cancelTimer / cancelTimerIfExists

```javascript
await triggerService({ service: 'timer', type: 'cancelTimer' }, { timer: timerId })
await triggerService({ service: 'timer', type: 'cancelTimerIfExists' }, { timer: timerId })
```

**cancelTimer** throws if the timer does not exist; **cancelTimerIfExists** returns false and does not throw.

## Example: schedule event start (speed-dating)

```javascript
// Source: speed-dating/server/speed-dating-service/event.js

definition.trigger({
  name: `changeSpeedDating_Event`,
  ...
  async execute({ object: eventId, data, oldData }, { client, service, triggerService }, emit) {
    const startTime = data?.startTime
    const autoStart = data?.autoStart
    if(!startTime || !autoStart) {
      await triggerService({ service: 'timer', type: 'cancelTimerIfExists' }, { timer: eventId + '_start' })
      return
    }
    const timer = eventId + '_start'
    await triggerService({ service: 'timer', type: 'cancelTimerIfExists' }, { timer })
    await triggerService({ service: 'timer', type: 'createTimer' }, {
      timer: {
        id: timer,
        timestamp: new Date(startTime).getTime(),
        time: new Date(startTime),
        service: 'speedDating',
        trigger: {
          type: 'startSpeedDatingEvent',
          data: { event: eventId }
        }
      }
    })
  }
})
```

When the timer fires, the timer service calls **triggerService({ type: 'startSpeedDatingEvent', service: 'speedDating' }, { event: eventId })**, which your **startSpeedDatingEvent** trigger handles.

## Loops and interval

- **loops: 0** — Fire once.
- **loops > 0** and **interval** (ms) — Repeating; after each fire the next run is at **timestamp + interval** until loops are exhausted. The service emits **timerFired** and updates the stored timer; when loops reach 0 it emits **timerFinished** and removes the timer.

## Failure and retries

If the trigger call fails, the timer service can retry: **maxRetries** and **retryDelay** (ms). After **timerFailed** it reschedules at **now + retryDelay**; after max retries it emits **timerFinished** with error and removes the timer.
