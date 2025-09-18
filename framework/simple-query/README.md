# Simple query

Library for creating complex live-change db queries and associated indexes with simple DSL

## Example

```ts
import { User, Channel, Message, UserIdentification } from "./models.js"
import simpleQuery from "@live-change/simple-query"
const query = simpleQuery(definition) // use service definition

const channelMessagesWithUsersAndIdentificationByTime = query({ // definition
  name: 'channelMessagesWithUsersAndIdentificationByTime',
  properties: {
    channel: {
      type: Channel,
      validation: ['nonEmpty']
    },
    ...App.rangeProperties // Range of fetched data
  },
  sources: {
    user: User, // read from model
    message: Message,
    identification: UserIdentfication
  },
  id: ({ user, message, identification }) => message.time
  code(props, { user, message, identification }) => {
    const { channel, ...range } = props
    message.time.inside(range)
    message.channel.eqals(channel)
    user.id.equals(message.au thor)
    identification.id.equals(user.id)
  }
})
```

And it will automatically create index Message_by_channel_time and Message_by_user_channel_time for fast fetching messages by channel and time range, and for fetching messages by user and timeRange. It will also create preparedQuery with defined parameters.

```ts
const oldUsers = query({
  properties: {
    expireTime: {
      type: Date,
      validation: ['nonEmpty']
    },
    ...App.rangeProperties
  },
  sources: {
    user: User
  },
  code({ expireTime, ...range }, { user }) => {
    user.createdAt.lessThan(expireTime)
    user.createdAt.inside(range) /// sorting and limiting by it would create inside query, and will be slower
  }
})
```

In this example, it will create index User_by_createdAt, and merge ranges from expireTime and range parameters using range intersection.

## Algorithm

Fetching always starts with properties/parameters, algoritm finds index or id based queries that can be feed with those parameters. For every found object it runs rangeQuery to find objects associated with it, for every found object it runs next range queries and so on. In observation mode there will be additional reverse queries run on dependent object updates, to find current state on associated objects.

For the first example ```channelMessagesWithUsersAndIdentificationByTime``` it works as follows:

1. Find and observe all messages that match channel and range using Message_by_channel_time index.
2. For every found message get and observe User and UserIdentity objects using id.
3. Return initial results as array of { id: time, user, identification }
4. If any messages changes, enters or leaves selected range, change User and UserIdentification observations if needed, and update results.
5. If any user od useridentification changes update results.
